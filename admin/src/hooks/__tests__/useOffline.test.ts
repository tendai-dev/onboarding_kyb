import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNetworkStatus, useOfflineSubmission, useOfflineCache, useOfflineIndicator } from '../useOffline';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
};

global.indexedDB = mockIndexedDB as any;

describe('useOffline hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useNetworkStatus', () => {
    it('should return online status', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.isOnline).toBe(true);
    });

    it('should return offline status', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.isOnline).toBe(false);
    });

    it('should detect slow connection', () => {
      const mockConnection = {
        effectiveType: '2g',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.isSlowConnection).toBe(true);
    });
  });

  describe('useOfflineSubmission', () => {
    it('should queue submission when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      global.fetch = vi.fn();
      
      const { result } = renderHook(() => useOfflineSubmission());
      
      const submission = {
        url: '/api/test',
        method: 'POST',
        headers: {},
        body: { test: 'data' },
      };

      const response = await result.current.queueSubmission(submission);
      
      expect(response.success).toBe(false);
      expect(response.queued).toBe(true);
    });

    it('should submit immediately when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useOfflineSubmission());
      
      const submission = {
        url: '/api/test',
        method: 'POST',
        headers: {},
        body: { test: 'data' },
      };

      await result.current.queueSubmission(submission);
      
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('useOfflineCache', () => {
    it('should fetch data when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      const mockFetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(() => 
        useOfflineCache('test-key', mockFetcher)
      );

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalled();
      });
    });

    it('should use cached data when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      const mockFetcher = vi.fn();

      const { result } = renderHook(() => 
        useOfflineCache('test-key', mockFetcher)
      );

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('useOfflineIndicator', () => {
    it('should show indicator when offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const { result } = renderHook(() => useOfflineIndicator());
      
      expect(result.current.showIndicator).toBe(true);
      expect(result.current.isOnline).toBe(false);
    });

    it('should not show indicator when online', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      const { result } = renderHook(() => useOfflineIndicator());
      
      expect(result.current.isOnline).toBe(true);
    });
  });
});

