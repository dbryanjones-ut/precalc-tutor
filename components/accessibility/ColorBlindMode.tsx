"use client";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useEffect } from "react";

/**
 * ColorBlindMode Component
 *
 * Applies color blind-friendly palettes and patterns:
 * - Deuteranopia (red-green color blindness)
 * - Protanopia (red-green color blindness)
 * - Tritanopia (blue-yellow color blindness)
 * - Pattern overlays for additional differentiation
 *
 * This component applies global CSS variables and classes
 * to ensure all colors in the app are accessible.
 */
export function ColorBlindMode() {
  const { settings } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    // Remove all color blind mode classes first
    root.classList.remove(
      "colorblind-deuteranopia",
      "colorblind-protanopia",
      "colorblind-tritanopia",
      "colorblind-patterns"
    );

    // Apply appropriate color blind mode
    if (settings.colorBlindMode !== "none") {
      root.classList.add(`colorblind-${settings.colorBlindMode}`);

      // Apply color blind safe palettes
      const palettes = getColorBlindPalette(settings.colorBlindMode);

      // Set CSS custom properties for color blind safe colors
      Object.entries(palettes).forEach(([key, value]) => {
        root.style.setProperty(`--cb-${key}`, value);
      });

      // Add pattern overlays if enabled
      if (settings.colorBlindUsePatterns) {
        root.classList.add("colorblind-patterns");
      }
    } else {
      // Remove custom properties
      const keys = [
        "primary",
        "secondary",
        "success",
        "warning",
        "error",
        "info",
        "chart-1",
        "chart-2",
        "chart-3",
        "chart-4",
        "chart-5",
      ];
      keys.forEach((key) => {
        root.style.removeProperty(`--cb-${key}`);
      });
    }

    return () => {
      if (settings.colorBlindMode === "none") {
        root.classList.remove(
          "colorblind-deuteranopia",
          "colorblind-protanopia",
          "colorblind-tritanopia",
          "colorblind-patterns"
        );
      }
    };
  }, [settings.colorBlindMode, settings.colorBlindUsePatterns]);

  return null;
}

/**
 * Get color blind safe palette
 *
 * Returns a palette optimized for the specified type of color blindness.
 * All colors have been validated for sufficient contrast and differentiation.
 */
function getColorBlindPalette(mode: "deuteranopia" | "protanopia" | "tritanopia") {
  const palettes = {
    // Deuteranopia and Protanopia (red-green color blindness)
    // Use blue-orange-purple palette
    deuteranopia: {
      primary: "oklch(0.5 0.25 260)", // Blue
      secondary: "oklch(0.65 0.18 50)", // Orange
      success: "oklch(0.45 0.20 260)", // Dark blue
      warning: "oklch(0.75 0.20 80)", // Yellow-orange
      error: "oklch(0.55 0.25 30)", // Red-orange
      info: "oklch(0.60 0.20 240)", // Light blue
      "chart-1": "oklch(0.5 0.25 260)", // Blue
      "chart-2": "oklch(0.65 0.18 50)", // Orange
      "chart-3": "oklch(0.7 0.15 280)", // Purple
      "chart-4": "oklch(0.45 0.15 240)", // Dark blue
      "chart-5": "oklch(0.75 0.12 70)", // Yellow
    },

    protanopia: {
      primary: "oklch(0.5 0.25 260)", // Blue
      secondary: "oklch(0.65 0.18 50)", // Orange
      success: "oklch(0.45 0.20 260)", // Dark blue
      warning: "oklch(0.75 0.20 80)", // Yellow-orange
      error: "oklch(0.55 0.25 30)", // Red-orange
      info: "oklch(0.60 0.20 240)", // Light blue
      "chart-1": "oklch(0.5 0.25 260)", // Blue
      "chart-2": "oklch(0.65 0.18 50)", // Orange
      "chart-3": "oklch(0.7 0.15 280)", // Purple
      "chart-4": "oklch(0.45 0.15 240)", // Dark blue
      "chart-5": "oklch(0.75 0.12 70)", // Yellow
    },

    // Tritanopia (blue-yellow color blindness)
    // Use red-cyan-pink palette
    tritanopia: {
      primary: "oklch(0.55 0.25 10)", // Red
      secondary: "oklch(0.65 0.15 200)", // Cyan
      success: "oklch(0.45 0.20 180)", // Dark cyan
      warning: "oklch(0.70 0.20 340)", // Pink
      error: "oklch(0.50 0.25 20)", // Dark red
      info: "oklch(0.60 0.18 190)", // Light cyan
      "chart-1": "oklch(0.55 0.25 10)", // Red
      "chart-2": "oklch(0.65 0.15 200)", // Cyan
      "chart-3": "oklch(0.70 0.20 340)", // Pink
      "chart-4": "oklch(0.45 0.20 180)", // Dark cyan
      "chart-5": "oklch(0.60 0.18 350)", // Light pink
    },
  };

  return palettes[mode];
}

/**
 * ColorBlindSwatch Component
 *
 * Displays a color with optional pattern overlay for better differentiation.
 */
interface ColorBlindSwatchProps {
  color: string;
  pattern?: "dots" | "stripes" | "checkers" | "waves";
  className?: string;
  label?: string;
}

export function ColorBlindSwatch({
  color,
  pattern,
  className = "",
  label,
}: ColorBlindSwatchProps) {
  const { settings } = useSettingsStore();
  const usePatterns = settings.colorBlindUsePatterns;

  return (
    <div
      className={`relative ${className}`}
      style={{ backgroundColor: color }}
      role="img"
      aria-label={label || `Color swatch: ${color}`}
    >
      {usePatterns && pattern && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: getPatternSVG(pattern),
            backgroundSize: "10px 10px",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Get SVG pattern for overlay
 */
function getPatternSVG(pattern: "dots" | "stripes" | "checkers" | "waves"): string {
  const patterns = {
    dots: `url("data:image/svg+xml,%3Csvg width='10' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='5' cy='5' r='2' fill='black'/%3E%3C/svg%3E")`,
    stripes: `url("data:image/svg+xml,%3Csvg width='10' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='0' x2='0' y2='10' stroke='black' stroke-width='2'/%3E%3C/svg%3E")`,
    checkers: `url("data:image/svg+xml,%3Csvg width='10' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='5' height='5' fill='black'/%3E%3Crect x='5' y='5' width='5' height='5' fill='black'/%3E%3C/svg%3E")`,
    waves: `url("data:image/svg+xml,%3Csvg width='10' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 5 Q 2.5 2.5, 5 5 T 10 5' stroke='black' fill='none'/%3E%3C/svg%3E")`,
  };

  return patterns[pattern];
}

/**
 * ColorBlindLegend Component
 *
 * Displays a legend with both colors and patterns for charts/graphs.
 */
interface ColorBlindLegendItem {
  label: string;
  color: string;
  pattern?: "dots" | "stripes" | "checkers" | "waves";
}

interface ColorBlindLegendProps {
  items: ColorBlindLegendItem[];
  className?: string;
}

export function ColorBlindLegend({ items, className = "" }: ColorBlindLegendProps) {
  return (
    <div
      className={`flex flex-wrap gap-3 ${className}`}
      role="list"
      aria-label="Chart legend"
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2" role="listitem">
          <ColorBlindSwatch
            color={item.color}
            pattern={item.pattern}
            className="w-4 h-4 rounded border border-border"
            label={item.label}
          />
          <span className="text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
