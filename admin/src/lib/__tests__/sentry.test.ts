import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { reportError, reportWarning, reportApiError, setUserContext, clearUserContext } from '../sentry';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
}));

describe('sentry utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reportError', () => {
    it('should report Error instance', () => {
      const error = new Error('Test error');
      reportError(error);
      expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.any(Object));
    });

    it('should report string error', () => {
      reportError('String error');
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should report with context', () => {
      const error = new Error('Test');
      reportError(error, {
        tags: { component: 'test' },
        extra: { data: 'test' },
      });
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('reportWarning', () => {
    it('should report warning message', () => {
      reportWarning('Test warning');
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test warning', expect.any(Object));
    });

    it('should report warning with context', () => {
      reportWarning('Test warning', {
        tags: { component: 'test' },
      });
      expect(Sentry.captureMessage).toHaveBeenCalled();
    });
  });

  describe('reportApiError', () => {
    it('should report API error', () => {
      const error = new Error('API error');
      reportApiError(error, {
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 500,
      });
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('setUserContext', () => {
    it('should set user context', () => {
      setUserContext({
        id: 'user-1',
        email: 'test@example.com',
      });
      expect(Sentry.setUser).toHaveBeenCalled();
    });
  });

  describe('clearUserContext', () => {
    it('should clear user context', () => {
      clearUserContext();
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });
});

