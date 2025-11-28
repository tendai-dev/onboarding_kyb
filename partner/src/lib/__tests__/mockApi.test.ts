import { describe, it, expect } from 'vitest';
import * as mockApi from '../mockApi';

describe('mockApi', () => {
  it('should export mock API functions', () => {
    expect(mockApi).toBeDefined();
  });

  it('should have getApplications function', () => {
    expect(typeof mockApi.getApplications).toBe('function');
  });

  it('should have getApplication function', () => {
    expect(typeof mockApi.getApplication).toBe('function');
  });

  it('should have getDashboardStats function', () => {
    expect(typeof mockApi.getDashboardStats).toBe('function');
  });
});

