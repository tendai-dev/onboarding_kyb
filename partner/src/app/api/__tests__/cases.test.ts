import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../cases/[id]/details/route';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { email: 'test@example.com', name: 'Test User' },
  }),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock fetch
global.fetch = vi.fn();

describe('Cases API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    });
  });

  it('should handle GET request for case details', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/api/cases/test-id/details'));
    const response = await GET(request, { params: { id: 'test-id' } });
    expect(response).toBeDefined();
  });

  it('should return 400 if case ID is missing', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/api/cases//details'));
    const response = await GET(request, { params: { id: '' } });
    expect(response.status).toBe(400);
  });
});

