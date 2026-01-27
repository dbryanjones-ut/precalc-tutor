import { LatexValidator } from "@/lib/math/latex-validator";
import { AnswerValidator } from "@/lib/math/answer-validator";
import type { ChatMessage, Citation } from "@/types";

export interface AIResponseValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  latexValidations: Array<{
    latex: string;
    valid: boolean;
    errors?: string[];
  }>;
  requiresHumanReview: boolean;
  confidence: number; // 0-1, overall confidence in response
  riskLevel: "low" | "medium" | "high";
}

export interface MathematicalStep {
  from: string;
  to: string;
  reason: string;
  valid?: boolean;
}

export interface StepVerificationResult {
  valid: boolean;
  invalidSteps: number[];
  details: Array<{
    stepIndex: number;
    error?: string;
    confidence: number;
  }>;
}

/**
 * AI Response Validator - Ensures AI-generated content is mathematically correct
 *
 * This validator is CRITICAL for preventing:
 * 1. AI hallucinations of mathematical facts
 * 2. Incorrect solution steps
 * 3. Invalid LaTeX in AI responses
 * 4. Uncited mathematical claims
 *
 * Used for all AI Tutor responses before showing to students
 */
export class AIResponseValidator {
  // Patterns that often precede hallucinated content
  private static readonly HALLUCINATION_INDICATORS = [
    "as we all know",
    "obviously",
    "clearly",
    "it's common knowledge",
    "everyone knows",
    "it goes without saying",
    "needless to say",
  ];

  // Phrases indicating uncertainty (should be flagged)
  private static readonly UNCERTAINTY_PHRASES = [
    "i think",
    "probably",
    "might be",
    "could be",
    "i'm not sure",
    "perhaps",
    "maybe",
    "possibly",
    "seems like",
    "appears to",
  ];

  // Keywords that indicate mathematical claims requiring citations
  private static readonly MATHEMATICAL_CLAIM_KEYWORDS = [
    "theorem",
    "formula",
    "identity",
    "property",
    "law",
    "rule",
    "always",
    "never",
    "proof",
    "definition",
    "axiom",
    "lemma",
    "corollary",
  ];

  /**
   * Validate complete AI response before showing to user
   */
  static async validate(response: {
    content: string;
    latex?: string[];
    citations?: Citation[];
  }): Promise<AIResponseValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const latexValidations: Array<{
      latex: string;
      valid: boolean;
      errors?: string[];
    }> = [];

    let requiresHumanReview = false;
    let confidence = 1.0;
    let riskLevel: "low" | "medium" | "high" = "low";

    // 1. Validate all LaTeX expressions
    if (response.latex && response.latex.length > 0) {
      for (const latex of response.latex) {
        const validation = LatexValidator.validate(latex);

        latexValidations.push({
          latex,
          valid: validation.valid,
          errors: validation.valid ? undefined : validation.errors,
        });

        if (!validation.valid) {
          errors.push(`Invalid LaTeX: ${latex}`);
          errors.push(...validation.errors);
          confidence *= 0.7; // Reduce confidence
          riskLevel = "high";
        }

        if (validation.warnings.length > 0) {
          warnings.push(...validation.warnings.map((w) => `LaTeX: ${w}`));
          confidence *= 0.95;
        }
      }
    }

    // 2. Check for hallucination indicators
    const contentLower = response.content.toLowerCase();

    for (const indicator of this.HALLUCINATION_INDICATORS) {
      if (contentLower.includes(indicator)) {
        warnings.push(
          `Potential hallucination indicator detected: "${indicator}"`
        );
        requiresHumanReview = true;
        confidence *= 0.8;
        riskLevel = this.escalateRisk(riskLevel, "medium");
      }
    }

    // 3. Check for uncertainty phrases
    for (const phrase of this.UNCERTAINTY_PHRASES) {
      if (contentLower.includes(phrase)) {
        warnings.push(`Uncertain language detected: "${phrase}"`);
        confidence *= 0.9;
        riskLevel = this.escalateRisk(riskLevel, "medium");
      }
    }

    // 4. Check for mathematical claims without citations
    const hasMathematicalClaims =
      this.detectMathematicalClaims(response.content);
    const hasCitations = response.citations && response.citations.length > 0;

