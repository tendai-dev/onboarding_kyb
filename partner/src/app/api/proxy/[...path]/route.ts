import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getTokenSession } from '@/lib/redis-session';

const DEFAULT_TARGET = process.env.PROXY_TARGET || 'http://localhost:8090';
const MESSAGING_TARGET = process.env.PROXY_TARGET_MESSAGING || process.env.MESSAGING_TARGET || 'http://localhost:8087';
const PROJECTIONS_TARGET = process.env.PROXY_TARGET_PROJECTIONS || process.env.PROJECTIONS_TARGET || 'http://localhost:8007';
const ONBOARDING_TARGET = process.env.PROXY_TARGET_ONBOARDING || process.env.ONBOARDING_TARGET || 'http://localhost:8001';
const DOCUMENT_TARGET = process.env.PROXY_TARGET_DOCUMENT || process.env.DOCUMENT_TARGET || 'http://localhost:8008';
const AUTH_TARGET = process.env.PROXY_TARGET_AUTH || process.env.AUTH_TARGET || 'http://localhost:8090';

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

  // Route /api/v1/documents/* to document service
  if (afterProxy.startsWith('/api/v1/documents')) {
    return `${DOCUMENT_TARGET}${afterProxy}${search}`;
  }

  // Route /api/v1/sync to projections API (for syncing cases)
  if (afterProxy.startsWith('/api/v1/sync')) {
    return `${PROJECTIONS_TARGET}${afterProxy}${search}`;
  }

  return `${DEFAULT_TARGET}${afterProxy}${search}`;
}

async function forward(req: NextRequest) {
  const url = resolveUpstream(req.nextUrl.pathname, req.nextUrl.search);
  
  // Debug logging for document uploads
  if (req.nextUrl.pathname.includes('/documents/upload')) {
    console.log(`[Proxy] Document upload request - routing to: ${url}`);
  }

  const headers: Record<string, string> = {};
  
  // Get NextAuth session token from cookie
  let accessToken: string | null = null;
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.sessionId) {
      // Fetch tokens from Redis using sessionId
      const tokenSession = await getTokenSession(token.sessionId as string);
      if (tokenSession) {
        // Check if token needs refresh (within 60 seconds of expiry)
        if (tokenSession.accessTokenExpiryTime && Date.now() < tokenSession.accessTokenExpiryTime - 60 * 1000) {
          accessToken = tokenSession.accessToken;
        } else {
          // Token expired or expiring soon - would need refresh logic here
          // For now, use the token anyway and let backend handle 401
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


