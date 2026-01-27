/**
 * SM-2 Scheduler Tests
 *
 * Comprehensive test suite for the spaced repetition scheduler.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
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
  type ReviewCard,
  type QualityRating,
} from "../scheduler";

describe("SM-2 Scheduler", () => {
  describe("initializeCard", () => {
    it("should create a new card with default SM-2 parameters", () => {
      const card = initializeCard("u1-p001");

      expect(card.problemId).toBe("u1-p001");
      expect(card.easeFactor).toBe(SM2_CONFIG.INITIAL_EASE_FACTOR);
      expect(card.interval).toBe(SM2_CONFIG.FIRST_INTERVAL);
      expect(card.repetitions).toBe(0);
      expect(card.nextReview).toBeDefined();
      expect(card.consecutiveCorrect).toBe(0);
      expect(card.consecutiveIncorrect).toBe(0);
    });

    it("should set next review to 1 day from now", () => {
      const card = initializeCard("u1-p001");
      const nextReview = new Date(card.nextReview);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Should be within 1 second of tomorrow
      expect(Math.abs(nextReview.getTime() - tomorrow.getTime())).toBeLessThan(
        1000
      );
    });
  });

  describe("calculateNextReview", () => {
    let card: ReviewCard;

    beforeEach(() => {
      card = initializeCard("u1-p001");
    });

    it("should maintain interval on quality 3", () => {
      const updated = calculateNextReview(card, 3);
      expect(updated.interval).toBe(SM2_CONFIG.FIRST_INTERVAL);
      expect(updated.repetitions).toBe(1);
    });

    it("should adjust ease factor on quality 4", () => {
      const updated = calculateNextReview(card, 4);
      expect(updated.interval).toBe(SM2_CONFIG.FIRST_INTERVAL);
      expect(updated.repetitions).toBe(1);
      // Quality 4 gives slight decrease: 0.1 - (5-4) * (0.08 + (5-4) * 0.02) = 0.1 - 0.1 = 0
      // So ease factor stays same or very slightly changes
      expect(Math.abs(updated.easeFactor - card.easeFactor)).toBeLessThan(0.01);
    });

    it("should increase ease factor on quality 5", () => {
      const updated = calculateNextReview(card, 5);
      expect(updated.interval).toBe(SM2_CONFIG.FIRST_INTERVAL);
      expect(updated.repetitions).toBe(1);
      // Quality 5 gives: 0.1 - (5-5) * (...) = 0.1
      expect(updated.easeFactor).toBeGreaterThan(card.easeFactor);
    });

    it("should reset interval on quality below 3", () => {
      // Advance the card first
      card = calculateNextReview(card, 5);
      card = calculateNextReview(card, 5);
      expect(card.interval).toBe(SM2_CONFIG.SECOND_INTERVAL);

      // Now fail it
      const updated = calculateNextReview(card, 2);
      expect(updated.interval).toBe(SM2_CONFIG.FIRST_INTERVAL);
      expect(updated.repetitions).toBe(0);
    });

    it("should follow SM-2 interval progression", () => {
      // First repetition
      let updated = calculateNextReview(card, 5);
      expect(updated.interval).toBe(SM2_CONFIG.FIRST_INTERVAL);

      // Second repetition
      updated = calculateNextReview(updated, 5);
      expect(updated.interval).toBe(SM2_CONFIG.SECOND_INTERVAL);

      // Third repetition (should use ease factor)
      const previousInterval = updated.interval;
      updated = calculateNextReview(updated, 5);
      expect(updated.interval).toBeGreaterThan(previousInterval);
    });

    it("should adjust ease factor based on quality", () => {
      const q5 = calculateNextReview(card, 5);
      const q3 = calculateNextReview(card, 3);

      expect(q5.easeFactor).toBeGreaterThan(q3.easeFactor);
    });

    it("should not decrease ease factor below minimum", () => {
      let updated = card;

      // Try to decrease ease factor many times
      for (let i = 0; i < 20; i++) {
        updated = calculateNextReview(updated, 0);
      }

      expect(updated.easeFactor).toBeGreaterThanOrEqual(
        SM2_CONFIG.MINIMUM_EASE_FACTOR
      );
    });

    it("should track consecutive correct answers", () => {
      let updated = calculateNextReview(card, 5);
      expect(updated.consecutiveCorrect).toBe(1);

      updated = calculateNextReview(updated, 4);
      expect(updated.consecutiveCorrect).toBe(2);

      updated = calculateNextReview(updated, 2);
      expect(updated.consecutiveCorrect).toBe(0);
    });

    it("should track consecutive incorrect answers", () => {
      let updated = calculateNextReview(card, 0);
      expect(updated.consecutiveIncorrect).toBe(1);

      updated = calculateNextReview(updated, 1);
      expect(updated.consecutiveIncorrect).toBe(2);

      updated = calculateNextReview(updated, 4);
      expect(updated.consecutiveIncorrect).toBe(0);
    });
  });

  describe("calculateQuality", () => {
    it("should return 5 for fast correct answers", () => {
      const quality = calculateQuality(true, 30, 60, 0);
      expect(quality).toBe(5);
    });

    it("should return 4 for normal-speed correct answers", () => {
      const quality = calculateQuality(true, 65, 60, 0);
      expect(quality).toBe(4);
    });

    it("should return 3 for slow correct answers", () => {
      const quality = calculateQuality(true, 100, 60, 0);
      expect(quality).toBe(3);
    });

    it("should return 2 for incorrect with no hints", () => {
      const quality = calculateQuality(false, 60, 60, 0);
      expect(quality).toBe(2);
    });

    it("should return 1 for incorrect with one hint", () => {
      const quality = calculateQuality(false, 60, 60, 1);
      expect(quality).toBe(1);
    });

    it("should return 0 for incorrect with multiple hints", () => {
      const quality = calculateQuality(false, 60, 60, 2);
      expect(quality).toBe(0);
    });
  });

  describe("updateProgress", () => {
    let card: ReviewCard;

    beforeEach(() => {
      card = initializeCard("u1-p001");
    });

    it("should convert performance to quality rating", () => {
      const result = updateProgress(card, true, 30, 60, 0);
      expect(result.wasCorrect).toBe(true);
      expect(result.card.quality).toBe(5); // Fast and correct
    });

    it("should return deltas for interval and ease factor", () => {
      const result = updateProgress(card, true, 45, 60, 0);
      expect(result.intervalChanged).toBeDefined();
      expect(result.easeFactorChanged).toBeDefined();
    });

    it("should handle incorrect answers appropriately", () => {
      const result = updateProgress(card, false, 60, 60, 1);
      expect(result.wasCorrect).toBe(false);
      expect(result.card.repetitions).toBe(0);
    });
  });

  describe("getReviewQueue", () => {
    let cards: ReviewCard[];

    beforeEach(() => {
      const now = new Date();

      // Create cards with different review dates
      cards = [
        {
          ...initializeCard("u1-p001"),
          nextReview: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
        },
        {
          ...initializeCard("u1-p002"),
          nextReview: new Date(now.getTime() - 172800000).toISOString(), // 2 days ago
        },
        {
          ...initializeCard("u1-p003"),
          nextReview: new Date(now.getTime() + 86400000).toISOString(), // 1 day ahead
        },
        {
          ...initializeCard("u1-p004"),
          nextReview: now.toISOString(), // Now
        },
      ];
    });

    it("should return only cards due for review", () => {
      const queue = getReviewQueue(cards);
      expect(queue.length).toBe(3); // Past due + now, not future
    });

    it("should sort by urgency (most overdue first)", () => {
      const queue = getReviewQueue(cards);
      expect(queue[0].problemId).toBe("u1-p002"); // 2 days overdue
      expect(queue[1].problemId).toBe("u1-p001"); // 1 day overdue
    });

    it("should return empty array if no cards due", () => {
      const futureCards = cards.filter((c) =>
        new Date(c.nextReview) > new Date()
      );
      const queue = getReviewQueue(futureCards);
      expect(queue.length).toBe(0);
    });

    it("should handle custom date parameter", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const queue = getReviewQueue(cards, futureDate);
      expect(queue.length).toBe(4); // All cards
    });
  });

  describe("getDailyReviewCount", () => {
    it("should return the count of reviews in the queue", () => {
      const cards = [
        initializeCard("u1-p001"),
        initializeCard("u1-p002"),
        initializeCard("u1-p003"),
      ];

      expect(getDailyReviewCount(cards)).toBe(3);
    });

    it("should return 0 for empty queue", () => {
      expect(getDailyReviewCount([])).toBe(0);
    });
  });

  describe("getCardStats", () => {
    it("should correctly identify overdue cards", () => {
      const card = initializeCard("u1-p001");
      card.nextReview = new Date(Date.now() - 86400000).toISOString(); // 1 day ago

      const stats = getCardStats(card);
      expect(stats.isOverdue).toBe(true);
      expect(stats.daysOverdue).toBe(1);
    });

    it("should calculate correct mastery level", () => {
      let card = initializeCard("u1-p001");

      // Learning
      expect(getCardStats(card).masteryLevel).toBe("learning");

      // Young (< 21 days)
      card.repetitions = 3;
      card.interval = 10;
      expect(getCardStats(card).masteryLevel).toBe("young");

      // Mature (21-90 days)
      card.interval = 30;
      expect(getCardStats(card).masteryLevel).toBe("mature");

      // Mastered (> 90 days)
      card.interval = 100;
      expect(getCardStats(card).masteryLevel).toBe("mastered");
    });

    it("should determine performance trend", () => {
      let card = initializeCard("u1-p001");

      // Stable
      card.consecutiveCorrect = 1;
      card.consecutiveIncorrect = 1;
      expect(getCardStats(card).performanceTrend).toBe("stable");

      // Improving
      card.consecutiveCorrect = 3;
      card.consecutiveIncorrect = 0;
      expect(getCardStats(card).performanceTrend).toBe("improving");

      // Declining
      card.consecutiveCorrect = 0;
      card.consecutiveIncorrect = 3;
      expect(getCardStats(card).performanceTrend).toBe("declining");
    });
  });

  describe("bulkUpdateCards", () => {
    it("should update multiple cards efficiently", () => {
      const cards = [
        initializeCard("u1-p001"),
        initializeCard("u1-p002"),
        initializeCard("u1-p003"),
      ];

      const updates = new Map<string, QualityRating>();
      updates.set("u1-p001", 5);
      updates.set("u1-p003", 3);

      const updated = bulkUpdateCards(cards, updates);

      expect(updated[0].quality).toBe(5);
      expect(updated[1].quality).toBeUndefined(); // Not updated
      expect(updated[2].quality).toBe(3);
    });
  });

  describe("getReviewDistribution", () => {
    it("should calculate review distribution for next N days", () => {
      const cards = [
        initializeCard("u1-p001"),
        initializeCard("u1-p002"),
        initializeCard("u1-p003"),
      ];

      // Set different review dates
      const today = new Date();
      cards[0].nextReview = today.toISOString();
      cards[1].nextReview = new Date(
        today.getTime() + 86400000
      ).toISOString();
      cards[2].nextReview = new Date(
        today.getTime() + 86400000
      ).toISOString();

      const distribution = getReviewDistribution(cards, 7);

      expect(distribution.size).toBe(7);

      const todayStr = today.toISOString().split("T")[0];
      expect(distribution.get(todayStr)).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long intervals gracefully", () => {
      let card = initializeCard("u1-p001");
      card.interval = 365; // 1 year
      card.easeFactor = 2.5;
      card.repetitions = 10;

      const updated = calculateNextReview(card, 5);
      expect(updated.interval).toBeGreaterThan(card.interval);
    });

    it("should handle rapid repetitions", () => {
      let card = initializeCard("u1-p001");

      // Practice 100 times with perfect quality
      for (let i = 0; i < 100; i++) {
        card = calculateNextReview(card, 5);
      }

      expect(card.easeFactor).toBeGreaterThan(SM2_CONFIG.INITIAL_EASE_FACTOR);
      expect(card.interval).toBeGreaterThan(100);
    });

    it("should handle date boundaries correctly", () => {
      const card = initializeCard("u1-p001");
      const nextReview = new Date(card.nextReview);
      const now = new Date();

      expect(nextReview.getDate()).toBe(now.getDate() + 1);
    });
  });

  describe("Performance", () => {
    it("should handle 1000+ cards efficiently", () => {
      const cards: ReviewCard[] = [];
      for (let i = 0; i < 1000; i++) {
        cards.push(initializeCard(`u1-p${i.toString().padStart(3, "0")}`));
      }

      const start = performance.now();
      const queue = getReviewQueue(cards);
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Should be < 100ms
      expect(queue.length).toBe(1000);
    });

    it("should handle bulk updates efficiently", () => {
      const cards: ReviewCard[] = [];
      const updates = new Map<string, QualityRating>();

      for (let i = 0; i < 1000; i++) {
        const id = `u1-p${i.toString().padStart(3, "0")}`;
        cards.push(initializeCard(id));
        updates.set(id, 4);
      }

      const start = performance.now();
      bulkUpdateCards(cards, updates);
      const end = performance.now();

      expect(end - start).toBeLessThan(200); // Should be < 200ms
    });
  });
});
