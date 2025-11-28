import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  entityValidationSchemas,
  commonValidationSchemas,
  documentValidation,
  riskAssessmentValidation,
  externalValidation,
} from '../validation';

describe('validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('entityValidationSchemas', () => {
    it('should have validation schemas for pty_ltd entity type', () => {
      expect(entityValidationSchemas.pty_ltd).toBeDefined();
      expect(entityValidationSchemas.pty_ltd).toBeTruthy();
    });

    it('should have validation schemas for npo_ngo entity type', () => {
      expect(entityValidationSchemas.npo_ngo).toBeDefined();
      expect(entityValidationSchemas.npo_ngo).toBeTruthy();
    });

    it('should have validation schemas for trust entity type', () => {
      expect(entityValidationSchemas.trust).toBeDefined();
      expect(entityValidationSchemas.trust).toBeTruthy();
    });

    it('should have validation schemas for government entity type', () => {
      expect(entityValidationSchemas.government).toBeDefined();
      expect(entityValidationSchemas.government).toBeTruthy();
    });

    it('should have validation schemas object', () => {
      expect(typeof entityValidationSchemas).toBe('object');
      expect(entityValidationSchemas).not.toBeNull();
      expect(Object.keys(entityValidationSchemas).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('commonValidationSchemas', () => {
    it('should have contact validation schema', () => {
      expect(commonValidationSchemas.contact).toBeDefined();
    });

    it('should have banking validation schema', () => {
      expect(commonValidationSchemas.banking).toBeDefined();
    });

    it('should have financial validation schema', () => {
      expect(commonValidationSchemas.financial).toBeDefined();
    });
  });

  describe('documentValidation', () => {
    it('should validate file type', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = documentValidation.validateFileType(file, ['application/pdf', 'image/jpeg']);
      expect(result).toBe(true);
    });

    it('should reject invalid file type', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = documentValidation.validateFileType(file, ['application/pdf']);
      expect(result).toBe(false);
    });

    it('should validate file size', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = documentValidation.validateFileSize(file, 5);
      expect(result).toBe(true);
    });

    it('should reject file exceeding max size', () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const file = new File([largeContent], 'test.pdf', { type: 'application/pdf' });
      const result = documentValidation.validateFileSize(file, 5);
      expect(result).toBe(false);
    });

    it('should validate file name', () => {
      expect(documentValidation.validateFileName('test-file.pdf')).toBe(true);
      expect(documentValidation.validateFileName('test_file-123.pdf')).toBe(true);
    });

    it('should reject invalid file name', () => {
      expect(documentValidation.validateFileName('test file.pdf')).toBe(false);
      expect(documentValidation.validateFileName('test@file.pdf')).toBe(false);
    });

    it('should get required documents for pty_ltd', () => {
      const docs = documentValidation.getRequiredDocuments('pty_ltd');
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);
    });

    it('should get required documents for npo_ngo', () => {
      const docs = documentValidation.getRequiredDocuments('npo_ngo');
      expect(Array.isArray(docs)).toBe(true);
    });

    it('should get required documents for trust', () => {
      const docs = documentValidation.getRequiredDocuments('trust');
      expect(Array.isArray(docs)).toBe(true);
    });

    it('should include EPP documents when isEPP is true', () => {
      const docs = documentValidation.getRequiredDocuments('pty_ltd', true);
      const hasMandate = docs.some(doc => doc.id === 'mandate_resolution');
      expect(hasMandate).toBe(true);
    });

    it('should get financial institution documents', () => {
      const docs = documentValidation.getFinancialInstitutionDocuments();
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);
    });
  });

  describe('riskAssessmentValidation', () => {
    it('should calculate risk score (deprecated)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const score = riskAssessmentValidation.calculateRiskScore({});
      expect(score).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should get risk level (deprecated)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const level = riskAssessmentValidation.getRiskLevel(50);
      expect(level).toBe('unknown');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should get required approvals for high risk', () => {
      const approvals = riskAssessmentValidation.getRequiredApprovals('high', 'pty_ltd');
      expect(approvals).toContain('senior_manager');
      expect(approvals).toContain('compliance_officer');
      expect(approvals).toContain('risk_committee');
    });

    it('should get required approvals for medium risk', () => {
      const approvals = riskAssessmentValidation.getRequiredApprovals('medium', 'pty_ltd');
      expect(approvals).toContain('senior_manager');
      expect(approvals).toContain('compliance_officer');
    });

    it('should get required approvals for low risk', () => {
      const approvals = riskAssessmentValidation.getRequiredApprovals('low', 'pty_ltd');
      expect(approvals).toContain('compliance_officer');
    });

    it('should add legal counsel for government entities', () => {
      const approvals = riskAssessmentValidation.getRequiredApprovals('medium', 'government');
      expect(approvals).toContain('legal_counsel');
    });

    it('should add senior manager for publicly listed entities', () => {
      const approvals = riskAssessmentValidation.getRequiredApprovals('low', 'publicly_listed');
      expect(approvals).toContain('senior_manager');
    });
  });

  describe('externalValidation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should validate company registration', async () => {
      const promise = externalValidation.validateCompanyRegistration('2019/123456/07', 'za');
      vi.advanceTimersByTime(1000);
      const result = await promise;
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid registration number', async () => {
      const promise = externalValidation.validateCompanyRegistration('invalid', 'za');
      vi.advanceTimersByTime(1000);
      const result = await promise;
      expect(result.valid).toBe(false);
    });

    it('should validate tax number', async () => {
      const promise = externalValidation.validateTaxNumber('1234567890', 'za');
      vi.advanceTimersByTime(800);
      const result = await promise;
      expect(result.valid).toBe(true);
    });

    it('should reject invalid tax number', async () => {
      const promise = externalValidation.validateTaxNumber('invalid', 'za');
      vi.advanceTimersByTime(800);
      const result = await promise;
      expect(result.valid).toBe(false);
    });

    it('should validate bank account', async () => {
      const promise = externalValidation.validateBankAccount('123456789', '123456', 'za');
      vi.advanceTimersByTime(1200);
      const result = await promise;
      expect(result.valid).toBe(true);
    });

    it('should reject invalid bank account', async () => {
      const promise = externalValidation.validateBankAccount('invalid', '123456', 'za');
      vi.advanceTimersByTime(1200);
      const result = await promise;
      expect(result.valid).toBe(false);
    });
  });
});

