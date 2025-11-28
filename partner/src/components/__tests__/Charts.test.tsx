import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';

// Mock recharts to avoid SSR issues
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

import { EntityTypeChart, ApplicationTrendsChart, StatusPieChart } from '../Charts';

describe('Charts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EntityTypeChart', () => {
    it('should render chart', () => {
      const data = [
        { type: 'Company', count: 10 },
        { type: 'NPO', count: 5 },
      ];
      
      const { container } = renderWithProviders(<EntityTypeChart data={data} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('ApplicationTrendsChart', () => {
    it('should render chart', () => {
      const data = [
        { date: '2024-01-01', applications: 10, completed: 5 },
        { date: '2024-01-02', applications: 15, completed: 8 },
      ];
      
      const { container } = renderWithProviders(<ApplicationTrendsChart data={data} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('StatusPieChart', () => {
    it('should render chart', () => {
      const data = [
        { name: 'Pending', value: 10, color: '#ff0000' },
        { name: 'Approved', value: 5, color: '#00ff00' },
      ];
      
      const { container } = renderWithProviders(<StatusPieChart data={data} />);
      expect(container).toBeInTheDocument();
    });
  });
});

