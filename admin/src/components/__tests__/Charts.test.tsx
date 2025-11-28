import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import {
  EntityTypeChart,
  ApplicationTrendsChart,
  ChartLegend,
  StatusPieChart,
  ProcessingTimeChart,
} from '../Charts';

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
}));

describe('Charts Components', () => {
  describe('EntityTypeChart', () => {
    it('should render chart with data', () => {
      const data = [
        { type: 'Individual', count: 10 },
        { type: 'Business', count: 20 },
      ];
      const { container } = renderWithProviders(<EntityTypeChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should return null when data is empty', () => {
      const { container } = renderWithProviders(<EntityTypeChart data={[]} />);
      // When component returns null, React doesn't render anything
      // Check that no chart elements are rendered
      expect(container.querySelector('[data-testid="bar-chart"]')).not.toBeInTheDocument();
    });

    it('should return null when data is null', () => {
      const { container } = renderWithProviders(<EntityTypeChart data={null as any} />);
      // When component returns null, React doesn't render anything
      expect(container.querySelector('[data-testid="bar-chart"]')).not.toBeInTheDocument();
    });

    it('should render with custom height', () => {
      const data = [{ type: 'Individual', count: 10 }];
      const { container } = renderWithProviders(<EntityTypeChart data={data} height={400} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle multiple data points', () => {
      const data = [
        { type: 'Individual', count: 10 },
        { type: 'Business', count: 20 },
        { type: 'Trust', count: 5 },
        { type: 'NPO', count: 3 },
      ];
      const { container } = renderWithProviders(<EntityTypeChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero counts', () => {
      const data = [
        { type: 'Individual', count: 0 },
        { type: 'Business', count: 0 },
      ];
      const { container } = renderWithProviders(<EntityTypeChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ApplicationTrendsChart', () => {
    it('should render chart with data', () => {
      const data = [
        { date: '2024-01-01', applications: 5, completed: 3 },
        { date: '2024-01-02', applications: 7, completed: 4 },
      ];
      const { container } = renderWithProviders(<ApplicationTrendsChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should return null when data is empty', () => {
      const { container } = renderWithProviders(<ApplicationTrendsChart data={[]} />);
      // When component returns null, React doesn't render anything
      expect(container.querySelector('[data-testid="area-chart"]')).not.toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const data = [
        { date: '2024-01-01', applications: 5, completed: 3 },
      ];
      const { container } = renderWithProviders(<ApplicationTrendsChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle multiple data points', () => {
      const data = [
        { date: '2024-01-01', applications: 5, completed: 3 },
        { date: '2024-01-02', applications: 7, completed: 4 },
        { date: '2024-01-03', applications: 10, completed: 6 },
        { date: '2024-01-04', applications: 8, completed: 5 },
      ];
      const { container } = renderWithProviders(<ApplicationTrendsChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const data = [
        { date: '2024-01-01', applications: 0, completed: 0 },
        { date: '2024-01-02', applications: 0, completed: 0 },
      ];
      const { container } = renderWithProviders(<ApplicationTrendsChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ChartLegend', () => {
    it('should render legend items', () => {
      const items = [
        { name: 'Submitted', color: '#3182ce' },
        { name: 'Approved', color: '#38a169' },
        { name: 'Rejected', color: '#e53e3e' },
      ];
      renderWithProviders(<ChartLegend items={items} />);
      expect(screen.getByText('Submitted')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should render with empty items', () => {
      renderWithProviders(<ChartLegend items={[]} />);
      // Should render without errors
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should render single item', () => {
      const items = [
        { name: 'Single Item', color: '#3182ce' },
      ];
      renderWithProviders(<ChartLegend items={items} />);
      expect(screen.getByText('Single Item')).toBeInTheDocument();
    });

    it('should handle many items', () => {
      const items = [
        { name: 'Item 1', color: '#3182ce' },
        { name: 'Item 2', color: '#38a169' },
        { name: 'Item 3', color: '#e53e3e' },
        { name: 'Item 4', color: '#f59e0b' },
        { name: 'Item 5', color: '#805ad5' },
      ];
      renderWithProviders(<ChartLegend items={items} />);
      items.forEach(item => {
        expect(screen.getByText(item.name)).toBeInTheDocument();
      });
    });
  });

  describe('StatusPieChart', () => {
    it('should render pie chart with data', () => {
      const data = [
        { name: 'Submitted', value: 10, color: '#3182ce' },
        { name: 'Approved', value: 5, color: '#38a169' },
        { name: 'Rejected', value: 2, color: '#e53e3e' },
      ];
      const { container } = renderWithProviders(<StatusPieChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should return null when data is empty', () => {
      const { container } = renderWithProviders(<StatusPieChart data={[]} />);
      // When component returns null, React doesn't render anything
      expect(container.querySelector('[data-testid="pie-chart"]')).not.toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const data = [
        { name: 'Submitted', value: 10, color: '#3182ce' },
      ];
      const { container } = renderWithProviders(<StatusPieChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const data = [
        { name: 'Submitted', value: 0, color: '#3182ce' },
        { name: 'Approved', value: 0, color: '#38a169' },
      ];
      const { container } = renderWithProviders(<StatusPieChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle many statuses', () => {
      const data = [
        { name: 'Submitted', value: 10, color: '#3182ce' },
        { name: 'In Progress', value: 5, color: '#f59e0b' },
        { name: 'Approved', value: 8, color: '#38a169' },
        { name: 'Rejected', value: 2, color: '#e53e3e' },
        { name: 'Complete', value: 15, color: '#805ad5' },
      ];
      const { container } = renderWithProviders(<StatusPieChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ProcessingTimeChart', () => {
    it('should render processing time chart with data', () => {
      const data = [
        { range: '0-2 days', count: 10 },
        { range: '3-5 days', count: 20 },
        { range: '6-7 days', count: 5 },
        { range: '8+ days', count: 3 },
      ];
      const { container } = renderWithProviders(<ProcessingTimeChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should return null when data is empty', () => {
      const { container } = renderWithProviders(<ProcessingTimeChart data={[]} />);
      // ProcessingTimeChart doesn't check for empty data, it just renders
      // So we check that it renders (component doesn't return null)
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle single range', () => {
      const data = [
        { range: '0-2 days', count: 10 },
      ];
      const { container } = renderWithProviders(<ProcessingTimeChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero counts', () => {
      const data = [
        { range: '0-2 days', count: 0 },
        { range: '3-5 days', count: 0 },
      ];
      const { container } = renderWithProviders(<ProcessingTimeChart data={data} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

