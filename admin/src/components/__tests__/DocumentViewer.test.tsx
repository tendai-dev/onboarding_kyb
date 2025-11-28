import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/testUtils';
import { DocumentViewer } from '../DocumentViewer';

// Mock fetch
global.fetch = vi.fn();

describe('DocumentViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render document viewer', () => {
    const props = {
      isOpen: true,
      onClose: vi.fn(),
      documentUrl: 'https://example.com/test.pdf',
      fileName: 'test.pdf',
    };

    const { container } = renderWithProviders(<DocumentViewer {...props} />);
    expect(container).toBeInTheDocument();
  });

  it('should handle missing fileUrl', () => {
    const props = {
      isOpen: true,
      onClose: vi.fn(),
      documentUrl: null,
      fileName: 'test.pdf',
    };

    const { container } = renderWithProviders(<DocumentViewer {...props} />);
    expect(container).toBeInTheDocument();
  });

  it('should render when closed', () => {
    const props = {
      isOpen: false,
      onClose: vi.fn(),
      documentUrl: 'https://example.com/test.pdf',
      fileName: 'test.pdf',
    };

    const { container } = renderWithProviders(<DocumentViewer {...props} />);
    expect(container).toBeInTheDocument();
  });
});

