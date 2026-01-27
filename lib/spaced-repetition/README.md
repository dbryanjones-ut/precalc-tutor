# Spaced Repetition System

A production-ready implementation of the SM-2 (SuperMemo 2) spaced repetition algorithm with adaptive difficulty adjustment and intelligent review scheduling.

## Overview

This system helps optimize long-term retention of AP Precalculus concepts by:
- Scheduling reviews at scientifically-proven intervals
- Adapting difficulty based on performance
- Intelligently prioritizing weak topics
- Balancing workload and preventing cognitive fatigue

## Architecture

### Core Modules

1. **scheduler.ts** - SM-2 algorithm implementation
2. **difficulty-calc.ts** - Adaptive difficulty adjustment
3. **review-scheduler.ts** - Review queue management

### Integration Points

- **useProgressStore** - Zustand store integration
- **ReviewItem** type - Data persistence layer
- **Problem** interface - Problem metadata

## Quick Start

```typescript
import {
  initializeCard,
  updateProgress,
  getReviewQueue,
  buildDailyQueue,
  recommendNextProblem,
} from '@/lib/spaced-repetition';

// Initialize a new review card
const card = initializeCard("u1-p001");

// After user completes a problem
const result = updateProgress(card, true, 45, 60, 0);
console.log(`Next review in ${result.card.interval} days`);

// Get today's review queue
const dueReviews = getReviewQueue(allCards);

// Build optimized daily queue
const dailyProblems = buildDailyQueue(problems, progress, 20);
```

## SM-2 Algorithm

### Configuration

```typescript
SM2_CONFIG = {
  INITIAL_EASE_FACTOR: 2.5,
  MINIMUM_EASE_FACTOR: 1.3,
  FIRST_INTERVAL: 1,  // days
  SECOND_INTERVAL: 6, // days
  QUALITY_THRESHOLD: 3, // Below = fail
}
```

### Quality Ratings (0-5)

| Rating | Meaning | Outcome |
|--------|---------|---------|
| 0 | Complete blackout | Reset to day 1 |
| 1 | Incorrect with heavy hints | Reset to day 1 |
| 2 | Incorrect with partial recall | Reset to day 1 |
| 3 | Correct with serious difficulty | Minimal ease increase |
| 4 | Correct after hesitation | Normal ease increase |
| 5 | Perfect immediate recall | Maximum ease increase |

### Interval Progression

```
Repetition 1: 1 day
Repetition 2: 6 days
Repetition 3+: previous_interval × ease_factor
```

### Automatic Quality Calculation

The system automatically converts performance metrics to quality ratings:

```typescript
// Incorrect responses (0-2)
if (!correct) {
  if (hintsUsed === 0) return 2;  // Some recall
  if (hintsUsed === 1) return 1;  // Heavy hints
  return 0;                        // Complete blackout
}

// Correct responses (3-5) based on time
if (timeRatio > 1.5) return 3;  // Slow (>150% expected)
if (timeRatio > 1.0) return 4;  // Normal (100-150%)
return 5;                        // Fast (<100%)
```

## Adaptive Difficulty

### Difficulty Adjustment Factors

1. **Accuracy** (40% weight)
   - High accuracy (>85%) → Increase difficulty
   - Low accuracy (<50%) → Decrease difficulty

2. **Time Performance** (25% weight)
   - Fast completion (<80% expected) → Increase
   - Slow completion (>150% expected) → Decrease

3. **Hints Used** (20% weight)
   - No hints + high accuracy → Increase
   - Frequent hints → Decrease

4. **Recent Trend** (15% weight)
   - Improving performance → Increase
   - Declining performance → Decrease

### Difficulty Levels

```typescript
type DifficultyLevel = "facile" | "medio" | "difficile";
```

Numeric mapping: facile=1, medio=2, difficile=3

### Personalized Targets

Based on unit mastery:
- **Low mastery (<30%)**: facile only
- **Building (30-60%)**: facile to medio
- **Proficient (60-85%)**: medio to difficile
- **High mastery (>85%)**: medio to difficile (challenging)

