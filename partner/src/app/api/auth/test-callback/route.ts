import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Test endpoint to check if NextAuth callback is working
 * This helps diagnose Callback errors
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    return NextResponse.json({
      success: true,
      hasToken: !!token,
      tokenInfo: token ? {
        hasSessionId: !!token.sessionId,
        hasUser: !!token.user,
        hasError: !!token.error,
        error: token.error,
      } : null,
      config: {
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        keycloakIssuer: process.env.KEYCLOAK_ISSUER,
        keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
        hasClientSecret: !!process.env.KEYCLOAK_CLIENT_SECRET,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

