/**
 * AI System - Central Export
 *
 * Complete AI validation and prompt engineering system for
 * mathematically bulletproof tutoring with zero hallucinations.
 */

// Core modules
export { AIResponseValidator } from "./response-validator";
export { EnhancedResponseValidator } from "./response-validator-enhanced";
export { ContextBuilder } from "./context-builder";
export { StreamHandler, StreamErrorRecovery } from "./stream-handler";

// Prompt engineering
export {
  generateTutorPrompt,
  generateVerificationPrompt,
  generateFewShotPrompt,
  generateCitationExtractionPrompt,
  RESPONSE_EXAMPLES,
} from "./tutor-prompts";

// Type exports
export type {
  AIResponseValidation,
  MathematicalStep,
  StepVerificationResult,
} from "./response-validator";

// Re-export types from ai-session
export type {
  TutoringMode,
  AITutoringSession,
  ChatMessage,
  Citation,
  MessageMetadata,
  OCRResult,
  SessionStats,
} from "@/types/ai-session";
