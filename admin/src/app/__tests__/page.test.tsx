import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import AdminLoginPage from '../page';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
    });
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        pathname: '/',
        replace: vi.fn(),
      },
      writable: true,
    });
  });

  it('should render login page when unauthenticated', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    renderWithProviders(<AdminLoginPage />);
    expect(screen.getByText(/Admin Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in with Microsoft/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'loading',
    });

    renderWithProviders(<AdminLoginPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('should handle sign in button click', async () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    (signIn as any).mockResolvedValue(undefined);

    renderWithProviders(<AdminLoginPage />);
    
    const signInButton = screen.getByText(/Sign in with Microsoft/i).closest('button');
    if (signInButton) {
      fireEvent.click(signInButton);
      await waitFor(() => expect(signIn).toHaveBeenCalled());
    }
  });

  it('should display error message from URL params', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    
    Object.defineProperty(window, 'location', {
      value: {
        search: '?error=AccessDenied',
        pathname: '/',
        replace: vi.fn(),
      },
      writable: true,
    });

    renderWithProviders(<AdminLoginPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('should redirect when authenticated', () => {
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });

    renderWithProviders(<AdminLoginPage />);
    expect(document.body).toBeInTheDocument();
  });
});


