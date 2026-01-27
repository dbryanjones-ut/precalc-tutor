import { describe, it, expect, beforeEach } from "vitest";
import { useProgressStore } from "./useProgressStore";
import { initialProgress } from "@/types/progress";

describe("useProgressStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useProgressStore.getState().resetProgress();
  });

  describe("Initial State", () => {
    it("should have initial progress state", () => {
      const { progress } = useProgressStore.getState();
      expect(progress).toBeDefined();
      expect(progress.totalProblemsAttempted).toBe(0);
      expect(progress.totalProblemsCorrect).toBe(0);
      expect(progress.currentStreak).toBe(0);
    });

    it("should have empty arrays for activities", () => {
      const { progress } = useProgressStore.getState();
      expect(progress.warmups).toEqual([]);
      expect(progress.q4Sprints).toEqual([]);
      expect(progress.brainDumps).toEqual([]);
      expect(progress.aiTutoringSessions).toEqual([]);
    });
  });

  describe("updateProblemResult", () => {
    it("should increment attempted count", () => {
      const { updateProblemResult, progress } = useProgressStore.getState();
      updateProblemResult("prob-1", true, 30);

      const updated = useProgressStore.getState().progress;
      expect(updated.totalProblemsAttempted).toBe(1);
    });

    it("should increment correct count for correct answers", () => {
      const { updateProblemResult } = useProgressStore.getState();
      updateProblemResult("prob-1", true, 30);

      const updated = useProgressStore.getState().progress;
      expect(updated.totalProblemsCorrect).toBe(1);
    });

    it("should not increment correct count for incorrect answers", () => {
      const { updateProblemResult } = useProgressStore.getState();
      updateProblemResult("prob-1", false, 30);

      const updated = useProgressStore.getState().progress;
      expect(updated.totalProblemsCorrect).toBe(0);
      expect(updated.totalProblemsAttempted).toBe(1);
    });

    it("should update lastActiveDate", () => {
      const { updateProblemResult } = useProgressStore.getState();
      const before = new Date().toISOString();

      updateProblemResult("prob-1", true, 30);

      const updated = useProgressStore.getState().progress;
      expect(updated.lastActiveDate).toBeTruthy();
      expect(new Date(updated.lastActiveDate).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime()
      );
    });

    it("should handle multiple problem attempts", () => {
      const { updateProblemResult } = useProgressStore.getState();

      updateProblemResult("prob-1", true, 30);
      updateProblemResult("prob-2", false, 45);
      updateProblemResult("prob-3", true, 60);

      const updated = useProgressStore.getState().progress;
      expect(updated.totalProblemsAttempted).toBe(3);
      expect(updated.totalProblemsCorrect).toBe(2);
    });
  });

  describe("updateStreak", () => {
    it("should maintain streak on same day", () => {
      const { updateStreak, progress } = useProgressStore.getState();

      // Set initial streak
      useProgressStore.setState({
        progress: {
          ...progress,
          currentStreak: 5,
          lastActiveDate: new Date().toISOString(),
        },
      });

      updateStreak();

      const updated = useProgressStore.getState().progress;
      expect(updated.currentStreak).toBe(5);
    });

    it("should increment streak on consecutive day", () => {
      const { updateStreak, progress } = useProgressStore.getState();

      // Set last active to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      useProgressStore.setState({
        progress: {
          ...progress,
          currentStreak: 5,
          lastActiveDate: yesterday.toISOString(),
        },
      });

      updateStreak();

      const updated = useProgressStore.getState().progress;
      expect(updated.currentStreak).toBe(6);
    });

    it("should reset streak when broken", () => {
      const { updateStreak, progress } = useProgressStore.getState();

      // Set last active to 2 days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      useProgressStore.setState({
        progress: {
          ...progress,
          currentStreak: 5,
          lastActiveDate: twoDaysAgo.toISOString(),
        },
      });

      updateStreak();

      const updated = useProgressStore.getState().progress;
      expect(updated.currentStreak).toBe(1);
    });

    it("should update longest streak", () => {
      const { updateStreak, progress } = useProgressStore.getState();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      useProgressStore.setState({
        progress: {
          ...progress,
          currentStreak: 9,
          longestStreak: 8,
          lastActiveDate: yesterday.toISOString(),
        },
      });

      updateStreak();

      const updated = useProgressStore.getState().progress;
      expect(updated.currentStreak).toBe(10);
      expect(updated.longestStreak).toBe(10);
    });

    it("should not decrease longest streak", () => {
      const { updateStreak, progress } = useProgressStore.getState();

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      useProgressStore.setState({
        progress: {
          ...progress,
          currentStreak: 5,
          longestStreak: 10,
          lastActiveDate: twoDaysAgo.toISOString(),
        },
      });

      updateStreak();

      const updated = useProgressStore.getState().progress;
      expect(updated.currentStreak).toBe(1);
      expect(updated.longestStreak).toBe(10); // Should remain unchanged
    });
  });

  describe("addWarmup", () => {
    it("should add warmup entry", () => {
      const { addWarmup } = useProgressStore.getState();

      addWarmup(["prob1", "prob2"], [true, false], 120);

      const updated = useProgressStore.getState().progress;
      expect(updated.warmups).toHaveLength(1);
      expect(updated.warmups[0].problems).toEqual(["prob1", "prob2"]);
      expect(updated.warmups[0].scores).toEqual([true, false]);
      expect(updated.warmups[0].timeSeconds).toBe(120);
      expect(updated.warmups[0].completed).toBe(true);
    });

    it("should add multiple warmups", () => {
      const { addWarmup } = useProgressStore.getState();

      addWarmup(["p1"], [true], 60);
      addWarmup(["p2"], [false], 90);

      const updated = useProgressStore.getState().progress;
      expect(updated.warmups).toHaveLength(2);
    });

    it("should store date with warmup", () => {
      const { addWarmup } = useProgressStore.getState();
      const before = new Date().toISOString();

      addWarmup(["prob1"], [true], 60);

      const updated = useProgressStore.getState().progress;
      expect(updated.warmups[0].date).toBeTruthy();
      expect(new Date(updated.warmups[0].date).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime()
      );
    });
  });

  describe("addQ4Sprint", () => {
    it("should add Q4 sprint entry", () => {
      const { addQ4Sprint } = useProgressStore.getState();

      addQ4Sprint(8, 10, 45, 0.8);

      const updated = useProgressStore.getState().progress;
      expect(updated.q4Sprints).toHaveLength(1);
      expect(updated.q4Sprints[0].problemsSolved).toBe(8);
      expect(updated.q4Sprints[0].totalProblems).toBe(10);
      expect(updated.q4Sprints[0].averageTimeSeconds).toBe(45);
      expect(updated.q4Sprints[0].accuracy).toBe(0.8);
    });

    it("should auto-increment week number", () => {
      const { addQ4Sprint } = useProgressStore.getState();

      addQ4Sprint(8, 10, 45, 0.8);
      addQ4Sprint(9, 10, 40, 0.9);

      const updated = useProgressStore.getState().progress;
      expect(updated.q4Sprints[0].week).toBe(1);
      expect(updated.q4Sprints[1].week).toBe(2);
    });

    it("should mark as completed", () => {
      const { addQ4Sprint } = useProgressStore.getState();

      addQ4Sprint(8, 10, 45, 0.8);

      const updated = useProgressStore.getState().progress;
      expect(updated.q4Sprints[0].completed).toBe(true);
    });
  });

  describe("addBrainDump", () => {
    it("should add brain dump entry", () => {
      const { addBrainDump } = useProgressStore.getState();

      const topics = ["Quadratics", "Trig"];
      const reflections = "Good progress this week";
      const focusAreas = ["Practice more word problems"];

      addBrainDump(topics, reflections, focusAreas);

      const updated = useProgressStore.getState().progress;
      expect(updated.brainDumps).toHaveLength(1);
      expect(updated.brainDumps[0].topics).toEqual(topics);
      expect(updated.brainDumps[0].reflections).toBe(reflections);
      expect(updated.brainDumps[0].focusAreasForWeek).toEqual(focusAreas);
    });

    it("should store date with brain dump", () => {
      const { addBrainDump } = useProgressStore.getState();

      addBrainDump(["Topic"], "Reflection", ["Focus"]);

      const updated = useProgressStore.getState().progress;
      expect(updated.brainDumps[0].date).toBeTruthy();
    });
  });

  describe("updateUnitProgress", () => {
    it("should update unit progress", () => {
      const { updateUnitProgress } = useProgressStore.getState();

      updateUnitProgress("unit-1-polynomial-rational", 5, 4);

      const updated = useProgressStore.getState().progress;
      expect(updated.units["unit-1-polynomial-rational"].problemsAttempted).toBe(5);
      expect(updated.units["unit-1-polynomial-rational"].problemsCorrect).toBe(4);
    });

    it("should calculate mastery percentage", () => {
      const { updateUnitProgress } = useProgressStore.getState();

      updateUnitProgress("unit-1-polynomial-rational", 10, 8);

      const updated = useProgressStore.getState().progress;
      expect(updated.units["unit-1-polynomial-rational"].mastery).toBe(0.8);
    });

    it("should accumulate progress over multiple calls", () => {
      const { updateUnitProgress } = useProgressStore.getState();

      updateUnitProgress("unit-1-polynomial-rational", 5, 4);
      updateUnitProgress("unit-1-polynomial-rational", 5, 5);

      const updated = useProgressStore.getState().progress;
      expect(updated.units["unit-1-polynomial-rational"].problemsAttempted).toBe(10);
      expect(updated.units["unit-1-polynomial-rational"].problemsCorrect).toBe(9);
      expect(updated.units["unit-1-polynomial-rational"].mastery).toBe(0.9);
    });

    it("should update lastPracticed timestamp", () => {
      const { updateUnitProgress } = useProgressStore.getState();

      updateUnitProgress("unit-1-polynomial-rational", 1, 1);

      const updated = useProgressStore.getState().progress;
      expect(updated.units["unit-1-polynomial-rational"].lastPracticed).toBeTruthy();
    });

    it("should handle zero attempts gracefully", () => {
      const { updateUnitProgress } = useProgressStore.getState();

      updateUnitProgress("unit-1-polynomial-rational", 0, 0);

      const updated = useProgressStore.getState().progress;
      expect(updated.units["unit-1-polynomial-rational"].mastery).toBe(0);
    });
  });

  describe("addAISession", () => {
    it("should add AI session ID", () => {
      const { addAISession } = useProgressStore.getState();

      addAISession("session-123");

      const updated = useProgressStore.getState().progress;
      expect(updated.aiTutoringSessions).toContain("session-123");
    });

    it("should add multiple sessions", () => {
      const { addAISession } = useProgressStore.getState();

      addAISession("session-1");
      addAISession("session-2");
      addAISession("session-3");

      const updated = useProgressStore.getState().progress;
      expect(updated.aiTutoringSessions).toHaveLength(3);
    });
  });

  describe("resetProgress", () => {
    it("should reset to initial state", () => {
      const { updateProblemResult, addWarmup, resetProgress } =
        useProgressStore.getState();

      // Add some progress
      updateProblemResult("prob-1", true, 30);
      addWarmup(["p1"], [true], 60);

      // Reset
      resetProgress();

      const updated = useProgressStore.getState().progress;
      expect(updated.totalProblemsAttempted).toBe(0);
      expect(updated.totalProblemsCorrect).toBe(0);
      expect(updated.warmups).toHaveLength(0);
    });
  });

  describe("Persistence", () => {
    it("should persist progress to storage", () => {
      const { updateProblemResult } = useProgressStore.getState();

      updateProblemResult("prob-1", true, 30);

      // Note: In actual browser environment, this would persist to localStorage
      // In test environment, we just verify the state is updated
      const updated = useProgressStore.getState().progress;
      expect(updated.totalProblemsAttempted).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid unit names gracefully", () => {
      const { updateUnitProgress } = useProgressStore.getState();

      // Should not throw error
      expect(() => {
        updateUnitProgress("invalid-unit" as any, 1, 1);
      }).not.toThrow();
    });

    it("should handle negative time values", () => {
      const { updateProblemResult } = useProgressStore.getState();

      // Should still work (garbage in, garbage out)
      updateProblemResult("prob-1", true, -30);

      const updated = useProgressStore.getState().progress;
      expect(updated.totalProblemsAttempted).toBe(1);
    });

    it("should handle very large numbers", () => {
      const { updateUnitProgress } = useProgressStore.getState();

      updateUnitProgress("functions", 1000000, 999999);

      const updated = useProgressStore.getState().progress;
      expect(updated.units.functions.problemsAttempted).toBe(1000000);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle a complete study session", () => {
      const {
        updateStreak,
        addWarmup,
        updateProblemResult,
        updateUnitProgress,
        addAISession,
      } = useProgressStore.getState();

      // Morning warmup
      updateStreak();
      addWarmup(["p1", "p2", "p3"], [true, true, false], 180);

      // Practice session
      updateProblemResult("prob-1", true, 45);
      updateProblemResult("prob-2", true, 60);
      updateProblemResult("prob-3", false, 90);
      updateUnitProgress("unit-1-polynomial-rational", 3, 2);

      // AI tutoring
      addAISession("session-morning");

      const updated = useProgressStore.getState().progress;
      expect(updated.warmups).toHaveLength(1);
      expect(updated.totalProblemsAttempted).toBe(3);
      expect(updated.totalProblemsCorrect).toBe(2);
      expect(updated.units["unit-1-polynomial-rational"].problemsAttempted).toBe(3);
      expect(updated.aiTutoringSessions).toHaveLength(1);
    });
  });
});
