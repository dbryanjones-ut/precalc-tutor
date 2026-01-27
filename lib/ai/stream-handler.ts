/**
 * AI Stream Handler
 *
 * Handles streaming responses from Claude API with:
 * - Real-time LaTeX parsing
 * - Citation extraction
 * - Progressive validation
 * - Error recovery
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, Citation } from "@/types/ai-session";
import { AIResponseValidator } from "./response-validator";
import { EnhancedResponseValidator } from "./response-validator-enhanced";

interface StreamChunk {
  content: string;
  isComplete: boolean;
  latex?: string[];
  citations?: Citation[];
}

interface StreamHandlerOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: (response: ParsedResponse) => void;
  onError?: (error: Error) => void;
  validateRealTime?: boolean;
  extractCitations?: boolean;
}

interface ParsedResponse {
  content: string;
  latex: string[];
  citations: Citation[];
  metadata: {
    tokensUsed?: number;
    processingTime: number;
    validationPassed: boolean;
  };
}

/**
 * Stream Handler for Claude API responses
 */
export class StreamHandler {
  private buffer: string = "";
  private latex: string[] = [];
  private citations: Citation[] = [];
  private startTime: number = 0;
  private validateRealTime: boolean = false;
  private extractCitations: boolean = true;

  constructor(private options: StreamHandlerOptions = {}) {
    this.validateRealTime = options.validateRealTime ?? false;
    this.extractCitations = options.extractCitations ?? true;
  }

  /**
   * Handle stream from Claude API
   */
  async handleStream(
    stream: AsyncIterable<Anthropic.Messages.MessageStreamEvent>
  ): Promise<ParsedResponse> {
    this.startTime = Date.now();
    this.buffer = "";
    this.latex = [];
    this.citations = [];

    try {
      for await (const event of stream) {
        await this.processEvent(event);
      }

      // Final processing
      const response = await this.finalize();

      this.options.onComplete?.(response);

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.options.onError?.(err);
      throw err;
    }
  }

  /**
   * Process individual stream event
   */
  private async processEvent(
    event: Anthropic.Messages.MessageStreamEvent
  ): Promise<void> {
    switch (event.type) {
      case "content_block_delta":
        if (event.delta.type === "text_delta") {
          await this.handleTextDelta(event.delta.text);
        }
        break;

      case "message_delta":
        // Handle message-level updates
        break;

      case "message_stop":
        // Stream complete
        break;

      default:
        // Handle other event types
        break;
    }
  }

  /**
   * Handle incoming text delta
   */
  private async handleTextDelta(text: string): Promise<void> {
    this.buffer += text;

    // Extract LaTeX in real-time
    this.extractLatexFromBuffer();

    // Extract citations in real-time
    if (this.extractCitations) {
      this.extractCitationsFromBuffer();
    }

    // Send chunk update
    this.options.onChunk?.({
      content: this.buffer,
      isComplete: false,
      latex: [...this.latex],
      citations: [...this.citations],
    });

    // Real-time validation (optional, can be expensive)
    if (this.validateRealTime && this.buffer.length % 500 === 0) {
      await this.performProgressiveValidation();
    }
  }

  /**
   * Extract LaTeX expressions from buffer
   */
  private extractLatexFromBuffer(): void {
    // Pattern for inline LaTeX: \( ... \)
    const inlinePattern = /\\$$[^)]+\\$$/g;
    let match;

    while ((match = inlinePattern.exec(this.buffer)) !== null) {
      const latexExpr = match[0];
      if (!this.latex.includes(latexExpr)) {
        this.latex.push(latexExpr);
      }
    }

