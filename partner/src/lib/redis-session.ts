import { createClient } from 'redis';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // Determine Redis URL - prefer environment variable, then try Docker service name, then localhost
  let redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    // In Docker containers, use service name 'redis'
    // In production or when REDIS_URL is not set, try Docker service name first
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL !== '1') {
      redisUrl = 'redis://redis:6379';
    } else {
      redisUrl = 'redis://localhost:6379';
    }
  }
  
  console.info('[Redis] Connecting to Redis:', redisUrl.replace(/:[^:@]*@/, ':****@')); // Mask password if present
  
  redisClient = createClient({ 
    url: redisUrl,
    socket: {
      connectTimeout: 10000, // Increase timeout to 10 seconds
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('[Redis] Max reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.info('Redis Client Connected'));

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

/**
 * Get account tokens from NextAuth Account format
 * Maps NextAuth Account to TokenSession format for compatibility
 * This reads from nextauth:account:* keys created by the Redis adapter
 */
export async function getAccountTokensFromNextAuth(
  userId: string,
  provider: string = 'keycloak'
): Promise<TokenSession | null> {
  try {
    const client = await getRedisClient();
    // Look up account by userId and provider
    const userAccountKey = `nextauth:account:user:${userId}:${provider}`;
    const accountRefKey = await client.get(userAccountKey);
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
      accessTokenExpiryTime: account.expires_at
        ? account.expires_at * 1000
        : Date.now() + 3600 * 1000,
      provider: account.provider as 'azure-ad' | 'keycloak',
      userId,
    };
  } catch (error) {
    console.error('[RedisSession] Failed to get account tokens:', error);
    return null;
  }
}

/**
 * Update NextAuth Account tokens (for refresh scenarios)
 * This updates the Account record in Redis created by the adapter
 */
export async function updateNextAuthAccountTokens(
  userId: string,
  provider: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number
): Promise<void> {
  try {
    const client = await getRedisClient();
    const userAccountKey = `nextauth:account:user:${userId}:${provider}`;
    const accountRefKey = await client.get(userAccountKey);
    if (!accountRefKey) {
      throw new Error(`Account not found for user ${userId} and provider ${provider}`);
    }

    const accountData = await client.get(accountRefKey);
    if (!accountData) {
      throw new Error(
        `Account data not found for user ${userId} and provider ${provider}`
      );
    }

    const account = JSON.parse(accountData) as {
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
      [key: string]: unknown;
    };

    const updatedAccount = {
      ...account,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(expiresAt / 1000), // Convert to seconds
    };

    // Use same TTL as adapter (7 days)
    const ACCOUNT_TTL = 7 * 24 * 60 * 60;
    await client.setEx(accountRefKey, ACCOUNT_TTL, JSON.stringify(updatedAccount));
    if (process.env.NODE_ENV === 'development') {
      console.info('[RedisSession] Updated NextAuth account tokens', {
        userId,
        provider,
      });
    }
  } catch (error) {
    console.error('[RedisSession] Failed to update account tokens:', error);
    throw error;
  }
}
