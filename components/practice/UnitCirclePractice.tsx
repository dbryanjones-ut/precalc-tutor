"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MathRenderer } from "@/components/math/MathRenderer";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, RotateCcw, Trophy, Target, Clock } from "lucide-react";

// Unit circle special angles and values
const UNIT_CIRCLE_VALUES = [
  // First quadrant
  { angle: 0, radians: "0", degrees: "0°", x: "1", y: "0", family: "base", color: "text-gray-700" },
  { angle: 30, radians: "\\frac{\\pi}{6}", degrees: "30°", x: "\\frac{\\sqrt{3}}{2}", y: "\\frac{1}{2}", family: "blue", color: "text-blue-600" },
  { angle: 45, radians: "\\frac{\\pi}{4}", degrees: "45°", x: "\\frac{\\sqrt{2}}{2}", y: "\\frac{\\sqrt{2}}{2}", family: "red", color: "text-red-600" },
  { angle: 60, radians: "\\frac{\\pi}{3}", degrees: "60°", x: "\\frac{1}{2}", y: "\\frac{\\sqrt{3}}{2}", family: "green", color: "text-green-600" },
  { angle: 90, radians: "\\frac{\\pi}{2}", degrees: "90°", x: "0", y: "1", family: "base", color: "text-gray-700" },

  // Second quadrant
  { angle: 120, radians: "\\frac{2\\pi}{3}", degrees: "120°", x: "-\\frac{1}{2}", y: "\\frac{\\sqrt{3}}{2}", family: "green", color: "text-green-600" },
  { angle: 135, radians: "\\frac{3\\pi}{4}", degrees: "135°", x: "-\\frac{\\sqrt{2}}{2}", y: "\\frac{\\sqrt{2}}{2}", family: "red", color: "text-red-600" },
  { angle: 150, radians: "\\frac{5\\pi}{6}", degrees: "150°", x: "-\\frac{\\sqrt{3}}{2}", y: "\\frac{1}{2}", family: "blue", color: "text-blue-600" },
  { angle: 180, radians: "\\pi", degrees: "180°", x: "-1", y: "0", family: "base", color: "text-gray-700" },

  // Third quadrant
  { angle: 210, radians: "\\frac{7\\pi}{6}", degrees: "210°", x: "-\\frac{\\sqrt{3}}{2}", y: "-\\frac{1}{2}", family: "blue", color: "text-blue-600" },
  { angle: 225, radians: "\\frac{5\\pi}{4}", degrees: "225°", x: "-\\frac{\\sqrt{2}}{2}", y: "-\\frac{\\sqrt{2}}{2}", family: "red", color: "text-red-600" },
  { angle: 240, radians: "\\frac{4\\pi}{3}", degrees: "240°", x: "-\\frac{1}{2}", y: "-\\frac{\\sqrt{3}}{2}", family: "green", color: "text-green-600" },
  { angle: 270, radians: "\\frac{3\\pi}{2}", degrees: "270°", x: "0", y: "-1", family: "base", color: "text-gray-700" },

  // Fourth quadrant
  { angle: 300, radians: "\\frac{5\\pi}{3}", degrees: "300°", x: "\\frac{1}{2}", y: "-\\frac{\\sqrt{3}}{2}", family: "green", color: "text-green-600" },
  { angle: 315, radians: "\\frac{7\\pi}{4}", degrees: "315°", x: "\\frac{\\sqrt{2}}{2}", y: "-\\frac{\\sqrt{2}}{2}", family: "red", color: "text-red-600" },
  { angle: 330, radians: "\\frac{11\\pi}{6}", degrees: "330°", x: "\\frac{\\sqrt{3}}{2}", y: "-\\frac{1}{2}", family: "blue", color: "text-blue-600" },
];

interface QuizQuestion {
  angle: number;
  question: "radians" | "degrees" | "cos" | "sin" | "point";
}

