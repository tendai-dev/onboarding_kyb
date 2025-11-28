import { describe, it, expect } from 'vitest';
import { entityFormConfigs } from '../entityFormConfigs';

describe('entityFormConfigs', () => {
  it('should export entity form configs', () => {
    expect(entityFormConfigs).toBeDefined();
    expect(typeof entityFormConfigs).toBe('object');
  });

  it('should have config for private_company', () => {
    expect(entityFormConfigs.private_company).toBeDefined();
    expect(entityFormConfigs.private_company.entityType).toBe('private_company');
  });

  it('should have steps in config', () => {
    const config = entityFormConfigs.private_company;
    expect(config.steps).toBeDefined();
    expect(Array.isArray(config.steps)).toBe(true);
    expect(config.steps.length).toBeGreaterThan(0);
  });

  it('should have required documents', () => {
    const config = entityFormConfigs.private_company;
    expect(config.requiredDocuments).toBeDefined();
    expect(Array.isArray(config.requiredDocuments)).toBe(true);
  });

  it('should have fields in steps', () => {
    const config = entityFormConfigs.private_company;
    if (config.steps.length > 0) {
      expect(config.steps[0].fields).toBeDefined();
      expect(Array.isArray(config.steps[0].fields)).toBe(true);
    }
  });
});

