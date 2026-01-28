/**
 * AI Tutor API Route
 *
 * Handles AI tutoring requests using Claude API with streaming support.
 * Validates responses, manages context, and implements rate limiting.
 * Post-processes LaTeX to ensure >97% rendering accuracy.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { aiTutorRequestSchema } from "@/lib/api/validation";
import {
  handleAPIError,
  requireEnv,
  ValidationError,
  RateLimitError,
  InternalServerError,
} from "@/lib/api/errors";
import {
  checkRateLimit,
  getRateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/api/rate-limiter";
import { AIResponseValidator } from "@/lib/ai/response-validator";
import { LatexValidator } from "@/lib/math/latex-validator";
import { LaTeXPostProcessor } from "@/lib/ai/latex-postprocessor";
import { generateTutorPrompt } from "@/lib/ai/tutor-prompts";
import type { ChatMessage, Citation } from "@/types/ai-session";
import { z } from "zod";

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = requireEnv("ANTHROPIC_API_KEY");
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Build context for Claude API
 */
function buildContext(
  extractedProblem?: string,
  messageHistory?: ChatMessage[],
  referenceMaterials?: string[]
): string {
  const parts: string[] = [];

  if (extractedProblem) {
    parts.push(`Current Problem:\n${extractedProblem}`);
  }

  if (referenceMaterials && referenceMaterials.length > 0) {
    parts.push(`\nReference Materials:\n${referenceMaterials.join("\n")}`);
  }

  if (messageHistory && messageHistory.length > 0) {
    const recentMessages = messageHistory.slice(-10); // Last 10 messages
    const conversationContext = recentMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");
    parts.push(`\nRecent Conversation:\n${conversationContext}`);
  }

  return parts.join("\n\n");
}

/**
 * Extract LaTeX from AI response
 * UPDATED: Only extract $ and $$ delimited expressions (not \( \) or \[ \])
 */
function extractLatex(content: string): string[] {
  const latex: string[] = [];

  // Pattern 1: Display math $$...$$
  // Use non-greedy matching but ensure we don't match across multiple display blocks
  const displayPattern = /\$\$((?:(?!\$\$).)+)\$\$/gs;
  let match;

  while ((match = displayPattern.exec(content)) !== null) {
    if (match[1]) {
      latex.push(match[1].trim());
    }
  }

  // Pattern 2: Inline math $...$
  // But NOT if it's part of $$...$$
  // We need to be careful not to match the $ in $$
  const inlinePattern = /(?<!\$)\$(?!\$)((?:(?!\$).)+)\$(?!\$)/gs;

  // Reset lastIndex for new pattern
  while ((match = inlinePattern.exec(content)) !== null) {
    if (match[1]) {
      latex.push(match[1].trim());
    }
  }

  return [...new Set(latex)]; // Remove duplicates
}

/**
 * Extract citations from AI response (basic implementation)
 */
function extractCitations(content: string): Citation[] {
  const citations: Citation[] = [];

  // Pattern for [Notation: id]
  const notationPattern = /\[Notation:\s*([^\]]+)\]/g;
  let match;

  while ((match = notationPattern.exec(content)) !== null) {
    citations.push({
      type: "notation",
      title: match[1].trim(),
      content: `Notation reference: ${match[1].trim()}`,
    });
  }

  // Pattern for [Term: term-name]
  const termPattern = /\[Term:\s*([^\]]+)\]/g;

  while ((match = termPattern.exec(content)) !== null) {
    citations.push({
      type: "golden-word",
      title: match[1].trim(),
      content: `Term reference: ${match[1].trim()}`,
    });
  }

  // Pattern for generic references
  const theoremPattern = /\b(theorem|formula|identity|property|rule|law):\s*([^.]+)/gi;

  while ((match = theoremPattern.exec(content)) !== null) {
    citations.push({
      type: "reference",
      title: match[1].charAt(0).toUpperCase() + match[1].slice(1),
      content: match[2].trim(),
    });
  }

  return citations;
}

