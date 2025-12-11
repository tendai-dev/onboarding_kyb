import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checklistApiService } from '../checklistApi';
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

describe('checklistApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as Awaited<ReturnType<typeof getSession>>);
  });

  it('should get all checklists', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse([], { status: 200 })
    );

    const result = await checklistApiService.getAllChecklists();
    expect(result).toEqual([]);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get checklist by id', async () => {
    const mockChecklist = { id: 'checklist-1', name: 'Test Checklist' };
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse(mockChecklist, { status: 200 })
    );

    const result = await checklistApiService.getChecklistById('checklist-1');
    expect(result).toEqual(mockChecklist);
  });

  it('should get checklist by case id', async () => {
    const mockChecklist = {
      id: 'checklist-1',
      caseId: 'CASE-123',
      type: 'Private Company',
      status: 'InProgress',
      partnerId: 'partner-1',
      createdAt: new Date().toISOString(),
      completionPercentage: 50,
      requiredCompletionPercentage: 100,
      items: [],
    };
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse(mockChecklist, { status: 200 })
    );

    const result = await checklistApiService.getChecklistByCase('CASE-123');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('checklist-1');
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

    await expect(checklistApiService.getAllChecklists()).rejects.toThrow();
  });
});
