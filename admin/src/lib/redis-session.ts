import { createClient } from 'redis';
import { reportError } from './sentry';
import { logger } from './logger';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;
let redisConnectionFailed = false;
let lastConnectionAttempt = 0;
const CONNECTION_RETRY_INTERVAL = 30000; // 30 seconds between retry attempts
const CONNECTION_TIMEOUT = 5000; // 5 second connection timeout

export async function getRedisClient() {
  // If connection previously failed, check if we should retry
  if (redisConnectionFailed) {
    const now = Date.now();
    if (now - lastConnectionAttempt < CONNECTION_RETRY_INTERVAL) {
      throw new Error('Redis connection unavailable (cached failure)');
    }
    // Reset for retry
    redisConnectionFailed = false;
    redisClient = null;
  }

  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = createClient({ 
    url: redisUrl,
    socket: {
      connectTimeout: CONNECTION_TIMEOUT,
      reconnectStrategy: (retries) => {
        // Only retry a few times, then give up
        if (retries > 3) {
          redisConnectionFailed = true;
          return new Error('Redis max retries reached');
        }
        return Math.min(retries * 100, 1000);
      },
    },
  });

  redisClient.on('error', (err) => {
    // Only report if Sentry is available, otherwise just log
    try {
      reportError(err, {
        tags: { error_type: 'redis_connection', operation: 'redis_client_error' },
        level: 'error',
      });
    } catch {
      console.error('[Redis] Connection error:', err);
    }
  });
  redisClient.on('connect', () => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.info('Redis Client Connected');
    }
  });

  try {
    lastConnectionAttempt = Date.now();
    if (!redisClient.isOpen) {
      // Add timeout to connection attempt
      const connectPromise = redisClient.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis connection timeout')), CONNECTION_TIMEOUT);
      });
      await Promise.race([connectPromise, timeoutPromise]);
    }
  } catch (error) {
    console.error('[Redis] Failed to connect:', error);
    redisConnectionFailed = true;
    // Clean up the failed client
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch {
        // Ignore quit errors
      }
      redisClient = null;
    }
    throw error;
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
    id_token?: string;
    refresh_token?: string;
    expires_at?: number;
    provider: string;
    providerAccountId: string;
  };

  // Use id_token for Azure AD because the access_token has v1.0 issuer (sts.windows.net)
  // but the backend expects v2.0 issuer (login.microsoftonline.com/.../v2.0)
  // The id_token has the correct v2.0 issuer
  const tokenToUse = account.provider === 'azure-ad' && account.id_token 
    ? account.id_token 
    : account.access_token;

  if (!tokenToUse) return null;

  return {
    accessToken: tokenToUse,
    refreshToken: account.refresh_token || '',
    accessTokenExpiryTime: account.expires_at
      ? account.expires_at * 1000
      : Date.now() + 3600 * 1000,
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
  expiresAt: number,
  idToken?: string
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
    id_token?: string;
    refresh_token?: string;
    expires_at?: number;
    [key: string]: unknown;
  };

  const updatedAccount = {
    ...account,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Math.floor(expiresAt / 1000), // Convert to seconds
    ...(idToken && { id_token: idToken }),
  };

  await client.setEx(accountRefKey, 30 * 24 * 60 * 60, JSON.stringify(updatedAccount));
  logger.debug('[RedisSession] Updated NextAuth account tokens', { userId, provider });
}
