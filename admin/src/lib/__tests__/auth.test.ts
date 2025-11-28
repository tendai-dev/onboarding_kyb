import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authOptions } from '../auth';

// Mock dependencies
vi.mock('../redis-adapter', () => ({
  RedisAdapter: vi.fn(() => ({})),
}));

vi.mock('../redis-session', () => ({
  updateNextAuthAccountTokens: vi.fn(),
  getAccountTokensFromNextAuth: vi.fn(),
}));

vi.mock('../sentry', () => ({
  reportError: vi.fn(),
}));

vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export authOptions', () => {
    expect(authOptions).toBeDefined();
    expect(typeof authOptions).toBe('object');
  });

  it('should have providers configured', () => {
    expect(authOptions.providers).toBeDefined();
    expect(Array.isArray(authOptions.providers)).toBe(true);
  });

  it('should have adapter configured', () => {
    expect(authOptions.adapter).toBeDefined();
  });

  it('should have session configuration', () => {
    expect(authOptions.session).toBeDefined();
  });

  it('should have callbacks configured', () => {
    expect(authOptions.callbacks).toBeDefined();
  });
});

