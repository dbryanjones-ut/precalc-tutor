/**
 * Review Scheduler Tests
 *
 * Test suite for review queue management and scheduling.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { Problem } from "@/types";
import type { UserProgress } from "@/types/progress";
import { initialProgress } from "@/types/progress";
import { initializeCard, type ReviewCard } from "../scheduler";
import {
  buildDailyQueue,
  prioritizeReviews,
  distributeReviews,
  calculateOptimalReviewCount,
  getReviewStats,
  balanceCalculatorMix,
  SCHEDULER_CONFIG,
  type PrioritizedReview,
} from "../review-scheduler";

describe("Review Scheduler", () => {
  let mockProblems: Problem[];
  let mockProgress: UserProgress;

  beforeEach(() => {
    mockProblems = Array(50)
      .fill(null)
      .map((_, i) => ({
        id: `u1-p${i.toString().padStart(3, "0")}`,
        type: "multiple-choice" as const,
        unit: "unit-1-polynomial-rational" as const,
        topic: i < 25 ? "polynomial-division" : "rational-functions",
        prompt: `Problem ${i}`,
        correctAnswer: "A",
        solutions: [],
        commonMistakes: [],
        prerequisites: [],
        goldenWords: [],
        difficulty: "medio" as const,
        estimatedTimeSeconds: 60,
        apSection: "mc-no-calc" as const,
        calculatorRequired: i % 2 === 0,
        isQ4Style: false,
        practiceCount: 0,
        successRate: 0,
        tags: [],
        examFrequency: "medium" as const,
      }));

    mockProgress = {
      ...initialProgress,
      reviewQueue: mockProblems.slice(0, 30).map((p) => {
        const card = initializeCard(p.id);
        // Make some overdue
        if (mockProblems.indexOf(p) < 10) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          card.nextReview = yesterday.toISOString();
        }
        return card;
      }),
    };
  });

  describe("buildDailyQueue", () => {
    it("should return problem IDs for due reviews", () => {
      const queue = buildDailyQueue(mockProblems, mockProgress, 20);
      expect(queue.length).toBeGreaterThan(0);
      expect(queue.length).toBeLessThanOrEqual(20);
      expect(queue.every((id) => typeof id === "string")).toBe(true);
    });

    it("should respect target count", () => {
      const queue = buildDailyQueue(mockProblems, mockProgress, 10);
      expect(queue.length).toBeLessThanOrEqual(10);
    });

    it("should return empty array when no reviews due", () => {
      const futureProgress = {
        ...mockProgress,
        reviewQueue: mockProblems.map((p) => {
          const card = initializeCard(p.id);
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          card.nextReview = nextWeek.toISOString();
          return card;
        }),
      };

      const queue = buildDailyQueue(mockProblems, futureProgress, 20);
      expect(queue.length).toBe(0);
    });

    it("should apply interleaving to avoid topic clustering", () => {
      const queue = buildDailyQueue(mockProblems, mockProgress, 20);

      // Check that consecutive items aren't all the same topic
      let maxConsecutiveSame = 0;
      let currentConsecutive = 1;
      let lastTopic = "";

      queue.forEach((problemId) => {
        const problem = mockProblems.find((p) => p.id === problemId);
        if (problem) {
          if (problem.topic === lastTopic) {
            currentConsecutive++;
            maxConsecutiveSame = Math.max(
              maxConsecutiveSame,
              currentConsecutive
            );
          } else {
            currentConsecutive = 1;
            lastTopic = problem.topic;
          }
        }
      });

      expect(maxConsecutiveSame).toBeLessThanOrEqual(
        SCHEDULER_CONFIG.MAX_CONSECUTIVE_SAME_TOPIC
      );
    });
  });

  describe("prioritizeReviews", () => {
    let reviews: PrioritizedReview[];

    beforeEach(() => {
      const now = new Date();
      reviews = [
        {
          problemId: "u1-p001",
          card: {
            ...initializeCard("u1-p001"),
            nextReview: new Date(now.getTime() - 86400000).toISOString(), // 1 day overdue
            consecutiveCorrect: 0,
          },
          priority: 0,
          reasons: [],
          unit: "unit-1-polynomial-rational",
          topic: "polynomial-division",
          calculatorRequired: false,
          estimatedTimeSeconds: 60,
        },
        {
          problemId: "u1-p002",
          card: {
            ...initializeCard("u1-p002"),
            nextReview: now.toISOString(), // Due now
            consecutiveCorrect: 3,
          },
          priority: 0,
          reasons: [],
          unit: "unit-1-polynomial-rational",
          topic: "rational-functions",
          calculatorRequired: false,
          estimatedTimeSeconds: 60,
        },
        {
          problemId: "u1-p003",
          card: {
            ...initializeCard("u1-p003"),
            nextReview: new Date(now.getTime() - 172800000).toISOString(), // 2 days overdue
            consecutiveCorrect: 0,
          },
          priority: 0,
          reasons: [],
          unit: "unit-1-polynomial-rational",
          topic: "polynomial-division",
          calculatorRequired: false,
          estimatedTimeSeconds: 60,
        },
      ];
    });

    it("should assign priority scores", () => {
      const prioritized = prioritizeReviews(reviews);
      expect(prioritized.every((r) => r.priority > 0)).toBe(true);
    });

    it("should prioritize overdue reviews", () => {
      const prioritized = prioritizeReviews(reviews);
      expect(prioritized[0].problemId).toBe("u1-p003"); // Most overdue
    });

    it("should add reason explanations", () => {
      const prioritized = prioritizeReviews(reviews);
      expect(prioritized[0].reasons.length).toBeGreaterThan(0);
    });

    it("should consider weakness in prioritization", () => {
      reviews[1].card.consecutiveCorrect = 0; // Make weak
      const prioritized = prioritizeReviews(reviews);
      const weakReview = prioritized.find((r) => r.problemId === "u1-p002");
      expect(weakReview?.priority).toBeGreaterThan(0);
    });

    it("should handle empty queue", () => {
      const prioritized = prioritizeReviews([]);
      expect(prioritized).toEqual([]);
    });
  });

  describe("distributeReviews", () => {
    let problems: Problem[];

    beforeEach(() => {
      const now = new Date();
      problems = Array(100)
        .fill(null)
        .map((_, i) => {
          const problem = { ...mockProblems[0], id: `u1-p${i}` };
          // Distribute across next 7 days
          const daysAhead = i % 7;
          const reviewDate = new Date(now);
          reviewDate.setDate(reviewDate.getDate() + daysAhead);
          problem.nextReviewDate = reviewDate.toISOString();
          return problem;
        });
    });

    it("should create daily schedules for N days", () => {
      const schedule = distributeReviews(problems, 7);
      expect(schedule.dailySchedules.length).toBe(7);
    });

    it("should calculate total reviews correctly", () => {
      const schedule = distributeReviews(problems, 7);
      expect(schedule.totalReviews).toBeGreaterThan(0);
    });

    it("should calculate average per day", () => {
      const schedule = distributeReviews(problems, 7);
      expect(schedule.averagePerDay).toBeCloseTo(
        schedule.totalReviews / 7,
        1
      );
    });

    it("should identify peak day", () => {
      const schedule = distributeReviews(problems, 7);
      expect(schedule.peakDay).toBeDefined();
      expect(schedule.peakDay.length).toBeGreaterThan(0);
    });

    it("should identify lightest day", () => {
      const schedule = distributeReviews(problems, 7);
      expect(schedule.lightestDay).toBeDefined();
      expect(schedule.lightestDay.length).toBeGreaterThan(0);
    });

    it("should include unit and topic distributions", () => {
      const schedule = distributeReviews(problems, 7);
      const firstDay = schedule.dailySchedules[0];
      expect(firstDay.unitDistribution).toBeDefined();
      expect(firstDay.topicDistribution).toBeDefined();
    });

    it("should calculate time estimates", () => {
      const schedule = distributeReviews(problems, 7);
      schedule.dailySchedules.forEach((day) => {
        expect(day.estimatedTimeMinutes).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("calculateOptimalReviewCount", () => {
    it("should return target count for normal load", () => {
      const optimal = calculateOptimalReviewCount(mockProgress, 20);
      expect(optimal).toBe(SCHEDULER_CONFIG.TARGET_DAILY_REVIEWS);
    });

    it("should increase count when user is behind", () => {
      const optimal = calculateOptimalReviewCount(mockProgress, 50);
      expect(optimal).toBeGreaterThan(SCHEDULER_CONFIG.TARGET_DAILY_REVIEWS);
    });

    it("should not exceed maximum", () => {
      const optimal = calculateOptimalReviewCount(mockProgress, 1000);
      expect(optimal).toBeLessThanOrEqual(SCHEDULER_CONFIG.MAX_DAILY_REVIEWS);
    });

    it("should reduce count when ahead of schedule", () => {
      const optimal = calculateOptimalReviewCount(mockProgress, 5);
      expect(optimal).toBeLessThan(SCHEDULER_CONFIG.TARGET_DAILY_REVIEWS);
    });

    it("should maintain minimum count", () => {
      const optimal = calculateOptimalReviewCount(mockProgress, 2);
      expect(optimal).toBeGreaterThanOrEqual(
        SCHEDULER_CONFIG.MIN_DAILY_REVIEWS
      );
    });
  });

  describe("getReviewStats", () => {
    let reviews: PrioritizedReview[];

    beforeEach(() => {
      const now = new Date();
      reviews = [
        {
          problemId: "u1-p001",
          card: {
            ...initializeCard("u1-p001"),
            nextReview: new Date(now.getTime() - 86400000).toISOString(),
            consecutiveCorrect: 0,
          },
          priority: 50,
          reasons: [],
          unit: "unit-1-polynomial-rational",
          topic: "polynomial-division",
          calculatorRequired: false,
          estimatedTimeSeconds: 60,
        },
        {
          problemId: "u1-p002",
          card: {
            ...initializeCard("u1-p002"),
            nextReview: now.toISOString(),
            consecutiveCorrect: 1,
          },
          priority: 30,
          reasons: [],
          unit: "unit-1-polynomial-rational",
          topic: "rational-functions",
          calculatorRequired: true,
          estimatedTimeSeconds: 90,
        },
        {
          problemId: "u1-p003",
          card: {
            ...initializeCard("u1-p003"),
            nextReview: now.toISOString(),
            consecutiveCorrect: 5,
          },
          priority: 20,
          reasons: [],
          unit: "unit-2-exponential-logarithmic",
          topic: "exponential-growth",
          calculatorRequired: false,
          estimatedTimeSeconds: 45,
        },
      ];
    });

    it("should calculate total count", () => {
      const stats = getReviewStats(reviews);
      expect(stats.total).toBe(3);
    });

    it("should count overdue reviews", () => {
      const stats = getReviewStats(reviews);
      expect(stats.overdue).toBe(1);
    });

    it("should count weak reviews", () => {
      const stats = getReviewStats(reviews);
      expect(stats.weak).toBeGreaterThanOrEqual(1);
    });

    it("should calculate unit distribution", () => {
      const stats = getReviewStats(reviews);
      expect(stats.byUnit["unit-1-polynomial-rational"]).toBe(2);
      expect(stats.byUnit["unit-2-exponential-logarithmic"]).toBe(1);
    });

    it("should calculate topic distribution", () => {
      const stats = getReviewStats(reviews);
      expect(Object.keys(stats.byTopic).length).toBeGreaterThan(0);
    });

    it("should estimate time", () => {
      const stats = getReviewStats(reviews);
      expect(stats.estimatedTimeMinutes).toBeGreaterThan(0);
      expect(stats.estimatedTimeMinutes).toBe(
        Math.ceil((60 + 90 + 45) / 60)
      );
    });

    it("should count calculator requirements", () => {
      const stats = getReviewStats(reviews);
      expect(stats.calculatorNeeded).toBe(1);
      expect(stats.noCalculator).toBe(2);
    });
  });

  describe("balanceCalculatorMix", () => {
    let reviews: PrioritizedReview[];

    beforeEach(() => {
      reviews = Array(10)
        .fill(null)
        .map((_, i) => ({
          problemId: `u1-p${i}`,
          card: initializeCard(`u1-p${i}`),
          priority: 50 - i * 5,
          reasons: [],
          unit: "unit-1-polynomial-rational",
          topic: "polynomial-division",
          calculatorRequired: i < 6, // 6 calculator, 4 non-calculator
          estimatedTimeSeconds: 60,
        }));
    });

    it("should maintain approximately 40/60 calculator split", () => {
      const balanced = balanceCalculatorMix(reviews);
      const calcCount = balanced.filter((r) => r.calculatorRequired).length;
      const noCalcCount = balanced.length - calcCount;

      // Should be close to 40% calculator
      expect(calcCount).toBeCloseTo(4, 0);
      expect(noCalcCount).toBeCloseTo(6, 0);
    });

    it("should preserve all reviews", () => {
      const balanced = balanceCalculatorMix(reviews);
      expect(balanced.length).toBe(reviews.length);
    });

    it("should handle all calculator problems", () => {
      const allCalc = reviews.map((r) => ({
        ...r,
        calculatorRequired: true,
      }));
      const balanced = balanceCalculatorMix(allCalc);
      expect(balanced.length).toBe(allCalc.length);
    });

    it("should handle all non-calculator problems", () => {
      const allNoCalc = reviews.map((r) => ({
        ...r,
        calculatorRequired: false,
      }));
      const balanced = balanceCalculatorMix(allNoCalc);
      expect(balanced.length).toBe(allNoCalc.length);
    });
  });

  describe("Interleaving", () => {
    it("should prevent topic clustering", () => {
      const problems = Array(20)
        .fill(null)
        .map((_, i) => ({
          ...mockProblems[0],
          id: `u1-p${i}`,
          topic: i < 10 ? "topic-a" : "topic-b",
        }));

      const progress = {
        ...mockProgress,
        reviewQueue: problems.map((p) => initializeCard(p.id)),
      };

      const queue = buildDailyQueue(problems, progress, 20);

      // Should have variety, not all topic-a followed by all topic-b
      const problemDetails = queue.map((id) =>
        problems.find((p) => p.id === id)
      );
      const topics = problemDetails.map((p) => p?.topic);

      // Check for variety (not all same topic consecutively)
      let maxConsecutive = 0;
      let current = 1;
      for (let i = 1; i < topics.length; i++) {
        if (topics[i] === topics[i - 1]) {
          current++;
          maxConsecutive = Math.max(maxConsecutive, current);
        } else {
          current = 1;
        }
      }

      expect(maxConsecutive).toBeLessThanOrEqual(
        SCHEDULER_CONFIG.MAX_CONSECUTIVE_SAME_TOPIC
      );
    });

    it("should prevent unit clustering", () => {
      const problems = Array(20)
        .fill(null)
        .map((_, i) => ({
          ...mockProblems[0],
          id: `u${i < 10 ? 1 : 2}-p${i}`,
          unit:
            i < 10
              ? ("unit-1-polynomial-rational" as const)
              : ("unit-2-exponential-logarithmic" as const),
        }));

      const progress = {
        ...mockProgress,
        reviewQueue: problems.map((p) => initializeCard(p.id)),
      };

      const queue = buildDailyQueue(problems, progress, 20);

      const problemDetails = queue.map((id) =>
        problems.find((p) => p.id === id)
      );
      const units = problemDetails.map((p) => p?.unit);

      let maxConsecutive = 0;
      let current = 1;
      for (let i = 1; i < units.length; i++) {
        if (units[i] === units[i - 1]) {
          current++;
          maxConsecutive = Math.max(maxConsecutive, current);
        } else {
          current = 1;
        }
      }

      expect(maxConsecutive).toBeLessThanOrEqual(
        SCHEDULER_CONFIG.MAX_CONSECUTIVE_SAME_UNIT
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty problem set", () => {
      const queue = buildDailyQueue([], mockProgress, 20);
      expect(queue).toEqual([]);
    });

    it("should handle empty review queue", () => {
      const emptyProgress = {
        ...mockProgress,
        reviewQueue: [],
      };
      const queue = buildDailyQueue(mockProblems, emptyProgress, 20);
      expect(queue).toEqual([]);
    });

    it("should handle target count larger than available", () => {
      const smallProgress = {
        ...mockProgress,
        reviewQueue: mockProblems.slice(0, 5).map((p) => initializeCard(p.id)),
      };
      const queue = buildDailyQueue(mockProblems, smallProgress, 100);
      expect(queue.length).toBeLessThanOrEqual(5);
    });

    it("should handle all reviews in future", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const futureProgress = {
        ...mockProgress,
        reviewQueue: mockProblems.map((p) => ({
          ...initializeCard(p.id),
          nextReview: futureDate.toISOString(),
        })),
      };

      const queue = buildDailyQueue(mockProblems, futureProgress, 20);
      expect(queue.length).toBe(0);
    });
  });

  describe("Performance", () => {
    it("should handle large problem sets efficiently", () => {
      const largeProblems = Array(1000)
        .fill(null)
        .map((_, i) => ({
          ...mockProblems[0],
          id: `u1-p${i}`,
        }));

      const largeProgress = {
        ...mockProgress,
        reviewQueue: largeProblems.map((p) => initializeCard(p.id)),
      };

      const start = performance.now();
      buildDailyQueue(largeProblems, largeProgress, 50);
      const end = performance.now();

      expect(end - start).toBeLessThan(500); // Should be < 500ms
    });

    it("should handle large review queues efficiently", () => {
      const reviews: PrioritizedReview[] = Array(1000)
        .fill(null)
        .map((_, i) => ({
          problemId: `u1-p${i}`,
          card: initializeCard(`u1-p${i}`),
          priority: Math.random() * 100,
          reasons: [],
          unit: "unit-1-polynomial-rational",
          topic: "polynomial-division",
          calculatorRequired: false,
          estimatedTimeSeconds: 60,
        }));

      const start = performance.now();
      prioritizeReviews(reviews);
      const end = performance.now();

      expect(end - start).toBeLessThan(200); // Should be < 200ms
    });
  });
});
