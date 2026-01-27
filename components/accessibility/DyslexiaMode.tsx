"use client";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useEffect } from "react";

/**
 * DyslexiaMode Component
 *
 * Applies dyslexia-friendly styling to the entire application:
 * - OpenDyslexic font
 * - Increased line spacing
 * - Color overlays to reduce contrast
 * - Simplified language mode
 *
 * This component doesn't render any UI - it applies global styles
 * based on settings stored in Zustand.
 */
export function DyslexiaMode() {
  const { settings } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    // Apply OpenDyslexic font
    if (settings.dyslexiaFont) {
      root.style.setProperty("--font-family-base", "OpenDyslexic, sans-serif");
    } else {
      root.style.removeProperty("--font-family-base");
    }

    // Apply line spacing
    if (settings.dyslexiaMode) {
      root.style.setProperty("--line-height-base", settings.dyslexiaLineSpacing.toString());
    } else {
      root.style.removeProperty("--line-height-base");
    }

    // Apply color overlay
    if (settings.dyslexiaColorOverlay !== "none") {
      const overlayColors = {
        cream: "oklch(0.96 0.01 85)",
        blue: "oklch(0.92 0.03 240)",
        green: "oklch(0.92 0.03 150)",
        pink: "oklch(0.92 0.03 350)",
      };

      const overlayColor = overlayColors[settings.dyslexiaColorOverlay];
      root.style.setProperty("--background-overlay", overlayColor);
      root.classList.add("dyslexia-overlay");
    } else {
      root.style.removeProperty("--background-overlay");
      root.classList.remove("dyslexia-overlay");
    }

    // Add dyslexia mode class for additional styling
    if (settings.dyslexiaMode) {
      root.classList.add("dyslexia-mode");
    } else {
      root.classList.remove("dyslexia-mode");
    }

    // Cleanup
    return () => {
      if (!settings.dyslexiaMode) {
        root.style.removeProperty("--font-family-base");
        root.style.removeProperty("--line-height-base");
        root.style.removeProperty("--background-overlay");
        root.classList.remove("dyslexia-mode", "dyslexia-overlay");
      }
    };
  }, [
    settings.dyslexiaMode,
    settings.dyslexiaFont,
    settings.dyslexiaLineSpacing,
    settings.dyslexiaColorOverlay,
  ]);

  return null;
}

/**
 * ContentChunker Component
 *
 * Breaks long text content into smaller, more digestible chunks
 * for students with dyslexia.
 */
interface ContentChunkerProps {
  content: string;
  chunkSize?: number;
  className?: string;
}

export function ContentChunker({
  content,
  chunkSize = 3,
  className = "",
}: ContentChunkerProps) {
  const { settings } = useSettingsStore();

  if (!settings.dyslexiaMode) {
    return <div className={className}>{content}</div>;
  }

  // Split content into sentences
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];

  // Group sentences into chunks
  const chunks: string[][] = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    chunks.push(sentences.slice(i, i + chunkSize));
  }

  return (
    <div className={className}>
      {chunks.map((chunk, index) => (
        <p
          key={index}
          className="mb-6 leading-relaxed"
          style={{
            lineHeight: settings.dyslexiaLineSpacing,
          }}
        >
          {chunk.join(" ")}
        </p>
      ))}
    </div>
  );
}

/**
 * SimplifiedText Component
 *
 * Provides simplified language alternatives for complex text
 * when simplified language mode is enabled.
 */
interface SimplifiedTextProps {
  standard: string;
  simplified: string;
  className?: string;
}

export function SimplifiedText({
  standard,
  simplified,
  className = "",
}: SimplifiedTextProps) {
  const { settings } = useSettingsStore();

  const text = settings.dyslexiaSimplifiedLanguage ? simplified : standard;

  return <span className={className}>{text}</span>;
}
