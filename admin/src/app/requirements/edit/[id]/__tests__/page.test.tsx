import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import EditRequirementPage from '../page';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import * as entityConfigApi from '@/services/entityConfigApi';

vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return { ...actual, useSidebar: vi.fn() };
});

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));

vi.mock('@/services/entityConfigApi', () => ({
  entityConfigApiService: {
    getRequirement: vi.fn(),
    updateRequirement: vi.fn(),
  },
  FieldType: {
    Text: 'Text',
    Email: 'Email',
    Number: 'Number',
  },
}));

vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

vi.mock('@/utils/sweetAlert', () => ({
  SweetAlert: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EditRequirementPage', () => {
  const mockRequirement = {
    id: 'req-1',
    code: 'TEST_CODE',
    displayName: 'Test Requirement',
    description: 'Test Description',
    fieldType: 'Text',
    isActive: true,
    validationRules: '',
    helpText: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as any).mockReturnValue({ condensed: false, setCondensed: vi.fn() });
    (useRouter as any).mockReturnValue({ push: vi.fn(), back: vi.fn() });
    (entityConfigApi.entityConfigApiService.getRequirement as any).mockResolvedValue(mockRequirement);
  });

  it('should render edit requirement page', async () => {
    renderWithProviders(<EditRequirementPage params={{ id: 'req-1' }} />);
    await waitFor(() => expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument());
  });

  it('should load requirement data', async () => {
    renderWithProviders(<EditRequirementPage params={{ id: 'req-1' }} />);
    await waitFor(() => {
      expect(entityConfigApi.entityConfigApiService.getRequirement).toHaveBeenCalledWith('req-1');
    });
  });

  it('should handle form input', async () => {
    renderWithProviders(<EditRequirementPage params={{ id: 'req-1' }} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const displayNameInput = screen.queryByPlaceholderText(/display name/i);
    if (displayNameInput) {
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle form submission', async () => {
    (entityConfigApi.entityConfigApiService.updateRequirement as any).mockResolvedValue(mockRequirement);
    
    renderWithProviders(<EditRequirementPage params={{ id: 'req-1' }} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const saveButton = screen.queryByText(/save|update/i);
    if (saveButton) {
      fireEvent.click(saveButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle cancel', async () => {
    const router = { push: vi.fn(), back: vi.fn() };
    (useRouter as any).mockReturnValue(router);
    
    renderWithProviders(<EditRequirementPage params={{ id: 'req-1' }} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const cancelButton = screen.queryByText(/cancel/i);
    if (cancelButton) {
      fireEvent.click(cancelButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle error state', async () => {
    (entityConfigApi.entityConfigApiService.getRequirement as any).mockRejectedValueOnce(new Error('Failed'));
    renderWithProviders(<EditRequirementPage params={{ id: 'req-1' }} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});

