# Practice Components - Usage Examples

Real-world examples showing how to use the practice components.

## Daily Warmup

### Basic Usage

```tsx
import { DailyWarmup } from '@/components/practice';
import type { Problem } from '@/types/problem';

export default function WarmupPage() {
  // Fetch 4 problems using spaced repetition algorithm
  const warmupProblems: Problem[] = [
    // Yesterday's lesson
    {
      id: "u1-p042",
      type: "symbolic-manipulation",
      prompt: "\\text{Factor: } x^2 - 9",
      correctAnswer: "(x-3)(x+3)",
      // ... other fields
    },
    // Last week
    {
      id: "u1-p023",
      type: "multiple-choice",
      prompt: "\\text{What is the domain of } f(x) = \\frac{1}{x-2}?",
      choices: [
        "(-\\infty, \\infty)",
        "(-\\infty, 2) \\cup (2, \\infty)",
        "[2, \\infty)",
        "(-\\infty, 2]"
      ],
      correctAnswer: "(-\\infty, 2) \\cup (2, \\infty)",
      // ... other fields
    },
    // Last month & Q4 problems...
  ];

  const handleComplete = (results) => {
    console.log('Warmup completed!');
    console.log(`Correct: ${results.filter(r => r.correct).length}/4`);
    console.log(`Time: ${results[0].timeSeconds}s`);

    // Navigate to progress page
    router.push('/progress');
  };

  return (
    <div className="container py-8">
      <DailyWarmup
        problems={warmupProblems}
        onComplete={handleComplete}
      />
    </div>
  );
}
```

### With API Integration

```tsx
'use client';

import { useEffect, useState } from 'react';
import { DailyWarmup } from '@/components/practice';
import { getWarmupProblems } from '@/lib/api/problems';

export default function WarmupPage() {
  const [problems, setProblems] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProblems() {
      try {
        const warmupSet = await getWarmupProblems();
        setProblems(warmupSet);
      } catch (error) {
        console.error('Failed to load warmup:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProblems();
  }, []);

  if (loading) return <div>Loading warmup...</div>;
  if (!problems) return <div>Failed to load problems</div>;

  return (
    <DailyWarmup
      problems={problems}
      onComplete={(results) => {
        // Send results to backend
        fetch('/api/warmup/complete', {
          method: 'POST',
          body: JSON.stringify({ results })
        });
      }}
    />
  );
}
```

## Q4 Symbolic Drill

### Basic Usage

```tsx
import { Q4SymbolicDrill } from '@/components/practice';

export default function Q4SprintPage() {
  // Generate or fetch 10 symbolic manipulation problems
  const sprintProblems = generateQ4Problems(10);

  // Calculate current week number
  const weekNumber = getCurrentWeek();

  return (
    <div className="container py-8">
      <Q4SymbolicDrill
        problems={sprintProblems}
        weekNumber={weekNumber}
        onComplete={(results) => {
          const correct = results.filter(r => r.correct).length;
          const avgTime = results.reduce((sum, r) => sum + r.timeSeconds, 0) / 10;

          console.log(`Sprint ${weekNumber} complete!`);
          console.log(`Score: ${correct}/10`);
          console.log(`Avg time: ${avgTime}s`);
        }}
      />
    </div>
  );
}
```

### With Progress Tracking

```tsx
'use client';

import { Q4SymbolicDrill } from '@/components/practice';
import { useProgressStore } from '@/stores/useProgressStore';
import { useRouter } from 'next/navigation';

export default function Q4Page() {
  const router = useRouter();
  const { progress } = useProgressStore();

  // Determine current week
  const startDate = new Date(progress.startDate);
  const now = new Date();
  const weekNumber = Math.floor((now - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1;

  // Get previous sprint data for comparison
  const previousSprint = progress.q4Sprints[progress.q4Sprints.length - 1];

  return (
    <div className="container py-8">
      {previousSprint && (
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold">Previous Sprint</h3>
          <p>Week {previousSprint.week}: {previousSprint.problemsSolved}/10
             ({Math.round(previousSprint.accuracy * 100)}%)</p>
        </div>
      )}

      <Q4SymbolicDrill
        problems={getQ4Problems(weekNumber)}
        weekNumber={weekNumber}
        onComplete={(results) => {
          // Progress is automatically saved by the component
          // Navigate to results page
          router.push('/practice/q4/results');
        }}
      />
    </div>
  );
}
```

## Unit Circle Practice

