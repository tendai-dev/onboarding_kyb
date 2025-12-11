import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrationApi } from '../migrationApi';
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

describe('migrationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as Awaited<ReturnType<typeof getSession>>);
  });

  it('should get migration jobs', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse([], { status: 200 })
    );

    const result = await migrationApi.getMigrationJobs();
    expect(result).toEqual([]);
  });

  it('should get migration job by id', async () => {
    const mockJob = { id: 'job-1', name: 'Test Migration', status: 'PENDING' };
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse(mockJob, { status: 200 })
    );

    const result = await migrationApi.getMigrationJob('job-1');
    expect(result).toEqual(mockJob);
  });

  it('should start migration', async () => {
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse({ id: 'job-1', status: 'IN_PROGRESS' }, { status: 200 })
    );

    const result = await migrationApi.startMigration(
      'Test Migration',
      'Individual',
      mockFile
    );
    expect(result).toHaveProperty('id');
  });

  it('should handle errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      createMockResponse(
        { error: 'Server Error' },
        {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server Error',
        }
      )
    );

    await expect(migrationApi.getMigrationJobs()).rejects.toThrow();
  });
});
