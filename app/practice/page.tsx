"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProgressStore } from "@/stores/useProgressStore";
import { DailyWarmup } from "@/components/practice/DailyWarmup";
import { Q4SymbolicDrill } from "@/components/practice/Q4SymbolicDrill";
import { UnitCirclePractice } from "@/components/practice/UnitCirclePractice";
import { TransformationPractice } from "@/components/practice/TransformationPractice";
import { ProblemCard } from "@/components/practice/ProblemCard";
import type { Problem } from "@/types/problem";
import { cn } from "@/lib/utils";
import {
  Coffee,
  Zap,
  Circle,
  TrendingUp,
  Target,
  Calendar,
  Trophy,
  BookOpen,
  Flame,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

// Mock problems - In production, these would come from a database or API
const MOCK_WARMUP_PROBLEMS: Problem[] = [
  {
    id: "warmup-1",
    type: "symbolic-manipulation",
    unit: "unit-1-polynomial-rational",
    topic: "polynomial-division",
    prompt: "\\text{Simplify: } \\frac{x^2 - 4}{x + 2}",
    correctAnswer: "x - 2",
    solutions: [],
    commonMistakes: [],
    prerequisites: [],
    goldenWords: [],
    difficulty: "medio",
    estimatedTimeSeconds: 120,
    apSection: "mc-no-calc",
    calculatorRequired: false,
    isQ4Style: true,
    practiceCount: 0,
    successRate: 0,
    tags: [],
    examFrequency: "high",
  },
  {
    id: "warmup-2",
    type: "symbolic-manipulation",
    unit: "unit-2-exponential-logarithmic",
    topic: "log-properties",
    prompt: "\\text{Simplify: } \\log_2(8) + \\log_2(4)",
    correctAnswer: "5",
    solutions: [],
    commonMistakes: [],
    prerequisites: [],
    goldenWords: [],
    difficulty: "medio",
    estimatedTimeSeconds: 120,
    apSection: "mc-no-calc",
    calculatorRequired: false,
    isQ4Style: true,
    practiceCount: 0,
    successRate: 0,
    tags: [],
    examFrequency: "high",
  },
  {
    id: "warmup-3",
    type: "symbolic-manipulation",
    unit: "unit-3-trigonometric-polar",
    topic: "trig-identities",
    prompt: "\\text{Simplify: } \\sin^2(x) + \\cos^2(x)",
    correctAnswer: "1",
    solutions: [],
    commonMistakes: [],
    prerequisites: [],
    goldenWords: [],
    difficulty: "facile",
    estimatedTimeSeconds: 60,
    apSection: "mc-no-calc",
    calculatorRequired: false,
    isQ4Style: true,
    practiceCount: 0,
    successRate: 0,
    tags: [],
    examFrequency: "high",
  },
  {
    id: "warmup-4",
    type: "symbolic-manipulation",
    unit: "unit-1-polynomial-rational",
    topic: "factoring",
    prompt: "\\text{Factor: } x^2 + 5x + 6",
    correctAnswer: "(x + 2)(x + 3)",
    solutions: [],
    commonMistakes: [],
    prerequisites: [],
    goldenWords: [],
    difficulty: "medio",
    estimatedTimeSeconds: 90,
    apSection: "mc-no-calc",
    calculatorRequired: false,
    isQ4Style: true,
    practiceCount: 0,
    successRate: 0,
    tags: [],
    examFrequency: "high",
  },
];

const MOCK_Q4_PROBLEMS: Problem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `q4-${i + 1}`,
  type: "symbolic-manipulation",
  unit: "unit-1-polynomial-rational",
  topic: "symbolic-manipulation",
  prompt: `\\text{Simplify: } \\frac{x^${i + 2} - ${i + 1}}{x - 1}`,
  correctAnswer: `x^${i + 1} + ${i}`,
  solutions: [],
  commonMistakes: [],
  prerequisites: [],
  goldenWords: [],
  difficulty: "medio",
  estimatedTimeSeconds: 90,
  apSection: "mc-no-calc",
  calculatorRequired: false,
  isQ4Style: true,
  practiceCount: 0,
  successRate: 0,
  tags: [],
  examFrequency: "high",
}));

