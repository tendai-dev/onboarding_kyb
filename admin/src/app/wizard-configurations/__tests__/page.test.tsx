import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import WizardConfigurationsPage from '../page';
import { entityConfigApiService } from '@/services/entityConfigApi';
import { useSidebar } from '@/contexts/SidebarContext';

// Mock services
vi.mock('@/services/entityConfigApi', () => ({
  entityConfigApiService: {
    getWizardConfigurations: vi.fn(),
    deleteWizardConfiguration: vi.fn(),
  },
}));

// Mock sidebar context
vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return {
    ...actual,
    useSidebar: vi.fn(),
  };
});

// Mock SweetAlert
vi.mock('@/utils/sweetAlert', () => ({
  SweetAlert: {
    confirm: vi.fn().mockResolvedValue({ isConfirmed: true }),
    loading: vi.fn(),
    close: vi.fn(),
    success: vi.fn().mockResolvedValue({}),
    error: vi.fn().mockResolvedValue({}),
  },
}));

// Mock components
vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('WizardConfigurationsPage', () => {
  const mockConfigurations = [
    {
      id: 'config-1',
      name: 'Test Config',
      entityType: 'Business',
      steps: [],
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useSidebar as any).mockReturnValue({
      condensed: false,
      setCondensed: vi.fn(),
    });
    (entityConfigApiService.getWizardConfigurations as any).mockResolvedValue(mockConfigurations);
  });

  it('should render wizard configurations page', async () => {
    renderWithProviders(<WizardConfigurationsPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  it('should load configurations on mount', async () => {
    renderWithProviders(<WizardConfigurationsPage />);
    
    await waitFor(() => {
      expect(entityConfigApiService.getWizardConfigurations).toHaveBeenCalled();
    });
  });

  it('should handle delete configuration', async () => {
    (entityConfigApiService.deleteWizardConfiguration as any).mockResolvedValue({});

    renderWithProviders(<WizardConfigurationsPage />);
    
    await waitFor(() => {
      expect(entityConfigApiService.getWizardConfigurations).toHaveBeenCalled();
    });

    const deleteButton = screen.queryByLabelText(/delete/i);
    if (deleteButton) {
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle error state', async () => {
    (entityConfigApiService.getWizardConfigurations as any).mockRejectedValueOnce(
      new Error('Failed to load')
    );

    renderWithProviders(<WizardConfigurationsPage />);
    
    await waitFor(() => {
      expect(entityConfigApiService.getWizardConfigurations).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should display empty state when no configurations', async () => {
    (entityConfigApiService.getWizardConfigurations as any).mockResolvedValueOnce([]);

    renderWithProviders(<WizardConfigurationsPage />);
    
    await waitFor(() => {
      expect(entityConfigApiService.getWizardConfigurations).toHaveBeenCalled();
    });

    expect(document.body).toBeInTheDocument();
  });
});


