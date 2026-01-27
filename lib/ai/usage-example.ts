/**
 * AI System Usage Examples
 *
 * Complete examples showing how to use the AI validation and
 * prompt engineering system in production.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  generateTutorPrompt,
  ContextBuilder,
  StreamHandler,
  EnhancedResponseValidator,
  AIResponseValidator,
} from "./index";
import type { TutoringMode, ChatMessage } from "@/types/ai-session";

/**
 * Example 1: Basic Socratic Tutoring Session
 */
export async function basicSocraticSession(
  studentQuestion: string,
  conversationHistory: ChatMessage[]
): Promise<ChatMessage> {
  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  // Build context with reference materials
  const context = await ContextBuilder.buildContext(
    studentQuestion,
    conversationHistory,
    { maxTokens: 3000 }
  );

  // Generate prompt
  const prompt = generateTutorPrompt({
    mode: "socratic",
    problemContext: studentQuestion,
    referenceMaterials: {
      notation: context.notation,
      goldenWords: context.goldenWords,
      commonMistakes: context.commonMistakes,
    },
  });

  // Build message history
  const messages: Anthropic.Messages.MessageParam[] = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: "user",
      content: studentQuestion,
    },
  ];

  // Call Claude API with streaming
  const stream = await anthropic.messages.stream({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    temperature: 0.3, // Lower for math
    system: prompt.systemPrompt,
    messages,
  });

  // Handle stream with real-time validation
  const handler = new StreamHandler({
    onChunk: (chunk) => {
      // Update UI in real-time
      console.log("Streaming:", chunk.content.slice(-50));
    },
    validateRealTime: false, // Validate at end for performance
    extractCitations: true,
  });

  const response = await handler.handleStream(stream);

  // Validate response
  const validation = await EnhancedResponseValidator.validateWithFactChecking({
    content: response.content,
    latex: response.latex,
    citations: response.citations,
  });

  // Check if response is acceptable
  if (validation.recommendAction === "reject") {
    console.error("Response failed validation:", validation.overallTrustScore);
    throw new Error("AI response failed validation checks");
  }

  if (validation.recommendAction === "review") {
    console.warn("Response requires human review:", {
      trustScore: validation.overallTrustScore,
      warnings: validation.baseValidation.warnings,
    });
    // Flag for human review but still show to student
  }

  // Convert to ChatMessage
  return StreamHandler.toMessage(response);
}

/**
 * Example 2: Detailed Explanation Mode
 */
export async function explanationSession(
  problemText: string,
  conversationHistory: ChatMessage[] = []
): Promise<{
  message: ChatMessage;
  validationReport: string;
  trustScore: number;
}> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  // Build comprehensive context
  const context = await ContextBuilder.buildContext(
    problemText,
    conversationHistory,
    {
      maxTokens: 4000,
      includeAllMistakes: true, // Include all for detailed explanations
    }
  );

  // Generate explanation prompt with examples
  const prompt = generateTutorPrompt({
    mode: "explanation",
    problemContext: problemText,
    referenceMaterials: {
      notation: context.notation,
      goldenWords: context.goldenWords,
      commonMistakes: context.commonMistakes,
    },
  });

  // Call API
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    temperature: 0.2,
    system: prompt.systemPrompt,
    messages: [
      {
        role: "user",
        content: problemText,
      },
    ],
  });

  // Extract content
  const content =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse response
  const parsed = StreamHandler.parseResponse(content);

  // Enhanced validation
  const validation = await EnhancedResponseValidator.validateWithFactChecking({
    content: parsed.content,
    latex: parsed.latex,
    citations: parsed.citations,
  });

  // Generate report
  const report = EnhancedResponseValidator.generateValidationReport(validation);

  // Log if issues found
  if (validation.overallTrustScore < 80) {
    console.warn("Low trust score response:", {
      trustScore: validation.overallTrustScore,
      recommendation: validation.recommendAction,
    });
    console.log("Full report:", report);
  }

  return {
    message: StreamHandler.toMessage(parsed),
    validationReport: report,
    trustScore: validation.overallTrustScore,
  };
}

