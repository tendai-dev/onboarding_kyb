import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRedisClient,
  getAccountTokensFromNextAuth,
  updateNextAuthAccountTokens,
} from '../redis-session';

vi.mock('../redis-session', async () => {
  const actual = await vi.importActual('../redis-session');
  return {
    ...actual,
    getRedisClient: vi.fn(),
  };
});

describe('redis-session', () => {
  const mockRedisClient = {
    setEx: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    isOpen: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRedisClient).mockResolvedValue(mockRedisClient);
  });

  it('should get account tokens from NextAuth', async () => {
    const userId = 'user-123';
    const provider = 'azure-ad';
    const accountRefKey = 'nextauth:account:azure-ad:provider-id';
    const accountData = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      provider: 'azure-ad',
      providerAccountId: 'provider-id',
    };

    mockRedisClient.get
      .mockResolvedValueOnce(accountRefKey) // userAccountKey lookup
      .mockResolvedValueOnce(JSON.stringify(accountData)); // accountData lookup

    const result = await getAccountTokensFromNextAuth(userId, provider);

    expect(result).toBeDefined();
    expect(result?.accessToken).toBe('access-token');
    expect(result?.refreshToken).toBe('refresh-token');
    expect(result?.provider).toBe('azure-ad');
    expect(result?.userId).toBe(userId);
  });

  it('should return null when account not found', async () => {
    mockRedisClient.get.mockResolvedValue(null);

    const result = await getAccountTokensFromNextAuth('user-123', 'azure-ad');

    expect(result).toBeNull();
  });

  it('should update NextAuth account tokens', async () => {
    const userId = 'user-123';
    const provider = 'azure-ad';
    const accountRefKey = 'nextauth:account:azure-ad:provider-id';
    const existingAccount = {
      access_token: 'old-token',
      refresh_token: 'old-refresh',
      expires_at: Math.floor(Date.now() / 1000),
      provider: 'azure-ad',
      providerAccountId: 'provider-id',
    };

    mockRedisClient.get
      .mockResolvedValueOnce(accountRefKey) // userAccountKey lookup
      .mockResolvedValueOnce(JSON.stringify(existingAccount)); // accountData lookup

    const newAccessToken = 'new-token';
    const newRefreshToken = 'new-refresh';
    const newExpiresAt = Date.now() + 7200000;

    await updateNextAuthAccountTokens(
      userId,
      provider,
      newAccessToken,
      newRefreshToken,
      newExpiresAt
    );

    expect(mockRedisClient.setEx).toHaveBeenCalled();
    const callArgs = mockRedisClient.setEx.mock.calls[0];
    expect(callArgs[0]).toBe(accountRefKey);
    const updatedAccount = JSON.parse(callArgs[2] as string);
    expect(updatedAccount.access_token).toBe(newAccessToken);
    expect(updatedAccount.refresh_token).toBe(newRefreshToken);
  });
});
