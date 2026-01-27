/**
 * Adaptive Difficulty Calculator
 *
 * Dynamically adjusts problem difficulty based on user performance,
 * historical accuracy, time spent, and learning patterns.
 */

import type { Problem, ProblemAttempt, DifficultyLevel } from "@/types";
import type { UserProgress } from "@/types/progress";

/**
 * Difficulty adjustment configuration
 */
export const DIFFICULTY_CONFIG = {
  // Accuracy thresholds for adjustments
  HIGH_ACCURACY: 0.85, // 85%+ accuracy
  LOW_ACCURACY: 0.5,   // <50% accuracy

  // Time performance thresholds
  FAST_MULTIPLIER: 0.8,  // Completed in <80% of expected time
  SLOW_MULTIPLIER: 1.5,  // Took >150% of expected time

  // Minimum attempts before adjusting difficulty
  MIN_ATTEMPTS: 3,

  // Weights for difficulty calculation
  WEIGHTS: {
    accuracy: 0.4,
    timePerformance: 0.25,
    hintsUsed: 0.2,
    recentTrend: 0.15,
  },
} as const;

/**
 * Numeric difficulty scale (for calculations)
 */
export type NumericDifficulty = 1 | 2 | 3 | 4;

/**
 * Problem performance history
 */
export interface ProblemPerformance {
  problemId: string;
  attempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTimeSeconds: number;
  averageHintsUsed: number;
  recentAccuracy: number; // Last 5 attempts
  trend: "improving" | "stable" | "declining";
}

/**
 * User performance on a topic
 */
export interface TopicPerformance {
  topic: string;
  totalAttempts: number;
  accuracy: number;
  averageTime: number;
  masteryLevel: number; // 0-1
  weakPoints: string[]; // Specific problem types
  strongPoints: string[];
}

/**
 * Difficulty recommendation result
 */
export interface DifficultyRecommendation {
  currentDifficulty: DifficultyLevel;
  recommendedDifficulty: DifficultyLevel;
  confidence: number; // 0-1
  reason: string;
  shouldAdjust: boolean;
}

/**
 * Calculate appropriate difficulty for a problem based on user history.
 *
 * @param problem - The problem to evaluate
 * @param userHistory - User's attempt history
 * @returns Recommended difficulty level
 *
 * @example
 * const difficulty = calculateDifficulty(problem, attempts);
 * // Returns "facile", "medio", or "difficile" based on performance
 */
export function calculateDifficulty(
  problem: Problem,
  userHistory: ProblemAttempt[]
): DifficultyLevel {
  // Filter relevant attempts
  const problemAttempts = userHistory.filter(
    (attempt) => attempt.problemId === problem.id
  );

  // If insufficient data, use problem's base difficulty
  if (problemAttempts.length < DIFFICULTY_CONFIG.MIN_ATTEMPTS) {
    return problem.difficulty;
  }

  const performance = analyzePerformance(problemAttempts);
  const score = calculateDifficultyScore(performance);

  // Convert score to difficulty level
  if (score < 1.5) return "facile";
  if (score < 2.5) return "medio";
  return "difficile";
}

/**
 * Adjust problem difficulty based on recent performance.
 *
 * @param problem - Current problem
 * @param accuracy - Recent accuracy (0-1)
 * @param averageTime - Average time spent
 * @param hintsUsed - Average hints used
 * @returns New recommended difficulty level
 */
export function adjustDifficultyBasedOnPerformance(
  problem: Problem,
  accuracy: number,
  averageTime: number,
  hintsUsed: number = 0
): DifficultyRecommendation {
  const currentDifficulty = problem.difficulty;
  const currentNumeric = difficultyToNumeric(currentDifficulty);

  let adjustmentScore = 0;
  const reasons: string[] = [];

  // Factor 1: Accuracy
  if (accuracy >= DIFFICULTY_CONFIG.HIGH_ACCURACY) {
    adjustmentScore += 1;
    reasons.push("High accuracy");
  } else if (accuracy <= DIFFICULTY_CONFIG.LOW_ACCURACY) {
    adjustmentScore -= 1;
    reasons.push("Low accuracy");
  }

  // Factor 2: Time performance
  const timeRatio = averageTime / problem.estimatedTimeSeconds;
  if (timeRatio <= DIFFICULTY_CONFIG.FAST_MULTIPLIER) {
    adjustmentScore += 0.5;
    reasons.push("Completing quickly");
  } else if (timeRatio >= DIFFICULTY_CONFIG.SLOW_MULTIPLIER) {
    adjustmentScore -= 0.5;
    reasons.push("Taking too long");
  }

  // Factor 3: Hints usage
  if (hintsUsed === 0 && accuracy >= 0.8) {
    adjustmentScore += 0.5;
    reasons.push("No hints needed");
  } else if (hintsUsed >= 2) {
    adjustmentScore -= 0.5;
    reasons.push("Frequently needs hints");
  }

  // Calculate new difficulty
  let newNumeric = currentNumeric;
  if (adjustmentScore >= 1.5) {
    newNumeric = Math.min(3, currentNumeric + 1) as NumericDifficulty;
  } else if (adjustmentScore <= -1.5) {
    newNumeric = Math.max(1, currentNumeric - 1) as NumericDifficulty;
  }

  const recommendedDifficulty = numericToDifficulty(newNumeric);
  const shouldAdjust = recommendedDifficulty !== currentDifficulty;
  const confidence = Math.min(1, Math.abs(adjustmentScore) / 2);

  return {
    currentDifficulty,
    recommendedDifficulty,
    confidence,
    reason: reasons.join(", "),
    shouldAdjust,
  };
}

