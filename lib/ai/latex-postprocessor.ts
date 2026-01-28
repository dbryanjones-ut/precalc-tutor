/**
 * LaTeX Post-Processor
 *
 * Cleans up and validates LaTeX output from AI responses to ensure
 * proper rendering in KaTeX. Fixes common AI mistakes automatically.
 *
 * CRITICAL: This runs BEFORE extraction to ensure clean LaTeX reaches the frontend
 */

export interface LaTeXIssue {
  type: 'error' | 'warning';
  message: string;
  line?: number;
  original?: string;
  fixed?: string;
}

export interface PostProcessResult {
  cleaned: string;
  issues: LaTeXIssue[];
  changed: boolean;
}

/**
 * Post-process AI-generated LaTeX to fix common issues
 */
export class LaTeXPostProcessor {

  /**
   * Process the entire AI response and fix LaTeX issues
   * This is the main entry point - applies all fixes in order
   */
  static processResponse(content: string): PostProcessResult {
    let cleaned = content;
    const issues: LaTeXIssue[] = [];
    const initialContent = content;

    // Step 1: Remove question marks from math expressions (CRITICAL FIX)
    const questionMarkResult = this.removeQuestionMarksFromMath(cleaned);
    cleaned = questionMarkResult.cleaned;
    issues.push(...questionMarkResult.issues);

    // Step 2: Replace Unicode symbols with LaTeX commands (both inside and outside delimiters)
    const unicodeResult = this.replaceUnicodeSymbols(cleaned);
    cleaned = unicodeResult.cleaned;
    issues.push(...unicodeResult.issues);

    // Step 3: Fix delimiter types (replace \( \) and \[ \] with $ and $$)
    const delimiterResult = this.fixDelimiters(cleaned);
    cleaned = delimiterResult.cleaned;
    issues.push(...delimiterResult.issues);

    // Step 4: Ensure display math is on its own line
    const displayResult = this.fixDisplayMathLayout(cleaned);
    cleaned = displayResult.cleaned;
    issues.push(...displayResult.issues);

    // Step 5: Final validation check
    const validationIssues = this.detectRemainingIssues(cleaned);
    issues.push(...validationIssues);

    return {
      cleaned,
      issues,
      changed: cleaned !== initialContent,
    };
  }

  /**
   * CRITICAL: Remove question marks from math expressions
   * These are placeholders the AI shouldn't use
   */
  private static removeQuestionMarksFromMath(content: string): PostProcessResult {
    let cleaned = content;
    const issues: LaTeXIssue[] = [];
    let changesMade = false;

    // Pattern 1: Question marks in inline math $..?...$
    const inlineQuestionPattern = /\$([^$]*?)\?([^$]*?)\$/g;
    const inlineMatches = [...cleaned.matchAll(inlineQuestionPattern)];

    if (inlineMatches.length > 0) {
      inlineMatches.forEach(match => {
        const original = match[0];
        // Remove the question mark - if it's a placeholder pattern like (?)
        // just remove the whole (?) part
        let fixed = original.replace(/\(\?\)/g, '\\square'); // Use LaTeX square placeholder
        fixed = fixed.replace(/\?/g, ''); // Remove any remaining ?

        cleaned = cleaned.replace(original, fixed);
        issues.push({
          type: 'warning',
          message: `Removed question mark placeholder from: ${original}`,
          original,
          fixed,
        });
      });
      changesMade = true;
    }

    // Pattern 2: Question marks in display math $$..?...$$
    const displayQuestionPattern = /\$\$([^$]*?)\?([^$]*?)\$\$/g;
    const displayMatches = [...cleaned.matchAll(displayQuestionPattern)];

    if (displayMatches.length > 0) {
      displayMatches.forEach(match => {
        const original = match[0];
        let fixed = original.replace(/\(\?\)/g, '\\square');
        fixed = fixed.replace(/\?/g, '');

        cleaned = cleaned.replace(original, fixed);
        issues.push({
          type: 'warning',
          message: `Removed question mark placeholder from display math: ${original.substring(0, 50)}`,
          original,
          fixed,
        });
      });
      changesMade = true;
    }

    return { cleaned, issues, changed: changesMade };
  }

