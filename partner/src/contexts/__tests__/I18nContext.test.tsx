import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { I18nProvider, useI18n, SUPPORTED_LANGUAGES } from '../I18nContext';

describe('I18nContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide i18n context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider>{children}</I18nProvider>
    );

    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.language).toBeDefined();
    expect(result.current.t).toBeDefined();
  });

  it('should change language', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider>{children}</I18nProvider>
    );

    const { result } = renderHook(() => useI18n(), { wrapper });
    
    act(() => {
      result.current.setLanguage('es');
    });

    expect(result.current.language).toBe('es');
  });

  it('should translate text', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider>{children}</I18nProvider>
    );

    const { result } = renderHook(() => useI18n(), { wrapper });
    const translated = result.current.t('common.save');
    expect(translated).toBeDefined();
  });
});

