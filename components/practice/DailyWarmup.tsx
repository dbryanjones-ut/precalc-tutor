"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MathRenderer } from "@/components/math/MathRenderer";
import { AnswerValidator } from "@/lib/math/answer-validator";
import { useProgressStore } from "@/stores/useProgressStore";
import type { Problem } from "@/types/problem";
import { cn } from "@/lib/utils";
import { formatTime, getTimeColor } from "@/lib/utils/timer";
import {
  Coffee,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Trophy,
  Calendar,
  Target,
} from "lucide-react";

interface DailyWarmupProps {
  problems: Problem[]; // Should be exactly 4 problems
  onComplete: (results: WarmupResult[]) => void;
}

interface WarmupResult {
  problemId: string;
  correct: boolean;
  timeSeconds: number;
}

const WARMUP_TIME_LIMIT = 480; // 8 minutes
const PROBLEM_CATEGORIES = [
  "Yesterday's Lesson",
  "Last Week",
  "Last Month",
  "Q4 Symbolic (No Calc)",
];

export function DailyWarmup({ problems, onComplete }: DailyWarmupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [results, setResults] = useState<WarmupResult[]>([]);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);

  const { progress, addWarmup, updateStreak } = useProgressStore();

  const currentProblem = problems[currentIndex];
  const progressPercent = ((currentIndex + 1) / 4) * 100;

  // Timer
  useEffect(() => {
    if (isComplete) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(elapsed);

      // Auto-submit if time runs out
      if (elapsed >= WARMUP_TIME_LIMIT) {
        handleFinish();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isComplete]);

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < 3) {
      setCurrentIndex(currentIndex + 1);
      setFeedback(null);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFeedback(null);
    }
  };

  const handleFinish = () => {
    // Grade all answers
    const gradedResults: WarmupResult[] = problems.map((problem, index) => {
      const validation = AnswerValidator.validate(
        answers[index] || "",
        problem.correctAnswer
      );

      return {
        problemId: problem.id,
        correct: validation.isCorrect,
        timeSeconds: Math.floor((Date.now() - startTime) / 1000),
      };
    });

    setResults(gradedResults);
    setIsComplete(true);

    // Save to progress store
    const problemIds = problems.map((p) => p.id);
    const scores = gradedResults.map((r) => r.correct);
    addWarmup(problemIds, scores, timeElapsed);
    updateStreak();

    onComplete(gradedResults);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (currentIndex < 3) {
        handleNext();
      } else {
        handleFinish();
      }
    }
  };

  // Calculate streak from progress
  const todayDate = new Date().toISOString().split("T")[0];
  const completedToday = progress.warmups.some(
    (w) => w.date.split("T")[0] === todayDate && w.completed
  );

  if (isComplete) {
    const correctCount = results.filter((r) => r.correct).length;
    const accuracy = (correctCount / 4) * 100;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Coffee className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-3xl">Warm-up Complete!</CardTitle>
          <CardDescription>
            Great way to start your practice session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{correctCount}/4</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{formatTime(timeElapsed)}</div>
              <div className="text-sm text-muted-foreground">Time</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{progress.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>

          {/* Problem Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Problem Breakdown
            </h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-lg border-2",
                  result.correct
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-red-500 bg-red-50 dark:bg-red-950"
                )}
              >
                <div className="flex items-start gap-3">
                  {result.correct ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        Q{index + 1}: {PROBLEM_CATEGORIES[index]}
                      </span>
                      {result.correct ? (
                        <span className="text-sm text-green-700 dark:text-green-300">
                          Correct
                        </span>
                      ) : (
                        <span className="text-sm text-red-700 dark:text-red-300">
                          Incorrect
                        </span>
                      )}
                    </div>
                    <div className="text-sm">
                      <MathRenderer
                        latex={problems[index].prompt}
                        displayMode={false}
                      />
                    </div>
                    {!result.correct && (
                      <div className="mt-2 text-sm">
                        <div>
                          Your answer:{" "}
                          <span className="font-mono">{answers[index] || "(empty)"}</span>
                        </div>
                        <div>
                          Correct answer:{" "}
                          <MathRenderer
                            latex={
                              Array.isArray(problems[index].correctAnswer)
                                ? problems[index].correctAnswer[0]
                                : problems[index].correctAnswer
                            }
                            displayMode={false}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feedback Message */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <h4 className="font-semibold mb-2">Daily Feedback</h4>
            {accuracy === 100 ? (
              <p className="text-sm">
                Perfect score! You're demonstrating excellent retention across all time
                ranges. This spaced repetition strategy is working!
              </p>
            ) : accuracy >= 75 ? (
              <p className="text-sm">
                Strong work! You're retaining concepts well. Review the problems you
                missed to maintain your edge.
              </p>
            ) : accuracy >= 50 ? (
              <p className="text-sm">
                Good effort! Some topics need reinforcement. Consider reviewing the
                categories you struggled with today.
              </p>
            ) : (
              <p className="text-sm">
                These warm-ups are challenging, but they're helping identify areas to
                focus on. Revisit the relevant lessons and keep practicing!
              </p>
            )}
          </div>

          {/* Streak Celebration */}
          {progress.currentStreak >= 3 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Flame className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-semibold text-orange-900 dark:text-orange-100">
                    {progress.currentStreak} Day Streak!
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Keep it going! Consistency is the key to mastery.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Ensure we have exactly 4 problems
  if (problems.length !== 4) {
    console.error("DailyWarmup requires exactly 4 problems");
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-red-600">Error: Daily Warmup requires exactly 4 problems</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Coffee className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="font-semibold">Daily Warm-up</h2>
                <p className="text-sm text-muted-foreground">
                  {PROBLEM_CATEGORIES[currentIndex]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span
                  className={cn(
                    "font-mono font-semibold",
                    getTimeColor(timeElapsed, WARMUP_TIME_LIMIT)
                  )}
                >
                  {formatTime(timeElapsed)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                / {formatTime(WARMUP_TIME_LIMIT)}
              </div>
            </div>
          </div>
          <Progress value={(timeElapsed / WARMUP_TIME_LIMIT) * 100} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Problem */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Question {currentIndex + 1} of 4
            </CardTitle>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 w-8 rounded-full transition-colors",
                    index < currentIndex
                      ? "bg-green-500"
                      : index === currentIndex
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <CardDescription>{PROBLEM_CATEGORIES[currentIndex]}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Problem Prompt */}
          <div className="p-6 bg-muted/50 rounded-lg">
            <MathRenderer
              latex={currentProblem.prompt}
              displayMode={false}
              className="text-lg"
            />
          </div>

          {/* Answer Input */}
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your answer..."
              value={answers[currentIndex]}
              onChange={(e) => handleAnswerChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="font-mono text-lg"
              autoFocus
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
            >
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              {answers.filter((a) => a.trim() !== "").length}/4 answered
            </div>

            {currentIndex < 3 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleFinish} variant="default">
                <Trophy className="h-4 w-4" />
                Finish Warm-up
              </Button>
            )}
          </div>

          {/* Category Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              About This Category
            </p>
            <p className="text-blue-800 dark:text-blue-200">
              {currentIndex === 0 &&
                "Reviews yesterday's lesson to strengthen recent learning."}
              {currentIndex === 1 &&
                "Reinforces concepts from last week using spaced repetition."}
              {currentIndex === 2 &&
                "Tests long-term retention of material from last month."}
              {currentIndex === 3 &&
                "Practices symbolic manipulation without calculator - essential for Q4 on the AP exam."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Streak Display */}
      {progress.currentStreak > 0 && (
        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="h-6 w-6 text-orange-500" />
                <div>
                  <p className="font-semibold text-orange-900 dark:text-orange-100">
                    {progress.currentStreak} Day Streak
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Keep it up!
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Best: {progress.longestStreak} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
