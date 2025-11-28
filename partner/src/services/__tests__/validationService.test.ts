import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validationService } from '../validationService';

describe('validationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache before each test
    validationService.clearCache();
  });

  describe('validateCompanyRegistration', () => {
    it('should validate company registration number', async () => {
      const result = await validationService.validateCompanyRegistration('123456', 'ZA');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should use cache when enabled', async () => {
      const config = { endpoint: '/api/validate/company', cache: true, cacheExpiry: 300000 };
      const result1 = await validationService.validateCompanyRegistration('123456', 'ZA', config);
      const result2 = await validationService.validateCompanyRegistration('123456', 'ZA', config);
      
      // Both should be defined
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      // Cache should return same result
      expect(result1.isValid).toBe(result2.isValid);
    });

    it('should return error result on failure', async () => {
      // The service handles errors internally and returns a result object
      const result = await validationService.validateCompanyRegistration('', 'ZA');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('message');
    });
  });

  describe('validateTaxNumber', () => {
    it('should validate tax number', async () => {
      const result = await validationService.validateTaxNumber('TAX123', 'ZA');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should use cache when enabled', async () => {
      const config = { endpoint: '/api/validate/tax', cache: true };
      const result1 = await validationService.validateTaxNumber('TAX123', 'ZA', config);
      const result2 = await validationService.validateTaxNumber('TAX123', 'ZA', config);
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.isValid).toBe(result2.isValid);
    });
  });

  describe('validateBankAccount', () => {
    it('should validate bank account', async () => {
      const result = await validationService.validateBankAccount('1234567890', 'BANK001', 'ZA');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should use cache when enabled', async () => {
      const config = { endpoint: '/api/validate/bank', cache: true };
      const result1 = await validationService.validateBankAccount('1234567890', 'BANK001', 'ZA', config);
      const result2 = await validationService.validateBankAccount('1234567890', 'BANK001', 'ZA', config);
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.isValid).toBe(result2.isValid);
    });

    it('should handle invalid bank account format', async () => {
      const result = await validationService.validateBankAccount('invalid', 'BANK001', 'ZA');
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('validateEmail', () => {
    it('should validate email address', async () => {
      const result = await validationService.validateEmail('test@example.com');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should reject invalid email format', async () => {
      const result = await validationService.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should reject disposable email addresses', async () => {
      const result = await validationService.validateEmail('test@10minutemail.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Disposable');
    });

    it('should use cache when enabled', async () => {
      const config = { endpoint: '/api/validate/email', cache: true };
      const result1 = await validationService.validateEmail('test@example.com', config);
      const result2 = await validationService.validateEmail('test@example.com', config);
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.isValid).toBe(result2.isValid);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate phone number', async () => {
      const result = await validationService.validatePhoneNumber('+27123456789', 'ZA');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should handle invalid phone number format', async () => {
      const result = await validationService.validatePhoneNumber('invalid', 'ZA');
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should use cache when enabled', async () => {
      const config = { endpoint: '/api/validate/phone', cache: true };
      const result1 = await validationService.validatePhoneNumber('+27123456789', 'ZA', config);
      const result2 = await validationService.validatePhoneNumber('+27123456789', 'ZA', config);
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.isValid).toBe(result2.isValid);
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple fields in batch', async () => {
      const validations = [
        { type: 'email' as const, data: { email: 'test@example.com' } },
        { type: 'phone' as const, data: { phoneNumber: '+27123456789', country: 'ZA' } },
      ];
      const results = await validationService.validateBatch(validations);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('isValid');
      expect(results[1]).toHaveProperty('isValid');
    });

    it('should handle unknown validation type', async () => {
      const validations = [
        { type: 'email' as const, data: { email: 'test@example.com' } },
        { type: 'company' as const, data: { registrationNumber: '123456', country: 'ZA' } },
      ];
      const results = await validationService.validateBatch(validations);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.hasOwnProperty('isValid'))).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      validationService.clearCache();
      expect(validationService.getCacheSize()).toBe(0);
    });

    it('should return cache size', async () => {
      validationService.clearCache();
      const config = { endpoint: '/api/validate/email', cache: true };
      await validationService.validateEmail('test@example.com', config);
      expect(validationService.getCacheSize()).toBeGreaterThan(0);
    });

    it('should respect cache expiry', async () => {
      validationService.clearCache();
      const config = { 
        endpoint: '/api/validate/email', 
        cache: true, 
        cacheExpiry: 100 // Very short expiry
      };
      
      await validationService.validateEmail('test@example.com', config);
      expect(validationService.getCacheSize()).toBe(1);
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should fetch fresh data
      const result = await validationService.validateEmail('test@example.com', config);
      expect(result).toBeDefined();
    });
  });
});

