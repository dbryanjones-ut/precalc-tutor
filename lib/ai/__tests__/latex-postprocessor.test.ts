/**
 * Tests for LaTeX Post-Processor
 *
 * Ensures that the post-processor correctly identifies and fixes
 * common LaTeX issues from AI responses.
 */

import { LaTeXPostProcessor } from '../latex-postprocessor';

describe('LaTeXPostProcessor', () => {
  describe('processResponse', () => {
    it('should fix plain text middle dot (·) to \\cdot', () => {
      const input = 'The expression $x · y$ is multiplication.';
      const result = LaTeXPostProcessor.processResponse(input);

      expect(result.cleaned).toBe('The expression $x \\cdot y$ is multiplication.');
      expect(result.changed).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should fix plain text plus-minus (±) to \\pm', () => {
      const input = 'The solution is $x ± 3$.';
      const result = LaTeXPostProcessor.processResponse(input);

      expect(result.cleaned).toBe('The solution is $x \\pm 3$.');
      expect(result.changed).toBe(true);
    });

    it('should fix plain text pi (π) to \\pi', () => {
      const input = 'The value of $π$ is approximately 3.14.';
      const result = LaTeXPostProcessor.processResponse(input);

      expect(result.cleaned).toBe('The value of $\\pi$ is approximately 3.14.');
      expect(result.changed).toBe(true);
    });

    it('should detect question marks in math expressions', () => {
      const input = 'Factor: $x \\cdot (?) + x \\cdot (?)$';
      const result = LaTeXPostProcessor.processResponse(input);

      // Should detect the issue
      const questionMarkIssues = result.issues.filter(i =>
        i.message.includes('question mark')
      );
      expect(questionMarkIssues.length).toBeGreaterThan(0);
    });

    it('should replace \\( \\) delimiters with $ $', () => {
      const input = 'The expression \\(x^2 + 5\\) is a polynomial.';
      const result = LaTeXPostProcessor.processResponse(input);

      expect(result.cleaned).toBe('The expression $x^2 + 5$ is a polynomial.');
      expect(result.changed).toBe(true);
    });

    it('should replace \\[ \\] delimiters with $$ $$', () => {
      const input = 'The formula is \\[x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\\]';
      const result = LaTeXPostProcessor.processResponse(input);

      expect(result.cleaned).toContain('$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$');
      expect(result.changed).toBe(true);
    });

    it('should fix display math not on its own line', () => {
      const input = 'Text$$(x + 2)(x + 3) = 0$$more text';
      const result = LaTeXPostProcessor.processResponse(input);

      expect(result.cleaned).toContain('\n\n$$');
      expect(result.cleaned).toContain('$$\n\n');
      expect(result.changed).toBe(true);
    });

    it('should fix multiple issues at once', () => {
      const input = 'The expression $x · y$ and $a ± b$ with π.';
      const result = LaTeXPostProcessor.processResponse(input);

      expect(result.cleaned).toBe('The expression $x \\cdot y$ and $a \\pm b$ with $\\pi$.');
      expect(result.changed).toBe(true);
      // We should have at least 2 warnings (one for · -> \cdot, one for ± -> \pm, and one for wrapping π)
      expect(result.issues.length).toBeGreaterThanOrEqual(2);
    });

    it('should not modify correct LaTeX', () => {
      const input = 'The expression $x \\cdot y + \\pi$ is correct.';
      const result = LaTeXPostProcessor.processResponse(input);

      expect(result.cleaned).toBe(input);
      expect(result.changed).toBe(false);
      expect(result.issues.length).toBe(0);
    });
  });

  describe('validateExpression', () => {
    it('should detect plain text Unicode symbols', () => {
      const issues = LaTeXPostProcessor.validateExpression('x · y');
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBe('error');
      expect(issues[0].message).toContain('middle dot');
    });

    it('should detect question marks', () => {
      const issues = LaTeXPostProcessor.validateExpression('x \\cdot (?)');
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.message.includes('question mark'))).toBe(true);
    });

    it('should detect wrong delimiters', () => {
      const issues1 = LaTeXPostProcessor.validateExpression('\\(x^2\\)');
      expect(issues1.some(i => i.message.includes('\\('))).toBe(true);

      const issues2 = LaTeXPostProcessor.validateExpression('\\[x^2\\]');
      expect(issues2.some(i => i.message.includes('\\['))).toBe(true);
    });

    it('should pass valid LaTeX expressions', () => {
      const issues = LaTeXPostProcessor.validateExpression('x \\cdot y + \\frac{a}{b}');
      expect(issues.length).toBe(0);
    });
  });

  describe('generateReport', () => {
    it('should generate report with errors and warnings', () => {
      const result = {
        cleaned: '',
        changed: true,
        issues: [
          { type: 'error' as const, message: 'Test error' },
          { type: 'warning' as const, message: 'Test warning' },
        ],
      };

      const report = LaTeXPostProcessor.generateReport(result);

      expect(report).toContain('ERRORS');
      expect(report).toContain('WARNINGS');
      expect(report).toContain('Test error');
      expect(report).toContain('Test warning');
    });

    it('should generate success message when no issues', () => {
      const result = {
        cleaned: '',
        changed: false,
        issues: [],
      };

      const report = LaTeXPostProcessor.generateReport(result);

      expect(report).toContain('No LaTeX issues found');
    });
  });

  describe('real-world problematic examples', () => {
    it('should fix the XY + X factoring example', () => {
      const input = '$XY + X = X · (?) + X · (?)$';
      const result = LaTeXPostProcessor.processResponse(input);

      // Should fix the middle dot
      expect(result.cleaned).toContain('\\cdot');
      expect(result.cleaned).not.toContain('·');

      // Should detect question marks as an issue
      expect(result.issues.some(i => i.message.includes('question mark'))).toBe(true);
    });

    it('should handle mixed plain text and LaTeX', () => {
      const input = 'For x ≥ 3 and θ = π/6, we have sin(θ) = 1/2';
      const result = LaTeXPostProcessor.processResponse(input);

      // Without $ delimiters, most symbols won't be fixed (which is correct behavior)
      // But we do fix plain π outside of math mode by wrapping it
      // This changed from expected false to true
      expect(result.changed).toBe(true); // π gets wrapped
      expect(result.cleaned).toContain('$\\pi$');
    });

    it('should fix complex expression with multiple issues', () => {
      const input = 'The inequality $x ≥ 3$ means $sin(π/6) = 1/2$ and $a · b ± c$';
      const result = LaTeXPostProcessor.processResponse(input);

      expect(result.cleaned).toContain('\\geq');
      expect(result.cleaned).toContain('\\pi');
      expect(result.cleaned).toContain('\\cdot');
      expect(result.cleaned).toContain('\\pm');
      expect(result.changed).toBe(true);
    });
  });
});
