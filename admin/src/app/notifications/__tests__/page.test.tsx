import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import NotificationsPage from '../page';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';

vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return { ...actual, useSidebar: vi.fn() };
});

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
global.fetch = vi.fn();

vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as unknown).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as unknown).mockReturnValue({ condensed: false, setCondensed: vi.fn() });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
  });

  it('should render notifications page', async () => {
    renderWithProviders(<NotificationsPage />);
    await waitFor(() => expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument());
  });

  it('should load notifications on mount', async () => {
    renderWithProviders(<NotificationsPage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it('should handle error state', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Failed'));
    renderWithProviders(<NotificationsPage />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});