  /**
   * Replace Unicode symbols with LaTeX commands
   * Handles both inside and outside math delimiters
   */
  private static replaceUnicodeSymbols(content: string): PostProcessResult {
    let cleaned = content;
    const issues: LaTeXIssue[] = [];
    let changesMade = false;

    // Define all Unicode symbol replacements
    const symbolReplacements: Array<{
      unicode: string;
      latex: string;
      name: string;
      insidePattern: RegExp;
      outsidePattern: RegExp;
    }> = [
      {
        unicode: '·',
        latex: '\\cdot',
        name: 'middle dot',
        insidePattern: /(\$[^$]*?)·([^$]*?\$)/g,
        outsidePattern: /·/g,
      },
      {
        unicode: '±',
        latex: '\\pm',
        name: 'plus-minus',
        insidePattern: /(\$[^$]*?)±([^$]*?\$)/g,
        outsidePattern: /±/g,
      },
      {
        unicode: 'π',
        latex: '\\pi',
        name: 'pi',
        insidePattern: /(\$[^$]*?)π([^$]*?\$)/g,
        outsidePattern: /(?<!\$)π(?!\$)/g,
      },
      {
        unicode: 'θ',
        latex: '\\theta',
        name: 'theta',
        insidePattern: /(\$[^$]*?)θ([^$]*?\$)/g,
        outsidePattern: /(?<!\$)θ(?!\$)/g,
      },
      {
        unicode: 'α',
        latex: '\\alpha',
        name: 'alpha',
        insidePattern: /(\$[^$]*?)α([^$]*?\$)/g,
        outsidePattern: /(?<!\$)α(?!\$)/g,
      },
      {
        unicode: 'β',
        latex: '\\beta',
        name: 'beta',
        insidePattern: /(\$[^$]*?)β([^$]*?\$)/g,
        outsidePattern: /(?<!\$)β(?!\$)/g,
      },
      {
        unicode: '∞',
        latex: '\\infty',
        name: 'infinity',
        insidePattern: /(\$[^$]*?)∞([^$]*?\$)/g,
        outsidePattern: /(?<!\$)∞(?!\$)/g,
      },
      {
        unicode: '≤',
        latex: '\\leq',
        name: 'less-than-or-equal',
        insidePattern: /(\$[^$]*?)≤([^$]*?\$)/g,
        outsidePattern: /(?<!\$)≤(?!\$)/g,
      },
      {
        unicode: '≥',
        latex: '\\geq',
        name: 'greater-than-or-equal',
        insidePattern: /(\$[^$]*?)≥([^$]*?\$)/g,
        outsidePattern: /(?<!\$)≥(?!\$)/g,
      },
      {
        unicode: '×',
        latex: '\\times',
        name: 'times',
        insidePattern: /(\$[^$]*?)×([^$]*?\$)/g,
        outsidePattern: /(?<!\$)×(?!\$)/g,
      },
      {
        unicode: '÷',
        latex: '\\div',
        name: 'division',
        insidePattern: /(\$[^$]*?)÷([^$]*?\$)/g,
        outsidePattern: /(?<!\$)÷(?!\$)/g,
      },
      {
        unicode: '≠',
        latex: '\\neq',
        name: 'not-equal',
        insidePattern: /(\$[^$]*?)≠([^$]*?\$)/g,
        outsidePattern: /(?<!\$)≠(?!\$)/g,
      },
    ];

    // Process each symbol type
    for (const symbol of symbolReplacements) {
      // First: Replace inside math delimiters
      let iterationCount = 0;
      const maxIterations = 10;

      while (iterationCount < maxIterations) {
        const before = cleaned;
        cleaned = cleaned.replace(symbol.insidePattern, `$1${symbol.latex}$2`);
        if (cleaned === before) break;
        iterationCount++;
      }

      if (iterationCount > 0) {
        issues.push({
          type: 'warning',
          message: `Replaced ${iterationCount} occurrence(s) of plain ${symbol.name} (${symbol.unicode}) with ${symbol.latex} inside math delimiters`,
        });
        changesMade = true;
      }

      // Second: Wrap standalone symbols with delimiters
      if (symbol.outsidePattern.test(cleaned)) {
        const beforeWrap = cleaned;
        cleaned = cleaned.replace(symbol.outsidePattern, `$${symbol.latex}$`);

        if (cleaned !== beforeWrap) {
          issues.push({
            type: 'warning',
            message: `Wrapped standalone ${symbol.name} symbol (${symbol.unicode}) with math delimiters`,
          });
          changesMade = true;
        }
      }
    }

    return { cleaned, issues, changed: changesMade };
  }

