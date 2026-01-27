"use client";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useEffect, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * FocusTimer Component
 *
 * Pomodoro-style timer to help students with ADHD maintain focus:
 * - Customizable work/break intervals
 * - Visual countdown with progress ring
 * - Break notifications
 * - Session tracking
 * - Gentle, non-disruptive reminders
 */
export function FocusTimer() {
  const { settings } = useSettingsStore();
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(settings.adhd.breakIntervalMinutes * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const workDuration = settings.adhd.breakIntervalMinutes * 60;
  const breakDuration = settings.adhd.breakDurationMinutes * 60;
  const totalDuration = isBreak ? breakDuration : workDuration;
  const progress = ((totalDuration - secondsLeft) / totalDuration) * 100;

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle timer completion
  const handleComplete = useCallback(() => {
    if (settings.timerSounds && settings.soundEnabled) {
      // Play gentle completion sound
      const audio = new Audio("/sounds/timer-complete.mp3");
      audio.volume = settings.soundVolume;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    }

    if (isBreak) {
      // Break complete, start work session
      toast.success("Break complete! Ready to focus?", {
        description: "Click Start to begin your next focus session.",
        duration: 5000,
      });
      setIsBreak(false);
      setSecondsLeft(workDuration);
      setIsRunning(false);
    } else {
      // Work session complete, start break
      setSessionsCompleted((prev) => prev + 1);
      toast.success("Great work! Time for a break.", {
        description: `You've completed ${sessionsCompleted + 1} focus session${sessionsCompleted + 1 !== 1 ? "s" : ""} today.`,
        duration: 5000,
      });
      setIsBreak(true);
      setSecondsLeft(breakDuration);

      // Auto-start break if break reminders are enabled
      if (settings.adhd.breakReminders) {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    }
  }, [
    isBreak,
    workDuration,
    breakDuration,
    sessionsCompleted,
    settings.timerSounds,
    settings.soundEnabled,
    settings.soundVolume,
    settings.adhd.breakReminders,
  ]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, handleComplete]);

  // Update timer when settings change
  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(isBreak ? breakDuration : workDuration);
    }
  }, [workDuration, breakDuration, isBreak, isRunning]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);

    // Announce state change for screen readers
    const announcement = isRunning
      ? "Timer paused"
      : `Timer started. ${formatTime(secondsLeft)} remaining.`;

    toast(announcement, { duration: 2000 });
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(isBreak ? breakDuration : workDuration);
    toast("Timer reset", { duration: 2000 });
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!settings.adhd.focusTimerEnabled) return null;

  // Minimized view
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 bg-card border border-border rounded-lg shadow-lg p-3 z-40 cursor-pointer hover:bg-accent transition-colors"
        onClick={() => setIsMinimized(false)}
        role="button"
        tabIndex={0}
        aria-label={`Expand focus timer. ${formatTime(secondsLeft)} remaining in ${isBreak ? "break" : "focus"} session`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsMinimized(false);
          }
        }}
      >
        <div className="flex items-center gap-2">
          {isBreak ? (
            <Coffee className="w-4 h-4 text-green-500" aria-hidden="true" />
          ) : (
            <Brain className="w-4 h-4 text-blue-500" aria-hidden="true" />
          )}
          <span className="text-sm font-medium tabular-nums">{formatTime(secondsLeft)}</span>
          <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div
      className="fixed bottom-4 right-4 bg-card border border-border rounded-lg shadow-lg p-4 z-40 min-w-[280px]"
      role="timer"
      aria-label={`Focus timer: ${formatTime(secondsLeft)} remaining in ${isBreak ? "break" : "focus"} session`}
    >
      {/* Header with minimize button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isBreak ? (
            <>
              <Coffee className="w-4 h-4 text-green-500" aria-hidden="true" />
              <span className="text-sm font-medium text-green-500">Break Time</span>
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 text-blue-500" aria-hidden="true" />
              <span className="text-sm font-medium text-blue-500">Focus Time</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground" aria-label={`${sessionsCompleted} sessions completed today`}>
            {sessionsCompleted}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize timer"
            className="h-6 w-6 p-0"
          >
            <ChevronDown className="w-3 h-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Circular progress with time */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90" aria-hidden="true">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
              className={isBreak ? "text-green-500" : "text-blue-500"}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold tabular-nums" aria-live="off">
              {formatTime(secondsLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Screen reader live region for time updates */}
      <div className="sr-only" role="timer" aria-live="polite" aria-atomic="true">
        {isRunning && secondsLeft % 60 === 0 && `${Math.floor(secondsLeft / 60)} minutes remaining`}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          onClick={handleStartPause}
          size="sm"
          className="flex-1"
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 mr-1" aria-hidden="true" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" aria-hidden="true" />
              Start
            </>
          )}
        </Button>
        <Button
          onClick={handleReset}
          size="sm"
          variant="outline"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </Button>
        {isRunning && (
          <Button
            onClick={handleSkip}
            size="sm"
            variant="outline"
            aria-label={`Skip to ${isBreak ? "focus" : "break"} session`}
          >
            Skip
          </Button>
        )}
      </div>

      {/* Helpful tip */}
      <p className="text-xs text-muted-foreground mt-3 text-center">
        {isBreak
          ? "Take a break, stretch, hydrate!"
          : "Stay focused on one task at a time."}
      </p>
    </div>
  );
}
