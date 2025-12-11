import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE, PATCH, OPTIONS } from '../proxy/[...path]/route';

// Mock auth from lib/auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/redis-session', () => ({
  getAccountTokensFromNextAuth: vi.fn(),
  updateNextAuthAccountTokens: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Proxy API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    });
  });

  const createMockRequest = (method: string, path: string) => {
    const url = new URL(`http://localhost:3000${path}`);
    return new NextRequest(url, { method });
  };

  it('should handle GET requests', async () => {
    const request = createMockRequest('GET', '/api/proxy/api/v1/test');
    const response = await GET(request);
    expect(response).toBeDefined();
  });

  it('should handle POST requests', async () => {
    const request = createMockRequest('POST', '/api/proxy/api/v1/test');
    const response = await POST(request);
    expect(response).toBeDefined();
  });

  it('should handle PUT requests', async () => {
    const request = createMockRequest('PUT', '/api/proxy/api/v1/test');
    const response = await PUT(request);
    expect(response).toBeDefined();
  });

  it('should handle DELETE requests', async () => {
    const request = createMockRequest('DELETE', '/api/proxy/api/v1/test');
    const response = await DELETE(request);
    expect(response).toBeDefined();
  });

  it('should handle PATCH requests', async () => {
    const request = createMockRequest('PATCH', '/api/proxy/api/v1/test');
    const response = await PATCH(request);
    expect(response).toBeDefined();
  });

  it('should handle OPTIONS requests', async () => {
    const request = createMockRequest('OPTIONS', '/api/proxy/api/v1/test');
    const response = await OPTIONS(request);
    expect(response).toBeDefined();
  });
});
