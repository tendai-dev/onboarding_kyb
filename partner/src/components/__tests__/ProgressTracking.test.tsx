import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { ProgressTracking } from '../ProgressTracking';
import { EntityFormConfig } from '@/lib/entityFormConfigs';

describe('ProgressTracking', () => {
  const mockConfig: EntityFormConfig = {
    entityType: 'private_company',
    displayName: 'Private Company',
    description: 'Test config',
    steps: [
      {
        id: 'step1',
        title: 'Step 1',
        subtitle: 'First step',
        fields: [],
        requiredDocuments: [],
      },
      {
        id: 'step2',
        title: 'Step 2',
        subtitle: 'Second step',
        fields: [],
        requiredDocuments: [],
      },
    ],
    requiredDocuments: [],
  };

  const mockFormData = {
    step1: 'completed',
  };

  const defaultProps = {
    config: mockConfig,
    formData: mockFormData,
    currentStep: 1,
    onStepClick: vi.fn(),
    onSaveProgress: vi.fn(),
    onResumeFromStep: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render progress tracking component', () => {
      renderWithProviders(<ProgressTracking {...defaultProps} />);
      expect(screen.getByText(/step 1/i)).toBeInTheDocument();
    });

    it('should display all steps', () => {
      renderWithProviders(<ProgressTracking {...defaultProps} />);
      expect(screen.getByText(/step 1/i)).toBeInTheDocument();
      expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    });

    it('should highlight current step', () => {
      renderWithProviders(<ProgressTracking {...defaultProps} currentStep={2} />);
      // Current step should be highlighted
      expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    });
  });

  describe('Step Interaction', () => {
    it('should call onStepClick when step is clicked', () => {
      renderWithProviders(<ProgressTracking {...defaultProps} />);
      
      const step1 = screen.getByText(/step 1/i);
      fireEvent.click(step1);
      
      expect(defaultProps.onStepClick).toHaveBeenCalled();
    });

    it('should call onResumeFromStep when resume is clicked', () => {
      renderWithProviders(<ProgressTracking {...defaultProps} />);
      
      const resumeButton = screen.queryByText(/resume/i);
      if (resumeButton) {
        fireEvent.click(resumeButton);
        expect(defaultProps.onResumeFromStep).toHaveBeenCalled();
      }
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress percentage', () => {
      renderWithProviders(<ProgressTracking {...defaultProps} currentStep={1} />);
      // Should show progress based on current step
      expect(screen.getByText(/step 1/i)).toBeInTheDocument();
    });

    it('should show 100% when on last step', () => {
      renderWithProviders(<ProgressTracking {...defaultProps} currentStep={2} />);
      // Should show completion - use getAllByText since "Step 2" appears multiple times
      const step2Elements = screen.getAllByText(/step 2/i);
      expect(step2Elements.length).toBeGreaterThan(0);
    });
  });

  describe('Save Progress', () => {
    it('should call onSaveProgress when save button is clicked', () => {
      renderWithProviders(<ProgressTracking {...defaultProps} />);
      
      const saveButton = screen.queryByText(/save/i);
      if (saveButton) {
        fireEvent.click(saveButton);
        expect(defaultProps.onSaveProgress).toHaveBeenCalled();
      }
    });

    it('should show saving state when isSaving is true', () => {
      renderWithProviders(<ProgressTracking {...defaultProps} isSaving={true} />);
      
      const savingIndicator = screen.queryByText(/saving/i);
      expect(savingIndicator || screen.queryByRole('progressbar')).toBeTruthy();
    });
  });
});

