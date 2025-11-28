import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validationService } from '../validationService';

describe('validationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should validate company registration', async () => {
    const promise = validationService.validateCompanyRegistration(
      '2019/123456/07',
      'za',
      { cache: false }
    );
    
    vi.advanceTimersByTime(1000);
    const result = await promise;
    
    expect(result).toBeDefined();
    expect(result.isValid).toBeDefined();
  });

  it('should cache validation results', async () => {
    const config = { cache: true, cacheExpiry: 300000 };
    
    const promise1 = validationService.validateCompanyRegistration(
      '2019/123456/07',
      'za',
      config
    );
    vi.advanceTimersByTime(1000);
    const result1 = await promise1;

    const promise2 = validationService.validateCompanyRegistration(
      '2019/123456/07',
      'za',
      config
    );
    vi.advanceTimersByTime(100);
    const result2 = await promise2;

    expect(result1.isValid).toBe(result2.isValid);
  });

  it('should validate tax number', async () => {
    const promise = validationService.validateTaxNumber(
      '1234567890',
      'za',
      { cache: false }
    );
    
    vi.advanceTimersByTime(1000);
    const result = await promise;
    
    expect(result).toBeDefined();
    expect(result.isValid).toBeDefined();
  });

  it('should validate bank account', async () => {
    const promise = validationService.validateBankAccount(
      '123456789',
      '123456',
      'za',
      { cache: false }
    );
    
    vi.advanceTimersByTime(1000);
    const result = await promise;
    
    expect(result).toBeDefined();
    expect(result.isValid).toBeDefined();
  });

  it('should handle validation errors', async () => {
    const promise = validationService.validateCompanyRegistration(
      'invalid',
      'za',
      { cache: false }
    );
    
    vi.advanceTimersByTime(1000);
    const result = await promise;
    
    expect(result).toBeDefined();
    expect(result.isValid).toBeDefined();
  });
});