/**
 * Recommend the next best problem for the user based on their progress.
 * Uses adaptive difficulty, topic mastery, and spaced repetition principles.
 *
 * @param userProgress - Complete user progress data
 * @param availableProblems - Pool of problems to choose from
 * @param options - Filtering options
 * @returns Best problem to practice next
 */
export function recommendNextProblem(
  userProgress: UserProgress,
  availableProblems: Problem[],
  options?: {
    unit?: string;
    topic?: string;
    maxDifficulty?: DifficultyLevel;
    excludeRecent?: number; // Exclude problems from last N attempts
  }
): Problem | null {
  if (availableProblems.length === 0) return null;

  // Filter problems based on options
  let filteredProblems = [...availableProblems];

  if (options?.unit) {
    filteredProblems = filteredProblems.filter((p) => p.unit === options.unit);
  }

  if (options?.topic) {
    filteredProblems = filteredProblems.filter((p) => p.topic === options.topic);
  }

  if (options?.maxDifficulty) {
    const maxNumeric = difficultyToNumeric(options.maxDifficulty);
    filteredProblems = filteredProblems.filter(
      (p) => difficultyToNumeric(p.difficulty) <= maxNumeric
    );
  }

  if (filteredProblems.length === 0) return null;

  // Score each problem
  const scoredProblems = filteredProblems.map((problem) => {
    const score = scoreProblem(problem, userProgress);
    return { problem, score };
  });

  // Sort by score (highest first)
  scoredProblems.sort((a, b) => b.score - a.score);

  return scoredProblems[0].problem;
}

/**
 * Analyze performance metrics from attempt history.
 */
function analyzePerformance(attempts: ProblemAttempt[]): ProblemPerformance {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = correct / total;

  const totalTime = attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0);
  const averageTime = totalTime / total;

  const totalHints = attempts.reduce((sum, a) => sum + a.hintsUsed, 0);
  const averageHints = totalHints / total;

  // Recent trend (last 5 attempts)
  const recentAttempts = attempts.slice(-5);
  const recentCorrect = recentAttempts.filter((a) => a.correct).length;
  const recentAccuracy = recentCorrect / recentAttempts.length;

  // Determine trend
  let trend: "improving" | "stable" | "declining";
  if (recentAccuracy > accuracy + 0.1) {
    trend = "improving";
  } else if (recentAccuracy < accuracy - 0.1) {
    trend = "declining";
  } else {
    trend = "stable";
  }

  return {
    problemId: attempts[0].problemId,
    attempts: total,
    correctAttempts: correct,
    accuracy,
    averageTimeSeconds: averageTime,
    averageHintsUsed: averageHints,
    recentAccuracy,
    trend,
  };
}

/**
 * Calculate difficulty score from performance (1-3).
 * Higher score = recommend higher difficulty
 */
function calculateDifficultyScore(performance: ProblemPerformance): number {
  const { accuracy, averageHintsUsed, trend } = performance;

  // Base score from accuracy (higher accuracy = higher recommended difficulty)
  // Maps: 1.0 accuracy → 3, 0.0 accuracy → 1
  let score = 1 + accuracy * 2;

  // Adjust for hints (more hints = lower recommended difficulty)
  score -= averageHintsUsed * 0.2;

  // Adjust for trend
  if (trend === "improving") {
    score += 0.3; // Improving? Try harder problems
  } else if (trend === "declining") {
    score -= 0.3; // Declining? Easier problems
  }

  // Clamp to 1-3
  return Math.max(1, Math.min(3, score));
}

/**
 * Score a problem for recommendation (higher = better to practice).
 */
function scoreProblem(problem: Problem, userProgress: UserProgress): number {
  let score = 0;

  // Factor 1: Unit mastery (practice weak units more)
  const unitProgress = userProgress.units[problem.unit];
  if (unitProgress) {
    score += (1 - unitProgress.mastery) * 30; // Max 30 points
  }

  // Factor 2: Topic mastery
  if (unitProgress?.weakTopics.includes(problem.topic)) {
    score += 25; // Prioritize weak topics
  }

  // Factor 3: Practice frequency (less practiced = higher score)
  const practiceCount = problem.practiceCount || 0;
  score += Math.max(0, 20 - practiceCount * 2); // Max 20 points

  // Factor 4: Success rate (lower = needs more practice)
  const successRate = problem.successRate || 0;
  score += (1 - successRate) * 15; // Max 15 points

  // Factor 5: Time since last practice
  if (problem.lastPracticed) {
    const daysSince = getDaysSince(problem.lastPracticed);
    score += Math.min(daysSince, 10); // Max 10 points
  } else {
    score += 10; // Never practiced = full points
  }

  return score;
}

