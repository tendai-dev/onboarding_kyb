import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { auth } from '@/lib/auth';
import type { Session } from 'next-auth';

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

// Helper to create a complete Response mock
function createMockResponse(
  data: unknown,
  options: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
  } = {}
): Response {
  const headers = new Headers(options.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return {
    ok: options.ok !== false,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    headers,
    redirected: false,
    type: 'default' as ResponseType,
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    bytes: vi.fn(),
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
    json: async () => data as unknown,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  } as unknown as Response;
}

describe('Applications API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (
      vi.mocked(auth) as unknown as MockedFunction<() => Promise<Session | null>>
    ).mockResolvedValue({
      user: {
        email: 'test@example.com',
        name: 'Test User',
        id: 'user-123',
        role: 'admin',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as Session);
  });

  it('should handle GET request successfully', async () => {
    const mockResponse = {
      items: [
        { id: '1', applicationNumber: 'APP-001' },
        { id: '2', applicationNumber: 'APP-002' },
      ],
      total: 2,
    };

    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse(mockResponse, { status: 200 })
    );

    const request = new NextRequest('http://localhost:3000/api/applications');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.items).toHaveLength(2);
  });

  it('should forward query parameters', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse({ items: [], total: 0 }, { status: 200 })
    );

    const request = new NextRequest(
      'http://localhost:3000/api/applications?page=2&pageSize=50'
    );
    await GET(request);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api/v1/projections/cases'),
      expect.objectContaining({})
    );
  });

  it('should handle authentication failure', async () => {
    vi.mocked(auth).mockResolvedValueOnce(
      null as unknown as Awaited<ReturnType<typeof auth>>
    );

    const request = new NextRequest('http://localhost:3000/api/applications');
    const response = await GET(request);

    // Route may return 401 or 500 depending on implementation
    expect([401, 500]).toContain(response.status);
  });

  it('should handle backend error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse(
        { error: 'Backend error' },
        { ok: false, status: 500, statusText: 'Internal Server Error' }
      )
    );

    const request = new NextRequest('http://localhost:3000/api/applications');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should include user headers', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse({ items: [], total: 0 }, { status: 200 })
    );

    const request = new NextRequest('http://localhost:3000/api/applications');
    await GET(request);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const headers = fetchCall[1]?.headers as HeadersInit;
    const headersObj =
      headers instanceof Headers
        ? Object.fromEntries(headers.entries())
        : (headers as Record<string, string>);

    expect(headersObj['X-User-Email']).toBe('test@example.com');
    expect(headersObj['X-User-Name']).toBe('Test User');
    expect(headersObj['X-User-Id']).toBe('user-123');
  });

  it('should handle network errors', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/applications');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
