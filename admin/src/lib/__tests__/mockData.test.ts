import { describe, it, expect } from 'vitest';
import { mockApplications } from '../mockData';

describe('mockData', () => {
  it('should export mock applications', () => {
    expect(mockApplications).toBeDefined();
    expect(Array.isArray(mockApplications)).toBe(true);
  });

  it('should have applications with required fields', () => {
    if (mockApplications.length > 0) {
      const app = mockApplications[0];
      expect(app.id).toBeDefined();
      expect(app.companyName).toBeDefined();
      expect(app.entityType).toBeDefined();
      expect(app.status).toBeDefined();
    }
  });

  it('should have documents in applications', () => {
    if (mockApplications.length > 0) {
      const app = mockApplications[0];
      expect(app.documents).toBeDefined();
      expect(Array.isArray(app.documents)).toBe(true);
    }
  });
});

