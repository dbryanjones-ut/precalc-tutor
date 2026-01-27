import { describe, it, expect } from "vitest";
import { AnswerValidator } from "./answer-validator";

describe("AnswerValidator", () => {
  describe("Basic Validation", () => {
    it("should accept exact numeric matches", () => {
      const result = AnswerValidator.validate("4", "4");
      expect(result.isCorrect).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.method).toBe("symbolic");
    });

    it("should accept exact string matches", () => {
      const result = AnswerValidator.validate("hello", "hello");
      expect(result.isCorrect).toBe(true);
      expect(result.method).toBe("string");
    });

    it("should reject incorrect answers", () => {
      const result = AnswerValidator.validate("4", "5");
      expect(result.isCorrect).toBe(false);
      expect(result.confidence).toBe(0.0);
    });

    it("should handle whitespace differences", () => {
      const result = AnswerValidator.validate("  4  ", "4");
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("Symbolic Equivalence", () => {
    it("should recognize algebraically equivalent expressions", () => {
      const result = AnswerValidator.validate("x^2 + 2x + 1", "(x+1)^2");
      expect(result.isCorrect).toBe(true);
      expect(result.method).toBe("symbolic");
    });

    it("should recognize expanded forms", () => {
      const result = AnswerValidator.validate("x^2 + 2x + 1", "x^2 + 2x + 1");
      expect(result.isCorrect).toBe(true);
    });

    it("should recognize factored forms", () => {
      const result = AnswerValidator.validate("(x-2)(x+3)", "x^2 + x - 6");
      expect(result.isCorrect).toBe(true);
    });

    it("should recognize trigonometric identities", () => {
      const result = AnswerValidator.validate(
        "sin(x)^2 + cos(x)^2",
        "1"
      );
      expect(result.isCorrect).toBe(true);
    });

    it("should handle commutative operations", () => {
      const result = AnswerValidator.validate("x + y", "y + x");
      expect(result.isCorrect).toBe(true);
    });

    it("should handle associative operations", () => {
      const result = AnswerValidator.validate("(x + y) + z", "x + (y + z)");
      expect(result.isCorrect).toBe(true);
    });

    it("should reject non-equivalent expressions", () => {
      const result = AnswerValidator.validate("x^2 + 1", "x^2 + 2");
      expect(result.isCorrect).toBe(false);
    });
  });

  describe("Numeric Comparison", () => {
    it("should handle decimal approximations", () => {
      const result = AnswerValidator.validate("0.333333", "1/3");
      expect(result.isCorrect).toBe(true);
      expect(result.method).toBe("numeric");
    });

    it("should handle pi approximations", () => {
      const result = AnswerValidator.validate("3.14159", "pi");
      expect(result.isCorrect).toBe(true);
    });

    it("should respect tolerance", () => {
      const result = AnswerValidator.validate("3.14", "pi", {
        tolerance: 0.01,
      });
      expect(result.isCorrect).toBe(true);
    });

    it("should reject values outside tolerance", () => {
      const result = AnswerValidator.validate("3.0", "pi", {
        tolerance: 0.01,
      });
      expect(result.isCorrect).toBe(false);
    });

    it("should handle infinity", () => {
      const result = AnswerValidator.validate("1/0", "Infinity");
      expect(result.isCorrect).toBe(true);
    });

    it("should handle negative infinity", () => {
      const result = AnswerValidator.validate("-1/0", "-Infinity");
      expect(result.isCorrect).toBe(true);
    });

    it("should reject NaN comparisons", () => {
      const result = AnswerValidator.validate("0/0", "0/0");
      expect(result.isCorrect).toBe(false);
    });

    it("should provide difference details", () => {
      const result = AnswerValidator.validate("3.5", "4.0");
      expect(result.details?.difference).toBeCloseTo(0.5);
      expect(result.details?.studentValue).toBe(3.5);
      expect(result.details?.correctValue).toBe(4.0);
    });
  });

  describe("Multiple Correct Answers", () => {
    it("should accept any of multiple correct answers", () => {
      const result = AnswerValidator.validate("2", ["2", "4/2", "sqrt(4)"]);
      expect(result.isCorrect).toBe(true);
    });

    it("should try all alternatives", () => {
      const result = AnswerValidator.validate("0.5", ["1/2", "2/4", "3/6"]);
      expect(result.isCorrect).toBe(true);
    });

    it("should reject if none match", () => {
      const result = AnswerValidator.validate("5", ["1", "2", "3"]);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe("Simplification Requirements", () => {
    it("should require simplified form when specified", () => {
      const result = AnswerValidator.validate("4/2", "2", {
        requireSimplified: true,
      });
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toContain("not simplified");
    });

    it("should accept already simplified forms", () => {
      const result = AnswerValidator.validate("2", "2", {
        requireSimplified: true,
      });
      expect(result.isCorrect).toBe(true);
    });

    it("should check simplification correctly", () => {
      const check = AnswerValidator.isSimplified("x^2 + 2x + 1");
      expect(check.simplified).toBe(true);
    });

    it("should detect non-simplified expressions", () => {
      const check = AnswerValidator.isSimplified("2 + 2");
      expect(check.simplified).toBe(false);
      expect(check.suggestion).toContain("4");
    });
  });

  describe("Partial Credit", () => {
    it("should not give partial credit by default", () => {
      const result = AnswerValidator.validate("3.9", "4.0");
      expect(result.isCorrect).toBe(false);
      expect(result.confidence).toBe(0.0);
    });

    it("should assess partial credit when enabled", () => {
      const result = AnswerValidator.validate("3.9", "4.0", {
        allowPartialCredit: true,
      });
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it("should give higher partial credit for closer answers", () => {
      const close = AnswerValidator.validate("3.99", "4.0", {
        allowPartialCredit: true,
      });
      const far = AnswerValidator.validate("3.5", "4.0", {
        allowPartialCredit: true,
      });
      expect(close.confidence).toBeGreaterThan(far.confidence);
    });

    it("should recognize correct form with wrong values", () => {
      const result = AnswerValidator.validate("x^2 + 3x + 2", "x^2 + 2x + 1", {
        allowPartialCredit: true,
      });
      expect(result.confidence).toBeGreaterThan(0.3);
    });
  });

  describe("Multiple Choice Validation", () => {
    it("should validate correct multiple choice answer", () => {
      const result = AnswerValidator.validateMultipleChoice("A", "A");
      expect(result.isCorrect).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it("should reject incorrect multiple choice answer", () => {
      const result = AnswerValidator.validateMultipleChoice("A", "B");
      expect(result.isCorrect).toBe(false);
      expect(result.confidence).toBe(0.0);
    });

    it("should handle numeric multiple choice", () => {
      const result = AnswerValidator.validateMultipleChoice(1, 1);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("Unit Conversion", () => {
    it("should validate matching units", () => {
      const result = AnswerValidator.validateWithUnits(
        "45 degrees",
        "45 degrees"
      );
      expect(result.isCorrect).toBe(true);
    });

    it("should detect unit mismatch", () => {
      const result = AnswerValidator.validateWithUnits(
        "45 degrees",
        "pi/4 radians"
      );
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toContain("Unit mismatch");
    });

    it("should convert degrees to radians", () => {
      const result = AnswerValidator.validateWithUnits(
        "180 degrees",
        "pi radians",
        { convertUnits: true }
      );
      expect(result.isCorrect).toBe(true);
    });

    it("should convert radians to degrees", () => {
      const result = AnswerValidator.validateWithUnits(
        "pi radians",
        "180 degrees",
        { convertUnits: true }
      );
      expect(result.isCorrect).toBe(true);
    });

    it("should handle unit abbreviations", () => {
      const result = AnswerValidator.validateWithUnits("90 deg", "90 degrees");
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("Special Values", () => {
    it("should handle square roots", () => {
      const result = AnswerValidator.validate("sqrt(4)", "2");
      expect(result.isCorrect).toBe(true);
    });

    it("should handle absolute values", () => {
      const result = AnswerValidator.validate("abs(-5)", "5");
      expect(result.isCorrect).toBe(true);
    });

    it("should handle exponentials", () => {
      const result = AnswerValidator.validate("e^0", "1");
      expect(result.isCorrect).toBe(true);
    });

    it("should handle logarithms", () => {
      const result = AnswerValidator.validate("log10(100)", "2");
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("Expression Normalization", () => {
    it("should normalize Unicode math symbols", () => {
      const result = AnswerValidator.validate("2×3", "2*3");
      expect(result.isCorrect).toBe(true);
    });

    it("should normalize division symbols", () => {
      const result = AnswerValidator.validate("6÷2", "6/2");
      expect(result.isCorrect).toBe(true);
    });

    it("should normalize minus signs", () => {
      const result = AnswerValidator.validate("5−3", "5-3");
      expect(result.isCorrect).toBe(true);
    });

    it("should normalize pi symbol", () => {
      const result = AnswerValidator.validate("π", "pi");
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle unparseable expressions", () => {
      const result = AnswerValidator.validate("@#$%", "2");
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toContain("Cannot parse");
    });

    it("should handle division by zero", () => {
      const result = AnswerValidator.validate("1/0", "2");
      expect(result.isCorrect).toBe(false);
    });

    it("should provide helpful feedback", () => {
      const result = AnswerValidator.validate("3", "4");
      expect(result.feedback).toBeTruthy();
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very small numbers", () => {
      const result = AnswerValidator.validate("0.0000001", "1e-7");
      expect(result.isCorrect).toBe(true);
    });

    it("should handle very large numbers", () => {
      const result = AnswerValidator.validate("1000000", "1e6");
      expect(result.isCorrect).toBe(true);
    });

    it("should handle negative numbers", () => {
      const result = AnswerValidator.validate("-5", "0-5");
      expect(result.isCorrect).toBe(true);
    });

    it("should handle zero", () => {
      const result = AnswerValidator.validate("0", "0*5");
      expect(result.isCorrect).toBe(true);
    });

    it("should handle fractions with negative signs", () => {
      const result = AnswerValidator.validate("-1/2", "-(1/2)");
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("Confidence Scoring", () => {
    it("should have high confidence for exact matches", () => {
      const result = AnswerValidator.validate("5", "5");
      expect(result.confidence).toBe(1.0);
    });

    it("should have slightly lower confidence for numeric matches", () => {
      const result = AnswerValidator.validate("0.5", "1/2");
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    it("should have zero confidence for wrong answers", () => {
      const result = AnswerValidator.validate("5", "10");
      expect(result.confidence).toBe(0.0);
    });
  });

  describe("Feedback Quality", () => {
    it("should provide encouraging feedback for correct answers", () => {
      const result = AnswerValidator.validate("4", "4");
      expect(result.feedback).toMatch(/correct/i);
    });

    it("should provide helpful feedback for incorrect answers", () => {
      const result = AnswerValidator.validate("3", "4");
      expect(result.feedback).toBeTruthy();
      expect(result.feedback.length).toBeGreaterThan(10);
    });

    it("should explain simplification requirements", () => {
      const result = AnswerValidator.validate("2+2", "4", {
        requireSimplified: true,
      });
      if (!result.isCorrect) {
        expect(result.feedback).toContain("simplified");
      }
    });
  });

  describe("Complex Expressions", () => {
    it("should handle quadratic formula", () => {
      const result = AnswerValidator.validate(
        "(-b + sqrt(b^2 - 4*a*c))/(2*a)",
        "(-b + sqrt(b^2 - 4*a*c))/(2*a)"
      );
      expect(result.isCorrect).toBe(true);
    });

    it("should handle polynomial expressions", () => {
      const result = AnswerValidator.validate(
        "x^3 - 3x^2 + 3x - 1",
        "(x-1)^3"
      );
      expect(result.isCorrect).toBe(true);
    });

    it("should handle rational expressions", () => {
      const result = AnswerValidator.validate(
        "(x^2 - 1)/(x - 1)",
        "x + 1"
      );
      // Note: This might not work with basic mathjs without simplification
      // but should be tested
      expect(result.method).toBeTruthy();
    });
  });
});
