import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { deleteTokenSession } from '@/lib/redis-session';
import { reportError } from '@/lib/sentry';
import { logger } from '@/lib/logger';

/**
 * Logout API route
 * Clears the Redis session token when user logs out
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session token from the request
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // If we have a sessionId, delete it from Redis
    if (token?.sessionId) {
      try {
        await deleteTokenSession(token.sessionId as string);
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[Logout] Cleared Redis session', { sessionId: token.sessionId });
        }
      } catch (error) {
        reportError(error, {
          tags: { error_type: 'logout', operation: 'delete_token_session' },
          extra: { sessionId: token.sessionId },
          level: 'warning',
        });
        // Continue anyway - session will expire naturally
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    reportError(error, {
      tags: { error_type: 'logout', operation: 'logout_api' },
      level: 'error',
    });
    // Still return success to allow logout to proceed
    return NextResponse.json({ 
      success: true,
      message: 'Logged out (session cleanup may have failed)' 
    }, { status: 200 });
  }
}

