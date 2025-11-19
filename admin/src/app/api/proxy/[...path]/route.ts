import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getTokenSession, updateAccessToken, storeTokenSession } from '@/lib/redis-session';
import { reportApiError } from '@/lib/sentry';

const DEFAULT_TARGET = process.env.PROXY_TARGET || 'http://localhost:8090';
const MESSAGING_TARGET = process.env.PROXY_TARGET_MESSAGING || process.env.MESSAGING_TARGET || 'http://localhost:8087';
const PROJECTIONS_TARGET = process.env.PROXY_TARGET_PROJECTIONS || process.env.PROJECTIONS_TARGET || 'http://localhost:8007';
const ONBOARDING_TARGET = process.env.PROXY_TARGET_ONBOARDING || process.env.ONBOARDING_TARGET || 'http://localhost:8081';
const AUTH_TARGET = process.env.PROXY_TARGET_AUTH || process.env.AUTH_TARGET || 'http://localhost:8090';
const DOCUMENT_TARGET = process.env.PROXY_TARGET_DOCUMENT || process.env.DOCUMENT_TARGET || 'http://localhost:8008';
const RISK_TARGET = process.env.RISK_API_BASE_URL || process.env.NEXT_PUBLIC_RISK_API_BASE_URL || 'http://127.0.0.1:8006';
const WORK_QUEUE_TARGET = process.env.WORK_QUEUE_API_BASE_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:8000';
const CHECKLIST_TARGET = process.env.CHECKLIST_API_BASE_URL || process.env.NEXT_PUBLIC_CHECKLIST_API_BASE_URL || 'http://127.0.0.1:8086';
const ENTITY_CONFIG_TARGET = process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || process.env.ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8003';

function resolveUpstream(pathname: string, search: string) {
  // Supports service-specific proxying by prefixing the path after /api/proxy
  // Examples:
  //  - /api/proxy/messaging/api/v1/messages -> PROXY_TARGET_MESSAGING
  //  - /api/proxy/projections/api/v1/* -> PROXY_TARGET_PROJECTIONS
  //  - /api/proxy/... -> DEFAULT_TARGET
  const afterProxy = pathname.split('/api/proxy')[1] || '';

  if (afterProxy.startsWith('/messaging')) {
    const trimmed = afterProxy.replace('/messaging', '');
    return `${MESSAGING_TARGET}${trimmed}${search}`;
  }

  if (afterProxy.startsWith('/projections/v1')) {
    const trimmed = afterProxy.replace('/projections/v1', '');
    return `${PROJECTIONS_TARGET}${trimmed}${search}`;
  }
  
  if (afterProxy.startsWith('/projections')) {
    const trimmed = afterProxy.replace('/projections', '');
    return `${PROJECTIONS_TARGET}${trimmed}${search}`;
  }

  // Route /api/users/* to authentication service
  if (afterProxy.startsWith('/api/users')) {
    return `${AUTH_TARGET}${afterProxy}${search}`;
  }

  // Route /api/v1/cases/* to onboarding API
  if (afterProxy.startsWith('/api/v1/cases')) {
    return `${ONBOARDING_TARGET}${afterProxy}${search}`;
  }

  // Route /api/v1/sync to projections API (for syncing cases)
  if (afterProxy.startsWith('/api/v1/sync')) {
    return `${PROJECTIONS_TARGET}${afterProxy}${search}`;
  }

  // Route /api/v1/documents/* to document service
  if (afterProxy.startsWith('/api/v1/documents')) {
    return `${DOCUMENT_TARGET}${afterProxy}${search}`;
  }

  // Route /api/v1/dashboard to projections API
  if (afterProxy.startsWith('/api/v1/dashboard')) {
    return `${PROJECTIONS_TARGET}${afterProxy}${search}`;
  }

  // Route /api/v1/risk-assessments to risk service
  if (afterProxy.startsWith('/api/v1/risk-assessments') || afterProxy.startsWith('/risk-assessments')) {
    const riskPath = afterProxy.replace('/api/v1', '');
    return `${RISK_TARGET}/api/v1${riskPath}${search}`;
  }

  // Route /api/workqueue to work queue service
  if (afterProxy.startsWith('/api/workqueue') || afterProxy.startsWith('/workqueue')) {
    const workQueuePath = afterProxy.replace('/api/workqueue', '/api/workqueue').replace('/workqueue', '/api/workqueue');
    return `${WORK_QUEUE_TARGET}${workQueuePath}${search}`;
  }

  // Route /api/v1/workqueue to work queue service
  if (afterProxy.startsWith('/api/v1/workqueue')) {
    return `${WORK_QUEUE_TARGET}${afterProxy}${search}`;
  }

  // Route /api/v1/checklists to checklist service
  if (afterProxy.startsWith('/api/v1/checklists') || afterProxy.startsWith('/checklists')) {
    const checklistPath = afterProxy.replace('/api/v1', '');
    return `${CHECKLIST_TARGET}/api/v1${checklistPath}${search}`;
  }

  // Route /api/v1/entitytypes, /api/v1/requirements, /api/v1/wizardconfigurations, /api/v1/roles, /api/v1/permissions to entity config service
  if (afterProxy.startsWith('/api/v1/entitytypes') || 
      afterProxy.startsWith('/api/v1/requirements') || 
      afterProxy.startsWith('/api/v1/wizardconfigurations') ||
      afterProxy.startsWith('/api/v1/roles') ||
      afterProxy.startsWith('/api/v1/permissions') ||
      afterProxy.startsWith('/api/v1/users')) {
    return `${ENTITY_CONFIG_TARGET}${afterProxy}${search}`;
  }

  return `${DEFAULT_TARGET}${afterProxy}${search}`;
}

async function forward(req: NextRequest) {
  const url = resolveUpstream(req.nextUrl.pathname, req.nextUrl.search);

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
                refresh_token: tokenSession.refreshToken,
                client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
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
            reportApiError(refreshError, {
              endpoint: url,
              method: req.method,
            }, {
              tags: { error_type: 'proxy_token_refresh' },
            });
            accessToken = tokenSession.accessToken;
          }
        } else {
          // Token still valid
          accessToken = tokenSession.accessToken;
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
    
    // If it's a connection error, provide more helpful message
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
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

