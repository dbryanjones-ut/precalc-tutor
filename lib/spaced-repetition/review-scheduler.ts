/**
 * Review Queue Scheduler
 *
 * Manages daily review queues, prioritization, and workload distribution.
 * Implements intelligent scheduling that balances review density,
 * topic interleaving, and user capacity.
 */

import type { Problem, APUnit } from "@/types";
import type { UserProgress } from "@/types/progress";
import type { ReviewCard } from "./scheduler";
import { getReviewQueue, getCardStats } from "./scheduler";

/**
 * Scheduler configuration
 */
export const SCHEDULER_CONFIG = {
  // Daily review targets
  TARGET_DAILY_REVIEWS: 20,
  MIN_DAILY_REVIEWS: 10,
  MAX_DAILY_REVIEWS: 50,

  // Prioritization weights
  WEIGHTS: {
    overdue: 0.35,
    weakness: 0.25,
    variety: 0.2,
    recency: 0.2,
  },

  // Interleaving settings
  MAX_CONSECUTIVE_SAME_TOPIC: 3,
  MAX_CONSECUTIVE_SAME_UNIT: 5,

  // Performance thresholds
  WEAK_ACCURACY_THRESHOLD: 0.6,
  STRONG_ACCURACY_THRESHOLD: 0.85,
} as const;

/**
 * Prioritized review item with scheduling metadata
 */
export interface PrioritizedReview {
  problemId: string;
  card: ReviewCard;
  priority: number;
  reasons: string[];
  unit: string;
  topic: string;
  calculatorRequired: boolean;
  estimatedTimeSeconds: number;
}

/**
 * Daily review schedule
 */
export interface DailySchedule {
  date: string; // ISO date
  reviews: PrioritizedReview[];
  totalCount: number;
  estimatedTimeMinutes: number;
  unitDistribution: Record<string, number>;
  topicDistribution: Record<string, number>;
  difficultyDistribution: {
    overdue: number;
    weak: number;
    normal: number;
  };
}

/**
 * Multi-day schedule
 */
export interface WeeklySchedule {
  startDate: string;
  endDate: string;
  dailySchedules: DailySchedule[];
  totalReviews: number;
  averagePerDay: number;
  peakDay: string;
  lightestDay: string;
}

/**
 * Build optimized daily review queue.
 *
 * @param allProblems - Complete problem set
 * @param userProgress - User's progress data
 * @param targetCount - Target number of reviews (default: 20)
 * @returns Prioritized list of problem IDs to review
 *
 * @example
 * const queue = buildDailyQueue(problems, progress, 20);
 * // Returns up to 20 problem IDs, optimally ordered
 */
export function buildDailyQueue(
  allProblems: Problem[],
  userProgress: UserProgress,
  targetCount: number = SCHEDULER_CONFIG.TARGET_DAILY_REVIEWS
): string[] {
  // Get all due reviews
  const dueCards = getReviewQueue(userProgress.reviewQueue);

  if (dueCards.length === 0) return [];

  // Create enriched review items
  const enrichedReviews = enrichReviews(dueCards, allProblems, userProgress);

  // Prioritize reviews
  const prioritized = prioritizeReviews(enrichedReviews);

  // Apply interleaving and take target count
  const optimized = applyInterleaving(prioritized, targetCount);

  return optimized.map((review) => review.problemId);
}

/**
 * Prioritize reviews based on urgency, weakness, and variety.
 *
 * @param queue - Review queue to prioritize
 * @returns Sorted array with highest priority first
 */
