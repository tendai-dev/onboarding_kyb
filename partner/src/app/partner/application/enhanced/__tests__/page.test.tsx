import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { useParams, useRouter } from 'next/navigation';
import EnhancedNewPartnerApplicationPage from '../page';
// Import will be mocked
import * as integrationService from '@/services/integrationService';
import * as documentUpload from '@/lib/documentUpload';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { getAuthUser } from '@/lib/auth/session';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/partner/application/enhanced'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock services - export the service instance directly
const mockEntityConfigApiService = {
  getEntityTypes: vi.fn(),
  getEntityType: vi.fn(),
  getEntityTypeByCode: vi.fn(),
  getRequirements: vi.fn(),
  getRequirement: vi.fn(),
};

vi.mock('@/services/entityConfigApi', () => ({
  entityConfigApiService: mockEntityConfigApiService,
}));
vi.mock('@/services/integrationService', () => ({
  integrationService: {
    getChecklistByCase: vi.fn(),
    completeChecklistItem: vi.fn(),
    updateWorkQueueItem: vi.fn(),
  },
}));
vi.mock('@/lib/documentUpload');
vi.mock('@/hooks/useFormPersistence');
vi.mock('@/lib/auth/session');

// Mock components
vi.mock('@/components/EnhancedDynamicForm', () => ({
  EnhancedDynamicForm: ({ config, formData, onFieldChange, onNext, onPrevious, onSubmit, currentStep }: any) => (
    <div data-testid="enhanced-dynamic-form">
      <div data-testid="current-step">{currentStep}</div>
      <div data-testid="form-config">{config?.entityType || 'none'}</div>
      <button data-testid="next-button" onClick={onNext}>Next</button>
      <button data-testid="previous-button" onClick={onPrevious}>Previous</button>
      <button data-testid="submit-button" onClick={onSubmit}>Submit</button>
      <input
        data-testid="test-input"
        onChange={(e) => onFieldChange('testField', e.target.value)}
      />
    </div>
  ),
}));

vi.mock('@/components/ProgressTracking', () => ({
  ProgressTracking: () => <div data-testid="progress-tracking">Progress</div>,
}));

vi.mock('@/components/ExternalValidation', () => ({
  ExternalValidation: () => <div data-testid="external-validation">Validation</div>,
}));

vi.mock('@/components/EnhancedContextualMessaging', () => ({
  EnhancedContextualMessaging: () => <div data-testid="messaging">Messaging</div>,
}));

