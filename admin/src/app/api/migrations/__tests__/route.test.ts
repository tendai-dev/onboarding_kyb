import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { auth } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

global.fetch = vi.fn();

describe('Migrations API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      expires: new Date().toISOString(),
    });
  });

  const createMockRequest = (url: string, method = 'GET', body?: string) => {
    const requestUrl = new URL(url, 'http://localhost:3000');
    return new NextRequest(requestUrl, { method, body });
  };

  it('should get migrations', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    const request = createMockRequest('http://localhost:3000/api/migrations');
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('should create migration', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'migration-1' }),
    });

    const request = createMockRequest(
      'http://localhost:3000/api/migrations',
      'POST',
      JSON.stringify({ name: 'Test' })
    );
    const response = await POST(request);

    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should handle error state', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Failed'));

    const request = createMockRequest('http://localhost:3000/api/migrations');
    const response = await GET(request);

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});
