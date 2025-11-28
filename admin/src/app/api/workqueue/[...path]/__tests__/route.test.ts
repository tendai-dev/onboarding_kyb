import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE, PATCH } from '../route';
import { auth } from '@/lib/auth';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Work Queue API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (url: string, method: string = 'GET', body?: string) => {
    // Use URL from global (set up in test setup)
    const requestUrl = new URL(url, 'http://localhost:3000');
    return new NextRequest(requestUrl, {
      method,
      body,
    });
  };

  describe('forwardRequest', () => {
    it('should forward GET request to proxy', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const mockResponse = {
        items: [{ id: '1', workItemNumber: 'WI-001' }],
        totalCount: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue?page=1&pageSize=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/proxy/api/v1/workqueue'),
        expect.any(Object)
      );
    });

    it('should forward POST request with body', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const requestBody = { assignedToUserId: 'user-123', assignedToUserName: 'John Doe' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(
        'http://localhost:3000/api/workqueue/1/assign',
        'POST',
        JSON.stringify(requestBody)
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].method).toBe('POST');
      expect(fetchCall[1].body).toBe(JSON.stringify(requestBody));
    });

    it('should forward PUT request with body', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const requestBody = { notes: 'Updated notes' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(
        'http://localhost:3000/api/workqueue/1/approve',
        'PUT',
        JSON.stringify(requestBody)
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should forward DELETE request without body', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue/1', 'DELETE');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].body).toBeUndefined();
    });

    it('should forward PATCH request', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue/1', 'PATCH');
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should include query parameters in proxy URL', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ items: [] }),
      });

      const request = createMockRequest(
        'http://localhost:3000/api/workqueue?status=New&page=1&pageSize=20'
      );
      await GET(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain('status=New');
      expect(fetchCall[0]).toContain('page=1');
      expect(fetchCall[0]).toContain('pageSize=20');
    });

    it('should include path after /api/workqueue in proxy URL', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue/1/assign');
      await POST(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain('/api/v1/workqueue/1/assign');
    });

    it('should include user headers when session is available', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
        },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ items: [] }),
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue');
      await GET(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers['X-User-Email']).toBe('test@example.com');
      expect(fetchCall[1].headers['X-User-Name']).toBe('Test User');
      expect(fetchCall[1].headers['X-User-Id']).toBe('user-1');
      expect(fetchCall[1].headers['X-User-Role']).toBe('admin');
    });

    it('should handle empty path correctly', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ items: [] }),
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue');
      await GET(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain('/api/v1/workqueue');
    });

    it('should handle API errors with JSON error response', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({ error: 'Invalid request', message: 'Validation failed' }),
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should handle API errors with text error response', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error occurred',
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server error occurred');
    });

    it('should handle API errors with unknown error format', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => {
          throw new Error('Failed to read error');
        },
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle non-JSON responses', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Success',
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });

    it('should handle empty JSON responses', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({});
    });

    it('should handle request body read errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const request = createMockRequest('http://localhost:3000/api/workqueue/1/assign', 'POST');
      // Mock request.text() to throw
      vi.spyOn(request, 'text').mockRejectedValueOnce(new Error('Failed to read body'));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].body).toBeUndefined();
    });

    it('should handle connection errors', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockRejectedValueOnce(new Error('fetch failed'));

      const request = createMockRequest('http://localhost:3000/api/workqueue');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process work queue request');
      expect(data.message).toBe('fetch failed');
    });

    it('should handle timeout errors', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockRejectedValueOnce(new Error('timeout'));

      const request = createMockRequest('http://localhost:3000/api/workqueue');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process work queue request');
    });

    it('should handle session without user', async () => {
      vi.mocked(auth).mockResolvedValue({
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ items: [] }),
      });

      const request = createMockRequest('http://localhost:3000/api/workqueue');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toEqual([]);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers['X-User-Email']).toBeUndefined();
    });
  });
});

