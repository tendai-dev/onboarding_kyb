import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

import { getToken } from 'next-auth/jwt';

describe('Test Callback API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.KEYCLOAK_ISSUER = 'https://keycloak.example.com/realms/test';
    process.env.KEYCLOAK_CLIENT_ID = 'test-client';
  });

  it('should return token info when token exists', async () => {
    (getToken as any).mockResolvedValue({
      sessionId: 'test-session',
      user: { email: 'test@example.com' },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/auth/test-callback', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.hasToken).toBe(true);
    expect(data.tokenInfo).toBeDefined();
  });

  it('should handle missing token', async () => {
    (getToken as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/auth/test-callback', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.hasToken).toBe(false);
  });

  it('should handle token errors', async () => {
    (getToken as any).mockResolvedValue({
      error: 'RefreshTokenError',
    });

    const req = new NextRequest('http://localhost/api/auth/test-callback', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tokenInfo.hasError).toBe(true);
    expect(data.tokenInfo.error).toBe('RefreshTokenError');
  });

  it('should handle getToken errors', async () => {
    (getToken as any).mockRejectedValue(new Error('Token error'));

    const req = new NextRequest('http://localhost/api/auth/test-callback', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should return config information', async () => {
    (getToken as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/auth/test-callback', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(data.config).toBeDefined();
    expect(data.config.nextAuthUrl).toBe('http://localhost:3000');
    expect(data.config.hasNextAuthSecret).toBe(true);
  });
});

