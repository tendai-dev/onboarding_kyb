import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '../useRequireAuth';
import { useSession } from 'next-auth/react';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

describe('useRequireAuth', () => {
  const mockPush = vi.fn();
  const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it('should redirect to login when unauthenticated', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    renderHook(() => useRequireAuth());

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('should not redirect when authenticated', () => {
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });

    renderHook(() => useRequireAuth());

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should not redirect when loading', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'loading',
    });

    renderHook(() => useRequireAuth());

    expect(mockPush).not.toHaveBeenCalled();
  });
});

