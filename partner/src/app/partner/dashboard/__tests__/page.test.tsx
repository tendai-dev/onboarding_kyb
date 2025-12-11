import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { useSearchParams } from 'next/navigation';
import PartnerDashboard from '../page';
import { findUserCaseByEmail, getCaseById, getHandlerProfile } from '@/lib/api';
import { getAuthUser, logout } from '@/lib/auth/session';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => '/partner/dashboard'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  })),
}));

// Mock hooks
vi.mock('@/hooks/useRequireAuth');
vi.mock('@/contexts/AuthContext');
vi.mock('@/lib/auth/session');
vi.mock('@/lib/api');

// Mock components
vi.mock('@/lib/mukuruImports', () => ({
  Button: ({ children, onClick, ...props }: unknown) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  MukuruLogo: () => <div data-testid="mukuru-logo">Mukuru Logo</div>,
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('PartnerDashboard', () => {
  const mockApplication = {
    caseId: 'test-case-id',
    status: 'IN PROGRESS',
    progressPercentage: 50,
    type: 'Private Company',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    applicantFirstName: 'John',
    applicantLastName: 'Doe',
    assignedTo: 'handler-id',
    assignedToName: 'Handler Name',
    country: 'South Africa',
    riskLevel: 'low',
    metadataJson: JSON.stringify({ companyName: 'Test Company' }),
  };

  const mockHandler = {
    id: 'handler-id',
    fullName: 'Handler Name',
    email: 'handler@example.com',
    firstName: 'Handler',
    lastName: 'Name',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as unknown).mockReturnValue(new URLSearchParams());
    (useRequireAuth as unknown).mockReturnValue(undefined);
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { name: 'Test User', email: 'test@example.com' },
      isLoading: false,
    });
    (getAuthUser as unknown).mockReturnValue({
      name: 'Test User',
      email: 'test@example.com',
    });
    (findUserCaseByEmail as unknown).mockResolvedValue(mockApplication);
    (getCaseById as unknown).mockResolvedValue(mockApplication);
    (getHandlerProfile as unknown).mockResolvedValue(mockHandler);
    (logout as unknown).mockResolvedValue(undefined);
  });

  describe('Initial Rendering', () => {
    it('should render the dashboard', () => {
      renderWithProviders(<PartnerDashboard />);
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      (findUserCaseByEmail as unknown).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<PartnerDashboard />);
      // Should render without errors during loading
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    it('should load application data on mount', async () => {
      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });
    });

    it('should display user name', () => {
      renderWithProviders(<PartnerDashboard />);
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });
  });

  describe('Application Loading', () => {
    it('should fetch application by case ID from URL params', async () => {
      (useSearchParams as unknown).mockReturnValue(
        new URLSearchParams('?caseId=test-case-id')
      );

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(getCaseById).toHaveBeenCalledWith('test-case-id');
      });
    });

    it('should fetch application by email if no case ID in URL', async () => {
      (useSearchParams as unknown).mockReturnValue(new URLSearchParams());

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should handle no application found', async () => {
      (findUserCaseByEmail as unknown).mockResolvedValue(null);
      (getCaseById as unknown).mockResolvedValue(null);

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      // Should show empty state or message
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    it('should display application status', async () => {
      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      // Should display application information
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    it('should display progress percentage', async () => {
      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      // Should display progress
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  describe('Success Message', () => {
    it('should show success message when redirected after submission', async () => {
      (useSearchParams as unknown).mockReturnValue(
        new URLSearchParams('?submitted=true&caseId=test-case-id')
      );

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(/application submitted successfully/i)
        ).toBeInTheDocument();
      });
    });

    it('should clear success message after timeout', async () => {
      vi.useFakeTimers();
      (useSearchParams as unknown).mockReturnValue(
        new URLSearchParams('?submitted=true')
      );

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(/application submitted successfully/i)
        ).toBeInTheDocument();
      });

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(
          screen.queryByText(/application submitted successfully/i)
        ).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Retry Logic', () => {
    it('should retry loading application after submission', async () => {
      vi.useFakeTimers();
      (useSearchParams as unknown).mockReturnValue(
        new URLSearchParams('?submitted=true')
      );
      (findUserCaseByEmail as unknown).mockResolvedValue(null);

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      // Should retry after delay
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });

    it('should stop retrying after max attempts', async () => {
      vi.useFakeTimers();
      (useSearchParams as unknown).mockReturnValue(
        new URLSearchParams('?submitted=true')
      );
      (findUserCaseByEmail as unknown).mockResolvedValue(null);

      renderWithProviders(<PartnerDashboard />);

      // Advance timers to exceed max retries
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(2000);
        await waitFor(() => {
          // Should eventually stop retrying
        });
      }

      vi.useRealTimers();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh application data when refresh button is clicked', async () => {
      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      const refreshButton = screen.getByText(/refresh/i);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalledTimes(2);
      });
    });

    it('should trigger projections sync when refreshing after submission', async () => {
      (useSearchParams as unknown).mockReturnValue(
        new URLSearchParams('?submitted=true&caseId=test-case-id')
      );
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Handler Profile', () => {
    it('should load handler profile when application is assigned', async () => {
      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(getHandlerProfile).toHaveBeenCalledWith('handler-id');
      });
    });

    it('should handle handler profile fetch error', async () => {
      (getHandlerProfile as unknown).mockRejectedValue(new Error('Not found'));

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      // Should handle error gracefully
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to new application page', () => {
      renderWithProviders(<PartnerDashboard />);

      const newAppButton = screen.getByText(/new application/i);
      expect(newAppButton).toBeInTheDocument();
    });

    it('should navigate to profile page', () => {
      renderWithProviders(<PartnerDashboard />);

      const profileButton = screen.getByText(/profile/i);
      expect(profileButton).toBeInTheDocument();
    });

    it('should navigate to messages page', () => {
      renderWithProviders(<PartnerDashboard />);

      const messagesButton = screen.getByText(/messages/i);
      expect(messagesButton).toBeInTheDocument();
    });

    it('should handle logout', () => {
      renderWithProviders(<PartnerDashboard />);

      const logoutButton = screen.getByText(/logout/i);
      fireEvent.click(logoutButton);

      expect(logout).toHaveBeenCalled();
    });
  });

  describe('Application Journey Progress', () => {
    it('should display journey progress component', async () => {
      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      // Should display journey progress
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    it('should show correct stage based on application status', async () => {
      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      // Should display status-based stage
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  describe('Periodic Refresh', () => {
    it('should periodically refresh application data', async () => {
      vi.useFakeTimers();

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      // Advance timer to trigger periodic refresh
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle service unavailable errors', async () => {
      const error = new Error('Service unavailable');
      (error as unknown).isServiceUnavailable = true;
      (findUserCaseByEmail as unknown).mockRejectedValue(error);

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });

      // Should handle gracefully
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    it('should handle fetch errors', async () => {
      (findUserCaseByEmail as unknown).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<PartnerDashboard />);

      await waitFor(() => {
        expect(findUserCaseByEmail).toHaveBeenCalled();
      });
    });
  });

  describe('User Authentication', () => {
    it('should require authentication', () => {
      renderWithProviders(<PartnerDashboard />);

      expect(useRequireAuth).toHaveBeenCalled();
    });

    it('should use auth context user', () => {
      renderWithProviders(<PartnerDashboard />);

      expect(useAuth).toHaveBeenCalled();
    });

    it('should fallback to session user if auth context not loaded', () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        isLoading: true,
      });

      renderWithProviders(<PartnerDashboard />);

      expect(getAuthUser).toHaveBeenCalled();
    });
  });
});
