import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import LoginPage from '../page';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

const mockSignIn = vi.fn();
const mockRouter = {
  replace: vi.fn(),
  push: vi.fn(),
};

vi.mock('next-auth/react', () => ({
  signIn: mockSignIn,
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    (useSearchParams as any).mockReturnValue(new URLSearchParams());
    mockSignIn.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render login page', () => {
    const { container } = renderWithProviders(<LoginPage />);
    expect(container).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'loading',
    });
    
    renderWithProviders(<LoginPage />);
    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
  });

  it('should redirect authenticated users to dashboard', async () => {
    vi.useFakeTimers();
    (useSession as any).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });
    
    renderWithProviders(<LoginPage />);
    
    vi.advanceTimersByTime(100);
    
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/partner/dashboard');
    });
  });

  it('should start sign-in for unauthenticated users', async () => {
    vi.useFakeTimers();
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    
    renderWithProviders(<LoginPage />);
    
    vi.advanceTimersByTime(100);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('keycloak', {
        callbackUrl: '/partner/dashboard',
        redirect: true,
      });
    });
  });

  it('should display OAuth errors', () => {
    const searchParams = new URLSearchParams();
    searchParams.set('error', 'access_denied');
    searchParams.set('error_description', 'User denied access');
    (useSearchParams as any).mockReturnValue(searchParams);
    
    renderWithProviders(<LoginPage />);
    expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
  });

  it('should handle sign-in errors', async () => {
    vi.useFakeTimers();
    mockSignIn.mockRejectedValue(new Error('Sign-in failed'));
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    
    renderWithProviders(<LoginPage />);
    
    vi.advanceTimersByTime(100);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to start authentication/i)).toBeInTheDocument();
    });
  });

  it('should allow retry after error', async () => {
    const searchParams = new URLSearchParams();
    searchParams.set('error', 'access_denied');
    (useSearchParams as any).mockReturnValue(searchParams);
    
    renderWithProviders(<LoginPage />);
    
    const tryAgainButton = screen.getByText(/try again/i);
    fireEvent.click(tryAgainButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
  });
});

