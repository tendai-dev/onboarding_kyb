import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import NextAuth from 'next-auth';

/**
 * Diagnostic endpoint to test NextAuth callback processing
 * This helps identify the exact error causing the "Callback" failure
 */
export async function GET(request: NextRequest) {
  const diagnostic: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    url: request.url,
    pathname: request.nextUrl.pathname,
    searchParams: Object.fromEntries(request.nextUrl.searchParams),
  };

  try {
    // Check environment variables
    diagnostic.env = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
      hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'MISSING',
      KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER || 'MISSING',
      hasKEYCLOAK_CLIENT_SECRET: !!process.env.KEYCLOAK_CLIENT_SECRET,
      REDIS_URL: process.env.REDIS_URL ? 'SET' : 'MISSING',
    };

    // Check if this looks like a callback request
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const error = request.nextUrl.searchParams.get('error');
    
    diagnostic.callbackParams = {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      error: error || null,
    };

    // Try to process with NextAuth handler
    if (code && state) {
      try {
        const handler = NextAuth(authOptions);
        const mockContext = {
          params: { nextauth: ['callback', 'keycloak'] },
        };
        
        // This will help us see if NextAuth can process it
        const response = await handler(request, mockContext);
        
        diagnostic.nextAuthTest = {
          attempting: 'Processing callback with NextAuth handler',
          result: {
            success: true,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          },
        };
      } catch (nextAuthError) {
        diagnostic.nextAuthTest = {
          result: {
            success: false,
            error: nextAuthError instanceof Error ? nextAuthError.message : String(nextAuthError),
            stack: nextAuthError instanceof Error ? nextAuthError.stack : undefined,
          },
        };
      }
    }

    // Check Redis connection
    try {
      const { getRedisClient } = await import('@/lib/redis-session');
      const client = await getRedisClient();
      await client.ping();
      diagnostic.redis = { connected: true };
    } catch (redisError) {
      diagnostic.redis = {
        connected: false,
        error: redisError instanceof Error ? redisError.message : String(redisError),
      };
    }

    // Expected redirect URI
    const expectedRedirectUri = process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/keycloak`
      : 'MISSING NEXTAUTH_URL';
    
    diagnostic.expectedRedirectUri = expectedRedirectUri;
    diagnostic.actualCallbackUrl = request.url;

    return NextResponse.json(diagnostic, { status: 200 });
  } catch (error) {
    diagnostic.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    return NextResponse.json(diagnostic, { status: 500 });
  }
}

