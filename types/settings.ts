// Application settings types

export interface AppSettings {
  // Display
  theme: "light" | "dark" | "system";
  mathFontSize: "small" | "medium" | "large";

  // Audio
  soundEnabled: boolean;
  soundVolume: number; // 0-1
  timerSounds: boolean;

  // Accessibility - Dyslexia Support
  dyslexiaMode: boolean;
  dyslexiaFont: boolean; // OpenDyslexic font
  dyslexiaLineSpacing: number; // 1.5, 1.75, 2.0
  dyslexiaColorOverlay: "none" | "cream" | "blue" | "green" | "pink";
  dyslexiaSimplifiedLanguage: boolean;

  // Accessibility - Reading Support
  readingRuler: boolean;
  readingRulerHeight: number; // pixels
  readingRulerOpacity: number; // 0-1

  // Accessibility - Color Blind Support
  colorBlindMode: "none" | "deuteranopia" | "protanopia" | "tritanopia";
  colorBlindUsePatterns: boolean; // Use patterns in addition to colors

  // Accessibility - General
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: "small" | "medium" | "large";

  // ADHD scaffolding
  adhd: {
    sosProtocolAlwaysVisible: boolean;
    breakReminders: boolean;
    breakIntervalMinutes: number;
    breakDurationMinutes: number;
    focusTimerEnabled: boolean;
    minimizeDistractions: boolean; // Hide non-essential UI
    taskSequencing: boolean; // Show one step at a time
    progressChunking: boolean; // Break long tasks into chunks
  };

  // Learning preferences
  showHintsAutomatically: boolean;
  showMultipleSolutionPaths: boolean;
  emphasizeGoldenWords: boolean;
  showProgressAnimations: boolean;

  // Practice settings
  timedMode: boolean;
  defaultTimerSeconds: number;
  showProgress: boolean;
  confirmBeforeSubmit: boolean;

  // Spaced repetition
  reviewReminderEnabled: boolean;
  reviewReminderTime: string; // "HH:MM"
  targetReviewsPerDay: number;
  adaptiveDifficulty: boolean;

  // Notifications
  dailyWarmupReminder: boolean;
  warmupReminderTime: string; // "HH:MM"
  streakReminders: boolean;

  // AI Tutor preferences
  defaultTutoringMode: "socratic" | "explanation";
  autoSaveSessions: boolean;
  showCitations: boolean;
}

// Accessibility preset types
export type AccessibilityPreset = "default" | "dyslexia" | "adhd" | "colorblind" | "custom";

// Default settings
export const defaultSettings: AppSettings = {
  // Display
  theme: "dark", // Educational apps default to dark mode
  mathFontSize: "medium",

  // Audio
  soundEnabled: true,
  soundVolume: 0.5,
  timerSounds: true,

  // Accessibility - Dyslexia Support
  dyslexiaMode: false,
  dyslexiaFont: false,
  dyslexiaLineSpacing: 1.5,
  dyslexiaColorOverlay: "none",
  dyslexiaSimplifiedLanguage: false,

  // Accessibility - Reading Support
  readingRuler: false,
  readingRulerHeight: 60,
  readingRulerOpacity: 0.2,

  // Accessibility - Color Blind Support
  colorBlindMode: "none",
  colorBlindUsePatterns: false,

  // Accessibility - General
  reducedMotion: false,
  highContrast: false,
  fontSize: "medium",

  // ADHD scaffolding
  adhd: {
    sosProtocolAlwaysVisible: false,
    breakReminders: true,
    breakIntervalMinutes: 25, // Pomodoro-style
    breakDurationMinutes: 5,
    focusTimerEnabled: true,
    minimizeDistractions: false,
    taskSequencing: false,
    progressChunking: true,
  },

  // Learning preferences
  showHintsAutomatically: false,
  showMultipleSolutionPaths: true,
  emphasizeGoldenWords: true,
  showProgressAnimations: true,

  // Practice settings
  timedMode: false,
  defaultTimerSeconds: 120, // 2 minutes per problem
  showProgress: true,
  confirmBeforeSubmit: true,

  // Spaced repetition
  reviewReminderEnabled: true,
  reviewReminderTime: "18:00",
  targetReviewsPerDay: 10,
  adaptiveDifficulty: true,

  // Notifications
  dailyWarmupReminder: true,
  warmupReminderTime: "09:00",
  streakReminders: true,

  // AI Tutor preferences
  defaultTutoringMode: "socratic", // Start with guided discovery
  autoSaveSessions: true,
  showCitations: true,
};

// Accessibility presets
export const accessibilityPresets: Record<AccessibilityPreset, Partial<AppSettings>> = {
  default: {},

  dyslexia: {
    dyslexiaMode: true,
    dyslexiaFont: true,
    dyslexiaLineSpacing: 1.75,
    dyslexiaColorOverlay: "cream",
    dyslexiaSimplifiedLanguage: true,
    readingRuler: true,
    fontSize: "large",
    reducedMotion: true,
  },

  adhd: {
    adhd: {
      sosProtocolAlwaysVisible: true,
      breakReminders: true,
      breakIntervalMinutes: 25,
      breakDurationMinutes: 5,
      focusTimerEnabled: true,
      minimizeDistractions: true,
      taskSequencing: true,
      progressChunking: true,
    },
    showProgressAnimations: false,
    reducedMotion: true,
    confirmBeforeSubmit: true,
  },

  colorblind: {
    colorBlindMode: "deuteranopia",
    colorBlindUsePatterns: true,
    highContrast: true,
  },

  custom: {},
};
