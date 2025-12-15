/**
 * Rate Limiting Utility
 * Prevents brute force attacks and API abuse
 */

import { logSuspiciousActivity } from './securityAudit';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * @param key - Unique identifier (e.g., IP address, user email, or combination)
   * @param maxRequests - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns true if request should be blocked
   */
  isRateLimited(key: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry) {
      // First request from this key
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs,
        blocked: false,
      });
      return false;
    }

    // Check if window has expired
    if (now > entry.resetTime) {
      // Reset the window
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs,
        blocked: false,
      });
      return false;
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      if (!entry.blocked) {
        // First time blocking - log suspicious activity
        entry.blocked = true;
        console.warn(`[RateLimit] Blocking ${key} - ${entry.count} requests in window`);
        logSuspiciousActivity(key, 'rate_limit_exceeded', {
          count: entry.count,
          maxRequests,
          windowMs,
        });
      }
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for a key
   */
  getRemainingRequests(key: string, maxRequests: number = 100): number {
    const entry = this.requests.get(key);
    if (!entry) return maxRequests;

    const now = Date.now();
    if (now > entry.resetTime) return maxRequests;

    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get time until rate limit resets (in seconds)
   */
  getResetTime(key: string): number {
    const entry = this.requests.get(key);
    if (!entry) return 0;

    const now = Date.now();
    if (now > entry.resetTime) return 0;

    return Math.ceil((entry.resetTime - now) / 1000);
  }

  /**
   * Manually block a key (e.g., after detecting malicious behavior)
   */
  blockKey(key: string, durationMs: number = 3600000): void {
    const now = Date.now();
    this.requests.set(key, {
      count: 9999,
      resetTime: now + durationMs,
      blocked: true,
    });
    console.warn(`[RateLimit] Manually blocked ${key} for ${durationMs}ms`);
  }

  /**
   * Unblock a key
   */
  unblockKey(key: string): void {
    this.requests.delete(key);
    console.info(`[RateLimit] Unblocked ${key}`);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.info(`[RateLimit] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalKeys: number;
    blockedKeys: number;
    activeRequests: number;
  } {
    let blockedKeys = 0;
    let activeRequests = 0;

    for (const entry of this.requests.values()) {
      if (entry.blocked) blockedKeys++;
      activeRequests += entry.count;
    }

    return {
      totalKeys: this.requests.size,
      blockedKeys,
      activeRequests,
    };
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
    console.info('[RateLimit] Cleared all rate limit data');
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware for API routes
 * @param key - Unique identifier for the request
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Response object if rate limited, null otherwise
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { status: number; headers: Record<string, string>; body: any } | null {
  const isLimited = rateLimiter.isRateLimited(key, maxRequests, windowMs);

  if (isLimited) {
    const resetTime = rateLimiter.getResetTime(key);
    return {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(resetTime),
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetTime),
      },
      body: {
        error: 'Too Many Requests',
        details: `Rate limit exceeded. Please try again in ${resetTime} seconds.`,
        retryAfter: resetTime,
      },
    };
  }

  // Add rate limit headers to successful responses
  const remaining = rateLimiter.getRemainingRequests(key, maxRequests);
  const resetTime = rateLimiter.getResetTime(key);

  return null; // Not rate limited
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  key: string,
  maxRequests: number = 100
): Record<string, string> {
  const remaining = rateLimiter.getRemainingRequests(key, maxRequests);
  const resetTime = rateLimiter.getResetTime(key);

  return {
    'X-RateLimit-Limit': String(maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetTime),
  };
}
