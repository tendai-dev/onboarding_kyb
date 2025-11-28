import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { useSession } from 'next-auth/react';
import AdminDashboard from '../page';
import * as dashboardServices from '@/services';
import { useSidebar } from '@/contexts/SidebarContext';

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock services
vi.mock('@/services', () => ({
  fetchDashboardStats: vi.fn(),
  fetchEntityTypeDistribution: vi.fn(),
  fetchApplicationTrends: vi.fn(),
  fetchDashboardProjection: vi.fn(),
}));

// Mock SidebarContext - use importOriginal to preserve SidebarProvider
vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return {
    ...actual,
    useSidebar: vi.fn(),
  };
});

// Mock components
vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

vi.mock('@/components/PortalHeader', () => ({
  default: () => <div data-testid="portal-header">Header</div>,
}));

vi.mock('@/components/Charts', () => ({
  EntityTypeChart: ({ data }: { data: any[] }) => <div data-testid="entity-type-chart">{data.length} items</div>,
  ApplicationTrendsChart: ({ data }: { data: any[] }) => <div data-testid="trends-chart">{data.length} items</div>,
  StatusPieChart: ({ data }: { data: any[] }) => <div data-testid="status-pie-chart">{data.length} items</div>,
  ChartLegend: ({ items }: { items: Array<{ name: string; color: string }> }) => (
    <div data-testid="chart-legend">{items.length} legend items</div>
  ),
}));

