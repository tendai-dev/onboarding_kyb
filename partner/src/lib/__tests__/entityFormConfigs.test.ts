import { describe, it, expect } from 'vitest';
import { getEntityFormConfig, entityFormConfigs, FormField, EntityFormConfig } from '../entityFormConfigs';

describe('entityFormConfigs', () => {
  describe('getEntityFormConfig', () => {
    it('should return config for private_company', () => {
      const config = getEntityFormConfig('private_company');
      expect(config).toBeDefined();
      expect(config?.entityType).toBe('private_company');
    });

    it('should return config for npo', () => {
      const config = getEntityFormConfig('npo');
      expect(config).toBeDefined();
      expect(config?.entityType).toBe('npo');
    });

    it('should return null for unknown entity type', () => {
      const config = getEntityFormConfig('unknown_type');
      expect(config).toBeNull();
    });

    it('should handle case-insensitive entity types', () => {
      const config1 = getEntityFormConfig('PRIVATE_COMPANY');
      const config2 = getEntityFormConfig('private_company');
      expect(config1).toEqual(config2);
    });
  });

  describe('entityFormConfigs structure', () => {
    it('should have required entity types', () => {
      expect(entityFormConfigs).toHaveProperty('private_company');
      expect(entityFormConfigs).toHaveProperty('npo');
    });

    it('should have valid form config structure', () => {
      const config = entityFormConfigs.private_company;
      expect(config).toHaveProperty('entityType');
      expect(config).toHaveProperty('displayName');
      expect(config).toHaveProperty('description');
      expect(config).toHaveProperty('steps');
      expect(config).toHaveProperty('requiredDocuments');
      expect(Array.isArray(config.steps)).toBe(true);
    });

    it('should have steps with required fields', () => {
      const config = entityFormConfigs.private_company;
      config.steps.forEach(step => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('subtitle');
        expect(step).toHaveProperty('fields');
        expect(Array.isArray(step.fields)).toBe(true);
      });
    });
  });
});

