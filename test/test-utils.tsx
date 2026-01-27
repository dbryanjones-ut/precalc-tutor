import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "next-themes";

/**
 * Custom render function that wraps components with providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Test data generators
 */
export const testData = {
  validLatex: [
    "x^2 + 2x + 1",
    "\\frac{1}{2}",
    "\\sqrt{16}",
    "\\sin(x) + \\cos(x)",
    "\\int_{0}^{1} x^2 dx",
  ],
  invalidLatex: [
    "\\href{javascript:alert(1)}",
    "\\url{malicious}",
    "\\def\\hack{bad}",
  ],
  problemExpressions: [
    { student: "4", correct: "4", shouldMatch: true },
    { student: "(x+1)^2", correct: "x^2 + 2x + 1", shouldMatch: true },
    { student: "0.333", correct: "1/3", shouldMatch: true },
    { student: "5", correct: "4", shouldMatch: false },
  ],
};

/**
 * Mock fetch for API tests
 */
export function mockFetch(
  response: any,
  options?: { ok?: boolean; status?: number }
) {
  const { ok = true, status = 200 } = options || {};

  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
}

/**
 * Wait for async operations
 */
export function waitForAsync(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate mock session data
 */
export function createMockSession(overrides = {}) {
  return {
    id: "test-session-123",
    timestamp: new Date().toISOString(),
    mode: "socratic" as const,
    messages: [],
    problemsSolved: [],
    conceptsCovered: [],
    duration: 0,
    questionsAsked: 0,
    hintsGiven: 0,
    completed: false,
    lastUpdated: new Date().toISOString(),
    tags: [],
    ...overrides,
  };
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { customRender as render };
