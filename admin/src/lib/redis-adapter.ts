/**
 * Custom Redis Adapter for NextAuth v5
 * Implements NextAuth's Adapter interface to store sessions, accounts, and users in Redis
 * This enables database strategy with opaque session tokens instead of JWTs
 */

import type { Adapter, AdapterUser, AdapterSession, AdapterAccount, VerificationToken } from 'next-auth/adapters';
import { getRedisClient } from './redis-session';
import { logger } from './logger';

// Redis key prefixes
const SESSION_PREFIX = 'nextauth:session:';
const ACCOUNT_PREFIX = 'nextauth:account:';
const USER_PREFIX = 'nextauth:user:';
const VERIFICATION_TOKEN_PREFIX = 'nextauth:verification-token:';

// TTLs (in seconds)
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days
const ACCOUNT_TTL = 30 * 24 * 60 * 60; // 30 days
const USER_TTL = 30 * 24 * 60 * 60; // 30 days
const VERIFICATION_TOKEN_TTL = 24 * 60 * 60; // 24 hours

/**
 * Redis Adapter for NextAuth
 * Stores sessions, accounts, and users in Redis with proper TTLs
 */
export function RedisAdapter(): Adapter {
  return {
    // User operations
    async createUser(user: Omit<AdapterUser, 'id'>): Promise<AdapterUser> {
      const client = await getRedisClient();
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const adapterUser: AdapterUser = {
        ...user,
        id: userId,
        emailVerified: user.emailVerified || null,
      };

      const key = `${USER_PREFIX}${userId}`;
      await client.setEx(key, USER_TTL, JSON.stringify(adapterUser));

      // Also index by email for getUserByEmail
      if (user.email) {
        const emailKey = `${USER_PREFIX}email:${user.email}`;
        await client.setEx(emailKey, USER_TTL, userId);
      }

      logger.debug('[RedisAdapter] Created user', { userId, email: user.email });
      return adapterUser;
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      const client = await getRedisClient();
      const key = `${USER_PREFIX}${id}`;
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as AdapterUser;
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const client = await getRedisClient();
      const emailKey = `${USER_PREFIX}email:${email}`;
      const userId = await client.get(emailKey);
      if (!userId) return null;
      return this.getUser(userId);
    },

    async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }): Promise<AdapterUser | null> {
      const client = await getRedisClient();
      const accountKey = `${ACCOUNT_PREFIX}${provider}:${providerAccountId}`;
      const accountData = await client.get(accountKey);
      if (!accountData) return null;
      const account = JSON.parse(accountData) as AdapterAccount;
      return this.getUser(account.userId);
    },

    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>): Promise<AdapterUser> {
      const client = await getRedisClient();
      const existing = await this.getUser(user.id);
      if (!existing) {
        throw new Error(`User ${user.id} not found`);
      }

      const updated: AdapterUser = { ...existing, ...user };
      const key = `${USER_PREFIX}${user.id}`;
      await client.setEx(key, USER_TTL, JSON.stringify(updated));

      // Update email index if email changed
      if (user.email && user.email !== existing.email) {
        // Remove old email index
        if (existing.email) {
          const oldEmailKey = `${USER_PREFIX}email:${existing.email}`;
          await client.del(oldEmailKey);
        }
        // Add new email index
        const newEmailKey = `${USER_PREFIX}email:${user.email}`;
        await client.setEx(newEmailKey, USER_TTL, user.id);
      }

      logger.debug('[RedisAdapter] Updated user', { userId: user.id });
      return updated;
    },

    async deleteUser(userId: string): Promise<void> {
      const client = await getRedisClient();
      const user = await this.getUser(userId);
      if (user) {
        // Delete email index
        if (user.email) {
          const emailKey = `${USER_PREFIX}email:${user.email}`;
          await client.del(emailKey);
        }
        // Delete user
        const key = `${USER_PREFIX}${userId}`;
        await client.del(key);
        logger.debug('[RedisAdapter] Deleted user', { userId });
      }
    },

    // Session operations
    async createSession(session: Omit<AdapterSession, 'expires'> & { expires: Date }): Promise<AdapterSession> {
      const client = await getRedisClient();
      const key = `${SESSION_PREFIX}${session.sessionToken}`;
      const sessionData = {
        ...session,
        expires: session.expires.toISOString(),
      };
      await client.setEx(key, SESSION_TTL, JSON.stringify(sessionData));
      logger.debug('[RedisAdapter] Created session', { sessionToken: session.sessionToken, userId: session.userId });
      return session;
    },

    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const client = await getRedisClient();
      const key = `${SESSION_PREFIX}${sessionToken}`;
      const sessionData = await client.get(key);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData) as { expires: string; [key: string]: any };
      const adapterSession: AdapterSession = {
        ...session,
        expires: new Date(session.expires),
      };

      const user = await this.getUser(adapterSession.userId);
      if (!user) return null;

      return { session: adapterSession, user };
    },

    async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>): Promise<AdapterSession | null> {
      const client = await getRedisClient();
      const key = `${SESSION_PREFIX}${session.sessionToken}`;
      const existing = await client.get(key);
      if (!existing) return null;

      const existingSession = JSON.parse(existing) as { expires: string; [key: string]: any };
      const updated: AdapterSession = {
        ...existingSession,
        ...session,
        expires: session.expires || new Date(existingSession.expires),
      };

      await client.setEx(key, SESSION_TTL, JSON.stringify({
        ...updated,
        expires: updated.expires.toISOString(),
      }));

      logger.debug('[RedisAdapter] Updated session', { sessionToken: session.sessionToken });
      return updated;
    },

    async deleteSession(sessionToken: string): Promise<void> {
      const client = await getRedisClient();
      const key = `${SESSION_PREFIX}${sessionToken}`;
      await client.del(key);
      logger.debug('[RedisAdapter] Deleted session', { sessionToken });
    },

    // Account operations
    async linkAccount(account: AdapterAccount): Promise<void> {
      const client = await getRedisClient();
      const accountKey = `${ACCOUNT_PREFIX}${account.provider}:${account.providerAccountId}`;
      await client.setEx(accountKey, ACCOUNT_TTL, JSON.stringify(account));

      // Also store by userId for account lookup
      const userAccountKey = `${ACCOUNT_PREFIX}user:${account.userId}:${account.provider}`;
      await client.setEx(userAccountKey, ACCOUNT_TTL, accountKey);

      logger.debug('[RedisAdapter] Linked account', {
        userId: account.userId,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      });
    },

    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }): Promise<void> {
      const client = await getRedisClient();
      const accountKey = `${ACCOUNT_PREFIX}${provider}:${providerAccountId}`;
      const accountData = await client.get(accountKey);
      if (accountData) {
        const account = JSON.parse(accountData) as AdapterAccount;
        const userAccountKey = `${ACCOUNT_PREFIX}user:${account.userId}:${provider}`;
        await client.del(userAccountKey);
      }
      await client.del(accountKey);
      logger.debug('[RedisAdapter] Unlinked account', { provider, providerAccountId });
    },

    // Verification token operations (for email verification, password reset, etc.)
    async createVerificationToken(verificationToken: VerificationToken): Promise<VerificationToken> {
      const client = await getRedisClient();
      const key = `${VERIFICATION_TOKEN_PREFIX}${verificationToken.identifier}:${verificationToken.token}`;
      await client.setEx(key, VERIFICATION_TOKEN_TTL, JSON.stringify(verificationToken));
      logger.debug('[RedisAdapter] Created verification token', { identifier: verificationToken.identifier });
      return verificationToken;
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }): Promise<VerificationToken | null> {
      const client = await getRedisClient();
      const key = `${VERIFICATION_TOKEN_PREFIX}${identifier}:${token}`;
      const data = await client.get(key);
      if (!data) return null;
      await client.del(key); // Delete after use (one-time token)
      logger.debug('[RedisAdapter] Used verification token', { identifier });
      return JSON.parse(data) as VerificationToken;
    },
  };
}

