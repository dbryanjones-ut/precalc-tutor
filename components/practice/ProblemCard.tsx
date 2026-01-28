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
          <CardTitle className="flex-1" asChild>
            <h3>
              <MathRenderer latex={problem.prompt} displayMode={false} />
            </h3>
          </CardTitle>
          {showTimer && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="timer" aria-live="off">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <time className="font-mono" aria-label={`Time elapsed: ${formatTime(timeElapsed)}`}>
                {formatTime(timeElapsed)}
              </time>
            </div>
          )}
        </div>
        {problem.imageUrl && (
          <img
            src={problem.imageUrl}
            alt={`Diagram for problem: ${problem.prompt.substring(0, 50)}...`}
            className="mt-4 rounded-lg max-w-full"
          />
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Answer Input */}
        {problem.type === "multiple-choice" && problem.choices ? (
          <fieldset className="space-y-2">
            <legend className="sr-only">Select your answer</legend>
            {problem.choices.map((choice, index) => {
              const choiceLabel = String.fromCharCode(65 + index);
              const isSelected = selectedChoice === index;
              const showResult = isSubmitted && isSelected;

              return (
                <button
                  key={index}
                  onClick={() => !isSubmitted && setSelectedChoice(index)}
                  disabled={isSubmitted}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Option ${choiceLabel}`}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 text-left transition-all min-h-[60px]",
                    "hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected && "border-primary bg-accent",
                    showResult && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                    showResult && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950",
                    isSubmitted && "cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-muted-foreground min-w-[24px]" aria-hidden="true">
                      {choiceLabel}.
                    </span>
                    <MathRenderer latex={choice} displayMode={false} />
                    {showResult && (
                      <div className="ml-auto" aria-label={isCorrect ? "Correct answer" : "Incorrect answer"}>
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </fieldset>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-2"
          >
            <div className="space-y-2">
              <label htmlFor="answer-input" className="sr-only">
                Enter your answer
              </label>
              <Input
                id="answer-input"
                type="text"
                placeholder="Enter your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSubmitted}
                aria-invalid={isSubmitted && !isCorrect}
                aria-describedby={feedback ? "answer-feedback" : undefined}
                className={cn(
                  "font-mono text-lg min-h-[48px]",
                  isSubmitted && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                  isSubmitted && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950"
                )}
              />
            </div>
            {!isSubmitted && (
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={answer.trim() === ""}
                className="w-full min-h-[44px]"
              >
                Submit Answer
              </Button>
            )}
          </form>
        )}

        {/* Feedback */}
        {feedback && (
          <div
            id="answer-feedback"
            role="alert"
            aria-live="polite"
            className={cn(
              "p-4 rounded-lg border-2",
              isCorrect
                ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100"
                : "border-red-500 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100"
            )}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
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
              className="w-full min-h-[44px]"
              aria-expanded={showHint}
              aria-label={showHint ? "Hide hint" : `Show hint, ${hintsUsed} hints used so far`}
            >
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
              {showHint ? "Hide Hint" : `Show Hint (${hintsUsed} used)`}
            </Button>

            {showHint && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800" role="region" aria-label="Hint">
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
              className="w-full min-h-[44px]"
              aria-expanded={showSolution}
              aria-label={showSolution ? "Hide solution" : "View solution"}
            >
              {showSolution ? (
                <>
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                  Hide Solution
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  View Solution
                </>
              )}
            </Button>

            {showSolution && (
              <div className="space-y-3 p-4 bg-muted rounded-lg" role="region" aria-label="Solution steps">
                <h4 className="font-semibold text-base">
                  Solution: {problem.solutions[0].strategy}
                </h4>
                <ol className="space-y-4 list-none">
                  {problem.solutions[0].steps.map((step) => (
                    <li key={step.stepNumber} className="space-y-1">
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
                    </li>
                  ))}
                </ol>
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
