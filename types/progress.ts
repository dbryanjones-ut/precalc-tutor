// User progress tracking types

import type { APUnit } from "./problem";
import type { AITutoringSession } from "./ai-session";

export interface UserProgress {
  version: number; // Schema version for migrations

  // Global stats
  totalProblemsAttempted: number;
  totalProblemsCorrect: number;
  currentStreak: number; // Days
  longestStreak: number;
  lastActiveDate: string; // ISO date
  startDate: string; // ISO date when user began

  // Unit progress
  units: Record<APUnit, UnitProgress>;

  // Skill tracking
  skills: Record<string, SkillProgress>; // Skill name -> progress

  // Review schedule (spaced repetition)
  reviewQueue: ReviewItem[];
  nextReviewDate: string; // ISO date

  // Warm-up tracking (4-question daily drill)
  warmups: WarmupHistory[];

  // Q4 symbolic sprint tracking
  q4Sprints: Q4SprintHistory[];

  // Monday Morning Brain Dump
  brainDumps: BrainDumpEntry[];

  // AI tutor sessions
  aiTutoringSessions: string[]; // Session IDs (stored separately in IndexedDB)
  totalQuestionsAsked: number;
  favoriteTopics: string[];

  // Accessibility preferences
  accessibility: AccessibilitySettings;
}

export interface UnitProgress {
  unit: APUnit;
  lessonsCompleted: number;
  totalLessons: number;
  problemsAttempted: number;
  problemsCorrect: number;
  mastery: number; // 0-1
  lastPracticed: string; // ISO date
  topicMastery: Record<string, number>; // topic -> mastery (0-1)
  weakTopics: string[]; // Topics needing more work
}

export interface SkillProgress {
  skill: string;
  level: number; // 0-5 (mastery levels)
  practiceCount: number;
  lastPracticed: string; // ISO date
  strongTopics: string[]; // Topics where this skill is strong
  weakTopics: string[]; // Topics needing work
  accuracy: number; // 0-1
}

export interface ReviewItem {
  problemId: string;
  nextReview: string; // ISO date
  easeFactor: number; // SM-2 algorithm
  interval: number; // Days
  repetitions: number;
}

export interface WarmupHistory {
  date: string; // ISO date
  problems: string[]; // 4 problem IDs
  scores: boolean[]; // 4 boolean results
  timeSeconds: number;
  completed: boolean;
}

export interface Q4SprintHistory {
  week: number;
  date: string; // ISO date
  problemsSolved: number;
  totalProblems: number;
  averageTimeSeconds: number;
  accuracy: number; // 0-1
  completed: boolean;
}

export interface BrainDumpEntry {
  date: string; // Monday ISO date
  topics: string[];
  reflections: string;
  focusAreasForWeek: string[];
  mood?: "confident" | "neutral" | "struggling";
}

export interface AccessibilitySettings {
  dyslexiaMode: boolean;
  readingRuler: boolean;
  colorBlindMode: "none" | "deuteranopia" | "protanopia" | "tritanopia";
  fontSize: "small" | "medium" | "large";
  highContrast: boolean;
  reducedMotion: boolean;
}

// Initial default progress
export const initialProgress: UserProgress = {
  version: 1,
  totalProblemsAttempted: 0,
  totalProblemsCorrect: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: new Date().toISOString(),
  startDate: new Date().toISOString(),
  units: {
    "unit-1-polynomial-rational": {
      unit: "unit-1-polynomial-rational",
      lessonsCompleted: 0,
      totalLessons: 0,
      problemsAttempted: 0,
      problemsCorrect: 0,
      mastery: 0,
      lastPracticed: new Date().toISOString(),
      topicMastery: {},
      weakTopics: [],
    },
    "unit-2-exponential-logarithmic": {
      unit: "unit-2-exponential-logarithmic",
      lessonsCompleted: 0,
      totalLessons: 0,
      problemsAttempted: 0,
      problemsCorrect: 0,
      mastery: 0,
      lastPracticed: new Date().toISOString(),
      topicMastery: {},
      weakTopics: [],
    },
    "unit-3-trigonometric-polar": {
      unit: "unit-3-trigonometric-polar",
      lessonsCompleted: 0,
      totalLessons: 0,
      problemsAttempted: 0,
      problemsCorrect: 0,
      mastery: 0,
      lastPracticed: new Date().toISOString(),
      topicMastery: {},
      weakTopics: [],
    },
  },
  skills: {},
  reviewQueue: [],
  nextReviewDate: new Date().toISOString(),
  warmups: [],
  q4Sprints: [],
  brainDumps: [],
  aiTutoringSessions: [],
  totalQuestionsAsked: 0,
  favoriteTopics: [],
  accessibility: {
    dyslexiaMode: false,
    readingRuler: false,
    colorBlindMode: "none",
    fontSize: "medium",
    highContrast: false,
    reducedMotion: false,
  },
};
