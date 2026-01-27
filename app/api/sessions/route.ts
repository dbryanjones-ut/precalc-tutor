/**
 * Sessions API Route
 *
 * Manages AI tutoring sessions with CRUD operations.
 * Uses IndexedDB on client-side, this provides backup/sync capabilities.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  sessionFilterSchema,
  sessionCreateSchema,
  validateQuery,
} from "@/lib/api/validation";
import {
  handleAPIError,
  ValidationError,
  NotFoundError,
} from "@/lib/api/errors";
import {
  checkRateLimit,
  getRateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/api/rate-limiter";
import type { AITutoringSession } from "@/types/ai-session";
import { z } from "zod";

/**
 * In-memory session storage (for demo purposes)
 * In production, replace with database (PostgreSQL, MongoDB, etc.)
 */
const sessionStore = new Map<string, AITutoringSession>();

/**
 * Filter and paginate sessions
 */
function filterSessions(
  sessions: AITutoringSession[],
  filter: z.infer<typeof sessionFilterSchema>
): {
  data: AITutoringSession[];
  total: number;
  page: number;
  totalPages: number;
} {
  let filtered = [...sessions];

  // Apply filters
  if (filter.startDate) {
    const startDate = new Date(filter.startDate);
    filtered = filtered.filter(
      (s) => new Date(s.timestamp) >= startDate
    );
  }

  if (filter.endDate) {
    const endDate = new Date(filter.endDate);
    filtered = filtered.filter(
      (s) => new Date(s.timestamp) <= endDate
    );
  }

  if (filter.mode) {
    filtered = filtered.filter((s) => s.mode === filter.mode);
  }

  if (filter.completed !== undefined) {
    filtered = filtered.filter((s) => s.completed === filter.completed);
  }

  if (filter.unit) {
    filtered = filtered.filter((s) => s.unit === filter.unit);
  }

  if (filter.tags && filter.tags.length > 0) {
    filtered = filtered.filter((s) =>
      filter.tags!.some((tag) => s.tags.includes(tag))
    );
  }

  // Sort
  filtered.sort((a, b) => {
    const aValue = a[filter.sortBy!];
    const bValue = b[filter.sortBy!];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return filter.sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return filter.sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Paginate
  const total = filtered.length;
  const totalPages = Math.ceil(total / filter.limit!);
  const startIndex = (filter.page! - 1) * filter.limit!;
  const endIndex = startIndex + filter.limit!;
  const paginatedData = filtered.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total,
    page: filter.page!,
    totalPages,
  };
}

/**
 * Calculate session statistics
 */
function calculateStats(sessions: AITutoringSession[]): {
  totalSessions: number;
  completedSessions: number;
  totalDuration: number;
  averageDuration: number;
  totalQuestionsAsked: number;
  averageQuestionsPerSession: number;
  modeBreakdown: Record<string, number>;
  unitBreakdown: Record<string, number>;
} {
  const completed = sessions.filter((s) => s.completed);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalQuestionsAsked = sessions.reduce(
    (sum, s) => sum + s.questionsAsked,
    0
  );

  const modeBreakdown: Record<string, number> = {};
  const unitBreakdown: Record<string, number> = {};

  for (const session of sessions) {
    modeBreakdown[session.mode] = (modeBreakdown[session.mode] || 0) + 1;
    if (session.unit) {
      unitBreakdown[session.unit] = (unitBreakdown[session.unit] || 0) + 1;
    }
  }

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    totalDuration,
    averageDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
    totalQuestionsAsked,
    averageQuestionsPerSession:
      sessions.length > 0 ? totalQuestionsAsked / sessions.length : 0,
    modeBreakdown,
    unitBreakdown,
  };
}

/**
 * GET handler - Fetch sessions with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const { allowed, remaining, resetTime } = checkRateLimit(
      request,
      RATE_LIMITS.SESSIONS.limit,
      RATE_LIMITS.SESSIONS.windowMs
    );

    const rateLimitHeaders = getRateLimitHeaders(
      RATE_LIMITS.SESSIONS.limit,
      remaining,
      resetTime
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            message: "Rate limit exceeded. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            details: { resetTime },
          },
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    // 2. Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    let filter;

    try {
      filter = validateQuery(searchParams, sessionFilterSchema);
    } catch (error) {
      throw new ValidationError(
        error instanceof Error ? error.message : "Invalid query parameters"
      );
    }

    // 3. Get all sessions from store
    const allSessions = Array.from(sessionStore.values());

    // 4. Apply filters and pagination
    const result = filterSessions(allSessions, filter);

    // 5. Calculate statistics if requested
    const includeStats = searchParams.get("includeStats") === "true";
    const stats = includeStats ? calculateStats(allSessions) : undefined;

    // 6. Return response
    return NextResponse.json(
      {
        data: {
          sessions: result.data,
          pagination: {
            page: result.page,
            limit: filter.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
          ...(stats && { stats }),
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Sessions GET API Error:", error);
    return handleAPIError(error);
  }
}

/**
 * POST handler - Create new session
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const { allowed, remaining, resetTime } = checkRateLimit(
      request,
      RATE_LIMITS.SESSIONS.limit,
      RATE_LIMITS.SESSIONS.windowMs
    );

    const rateLimitHeaders = getRateLimitHeaders(
      RATE_LIMITS.SESSIONS.limit,
      remaining,
      resetTime
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            message: "Rate limit exceeded. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            details: { resetTime },
          },
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    // 2. Validate request body
    let validatedData;
    try {
      const body = await request.json();
      validatedData = sessionCreateSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Invalid session data", {
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      throw error;
    }

    // 3. Create session object
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const session: AITutoringSession = {
      id: sessionId,
      timestamp: now,
      lastUpdated: now,
      ...validatedData,
    };

    // 4. Store session
    sessionStore.set(sessionId, session);

    // 5. Return created session
    return NextResponse.json(
      {
        data: session,
        timestamp: new Date().toISOString(),
      },
      {
        status: 201,
        headers: {
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Sessions POST API Error:", error);
    return handleAPIError(error);
  }
}

/**
 * DELETE handler - Delete session by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Rate limiting
    const { allowed, remaining, resetTime } = checkRateLimit(
      request,
      RATE_LIMITS.SESSIONS.limit,
      RATE_LIMITS.SESSIONS.windowMs
    );

    const rateLimitHeaders = getRateLimitHeaders(
      RATE_LIMITS.SESSIONS.limit,
      remaining,
      resetTime
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            message: "Rate limit exceeded. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            details: { resetTime },
          },
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    // 2. Get session ID from query params
    const sessionId = request.nextUrl.searchParams.get("id");

    if (!sessionId) {
      throw new ValidationError("Session ID is required");
    }

    // Validate session ID format
    if (!sessionId.startsWith("session-")) {
      throw new ValidationError("Invalid session ID format");
    }

    // 3. Check if session exists
    if (!sessionStore.has(sessionId)) {
      throw new NotFoundError("Session");
    }

    // 4. Delete session
    sessionStore.delete(sessionId);

    // 5. Return success response
    return NextResponse.json(
      {
        data: {
          message: "Session deleted successfully",
          sessionId,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Sessions DELETE API Error:", error);
    return handleAPIError(error);
  }
}

/**
 * OPTIONS handler - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
