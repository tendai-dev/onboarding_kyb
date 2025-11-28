import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checklistApiService } from '../checklistApi';
import { getSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
}));

global.fetch = vi.fn();

describe('checklistApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getSession as any).mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User', role: 'admin' },
    });
  });

  it('should get all checklists', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await checklistApiService.getAllChecklists();
    expect(result).toEqual([]);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get checklist by id', async () => {
    const mockChecklist = { id: 'checklist-1', name: 'Test Checklist' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockChecklist,
    });

    const result = await checklistApiService.getChecklistById('checklist-1');
    expect(result).toEqual(mockChecklist);
  });

  it('should create checklist', async () => {
    const newChecklist = { name: 'New Checklist', entityType: 'Individual' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'checklist-1', ...newChecklist }),
    });

    const result = await checklistApiService.createChecklist(newChecklist as any);
    expect(result).toHaveProperty('id');
  });

  it('should update checklist', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'checklist-1', name: 'Updated' }),
    });

    const result = await checklistApiService.updateChecklist('checklist-1', { name: 'Updated' } as any);
    expect(result).toHaveProperty('id');
  });

  it('should delete checklist', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
    });

    await checklistApiService.deleteChecklist('checklist-1');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server Error',
    });

    await expect(checklistApiService.getAllChecklists()).rejects.toThrow();
  });
});

