"use client";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { ReactNode, useState } from "react";
import { ChevronRight, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * ADHDScaffold Component
 *
 * Provides ADHD-friendly scaffolding and support features:
 * - S.O.S. Protocol always-visible toggle
 * - Break reminder system (via FocusTimer)
 * - Minimize distractions mode
 * - Task sequencing helper
 * - Progress chunking
 */

interface SOSProtocolProps {
  className?: string;
}

/**
 * S.O.S. Protocol Display
 *
 * Shows the "Stuck? Overwhelmed? Scared?" protocol
 * to help students when they feel stuck.
 */
export function SOSProtocol({ className }: SOSProtocolProps) {
  const { settings } = useSettingsStore();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!settings.adhd.sosProtocolAlwaysVisible) return null;

  const sosSteps = [
    {
      title: "Take 3 Deep Breaths",
      description: "Slow down your thinking. You've got this.",
    },
    {
      title: "Read the Problem Again",
      description: "Highlight key words. What is it really asking?",
    },
    {
      title: "What Do I Know?",
      description: "Write down given information.",
    },
    {
      title: "What Do I Need?",
      description: "Identify what you're solving for.",
    },
    {
      title: "Ask for a Hint",
      description: "It's okay to need help. That's how we learn.",
    },
  ];

  return (
    <div
      className={cn(
        "bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-400 dark:border-amber-700 rounded-lg p-4",
        className
      )}
      role="complementary"
      aria-label="S.O.S. Protocol - Help when you're stuck"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={isExpanded}
        aria-controls="sos-protocol-content"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <h3 className="font-bold text-amber-900 dark:text-amber-100">
            Feeling Stuck? Use S.O.S.
          </h3>
        </div>
        <ChevronRight
          className={cn(
            "w-5 h-5 text-amber-600 dark:text-amber-400 transition-transform",
            isExpanded && "rotate-90"
          )}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <ol
          id="sos-protocol-content"
          className="mt-4 space-y-3"
          aria-label="S.O.S. Protocol steps"
        >
          {sosSteps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 flex items-center justify-center text-sm font-bold"
                aria-label={`Step ${index + 1}`}
              >
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  {step.title}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * TaskSequencer Component
 *
 * Shows one step at a time to prevent overwhelm.
 */
interface TaskSequencerProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    content: ReactNode;
  }>;
  onComplete?: () => void;
}

export function TaskSequencer({ steps, onComplete }: TaskSequencerProps) {
  const { settings } = useSettingsStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // If task sequencing is disabled, show all steps
  if (!settings.adhd.taskSequencing) {
    return (
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.id} className="space-y-2">
            <h3 className="text-lg font-semibold">
              {index + 1}. {step.title}
            </h3>
            {step.description && (
              <p className="text-muted-foreground">{step.description}</p>
            )}
            <div>{step.content}</div>
          </div>
        ))}
      </div>
    );
  }

  const handleComplete = () => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div
      className="space-y-4"
      role="region"
      aria-label="Task sequencer"
      aria-live="polite"
    >
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "flex-1 h-2 rounded-full transition-colors",
              index < currentStep
                ? "bg-green-500"
                : index === currentStep
                ? "bg-blue-500"
                : "bg-muted"
            )}
            role="progressbar"
            aria-valuenow={index <= currentStep ? 100 : 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Step ${index + 1} ${completedSteps.has(index) ? "completed" : index === currentStep ? "in progress" : "not started"}`}
          />
        ))}
      </div>

      {/* Current step */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold"
            aria-label={`Step ${currentStep + 1} of ${steps.length}`}
          >
            {currentStep + 1}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{step.title}</h3>
            {step.description && (
              <p className="text-muted-foreground">{step.description}</p>
            )}
          </div>
          {completedSteps.has(currentStep) && (
            <CheckCircle className="w-6 h-6 text-green-500" aria-label="Step completed" />
          )}
        </div>

        <div className="mb-6">{step.content}</div>

        {/* Navigation */}
        <div className="flex gap-2">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
            aria-label="Go to previous step"
          >
            Previous
          </Button>
          <Button
            onClick={handleComplete}
            className="flex-1"
            aria-label={
              currentStep === steps.length - 1
                ? "Complete all steps"
                : "Complete step and continue"
            }
          >
            {currentStep === steps.length - 1 ? "Complete" : "Next Step"}
          </Button>
        </div>
      </div>

      {/* Step overview */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          View all steps
        </summary>
        <ol className="mt-2 space-y-1 ml-4">
          {steps.map((s, index) => (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-2",
                index === currentStep && "font-semibold text-foreground",
                completedSteps.has(index) && "text-green-600 dark:text-green-400"
              )}
            >
              {completedSteps.has(index) && (
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
              )}
              {index + 1}. {s.title}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

/**
 * ProgressChunker Component
 *
 * Breaks large progress bars into smaller, more encouraging chunks.
 */
interface ProgressChunkerProps {
  current: number;
  total: number;
  chunkSize?: number;
  label?: string;
}

export function ProgressChunker({
  current,
  total,
  chunkSize = 5,
  label = "Progress",
}: ProgressChunkerProps) {
  const { settings } = useSettingsStore();

  // If progress chunking is disabled, show traditional progress
  if (!settings.adhd.progressChunking) {
    const percentage = (current / total) * 100;
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span className="text-muted-foreground">
            {current} / {total}
          </span>
        </div>
        <div
          className="h-2 bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${current} of ${total} complete`}
        >
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Chunked progress
  const numChunks = Math.ceil(total / chunkSize);
  const currentChunk = Math.floor(current / chunkSize);
  const progressInChunk = current % chunkSize;

  return (
    <div className="space-y-3" role="region" aria-label={`${label} tracker`}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          Chunk {currentChunk + 1} of {numChunks}
        </span>
      </div>

      {/* Current chunk progress */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">Current chunk:</span>
          <span className="text-xs font-medium">
            {progressInChunk} / {Math.min(chunkSize, total - currentChunk * chunkSize)}
          </span>
        </div>
        <div
          className="h-3 bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={(progressInChunk / chunkSize) * 100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Current chunk: ${progressInChunk} of ${chunkSize} complete`}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{
              width: `${(progressInChunk / Math.min(chunkSize, total - currentChunk * chunkSize)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Completed chunks */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-muted-foreground mr-2">Completed chunks:</span>
        {Array.from({ length: numChunks }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-8 h-8 rounded flex items-center justify-center text-xs font-medium",
              index < currentChunk
                ? "bg-green-500 text-white"
                : index === currentChunk
                ? "bg-blue-500 text-white"
                : "bg-muted text-muted-foreground"
            )}
            aria-label={`Chunk ${index + 1}: ${index < currentChunk ? "completed" : index === currentChunk ? "in progress" : "not started"}`}
          >
            {index + 1}
          </div>
        ))}
      </div>

      {/* Total progress (small, secondary) */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
        Overall: {current} / {total} ({Math.round((current / total) * 100)}%)
      </div>
    </div>
  );
}
