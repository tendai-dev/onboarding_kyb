import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getTokenSession, storeTokenSession } from '@/lib/redis-session';

// All services are now consolidated into the unified onboarding-api
const UNIFIED_API_TARGET = process.env.PROXY_TARGET || process.env.ONBOARDING_TARGET || 'http://localhost:8001';
const AUTH_TARGET = process.env.PROXY_TARGET_AUTH || process.env.AUTH_TARGET || 'http://localhost:8090';

function resolveUpstream(pathname: string, search: string) {
  // All services are now consolidated into the unified onboarding-api
  // Route /api/users/* to authentication service (if separate)
  // Everything else goes to unified API
  const afterProxy = pathname.split('/api/proxy')[1] || '';

  // Route /api/users/* to authentication service (if still separate)
  if (afterProxy.startsWith('/api/users')) {
    return `${AUTH_TARGET}${afterProxy}${search}`;
  }

  // All other routes go to unified onboarding-api
  return `${UNIFIED_API_TARGET}${afterProxy}${search}`;
}

async function forward(req: NextRequest) {
  const url = resolveUpstream(req.nextUrl.pathname, req.nextUrl.search);
  
  // Debug logging for messaging endpoints
  if (req.nextUrl.pathname.includes('/messages')) {
    console.log(`[Proxy] Messaging request - routing to: ${url}`);
    const userHeaders = ['X-User-Id', 'X-User-Email', 'X-User-Name', 'X-User-Role'];
    const headerValues: Record<string, string> = {};
    for (const headerName of userHeaders) {
      const value = req.headers.get(headerName) || req.headers.get(headerName.toLowerCase());
      if (value) headerValues[headerName] = value;
    }
    console.log(`[Proxy] User headers received:`, headerValues);
  }
  
  // Debug logging for document uploads
  if (req.nextUrl.pathname.includes('/documents/upload')) {
    console.log(`[Proxy] Document upload request - routing to: ${url}`);
  }

  const headers: Record<string, string> = {};
  
  // Get NextAuth session token from httpOnly cookie (BFF pattern)
  // sessionId is stored in JWT cookie, never exposed to client-side JS
  let accessToken: string | null = null;
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.sessionId) {
      // Fetch tokens from Redis using sessionId from httpOnly JWT cookie
      const tokenSession = await getTokenSession(token.sessionId as string);
      if (tokenSession) {
        // Check if token needs refresh (within 60 seconds of expiry)
        const needsRefresh = !tokenSession.accessTokenExpiryTime || 
                            Date.now() >= tokenSession.accessTokenExpiryTime - 60 * 1000;
        
        if (needsRefresh && tokenSession.refreshToken) {
          // Token expired or expiring soon - refresh it automatically
          try {
            const tokenUrl = process.env.KEYCLOAK_TOKEN_URL || 
                           'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru/protocol/openid-connect/token';
            
            const refreshResponse = await fetch(tokenUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID || 'kyb-connect-portal',
                grant_type: 'refresh_token',
                refresh_token: tokenSession.refreshToken,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET || '',
              }),
            });

            if (refreshResponse.ok) {
              const refreshedTokens = await refreshResponse.json();
              const newAccessToken = refreshedTokens.access_token;
              const newRefreshToken = refreshedTokens.refresh_token ?? tokenSession.refreshToken;
              const newExpiryTime = Date.now() + (refreshedTokens.expires_in * 1000);

              // Update Redis with new tokens
              await storeTokenSession(token.sessionId, {
                ...tokenSession,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                accessTokenExpiryTime: newExpiryTime,
              });

              accessToken = newAccessToken;
            } else {
              // Refresh failed - use existing token and let backend handle 401
              accessToken = tokenSession.accessToken;
            }
          } catch (refreshError) {
            // Refresh failed - use existing token
            console.warn('[Proxy] Token refresh failed:', refreshError);
            accessToken = tokenSession.accessToken;
          }
        } else {
          // Token still valid
          accessToken = tokenSession.accessToken;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get token from session:', error);
    // Continue without token - backend will return 401 if auth required
  }
  
  // Inject Authorization header from Redis-stored token (do NOT forward from client)
  if (accessToken) {
    headers['authorization'] = `Bearer ${accessToken}`;
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const contentType = req.headers.get('content-type') || req.headers.get('Content-Type');
  if (contentType) {
    headers['content-type'] = contentType;
    headers['Content-Type'] = contentType;
  } else {
    // Only set default JSON content-type if not multipart/form-data
    if (!contentType?.includes('multipart/form-data')) {
      headers['content-type'] = 'application/json';
      headers['Content-Type'] = 'application/json';
    }
  }

  // Forward user identification headers to backend services
  const userHeaders = ['X-User-Id', 'X-User-Email', 'X-User-Name', 'X-User-Role'];
  for (const headerName of userHeaders) {
    const value = req.headers.get(headerName) || req.headers.get(headerName.toLowerCase());
    if (value) {
      headers[headerName] = value;
      headers[headerName.toLowerCase()] = value; // Also set lowercase for compatibility
    }
  }

  // Forward schema-driven form headers (CRITICAL for dynamic validation)
  const schemaHeaders = ['X-Entity-Type', 'X-Form-Config-Id', 'X-Form-Version'];
  for (const headerName of schemaHeaders) {
    const value = req.headers.get(headerName) || req.headers.get(headerName.toLowerCase());
    if (value) {
      headers[headerName] = value;
      headers[headerName.toLowerCase()] = value; // Also set lowercase for compatibility
      console.log(`[Proxy] Forwarding ${headerName}: ${value}`);
    }
  }

  // Add additional headers for better debugging
  headers['user-agent'] = 'NextJS-Proxy/1.0';

  // Handle request body
  let body: BodyInit | undefined;
  if (['GET', 'HEAD'].includes(req.method)) {
    body = undefined;
  } else if (contentType?.includes('multipart/form-data')) {
    // For file uploads, parse FormData and reconstruct it
    // This preserves the multipart structure that the backend expects
    const formData = await req.formData();
    body = formData;
    // Remove Content-Type header - fetch will set it with the correct boundary
    delete headers['content-type'];
    delete headers['Content-Type'];
  } else {
    // For JSON and other text-based content, read as text
    body = await req.text();
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    body,
    redirect: 'manual'
  };

  try {
    const res = await fetch(url, init);
    const body = await res.arrayBuffer();

    // Log 500 errors for debugging
    if (res.status === 500) {
      const errorBody = new TextDecoder().decode(body);
      console.error(`[Proxy] Backend 500 error for ${url}:`, errorBody);
      console.error(`[Proxy] Request headers sent:`, Object.keys(headers).map(k => `${k}: ${headers[k]?.substring(0, 50)}`));
    }

    const respHeaders = new Headers();
    res.headers.forEach((v, k) => respHeaders.set(k, v));
    // ensure CORS for browser even though this is same-origin
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role, X-Entity-Type, X-Form-Config-Id, X-Form-Version, X-Request-Id');

    return new NextResponse(body, { status: res.status, headers: respHeaders });
  } catch (error) {
    console.error('[Proxy] Error:', error, 'URL:', url);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If it's a connection error, provide more helpful message
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      console.error(`[Proxy] Connection failed to ${url} - service may not be running`);
      return new NextResponse(JSON.stringify({ 
        error: 'Backend service unavailable', 
        details: `Cannot connect to ${url}. Please ensure the backend service is running.`,
        originalError: errorMessage
      }), { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new NextResponse(JSON.stringify({ error: 'Proxy request failed', details: errorMessage }), { 
      status: 502, 
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
