import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from '../route';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('Application Status API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (url: string, body?: any) => {
    // Use URL from global (set up in test setup)
    const requestUrl = new URL(url, 'http://localhost:3000');
    const request = new NextRequest(requestUrl, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return request;
  };

  describe('PUT /api/applications/[id]/status', () => {
    it('should return 400 when id is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/applications//status', {
        status: 'COMPLETE',
      });

      const response = await PUT(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Application ID is required');
    });

    it('should return 400 when status is missing', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const request = createMockRequest('http://localhost:3000/api/applications/test-id/status', {});

      const response = await PUT(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Status is required');
    });

    it('should resolve caseId to GUID before updating status', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        expires: new Date().toISOString(),
      } as any);

      const caseId = 'OBC-20241106-88902';
      const guid = '12345678-1234-1234-1234-123456789012';

      // Mock search response to resolve caseId to GUID
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: guid,
              caseId: caseId,
            },
          ],
        }),
      });

      // Mock status update response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${caseId}/status`, {
        status: 'IN PROGRESS',
        notes: 'Updating status',
      });

      const response = await PUT(request, { params: { id: caseId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should use approve endpoint for COMPLETE status', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}/status`, {
        status: 'COMPLETE',
        notes: 'Approved',
      });

      const response = await PUT(request, { params: { id: guid } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain('/approve');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.approvedBy).toBe('test@example.com');
      expect(body.notes).toBe('Approved');
    });

    it('should use reject endpoint for DECLINED status', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}/status`, {
        status: 'DECLINED',
        reason: 'Does not meet requirements',
      });

      const response = await PUT(request, { params: { id: guid } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain('/reject');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.rejectedBy).toBe('test@example.com');
      expect(body.reason).toBe('Does not meet requirements');
    });

    it('should use status endpoint for other statuses', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}/status`, {
        status: 'IN PROGRESS',
        notes: 'In progress',
      });

      const response = await PUT(request, { params: { id: guid } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain('/status');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.status).toBe('InProgress');
      expect(body.updatedBy).toBe('test@example.com');
    });

    it('should map frontend status to backend status correctly', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';
      const statusMap = [
        { frontend: 'SUBMITTED', backend: 'Submitted' },
        { frontend: 'IN PROGRESS', backend: 'InProgress' },
        { frontend: 'RISK REVIEW', backend: 'PendingReview' },
        { frontend: 'APPROVED', backend: 'Approved' },
        { frontend: 'REJECTED', backend: 'Rejected' },
      ];

      for (const { frontend, backend } of statusMap) {
        vi.clearAllMocks();

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const request = createMockRequest(`http://localhost:3000/api/applications/${guid}/status`, {
          status: frontend,
        });

        await PUT(request, { params: { id: guid } });

        if (frontend === 'COMPLETE' || frontend === 'APPROVED') {
          // These use approve endpoint
          continue;
        } else if (frontend === 'DECLINED' || frontend === 'REJECTED') {
          // These use reject endpoint
          continue;
        } else {
          const fetchCall = (global.fetch as any).mock.calls[0];
          const body = JSON.parse(fetchCall[1].body);
          expect(body.status).toBe(backend);
        }
      }
    });

    it('should use notes as reason when reason is not provided for reject', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}/status`, {
        status: 'DECLINED',
        notes: 'Rejection notes',
      });

      await PUT(request, { params: { id: guid } });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.reason).toBe('Rejection notes');
    });

    it('should use default reason when neither reason nor notes provided', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}/status`, {
        status: 'DECLINED',
      });

      await PUT(request, { params: { id: guid } });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.reason).toBe('No reason provided');
    });

    it('should handle API errors', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid status',
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}/status`, {
        status: 'INVALID',
      });

      const response = await PUT(request, { params: { id: guid } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Failed to update status');
    });

    it('should handle connection errors', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any).mockRejectedValueOnce(new Error('fetch failed'));

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}/status`, {
        status: 'IN PROGRESS',
      });

      const response = await PUT(request, { params: { id: guid } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update application status');
      expect(data.details).toContain('Cannot connect to backend services');
    });

    it('should handle GUID resolution failure gracefully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const caseId = 'OBC-20241106-88902';

      // Search fails
      (global.fetch as any).mockRejectedValueOnce(new Error('Search failed'));

      // Status update still proceeds with caseId
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${caseId}/status`, {
        status: 'IN PROGRESS',
      });

      const response = await PUT(request, { params: { id: caseId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
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

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}/status`, {
        status: 'IN PROGRESS',
      });

      await PUT(request, { params: { id: guid } });

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers['X-User-Email']).toBe('test@example.com');
      expect(fetchCall[1].headers['X-User-Name']).toBe('Test User');
      expect(fetchCall[1].headers['X-User-Id']).toBe('user-1');
      expect(fetchCall[1].headers['X-User-Role']).toBe('admin');
    });

    it('should use system as fallback when user info is missing', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: {},
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}/status`, {
        status: 'COMPLETE',
      });

      await PUT(request, { params: { id: guid } });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.approvedBy).toBe('system');
    });
  });
});

