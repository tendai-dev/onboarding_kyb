import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRedisClient, storeTokenSession, getTokenSession, deleteTokenSession, updateAccessToken } from '../redis-session';

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
    (getRedisClient as any).mockResolvedValue(mockRedisClient);
  });

  it('should store token session', async () => {
    const sessionId = 'test-session';
    const tokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiryTime: Date.now() + 3600000,
      provider: 'azure-ad' as const,
    };

    await storeTokenSession(sessionId, tokens);

    expect(mockRedisClient.setEx).toHaveBeenCalledWith(
      `session:${sessionId}`,
      expect.any(Number),
      JSON.stringify(tokens)
    );
  });

  it('should get token session', async () => {
    const sessionId = 'test-session';
    const tokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiryTime: Date.now() + 3600000,
      provider: 'azure-ad' as const,
    };

    mockRedisClient.get.mockResolvedValue(JSON.stringify(tokens));

    const result = await getTokenSession(sessionId);

    expect(result).toEqual(tokens);
    expect(mockRedisClient.get).toHaveBeenCalledWith(`session:${sessionId}`);
  });

  it('should return null when session not found', async () => {
    mockRedisClient.get.mockResolvedValue(null);

    const result = await getTokenSession('non-existent');

    expect(result).toBeNull();
  });

  it('should delete token session', async () => {
    const sessionId = 'test-session';

    await deleteTokenSession(sessionId);

    expect(mockRedisClient.del).toHaveBeenCalledWith(`session:${sessionId}`);
  });

  it('should update access token', async () => {
    const sessionId = 'test-session';
    const existingTokens = {
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
      accessTokenExpiryTime: Date.now(),
      provider: 'azure-ad' as const,
    };

    mockRedisClient.get.mockResolvedValue(JSON.stringify(existingTokens));

    const newAccessToken = 'new-token';
    const newExpiryTime = Date.now() + 7200000;

    await updateAccessToken(sessionId, newAccessToken, newExpiryTime);

    expect(mockRedisClient.setEx).toHaveBeenCalled();
  });
});

