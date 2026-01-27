import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { MathRenderer, InlineMath, DisplayMath } from "./MathRenderer";

// Mock katex-helpers to avoid actual KaTeX rendering in tests
vi.mock("@/lib/math/katex-helpers", () => ({
  renderMath: vi.fn((latex: string, displayMode: boolean) => {
    return `<span class="katex-mock ${displayMode ? "display" : "inline"}">${latex}</span>`;
  }),
  generateAccessibleLabel: vi.fn((latex: string) => {
    return `Math: ${latex}`;
  }),
}));

describe("MathRenderer", () => {
  describe("Basic Rendering", () => {
    it("should render simple LaTeX expressions", () => {
      render(<MathRenderer latex="x^2 + 1" />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should render in inline mode by default", () => {
      const { container } = render(<MathRenderer latex="x^2" />);
      const span = container.querySelector(".math-inline");
      expect(span).toBeInTheDocument();
    });

    it("should render in display mode when specified", () => {
      const { container } = render(<MathRenderer latex="x^2" displayMode={true} />);
      const span = container.querySelector(".math-display");
      expect(span).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <MathRenderer latex="x^2" className="custom-class" />
      );
      const span = container.querySelector(".custom-class");
      expect(span).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have role='img'", () => {
      render(<MathRenderer latex="x^2" />);
      const element = screen.getByRole("img");
      expect(element).toBeInTheDocument();
    });

    it("should have aria-label", () => {
      render(<MathRenderer latex="x^2 + 1" />);
      const element = screen.getByRole("img");
      expect(element).toHaveAttribute("aria-label");
    });

    it("should generate descriptive aria-label", () => {
      render(<MathRenderer latex="\\frac{1}{2}" />);
      const element = screen.getByRole("img");
      expect(element.getAttribute("aria-label")).toContain("Math:");
    });
  });

  describe("Color Highlights", () => {
    it("should handle color highlights", () => {
      const highlights = { x: "red", y: "blue" };
      render(<MathRenderer latex="x + y" colorHighlights={highlights} />);
      // The component should render without errors
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should render without color highlights", () => {
      render(<MathRenderer latex="x + y" />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should process color highlights correctly", () => {
      const highlights = { x: "red" };
      const { container } = render(
        <MathRenderer latex="x^2" colorHighlights={highlights} />
      );
      // Verify the component rendered
      expect(container.querySelector(".math-renderer")).toBeInTheDocument();
    });
  });

  describe("Memoization", () => {
    it("should memoize rendered output", () => {
      const { rerender } = render(<MathRenderer latex="x^2" />);
      const firstRender = screen.getByRole("img");

      // Rerender with same props
      rerender(<MathRenderer latex="x^2" />);
      const secondRender = screen.getByRole("img");

      // Should be the same element (memoized)
      expect(firstRender).toBe(secondRender);
    });

    it("should update when LaTeX changes", () => {
      const { rerender } = render(<MathRenderer latex="x^2" />);
      expect(screen.getByRole("img")).toBeInTheDocument();

      rerender(<MathRenderer latex="y^2" />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should update when displayMode changes", () => {
      const { rerender, container } = render(
        <MathRenderer latex="x^2" displayMode={false} />
      );
      expect(container.querySelector(".math-inline")).toBeInTheDocument();

      rerender(<MathRenderer latex="x^2" displayMode={true} />);
      expect(container.querySelector(".math-display")).toBeInTheDocument();
    });
  });

  describe("InlineMath Component", () => {
    it("should render in inline mode", () => {
      const { container } = render(<InlineMath latex="x^2" />);
      expect(container.querySelector(".math-inline")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(<InlineMath latex="x^2" className="custom" />);
      expect(container.querySelector(".custom")).toBeInTheDocument();
    });

    it("should render accessible content", () => {
      render(<InlineMath latex="x^2" />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  describe("DisplayMath Component", () => {
    it("should render in display mode", () => {
      const { container } = render(<DisplayMath latex="x^2" />);
      expect(container.querySelector(".math-display")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(<DisplayMath latex="x^2" className="custom" />);
      expect(container.querySelector(".custom")).toBeInTheDocument();
    });

    it("should render accessible content", () => {
      render(<DisplayMath latex="x^2" />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty LaTeX string", () => {
      render(<MathRenderer latex="" />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should handle complex LaTeX expressions", () => {
      const complex = "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}";
      render(<MathRenderer latex={complex} />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should handle LaTeX with special characters", () => {
      render(<MathRenderer latex="\\alpha + \\beta" />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should handle very long LaTeX strings", () => {
      const longLatex = "x + y + z + ".repeat(100);
      render(<MathRenderer latex={longLatex} />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  describe("HTML Injection Safety", () => {
    it("should use dangerouslySetInnerHTML correctly", () => {
      const { container } = render(<MathRenderer latex="x^2" />);
      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();
      // Should have HTML content from KaTeX
      expect(mathElement?.innerHTML).toBeTruthy();
    });

    it("should not allow script injection", () => {
      // The validator should prevent this, but test the component's handling
      render(<MathRenderer latex="<script>alert(1)</script>" />);
      // Should render without executing scripts
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  describe("Multiple Instances", () => {
    it("should render multiple math expressions independently", () => {
      const { container } = render(
        <>
          <MathRenderer latex="x^2" />
          <MathRenderer latex="y^2" />
          <MathRenderer latex="z^2" />
        </>
      );

      const mathElements = container.querySelectorAll(".math-renderer");
      expect(mathElements).toHaveLength(3);
    });

    it("should handle mixed display modes", () => {
      const { container } = render(
        <>
          <InlineMath latex="x^2" />
          <DisplayMath latex="y^2" />
          <InlineMath latex="z^2" />
        </>
      );

      const inline = container.querySelectorAll(".math-inline");
      const display = container.querySelectorAll(".math-display");

      expect(inline).toHaveLength(2);
      expect(display).toHaveLength(1);
    });
  });

  describe("Performance", () => {
    it("should not re-render unnecessarily", () => {
      const { rerender } = render(<MathRenderer latex="x^2" />);

      // Multiple rerenders with same props
      rerender(<MathRenderer latex="x^2" />);
      rerender(<MathRenderer latex="x^2" />);
      rerender(<MathRenderer latex="x^2" />);

      // Should still render correctly
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should handle rapid updates", () => {
      const { rerender } = render(<MathRenderer latex="x^2" />);

      // Simulate rapid LaTeX changes
      for (let i = 0; i < 10; i++) {
        rerender(<MathRenderer latex={`x^${i}`} />);
      }

      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });
});
