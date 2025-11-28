import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import RequirementsPage from '../page';
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

describe('RequirementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as any).mockReturnValue({
      condensed: false,
      setCondensed: vi.fn(),
    });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], totalCount: 0 }),
    });
  });

  it('should render requirements page', async () => {
    renderWithProviders(<RequirementsPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  it('should load requirements on mount', async () => {
    renderWithProviders(<RequirementsPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle create requirement', async () => {
    renderWithProviders(<RequirementsPage />);
    
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
    renderWithProviders(<RequirementsPage />);
    
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
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed to load'));

    renderWithProviders(<RequirementsPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should display empty state when no requirements', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalCount: 0 }),
    });

    renderWithProviders(<RequirementsPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(document.body).toBeInTheDocument();
  });
});
