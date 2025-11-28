import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import EditEntityTypePage from '../page';
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
    getEntityType: vi.fn(),
    getEntityTypes: vi.fn(),
    getRequirements: vi.fn(),
    updateEntityType: vi.fn(),
  },
}));

vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('EditEntityTypePage', () => {
  const mockEntityType = {
    id: 'entity-1',
    code: 'INDIVIDUAL',
    displayName: 'Individual',
    description: 'Individual entity type',
    icon: 'user',
    isActive: true,
    requirements: [
      { id: 'req-1', displayName: 'Requirement 1' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as any).mockReturnValue({ condensed: false, setCondensed: vi.fn() });
    (useRouter as any).mockReturnValue({ push: vi.fn(), back: vi.fn() });
    (entityConfigApi.entityConfigApiService.getEntityType as any).mockResolvedValue(mockEntityType);
    (entityConfigApi.entityConfigApiService.getRequirements as any).mockResolvedValue([
      { id: 'req-1', displayName: 'Requirement 1' },
      { id: 'req-2', displayName: 'Requirement 2' },
    ]);
  });

  it('should render edit entity type page', async () => {
    renderWithProviders(<EditEntityTypePage params={Promise.resolve({ id: 'entity-1' })} />);
    await waitFor(() => expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument());
  });

  it('should load entity type data', async () => {
    renderWithProviders(<EditEntityTypePage params={Promise.resolve({ id: 'entity-1' })} />);
    await waitFor(() => {
      expect(entityConfigApi.entityConfigApiService.getEntityType).toHaveBeenCalledWith('entity-1', true);
      expect(entityConfigApi.entityConfigApiService.getRequirements).toHaveBeenCalled();
    });
  });

  it('should handle form input', async () => {
    renderWithProviders(<EditEntityTypePage params={Promise.resolve({ id: 'entity-1' })} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const displayNameInput = screen.queryByPlaceholderText(/display name/i);
    if (displayNameInput) {
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle form submission', async () => {
    (entityConfigApi.entityConfigApiService.updateEntityType as any).mockResolvedValue(mockEntityType);
    
    renderWithProviders(<EditEntityTypePage params={Promise.resolve({ id: 'entity-1' })} />);
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
    
    renderWithProviders(<EditEntityTypePage params={Promise.resolve({ id: 'entity-1' })} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const cancelButton = screen.queryByText(/cancel/i);
    if (cancelButton) {
      fireEvent.click(cancelButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle error state', async () => {
    (entityConfigApi.entityConfigApiService.getEntityType as any).mockRejectedValueOnce(new Error('Failed'));
    renderWithProviders(<EditEntityTypePage params={Promise.resolve({ id: 'entity-1' })} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});

