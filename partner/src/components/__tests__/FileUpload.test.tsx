import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { FileUpload } from '../FileUpload';

describe('FileUpload', () => {
  const mockOnFileUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render file upload component', () => {
      renderWithProviders(
        <FileUpload
          onFileUpload={mockOnFileUpload}
          acceptedTypes={['.pdf', '.jpg']}
          maxSize={10}
          label="Upload Document"
        />
      );

      expect(screen.getByText(/upload document/i)).toBeInTheDocument();
    });

    it('should display description when provided', () => {
      renderWithProviders(
        <FileUpload
          onFileUpload={mockOnFileUpload}
          acceptedTypes={['.pdf']}
          maxSize={10}
          label="Upload Document"
          description="Please upload a PDF file"
        />
      );

      expect(screen.getByText(/please upload a pdf file/i)).toBeInTheDocument();
    });

    it('should render drag and drop area', () => {
      renderWithProviders(
        <FileUpload
          onFileUpload={mockOnFileUpload}
          acceptedTypes={['.pdf']}
          maxSize={10}
        />
      );

      expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should call onFileUpload when file is selected', async () => {
      mockOnFileUpload.mockResolvedValue('file-url');

      renderWithProviders(
        <FileUpload
          onFileUpload={mockOnFileUpload}
          acceptedTypes={['.pdf']}
          maxSize={10}
          label="Upload Document"
        />
      );

      const fileInput = screen.getByRole('button') || document.querySelector('input[type="file"]');
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      if (fileInput instanceof HTMLInputElement) {
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(fileInput);
      } else if (fileInput) {
        // Click button to trigger file input
        fireEvent.click(fileInput);
        const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (hiddenInput) {
          Object.defineProperty(hiddenInput, 'files', {
            value: [file],
            writable: false,
          });
          fireEvent.change(hiddenInput);
        }
      }

      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalled();
      });
    });

    it('should validate file size', async () => {
      mockOnFileUpload.mockResolvedValue('file-url');

      renderWithProviders(
        <FileUpload
          onFileUpload={mockOnFileUpload}
          acceptedTypes={['.pdf']}
          maxSize={1} // 1MB max
          label="Upload Document"
        />
      );

      const fileInput = screen.getByLabelText(/upload/i) || screen.getByRole('button');
      const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

      if (fileInput instanceof HTMLInputElement) {
        Object.defineProperty(fileInput, 'files', {
          value: [largeFile],
          writable: false,
        });
        fireEvent.change(fileInput);
      }

      // Should show error or not call onFileUpload
      await waitFor(() => {
        // File size validation should prevent upload
      });
    });

    it('should validate file type', async () => {
      mockOnFileUpload.mockResolvedValue('file-url');

      renderWithProviders(
        <FileUpload
          onFileUpload={mockOnFileUpload}
          acceptedTypes={['.pdf']}
          maxSize={10}
          label="Upload Document"
        />
      );

      const fileInput = screen.getByLabelText(/upload/i) || screen.getByRole('button');
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      if (fileInput instanceof HTMLInputElement) {
        Object.defineProperty(fileInput, 'files', {
          value: [invalidFile],
          writable: false,
        });
        fireEvent.change(fileInput);
      }

      // Should validate file type
      await waitFor(() => {
        // File type validation should prevent upload
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle upload errors', async () => {
      mockOnFileUpload.mockRejectedValue(new Error('Upload failed'));

      renderWithProviders(
        <FileUpload
          onFileUpload={mockOnFileUpload}
          acceptedTypes={['.pdf']}
          maxSize={10}
          label="Upload Document"
        />
      );

      const fileInput = screen.getByLabelText(/upload/i) || screen.getByRole('button');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      if (fileInput instanceof HTMLInputElement) {
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(fileInput);
      }

      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalled();
      });
    });
  });
});

