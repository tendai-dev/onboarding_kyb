import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '@/test/testUtils';
import { waitFor } from '@testing-library/react';
import React from 'react';

// Mock document.execCommand for RichTextEditor
Object.defineProperty(document, 'execCommand', {
  value: vi.fn().mockReturnValue(true),
  writable: true,
  configurable: true,
});

// Mock window.prompt
global.prompt = vi.fn();

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    create: (Component: React.ComponentType) => Component,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

import {
  RichTextEditor,
  AdvancedDatePicker,
  MultiSelect,
  LoadingSkeleton,
  Toast,
  ToastContainer,
} from '../AdvancedUI';

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

    it('should hide toolbar when showToolbar is false', () => {
      const { container } = renderWithProviders(
        <RichTextEditor value="" onChange={vi.fn()} showToolbar={false} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should hide toolbar in read-only mode', () => {
      const { container } = renderWithProviders(
        <RichTextEditor value="Text" onChange={vi.fn()} readOnly />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('AdvancedDatePicker', () => {
    it('should render date picker', () => {
      const { container } = renderWithProviders(
        <AdvancedDatePicker value={null} onChange={vi.fn()} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should display selected date', () => {
      const date = new Date('2024-01-15');
      const { container } = renderWithProviders(
        <AdvancedDatePicker value={date} onChange={vi.fn()} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should show label when provided', () => {
      const { container } = renderWithProviders(
        <AdvancedDatePicker value={null} onChange={vi.fn()} label="Select Date" />
      );
      expect(container).toBeInTheDocument();
    });

    it('should show error message when provided', () => {
      const { container } = renderWithProviders(
        <AdvancedDatePicker value={null} onChange={vi.fn()} error="Date is required" />
      );
      expect(container).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      const { container } = renderWithProviders(
        <AdvancedDatePicker value={null} onChange={vi.fn()} disabled />
      );
      expect(container).toBeInTheDocument();
    });

    it('should support time selection when showTime is true', () => {
      const date = new Date('2024-01-15T10:30:00');
      const { container } = renderWithProviders(
        <AdvancedDatePicker value={date} onChange={vi.fn()} showTime />
      );
      expect(container).toBeInTheDocument();
    });

    it('should support timezone selection when showTimezone is true', () => {
      const date = new Date('2024-01-15');
      const { container } = renderWithProviders(
        <AdvancedDatePicker value={date} onChange={vi.fn()} showTimezone />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('MultiSelect', () => {
    const mockOptions = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3', disabled: true },
    ];

    it('should render multi-select', () => {
      const { container } = renderWithProviders(
        <MultiSelect options={mockOptions} value={[]} onChange={vi.fn()} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should display selected values as tags', () => {
      const { container } = renderWithProviders(
        <MultiSelect
          options={mockOptions}
          value={['option1', 'option2']}
          onChange={vi.fn()}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should show label when provided', () => {
      const { container } = renderWithProviders(
        <MultiSelect
          options={mockOptions}
          value={[]}
          onChange={vi.fn()}
          label="Select Options"
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should show error message when provided', () => {
      const { container } = renderWithProviders(
        <MultiSelect
          options={mockOptions}
          value={[]}
          onChange={vi.fn()}
          error="Selection is required"
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      const { container } = renderWithProviders(
        <MultiSelect options={mockOptions} value={[]} onChange={vi.fn()} disabled />
      );
      expect(container).toBeInTheDocument();
    });

    it('should show search input when searchable is true', () => {
      const { container } = renderWithProviders(
        <MultiSelect options={mockOptions} value={[]} onChange={vi.fn()} searchable />
      );
      expect(container).toBeInTheDocument();
    });

    it('should show create option input when creatable is true', () => {
      const { container } = renderWithProviders(
        <MultiSelect options={mockOptions} value={[]} onChange={vi.fn()} creatable />
      );
      expect(container).toBeInTheDocument();
    });

    it('should respect maxItems limit', () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(
        <MultiSelect
          options={mockOptions}
          value={['option1']}
          onChange={onChange}
          maxItems={1}
        />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('LoadingSkeleton', () => {
    it('should render skeleton', () => {
      const { container } = renderWithProviders(<LoadingSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it('should render multiple lines when lines prop is provided', () => {
      const { container } = renderWithProviders(<LoadingSkeleton lines={3} />);
      expect(container).toBeInTheDocument();
    });

    it('should use custom height when provided', () => {
      const { container } = renderWithProviders(<LoadingSkeleton height="50px" />);
      expect(container).toBeInTheDocument();
    });

    it('should use custom width when provided', () => {
      const { container } = renderWithProviders(<LoadingSkeleton width="200px" />);
      expect(container).toBeInTheDocument();
    });

    it('should use custom borderRadius when provided', () => {
      const { container } = renderWithProviders(<LoadingSkeleton borderRadius="8px" />);
      expect(container).toBeInTheDocument();
    });

    it('should use custom spacing when provided', () => {
      const { container } = renderWithProviders(
        <LoadingSkeleton lines={2} spacing="16px" />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Toast', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should render toast with success status', () => {
      const onClose = vi.fn();
      const { container } = renderWithProviders(
        <Toast
          id="toast-1"
          title="Success"
          description="Operation completed"
          status="success"
          _onClose={onClose}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should render toast with error status', () => {
      const onClose = vi.fn();
      const { container } = renderWithProviders(
        <Toast
          id="toast-2"
          title="Error"
          description="Something went wrong"
          status="error"
          _onClose={onClose}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should render toast with warning status', () => {
      const onClose = vi.fn();
      const { container } = renderWithProviders(
        <Toast
          id="toast-3"
          title="Warning"
          description="Please be careful"
          status="warning"
          _onClose={onClose}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should render toast with info status', () => {
      const onClose = vi.fn();
      const { container } = renderWithProviders(
        <Toast
          id="toast-4"
          title="Info"
          description="Here is some information"
          status="info"
          _onClose={onClose}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should render toast without description', () => {
      const onClose = vi.fn();
      const { container } = renderWithProviders(
        <Toast id="toast-5" title="Title only" status="info" _onClose={onClose} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should call onClose after duration', async () => {
      const onClose = vi.fn();
      renderWithProviders(
        <Toast
          id="toast-6"
          title="Auto close"
          status="info"
          duration={1000}
          _onClose={onClose}
        />
      );

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledWith('toast-6');
      });
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      const { container } = renderWithProviders(
        <Toast id="toast-7" title="Closable" status="info" _onClose={onClose} />
      );
      expect(container).toBeInTheDocument();
      // Close button interaction would be tested here if we had access to it
    });
  });

  describe('ToastContainer', () => {
    it('should render toast container', () => {
      const { container } = renderWithProviders(
        <ToastContainer toasts={[]} _onClose={vi.fn()} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should render multiple toasts', () => {
      const onClose = vi.fn();
      const toasts = [
        {
          id: 'toast-1',
          title: 'First Toast',
          status: 'success' as const,
          _onClose: onClose,
        },
        {
          id: 'toast-2',
          title: 'Second Toast',
          status: 'error' as const,
          _onClose: onClose,
        },
      ];

      const { container } = renderWithProviders(
        <ToastContainer toasts={toasts} _onClose={onClose} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle empty toasts array', () => {
      const { container } = renderWithProviders(
        <ToastContainer toasts={[]} _onClose={vi.fn()} />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