    // Pattern for display LaTeX: \[ ... \]
    const displayPattern = /\\\[[^\]]+\\\]/g;

    while ((match = displayPattern.exec(this.buffer)) !== null) {
      const latexExpr = match[0];
      if (!this.latex.includes(latexExpr)) {
        this.latex.push(latexExpr);
      }
    }

    // Pattern for inline $...$ (if used)
    const dollarPattern = /\$[^$]+\$/g;

    while ((match = dollarPattern.exec(this.buffer)) !== null) {
      const latexExpr = match[0];
      if (!this.latex.includes(latexExpr)) {
        this.latex.push(latexExpr);
      }
    }

    // Pattern for display $$...$$ (if used)
    const doubleDollarPattern = /\$\$[^$]+\$\$/g;

    while ((match = doubleDollarPattern.exec(this.buffer)) !== null) {
      const latexExpr = match[0];
      if (!this.latex.includes(latexExpr)) {
        this.latex.push(latexExpr);
      }
    }
  }

  /**
   * Extract citations from buffer
   */
  private extractCitationsFromBuffer(): void {
    // Pattern: [Notation: id]
    const notationPattern = /\[Notation:\s*([^\]]+)\]/g;
    let match;

    while ((match = notationPattern.exec(this.buffer)) !== null) {
      const id = match[1].trim();

      // Check if not already added
      if (!this.citations.find((c) => c.type === "notation" && c.title === id)) {
        this.citations.push({
          type: "notation",
          title: id,
          content: `Notation reference: ${id}`,
        });
      }
    }

    // Pattern: [Term: term-name]
    const termPattern = /\[Term:\s*([^\]]+)\]/g;

    while ((match = termPattern.exec(this.buffer)) !== null) {
      const term = match[1].trim();

      if (!this.citations.find((c) => c.type === "golden-word" && c.title === term)) {
        this.citations.push({
          type: "golden-word",
          title: term,
          content: `Term reference: ${term}`,
        });
      }
    }

    // Pattern: [Common Mistake: id]
    const mistakePattern = /\[Common Mistake:\s*([^\]]+)\]/g;

    while ((match = mistakePattern.exec(this.buffer)) !== null) {
      const id = match[1].trim();

      if (!this.citations.find((c) => c.type === "common-mistake" && c.title === id)) {
        this.citations.push({
          type: "common-mistake",
          title: id,
          content: `Common mistake reference: ${id}`,
        });
      }
    }

    // Pattern: [Reference: description]
    const refPattern = /\[Reference:\s*([^\]]+)\]/g;

    while ((match = refPattern.exec(this.buffer)) !== null) {
      const ref = match[1].trim();

      if (!this.citations.find((c) => c.type === "reference" && c.title === ref)) {
        this.citations.push({
          type: "reference",
          title: ref,
          content: ref,
        });
      }
    }
  }

  /**
   * Perform progressive validation (during streaming)
   */
  private async performProgressiveValidation(): Promise<void> {
    // Quick checks only - full validation happens at end
    const quickValidation = await AIResponseValidator.quickValidate(
      this.buffer,
      this.latex
    );

    if (!quickValidation) {
      console.warn("Progressive validation detected potential issues");
    }
  }

  /**
   * Finalize and validate complete response
   */
  private async finalize(): Promise<ParsedResponse> {
    const processingTime = Date.now() - this.startTime;

    // Final LaTeX extraction
    this.extractLatexFromBuffer();

    // Final citation extraction
    if (this.extractCitations) {
      this.extractCitationsFromBuffer();
      await this.enrichCitations();
    }

    // Full validation
    const validation = await EnhancedResponseValidator.validateWithFactChecking({
      content: this.buffer,
      latex: this.latex,
      citations: this.citations,
    });

    const validationPassed = validation.baseValidation.valid &&
      !validation.baseValidation.requiresHumanReview &&
      validation.recommendAction !== "reject";

    if (!validationPassed) {
      console.warn("Response validation issues detected:", {
        errors: validation.baseValidation.errors,
        warnings: validation.baseValidation.warnings,
        trustScore: validation.overallTrustScore,
        recommendation: validation.recommendAction,
      });
    }

    return {
      content: this.buffer,
      latex: this.latex,
      citations: this.citations,
      metadata: {
        processingTime,
        validationPassed,
      },
    };
  }

  /**
   * Enrich citations with full data from reference materials
   */
  private async enrichCitations(): Promise<void> {
    const enrichedCitations: Citation[] = [];

    for (const citation of this.citations) {
      if (citation.type === "notation") {
        try {
          const response = await fetch("/data/reference/notation-table.json");
          const data = await response.json();
          const entry = data.notations?.find((n: any) => n.id === citation.title);

          if (entry) {
            enrichedCitations.push({
              ...citation,
              content: entry.meaning,
              link: `/reference/notation/${entry.id}`,
            });
          } else {
            enrichedCitations.push(citation);
          }
        } catch (error) {
          console.error("Error enriching notation citation:", error);
          enrichedCitations.push(citation);
        }
      } else if (citation.type === "golden-word") {
        try {
          const response = await fetch("/data/reference/golden-words.json");
          const data = await response.json();

          // Search all categories
          let found = false;
          for (const [category, catData] of Object.entries(data.categories || {})) {
            const terms = (catData as any).terms || [];
            const entry = terms.find((t: any) =>
              t.term.toLowerCase() === citation.title.toLowerCase()
            );

            if (entry) {
              enrichedCitations.push({
                ...citation,
                content: entry.context || entry.term,
                link: `/reference/golden-words/${category}#${citation.title}`,
              });
              found = true;
              break;
            }
          }

          if (!found) {
            enrichedCitations.push(citation);
          }
        } catch (error) {
          console.error("Error enriching golden word citation:", error);
          enrichedCitations.push(citation);
        }
      } else {
        enrichedCitations.push(citation);
      }
    }

    this.citations = enrichedCitations;
  }

  /**
   * Clean LaTeX for rendering
   */
  static cleanLatex(latex: string): string {
    // Remove wrapper delimiters for processing
    let cleaned = latex;

    // Remove \( ... \) wrappers
    if (cleaned.startsWith("\\(") && cleaned.endsWith("\\)")) {
      cleaned = cleaned.slice(2, -2);
    }

    // Remove \[ ... \] wrappers
    if (cleaned.startsWith("\\[") && cleaned.endsWith("\\]")) {
      cleaned = cleaned.slice(2, -2);
    }

    // Remove $ ... $ wrappers
    if (cleaned.startsWith("$") && cleaned.endsWith("$") && cleaned.length > 2) {
      if (cleaned.startsWith("$$")) {
        cleaned = cleaned.slice(2, -2);
      } else {
        cleaned = cleaned.slice(1, -1);
      }
    }

    return cleaned.trim();
  }

  /**
   * Parse complete response from text
   */
  static parseResponse(text: string): ParsedResponse {
    const handler = new StreamHandler();
    handler.buffer = text;
    handler.startTime = Date.now();

    handler.extractLatexFromBuffer();
    handler.extractCitationsFromBuffer();

    return {
      content: text,
      latex: handler.latex,
      citations: handler.citations,
      metadata: {
        processingTime: Date.now() - handler.startTime,
        validationPassed: true, // Assume passed if parsing manually
      },
    };
  }

  /**
   * Convert response to ChatMessage format
   */
  static toMessage(response: ParsedResponse): ChatMessage {
    return {
      role: "assistant",
      content: response.content,
      timestamp: new Date().toISOString(),
      latex: response.latex,
      citations: response.citations,
      metadata: {
        referenceType: "formula",
      },
    };
  }
}

