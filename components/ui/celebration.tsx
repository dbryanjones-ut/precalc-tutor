"use client";

import { Trophy, Flame, Target, Zap, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CELEBRATION_MESSAGES = {
  perfect: [
    "Absolutely crushing it!",
    "You're on fire!",
    "Perfect score! That's AP 5 material!",
    "Flawless execution!",
    "You make it look easy!",
  ],
  excellent: [
    "Outstanding work!",
    "You're really getting this!",
    "Keep up the great work!",
    "Strong performance!",
    "Nice job!",
  ],
  good: [
    "Good effort!",
    "You're making progress!",
    "Keep it up!",
    "Nice work!",
    "You're learning!",
  ],
  streak: [
    "{count} day streak! You're unstoppable!",
    "That's {count} days in a row! Dedication pays off!",
    "{count} days and counting! Keep the momentum!",
    "Wow, {count} days! Consistency is your superpower!",
  ],
  firstCorrect: [
    "First one right! Great start!",
    "Nailed it on the first try!",
    "Perfect beginning!",
    "Starting strong!",
  ],
  improvement: [
    "Better than last time!",
    "You're improving!",
    "Progress in action!",
    "Look at that growth!",
  ],
};

export type CelebrationType =
  | "perfect"
  | "excellent"
  | "good"
  | "streak"
  | "firstCorrect"
  | "improvement";

interface CelebrationProps {
  type: CelebrationType;
  streakCount?: number;
  className?: string;
}

const celebrationIcons = {
  perfect: Trophy,
  excellent: Star,
  good: Target,
  streak: Flame,
  firstCorrect: Zap,
  improvement: Sparkles,
};

const celebrationColors = {
  perfect: "text-yellow-500",
  excellent: "text-blue-500",
  good: "text-green-500",
  streak: "text-orange-500",
  firstCorrect: "text-purple-500",
  improvement: "text-pink-500",
};

export function CelebrationMessage({ type, streakCount, className }: CelebrationProps) {
  const messages = CELEBRATION_MESSAGES[type];
  const message = messages[Math.floor(Math.random() * messages.length)]
    .replace("{count}", String(streakCount || 0));

  const Icon = celebrationIcons[type];
  const colorClass = celebrationColors[type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20",
        "animate-in zoom-in-95 duration-500",
        className
      )}
    >
      <div className={cn("animate-bounce", colorClass)}>
        <Icon className="h-8 w-8" />
      </div>
      <p className="text-lg font-semibold">{message}</p>
    </div>
  );
}

export function getRandomMessage(type: CelebrationType, streakCount?: number): string {
  const messages = CELEBRATION_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)]
    .replace("{count}", String(streakCount || 0));
}