/**
 * Convert difficulty level to numeric (1-3).
 */
function difficultyToNumeric(difficulty: DifficultyLevel): NumericDifficulty {
  switch (difficulty) {
    case "facile":
      return 1;
    case "medio":
      return 2;
    case "difficile":
      return 3;
    case "unrated":
      return 2; // Default to medium
  }
}

/**
 * Convert numeric difficulty to level.
 */
function numericToDifficulty(numeric: NumericDifficulty): DifficultyLevel {
  switch (numeric) {
    case 1:
      return "facile";
    case 2:
      return "medio";
    case 3:
      return "difficile";
    default:
      return "medio";
  }
}

/**
 * Get days since a date string.
 */
function getDaysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Analyze topic performance across all problems.
 *
 * @param problems - All problems in the topic
 * @param attempts - User's attempt history
 * @returns Topic performance analysis
 */
export function analyzeTopicPerformance(
  problems: Problem[],
  attempts: ProblemAttempt[]
): TopicPerformance {
  if (problems.length === 0) {
    return {
      topic: "",
      totalAttempts: 0,
      accuracy: 0,
      averageTime: 0,
      masteryLevel: 0,
      weakPoints: [],
      strongPoints: [],
    };
  }

  const topic = problems[0].topic;
  const problemIds = new Set(problems.map((p) => p.id));
  const topicAttempts = attempts.filter((a) => problemIds.has(a.problemId));

  const totalAttempts = topicAttempts.length;
  const correctAttempts = topicAttempts.filter((a) => a.correct).length;
  const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

  const totalTime = topicAttempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0);
  const averageTime = totalAttempts > 0 ? totalTime / totalAttempts : 0;

  // Calculate mastery level (0-1)
  const masteryLevel = calculateMasteryLevel(problems, topicAttempts);

  // Identify weak and strong points
  const problemPerformance = problems.map((problem) => {
    const problemAttempts = topicAttempts.filter(
      (a) => a.problemId === problem.id
    );
    const problemAccuracy =
      problemAttempts.length > 0
        ? problemAttempts.filter((a) => a.correct).length /
          problemAttempts.length
        : 0;
    return { problem, accuracy: problemAccuracy, attempts: problemAttempts.length };
  });

  const weakPoints = problemPerformance
    .filter((p) => p.attempts >= 2 && p.accuracy < 0.6)
    .map((p) => p.problem.id);

  const strongPoints = problemPerformance
    .filter((p) => p.attempts >= 2 && p.accuracy >= 0.85)
    .map((p) => p.problem.id);

  return {
    topic,
    totalAttempts,
    accuracy,
    averageTime,
    masteryLevel,
    weakPoints,
    strongPoints,
  };
}

/**
 * Calculate overall mastery level for a set of problems (0-1).
 */
function calculateMasteryLevel(
  problems: Problem[],
  attempts: ProblemAttempt[]
): number {
  if (problems.length === 0) return 0;

  let totalMastery = 0;

  problems.forEach((problem) => {
    const problemAttempts = attempts.filter(
      (a) => a.problemId === problem.id
    );

    if (problemAttempts.length === 0) {
      // Not attempted = 0 mastery
      totalMastery += 0;
    } else {
      const correct = problemAttempts.filter((a) => a.correct).length;
      const accuracy = correct / problemAttempts.length;

      // Weight mastery by number of attempts (more attempts = more confident)
      const attemptWeight = Math.min(1, problemAttempts.length / 5);
      const problemMastery = accuracy * attemptWeight;

      totalMastery += problemMastery;
    }
  });

  return totalMastery / problems.length;
}

/**
 * Get personalized difficulty targets for each unit.
 *
 * @param userProgress - User progress data
 * @returns Map of unit to recommended difficulty range
 */
export function getPersonalizedDifficultyTargets(
  userProgress: UserProgress
): Map<string, { min: DifficultyLevel; max: DifficultyLevel }> {
  const targets = new Map<
    string,
    { min: DifficultyLevel; max: DifficultyLevel }
  >();

  Object.entries(userProgress.units).forEach(([unit, progress]) => {
    const mastery = progress.mastery;

    let min: DifficultyLevel;
    let max: DifficultyLevel;

    if (mastery < 0.3) {
      // Low mastery: start easy
      min = "facile";
      max = "facile";
    } else if (mastery < 0.6) {
      // Building: easy to medium
      min = "facile";
      max = "medio";
    } else if (mastery < 0.85) {
      // Proficient: medium to hard
      min = "medio";
      max = "difficile";
    } else {
      // High mastery: focus on challenging
      min = "medio";
      max = "difficile";
    }

    targets.set(unit, { min, max });
  });

  return targets;
}
