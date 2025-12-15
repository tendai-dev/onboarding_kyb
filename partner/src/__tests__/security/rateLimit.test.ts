import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimiter, checkRateLimit } from '@/lib/rateLimit';

describe('Rate Limiting Security Tests', () => {
  beforeEach(() => {
    rateLimiter.clear();
  });

  describe('rateLimiter', () => {
    it('should allow requests under the limit', () => {
      const key = 'test-user@example.com';
      const maxRequests = 10;
      const windowMs = 60000;

      for (let i = 0; i < maxRequests; i++) {
        const isLimited = rateLimiter.isRateLimited(key, maxRequests, windowMs);
        expect(isLimited).toBe(false);
      }
    });

    it('should block requests over the limit', () => {
      const key = 'test-user@example.com';
      const maxRequests = 5;
      const windowMs = 60000;

      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        rateLimiter.isRateLimited(key, maxRequests, windowMs);
      }

      // Next request should be blocked
      const isLimited = rateLimiter.isRateLimited(key, maxRequests, windowMs);
      expect(isLimited).toBe(true);
    });

    it('should track different keys separately', () => {
      const key1 = 'user1@example.com';
      const key2 = 'user2@example.com';
      const maxRequests = 5;
      const windowMs = 60000;

      // Max out key1
      for (let i = 0; i < maxRequests + 1; i++) {
        rateLimiter.isRateLimited(key1, maxRequests, windowMs);
      }

      // key1 should be blocked
      expect(rateLimiter.isRateLimited(key1, maxRequests, windowMs)).toBe(true);

      // key2 should still be allowed
      expect(rateLimiter.isRateLimited(key2, maxRequests, windowMs)).toBe(false);
    });

    it('should reset after window expires', async () => {
      const key = 'test-user@example.com';
      const maxRequests = 5;
      const windowMs = 100; // Short window for testing

      // Max out requests
      for (let i = 0; i < maxRequests + 1; i++) {
        rateLimiter.isRateLimited(key, maxRequests, windowMs);
      }

      expect(rateLimiter.isRateLimited(key, maxRequests, windowMs)).toBe(true);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, windowMs + 10));

      // Should be allowed again
      expect(rateLimiter.isRateLimited(key, maxRequests, windowMs)).toBe(false);
    });

    it('should provide correct remaining requests count', () => {
      const key = 'test-user@example.com';
      const maxRequests = 10;
      const windowMs = 60000;

      expect(rateLimiter.getRemainingRequests(key, maxRequests)).toBe(maxRequests);

      rateLimiter.isRateLimited(key, maxRequests, windowMs);
      expect(rateLimiter.getRemainingRequests(key, maxRequests)).toBe(maxRequests - 1);

      rateLimiter.isRateLimited(key, maxRequests, windowMs);
      expect(rateLimiter.getRemainingRequests(key, maxRequests)).toBe(maxRequests - 2);
    });

    it('should allow manual blocking of keys', () => {
      const key = 'malicious-user@example.com';
      
      rateLimiter.blockKey(key, 60000);
      
      expect(rateLimiter.isRateLimited(key, 100, 60000)).toBe(true);
    });

    it('should allow unblocking of keys', () => {
      const key = 'test-user@example.com';
      
      rateLimiter.blockKey(key, 60000);
      expect(rateLimiter.isRateLimited(key, 100, 60000)).toBe(true);
      
      rateLimiter.unblockKey(key);
      expect(rateLimiter.isRateLimited(key, 100, 60000)).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    it('should return null when not rate limited', () => {
      const key = 'test-user@example.com';
      const result = checkRateLimit(key, 100, 60000);
      
      expect(result).toBeNull();
    });

    it('should return 429 response when rate limited', () => {
      const key = 'test-user@example.com';
      const maxRequests = 5;
      const windowMs = 60000;

      // Max out requests
      for (let i = 0; i < maxRequests + 1; i++) {
        checkRateLimit(key, maxRequests, windowMs);
      }

      const result = checkRateLimit(key, maxRequests, windowMs);
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);
      expect(result?.body.error).toBe('Too Many Requests');
    });

    it('should include retry-after header', () => {
      const key = 'test-user@example.com';
      const maxRequests = 5;
      const windowMs = 60000;

      // Max out requests
      for (let i = 0; i < maxRequests + 1; i++) {
        checkRateLimit(key, maxRequests, windowMs);
      }

      const result = checkRateLimit(key, maxRequests, windowMs);
      
      expect(result?.headers['Retry-After']).toBeDefined();
      expect(parseInt(result?.headers['Retry-After'] || '0')).toBeGreaterThan(0);
    });
  });
});