/**
 * Example 3: Step-by-Step Solution Verification
 */
export async function verifySolutionSteps(
  steps: Array<{ from: string; to: string; reason: string }>
): Promise<{
  valid: boolean;
  invalidSteps: number[];
  details: string;
}> {
  const verification = AIResponseValidator.verifySteps(steps);

  let details = "Step Verification Report\n\n";

  steps.forEach((step, index) => {
    const stepDetail = verification.details[index];
    const status = verification.invalidSteps.includes(index) ? "✗" : "✓";

    details += `Step ${index + 1}: ${status}\n`;
    details += `  From: ${step.from}\n`;
    details += `  To: ${step.to}\n`;
    details += `  Reason: ${step.reason}\n`;
    details += `  Confidence: ${(stepDetail.confidence * 100).toFixed(1)}%\n`;

    if (stepDetail.error) {
      details += `  ⚠ Error: ${stepDetail.error}\n`;
    }

    details += "\n";
  });

  return {
    valid: verification.valid,
    invalidSteps: verification.invalidSteps,
    details,
  };
}

/**
 * Example 4: Real-time Streaming with UI Updates
 */
export async function streamingWithUIUpdates(
  question: string,
  updateUI: (content: string, latex: string[], citations: any[]) => void
): Promise<ChatMessage> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  // Build context quickly for streaming
  const context = await ContextBuilder.buildContext(question, [], {
    maxTokens: 2000,
  });

  const prompt = generateTutorPrompt({
    mode: "socratic",
    problemContext: question,
    referenceMaterials: {
      notation: context.notation,
      goldenWords: context.goldenWords,
      commonMistakes: context.commonMistakes,
    },
  });

  const stream = await anthropic.messages.stream({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    temperature: 0.3,
    system: prompt.systemPrompt,
    messages: [{ role: "user", content: question }],
  });

  const handler = new StreamHandler({
    onChunk: (chunk) => {
      // Update UI with each chunk
      updateUI(chunk.content, chunk.latex || [], chunk.citations || []);
    },
    onComplete: (response) => {
      console.log("Streaming complete:", {
        totalLatex: response.latex.length,
        totalCitations: response.citations.length,
        validationPassed: response.metadata.validationPassed,
      });
    },
    onError: (error) => {
      console.error("Streaming error:", error);
      // Show error to user
      updateUI(
        "I encountered an error. Please try rephrasing your question.",
        [],
        []
      );
    },
  });

  const response = await handler.handleStream(stream);
  return StreamHandler.toMessage(response);
}

/**
 * Example 5: Batch Validation for Multiple Responses
 */
export async function batchValidateResponses(
  responses: Array<{ content: string; latex?: string[]; citations?: any[] }>
): Promise<
  Array<{
    index: number;
    trustScore: number;
    recommendation: string;
    issues: string[];
  }>
> {
  const results = [];

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];

    const validation =
      await EnhancedResponseValidator.validateWithFactChecking(response);

    results.push({
      index: i,
      trustScore: validation.overallTrustScore,
      recommendation: validation.recommendAction,
      issues: [
        ...validation.baseValidation.errors,
        ...validation.baseValidation.warnings,
      ],
    });
  }

  // Sort by trust score
  results.sort((a, b) => a.trustScore - b.trustScore);

  return results;
}

/**
 * Example 6: Error Recovery
 */
export async function sessionWithErrorRecovery(
  question: string
): Promise<ChatMessage> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  try {
    const context = await ContextBuilder.buildContext(question, []);
    const prompt = generateTutorPrompt({
      mode: "explanation",
      problemContext: question,
      referenceMaterials: context,
    });

    const stream = await anthropic.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: prompt.systemPrompt,
      messages: [{ role: "user", content: question }],
    });

    const handler = new StreamHandler();
    const response = await handler.handleStream(stream);

    return StreamHandler.toMessage(response);
  } catch (error) {
    console.error("Session error:", error);

    // Attempt recovery
    const recovery = await import("./stream-handler").then((m) =>
      m.StreamErrorRecovery.recoverFromError(
        error as Error,
        undefined // No partial response in this example
      )
    );

    if (recovery.recovered) {
      console.log("Recovered from error:", recovery.message);
      // Retry or use partial response
    }

    // Return fallback response
    return import("./stream-handler").then((m) =>
      m.StreamErrorRecovery.generateFallbackResponse(question)
    );
  }
}

