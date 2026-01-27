/**
 * SM-2 Spaced Repetition Scheduler
 *
 * Implements the SuperMemo 2 algorithm for optimal review scheduling.
 * The SM-2 algorithm uses quality ratings (0-5) to adjust review intervals
 * and ease factors, optimizing long-term retention.
 *
 * @see https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

import type { ReviewItem } from "@/types/progress";

/**
 * SM-2 Algorithm Configuration
 */
export const SM2_CONFIG = {
  INITIAL_EASE_FACTOR: 2.5,
  MINIMUM_EASE_FACTOR: 1.3,
  FIRST_INTERVAL: 1,  // days
  SECOND_INTERVAL: 6, // days
  QUALITY_THRESHOLD: 3, // Below this = fail
} as const;

/**
 * Quality rating scale for SM-2 algorithm
 *
 * @description
 * - 0: Complete blackout (no recall at all)
 * - 1: Incorrect response with heavy hints needed
 * - 2: Incorrect response with partial recall
 * - 3: Correct response with serious difficulty
 * - 4: Correct response after some hesitation
 * - 5: Perfect response with immediate recall
 */
export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Extended review item with performance metadata
 */
export interface ReviewCard extends ReviewItem {
  lastReviewed?: string; // ISO date
  quality?: QualityRating;
  consecutiveCorrect?: number;
  consecutiveIncorrect?: number;
}

/**
 * Result of a review calculation
 */
export interface ReviewResult {
  card: ReviewCard;
  wasCorrect: boolean;
  intervalChanged: number; // Delta in days
  easeFactorChanged: number; // Delta in ease factor
}

/**
 * Calculate the next review date and update card parameters based on quality rating.
 * Implements the core SM-2 algorithm.
 *
 * @param card - The current review card state
 * @param quality - Quality rating (0-5) from the review session
 * @returns Updated card with new review date, interval, and ease factor
 *
 * @example
 * const card = { problemId: "u1-p001", easeFactor: 2.5, interval: 1, repetitions: 0 };
 * const updated = calculateNextReview(card, 4);
 * // Returns card with next review in 6 days, ease factor adjusted
 */