  /**
   * Fix wrong delimiter types
   */
  private static fixDelimiters(content: string): PostProcessResult {
    let cleaned = content;
    const issues: LaTeXIssue[] = [];
    let changesMade = false;

    // Replace \( \) with $ $
    const parenPattern = /\\\(([^)]+?)\\\)/g;
    if (parenPattern.test(cleaned)) {
      const before = cleaned;
      cleaned = cleaned.replace(parenPattern, '$$$1$$');

      if (cleaned !== before) {
        issues.push({
          type: 'warning',
          message: 'Replaced \\( \\) delimiters with $ $',
        });
        changesMade = true;
      }
    }

    // Replace \[ \] with $$ $$
    const bracketPattern = /\\\[([^\]]+?)\\\]/g;
    if (bracketPattern.test(cleaned)) {
      const before = cleaned;
      cleaned = cleaned.replace(bracketPattern, '\n\n$$$$$1$$$$\n\n');

      if (cleaned !== before) {
        issues.push({
          type: 'warning',
          message: 'Replaced \\[ \\] delimiters with $$ $$',
        });
        changesMade = true;
      }
    }

    return { cleaned, issues, changed: changesMade };
  }

  /**
   * Ensure display math is on its own line with blank lines before/after
   */
  private static fixDisplayMathLayout(content: string): PostProcessResult {
    let cleaned = content;
    const issues: LaTeXIssue[] = [];
    let changesMade = false;

    // Pattern: text$$ or $$text (should have blank lines)
    const inlineDisplayPattern = /([^\n])\$\$([^$]+?)\$\$([^\n])/g;

    if (inlineDisplayPattern.test(cleaned)) {
      const before = cleaned;
      cleaned = cleaned.replace(inlineDisplayPattern, '$1\n\n$$$$$2$$$$\n\n$3');

      if (cleaned !== before) {
        issues.push({
          type: 'warning',
          message: 'Fixed display math to be on its own line with blank lines',
        });
        changesMade = true;
      }
    }

    return { cleaned, issues, changed: changesMade };
  }

  /**
   * Detect any remaining issues that couldn't be auto-fixed
   */
  private static detectRemainingIssues(content: string): LaTeXIssue[] {
    const issues: LaTeXIssue[] = [];

    // Check for remaining question marks in math
    const questionMarksInMath = content.match(/\$[^$]*?\?[^$]*?\$/g);
    if (questionMarksInMath && questionMarksInMath.length > 0) {
      issues.push({
        type: 'error',
        message: `Still found ${questionMarksInMath.length} question mark(s) in math expressions after post-processing`,
        original: questionMarksInMath[0],
      });
    }

    // Check for remaining Unicode symbols
    const unicodeSymbolsRegex = /\$[^$]*?[·±π≤≥×÷∞θαβ≠][^$]*?\$/g;
    const remainingUnicode = content.match(unicodeSymbolsRegex);
    if (remainingUnicode && remainingUnicode.length > 0) {
      issues.push({
        type: 'error',
        message: `Still found ${remainingUnicode.length} Unicode symbol(s) in math expressions after post-processing`,
        original: remainingUnicode[0],
      });
    }

    // Check for wrong delimiters
    if (content.includes('\\(') || content.includes('\\)')) {
      issues.push({
        type: 'error',
        message: 'Still found \\( \\) delimiters after post-processing',
      });
    }

    if (content.includes('\\[') || content.includes('\\]')) {
      issues.push({
        type: 'error',
        message: 'Still found \\[ \\] delimiters after post-processing',
      });
    }

    return issues;
  }

  /**
   * Validate that a math expression doesn't contain problematic patterns
   * Used for individual expressions after extraction
   */
  static validateExpression(latex: string): LaTeXIssue[] {
    const issues: LaTeXIssue[] = [];

    // Check for plain text Unicode symbols
    const unicodeSymbols = [
      { symbol: '·', correct: '\\cdot', name: 'middle dot' },
      { symbol: '±', correct: '\\pm', name: 'plus-minus' },
      { symbol: 'π', correct: '\\pi', name: 'pi' },
      { symbol: 'θ', correct: '\\theta', name: 'theta' },
      { symbol: '≤', correct: '\\leq', name: 'less than or equal' },
      { symbol: '≥', correct: '\\geq', name: 'greater than or equal' },
      { symbol: '∞', correct: '\\infty', name: 'infinity' },
      { symbol: '×', correct: '\\times', name: 'times' },
      { symbol: '÷', correct: '\\div', name: 'division' },
      { symbol: '≠', correct: '\\neq', name: 'not equal' },
      { symbol: 'α', correct: '\\alpha', name: 'alpha' },
      { symbol: 'β', correct: '\\beta', name: 'beta' },
    ];

    for (const { symbol, correct, name } of unicodeSymbols) {
      if (latex.includes(symbol)) {
        issues.push({
          type: 'error',
          message: `Contains plain text ${name} symbol "${symbol}" - should use ${correct}`,
          original: latex,
        });
      }
    }

    // Check for question marks
    if (latex.includes('?')) {
      issues.push({
        type: 'error',
        message: 'Contains question mark (?) - should use complete expressions',
        original: latex,
      });
    }

    // Check for wrong delimiters (shouldn't be in extracted latex, but check anyway)
    if (latex.includes('\\(') || latex.includes('\\)')) {
      issues.push({
        type: 'error',
        message: 'Uses \\( \\) delimiters - should use $ $',
        original: latex,
      });
    }

    if (latex.includes('\\[') || latex.includes('\\]')) {
      issues.push({
        type: 'error',
        message: 'Uses \\[ \\] delimiters - should use $$ $$',
        original: latex,
      });
    }

    return issues;
  }

  /**
   * Generate a report of all issues found
   */
  static generateReport(result: PostProcessResult): string {
    if (result.issues.length === 0) {
      return 'No LaTeX issues found. All expressions should render correctly.';
    }

    const errors = result.issues.filter(i => i.type === 'error');
    const warnings = result.issues.filter(i => i.type === 'warning');

    let report = '';

    if (errors.length > 0) {
      report += `ERRORS (${errors.length}):\n`;
      errors.forEach((error, idx) => {
        report += `${idx + 1}. ${error.message}\n`;
        if (error.original) {
          report += `   Original: ${error.original.substring(0, 100)}\n`;
        }
        if (error.fixed) {
          report += `   Fixed: ${error.fixed.substring(0, 100)}\n`;
        }
      });
      report += '\n';
    }

    if (warnings.length > 0) {
      report += `WARNINGS (${warnings.length}):\n`;
      warnings.forEach((warning, idx) => {
        report += `${idx + 1}. ${warning.message}\n`;
        if (warning.fixed) {
          report += `   Fixed to: ${warning.fixed.substring(0, 100)}\n`;
        }
      });
    }

    return report;
  }
}
