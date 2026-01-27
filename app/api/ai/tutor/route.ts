/**
 * AI Tutor API Route
 *
 * Handles AI tutoring requests using Claude API with streaming support.
 * Validates responses, manages context, and implements rate limiting.
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

// System prompt for the AI tutor
const SYSTEM_PROMPTS = {
  socratic: `You are a skilled PreCalculus tutor using the Socratic method. Your goal is to guide students to discover solutions themselves through thoughtful questions.

Core Principles:
- Never give direct answers - ask leading questions
- Build on student's current understanding
- Help students identify misconceptions
- Encourage critical thinking and pattern recognition
- Validate correct reasoning, redirect incorrect thinking
- Reference notation tables and mathematical definitions when relevant

When providing mathematical content:
- Use proper LaTeX notation wrapped in $ or $$
- Cite relevant mathematical properties, theorems, or formulas
- Highlight common mistakes students should avoid
- Break complex problems into manageable steps`,

  explanation: `You are an expert PreCalculus tutor providing clear, detailed explanations. Your goal is to teach concepts thoroughly while building understanding.

Core Principles:
- Provide step-by-step explanations with clear reasoning
- Use proper mathematical notation and terminology
- Explain the "why" behind each step
- Connect to broader mathematical concepts
- Highlight common pitfalls and misconceptions
- Include examples to reinforce learning

When providing mathematical content:
- Use proper LaTeX notation wrapped in $ or $$
- Cite relevant mathematical properties, theorems, or formulas
- Show all intermediate steps clearly
- Explain intuition behind mathematical operations`,
};

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
 */
function extractLatex(content: string): string[] {
  const latexPatterns = [
    /\$\$([^$]+)\$\$/g, // Display math
    /\$([^$]+)\$/g, // Inline math
  ];

  const latex: string[] = [];
  for (const pattern of latexPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        latex.push(match[1].trim());
      }
    }
  }

  return [...new Set(latex)]; // Remove duplicates
}

/**
 * Extract citations from AI response (basic implementation)
 */
function extractCitations(content: string): Citation[] {
  const citations: Citation[] = [];

  // Look for references to mathematical concepts
  const theoremPattern = /\b(theorem|formula|identity|property|rule|law):\s*([^.]+)/gi;
  const matches = content.matchAll(theoremPattern);

  for (const match of matches) {
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

    // 4. Prepare messages for Claude API
    const systemPrompt = SYSTEM_PROMPTS[validatedData.mode];
    const userMessage = contextString
      ? `${contextString}\n\nStudent's Question: ${validatedData.message}`
      : validatedData.message;

    // 5. Call Claude API
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

    // 6. Extract LaTeX and citations
    const latex = extractLatex(assistantResponse);
    const citations = extractCitations(assistantResponse);

    // 7. Validate LaTeX expressions
    for (const latexExpr of latex) {
      const validation = LatexValidator.validate(latexExpr);
      if (!validation.valid) {
        console.warn(`Invalid LaTeX in AI response: ${latexExpr}`, validation.errors);
        // Continue anyway but log the issue
      }
    }

    // 8. Validate AI response quality
    const validation = await AIResponseValidator.validate({
      content: assistantResponse,
      latex,
      citations,
    });

    // Log validation issues
    if (!validation.valid || validation.requiresHumanReview) {
      console.warn("AI Response Validation Issues:", {
        valid: validation.valid,
        requiresHumanReview: validation.requiresHumanReview,
        errors: validation.errors,
        warnings: validation.warnings,
        confidence: validation.confidence,
        riskLevel: validation.riskLevel,
      });
    }

    // 9. Return response
    return NextResponse.json(
      {
        data: {
          content: assistantResponse,
          latex,
          citations,
          validation: {
            confidence: validation.confidence,
            riskLevel: validation.riskLevel,
            warnings: validation.warnings,
          },
        },
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
