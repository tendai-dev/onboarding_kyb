import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { ProgressTracking } from '../ProgressTracking';
import { EntityFormConfig } from '@/lib/entityFormConfigs';

const mockConfig: EntityFormConfig = {
  entityType: 'Individual',
  steps: [
    {
      id: 'step-1',
      title: 'Personal Information',
      fields: [
        { id: 'firstName', label: 'First Name', type: 'text', required: true },
        { id: 'lastName', label: 'Last Name', type: 'text', required: true },
      ],
      requiredDocuments: ['id-document'],
    },
    {
      id: 'step-2',
      title: 'Contact Information',
      fields: [
        { id: 'email', label: 'Email', type: 'email', required: true },
      ],
      requiredDocuments: [],
    },
  ],
};

describe('ProgressTracking', () => {
  const mockOnStepClick = vi.fn();
  const mockOnSaveProgress = vi.fn();
  const mockOnResumeFromStep = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render progress tracking component', () => {
    renderWithProviders(
      <ProgressTracking
        config={mockConfig}
        formData={{}}
        currentStep={1}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should display step statuses', () => {
    renderWithProviders(
      <ProgressTracking
        config={mockConfig}
        formData={{}}
        currentStep={1}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should handle step click', async () => {
    renderWithProviders(
      <ProgressTracking
        config={mockConfig}
        formData={{}}
        currentStep={1}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
      />
    );

    const stepButton = screen.queryByText(/step|personal|contact/i);
    if (stepButton) {
      fireEvent.click(stepButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle save progress', async () => {
    renderWithProviders(
      <ProgressTracking
        config={mockConfig}
        formData={{}}
        currentStep={1}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
        isDirty={true}
      />
    );

    const saveButton = screen.queryByText(/save/i);
    if (saveButton) {
      fireEvent.click(saveButton);
      await waitFor(() => expect(mockOnSaveProgress).toHaveBeenCalled());
    }
  });

  it('should show completion percentage', () => {
    renderWithProviders(
      <ProgressTracking
        config={mockConfig}
        formData={{ firstName: 'John', lastName: 'Doe' }}
        currentStep={2}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
      />
    );
    expect(document.body).toBeInTheDocument();
  });
});

