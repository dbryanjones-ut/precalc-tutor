import katex from "katex";
import { LatexValidator } from "./latex-validator";

/**
 * Render LaTeX to HTML string using KaTeX
 * SECURITY: Always validates LaTeX before rendering to prevent XSS
 */
export function renderMath(
  latex: string,
  displayMode: boolean = false
): string {
  try {
    // CRITICAL: Validate LaTeX before rendering
    const validation = LatexValidator.validate(latex);

    if (!validation.valid) {
      console.error("LaTeX validation failed:", validation.errors);
      return `<span class="text-red-500">Invalid LaTeX: ${validation.errors[0]}</span>`;
    }

    // Use sanitized LaTeX if available
    const safeLatex = validation.sanitized || latex;

    return katex.renderToString(safeLatex, {
      displayMode,
      throwOnError: false,
      trust: false, // SECURITY FIX: Changed from true to false to prevent XSS
      strict: "warn",
      output: "html",
      errorColor: "#cc0000",
    });
  } catch (error) {
    console.error("KaTeX rendering error:", error);
    return `<span class="text-red-500">Error rendering: ${escapeHtml(latex)}</span>`;
  }
}

/**
 * Escape HTML to prevent XSS in error messages
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Colorize specific parts of a LaTeX expression
 * SECURITY: Validates resulting LaTeX
 */
export function colorizeExpression(
  latex: string,
  highlights: Record<string, string> // Part -> color hex
): string {
  let result = latex;
  for (const [part, color] of Object.entries(highlights)) {
    // Sanitize color value (only allow hex colors)
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      console.warn(`Invalid color format: ${color}, skipping`);
      continue;
    }

    // Escape regex special characters in the part
    const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(
      new RegExp(escapedPart, "g"),
      `\\textcolor{${color}}{${part}}`
    );
  }

  // Validate the colorized result
  const validation = LatexValidator.validate(result);
  if (!validation.valid) {
    console.warn("Colorized LaTeX failed validation, returning original");
    return latex;
  }

  return result;
}

/**
 * Generate accessible text description from LaTeX
 * This is a simplified version - full implementation would need comprehensive mapping
 */
export function generateAccessibleLabel(latex: string): string {
  let readable = latex;

  // Common replacements
  const replacements: Record<string, string> = {
    "\\frac": "fraction",
    "\\sqrt": "square root of",
    "\\pi": "pi",
    "\\theta": "theta",
    "\\sin": "sine of",
    "\\cos": "cosine of",
    "\\tan": "tangent of",
    "\\log": "logarithm of",
    "\\ln": "natural log of",
    "^{-1}": " inverse",
    "^2": " squared",
    "^3": " cubed",
    "\\infty": "infinity",
    "\\geq": "greater than or equal to",
    "\\leq": "less than or equal to",
    "\\neq": "not equal to",
    "\\approx": "approximately equal to",
  };

  for (const [latex, text] of Object.entries(replacements)) {
    readable = readable.replace(new RegExp(latex.replace(/\\/g, "\\\\"), "g"), ` ${text} `);
  }

  // Remove remaining LaTeX commands
  readable = readable.replace(/\\[a-zA-Z]+/g, "");
  readable = readable.replace(/[{}]/g, "");

  return readable.trim();
}

/**
 * Color palette for unit circle families (from AP guide)
 */
export const UNIT_CIRCLE_COLORS = {
  blue: "#4F8CFF", // π/6 family
  red: "#FF6B6B", // π/4 family
  green: "#51CF66", // π/3 family
} as const;

/**
 * Apply color coding for trig families
 * SECURITY: Uses validated color values
 */
export function applyTrigFamilyColor(
  latex: string,
  family: "blue" | "red" | "green"
): string {
  const color = UNIT_CIRCLE_COLORS[family];
  return colorizeExpression(latex, { [latex]: color });
}
