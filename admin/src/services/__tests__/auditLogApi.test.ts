import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditLogApiService } from '../auditLogApi';
import { getSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
}));

global.fetch = vi.fn();

// Helper to create a complete Response mock
function createMockResponse(
  data: unknown,
  options: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
    text?: () => Promise<string>;
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
    text:
      options.text ||
      (async () => (typeof data === 'string' ? data : JSON.stringify(data))),
  } as unknown as Response;
}

describe('auditLogApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as Awaited<ReturnType<typeof getSession>>);
  });

  it('should search audit logs', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse(
        { entries: [], totalCount: 0, skip: 0, take: 10 },
        { status: 200 }
      )
    );

    const result = await auditLogApiService.searchAuditLogs({});
    expect(result).toHaveProperty('entries');
    expect(result).toHaveProperty('totalCount');
  });

  it('should get audit log entry by id', async () => {
    const mockEntry = {
      id: 'log-1',
      eventType: 'CREATE',
      action: 'Created',
      entityType: 'Application',
      entityId: 'entity-1',
      userId: 'user-1',
      userRole: 'Admin',
      description: 'Test',
      ipAddress: '127.0.0.1',
      userAgent: 'test',
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      complianceCategory: 'GENERAL',
      hash: 'hash',
      integrityVerified: true,
    };
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse(mockEntry, { status: 200 })
    );

    const result = await auditLogApiService.getAuditLogEntry('log-1');
    expect(result).toEqual(mockEntry);
  });

  it('should handle search with filters', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse({ entries: [], totalCount: 0 }, { status: 200 })
    );

    const result = await auditLogApiService.searchAuditLogs({
      eventType: 'CREATE',
      entityType: 'Application',
    });
    expect(result).toHaveProperty('entries');
  });

  it('should handle errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse('Server Error', {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server Error',
      })
    );

    await expect(auditLogApiService.searchAuditLogs({})).rejects.toThrow();
  });
});
