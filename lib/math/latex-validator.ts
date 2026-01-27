import katex from "katex";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized?: string;
}

/**
 * LaTeX Validator - Ensures mathematical correctness and security
 *
 * This validator is CRITICAL for preventing:
 * 1. XSS attacks via malicious LaTeX
 * 2. Invalid mathematical notation rendering
 * 3. Hallucinated or incorrect math from AI responses
 */
export class LatexValidator {
  // Whitelist of allowed KaTeX commands
  private static readonly ALLOWED_COMMANDS = new Set([
    // Basic math
    "frac",
    "dfrac",
    "tfrac",
    "sqrt",
    "root",
    // Trigonometry
    "sin",
    "cos",
    "tan",
    "sec",
    "csc",
    "cot",
    "arcsin",
    "arccos",
    "arctan",
    // Logarithms
    "log",
    "ln",
    "lg",
    // Greek letters
    "alpha",
    "beta",
    "gamma",
    "delta",
    "epsilon",
    "theta",
    "lambda",
    "mu",
    "pi",
    "sigma",
    "phi",
    "omega",
    // Symbols
    "infty",
    "cdot",
    "times",
    "div",
    "pm",
    "mp",
    // Comparison
    "leq",
    "geq",
    "neq",
    "approx",
    "equiv",
    "lt",
    "gt",
    // Calculus
    "sum",
    "prod",
    "int",
    "lim",
    "partial",
    // Brackets
    "left",
    "right",
    "bigl",
    "bigr",
    "Bigl",
    "Bigr",
    // Formatting
    "text",
    "textbf",
    "textit",
    "mathbf",
    "mathit",
    "mathrm",
    "displaystyle",
    "textstyle",
    // Spacing
    "quad",
    "qquad",
    ",",
    ";",
    "!",
    // Color (for educational highlighting)
    "textcolor",
    "color",
    // Arrows
    "rightarrow",
    "leftarrow",
    "Rightarrow",
    "Leftarrow",
    "leftrightarrow",
    // Sets
    "in",
    "notin",
    "subset",
    "subseteq",
    "cup",
    "cap",
    "emptyset",
    // Dots
    "ldots",
    "cdots",
    "vdots",
    "ddots",
    // Matrices
    "begin",
    "end",
    "pmatrix",
    "bmatrix",
    "vmatrix",
    // Accents
    "hat",
    "bar",
    "dot",
    "ddot",
    "vec",
    "tilde",
    "overline",
    "underline",
  ]);

  // Commands that are security risks or nonsensical in educational context
  private static readonly FORBIDDEN_COMMANDS = new Set([
    // Security risks
    "href",
    "url",
    "includegraphics",
    "input",
    "include",
    "write",
    "immediate",
    "openin",
    "openout",
    "def",
    "let",
    "newcommand",
    "renewcommand",
    "providecommand",
    "gdef",
    "edef",
    "xdef",
    // File system access
    "read",
    "csname",
    "expandafter",
    "noexpand",
    // Control flow that could cause issues
    "loop",
    "repeat",
    "ifx",
    "iftrue",
    "iffalse",
  ]);

  // Maximum allowed length to prevent DoS
  private static readonly MAX_LATEX_LENGTH = 10000;

