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
import {
  formatTime,
  formatTimeVerbose,
  getTimeColor,
  calculateAverageTime,
  calculateAccuracy,
} from "@/lib/utils/timer";
import {
  Trophy,
  Zap,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Flame,
} from "lucide-react";

interface Q4Result {
  problemId: string;
  correct: boolean;
  timeSeconds: number;
}

interface Q4SymbolicDrillProps {
  problems: Problem[];
  weekNumber: number;
  onComplete: (results: Q4Result[]) => void;
}

const TOTAL_PROBLEMS = 10;
const TARGET_TIME_PER_PROBLEM = 90; // 90 seconds per problem
const TOTAL_TARGET_TIME = TOTAL_PROBLEMS * TARGET_TIME_PER_PROBLEM; // 15 minutes

export function Q4SymbolicDrill({
  problems,
  weekNumber,
  onComplete,
}: Q4SymbolicDrillProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<Q4Result[]>([]);
  const [problemStartTime, setProblemStartTime] = useState(Date.now());
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const { addQ4Sprint } = useProgressStore();

  const currentProblem = problems[currentIndex];
  const progress = ((currentIndex + 1) / TOTAL_PROBLEMS) * 100;

  // Timer
  useEffect(() => {
    if (isComplete) return;

    const interval = setInterval(() => {
      setTotalElapsed(Math.floor((Date.now() - problemStartTime +
        results.reduce((sum, r) => sum + r.timeSeconds * 1000, 0)) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [problemStartTime, results, isComplete]);

  const handleSubmit = () => {
    if (!currentProblem || answer.trim() === "") return;

    const timeSpent = Math.floor((Date.now() - problemStartTime) / 1000);
    const validation = AnswerValidator.validate(
      answer,
      currentProblem.correctAnswer,
      { requireSimplified: true }
    );

    const result: Q4Result = {
      problemId: currentProblem.id,
      correct: validation.isCorrect,
      timeSeconds: timeSpent,
    };

    const newResults = [...results, result];
    setResults(newResults);

    // Update streak
    if (validation.isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(Math.max(bestStreak, newStreak));
    } else {
      setStreak(0);
    }

    setFeedback({
      isCorrect: validation.isCorrect,
      message: validation.feedback,
    });

    // Auto-advance after a short delay or move to completion
    setTimeout(() => {
      if (currentIndex < TOTAL_PROBLEMS - 1) {
        setCurrentIndex((prev) => prev + 1);
        setAnswer("");
        setFeedback(null);
        setProblemStartTime(Date.now());
      } else {
        finishDrill(newResults);
      }
    }, 1500);
  };

  const finishDrill = (finalResults: Q4Result[]) => {
    const correctCount = finalResults.filter((r) => r.correct).length;
    const accuracy = calculateAccuracy(correctCount, TOTAL_PROBLEMS);
    const avgTime = calculateAverageTime(finalResults.map((r) => r.timeSeconds));

    // Save to progress store
    addQ4Sprint(correctCount, TOTAL_PROBLEMS, avgTime, accuracy);

    setIsComplete(true);
    onComplete(finalResults);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !feedback) {
      handleSubmit();
    }
  };

  if (isComplete) {
    const correctCount = results.filter((r) => r.correct).length;
    const accuracy = calculateAccuracy(correctCount, TOTAL_PROBLEMS);
    const avgTime = calculateAverageTime(results.map((r) => r.timeSeconds));
    const totalTime = results.reduce((sum, r) => sum + r.timeSeconds, 0);

    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-3xl">Sprint Complete!</CardTitle>
          <CardDescription>Week {weekNumber} Q4 Symbolic Manipulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">
                {correctCount}/{TOTAL_PROBLEMS}
              </div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">
                {Math.round(accuracy * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{formatTimeVerbose(avgTime)}</div>
              <div className="text-sm text-muted-foreground">Avg Time</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{bestStreak}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </div>
          </div>

          {/* Performance Analysis */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Breakdown
            </h3>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted"
                >
                  <span className="font-mono text-sm text-muted-foreground w-8">
                    #{index + 1}
                  </span>
                  {result.correct ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <div className="flex-1">
                    <Progress
                      value={(result.timeSeconds / TARGET_TIME_PER_PROBLEM) * 100}
                      className="h-2"
                    />
                  </div>
                  <span
                    className={cn(
                      "font-mono text-sm",
                      getTimeColor(result.timeSeconds, TARGET_TIME_PER_PROBLEM)
                    )}
                  >
                    {formatTimeVerbose(result.timeSeconds)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <h4 className="font-semibold mb-2">Coach's Feedback</h4>
            {accuracy >= 0.9 ? (
              <p className="text-sm">
                Outstanding work! You're crushing the symbolic manipulation. Keep
                this momentum going for exam day.
              </p>
            ) : accuracy >= 0.7 ? (
              <p className="text-sm">
                Solid performance! Focus on the problems you missed and practice
                those specific techniques more this week.
              </p>
            ) : (
              <p className="text-sm">
                This is challenging material, but you're making progress. Review the
                solution strategies and try again tomorrow. Consistency is key!
              </p>
            )}
          </div>

          {/* Time Comparison */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Time</span>
              <span
                className={cn(
                  "font-mono font-semibold",
                  getTimeColor(totalTime, TOTAL_TARGET_TIME)
                )}
              >
                {formatTimeVerbose(totalTime)}
              </span>
            </div>
            <Progress
              value={(totalTime / TOTAL_TARGET_TIME) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Target: {formatTimeVerbose(TOTAL_TARGET_TIME)} (
              {formatTimeVerbose(TARGET_TIME_PER_PROBLEM)} per problem)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header Stats */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold">
                  Problem {currentIndex + 1}/{TOTAL_PROBLEMS}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className={cn("font-mono", getTimeColor(totalElapsed, TOTAL_TARGET_TIME))}>
                  {formatTime(totalElapsed)}
                </span>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold text-orange-600">
                    {streak} streak
                  </span>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Week {weekNumber}
            </div>
          </div>
          <Progress value={progress} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Problem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            <MathRenderer latex={currentProblem.prompt} displayMode={false} />
          </CardTitle>
          <CardDescription>
            No calculator - Simplify completely
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your simplified answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!!feedback}
              className="font-mono text-lg"
              autoFocus
            />
            {!feedback && (
              <Button
                onClick={handleSubmit}
                disabled={answer.trim() === ""}
                className="w-full"
                size="lg"
              >
                <Zap className="h-4 w-4" />
                Submit Answer
              </Button>
            )}
          </div>

          {feedback && (
            <div
              className={cn(
                "p-4 rounded-lg border-2 animate-in fade-in slide-in-from-bottom-2",
                feedback.isCorrect
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : "border-red-500 bg-red-50 dark:bg-red-950"
              )}
            >
              <div className="flex items-start gap-3">
                {feedback.isCorrect ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    {feedback.isCorrect ? "Correct!" : "Not quite"}
                  </p>
                  <p className="text-sm mt-1">{feedback.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tips for Q4 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Q4 Quick Tips
            </p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-xs">
              <li>• Look for patterns (difference of squares, perfect squares)</li>
              <li>• Combine like terms carefully</li>
              <li>• Remember trig identities and log properties</li>
              <li>• Simplify radicals completely</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Score Tracker */}
      {results.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Progress:</span>
              <div className="flex gap-1">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                      result.correct
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    )}
                  >
                    {index + 1}
                  </div>
                ))}
                {Array.from({ length: TOTAL_PROBLEMS - results.length }).map(
                  (_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="h-6 w-6 rounded-full bg-muted"
                    />
                  )
                )}
              </div>
              <span className="ml-auto text-sm text-muted-foreground">
                {results.filter((r) => r.correct).length} correct
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
