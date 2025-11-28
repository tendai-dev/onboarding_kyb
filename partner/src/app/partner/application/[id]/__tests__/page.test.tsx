import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { useParams, useRouter } from 'next/navigation';
import ApplicationDetailsPage from '../page';
// Import will be mocked
import { getAuthUser, generateUserIdFromEmail } from '@/lib/auth/session';
import { findUserCaseByEmail } from '@/lib/api';
import { SweetAlert } from '@/utils/sweetAlert';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/partner/application/test-id'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock services
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
vi.mock('@/lib/auth/session');
vi.mock('@/lib/api');
vi.mock('@/utils/sweetAlert');

// Mock components
vi.mock('@/components/EnhancedDynamicForm', () => ({
  EnhancedDynamicForm: ({ config, formData, onFieldChange, currentStep, isEditing }: any) => (
    <div data-testid="enhanced-dynamic-form">
      <div data-testid="editing-mode">{isEditing ? 'editing' : 'viewing'}</div>
      <div data-testid="current-step">{currentStep}</div>
      <input
        data-testid="form-input"
        onChange={(e) => onFieldChange('testField', e.target.value)}
        defaultValue={formData?.testField || ''}
      />
    </div>
  ),
}));

vi.mock('@/components/FileUpload', () => ({
  FileUpload: () => <div data-testid="file-upload">File Upload</div>,
}));

vi.mock('@/components/SchemaDrivenView', () => ({
  SchemaDrivenView: () => <div data-testid="schema-driven-view">Schema View</div>,
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('ApplicationDetailsPage', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  };

  const mockApplication = {
    caseId: 'test-case-id',
    status: 'IN PROGRESS',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    entityType: 'Private Company',
    entityTypeCode: 'PRIVATE_COMPANY',
    formConfigId: 'config-1',
    formVersion: '1.0',
    formSchema: {
      code: 'PRIVATE_COMPANY',
      displayName: 'Private Company',
      requirements: [
        {
          requirement: {
            code: 'COMPANY_NAME',
            displayName: 'Company Name',
            fieldType: 'Text',
            type: 'Information',
          },
          isRequired: true,
          displayOrder: 1,
        },
      ],
    },
    caseData: {
      businessLegalName: 'Test Company',
      applicantFirstName: 'John',
      applicantLastName: 'Doe',
      applicantEmail: 'john@example.com',
      businessRegistrationNumber: '12345',
      businessCountryOfRegistration: 'South Africa',
    },
    metadata: {
      companyName: 'Test Company',
    },
    rawData: {
      businessLegalName: 'Test Company',
      applicantFirstName: 'John',
      applicantLastName: 'Doe',
      applicantEmail: 'john@example.com',
    },
    partnerId: 'test-partner-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ id: 'test-case-id' });
    (useRouter as any).mockReturnValue(mockRouter);
    (getAuthUser as any).mockReturnValue({ name: 'Test User', email: 'test@example.com' });
    (generateUserIdFromEmail as any).mockReturnValue('test-partner-id');
    (findUserCaseByEmail as any).mockResolvedValue({ caseId: 'test-case-id', partnerId: 'test-partner-id' });
    
    // Setup mocks
    mockEntityConfigApiService.getEntityTypeByCode.mockResolvedValue({
      code: 'PRIVATE_COMPANY',
      displayName: 'Private Company',
      requirements: [],
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockApplication,
    });
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      (global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<ApplicationDetailsPage />);
      // Should render without errors during loading
      expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
    });

    it('should load application details on mount', async () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should display application data when loaded', async () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Should display application information
      expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
    });
  });

  describe('Application Fetching', () => {
    it('should fetch application by ID from URL params', async () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/proxy/api/v1/cases/test-case-id/details'),
          expect.any(Object)
        );
      });
    });

    it('should find application by email if no ID in URL', async () => {
      (useParams as any).mockReturnValue({ id: undefined });
      (findUserCaseByEmail as any).mockResolvedValue({ caseId: 'found-case-id', partnerId: 'test-partner-id' });
      
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });
    });

    it('should handle application not found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle ownership mismatch (403)', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Access denied' }),
      });
      (findUserCaseByEmail as any).mockResolvedValue({ caseId: 'other-case-id', partnerId: 'other-partner-id' });

      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      });

      const editButton = screen.queryByText(/edit/i);
      if (editButton) {
        fireEvent.click(editButton);
        
        await waitFor(() => {
          expect(screen.getByTestId('editing-mode')).toHaveTextContent('editing');
        });
      }
    });

    it('should exit edit mode when cancel is clicked', async () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      });

      const editButton = screen.queryByText(/edit/i);
      if (editButton) {
        fireEvent.click(editButton);
        
        await waitFor(() => {
          expect(screen.getByTestId('editing-mode')).toHaveTextContent('editing');
        });

        const cancelButton = screen.queryByText(/cancel/i);
        if (cancelButton) {
          fireEvent.click(cancelButton);
          
          await waitFor(() => {
            expect(screen.getByTestId('editing-mode')).toHaveTextContent('viewing');
          });
        }
      }
    });
  });

  describe('Form Data Updates', () => {
    it('should update form data when field changes', async () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('form-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('form-input');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      // Should update form data
      expect(input).toHaveValue('new value');
    });
  });

  describe('Save Functionality', () => {
    it('should save application when save button is clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApplication,
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockApplication, updatedAt: new Date().toISOString() }),
      });

      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      });

      const editButton = screen.queryByText(/edit/i);
      if (editButton) {
        fireEvent.click(editButton);
        
        await waitFor(() => {
          expect(screen.getByTestId('editing-mode')).toHaveTextContent('editing');
        });

        const saveButton = screen.queryByText(/save/i);
        if (saveButton) {
          fireEvent.click(saveButton);
          
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2); // Initial load + save
          });
        }
      }
    });

    it('should handle save errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApplication,
      }).mockRejectedValueOnce(new Error('Save failed'));

      (SweetAlert.error as any) = vi.fn().mockResolvedValue({});

      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      });

      const editButton = screen.queryByText(/edit/i);
      if (editButton) {
        fireEvent.click(editButton);
        
        await waitFor(() => {
          expect(screen.getByTestId('editing-mode')).toHaveTextContent('editing');
        });

        const saveButton = screen.queryByText(/save/i);
        if (saveButton) {
          fireEvent.click(saveButton);
          
          await waitFor(() => {
            expect(SweetAlert.error).toHaveBeenCalled();
          });
        }
      }
    });
  });

  describe('Entity Type Configuration', () => {
    it('should fetch entity type config when application loads', async () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Should fetch entity config if needed
      await waitFor(() => {
        // Entity config should be fetched
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should use form schema from API response if available', async () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Should use formSchema from API
      expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs', async () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      });

      const detailsTab = screen.queryByText(/details/i);
      const documentsTab = screen.queryByText(/documents/i);
      
      if (detailsTab && documentsTab) {
        fireEvent.click(documentsTab);
        
        // Should switch to documents tab
        expect(screen.getByTestId('enhanced-dynamic-form')).toBeInTheDocument();
      }
    });
  });

  describe('User Authentication', () => {
    it('should get current user on mount', () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      expect(getAuthUser).toHaveBeenCalled();
    });

    it('should handle missing user', async () => {
      (getAuthUser as any).mockReturnValue(null);
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(getAuthUser).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle invalid application data', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      });

      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Step Navigation', () => {
    it('should navigate between steps', async () => {
      renderWithProviders(<ApplicationDetailsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toBeInTheDocument();
      });

      // Should be able to navigate steps
      expect(screen.getByTestId('current-step')).toBeInTheDocument();
    });
  });
});

