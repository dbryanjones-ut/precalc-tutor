import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { MathRenderer, InlineMath, DisplayMath } from "./MathRenderer";
import userEvent from "@testing-library/user-event";

// Mock katex-helpers to avoid actual KaTeX rendering in tests
vi.mock("@/lib/math/katex-helpers", () => ({
  renderMath: vi.fn((latex: string, displayMode: boolean) => {
    return `<span class="katex-mock ${displayMode ? "display" : "inline"}" data-latex="${latex}">${latex}</span>`;
  }),
  generateAccessibleLabel: vi.fn((latex: string) => {
    return `Math: ${latex}`;
  }),
}));

describe("MathRenderer - LaTeX Rendering Accuracy", () => {
  describe("Inline Math Rendering", () => {
    it("should render simple inline math: $x + y$", () => {
      const { container } = render(<MathRenderer latex="x + y" displayMode={false} />);
      const mathElement = container.querySelector(".math-inline");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain("x + y");
    });

    it("should render inline math with superscripts: $x^2$", () => {
      const { container } = render(<MathRenderer latex="x^2" displayMode={false} />);
      const mathElement = container.querySelector(".math-inline");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain("x^2");
    });

    it("should render inline math with subscripts: $x_1$", () => {
      const { container } = render(<MathRenderer latex="x_1" displayMode={false} />);
      const mathElement = container.querySelector(".math-inline");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain("x_1");
    });

    it("should render inline math within text flow", () => {
      const { container } = render(
        <div>
          The equation <MathRenderer latex="x + y = 5" displayMode={false} /> is simple.
        </div>
      );
      const mathElement = container.querySelector(".math-inline");
      expect(mathElement).toBeInTheDocument();
    });

    it("should render multiple inline expressions independently", () => {
      const { container } = render(
        <div>
          <MathRenderer latex="x" displayMode={false} />
          <MathRenderer latex="y" displayMode={false} />
          <MathRenderer latex="z" displayMode={false} />
        </div>
      );
      const mathElements = container.querySelectorAll(".math-inline");
      expect(mathElements).toHaveLength(3);
    });
  });

  describe("Display Math Rendering", () => {
    it("should render display math: $$x^2$$", () => {
      const { container } = render(<MathRenderer latex="x^2" displayMode={true} />);
      const mathElement = container.querySelector(".math-display");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain("x^2");
    });

    it("should render centered display math blocks", () => {
      const { container } = render(<DisplayMath latex="x^2 + y^2 = r^2" />);
      const mathElement = container.querySelector(".math-display");
      expect(mathElement).toBeInTheDocument();
    });

    it("should render display math on separate block", () => {
      const { container } = render(
        <div>
          <p>Before</p>
          <MathRenderer latex="x^2" displayMode={true} />
          <p>After</p>
        </div>
      );
      const mathElement = container.querySelector(".math-display");
      expect(mathElement).toBeInTheDocument();
    });
  });

  describe("Complex LaTeX Expressions", () => {
    it("should render fractions: $\\frac{a}{b}$", () => {
      const { container } = render(<MathRenderer latex="\\frac{a}{b}" />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain("frac");
    });

    it("should render square roots: $\\sqrt{x}$", () => {
      const { container } = render(<MathRenderer latex="\\sqrt{x}" />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement).toHaveAttribute("data-latex", "\\sqrt{x}");
    });

    it("should render multiplication: $x \\cdot y$", () => {
      const { container } = render(<MathRenderer latex="x \\cdot y" />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement).toHaveAttribute("data-latex", "x \\cdot y");
    });

    it("should render nested expressions: $\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$", () => {
      const latex = "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain(latex.slice(0, 20)); // Check for part of latex
    });

    it("should render matrices", () => {
      const latex = "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}";
      const { container } = render(<MathRenderer latex={latex} displayMode={true} />);
      const mathElement = container.querySelector(".math-display");
      expect(mathElement).toBeInTheDocument();
    });

    it("should render integrals: $\\int_{0}^{\\infty} x^2 dx$", () => {
      const latex = "\\int_{0}^{\\infty} x^2 dx";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain(latex.slice(0, 20)); // Check for part of latex
    });

    it("should render summations: $\\sum_{i=1}^{n} i$", () => {
      const latex = "\\sum_{i=1}^{n} i";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain(latex.slice(0, 20)); // Check for part of latex
    });

    it("should render limits: $\\lim_{x \\to 0} \\frac{\\sin x}{x}$", () => {
      const latex = "\\lim_{x \\to 0} \\frac{\\sin x}{x}";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
    });
  });

  describe("Special Characters and Symbols", () => {
    it("should render Greek letters: $\\alpha, \\beta, \\gamma$", () => {
      const latex = "\\alpha, \\beta, \\gamma";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain(latex.slice(0, 20)); // Check for part of latex
    });

    it("should render infinity symbol: $\\infty$", () => {
      const { container } = render(<MathRenderer latex="\\infty" />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
    });

    it("should render partial derivatives: $\\frac{\\partial f}{\\partial x}$", () => {
      const latex = "\\frac{\\partial f}{\\partial x}";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
    });

    it("should render set notation: $x \\in \\mathbb{R}$", () => {
      const latex = "x \\in \\mathbb{R}";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
    });

    it("should render logical operators: $\\forall x, \\exists y$", () => {
      const latex = "\\forall x, \\exists y";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
    });

    it("should render arrows: $\\rightarrow, \\leftarrow, \\Rightarrow$", () => {
      const latex = "\\rightarrow, \\leftarrow, \\Rightarrow";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
    });

    it("should render trigonometric functions: $\\sin x, \\cos y, \\tan z$", () => {
      const latex = "\\sin x, \\cos y, \\tan z";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
    });

    it("should render logarithms: $\\log x, \\ln y$", () => {
      const latex = "\\log x, \\ln y";
      const { container } = render(<MathRenderer latex={latex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
    });
  });

  describe("Test Cases from LATEX_RENDERING_FIX.md", () => {
    it("should render $5^3 \\cdot 5^2 = 5^{3 + 2}$ inline", () => {
      const latex = "5^3 \\cdot 5^2 = 5^{3 + 2}";
      const { container } = render(<MathRenderer latex={latex} displayMode={false} />);
      const mathElement = container.querySelector(".math-inline");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain(latex.slice(0, 20)); // Check for part of latex
    });

    it("should render $XY + X = 7$ inline without line breaks", () => {
      const latex = "XY + X = 7";
      const { container } = render(
        <p>
          Consider the equation <MathRenderer latex={latex} displayMode={false} /> and solve.
        </p>
      );
      const mathElement = container.querySelector(".math-inline");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain(latex.slice(0, 20)); // Check for part of latex
    });

    it("should render display math in its own block: $$x^2 + y^2 = r^2$$", () => {
      const latex = "x^2 + y^2 = r^2";
      const { container } = render(<MathRenderer latex={latex} displayMode={true} />);
      const mathElement = container.querySelector(".math-display");
      expect(mathElement).toBeInTheDocument();
    });

    it("should handle mixed inline and display math", () => {
      const { container } = render(
        <div>
          <p>
            The formula <InlineMath latex="x^2" /> is simple.
          </p>
          <DisplayMath latex="x^2 + y^2 = r^2" />
          <p>
            This shows <InlineMath latex="r" /> is the radius.
          </p>
        </div>
      );
      const inlineMath = container.querySelectorAll(".math-inline");
      const displayMath = container.querySelectorAll(".math-display");
      expect(inlineMath).toHaveLength(2);
      expect(displayMath).toHaveLength(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty LaTeX string", () => {
      const { container } = render(<MathRenderer latex="" />);
      // Empty latex may be rejected by validator, but component should handle it
      expect(container).toBeTruthy();
    });

    it("should handle whitespace-only LaTeX", () => {
      const { container } = render(<MathRenderer latex="   " />);
      // Whitespace-only may be rejected by validator, but component should handle it
      expect(container).toBeTruthy();
    });

    it("should handle very long expressions", () => {
      const longLatex = "x_1 + x_2 + x_3 + x_4 + x_5 + x_6 + x_7 + x_8 + x_9 + x_{10}";
      const { container } = render(<MathRenderer latex={longLatex} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
    });

    it("should handle expressions with lots of nesting", () => {
      const nested = "\\frac{1}{\\frac{1}{\\frac{1}{x}}}";
      const { container } = render(<MathRenderer latex={nested} />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
    });

    it("should handle expressions with line breaks (display mode)", () => {
      const multiline = "x = 1 \\\\ y = 2 \\\\ z = 3";
      const { container } = render(<MathRenderer latex={multiline} displayMode={true} />);
      const mathElement = container.querySelector(".math-display");
      expect(mathElement).toBeInTheDocument();
    });
  });

  describe("Rendering Performance", () => {
    it("should memoize and not re-render with same props", () => {
      const { rerender } = render(<MathRenderer latex="x^2" />);
      const firstRender = screen.getByRole("img");

      rerender(<MathRenderer latex="x^2" />);
      const secondRender = screen.getByRole("img");

      expect(firstRender).toBe(secondRender);
    });

    it("should handle rapid prop changes", () => {
      const { rerender, container } = render(<MathRenderer latex="x^1" />);

      for (let i = 2; i <= 10; i++) {
        rerender(<MathRenderer latex={`x^${i}`} />);
      }

      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
      expect(mathElement?.innerHTML).toContain("x^10");
    });

    it("should handle switching between inline and display mode", () => {
      const { rerender, container } = render(
        <MathRenderer latex="x^2" displayMode={false} />
      );
      expect(container.querySelector(".math-inline")).toBeInTheDocument();

      rerender(<MathRenderer latex="x^2" displayMode={true} />);
      expect(container.querySelector(".math-display")).toBeInTheDocument();
    });
  });

  describe("Multiple Expressions on Same Page", () => {
    it("should render multiple inline expressions without conflicts", () => {
      const { container } = render(
        <div>
          <InlineMath latex="a^2" />
          <InlineMath latex="b^2" />
          <InlineMath latex="c^2" />
        </div>
      );
      const expressions = container.querySelectorAll(".math-inline");
      expect(expressions).toHaveLength(3);
    });

    it("should render multiple display expressions without conflicts", () => {
      const { container } = render(
        <div>
          <DisplayMath latex="x^2" />
          <DisplayMath latex="y^2" />
          <DisplayMath latex="z^2" />
        </div>
      );
      const expressions = container.querySelectorAll(".math-display");
      expect(expressions).toHaveLength(3);
    });

    it("should render complex mixed content", () => {
      const { container } = render(
        <div>
          <p>
            Inline: <InlineMath latex="x + y" />
          </p>
          <DisplayMath latex="x^2 + y^2 = r^2" />
          <p>
            More inline: <InlineMath latex="\\frac{a}{b}" />
          </p>
          <DisplayMath latex="\\int x dx" />
        </div>
      );
      expect(container.querySelectorAll(".math-inline")).toHaveLength(2);
      expect(container.querySelectorAll(".math-display")).toHaveLength(2);
    });
  });

  describe("Accessibility", () => {
    it("should have role='img' for screen readers", () => {
      render(<MathRenderer latex="x^2" />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should have descriptive aria-label", () => {
      render(<MathRenderer latex="\\frac{1}{2}" />);
      const element = screen.getByRole("img");
      expect(element).toHaveAttribute("aria-label");
      expect(element.getAttribute("aria-label")).toContain("Math:");
    });

    it("should generate different aria-labels for different expressions", () => {
      const { rerender } = render(<MathRenderer latex="x^2" />);
      const label1 = screen.getByRole("img").getAttribute("aria-label");

      rerender(<MathRenderer latex="y^3" />);
      const label2 = screen.getByRole("img").getAttribute("aria-label");

      expect(label1).not.toBe(label2);
    });

    it("should maintain accessibility in display mode", () => {
      render(<DisplayMath latex="x^2 + y^2 = r^2" />);
      const element = screen.getByRole("img");
      expect(element).toHaveAttribute("aria-label");
    });
  });
});