/**
 * Example 7: Citation-Rich Response
 */
export async function citationRichExplanation(
  topic: string
): Promise<{ message: ChatMessage; citationDetails: any[] }> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  // Build extensive context with all relevant materials
  const context = await ContextBuilder.buildContext(
    `Explain the concept of ${topic} with detailed examples and citations`,
    [],
    {
      maxTokens: 5000,
      includeAllMistakes: true,
    }
  );

  const prompt = generateTutorPrompt({
    mode: "explanation",
    problemContext: `Provide a comprehensive explanation of ${topic}. Include:
    1. Formal definition with citation
    2. Intuitive explanation
    3. Multiple examples with step-by-step solutions
    4. Common mistakes to avoid with citations
    5. Connection to other concepts`,
    referenceMaterials: {
      notation: context.notation,
      goldenWords: context.goldenWords,
      commonMistakes: context.commonMistakes,
    },
  });

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    temperature: 0.2,
    system: prompt.systemPrompt,
    messages: [
      {
        role: "user",
        content: `Explain ${topic}`,
      },
    ],
  });

  const content =
    message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = StreamHandler.parseResponse(content);

  // Enrich citations with full details
  const citationDetails = await Promise.all(
    parsed.citations.map(async (citation) => {
      if (citation.type === "notation") {
        return await ContextBuilder.getNotation(citation.title);
      } else if (citation.type === "golden-word") {
        return await ContextBuilder.getGoldenWord(citation.title);
      } else if (citation.type === "common-mistake") {
        return await ContextBuilder.getCommonMistake(citation.title);
      }
      return null;
    })
  );

  return {
    message: StreamHandler.toMessage(parsed),
    citationDetails: citationDetails.filter((c) => c !== null),
  };
}

/**
 * Example 8: Multi-turn Conversation with Context Building
 */
export async function multiTurnConversation(
  messages: ChatMessage[],
  newQuestion: string
): Promise<ChatMessage> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  // Build context from entire conversation
  const fullContext = messages.map((m) => m.content).join("\n") + "\n" + newQuestion;

  const context = await ContextBuilder.buildContext(fullContext, messages, {
    maxTokens: 3000,
    prioritizeRecent: true,
  });

  const prompt = generateTutorPrompt({
    mode: "socratic",
    problemContext: newQuestion,
    referenceMaterials: context,
  });

  // Convert history to Anthropic format
  const apiMessages: Anthropic.Messages.MessageParam[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  apiMessages.push({
    role: "user",
    content: newQuestion,
  });

  const stream = await anthropic.messages.stream({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    temperature: 0.3,
    system: prompt.systemPrompt,
    messages: apiMessages,
  });

  const handler = new StreamHandler();
  const response = await handler.handleStream(stream);

  // Validate consistency with previous messages
  const validation = await AIResponseValidator.validateSessionMessage(
    StreamHandler.toMessage(response),
    {
      previousMessages: messages,
      problemContext: newQuestion,
    }
  );

  if (!validation.valid) {
    console.warn("Response inconsistent with conversation history:", {
      warnings: validation.warnings,
      errors: validation.errors,
    });
  }

  return StreamHandler.toMessage(response);
}

/**
 * Utility: Quick validation check
 */
export async function quickValidationCheck(content: string): Promise<boolean> {
  return AIResponseValidator.quickValidate(content);
}

/**
 * Utility: Extract LaTeX from text
 */
export function extractLatex(text: string): string[] {
  const parsed = StreamHandler.parseResponse(text);
  return parsed.latex;
}

/**
 * Utility: Get validation summary
 */
export async function getValidationSummary(
  content: string
): Promise<string> {
  const validation = await AIResponseValidator.validate({ content });
  return AIResponseValidator.getValidationSummary(validation);
}
