// @ts-expect-error - NextAuth v5 beta compatibility - types not fully available yet
import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { RedisAdapter } from './redis-adapter';
// Removed unused imports: updateNextAuthAccountTokens, getAccountTokensFromNextAuth
import { reportError } from './sentry';
import { logger } from './logger';

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
  console.error('[NextAuth] Missing required environment variables:', missingVars);
}

// Log Azure AD configuration for debugging
// Always log in production too to help debug OAuth issues
const issuer =
  process.env.NEXT_PUBLIC_AZURE_AD_ISSUER ||
  `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`;

const nextAuthUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://admin-mukuru.kurasika.tech';
const expectedCallbackUrl = `${nextAuthUrl}/api/auth/callback/azure-ad`;

console.info('[NextAuth Config] Azure AD Configuration:', {
  clientId: process.env.AZURE_AD_CLIENT_ID,
  tenantId: process.env.AZURE_AD_TENANT_ID,
  issuer,
  nextAuthUrl,
  expectedCallbackUrl,
  hasClientSecret: !!process.env.AZURE_AD_CLIENT_SECRET,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  hasNextPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
});

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug logging to diagnose OAuth errors
  adapter: RedisAdapter(), // Use Redis adapter for database strategy
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // @ts-expect-error - tenantId is a valid property for Azure AD provider but not in type definition
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      // Explicitly set issuer to ensure correct URL construction
      issuer:
        process.env.NEXT_PUBLIC_AZURE_AD_ISSUER ||
        `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          // OAuth scopes for Azure AD authentication:
          // - openid: Sign users in (Delegated, no admin consent)
          // - email: View users' email address (Delegated, no admin consent)
          // - profile: Access user's basic profile (Delegated, no admin consent)
          // - offline_access: Get refresh tokens for token renewal
          // Note: Removed api://{clientId}/.default as it requires API to be exposed in Azure AD
          scope: 'openid email profile offline_access',
          // NOTE: Do NOT set redirect_uri explicitly - NextAuth v5 constructs it automatically from the 'url' config
          // The redirect URI will be: {NEXTAUTH_URL}/api/auth/callback/azure-ad
          // Ensure this exact URL is registered in Azure AD app registration
        },
      },
      profile(profile: unknown) {
        const p = profile as Record<string, unknown>;
        return {
          id: (p.sub || p.oid || p.id) as string | undefined,
          name: (p.name ||
            p.displayName ||
            (p.given_name && p.family_name
              ? `${String(p.given_name)} ${String(p.family_name)}`
              : null) ||
            p.preferred_username ||
            p.email) as string | null | undefined,
          email: (p.email || p.preferred_username || p.upn) as string | undefined,
          image: (p.picture || undefined) as string | undefined,
        };
      },
    }),
  ],
  callbacks: {
    // With database strategy, NextAuth handles account linking automatically via adapter
    // We only need to handle user registration and session data
    async signIn({ user, account, profile: _profile }: Record<string, unknown>) {
      try {
        // Log sign-in for debugging
        if (process.env.NODE_ENV === 'development') {
          const userObj = user as Record<string, unknown>;
          const accountObj = account as Record<string, unknown>;
          logger.debug('[NextAuth] Sign in event', {
            userId: userObj?.id,
            userEmail: userObj?.email,
            provider: accountObj?.provider,
            hasAccessToken: !!accountObj?.access_token,
          });
        }

        // SECURITY: BFF pattern - tokens are stored in Redis via adapter
        // User registration will be handled in session callback via proxy pattern
        // This ensures all API calls go through the proxy which injects tokens from Redis
        // No direct token usage here - tokens are server-side only

        return true;
      } catch (error: unknown) {
        logger.error(error, '[NextAuth] Sign in callback error', {
          tags: { error_type: 'signin_callback' },
          extra: { stack: error instanceof Error ? error.stack : undefined },
        });
        // Allow sign-in to proceed even if callbacks fail
        return true;
      }
    },
    async session(params: {
      session: Record<string, unknown>;
      user?: Record<string, unknown>;
    }) {
      try {
        // SECURITY: BFF (Backend-For-Frontend) pattern - DO NOT expose tokens or sessionId to frontend
        // sessionId is stored in httpOnly cookie only, never exposed to client-side JS
        // Tokens are stored in Redis and retrieved server-side by API proxy
        // With database strategy, user is provided directly from adapter
        // No need to extract from token - NextAuth handles this
        const { session: sessionObj, user: userObj } = params;
        if (userObj) {
          sessionObj.user = {
            id: userObj.id || undefined,
            name: userObj.name || undefined,
            email: userObj.email || undefined,
            image: userObj.image || undefined,
          };
        }

        // Log session for debugging
        if (process.env.NODE_ENV === 'development') {
          const user = sessionObj.user as Record<string, unknown> | undefined;
          logger.debug('[NextAuth] Session callback', {
            hasUser: !!user,
            userName: user?.name,
            userEmail: user?.email,
          });
        }

        // Register/update user in backend (fire and forget) - use proxy endpoint
        // SECURITY: BFF pattern - proxy will inject token from Redis, no direct token usage
        // This handles both initial registration and subsequent login updates
        // NOTE: This is intentionally fire-and-forget to avoid blocking session creation
        // The backend user registration is non-critical for session establishment
        const user = sessionObj.user as Record<string, unknown> | undefined;
        const userEmail = user?.email;
        if (userEmail && typeof userEmail === 'string') {
          // Use absolute URL for fetch to ensure it works in all environments
          const baseUrl =
            process.env.NEXTAUTH_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            'http://localhost:3001';
          const proxyUrl = `${baseUrl}/api/proxy/api/v1/users`;

          // Fire and forget - don't await to avoid blocking session callback
          fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Email': userEmail,
            },
            body: JSON.stringify({
              email: userEmail,
              name: user?.name && typeof user.name === 'string' ? user.name : null,
            }),
            // Don't wait for response - this is non-blocking
            signal: AbortSignal.timeout(5000), // 5 second timeout
          }).catch((err) => {
            // Silently fail - don't block session if registration/update fails
            // This is expected in some scenarios (user already exists, backend unavailable, etc.)
            if (process.env.NODE_ENV === 'development') {
              logger.debug('[NextAuth] User registration failed (non-critical)', {
                userEmail,
                error: err instanceof Error ? err.message : String(err),
              });
            }
            reportError(err, {
              tags: {
                error_type: 'user_registration',
                operation: 'register_or_update_user',
              },
              extra: { userEmail },
              level: 'warning',
            });
          });
        }

        return sessionObj;
      } catch (error: unknown) {
        logger.error(error, '[NextAuth] Session callback error', {
          tags: { error_type: 'session_callback' },
          extra: { stack: error instanceof Error ? error.stack : undefined },
        });
        const userObj = params.user as Record<string, unknown> | undefined;
        reportError(error, {
          tags: { error_type: 'session_callback', operation: 'session_callback' },
          extra: {
            hasUser: !!userObj,
            userId: userObj?.id || undefined,
          },
          level: 'error',
        });
        // Return session anyway to prevent complete failure
        // Create a minimal session object if we can't construct a proper one
        const fallbackSession = {
          user: userObj
            ? {
                id: userObj.id || undefined,
                name: userObj.name || undefined,
                email: userObj.email || undefined,
                image: userObj.image || undefined,
              }
            : undefined,
        };
        return fallbackSession as Record<string, unknown>;
      }
    },
    async redirect({ url, baseUrl }: { url?: unknown; baseUrl?: unknown }) {
      // Handle redirect after successful authentication
      // Use NEXTAUTH_URL if set, otherwise use baseUrl from NextAuth (which detects from request)
      const nextAuthUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
      let baseUrlStr = nextAuthUrl || String(baseUrl || 'http://localhost:3001');
      
      // CRITICAL: If baseUrl contains localhost but we have a production URL in env, use production URL
      if (baseUrlStr.includes('localhost') || baseUrlStr.includes('127.0.0.1')) {
        if (nextAuthUrl && !nextAuthUrl.includes('localhost')) {
          baseUrlStr = nextAuthUrl;
          logger.debug('NextAuth redirect: Replaced localhost baseUrl with production URL', {
            originalBaseUrl: String(baseUrl || ''),
            productionUrl: baseUrlStr,
          });
        }
      }
      
      const urlStr = String(url || '');
      
      logger.debug('NextAuth redirect callback', { 
        url: urlStr, 
        baseUrl: baseUrlStr,
        nextAuthUrl,
        hasNextAuthUrl: !!nextAuthUrl,
        detectedBaseUrl: String(baseUrl || ''),
      });

      // If url is the sign-in page, redirect to dashboard instead
      if (urlStr === `${baseUrlStr}/` || urlStr === baseUrlStr || urlStr === '/') {
        logger.debug('Redirecting from sign-in page to dashboard');
        return `${baseUrlStr}/dashboard`;
      }

      // If url is a relative path, prepend baseUrl
      if (urlStr.startsWith('/')) {
        return `${baseUrlStr}${urlStr}`;
      }

      // If url is on the same origin, allow it (but check for localhost)
      try {
        const urlObj = new URL(urlStr);
        const baseUrlObj = new URL(baseUrlStr);
        
        // If callbackUrl contains localhost, replace with production domain
        if (urlObj.origin.includes('localhost') || urlObj.origin.includes('127.0.0.1')) {
          if (nextAuthUrl && !nextAuthUrl.includes('localhost')) {
            const prodUrl = new URL(nextAuthUrl);
            return `${prodUrl.origin}${urlObj.pathname}${urlObj.search}`;
          }
        }
        
        if (urlObj.origin === baseUrlObj.origin) {
          return urlStr;
        }
      } catch {
        // URL parsing failed, fall through to default
      }

      // Default to dashboard
      return `${baseUrlStr}/dashboard`;
    },
  },
  pages: {
    signIn: '/',
    error: '/', // Redirect errors back to sign-in page
  },
  events: {
    async signIn(params: { user?: unknown; account?: unknown; profile?: unknown }) {
      const { user, account, profile: _profile } = params;
      if (process.env.NODE_ENV === 'development') {
        const userObj = user as Record<string, unknown>;
        const accountObj = account as Record<string, unknown>;
        logger.debug('[NextAuth] Sign in event', {
          userId: userObj?.id,
          userEmail: userObj?.email,
          provider: accountObj?.provider,
        });
      }
      return true;
    },
    async signOut({ session: _session, token: _token }: Record<string, unknown>) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[NextAuth] Sign out event');
      }
    },
    async error({ error, message }: Record<string, unknown>) {
      const errorObj = error as Record<string, unknown>;
      const messageStr =
        typeof message === 'string' ? message : String(message || 'Unknown error');
      const errorInstance = error instanceof Error ? error : new Error(messageStr);

      // Enhanced logging for OAuth callback errors
      const isOAuthCallbackError = 
        messageStr.includes('OAuthCallbackError') || 
        messageStr.includes('OAuth') ||
        errorObj?.type === 'OAuthCallbackError';

      const errorDetails = {
        message: messageStr,
        errorType: errorObj?.type,
        errorStack: errorObj?.stack,
        ...(isOAuthCallbackError && {
          // Include OAuth-specific diagnostics
          expectedCallbackUrl,
          nextAuthUrl,
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          hasNextPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
          azureAdClientId: process.env.AZURE_AD_CLIENT_ID,
          azureAdTenantId: process.env.AZURE_AD_TENANT_ID,
          troubleshooting: {
            step1: 'Verify redirect URI in Azure AD matches exactly:',
            redirectUri: expectedCallbackUrl,
            step2: 'Check Azure Portal → App registrations → Authentication → Redirect URIs',
            step3: 'Ensure NEXTAUTH_URL environment variable is set correctly',
            currentNextAuthUrl: nextAuthUrl,
          },
        }),
      };

      logger.error(errorInstance, '[NextAuth] Error event', {
        tags: { 
          error_type: 'nextauth_error_event',
          ...(isOAuthCallbackError && { error_category: 'oauth_callback' }),
        },
        extra: {
          ...errorDetails,
          isOAuthCallbackError,
        },
      });
      
      reportError(errorInstance, {
        tags: { 
          error_type: 'nextauth_error', 
          operation: 'nextauth_error_event',
          ...(isOAuthCallbackError && { error_category: 'oauth_callback' }),
        },
        extra: {
          ...errorDetails,
          isOAuthCallbackError,
        },
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
      name:
        process.env.NODE_ENV === 'production'
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
  // trustHost must be true in production when behind a reverse proxy
  // The url config below ensures correct callback URLs
  trustHost: true,
  // CRITICAL: Set base URL - NextAuth will use this for all callback URLs
  // This must match exactly what's registered in Azure AD
  // For production: https://admin-mukuru.kurasika.tech
  // For local development: http://localhost:3001
  url: nextAuthUrl,
};

// Export auth function for NextAuth v5 beta
// This replaces getServerSession from v4
export const { auth } = NextAuth(authOptions);
