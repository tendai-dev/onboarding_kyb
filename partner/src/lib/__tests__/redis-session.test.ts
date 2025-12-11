import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRedisClient,
  getAccountTokensFromNextAuth,
  updateNextAuthAccountTokens,
} from '../redis-session';

// Mock redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    isOpen: true,
    connect: vi.fn().mockResolvedValue(undefined),
    setEx: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
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

  it('should get account tokens from NextAuth', async () => {
    const mockClient = await getRedisClient();

    // Mock the account lookup
    vi.mocked(mockClient.get)
      .mockResolvedValueOnce('nextauth:account:keycloak:provider-id') // accountRefKey
      .mockResolvedValueOnce(
        JSON.stringify({
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          provider: 'keycloak',
          providerAccountId: 'provider-id',
        })
      );

    const tokens = await getAccountTokensFromNextAuth('user-123', 'keycloak');
    expect(tokens).toBeDefined();
    expect(tokens?.accessToken).toBe('test-token');
  });

  it('should return null when account not found', async () => {
    const mockClient = await getRedisClient();
    vi.mocked(mockClient.get).mockResolvedValue(null);

    const tokens = await getAccountTokensFromNextAuth('user-123', 'keycloak');
    expect(tokens).toBeNull();
  });

  it('should update NextAuth account tokens', async () => {
    const mockClient = await getRedisClient();

    // Mock the account lookup
    vi.mocked(mockClient.get)
      .mockResolvedValueOnce('nextauth:account:keycloak:provider-id') // accountRefKey
      .mockResolvedValueOnce(
        JSON.stringify({
          access_token: 'old-token',
          refresh_token: 'old-refresh',
          expires_at: Math.floor(Date.now() / 1000),
          provider: 'keycloak',
          providerAccountId: 'provider-id',
        })
      );

    await expect(
      updateNextAuthAccountTokens(
        'user-123',
        'keycloak',
        'new-token',
        'new-refresh',
        Date.now() + 3600000
      )
    ).resolves.not.toThrow();
  });
});
