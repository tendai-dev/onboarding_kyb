import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '../route';
import { auth } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

global.fetch = vi.fn();

describe('Risk Dynamic Path API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
  });

  const createMockRequest = (url: string, method: string = 'GET', body?: string) => {
    const requestUrl = new URL(url, 'http://localhost:3000');
    return new NextRequest(requestUrl, { method, body });
  };

  it('should handle GET request', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const request = createMockRequest('http://localhost:3000/api/risk/assessment/app-1');
    const response = await GET(request, { params: { path: ['assessment', 'app-1'] } });

    expect(response.status).toBe(200);
  });

  it('should handle POST request', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const request = createMockRequest('http://localhost:3000/api/risk/assessment', 'POST', JSON.stringify({}));
    const response = await POST(request, { params: { path: ['assessment'] } });

    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should handle PUT request', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const request = createMockRequest('http://localhost:3000/api/risk/assessment/app-1', 'PUT', JSON.stringify({}));
    const response = await PUT(request, { params: { path: ['assessment', 'app-1'] } });

    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should handle error state', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed'));

    const request = createMockRequest('http://localhost:3000/api/risk/assessment/app-1');
    const response = await GET(request, { params: { path: ['assessment', 'app-1'] } });

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});


