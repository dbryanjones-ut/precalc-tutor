import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProgress, ProblemAttempt } from "@/types";
import { initialProgress } from "@/types";
import type { ReviewCard } from "@/lib/spaced-repetition/scheduler";
import {
  initializeCard,
  updateProgress,
  getReviewQueue,
  calculateQuality,
  type QualityRating,
} from "@/lib/spaced-repetition/scheduler";

interface ProgressStore {
  progress: UserProgress;

  // Actions
  updateProblemResult: (
    problemId: string,
    correct: boolean,
    timeSeconds: number,
    expectedTime?: number,
    hintsUsed?: number
  ) => void;

  updateStreak: () => void;

  addWarmup: (problems: string[], scores: boolean[], timeSeconds: number) => void;

  addQ4Sprint: (
    problemsSolved: number,
    totalProblems: number,
    averageTime: number,
    accuracy: number
  ) => void;

  addBrainDump: (
    topics: string[],
    reflections: string,
    focusAreas: string[]
  ) => void;

  updateUnitProgress: (
    unit: string,
    problemsAttempted: number,
    problemsCorrect: number
  ) => void;

  addAISession: (sessionId: string) => void;

  // Spaced Repetition Actions
  scheduleReview: (
    problemId: string,
    quality: QualityRating,
    timeSpent?: number,
    expectedTime?: number
  ) => void;

  getReviewQueue: () => ReviewCard[];

  updateReviewResult: (
    problemId: string,
    correct: boolean,
    timeSpent: number,
    expectedTime?: number,
    hintsUsed?: number
  ) => void;

  ensureReviewCard: (problemId: string) => void;

  bulkInitializeReviews: (problemIds: string[]) => void;

  getNextReviewDate: () => string;

  resetProgress: () => void;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      progress: initialProgress,

      updateProblemResult: (problemId, correct, timeSeconds, expectedTime, hintsUsed) =>
        set((state) => {
          const updated = { ...state.progress };
          updated.totalProblemsAttempted += 1;
          if (correct) updated.totalProblemsCorrect += 1;
          updated.lastActiveDate = new Date().toISOString();

          // Also update spaced repetition
          get().updateReviewResult(
            problemId,
            correct,
            timeSeconds,
            expectedTime,
            hintsUsed
          );

          return { progress: updated };
        }),

