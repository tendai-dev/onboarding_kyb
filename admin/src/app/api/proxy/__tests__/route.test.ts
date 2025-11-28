import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../[...path]/route';
import { auth } from '@/lib/auth';
import { getAccountTokensFromNextAuth } from '@/lib/redis-session';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock redis session
vi.mock('@/lib/redis-session', () => ({
  getAccountTokensFromNextAuth: vi.fn(),
  updateNextAuthAccountTokens: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock sentry
vi.mock('@/lib/sentry', () => ({
  reportApiError: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Proxy API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: {
        email: 'test@example.com',
        name: 'Test User',
        id: 'user-123',
        role: 'admin',
      },
    });
    (getAccountTokensFromNextAuth as any).mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: Date.now() + 3600000,
    });
  });

  it('should export GET handler', () => {
    expect(GET).toBeDefined();
    expect(typeof GET).toBe('function');
  });

  it('should export POST handler', () => {
    expect(POST).toBeDefined();
    expect(typeof POST).toBe('function');
  });

  it('should handle requests', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    });

    const request = new NextRequest('http://localhost:3000/api/proxy/api/v1/test');
    const response = await GET(request);

    expect(response).toBeDefined();
    expect(response.status).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/proxy/api/v1/test');
    const response = await GET(request);

    expect(response).toBeDefined();
    expect([502, 503]).toContain(response.status);
  });
});