/**
 * Error recovery utilities
 */
export class StreamErrorRecovery {
  /**
   * Attempt to recover from stream error
   */
  static async recoverFromError(
    error: Error,
    partialResponse?: string
  ): Promise<{ recovered: boolean; message?: string }> {
    // Check if error is recoverable
    if (error.message.includes("timeout")) {
      return {
        recovered: false,
        message: "Request timed out. Please try again.",
      };
    }

    if (error.message.includes("rate limit")) {
      return {
        recovered: false,
        message: "Rate limit exceeded. Please wait a moment and try again.",
      };
    }

    if (error.message.includes("context length")) {
      return {
        recovered: false,
        message: "Message too long. Please shorten your question.",
      };
    }

    // If we have partial response, try to validate it
    if (partialResponse && partialResponse.length > 100) {
      const validation = await AIResponseValidator.quickValidate(partialResponse);

      if (validation) {
        return {
          recovered: true,
          message: "Partial response is valid. Using available content.",
        };
      }
    }

    return {
      recovered: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }

  /**
   * Generate fallback response
   */
  static generateFallbackResponse(context: string): ChatMessage {
    return {
      role: "assistant",
      content: `I apologize, but I encountered an issue processing your question.

To help you effectively, could you please:
1. Rephrase your question more specifically
2. Break down complex questions into smaller parts
3. Check if your LaTeX notation is correct

I'm here to help once we clarify the question!`,
      timestamp: new Date().toISOString(),
      latex: [],
      citations: [],
      metadata: {
        referenceType: "formula",
      },
    };
  }
}
