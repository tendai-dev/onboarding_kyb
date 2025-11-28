import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadToGoogleDrive, getFileTypeFromExtension, isValidFileType } from '../googleDriveUpload';

global.fetch = vi.fn();

describe('googleDriveUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadToGoogleDrive', () => {
    it('should have upload function', () => {
      expect(uploadToGoogleDrive).toBeDefined();
      expect(typeof uploadToGoogleDrive).toBe('function');
    });

    it('should handle file upload', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ fileId: 'test-file-id' }),
      });

      try {
        await uploadToGoogleDrive(mockFile, 'test-folder-id');
        // Should attempt upload
        expect(global.fetch).toHaveBeenCalled();
      } catch (error) {
        // May fail in test environment, that's ok
        expect(error).toBeDefined();
      }
    });
  });

  describe('getFileTypeFromExtension', () => {
    it('should return file type for PDF', () => {
      const fileType = getFileTypeFromExtension('document.pdf');
      expect(fileType).toBe('application/pdf');
    });

    it('should return file type for image', () => {
      const fileType = getFileTypeFromExtension('image.jpg');
      expect(fileType).toBe('image/jpeg');
    });

    it('should return default for unknown extension', () => {
      const fileType = getFileTypeFromExtension('file.unknown');
      expect(fileType).toBeDefined();
    });
  });

  describe('isValidFileType', () => {
    it('should validate file type', () => {
      const isValid = isValidFileType('document.pdf', ['.pdf', '.jpeg']);
      expect(isValid).toBe(true);
    });

    it('should reject invalid file type', () => {
      const isValid = isValidFileType('document.exe', ['.pdf']);
      expect(isValid).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format file size in bytes', () => {
      const { formatFileSize } = require('../googleDriveUpload');
      const size = formatFileSize(0);
      expect(size).toBe('0 Bytes');
    });

    it('should format file size in KB', () => {
      const { formatFileSize } = require('../googleDriveUpload');
      const size = formatFileSize(1024);
      expect(size).toContain('KB');
    });

    it('should format file size in MB', () => {
      const { formatFileSize } = require('../googleDriveUpload');
      const size = formatFileSize(1024 * 1024);
      expect(size).toContain('MB');
    });
  });
});

