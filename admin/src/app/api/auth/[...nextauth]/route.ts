import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// NextAuth v5 beta - handler returns route handlers
const { handlers } = NextAuth(authOptions);

// Wrap handlers with error logging
const GET = async (req: NextRequest) => {
  try {
    return await handlers.GET(req);
  } catch (error: any) {
    logger.error(error, '[NextAuth] GET handler error', {
      tags: { error_type: 'nextauth_handler_error' },
      extra: {
        url: req.url,
      }
    });
    // Re-throw to let NextAuth handle the error response
    throw error;
  }
};

const POST = async (req: NextRequest) => {
  try {
    return await handlers.POST(req);
  } catch (error: any) {
    logger.error(error, '[NextAuth] POST handler error', {
      tags: { error_type: 'nextauth_handler_error' },
      extra: {
        url: req.url,
      }
    });
    // Re-throw to let NextAuth handle the error response
    throw error;
  }
};

export { GET, POST };
