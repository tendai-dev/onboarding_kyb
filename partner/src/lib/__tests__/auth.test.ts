import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next-auth
vi.mock('next-auth/providers/keycloak', () => ({
  default: vi.fn(),
}));

vi.mock('./redis-session', () => ({
  storeTokenSession: vi.fn(),
  getTokenSession: vi.fn(),
  updateAccessToken: vi.fn(),
}));

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export auth configuration', async () => {
    // Import auth config
    const authModule = await import('../auth');
    expect(authModule).toBeDefined();
  });
});
