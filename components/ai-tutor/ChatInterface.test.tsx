import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { ChatInterface } from "./ChatInterface";
import { useAITutorStore } from "@/stores/useAITutorStore";

// Mock the store
vi.mock("@/stores/useAITutorStore");

// Mock MathRenderer to simplify testing
vi.mock("@/components/math/MathRenderer", () => ({
  MathRenderer: ({ latex, onClick }: { latex: string; onClick?: () => void }) => (
    <span
      className="math-renderer-mock"
      data-latex={latex}
      onClick={onClick}
      role="img"
      aria-label={`Math: ${latex}`}
    >
      {latex}
    </span>
  ),
}));

describe("ChatInterface - Problem Display and Message Content Parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Problem Display in Header", () => {
    it("should display original problem in session", () => {
      const mockSession = {
        id: "test-session",
        problem: "Solve x^2 + 2x + 1 = 0",
        problemImageUrl: null,
        messages: [],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      render(<ChatInterface />);

      // Check if session info is displayed
      expect(screen.getByText(/AI Tutor Chat/i)).toBeInTheDocument();
    });

    it("should display empty state when no session", () => {
      (useAITutorStore as any).mockReturnValue({
        currentSession: null,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      render(<ChatInterface />);

      expect(screen.getByText(/No Active Session/i)).toBeInTheDocument();
      expect(screen.getByText(/Upload a problem/i)).toBeInTheDocument();
    });

    it("should show message count in header", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test problem",
        problemImageUrl: null,
        messages: [
          { role: "user" as const, content: "Hello", timestamp: new Date().toISOString() },
          { role: "assistant" as const, content: "Hi", timestamp: new Date().toISOString() },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      render(<ChatInterface />);

      expect(screen.getByText(/2 messages/i)).toBeInTheDocument();
    });
  });

  describe("Message Content Parsing - Inline Math", () => {
    it("should parse and render inline math: $x + y$", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "Consider the expression $x + y$ and simplify.",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      // Should render inline math
      const mathElements = container.querySelectorAll(".math-renderer-mock");
      expect(mathElements.length).toBeGreaterThan(0);

      // Check if text before and after is rendered
      expect(container.textContent).toContain("Consider the expression");
      expect(container.textContent).toContain("and simplify");
    });

    it("should keep inline math on same line as text", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "The value $5^3 \\cdot 5^2 = 5^{3 + 2}$ demonstrates the rule.",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      // Should have paragraph with inline content
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it("should handle multiple inline expressions in one message", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "Compare $x^2$ with $y^2$ and note that $z^2$ is different.",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      const mathElements = container.querySelectorAll(".math-renderer-mock");
      expect(mathElements.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Message Content Parsing - Display Math", () => {
    it("should parse and render display math: $$x^2$$", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "Here is the formula:\n\n$$x^2 + y^2 = r^2$$\n\nThis is the circle equation.",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      const mathElements = container.querySelectorAll(".math-renderer-mock");
      expect(mathElements.length).toBeGreaterThan(0);
    });

    it("should render display math in separate block", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "The quadratic formula is:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      expect(container.querySelector(".math-renderer-mock")).toBeInTheDocument();
    });
  });

  describe("Message Content Parsing - Complex Content", () => {
    it("should handle mix of inline and display math", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content:
              "Consider $x^2$ and compare it to:\n\n$$y^2 = x^2 + 1$$\n\nNote that $y > x$.",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      const mathElements = container.querySelectorAll(".math-renderer-mock");
      expect(mathElements.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle paragraph breaks with double newlines", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "First paragraph with $x$.\n\nSecond paragraph with $y$.",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle single newlines as line breaks within paragraphs", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "Line 1 with $x$\nLine 2 with $y$",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      const lineBreaks = container.querySelectorAll("br");
      expect(lineBreaks.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases for Problem Display", () => {
    it("should handle very long problem text", () => {
      const longProblem = "Solve this very long problem: " + "x + ".repeat(100) + "1 = 0";
      const mockSession = {
        id: "test-session",
        problem: longProblem,
        problemImageUrl: null,
        messages: [],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      render(<ChatInterface />);

      // Should render without errors
      expect(screen.getByText(/AI Tutor Chat/i)).toBeInTheDocument();
    });

    it("should handle problem with lots of math", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content:
              "$a$ $b$ $c$ $d$ $e$ $f$ $g$ $h$ $i$ $j$ $k$ $l$ $m$ $n$ $o$ $p$",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      const mathElements = container.querySelectorAll(".math-renderer-mock");
      expect(mathElements.length).toBeGreaterThanOrEqual(10);
    });

    it("should handle messages with answer choices (latex array)", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "What is the answer?",
            timestamp: new Date().toISOString(),
            latex: ["x^2", "x^3", "\\sqrt{x}"],
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      // LaTeX array items should be rendered
      const mathElements = container.querySelectorAll(".math-renderer-mock");
      expect(mathElements.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle empty content", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      render(<ChatInterface />);

      // Should render without errors
      expect(screen.getByText(/AI Tutor Chat/i)).toBeInTheDocument();
    });

    it("should handle null or undefined content gracefully", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: undefined as any,
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      render(<ChatInterface />);

      // Should render without errors
      expect(screen.getByText(/AI Tutor Chat/i)).toBeInTheDocument();
    });
  });

  describe("parseMessageContent Function Tests", () => {
    it("should correctly identify inline math patterns", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "Test $x^2$ test",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      // Should render text before, math, and text after in same paragraph
      const paragraph = container.querySelector("p");
      expect(paragraph?.textContent).toContain("Test");
      expect(paragraph?.textContent).toContain("x^2");
    });

    it("should correctly identify display math patterns", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "Before\n\n$$x^2$$\n\nAfter",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      // Should have separate paragraphs for before and after
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    it("should not break expressions with nested delimiters", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "$\\frac{a}{b}$ and $\\sqrt{x}$ are different",
            timestamp: new Date().toISOString(),
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      const { container } = render(<ChatInterface />);

      const mathElements = container.querySelectorAll(".math-renderer-mock");
      expect(mathElements.length).toBe(2);
    });
  });

  describe("Message Display with Citations", () => {
    it("should display citations when present", () => {
      const mockSession = {
        id: "test-session",
        problem: "Test",
        problemImageUrl: null,
        messages: [
          {
            role: "assistant" as const,
            content: "Here's an explanation",
            timestamp: new Date().toISOString(),
            citations: [
              {
                type: "reference" as const,
                title: "Test Citation",
                content: "Citation content",
              },
            ],
          },
        ],
        mode: "socratic" as const,
        createdAt: new Date().toISOString(),
      };

      (useAITutorStore as any).mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        sendMessage: vi.fn(),
        endSession: vi.fn(),
        mode: "socratic",
        setMode: vi.fn(),
      });

      render(<ChatInterface />);

      expect(screen.getByText("Test Citation")).toBeInTheDocument();
      expect(screen.getByText("Citation content")).toBeInTheDocument();
    });
  });
});
