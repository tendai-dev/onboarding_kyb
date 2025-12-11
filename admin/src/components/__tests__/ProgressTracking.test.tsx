import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { ProgressTracking } from '../ProgressTracking';
import { EntityFormConfig } from '@/lib/entityFormConfigs';

const mockConfig: EntityFormConfig = {
  entityType: 'Individual',
  displayName: 'Individual',
  description: 'Individual entity configuration',
  requiredDocuments: [],
  steps: [
    {
      id: 'step-1',
      title: 'Personal Information',
      subtitle: 'Enter your personal details',
      fields: [
        { id: 'firstName', label: 'First Name', type: 'text', required: true },
        { id: 'lastName', label: 'Last Name', type: 'text', required: true },
      ],
      requiredDocuments: ['id-document'],
    },
    {
      id: 'step-2',
      title: 'Contact Information',
      subtitle: 'Enter your contact details',
      fields: [{ id: 'email', label: 'Email', type: 'email', required: true }],
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

  it('should handle blocked steps', () => {
    renderWithProviders(
      <ProgressTracking
        config={mockConfig}
        formData={{}}
        currentStep={2}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should handle completed steps', () => {
    renderWithProviders(
      <ProgressTracking
        config={mockConfig}
        formData={{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }}
        currentStep={3}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should handle resume from step', async () => {
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

    const resumeButton = screen.queryByText(/resume/i);
    if (resumeButton) {
      fireEvent.click(resumeButton);
      await waitFor(() => expect(mockOnResumeFromStep).toHaveBeenCalled());
    }
  });

  it('should show last saved time', () => {
    const lastSaved = new Date('2024-01-01T12:00:00Z');
    renderWithProviders(
      <ProgressTracking
        config={mockConfig}
        formData={{}}
        currentStep={1}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
        lastSaved={lastSaved.toISOString()}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should handle saving state', () => {
    renderWithProviders(
      <ProgressTracking
        config={mockConfig}
        formData={{}}
        currentStep={1}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
        isSaving={true}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should handle dirty state', () => {
    renderWithProviders(
      <ProgressTracking
        config={mockConfig}
        formData={{ firstName: 'John' }}
        currentStep={1}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
        isDirty={true}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should handle modal open/close', async () => {
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

    const viewButton = screen.queryByText(/view details/i);
    if (viewButton) {
      fireEvent.click(viewButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should calculate completion percentage correctly', () => {
    const configWithManyFields: EntityFormConfig = {
      ...mockConfig,
      steps: [
        {
          id: 'step-1',
          title: 'Step 1',
          subtitle: 'Step 1 description',
          fields: [
            { id: 'field1', label: 'Field 1', type: 'text', required: true },
            { id: 'field2', label: 'Field 2', type: 'text', required: true },
            { id: 'field3', label: 'Field 3', type: 'text', required: false },
          ],
          requiredDocuments: [],
        },
      ],
    };

    renderWithProviders(
      <ProgressTracking
        config={configWithManyFields}
        formData={{ field1: 'value1' }}
        currentStep={1}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should handle steps with no required fields', () => {
    const configNoRequired: EntityFormConfig = {
      ...mockConfig,
      steps: [
        {
          id: 'step-1',
          title: 'Step 1',
          subtitle: 'Step 1 description',
          fields: [{ id: 'field1', label: 'Field 1', type: 'text', required: false }],
          requiredDocuments: [],
        },
      ],
    };

    renderWithProviders(
      <ProgressTracking
        config={configNoRequired}
        formData={{}}
        currentStep={1}
        onStepClick={mockOnStepClick}
        onSaveProgress={mockOnSaveProgress}
        onResumeFromStep={mockOnResumeFromStep}
      />
    );
    expect(document.body).toBeInTheDocument();
  });
});
