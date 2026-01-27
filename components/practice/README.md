# Practice Components

Comprehensive practice tools for AP Precalculus mastery.

## Components Overview

### 1. DailyWarmup

**File:** `DailyWarmup.tsx`

A 4-question daily drill implementing spaced repetition:
- Q1: Yesterday's lesson
- Q2: Last week's material
- Q3: Last month's content
- Q4: Symbolic manipulation (no calculator)

**Features:**
- 8-minute timer with visual countdown
- Progress tracking with answer visualization
- Streak tracking to encourage daily practice
- Instant grading with detailed feedback
- Integration with useProgressStore

**Usage:**
```tsx
import { DailyWarmup } from '@/components/practice';

<DailyWarmup
  problems={fourProblems}
  onComplete={(results) => {
    // Handle completion
  }}
/>
```

### 2. Q4SymbolicDrill

**File:** `Q4SymbolicDrill.tsx`

Weekly sprint for AP Exam Question 4 (symbolic manipulation without calculator):
- 10 problems per sprint
- 15-minute target time (90 seconds per problem)
- Speed and accuracy tracking
- Streak system

**Features:**
- Live timer with color-coded progress
- Real-time validation
- Performance analytics
- Best streak tracking
- Coach's feedback based on performance

**Usage:**
```tsx
import { Q4SymbolicDrill } from '@/components/practice';

<Q4SymbolicDrill
  problems={tenProblems}
  weekNumber={currentWeek}
  onComplete={(results) => {
    // Handle completion
  }}
/>
```

### 3. UnitCirclePractice

**File:** `UnitCirclePractice.tsx`

Interactive unit circle for mastering special angles:
- 16 special angles (0°, 30°, 45°, 60°, etc.)
- Color-coded families (Blue: π/6, Red: π/4, Green: π/3)
- Click-to-reveal mode
- Quiz mode with multiple choice

**Features:**
- Interactive SVG unit circle
- Family filtering
- Show/hide all labels
- Timed quiz mode
- Reference table

**Usage:**
```tsx
import { UnitCirclePractice } from '@/components/practice';

<UnitCirclePractice />
```

### 4. TransformationPractice

**File:** `TransformationPractice.tsx`

Interactive exploration of function transformations:
- All major function families (quadratic, absolute, radical, trig, exponential, log)
- Parameters: a (vertical stretch), h (horizontal shift), k (vertical shift)
- Side-by-side parent/transformed comparison

**Features:**
- Interactive sliders for parameters
- Real-time transformation visualization
- Input vs Output geography explanations
- Domain and range updates
- Quick reference guide

**Usage:**
```tsx
import { TransformationPractice } from '@/components/practice';

<TransformationPractice />
```

### 5. ProblemCard

**File:** `ProblemCard.tsx`

Reusable problem display component with full solution support:
- Multiple choice or free response
- Timer tracking
- Hint system (progressive disclosure)
- Step-by-step solutions
- Common mistake warnings

**Features:**
- LaTeX rendering
- Answer validation
- Hints with usage tracking
- Solution reveal
- Common mistakes display
- Accessible feedback

**Usage:**
```tsx
import { ProblemCard } from '@/components/practice';

<ProblemCard
  problem={problemData}
  onAnswer={(correct, timeSeconds) => {
    // Handle answer
  }}
  showTimer={true}
  autoSubmit={false}
/>
```

## Supporting Utilities

### Timer Utilities

**File:** `lib/utils/timer.ts`

Helper functions for time management:
- `formatTime(seconds)` - Format as MM:SS
- `formatTimeVerbose(seconds)` - Format as "Xm Ys"
- `getTimeColor(seconds, target)` - Get color class based on time ratio
- `getProgressColor(accuracy)` - Get color for accuracy
- `calculateAverageTime(times[])` - Calculate average
- `calculateAccuracy(correct, total)` - Calculate percentage

## Main Practice Page

**File:** `app/practice/page.tsx`

Hub for all practice modes with:
- Stats overview (streak, problems solved, accuracy)
- Daily routines section (Warmup, Q4 Sprint)
- Focused practice section (Unit Circle, Transformations)
- Practice tips
- Completion tracking

## Data Flow

```
Problem Data (Mock or API)
    ↓
Practice Component
    ↓
AnswerValidator.validate()
    ↓
Result Feedback
    ↓
useProgressStore.add*()
    ↓
Persisted Progress
```

## Best Practices

### Creating Problems

Problems should follow the `Problem` type from `@/types/problem`:
```typescript
{
  id: "unique-id",
  type: "symbolic-manipulation" | "multiple-choice" | etc.,
  unit: "unit-1-polynomial-rational",
  topic: "factoring",
  prompt: "\\text{Factor: } x^2 + 5x + 6",
  correctAnswer: "(x + 2)(x + 3)",
  solutions: [...],
  commonMistakes: [...],
  // ... other fields
}
```

### Validation Options

The AnswerValidator supports:
```typescript
{
  tolerance: 1e-6,              // Numeric tolerance
  allowPartialCredit: false,    // Award partial credit
  requireSimplified: false,     // Require simplified form
}
```

### Progress Tracking

All practice components integrate with `useProgressStore`:
- `addWarmup(problemIds, scores, time)`
- `addQ4Sprint(solved, total, avgTime, accuracy)`
- `updateStreak()`
- `updateProblemResult(id, correct, time)`

## Accessibility

All components include:
- ARIA labels and roles
- Keyboard navigation
- Color-blind friendly palettes
- Screen reader support
- High contrast mode support

## Performance Considerations

- LaTeX validation before rendering
- Memoized calculations
- Optimized re-renders
- Timer cleanup on unmount
- Progress debouncing

## Future Enhancements

- [ ] Topic-specific drills
- [ ] Mock exam mode
- [ ] Competitive leaderboards
- [ ] Adaptive difficulty
- [ ] More transformation practice problems
- [ ] Graphing calculator integration
- [ ] Step-by-step solution videos
- [ ] Peer comparison analytics
