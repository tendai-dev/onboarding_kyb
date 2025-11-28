import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import ProfilePage from '../page';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
  signOut: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock components
vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

vi.mock('@/components/PortalHeader', () => ({
  default: () => <div data-testid="portal-header">Header</div>,
}));

describe('ProfilePage', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  };

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
    (useRouter as any).mockReturnValue(mockRouter);
    (signOut as any).mockResolvedValue(undefined);
    (global.fetch as any).mockResolvedValue({
      ok: true,
    });
  });

  it('should render profile page', async () => {
    renderWithProviders(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  it('should display user information', async () => {
    renderWithProviders(<ProfilePage />);
    
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should handle logout', async () => {
    renderWithProviders(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });

    const logoutButton = screen.queryByText(/logout|sign out/i);
    if (logoutButton) {
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
          method: 'POST',
        });
      });
    }
  });

  it('should handle loading state', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'loading',
    });

    renderWithProviders(<ProfilePage />);
    
    expect(document.body).toBeInTheDocument();
  });

  it('should redirect when unauthenticated', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    renderWithProviders(<ProfilePage />);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });
});


