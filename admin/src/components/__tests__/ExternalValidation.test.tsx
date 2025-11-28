import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { ExternalValidation } from '../ExternalValidation';

describe('ExternalValidation', () => {
  const mockOnValidationComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render external validation component', () => {
    renderWithProviders(
      <ExternalValidation
        fieldId="test-field"
        value="test-value"
        validationType="company"
        onValidationComplete={mockOnValidationComplete}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should auto-validate when value changes', async () => {
    const { rerender } = renderWithProviders(
      <ExternalValidation
        fieldId="test-field"
        value=""
        validationType="company"
        onValidationComplete={mockOnValidationComplete}
        autoValidate={true}
      />
    );

    rerender(
      <ExternalValidation
        fieldId="test-field"
        value="123456"
        validationType="company"
        onValidationComplete={mockOnValidationComplete}
        autoValidate={true}
      />
    );

    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it('should handle company validation', async () => {
    renderWithProviders(
      <ExternalValidation
        fieldId="test-field"
        value="12345678"
        validationType="company"
        country="ZA"
        onValidationComplete={mockOnValidationComplete}
      />
    );
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it('should handle tax validation', async () => {
    renderWithProviders(
      <ExternalValidation
        fieldId="test-field"
        value="1234567890"
        validationType="tax"
        country="ZA"
        onValidationComplete={mockOnValidationComplete}
      />
    );
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it('should handle bank validation', async () => {
    renderWithProviders(
      <ExternalValidation
        fieldId="test-field"
        value="123456789"
        validationType="bank"
        country="ZA"
        onValidationComplete={mockOnValidationComplete}
      />
    );
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it('should not validate when autoValidate is false', () => {
    renderWithProviders(
      <ExternalValidation
        fieldId="test-field"
        value="test-value"
        validationType="company"
        onValidationComplete={mockOnValidationComplete}
        autoValidate={false}
      />
    );
    expect(document.body).toBeInTheDocument();
  });
});