    if (hasMathematicalClaims && !hasCitations) {
      warnings.push(
        "Mathematical claims detected without citations - consider adding references"
      );
      confidence *= 0.85;
      riskLevel = this.escalateRisk(riskLevel, "medium");
    }

    // 5. Check for suspiciously short explanations
    if (response.content.length < 50 && hasMathematicalClaims) {
      warnings.push(
        "Response is very short for a mathematical explanation"
      );
      confidence *= 0.9;
    }

    // 6. Check for contradictions in content
    const hasContradictions = this.detectContradictions(response.content);
    if (hasContradictions) {
      errors.push("Potential contradiction detected in explanation");
      requiresHumanReview = true;
      confidence *= 0.6;
      riskLevel = "high";
    }

    // 7. Validate numeric claims in text
    const numericClaims = this.extractNumericClaims(response.content);
    for (const claim of numericClaims) {
      if (!this.validateNumericClaim(claim)) {
        warnings.push(`Suspicious numeric claim: "${claim}"`);
        confidence *= 0.95;
      }
    }

    // 8. Flag if too many warnings accumulated
    if (warnings.length > 3) {
      requiresHumanReview = true;
      riskLevel = this.escalateRisk(riskLevel, "medium");
    }

    // 9. Flag if any critical errors
    if (errors.length > 0) {
      requiresHumanReview = true;
      riskLevel = "high";
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      latexValidations,
      requiresHumanReview,
      confidence: Math.max(0, Math.min(1, confidence)),
      riskLevel,
    };
  }

  /**
   * Verify mathematical steps in AI explanation
   * Ensures each step is mathematically valid
   */
  static verifySteps(steps: MathematicalStep[]): StepVerificationResult {
    const invalidSteps: number[] = [];
    const details: Array<{
      stepIndex: number;
      error?: string;
      confidence: number;
    }> = [];

    steps.forEach((step, index) => {
      try {
        // Validate that 'from' and 'to' are both valid LaTeX
        const fromValidation = LatexValidator.validate(step.from);
        const toValidation = LatexValidator.validate(step.to);

        if (!fromValidation.valid || !toValidation.valid) {
          invalidSteps.push(index);
          details.push({
            stepIndex: index,
            error: "Invalid LaTeX in step",
            confidence: 0.0,
          });
          return;
        }

        // Validate mathematical equivalence
        const result = AnswerValidator.validate(step.from, step.to, {
          tolerance: 1e-6,
        });

        if (!result.isCorrect && result.confidence < 0.95) {
          invalidSteps.push(index);
          details.push({
            stepIndex: index,
            error: `Step not mathematically equivalent: ${result.feedback}`,
            confidence: result.confidence,
          });
        } else {
          details.push({
            stepIndex: index,
            confidence: result.confidence,
          });
        }
      } catch (error) {
        invalidSteps.push(index);
        details.push({
          stepIndex: index,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error verifying step",
          confidence: 0.0,
        });
      }
    });

    return {
      valid: invalidSteps.length === 0,
      invalidSteps,
      details,
    };
  }

  /**
   * Validate a complete tutoring session response
   * Higher-level validation for full conversation turns
   */
  static async validateSessionMessage(
    message: ChatMessage,
    context?: {
      previousMessages?: ChatMessage[];
      problemContext?: string;
    }
  ): Promise<AIResponseValidation> {
    if (message.role !== "assistant") {
      // Only validate assistant messages
      return {
        valid: true,
        errors: [],
        warnings: [],
        latexValidations: [],
        requiresHumanReview: false,
        confidence: 1.0,
        riskLevel: "low",
      };
    }

    // Validate basic response structure
    const validation = await this.validate({
      content: message.content,
      latex: message.latex,
      citations: message.citations,
    });

    // Additional contextual validation
    if (context?.previousMessages && context.previousMessages.length > 0) {
      // Check for consistency with previous messages
      const consistency = this.checkConsistencyWithHistory(
        message,
        context.previousMessages
      );

      if (!consistency.consistent) {
        validation.warnings.push(
          ...consistency.issues.map((i) => `Consistency: ${i}`)
        );
        validation.confidence *= 0.9;
        validation.riskLevel = this.escalateRisk(
          validation.riskLevel,
          "medium"
        );
      }
    }

    return validation;
  }

  /**
   * Detect if content makes mathematical claims
   */
  private static detectMathematicalClaims(content: string): boolean {
    const contentLower = content.toLowerCase();

    return this.MATHEMATICAL_CLAIM_KEYWORDS.some((keyword) =>
      contentLower.includes(keyword)
    );
  }

  /**
   * Detect potential contradictions in text
   */
  private static detectContradictions(content: string): boolean {
    const contentLower = content.toLowerCase();

    // Check for opposing statements in same response
    const contradictionPatterns = [
      { positive: "always", negative: "never" },
      { positive: "correct", negative: "incorrect" },
      { positive: "true", negative: "false" },
      { positive: "increase", negative: "decrease" },
      { positive: "greater", negative: "less" },
    ];

    for (const pattern of contradictionPatterns) {
      if (
        contentLower.includes(pattern.positive) &&
        contentLower.includes(pattern.negative)
      ) {
        // Basic contradiction detection - would need NLP for advanced detection
        return true;
      }
    }

    return false;
  }

  /**
   * Extract numeric claims from text
   */
  private static extractNumericClaims(content: string): string[] {
    const claims: string[] = [];

    // Match patterns like "equals X", "is Y", "approximately Z"
    const patterns = [
      /equals?\s+([0-9.]+)/gi,
      /is\s+([0-9.]+)/gi,
      /approximately\s+([0-9.]+)/gi,
      /about\s+([0-9.]+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[0]) claims.push(match[0]);
      }
    }

    return claims;
  }

  /**
   * Validate numeric claims for reasonableness
   */
  private static validateNumericClaim(claim: string): boolean {
    // Extract number from claim
    const numberMatch = claim.match(/([0-9.]+)/);
    if (!numberMatch) return true;

    const value = parseFloat(numberMatch[1]);

    // Check for unreasonable values
    if (isNaN(value)) return false;
    if (!isFinite(value)) return false;

    // Flag suspiciously precise values (might be hallucinated)
    const decimalPlaces = (numberMatch[1].split(".")[1] || "").length;
    if (decimalPlaces > 10) return false;

    return true;
  }

  /**
   * Check consistency with conversation history
   */
  private static checkConsistencyWithHistory(
    currentMessage: ChatMessage,
    history: ChatMessage[]
  ): { consistent: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if current message contradicts previous assistant messages
    const previousAssistantMessages = history.filter(
      (m) => m.role === "assistant"
    );

    for (const prevMsg of previousAssistantMessages) {
      // Simple keyword-based consistency check
      // In production, would use semantic similarity
      const currentContent = currentMessage.content.toLowerCase();
      const prevContent = prevMsg.content.toLowerCase();

      // Check for direct contradictions
      if (
        currentContent.includes("always") &&
        prevContent.includes("never")
      ) {
        issues.push("Contradicts previous statement about always/never");
      }

      if (
        currentContent.includes("correct") &&
        prevContent.includes("incorrect")
      ) {
        issues.push("Contradicts previous correctness assessment");
      }
    }

    return {
      consistent: issues.length === 0,
      issues,
    };
  }

  /**
   * Escalate risk level
   */
  private static escalateRisk(
    current: "low" | "medium" | "high",
    target: "low" | "medium" | "high"
  ): "low" | "medium" | "high" {
    const levels = { low: 0, medium: 1, high: 2 };
    return levels[target] > levels[current] ? target : current;
  }

  /**
   * Quick validation check (for real-time use)
   */
  static async quickValidate(content: string, latex?: string[]): Promise<boolean> {
    const validation = await this.validate({ content, latex });
    return validation.valid && !validation.requiresHumanReview;
  }

  /**
   * Get human-readable validation summary
   */
  static getValidationSummary(
    validation: AIResponseValidation
  ): string {
    if (validation.valid && !validation.requiresHumanReview) {
      return `✓ Response validated (confidence: ${(validation.confidence * 100).toFixed(0)}%)`;
    }

    const parts: string[] = [];

    if (validation.errors.length > 0) {
      parts.push(`${validation.errors.length} error(s)`);
    }

    if (validation.warnings.length > 0) {
      parts.push(`${validation.warnings.length} warning(s)`);
    }

    if (validation.requiresHumanReview) {
      parts.push("requires human review");
    }

    parts.push(`confidence: ${(validation.confidence * 100).toFixed(0)}%`);
    parts.push(`risk: ${validation.riskLevel}`);

    return `⚠ ${parts.join(", ")}`;
  }
}
