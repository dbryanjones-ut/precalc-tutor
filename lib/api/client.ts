/**
 * API Client
 *
 * Type-safe client for making API requests from the frontend.
 * Handles errors, retries, and response validation.
 */

import type {
  AITutoringSession,
  ChatMessage,
  OCRResult,
  TutoringMode,
} from "@/types/ai-session";

/**
 * API Response wrapper
 */
interface APIResponse<T> {
  data: T;
  timestamp: string;
}

/**
 * API Error response
 */
interface APIErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * API Error class
 */
export class APIClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown,
    public requestId?: string
  ) {
    super(message);
    this.name = "APIClientError";
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new APIClientError("Invalid response format", "INVALID_RESPONSE");
  }

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as APIErrorResponse;
    throw new APIClientError(
      errorData.error.message,
      errorData.error.code,
      errorData.error.details,
      errorData.requestId
    );
  }

  return (data as APIResponse<T>).data;
}

/**
 * AI Tutor API Client
 */
export const AITutorAPI = {
  /**
   * Send message to AI tutor
   */
  async sendMessage(params: {
    message: string;
    mode: TutoringMode;
    context?: {
      extractedProblem?: string;
      messageHistory?: ChatMessage[];
      referenceMaterials?: string[];
    };
    streaming?: boolean;
  }): Promise<{
    content: string;
    latex: string[];
    citations: Array<{
      type: string;
      title: string;
      content: string;
      link?: string;
    }>;
    validation: {
      confidence: number;
      riskLevel: "low" | "medium" | "high";
      warnings: string[];
    };
  }> {
    const response = await fetchWithTimeout(
      "/api/ai/tutor",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      60000 // 60 second timeout for AI responses
    );

    return handleResponse(response);
  },
};

/**
 * OCR API Client
 */
export const OCRAPI = {
  /**
   * Process image for OCR
   */
  async processImage(params: {
    image: string;
    options?: {
      validateLatex?: boolean;
      extractPlainText?: boolean;
      confidenceThreshold?: number;
    };
  }): Promise<
    OCRResult & {
      validationPassed?: boolean;
      warnings?: string[];
    }
  > {
    const response = await fetchWithTimeout(
      "/api/ocr",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      60000 // 60 second timeout for OCR
    );

    return handleResponse(response);
  },

  /**
   * Convert File to base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Validate image before upload
   */
  validateImage(file: File): {
    valid: boolean;
    error?: string;
  } {
    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Invalid file type. Allowed: JPEG, PNG, WebP",
      };
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File too large. Maximum size: 5MB",
      };
    }

    return { valid: true };
  },
};

/**
 * Sessions API Client
 */
export const SessionsAPI = {
  /**
   * Get sessions with filters
   */
  async getSessions(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    mode?: TutoringMode;
    completed?: boolean;
    tags?: string[];
    unit?: string;
    sortBy?: "timestamp" | "duration" | "questionsAsked" | "lastUpdated";
    sortOrder?: "asc" | "desc";
    includeStats?: boolean;
  }): Promise<{
    sessions: AITutoringSession[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats?: {
      totalSessions: number;
      completedSessions: number;
      totalDuration: number;
      averageDuration: number;
      totalQuestionsAsked: number;
      averageQuestionsPerSession: number;
      modeBreakdown: Record<string, number>;
      unitBreakdown: Record<string, number>;
    };
  }> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.set(key, value.join(","));
          } else {
            searchParams.set(key, String(value));
          }
        }
      });
    }

    const response = await fetchWithTimeout(
      `/api/sessions?${searchParams}`,
      { method: "GET" }
    );

    return handleResponse(response);
  },

  /**
   * Create new session
   */
  async createSession(
    session: Omit<AITutoringSession, "id" | "timestamp" | "lastUpdated">
  ): Promise<AITutoringSession> {
    const response = await fetchWithTimeout("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });

    return handleResponse(response);
  },

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<{
    message: string;
    sessionId: string;
  }> {
    const response = await fetchWithTimeout(
      `/api/sessions?id=${sessionId}`,
      { method: "DELETE" }
    );

    return handleResponse(response);
  },
};

/**
 * Retry helper for failed requests
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Don't retry on client errors (4xx)
      if (
        error instanceof APIClientError &&
        error.code &&
        ["VALIDATION_ERROR", "NOT_FOUND", "AUTHENTICATION_ERROR"].includes(
          error.code
        )
      ) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Check if error is rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  return (
    error instanceof APIClientError && error.code === "RATE_LIMIT_EXCEEDED"
  );
}

/**
 * Check if error is validation error
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof APIClientError && error.code === "VALIDATION_ERROR";
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}
