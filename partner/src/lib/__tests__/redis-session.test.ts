import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRedisClient, storeTokenSession, getTokenSession, updateAccessToken } from '../redis-session';

// Mock redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    isOpen: true,
    connect: vi.fn().mockResolvedValue(undefined),
    setEx: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(JSON.stringify({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      accessTokenExpiryTime: Date.now() + 3600000,
      provider: 'keycloak',
    })),
    on: vi.fn(),
  })),
}));

describe('redis-session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get redis client', async () => {
    const client = await getRedisClient();
    expect(client).toBeDefined();
  });

  it('should store token session', async () => {
    await expect(storeTokenSession('test-session', {
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      accessTokenExpiryTime: Date.now() + 3600000,
      provider: 'keycloak',
    })).resolves.not.toThrow();
  });

  it('should get token session', async () => {
    const session = await getTokenSession('test-session');
    expect(session).toBeDefined();
  });

  it('should update access token', async () => {
    await expect(updateAccessToken('test-session', 'new-token', Date.now() + 3600000))
      .resolves.not.toThrow();
  });
});

