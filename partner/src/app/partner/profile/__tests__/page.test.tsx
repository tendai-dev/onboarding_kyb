import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import PartnerProfilePage from '../page';
import { getAuthUser } from '@/lib/auth/session';
import * as api from '@/lib/api';
import { useSession } from 'next-auth/react';

vi.mock('@/lib/auth/session');
vi.mock('@/lib/api');
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));
vi.mock('@/hooks/useRequireAuth');

global.fetch = vi.fn();

describe('PartnerProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAuthUser as any).mockReturnValue({ name: 'Test User', email: 'test@example.com' });
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (api.getUserProfile as any).mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    });
    (api.getNotificationPreferences as any).mockResolvedValue({});
    (api.getUserCaseSummary as any).mockResolvedValue({});
  });

  it('should render profile page', () => {
    const { container } = renderWithProviders(<PartnerProfilePage />);
    expect(container).toBeInTheDocument();
  });

  it('should load user data on mount', async () => {
    renderWithProviders(<PartnerProfilePage />);
    
    await waitFor(() => {
      expect(api.getUserProfile).toHaveBeenCalled();
    });
  });

  it('should load notification preferences', async () => {
    renderWithProviders(<PartnerProfilePage />);
    
    await waitFor(() => {
      expect(api.getNotificationPreferences).toHaveBeenCalled();
    });
  });
});

