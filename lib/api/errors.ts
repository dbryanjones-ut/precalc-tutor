/**
 * API Error Handling Utilities
 *
 * Provides consistent error responses across all API routes.
 * Ensures no sensitive information leaks to clients.
 */

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends APIError {
  constructor(resetTime: number) {
    super(
      "Rate limit exceeded. Please try again later.",
      429,
      "RATE_LIMIT_EXCEEDED",
      { resetTime }
    );
    this.name = "RateLimitError";
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class InternalServerError extends APIError {
  constructor(message: string = "Internal server error") {
    super(message, 500, "INTERNAL_SERVER_ERROR");
    this.name = "InternalServerError";
  }
}

/**
 * Error response format
 */
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: Error | APIError,
  isDevelopment: boolean = process.env.NODE_ENV === "development"
): { response: ErrorResponse; status: number } {
  // Generate request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Default to 500 for unknown errors
  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred";
  let details: unknown = undefined;

  if (error instanceof APIError) {
    statusCode = error.statusCode;
    errorCode = error.code || errorCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof Error) {
    // Don't leak error details in production
    message = isDevelopment ? error.message : "An unexpected error occurred";
  }

  const response: ErrorResponse = {
    error: {
      message,
      code: errorCode,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Log error for debugging (in production, send to error tracking service)
  if (statusCode >= 500) {
    console.error(`[${requestId}] Internal Server Error:`, error);
  } else if (isDevelopment) {
    console.warn(`[${requestId}] API Error:`, error);
  }

  return { response, status: statusCode };
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): { response: { data: T; timestamp: string }; status: number } {
  return {
    response: {
      data,
      timestamp: new Date().toISOString(),
    },
    status,
  };
}

/**
 * Handle API route errors consistently
 */
export function handleAPIError(error: unknown): Response {
  const apiError =
    error instanceof APIError
      ? error
      : new InternalServerError(
          error instanceof Error ? error.message : "Unknown error"
        );

  const { response, status } = createErrorResponse(apiError);

  return Response.json(response, { status });
}

/**
 * Validate environment variable exists
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new InternalServerError(
      `Missing required environment variable: ${key}`
    );
  }
  return value;
}

/**
 * Safe error message for client (no sensitive info)
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }

  // Generic message for unknown errors
  return "An unexpected error occurred. Please try again.";
}
