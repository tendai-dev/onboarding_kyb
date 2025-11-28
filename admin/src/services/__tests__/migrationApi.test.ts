import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrationApiService } from '../migrationApi';
import { getSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
}));

global.fetch = vi.fn();

describe('migrationApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getSession as any).mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
    });
  });

  it('should get migration jobs', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await migrationApiService.getMigrationJobs();
    expect(result).toEqual([]);
  });

  it('should get migration job by id', async () => {
    const mockJob = { id: 'job-1', name: 'Test Migration', status: 'PENDING' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockJob,
    });

    const result = await migrationApiService.getMigrationJob('job-1');
    expect(result).toEqual(mockJob);
  });

  it('should start migration', async () => {
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'job-1', status: 'IN_PROGRESS' }),
    });

    const result = await migrationApiService.startMigration('Test Migration', 'Individual', mockFile);
    expect(result).toHaveProperty('id');
  });

  it('should cancel migration', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
    });

    await migrationApiService.cancelMigration('job-1');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server Error' }),
    });

    await expect(migrationApiService.getMigrationJobs()).rejects.toThrow();
  });
});

