// @ts-expect-error - NextAuth v5 beta compatibility - types not fully available yet
import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { RedisAdapter } from './redis-adapter';
import { updateNextAuthAccountTokens, getAccountTokensFromNextAuth } from './redis-session';
import { reportError } from './sentry';
import { logger } from './logger';

// Helper function to refresh tokens for NextAuth Account
const refreshAccessTokenForAccount = async (userId: string, provider: string = 'azure-ad') => {
  try {
    // Get account tokens from NextAuth Account storage
    const accountTokens = await getAccountTokensFromNextAuth(userId, provider);
    if (!accountTokens || !accountTokens.refreshToken) {
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
        refresh_token: accountTokens.refreshToken,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    const newAccessToken = refreshedTokens.access_token;
    const newRefreshToken = refreshedTokens.refresh_token ?? accountTokens.refreshToken;
    const newExpiryTime = Date.now() + refreshedTokens.expires_in * 1000;

    // Update NextAuth Account in Redis
    await updateNextAuthAccountTokens(
      userId,
      provider,
      newAccessToken,
      newRefreshToken,
      newExpiryTime
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: Math.floor(newExpiryTime / 1000), // Convert to seconds
    };
  } catch (error) {
    reportError(error, {
      tags: { error_type: 'token_refresh', operation: 'refresh_access_token' },
      extra: { userId, provider },
      level: 'error',
    });
    throw error;
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
  adapter: RedisAdapter(), // Use Redis adapter for database strategy
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
    // With database strategy, NextAuth handles account linking automatically via adapter
    // We only need to handle user registration and session data
    async signIn({ user, account, profile }: any) {
      try {
        // Log sign-in for debugging
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[NextAuth] Sign in event', {
            userId: user?.id,
            userEmail: user?.email,
            provider: account?.provider,
            hasAccessToken: !!account?.access_token,
          });
        }

        // SECURITY: BFF pattern - tokens are stored in Redis via adapter
        // User registration will be handled in session callback via proxy pattern
        // This ensures all API calls go through the proxy which injects tokens from Redis
        // No direct token usage here - tokens are server-side only

        return true;
      } catch (error: any) {
        logger.error(error, '[NextAuth] Sign in callback error', {
          tags: { error_type: 'signin_callback' },
          extra: { stack: error?.stack }
        });
        // Allow sign-in to proceed even if callbacks fail
        return true;
      }
    },
    async session({ session, user }: any) {
      try {
        // SECURITY: BFF (Backend-For-Frontend) pattern - DO NOT expose tokens or sessionId to frontend
        // sessionId is stored in httpOnly cookie only, never exposed to client-side JS
        // Tokens are stored in Redis and retrieved server-side by API proxy
        // With database strategy, user is provided directly from adapter
        // No need to extract from token - NextAuth handles this
        if (user) {
          session.user = {
            id: user.id || undefined,
            name: user.name || undefined,
            email: user.email || undefined,
            image: user.image || undefined,
          };
        }

        // Log session for debugging
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[NextAuth] Session callback', {
            hasUser: !!session.user,
            userName: session.user?.name,
            userEmail: session.user?.email,
          });
        }

        // Register/update user in backend (fire and forget) - use proxy endpoint
        // SECURITY: BFF pattern - proxy will inject token from Redis, no direct token usage
        // This handles both initial registration and subsequent login updates
        if (session.user?.email) {
          try {
            // This will go through proxy which will inject token from NextAuth Account stored in Redis
            // Proxy reads httpOnly session cookie, resolves session from Redis, retrieves tokens, injects Authorization header
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
              // Silently fail - don't block session if registration/update fails
              reportError(err, {
                tags: { error_type: 'user_registration', operation: 'register_or_update_user' },
                extra: { userEmail: session.user?.email },
                level: 'warning',
              });
            });
          } catch (err) {
            // Silently fail - don't block session if registration/update fails
            reportError(err, {
              tags: { error_type: 'user_registration', operation: 'register_or_update_user' },
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
            hasUser: !!user,
            userId: user?.id,
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
    strategy: 'database', // Use database strategy with Redis adapter
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true, // Enterprise security: prevent JavaScript access to session cookie
        sameSite: 'strict', // Enterprise security: prevent cross-site token leakage
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Ensure proper base URL for callbacks
  trustHost: true, // Trust the host header (useful for development)
};

// Export auth function for NextAuth v5 beta
// This replaces getServerSession from v4
export const { auth } = NextAuth(authOptions);