## Review Scheduling

### Daily Queue Building

```typescript
const queue = buildDailyQueue(problems, progress, targetCount);
```

Features:
- Prioritization by urgency and weakness
- Topic interleaving (max 3 consecutive same topic)
- Unit interleaving (max 5 consecutive same unit)
- Calculator/non-calculator balancing (40/60 split)

### Prioritization Weights

```typescript
WEIGHTS = {
  overdue: 0.35,      // Days past due date
  weakness: 0.25,     // Low consecutive correct count
  variety: 0.20,      // Topic/unit diversity bonus
  recency: 0.20,      // Time since last review
}
```

### Weekly Distribution

```typescript
const schedule = distributeReviews(problems, 7);

console.log(schedule.averagePerDay);
console.log(schedule.peakDay);
console.log(schedule.lightestDay);
```

### Optimal Review Count

```typescript
const optimal = calculateOptimalReviewCount(progress, dueCount);
```

Returns personalized daily target (10-50 reviews) based on:
- User's recent activity
- Current backlog
- Historical capacity

## Store Integration

### useProgressStore Methods

```typescript
// Initialize review card
store.ensureReviewCard(problemId);

// Bulk initialize
store.bulkInitializeReviews(problemIds);

// Update after attempt
store.updateReviewResult(problemId, correct, timeSpent, expectedTime, hints);

// Schedule with quality rating
store.scheduleReview(problemId, quality, timeSpent);

// Get due reviews
const queue = store.getReviewQueue();

// Get next review date
const nextDate = store.getNextReviewDate();
```

### Automatic Integration

The store automatically updates spaced repetition when:
- User completes a problem
- Warmup drills are completed
- Q4 sprints are finished

## Performance Characteristics

### Benchmarks

All operations tested with 1000+ items:

| Operation | Time | Complexity |
|-----------|------|------------|
| initializeCard | <1ms | O(1) |
| calculateNextReview | <1ms | O(1) |
| getReviewQueue | <100ms | O(n log n) |
| buildDailyQueue | <500ms | O(n²) |
| bulkUpdateCards | <200ms | O(n) |
| prioritizeReviews | <200ms | O(n log n) |

### Memory Usage

Typical card size: ~200 bytes
1000 cards: ~200KB in memory

## Testing

### Run Tests

```bash
npm test lib/spaced-repetition/__tests__
```

### Test Coverage

- ✅ SM-2 algorithm correctness
- ✅ Quality rating conversion
- ✅ Interval progression
- ✅ Edge cases (date boundaries, extremes)
- ✅ Performance (1000+ cards)
- ✅ Difficulty adjustment logic
- ✅ Topic performance analysis
- ✅ Review prioritization
- ✅ Interleaving constraints
- ✅ Calculator balancing

## Usage Examples

### Basic Review Flow

```typescript
// Initialize cards for new problems
const problemIds = ["u1-p001", "u1-p002", "u1-p003"];
store.bulkInitializeReviews(problemIds);

// Get today's review queue
const dueCards = store.getReviewQueue();
console.log(`${dueCards.length} reviews due today`);

// Build optimized queue
const dailyQueue = buildDailyQueue(
  allProblems,
  store.progress,
  20
);

// User completes a problem
store.updateProblemResult(
  "u1-p001",
  true,      // correct
  45,        // seconds
  60,        // expected time
  0          // hints used
);

// Check next review date
const nextReview = store.getNextReviewDate();
```

### Difficulty Adaptation

```typescript
// Get recommendation for current difficulty
const recommendation = adjustDifficultyBasedOnPerformance(
  problem,
  0.85,  // 85% accuracy
  45,    // average time
  0      // hints used
);

if (recommendation.shouldAdjust) {
  console.log(`Recommend: ${recommendation.recommendedDifficulty}`);
  console.log(`Reason: ${recommendation.reason}`);
  console.log(`Confidence: ${(recommendation.confidence * 100).toFixed(0)}%`);
}

// Recommend next problem
const nextProblem = recommendNextProblem(
  userProgress,
  availableProblems,
  {
    unit: "unit-1-polynomial-rational",
    maxDifficulty: "medio",
  }
);
```

