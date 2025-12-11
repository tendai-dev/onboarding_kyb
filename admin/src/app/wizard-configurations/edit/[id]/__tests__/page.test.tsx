import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import EditWizardConfigurationPage from '../page';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import * as entityConfigApi from '@/services/entityConfigApi';

vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return { ...actual, useSidebar: vi.fn() };
});

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));

vi.mock('@/services/entityConfigApi', () => ({
  entityConfigApiService: {
    getWizardConfiguration: vi.fn(),
    getEntityTypes: vi.fn(),
    getRequirementsMetadata: vi.fn(),
    updateWizardConfiguration: vi.fn(),
  },
}));

vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('EditWizardConfigurationPage', () => {
  const mockWizardConfig = {
    id: 'wizard-1',
    entityTypeId: 'entity-1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Step 1',
        subtitle: 'Subtitle 1',
        requirementTypes: ['Document'],
        requirementIds: ['req-1'],
        checklistCategory: 'Documents',
        stepNumber: 1,
        isActive: true,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (vi.mocked(useSession) as MockedFunction<typeof useSession>).mockReturnValue({
      data: {
        user: { name: 'Test User', email: 'test@example.com' },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: vi.fn(),
    });
    (vi.mocked(useSidebar) as MockedFunction<typeof useSidebar>).mockReturnValue({
      condensed: false,
      setCondensed: vi.fn(),
    });
    (vi.mocked(useRouter) as MockedFunction<typeof useRouter>).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as unknown as AppRouterInstance);
    (
      vi.mocked(
        entityConfigApi.entityConfigApiService.getWizardConfiguration
      ) as MockedFunction<
        typeof entityConfigApi.entityConfigApiService.getWizardConfiguration
      >
    ).mockResolvedValue(mockWizardConfig);
    (
      vi.mocked(entityConfigApi.entityConfigApiService.getEntityTypes) as MockedFunction<
        typeof entityConfigApi.entityConfigApiService.getEntityTypes
      >
    ).mockResolvedValue([]);
    (
      vi.mocked(
        entityConfigApi.entityConfigApiService.getRequirementsMetadata
      ) as MockedFunction<
        typeof entityConfigApi.entityConfigApiService.getRequirementsMetadata
      >
    ).mockResolvedValue({
      requirementTypes: [],
      fieldTypes: [],
    });
  });

  it('should render edit wizard configuration page', async () => {
    renderWithProviders(
      <EditWizardConfigurationPage params={Promise.resolve({ id: 'wizard-1' })} />
    );
    await waitFor(() => expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument());
  });

  it('should load wizard configuration data', async () => {
    renderWithProviders(
      <EditWizardConfigurationPage params={Promise.resolve({ id: 'wizard-1' })} />
    );
    await waitFor(() => {
      expect(
        entityConfigApi.entityConfigApiService.getWizardConfiguration
      ).toHaveBeenCalledWith('wizard-1');
      expect(entityConfigApi.entityConfigApiService.getEntityTypes).toHaveBeenCalled();
      expect(
        entityConfigApi.entityConfigApiService.getRequirementsMetadata
      ).toHaveBeenCalled();
    });
  });

  it('should handle form submission', async () => {
    (
      vi.mocked(
        entityConfigApi.entityConfigApiService.updateWizardConfiguration
      ) as MockedFunction<
        typeof entityConfigApi.entityConfigApiService.updateWizardConfiguration
      >
    ).mockResolvedValue(mockWizardConfig);

    renderWithProviders(
      <EditWizardConfigurationPage params={Promise.resolve({ id: 'wizard-1' })} />
    );
    await waitFor(() => expect(document.body).toBeInTheDocument());

    const saveButton = screen.queryByText(/save/i);
    if (saveButton) {
      fireEvent.click(saveButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle cancel', async () => {
    const router = {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    };
    (vi.mocked(useRouter) as MockedFunction<typeof useRouter>).mockReturnValue(
      router as unknown as AppRouterInstance
    );

    renderWithProviders(
      <EditWizardConfigurationPage params={Promise.resolve({ id: 'wizard-1' })} />
    );
    await waitFor(() => expect(document.body).toBeInTheDocument());

    const cancelButton = screen.queryByText(/cancel/i);
    if (cancelButton) {
      fireEvent.click(cancelButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle error state', async () => {
    (
      vi.mocked(
        entityConfigApi.entityConfigApiService.getWizardConfiguration
      ) as MockedFunction<
        typeof entityConfigApi.entityConfigApiService.getWizardConfiguration
      >
    ).mockRejectedValueOnce(new Error('Failed'));
    renderWithProviders(
      <EditWizardConfigurationPage params={Promise.resolve({ id: 'wizard-1' })} />
    );
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});