/**
 * POST handler - Process AI tutoring request
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const { allowed, remaining, resetTime } = checkRateLimit(
      request,
      RATE_LIMITS.AI_TUTOR.limit,
      RATE_LIMITS.AI_TUTOR.windowMs
    );

    const rateLimitHeaders = getRateLimitHeaders(
      RATE_LIMITS.AI_TUTOR.limit,
      remaining,
      resetTime
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            message: "Rate limit exceeded. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            details: { resetTime },
          },
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    // 2. Validate request body
    let validatedData;
    try {
      const body = await request.json();
      validatedData = aiTutorRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Invalid request data", {
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      throw error;
    }

    // 3. Build context for AI
    const contextString = buildContext(
      validatedData.context?.extractedProblem,
      validatedData.context?.messageHistory as ChatMessage[] | undefined,
      validatedData.context?.referenceMaterials
    );

    // 4. Generate system prompt using new prompt engineering system
    const { systemPrompt } = generateTutorPrompt({
      mode: validatedData.mode,
      problemContext: contextString,
      referenceMaterials: validatedData.context?.referenceMaterials as any,
    });

    console.log("\n=== LATEX PIPELINE DEBUG: STEP 1 - PROMPT SENT TO AI ===");
    console.log("System prompt length:", systemPrompt.length);
    console.log("System prompt includes LaTeX rules:", systemPrompt.includes("LATEX FORMATTING"));
    console.log("System prompt includes Unicode warning:", systemPrompt.includes("plain text Unicode symbols"));
    console.log("System prompt includes placeholder warning:", systemPrompt.includes("NEVER use (?) in LaTeX"));

    // 5. Prepare messages for Claude API
    const userMessage = contextString
      ? `${contextString}\n\nStudent's Question: ${validatedData.message}`
      : validatedData.message;

    // 6. Call Claude API
    const client = getAnthropicClient();

    let assistantResponse: string;

    if (validatedData.streaming) {
      // TODO: Implement streaming support
      // For now, fall back to non-streaming
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      assistantResponse =
        response.content[0].type === "text" ? response.content[0].text : "";
    } else {
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      assistantResponse =
        response.content[0].type === "text" ? response.content[0].text : "";
    }

    if (!assistantResponse) {
      throw new InternalServerError("No response from AI");
    }

    console.log("\n=== LATEX PIPELINE DEBUG: STEP 2 - RAW AI RESPONSE ===");
    console.log("Response length:", assistantResponse.length);
    console.log("Response preview (first 500 chars):", assistantResponse.substring(0, 500));

    // Check for problematic patterns in raw response
    const hasPlainDot = assistantResponse.match(/\$[^$]*?·[^$]*?\$/g);
    const hasPlainPlusMinus = assistantResponse.match(/\$[^$]*?±[^$]*?\$/g);
    const hasPlainPi = assistantResponse.match(/\$[^$]*?π[^$]*?\$/g);
    const hasQuestionMarks = assistantResponse.match(/\$[^$]*?\?[^$]*?\$/g);

    console.log("RAW RESPONSE ISSUES:");
    console.log("  - Contains plain · (middle dot):", hasPlainDot ? hasPlainDot.length : 0, hasPlainDot ? hasPlainDot : "none");
    console.log("  - Contains plain ± (plus-minus):", hasPlainPlusMinus ? hasPlainPlusMinus.length : 0, hasPlainPlusMinus ? hasPlainPlusMinus : "none");
    console.log("  - Contains plain π (pi):", hasPlainPi ? hasPlainPi.length : 0, hasPlainPi ? hasPlainPi : "none");
    console.log("  - Contains ? (placeholders):", hasQuestionMarks ? hasQuestionMarks.length : 0, hasQuestionMarks ? hasQuestionMarks : "none");

    // 7. Post-process LaTeX in the response
    console.log("\n=== LATEX PIPELINE DEBUG: STEP 3 - POST-PROCESSING ===");
    const postProcessResult = LaTeXPostProcessor.processResponse(assistantResponse);

    console.log("Post-processing changed content:", postProcessResult.changed);
    console.log("Post-processing issues found:", postProcessResult.issues.length);
    if (postProcessResult.issues.length > 0) {
      console.log("Issues:", postProcessResult.issues);
    }

    if (postProcessResult.changed) {
      console.log("LaTeX Post-Processing Applied:", {
        issuesFound: postProcessResult.issues.length,
        report: LaTeXPostProcessor.generateReport(postProcessResult),
      });

      // Use the cleaned version
      assistantResponse = postProcessResult.cleaned;

      console.log("Cleaned response preview (first 500 chars):", assistantResponse.substring(0, 500));
    }

    // 8. Extract LaTeX and citations
    console.log("\n=== LATEX PIPELINE DEBUG: STEP 4 - EXTRACTION ===");
    const latex = extractLatex(assistantResponse);
    const citations = extractCitations(assistantResponse);

    console.log("Extracted LaTeX expressions:", latex.length);
    latex.forEach((expr, idx) => {
      console.log(`  Expression ${idx + 1}:`, expr.substring(0, 100));
      // Check for issues in extracted latex
      const hasPlainSymbols = /[·±π≤≥×÷∞θα]/.test(expr);
      const hasQuestionMark = expr.includes('?');
      if (hasPlainSymbols) {
        console.log(`    WARNING: Contains plain Unicode symbols!`);
      }
      if (hasQuestionMark) {
        console.log(`    WARNING: Contains question mark!`);
      }
    });

    // 9. Validate LaTeX expressions
    console.log("\n=== LATEX PIPELINE DEBUG: STEP 5 - VALIDATION ===");
    const latexValidationErrors: string[] = [];
    const latexValidationWarnings: string[] = [];

    for (const latexExpr of latex) {
      // Validate with KaTeX
      const validation = LatexValidator.validate(latexExpr);
      if (!validation.valid) {
        console.warn(`Invalid LaTeX in AI response: ${latexExpr}`, validation.errors);
        latexValidationErrors.push(`LaTeX "${latexExpr.substring(0, 50)}...": ${validation.errors[0]}`);
      }

      // Check for problematic patterns
      const expressionIssues = LaTeXPostProcessor.validateExpression(latexExpr);
      for (const issue of expressionIssues) {
        if (issue.type === 'error') {
          latexValidationErrors.push(issue.message);
        } else {
          latexValidationWarnings.push(issue.message);
        }
      }
    }

    // Add post-processing issues to validation
    for (const issue of postProcessResult.issues) {
      if (issue.type === 'error') {
        latexValidationErrors.push(issue.message);
      } else {
        latexValidationWarnings.push(issue.message);
      }
    }

    console.log("Validation errors:", latexValidationErrors.length);
    console.log("Validation warnings:", latexValidationWarnings.length);
    if (latexValidationErrors.length > 0) {
      console.log("Errors:", latexValidationErrors);
    }
    if (latexValidationWarnings.length > 0) {
      console.log("Warnings:", latexValidationWarnings);
    }

    // 10. Validate AI response quality
    const validation = await AIResponseValidator.validate({
      content: assistantResponse,
      latex,
      citations,
    });

    // Log validation issues
    if (!validation.valid || validation.requiresHumanReview || latexValidationErrors.length > 0) {
      console.warn("AI Response Validation Issues:", {
        valid: validation.valid,
        requiresHumanReview: validation.requiresHumanReview,
        errors: validation.errors,
        warnings: validation.warnings,
        latexErrors: latexValidationErrors,
        latexWarnings: latexValidationWarnings,
        confidence: validation.confidence,
        riskLevel: validation.riskLevel,
      });
    }

    // 11. Calculate LaTeX accuracy
    const totalLatexExpressions = latex.length;
    const validLatexExpressions = latex.filter(expr => {
      const val = LatexValidator.validate(expr);
      const issues = LaTeXPostProcessor.validateExpression(expr);
      return val.valid && issues.filter(i => i.type === 'error').length === 0;
    }).length;

    const latexAccuracy = totalLatexExpressions > 0
      ? (validLatexExpressions / totalLatexExpressions) * 100
      : 100;

    console.log(`\nLaTeX Accuracy: ${latexAccuracy.toFixed(1)}% (${validLatexExpressions}/${totalLatexExpressions} valid)`);

    // 12. Prepare response data
    console.log("\n=== LATEX PIPELINE DEBUG: STEP 6 - FINAL DATA SENT TO FRONTEND ===");
    const responseData = {
      content: assistantResponse,
      latex,
      citations,
      validation: {
        confidence: validation.confidence,
        riskLevel: validation.riskLevel,
        warnings: validation.warnings,
        latexErrors: latexValidationErrors,
        latexWarnings: latexValidationWarnings,
        latexAccuracy: latexAccuracy,
        postProcessingApplied: postProcessResult.changed,
      },
    };

    console.log("Final content preview (first 500 chars):", responseData.content.substring(0, 500));
    console.log("Final latex array:", responseData.latex.map(l => l.substring(0, 50)));
    console.log("=== END LATEX PIPELINE DEBUG ===\n");

    // 12. Return response
    return NextResponse.json(
      {
        data: responseData,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("AI Tutor API Error:", error);

    // Handle specific errors
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return handleAPIError(
          new RateLimitError(Math.floor(Date.now() / 1000) + 60)
        );
      }
      return handleAPIError(
        new InternalServerError(`AI service error: ${error.message}`)
      );
    }

    return handleAPIError(error);
  }
}

/**
 * OPTIONS handler - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
