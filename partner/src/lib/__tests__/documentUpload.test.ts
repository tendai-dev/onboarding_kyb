import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFileToDocumentService, uploadFilesToDocumentService, mapRequirementCodeToDocumentType, DocumentType } from '../documentUpload';

// Mock fetch
global.fetch = vi.fn();

describe('documentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadFileToDocumentService', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const mockResponse = {
        documentId: 'doc-123',
        documentNumber: 'DOC-001',
        wasDuplicate: false,
        storageKey: 'storage-key-123',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await uploadFileToDocumentService(
        'case-123',
        'partner-456',
        mockFile,
        DocumentType.Other,
        'Test description',
        'user@example.com'
      );

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid file',
      });

      await expect(
        uploadFileToDocumentService('case-123', 'partner-456', mockFile)
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(
        uploadFileToDocumentService('case-123', 'partner-456', mockFile)
      ).rejects.toThrow('Network error');
    });
  });

  describe('uploadFilesToDocumentService', () => {
    it('should upload multiple files', async () => {
      const mockFiles = [
        { file: new File(['content1'], 'document1.pdf', { type: 'application/pdf' }), requirementCode: 'passport' },
        { file: new File(['content2'], 'document2.pdf', { type: 'application/pdf' }), requirementCode: 'bank_statement' },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          documentId: 'doc-123',
          documentNumber: 'DOC-001',
          wasDuplicate: false,
          storageKey: 'storage-key-123',
        }),
      });

      const results = await uploadFilesToDocumentService('case-123', 'partner-456', mockFiles, 'user@example.com');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
    });

    it('should handle upload errors for some files', async () => {
      const mockFiles = [
        { file: new File(['content1'], 'document1.pdf', { type: 'application/pdf' }) },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Error',
      });

      const results = await uploadFilesToDocumentService('case-123', 'partner-456', mockFiles);
      expect(Array.isArray(results)).toBe(true);
      expect(results[0].error).toBeDefined();
    });
  });

  describe('mapRequirementCodeToDocumentType', () => {
    it('should map requirement codes to document types', () => {
      expect(mapRequirementCodeToDocumentType('passport')).toBe(DocumentType.PassportCopy);
      expect(mapRequirementCodeToDocumentType('drivers_license')).toBe(DocumentType.DriversLicense);
      expect(mapRequirementCodeToDocumentType('drivers')).toBe(DocumentType.DriversLicense);
      expect(mapRequirementCodeToDocumentType('license')).toBe(DocumentType.DriversLicense);
      expect(mapRequirementCodeToDocumentType('national_id')).toBe(DocumentType.NationalId);
      expect(mapRequirementCodeToDocumentType('nationalid')).toBe(DocumentType.NationalId);
      expect(mapRequirementCodeToDocumentType('id_number')).toBe(DocumentType.NationalId);
      expect(mapRequirementCodeToDocumentType('proof_of_address')).toBe(DocumentType.ProofOfAddress);
      expect(mapRequirementCodeToDocumentType('address')).toBe(DocumentType.ProofOfAddress);
      expect(mapRequirementCodeToDocumentType('bank_statement')).toBe(DocumentType.BankStatement);
      expect(mapRequirementCodeToDocumentType('bank')).toBe(DocumentType.BankStatement);
      expect(mapRequirementCodeToDocumentType('statement')).toBe(DocumentType.BankStatement);
      expect(mapRequirementCodeToDocumentType('tax')).toBe(DocumentType.TaxDocument);
      expect(mapRequirementCodeToDocumentType('business_registration')).toBe(DocumentType.BusinessRegistration);
      expect(mapRequirementCodeToDocumentType('registration')).toBe(DocumentType.BusinessRegistration);
      expect(mapRequirementCodeToDocumentType('articles')).toBe(DocumentType.ArticlesOfIncorporation);
      expect(mapRequirementCodeToDocumentType('incorporation')).toBe(DocumentType.ArticlesOfIncorporation);
      expect(mapRequirementCodeToDocumentType('shareholder')).toBe(DocumentType.ShareholderRegistry);
      expect(mapRequirementCodeToDocumentType('share_register')).toBe(DocumentType.ShareholderRegistry);
      expect(mapRequirementCodeToDocumentType('financial')).toBe(DocumentType.FinancialStatements);
      expect(mapRequirementCodeToDocumentType('unknown')).toBe(DocumentType.Other);
      expect(mapRequirementCodeToDocumentType('')).toBe(DocumentType.Other);
    });
  });
});

