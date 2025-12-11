import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Test endpoint to check if NextAuth callback is working
 * This helps diagnose Callback errors
 * Updated to use database session strategy with auth()
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    return NextResponse.json({
      success: true,
      hasSession: !!session,
      sessionInfo: session
        ? {
            hasUser: !!session.user,
            userId: session.user?.id,
            userEmail: session.user?.email,
            userName: session.user?.name,
            hasError: !!session.error,
            error: session.error,
          }
        : null,
      config: {
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        keycloakIssuer: process.env.KEYCLOAK_ISSUER,
        keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
        hasClientSecret: !!process.env.KEYCLOAK_CLIENT_SECRET,
        sessionStrategy: 'database',
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
