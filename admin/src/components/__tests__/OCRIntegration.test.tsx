import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/testUtils';
import { OCRIntegration } from '../OCRIntegration';

// Mock FileUpload
vi.mock('../FileUpload', () => ({
  FileUpload: ({ onFileUpload }: { onFileUpload: (file: File) => Promise<string> }) => {
    const handleFileSelect = async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      await onFileUpload(file);
    };
    return (
      <div data-testid="file-upload">
        <button onClick={handleFileSelect}>Upload File</button>
      </div>
    );
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('OCRIntegration', () => {
  const mockOnDataExtracted = vi.fn();
  const mockOnDocumentProcessed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render OCR integration component', () => {
    const props = {
      onDataExtracted: mockOnDataExtracted,
      onDocumentProcessed: mockOnDocumentProcessed,
    };

    renderWithProviders(<OCRIntegration {...props} />);
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('should handle file upload', async () => {
    const props = {
      onDataExtracted: mockOnDataExtracted,
      onDocumentProcessed: mockOnDocumentProcessed,
    };

    renderWithProviders(<OCRIntegration {...props} />);
    
    const uploadButton = screen.getByText('Upload File');
    fireEvent.click(uploadButton);

    vi.advanceTimersByTime(3500);

    await waitFor(() => {
      expect(mockOnDocumentProcessed).toHaveBeenCalled();
    });
  });

  it('should render with entity type', () => {
    const props = {
      onDataExtracted: mockOnDataExtracted,
      onDocumentProcessed: mockOnDocumentProcessed,
      entityType: 'private_company',
    };

    renderWithProviders(<OCRIntegration {...props} />);
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('should handle document processing', async () => {
    const props = {
      onDataExtracted: mockOnDataExtracted,
      onDocumentProcessed: mockOnDocumentProcessed,
      documentType: 'certificate_incorporation',
    };

    renderWithProviders(<OCRIntegration {...props} />);
    
    const uploadButton = screen.getByText('Upload File');
    fireEvent.click(uploadButton);

    vi.advanceTimersByTime(3500);

    await waitFor(() => {
      expect(mockOnDocumentProcessed).toHaveBeenCalled();
    });
  });

  it('should handle different document types', () => {
    const props = {
      onDataExtracted: mockOnDataExtracted,
      onDocumentProcessed: mockOnDocumentProcessed,
      documentType: 'tax_certificate',
    };

    renderWithProviders(<OCRIntegration {...props} />);
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });
});

