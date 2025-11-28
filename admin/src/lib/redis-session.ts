import { createClient } from 'redis';
import { reportError } from './sentry';
import { logger } from './logger';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = createClient({ url: redisUrl });

  redisClient.on('error', (err) => {
    reportError(err, {
      tags: { error_type: 'redis_connection', operation: 'redis_client_error' },
      level: 'error',
    });
  });
  redisClient.on('connect', () => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Redis Client Connected');
    }
  });

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

export interface TokenSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiryTime: number;
  provider: 'azure-ad' | 'keycloak';
  userEmail?: string;
  userId?: string;
}

const SESSION_PREFIX = 'session:';
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Store IdP tokens in Redis, keyed by session ID
 */
export async function storeTokenSession(
  sessionId: string,
  tokens: TokenSession
): Promise<void> {
  const client = await getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;
  await client.setEx(key, TTL_SECONDS, JSON.stringify(tokens));
}

/**
 * Retrieve IdP tokens from Redis by session ID
 */
export async function getTokenSession(
  sessionId: string
): Promise<TokenSession | null> {
  const client = await getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;
  const data = await client.get(key);
  if (!data) return null;
  return JSON.parse(data) as TokenSession;
}

/**
 * Delete token session from Redis
 */
export async function deleteTokenSession(sessionId: string): Promise<void> {
  const client = await getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;
  await client.del(key);
}

/**
 * Update access token (for refresh scenarios)
 */
export async function updateAccessToken(
  sessionId: string,
  accessToken: string,
  accessTokenExpiryTime: number
): Promise<void> {
  const session = await getTokenSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  await storeTokenSession(sessionId, {
    ...session,
    accessToken,
    accessTokenExpiryTime,
  });
}

/**
 * Get account tokens from NextAuth Account format
 * Maps NextAuth Account to TokenSession format for compatibility
 */
export async function getAccountTokensFromNextAuth(
  userId: string,
  provider: string = 'azure-ad'
): Promise<TokenSession | null> {
  const client = await getRedisClient();
  const accountKey = `nextauth:account:user:${userId}:${provider}`;
  const accountRefKey = await client.get(accountKey);
  if (!accountRefKey) return null;

  const accountData = await client.get(accountRefKey);
  if (!accountData) return null;

  const account = JSON.parse(accountData) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    provider: string;
    providerAccountId: string;
  };

  if (!account.access_token) return null;

  return {
    accessToken: account.access_token,
    refreshToken: account.refresh_token || '',
    accessTokenExpiryTime: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
    provider: account.provider as 'azure-ad' | 'keycloak',
    userId,
  };
}

/**
 * Update NextAuth Account tokens (for refresh scenarios)
 */
export async function updateNextAuthAccountTokens(
  userId: string,
  provider: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number
): Promise<void> {
  const client = await getRedisClient();
  const accountKey = `nextauth:account:user:${userId}:${provider}`;
  const accountRefKey = await client.get(accountKey);
  if (!accountRefKey) {
    throw new Error(`Account not found for user ${userId} and provider ${provider}`);
  }

  const accountData = await client.get(accountRefKey);
  if (!accountData) {
    throw new Error(`Account data not found for user ${userId} and provider ${provider}`);
  }

  const account = JSON.parse(accountData) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    [key: string]: any;
  };

  const updatedAccount = {
    ...account,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Math.floor(expiresAt / 1000), // Convert to seconds
  };

  await client.setEx(accountRefKey, 30 * 24 * 60 * 60, JSON.stringify(updatedAccount));
  logger.debug('[RedisSession] Updated NextAuth account tokens', { userId, provider });
}