### Weekly Planning

```typescript
// Get 7-day schedule
const schedule = distributeReviews(problems, 7);

schedule.dailySchedules.forEach(day => {
  console.log(`${day.date}: ${day.totalCount} reviews`);
  console.log(`  Time: ${day.estimatedTimeMinutes} minutes`);
  console.log(`  Overdue: ${day.difficultyDistribution.overdue}`);
  console.log(`  Weak: ${day.difficultyDistribution.weak}`);
});

console.log(`\nPeak day: ${schedule.peakDay}`);
console.log(`Lightest day: ${schedule.lightestDay}`);
console.log(`Average: ${schedule.averagePerDay.toFixed(1)} per day`);
```

### Review Statistics

```typescript
// Get statistics for dashboard
const stats = getReviewStats(todaysReviews);

console.log(`Total reviews: ${stats.total}`);
console.log(`Overdue: ${stats.overdue}`);
console.log(`Weak topics: ${stats.weak}`);
console.log(`Estimated time: ${stats.estimatedTimeMinutes} minutes`);
console.log(`Calculator needed: ${stats.calculatorNeeded}`);

// Unit distribution
Object.entries(stats.byUnit).forEach(([unit, count]) => {
  console.log(`  ${unit}: ${count}`);
});
```

## Algorithm Details

### SM-2 Ease Factor Calculation

```
EF' = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
```

Where:
- EF = current ease factor
- q = quality rating (0-5)
- EF' = new ease factor

Minimum EF is 1.3 to prevent cards from becoming too difficult.

### Mastery Levels

Based on interval length:

| Level | Interval | Description |
|-------|----------|-------------|
| Learning | 0 reps | Just starting |
| Young | <21 days | Recent learning |
| Mature | 21-90 days | Solidified |
| Mastered | >90 days | Long-term retention |

### Performance Trends

Based on consecutive performance:

- **Improving**: consecutiveCorrect - consecutiveIncorrect >= 2
- **Stable**: difference between -1 and 1
- **Declining**: consecutiveCorrect - consecutiveIncorrect <= -2

## Best Practices

### 1. Initialize Early

```typescript
// Initialize cards when problems are first loaded
useEffect(() => {
  store.bulkInitializeReviews(allProblemIds);
}, [allProblemIds]);
```

### 2. Consistent Time Tracking

```typescript
// Always track time and expected time for accurate quality calculation
const startTime = Date.now();
// ... user solves problem
const timeSpent = (Date.now() - startTime) / 1000;
store.updateProblemResult(id, correct, timeSpent, problem.estimatedTimeSeconds);
```

### 3. Use Batch Operations

```typescript
// Prefer bulk operations for better performance
store.bulkInitializeReviews(problemIds);

// Instead of:
problemIds.forEach(id => store.ensureReviewCard(id));
```

### 4. Balance Workload

```typescript
// Calculate optimal daily target
const optimal = calculateOptimalReviewCount(progress, dueCount);
const queue = buildDailyQueue(problems, progress, optimal);
```

### 5. Monitor Performance

```typescript
// Check card statistics for struggling topics
cards.forEach(card => {
  const stats = getCardStats(card);
  if (stats.performanceTrend === "declining") {
    console.warn(`Struggling with: ${card.problemId}`);
  }
});
```

## API Reference

See inline JSDoc comments in source files for detailed API documentation.

## Contributing

When modifying the spaced repetition system:

1. Ensure all tests pass
2. Add tests for new functionality
3. Verify performance benchmarks
4. Update this README
5. Consider backward compatibility with stored data

## References

- [SuperMemo 2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Spaced Repetition Research](https://scholar.google.com/scholar?q=spaced+repetition)
- [Ebbinghaus Forgetting Curve](https://en.wikipedia.org/wiki/Forgetting_curve)
