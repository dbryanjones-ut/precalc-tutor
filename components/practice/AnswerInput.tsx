"use client";

import { useState, useCallback, useMemo } from "react";
import { AnswerValidator } from "@/lib/math/answer-validator";
import { LatexValidator } from "@/lib/math/latex-validator";
import { MathRenderer } from "@/components/math/MathRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnswerInputProps {
  // Question data
  questionId: string;
  correctAnswer: string | string[];

  // Validation options
  validationOptions?: {
    tolerance?: number;
    allowPartialCredit?: boolean;
    requireSimplified?: boolean;
  };

  // Callbacks
  onAnswerSubmit?: (answer: string, isCorrect: boolean, confidence: number) => void;
  onValidationComplete?: (result: any) => void;

  // UI options
  placeholder?: string;
  label?: string;
  showHints?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * AnswerInput Component
 *
 * Secure, validated math answer input with real-time feedback
 *
 * Features:
 * - LaTeX validation to prevent XSS
 * - Mathematical answer validation
 * - Real-time feedback with visual indicators
 * - Partial credit support
 * - Accessibility compliant
 */
export function AnswerInput({
  questionId,
  correctAnswer,
  validationOptions = {},
  onAnswerSubmit,
  onValidationComplete,
  placeholder = "Enter your answer (e.g., 2x + 3 or \\frac{1}{2})",
  label = "Your Answer",
  showHints = true,
  disabled = false,
  className,
}: AnswerInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [latexPreview, setLatexPreview] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Validate LaTeX as user types (for preview)
  const latexValidation = useMemo(() => {
    if (!inputValue.trim()) return null;
    return LatexValidator.validate(inputValue);
  }, [inputValue]);

  // Update preview when input changes
  useMemo(() => {
    if (latexValidation?.valid) {
      setLatexPreview(latexValidation.sanitized || inputValue);
    } else {
      setLatexPreview("");
    }
  }, [latexValidation, inputValue]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Reset validation state when user changes answer after submission
    if (submitted) {
      setValidationResult(null);
      setSubmitted(false);
    }
  }, [submitted]);

  // Validate answer
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!inputValue.trim() || disabled) return;

    setIsValidating(true);
    setSubmitted(true);

    try {
      // First validate LaTeX for security
      const latexCheck = LatexValidator.validate(inputValue);

      if (!latexCheck.valid) {
        const errorResult = {
          isCorrect: false,
          confidence: 0,
          feedback: `Invalid input: ${latexCheck.errors[0]}`,
          method: "failed",
        };

        setValidationResult(errorResult);
        onValidationComplete?.(errorResult);
        onAnswerSubmit?.(inputValue, false, 0);
        return;
      }

      // Then validate mathematical correctness
      const sanitizedInput = latexCheck.sanitized || inputValue;
      const result = AnswerValidator.validate(
        sanitizedInput,
        correctAnswer,
        validationOptions
      );

      setValidationResult(result);
      onValidationComplete?.(result);
      onAnswerSubmit?.(sanitizedInput, result.isCorrect, result.confidence);

    } catch (error) {
      console.error("Answer validation error:", error);
      const errorResult = {
        isCorrect: false,
        confidence: 0,
        feedback: "An error occurred while validating your answer",
        method: "failed",
      };

      setValidationResult(errorResult);
      onValidationComplete?.(errorResult);
      onAnswerSubmit?.(inputValue, false, 0);
    } finally {
      setIsValidating(false);
    }
  }, [inputValue, correctAnswer, validationOptions, disabled, onAnswerSubmit, onValidationComplete]);

  // Get feedback color and icon
  const getFeedbackStyle = () => {
    if (!validationResult || !submitted) return null;

    if (validationResult.isCorrect) {
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        color: "text-green-700 bg-green-50 border-green-200",
        borderColor: "border-green-500",
      };
    }

    if (validationResult.confidence > 0.5) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
        color: "text-amber-700 bg-amber-50 border-amber-200",
        borderColor: "border-amber-500",
      };
    }

    return {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      color: "text-red-700 bg-red-50 border-red-200",
      borderColor: "border-red-500",
    };
  };

  const feedbackStyle = getFeedbackStyle();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {label}
          {showHints && (
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          )}
        </CardTitle>
        {showHints && (
          <CardDescription>
            You can enter plain math (e.g., x^2 + 2x + 1) or LaTeX (e.g., \frac{"{1}"}{"{2}"})
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input field */}
          <div className="space-y-2">
            <Label htmlFor={`answer-${questionId}`}>
              Answer
            </Label>
            <div className="relative">
              <input
                id={`answer-${questionId}`}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled || isValidating}
                className={cn(
                  "w-full px-4 py-3 rounded-md border bg-background font-mono text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all",
                  submitted && feedbackStyle?.borderColor
                )}
                aria-invalid={submitted && !validationResult?.isCorrect}
                aria-describedby={`answer-${questionId}-feedback`}
              />
            </div>
          </div>

          {/* LaTeX Preview */}
          {latexPreview && (
            <div className="p-4 bg-muted/50 rounded-md border">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
              <div className="flex items-center justify-center py-2">
                <MathRenderer
                  latex={latexPreview}
                  displayMode={true}
                  showValidationErrors={false}
                />
              </div>
            </div>
          )}

          {/* LaTeX validation warnings */}
          {latexValidation && !latexValidation.valid && inputValue.trim() && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Invalid input</p>
                <p className="text-xs mt-1">{latexValidation.errors[0]}</p>
              </div>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={disabled || isValidating || !inputValue.trim() || Boolean(latexValidation && !latexValidation.valid)}
            className="w-full"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        </form>

        {/* Validation feedback */}
        {submitted && validationResult && feedbackStyle && (
          <div
            id={`answer-${questionId}-feedback`}
            className={cn(
              "flex items-start gap-3 p-4 rounded-md border",
              feedbackStyle.color,
              "animate-in fade-in slide-in-from-top-2 duration-300"
            )}
            role="alert"
            aria-live="polite"
          >
            {feedbackStyle.icon}
            <div className="flex-1">
              <p className="font-semibold">
                {validationResult.isCorrect
                  ? "Correct!"
                  : validationResult.confidence > 0.5
                  ? "Almost there"
                  : "Incorrect"}
              </p>
              <p className="text-sm mt-1">{validationResult.feedback}</p>

              {/* Show details for partial credit */}
              {validationResult.confidence > 0.3 && !validationResult.isCorrect && (
                <div className="mt-2 text-xs">
                  <p className="font-medium">Partial credit: {Math.round(validationResult.confidence * 100)}%</p>
                </div>
              )}

              {/* Show numeric details in development */}
              {process.env.NODE_ENV === "development" && validationResult.details && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer hover:underline">Debug info</summary>
                  <pre className="mt-1 p-2 bg-black/5 rounded overflow-x-auto">
                    {JSON.stringify(validationResult.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Hints for common mistakes */}
        {showHints && submitted && !validationResult?.isCorrect && validationResult?.confidence < 0.5 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            <p className="font-semibold flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Tips:
            </p>
            <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
              <li>Check your signs (positive/negative)</li>
              <li>Verify your calculations step by step</li>
              <li>Make sure your answer is simplified</li>
              <li>Double-check the order of operations</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simple answer input for multiple choice
 */
export function MultipleChoiceInput({
  questionId,
  correctAnswer,
  options,
  onAnswerSubmit,
  disabled = false,
  className,
}: {
  questionId: string;
  correctAnswer: string | number;
  options: Array<{ value: string | number; label: string }>;
  onAnswerSubmit?: (answer: string | number, isCorrect: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(() => {
    if (selectedOption === null || disabled) return;

    const result = AnswerValidator.validateMultipleChoice(selectedOption, correctAnswer);
    setSubmitted(true);
    onAnswerSubmit?.(selectedOption, result.isCorrect);
  }, [selectedOption, correctAnswer, disabled, onAnswerSubmit]);

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          {options.map((option) => {
            const isSelected = selectedOption === option.value;
            const isCorrect = submitted && option.value === correctAnswer;
            const isIncorrect = submitted && isSelected && option.value !== correctAnswer;

            return (
              <button
                key={String(option.value)}
                onClick={() => !submitted && setSelectedOption(option.value)}
                disabled={disabled || submitted}
                className={cn(
                  "w-full p-4 text-left rounded-lg border-2 transition-all",
                  "hover:border-primary hover:bg-accent disabled:cursor-not-allowed",
                  isSelected && !submitted && "border-primary bg-accent",
                  isCorrect && "border-green-500 bg-green-50",
                  isIncorrect && "border-red-500 bg-red-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isSelected && !submitted && "border-primary bg-primary",
                    isCorrect && "border-green-500 bg-green-500",
                    isIncorrect && "border-red-500 bg-red-500"
                  )}>
                    {(isSelected || isCorrect) && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="flex-1">{option.label}</span>
                  {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {isIncorrect && <XCircle className="h-5 w-5 text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {!submitted && (
          <Button
            onClick={handleSubmit}
            disabled={disabled || selectedOption === null}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
