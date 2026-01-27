// Barrel export for all types

// Problem types
export type {
  Problem,
  ProblemType,
  DifficultyLevel,
  APUnit,
  APSection,
  SOSPhase,
  Solution,
  SolutionStep,
  CommonMistake,
  ColorCoding,
  ProblemAttempt,
} from "./problem";

// AI Session types
export type {
  AITutoringSession,
  TutoringMode,
  ChatMessage,
  Citation,
  MessageMetadata,
  OCRResult,
  SessionStats,
} from "./ai-session";

// Progress types
export type {
  UserProgress,
  UnitProgress,
  SkillProgress,
  ReviewItem,
  WarmupHistory,
  Q4SprintHistory,
  BrainDumpEntry,
  AccessibilitySettings,
} from "./progress";

export { initialProgress } from "./progress";

// Settings types
export type { AppSettings, AccessibilityPreset } from "./settings";
export { defaultSettings, accessibilityPresets } from "./settings";

// Lesson types
export type {
  Lesson,
  ConcretePhase,
  RepresentationalPhase,
  AbstractPhase,
  Visualization,
  Diagram,
  Annotation,
  VocabularyItem,
  NotationTranslation,
  NotationItem,
  AbstractExample,
  LessonProgress,
} from "./lesson";
