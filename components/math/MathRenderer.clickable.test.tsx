import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/test-utils";
import { MathRenderer, InlineMath, DisplayMath } from "./MathRenderer";
import userEvent from "@testing-library/user-event";

// Mock katex-helpers
vi.mock("@/lib/math/katex-helpers", () => ({
  renderMath: vi.fn((latex: string, displayMode: boolean) => {
    return `<span class="katex-mock ${displayMode ? "display" : "inline"}">${latex}</span>`;
  }),
  generateAccessibleLabel: vi.fn((latex: string) => {
    return `Math: ${latex}`;
  }),
}));

describe("MathRenderer - Clickable Math Functionality", () => {
  describe("Click Registration and Message Sending", () => {
    it("should call onClick handler when clicked", async () => {
      const handleClick = vi.fn();
      const { container } = render(
        <MathRenderer latex="x^2" onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toBeInTheDocument();

      await userEvent.click(mathElement!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not have click handler when onClick is undefined", () => {
      const { container } = render(<MathRenderer latex="x^2" />);
      const mathElement = container.querySelector(".math-renderer");

      expect(mathElement).not.toHaveClass("cursor-pointer");
      expect(mathElement).not.toHaveAttribute("tabindex");
    });

    it("should handle multiple clicks", async () => {
      const handleClick = vi.fn();
      const { container } = render(
        <MathRenderer latex="x^2" onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-renderer");
      await userEvent.click(mathElement!);
      await userEvent.click(mathElement!);
      await userEvent.click(mathElement!);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("should work with inline math expressions", async () => {
      const handleClick = vi.fn();
      const { container } = render(
        <InlineMath latex="\\frac{a}{b}" onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-inline");
      await userEvent.click(mathElement!);
      expect(handleClick).toHaveBeenCalled();
    });

    it("should work with display math expressions", async () => {
      const handleClick = vi.fn();
      const { container } = render(
        <DisplayMath latex="x^2 + y^2 = r^2" onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-display");
      await userEvent.click(mathElement!);
      expect(handleClick).toHaveBeenCalled();
    });

    it("should work with complex expressions", async () => {
      const handleClick = vi.fn();
      const latex = "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}";
      const { container } = render(
        <MathRenderer latex={latex} onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-renderer");
      await userEvent.click(mathElement!);
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe("Visual Feedback", () => {
    it("should have cursor-pointer class when clickable", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <MathRenderer latex="x^2" onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toHaveClass("cursor-pointer");
    });

    it("should have hover styles when clickable", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <MathRenderer latex="x^2" onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement?.className).toContain("hover:bg-blue-50");
      expect(mathElement?.className).toContain("hover:ring-2");
    });

    it("should have transition class for smooth animation", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <MathRenderer latex="x^2" onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement?.className).toContain("transition-all");
    });

    it("should not have hover styles when not clickable", () => {
      const { container } = render(<MathRenderer latex="x^2" />);
      const mathElement = container.querySelector(".math-renderer");

      expect(mathElement?.className).not.toContain("cursor-pointer");
      expect(mathElement?.className).not.toContain("hover:bg-blue");
    });

    it("should maintain visual feedback across re-renders", () => {
      const handleClick = vi.fn();
      const { rerender, container } = render(
        <MathRenderer latex="x^2" onClick={handleClick} />
      );

      let mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toHaveClass("cursor-pointer");

      rerender(<MathRenderer latex="x^2" onClick={handleClick} />);
      mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toHaveClass("cursor-pointer");
    });

    it("should update hover state when onClick changes", () => {
      const handleClick = vi.fn();
      const { rerender, container } = render(
        <MathRenderer latex="x^2" onClick={handleClick} />
      );

      let mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toHaveClass("cursor-pointer");

      rerender(<MathRenderer latex="x^2" />);
      mathElement = container.querySelector(".math-renderer");
      expect(mathElement).not.toHaveClass("cursor-pointer");
    });
  });

  describe("Keyboard Accessibility", () => {
    it("should have tabIndex when clickable", () => {
      const handleClick = vi.fn();
      render(<MathRenderer latex="x^2" onClick={handleClick} />);

      const mathElement = screen.getByRole("img");
      expect(mathElement).toHaveAttribute("tabIndex", "0");
    });

    it("should not have tabIndex when not clickable", () => {
      render(<MathRenderer latex="x^2" />);

      const mathElement = screen.getByRole("img");
      expect(mathElement).not.toHaveAttribute("tabIndex");
    });

    it("should trigger onClick when Enter key is pressed", async () => {
      const handleClick = vi.fn();
      render(<MathRenderer latex="x^2" onClick={handleClick} />);

      const mathElement = screen.getByRole("img");
      mathElement.focus();
      await userEvent.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should trigger onClick when Space key is pressed", async () => {
      const handleClick = vi.fn();
      render(<MathRenderer latex="x^2" onClick={handleClick} />);

      const mathElement = screen.getByRole("img");
      mathElement.focus();
      await userEvent.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not trigger onClick for other keys", async () => {
      const handleClick = vi.fn();
      render(<MathRenderer latex="x^2" onClick={handleClick} />);

      const mathElement = screen.getByRole("img");
      mathElement.focus();
      await userEvent.keyboard("{ArrowDown}");
      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("a");

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should prevent default behavior on Space key", () => {
      const handleClick = vi.fn();
      render(<MathRenderer latex="x^2" onClick={handleClick} />);

      const mathElement = screen.getByRole("img");
      const event = new KeyboardEvent("keydown", { key: " " });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      fireEvent.keyDown(mathElement, event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should prevent default behavior on Enter key", () => {
      const handleClick = vi.fn();
      render(<MathRenderer latex="x^2" onClick={handleClick} />);

      const mathElement = screen.getByRole("img");
      const event = new KeyboardEvent("keydown", { key: "Enter" });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      fireEvent.keyDown(mathElement, event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should be keyboard navigable in sequence", async () => {
      const handleClick1 = vi.fn();
      const handleClick2 = vi.fn();
      const handleClick3 = vi.fn();

      render(
        <div>
          <MathRenderer latex="x^2" onClick={handleClick1} />
          <MathRenderer latex="y^2" onClick={handleClick2} />
          <MathRenderer latex="z^2" onClick={handleClick3} />
        </div>
      );

      const mathElements = screen.getAllByRole("img");
      expect(mathElements).toHaveLength(3);

      mathElements[0].focus();
      expect(document.activeElement).toBe(mathElements[0]);

      await userEvent.keyboard("{Enter}");
      expect(handleClick1).toHaveBeenCalledTimes(1);
    });

    it("should maintain focus after click", async () => {
      const handleClick = vi.fn();
      render(<MathRenderer latex="x^2" onClick={handleClick} />);

      const mathElement = screen.getByRole("img");
      mathElement.focus();
      await userEvent.click(mathElement);

      expect(document.activeElement).toBe(mathElement);
    });
  });

  describe("Multiple Clickable Expressions", () => {
    it("should handle clicks on different expressions independently", async () => {
      const handleClick1 = vi.fn();
      const handleClick2 = vi.fn();

      const { container } = render(
        <div>
          <MathRenderer latex="x^2" onClick={handleClick1} />
          <MathRenderer latex="y^2" onClick={handleClick2} />
        </div>
      );

      const mathElements = container.querySelectorAll(".math-renderer");
      await userEvent.click(mathElements[0]);
      expect(handleClick1).toHaveBeenCalledTimes(1);
      expect(handleClick2).not.toHaveBeenCalled();

      await userEvent.click(mathElements[1]);
      expect(handleClick2).toHaveBeenCalledTimes(1);
      expect(handleClick1).toHaveBeenCalledTimes(1);
    });

    it("should maintain separate hover states for multiple expressions", () => {
      const handleClick1 = vi.fn();
      const handleClick2 = vi.fn();

      const { container } = render(
        <div>
          <MathRenderer latex="x^2" onClick={handleClick1} />
          <MathRenderer latex="y^2" onClick={handleClick2} />
        </div>
      );

      const mathElements = container.querySelectorAll(".math-renderer");
      expect(mathElements[0]).toHaveClass("cursor-pointer");
      expect(mathElements[1]).toHaveClass("cursor-pointer");
    });

    it("should support mixed clickable and non-clickable expressions", async () => {
      const handleClick = vi.fn();

      const { container } = render(
        <div>
          <MathRenderer latex="x^2" onClick={handleClick} />
          <MathRenderer latex="y^2" />
          <MathRenderer latex="z^2" onClick={handleClick} />
        </div>
      );

      const mathElements = container.querySelectorAll(".math-renderer");
      expect(mathElements[0]).toHaveClass("cursor-pointer");
      expect(mathElements[1]).not.toHaveClass("cursor-pointer");
      expect(mathElements[2]).toHaveClass("cursor-pointer");

      await userEvent.click(mathElements[0]);
      expect(handleClick).toHaveBeenCalledTimes(1);

      await userEvent.click(mathElements[2]);
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("Edge Cases for Clickable Math", () => {
    it("should handle rapid successive clicks", async () => {
      const handleClick = vi.fn();
      const { container } = render(
        <MathRenderer latex="x^2" onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-renderer");

      // Rapid fire clicks
      await userEvent.click(mathElement!);
      await userEvent.click(mathElement!);
      await userEvent.click(mathElement!);
      await userEvent.click(mathElement!);
      await userEvent.click(mathElement!);

      expect(handleClick).toHaveBeenCalledTimes(5);
    });

    it("should handle click during re-render", async () => {
      const handleClick = vi.fn();
      const { rerender, container } = render(
        <MathRenderer latex="x^2" onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-renderer");
      await userEvent.click(mathElement!);

      rerender(<MathRenderer latex="x^3" onClick={handleClick} />);

      const updatedElement = container.querySelector(".math-renderer");
      await userEvent.click(updatedElement!);

      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it("should handle onClick changing to undefined", async () => {
      const handleClick = vi.fn();
      const { rerender, container } = render(
        <MathRenderer latex="x^2" onClick={handleClick} />
      );

      let mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toHaveClass("cursor-pointer");

      rerender(<MathRenderer latex="x^2" />);

      mathElement = container.querySelector(".math-renderer");
      expect(mathElement).not.toHaveClass("cursor-pointer");
      expect(mathElement).not.toHaveAttribute("tabindex");
    });

    it("should handle onClick changing to different function", async () => {
      const handleClick1 = vi.fn();
      const handleClick2 = vi.fn();

      const { rerender, container } = render(
        <MathRenderer latex="x^2" onClick={handleClick1} />
      );

      let mathElement = container.querySelector(".math-renderer");
      await userEvent.click(mathElement!);
      expect(handleClick1).toHaveBeenCalledTimes(1);

      rerender(<MathRenderer latex="x^2" onClick={handleClick2} />);

      mathElement = container.querySelector(".math-renderer");
      await userEvent.click(mathElement!);
      expect(handleClick2).toHaveBeenCalledTimes(1);
      expect(handleClick1).toHaveBeenCalledTimes(1);
    });

    it("should not break when clicked with empty latex", async () => {
      const handleClick = vi.fn();
      const { container } = render(
        <MathRenderer latex="" onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-renderer");
      await userEvent.click(mathElement!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Clickable Math with Display Modes", () => {
    it("should work in inline mode", async () => {
      const handleClick = vi.fn();
      const { container } = render(
        <MathRenderer latex="x^2" displayMode={false} onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-inline");
      expect(mathElement).toHaveClass("cursor-pointer");

      await userEvent.click(mathElement!);
      expect(handleClick).toHaveBeenCalled();
    });

    it("should work in display mode", async () => {
      const handleClick = vi.fn();
      const { container } = render(
        <MathRenderer latex="x^2" displayMode={true} onClick={handleClick} />
      );

      const mathElement = container.querySelector(".math-display");
      expect(mathElement).toHaveClass("cursor-pointer");

      await userEvent.click(mathElement!);
      expect(handleClick).toHaveBeenCalled();
    });

    it("should maintain clickability when switching modes", async () => {
      const handleClick = vi.fn();
      const { rerender, container } = render(
        <MathRenderer latex="x^2" displayMode={false} onClick={handleClick} />
      );

      let mathElement = container.querySelector(".math-renderer");
      await userEvent.click(mathElement!);
      expect(handleClick).toHaveBeenCalledTimes(1);

      rerender(<MathRenderer latex="x^2" displayMode={true} onClick={handleClick} />);

      mathElement = container.querySelector(".math-renderer");
      await userEvent.click(mathElement!);
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("Integration with ChatInterface Pattern", () => {
    it("should support sendMessage pattern from ChatInterface", async () => {
      const sendMessage = vi.fn();
      const latex = "x^2 + y^2 = r^2";

      const { container } = render(
        <MathRenderer
          latex={latex}
          onClick={() => sendMessage(latex)}
        />
      );

      const mathElement = container.querySelector(".math-renderer");
      await userEvent.click(mathElement!);

      expect(sendMessage).toHaveBeenCalledWith(latex);
    });

    it("should work with assistant message pattern (clickable)", async () => {
      const sendMessage = vi.fn();
      const isUser = false;
      const latex = "\\frac{a}{b}";

      const { container } = render(
        <MathRenderer
          latex={latex}
          onClick={!isUser ? () => sendMessage(latex) : undefined}
        />
      );

      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).toHaveClass("cursor-pointer");

      await userEvent.click(mathElement!);
      expect(sendMessage).toHaveBeenCalledWith(latex);
    });

    it("should work with user message pattern (not clickable)", () => {
      const sendMessage = vi.fn();
      const isUser = true;
      const latex = "\\frac{a}{b}";

      const { container } = render(
        <MathRenderer
          latex={latex}
          onClick={!isUser ? () => sendMessage(latex) : undefined}
        />
      );

      const mathElement = container.querySelector(".math-renderer");
      expect(mathElement).not.toHaveClass("cursor-pointer");
    });
  });

  describe("Accessibility with Clickable Math", () => {
    it("should be announced as clickable to screen readers", () => {
      const handleClick = vi.fn();
      render(<MathRenderer latex="x^2" onClick={handleClick} />);

      const mathElement = screen.getByRole("img");
      expect(mathElement).toHaveAttribute("tabIndex", "0");
      expect(mathElement).toHaveAttribute("aria-label");
    });

    it("should maintain aria-label with onClick", () => {
      const handleClick = vi.fn();
      render(<MathRenderer latex="x^2" onClick={handleClick} />);

      const mathElement = screen.getByRole("img");
      const ariaLabel = mathElement.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain("Math:");
    });

    it("should be focusable for keyboard users", () => {
      const handleClick = vi.fn();
      render(<MathRenderer latex="x^2" onClick={handleClick} />);

      const mathElement = screen.getByRole("img");
      mathElement.focus();
      expect(document.activeElement).toBe(mathElement);
    });
  });
});
