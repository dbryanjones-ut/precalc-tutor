"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MathRenderer } from "@/components/math/MathRenderer";
import { AnswerValidator } from "@/lib/math/answer-validator";
import type { Problem, Solution } from "@/types/problem";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  EyeOff,
  Clock
} from "lucide-react";

interface ProblemCardProps {
  problem: Problem;
  onAnswer: (correct: boolean, timeSeconds: number) => void;
  showTimer?: boolean;
  autoSubmit?: boolean;
  className?: string;
}

export function ProblemCard({
  problem,
  onAnswer,
  showTimer = true,
  autoSubmit = false,
  className,
}: ProblemCardProps) {
  const [answer, setAnswer] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime] = useState(Date.now());
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Timer
  useEffect(() => {
    if (isSubmitted) return;

    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isSubmitted]);

  // Auto-submit for multiple choice
  useEffect(() => {
    if (autoSubmit && selectedChoice !== null && !isSubmitted) {
      handleSubmit();
    }
  }, [selectedChoice, autoSubmit, isSubmitted]);

  const handleSubmit = () => {
    if (isSubmitted) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    let validation;

    if (problem.type === "multiple-choice" && problem.choices) {
      const correctIndex = problem.choices.findIndex(
        (choice) => choice === problem.correctAnswer
      );
      validation = AnswerValidator.validateMultipleChoice(
        selectedChoice || -1,
        correctIndex
      );
    } else {
      validation = AnswerValidator.validate(answer, problem.correctAnswer);
    }

    setIsCorrect(validation.isCorrect);
    setFeedback(validation.feedback);
    setIsSubmitted(true);
    onAnswer(validation.isCorrect, timeSpent);
  };

  const handleHintClick = () => {
    setShowHint(!showHint);
    if (!showHint) {
      setHintsUsed((prev) => prev + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitted) {
      handleSubmit();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={cn("relative", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex-1">
            <MathRenderer latex={problem.prompt} displayMode={false} />
          </CardTitle>
          {showTimer && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeElapsed)}</span>
            </div>
          )}
        </div>
        {problem.imageUrl && (
          <img
            src={problem.imageUrl}
            alt="Problem diagram"
            className="mt-4 rounded-lg max-w-full"
          />
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Answer Input */}
        {problem.type === "multiple-choice" && problem.choices ? (
          <div className="space-y-2">
            {problem.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => !isSubmitted && setSelectedChoice(index)}
                disabled={isSubmitted}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  "hover:border-primary hover:bg-accent",
                  selectedChoice === index &&
                    "border-primary bg-accent",
                  isSubmitted &&
                    selectedChoice === index &&
                    isCorrect &&
                    "border-green-500 bg-green-50 dark:bg-green-950",
                  isSubmitted &&
                    selectedChoice === index &&
                    !isCorrect &&
                    "border-red-500 bg-red-50 dark:bg-red-950",
                  isSubmitted && "cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-muted-foreground">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <MathRenderer latex={choice} displayMode={false} />
                  {isSubmitted && selectedChoice === index && (
                    <div className="ml-auto">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSubmitted}
              className={cn(
                "font-mono text-lg",
                isSubmitted &&
                  isCorrect &&
                  "border-green-500 bg-green-50 dark:bg-green-950",
                isSubmitted &&
                  !isCorrect &&
                  "border-red-500 bg-red-50 dark:bg-red-950"
              )}
            />
            {!isSubmitted && (
              <Button
                onClick={handleSubmit}
                disabled={answer.trim() === ""}
                className="w-full"
              >
                Submit Answer
              </Button>
            )}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div
            className={cn(
              "p-4 rounded-lg border-2",
              isCorrect
                ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100"
                : "border-red-500 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100"
            )}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-semibold">
                  {isCorrect ? "Correct!" : "Not quite right"}
                </p>
                <p className="text-sm mt-1">{feedback}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hint System */}
        {!isSubmitted && problem.solutions.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleHintClick}
              className="w-full"
            >
              <Lightbulb className="h-4 w-4" />
              {showHint ? "Hide Hint" : `Show Hint (${hintsUsed} used)`}
            </Button>

            {showHint && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Hint:</strong> {problem.solutions[0].whenToUse}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Solution Display */}
        {isSubmitted && problem.solutions.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSolution(!showSolution)}
              className="w-full"
            >
              {showSolution ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Solution
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  View Solution
                </>
              )}
            </Button>

            {showSolution && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold">
                  Solution: {problem.solutions[0].strategy}
                </h4>
                <div className="space-y-4">
                  {problem.solutions[0].steps.map((step) => (
                    <div key={step.stepNumber} className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Step {step.stepNumber}
                      </p>
                      <MathRenderer
                        latex={step.latex}
                        displayMode={true}
                        className="my-2"
                      />
                      <p className="text-sm">{step.explanation}</p>
                      {step.goldenWord && (
                        <p className="text-sm italic text-primary">
                          Key term: <strong>{step.goldenWord}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Common Mistakes */}
        {isSubmitted && !isCorrect && problem.commonMistakes.length > 0 && (
          <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
              Common Mistake
            </h4>
            <div className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
              <div>
                <strong>Incorrect:</strong>{" "}
                <MathRenderer
                  latex={problem.commonMistakes[0].mistake}
                  displayMode={false}
                />
              </div>
              <div>
                <strong>Correct:</strong>{" "}
                <MathRenderer
                  latex={problem.commonMistakes[0].correct}
                  displayMode={false}
                />
              </div>
              <p>{problem.commonMistakes[0].why}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
