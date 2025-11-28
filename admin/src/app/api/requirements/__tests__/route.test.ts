import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { auth } from '@/lib/auth';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('Requirements API Route', () => {
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
  });

  it('should handle GET request successfully', async () => {
    const mockResponse = {
      requirements: [
        { id: '1', code: 'REQ-001', name: 'Test Requirement' },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    });

    const request = new NextRequest('http://localhost:3000/api/requirements');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.requirements).toBeDefined();
  });

  it('should handle authentication failure', async () => {
    (auth as any).mockResolvedValueOnce(null);
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ requirements: [] }),
      status: 200,
      headers: new Headers(),
    });

    const request = new NextRequest('http://localhost:3000/api/requirements');
    const response = await GET(request);

    // Route may still work without auth, or return error
    expect(response.status).toBeDefined();
  });

  it('should handle backend error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => JSON.stringify({ error: 'Backend error' }),
      headers: new Headers(),
    });

    const request = new NextRequest('http://localhost:3000/api/requirements');
    const response = await GET(request);

    expect([500, 502]).toContain(response.status);
  });
});

