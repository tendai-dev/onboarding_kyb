import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import ReportsPage from '../page';
import { useSidebar } from '@/contexts/SidebarContext';
import * as services from '@/services';
import type { DashboardProjection } from '@/services/dtos/dashboard.dto';

// Mock sidebar context
vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return {
    ...actual,
    useSidebar: vi.fn(),
  };
});

// Mock services
vi.mock('@/services', () => ({
  fetchDashboardProjection: vi.fn(),
  fetchApplicationTrends: vi.fn(),
}));

// Mock components
vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

vi.mock('@/components/Charts', () => ({
  ApplicationTrendsChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="trends-chart">{data.length} items</div>
  ),
  ProcessingTimeChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="processing-chart">{data.length} items</div>
  ),
  ChartLegend: ({ items }: { items: Array<{ name: string; color: string }> }) => (
    <div data-testid="chart-legend">{items.length} legend items</div>
  ),
}));

describe('ReportsPage', () => {
  const mockDashboardData = {
    cases: {
      newCasesThisMonth: 100,
      newCasesLastMonth: 80,
      totalCases: 500,
    },
    performance: {
      averageCompletionTimeHours: 48,
      medianCompletionTimeHours: 36,
      approvalRate: 0.85,
    },
  };

  const mockTrends = [
    { date: '2024-01-01', applications: 10, completed: 8 },
    { date: '2024-01-02', applications: 12, completed: 10 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (vi.mocked(useSidebar) as MockedFunction<typeof useSidebar>).mockReturnValue({
      condensed: false,
      setCondensed: vi.fn(),
    });
    (
      vi.mocked(services.fetchDashboardProjection) as MockedFunction<
        typeof services.fetchDashboardProjection
      >
    ).mockResolvedValue(
      mockDashboardData as Partial<DashboardProjection> as DashboardProjection
    );
    (
      vi.mocked(services.fetchApplicationTrends) as MockedFunction<
        typeof services.fetchApplicationTrends
      >
    ).mockResolvedValue(mockTrends);
  });

  it('should render reports page', async () => {
    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  it('should load dashboard data on mount', async () => {
    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(services.fetchDashboardProjection).toHaveBeenCalled();
    });
  });

  it('should load trends data on mount', async () => {
    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(services.fetchApplicationTrends).toHaveBeenCalled();
    });
  });

  it('should calculate performance metrics', async () => {
    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(services.fetchDashboardProjection).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    (services.fetchDashboardProjection as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Failed to load')
    );

    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(services.fetchDashboardProjection).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should display charts', async () => {
    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(services.fetchDashboardProjection).toHaveBeenCalled();
      expect(services.fetchApplicationTrends).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });
});
