import { describe, it, expect, vi, beforeEach } from 'vitest';
import { integrationService } from '../integrationService';

// Mock fetch globally
global.fetch = vi.fn();

describe('integrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChecklistByCase', () => {
    it('should fetch checklist by case ID', async () => {
      const mockChecklist = {
        id: 'checklist-1',
        caseId: 'case-1',
        items: [
          { id: 'item-1', name: 'Item 1', category: 'Compliance' },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockChecklist,
      });

      const result = await integrationService.getChecklistByCase('case-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/proxy/api/v1/checklists/by-case/case-1'),
        expect.any(Object)
      );
      expect(result).toEqual(mockChecklist);
    });

    it('should handle errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(integrationService.getChecklistByCase('case-1')).rejects.toThrow();
    });
  });

  describe('completeChecklistItem', () => {
    it('should complete checklist item', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await integrationService.completeChecklistItem(
        'checklist-1',
        'item-1',
        'user-1',
        'Completed'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/proxy/api/v1/checklists/checklist-1/items/item-1/complete'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('user-1'),
        })
      );
    });
  });

  describe('updateWorkQueueItem', () => {
    it('should update work queue item', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await integrationService.updateWorkQueueItem('item-1', {
        progress: 50,
        notes: 'In progress',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/proxy/api/v1/workqueue/items/by-application/item-1'),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });
});

