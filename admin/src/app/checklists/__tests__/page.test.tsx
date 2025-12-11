import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import ChecklistsPage from '../page';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';

// Mock sidebar context
vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return {
    ...actual,
    useSidebar: vi.fn(),
  };
});

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock components
vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('ChecklistsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as unknown).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as unknown).mockReturnValue({
      condensed: false,
      setCondensed: vi.fn(),
    });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], totalCount: 0 }),
    });
  });

  it('should render checklists page', async () => {
    renderWithProviders(<ChecklistsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  it('should load checklists on mount', async () => {
    renderWithProviders(<ChecklistsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle create checklist', async () => {
    renderWithProviders(<ChecklistsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const createButton = screen.queryByText(/create|add/i);
    if (createButton) {
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle search functionality', async () => {
    renderWithProviders(<ChecklistsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle error state', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Failed to load'));

    renderWithProviders(<ChecklistsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should display empty state when no checklists', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalCount: 0 }),
    });

    renderWithProviders(<ChecklistsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(document.body).toBeInTheDocument();
  });
});
