import { evaluate, parse, simplify, SymbolNode } from "mathjs";

interface AnswerValidation {
  isCorrect: boolean;
  confidence: number; // 0-1
  equivalentForms: string[];
  feedback: string;
  method: "symbolic" | "numeric" | "string" | "failed";
  details?: {
    studentValue?: number;
    correctValue?: number;
    difference?: number;
  };
}

interface SimplificationCheck {
  simplified: boolean;
  reason?: string;
  suggestion?: string;
}

/**
 * Answer Validator - Ensures mathematical correctness of student answers
 *
 * This validator handles:
 * 1. Symbolic equivalence (e.g., x^2 + 2x + 1 = (x+1)^2)
 * 2. Numeric equivalence with tolerance (e.g., 0.333... ≈ 1/3)
 * 3. Multiple equivalent forms (e.g., sin^2(x) + cos^2(x) = 1)
 * 4. Unit conversions (degrees/radians)
 */
export class AnswerValidator {
  private static readonly DEFAULT_TOLERANCE = 1e-6;
  private static readonly PERCENTAGE_TOLERANCE = 0.01; // 1% for percentage problems

  /**
   * Validate student answer against correct answer(s)
   * Handles multiple equivalent forms and different comparison methods
   */
  static validate(
    studentAnswer: string,
    correctAnswer: string | string[],
    options: {
      tolerance?: number;
      allowPartialCredit?: boolean;
      requireSimplified?: boolean;
    } = {}
  ): AnswerValidation {
    const {
      tolerance = this.DEFAULT_TOLERANCE,
      allowPartialCredit = false,
      requireSimplified = false,
    } = options;

    // Normalize inputs
    const student = this.normalizeExpression(studentAnswer);
    const correctAnswers = Array.isArray(correctAnswer)
      ? correctAnswer.map((ans) => this.normalizeExpression(ans))
      : [this.normalizeExpression(correctAnswer)];

    // Try symbolic comparison first (most accurate)
    for (const correct of correctAnswers) {
      const symbolic = this.compareSymbolic(student, correct);
      if (symbolic.isCorrect) {
        // Check if simplification is required
        if (requireSimplified) {
          const simplificationCheck = this.isSimplified(student);
          if (!simplificationCheck.simplified) {
            return {
              isCorrect: false,
              confidence: 0.8,
              equivalentForms: [student, correct],
              feedback: `Your answer is mathematically correct but not simplified. ${simplificationCheck.suggestion || ""}`,
              method: "symbolic",
            };
          }
        }
        return symbolic;
      }
    }

    // Try numeric comparison (for decimal answers)
    for (const correct of correctAnswers) {
      const numeric = this.compareNumeric(student, correct, tolerance);
      if (numeric.isCorrect) return numeric;
    }

    // Try string comparison (for exact text matches)
    for (const correct of correctAnswers) {
      if (
        this.normalizeString(student) === this.normalizeString(correct)
      ) {
        return {
          isCorrect: true,
          confidence: 1.0,
          equivalentForms: [student],
          feedback: "Correct!",
          method: "string",
        };
      }
    }

    // Partial credit check (if enabled)
    if (allowPartialCredit) {
      const partialCredit = this.assessPartialCredit(student, correctAnswers);
      if (partialCredit.confidence > 0.3) {
        return partialCredit;
      }
    }

    // No match found
    return {
      isCorrect: false,
      confidence: 0.0,
      equivalentForms: [],
      feedback: "Answer does not match expected result. Please check your work.",
      method: "failed",
    };
  }

  /**
   * Compare expressions symbolically using mathjs
   * Most accurate method for algebraic expressions
   */
  private static compareSymbolic(
    student: string,
    correct: string
  ): AnswerValidation {
    try {
      // Parse both expressions
      const studentExpr = parse(student);
      const correctExpr = parse(correct);

      // Simplify both
      const studentSimplified = simplify(studentExpr);
      const correctSimplified = simplify(correctExpr);

      // Check equality
      const isEqual = studentSimplified.equals(correctSimplified);

      if (isEqual) {
        return {
          isCorrect: true,
          confidence: 1.0,
          equivalentForms: [student, correct],
          feedback: "Correct! Your answer is mathematically equivalent.",
          method: "symbolic",
        };
      }

      // Try subtracting and simplifying (another equivalence check)
      try {
        const difference = simplify(
          parse(`(${student}) - (${correct})`)
        );
        const diffString = difference.toString();

        if (diffString === "0" || this.isNearZero(diffString)) {
          return {
            isCorrect: true,
            confidence: 0.95,
            equivalentForms: [student, correct],
            feedback:
              "Correct! Your answer simplifies to the same result.",
            method: "symbolic",
          };
        }
      } catch {
        // Subtraction method failed, continue to return false
      }

      return {
        isCorrect: false,
        confidence: 0.0,
        equivalentForms: [],
        feedback: "Not equivalent",
        method: "symbolic",
      };
    } catch (error) {
      // Symbolic comparison failed - expression might not be parseable
      return {
        isCorrect: false,
        confidence: 0.0,
        equivalentForms: [],
        feedback:
          error instanceof Error
            ? `Cannot parse expression: ${error.message}`
            : "Cannot parse expression",
        method: "failed",
      };
    }
  }

