import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock NextAuth before importing route
const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));

vi.mock('next-auth', () => ({
  default: vi.fn(() => mockHandler),
}));

// Mock auth options
vi.mock('@/lib/auth', () => ({
  authOptions: {
    providers: [],
    callbacks: {},
  },
}));

describe('NextAuth API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandler.mockResolvedValue(new Response('OK', { status: 200 }));
  });

  it('should export GET and POST handlers', async () => {
    // Dynamically import to ensure mocks are applied
    const route = await import('../route');
    expect(route.GET).toBeDefined();
    expect(route.POST).toBeDefined();
    expect(typeof route.GET).toBe('function');
    expect(typeof route.POST).toBe('function');
  });

  it('should handle GET requests', async () => {
    const route = await import('../route');
    const req = new NextRequest('http://localhost/api/auth/signin', { method: 'GET' });
    // Handler should be callable
    const response = await route.GET(req, { params: { nextauth: ['signin'] } });
    expect(response).toBeDefined();
  });

  it('should handle POST requests', async () => {
    const route = await import('../route');
    const req = new NextRequest('http://localhost/api/auth/callback/keycloak', { method: 'POST' });
    // Handler should be callable
    const response = await route.POST(req, { params: { nextauth: ['callback', 'keycloak'] } });
    expect(response).toBeDefined();
  });
});

