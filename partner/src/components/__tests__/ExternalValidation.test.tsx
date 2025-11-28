import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { ExternalValidation } from '../ExternalValidation';

describe('ExternalValidation', () => {
  const defaultProps = {
    fieldId: 'test-field',
    value: 'test-value',
    validationType: 'company' as const,
    country: 'ZA',
    onValidationComplete: vi.fn(),
    autoValidate: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render component', () => {
    const { container } = renderWithProviders(<ExternalValidation {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should call onValidationComplete when value changes and autoValidate is true', async () => {
    const onValidationComplete = vi.fn();
    renderWithProviders(
      <ExternalValidation {...defaultProps} value="123456" autoValidate={true} onValidationComplete={onValidationComplete} />
    );
    
    // Advance timers to trigger validation
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(onValidationComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should not validate if value is too short', async () => {
    const onValidationComplete = vi.fn();
    renderWithProviders(
      <ExternalValidation {...defaultProps} value="12" autoValidate={true} onValidationComplete={onValidationComplete} />
    );
    
    await waitFor(() => {
      // Should not validate short values
      expect(onValidationComplete).not.toHaveBeenCalled();
    });
  });

  it('should handle company validation type', async () => {
    const onValidationComplete = vi.fn();
    renderWithProviders(
      <ExternalValidation {...defaultProps} value="1234/567890/12" validationType="company" autoValidate={true} onValidationComplete={onValidationComplete} />
    );
    
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(onValidationComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should handle tax validation type', async () => {
    const onValidationComplete = vi.fn();
    renderWithProviders(
      <ExternalValidation {...defaultProps} value="1234567890" validationType="tax" autoValidate={true} onValidationComplete={onValidationComplete} />
    );
    
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(onValidationComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should handle bank validation type', async () => {
    const onValidationComplete = vi.fn();
    renderWithProviders(
      <ExternalValidation {...defaultProps} value="1234567890" validationType="bank" autoValidate={true} onValidationComplete={onValidationComplete} />
    );
    
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(onValidationComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should handle npo validation type', async () => {
    const onValidationComplete = vi.fn();
    renderWithProviders(
      <ExternalValidation {...defaultProps} value="NPO123456" validationType="npo" autoValidate={true} onValidationComplete={onValidationComplete} />
    );
    
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(onValidationComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should handle government validation type', async () => {
    const onValidationComplete = vi.fn();
    renderWithProviders(
      <ExternalValidation {...defaultProps} value="GOV123456" validationType="government" autoValidate={true} onValidationComplete={onValidationComplete} />
    );
    
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(onValidationComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should handle validation errors', async () => {
    const onValidationComplete = vi.fn();
    renderWithProviders(
      <ExternalValidation {...defaultProps} value="error-test" autoValidate={true} onValidationComplete={onValidationComplete} />
    );
    
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(onValidationComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should not validate same value twice', async () => {
    const onValidationComplete = vi.fn();
    const { rerender } = renderWithProviders(
      <ExternalValidation {...defaultProps} value="123456" autoValidate={true} onValidationComplete={onValidationComplete} />
    );
    
    await waitFor(() => {
      expect(onValidationComplete).toHaveBeenCalled();
    }, { timeout: 2000 });
    
    const callCount = onValidationComplete.mock.calls.length;
    
    // Rerender with same value
    rerender(
      <ExternalValidation {...defaultProps} value="123456" autoValidate={true} onValidationComplete={onValidationComplete} />
    );
    
    // Should not validate again
    await waitFor(() => {
      expect(onValidationComplete.mock.calls.length).toBe(callCount);
    });
  });
});

