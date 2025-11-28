import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAccountTokensFromNextAuth, updateNextAuthAccountTokens } from '@/lib/redis-session';
import { reportApiError } from '@/lib/sentry';

// All services are now consolidated into the unified onboarding-api
const UNIFIED_API_TARGET = process.env.PROXY_TARGET || process.env.ONBOARDING_TARGET || 'http://localhost:8001';
const AUTH_TARGET = process.env.PROXY_TARGET_AUTH || process.env.AUTH_TARGET || 'http://localhost:8090';
const ENTITY_CONFIG_TARGET = process.env.ENTITY_CONFIG_TARGET || process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8003';

function resolveUpstream(pathname: string, search: string) {
  // All services are now consolidated into the unified onboarding-api
  // Route /api/users/* to authentication service (if separate)
  // Route entity config endpoints to entity configuration service
  // Everything else goes to unified API
  const afterProxy = pathname.split('/api/proxy')[1] || '';

  // Route /api/users/* and /api/v1/users/* to unified API
  // Authentication service may not be running, so route to unified API
  if (afterProxy.startsWith('/api/users') || afterProxy.startsWith('/api/v1/users')) {
    // Convert /api/users to /api/v1/users for unified API
    let unifiedPath = afterProxy;
    if (afterProxy.startsWith('/api/users')) {
      unifiedPath = afterProxy.replace('/api/users', '/api/v1/users');
    }
    return `${UNIFIED_API_TARGET}${unifiedPath}${search}`;
  }

  // Route /api/roles and /api/v1/roles to unified API
  // Authentication service may not be running, so route to unified API
  if (afterProxy.startsWith('/api/roles') || afterProxy.startsWith('/api/v1/roles')) {
    // Convert /api/roles to /api/v1/roles for unified API
    let unifiedPath = afterProxy;
    if (afterProxy.startsWith('/api/roles')) {
      unifiedPath = afterProxy.replace('/api/roles', '/api/v1/roles');
    }
    return `${UNIFIED_API_TARGET}${unifiedPath}${search}`;
  }

  // Route checklists endpoints to unified API
  if (afterProxy.startsWith('/api/v1/checklists')) {
    return `${UNIFIED_API_TARGET}${afterProxy}${search}`;
  }

  // Route entity configuration endpoints
  // Wizard configurations are in the unified API (8001), others go to entity config service (8003)
  if (afterProxy.startsWith('/api/v1/wizardconfigurations')) {
    // Wizard configurations are in the unified onboarding-api
    return `${UNIFIED_API_TARGET}${afterProxy}${search}`;
  }
  
  // Route other entity config endpoints to entity config service
  // These include: /api/v1/entity-types, /api/v1/requirements, /api/v1/permissions
  // NOTE: If entity config service (8003) is not running, route to unified API as fallback
  if (afterProxy.startsWith('/api/v1/entity-types') || 
      afterProxy.startsWith('/api/v1/requirements') ||
      afterProxy.startsWith('/api/v1/permissions')) {
    // Try entity config service first, but fallback to unified API if service unavailable
    // This allows graceful degradation when entity config service is down
    return `${ENTITY_CONFIG_TARGET}${afterProxy}${search}`;
  }

  // All other routes go to unified onboarding-api
  return `${UNIFIED_API_TARGET}${afterProxy}${search}`;
}

