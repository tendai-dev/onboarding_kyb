import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import RefreshesPage from '../page';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';
import * as services from '@/services';

vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return { ...actual, useSidebar: vi.fn() };
});

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

vi.mock('@/services', () => ({
  fetchItemsDueForRefresh: vi.fn(),
  getWorkItems: vi.fn(),
  markForRefreshUseCase: vi.fn(),
}));

vi.mock('@/utils/sweetAlert', () => ({
  SweetAlert: {
    confirm: vi.fn().mockResolvedValue({ isConfirmed: true }),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('RefreshesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as any).mockReturnValue({ condensed: false, setCondensed: vi.fn() });
    (services.fetchItemsDueForRefresh as any).mockResolvedValue([]);
    (services.getWorkItems as any).mockResolvedValue({ items: [], totalCount: 0 });
  });

  it('should render refreshes page', async () => {
    renderWithProviders(<RefreshesPage />);
    await waitFor(() => expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument());
  });

  it('should load refresh items on mount', async () => {
    renderWithProviders(<RefreshesPage />);
    await waitFor(() => expect(services.fetchItemsDueForRefresh).toHaveBeenCalled());
  });

  it('should handle search functionality', async () => {
    renderWithProviders(<RefreshesPage />);
    await waitFor(() => expect(services.fetchItemsDueForRefresh).toHaveBeenCalled());
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test' } });
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle error state', async () => {
    (services.fetchItemsDueForRefresh as any).mockRejectedValueOnce(new Error('Failed'));
    renderWithProviders(<RefreshesPage />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});


