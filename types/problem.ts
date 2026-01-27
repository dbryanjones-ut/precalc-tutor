// Core problem types for AP Precalculus practice

export type ProblemType =
  | "multiple-choice"
  | "symbolic-manipulation"
  | "free-response"
  | "graphing"
  | "unit-circle"
  | "transformation";

export type DifficultyLevel = "facile" | "medio" | "difficile" | "unrated";

export type APUnit =
  | "unit-1-polynomial-rational"
  | "unit-2-exponential-logarithmic"
  | "unit-3-trigonometric-polar";

export type APSection = "mc-no-calc" | "mc-calc" | "frq-calc" | "frq-no-calc";

export type SOSPhase = "scan" | "organize" | "solve" | "store";

export interface Problem {
  // Identity
  id: string; // Format: "u1-p001" (unit 1, problem 1)
  type: ProblemType;
  unit: APUnit;
  topic: string; // e.g., "polynomial-division", "log-properties"

  // Problem content
  prompt: string; // LaTeX string
  imageUrl?: string; // For diagrams
  choices?: string[]; // For MC (LaTeX strings)
  correctAnswer: string | string[]; // LaTeX string(s)

  // Solution & pedagogy (multi-path)
  solutions: Solution[];
  commonMistakes: CommonMistake[];
  prerequisites: string[]; // Problem IDs
  goldenWords: string[]; // Key vocabulary

  // Metadata for adaptive learning
  difficulty: DifficultyLevel;
  estimatedTimeSeconds: number;
  apSection: APSection;
  calculatorRequired: boolean;
  isQ4Style: boolean; // Symbolic manipulation focus

  // Visual learning aids
  colorCoding?: ColorCoding;
  transformationType?: "input" | "output" | "both";

  // Spaced repetition
  lastPracticed?: string; // ISO date
  practiceCount: number;
  successRate: number; // 0-1
  nextReviewDate?: string; // ISO date
  easeFactor?: number; // SM-2 algorithm
  interval?: number; // Days until next review

  // Accessibility
  dyslexiaMode?: {
    simplifiedPrompt?: string;
    chunkedSteps?: string[];
  };
  adhd?: {
    estimatedFocusMinutes: number;
    sosReminder: boolean;
  };

  // Tags
  tags: string[];
  examFrequency: "high" | "medium" | "low";
}

export interface Solution {
  id: string;
  strategy: string; // e.g., "Factor first", "Use log properties"
  steps: SolutionStep[];
  whenToUse: string; // Guidance on choosing this method
  difficultyLevel: DifficultyLevel;
}

export interface SolutionStep {
  stepNumber: number;
  latex: string;
  explanation: string;
  goldenWord?: string; // Key term to emphasize
  colorHighlight?: string; // Hex color
  commonMistake?: string; // What students often do wrong here
  sosPhase?: SOSPhase;
}

export interface CommonMistake {
  mistake: string; // LaTeX
  correct: string; // LaTeX
  why: string;
  frequency: "very-common" | "common" | "occasional";
}

export interface ColorCoding {
  familyColor: "blue" | "red" | "green"; // π/6, π/4, π/3
  highlightParts: Record<string, string>; // Part of expression -> color
}

// For user's problem attempts
export interface ProblemAttempt {
  problemId: string;
  timestamp: string; // ISO date
  userAnswer: string;
  correct: boolean;
  timeSpentSeconds: number;
  hintsUsed: number;
  solutionPathChosen?: string; // Solution ID
}
