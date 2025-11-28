import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNetworkStatus, useOfflineSubmission, useOfflineCache, useOfflineIndicator } from '../useOffline';

// Mock IndexedDB properly
const mockDB = {
  transaction: vi.fn(() => ({
    objectStore: vi.fn(() => ({
      get: vi.fn(() => ({
        onsuccess: null,
        onerror: null,
        result: null,
        error: null,
      })),
      put: vi.fn(() => ({
        onsuccess: null,
        onerror: null,
        result: null,
        error: null,
      })),
      delete: vi.fn(() => ({
        onsuccess: null,
        onerror: null,
        result: null,
        error: null,
      })),
    })),
  })),
};

const mockRequest = {
  onerror: null,
  onsuccess: null,
  onupgradeneeded: null,
  result: mockDB,
  error: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockIndexedDB = {
  open: vi.fn(() => mockRequest),
  deleteDatabase: vi.fn(() => mockRequest),
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  configurable: true,
  value: mockIndexedDB,
});

// Make sure mockRequest is returned
mockIndexedDB.open.mockReturnValue(mockRequest);

describe('useOffline hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('useNetworkStatus', () => {
    it('should return network status', () => {
      const { result } = renderHook(() => useNetworkStatus());
      expect(result.current).toBeDefined();
      expect(result.current.isOnline).toBeDefined();
      expect(result.current.isSlowConnection).toBeDefined();
    });
  });

  describe('useOfflineSubmission', () => {
    it('should return offline submission hook', () => {
      const { result } = renderHook(() => useOfflineSubmission());
      expect(result.current).toBeDefined();
      expect(result.current.queueSubmission).toBeDefined();
      expect(result.current.queuedSubmissions).toBeDefined();
    });
  });

  describe('useOfflineCache', () => {
    it('should return offline cache hook', () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });
      const { result } = renderHook(() => useOfflineCache('test-key', fetcher));
      expect(result.current).toBeDefined();
      expect(result.current.data).toBeDefined();
      expect(result.current.isLoading).toBeDefined();
    });
  });

  describe('useOfflineIndicator', () => {
    it('should return offline indicator hook', () => {
      const { result } = renderHook(() => useOfflineIndicator());
      expect(result.current).toBeDefined();
      expect(result.current.showIndicator).toBeDefined();
      expect(result.current.isOnline).toBeDefined();
    });
  });
});

