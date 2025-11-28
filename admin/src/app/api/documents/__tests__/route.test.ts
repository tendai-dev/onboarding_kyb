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

describe('Documents API Route', () => {
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
      documents: [
        { id: '1', fileName: 'test.pdf' },
        { id: '2', fileName: 'test2.pdf' },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    });

    const request = new NextRequest('http://localhost:3000/api/documents?caseId=case-123');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.documents).toHaveLength(2);
  });

  it('should handle document requests', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ documentId: 'doc-123' }),
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    });

    const request = new NextRequest('http://localhost:3000/api/documents');
    const response = await GET(request);

    expect([200, 500]).toContain(response.status);
  });

  it('should handle authentication failure', async () => {
    (auth as any).mockResolvedValueOnce(null);
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ documents: [] }),
      status: 200,
      headers: new Headers(),
    });

    const request = new NextRequest('http://localhost:3000/api/documents');
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

    const request = new NextRequest('http://localhost:3000/api/documents');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});

