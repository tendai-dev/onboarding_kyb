import { getToken } from 'next-auth/jwt';
import { getTokenSession } from './redis-session';
import { NextRequest } from 'next/server';
import { reportError } from './sentry';

/**
 * Get access token from Redis for server-side API routes
 * This replaces direct access to session.accessToken
 */
export async function getServerAccessToken(req?: NextRequest): Promise<string | null> {
  try {
    const token = await getToken({ 
      req: req as any, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (token?.sessionId) {
      const tokenSession = await getTokenSession(token.sessionId as string);
      if (tokenSession) {
        // Check if token needs refresh (within 60 seconds of expiry)
        if (tokenSession.accessTokenExpiryTime && Date.now() < tokenSession.accessTokenExpiryTime - 60 * 1000) {
          return tokenSession.accessToken;
        } else {
          // Token expired or expiring soon - return it anyway, let backend handle 401
          return tokenSession.accessToken;
        }
      }
    }
  } catch (error) {
    reportError(error, {
      tags: { error_type: 'token_retrieval', operation: 'get_server_access_token' },
      level: 'warning',
    });
  }
  
  return null;
}

