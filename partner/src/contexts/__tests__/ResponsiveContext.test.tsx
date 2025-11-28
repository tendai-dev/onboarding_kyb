import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { ResponsiveProvider, useResponsive } from '../ResponsiveContext';

describe('ResponsiveContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide responsive context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ResponsiveProvider>{children}</ResponsiveProvider>
    );

    const { result } = renderHook(() => useResponsive(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.isMobile).toBeDefined();
    expect(result.current.isTablet).toBeDefined();
    expect(result.current.isDesktop).toBeDefined();
    expect(result.current.screenSize).toBeDefined();
  });

  it('should detect touch device', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ResponsiveProvider>{children}</ResponsiveProvider>
    );

    const { result } = renderHook(() => useResponsive(), { wrapper });
    expect(typeof result.current.touchDevice).toBe('boolean');
  });
});