  /**
   * Compare expressions numerically (for decimal answers or when symbolic fails)
   * Uses tolerance for floating point comparison
   */
  private static compareNumeric(
    student: string,
    correct: string,
    tolerance: number
  ): AnswerValidation {
    try {
      // Evaluate both expressions to numbers
      const studentValue = evaluate(student);
      const correctValue = evaluate(correct);

      // Check if both are numbers
      if (
        typeof studentValue !== "number" ||
        typeof correctValue !== "number"
      ) {
        return {
          isCorrect: false,
          confidence: 0.0,
          equivalentForms: [],
          feedback: "Cannot compare non-numeric values numerically",
          method: "failed",
        };
      }

      // Handle special cases
      if (isNaN(studentValue) || isNaN(correctValue)) {
        return {
          isCorrect: false,
          confidence: 0.0,
          equivalentForms: [],
          feedback: "Result is not a number (NaN)",
          method: "failed",
        };
      }

      if (
        !isFinite(studentValue) ||
        !isFinite(correctValue)
      ) {
        // Infinity check
        if (studentValue === correctValue) {
          return {
            isCorrect: true,
            confidence: 1.0,
            equivalentForms: [student, correct],
            feedback: "Correct!",
            method: "numeric",
          };
        }
        return {
          isCorrect: false,
          confidence: 0.0,
          equivalentForms: [],
          feedback: "Result is infinity",
          method: "failed",
        };
      }

      // Calculate absolute and relative difference
      const absoluteDifference = Math.abs(studentValue - correctValue);
      const relativeDifference =
        Math.abs(correctValue) > 0
          ? absoluteDifference / Math.abs(correctValue)
          : absoluteDifference;

      // Check if within tolerance (use either absolute or relative)
      const isWithinTolerance =
        absoluteDifference < tolerance ||
        relativeDifference < tolerance;

      if (isWithinTolerance) {
        // Calculate confidence based on how close the answer is
        const confidenceScore =
          1.0 - Math.min(1.0, absoluteDifference / tolerance);

        return {
          isCorrect: true,
          confidence: Math.max(0.9, confidenceScore), // Minimum 0.9 confidence
          equivalentForms: [student, correct],
          feedback:
            absoluteDifference < tolerance * 0.1
              ? "Correct!"
              : "Correct! (within numerical tolerance)",
          method: "numeric",
          details: {
            studentValue,
            correctValue,
            difference: absoluteDifference,
          },
        };
      }

      return {
        isCorrect: false,
        confidence: 0.0,
        equivalentForms: [],
        feedback: `Answer differs from expected result. Your answer: ${studentValue}, Expected: ${correctValue}`,
        method: "numeric",
        details: {
          studentValue,
          correctValue,
          difference: absoluteDifference,
        },
      };
    } catch (error) {
      return {
        isCorrect: false,
        confidence: 0.0,
        equivalentForms: [],
        feedback:
          error instanceof Error
            ? `Evaluation error: ${error.message}`
            : "Evaluation error",
        method: "failed",
      };
    }
  }

  /**
   * Check if answer is in simplified form
   */
  static isSimplified(expression: string): SimplificationCheck {
    try {
      const expr = parse(expression);
      const simplified = simplify(expr);

      // Convert both to strings and compare
      const original = expr.toString();
      const simplifiedStr = simplified.toString();

      const isAlreadySimplified = original === simplifiedStr;

      if (isAlreadySimplified) {
        return { simplified: true };
      }

      return {
        simplified: false,
        reason: "Expression can be simplified further",
        suggestion: `Simplified form: ${simplifiedStr}`,
      };
    } catch (error) {
      return {
        simplified: false,
        reason:
          error instanceof Error ? error.message : "Cannot parse expression",
      };
    }
  }