export function prioritizeReviews(
  queue: PrioritizedReview[]
): PrioritizedReview[] {
  const now = new Date();

  // Calculate priority scores
  const scored = queue.map((review) => {
    const stats = getCardStats(review.card);
    let priorityScore = 0;
    const reasons: string[] = [];

    // Factor 1: Overdue (35% weight)
    if (stats.isOverdue) {
      const overdueWeight = Math.min(stats.daysOverdue / 7, 1); // Cap at 1 week
      priorityScore += overdueWeight * 35;
      reasons.push(`${stats.daysOverdue}d overdue`);
    }

    // Factor 2: Weakness (25% weight)
    const accuracy = review.card.consecutiveCorrect || 0;
    const weakness = Math.max(0, 1 - accuracy / 5); // 5 consecutive = strong
    priorityScore += weakness * 25;
    if (weakness > 0.5) {
      reasons.push("weak topic");
    }

    // Factor 3: Variety bonus (20% weight)
    // This is applied during interleaving, so we add a base score
    priorityScore += 10;

    // Factor 4: Recency (20% weight)
    // Prefer cards not reviewed recently
    if (review.card.lastReviewed) {
      const daysSinceReview = getDaysSince(review.card.lastReviewed);
      const recencyScore = Math.min(daysSinceReview / 30, 1) * 20;
      priorityScore += recencyScore;
    } else {
      priorityScore += 20; // Never reviewed = full points
      reasons.push("never reviewed");
    }

    // Bonus: Mastery level consideration
    if (stats.masteryLevel === "learning") {
      priorityScore += 5;
      reasons.push("learning");
    } else if (stats.performanceTrend === "declining") {
      priorityScore += 10;
      reasons.push("declining");
    }

    return {
      ...review,
      priority: priorityScore,
      reasons,
    };
  });

  // Sort by priority (highest first)
  return scored.sort((a, b) => b.priority - a.priority);
}

/**
 * Distribute reviews across multiple days for balanced workload.
 *
 * @param problems - Problems to schedule
 * @param daysAhead - Number of days to schedule (default: 7)
 * @returns Weekly schedule with daily breakdowns
 */
export function distributeReviews(
  problems: Problem[],
  daysAhead: number = 7
): WeeklySchedule {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysAhead - 1);

  // Group problems by next review date
  const problemsByDate = new Map<string, Problem[]>();

  problems.forEach((problem) => {
    if (problem.nextReviewDate) {
      const date = new Date(problem.nextReviewDate);
      const dateStr = date.toISOString().split("T")[0];

      if (!problemsByDate.has(dateStr)) {
        problemsByDate.set(dateStr, []);
      }
      problemsByDate.get(dateStr)!.push(problem);
    }
  });

  // Build daily schedules
  const dailySchedules: DailySchedule[] = [];
  let totalReviews = 0;

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const dayProblems = problemsByDate.get(dateStr) || [];
    const daySchedule = buildDaySchedule(dateStr, dayProblems);

    dailySchedules.push(daySchedule);
    totalReviews += daySchedule.totalCount;
  }

  // Find peak and lightest days
  const sortedByCount = [...dailySchedules].sort(
    (a, b) => b.totalCount - a.totalCount
  );

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    dailySchedules,
    totalReviews,
    averagePerDay: totalReviews / daysAhead,
    peakDay: sortedByCount[0]?.date || "",
    lightestDay: sortedByCount[sortedByCount.length - 1]?.date || "",
  };
}

/**
 * Build schedule for a single day.
 */
function buildDaySchedule(date: string, problems: Problem[]): DailySchedule {
  const unitDistribution: Record<string, number> = {};
  const topicDistribution: Record<string, number> = {};
  let overdueCount = 0;
  let weakCount = 0;
  let normalCount = 0;
  let totalTime = 0;

  const reviews: PrioritizedReview[] = problems.map((problem) => {
    // Track distributions
    unitDistribution[problem.unit] = (unitDistribution[problem.unit] || 0) + 1;
    topicDistribution[problem.topic] = (topicDistribution[problem.topic] || 0) + 1;
    totalTime += problem.estimatedTimeSeconds;

    // Categorize difficulty
    if (problem.successRate !== undefined && problem.successRate < 0.6) {
      weakCount++;
    } else if (problem.nextReviewDate) {
      const reviewDate = new Date(problem.nextReviewDate);
      const today = new Date(date);
      if (reviewDate < today) {
        overdueCount++;
      } else {
        normalCount++;
      }
    } else {
      normalCount++;
    }

    // Create review item (placeholder card - should be enriched elsewhere)
    return {
      problemId: problem.id,
      card: {
        problemId: problem.id,
        easeFactor: problem.easeFactor || 2.5,
        interval: problem.interval || 1,
        repetitions: 0,
        nextReview: problem.nextReviewDate || new Date().toISOString(),
      },
      priority: 0,
      reasons: [],
      unit: problem.unit,
      topic: problem.topic,
      calculatorRequired: problem.calculatorRequired,
      estimatedTimeSeconds: problem.estimatedTimeSeconds,
    };
  });

  return {
    date,
    reviews,
    totalCount: problems.length,
    estimatedTimeMinutes: Math.ceil(totalTime / 60),
    unitDistribution,
    topicDistribution,
    difficultyDistribution: {
      overdue: overdueCount,
      weak: weakCount,
      normal: normalCount,
    },
  };
}

