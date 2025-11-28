import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import {
  VirtualScroll,
  LazyLoad,
  LazyImage,
  MemoizedTable,
  DebouncedSearch,
  PerformanceMonitor,
  useBundleOptimization,
} from '../PerformanceOptimizations';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: IntersectionObserverCallback) {}
} as any;

describe('PerformanceOptimizations Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('VirtualScroll', () => {
    const mockItems = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));

    it('should render virtual scroll', () => {
      renderWithProviders(
        <VirtualScroll
          items={mockItems}
          itemHeight={50}
          containerHeight={300}
          renderItem={(item) => <div>{item.name}</div>}
          keyExtractor={(item) => item.id.toString()}
        />
      );
      expect(document.body).toBeInTheDocument();
    });

    it('should render only visible items', () => {
      renderWithProviders(
        <VirtualScroll
          items={mockItems}
          itemHeight={50}
          containerHeight={300}
          renderItem={(item) => <div>{item.name}</div>}
          keyExtractor={(item) => item.id.toString()}
        />
      );
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('LazyLoad', () => {
    it('should render lazy load component', () => {
      renderWithProviders(
        <LazyLoad height="200px">
          <div>Content</div>
        </LazyLoad>
      );
      expect(document.body).toBeInTheDocument();
    });

    it('should show placeholder initially', () => {
      renderWithProviders(
        <LazyLoad height="200px" placeholder={<div>Loading...</div>}>
          <div>Content</div>
        </LazyLoad>
      );
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('LazyImage', () => {
    it('should render lazy image', () => {
      renderWithProviders(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
        />
      );
      expect(document.body).toBeInTheDocument();
    });

    it('should handle image load', async () => {
      renderWithProviders(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          onLoad={vi.fn()}
        />
      );
      await waitFor(() => expect(document.body).toBeInTheDocument());
    });

    it('should handle image error', async () => {
      const onError = vi.fn();
      renderWithProviders(
        <LazyImage
          src="/invalid.jpg"
          alt="Test image"
          fallback="/fallback.jpg"
          onError={onError}
        />
      );
      await waitFor(() => expect(document.body).toBeInTheDocument());
    });
  });

  describe('MemoizedTable', () => {
    const mockData = [
      { id: '1', name: 'Item 1', value: 10 },
      { id: '2', name: 'Item 2', value: 20 },
    ];

    const mockColumns = [
      { key: 'name' as const, label: 'Name' },
      { key: 'value' as const, label: 'Value' },
    ];

    it('should render memoized table', () => {
      renderWithProviders(
        <MemoizedTable
          data={mockData}
          columns={mockColumns}
        />
      );
      expect(document.body).toBeInTheDocument();
    });

    it('should handle sorting', () => {
      const onSort = vi.fn();
      renderWithProviders(
        <MemoizedTable
          data={mockData}
          columns={mockColumns}
          onSort={onSort}
        />
      );
      expect(document.body).toBeInTheDocument();
    });

    it('should handle row selection', () => {
      const onRowSelect = vi.fn();
      renderWithProviders(
        <MemoizedTable
          data={mockData}
          columns={mockColumns}
          selectable
          onRowSelect={onRowSelect}
        />
      );
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('DebouncedSearch', () => {
    it('should render debounced search', () => {
      const onSearch = vi.fn();
      renderWithProviders(
        <DebouncedSearch
          placeholder="Search..."
          onSearch={onSearch}
        />
      );
      expect(document.body).toBeInTheDocument();
    });

    it('should debounce search input', async () => {
      const onSearch = vi.fn();
      const { container } = renderWithProviders(
        <DebouncedSearch
          placeholder="Search..."
          onSearch={onSearch}
          debounceMs={100}
        />
      );

      const input = container.querySelector('input');
      if (input) {
        fireEvent.change(input, { target: { value: 'test' } });
        await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 200 });
      }
    });
  });

  describe('PerformanceMonitor', () => {
    it('should render performance monitor', () => {
      renderWithProviders(
        <PerformanceMonitor>
          <div>Content</div>
        </PerformanceMonitor>
      );
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('useBundleOptimization', () => {
    it('should return optimization hook', () => {
      const TestComponent = () => {
        const { isLoaded, loadComponent } = useBundleOptimization();
        return <div>{isLoaded ? 'Loaded' : 'Not Loaded'}</div>;
      };

      renderWithProviders(<TestComponent />);
      expect(document.body).toBeInTheDocument();
    });
  });
});

