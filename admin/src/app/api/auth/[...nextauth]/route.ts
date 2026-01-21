import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

// NextAuth v5 beta - handler returns route handlers
const { handlers } = NextAuth(authOptions);

// Wrap handlers with error logging and detailed diagnostics
const GET = async (req: NextRequest) => {
  try {
    // Log ALL auth requests for debugging
    const url = new URL(req.url);
    const isSession = url.pathname.includes('/session');
    const isCallback = url.pathname.includes('/callback/');
    const isSignIn = url.pathname.includes('/signin');
    
    console.log('[NextAuth GET] Request received', {
      pathname: url.pathname,
      isSession,
      isCallback,
      isSignIn,
      searchParams: Object.fromEntries(url.searchParams),
      host: req.headers.get('host'),
      timestamp: new Date().toISOString(),
    });

    if (isSession) {
      console.log('[NextAuth GET] Session check request');
    }
    
    if (isCallback) {
      logger.debug('[NextAuth] OAuth callback request', {
        pathname: url.pathname,
        searchParams: Object.fromEntries(url.searchParams),
        headers: {
          host: req.headers.get('host'),
          referer: req.headers.get('referer'),
          'user-agent': req.headers.get('user-agent'),
        },
      });
      console.log('[NextAuth GET] OAuth callback - full details', {
        url: req.url,
        searchParams: Object.fromEntries(url.searchParams),
      });
    }
    
    const response = await handlers.GET(req);
    
    if (isSession) {
      console.log('[NextAuth GET] Session response status:', response.status);
      // Log response body for session requests
      const clonedResponse = response.clone();
      try {
        const text = await clonedResponse.text();
        console.log('[NextAuth GET] Session response body:', text.substring(0, 200));
      } catch (e) {
        console.log('[NextAuth GET] Could not read session response body');
      }
    }
    
    return response;
  } catch (error: unknown) {
    const url = new URL(req.url);
    const errorDetails = {
      url: req.url,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      isCallback: url.pathname.includes('/callback/'),
    };

    console.error('[NextAuth GET] ERROR CAUGHT:', {
      ...errorDetails,
      errorName: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString(),
    });

    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      '[NextAuth] GET handler error',
      {
        tags: { error_type: 'nextauth_handler_error' },
        extra: errorDetails,
      }
    );
    
    // Re-throw to let NextAuth handle the error response
    throw error;
  }
};

const POST = async (req: NextRequest) => {
  try {
    // Log callback requests for debugging OAuth issues
    const url = new URL(req.url);
    if (url.pathname.includes('/callback/')) {
      logger.debug('[NextAuth] OAuth callback POST request', {
        pathname: url.pathname,
        searchParams: Object.fromEntries(url.searchParams),
        headers: {
          host: req.headers.get('host'),
          referer: req.headers.get('referer'),
        },
      });
    }
    
    return await handlers.POST(req);
  } catch (error: unknown) {
    const url = new URL(req.url);
    const errorDetails = {
      url: req.url,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      isCallback: url.pathname.includes('/callback/'),
    };

    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      '[NextAuth] POST handler error',
      {
        tags: { error_type: 'nextauth_handler_error' },
        extra: errorDetails,
      }
    );
    
    // Re-throw to let NextAuth handle the error response
    throw error;
  }
};

export { GET, POST };
