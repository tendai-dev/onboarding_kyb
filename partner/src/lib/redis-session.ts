import { createClient } from 'redis';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = createClient({ url: redisUrl });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Redis Client Connected'));

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
  try {
    const client = await getRedisClient();
    const key = `${SESSION_PREFIX}${sessionId}`;
    await client.setEx(key, TTL_SECONDS, JSON.stringify(tokens));
    console.log(`[Redis] Stored token session: ${key}`);
  } catch (error) {
    console.error('[Redis] Failed to store token session:', error);
    throw error; // Re-throw so caller knows it failed
  }
}

/**
 * Retrieve IdP tokens from Redis by session ID
 */
export async function getTokenSession(
  sessionId: string
): Promise<TokenSession | null> {
  try {
    const client = await getRedisClient();
    const key = `${SESSION_PREFIX}${sessionId}`;
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as TokenSession;
  } catch (error) {
    console.error('[Redis] Failed to get token session:', error);
    return null; // Return null instead of throwing
  }
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

