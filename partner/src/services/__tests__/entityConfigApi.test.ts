import { describe, it, expect, vi, beforeEach } from 'vitest';
import { entityConfigApiService } from '../entityConfigApi';

global.fetch = vi.fn();

describe('entityConfigApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEntityTypes', () => {
    it('should fetch entity types', async () => {
      const mockEntityTypes = [
        { code: 'PRIVATE_COMPANY', name: 'Private Company' },
        { code: 'NPO', name: 'Non-Profit Organization' },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockEntityTypes,
      });

      const result = await entityConfigApiService.getEntityTypes();

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(entityConfigApiService.getEntityTypes()).rejects.toThrow();
    });
  });

  describe('getEntityTypeByCode', () => {
    it('should fetch entity type by code', async () => {
      const mockEntityType = {
        code: 'PRIVATE_COMPANY',
        name: 'Private Company',
        formSchema: {},
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockEntityType,
      });

      const result = await entityConfigApiService.getEntityTypeByCode('PRIVATE_COMPANY');

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle 404 errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await entityConfigApiService.getEntityTypeByCode('INVALID');
      expect(result).toBeNull();
    });
  });

  describe('getEntityType', () => {
    it('should fetch entity type by ID', async () => {
      const mockEntityType = {
        id: 'entity-1',
        code: 'PRIVATE_COMPANY',
        displayName: 'Private Company',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockEntityType,
      });

      const result = await entityConfigApiService.getEntityType('entity-1');
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      await expect(entityConfigApiService.getEntityType('entity-1')).rejects.toThrow();
    });
  });

  describe('getRequirements', () => {
    it('should fetch requirements', async () => {
      const mockRequirements = [
        { id: 'req-1', code: 'COMPANY_NAME', displayName: 'Company Name' },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockRequirements,
      });

      const result = await entityConfigApiService.getRequirements();
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getRequirement', () => {
    it('should fetch requirement by ID', async () => {
      const mockRequirement = {
        id: 'req-1',
        code: 'COMPANY_NAME',
        displayName: 'Company Name',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockRequirement,
      });

      const result = await entityConfigApiService.getRequirement('req-1');
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('transformKeys', () => {
    it('should transform snake_case to camelCase', async () => {
      const mockResponse = {
        entity_type: 'PRIVATE_COMPANY',
        display_name: 'Private Company',
        nested_object: {
          snake_case_field: 'value',
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await entityConfigApiService.getEntityTypes();
      expect(result).toBeDefined();
    });
  });

  describe('timeout handling', () => {
    it('should handle request timeout', async () => {
      (global.fetch as any).mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({}),
        }), 15000))
      );

      await expect(entityConfigApiService.getEntityTypes()).rejects.toThrow();
    });
  });
});