### Standalone Page

```tsx
import { UnitCirclePractice } from '@/components/practice';

export default function UnitCirclePage() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Unit Circle Practice</h1>
        <UnitCirclePractice />
      </div>
    </div>
  );
}
```

### Embedded in Lesson

```tsx
import { UnitCirclePractice } from '@/components/practice';

export default function TrigLesson() {
  return (
    <div className="lesson-content">
      <h1>Lesson 3.1: The Unit Circle</h1>

      <section>
        <h2>Theory</h2>
        <p>The unit circle is a circle with radius 1...</p>
      </section>

      <section>
        <h2>Interactive Practice</h2>
        <UnitCirclePractice />
      </section>

      <section>
        <h2>Next Steps</h2>
        <p>Now that you've mastered the unit circle...</p>
      </section>
    </div>
  );
}
```

## Transformation Practice

### Basic Usage

```tsx
import { TransformationPractice } from '@/components/practice';

export default function TransformationsPage() {
  return (
    <div className="container py-8">
      <TransformationPractice />
    </div>
  );
}
```

### With Preset Configuration

```tsx
import { TransformationPractice } from '@/components/practice';

export default function QuadraticTransformationsLesson() {
  // Could extend component to accept initial state
  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quadratic Transformations</h1>
        <p className="text-muted-foreground">
          Explore how a, h, and k affect parabolas
        </p>
      </div>

      <TransformationPractice />

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Practice Problems</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>Match the transformation f(x) = 2(x-3)² + 1 to its graph</li>
          <li>Write the equation for a parabola shifted right 4 and up 2</li>
          <li>Identify the vertex of f(x) = -(x+1)² - 3</li>
        </ol>
      </div>
    </div>
  );
}
```

## Problem Card

### Individual Problem Display

```tsx
import { ProblemCard } from '@/components/practice';

export default function SingleProblemPage({ problemId }) {
  const problem = getProblem(problemId);

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <ProblemCard
        problem={problem}
        onAnswer={(correct, timeSeconds) => {
          console.log(`Answer: ${correct ? 'Correct' : 'Incorrect'}`);
          console.log(`Time: ${timeSeconds}s`);

          // Save result
          saveAttempt(problemId, correct, timeSeconds);
        }}
        showTimer={true}
      />
    </div>
  );
}
```

### Multiple Choice Auto-Submit

```tsx
import { ProblemCard } from '@/components/practice';

export default function QuizQuestion({ problem, onNext }) {
  return (
    <ProblemCard
      problem={problem}
      onAnswer={(correct, timeSeconds) => {
        // Auto-advance after showing feedback
        setTimeout(() => {
          onNext(correct, timeSeconds);
        }, 2000);
      }}
      showTimer={true}
      autoSubmit={true} // Submit immediately on choice selection
    />
  );
}
```

### Problem Set

```tsx
'use client';

import { useState } from 'react';
import { ProblemCard } from '@/components/practice';
import { Button } from '@/components/ui/button';

export default function ProblemSet({ problems }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);

  const handleAnswer = (correct, timeSeconds) => {
    setResults([...results, { correct, timeSeconds }]);

    if (currentIndex < problems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Show results
      showResults(results);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Problem {currentIndex + 1} of {problems.length}
        </span>
        <span className="text-sm text-muted-foreground">
          Score: {results.filter(r => r.correct).length}/{results.length}
        </span>
      </div>

      <ProblemCard
        key={currentIndex}
        problem={problems[currentIndex]}
        onAnswer={handleAnswer}
        showTimer={true}
      />

      {currentIndex > 0 && (
        <Button
          variant="ghost"
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="mt-4"
        >
          Previous Problem
        </Button>
      )}
    </div>
  );
}
```

## Timer Utilities

### Formatting Time

```tsx
import { formatTime, formatTimeVerbose } from '@/lib/utils/timer';

function TimerDisplay({ seconds }) {
  return (
    <div>
      <div className="text-2xl font-mono">{formatTime(seconds)}</div>
      <div className="text-sm text-muted-foreground">
        {formatTimeVerbose(seconds)}
      </div>
    </div>
  );
}
```

### Color-Coded Timer

```tsx
import { formatTime, getTimeColor } from '@/lib/utils/timer';

function ColoredTimer({ elapsed, target }) {
  return (
    <div className={cn("font-mono text-lg", getTimeColor(elapsed, target))}>
      {formatTime(elapsed)} / {formatTime(target)}
    </div>
  );
}
```

