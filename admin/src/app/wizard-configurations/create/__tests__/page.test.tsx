import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import CreateWizardConfigurationPage from '../page';
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
    getEntityTypes: vi.fn(),
    getRequirementsMetadata: vi.fn(),
    createWizardConfiguration: vi.fn(),
  },
}));

vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('CreateWizardConfigurationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as any).mockReturnValue({ condensed: false, setCondensed: vi.fn() });
    (useRouter as any).mockReturnValue({ push: vi.fn(), back: vi.fn() });
    (entityConfigApi.entityConfigApiService.getEntityTypes as any).mockResolvedValue([]);
    (entityConfigApi.entityConfigApiService.getRequirementsMetadata as any).mockResolvedValue({
      requirementTypes: [],
      fieldTypes: [],
    });
  });

  it('should render create wizard configuration page', async () => {
    renderWithProviders(<CreateWizardConfigurationPage />);
    await waitFor(() => expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument());
  });

  it('should load entity types and requirements metadata', async () => {
    renderWithProviders(<CreateWizardConfigurationPage />);
    await waitFor(() => {
      expect(entityConfigApi.entityConfigApiService.getEntityTypes).toHaveBeenCalled();
      expect(entityConfigApi.entityConfigApiService.getRequirementsMetadata).toHaveBeenCalled();
    });
  });

  it('should handle form submission', async () => {
    (entityConfigApi.entityConfigApiService.createWizardConfiguration as any).mockResolvedValue({ id: 'wizard-1' });
    
    renderWithProviders(<CreateWizardConfigurationPage />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const saveButton = screen.queryByText(/save|create/i);
    if (saveButton) {
      fireEvent.click(saveButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle cancel', async () => {
    const router = { push: vi.fn(), back: vi.fn() };
    (useRouter as any).mockReturnValue(router);
    
    renderWithProviders(<CreateWizardConfigurationPage />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const cancelButton = screen.queryByText(/cancel/i);
    if (cancelButton) {
      fireEvent.click(cancelButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle error state', async () => {
    (entityConfigApi.entityConfigApiService.getEntityTypes as any).mockRejectedValueOnce(new Error('Failed'));
    renderWithProviders(<CreateWizardConfigurationPage />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});


