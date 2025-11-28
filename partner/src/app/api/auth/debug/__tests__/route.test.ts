import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock global fetch
global.fetch = vi.fn();

describe('Auth Debug API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.KEYCLOAK_ISSUER = 'https://keycloak.example.com/realms/test';
    process.env.KEYCLOAK_CLIENT_ID = 'test-client';
  });

  it('should return debug configuration', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        authorization_endpoint: 'https://keycloak.example.com/auth',
        token_endpoint: 'https://keycloak.example.com/token',
      }),
    });

    const req = new NextRequest('http://localhost/api/auth/debug', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('config');
    expect(data).toHaveProperty('keycloak');
    expect(data).toHaveProperty('diagnostics');
  });

  it('should handle Keycloak fetch errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const req = new NextRequest('http://localhost/api/auth/debug', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.keycloak.reachable).toBe(false);
    expect(data.keycloak.error).toBeDefined();
  });

  it('should detect missing environment variables', async () => {
    delete process.env.NEXTAUTH_URL;
    delete process.env.KEYCLOAK_ISSUER;

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const req = new NextRequest('http://localhost/api/auth/debug', { method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.diagnostics.issues.length).toBeGreaterThan(0);
  });
});

