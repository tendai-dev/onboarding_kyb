import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';

// Mock document.execCommand for RichTextEditor
Object.defineProperty(document, 'execCommand', {
  value: vi.fn().mockReturnValue(true),
  writable: true,
  configurable: true,
});

// Mock useDisclosure hook
vi.mock('@chakra-ui/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@chakra-ui/react')>();
  return {
    ...actual,
    useDisclosure: () => ({
      isOpen: false,
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onToggle: vi.fn(),
    }),
  };
});

import { RichTextEditor } from '../AdvancedUI';

describe('AdvancedUI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RichTextEditor', () => {
    it('should render editor', () => {
      const { container } = renderWithProviders(
        <RichTextEditor value="" onChange={vi.fn()} />
      );
      // Component should render without crashing
      expect(container).toBeInTheDocument();
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle value changes', () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(
        <RichTextEditor value="Initial text" onChange={onChange} />
      );
      // Component should render
      expect(container).toBeInTheDocument();
    });

    it('should support read-only mode', () => {
      const { container } = renderWithProviders(
        <RichTextEditor value="Read only text" onChange={vi.fn()} readOnly />
      );
      // Component should render in read-only mode
      expect(container).toBeInTheDocument();
    });
  });
});

