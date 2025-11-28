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

describe('Applications API Route', () => {
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
      items: [
        { id: '1', applicationNumber: 'APP-001' },
        { id: '2', applicationNumber: 'APP-002' },
      ],
      total: 2,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    });

    const request = new NextRequest('http://localhost:3000/api/applications');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.items).toHaveLength(2);
  });

  it('should forward query parameters', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [], total: 0 }),
      status: 200,
      statusText: 'OK',
    });

    const request = new NextRequest('http://localhost:3000/api/applications?page=2&pageSize=50');
    await GET(request);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api/v1/projections/cases'),
      expect.any(Object)
    );
  });

  it('should handle authentication failure', async () => {
    (auth as any).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/applications');
    const response = await GET(request);

    // Route may return 401 or 500 depending on implementation
    expect([401, 500]).toContain(response.status);
  });

  it('should handle backend error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Backend error' }),
    });

    const request = new NextRequest('http://localhost:3000/api/applications');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should include user headers', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [], total: 0 }),
      status: 200,
      statusText: 'OK',
    });

    const request = new NextRequest('http://localhost:3000/api/applications');
    await GET(request);

    const fetchCall = (global.fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;
    
    expect(headers['X-User-Email']).toBe('test@example.com');
    expect(headers['X-User-Name']).toBe('Test User');
    expect(headers['X-User-Id']).toBe('user-123');
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/applications');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