      updateStreak: () =>
        set((state) => {
          const today = new Date().toISOString().split("T")[0];
          const lastActive = new Date(state.progress.lastActiveDate)
            .toISOString()
            .split("T")[0];

          const updated = { ...state.progress };

          if (today === lastActive) {
            // Same day, no change to streak
            return { progress: updated };
          }

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];

          if (lastActive === yesterdayStr) {
            // Consecutive day
            updated.currentStreak += 1;
            updated.longestStreak = Math.max(
              updated.longestStreak,
              updated.currentStreak
            );
          } else {
            // Streak broken
            updated.currentStreak = 1;
          }

          updated.lastActiveDate = new Date().toISOString();
          return { progress: updated };
        }),

      addWarmup: (problems, scores, timeSeconds) =>
        set((state) => {
          const updated = { ...state.progress };
          updated.warmups.push({
            date: new Date().toISOString(),
            problems,
            scores,
            timeSeconds,
            completed: true,
          });

          // Update reviews for each warmup problem
          problems.forEach((problemId, index) => {
            const correct = scores[index];
            const avgTime = timeSeconds / problems.length;
            get().updateReviewResult(problemId, correct, avgTime, 60, 0);
          });

          return { progress: updated };
        }),

      addQ4Sprint: (problemsSolved, totalProblems, averageTime, accuracy) =>
        set((state) => {
          const updated = { ...state.progress };
          const week = Math.ceil(updated.q4Sprints.length + 1);
          updated.q4Sprints.push({
            week,
            date: new Date().toISOString(),
            problemsSolved,
            totalProblems,
            averageTimeSeconds: averageTime,
            accuracy,
            completed: true,
          });
          return { progress: updated };
        }),

      addBrainDump: (topics, reflections, focusAreas) =>
        set((state) => {
          const updated = { ...state.progress };
          updated.brainDumps.push({
            date: new Date().toISOString(),
            topics,
            reflections,
            focusAreasForWeek: focusAreas,
          });
          return { progress: updated };
        }),

      updateUnitProgress: (unit, problemsAttempted, problemsCorrect) =>
        set((state) => {
          const updated = { ...state.progress };
          const unitKey = unit as keyof typeof updated.units;
          if (updated.units[unitKey]) {
            updated.units[unitKey].problemsAttempted += problemsAttempted;
            updated.units[unitKey].problemsCorrect += problemsCorrect;
            updated.units[unitKey].mastery =
              updated.units[unitKey].problemsAttempted > 0
                ? updated.units[unitKey].problemsCorrect /
                  updated.units[unitKey].problemsAttempted
                : 0;
            updated.units[unitKey].lastPracticed = new Date().toISOString();
          }
          return { progress: updated };
        }),

      addAISession: (sessionId) =>
        set((state) => {
          const updated = { ...state.progress };
          updated.aiTutoringSessions.push(sessionId);
          return { progress: updated };
        }),

      // Spaced Repetition Methods

      scheduleReview: (problemId, quality, timeSpent, expectedTime) =>
        set((state) => {
          const updated = { ...state.progress };
          const cardIndex = updated.reviewQueue.findIndex(
            (card) => card.problemId === problemId
          );

          let card: ReviewCard;
          if (cardIndex === -1) {
            // Create new card
            card = initializeCard(problemId);
          } else {
            card = updated.reviewQueue[cardIndex] as ReviewCard;
          }

          // Calculate next review using SM-2
          const result = updateProgress(
            card,
            quality >= 3,
            timeSpent || 60,
            expectedTime,
            0
          );

          if (cardIndex === -1) {
            updated.reviewQueue.push(result.card);
          } else {
            updated.reviewQueue[cardIndex] = result.card;
          }

          // Update next review date
          const nextDates = updated.reviewQueue
            .map((c) => new Date(c.nextReview).getTime())
            .filter((time) => time > Date.now());

          if (nextDates.length > 0) {
            updated.nextReviewDate = new Date(
              Math.min(...nextDates)
            ).toISOString();
          }

          return { progress: updated };
        }),

      getReviewQueue: () => {
        const state = get();
        return getReviewQueue(state.progress.reviewQueue as ReviewCard[]);
      },

      updateReviewResult: (problemId, correct, timeSpent, expectedTime, hintsUsed) =>
        set((state) => {
          const updated = { ...state.progress };

          // Ensure card exists
          let cardIndex = updated.reviewQueue.findIndex(
            (card) => card.problemId === problemId
          );

          if (cardIndex === -1) {
            // Initialize new card
            const newCard = initializeCard(problemId);
            updated.reviewQueue.push(newCard);
            cardIndex = updated.reviewQueue.length - 1;
          }

          const card = updated.reviewQueue[cardIndex] as ReviewCard;

          // Update using SM-2 algorithm
          const result = updateProgress(
            card,
            correct,
            timeSpent,
            expectedTime,
            hintsUsed
          );

          updated.reviewQueue[cardIndex] = result.card;

          // Update next review date (earliest review in queue)
          const nextDates = updated.reviewQueue
            .map((c) => new Date(c.nextReview).getTime())
            .filter((time) => time > Date.now());

          if (nextDates.length > 0) {
            updated.nextReviewDate = new Date(
              Math.min(...nextDates)
            ).toISOString();
          } else {
            updated.nextReviewDate = new Date().toISOString();
          }

          return { progress: updated };
        }),

      ensureReviewCard: (problemId) =>
        set((state) => {
          const updated = { ...state.progress };
          const exists = updated.reviewQueue.some(
            (card) => card.problemId === problemId
          );

          if (!exists) {
            const newCard = initializeCard(problemId);
            updated.reviewQueue.push(newCard);
          }

          return { progress: updated };
        }),

      bulkInitializeReviews: (problemIds) =>
        set((state) => {
          const updated = { ...state.progress };
          const existingIds = new Set(
            updated.reviewQueue.map((card) => card.problemId)
          );

          problemIds.forEach((problemId) => {
            if (!existingIds.has(problemId)) {
              const newCard = initializeCard(problemId);
              updated.reviewQueue.push(newCard);
            }
          });

          // Update next review date
          const nextDates = updated.reviewQueue
            .map((c) => new Date(c.nextReview).getTime())
            .filter((time) => time > Date.now());

          if (nextDates.length > 0) {
            updated.nextReviewDate = new Date(
              Math.min(...nextDates)
            ).toISOString();
          }

          return { progress: updated };
        }),

      getNextReviewDate: () => {
        const state = get();
        return state.progress.nextReviewDate;
      },

      resetProgress: () => set({ progress: initialProgress }),
    }),
    {
      name: "precalc-progress-v1",
    }
  )
);
