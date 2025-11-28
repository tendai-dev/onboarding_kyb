import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditLogApiService } from '../auditLogApi';
import { getSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
}));

global.fetch = vi.fn();

describe('auditLogApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getSession as any).mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
    });
  });

  it('should search audit logs', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [], totalCount: 0, skip: 0, take: 10 }),
    });

    const result = await auditLogApiService.searchAuditLogs({});
    expect(result).toHaveProperty('entries');
    expect(result).toHaveProperty('totalCount');
  });

  it('should get audit log by id', async () => {
    const mockEntry = { id: 'log-1', eventType: 'CREATE', action: 'Created' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEntry,
    });

    const result = await auditLogApiService.getAuditLogById('log-1');
    expect(result).toEqual(mockEntry);
  });

  it('should handle search with filters', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [], totalCount: 0 }),
    });

    const result = await auditLogApiService.searchAuditLogs({
      eventType: 'CREATE',
      entityType: 'Application',
    });
    expect(result).toHaveProperty('entries');
  });

  it('should handle errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server Error',
    });

    await expect(auditLogApiService.searchAuditLogs({})).rejects.toThrow();
  });
});

