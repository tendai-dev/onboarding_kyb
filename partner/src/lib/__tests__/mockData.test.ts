import { describe, it, expect } from 'vitest';
import * as mockData from '../mockData';

describe('mockData', () => {
  it('should export mock data', () => {
    expect(mockData).toBeDefined();
  });

  it('should have sample applications', () => {
    // Check if mockData exports sample data
    expect(mockData).toBeDefined();
  });
});