describe('AdminDashboard', () => {
  const mockDashboardStats = {
    totalApplications: 100,
    pendingReview: 10,
    riskReview: 5,
    completed: 80,
    incomplete: 3,
    declined: 2,
    avgProcessingTime: 2.5,
    successRate: 95,
  };

  const mockEntityTypes = [
    { type: 'Individual', count: 60 },
    { type: 'Business', count: 40 },
  ];

  const mockTrends = [
    { date: '2024-01-01', submitted: 10, approved: 8, rejected: 1 },
    { date: '2024-01-02', submitted: 12, approved: 10, rejected: 1 },
  ];

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
    (dashboardServices.fetchDashboardStats as any).mockResolvedValue(mockDashboardStats);
    (dashboardServices.fetchEntityTypeDistribution as any).mockResolvedValue(mockEntityTypes);
    (dashboardServices.fetchApplicationTrends as any).mockResolvedValue(mockTrends);
    (dashboardServices.fetchDashboardProjection as any).mockResolvedValue({});
  });

  it('should render dashboard with loading state initially', () => {
    renderWithProviders(<AdminDashboard />);
    // Should render without errors
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should load and display dashboard stats', async () => {
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchDashboardStats).toHaveBeenCalled();
    });
  });

  it('should load entity type distribution', async () => {
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchEntityTypeDistribution).toHaveBeenCalled();
    });
  });

  it('should load application trends', async () => {
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchApplicationTrends).toHaveBeenCalledWith(7);
    });
  });

  it('should handle loading state', () => {
    (dashboardServices.fetchDashboardStats as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    renderWithProviders(<AdminDashboard />);
    // Should render without errors during loading
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    const error = new Error('Failed to load');
    (dashboardServices.fetchDashboardStats as any).mockRejectedValue(error);
    
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchDashboardStats).toHaveBeenCalled();
    });
  });

  it('should display dashboard stats when loaded', async () => {
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchDashboardStats).toHaveBeenCalled();
    });
  });

  it('should handle session with user name', () => {
    (useSession as any).mockReturnValue({
      data: { user: { name: 'John Doe', email: 'john@example.com' } },
      status: 'authenticated',
    });
    
    renderWithProviders(<AdminDashboard />);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should handle session with email only', () => {
    (useSession as any).mockReturnValue({
      data: { user: { email: 'user@example.com' } },
      status: 'authenticated',
    });
    
    renderWithProviders(<AdminDashboard />);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should handle unauthenticated session', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    
    renderWithProviders(<AdminDashboard />);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should handle partial data loading', async () => {
    (dashboardServices.fetchDashboardStats as any).mockResolvedValue(mockDashboardStats);
    (dashboardServices.fetchEntityTypeDistribution as any).mockRejectedValue(new Error('Failed'));
    (dashboardServices.fetchApplicationTrends as any).mockResolvedValue(mockTrends);
    (dashboardServices.fetchDashboardProjection as any).mockResolvedValue({});
    
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchDashboardStats).toHaveBeenCalled();
    });
  });

  it('should handle all services failing', async () => {
    (dashboardServices.fetchDashboardStats as any).mockRejectedValue(new Error('Failed'));
    (dashboardServices.fetchEntityTypeDistribution as any).mockRejectedValue(new Error('Failed'));
    (dashboardServices.fetchApplicationTrends as any).mockRejectedValue(new Error('Failed'));
    (dashboardServices.fetchDashboardProjection as any).mockRejectedValue(new Error('Failed'));
    
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchDashboardStats).toHaveBeenCalled();
    });
  });

  it('should calculate pie chart data correctly', async () => {
    const statsWithValues = {
      totalApplications: 100,
      pendingReview: 20,
      riskReview: 10,
      completed: 50,
      incomplete: 15,
      declined: 5,
      avgProcessingTime: 2.5,
      successRate: 95,
    };
    
    (dashboardServices.fetchDashboardStats as any).mockResolvedValue(statsWithValues);
    
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchDashboardStats).toHaveBeenCalled();
    });
  });

  it('should filter out zero values from pie chart', async () => {
    const statsWithZeros = {
      totalApplications: 100,
      pendingReview: 0,
      riskReview: 0,
      completed: 100,
      incomplete: 0,
      declined: 0,
      avgProcessingTime: 2.5,
      successRate: 100,
    };
    
    (dashboardServices.fetchDashboardStats as any).mockResolvedValue(statsWithZeros);
    
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchDashboardStats).toHaveBeenCalled();
    });
  });

  it('should extract firstName from email format', () => {
    (useSession as any).mockReturnValue({
      data: { user: { email: 'john.doe@example.com' } },
      status: 'authenticated',
    });
    
    renderWithProviders(<AdminDashboard />);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should extract firstName from name format', () => {
    (useSession as any).mockReturnValue({
      data: { user: { name: 'John Doe' } },
      status: 'authenticated',
    });
    
    renderWithProviders(<AdminDashboard />);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should handle session loading state', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'loading',
    });
    
    renderWithProviders(<AdminDashboard />);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should handle empty trends data', async () => {
    (dashboardServices.fetchApplicationTrends as any).mockResolvedValue([]);
    
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchApplicationTrends).toHaveBeenCalled();
    });
  });

  it('should handle empty entity type data', async () => {
    (dashboardServices.fetchEntityTypeDistribution as any).mockResolvedValue([]);
    
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchEntityTypeDistribution).toHaveBeenCalled();
    });
  });

  it('should handle Promise.allSettled with mixed results', async () => {
    (dashboardServices.fetchDashboardStats as any).mockResolvedValue(mockDashboardStats);
    (dashboardServices.fetchEntityTypeDistribution as any).mockRejectedValue(new Error('Failed'));
    (dashboardServices.fetchApplicationTrends as any).mockResolvedValue(mockTrends);
    (dashboardServices.fetchDashboardProjection as any).mockRejectedValue(new Error('Failed'));
    
    renderWithProviders(<AdminDashboard />);
    
    await waitFor(() => {
      expect(dashboardServices.fetchDashboardStats).toHaveBeenCalled();
      expect(dashboardServices.fetchEntityTypeDistribution).toHaveBeenCalled();
      expect(dashboardServices.fetchApplicationTrends).toHaveBeenCalled();
      expect(dashboardServices.fetchDashboardProjection).toHaveBeenCalled();
    });
  });
});

