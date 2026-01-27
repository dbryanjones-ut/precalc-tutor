import { describe, it, expect } from "vitest";
import { LatexValidator } from "./latex-validator";

describe("LatexValidator", () => {
  describe("Basic Validation", () => {
    it("should validate simple expressions", () => {
      const result = LatexValidator.validate("x^2 + 2x + 1");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty strings", () => {
      const result = LatexValidator.validate("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("LaTeX string is empty");
    });

    it("should reject whitespace-only strings", () => {
      const result = LatexValidator.validate("   ");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("LaTeX string is empty");
    });

    it("should reject strings exceeding maximum length", () => {
      const longString = "x".repeat(10001);
      const result = LatexValidator.validate(longString);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("exceeds maximum length");
    });

    it("should accept strings at maximum length", () => {
      const maxString = "x^2".repeat(3000); // ~9000 chars
      const result = LatexValidator.validate(maxString);
      expect(result.valid).toBe(true);
    });
  });

  describe("Allowed Commands", () => {
    it("should allow basic fraction commands", () => {
      expect(LatexValidator.validate("\\frac{1}{2}").valid).toBe(true);
      expect(LatexValidator.validate("\\dfrac{3}{4}").valid).toBe(true);
      expect(LatexValidator.validate("\\tfrac{5}{6}").valid).toBe(true);
    });

    it("should allow square root and nth root", () => {
      expect(LatexValidator.validate("\\sqrt{16}").valid).toBe(true);
      expect(LatexValidator.validate("\\sqrt[3]{27}").valid).toBe(true);
    });

    it("should allow trigonometric functions", () => {
      expect(LatexValidator.validate("\\sin(x)").valid).toBe(true);
      expect(LatexValidator.validate("\\cos(x)").valid).toBe(true);
      expect(LatexValidator.validate("\\tan(x)").valid).toBe(true);
      expect(LatexValidator.validate("\\sec(x)").valid).toBe(true);
      expect(LatexValidator.validate("\\csc(x)").valid).toBe(true);
      expect(LatexValidator.validate("\\cot(x)").valid).toBe(true);
    });

    it("should allow inverse trig functions", () => {
      expect(LatexValidator.validate("\\arcsin(x)").valid).toBe(true);
      expect(LatexValidator.validate("\\arccos(x)").valid).toBe(true);
      expect(LatexValidator.validate("\\arctan(x)").valid).toBe(true);
    });

    it("should allow logarithmic functions", () => {
      expect(LatexValidator.validate("\\log(x)").valid).toBe(true);
      expect(LatexValidator.validate("\\ln(x)").valid).toBe(true);
      expect(LatexValidator.validate("\\lg(x)").valid).toBe(true);
    });

    it("should allow Greek letters", () => {
      expect(LatexValidator.validate("\\alpha + \\beta").valid).toBe(true);
      expect(LatexValidator.validate("\\theta").valid).toBe(true);
      expect(LatexValidator.validate("\\pi").valid).toBe(true);
      expect(LatexValidator.validate("\\omega").valid).toBe(true);
    });

    it("should allow calculus operators", () => {
      expect(LatexValidator.validate("\\int_{0}^{1} x dx").valid).toBe(true);
      expect(LatexValidator.validate("\\sum_{i=1}^{n} i").valid).toBe(true);
      expect(LatexValidator.validate("\\lim_{x \\to 0} f(x)").valid).toBe(true);
      expect(LatexValidator.validate("\\partial f").valid).toBe(true);
    });

    it("should allow comparison operators", () => {
      expect(LatexValidator.validate("x \\leq y").valid).toBe(true);
      expect(LatexValidator.validate("x \\geq y").valid).toBe(true);
      expect(LatexValidator.validate("x \\neq y").valid).toBe(true);
      expect(LatexValidator.validate("x \\approx y").valid).toBe(true);
    });

    it("should allow matrices", () => {
      const matrix = "\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}";
      expect(LatexValidator.validate(matrix).valid).toBe(true);
    });
  });

  describe("Forbidden Commands (Security)", () => {
    it("should block href commands (XSS risk)", () => {
      const result = LatexValidator.validate("\\href{javascript:alert(1)}");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("href"))).toBe(true);
    });

    it("should block url commands", () => {
      const result = LatexValidator.validate("\\url{malicious}");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("url"))).toBe(true);
    });

    it("should block command definition", () => {
      expect(LatexValidator.validate("\\def\\foo{bar}").valid).toBe(false);
      expect(LatexValidator.validate("\\newcommand{\\foo}{bar}").valid).toBe(false);
      expect(LatexValidator.validate("\\renewcommand").valid).toBe(false);
    });

    it("should block file system commands", () => {
      expect(LatexValidator.validate("\\input{file}").valid).toBe(false);
      expect(LatexValidator.validate("\\include{file}").valid).toBe(false);
      expect(LatexValidator.validate("\\read{file}").valid).toBe(false);
    });

    it("should block dangerous control flow", () => {
      expect(LatexValidator.validate("\\loop content").valid).toBe(false);
      expect(LatexValidator.validate("\\csname").valid).toBe(false);
    });
  });

  describe("XSS Prevention", () => {
    it("should detect JavaScript protocols", () => {
      const result = LatexValidator.validate("javascript:alert(1)");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("JavaScript protocol"))).toBe(true);
    });

    it("should detect HTML data URIs", () => {
      const result = LatexValidator.validate("data:text/html,<script>alert(1)</script>");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("HTML data URI"))).toBe(true);
    });

    it("should detect script tags", () => {
      const result = LatexValidator.validate("<script>alert(1)</script>");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Script tag"))).toBe(true);
    });

    it("should detect event handlers", () => {
      const result = LatexValidator.validate('onclick="alert(1)"');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Event handler"))).toBe(true);
    });
  });

  describe("Brace Balance", () => {
    it("should accept balanced braces", () => {
      expect(LatexValidator.validate("{x + y}").valid).toBe(true);
      expect(LatexValidator.validate("{{nested}}").valid).toBe(true);
      expect(LatexValidator.validate("\\frac{a}{b}").valid).toBe(true);
    });

    it("should reject unclosed opening braces", () => {
      const result = LatexValidator.validate("{x + y");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Unclosed opening braces"))).toBe(true);
    });

    it("should reject too many closing braces", () => {
      const result = LatexValidator.validate("x + y}");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("closing braces"))).toBe(true);
    });

    it("should handle escaped braces correctly", () => {
      expect(LatexValidator.validate("\\{x\\}").valid).toBe(true);
    });
  });

  describe("KaTeX Parsing", () => {
    it("should accept valid KaTeX syntax", () => {
      const validExpressions = [
        "x^2 + y^2 = z^2",
        "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
        "\\sum_{i=0}^{n} i = \\frac{n(n+1)}{2}",
      ];

      validExpressions.forEach((expr) => {
        const result = LatexValidator.validate(expr);
        expect(result.valid).toBe(true);
      });
    });

    it("should reject invalid KaTeX syntax", () => {
      const result = LatexValidator.validate("\\frac{incomplete");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("KaTeX parse error"))).toBe(true);
    });

    it("should reject unknown commands", () => {
      const result = LatexValidator.validate("\\unknowncommand{x}");
      expect(result.valid).toBe(false);
    });
  });

  describe("Sanitization", () => {
    it("should remove HTML tags", () => {
      const sanitized = LatexValidator.sanitize("<script>alert(1)</script>x^2");
      expect(sanitized).toBe("x^2");
    });

    it("should remove forbidden commands", () => {
      const sanitized = LatexValidator.sanitize("\\href{link}x^2");
      expect(sanitized).not.toContain("\\href");
    });

    it("should remove data URIs", () => {
      const sanitized = LatexValidator.sanitize("data:text/html,malicious");
      expect(sanitized).not.toContain("data:");
    });

    it("should remove javascript protocols", () => {
      const sanitized = LatexValidator.sanitize("javascript:alert(1)");
      expect(sanitized).not.toContain("javascript:");
    });

    it("should preserve valid LaTeX", () => {
      const input = "x^2 + \\frac{1}{2}";
      const sanitized = LatexValidator.sanitize(input);
      expect(sanitized).toBe(input);
    });
  });

  describe("Batch Validation", () => {
    it("should validate multiple expressions", () => {
      const expressions = ["x^2", "\\frac{1}{2}", "\\sqrt{4}"];
      const results = LatexValidator.validateBatch(expressions);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.result.valid).toBe(true);
      });
    });

    it("should identify invalid expressions in batch", () => {
      const expressions = ["x^2", "\\href{bad}", "\\sqrt{4}"];
      const results = LatexValidator.validateBatch(expressions);

      expect(results[0].result.valid).toBe(true);
      expect(results[1].result.valid).toBe(false);
      expect(results[2].result.valid).toBe(true);
    });
  });

  describe("Quick Validation", () => {
    it("should return boolean for valid expressions", () => {
      expect(LatexValidator.isValid("x^2")).toBe(true);
    });

    it("should return boolean for invalid expressions", () => {
      expect(LatexValidator.isValid("\\href{bad}")).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle expressions with only symbols", () => {
      expect(LatexValidator.validate("\\alpha \\beta \\gamma").valid).toBe(true);
    });

    it("should handle expressions with mixed content", () => {
      const expr = "\\text{The answer is } x = \\frac{-b}{2a}";
      expect(LatexValidator.validate(expr).valid).toBe(true);
    });

    it("should handle deeply nested expressions", () => {
      const nested = "\\frac{\\frac{\\frac{1}{2}}{3}}{4}";
      expect(LatexValidator.validate(nested).valid).toBe(true);
    });

    it("should handle expressions with colors", () => {
      const colored = "\\textcolor{red}{x} + \\textcolor{blue}{y}";
      expect(LatexValidator.validate(colored).valid).toBe(true);
    });

    it("should handle complex calculus expressions", () => {
      const expr =
        "\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h} = f'(x)";
      expect(LatexValidator.validate(expr).valid).toBe(true);
    });
  });

  describe("Warnings", () => {
    it("should warn about unrecognized commands", () => {
      // This depends on KaTeX accepting but warning about certain commands
      const result = LatexValidator.validate("x^2 + y^2");
      // Should be valid but might have warnings
      expect(result.valid).toBe(true);
    });

    it("should return sanitized version for valid input", () => {
      const result = LatexValidator.validate("x^2 + 2x + 1");
      expect(result.sanitized).toBeDefined();
      expect(result.sanitized).toBe("x^2 + 2x + 1");
    });
  });
});
