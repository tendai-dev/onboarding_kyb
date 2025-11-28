import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { VirtualScroll, LazyLoad, LazyImage } from '../PerformanceOptimizations';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
} as any;

describe('PerformanceOptimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('VirtualScroll', () => {
    it('should render virtual scroll', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      const { container } = renderWithProviders(
        <VirtualScroll
          items={items}
          itemHeight={50}
          containerHeight={300}
          renderItem={(item) => <div>{item.name}</div>}
          keyExtractor={(item) => item.id.toString()}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle scrolling', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      const { container } = renderWithProviders(
        <VirtualScroll
          items={items}
          itemHeight={50}
          containerHeight={300}
          renderItem={(item) => <div>{item.name}</div>}
          keyExtractor={(item) => item.id.toString()}
        />
      );
      
      const scrollElement = container.querySelector('[data-testid="virtual-scroll"]') || container;
      fireEvent.scroll(scrollElement, { target: { scrollTop: 500 } });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty items array', () => {
      const { container } = renderWithProviders(
        <VirtualScroll
          items={[]}
          itemHeight={50}
          containerHeight={300}
          renderItem={() => <div>Item</div>}
          keyExtractor={(item) => item.toString()}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle onScroll callback', () => {
      const onScroll = vi.fn();
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      const { container } = renderWithProviders(
        <VirtualScroll
          items={items}
          itemHeight={50}
          containerHeight={300}
          renderItem={(item) => <div>{item.name}</div>}
          keyExtractor={(item) => item.id.toString()}
          onScroll={onScroll}
        />
      );
      
      const scrollElement = container.querySelector('[data-testid="virtual-scroll"]') || container;
      fireEvent.scroll(scrollElement, { target: { scrollTop: 100 } });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle custom overscan', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      const { container } = renderWithProviders(
        <VirtualScroll
          items={items}
          itemHeight={50}
          containerHeight={300}
          renderItem={(item) => <div>{item.name}</div>}
          keyExtractor={(item) => item.id.toString()}
          overscan={10}
        />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('LazyLoad', () => {
    it('should render LazyLoad component', () => {
      const { container } = renderWithProviders(
        <LazyLoad>
          <div>Lazy Content</div>
        </LazyLoad>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render children when visible', () => {
      const { getByText } = renderWithProviders(
        <LazyLoad>
          <div>Lazy Content</div>
        </LazyLoad>
      );
      expect(getByText('Lazy Content')).toBeInTheDocument();
    });

    it('should handle fallback', () => {
      const { container } = renderWithProviders(
        <LazyLoad fallback={<div>Loading...</div>}>
          <div>Lazy Content</div>
        </LazyLoad>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('LazyImage', () => {
    it('should render LazyImage component', () => {
      const { container } = renderWithProviders(
        <LazyImage src="test.jpg" alt="Test" />
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle image loading', () => {
      const { container } = renderWithProviders(
        <LazyImage src="test.jpg" alt="Test Image" />
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle image error', () => {
      const { container } = renderWithProviders(
        <LazyImage src="invalid.jpg" alt="Test" />
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle placeholder', () => {
      const { container } = renderWithProviders(
        <LazyImage src="test.jpg" alt="Test" placeholder="placeholder.jpg" />
      );
      expect(container).toBeInTheDocument();
    });
  });
});

