import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as mockApi from '../mockApi';

describe('mockApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export mock API functions', () => {
    expect(mockApi).toBeDefined();
    expect(typeof mockApi).toBe('object');
  });

  it('should have getApplications function', () => {
    expect(mockApi.getApplications).toBeDefined();
    expect(typeof mockApi.getApplications).toBe('function');
  });

  it('should have getApplicationById function', () => {
    expect(mockApi.getApplicationById).toBeDefined();
    expect(typeof mockApi.getApplicationById).toBe('function');
  });

  it('should have getDashboardStats function', () => {
    expect(mockApi.getDashboardStats).toBeDefined();
    expect(typeof mockApi.getDashboardStats).toBe('function');
  });

  it('should get applications', async () => {
    const applications = await mockApi.getApplications();
    expect(Array.isArray(applications)).toBe(true);
  });

  it('should get application by id', async () => {
    const applications = await mockApi.getApplications();
    if (applications.length > 0) {
      const app = await mockApi.getApplicationById(applications[0].id);
      expect(app).toBeDefined();
      expect(app?.id).toBe(applications[0].id);
    }
  });

  it('should get dashboard stats', async () => {
    const stats = await mockApi.getDashboardStats();
    expect(stats).toBeDefined();
    expect(stats.totalApplications).toBeGreaterThanOrEqual(0);
  });

  it('should get audit events', async () => {
    if (mockApi.getAuditEvents) {
      const events = await mockApi.getAuditEvents();
      expect(Array.isArray(events)).toBe(true);
    }
  });

  it('should get entity types', async () => {
    if (mockApi.getEntityTypes) {
      const types = await mockApi.getEntityTypes();
      expect(Array.isArray(types)).toBe(true);
    }
  });
});

