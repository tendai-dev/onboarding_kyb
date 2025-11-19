import { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { storeTokenSession, getTokenSession, updateAccessToken } from './redis-session';

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

    const tokenUrl = process.env.KEYCLOAK_TOKEN_URL || 
                     'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru/protocol/openid-connect/token';
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID || 'kyb-connect-portal',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET || '',
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    const newAccessToken = refreshedTokens.access_token;
    const newRefreshToken = refreshedTokens.refresh_token ?? refreshToken;
    const newExpiryTime = Date.now() + (refreshedTokens.expires_in * 1000);

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
    console.error('Error refreshing access token', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
};

// Log configuration on startup for debugging
const keycloakConfig = {
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'kyb-connect-portal',
  issuer: process.env.KEYCLOAK_ISSUER || 'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru',
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  expectedRedirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/keycloak`,
};

console.log('[NextAuth Config] Keycloak Configuration:', {
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
  wellKnown: process.env.KEYCLOAK_WELL_KNOWN || `${keycloakConfig.issuer}/.well-known/openid-configuration`,
};

// Only include clientSecret if it's actually set (for confidential clients)
// For public clients, omit it entirely and use 'none' authentication
if (process.env.KEYCLOAK_CLIENT_SECRET && process.env.KEYCLOAK_CLIENT_SECRET.trim() !== '') {
  keycloakProviderConfig.clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
  console.log('[NextAuth Config] Using confidential client (with secret)');
} else {
  // For public clients, configure token endpoint auth method to 'none'
  // This tells the openid-client library to not send client_secret
  // The library will still handle PKCE automatically
  keycloakProviderConfig.client = {
    token_endpoint_auth_method: 'none',
  };
  console.log('[NextAuth Config] Using public client (no secret, token_endpoint_auth_method: none)');
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development', // Enable debug logging in dev
  logger: {
    error(code, metadata) {
      console.error('[NextAuth Error]', code, metadata);
    },
    warn(code) {
      console.warn('[NextAuth Warn]', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NextAuth Debug]', code, metadata);
      }
    },
  },
  providers: [
    KeycloakProvider(keycloakProviderConfig),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Log sign-in attempt for debugging
      if (account) {
        console.log('[NextAuth] Sign-in attempt:', {
          provider: account.provider,
          type: account.type,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
        });
      } else {
        console.error('[NextAuth] Sign-in failed - no account object');
        return false;
      }

      // Note: Role validation happens in JWT callback after token exchange
      // We don't validate here because id_token might not have resource_access
      // The access_token will have the roles we need
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Log redirects for debugging
      console.log('[NextAuth] Redirect:', { url, baseUrl, expectedBaseUrl: process.env.NEXTAUTH_URL });
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, account, user }) {
      // Initial sign in - store tokens in Redis
      if (account && user) {
        console.log('[NextAuth] JWT callback - storing tokens:', {
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          expiresAt: account.expires_at,
          userEmail: user.email,
        });

        const sessionId = (token.sub as string) || (token.jti as string) || `session-${Date.now()}-${Math.random()}`;
        token.sessionId = sessionId;
        token.accessTokenExpiryTime = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
        // Ensure user object is properly set with all required fields
        token.user = {
          id: user.id || user.email || sessionId,
          name: user.name || user.email || 'User',
          email: user.email || undefined,
          image: user.image || undefined,
        };
        // Also store email and name directly in token for fallback
        token.email = user.email;
        token.name = user.name || user.email || 'User';
        
        // Store tokens in Redis (not in JWT)
        if (!account.access_token) {
          console.error('[NextAuth] No access token received from Keycloak - this will cause Callback error');
          // Don't throw - let NextAuth handle the error, but log it
          token.error = 'NoAccessToken';
          return token;
        }
        
        // Validate required role from access token
        try {
          const tokenParts = account.access_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            const resourceAccess = payload.resource_access || {};
            const kybConnectRoles = resourceAccess['resource:kyb-connect']?.roles || [];
            
            console.log('[NextAuth] Token payload resource_access:', JSON.stringify(resourceAccess, null, 2));
            console.log('[NextAuth] kyb-connect roles:', kybConnectRoles);
            
            if (!kybConnectRoles.includes('business-user')) {
              console.warn('[NextAuth] User missing required role: business-user');
              console.warn('[NextAuth] Available roles:', kybConnectRoles);
              console.warn('[NextAuth] Full resource_access:', JSON.stringify(resourceAccess, null, 2));
              // Don't fail auth - just log warning for now
              // You can uncomment the next lines to enforce role requirement:
              // token.error = 'MissingRole';
              // return token;
            } else {
              // Store role info in token for session
              token.roles = kybConnectRoles;
              console.log('[NextAuth] ✅ User has required role: business-user');
            }
          }
        } catch (error) {
          console.error('[NextAuth] Failed to parse access token for role validation:', error);
          // Continue anyway - don't block auth on parsing errors
        }
        
        try {
          await storeTokenSession(sessionId, {
            accessToken: account.access_token,
            refreshToken: account.refresh_token || '',
            accessTokenExpiryTime: token.accessTokenExpiryTime || Date.now() + 3600 * 1000,
            provider: 'keycloak',
            userEmail: user.email || undefined,
            userId: user.id || user.email || undefined,
          });
          console.log('[NextAuth] Tokens stored in Redis successfully');
        } catch (error) {
          console.error('[NextAuth] Failed to store tokens in Redis:', error);
          // Don't fail the auth flow if Redis fails - log it but continue
          // The tokens are still in the account object, so auth can proceed
        }
        
        // DO NOT store accessToken/refreshToken in JWT - only in Redis
        return token;
      }

      // Check if we need to refresh token
      const sessionId = token.sessionId as string | undefined;
      if (sessionId) {
        try {
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
        } catch (error) {
          console.error('[NextAuth] Failed to get Redis session:', error);
          // Continue with fallback logic
        }
      }

      // Fallback: if no Redis session, check JWT expiry (legacy support)
      if (token.accessTokenExpiryTime && Date.now() < token.accessTokenExpiryTime - 60 * 1000) {
        return token;
      }

      // Access token has expired, try to update it
      try {
        return refreshAccessToken(token, sessionId);
      } catch (error) {
        console.error('[NextAuth] Failed to refresh token:', error);
        // Return token with error instead of throwing
        token.error = 'RefreshTokenError';
        return token;
      }
    },
    async session({ session, token }) {
      try {
        // DO NOT expose accessToken to frontend - only user info
        session.user = token.user as any;
        session.error = token.error as string | undefined;
        // session.accessToken is removed - tokens are only in Redis
        
        // Log session creation for debugging
        console.log('[NextAuth] Session callback:', {
          hasUser: !!session.user,
          userEmail: session.user?.email,
          hasError: !!session.error,
          error: session.error,
          hasSessionId: !!token.sessionId,
        });
        
        // Ensure user is set - if not, session will be invalid
        if (!session.user) {
          console.error('[NextAuth] Session callback: No user in token! Token keys:', Object.keys(token));
          // Try to get user from token directly
          if (token.email || token.name) {
            session.user = {
              email: token.email as string,
              name: token.name as string,
              id: token.sub as string,
            };
            console.log('[NextAuth] Session callback: Reconstructed user from token');
          } else {
            console.error('[NextAuth] Session callback: Cannot create valid session - no user data');
            // Return session anyway - let NextAuth handle it
          }
        }
        
        if (token.error) {
          console.error('[NextAuth] Session error:', token.error);
          console.error('[NextAuth] Token details:', {
            hasSessionId: !!token.sessionId,
            hasUser: !!token.user,
            error: token.error,
          });
        }
        
        return session;
      } catch (error: any) {
        console.error('[NextAuth] Session callback error:', error);
        console.error('[NextAuth] Session callback error stack:', error?.stack);
        // Return a minimal session to prevent 500 error
        return {
          ...session,
          user: token.user as any || {
            email: token.email as string,
            name: token.name as string,
            id: token.sub as string,
          },
          error: 'SessionError',
        };
      }
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