async function forward(req: NextRequest) {
  const url = resolveUpstream(req.nextUrl.pathname, req.nextUrl.search);

  const headers: Record<string, string> = {};
  
  // Get NextAuth session from opaque session token in httpOnly cookie (BFF pattern)
  // NextAuth manages sessions via adapter - no custom sessionId needed
  let accessToken: string | null = null;
  try {
    const session = await auth();
    if (session?.user?.id) {
      // Fetch tokens from NextAuth Account storage via adapter
      const accountTokens = await getAccountTokensFromNextAuth(session.user.id, 'azure-ad');
      if (accountTokens) {
        // Check if token needs refresh (within 60 seconds of expiry)
        const needsRefresh = !accountTokens.accessTokenExpiryTime || 
                            Date.now() >= accountTokens.accessTokenExpiryTime - 60 * 1000;
        
        if (needsRefresh && accountTokens.refreshToken) {
          // Token expired or expiring soon - refresh it automatically
          try {
            const issuer = process.env.NEXT_PUBLIC_AZURE_AD_ISSUER || 
                          `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`;
            
            const refreshResponse = await fetch(`${issuer}/oauth2/v2.0/token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: process.env.AZURE_AD_CLIENT_ID!,
                grant_type: 'refresh_token',
                refresh_token: accountTokens.refreshToken,
                client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
              }),
            });

            if (refreshResponse.ok) {
              const refreshedTokens = await refreshResponse.json();
              const newAccessToken = refreshedTokens.access_token;
              const newRefreshToken = refreshedTokens.refresh_token ?? accountTokens.refreshToken;
              const newExpiryTime = Date.now() + (refreshedTokens.expires_in * 1000);

              // Update NextAuth Account in Redis via adapter
              await updateNextAuthAccountTokens(
                session.user.id,
                'azure-ad',
                newAccessToken,
                newRefreshToken,
                newExpiryTime
              );

              accessToken = newAccessToken;
            } else {
              // Refresh failed - use existing token and let backend handle 401
              accessToken = accountTokens.accessToken;
            }
          } catch (refreshError) {
            // Refresh failed - use existing token
            reportApiError(refreshError, {
              endpoint: url,
              method: req.method,
            }, {
              tags: { error_type: 'proxy_token_refresh' },
            });
            accessToken = accountTokens.accessToken;
          }
        } else {
          // Token still valid
          accessToken = accountTokens.accessToken;
        }
      }
    }
  } catch (error) {
    reportApiError(error, {
      endpoint: url,
      method: req.method,
    }, {
      tags: { error_type: 'proxy_token_retrieval' },
    });
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
    headers['content-type'] = 'application/json';
    headers['Content-Type'] = 'application/json';
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

  // Add additional headers for better debugging
  headers['user-agent'] = 'NextJS-Proxy/1.0';

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ['GET','HEAD'].includes(req.method) ? undefined : await req.text(),
    redirect: 'manual'
  };

  try {
    const res = await fetch(url, init);
    const body = await res.arrayBuffer();

    const respHeaders = new Headers();
    res.headers.forEach((v, k) => respHeaders.set(k, v));
    // ensure CORS for browser even though this is same-origin
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role');

    return new NextResponse(body, { status: res.status, headers: respHeaders });
  } catch (error) {
    reportApiError(error, {
      endpoint: url,
      method: req.method,
    }, {
      tags: { error_type: 'proxy_request' },
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If it's a connection error, try fallback for entity config endpoints or auth service
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      const afterProxy = req.nextUrl.pathname.split('/api/proxy')[1] || '';
      
      // If authentication service is down and this is a roles/users endpoint, try unified API as fallback
      if (url.includes(AUTH_TARGET) && 
          (afterProxy.startsWith('/api/roles') || 
           afterProxy.startsWith('/api/v1/roles') ||
           afterProxy.startsWith('/api/users') ||
           afterProxy.startsWith('/api/v1/users'))) {
        // Fallback to unified API - convert /api/roles to /api/v1/roles if needed
        let fallbackPath = afterProxy;
        if (afterProxy.startsWith('/api/roles')) {
          fallbackPath = afterProxy.replace('/api/roles', '/api/v1/roles');
        } else if (afterProxy.startsWith('/api/users')) {
          fallbackPath = afterProxy.replace('/api/users', '/api/v1/users');
        }
        const fallbackUrl = `${UNIFIED_API_TARGET}${fallbackPath}${req.nextUrl.search}`;
        try {
          const fallbackRes = await fetch(fallbackUrl, init);
          const fallbackBody = await fallbackRes.arrayBuffer();
          const fallbackHeaders = new Headers();
          fallbackRes.headers.forEach((v, k) => fallbackHeaders.set(k, v));
          fallbackHeaders.set('Access-Control-Allow-Origin', '*');
          fallbackHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
          fallbackHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role');
          return new NextResponse(fallbackBody, { status: fallbackRes.status, headers: fallbackHeaders });
        } catch (fallbackError) {
          // Both services failed - return helpful error
          return new NextResponse(JSON.stringify({ 
            error: 'Backend service unavailable', 
            details: `Authentication Service (${AUTH_TARGET}) is not running. Please start the authentication service on port 8090, or ensure the Unified API (${UNIFIED_API_TARGET}) has the roles/users endpoints.`,
            originalError: errorMessage,
            attemptedFallback: fallbackUrl
          }), { 
            status: 503, 
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // If entity config service is down and this is an entity config endpoint, try unified API as fallback
      if (url.includes(ENTITY_CONFIG_TARGET) && 
          (afterProxy.startsWith('/api/v1/requirements') || 
           afterProxy.startsWith('/api/v1/entity-types') ||
           afterProxy.startsWith('/api/v1/permissions'))) {
        // Fallback to unified API
        const fallbackUrl = `${UNIFIED_API_TARGET}${afterProxy}${req.nextUrl.search}`;
        try {
          const fallbackRes = await fetch(fallbackUrl, init);
          const fallbackBody = await fallbackRes.arrayBuffer();
          const fallbackHeaders = new Headers();
          fallbackRes.headers.forEach((v, k) => fallbackHeaders.set(k, v));
          fallbackHeaders.set('Access-Control-Allow-Origin', '*');
          fallbackHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
          fallbackHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role');
          return new NextResponse(fallbackBody, { status: fallbackRes.status, headers: fallbackHeaders });
        } catch (fallbackError) {
          // Both services failed - return helpful error
          return new NextResponse(JSON.stringify({ 
            error: 'Backend service unavailable', 
            details: `Entity Configuration Service (${ENTITY_CONFIG_TARGET}) is not running. Please start the service on port 8003, or ensure the Unified API (${UNIFIED_API_TARGET}) has the requirements endpoint.`,
            originalError: errorMessage,
            attemptedFallback: fallbackUrl
          }), { 
            status: 503, 
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
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

