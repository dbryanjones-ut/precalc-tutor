/**
 * LaTeX Post-Processor
 *
 * Cleans up and validates LaTeX output from AI responses to ensure
 * proper rendering in KaTeX. Fixes common AI mistakes automatically.
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
   */
  static processResponse(content: string): PostProcessResult {
    let cleaned = content;
    const issues: LaTeXIssue[] = [];
    let changed = false;

    // 1. Replace plain text Unicode symbols with LaTeX commands
    // Process each replacement multiple times to ensure we get all occurrences
    const unicodeReplacements: Array<[RegExp, string, string]> = [
      // Middle dot (multiplication)
      [/(\$[^$]*?)·([^$]*?\$)/g, '\\cdot', 'Replaced plain text · with \\cdot'],
      // Plus-minus
      [/(\$[^$]*?)±([^$]*?\$)/g, '\\pm', 'Replaced plain text ± with \\pm'],
      // Pi (both inside and outside dollar signs for Pi at boundary)
      [/(\$[^$]*?)π([^$]*?\$)/g, '\\pi', 'Replaced plain text π with \\pi'],
      // Theta
      [/(\$[^$]*?)θ([^$]*?\$)/g, '\\theta', 'Replaced plain text θ with \\theta'],
      // Alpha
      [/(\$[^$]*?)α([^$]*?\$)/g, '\\alpha', 'Replaced plain text α with \\alpha'],
      // Beta
      [/(\$[^$]*?)β([^$]*?\$)/g, '\\beta', 'Replaced plain text β with \\beta'],
      // Infinity
      [/(\$[^$]*?)∞([^$]*?\$)/g, '\\infty', 'Replaced plain text ∞ with \\infty'],
      // Less than or equal
      [/(\$[^$]*?)≤([^$]*?\$)/g, '\\leq', 'Replaced plain text ≤ with \\leq'],
      // Greater than or equal
      [/(\$[^$]*?)≥([^$]*?\$)/g, '\\geq', 'Replaced plain text ≥ with \\geq'],
      // Times symbol
      [/(\$[^$]*?)×([^$]*?\$)/g, '\\times', 'Replaced plain text × with \\times'],
      // Division symbol
      [/(\$[^$]*?)÷([^$]*?\$)/g, '\\div', 'Replaced plain text ÷ with \\div'],
    ];

    for (const [pattern, replacement, message] of unicodeReplacements) {
      let before = cleaned;
      // Keep replacing until no more matches (handles multiple occurrences in one expression)
      let iterationCount = 0;
      const maxIterations = 10; // Prevent infinite loops

      while (iterationCount < maxIterations) {
        before = cleaned;
        cleaned = cleaned.replace(pattern, `$1${replacement}$2`);
        if (cleaned === before) break;
        iterationCount++;
      }

      if (before !== content && !changed) {
        issues.push({ type: 'warning', message });
        changed = true;
      }
    }

    // Special case: replace plain text π outside of math mode by wrapping in $ $
    const plainPiPattern = /(?<!\$)π(?!\$)/g;
    if (plainPiPattern.test(cleaned)) {
      cleaned = cleaned.replace(plainPiPattern, '$\\pi$');
      issues.push({ type: 'warning', message: 'Wrapped plain text π with LaTeX delimiters' });
      changed = true;
    }

    // 2. Detect question marks used as placeholders in LaTeX
    const questionMarkPattern = /\$([^$]*?)\?([^$]*?)\$/g;
    if (questionMarkPattern.test(cleaned)) {
      issues.push({
        type: 'error',
        message: 'Found question marks (?) used as placeholders in LaTeX expressions',
        original: cleaned.match(questionMarkPattern)?.[0],
      });
      // Note: We don't auto-fix this as we don't know what the placeholder should be
      // But we flag it as an error
    }

    // 3. Replace \( \) delimiters with $ $
    const parenDelimiterPattern = /\\\(([^)]+?)\\\)/g;
    if (parenDelimiterPattern.test(cleaned)) {
      const before = cleaned;
      cleaned = cleaned.replace(parenDelimiterPattern, '$$$1$$');
      if (cleaned !== before) {
        issues.push({
          type: 'warning',
          message: 'Replaced \\( \\) delimiters with $ $',
        });
        changed = true;
      }
    }

    // 4. Replace \[ \] delimiters with $$ $$
    const bracketDelimiterPattern = /\\\[([^\]]+?)\\\]/g;
    if (bracketDelimiterPattern.test(cleaned)) {
      const before = cleaned;
      cleaned = cleaned.replace(bracketDelimiterPattern, '\n\n$$$$$1$$$$\n\n');
      if (cleaned !== before) {
        issues.push({
          type: 'warning',
          message: 'Replaced \\[ \\] delimiters with $$ $$',
        });
        changed = true;
      }
    }

    // 5. Fix display math that's not on its own line
    // Pattern: text$$ or $$text (should have blank lines)
    const inlineDisplayPattern = /([^\n])\$\$([^$]+?)\$\$([^\n])/g;
    if (inlineDisplayPattern.test(cleaned)) {
      cleaned = cleaned.replace(inlineDisplayPattern, '$1\n\n$$$$$2$$$$\n\n$3');
      issues.push({
        type: 'warning',
        message: 'Fixed display math to be on its own line with blank lines',
      });
      changed = true;
    }

    return {
      cleaned,
      issues,
      changed,
    };
  }

  /**
   * Validate that a math expression doesn't contain problematic patterns
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

    // Check for wrong delimiters
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
      });
      report += '\n';
    }

    if (warnings.length > 0) {
      report += `WARNINGS (${warnings.length}):\n`;
      warnings.forEach((warning, idx) => {
        report += `${idx + 1}. ${warning.message}\n`;
      });
    }

    return report;
  }
}
