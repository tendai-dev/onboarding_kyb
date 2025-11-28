import { describe, it, expect, vi, beforeEach } from 'vitest';
import { entityConfigApiService } from '../entityConfigApi';

// Mock fetch
global.fetch = vi.fn();

// Mock next-auth
vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
}));

describe('entityConfigApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  it('should have getEntityTypes method', () => {
    expect(entityConfigApiService.getEntityTypes).toBeDefined();
    expect(typeof entityConfigApiService.getEntityTypes).toBe('function');
  });

  it('should have getEntityType method', () => {
    expect(entityConfigApiService.getEntityType).toBeDefined();
    expect(typeof entityConfigApiService.getEntityType).toBe('function');
  });

  it('should have createEntityType method', () => {
    expect(entityConfigApiService.createEntityType).toBeDefined();
    expect(typeof entityConfigApiService.createEntityType).toBe('function');
  });

  it('should have updateEntityType method', () => {
    expect(entityConfigApiService.updateEntityType).toBeDefined();
    expect(typeof entityConfigApiService.updateEntityType).toBe('function');
  });

  it('should have deleteEntityType method', () => {
    expect(entityConfigApiService.deleteEntityType).toBeDefined();
    expect(typeof entityConfigApiService.deleteEntityType).toBe('function');
  });

  it('should have getRequirements method', () => {
    expect(entityConfigApiService.getRequirements).toBeDefined();
    expect(typeof entityConfigApiService.getRequirements).toBe('function');
  });

  it('should have getRequirement method', () => {
    expect(entityConfigApiService.getRequirement).toBeDefined();
    expect(typeof entityConfigApiService.getRequirement).toBe('function');
  });

  it('should call getEntityTypes', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], totalCount: 0 }),
    });

    await entityConfigApiService.getEntityTypes();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(entityConfigApiService.getEntityTypes()).rejects.toThrow();
  });
});

