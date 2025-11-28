import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePWAInstall, usePushNotifications } from '../usePWA';

describe('usePWA hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usePWAInstall', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePWAInstall());
      
      expect(result.current.isInstallable).toBe(false);
      expect(result.current.isInstalled).toBe(false);
      expect(typeof result.current.installApp).toBe('function');
    });

    it('should detect installed app', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: true,
          media: '(display-mode: standalone)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => usePWAInstall());
      
      expect(result.current.isInstalled).toBe(true);
    });

    it('should handle beforeinstallprompt event', async () => {
      const { result } = renderHook(() => usePWAInstall());
      
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(event, 'prompt', { value: vi.fn() });
      Object.defineProperty(event, 'userChoice', {
        value: Promise.resolve({ outcome: 'accepted' }),
      });

      window.dispatchEvent(event);

      await waitFor(() => {
        expect(result.current.isInstallable).toBe(true);
      });
    });

    it('should handle appinstalled event', async () => {
      const { result } = renderHook(() => usePWAInstall());
      
      const event = new Event('appinstalled');
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(result.current.isInstalled).toBe(true);
      });
    });

    it('should install app when installApp is called', async () => {
      const mockPrompt = vi.fn();
      const mockUserChoice = Promise.resolve({ outcome: 'accepted' });
      
      const { result } = renderHook(() => usePWAInstall());
      
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(event, 'prompt', { value: mockPrompt });
      Object.defineProperty(event, 'userChoice', { value: mockUserChoice });

      window.dispatchEvent(event);

      await waitFor(() => {
        expect(result.current.isInstallable).toBe(true);
      });

      const installed = await result.current.installApp();
      
      expect(installed).toBe(true);
    });
  });

  describe('usePushNotifications', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('granted'),
        },
      });
    });

    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePushNotifications());
      
      expect(result.current.isSupported).toBe(true);
      expect(result.current.permission).toBe('default');
      expect(typeof result.current.requestPermission).toBe('function');
    });

    it('should detect unsupported notifications', () => {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => usePushNotifications());
      
      expect(result.current.isSupported).toBe(false);
    });

    it('should request notification permission', async () => {
      const { result } = renderHook(() => usePushNotifications());
      
      const granted = await result.current.requestPermission();
      
      expect(granted).toBe(true);
      expect(window.Notification.requestPermission).toHaveBeenCalled();
    });

    it('should handle permission denial', async () => {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('denied'),
        },
      });

      const { result } = renderHook(() => usePushNotifications());
      
      const granted = await result.current.requestPermission();
      
      expect(granted).toBe(false);
    });
  });
});

