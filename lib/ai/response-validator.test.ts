import { describe, it, expect } from "vitest";
import { AIResponseValidator } from "./response-validator";
import type { ChatMessage } from "@/types";

describe("AIResponseValidator", () => {
  describe("Basic Validation", () => {
    it("should validate simple correct responses", async () => {
      const result = await AIResponseValidator.validate({
        content: "This is a valid response about mathematics.",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.riskLevel).toBe("low");
    });

    it("should validate responses with valid LaTeX", async () => {
      const result = await AIResponseValidator.validate({
        content: "The solution is x = 2",
        latex: ["x = 2", "x^2 + 1"],
      });
      expect(result.valid).toBe(true);
      expect(result.latexValidations).toHaveLength(2);
      expect(result.latexValidations[0].valid).toBe(true);
      expect(result.latexValidations[1].valid).toBe(true);
    });

    it("should reject responses with invalid LaTeX", async () => {
      const result = await AIResponseValidator.validate({
        content: "Bad LaTeX example",
        latex: ["\\href{javascript:alert(1)}"],
      });
      expect(result.valid).toBe(false);
      expect(result.latexValidations[0].valid).toBe(false);
      expect(result.riskLevel).toBe("high");
    });
  });

  describe("Hallucination Detection", () => {
    it("should detect 'as we all know' phrases", async () => {
      const result = await AIResponseValidator.validate({
        content: "As we all know, x^2 is always positive.",
      });
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("hallucination"))).toBe(true);
      expect(result.requiresHumanReview).toBe(true);
      expect(result.riskLevel).toBe("medium");
    });

    it("should detect 'obviously' phrases", async () => {
      const result = await AIResponseValidator.validate({
        content: "Obviously, the answer is 42.",
      });
      expect(result.warnings.some((w) => w.includes("hallucination"))).toBe(true);
    });

    it("should detect 'clearly' phrases", async () => {
      const result = await AIResponseValidator.validate({
        content: "Clearly, this is the correct approach.",
      });
      expect(result.warnings.some((w) => w.includes("hallucination"))).toBe(true);
    });

    it("should detect 'everyone knows' phrases", async () => {
      const result = await AIResponseValidator.validate({
        content: "Everyone knows that pi equals 3.14159.",
      });
      expect(result.warnings.some((w) => w.includes("hallucination"))).toBe(true);
    });

    it("should not flag confident but appropriate language", async () => {
      const result = await AIResponseValidator.validate({
        content: "The quadratic formula is x = (-b ± sqrt(b^2 - 4ac)) / (2a).",
      });
      expect(result.warnings.filter((w) => w.includes("hallucination"))).toHaveLength(0);
    });
  });

  describe("Uncertainty Detection", () => {
    it("should detect 'I think' phrases", async () => {
      const result = await AIResponseValidator.validate({
        content: "I think the answer might be x = 5.",
      });
      expect(result.warnings.some((w) => w.includes("Uncertain"))).toBe(true);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it("should detect 'probably' phrases", async () => {
      const result = await AIResponseValidator.validate({
        content: "This is probably the correct method.",
      });
      expect(result.warnings.some((w) => w.includes("Uncertain"))).toBe(true);
    });

    it("should detect 'might be' phrases", async () => {
      const result = await AIResponseValidator.validate({
        content: "The solution might be x = 3.",
      });
      expect(result.warnings.some((w) => w.includes("Uncertain"))).toBe(true);
    });

    it("should detect 'perhaps' phrases", async () => {
      const result = await AIResponseValidator.validate({
        content: "Perhaps we should try factoring.",
      });
      expect(result.warnings.some((w) => w.includes("Uncertain"))).toBe(true);
    });
  });

  describe("Citation Requirements", () => {
    it("should flag mathematical claims without citations", async () => {
      const result = await AIResponseValidator.validate({
        content: "By the Pythagorean theorem, a^2 + b^2 = c^2.",
      });
      expect(result.warnings.some((w) => w.includes("citations"))).toBe(true);
    });

    it("should not flag with proper citations", async () => {
      const result = await AIResponseValidator.validate({
        content: "By the Pythagorean theorem, a^2 + b^2 = c^2.",
        citations: [
          {
            type: "reference",
            title: "Pythagorean Theorem",
            content: "In a right triangle, a^2 + b^2 = c^2",
            link: "https://example.com",
          },
        ],
      });
      expect(result.warnings.filter((w) => w.includes("citations"))).toHaveLength(0);
    });

    it("should detect theorem references", async () => {
      const result = await AIResponseValidator.validate({
        content: "According to the fundamental theorem of calculus...",
      });
      expect(result.warnings.some((w) => w.includes("citations"))).toBe(true);
    });

    it("should detect formula references", async () => {
      const result = await AIResponseValidator.validate({
        content: "Using the quadratic formula, we get...",
      });
      expect(result.warnings.some((w) => w.includes("citations"))).toBe(true);
    });
  });

  describe("Contradiction Detection", () => {
    it("should detect always/never contradictions", async () => {
      const result = await AIResponseValidator.validate({
        content: "This is always true, but it's never correct in special cases.",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("contradiction"))).toBe(true);
      expect(result.riskLevel).toBe("high");
    });

    it("should detect correct/incorrect contradictions", async () => {
      const result = await AIResponseValidator.validate({
        content: "This answer is correct, but it's also incorrect.",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("contradiction"))).toBe(true);
    });

    it("should detect true/false contradictions", async () => {
      const result = await AIResponseValidator.validate({
        content: "The statement is true, however it is false.",
      });
      expect(result.valid).toBe(false);
    });

    it("should not flag valid comparative statements", async () => {
      const result = await AIResponseValidator.validate({
        content: "X is greater than Y, and Y is less than Z.",
      });
      // This should pass since it's not contradictory
      expect(result.errors.filter((e) => e.includes("contradiction"))).toHaveLength(0);
    });
  });

  describe("Numeric Claim Validation", () => {
    it("should accept reasonable numeric claims", async () => {
      const result = await AIResponseValidator.validate({
        content: "The answer equals 5.5 and is approximately 5.50.",
      });
      expect(result.valid).toBe(true);
    });

    it("should flag suspiciously precise values", async () => {
      const result = await AIResponseValidator.validate({
        content: "The value equals 3.14159265358979323846.",
      });
      expect(result.warnings.some((w) => w.includes("Suspicious numeric"))).toBe(true);
    });

    it("should handle normal precision", async () => {
      const result = await AIResponseValidator.validate({
        content: "Pi is approximately 3.14159.",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("Response Length Validation", () => {
    it("should flag very short mathematical explanations", async () => {
      const result = await AIResponseValidator.validate({
        content: "Use theorem.",
      });
      expect(result.warnings.some((w) => w.includes("very short"))).toBe(true);
    });

    it("should accept appropriately detailed responses", async () => {
      const result = await AIResponseValidator.validate({
        content:
          "To solve this problem, first identify the type of equation. Then apply the quadratic formula to find the roots.",
      });
      expect(result.warnings.filter((w) => w.includes("short"))).toHaveLength(0);
    });
  });

  describe("Step Verification", () => {
    it("should verify valid mathematical steps", () => {
      const steps = [
        { from: "x + 2 = 5", to: "x = 3", reason: "Subtract 2 from both sides" },
      ];
      const result = AIResponseValidator.verifySteps(steps);
      expect(result.valid).toBe(true);
      expect(result.invalidSteps).toHaveLength(0);
    });

    it("should detect invalid mathematical steps", () => {
      const steps = [
        { from: "x + 2 = 5", to: "x = 10", reason: "Invalid transformation" },
      ];
      const result = AIResponseValidator.verifySteps(steps);
      expect(result.valid).toBe(false);
      expect(result.invalidSteps).toContain(0);
    });

    it("should handle multiple steps", () => {
      const steps = [
        { from: "2x = 10", to: "x = 5", reason: "Divide by 2" },
        { from: "x = 5", to: "x + 1 = 6", reason: "Add 1" },
      ];
      const result = AIResponseValidator.verifySteps(steps);
      expect(result.valid).toBe(true);
      expect(result.details).toHaveLength(2);
    });

    it("should identify which steps are invalid", () => {
      const steps = [
        { from: "x = 5", to: "x = 5", reason: "Identity" },
        { from: "x = 5", to: "x = 10", reason: "Invalid" },
        { from: "x = 10", to: "x = 10", reason: "Identity" },
      ];
      const result = AIResponseValidator.verifySteps(steps);
      expect(result.invalidSteps).toContain(1);
      expect(result.invalidSteps).not.toContain(0);
      expect(result.invalidSteps).not.toContain(2);
    });
  });

  describe("Session Message Validation", () => {
    it("should skip validation for user messages", async () => {
      const message: ChatMessage = {
        role: "user",
        content: "What is 2+2?",
        timestamp: new Date().toISOString(),
      };
      const result = await AIResponseValidator.validateSessionMessage(message);
      expect(result.valid).toBe(true);
      expect(result.requiresHumanReview).toBe(false);
    });

    it("should validate assistant messages", async () => {
      const message: ChatMessage = {
        role: "assistant",
        content: "The answer is 4.",
        timestamp: new Date().toISOString(),
      };
      const result = await AIResponseValidator.validateSessionMessage(message);
      expect(result.valid).toBe(true);
    });

    it("should check consistency with history", async () => {
      const previousMessages: ChatMessage[] = [
        {
          role: "assistant",
          content: "The answer is always 4.",
          timestamp: new Date().toISOString(),
        },
      ];

      const currentMessage: ChatMessage = {
        role: "assistant",
        content: "The answer is never 4.",
        timestamp: new Date().toISOString(),
      };

      const result = await AIResponseValidator.validateSessionMessage(
        currentMessage,
        { previousMessages }
      );

      expect(result.warnings.some((w) => w.includes("Consistency"))).toBe(true);
    });
  });

  describe("Risk Level Escalation", () => {
    it("should escalate from low to medium", async () => {
      const result = await AIResponseValidator.validate({
        content: "I think this might be correct.",
      });
      expect(result.riskLevel).toBe("medium");
    });

    it("should escalate to high for security issues", async () => {
      const result = await AIResponseValidator.validate({
        content: "Valid content",
        latex: ["\\href{javascript:alert(1)}"],
      });
      expect(result.riskLevel).toBe("high");
    });

    it("should remain low for clean responses", async () => {
      const result = await AIResponseValidator.validate({
        content: "Let's solve this step by step. First, we simplify.",
      });
      expect(result.riskLevel).toBe("low");
    });
  });

  describe("Confidence Scoring", () => {
    it("should have high confidence for clean responses", async () => {
      const result = await AIResponseValidator.validate({
        content: "The quadratic formula gives us x = 2 or x = 3.",
      });
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it("should reduce confidence for multiple warnings", async () => {
      const result = await AIResponseValidator.validate({
        content:
          "I think, maybe, possibly, the answer might be correct, probably.",
      });
      expect(result.confidence).toBeLessThan(0.8);
    });

    it("should have very low confidence for errors", async () => {
      const result = await AIResponseValidator.validate({
        content: "This is always true but never correct.",
        latex: ["\\href{bad}"],
      });
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe("Quick Validation", () => {
    it("should quickly validate good content", async () => {
      const result = await AIResponseValidator.quickValidate(
        "This is a valid mathematical explanation."
      );
      expect(result).toBe(true);
    });

    it("should quickly reject bad content", async () => {
      const result = await AIResponseValidator.quickValidate(
        "This is always but never true.",
        ["\\href{bad}"]
      );
      expect(result).toBe(false);
    });
  });

  describe("Validation Summary", () => {
    it("should generate positive summary for valid responses", async () => {
      const validation = await AIResponseValidator.validate({
        content: "Here's the solution step by step.",
      });
      const summary = AIResponseValidator.getValidationSummary(validation);
      expect(summary).toContain("✓");
      expect(summary).toContain("confidence");
    });

    it("should generate warning summary for issues", async () => {
      const validation = await AIResponseValidator.validate({
        content: "I think this might work.",
      });
      const summary = AIResponseValidator.getValidationSummary(validation);
      expect(summary).toContain("⚠");
      expect(summary).toContain("warning");
    });

    it("should include error count in summary", async () => {
      const validation = await AIResponseValidator.validate({
        content: "Always but never true.",
        latex: ["\\href{bad}"],
      });
      const summary = AIResponseValidator.getValidationSummary(validation);
      expect(summary).toContain("error");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty content", async () => {
      const result = await AIResponseValidator.validate({
        content: "",
      });
      expect(result.valid).toBe(true); // Empty is valid, just not useful
    });

    it("should handle content with no mathematical claims", async () => {
      const result = await AIResponseValidator.validate({
        content: "Let's work through this problem together.",
      });
      expect(result.valid).toBe(true);
      expect(result.riskLevel).toBe("low");
    });

    it("should handle multiple LaTeX expressions", async () => {
      const result = await AIResponseValidator.validate({
        content: "Multiple equations",
        latex: ["x^2", "y^2", "z^2"],
      });
      expect(result.latexValidations).toHaveLength(3);
    });

    it("should require human review for accumulated warnings", async () => {
      const result = await AIResponseValidator.validate({
        content:
          "Obviously everyone knows I think probably maybe it seems like this might be correct.",
      });
      expect(result.requiresHumanReview).toBe(true);
    });
  });
});