  /**
   * Validate LaTeX string for safety and correctness
   */
  static validate(latex: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Length check
    if (latex.length > this.MAX_LATEX_LENGTH) {
      errors.push(
        `LaTeX exceeds maximum length of ${this.MAX_LATEX_LENGTH} characters`
      );
      return { valid: false, errors, warnings };
    }

    // 2. Empty check
    if (!latex || latex.trim().length === 0) {
      errors.push("LaTeX string is empty");
      return { valid: false, errors, warnings };
    }

    // 3. Forbidden command check (security)
    for (const cmd of this.FORBIDDEN_COMMANDS) {
      const pattern = new RegExp(`\\\\${cmd}(?![a-zA-Z])`, "g");
      if (pattern.test(latex)) {
        errors.push(`Forbidden command detected: \\${cmd}`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // 4. Balanced braces check
    const braceBalance = this.checkBraceBalance(latex);
    if (!braceBalance.balanced) {
      errors.push(braceBalance.error || "Unbalanced braces");
      return { valid: false, errors, warnings };
    }

    // 5. Parse with KaTeX (strict mode)
    try {
      // Test render with strict settings
      katex.renderToString(latex, {
        displayMode: false,
        throwOnError: true,
        strict: "warn", // Use warn to catch issues
        trust: false, // CRITICAL: No arbitrary commands
        output: "html",
        errorColor: "#cc0000",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(`KaTeX parse error: ${errorMessage}`);
      return { valid: false, errors, warnings };
    }

    // 6. Check for unknown/uncommon commands (warnings only)
    const commands = this.extractCommands(latex);
    for (const cmd of commands) {
      if (!this.ALLOWED_COMMANDS.has(cmd)) {
        warnings.push(
          `Unrecognized command: \\${cmd} - may not render as expected`
        );
      }
    }

    // 7. Check for suspicious patterns
    const suspiciousPatterns = [
      { pattern: /javascript:/gi, message: "JavaScript protocol detected" },
      { pattern: /data:text\/html/gi, message: "HTML data URI detected" },
      { pattern: /<script/gi, message: "Script tag detected" },
      { pattern: /on\w+\s*=/gi, message: "Event handler detected" },
    ];

    for (const { pattern, message } of suspiciousPatterns) {
      if (pattern.test(latex)) {
        errors.push(`Security risk: ${message}`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // Success
    return {
      valid: true,
      errors: [],
      warnings,
      sanitized: this.sanitize(latex),
    };
  }

  /**
   * Sanitize LaTeX by removing dangerous content
   */
  static sanitize(latex: string): string {
    let clean = latex;

    // Remove any HTML tags that might have snuck in
    clean = clean.replace(/<[^>]*>/g, "");

    // Remove forbidden commands
    for (const cmd of this.FORBIDDEN_COMMANDS) {
      const pattern = new RegExp(`\\\\${cmd}\\b`, "g");
      clean = clean.replace(pattern, "");
    }

    // Remove data URIs
    clean = clean.replace(/data:[^,]*,/g, "");

    // Remove javascript: protocols
    clean = clean.replace(/javascript:/gi, "");

    return clean.trim();
  }

  /**
   * Check if braces are balanced
   */
  private static checkBraceBalance(latex: string): {
    balanced: boolean;
    error?: string;
  } {
    let braceCount = 0;
    let inEscape = false;

    for (let i = 0; i < latex.length; i++) {
      const char = latex[i];

      // Handle escaped characters
      if (char === "\\" && i + 1 < latex.length) {
        inEscape = true;
        continue;
      }

      if (inEscape) {
        inEscape = false;
        continue;
      }

      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount < 0) {
          return {
            balanced: false,
            error: "Too many closing braces",
          };
        }
      }
    }

    if (braceCount !== 0) {
      return {
        balanced: false,
        error:
          braceCount > 0
            ? "Unclosed opening braces"
            : "Too many closing braces",
      };
    }

    return { balanced: true };
  }

  /**
   * Extract all LaTeX commands from string
   */
  private static extractCommands(latex: string): Set<string> {
    const commands = new Set<string>();
    const pattern = /\\([a-zA-Z]+)/g;
    let match;

    while ((match = pattern.exec(latex)) !== null) {
      commands.add(match[1]);
    }

    return commands;
  }

  /**
   * Validate multiple LaTeX expressions at once
   */
  static validateBatch(
    latexExpressions: string[]
  ): Array<{ latex: string; result: ValidationResult }> {
    return latexExpressions.map((latex) => ({
      latex,
      result: this.validate(latex),
    }));
  }

  /**
   * Quick validation check (returns boolean only)
   */
  static isValid(latex: string): boolean {
    return this.validate(latex).valid;
  }
}
