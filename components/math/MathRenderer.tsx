"use client";

import { useMemo, useState } from "react";
import { renderMath, generateAccessibleLabel } from "@/lib/math/katex-helpers";
import { LatexValidator } from "@/lib/math/latex-validator";
import { AlertCircle } from "lucide-react";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
  colorHighlights?: Record<string, string>; // Part -> color
  showValidationErrors?: boolean; // Show validation warnings to user
}

/**
 * Math renderer component using KaTeX
 * Renders LaTeX math expressions with accessibility support
 *
 * SECURITY: All LaTeX is validated before rendering to prevent XSS attacks
 */
export function MathRenderer({
  latex,
  displayMode = false,
  className = "",
  colorHighlights,
  showValidationErrors = false,
}: MathRendererProps) {
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Validate LaTeX before processing
  const validation = useMemo(() => {
    const result = LatexValidator.validate(latex);
    if (result.warnings.length > 0) {
      setValidationWarnings(result.warnings);
    }
    return result;
  }, [latex]);

  // Apply color highlights if provided
  const processedLatex = useMemo(() => {
    if (!colorHighlights || !validation.valid) {
      return validation.sanitized || latex;
    }

    let result = validation.sanitized || latex;
    for (const [part, color] of Object.entries(colorHighlights)) {
      // Sanitize color value
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        console.warn(`Invalid color format: ${color}, skipping`);
        continue;
      }

      result = result.replace(
        new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        `\\textcolor{${color}}{${part}}`
      );
    }
    return result;
  }, [latex, colorHighlights, validation]);

  // Render LaTeX to HTML (with validation built-in)
  const html = useMemo(
    () => renderMath(processedLatex, displayMode),
    [processedLatex, displayMode]
  );

  // Generate accessible label
  const ariaLabel = useMemo(
    () => generateAccessibleLabel(latex),
    [latex]
  );

  // Show error state for invalid LaTeX
  if (!validation.valid) {
    return (
      <div className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-md">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">Invalid LaTeX</p>
          {showValidationErrors && (
            <p className="text-xs mt-1">{validation.errors[0]}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <span
        className={`math-renderer ${displayMode ? "math-display" : "math-inline"} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
        role="img"
        aria-label={ariaLabel}
      />
      {showValidationErrors && validationWarnings.length > 0 && (
        <div className="text-xs text-amber-600 mt-1">
          {validationWarnings.map((warning, idx) => (
            <div key={idx}>{warning}</div>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Inline math component (convenience wrapper)
 */
export function InlineMath({
  latex,
  className,
  showValidationErrors = false,
}: {
  latex: string;
  className?: string;
  showValidationErrors?: boolean;
}) {
  return (
    <MathRenderer
      latex={latex}
      displayMode={false}
      className={className}
      showValidationErrors={showValidationErrors}
    />
  );
}

/**
 * Display math component (convenience wrapper)
 */
export function DisplayMath({
  latex,
  className,
  showValidationErrors = false,
}: {
  latex: string;
  className?: string;
  showValidationErrors?: boolean;
}) {
  return (
    <MathRenderer
      latex={latex}
      displayMode={true}
      className={className}
      showValidationErrors={showValidationErrors}
    />
  );
}
