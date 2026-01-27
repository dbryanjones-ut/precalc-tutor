"use client";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useEffect } from "react";
import { DyslexiaMode } from "./DyslexiaMode";
import { ReadingRuler } from "./ReadingRuler";
import { FocusTimer } from "./FocusTimer";
import { ColorBlindMode } from "./ColorBlindMode";

/**
 * AccessibilityProvider Component
 *
 * Central provider that coordinates all accessibility features:
 * - Applies global accessibility settings
 * - Manages font loading
 * - Coordinates multiple accessibility modes
 * - Ensures WCAG 2.1 AA compliance
 *
 * This component should be placed at the root level of the application
 * to ensure accessibility features work across all pages.
 */
export function AccessibilityProvider() {
  const { settings } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    // Apply reduced motion preference
    if (settings.reducedMotion) {
      root.classList.add("reduce-motion");
      // Also respect system preference
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        root.classList.add("reduce-motion");
      }
    } else {
      root.classList.remove("reduce-motion");
    }

    // Apply high contrast mode
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Apply font size
    const fontSizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    root.style.setProperty("--base-font-size", fontSizeMap[settings.fontSize]);

    // Apply math font size
    const mathFontSizeMap = {
      small: "0.9em",
      medium: "1em",
      large: "1.2em",
    };
    root.style.setProperty(
      "--math-font-size",
      mathFontSizeMap[settings.mathFontSize]
    );

    // Apply ADHD minimize distractions mode
    if (settings.adhd.minimizeDistractions) {
      root.classList.add("minimize-distractions");
    } else {
      root.classList.remove("minimize-distractions");
    }

    // Set ARIA live regions politeness based on settings
    // More assertive announcements if ADHD support is enabled
    const liveRegionPoliteness = settings.adhd.sosProtocolAlwaysVisible
      ? "polite"
      : "off";
    root.setAttribute("data-live-region-politeness", liveRegionPoliteness);

    return () => {
      // Cleanup on unmount (though this component should never unmount)
      root.classList.remove(
        "reduce-motion",
        "high-contrast",
        "minimize-distractions"
      );
    };
  }, [
    settings.reducedMotion,
    settings.highContrast,
    settings.fontSize,
    settings.mathFontSize,
    settings.adhd.minimizeDistractions,
    settings.adhd.sosProtocolAlwaysVisible,
  ]);

  // Load OpenDyslexic font if needed
  useEffect(() => {
    if (settings.dyslexiaFont) {
      // Check if font is already loaded
      if (!document.getElementById("opendyslexic-font")) {
        const link = document.createElement("link");
        link.id = "opendyslexic-font";
        link.rel = "stylesheet";
        link.href = "https://fonts.cdnfonts.com/css/opendyslexic";
        document.head.appendChild(link);
      }
    }
  }, [settings.dyslexiaFont]);

  // Keyboard navigation enhancement
  useEffect(() => {
    const handleKeyboardNav = (e: KeyboardEvent) => {
      // Make keyboard focus more visible
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-nav");
      }
    };

    const handleMouseNav = () => {
      document.body.classList.remove("keyboard-nav");
    };

    window.addEventListener("keydown", handleKeyboardNav);
    window.addEventListener("mousedown", handleMouseNav);

    return () => {
      window.removeEventListener("keydown", handleKeyboardNav);
      window.removeEventListener("mousedown", handleMouseNav);
    };
  }, []);

  // Skip to main content link for screen readers
  useEffect(() => {
    const skipLink = document.createElement("a");
    skipLink.href = "#main-content";
    skipLink.textContent = "Skip to main content";
    skipLink.className =
      "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded";
    skipLink.tabIndex = 0;

    // Insert as first child of body
    if (document.body.firstChild) {
      document.body.insertBefore(skipLink, document.body.firstChild);
    } else {
      document.body.appendChild(skipLink);
    }

    return () => {
      skipLink.remove();
    };
  }, []);

  // Announce important state changes for screen readers
  useEffect(() => {
    const announcer = document.createElement("div");
    announcer.id = "accessibility-announcer";
    announcer.setAttribute("role", "status");
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    document.body.appendChild(announcer);

    return () => {
      announcer.remove();
    };
  }, []);

  return (
    <>
      {/* Individual accessibility mode components */}
      <DyslexiaMode />
      <ReadingRuler />
      <FocusTimer />
      <ColorBlindMode />

      {/* Screen reader only live region for global announcements */}
      <div
        id="sr-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}

/**
 * Utility function to announce messages to screen readers
 * Can be called from anywhere in the application
 */
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  const announcer = document.getElementById("accessibility-announcer");
  if (announcer) {
    announcer.setAttribute("aria-live", priority);
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = "";
    }, 1000);
  }
}
