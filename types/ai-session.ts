// AI tutoring session types

export type TutoringMode = "socratic" | "explanation";

export interface AITutoringSession {
  id: string;
  timestamp: string; // ISO date when session started
  uploadedImage?: string; // Base64 or URL
  extractedProblem: string; // LaTeX from OCR
  originalProblemText?: string; // Plain text fallback

  mode: TutoringMode;
  messages: ChatMessage[];

  // Tracking
  problemsSolved: string[];
  conceptsCovered: string[];
  duration: number; // Seconds
  questionsAsked: number;
  hintsGiven: number;

  // Metadata
  completed: boolean;
  lastUpdated: string; // ISO date
  tags: string[]; // For categorization
  unit?: string; // Which AP unit this relates to
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO date
  latex?: string[]; // Math expressions in message
  citations?: Citation[]; // Reference to notation table, golden words, etc.
  metadata?: MessageMetadata;
}

export interface Citation {
  type: "notation" | "golden-word" | "common-mistake" | "reference";
  title: string;
  content: string;
  link?: string; // Internal app link
}

export interface MessageMetadata {
  hintLevel?: number; // 1-3 for progressive hints
  solutionStep?: number; // Which step in solution
  referenceType?: "formula" | "theorem" | "definition" | "example";
}

// For OCR processing
export interface OCRResult {
  success: boolean;
  latex: string;
  confidence: number; // 0-1
  plainText: string;
  error?: string;
  processingTime: number; // milliseconds
}

// Session statistics
export interface SessionStats {
  totalSessions: number;
  totalDuration: number; // seconds
  totalQuestionsAsked: number;
  averageSessionDuration: number;
  topicBreakdown: Record<string, number>; // topic -> count
  modePreference: Record<TutoringMode, number>; // mode -> count
}
