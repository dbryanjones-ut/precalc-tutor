"use client";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useEffect, useState, useCallback } from "react";

/**
 * ReadingRuler Component
 *
 * Displays a horizontal reading ruler that helps students with dyslexia
 * maintain focus on a single line of text. Features:
 * - Follows mouse cursor or keyboard focus
 * - Adjustable height and opacity
 * - Tinted background above/below for reduced distraction
 * - Keyboard controls (arrow keys to move, Escape to toggle)
 * - Persists preference
 */
export function ReadingRuler() {
  const { settings, updateSettings } = useSettingsStore();
  const [position, setPosition] = useState({ y: 0 });
  const [isMouseControl, setIsMouseControl] = useState(true);

  // Handle mouse movement
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!settings.readingRuler || !isMouseControl) return;
      setPosition({ y: e.clientY });
    },
    [settings.readingRuler, isMouseControl]
  );

  // Handle keyboard controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!settings.readingRuler) return;

      switch (e.key) {
        case "Escape":
          // Toggle reading ruler off
          updateSettings({ readingRuler: false });
          break;
        case "ArrowUp":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsMouseControl(false);
            setPosition((prev) => ({ y: Math.max(0, prev.y - 10) }));
          }
          break;
        case "ArrowDown":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsMouseControl(false);
            setPosition((prev) => ({ y: Math.min(window.innerHeight, prev.y + 10) }));
          }
          break;
        case "m":
        case "M":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsMouseControl(!isMouseControl);
          }
          break;
      }
    },
    [settings.readingRuler, updateSettings, isMouseControl]
  );

  // Handle focus events
  const handleFocus = useCallback(
    (e: FocusEvent) => {
      if (!settings.readingRuler) return;

      const target = e.target as HTMLElement;
      if (target && target.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        setPosition({ y: rect.top + rect.height / 2 });
        setIsMouseControl(false);
      }
    },
    [settings.readingRuler]
  );

  useEffect(() => {
    if (!settings.readingRuler) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("focusin", handleFocus as EventListener);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("focusin", handleFocus as EventListener);
    };
  }, [settings.readingRuler, handleMouseMove, handleKeyDown, handleFocus]);

  if (!settings.readingRuler) return null;

  const rulerHeight = settings.readingRulerHeight;
  const rulerTop = position.y - rulerHeight / 2;
  const opacity = settings.readingRulerOpacity;

  return (
    <>
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Reading ruler active. Press Escape to toggle off. Use Ctrl+Arrow keys to move manually.
        Press Ctrl+M to toggle mouse control.
      </div>

      {/* Top overlay */}
      <div
        className="fixed inset-x-0 top-0 pointer-events-none z-50 transition-all duration-100"
        style={{
          height: `${rulerTop}px`,
          backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        }}
        aria-hidden="true"
      />

      {/* Reading ruler highlight */}
      <div
        className="fixed inset-x-0 pointer-events-none z-50 transition-all duration-100"
        style={{
          top: `${rulerTop}px`,
          height: `${rulerHeight}px`,
          boxShadow: `0 0 0 2px rgba(59, 130, 246, 0.5)`,
          backgroundColor: "transparent",
        }}
        role="region"
        aria-label="Reading ruler position"
        aria-hidden="true"
      />

      {/* Bottom overlay */}
      <div
        className="fixed inset-x-0 bottom-0 pointer-events-none z-50 transition-all duration-100"
        style={{
          top: `${rulerTop + rulerHeight}px`,
          backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        }}
        aria-hidden="true"
      />

      {/* Control indicator */}
      <div
        className="fixed bottom-4 right-4 px-3 py-2 bg-black/70 text-white text-xs rounded-lg pointer-events-none z-50 transition-opacity duration-300"
        role="status"
        aria-live="polite"
      >
        {isMouseControl ? "Mouse Control" : "Keyboard Control"}
      </div>
    </>
  );
}
