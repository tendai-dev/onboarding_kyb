/**
 * Email Rate Limiting
 * Prevents sending too many emails in a short period
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const RATE_LIMITS = {
  // Max emails per hour
  perHour: 10,
  // Max emails per day
  perDay: 50,
  // Max emails per minute (burst protection)
  perMinute: 3,
};

const STORAGE_KEY = 'email_rate_limit';

/**
 * Check if email can be sent based on rate limits
 */
export function canSendEmail(): { allowed: boolean; reason?: string; retryAfter?: number } {
  if (typeof window === 'undefined') {
    return { allowed: true };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const limits: Record<string, RateLimitEntry> = stored ? JSON.parse(stored) : {};

    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Check per-minute limit
    const minuteEntries = Object.values(limits).filter(
      (entry) => entry.resetTime > oneMinuteAgo
    );
    if (minuteEntries.length >= RATE_LIMITS.perMinute) {
      const oldestEntry = minuteEntries.reduce((oldest, entry) =>
        entry.resetTime < oldest.resetTime ? entry : oldest
      );
      const retryAfter = Math.ceil((oldestEntry.resetTime - oneMinuteAgo) / 1000);
      return {
        allowed: false,
        reason: `Too many emails sent in the last minute. Please wait ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    // Check per-hour limit
    const hourEntries = Object.values(limits).filter(
      (entry) => entry.resetTime > oneHourAgo
    );
    if (hourEntries.length >= RATE_LIMITS.perHour) {
      const oldestEntry = hourEntries.reduce((oldest, entry) =>
        entry.resetTime < oldest.resetTime ? entry : oldest
      );
      const retryAfter = Math.ceil((oldestEntry.resetTime - oneHourAgo) / 1000);
      return {
        allowed: false,
        reason: `Too many emails sent in the last hour. Please wait ${Math.ceil(retryAfter / 60)} minutes.`,
        retryAfter,
      };
    }

    // Check per-day limit
    const dayEntries = Object.values(limits).filter(
      (entry) => entry.resetTime > oneDayAgo
    );
    if (dayEntries.length >= RATE_LIMITS.perDay) {
      const oldestEntry = dayEntries.reduce((oldest, entry) =>
        entry.resetTime < oldest.resetTime ? entry : oldest
      );
      const retryAfter = Math.ceil((oldestEntry.resetTime - oneDayAgo) / 1000);
      return {
        allowed: false,
        reason: `Daily email limit reached. Please try again tomorrow.`,
        retryAfter,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Failed to check rate limit:', error);
    // On error, allow sending (fail open)
    return { allowed: true };
  }
}

/**
 * Record an email send attempt for rate limiting
 */
export function recordEmailSend(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const limits: Record<string, RateLimitEntry> = stored ? JSON.parse(stored) : {};

    const now = Date.now();
    const entryId = `email_${now}_${Math.random()}`;

    limits[entryId] = {
      count: 1,
      resetTime: now,
    };

    // Clean up old entries (older than 24 hours)
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    Object.keys(limits).forEach((key) => {
      if (limits[key].resetTime < oneDayAgo) {
        delete limits[key];
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(limits));
  } catch (error) {
    console.error('Failed to record email send:', error);
  }
}

/**
 * Get current rate limit statistics
 */
export function getRateLimitStats(): {
  perMinute: number;
  perHour: number;
  perDay: number;
  limits: typeof RATE_LIMITS;
} {
  if (typeof window === 'undefined') {
    return {
      perMinute: 0,
      perHour: 0,
      perDay: 0,
      limits: RATE_LIMITS,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const limits: Record<string, RateLimitEntry> = stored ? JSON.parse(stored) : {};

    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const minuteEntries = Object.values(limits).filter(
      (entry) => entry.resetTime > oneMinuteAgo
    );
    const hourEntries = Object.values(limits).filter(
      (entry) => entry.resetTime > oneHourAgo
    );
    const dayEntries = Object.values(limits).filter(
      (entry) => entry.resetTime > oneDayAgo
    );

    return {
      perMinute: minuteEntries.length,
      perHour: hourEntries.length,
      perDay: dayEntries.length,
      limits: RATE_LIMITS,
    };
  } catch (error) {
    console.error('Failed to get rate limit stats:', error);
    return {
      perMinute: 0,
      perHour: 0,
      perDay: 0,
      limits: RATE_LIMITS,
    };
  }
}

/**
 * Clear rate limit data (for testing or reset)
 */
export function clearRateLimits(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    console.info('Rate limits cleared');
  } catch (error) {
    console.error('Failed to clear rate limits:', error);
  }
}

