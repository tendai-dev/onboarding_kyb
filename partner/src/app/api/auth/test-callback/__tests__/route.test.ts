import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock auth from lib/auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth';

describe('Test Callback API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use vi.stubEnv for read-only properties like NODE_ENV
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
    vi.stubEnv('NEXTAUTH_SECRET', 'test-secret');
    vi.stubEnv('KEYCLOAK_ISSUER', 'https://keycloak.example.com/realms/test');
    vi.stubEnv('KEYCLOAK_CLIENT_ID', 'test-client');
  });

  it('should return session info when session exists', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/auth/test-callback', {
      method: 'GET',
    });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.hasSession).toBe(true);
    expect(data.sessionInfo).toBeDefined();
    expect(data.sessionInfo.userEmail).toBe('test@example.com');
  });

  it('should handle missing session', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/auth/test-callback', {
      method: 'GET',
    });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.hasSession).toBe(false);
  });

  it('should handle session errors', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: null,
      error: 'SessionError',
    });

    const req = new NextRequest('http://localhost/api/auth/test-callback', {
      method: 'GET',
    });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessionInfo.hasError).toBe(true);
    expect(data.sessionInfo.error).toBe('SessionError');
  });

  it('should handle auth errors', async () => {
    vi.mocked(auth).mockRejectedValue(new Error('Auth error'));

    const req = new NextRequest('http://localhost/api/auth/test-callback', {
      method: 'GET',
    });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should return config information', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/auth/test-callback', {
      method: 'GET',
    });
    const response = await GET(req);
    const data = await response.json();

    expect(data.config).toBeDefined();
    expect(data.config.nextAuthUrl).toBe('http://localhost:3000');
    expect(data.config.hasNextAuthSecret).toBe(true);
    expect(data.config.sessionStrategy).toBe('database');
  });
});
