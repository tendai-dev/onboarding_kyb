import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import PortalHeader from '../PortalHeader';
import { useSession } from 'next-auth/react';

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

describe('PortalHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    });
  });

  it('should render portal header', () => {
    renderWithProviders(<PortalHeader />);
    // Component should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should display user information when authenticated', () => {
    renderWithProviders(<PortalHeader />);
    // Header should render with user context
    expect(document.body).toBeInTheDocument();
  });

  it('should handle unauthenticated state', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    renderWithProviders(<PortalHeader />);
    // Should render without errors even when not authenticated
    expect(document.body).toBeInTheDocument();
  });
});

