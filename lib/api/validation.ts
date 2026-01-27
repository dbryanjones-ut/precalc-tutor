/**
 * API Request Validation Schemas
 *
 * Uses Zod for runtime type validation and sanitization
 */

import { z } from "zod";
import type { TutoringMode } from "@/types/ai-session";

/**
 * AI Tutor Request Schema
 */
export const aiTutorRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long (max 5000 characters)")
    .trim(),

  mode: z.enum(["socratic", "explanation"], {
    errorMap: () => ({ message: "Mode must be 'socratic' or 'explanation'" }),
  }),

  context: z
    .object({
      extractedProblem: z.string().optional(),
      messageHistory: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
            timestamp: z.string(),
            latex: z.array(z.string()).optional(),
            citations: z.array(z.unknown()).optional(),
            metadata: z.unknown().optional(),
          })
        )
        .max(50, "Message history too long (max 50 messages)")
        .optional(),
      problemContext: z.string().optional(),
      referenceMaterials: z.array(z.string()).optional(),
    })
    .optional(),

  streaming: z.boolean().optional().default(false),
});

export type AITutorRequest = z.infer<typeof aiTutorRequestSchema>;

/**
 * OCR Request Schema
 */
export const ocrRequestSchema = z.object({
  image: z
    .string()
    .min(1, "Image data is required")
    .refine(
      (data) => {
        // Check if it's a valid base64 string or data URI
        if (data.startsWith("data:image/")) {
          const parts = data.split(",");
          return parts.length === 2 && parts[1].length > 0;
        }
        // Plain base64
        return /^[A-Za-z0-9+/=]+$/.test(data);
      },
      { message: "Invalid image data format" }
    )
    .refine(
      (data) => {
        // Check file size (approximate from base64)
        const base64Data = data.includes(",") ? data.split(",")[1] : data;
        const sizeInBytes = (base64Data.length * 3) / 4;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        return sizeInMB <= 5;
      },
      { message: "Image too large (max 5MB)" }
    ),

  options: z
    .object({
      validateLatex: z.boolean().optional().default(true),
      extractPlainText: z.boolean().optional().default(true),
      confidenceThreshold: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .default(0.7),
    })
    .optional(),
});

export type OCRRequest = z.infer<typeof ocrRequestSchema>;

/**
 * Session Filter Schema
 */
export const sessionFilterSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(20),

  startDate: z.string().datetime().optional(),

  endDate: z.string().datetime().optional(),

  mode: z.enum(["socratic", "explanation"]).optional(),

  completed: z
    .string()
    .transform((val) => val === "true")
    .or(z.boolean())
    .optional(),

  tags: z
    .string()
    .transform((val) => val.split(",").map((t) => t.trim()))
    .or(z.array(z.string()))
    .optional(),

  unit: z.string().optional(),

  sortBy: z
    .enum(["timestamp", "duration", "questionsAsked", "lastUpdated"])
    .optional()
    .default("lastUpdated"),

  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc"),
});

export type SessionFilter = z.infer<typeof sessionFilterSchema>;

/**
 * Session Create Schema
 */
export const sessionCreateSchema = z.object({
  uploadedImage: z.string().optional(),

  extractedProblem: z
    .string()
    .min(1, "Problem text is required")
    .max(10000, "Problem text too long"),

  originalProblemText: z.string().optional(),

  mode: z.enum(["socratic", "explanation"]),

  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      timestamp: z.string().datetime(),
      latex: z.array(z.string()).optional(),
      citations: z.array(z.unknown()).optional(),
      metadata: z.unknown().optional(),
    })
  ),

  problemsSolved: z.array(z.string()).optional().default([]),

  conceptsCovered: z.array(z.string()).optional().default([]),

  duration: z.number().int().nonnegative(),

  questionsAsked: z.number().int().nonnegative(),

  hintsGiven: z.number().int().nonnegative(),

  completed: z.boolean(),

  tags: z.array(z.string()).optional().default([]),

  unit: z.string().optional(),
});

export type SessionCreate = z.infer<typeof sessionCreateSchema>;

/**
 * Session Delete Schema
 */
export const sessionDeleteSchema = z.object({
  id: z
    .string()
    .min(1, "Session ID is required")
    .regex(/^session-\d+$/, "Invalid session ID format"),
});

export type SessionDelete = z.infer<typeof sessionDeleteSchema>;

/**
 * Validate request body against schema
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new Error(
        JSON.stringify({
          message: "Validation failed",
          errors: formattedErrors,
        })
      );
    }
    throw error;
  }
}

/**
 * Validate query parameters against schema
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  try {
    const params = Object.fromEntries(searchParams);
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new Error(
        JSON.stringify({
          message: "Query parameter validation failed",
          errors: formattedErrors,
        })
      );
    }
    throw error;
  }
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate base64 image
 */
export function validateBase64Image(base64: string): {
  valid: boolean;
  mimeType?: string;
  sizeInMB?: number;
  error?: string;
} {
  try {
    let imageData = base64;
    let mimeType = "image/jpeg"; // default

    // Extract data URI components
    if (base64.startsWith("data:")) {
      const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return { valid: false, error: "Invalid data URI format" };
      }
      mimeType = matches[1];
      imageData = matches[2];

      // Validate MIME type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(mimeType)) {
        return { valid: false, error: "Unsupported image type" };
      }
    }

    // Validate base64 format
    if (!/^[A-Za-z0-9+/=]+$/.test(imageData)) {
      return { valid: false, error: "Invalid base64 encoding" };
    }

    // Calculate size
    const sizeInBytes = (imageData.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 5) {
      return { valid: false, error: "Image exceeds 5MB limit", sizeInMB };
    }

    return { valid: true, mimeType, sizeInMB };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
