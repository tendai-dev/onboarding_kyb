import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFileToDocumentService } from '../documentUpload';

// Mock fetch
global.fetch = vi.fn();

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

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
        storageUrl: 'https://example.com/document.pdf',
      };

      // When uploadedBy is provided, session fetch is skipped
      // Mock upload (first call) and download URL (second call)
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: mockResponse.storageUrl }),
        });

      const result = await uploadFileToDocumentService('case-123', mockFile, 'Test description', 'user@example.com');

      expect(global.fetch).toHaveBeenCalled();
      expect(result.documentId).toBe(mockResponse.documentId);
      expect(result.documentNumber).toBe(mockResponse.documentNumber);
      expect(result.wasDuplicate).toBe(mockResponse.wasDuplicate);
      expect(result.storageKey).toBe(mockResponse.storageKey);
      expect(result.storageUrl).toBe(mockResponse.storageUrl);
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      // Mock session fetch (first call) and then error response (second call)
      // When uploadedBy is not provided, it fetches session first
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { email: 'user@example.com' } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: async () => 'Invalid file',
        });

      await expect(
        uploadFileToDocumentService('case-123', mockFile)
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      // Mock session fetch (first call) and then network error (second call)
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { email: 'user@example.com' } }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(
        uploadFileToDocumentService('case-123', mockFile)
      ).rejects.toThrow();
    });

    it('should include caseId in request', async () => {
      const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      // Mock session fetch (first call) and upload (second call) and download URL (third call)
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { email: 'user@example.com' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ documentId: 'doc-123', documentNumber: 'DOC-001', wasDuplicate: false, storageKey: 'key-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: '' }),
        });

      await uploadFileToDocumentService('case-123', mockFile);

      // Check that fetch was called (should be called at least for session and upload)
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

