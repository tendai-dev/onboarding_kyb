import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadToGoogleDrive } from '../googleDriveUpload';

describe('googleDriveUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should upload file to Google Drive', async () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    const uploadPromise = uploadToGoogleDrive(file, 'Test Folder');
    
    vi.advanceTimersByTime(2000);
    
    const result = await uploadPromise;
    
    expect(result).toContain('drive.google.com');
    expect(typeof result).toBe('string');
  });

  it('should use default folder name when not provided', async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    const uploadPromise = uploadToGoogleDrive(file);
    
    vi.advanceTimersByTime(2000);
    
    const result = await uploadPromise;
    
    expect(result).toBeDefined();
  });

  it('should handle different file types', async () => {
    const fileTypes = [
      { name: 'document.pdf', type: 'application/pdf' },
      { name: 'image.jpg', type: 'image/jpeg' },
      { name: 'spreadsheet.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    ];

    for (const fileType of fileTypes) {
      const file = new File(['content'], fileType.name, { type: fileType.type });
      const uploadPromise = uploadToGoogleDrive(file);
      
      vi.advanceTimersByTime(2000);
      
      const result = await uploadPromise;
      expect(result).toBeDefined();
    }
  });
});