### Progress Bar with Color

```tsx
import { Progress } from '@/components/ui/progress';
import { getProgressColor } from '@/lib/utils/timer';

function AccuracyDisplay({ correct, total }) {
  const accuracy = correct / total;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Accuracy</span>
        <span>{Math.round(accuracy * 100)}%</span>
      </div>
      <Progress
        value={accuracy * 100}
        className={getProgressColor(accuracy)}
      />
    </div>
  );
}
```

## Custom Problem Generation

### Q4 Problem Generator

```tsx
import type { Problem } from '@/types/problem';

function generateQ4Problem(difficulty: 'facile' | 'medio' | 'difficile'): Problem {
  const templates = {
    facile: [
      { prompt: "x^2 - 4", answer: "(x-2)(x+2)" },
      { prompt: "2x + 6", answer: "2(x+3)" },
    ],
    medio: [
      { prompt: "x^2 + 5x + 6", answer: "(x+2)(x+3)" },
      { prompt: "\\log_2(8) + \\log_2(4)", answer: "5" },
    ],
    difficile: [
      { prompt: "\\frac{x^3-8}{x-2}", answer: "x^2 + 2x + 4" },
      { prompt: "\\sin^2(x) + \\cos^2(x)", answer: "1" },
    ],
  };

  const template = templates[difficulty][
    Math.floor(Math.random() * templates[difficulty].length)
  ];

  return {
    id: `gen-${Date.now()}`,
    type: 'symbolic-manipulation',
    unit: 'unit-1-polynomial-rational',
    topic: 'symbolic-manipulation',
    prompt: `\\text{Simplify: } ${template.prompt}`,
    correctAnswer: template.answer,
    solutions: [],
    commonMistakes: [],
    prerequisites: [],
    goldenWords: [],
    difficulty,
    estimatedTimeSeconds: 90,
    apSection: 'mc-no-calc',
    calculatorRequired: false,
    isQ4Style: true,
    practiceCount: 0,
    successRate: 0,
    tags: ['symbolic', 'no-calc'],
    examFrequency: 'high',
  };
}

// Generate 10 problems for Q4 sprint
const problems = Array.from({ length: 10 }, () =>
  generateQ4Problem('medio')
);
```

## Error Handling

### Graceful Degradation

```tsx
'use client';

import { useState, useEffect } from 'react';
import { DailyWarmup } from '@/components/practice';

export default function WarmupPage() {
  const [problems, setProblems] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchWarmupProblems();
        setProblems(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Failed to load warmup
          </h2>
          <p className="text-muted-foreground mt-2">{error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return <DailyWarmup problems={problems} onComplete={handleComplete} />;
}
```

## Testing Examples

### Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProblemCard } from '@/components/practice';

describe('ProblemCard', () => {
  const mockProblem = {
    id: 'test-1',
    prompt: 'x + 2',
    correctAnswer: 'x + 2',
    type: 'symbolic-manipulation',
    // ... other required fields
  };

  it('renders problem prompt', () => {
    render(<ProblemCard problem={mockProblem} onAnswer={jest.fn()} />);
    expect(screen.getByText(/x \+ 2/)).toBeInTheDocument();
  });

  it('validates correct answer', async () => {
    const onAnswer = jest.fn();
    render(<ProblemCard problem={mockProblem} onAnswer={onAnswer} />);

    const input = screen.getByPlaceholderText(/enter your answer/i);
    fireEvent.change(input, { target: { value: 'x + 2' } });

    const submit = screen.getByText(/submit/i);
    fireEvent.click(submit);

    await screen.findByText(/correct/i);
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(Number));
  });
});
```

### Integration Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DailyWarmup } from '@/components/practice';

describe('DailyWarmup Integration', () => {
  const mockProblems = [/* 4 problems */];

  it('completes full warmup flow', async () => {
    const onComplete = jest.fn();
    render(<DailyWarmup problems={mockProblems} onComplete={onComplete} />);

    // Answer all 4 questions
    for (let i = 0; i < 4; i++) {
      const input = screen.getByPlaceholderText(/enter your answer/i);
      fireEvent.change(input, { target: { value: 'answer' } });

      const next = screen.getByText(i < 3 ? /next/i : /finish/i);
      fireEvent.click(next);
    }

    // Check completion
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(expect.any(Array));
    });
  });
});
```

These examples demonstrate real-world usage patterns for all practice components, from basic implementation to advanced integration scenarios.
