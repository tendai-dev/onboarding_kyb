import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/testUtils';
import { ServiceWorkerRegistration } from '../ServiceWorkerRegistration';

describe('ServiceWorkerRegistration', () => {
  const mockRegister = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        register: mockRegister,
      },
    });
  });

  it('should register service worker', () => {
    renderWithProviders(<ServiceWorkerRegistration />);
    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });

  it('should handle service worker not available', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: undefined,
    });
    
    renderWithProviders(<ServiceWorkerRegistration />);
    // Should not crash
    expect(document.body).toBeInTheDocument();
  });
});