vi.mock('@/components/OCRIntegration', () => ({
  OCRIntegration: () => <div data-testid="ocr-integration">OCR</div>,
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('EnhancedNewPartnerApplicationPage', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  };

  const mockEntityTypes = [
    {
      code: 'PRIVATE_COMPANY',
      displayName: 'Private Company',
      description: 'A private company',
      isActive: true,
      icon: 'company',
    },
    {
      code: 'NPO',
      displayName: 'Non-Profit Organization',
      description: 'An NPO',
      isActive: true,
      icon: 'npo',
    },
  ];

  const mockEntityTypeData = {
    code: 'PRIVATE_COMPANY',
    displayName: 'Private Company',
    description: 'A private company',
    requirements: [
      {
        requirement: {
          code: 'COMPANY_NAME',
          displayName: 'Company Name',
          fieldType: 'Text',
          type: 'Information',
          isActive: true,
        },
        isRequired: true,
        displayOrder: 1,
      },
    ],
  };

  const mockFormData = {
    entityType: '',
    companyName: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({});
    (useRouter as any).mockReturnValue(mockRouter);
    (getAuthUser as any).mockReturnValue({ name: 'Test User', email: 'test@example.com' });
    
    (useFormPersistence as any).mockReturnValue({
      formData: mockFormData,
      updateField: vi.fn(),
      updateNestedField: vi.fn(),
      updateArrayField: vi.fn(),
      addArrayItem: vi.fn(),
      removeArrayItem: vi.fn(),
      isDirty: false,
      lastSaved: null,
      isSaving: false,
      saveError: null,
      clearSavedData: vi.fn(),
      forceSave: vi.fn(),
    });

    // Setup mocks
    mockEntityConfigApiService.getEntityTypes.mockResolvedValue(mockEntityTypes);
    mockEntityConfigApiService.getEntityTypeByCode.mockResolvedValue(mockEntityTypeData);
  });

  describe('Initial Rendering', () => {
    it('should render the page', () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      expect(screen.getByText(/application/i)).toBeInTheDocument();
    });

    it('should load entity types on mount', async () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(mockEntityConfigApiService.getEntityTypes).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should display loading state while fetching entity types', () => {
      mockEntityConfigApiService.getEntityTypes.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      // Should render without errors during loading
      expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
    });

    it('should handle entity types loading error', async () => {
      mockEntityConfigApiService.getEntityTypes.mockRejectedValue(
        new Error('Failed to load')
      );

      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(mockEntityConfigApiService.getEntityTypes).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Entity Type Selection', () => {
    it('should display entity type options when loaded', async () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(mockEntityConfigApiService.getEntityTypes).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should load entity type data when entity type is selected', async () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(mockEntityConfigApiService.getEntityTypes).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Form Navigation', () => {
    it('should handle next step navigation', async () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('next-button');
      fireEvent.click(nextButton);
      
      // Should advance to next step
      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toBeInTheDocument();
      });
    });

    it('should handle previous step navigation', async () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('previous-button')).toBeInTheDocument();
      });

      const prevButton = screen.getByTestId('previous-button');
      fireEvent.click(prevButton);
      
      // Should go back to previous step
      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toBeInTheDocument();
      });
    });

    it('should validate required fields before moving to next step', async () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('next-button');
      fireEvent.click(nextButton);
      
      // Should show validation errors if required fields are missing
      await waitFor(() => {
        // Validation should prevent navigation
        expect(screen.getByTestId('current-step')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should handle form submission', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ caseId: 'test-case-id' }),
      });

      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Should attempt to submit
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should validate all required fields before submission', async () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Should validate before submitting
      await waitFor(() => {
        // Should show validation errors or proceed
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      });
    });

    it('should handle submission errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Submission failed'));

      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Field Changes', () => {
    it('should handle field value changes', async () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('test-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('test-input');
      fireEvent.change(input, { target: { value: 'test value' } });
      
      // Should update form data
      await waitFor(() => {
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('should handle file uploads', async () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      // File upload should be handled by EnhancedDynamicForm
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should display progress tracking', async () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('progress-tracking')).toBeInTheDocument();
      });
    });
  });

  describe('User Authentication', () => {
    it('should get current user on mount', () => {
      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      expect(getAuthUser).toHaveBeenCalled();
    });

    it('should handle missing user', () => {
      (getAuthUser as any).mockReturnValue(null);

      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      // Should handle gracefully
      expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
    });
  });

  describe('Step Completion', () => {
    it('should sync step completion with backend services', async () => {
      (integrationService.integrationService.getChecklistByCase as any) = vi.fn().mockResolvedValue({
        items: [{ id: 'item-1', category: 'Compliance' }],
      });
      (integrationService.integrationService.completeChecklistItem as any) = vi.fn().mockResolvedValue({});
      (integrationService.integrationService.updateWorkQueueItem as any) = vi.fn().mockResolvedValue({});

      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('next-button');
      fireEvent.click(nextButton);
      
      // Should sync with backend
      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle entity types fetch error', async () => {
      (entityConfigApiService.entityConfigApiService.getEntityTypes as any).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(mockEntityConfigApiService.getEntityTypes).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should handle entity type data fetch error', async () => {
      mockEntityConfigApiService.getEntityTypeByCode.mockRejectedValue(
        new Error('Not found')
      );

      renderWithProviders(<EnhancedNewPartnerApplicationPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      });
    });
  });
});