  /**
   * Assess partial credit for nearly correct answers
   */
  private static assessPartialCredit(
    student: string,
    correctAnswers: string[]
  ): AnswerValidation {
    let maxConfidence = 0.0;
    let bestFeedback = "";

    for (const correct of correctAnswers) {
      try {
        // Try numeric comparison with relaxed tolerance
        const numericCheck = this.compareNumeric(
          student,
          correct,
          this.DEFAULT_TOLERANCE * 10
        );

        if (numericCheck.confidence > maxConfidence) {
          maxConfidence = numericCheck.confidence * 0.7; // Scale down for partial credit
          bestFeedback = "Close, but not quite correct. Check your calculation.";
        }

        // Check if answer has correct form but wrong values
        const studentParsed = parse(student);
        const correctParsed = parse(correct);

        if (
          studentParsed.type === correctParsed.type &&
          studentParsed.toString().length ===
            correctParsed.toString().length
        ) {
          maxConfidence = Math.max(maxConfidence, 0.4);
          bestFeedback =
            "Your answer has the right form, but check your values.";
        }
      } catch {
        // Comparison failed, continue
      }
    }

    return {
      isCorrect: false,
      confidence: maxConfidence,
      equivalentForms: [],
      feedback: bestFeedback || "Not correct. Review the problem.",
      method: "failed",
    };
  }

  /**
   * Normalize expression for comparison
   */
  private static normalizeExpression(expr: string): string {
    return (
      expr
        .trim()
        // Replace common Unicode variants
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/π/g, "pi")
        // Remove spaces
        .replace(/\s+/g, "")
    );
  }

  /**
   * Normalize string for exact text comparison
   */
  private static normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9+\-*/^().,]/g, "");
  }

  /**
   * Check if expression evaluates to near zero
   */
  private static isNearZero(expr: string): boolean {
    try {
      const value = evaluate(expr);
      return typeof value === "number" && Math.abs(value) < 1e-10;
    } catch {
      return false;
    }
  }

  /**
   * Validate multiple choice answer
   */
  static validateMultipleChoice(
    studentAnswer: string | number,
    correctAnswer: string | number
  ): AnswerValidation {
    const isCorrect = studentAnswer === correctAnswer;

    return {
      isCorrect,
      confidence: isCorrect ? 1.0 : 0.0,
      equivalentForms: isCorrect ? [String(studentAnswer)] : [],
      feedback: isCorrect
        ? "Correct!"
        : "Incorrect. Review the problem and try again.",
      method: "string",
    };
  }

  /**
   * Validate answer with units (e.g., "45 degrees" vs "π/4 radians")
   */
  static validateWithUnits(
    studentAnswer: string,
    correctAnswer: string,
    options: { convertUnits?: boolean } = {}
  ): AnswerValidation {
    // Extract value and unit
    const studentParts = this.parseValueWithUnit(studentAnswer);
    const correctParts = this.parseValueWithUnit(correctAnswer);

    if (!studentParts || !correctParts) {
      return {
        isCorrect: false,
        confidence: 0.0,
        equivalentForms: [],
        feedback: "Cannot parse answer with units",
        method: "failed",
      };
    }

    // Check if units match
    if (studentParts.unit === correctParts.unit) {
      return this.validate(studentParts.value, correctParts.value);
    }

    // Try unit conversion if enabled
    if (options.convertUnits) {
      const converted = this.convertUnits(
        studentParts.value,
        studentParts.unit,
        correctParts.unit
      );
      if (converted !== null) {
        return this.validate(String(converted), correctParts.value);
      }
    }

    return {
      isCorrect: false,
      confidence: 0.0,
      equivalentForms: [],
      feedback: `Unit mismatch: expected ${correctParts.unit}, got ${studentParts.unit}`,
      method: "failed",
    };
  }

  /**
   * Parse value and unit from string
   */
  private static parseValueWithUnit(str: string): {
    value: string;
    unit: string;
  } | null {
    const match = str.match(/^(.+?)\s*(degrees?|radians?|deg|rad)?$/i);
    if (!match) return null;

    return {
      value: match[1].trim(),
      unit: (match[2] || "").toLowerCase(),
    };
  }

  /**
   * Convert between common units
   */
  private static convertUnits(
    value: string,
    fromUnit: string,
    toUnit: string
  ): number | null {
    try {
      const numValue = evaluate(value);
      if (typeof numValue !== "number") return null;

      // Degrees to radians
      if (
        fromUnit.includes("deg") &&
        toUnit.includes("rad")
      ) {
        return numValue * (Math.PI / 180);
      }

      // Radians to degrees
      if (
        fromUnit.includes("rad") &&
        toUnit.includes("deg")
      ) {
        return numValue * (180 / Math.PI);
      }

      return null;
    } catch {
      return null;
    }
  }
}
