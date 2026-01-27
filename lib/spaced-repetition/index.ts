/**
 * Spaced Repetition System
 *
 * Complete implementation of SM-2 algorithm with adaptive difficulty
 * and intelligent review scheduling.
 *
 * @example
 * ```typescript
 * import {
 *   initializeCard,
 *   updateProgress,
 *   getReviewQueue,
 *   buildDailyQueue,
 *   recommendNextProblem,
 * } from '@/lib/spaced-repetition';
 *
 * // Initialize a new review card
 * const card = initializeCard("u1-p001");
 *
 * // After user completes a problem
 * const result = updateProgress(card, true, 45, 60, 0);
 *
 * // Get today's review queue
 * const queue = getReviewQueue(allCards);
 *
 * // Build optimized daily queue
 * const dailyProblems = buildDailyQueue(problems, progress, 20);
 * ```
 */

// Core SM-2 Algorithm
export {
  calculateNextReview,
  getReviewQueue,
  updateProgress,
  calculateQuality,
  getDailyReviewCount,
  initializeCard,
  getCardStats,
  bulkUpdateCards,
  getReviewDistribution,
  SM2_CONFIG,
  type QualityRating,
  type ReviewCard,
  type ReviewResult,
} from "./scheduler";

// Adaptive Difficulty
export {
  calculateDifficulty,
  adjustDifficultyBasedOnPerformance,
  recommendNextProblem,
  analyzeTopicPerformance,
  getPersonalizedDifficultyTargets,
  DIFFICULTY_CONFIG,
  type NumericDifficulty,
  type ProblemPerformance,
  type TopicPerformance,
  type DifficultyRecommendation,
} from "./difficulty-calc";

// Review Scheduling
export {
  buildDailyQueue,
  prioritizeReviews,
  distributeReviews,
  calculateOptimalReviewCount,
  getReviewStats,
  balanceCalculatorMix,
  SCHEDULER_CONFIG,
  type PrioritizedReview,
  type DailySchedule,
  type WeeklySchedule,
} from "./review-scheduler";
