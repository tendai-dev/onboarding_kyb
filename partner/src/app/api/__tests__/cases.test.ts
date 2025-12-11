import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../cases/[id]/details/route';

// Mock auth from lib/auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Cases API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    });
  });

  it('should handle GET request for case details', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/cases/test-id/details')
    );
    const response = await GET(request, { params: { id: 'test-id' } });
    expect(response).toBeDefined();
  });

  it('should return 400 if case ID is missing', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/api/cases//details'));
    const response = await GET(request, { params: { id: '' } });
    expect(response.status).toBe(400);
  });
});
