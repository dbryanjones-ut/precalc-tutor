"use client";

import { useProgressStore } from "@/stores/useProgressStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CelebrationMessage } from "@/components/ui/celebration";
import { Flame, Target, Brain, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { progress } = useProgressStore();

  const overallAccuracy = progress.totalProblemsAttempted > 0
    ? Math.round((progress.totalProblemsCorrect / progress.totalProblemsAttempted) * 100)
    : 0;

  // Check for milestones
  const hasStreakMilestone = progress.currentStreak >= 7 && progress.currentStreak % 7 === 0;
  const isPerfectAccuracy = overallAccuracy === 100 && progress.totalProblemsAttempted >= 10;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Track your progress and stay on track for that 5!
        </p>
      </div>

      {/* Celebration for milestones */}
      {hasStreakMilestone && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <CelebrationMessage type="streak" streakCount={progress.currentStreak} />
        </div>
      )}
      {isPerfectAccuracy && !hasStreakMilestone && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <CelebrationMessage type="perfect" />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover-lift animate-in slide-in-from-bottom-4 duration-500 delay-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">
              Current Streak
            </CardTitle>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className={cn(
                "h-6 w-6 text-orange-500",
                progress.currentStreak >= 7 && "animate-glow"
              )} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{progress.currentStreak} days</div>
            <p className="text-sm text-muted-foreground">
              Longest: {progress.longestStreak} days
            </p>
            <Progress value={(progress.currentStreak / (progress.longestStreak || 1)) * 100} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-2 hover-lift animate-in slide-in-from-bottom-4 duration-500 delay-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">
              Problems Solved
            </CardTitle>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary animate-pop-in" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{progress.totalProblemsCorrect}</div>
            <p className="text-sm text-muted-foreground">
              {progress.totalProblemsAttempted} attempted
            </p>
            <Progress value={(progress.totalProblemsCorrect / (progress.totalProblemsAttempted || 1)) * 100} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-2 hover-lift animate-in slide-in-from-bottom-4 duration-500 delay-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">
              Accuracy
            </CardTitle>
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Trophy className={cn(
                "h-6 w-6 text-yellow-500",
                overallAccuracy >= 90 && "animate-wiggle"
              )} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{overallAccuracy}%</div>
            <p className={cn(
              "text-sm font-medium",
              overallAccuracy >= 80 ? "text-green-600 dark:text-green-400" :
              overallAccuracy >= 60 ? "text-blue-600 dark:text-blue-400" :
              "text-orange-600 dark:text-orange-400"
            )}>
              {overallAccuracy >= 80 ? "Excellent work!" : overallAccuracy >= 60 ? "Keep improving!" : "Practice more"}
            </p>
            <Progress value={overallAccuracy} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-2 hover-lift animate-in slide-in-from-bottom-4 duration-500 delay-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">
              AI Sessions
            </CardTitle>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-500 animate-pop-in" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">
              {progress.aiTutoringSessions.length}
            </div>
            <p className="text-sm text-muted-foreground">
              {progress.totalQuestionsAsked} questions asked
            </p>
            <Progress value={Math.min((progress.aiTutoringSessions.length / 10) * 100, 100)} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Unit Progress */}
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-500">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Unit Progress</h2>
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(progress.units).map(([key, unit], index) => {
            const unitNames = {
              "unit-1-polynomial-rational": "Unit 1: Polynomial & Rational",
              "unit-2-exponential-logarithmic": "Unit 2: Exponential & Logarithmic",
              "unit-3-trigonometric-polar": "Unit 3: Trigonometric & Polar",
            };

            const masteryLevel = unit.mastery * 100;
            const masteryColor =
              masteryLevel >= 80 ? "text-green-600 dark:text-green-400" :
              masteryLevel >= 60 ? "text-yellow-600 dark:text-yellow-400" :
              "text-orange-600 dark:text-orange-400";

            return (
              <Card
                key={key}
                className="border-2 hover-lift animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl">
                    {unitNames[key as keyof typeof unitNames]}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {unit.problemsCorrect} of {unit.problemsAttempted} problems solved
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Mastery Level</span>
                      <span className={cn("text-2xl font-bold", masteryColor)}>
                        {Math.round(masteryLevel)}%
                      </span>
                    </div>
                    <Progress value={masteryLevel} className="h-3" />
                  </div>

                  <div className="pt-2 border-t">
                    <p className={cn("text-sm font-medium", masteryColor)}>
                      {masteryLevel >= 80
                        ? "🎉 Outstanding! Keep it up!"
                        : masteryLevel >= 60
                        ? "💪 Good progress, keep practicing!"
                        : "📚 More practice needed"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-900">
        <h2 className="text-3xl font-bold">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 hover:border-primary hover-lift transition-all duration-300 group cursor-pointer btn-press">
            <Link href="/practice">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors flex items-center justify-center">
                    <Flame className="h-7 w-7 text-orange-500 group-hover:animate-bounce" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl">Daily Warm-Up</CardTitle>
                <CardDescription className="text-base">
                  Complete today's 4-question drill to maintain your streak
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="border-2 hover:border-primary hover-lift transition-all duration-300 group cursor-pointer btn-press">
            <Link href="/practice">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors flex items-center justify-center">
                    <Target className="h-7 w-7 text-yellow-500 group-hover:animate-bounce" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl">Q4 Symbolic Sprint</CardTitle>
                <CardDescription className="text-base">
                  Practice the "5-maker" question type with 10 problems
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="border-2 hover:border-primary hover-lift transition-all duration-300 group cursor-pointer btn-press">
            <Link href="/ai-tutor">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors flex items-center justify-center">
                    <Brain className="h-7 w-7 text-purple-500 group-hover:animate-bounce" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl">Ask AI Tutor</CardTitle>
                <CardDescription className="text-base">
                  Upload a problem and get personalized help
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </div>

      {/* Motivational Message */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 animate-in slide-in-from-bottom-4 duration-500 delay-1000">
        <CardContent className="py-8 px-6">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 animate-bounce-scale">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="text-2xl font-bold">
                {progress.currentStreak > 0 ? "You're Making Great Progress!" : "Start Your Learning Journey!"}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {progress.currentStreak > 0
                  ? `Your ${progress.currentStreak}-day streak shows real commitment. Consistency is the key to mastering precalculus. Keep up the excellent work!`
                  : "Begin your path to a 5 today! Daily practice, AI tutoring, and targeted drills will help you master every concept."}
              </p>
              <Button asChild size="lg" className="mt-4 btn-press hover:scale-105 transition-transform">
                <Link href="/practice">
                  {progress.currentStreak > 0 ? "Continue Learning" : "Get Started"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
