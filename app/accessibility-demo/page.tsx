"use client";

import { useState } from "react";
import {
  ContentChunker,
  SimplifiedText,
  SOSProtocol,
  TaskSequencer,
  ProgressChunker,
  ColorBlindLegend,
} from "@/components/accessibility";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSettingsStore } from "@/stores/useSettingsStore";

/**
 * Accessibility Demo Page
 *
 * Demonstrates all accessibility features in action.
 * Use this page to test and showcase accessibility capabilities.
 */
export default function AccessibilityDemoPage() {
  const { settings } = useSettingsStore();
  const [progress, setProgress] = useState(7);

  const longText = `Understanding trigonometric functions is essential for success in precalculus.
    The sine function represents the y-coordinate of a point on the unit circle.
    The cosine function represents the x-coordinate of a point on the unit circle.
    These functions are periodic, meaning they repeat their values in regular intervals.
    The period of both sine and cosine is 2π radians or 360 degrees.
    Learning to work with these functions will prepare you for calculus and beyond.`;

  const taskSteps = [
    {
      id: "identify",
      title: "Identify the Problem Type",
      description: "What kind of math problem is this?",
      content: (
        <div className="space-y-3">
          <p>Look at the equation: sin(x) = 0.5</p>
          <p className="text-sm text-muted-foreground">
            This is a trigonometric equation. We need to find the angle x.
          </p>
          <Button size="sm">I understand</Button>
        </div>
      ),
    },
    {
      id: "recall",
      title: "Recall Key Concepts",
      description: "What do you remember about sine?",
      content: (
        <div className="space-y-3">
          <p>The sine function:</p>
          <ul className="list-disc ml-6 space-y-1 text-sm">
            <li>Ranges from -1 to 1</li>
            <li>sin(30°) = 0.5</li>
            <li>sin(150°) = 0.5</li>
            <li>Repeats every 360°</li>
          </ul>
          <Button size="sm">Got it</Button>
        </div>
      ),
    },
    {
      id: "solve",
      title: "Solve the Equation",
      description: "Find all solutions",
      content: (
        <div className="space-y-3">
          <p className="font-semibold">Solutions:</p>
          <p>x = 30° + 360°n or x = 150° + 360°n</p>
          <p className="text-sm text-muted-foreground">where n is any integer</p>
          <Button size="sm">Check answer</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Accessibility Features Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates all accessibility features. Adjust settings in the{" "}
          <a href="/settings" className="link-contrast text-primary">
            Settings page
          </a>{" "}
          to see them in action.
        </p>
      </div>

      {/* Current Settings Status */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-bold mb-4">Current Accessibility Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={settings.dyslexiaMode ? "text-green-600" : "text-muted-foreground"}>
              {settings.dyslexiaMode ? "✓" : "○"}
            </span>
            <span>Dyslexia Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={settings.readingRuler ? "text-green-600" : "text-muted-foreground"}>
              {settings.readingRuler ? "✓" : "○"}
            </span>
            <span>Reading Ruler</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={settings.adhd.sosProtocolAlwaysVisible ? "text-green-600" : "text-muted-foreground"}>
              {settings.adhd.sosProtocolAlwaysVisible ? "✓" : "○"}
            </span>
            <span>S.O.S. Protocol</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={settings.adhd.focusTimerEnabled ? "text-green-600" : "text-muted-foreground"}>
              {settings.adhd.focusTimerEnabled ? "✓" : "○"}
            </span>
            <span>Focus Timer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={settings.colorBlindMode !== "none" ? "text-green-600" : "text-muted-foreground"}>
              {settings.colorBlindMode !== "none" ? "✓" : "○"}
            </span>
            <span>Color Blind Mode: {settings.colorBlindMode}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={settings.reducedMotion ? "text-green-600" : "text-muted-foreground"}>
              {settings.reducedMotion ? "✓" : "○"}
            </span>
            <span>Reduced Motion</span>
          </div>
        </div>
      </Card>

      {/* S.O.S. Protocol Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">S.O.S. Protocol</h2>
        <p className="text-muted-foreground mb-4">
          Always-visible help for when students feel stuck, overwhelmed, or scared.
        </p>
        <SOSProtocol />
      </section>

      {/* Content Chunking Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Content Chunking</h2>
        <p className="text-muted-foreground mb-4">
          Long text broken into digestible chunks for dyslexic readers.
        </p>
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Without Chunking:</h3>
          <p className="mb-6">{longText}</p>

          <h3 className="font-semibold mb-3">With Chunking (Dyslexia Mode):</h3>
          <ContentChunker content={longText} chunkSize={2} />
        </Card>
      </section>

      {/* Simplified Text Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Simplified Language</h2>
        <p className="text-muted-foreground mb-4">
          Complex explanations simplified when dyslexia simplified language mode is enabled.
        </p>
        <Card className="p-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Standard:</p>
            <p className="font-medium">
              The derivative represents the instantaneous rate of change of a function.
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Simplified:</p>
            <p className="font-medium">
              <SimplifiedText
                standard="The derivative represents the instantaneous rate of change of a function."
                simplified="The derivative tells us how fast something is changing right now."
              />
            </p>
          </div>
        </Card>
      </section>

      {/* Task Sequencer Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Task Sequencing</h2>
        <p className="text-muted-foreground mb-4">
          One step at a time to prevent overwhelm (ADHD support).
        </p>
        <Card className="p-6">
          <TaskSequencer
            steps={taskSteps}
            onComplete={() => alert("All steps completed!")}
          />
        </Card>
      </section>

      {/* Progress Chunking Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Progress Chunking</h2>
        <p className="text-muted-foreground mb-4">
          Break large goals into encouraging smaller chunks.
        </p>
        <Card className="p-6 space-y-6">
          <div>
            <ProgressChunker
              current={progress}
              total={25}
              chunkSize={5}
              label="Practice Problems"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setProgress(Math.min(25, progress + 1))}
              size="sm"
            >
              Complete One More
            </Button>
            <Button
              onClick={() => setProgress(Math.max(0, progress - 1))}
              size="sm"
              variant="outline"
            >
              Undo
            </Button>
            <Button
              onClick={() => setProgress(0)}
              size="sm"
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </Card>
      </section>

      {/* Color Blind Legend Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Color Blind Support</h2>
        <p className="text-muted-foreground mb-4">
          Colors with optional patterns for better differentiation.
        </p>
        <Card className="p-6">
          <ColorBlindLegend
            items={[
              { label: "Sine Function", color: "oklch(0.5 0.25 260)", pattern: "dots" },
              { label: "Cosine Function", color: "oklch(0.65 0.18 50)", pattern: "stripes" },
              { label: "Tangent Function", color: "oklch(0.7 0.15 280)", pattern: "checkers" },
              { label: "Cotangent Function", color: "oklch(0.45 0.15 240)", pattern: "waves" },
            ]}
            className="mb-4"
          />
          <p className="text-sm text-muted-foreground mt-4">
            {settings.colorBlindUsePatterns
              ? "Patterns are enabled for better color differentiation."
              : "Enable patterns in settings for additional differentiation."}
          </p>
        </Card>
      </section>

      {/* Keyboard Navigation */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Keyboard Navigation</h2>
        <p className="text-muted-foreground mb-4">
          All features are fully keyboard accessible.
        </p>
        <Card className="p-6">
          <div className="space-y-3 text-sm">
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Tab</kbd> -{" "}
              Move focus forward
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Shift + Tab</kbd> -{" "}
              Move focus backward
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> or{" "}
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> -{" "}
              Activate buttons
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Escape</kbd> -{" "}
              Close dialogs, toggle reading ruler
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + ↑/↓</kbd> -{" "}
              Move reading ruler (when enabled)
            </div>
          </div>
        </Card>
      </section>

      {/* Screen Reader Support */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Screen Reader Support</h2>
        <p className="text-muted-foreground mb-4">
          All components include proper ARIA labels and live regions.
        </p>
        <Card className="p-6">
          <ul className="space-y-2 text-sm">
            <li>✓ Semantic HTML structure</li>
            <li>✓ ARIA labels on all interactive elements</li>
            <li>✓ Live regions for dynamic content updates</li>
            <li>✓ Skip to main content link</li>
            <li>✓ Proper heading hierarchy</li>
            <li>✓ Alt text for images</li>
            <li>✓ Form labels associated with inputs</li>
          </ul>
        </Card>
      </section>

      {/* Golden Words */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Golden Words</h2>
        <p className="text-muted-foreground mb-4">
          Key vocabulary terms emphasized when enabled.
        </p>
        <Card className="p-6">
          <p>
            The{" "}
            <span className={settings.emphasizeGoldenWords ? "golden-word" : "font-semibold"}>
              unit circle
            </span>{" "}
            is a circle with a{" "}
            <span className={settings.emphasizeGoldenWords ? "golden-word" : "font-semibold"}>
              radius
            </span>{" "}
            of 1, centered at the{" "}
            <span className={settings.emphasizeGoldenWords ? "golden-word" : "font-semibold"}>
              origin
            </span>{" "}
            of a coordinate plane.
          </p>
        </Card>
      </section>

      {/* Testing Instructions */}
      <section className="bg-muted/50 border border-border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Testing Instructions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">To Test Dyslexia Mode:</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>Go to Settings → Accessibility</li>
              <li>Enable &ldquo;Dyslexia Mode&rdquo;</li>
              <li>Try different line spacing values</li>
              <li>Test color overlays</li>
              <li>Return to this page to see changes</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">To Test Reading Ruler:</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>Enable &ldquo;Reading Ruler&rdquo; in settings</li>
              <li>Move your mouse over text to see the ruler follow</li>
              <li>Press Ctrl+Arrow keys to move it manually</li>
              <li>Press Escape to toggle off</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">To Test Focus Timer:</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>Enable &ldquo;Focus Timer&rdquo; in ADHD settings</li>
              <li>Adjust work and break intervals</li>
              <li>Timer appears in bottom-left corner</li>
              <li>Click Start to begin a focus session</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">To Test Color Blind Mode:</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>Select a color blind mode in settings</li>
              <li>Enable &ldquo;Use Patterns&rdquo; for additional differentiation</li>
              <li>Look at the chart legend above</li>
              <li>Colors and patterns should be clearly distinct</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
