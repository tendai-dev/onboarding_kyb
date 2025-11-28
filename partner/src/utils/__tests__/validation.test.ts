import { describe, it, expect } from 'vitest';
import { entityValidationSchemas, commonValidationSchemas, documentValidation } from '../validation';

describe('validation utilities', () => {
  describe('entityValidationSchemas', () => {
    it('should have pty_ltd schema', () => {
      expect(entityValidationSchemas.pty_ltd).toBeDefined();
    });

    it('should have npo_ngo schema', () => {
      expect(entityValidationSchemas.npo_ngo).toBeDefined();
    });

    it('should have trust schema', () => {
      expect(entityValidationSchemas.trust).toBeDefined();
    });

    it('should have government schema', () => {
      expect(entityValidationSchemas.government).toBeDefined();
    });
  });

  describe('commonValidationSchemas', () => {
    it('should have contact schema', () => {
      expect(commonValidationSchemas.contact).toBeDefined();
    });

    it('should have banking schema', () => {
      expect(commonValidationSchemas.banking).toBeDefined();
    });

    it('should have financial schema', () => {
      expect(commonValidationSchemas.financial).toBeDefined();
    });
  });

  describe('documentValidation', () => {
    it('should validate file type', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const isValid = documentValidation.validateFileType(file, ['application/pdf']);
      expect(isValid).toBe(true);
    });

    it('should validate file size', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const isValid = documentValidation.validateFileSize(file, 5);
      expect(isValid).toBe(true);
    });

    it('should validate file name', () => {
      const isValid = documentValidation.validateFileName('test-file.pdf');
      expect(isValid).toBe(true);
    });

    it('should reject invalid file names', () => {
      const isValid = documentValidation.validateFileName('test/file.pdf');
      expect(isValid).toBe(false);
    });

    it('should get required documents for entity type', () => {
      const docs = documentValidation.getRequiredDocuments('pty_ltd');
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);
    });

    it('should handle EPP flag for required documents', () => {
      const docsWithEPP = documentValidation.getRequiredDocuments('pty_ltd', true);
      const docsWithoutEPP = documentValidation.getRequiredDocuments('pty_ltd', false);
      expect(docsWithEPP.length).toBeGreaterThanOrEqual(docsWithoutEPP.length);
    });

    it('should validate file types correctly', () => {
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const jpgFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      expect(documentValidation.validateFileType(pdfFile, ['application/pdf'])).toBe(true);
      expect(documentValidation.validateFileType(jpgFile, ['application/pdf'])).toBe(false);
    });

    it('should validate file sizes correctly', () => {
      const smallFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const largeFile = new File(new Array(6 * 1024 * 1024).fill('a'), 'large.pdf', { type: 'application/pdf' });
      
      expect(documentValidation.validateFileSize(smallFile, 5)).toBe(true);
      expect(documentValidation.validateFileSize(largeFile, 5)).toBe(false);
    });

    it('should get financial institution documents', () => {
      const docs = documentValidation.getFinancialInstitutionDocuments();
      expect(Array.isArray(docs)).toBe(true);
    });
  });

  describe('validation schema tests', () => {
    it('should validate pty_ltd company name', async () => {
      const schema = entityValidationSchemas.pty_ltd;
      await expect(schema.validate({ companyName: 'Test Company' })).resolves.toBeDefined();
      await expect(schema.validate({ companyName: '' })).rejects.toThrow();
    });

    it('should validate registration number format', async () => {
      const schema = entityValidationSchemas.pty_ltd;
      await expect(schema.validate({ 
        companyName: 'Test',
        registrationNumber: '2019/123456/07',
        country: 'za',
        directors: [{ name: 'John', idNumber: '123', nationality: 'ZA' }],
        shareholders: [{ name: 'John', percentage: 100 }],
      })).resolves.toBeDefined();
    });

    it('should validate shareholder percentages total to 100%', async () => {
      const schema = entityValidationSchemas.pty_ltd;
      await expect(schema.validate({
        companyName: 'Test',
        registrationNumber: '2019/123456/07',
        country: 'za',
        directors: [{ name: 'John', idNumber: '123', nationality: 'ZA' }],
        shareholders: [
          { name: 'John', percentage: 60 },
          { name: 'Jane', percentage: 40 },
        ],
      })).resolves.toBeDefined();
      
      await expect(schema.validate({
        companyName: 'Test',
        registrationNumber: '2019/123456/07',
        country: 'za',
        directors: [{ name: 'John', idNumber: '123', nationality: 'ZA' }],
        shareholders: [
          { name: 'John', percentage: 60 },
          { name: 'Jane', percentage: 30 },
        ],
      })).rejects.toThrow();
    });

    it('should validate npo_ngo schema', async () => {
      const schema = entityValidationSchemas.npo_ngo;
      await expect(schema.validate({
        organizationName: 'Test NPO',
        registrationNumber: 'NPO123',
        purpose: 'A'.repeat(50),
        beneficiaries: 'B'.repeat(20),
        trustees: [
          { name: 'Trustee 1', role: 'Chair' },
          { name: 'Trustee 2', role: 'Secretary' },
          { name: 'Trustee 3', role: 'Treasurer' },
        ],
      })).resolves.toBeDefined();
    });

    it('should validate trust schema', async () => {
      const schema = entityValidationSchemas.trust;
      await expect(schema.validate({
        trustName: 'Test Trust',
        trustDeedDate: new Date('2020-01-01'),
        trustees: [{ name: 'Trustee', idNumber: '123', role: 'Trustee' }],
        beneficiaries: [{ name: 'Beneficiary', relationship: 'Child' }],
      })).resolves.toBeDefined();
    });

    it('should validate government schema', async () => {
      const schema = entityValidationSchemas.government;
      await expect(schema.validate({
        departmentName: 'Test Department',
        governmentLevel: 'national',
        authorizedOfficer: {
          name: 'John Doe',
          title: 'Director',
          contactNumber: '+27123456789',
        },
      })).resolves.toBeDefined();
    });

    it('should validate contact schema', async () => {
      const schema = commonValidationSchemas.contact;
      await expect(schema.validate({
        email: 'test@example.com',
        phone: '+27123456789',
        country: 'za',
        address: {
          street: '123 Main St',
          city: 'Cape Town',
          postalCode: '8001',
          country: 'ZA',
        },
      })).resolves.toBeDefined();
    });

    it('should validate banking schema', async () => {
      const schema = commonValidationSchemas.banking;
      await expect(schema.validate({
        accountNumber: '1234567890',
        bankCode: 'BANK001',
        country: 'za',
      })).resolves.toBeDefined();
    });
  });
});
