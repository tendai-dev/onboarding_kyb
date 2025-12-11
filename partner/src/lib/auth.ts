/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { RedisAdapter } from './redis-adapter';

// Log configuration on startup for debugging
const keycloakConfig = {
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'kyb-connect-portal',
  issuer:
    process.env.KEYCLOAK_ISSUER ||
    'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru',
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  expectedRedirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/keycloak`,
};

console.info('[NextAuth Config] Keycloak Configuration:', {
  clientId: keycloakConfig.clientId,
  issuer: keycloakConfig.issuer,
  nextAuthUrl: keycloakConfig.nextAuthUrl,
  expectedRedirectUri: keycloakConfig.expectedRedirectUri,
  hasClientSecret: !!process.env.KEYCLOAK_CLIENT_SECRET,
});

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
      console.info('[NextAuth] Redirect:', {
        url,
        baseUrl,
        expectedBaseUrl: process.env.NEXTAUTH_URL,
      });
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
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
  trustHost: true, // Trust the host header (useful for development)
};

// Export auth function for NextAuth v5
// This replaces getServerSession from v4
export const { auth } = NextAuth(authOptions);