/**
 * Apply interleaving to avoid topic clustering.
 * Ensures variety in the review queue for better retention.
 */
function applyInterleaving(
  reviews: PrioritizedReview[],
  targetCount: number
): PrioritizedReview[] {
  if (reviews.length === 0) return [];

  const result: PrioritizedReview[] = [];
  const remaining = [...reviews];

  let lastTopic = "";
  let lastUnit = "";
  let consecutiveTopic = 0;
  let consecutiveUnit = 0;

  while (result.length < targetCount && remaining.length > 0) {
    // Find best candidate that respects interleaving constraints
    let bestIndex = 0;
    let foundDifferent = false;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];

      // Prefer different topic/unit if we've hit limits
      const isDifferentTopic = candidate.topic !== lastTopic;
      const isDifferentUnit = candidate.unit !== lastUnit;

      if (
        consecutiveTopic >= SCHEDULER_CONFIG.MAX_CONSECUTIVE_SAME_TOPIC &&
        isDifferentTopic
      ) {
        bestIndex = i;
        foundDifferent = true;
        break;
      }

      if (
        consecutiveUnit >= SCHEDULER_CONFIG.MAX_CONSECUTIVE_SAME_UNIT &&
        isDifferentUnit
      ) {
        bestIndex = i;
        foundDifferent = true;
        break;
      }

      // Otherwise, prefer higher priority with variety bonus
      if (!foundDifferent) {
        const currentBest = remaining[bestIndex];
        let candidateScore = candidate.priority;
        let bestScore = currentBest.priority;

        // Apply variety bonus
        if (isDifferentTopic) candidateScore += 5;
        if (isDifferentUnit) candidateScore += 3;

        if (candidateScore > bestScore) {
          bestIndex = i;
        }
      }
    }

    // Add selected review
    const selected = remaining.splice(bestIndex, 1)[0];
    result.push(selected);

    // Update tracking
    if (selected.topic === lastTopic) {
      consecutiveTopic++;
    } else {
      consecutiveTopic = 1;
      lastTopic = selected.topic;
    }

    if (selected.unit === lastUnit) {
      consecutiveUnit++;
    } else {
      consecutiveUnit = 1;
      lastUnit = selected.unit;
    }
  }

  return result;
}

/**
 * Enrich review cards with problem metadata.
 */
function enrichReviews(
  cards: ReviewCard[],
  allProblems: Problem[],
  userProgress: UserProgress
): PrioritizedReview[] {
  const problemMap = new Map(allProblems.map((p) => [p.id, p]));

  return cards
    .map((card) => {
      const problem = problemMap.get(card.problemId);
      if (!problem) return null;

      return {
        problemId: card.problemId,
        card,
        priority: 0,
        reasons: [],
        unit: problem.unit,
        topic: problem.topic,
        calculatorRequired: problem.calculatorRequired,
        estimatedTimeSeconds: problem.estimatedTimeSeconds,
      };
    })
    .filter((r): r is PrioritizedReview => r !== null);
}

/**
 * Calculate optimal review count for today based on user capacity.
 *
 * @param userProgress - User progress data
 * @param dueCount - Number of reviews currently due
 * @returns Recommended review count for today
 */
