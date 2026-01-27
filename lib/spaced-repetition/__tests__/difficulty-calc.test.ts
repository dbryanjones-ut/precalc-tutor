/**
 * Difficulty Calculator Tests
 *
 * Test suite for adaptive difficulty adjustment.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { Problem, ProblemAttempt } from "@/types";
import type { UserProgress } from "@/types/progress";
import { initialProgress } from "@/types/progress";
import {
  calculateDifficulty,
  adjustDifficultyBasedOnPerformance,
  recommendNextProblem,
  analyzeTopicPerformance,
  getPersonalizedDifficultyTargets,
  DIFFICULTY_CONFIG,
} from "../difficulty-calc";

describe("Difficulty Calculator", () => {
  let mockProblem: Problem;
  let mockAttempts: ProblemAttempt[];

  beforeEach(() => {
    mockProblem = {
      id: "u1-p001",
      type: "multiple-choice",
      unit: "unit-1-polynomial-rational",
      topic: "polynomial-division",
      prompt: "Test problem",
      correctAnswer: "A",
      solutions: [],
      commonMistakes: [],
      prerequisites: [],
      goldenWords: [],
      difficulty: "medio",
      estimatedTimeSeconds: 60,
      apSection: "mc-no-calc",
      calculatorRequired: false,
      isQ4Style: false,
      practiceCount: 0,
      successRate: 0,
      tags: [],
      examFrequency: "medium",
    } as Problem;

    mockAttempts = [];
  });

  describe("calculateDifficulty", () => {
    it("should return problem's base difficulty when insufficient data", () => {
      const attempts: ProblemAttempt[] = [
        {
          problemId: "u1-p001",
          timestamp: new Date().toISOString(),
          userAnswer: "A",
          correct: true,
          timeSpentSeconds: 45,
          hintsUsed: 0,
        },
      ];

      const difficulty = calculateDifficulty(mockProblem, attempts);
      expect(difficulty).toBe("medio");
    });

    it("should recommend easier difficulty for poor performance", () => {
      const attempts: ProblemAttempt[] = Array(5)
        .fill(null)
        .map(() => ({
          problemId: "u1-p001",
          timestamp: new Date().toISOString(),
          userAnswer: "B",
          correct: false,
          timeSpentSeconds: 90,
          hintsUsed: 2,
        }));

      const difficulty = calculateDifficulty(mockProblem, attempts);
      expect(difficulty).toBe("facile");
    });

    it("should recommend harder difficulty for strong performance", () => {
      const attempts: ProblemAttempt[] = Array(5)
        .fill(null)
        .map(() => ({
          problemId: "u1-p001",
          timestamp: new Date().toISOString(),
          userAnswer: "A",
          correct: true,
          timeSpentSeconds: 30,
          hintsUsed: 0,
        }));

      const difficulty = calculateDifficulty(mockProblem, attempts);
      expect(difficulty).toBe("difficile");
    });

    it("should maintain medium difficulty for average performance", () => {
      const attempts: ProblemAttempt[] = [
        ...Array(3)
          .fill(null)
          .map(() => ({
            problemId: "u1-p001",
            timestamp: new Date().toISOString(),
            userAnswer: "A",
            correct: true,
            timeSpentSeconds: 60,
            hintsUsed: 0,
          })),
        ...Array(2)
          .fill(null)
          .map(() => ({
            problemId: "u1-p001",
            timestamp: new Date().toISOString(),
            userAnswer: "B",
            correct: false,
            timeSpentSeconds: 75,
            hintsUsed: 1,
          })),
      ];

      const difficulty = calculateDifficulty(mockProblem, attempts);
      expect(difficulty).toBe("medio");
    });
  });

  describe("adjustDifficultyBasedOnPerformance", () => {
    it("should recommend increase for high accuracy", () => {
      const result = adjustDifficultyBasedOnPerformance(
        mockProblem,
        0.9, // 90% accuracy
        45, // Fast
        0 // No hints
      );

      expect(result.shouldAdjust).toBe(true);
      expect(result.recommendedDifficulty).toBe("difficile");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should recommend decrease for low accuracy", () => {
      const result = adjustDifficultyBasedOnPerformance(
        mockProblem,
        0.4, // 40% accuracy
        90, // Slow
        2 // Many hints
      );

      expect(result.shouldAdjust).toBe(true);
      expect(result.recommendedDifficulty).toBe("facile");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should not adjust for average performance", () => {
      const result = adjustDifficultyBasedOnPerformance(
        mockProblem,
        0.7, // 70% accuracy
        60, // Normal time
        0 // No hints
      );

      expect(result.shouldAdjust).toBe(false);
      expect(result.currentDifficulty).toBe("medio");
      expect(result.recommendedDifficulty).toBe("medio");
    });

    it("should include reasoning in recommendations", () => {
      const result = adjustDifficultyBasedOnPerformance(
        mockProblem,
        0.9,
        30,
        0
      );

      expect(result.reason).toContain("accuracy");
      expect(result.reason).toContain("quickly");
    });

    it("should not recommend difficulty below facile", () => {
      mockProblem.difficulty = "facile";
      const result = adjustDifficultyBasedOnPerformance(
        mockProblem,
        0.2, // Very low
        120, // Very slow
        3 // Many hints
      );

      expect(result.recommendedDifficulty).toBe("facile");
    });

    it("should not recommend difficulty above difficile", () => {
      mockProblem.difficulty = "difficile";
      const result = adjustDifficultyBasedOnPerformance(
        mockProblem,
        1.0, // Perfect
        20, // Very fast
        0 // No hints
      );

      expect(result.recommendedDifficulty).toBe("difficile");
    });
  });

  describe("recommendNextProblem", () => {
    let problems: Problem[];
    let userProgress: UserProgress;

    beforeEach(() => {
      problems = [
        {
          ...mockProblem,
          id: "u1-p001",
          topic: "polynomial-division",
          difficulty: "facile",
          practiceCount: 0,
          successRate: 0,
        },
        {
          ...mockProblem,
          id: "u1-p002",
          topic: "polynomial-division",
          difficulty: "medio",
          practiceCount: 5,
          successRate: 0.8,
        },
        {
          ...mockProblem,
          id: "u1-p003",
          topic: "rational-functions",
          difficulty: "difficile",
          practiceCount: 2,
          successRate: 0.4,
        },
      ];

      userProgress = {
        ...initialProgress,
        units: {
          ...initialProgress.units,
          "unit-1-polynomial-rational": {
            ...initialProgress.units["unit-1-polynomial-rational"],
            mastery: 0.5,
            weakTopics: ["polynomial-division"],
          },
        },
      };
    });

    it("should recommend a problem when available", () => {
      const recommendation = recommendNextProblem(userProgress, problems);
      expect(recommendation).toBeDefined();
      expect(recommendation).not.toBeNull();
    });

    it("should prioritize weak topics", () => {
      const recommendation = recommendNextProblem(userProgress, problems);
      expect(recommendation?.topic).toBe("polynomial-division");
    });

    it("should prioritize less practiced problems", () => {
      userProgress.units["unit-1-polynomial-rational"].weakTopics = [];
      const recommendation = recommendNextProblem(userProgress, problems);
      expect(recommendation?.id).toBe("u1-p001"); // Never practiced
    });

    it("should filter by unit when specified", () => {
      const recommendation = recommendNextProblem(userProgress, problems, {
        unit: "unit-1-polynomial-rational",
      });
      expect(recommendation?.unit).toBe("unit-1-polynomial-rational");
    });

    it("should filter by topic when specified", () => {
      const recommendation = recommendNextProblem(userProgress, problems, {
        topic: "rational-functions",
      });
      expect(recommendation?.topic).toBe("rational-functions");
    });

    it("should respect max difficulty", () => {
      const recommendation = recommendNextProblem(userProgress, problems, {
        maxDifficulty: "medio",
      });
      expect(recommendation?.difficulty).not.toBe("difficile");
    });

    it("should return null when no problems match criteria", () => {
      const recommendation = recommendNextProblem(userProgress, problems, {
        unit: "unit-99-nonexistent",
      });
      expect(recommendation).toBeNull();
    });

    it("should return null for empty problem set", () => {
      const recommendation = recommendNextProblem(userProgress, []);
      expect(recommendation).toBeNull();
    });
  });

  describe("analyzeTopicPerformance", () => {
    let problems: Problem[];
    let attempts: ProblemAttempt[];

    beforeEach(() => {
      problems = [
        {
          ...mockProblem,
          id: "u1-p001",
          topic: "polynomial-division",
        },
        {
          ...mockProblem,
          id: "u1-p002",
          topic: "polynomial-division",
        },
        {
          ...mockProblem,
          id: "u1-p003",
          topic: "polynomial-division",
        },
      ];

      attempts = [
        // u1-p001: Strong (3/3 correct)
        ...Array(3)
          .fill(null)
          .map(() => ({
            problemId: "u1-p001",
            timestamp: new Date().toISOString(),
            userAnswer: "A",
            correct: true,
            timeSpentSeconds: 45,
            hintsUsed: 0,
          })),
        // u1-p002: Weak (1/3 correct)
        {
          problemId: "u1-p002",
          timestamp: new Date().toISOString(),
          userAnswer: "A",
          correct: true,
          timeSpentSeconds: 60,
          hintsUsed: 0,
        },
        {
          problemId: "u1-p002",
          timestamp: new Date().toISOString(),
          userAnswer: "B",
          correct: false,
          timeSpentSeconds: 90,
          hintsUsed: 1,
        },
        {
          problemId: "u1-p002",
          timestamp: new Date().toISOString(),
          userAnswer: "B",
          correct: false,
          timeSpentSeconds: 85,
          hintsUsed: 1,
        },
        // u1-p003: Not attempted
      ];
    });

    it("should calculate overall topic accuracy", () => {
      const performance = analyzeTopicPerformance(problems, attempts);
      expect(performance.accuracy).toBeCloseTo(0.67, 2); // 4/6 correct
    });

    it("should identify weak points", () => {
      const performance = analyzeTopicPerformance(problems, attempts);
      expect(performance.weakPoints).toContain("u1-p002");
      expect(performance.weakPoints).not.toContain("u1-p001");
    });

    it("should identify strong points", () => {
      const performance = analyzeTopicPerformance(problems, attempts);
      expect(performance.strongPoints).toContain("u1-p001");
      expect(performance.strongPoints).not.toContain("u1-p002");
    });

    it("should calculate mastery level", () => {
      const performance = analyzeTopicPerformance(problems, attempts);
      expect(performance.masteryLevel).toBeGreaterThan(0);
      expect(performance.masteryLevel).toBeLessThan(1);
    });

    it("should handle topics with no attempts", () => {
      const performance = analyzeTopicPerformance(problems, []);
      expect(performance.totalAttempts).toBe(0);
      expect(performance.accuracy).toBe(0);
      expect(performance.masteryLevel).toBe(0);
    });

    it("should calculate average time", () => {
      const performance = analyzeTopicPerformance(problems, attempts);
      expect(performance.averageTime).toBeGreaterThan(0);
    });
  });

  describe("getPersonalizedDifficultyTargets", () => {
    let userProgress: UserProgress;

    beforeEach(() => {
      userProgress = { ...initialProgress };
    });

    it("should recommend easy for low mastery", () => {
      userProgress.units["unit-1-polynomial-rational"].mastery = 0.2;
      const targets = getPersonalizedDifficultyTargets(userProgress);
      const target = targets.get("unit-1-polynomial-rational");

      expect(target?.min).toBe("facile");
      expect(target?.max).toBe("facile");
    });

    it("should recommend easy-medium for building mastery", () => {
      userProgress.units["unit-1-polynomial-rational"].mastery = 0.5;
      const targets = getPersonalizedDifficultyTargets(userProgress);
      const target = targets.get("unit-1-polynomial-rational");

      expect(target?.min).toBe("facile");
      expect(target?.max).toBe("medio");
    });

    it("should recommend medium-hard for proficient", () => {
      userProgress.units["unit-1-polynomial-rational"].mastery = 0.7;
      const targets = getPersonalizedDifficultyTargets(userProgress);
      const target = targets.get("unit-1-polynomial-rational");

      expect(target?.min).toBe("medio");
      expect(target?.max).toBe("difficile");
    });

    it("should recommend challenging for high mastery", () => {
      userProgress.units["unit-1-polynomial-rational"].mastery = 0.9;
      const targets = getPersonalizedDifficultyTargets(userProgress);
      const target = targets.get("unit-1-polynomial-rational");

      expect(target?.min).toBe("medio");
      expect(target?.max).toBe("difficile");
    });

    it("should provide targets for all units", () => {
      const targets = getPersonalizedDifficultyTargets(userProgress);
      expect(targets.size).toBe(3); // All AP units
    });
  });

  describe("Edge Cases", () => {
    it("should handle problems with unrated difficulty", () => {
      mockProblem.difficulty = "unrated";
      const attempts: ProblemAttempt[] = Array(5)
        .fill(null)
        .map(() => ({
          problemId: "u1-p001",
          timestamp: new Date().toISOString(),
          userAnswer: "A",
          correct: true,
          timeSpentSeconds: 60,
          hintsUsed: 0,
        }));

      const difficulty = calculateDifficulty(mockProblem, attempts);
      expect(["facile", "medio", "difficile"]).toContain(difficulty);
    });

    it("should handle very long time spent", () => {
      const result = adjustDifficultyBasedOnPerformance(
        mockProblem,
        0.8,
        300, // 5 minutes
        0
      );
      expect(result.shouldAdjust).toBe(true);
    });

    it("should handle zero time spent", () => {
      const result = adjustDifficultyBasedOnPerformance(
        mockProblem,
        0.8,
        0, // Instant
        0
      );
      expect(result).toBeDefined();
    });
  });

  describe("Performance", () => {
    it("should handle large problem sets efficiently", () => {
      const problems: Problem[] = Array(1000)
        .fill(null)
        .map((_, i) => ({
          ...mockProblem,
          id: `u1-p${i.toString().padStart(4, "0")}`,
        }));

      const userProgress = { ...initialProgress };

      const start = performance.now();
      recommendNextProblem(userProgress, problems);
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Should be < 100ms
    });

    it("should handle large attempt histories efficiently", () => {
      const attempts: ProblemAttempt[] = Array(1000)
        .fill(null)
        .map(() => ({
          problemId: "u1-p001",
          timestamp: new Date().toISOString(),
          userAnswer: "A",
          correct: Math.random() > 0.5,
          timeSpentSeconds: 60,
          hintsUsed: 0,
        }));

      const start = performance.now();
      calculateDifficulty(mockProblem, attempts);
      const end = performance.now();

      expect(end - start).toBeLessThan(50); // Should be < 50ms
    });
  });
});
