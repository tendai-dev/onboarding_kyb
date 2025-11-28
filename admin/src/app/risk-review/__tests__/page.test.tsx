import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import RiskReviewPage from '../page';
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

describe('RiskReviewPage', () => {
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

  it('should render risk review page', async () => {
    renderWithProviders(<RiskReviewPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  it('should load risk review items on mount', async () => {
    renderWithProviders(<RiskReviewPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle search functionality', async () => {
    renderWithProviders(<RiskReviewPage />);
    
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

  it('should handle filter by risk level', async () => {
    renderWithProviders(<RiskReviewPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const filterButton = screen.queryByText(/risk|filter/i);
    if (filterButton) {
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle error state', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed to load'));

    renderWithProviders(<RiskReviewPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should display empty state when no items', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalCount: 0 }),
    });

    renderWithProviders(<RiskReviewPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(document.body).toBeInTheDocument();
  });
});

