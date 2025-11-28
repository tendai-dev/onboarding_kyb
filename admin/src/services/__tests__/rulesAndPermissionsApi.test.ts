import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rulesAndPermissionsApiService } from '../rulesAndPermissionsApi';

// Mock fetch
global.fetch = vi.fn();

// Mock next-auth
vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
}));

describe('rulesAndPermissionsApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  it('should have getAllRoles method', () => {
    expect(rulesAndPermissionsApiService.getAllRoles).toBeDefined();
    expect(typeof rulesAndPermissionsApiService.getAllRoles).toBe('function');
  });

  it('should have getRole method', () => {
    expect(rulesAndPermissionsApiService.getRole).toBeDefined();
    expect(typeof rulesAndPermissionsApiService.getRole).toBe('function');
  });

  it('should have createRole method', () => {
    expect(rulesAndPermissionsApiService.createRole).toBeDefined();
    expect(typeof rulesAndPermissionsApiService.createRole).toBe('function');
  });

  it('should have updateRole method', () => {
    expect(rulesAndPermissionsApiService.updateRole).toBeDefined();
    expect(typeof rulesAndPermissionsApiService.updateRole).toBe('function');
  });

  it('should have deleteRole method', () => {
    expect(rulesAndPermissionsApiService.deleteRole).toBeDefined();
    expect(typeof rulesAndPermissionsApiService.deleteRole).toBe('function');
  });

  it('should have getUsers method', () => {
    expect(rulesAndPermissionsApiService.getUsers).toBeDefined();
    expect(typeof rulesAndPermissionsApiService.getUsers).toBe('function');
  });

  it('should have getUser method', () => {
    expect(rulesAndPermissionsApiService.getUser).toBeDefined();
    expect(typeof rulesAndPermissionsApiService.getUser).toBe('function');
  });

  it('should call getAllRoles', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], totalCount: 0 }),
    });

    await rulesAndPermissionsApiService.getAllRoles();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle errors in getAllRoles', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(rulesAndPermissionsApiService.getAllRoles()).rejects.toThrow();
  });
});

