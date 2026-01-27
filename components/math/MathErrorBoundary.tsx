"use client";

import { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  latex?: string; // For debugging
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Math Error Boundary
 *
 * Specialized error boundary for math rendering components
 * Prevents entire page crashes from invalid LaTeX or KaTeX errors
 */
export class MathErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log math rendering errors
    console.error("Math rendering error:", {
      error: error.message,
      latex: this.props.latex,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send to error monitoring
    // This is critical to catch AI-generated invalid LaTeX
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default math error UI
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Unable to render math expression</span>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <span className="text-xs font-mono ml-2">
              ({this.state.error.message})
            </span>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component for safer math rendering
 */
export function SafeMathRenderer({
  children,
  fallbackText = "Math expression unavailable"
}: {
  children: ReactNode;
  fallbackText?: string;
}) {
  return (
    <MathErrorBoundary
      fallback={
        <span className="text-muted-foreground italic text-sm">
          [{fallbackText}]
        </span>
      }
    >
      {children}
    </MathErrorBoundary>
  );
}
