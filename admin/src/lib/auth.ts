// @ts-expect-error - NextAuth v5 beta compatibility - types not fully available yet
import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { storeTokenSession, getTokenSession, updateAccessToken } from './redis-session';
import { reportError } from './sentry';
import { logger } from './logger';

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

// Validate required environment variables
const requiredEnvVars = {
  AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID,
  AZURE_AD_CLIENT_SECRET: process.env.AZURE_AD_CLIENT_SECRET,
  AZURE_AD_TENANT_ID: process.env.AZURE_AD_TENANT_ID,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  // eslint-disable-next-line no-console
  console.error('[NextAuth] Missing required environment variables:', missingVars);
}

// Log Azure AD configuration for debugging
if (process.env.NODE_ENV === 'development') {
  const issuer = process.env.NEXT_PUBLIC_AZURE_AD_ISSUER || `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`;
  // eslint-disable-next-line no-console
  console.log('[NextAuth Config] Azure AD Configuration:', {
    clientId: process.env.AZURE_AD_CLIENT_ID,
    tenantId: process.env.AZURE_AD_TENANT_ID,
    issuer,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    expectedCallbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/azure-ad`,
    hasClientSecret: !!process.env.AZURE_AD_CLIENT_SECRET,
  });
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development', // Enable debug logging in development
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // @ts-expect-error - tenantId is valid but not in types for v5 beta - will be fixed in stable release
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      // Explicitly set issuer to ensure correct URL construction
      issuer: process.env.NEXT_PUBLIC_AZURE_AD_ISSUER || `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          // Using only the absolute minimum permissions that don't require admin consent:
          // - openid: Sign users in (Delegated, no admin consent)
          // - email: View users' email address (Delegated, no admin consent)
          // Note: Removed 'profile' and 'offline_access' as they may require admin consent
          // depending on Azure AD app registration settings
          scope: 'openid email',
        },
      },
      profile(profile: any) {
        return {
          id: profile.sub || profile.oid || profile.id,
          name: profile.name || profile.displayName || (profile.given_name && profile.family_name ? `${profile.given_name} ${profile.family_name}` : null) || profile.preferred_username || profile.email,
          email: profile.email || profile.preferred_username || profile.upn,
          image: profile.picture || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, trigger, session: sessionData }: any) {
      try {
        // Initial sign in - store tokens in Redis
        if (account && user) {
        const sessionId = (token.sub as string) || (token.jti as string) || `session-${Date.now()}-${Math.random()}`;
        token.sessionId = sessionId;
        token.accessTokenExpiryTime = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
        
        // Log user data from Azure AD for debugging
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[NextAuth] JWT callback - User data', {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            tokenSub: token.sub,
            tokenName: token.name,
            tokenEmail: token.email,
          });
        }
        
        // Preserve user data from Azure AD - ensure name is included
        // Use user object first, then fall back to token claims
        token.user = {
          id: user.id || token.sub || undefined,
          name: user.name || token.name || (token as any).given_name + ' ' + (token as any).family_name || undefined,
          email: user.email || token.email || undefined,
          image: user.image || token.picture || undefined,
        };
        
        // Also store name and email directly on token for fallback
        if (user.name) token.name = user.name;
        else if (token.name) token.name = token.name as string;
        else if ((token as any).given_name && (token as any).family_name) {
          token.name = `${(token as any).given_name} ${(token as any).family_name}`;
          token.user.name = token.name;
        }
        
        if (user.email) token.email = user.email;
        else if (token.email) token.email = token.email as string;
        
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
      } catch (error: any) {
        logger.error(error, '[NextAuth] JWT callback error', {
          tags: { error_type: 'jwt_callback' },
          extra: { stack: error?.stack }
        });
        reportError(error, {
          tags: { error_type: 'jwt_callback', operation: 'jwt_callback' },
          extra: { 
            hasAccount: !!account,
            hasUser: !!user,
            tokenSub: token?.sub,
            trigger,
          },
          level: 'error',
        });
        // Return token anyway to prevent complete failure
        return token;
      }
    },
    async session({ session, token }: any) {
      try {
        // DO NOT expose accessToken or sessionId to frontend - BFF pattern
        // sessionId is stored in httpOnly JWT cookie only, never exposed to client-side JS
        
        // Set user data from token - prioritize token.user, then token fields
        if (token.user) {
          session.user = {
            id: token.user.id || token.sub || undefined,
            name: token.user.name || token.name ? (token.name as string) : undefined,
            email: token.user.email || token.email ? (token.email as string) : undefined,
            image: token.user.image || token.picture ? (token.picture as string) : undefined,
          };
        } else if (token.name || token.email) {
          // Use token fields directly if user object not available
          session.user = {
            id: token.sub || undefined,
            name: token.name ? (token.name as string) : undefined,
            email: token.email ? (token.email as string) : undefined,
            image: token.picture ? (token.picture as string) : undefined,
          };
        }
        
        // Log session for debugging
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[NextAuth] Session callback', {
            hasUser: !!session.user,
            userName: session.user?.name,
            userEmail: session.user?.email,
            tokenHasUser: !!token.user,
            tokenName: token.name,
            tokenEmail: token.email,
          });
        }
        
        session.error = token.error as string | undefined;
      
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
      } catch (error: any) {
        logger.error(error, '[NextAuth] Session callback error', {
          tags: { error_type: 'session_callback' },
          extra: { stack: error?.stack }
        });
        reportError(error, {
          tags: { error_type: 'session_callback', operation: 'session_callback' },
          extra: { 
            hasToken: !!token,
            tokenSub: token?.sub,
          },
          level: 'error',
        });
        // Return session anyway to prevent complete failure
        return session;
      }
    },
    async redirect({ url, baseUrl }: any) {
      // Handle redirect after successful authentication
      logger.debug('NextAuth redirect callback', { url, baseUrl });
      
      // If url is the sign-in page, redirect to dashboard instead
      if (url === `${baseUrl}/` || url === baseUrl || url === '/') {
        logger.debug('Redirecting from sign-in page to dashboard');
        return `${baseUrl}/dashboard`;
      }
      
      // If url is a relative path, prepend baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // If url is on the same origin, allow it
      try {
      if (new URL(url).origin === baseUrl) {
        return url;
        }
      } catch (e) {
        // URL parsing failed, fall through to default
      }
      
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/',
    error: '/', // Redirect errors back to sign-in page
  },
  events: {
    async signIn({ user, account, profile }: any) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[NextAuth] Sign in event', {
          userId: user?.id,
          userEmail: user?.email,
          provider: account?.provider,
        });
      }
      return true;
    },
    async signOut({ session, token }: any) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[NextAuth] Sign out event');
      }
    },
    async error({ error, message }: any) {
      logger.error(error || new Error(message), '[NextAuth] Error event', {
        tags: { error_type: 'nextauth_error_event' },
        extra: {
          message,
          errorType: error?.type,
          errorStack: error?.stack,
        }
      });
      reportError(error || new Error(message), {
        tags: { error_type: 'nextauth_error', operation: 'nextauth_error_event' },
        extra: { message, errorType: error?.type },
        level: 'error',
      });
    },
  },
  session: {
    strategy: 'jwt',
  },
  // Ensure proper base URL for callbacks
  trustHost: true, // Trust the host header (useful for development)
};

// Export auth function for NextAuth v5 beta
// This replaces getServerSession from v4
export const { auth } = NextAuth(authOptions);

