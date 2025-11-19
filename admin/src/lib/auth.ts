import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { storeTokenSession, getTokenSession, updateAccessToken } from './redis-session';
import { reportError } from './sentry';

// Helper function to refresh tokens
const refreshAccessToken = async (token: any, sessionId?: string) => {
  try {
    // Get refresh token from Redis if sessionId provided
    let refreshToken = token.refreshToken;
    if (sessionId) {
      const session = await getTokenSession(sessionId);
      if (session) {
        refreshToken = session.refreshToken;
      }
    }

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const issuer = process.env.NEXT_PUBLIC_AZURE_AD_ISSUER || `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`;
    
    const response = await fetch(`${issuer}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    const newAccessToken = refreshedTokens.access_token;
    const newRefreshToken = refreshedTokens.refresh_token ?? refreshToken;
    const newExpiryTime = Date.now() + refreshedTokens.expires_in * 1000;

    // Update Redis if sessionId provided
    if (sessionId) {
      await updateAccessToken(sessionId, newAccessToken, newExpiryTime);
      if (newRefreshToken !== refreshToken) {
        const session = await getTokenSession(sessionId);
        if (session) {
          await storeTokenSession(sessionId, {
            ...session,
            refreshToken: newRefreshToken,
            accessToken: newAccessToken,
            accessTokenExpiryTime: newExpiryTime,
          });
        }
      }
    }

    return {
      ...token,
      accessToken: newAccessToken,
      accessTokenExpiryTime: newExpiryTime,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    reportError(error, {
      tags: { error_type: 'token_refresh', operation: 'refresh_access_token' },
      extra: { sessionId, hasRefreshToken: !!token.refreshToken },
      level: 'error',
    });
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email offline_access',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, trigger, session: sessionData }) {
      // Initial sign in - store tokens in Redis
      if (account && user) {
        const sessionId = (token.sub as string) || (token.jti as string) || `session-${Date.now()}-${Math.random()}`;
        token.sessionId = sessionId;
        token.accessTokenExpiryTime = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
        token.user = user;
        
        // Store tokens in Redis (not in JWT)
        try {
          await storeTokenSession(sessionId, {
            accessToken: account.access_token || '',
            refreshToken: account.refresh_token || '',
            accessTokenExpiryTime: token.accessTokenExpiryTime || Date.now() + 3600 * 1000,
            provider: 'azure-ad',
            userEmail: user.email || undefined,
            userId: user.id || user.email || undefined,
          });
        } catch (error) {
          reportError(error, {
            tags: { error_type: 'redis_token_storage', operation: 'store_token_session' },
            extra: { sessionId, userEmail: user.email },
            level: 'error',
          });
          // Continue anyway - tokens will be in JWT as fallback (but shouldn't be exposed)
        }
        
        // Automatically save user email to backend (fire and forget)
        if (user?.email && account.access_token) {
          try {
            const entityConfigApiBaseUrl = process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8003';
            await fetch(`${entityConfigApiBaseUrl}/api/v1/users`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${account.access_token}`,
                'X-User-Email': user.email,
              },
              body: JSON.stringify({
                email: user.email,
                name: user.name || null,
              }),
            }).catch(err => {
              // Silently fail - don't block login if user creation fails
              reportError(err, {
                tags: { error_type: 'user_registration', operation: 'register_user_on_login' },
                extra: { userEmail: user.email },
                level: 'warning',
              });
            });
          } catch (err) {
            // Silently fail - don't block login if user creation fails
            reportError(err, {
              tags: { error_type: 'user_registration', operation: 'register_user_on_login' },
              extra: { userEmail: user.email },
              level: 'warning',
            });
          }
        }
        
        // DO NOT store accessToken/refreshToken in JWT - only in Redis
        return token;
      }

      // Check if we need to refresh token
      const sessionId = token.sessionId as string | undefined;
      if (sessionId) {
        const redisSession = await getTokenSession(sessionId);
        if (redisSession) {
          // Check if token needs refresh
          if (redisSession.accessTokenExpiryTime && Date.now() < redisSession.accessTokenExpiryTime - 60 * 1000) {
            // Token still valid
            return token;
          }
          // Token expired, refresh it
          return refreshAccessToken(token, sessionId);
        }
      }

      // Fallback: if no Redis session, check JWT expiry (legacy support)
      if (token.accessTokenExpiryTime && Date.now() < token.accessTokenExpiryTime - 60 * 1000) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token, sessionId);
    },
    async session({ session, token }) {
      // DO NOT expose accessToken or sessionId to frontend - BFF pattern
      // sessionId is stored in httpOnly JWT cookie only, never exposed to client-side JS
      session.user = token.user as any;
      session.error = token.error as string | undefined;
      // session.sessionId is REMOVED - sessionId only exists in httpOnly JWT cookie
      // session.accessToken is removed - tokens are only in Redis
      
      // Update user last login (fire and forget) - use proxy endpoint instead
      if (session.user?.email) {
        try {
          // This will go through proxy which will inject token from Redis
          const entityConfigApiBaseUrl = process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8003';
          // Use relative path to go through proxy
          fetch('/api/proxy/api/v1/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Email': session.user.email,
            },
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.name || null,
            }),
          }).catch(err => {
            // Silently fail - don't block session if update fails
            reportError(err, {
              tags: { error_type: 'user_update', operation: 'update_user_last_login' },
              extra: { userEmail: session.user?.email },
              level: 'warning',
            });
          });
        } catch (err) {
          // Silently fail - don't block session if update fails
          reportError(err, {
            tags: { error_type: 'user_update', operation: 'update_user_last_login' },
            extra: { userEmail: session.user?.email },
            level: 'warning',
          });
        }
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
};

