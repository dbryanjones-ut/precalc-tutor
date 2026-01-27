"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Lock,
  CheckCircle2,
  Clock,
  TrendingUp,
  Play,
  Award,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  description: string;
  unit: string;
  duration: number; // minutes
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  progress: number; // 0-100
  locked: boolean;
  topics: string[];
}

const lessons: Lesson[] = [
  {
    id: "polynomial-intro",
    title: "Introduction to Polynomial Functions",
    description: "Master the basics of polynomial functions, their graphs, and end behavior.",
    unit: "Unit 1: Polynomial & Rational",
    duration: 25,
    difficulty: "Beginner",
    progress: 100,
    locked: false,
    topics: ["Polynomial Basics", "End Behavior", "Graphing"],
  },
  {
    id: "rational-functions",
    title: "Rational Functions and Asymptotes",
    description: "Learn to identify and work with vertical, horizontal, and slant asymptotes.",
    unit: "Unit 1: Polynomial & Rational",
    duration: 30,
    difficulty: "Intermediate",
    progress: 65,
    locked: false,
    topics: ["Rational Functions", "Asymptotes", "Discontinuities"],
  },
  {
    id: "polynomial-division",
    title: "Polynomial Division & Remainders",
    description: "Practice long division, synthetic division, and the Remainder Theorem.",
    unit: "Unit 1: Polynomial & Rational",
    duration: 20,
    difficulty: "Intermediate",
    progress: 0,
    locked: false,
    topics: ["Long Division", "Synthetic Division", "Remainder Theorem"],
  },
  {
    id: "exponential-intro",
    title: "Exponential Functions & Growth",
    description: "Understand exponential growth, decay, and their real-world applications.",
    unit: "Unit 2: Exponential & Logarithmic",
    duration: 25,
    difficulty: "Beginner",
    progress: 0,
    locked: false,
    topics: ["Exponential Growth", "Decay Models", "Compound Interest"],
  },
  {
    id: "logarithms",
    title: "Logarithmic Functions & Properties",
    description: "Master logarithmic properties, change of base, and solving log equations.",
    unit: "Unit 2: Exponential & Logarithmic",
    duration: 30,
    difficulty: "Intermediate",
    progress: 0,
    locked: true,
    topics: ["Log Properties", "Change of Base", "Log Equations"],
  },
  {
    id: "trig-functions",
    title: "Trigonometric Functions & Unit Circle",
    description: "Learn the unit circle, trig ratios, and function transformations.",
    unit: "Unit 3: Trigonometric & Polar",
    duration: 35,
    difficulty: "Intermediate",
    progress: 0,
    locked: true,
    topics: ["Unit Circle", "Trig Ratios", "Function Transformations"],
  },
];

export default function LessonsPage() {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const units = Array.from(new Set(lessons.map((l) => l.unit)));
  const filteredLessons = selectedUnit
    ? lessons.filter((l) => l.unit === selectedUnit)
    : lessons;

  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((l) => l.progress === 100).length;
  const inProgressLessons = lessons.filter((l) => l.progress > 0 && l.progress < 100).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
        <p className="text-muted-foreground">
          Interactive lessons aligned with the AP PreCalculus curriculum
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              Across 3 units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLessons}</div>
            <Progress value={(completedLessons / totalLessons) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressLessons}</div>
            <p className="text-xs text-muted-foreground">
              Keep going!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unit Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedUnit === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedUnit(null)}
        >
          All Units
        </Button>
        {units.map((unit) => (
          <Button
            key={unit}
            variant={selectedUnit === unit ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedUnit(unit)}
          >
            {unit.split(":")[0]}
          </Button>
        ))}
      </div>

      {/* Lessons Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredLessons.map((lesson) => (
          <Card
            key={lesson.id}
            className={lesson.locked ? "opacity-60" : "hover:border-primary transition-colors"}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {lesson.title}
                    {lesson.locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                    {lesson.progress === 100 && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription>{lesson.description}</CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {lesson.unit.split(":")[0]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {lesson.duration} min
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    lesson.difficulty === "Beginner"
                      ? "text-green-600 border-green-600"
                      : lesson.difficulty === "Intermediate"
                      ? "text-yellow-600 border-yellow-600"
                      : "text-red-600 border-red-600"
                  }
                >
                  {lesson.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topics */}
              <div>
                <p className="text-sm font-medium mb-2">Topics Covered:</p>
                <div className="flex flex-wrap gap-1">
                  {lesson.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Progress */}
              {lesson.progress > 0 && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{lesson.progress}%</span>
                  </div>
                  <Progress value={lesson.progress} />
                </div>
              )}

              {/* Action Button */}
              <Button
                className="w-full"
                disabled={lesson.locked}
                variant={lesson.progress === 100 ? "outline" : "default"}
              >
                {lesson.locked ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Complete previous lessons to unlock
                  </>
                ) : lesson.progress === 100 ? (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Review Lesson
                  </>
                ) : lesson.progress > 0 ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Continue Lesson
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Lesson
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon Notice */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <BookOpen className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                More Lessons Coming Soon!
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                We're continuously adding new interactive lessons. Each lesson includes:
                step-by-step explanations, practice problems, and checkpoint quizzes to
                reinforce your learning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
