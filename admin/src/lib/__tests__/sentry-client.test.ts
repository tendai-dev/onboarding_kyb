import { describe, it, expect, vi } from 'vitest';
import { clientSentry, reportError, reportWarning } from '../sentry-client';

vi.mock('../sentry', () => ({
  reportError: vi.fn(),
  reportWarning: vi.fn(),
  reportApiError: vi.fn(),
  setUserContext: vi.fn(),
  clearUserContext: vi.fn(),
}));

describe('sentry-client', () => {
  it('should export clientSentry object', () => {
    expect(clientSentry).toBeDefined();
    expect(clientSentry.reportError).toBeDefined();
    expect(clientSentry.reportWarning).toBeDefined();
  });

  it('should export individual functions', () => {
    expect(reportError).toBeDefined();
    expect(reportWarning).toBeDefined();
  });
});

