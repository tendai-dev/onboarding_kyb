import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePWAInstall } from '../usePWA';

describe('usePWA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
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

  it('should return PWA install hook values', () => {
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current).toBeDefined();
    expect(result.current.isInstallable).toBeDefined();
    expect(result.current.isInstalled).toBeDefined();
    expect(result.current.installApp).toBeDefined();
  });

  it('should detect if app is already installed', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
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
    (event as any).preventDefault = vi.fn();
    (event as any).prompt = vi.fn();
    (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
    
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });
  });

  it('should handle appinstalled event', async () => {
    const { result } = renderHook(() => usePWAInstall());
    
    window.dispatchEvent(new Event('appinstalled'));
    
    await waitFor(() => {
      expect(result.current.isInstalled).toBe(true);
    });
  });

  it('should call installApp', async () => {
    const { result } = renderHook(() => usePWAInstall());
    
    const mockPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };
    
    // Set deferred prompt
    const event = new Event('beforeinstallprompt');
    (event as any).preventDefault = vi.fn();
    Object.assign(event, mockPrompt);
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });
    
    const installResult = await result.current.installApp();
    expect(installResult).toBe(true);
  });

  it('should handle install rejection', async () => {
    const { result } = renderHook(() => usePWAInstall());
    
    const mockPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    };
    
    const event = new Event('beforeinstallprompt');
    (event as any).preventDefault = vi.fn();
    Object.assign(event, mockPrompt);
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });
    
    const installResult = await result.current.installApp();
    expect(installResult).toBe(false);
  });
});

