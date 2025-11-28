import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock global fetch
global.fetch = vi.fn();

describe('Test Token Exchange API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.KEYCLOAK_ISSUER = 'https://keycloak.example.com/realms/test';
    process.env.KEYCLOAK_CLIENT_ID = 'test-client';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  it('should return error if code is missing', async () => {
    const req = new NextRequest('http://localhost/api/auth/test-token-exchange', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing authorization code');
  });

  it('should attempt token exchange with code', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    });

    const req = new NextRequest('http://localhost/api/auth/test-token-exchange?code=test-code', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.hasAccessToken).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle token exchange errors', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => JSON.stringify({ error: 'invalid_grant' }),
    });

    const req = new NextRequest('http://localhost/api/auth/test-token-exchange?code=invalid-code', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const req = new NextRequest('http://localhost/api/auth/test-token-exchange?code=test-code', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should include client secret when set', async () => {
    process.env.KEYCLOAK_CLIENT_SECRET = 'test-secret';
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'test' }),
    });

    const req = new NextRequest('http://localhost/api/auth/test-token-exchange?code=test-code', { method: 'GET' });
    await GET(req);

    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[1].body).toContain('client_secret');
  });
});