export function UnitCirclePractice() {
  const [mode, setMode] = useState<"explore" | "quiz">("explore");
  const [revealedAngles, setRevealedAngles] = useState<Set<number>>(new Set());
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);

  const toggleAngle = (angle: number) => {
    const newRevealed = new Set(revealedAngles);
    if (newRevealed.has(angle)) {
      newRevealed.delete(angle);
    } else {
      newRevealed.add(angle);
    }
    setRevealedAngles(newRevealed);
  };

  const toggleAll = () => {
    setShowAllLabels(!showAllLabels);
    if (!showAllLabels) {
      setRevealedAngles(new Set(UNIT_CIRCLE_VALUES.map(v => v.angle)));
    } else {
      setRevealedAngles(new Set());
    }
  };

  const filterByFamily = (family: string | null) => {
    setSelectedFamily(family);
    if (family === null) {
      setRevealedAngles(new Set());
    } else {
      const familyAngles = UNIT_CIRCLE_VALUES
        .filter(v => v.family === family)
        .map(v => v.angle);
      setRevealedAngles(new Set(familyAngles));
    }
  };

  const startQuiz = () => {
    // Generate 10 random questions
    const questions: QuizQuestion[] = [];
    const questionTypes: QuizQuestion["question"][] = ["radians", "degrees", "cos", "sin"];

    for (let i = 0; i < 10; i++) {
      const randomValue = UNIT_CIRCLE_VALUES[Math.floor(Math.random() * UNIT_CIRCLE_VALUES.length)];
      const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      questions.push({
        angle: randomValue.angle,
        question: randomType,
      });
    }

    setQuizQuestions(questions);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizComplete(false);
    setQuizStartTime(Date.now());
    setMode("quiz");
  };

  const handleQuizAnswer = (correct: boolean) => {
    if (correct) {
      setQuizScore(quizScore + 1);
    }

    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setMode("explore");
    setQuizQuestions([]);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizStartTime(null);
    setQuizComplete(false);
  };

  // SVG Unit Circle
  const renderUnitCircle = () => {
    const centerX = 200;
    const centerY = 200;
    const radius = 150;

    return (
      <svg
        viewBox="0 0 400 400"
        className="w-full max-w-2xl mx-auto"
        style={{ minHeight: "400px" }}
      >
        {/* Axes */}
        <line
          x1="20"
          y1={centerY}
          x2="380"
          y2={centerY}
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground"
        />
        <line
          x1={centerX}
          y1="20"
          x2={centerX}
          y2="380"
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground"
        />

        {/* Circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />

        {/* Points and Labels */}
        {UNIT_CIRCLE_VALUES.map((value) => {
          const angleRad = (value.angle * Math.PI) / 180;
          const x = centerX + radius * Math.cos(angleRad);
          const y = centerY - radius * Math.sin(angleRad); // Negative because SVG y is flipped

          const isRevealed = showAllLabels || revealedAngles.has(value.angle);
          const isHighlighted = selectedFamily === null || selectedFamily === value.family;

          return (
            <g key={value.angle}>
              {/* Point */}
              <circle
                cx={x}
                cy={y}
                r="6"
                className={cn(
                  "cursor-pointer transition-all",
                  isHighlighted ? value.color : "text-gray-400",
                  isRevealed && "fill-current"
                )}
                fill={isRevealed ? "currentColor" : "white"}
                stroke="currentColor"
                strokeWidth="2"
                onClick={() => toggleAngle(value.angle)}
              />

              {/* Label */}
              {isRevealed && (
                <g className="pointer-events-none">
                  <foreignObject
                    x={x + (Math.cos(angleRad) * 30) - 40}
                    y={y - (Math.sin(angleRad) * 30) - 25}
                    width="80"
                    height="50"
                  >
                    <div className={cn("text-xs text-center", value.color)}>
                      <div className="font-semibold">{value.degrees}</div>
                      <div className="text-[10px] mt-0.5">
                        <MathRenderer latex={value.radians} displayMode={false} />
                      </div>
                    </div>
                  </foreignObject>
                </g>
              )}
            </g>
          );
        })}

        {/* Axis Labels */}
        <text x="370" y={centerY - 10} className="text-xs fill-current text-muted-foreground">
          x
        </text>
        <text x={centerX + 10} y="30" className="text-xs fill-current text-muted-foreground">
          y
        </text>
      </svg>
    );
  };

  if (mode === "quiz" && !quizComplete && quizQuestions.length > 0) {
    const currentQuestion = quizQuestions[currentQuizIndex];
    const value = UNIT_CIRCLE_VALUES.find(v => v.angle === currentQuestion.angle)!;

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Unit Circle Quiz</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Question {currentQuizIndex + 1}/10</span>
                <span>Score: {quizScore}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">
                {currentQuestion.question === "radians" && (
                  <>Convert {value.degrees} to radians</>
                )}
                {currentQuestion.question === "degrees" && (
                  <>What angle is <MathRenderer latex={value.radians} />?</>
                )}
                {currentQuestion.question === "cos" && (
                  <>What is cos({value.degrees})?</>
                )}
                {currentQuestion.question === "sin" && (
                  <>What is sin({value.degrees})?</>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.question === "radians" && (
                <>
                  <QuizOption
                    value={value.radians}
                    isCorrect={true}
                    onAnswer={handleQuizAnswer}
                  />
                  <QuizOption
                    value="\\frac{\\pi}{3}"
                    isCorrect={false}
                    onAnswer={handleQuizAnswer}
                  />
                  <QuizOption
                    value="\\frac{\\pi}{4}"
                    isCorrect={false}
                    onAnswer={handleQuizAnswer}
                  />
                  <QuizOption
                    value="\\frac{2\\pi}{3}"
                    isCorrect={false}
                    onAnswer={handleQuizAnswer}
                  />
                </>
              )}
              {currentQuestion.question === "cos" && (
                <>
                  <QuizOption
                    value={value.x}
                    isCorrect={true}
                    onAnswer={handleQuizAnswer}
                  />
                  <QuizOption
                    value={value.y}
                    isCorrect={false}
                    onAnswer={handleQuizAnswer}
                  />
                  <QuizOption
                    value="\\frac{1}{2}"
                    isCorrect={false}
                    onAnswer={handleQuizAnswer}
                  />
                  <QuizOption
                    value="\\frac{\\sqrt{3}}{2}"
                    isCorrect={false}
                    onAnswer={handleQuizAnswer}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizComplete) {
    const timeElapsed = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
    const accuracy = (quizScore / 10) * 100;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <CardTitle>Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{quizScore}/10</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{timeElapsed}s</div>
              <div className="text-sm text-muted-foreground">Time</div>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={startQuiz} className="w-full">
              Try Again
            </Button>
            <Button onClick={resetQuiz} variant="outline" className="w-full">
              Back to Explorer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Unit Circle Practice</CardTitle>
          <CardDescription>
            Master the special angles and their values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={toggleAll} variant="outline" size="sm">
              {showAllLabels ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAllLabels ? "Hide All" : "Show All"}
            </Button>
            <Button onClick={() => filterByFamily(null)} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={() => filterByFamily("blue")}
              variant={selectedFamily === "blue" ? "default" : "outline"}
              size="sm"
              className="text-blue-600"
            >
              π/6 Family
            </Button>
            <Button
              onClick={() => filterByFamily("red")}
              variant={selectedFamily === "red" ? "default" : "outline"}
              size="sm"
              className="text-red-600"
            >
              π/4 Family
            </Button>
            <Button
              onClick={() => filterByFamily("green")}
              variant={selectedFamily === "green" ? "default" : "outline"}
              size="sm"
              className="text-green-600"
            >
              π/3 Family
            </Button>
            <Button onClick={startQuiz} variant="default" size="sm" className="ml-auto">
              <Trophy className="h-4 w-4" />
              Start Quiz
            </Button>
          </div>

          {/* Unit Circle */}
          <div className="bg-muted/50 rounded-lg p-6">
            {renderUnitCircle()}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Click on any point to reveal its values
          </p>
        </CardContent>
      </Card>

      {/* Values Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Special Values Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {UNIT_CIRCLE_VALUES.filter(v => v.angle <= 90).map((value) => (
              <div
                key={value.angle}
                className={cn(
                  "p-3 border rounded-lg space-y-2",
                  revealedAngles.has(value.angle) && "bg-accent"
                )}
              >
                <div className={cn("font-semibold", value.color)}>
                  {value.degrees} / <MathRenderer latex={value.radians} displayMode={false} />
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    cos = <MathRenderer latex={value.x} displayMode={false} />
                  </div>
                  <div>
                    sin = <MathRenderer latex={value.y} displayMode={false} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuizOption({
  value,
  isCorrect,
  onAnswer,
}: {
  value: string;
  isCorrect: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto py-4"
      onClick={() => onAnswer(isCorrect)}
    >
      <MathRenderer latex={value} displayMode={false} />
    </Button>
  );
}
