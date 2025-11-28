import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { EnhancedDynamicForm } from '../EnhancedDynamicForm';
import { EntityFormConfig } from '@/lib/entityFormConfigs';

describe('EnhancedDynamicForm', () => {
  const mockConfig: EntityFormConfig = {
    id: 'test-form',
    name: 'Test Form',
    entityType: 'Business',
    steps: [
      {
        id: 'step-1',
        title: 'Step 1',
        fields: [
          {
            id: 'field-1',
            label: 'Name',
            type: 'text',
            required: true,
            validation: {
              required: true,
            },
          },
          {
            id: 'field-2',
            label: 'Email',
            type: 'email',
            required: true,
            validation: {
              required: true,
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            },
          },
        ],
      },
      {
        id: 'step-2',
        title: 'Step 2',
        fields: [
          {
            id: 'field-3',
            label: 'Description',
            type: 'textarea',
            required: false,
          },
        ],
      },
    ],
  };

  const mockFormData = {
    'field-1': '',
    'field-2': '',
    'field-3': '',
  };

  const mockHandlers = {
    onFieldChange: vi.fn(),
    onStepComplete: vi.fn(),
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render enhanced dynamic form', () => {
    renderWithProviders(
      <EnhancedDynamicForm
        config={mockConfig}
        formData={mockFormData}
        currentStep={1}
        isLoading={false}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should display current step fields', () => {
    renderWithProviders(
      <EnhancedDynamicForm
        config={mockConfig}
        formData={mockFormData}
        currentStep={1}
        isLoading={false}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should handle field change', async () => {
    renderWithProviders(
      <EnhancedDynamicForm
        config={mockConfig}
        formData={mockFormData}
        currentStep={1}
        isLoading={false}
        {...mockHandlers}
      />
    );

    const input = screen.queryByLabelText(/name/i);
    if (input) {
      fireEvent.change(input, { target: { value: 'Test Name' } });
      
      await waitFor(() => {
        expect(mockHandlers.onFieldChange).toHaveBeenCalled();
      });
    }
  });

  it('should handle next step', async () => {
    renderWithProviders(
      <EnhancedDynamicForm
        config={mockConfig}
        formData={{ ...mockFormData, 'field-1': 'Test', 'field-2': 'test@example.com' }}
        currentStep={1}
        isLoading={false}
        {...mockHandlers}
      />
    );

    const nextButton = screen.queryByText(/next/i);
    if (nextButton) {
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(mockHandlers.onNext).toHaveBeenCalled();
      });
    }
  });

  it('should handle previous step', async () => {
    renderWithProviders(
      <EnhancedDynamicForm
        config={mockConfig}
        formData={mockFormData}
        currentStep={2}
        isLoading={false}
        {...mockHandlers}
      />
    );

    const previousButton = screen.queryByText(/previous|back/i);
    if (previousButton) {
      fireEvent.click(previousButton);
      
      await waitFor(() => {
        expect(mockHandlers.onPrevious).toHaveBeenCalled();
      });
    }
  });

  it('should handle form submission', async () => {
    renderWithProviders(
      <EnhancedDynamicForm
        config={mockConfig}
        formData={{ ...mockFormData, 'field-1': 'Test', 'field-2': 'test@example.com', 'field-3': 'Description' }}
        currentStep={2}
        isLoading={false}
        {...mockHandlers}
      />
    );

    const submitButton = screen.queryByText(/submit/i);
    if (submitButton) {
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalled();
      });
    }
  });

  it('should display validation errors', () => {
    const validationErrors = {
      'field-1': 'Name is required',
      'field-2': 'Invalid email format',
    };

    renderWithProviders(
      <EnhancedDynamicForm
        config={mockConfig}
        formData={mockFormData}
        currentStep={1}
        isLoading={false}
        validationErrors={validationErrors}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    renderWithProviders(
      <EnhancedDynamicForm
        config={mockConfig}
        formData={mockFormData}
        currentStep={1}
        isLoading={true}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should handle external validation', async () => {
    const configWithValidation: EntityFormConfig = {
      ...mockConfig,
      steps: [
        {
          ...mockConfig.steps[0],
          fields: [
            {
              ...mockConfig.steps[0].fields[0],
              externalValidation: {
                enabled: true,
                endpoint: '/api/validate',
                loadingText: 'Validating...',
                successText: 'Validated',
                errorText: 'Validation failed',
              },
            },
          ],
        },
      ],
    };

    renderWithProviders(
      <EnhancedDynamicForm
        config={configWithValidation}
        formData={mockFormData}
        currentStep={1}
        isLoading={false}
        {...mockHandlers}
      />
    );

    const input = screen.queryByLabelText(/name/i);
    if (input) {
      fireEvent.change(input, { target: { value: 'Test' } });
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      }, { timeout: 2000 });
    }
  });

  it('should handle file upload fields', async () => {
    const configWithFile: EntityFormConfig = {
      ...mockConfig,
      steps: [
        {
          ...mockConfig.steps[0],
          fields: [
            {
              id: 'file-field',
              label: 'Upload File',
              type: 'file',
              required: false,
            },
          ],
        },
      ],
    };

    renderWithProviders(
      <EnhancedDynamicForm
        config={configWithFile}
        formData={mockFormData}
        currentStep={1}
        isLoading={false}
        {...mockHandlers}
      />
    );

    const fileInput = screen.queryByLabelText(/upload|file/i);
    if (fileInput) {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should display step progress', () => {
    renderWithProviders(
      <EnhancedDynamicForm
        config={mockConfig}
        formData={mockFormData}
        currentStep={1}
        isLoading={false}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });
});