export default function PracticePage() {
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const { progress } = useProgressStore();

  // Check if warmup completed today
  const todayDate = new Date().toISOString().split("T")[0];
  const warmupCompletedToday = progress.warmups.some(
    (w) => w.date.split("T")[0] === todayDate && w.completed
  );

  // Get latest Q4 sprint
  const latestQ4Sprint = progress.q4Sprints[progress.q4Sprints.length - 1];
  const thisWeek = Math.floor((Date.now() - new Date(progress.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  // Calculate overall stats
  const totalAttempted = progress.totalProblemsAttempted;
  const totalCorrect = progress.totalProblemsCorrect;
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  if (activeMode === "warmup") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setActiveMode(null)}>
            ← Back to Practice Modes
          </Button>
        </div>
        <DailyWarmup
          problems={MOCK_WARMUP_PROBLEMS}
          onComplete={(results) => {
            console.log("Warmup complete:", results);
            setTimeout(() => setActiveMode(null), 3000);
          }}
        />
      </div>
    );
  }

  if (activeMode === "q4-sprint") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setActiveMode(null)}>
            ← Back to Practice Modes
          </Button>
        </div>
        <Q4SymbolicDrill
          problems={MOCK_Q4_PROBLEMS}
          weekNumber={thisWeek}
          onComplete={(results) => {
            console.log("Q4 Sprint complete:", results);
            setTimeout(() => setActiveMode(null), 5000);
          }}
        />
      </div>
    );
  }

  if (activeMode === "unit-circle") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setActiveMode(null)}>
            ← Back to Practice Modes
          </Button>
        </div>
        <UnitCirclePractice />
      </div>
    );
  }

  if (activeMode === "transformations") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setActiveMode(null)}>
            ← Back to Practice Modes
          </Button>
        </div>
        <TransformationPractice />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Practice</h1>
        <p className="text-muted-foreground text-lg">
          Build mastery through consistent, focused practice
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold">{progress.currentStreak}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Problems Solved</p>
                <p className="text-3xl font-bold">{totalCorrect}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-3xl font-bold">{accuracy}%</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Attempts</p>
                <p className="text-3xl font-bold">{totalAttempted}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practice Modes */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Daily Routines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Warmup */}
            <Card className={cn(
              "hover:border-primary transition-colors cursor-pointer",
              warmupCompletedToday && "bg-green-50 dark:bg-green-950 border-green-500"
            )}
              onClick={() => !warmupCompletedToday && setActiveMode("warmup")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Coffee className="h-8 w-8 text-orange-500" />
                  {warmupCompletedToday && (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <CardTitle>Daily Warm-up</CardTitle>
                <CardDescription>
                  4 questions • 8 minutes • Spaced repetition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Start your day right with problems from yesterday, last week, last
                  month, and symbolic manipulation.
                </p>
                {warmupCompletedToday ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Completed today!</span>
                  </div>
                ) : (
                  <Button className="w-full">
                    <Coffee className="h-4 w-4" />
                    Start Warm-up
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Q4 Sprint */}
            <Card className="hover:border-primary transition-colors cursor-pointer"
              onClick={() => setActiveMode("q4-sprint")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Zap className="h-8 w-8 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Week {thisWeek}</span>
                </div>
                <CardTitle>Q4 Symbolic Sprint</CardTitle>
                <CardDescription>
                  10 problems • 15 minutes • No calculator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Master symbolic manipulation for AP Exam Question 4. Weekly practice
                  builds speed and accuracy.
                </p>
                {latestQ4Sprint ? (
                  <div className="mb-4 text-sm">
                    <div className="flex justify-between">
                      <span>Last sprint:</span>
                      <span className="font-semibold">
                        {latestQ4Sprint.problemsSolved}/{latestQ4Sprint.totalProblems} correct
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span className="font-semibold">
                        {Math.round(latestQ4Sprint.accuracy * 100)}%
                      </span>
                    </div>
                  </div>
                ) : null}
                <Button className="w-full" variant="default">
                  <Zap className="h-4 w-4" />
                  Start Sprint
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Focused Practice</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Unit Circle */}
            <Card className="hover:border-primary transition-colors cursor-pointer"
              onClick={() => setActiveMode("unit-circle")}
            >
              <CardHeader>
                <Circle className="h-8 w-8 text-blue-500" />
                <CardTitle>Unit Circle Mastery</CardTitle>
                <CardDescription>
                  Interactive explorer • Click-to-reveal • Quiz mode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Master all 16 special angles with color-coded families (π/6, π/4,
                  π/3). Essential for trig unit.
                </p>
                <Button className="w-full" variant="outline">
                  <Circle className="h-4 w-4" />
                  Practice Unit Circle
                </Button>
              </CardContent>
            </Card>

            {/* Transformations */}
            <Card className="hover:border-primary transition-colors cursor-pointer"
              onClick={() => setActiveMode("transformations")}
            >
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-green-500" />
                <CardTitle>Function Transformations</CardTitle>
                <CardDescription>
                  Interactive sliders • Input vs Output • All families
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Visualize how a, h, and k transform parent functions. Understand
                  input vs output geography.
                </p>
                <Button className="w-full" variant="outline">
                  <TrendingUp className="h-4 w-4" />
                  Explore Transformations
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="opacity-60">
              <CardHeader>
                <Target className="h-8 w-8 text-muted-foreground" />
                <CardTitle>Topic Drills</CardTitle>
                <CardDescription>Targeted practice by topic</CardDescription>
              </CardHeader>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <Calendar className="h-8 w-8 text-muted-foreground" />
                <CardTitle>Mock Exams</CardTitle>
                <CardDescription>Full AP-style practice tests</CardDescription>
              </CardHeader>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <Trophy className="h-8 w-8 text-muted-foreground" />
                <CardTitle>Challenge Mode</CardTitle>
                <CardDescription>Compete with yourself</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Tips Section */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Flame className="h-5 w-5" />
              Practice Tips for AP Success
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Consistency over cramming:</strong> Do the daily warm-up every day
                to maintain your streak and build retention.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Q4 is free points:</strong> Master symbolic manipulation through
                weekly sprints - this question requires no calculator and tests basic
                skills.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Unit circle fluency:</strong> Being instant with special angles
                saves time on the entire trig section of the exam.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Transformations everywhere:</strong> These appear across all
                units - understanding input vs output is crucial.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
