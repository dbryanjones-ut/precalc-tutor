/**
 * Enhanced AI Response Validator
 *
 * Extends the base validator with:
 * - Mathematical claim extraction
 * - Fact-checking against reference materials
 * - Advanced hallucination detection
 * - Self-verification prompts
 */

import { AIResponseValidator } from "./response-validator";
import { ContextBuilder } from "./context-builder";
import type { Citation } from "@/types";

interface MathematicalClaim {
  type: "formula" | "theorem" | "property" | "definition" | "fact";
  statement: string;
  context: string;
  requiresVerification: boolean;
  confidence: number;
}

interface FactCheckResult {
  verified: boolean;
  source?: string;
  confidence: number;
  issues?: string[];
}

interface EnhancedValidation {
  baseValidation: Awaited<ReturnType<typeof AIResponseValidator.validate>>;
  claims: MathematicalClaim[];
  factChecks: Map<string, FactCheckResult>;
  overallTrustScore: number; // 0-100
  recommendAction: "accept" | "review" | "reject";
}

/**
 * Enhanced Response Validator with fact-checking
 */
export class EnhancedResponseValidator {
  /**
   * Extract mathematical claims from response
   */
  static extractClaims(content: string): MathematicalClaim[] {
    const claims: MathematicalClaim[] = [];

    // Pattern: Formula/theorem statements
    const formulaPattern = /(?:formula|identity|property|rule):\s*([^.]+)/gi;
    let match;

    while ((match = formulaPattern.exec(content)) !== null) {
      claims.push({
        type: "formula",
        statement: match[1].trim(),
        context: match[0],
        requiresVerification: true,
        confidence: 0.5,
      });
    }

    // Pattern: "Always" or "Never" statements (absolute claims)
    const absolutePattern = /(always|never|all|every|no)\s+([^.!?]+[.!?])/gi;
    while ((match = absolutePattern.exec(content)) !== null) {
      claims.push({
        type: "fact",
        statement: match[0].trim(),
        context: match[0],
        requiresVerification: true,
        confidence: 0.6,
      });
    }

    // Pattern: Definition statements
    const definitionPattern = /(?:is defined as|definition:|means that)\s+([^.]+)/gi;
    while ((match = definitionPattern.exec(content)) !== null) {
      claims.push({
        type: "definition",
        statement: match[1].trim(),
        context: match[0],
        requiresVerification: true,
        confidence: 0.7,
      });
    }

    // Pattern: Theorem references
    const theoremPattern = /(?:theorem|lemma|corollary|axiom)\s*:?\s*([^.]+)/gi;
    while ((match = theoremPattern.exec(content)) !== null) {
      claims.push({
        type: "theorem",
        statement: match[1].trim(),
        context: match[0],
        requiresVerification: true,
        confidence: 0.5,
      });
    }

    // Pattern: Specific formulas in LaTeX
    const latexPattern = /\\\[(\\\(.*?\\\)|[^\]]+)\\\]/g;
    while ((match = latexPattern.exec(content)) !== null) {
      // Check if this looks like a named formula
      const prevText = content.substring(
        Math.max(0, match.index - 50),
        match.index
      );

      if (
        /formula|identity|property|equals|theorem/i.test(prevText)
      ) {
        claims.push({
          type: "formula",
          statement: match[0],
          context: prevText + match[0],
          requiresVerification: true,
          confidence: 0.6,
        });
      }
    }

