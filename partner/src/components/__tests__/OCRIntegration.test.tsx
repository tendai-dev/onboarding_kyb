import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { OCRIntegration } from '../OCRIntegration';

// Mock FileUpload component
vi.mock('../FileUpload', () => ({
  FileUpload: ({ onFileUpload }: unknown) => (
    <div data-testid="file-upload">
      <input
        type="file"
        data-testid="file-input"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onFileUpload(e.target.files[0]);
          }
        }}
      />
    </div>
  ),
}));

describe('OCRIntegration', () => {
  const defaultProps = {
    onDataExtracted: vi.fn(),
    onDocumentProcessed: vi.fn(),
    entityType: 'private_company',
    documentType: 'certificate_incorporation',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render component', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = renderWithProviders(<OCRIntegration {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should handle file upload', async () => {
    const onDocumentProcessed = vi.fn();
    renderWithProviders(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <OCRIntegration {...defaultProps} onDocumentProcessed={onDocumentProcessed} />
    );

    const fileInput = screen.getByTestId('file-input');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Advance timers to simulate OCR processing
    vi.advanceTimersByTime(4000);

    // Wait for processing to complete
    await waitFor(
      () => {
        expect(onDocumentProcessed).toHaveBeenCalled();
      },
      { timeout: 6000 }
    );
  });

  it('should handle different entity types', () => {
    const { rerender } = renderWithProviders(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <OCRIntegration {...defaultProps} entityType="private_company" />
    );
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();

    // eslint-disable-next-line react/jsx-props-no-spreading
    rerender(<OCRIntegration {...defaultProps} entityType="public_company" />);
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('should handle different document types', () => {
    const { rerender } = renderWithProviders(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <OCRIntegration {...defaultProps} documentType="certificate_incorporation" />
    );
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();

    // eslint-disable-next-line react/jsx-props-no-spreading
    rerender(<OCRIntegration {...defaultProps} documentType="tax_certificate" />);
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('should call onDataExtracted when data is extracted', async () => {
    const onDataExtracted = vi.fn();
    renderWithProviders(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <OCRIntegration {...defaultProps} onDataExtracted={onDataExtracted} />
    );

    const fileInput = screen.getByTestId('file-input');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Advance timers to simulate OCR processing
    vi.advanceTimersByTime(4000);

    await waitFor(
      () => {
        expect(onDataExtracted).toHaveBeenCalled();
      },
      { timeout: 6000 }
    );
  });

  it('should respect maxFileSize prop', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    renderWithProviders(<OCRIntegration {...defaultProps} maxFileSize={5} />);
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('should respect acceptedTypes prop', () => {
    renderWithProviders(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <OCRIntegration {...defaultProps} acceptedTypes={['.pdf', '.jpg']} />
    );
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });
});
