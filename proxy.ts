import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (use Redis in production for distributed systems)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute
const AI_RATE_LIMIT_MAX = 30; // 30 AI requests per minute

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetTime) {
      rateLimit.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getRateLimitKey(request: NextRequest, prefix = 'general'): string {
  // Use IP address for rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  return `${prefix}:${ip}`;
}

function checkRateLimit(key: string, max: number): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimit.get(key);

  if (!record || now > record.resetTime) {
    // Create new rate limit record
    rateLimit.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return {
      allowed: true,
      remaining: max - 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }

  // Increment existing record
  record.count++;

  return {
    allowed: record.count <= max,
    remaining: Math.max(0, max - record.count),
    resetTime: record.resetTime,
  };
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Apply stricter rate limiting for AI API routes
  const isAIRoute = pathname.startsWith('/api/ai') || pathname.startsWith('/api/tutor');
  const maxRequests = isAIRoute ? AI_RATE_LIMIT_MAX : RATE_LIMIT_MAX;
  const key = getRateLimitKey(request, isAIRoute ? 'ai' : 'general');

  const { allowed, remaining, resetTime } = checkRateLimit(key, maxRequests);

  // Add rate limit headers to response
  const response = allowed
    ? NextResponse.next()
    : NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );

  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

  if (!allowed) {
    response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
  }

  // Security headers (additional layer on top of next.config.ts)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