export function calculateNextReview(
  card: ReviewCard,
  quality: QualityRating
): ReviewCard {
  const now = new Date();
  const oldEaseFactor = card.easeFactor;
  const oldInterval = card.interval;

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = Math.max(
    SM2_CONFIG.MINIMUM_EASE_FACTOR,
    oldEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  let newInterval: number;
  let newRepetitions: number;

  // Quality below threshold = reset
  if (quality < SM2_CONFIG.QUALITY_THRESHOLD) {
    newInterval = SM2_CONFIG.FIRST_INTERVAL;
    newRepetitions = 0;
  } else {
    newRepetitions = card.repetitions + 1;

    // Calculate interval based on repetition number
    if (newRepetitions === 1) {
      newInterval = SM2_CONFIG.FIRST_INTERVAL;
    } else if (newRepetitions === 2) {
      newInterval = SM2_CONFIG.SECOND_INTERVAL;
    } else {
      // Subsequent intervals: I(n) = I(n-1) * EF
      newInterval = Math.round(oldInterval * newEaseFactor);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  // Track consecutive performance
  const consecutiveCorrect =
    quality >= SM2_CONFIG.QUALITY_THRESHOLD
      ? (card.consecutiveCorrect || 0) + 1
      : 0;
  const consecutiveIncorrect =
    quality < SM2_CONFIG.QUALITY_THRESHOLD
      ? (card.consecutiveIncorrect || 0) + 1
      : 0;

  return {
    ...card,
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: nextReviewDate.toISOString(),
    lastReviewed: now.toISOString(),
    quality,
    consecutiveCorrect,
    consecutiveIncorrect,
  };
}

/**
 * Get all cards that are due for review on or before the specified date.
 *
 * @param allCards - Complete set of review cards
 * @param date - Date to check against (defaults to now)
 * @returns Array of cards due for review, sorted by urgency
 *
 * @example
 * const queue = getReviewQueue(cards, new Date());
 * // Returns cards where nextReview <= now, sorted by overdue amount
 */
export function getReviewQueue(
  allCards: ReviewCard[],
  date: Date = new Date()
): ReviewCard[] {
  const targetTimestamp = date.getTime();

  const dueCards = allCards.filter((card) => {
    const reviewTimestamp = new Date(card.nextReview).getTime();
    return reviewTimestamp <= targetTimestamp;
  });

  // Sort by urgency (most overdue first)
  return dueCards.sort((a, b) => {
    const aTimestamp = new Date(a.nextReview).getTime();
    const bTimestamp = new Date(b.nextReview).getTime();
    return aTimestamp - bTimestamp;
  });
}

/**
 * Update a card's progress based on answer correctness and time spent.
 * Automatically converts performance metrics to SM-2 quality rating.
 *
 * @param card - Current review card state
 * @param correct - Whether the answer was correct
 * @param timeSpent - Time spent in seconds
 * @param expectedTime - Expected time in seconds (for difficulty adjustment)
 * @param hintsUsed - Number of hints used (optional)
 * @returns Review result with updated card and performance deltas
 *
 * @example
 * const result = updateProgress(card, true, 45, 60, 0);
 * // Returns quality 5 (fast and correct) with updated card
 */
export function updateProgress(
  card: ReviewCard,
  correct: boolean,
  timeSpent: number,
  expectedTime?: number,
  hintsUsed: number = 0
): ReviewResult {
  const oldEaseFactor = card.easeFactor;
  const oldInterval = card.interval;

  // Convert performance to quality rating
  const quality = calculateQuality(correct, timeSpent, expectedTime, hintsUsed);

  // Update card using SM-2 algorithm
  const updatedCard = calculateNextReview(card, quality);

  return {
    card: updatedCard,
    wasCorrect: correct,
    intervalChanged: updatedCard.interval - oldInterval,
    easeFactorChanged: updatedCard.easeFactor - oldEaseFactor,
  };
}

/**
 * Convert performance metrics to SM-2 quality rating (0-5).
 *
 * Quality assessment logic:
 * - Incorrect = 0-2 (based on hints)
 * - Correct + slow (>150% expected) = 3
 * - Correct + normal (100-150% expected) = 4
 * - Correct + fast (<100% expected) = 5
 *
 * @param correct - Answer correctness
 * @param timeSpent - Time spent in seconds
 * @param expectedTime - Expected time in seconds
 * @param hintsUsed - Number of hints used
 * @returns Quality rating 0-5
 */
export function calculateQuality(
  correct: boolean,
  timeSpent: number,
  expectedTime: number = 60,
  hintsUsed: number = 0
): QualityRating {
  if (!correct) {
    // Incorrect responses: 0-2 based on hints
    if (hintsUsed === 0) return 2; // Some recall
    if (hintsUsed === 1) return 1; // Heavy hints needed
    return 0; // Complete blackout
  }

  // Correct responses: 3-5 based on time performance
  const timeRatio = timeSpent / expectedTime;

  if (timeRatio > 1.5) return 3; // Serious difficulty
  if (timeRatio > 1.0) return 4; // Some hesitation
  return 5; // Perfect response
}

/**
 * Get the total number of reviews due today.
 *
 * @param queue - Review queue (usually from getReviewQueue)
 * @returns Count of reviews due today
 */
export function getDailyReviewCount(queue: ReviewCard[]): number {
  return queue.length;
}

/**
 * Initialize a new review card for a problem.
 *
 * @param problemId - Unique problem identifier
 * @returns New review card with default SM-2 parameters
 *
 * @example
 * const card = initializeCard("u1-p001");
 * // Returns card with easeFactor: 2.5, interval: 1, repetitions: 0
 */
export function initializeCard(problemId: string): ReviewCard {
  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + SM2_CONFIG.FIRST_INTERVAL);

  return {
    problemId,
    easeFactor: SM2_CONFIG.INITIAL_EASE_FACTOR,
    interval: SM2_CONFIG.FIRST_INTERVAL,
    repetitions: 0,
    nextReview: nextReview.toISOString(),
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
  };
}

/**
 * Get statistics about a card's performance.
 *
 * @param card - Review card to analyze
 * @returns Performance statistics
 */
export function getCardStats(card: ReviewCard): {
  isOverdue: boolean;
  daysOverdue: number;
  masteryLevel: "learning" | "young" | "mature" | "mastered";
  nextReviewIn: number; // days
  performanceTrend: "improving" | "stable" | "declining";
} {
  const now = new Date();
  const nextReviewDate = new Date(card.nextReview);
  const timeDiff = nextReviewDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  // Determine mastery level
  let masteryLevel: "learning" | "young" | "mature" | "mastered";
  if (card.repetitions === 0) {
    masteryLevel = "learning";
  } else if (card.interval < 21) {
    masteryLevel = "young";
  } else if (card.interval < 90) {
    masteryLevel = "mature";
  } else {
    masteryLevel = "mastered";
  }

  // Determine performance trend
  let performanceTrend: "improving" | "stable" | "declining";
  const consecutive = (card.consecutiveCorrect || 0) - (card.consecutiveIncorrect || 0);
  if (consecutive >= 2) {
    performanceTrend = "improving";
  } else if (consecutive <= -2) {
    performanceTrend = "declining";
  } else {
    performanceTrend = "stable";
  }

  return {
    isOverdue: daysDiff < 0,
    daysOverdue: Math.abs(Math.min(0, daysDiff)),
    masteryLevel,
    nextReviewIn: Math.max(0, daysDiff),
    performanceTrend,
  };
}

/**
 * Bulk update multiple cards efficiently.
 * Useful for batch operations like importing reviews or recalculating schedules.
 *
 * @param cards - Array of cards to update
 * @param updates - Map of problemId to quality rating
 * @returns Updated cards
 */
export function bulkUpdateCards(
  cards: ReviewCard[],
  updates: Map<string, QualityRating>
): ReviewCard[] {
  return cards.map((card) => {
    const quality = updates.get(card.problemId);
    if (quality !== undefined) {
      return calculateNextReview(card, quality);
    }
    return card;
  });
}

/**
 * Get optimal review distribution for the next N days.
 * Helps with workload balancing and planning.
 *
 * @param cards - All review cards
 * @param daysAhead - Number of days to project
 * @returns Map of ISO date string to review count
 */
export function getReviewDistribution(
  cards: ReviewCard[],
  daysAhead: number = 7
): Map<string, number> {
  const distribution = new Map<string, number>();
  const now = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    distribution.set(dateStr, 0);
  }

  cards.forEach((card) => {
    const reviewDate = new Date(card.nextReview);
    const dateStr = reviewDate.toISOString().split("T")[0];
    const currentCount = distribution.get(dateStr) || 0;
    distribution.set(dateStr, currentCount + 1);
  });

  return distribution;
}
