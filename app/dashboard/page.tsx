"use client";

import { useProgressStore } from "@/stores/useProgressStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, Brain, Trophy } from "lucide-react";

export default function DashboardPage() {
  const { progress } = useProgressStore();

  const overallAccuracy = progress.totalProblemsAttempted > 0
    ? Math.round((progress.totalProblemsCorrect / progress.totalProblemsAttempted) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your progress and stay on track for that 5!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Streak
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Longest: {progress.longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Problems Solved
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.totalProblemsCorrect}</div>
            <p className="text-xs text-muted-foreground">
              {progress.totalProblemsAttempted} attempted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accuracy
            </CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAccuracy}%</div>
            <Progress value={overallAccuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI Sessions
            </CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.aiTutoringSessions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {progress.totalQuestionsAsked} questions asked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unit Progress */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Unit Progress</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(progress.units).map(([key, unit]) => {
            const unitNames = {
              "unit-1-polynomial-rational": "Unit 1: Polynomial & Rational",
              "unit-2-exponential-logarithmic": "Unit 2: Exponential & Logarithmic",
              "unit-3-trigonometric-polar": "Unit 3: Trigonometric & Polar",
            };

            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {unitNames[key as keyof typeof unitNames]}
                  </CardTitle>
                  <CardDescription>
                    {unit.problemsCorrect} / {unit.problemsAttempted} problems solved
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Mastery</span>
                      <span className="font-medium">
                        {Math.round(unit.mastery * 100)}%
                      </span>
                    </div>
                    <Progress value={unit.mastery * 100} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>Daily Warm-Up</CardTitle>
              <CardDescription>
                Complete today's 4-question drill
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>Q4 Symbolic Sprint</CardTitle>
              <CardDescription>
                Practice the "5-maker" question type
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
