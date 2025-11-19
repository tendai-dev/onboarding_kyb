import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check NextAuth and Keycloak configuration
 * Access at: /api/auth/debug
 */
export async function GET(req: NextRequest) {
  const config = {
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? '***SET***' : 'MISSING',
    keycloakIssuer: process.env.KEYCLOAK_ISSUER,
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET ? '***SET***' : 'MISSING/EMPTY',
    keycloakWellKnown: process.env.KEYCLOAK_WELL_KNOWN,
    expectedRedirectUri: process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/keycloak`
      : 'MISSING NEXTAUTH_URL',
    redisUrl: process.env.REDIS_URL ? '***SET***' : 'MISSING',
  };

  // Try to fetch Keycloak well-known config
  let keycloakConfig: any = null;
  let keycloakError: string | null = null;
  
  if (config.keycloakIssuer) {
    try {
      const wellKnownUrl = config.keycloakWellKnown || `${config.keycloakIssuer}/.well-known/openid-configuration`;
      const response = await fetch(wellKnownUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        keycloakConfig = await response.json();
      } else {
        keycloakError = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error: any) {
      keycloakError = error.message || 'Failed to fetch Keycloak config';
    }
  }

  return NextResponse.json({
    config,
    keycloak: {
      reachable: keycloakConfig !== null,
      error: keycloakError,
      authorizationEndpoint: keycloakConfig?.authorization_endpoint,
      tokenEndpoint: keycloakConfig?.token_endpoint,
    },
    diagnostics: {
      issues: [
        !config.nextAuthUrl && 'NEXTAUTH_URL is missing',
        !process.env.NEXTAUTH_SECRET && 'NEXTAUTH_SECRET is missing',
        !config.keycloakIssuer && 'KEYCLOAK_ISSUER is missing',
        !config.keycloakClientId && 'KEYCLOAK_CLIENT_ID is missing',
        !keycloakConfig && 'Cannot reach Keycloak server',
      ].filter(Boolean),
      redirectUriCheck: {
        expected: config.expectedRedirectUri,
        note: 'This URI must be registered in Keycloak client "Valid Redirect URIs"',
      },
    },
  }, { status: 200 });
}

