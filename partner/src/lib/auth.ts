/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions, getServerSession } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { RedisAdapter } from './redis-adapter';

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.error('[NextAuth Config] ❌ CRITICAL: NEXTAUTH_SECRET is not set!');
  console.error('[NextAuth Config] Generate one with: openssl rand -base64 32');
}

if (!process.env.NEXTAUTH_URL) {
  console.warn('[NextAuth Config] ⚠️  WARNING: NEXTAUTH_URL is not set, defaulting to http://localhost:3000');
  console.warn('[NextAuth Config] For production, set NEXTAUTH_URL to your deployed URL');
}

// Log configuration on startup for debugging
const keycloakConfig = {
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'kyb-connect-portal',
  issuer:
    process.env.KEYCLOAK_ISSUER ||
    'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru',
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  // Primary callback URL - NextAuth default
  expectedRedirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/keycloak`,
  // Alternative callback URL - custom route that processes callbacks
  // If Keycloak redirects here, we'll process it and forward to NextAuth
  keycloakCallbackUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`,
};

console.info('[NextAuth Config] Keycloak Configuration:', {
  clientId: keycloakConfig.clientId,
  issuer: keycloakConfig.issuer,
  nextAuthUrl: keycloakConfig.nextAuthUrl,
  expectedRedirectUri: keycloakConfig.expectedRedirectUri,
  keycloakCallbackUri: keycloakConfig.keycloakCallbackUri,
  hasClientSecret: !!process.env.KEYCLOAK_CLIENT_SECRET,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
});

// Determine which redirect URI to use
// Allow override via environment variable, otherwise use NextAuth default
const redirectUri = process.env.KEYCLOAK_REDIRECT_URI || keycloakConfig.expectedRedirectUri;

console.info('[NextAuth Config] Using redirect_uri:', redirectUri);
console.info('[NextAuth Config] ⚠️  Ensure this EXACT URL is registered in Keycloak!');

// Build provider config - conditionally include clientSecret only if set
const keycloakProviderConfig: any = {
  clientId: keycloakConfig.clientId,
  issuer: keycloakConfig.issuer,
  authorization: {
    params: {
      // Ensure openid scope is first - required for id_token
      scope: 'openid email profile',
      // Request access to the kyb-connect resource to get roles
      audience: 'resource:kyb-connect',
      // CRITICAL: Explicitly set redirect_uri to ensure it matches during token exchange
      // NextAuth will use this in both the authorization request AND token exchange
      // This MUST match EXACTLY what's registered in Keycloak's Valid Redirect URIs
      // Set KEYCLOAK_REDIRECT_URI env var to override (e.g., if using /auth/callback)
      redirect_uri: redirectUri,
    },
  },
  wellKnown:
    process.env.KEYCLOAK_WELL_KNOWN ||
    `${keycloakConfig.issuer}/.well-known/openid-configuration`,
};

// Only include clientSecret if it's actually set (for confidential clients)
// For public clients, omit it entirely and use 'none' authentication
if (
  process.env.KEYCLOAK_CLIENT_SECRET &&
  process.env.KEYCLOAK_CLIENT_SECRET.trim() !== ''
) {
  keycloakProviderConfig.clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
  console.info('[NextAuth Config] Using confidential client (with secret)');
} else {
  // For public clients, configure token endpoint auth method to 'none'
  // This tells the openid-client library to not send client_secret
  // The library will still handle PKCE automatically
  keycloakProviderConfig.client = {
    token_endpoint_auth_method: 'none',
  };
  console.info(
    '[NextAuth Config] Using public client (no secret, token_endpoint_auth_method: none)'
  );
}

