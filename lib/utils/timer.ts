/**
 * Timer utilities for practice sessions
 */

export interface TimerState {
  isRunning: boolean;
  timeElapsed: number; // seconds
  startTime: number | null; // timestamp
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeVerbose(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) {
    return `${secs}s`;
  }

  return `${mins}m ${secs}s`;
}

export function getTimeColor(seconds: number, targetSeconds: number): string {
  const ratio = seconds / targetSeconds;

  if (ratio < 0.5) {
    return 'text-green-600 dark:text-green-400';
  } else if (ratio < 0.8) {
    return 'text-yellow-600 dark:text-yellow-400';
  } else if (ratio < 1.0) {
    return 'text-orange-600 dark:text-orange-400';
  } else {
    return 'text-red-600 dark:text-red-400';
  }
}

export function getProgressColor(accuracy: number): string {
  if (accuracy >= 0.9) return 'bg-green-500';
  if (accuracy >= 0.7) return 'bg-blue-500';
  if (accuracy >= 0.5) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function calculateAverageTime(times: number[]): number {
  if (times.length === 0) return 0;
  return Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return correct / total;
}
