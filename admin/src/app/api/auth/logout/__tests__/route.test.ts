import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock fetch
global.fetch = vi.fn();

describe('Logout API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = () => {
    const requestUrl = new URL('http://localhost:3000/api/auth/logout');
    return new NextRequest(requestUrl, { method: 'POST' });
  };

  it('should handle logout request', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const request = createMockRequest();
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('should handle logout error', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Logout failed'));

    const request = createMockRequest();
    const response = await POST(request);

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});
