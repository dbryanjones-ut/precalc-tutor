/**
 * Rate Limiter - Prevents abuse of API endpoints
 *
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, consider Redis-based rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if request should be allowed
   * Returns true if allowed, false if rate limited
   */
  check(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // No existing entry or expired
    if (!entry || entry.resetTime < now) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    // Still within rate limit
    if (entry.count < limit) {
      entry.count++;
      return true;
    }

    // Rate limited
    return false;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string, limit: number): number {
    const entry = this.store.get(identifier);
    if (!entry || entry.resetTime < Date.now()) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  /**
   * Get time until reset (in seconds)
   */
  getResetTime(identifier: string): number {
    const entry = this.store.get(identifier);
    if (!entry || entry.resetTime < Date.now()) {
      return 0;
    }
    return Math.ceil((entry.resetTime - Date.now()) / 1000);
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear() {
    this.store.clear();
  }

  /**
   * Cleanup on shutdown
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Global instance
const rateLimiter = new RateLimiter();

// Default rate limits
export const RATE_LIMITS = {
  AI_TUTOR: { limit: 10, windowMs: 60000 }, // 10 requests per minute
  OCR: { limit: 5, windowMs: 60000 }, // 5 requests per minute (OCR is expensive)
  SESSIONS: { limit: 30, windowMs: 60000 }, // 30 requests per minute
} as const;

/**
 * Get client identifier from request
 * Uses IP address (or X-Forwarded-For header in production)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (for proxied requests)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  // In production, you'd want better client identification
  return "anonymous";
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: Request,
  limit: number,
  windowMs: number
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const identifier = getClientIdentifier(request);
  const allowed = rateLimiter.check(identifier, limit, windowMs);
  const remaining = rateLimiter.getRemaining(identifier, limit);
  const resetTime = rateLimiter.getResetTime(identifier);

  return { allowed, remaining, resetTime };
}

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": resetTime.toString(),
  };
}

export default rateLimiter;