    return claims;
  }

  /**
   * Fact-check a mathematical claim against reference materials
   */
  static async factCheck(claim: MathematicalClaim): Promise<FactCheckResult> {
    // For formulas, check against notation table
    if (claim.type === "formula") {
      const result = await this.checkAgainstNotationTable(claim);
      if (result.verified) return result;
    }

    // For definitions, check against golden words
    if (claim.type === "definition") {
      const result = await this.checkAgainstGoldenWords(claim);
      if (result.verified) return result;
    }

    // Check for common mistakes being taught
    const mistakeCheck = await this.checkAgainstCommonMistakes(claim);
    if (mistakeCheck.issues && mistakeCheck.issues.length > 0) {
      return {
        verified: false,
        confidence: 0.1,
        issues: mistakeCheck.issues,
      };
    }

    // If we can't verify, mark as unverified
    return {
      verified: false,
      confidence: 0.5,
      issues: ["Could not verify claim against reference materials"],
    };
  }

  /**
   * Check claim against notation table
   */
  private static async checkAgainstNotationTable(
    claim: MathematicalClaim
  ): Promise<FactCheckResult> {
    // Extract notation symbols from claim
    const notationPatterns = [
      /f\^{?-1}?\(x\)/g, // inverse function
      /\\sin\^{?-1}?|\\arcsin/g, // arcsin
      /\\cos\^{?-1}?|\\arccos/g, // arccos
      /\\ln/g, // natural log
      /\\log(?!_)/g, // common log
      /\\lim/g, // limit
      /f'|\\frac{dy}{dx}/g, // derivative
    ];

    try {
      const notationTable = await fetch("/data/reference/notation-table.json")
        .then((r) => r.json())
        .catch(() => null);

      if (!notationTable) {
        return { verified: false, confidence: 0.5 };
      }

      // Check if claim matches any notation entry
      for (const entry of notationTable.notations || []) {
        const notationLower = entry.notation.toLowerCase();
        const claimLower = claim.statement.toLowerCase();

        // Check if notation appears in claim
        if (claimLower.includes(notationLower) || claim.context.includes(entry.notation)) {
          // Check if meaning aligns
          const meaningWords = entry.meaning.toLowerCase().split(/\s+/);
          const matchingWords = meaningWords.filter((word: string) =>
            claimLower.includes(word)
          );

          if (matchingWords.length >= 3) {
            return {
              verified: true,
              source: `Notation Table: ${entry.id}`,
              confidence: 0.8,
            };
          }

          // Check if it's teaching the WRONG thing (confused with)
          if (entry.confusedWith && claimLower.includes(entry.confusedWith.toLowerCase())) {
            return {
              verified: false,
              confidence: 0.2,
              issues: [
                `Claim may be confusing ${entry.notation} with ${entry.confusedWith}`,
                `Trap: ${entry.trap}`,
              ],
            };
          }
        }
      }
    } catch (error) {
      console.error("Error checking notation table:", error);
    }

    return { verified: false, confidence: 0.5 };
  }

  /**
   * Check claim against golden words
   */
  private static async checkAgainstGoldenWords(
    claim: MathematicalClaim
  ): Promise<FactCheckResult> {
    try {
      const goldenWords = await fetch("/data/reference/golden-words.json")
        .then((r) => r.json())
        .catch(() => null);

      if (!goldenWords) {
        return { verified: false, confidence: 0.5 };
      }

      // Check all categories
      for (const [category, data] of Object.entries(goldenWords.categories || {})) {
        const terms = (data as any).terms || [];

        for (const wordEntry of terms) {
          const term = wordEntry.term.toLowerCase();
          const claimLower = claim.statement.toLowerCase();

          // Check if term appears in claim
          if (claimLower.includes(term)) {
            return {
              verified: true,
              source: `Golden Words: ${wordEntry.term}`,
              confidence: 0.75,
            };
          }

          // Check if using vague language instead of precise term
          if (wordEntry.vagueTerm && claimLower.includes(wordEntry.vagueTerm.toLowerCase())) {
            return {
              verified: false,
              confidence: 0.4,
              issues: [
                `Using vague language "${wordEntry.vagueTerm}" instead of precise term "${wordEntry.term}"`,
              ],
            };
          }
        }
      }
    } catch (error) {
      console.error("Error checking golden words:", error);
    }

    return { verified: false, confidence: 0.5 };
  }

  /**
   * Check if claim teaches a common mistake
   */
  private static async checkAgainstCommonMistakes(
    claim: MathematicalClaim
  ): Promise<FactCheckResult> {
    try {
      const mistakes = await fetch("/data/reference/common-mistakes.json")
        .then((r) => r.json())
        .catch(() => null);

      if (!mistakes) {
        return { verified: true, confidence: 0.5 };
      }

      const issues: string[] = [];

      // Check all categories
      for (const [category, data] of Object.entries(mistakes.categories || {})) {
        const mistakesList = (data as any).mistakes || [];

        for (const mistake of mistakesList) {
          const mistakePattern = mistake.mistake.toLowerCase();
          const claimLower = claim.statement.toLowerCase();

          // Check if claim contains the common mistake
          if (this.containsPattern(claimLower, mistakePattern)) {
            issues.push(
              `CRITICAL: Response may be teaching common mistake "${mistake.id}"`,
              `Wrong: ${mistake.mistake}`,
              `Correct: ${mistake.correct}`,
              `Explanation: ${mistake.explanation}`
            );
          }
        }
      }

      if (issues.length > 0) {
        return {
          verified: false,
          confidence: 0.1,
          issues,
        };
      }

      return { verified: true, confidence: 0.7 };
    } catch (error) {
      console.error("Error checking common mistakes:", error);
      return { verified: true, confidence: 0.5 };
    }
  }

  /**
   * Check if text contains a pattern (flexible matching)
   */
  private static containsPattern(text: string, pattern: string): boolean {
    // Remove LaTeX commands and special chars for comparison
    const cleanText = text.replace(/\\[a-z]+/g, "").replace(/[{}()]/g, "");
    const cleanPattern = pattern.replace(/\\[a-z]+/g, "").replace(/[{}()]/g, "");

    // Check for substantial overlap
    const patternWords = cleanPattern.split(/\s+/).filter((w) => w.length > 2);
    const matchingWords = patternWords.filter((word) =>
      cleanText.includes(word)
    );

    // If most words match, consider it a match
    return matchingWords.length >= Math.ceil(patternWords.length * 0.6);
  }

  /**
   * Validate response with fact-checking
   */
  static async validateWithFactChecking(
    response: {
      content: string;
      latex?: string[];
      citations?: Citation[];
    }
  ): Promise<EnhancedValidation> {
    // Run base validation
    const baseValidation = await AIResponseValidator.validate(response);

    // Extract claims
    const claims = this.extractClaims(response.content);

    // Fact-check each claim
    const factChecks = new Map<string, FactCheckResult>();

    for (const claim of claims) {
      const result = await this.factCheck(claim);
      factChecks.set(claim.statement, result);

      // Add issues to base validation
      if (result.issues && result.issues.length > 0) {
        result.issues.forEach((issue) => {
          if (issue.includes("CRITICAL")) {
            baseValidation.errors.push(issue);
          } else {
            baseValidation.warnings.push(issue);
          }
        });
      }
    }

    // Calculate overall trust score
    let trustScore = baseValidation.confidence * 100;

    // Reduce trust for unverified claims
    const unverifiedClaims = Array.from(factChecks.values()).filter(
      (fc) => !fc.verified
    );
    if (unverifiedClaims.length > 0) {
      trustScore *= 0.8;
    }

    // Severely reduce trust for claims that match common mistakes
    const criticalIssues = Array.from(factChecks.values()).filter(
      (fc) => fc.issues?.some((i) => i.includes("CRITICAL"))
    );
    if (criticalIssues.length > 0) {
      trustScore *= 0.3;
    }

    // Determine recommendation
    let recommendAction: "accept" | "review" | "reject";
    if (trustScore >= 80 && baseValidation.valid && !baseValidation.requiresHumanReview) {
      recommendAction = "accept";
    } else if (trustScore >= 50 || criticalIssues.length === 0) {
      recommendAction = "review";
    } else {
      recommendAction = "reject";
    }

    return {
      baseValidation,
      claims,
      factChecks,
      overallTrustScore: Math.max(0, Math.min(100, trustScore)),
      recommendAction,
    };
  }

  /**
   * Generate validation report for human review
   */
  static generateValidationReport(validation: EnhancedValidation): string {
    let report = "# AI Response Validation Report\n\n";

    report += `**Overall Trust Score**: ${validation.overallTrustScore.toFixed(1)}/100\n`;
    report += `**Recommendation**: ${validation.recommendAction.toUpperCase()}\n`;
    report += `**Base Confidence**: ${(validation.baseValidation.confidence * 100).toFixed(1)}%\n`;
    report += `**Risk Level**: ${validation.baseValidation.riskLevel}\n\n`;

    // Errors
    if (validation.baseValidation.errors.length > 0) {
      report += "## Errors\n";
      validation.baseValidation.errors.forEach((error, i) => {
        report += `${i + 1}. ${error}\n`;
      });
      report += "\n";
    }

    // Warnings
    if (validation.baseValidation.warnings.length > 0) {
      report += "## Warnings\n";
      validation.baseValidation.warnings.forEach((warning, i) => {
        report += `${i + 1}. ${warning}\n`;
      });
      report += "\n";
    }

    // Claims
    if (validation.claims.length > 0) {
      report += "## Mathematical Claims\n";
      validation.claims.forEach((claim, i) => {
        const factCheck = validation.factChecks.get(claim.statement);
        const status = factCheck?.verified ? "✓ Verified" : "⚠ Unverified";

        report += `${i + 1}. [${claim.type}] ${status}\n`;
        report += `   Statement: ${claim.statement}\n`;

        if (factCheck?.source) {
          report += `   Source: ${factCheck.source}\n`;
        }

        if (factCheck?.issues && factCheck.issues.length > 0) {
          report += `   Issues:\n`;
          factCheck.issues.forEach((issue) => {
            report += `   - ${issue}\n`;
          });
        }

        report += "\n";
      });
    }

    // LaTeX validations
    if (validation.baseValidation.latexValidations.length > 0) {
      report += "## LaTeX Validations\n";
      validation.baseValidation.latexValidations.forEach((lv, i) => {
        const status = lv.valid ? "✓" : "✗";
        report += `${i + 1}. ${status} \`${lv.latex}\`\n`;
        if (lv.errors) {
          lv.errors.forEach((err) => {
            report += `   - ${err}\n`;
          });
        }
      });
      report += "\n";
    }

    return report;
  }
}
