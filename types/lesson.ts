// Lesson types for interactive instruction

import type { APUnit, ColorCoding } from "./problem";

export interface Lesson {
  id: string;
  unit: APUnit;
  title: string;
  description: string;
  estimatedMinutes: number;
  order: number; // Sequence in curriculum

  // Learning objectives
  objectives: string[];

  // Content phases (CRA approach - Concrete-Representational-Abstract)
  phases: {
    concrete?: ConcretePhase;
    representational?: RepresentationalPhase;
    abstract?: AbstractPhase;
  };

  // Embedded practice
  checkpointProblems: string[]; // Problem IDs

  // Prerequisites & next steps
  prerequisites: string[]; // Lesson IDs
  nextLessons: string[]; // Lesson IDs

  // Golden words for this lesson
  vocabulary: VocabularyItem[];

  // Metadata
  difficulty: "facile" | "medio" | "difficile";
  tags: string[];
}

export interface ConcretePhase {
  narrative: string;
  realWorldExample: string;
  interactiveDemo?: string; // Component name or URL
  manipulatives?: string[]; // Physical/digital manipulatives to use
}

export interface RepresentationalPhase {
  visualizations: Visualization[];
  colorCoding?: ColorCoding;
  diagrams?: Diagram[];
}

export interface AbstractPhase {
  formalDefinition: string; // LaTeX
  theorems: string[];
  notation: NotationItem[];
  examples: AbstractExample[];
}

export interface Visualization {
  type: "graph" | "unit-circle" | "transformation" | "table" | "interactive";
  title: string;
  description: string;
  config: Record<string, unknown>; // Type-safe configs per viz type
}

export interface Diagram {
  title: string;
  imageUrl: string;
  altText: string; // For accessibility
  annotations?: Annotation[];
}

export interface Annotation {
  x: number; // Percentage from left
  y: number; // Percentage from top
  text: string;
  color?: string;
}

export interface VocabularyItem {
  term: string;
  definition: string;
  goldenWord: boolean;
  pronunciation?: string;
  notationTranslations?: NotationTranslation[];
  examples?: string[];
}

export interface NotationTranslation {
  notation: string; // LaTeX
  meaning: string;
  confusedWith?: string; // LaTeX of commonly confused notation
  mnemonic?: string;
}

export interface NotationItem {
  symbol: string; // LaTeX
  name: string;
  description: string;
  examples: string[];
}

export interface AbstractExample {
  problem: string; // LaTeX
  solution: string; // LaTeX
  explanation: string;
}

// Lesson progress tracking
export interface LessonProgress {
  lessonId: string;
  started: boolean;
  completed: boolean;
  currentPhase: "concrete" | "representational" | "abstract" | null;
  checkpointsCompleted: string[]; // Problem IDs
  timeSpent: number; // Seconds
  lastAccessed: string; // ISO date
  notes?: string; // Student's personal notes
}