export function calculateOptimalReviewCount(
  userProgress: UserProgress,
  dueCount: number
): number {
  const { TARGET_DAILY_REVIEWS, MIN_DAILY_REVIEWS, MAX_DAILY_REVIEWS } =
    SCHEDULER_CONFIG;

  // Base on user's recent activity
  const recentDays = 7;
  const recentWarmups = userProgress.warmups.slice(-recentDays);
  const avgTimePerDay =
    recentWarmups.reduce((sum, w) => sum + w.timeSeconds, 0) / recentDays;

  // Estimate capacity (assume 30 seconds per review on average)
  const estimatedCapacity = Math.floor(avgTimePerDay / 30);

  // Start with target, adjust based on capacity and due count
  let optimal = TARGET_DAILY_REVIEWS;

  if (estimatedCapacity > 0) {
    optimal = Math.min(optimal, estimatedCapacity);
  }

  // If user is behind, gradually increase
  if (dueCount > TARGET_DAILY_REVIEWS * 1.5) {
    optimal = Math.min(MAX_DAILY_REVIEWS, Math.ceil(TARGET_DAILY_REVIEWS * 1.3));
  }

  // If user is ahead, can reduce
  if (dueCount < MIN_DAILY_REVIEWS) {
    optimal = dueCount;
  }

  return Math.max(MIN_DAILY_REVIEWS, Math.min(MAX_DAILY_REVIEWS, optimal));
}

/**
 * Get review statistics for dashboard display.
 *
 * @param reviews - Current review queue
 * @returns Statistics summary
 */
export function getReviewStats(reviews: PrioritizedReview[]): {
  total: number;
  overdue: number;
  weak: number;
  byUnit: Record<string, number>;
  byTopic: Record<string, number>;
  estimatedTimeMinutes: number;
  calculatorNeeded: number;
  noCalculator: number;
} {
  const stats = {
    total: reviews.length,
    overdue: 0,
    weak: 0,
    byUnit: {} as Record<string, number>,
    byTopic: {} as Record<string, number>,
    estimatedTimeMinutes: 0,
    calculatorNeeded: 0,
    noCalculator: 0,
  };

  reviews.forEach((review) => {
    // Count overdue
    const cardStats = getCardStats(review.card);
    if (cardStats.isOverdue) stats.overdue++;

    // Count weak
    const accuracy = (review.card.consecutiveCorrect || 0) / 5;
    if (accuracy < SCHEDULER_CONFIG.WEAK_ACCURACY_THRESHOLD) stats.weak++;

    // Unit distribution
    stats.byUnit[review.unit] = (stats.byUnit[review.unit] || 0) + 1;

    // Topic distribution
    stats.byTopic[review.topic] = (stats.byTopic[review.topic] || 0) + 1;

    // Time estimate
    stats.estimatedTimeMinutes += review.estimatedTimeSeconds / 60;

    // Calculator requirements
    if (review.calculatorRequired) {
      stats.calculatorNeeded++;
    } else {
      stats.noCalculator++;
    }
  });

  stats.estimatedTimeMinutes = Math.ceil(stats.estimatedTimeMinutes);

  return stats;
}

/**
 * Balance calculator vs non-calculator problems.
 * Ensures reasonable distribution for exam prep.
 */
export function balanceCalculatorMix(
  reviews: PrioritizedReview[]
): PrioritizedReview[] {
  const calcRequired = reviews.filter((r) => r.calculatorRequired);
  const noCalc = reviews.filter((r) => !r.calculatorRequired);

  // Target: ~40% calculator, 60% no calculator (matches AP exam distribution)
  const total = reviews.length;
  const targetCalc = Math.round(total * 0.4);

  // Interleave them
  const result: PrioritizedReview[] = [];
  let calcIndex = 0;
  let noCalcIndex = 0;

  for (let i = 0; i < total; i++) {
    const shouldUseCalc = i < targetCalc && calcIndex < calcRequired.length;
    const mustUseNoCalc = calcIndex >= calcRequired.length;
    const mustUseCalc = noCalcIndex >= noCalc.length;

    if (mustUseCalc || (shouldUseCalc && !mustUseNoCalc)) {
      result.push(calcRequired[calcIndex++]);
    } else {
      result.push(noCalc[noCalcIndex++]);
    }
  }

  return result;
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