// Increase timeout for OAuth requests (default is 3500ms, increase to 15s)
// Configure via client property for openid-client library
// Merge with existing client config if it exists
keycloakProviderConfig.client = {
  ...(keycloakProviderConfig.client || {}),
  httpOptions: {
    timeout: 15000, // 15 seconds
  },
};

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development', // Enable debug logging in dev
  adapter: RedisAdapter(), // Use Redis adapter for database strategy
  logger: {
    error(code, metadata) {
      console.error('[NextAuth Error]', code, metadata);
    },
    warn(code) {
      console.warn('[NextAuth Warn]', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.info('[NextAuth Debug]', code, metadata);
      }
    },
  },
  providers: [KeycloakProvider(keycloakProviderConfig)],
  callbacks: {
    async signIn({ user, account, profile: _profile }) {
      // Log sign-in attempt for debugging
      if (account) {
        console.info('[NextAuth] Sign-in attempt:', {
          provider: account.provider,
          type: account.type,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          userEmail: user?.email,
        });
      } else {
        console.error('[NextAuth] Sign-in failed - no account object');
        return false;
      }

      // Validate required role from access token
      // This happens during sign-in, before account is linked
      if (account.access_token) {
        try {
          const tokenParts = account.access_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            const resourceAccess = payload.resource_access || {};
            const kybConnectRoles = resourceAccess['resource:kyb-connect']?.roles || [];

            if (process.env.NODE_ENV === 'development') {
              console.info(
                '[NextAuth] Token payload resource_access:',
                JSON.stringify(resourceAccess, null, 2)
              );
              console.info('[NextAuth] kyb-connect roles:', kybConnectRoles);
            }

            if (!kybConnectRoles.includes('business-user')) {
              console.warn('[NextAuth] User missing required role: business-user');
              console.warn('[NextAuth] Available roles:', kybConnectRoles);
              // Don't fail auth - just log warning for now
              // You can uncomment the next line to enforce role requirement:
              // return false;
            } else {
              console.info('[NextAuth] ✅ User has required role: business-user');
            }
          }
        } catch (error) {
          console.error(
            '[NextAuth] Failed to parse access token for role validation:',
            error
          );
          // Continue anyway - don't block auth on parsing errors
        }
      }

      // SECURITY: BFF pattern - tokens are stored in Redis via adapter
      // NextAuth will automatically link the account via linkAccount in the adapter
      // All provider tokens (access_token, refresh_token, expires_at) are stored
      // in the Account model in Redis, not in the session cookie
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Log redirects for debugging
      console.info('[NextAuth] Redirect callback:', {
        url,
        baseUrl,
        expectedBaseUrl: process.env.NEXTAUTH_URL,
      });
      
      // After successful OAuth callback, redirect to dashboard
      // NextAuth will call this after processing the callback
      if (url.includes('/api/auth/callback') || url.includes('/auth/callback')) {
        const dashboardUrl = `${baseUrl}/partner/dashboard`;
        console.info('[NextAuth] ✅ Auth successful, redirecting to dashboard:', dashboardUrl);
        return dashboardUrl;
      }
      
      // If callbackUrl is provided (e.g., from signIn call), use it
      // Otherwise default to dashboard
      if (url && url !== baseUrl && !url.includes('/api/auth')) {
        // Allow relative URLs
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        // Allow same-origin URLs
        try {
          const urlObj = new URL(url);
          if (urlObj.origin === baseUrl) {
            return url;
          }
        } catch {
          // Invalid URL, fall through to default
        }
      }
      
      // Default: redirect to dashboard
      const defaultUrl = `${baseUrl}/partner/dashboard`;
      console.info('[NextAuth] Using default redirect:', defaultUrl);
      return defaultUrl;
    },
    // @ts-expect-error - NextAuth types don't fully support database strategy callback signatures
    async session(params: {
      session: Record<string, unknown>;
      user?: Record<string, unknown>;
    }): Promise<Record<string, unknown>> {
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
          console.info('[NextAuth] Session callback', {
            hasUser: !!user,
            userName: user?.name,
            userEmail: user?.email,
          });
        }

        return sessionObj;
      } catch (error: unknown) {
        console.error('[NextAuth] Session callback error:', error);
        const userObj = params.user as Record<string, unknown> | undefined;
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
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'database', // Use database strategy with Redis adapter
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
  trustHost: true, // Trust the host header (useful for development and reverse proxies)
  // CRITICAL: Set base URL - NextAuth will use this for all callback URLs
  // This must match exactly what's registered in Keycloak
  // NextAuth will construct callback URLs as: {url}/api/auth/callback/{provider}
  url: keycloakConfig.nextAuthUrl,
  // Ensure the callback URL matches what's in Keycloak
  // Both of these should be registered in Keycloak's Valid Redirect URIs:
  // - {NEXTAUTH_URL}/api/auth/callback/keycloak (NextAuth default)
  // - {NEXTAUTH_URL}/auth/callback (alternative, handled by custom route)
};

// Export auth function for NextAuth v4
// Use getServerSession with authOptions
export const auth = () => getServerSession(authOptions);
