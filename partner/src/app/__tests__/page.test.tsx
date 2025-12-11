import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '@/test/testUtils';
import Home from '../page';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    create: (Component: React.ComponentType) => Component,
  },
  useScroll: () => ({ scrollY: 0, scrollYProgress: 0 }),
  useTransform: () => 0,
  useInView: () => false,
}));

describe('Home', () => {
  const mockRouter = {
    replace: vi.fn(),
    push: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render home page', () => {
    const { container } = renderWithProviders(<Home />);
    expect(container).toBeInTheDocument();
  });

  it('should show loading state while checking auth', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    renderWithProviders(<Home />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should redirect authenticated users to dashboard', async () => {
    vi.useFakeTimers();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    renderWithProviders(<Home />);

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/partner/dashboard');
    });
  });

  it('should show landing page for unauthenticated users', async () => {
    vi.useFakeTimers();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(<Home />);

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  it('should render landing page content', async () => {
    vi.useFakeTimers();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(<Home />);

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });
});
