import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProblemDisplay } from "./ProblemDisplay";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock MathRenderer component
vi.mock("@/components/math/MathRenderer", () => ({
  MathRenderer: ({ latex }: { latex: string }) => (
    <div data-testid="math-renderer">{latex}</div>
  ),
}));

describe("ProblemDisplay", () => {
  it("should not render when no content is provided", () => {
    const { container } = render(<ProblemDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it("should render with uploaded image", () => {
    render(
      <ProblemDisplay
        uploadedImage="data:image/png;base64,test"
        extractedProblem=""
      />
    );

    expect(screen.getByText("Original Problem")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.getByAltText("Uploaded problem")).toBeInTheDocument();
  });

  it("should render with extracted problem", () => {
    const latex = "x^2 + 2x + 1 = 0";
    render(<ProblemDisplay extractedProblem={latex} />);

    expect(screen.getByText("Original Problem")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByTestId("math-renderer")).toHaveTextContent(latex);
  });

  it("should render with both image and problem", () => {
    const latex = "x^2 + 2x + 1 = 0";
    render(
      <ProblemDisplay
        uploadedImage="data:image/png;base64,test"
        extractedProblem={latex}
      />
    );

    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("should toggle collapse state when clicked", () => {
    render(
      <ProblemDisplay extractedProblem="x^2 + 2x + 1 = 0" defaultCollapsed={false} />
    );

    const header = screen.getByText("Original Problem").closest("[role='button']");
    expect(header).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(header!);
    expect(header).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(header!);
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("should start collapsed when defaultCollapsed is true", () => {
    render(
      <ProblemDisplay
        extractedProblem="x^2 + 2x + 1 = 0"
        defaultCollapsed={true}
      />
    );

    const header = screen.getByText("Original Problem").closest("[role='button']");
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Click to view problem")).toBeInTheDocument();
  });

  it("should toggle image visibility", () => {
    render(
      <ProblemDisplay
        uploadedImage="data:image/png;base64,test"
        extractedProblem="x^2 + 2x + 1 = 0"
      />
    );

    const image = screen.getByAltText("Uploaded problem");
    expect(image).toBeVisible();

    const hideButton = screen.getByRole("button", { name: /hide image/i });
    fireEvent.click(hideButton);

    expect(image).not.toBeInTheDocument();

    const showButton = screen.getByRole("button", { name: /show image/i });
    fireEvent.click(showButton);

    expect(screen.getByAltText("Uploaded problem")).toBeVisible();
  });

  it("should support keyboard navigation", () => {
    render(<ProblemDisplay extractedProblem="x^2 + 2x + 1 = 0" defaultCollapsed={true} />);

    const header = screen.getByText("Original Problem").closest("[role='button']");

    expect(header).toHaveAttribute("aria-expanded", "false");

    fireEvent.keyDown(header!, { key: "Enter" });
    expect(header).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(header!, { key: " " });
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("should have proper accessibility attributes", () => {
    render(
      <ProblemDisplay
        uploadedImage="data:image/png;base64,test"
        extractedProblem="x^2 + 2x + 1 = 0"
      />
    );

    const header = screen.getByText("Original Problem").closest("[role='button']");
    expect(header).toHaveAttribute("aria-expanded");
    expect(header).toHaveAttribute("aria-controls", "problem-content");
    expect(header).toHaveAttribute("tabIndex", "0");

    const expandButton = screen.getByLabelText(/collapse problem/i);
    expect(expandButton).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <ProblemDisplay extractedProblem="x^2 + 2x + 1 = 0" className="custom-class" />
    );

    const card = container.firstChild;
    expect(card).toHaveClass("custom-class");
  });
});
