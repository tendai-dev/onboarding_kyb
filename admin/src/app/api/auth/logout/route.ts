import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { reportError } from '@/lib/sentry';
import { logger } from '@/lib/logger';

/**
 * Logout API route
 * NextAuth handles session deletion via adapter when user signs out
 * This route is mainly for logging and ensuring proper cleanup
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session from the request
    const session = await auth();
    
    // Log logout for debugging
    if (process.env.NODE_ENV === 'development' && session?.user) {
      logger.debug('[Logout] User logging out', { 
        userId: session.user.id,
        userEmail: session.user.email 
      });
    }
    
    // NextAuth handles session deletion via adapter when signOut is called
    // No manual cleanup needed - adapter.deleteSession() is called automatically
    
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

