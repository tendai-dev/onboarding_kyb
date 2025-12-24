/* eslint-disable security/detect-object-injection */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getAccountTokensFromNextAuth,
  updateNextAuthAccountTokens,
} from '@/lib/redis-session';
import { reportApiError } from '@/lib/sentry';

// Use Node.js runtime for better fetch compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// All services are now consolidated into the unified onboarding-api
// Prioritize runtime env vars (PROXY_TARGET, ONBOARDING_TARGET) over build-time NEXT_PUBLIC_* vars
// This allows Docker containers to override the backend URL at runtime
const getBackendUrl = () => {
  // Check runtime env vars first (these can be set in Docker at runtime)
  // Then fall back to build-time NEXT_PUBLIC_* vars, then localhost
  return process.env.PROXY_TARGET || 
         process.env.ONBOARDING_TARGET ||
         process.env.NEXT_PUBLIC_GATEWAY_URL || 
         process.env.NEXT_PUBLIC_BACKEND_URL ||
         'http://localhost:8001';
};

const UNIFIED_API_TARGET = getBackendUrl();
const AUTH_TARGET =
  process.env.PROXY_TARGET_AUTH || process.env.AUTH_TARGET || 'http://localhost:8090';
const ENTITY_CONFIG_TARGET =
  process.env.ENTITY_CONFIG_TARGET ||
  process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL ||
  getBackendUrl();

/**
 * Sanitizes error messages to prevent token leakage
 * Removes access tokens, refresh tokens, authorization headers, and other sensitive data
 */
function sanitizeErrorText(text: string): string {
  if (!text || typeof text !== 'string') {
    return 'Unknown error';
  }

  let sanitized = text;

  // Remove Bearer tokens (Bearer <token>)
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+/gi, 'Bearer [REDACTED]');

  // Remove access_token and refresh_token from JSON responses
  sanitized = sanitized.replace(
    /"access_token"\s*:\s*"[^"]*"/gi,
    '"access_token":"[REDACTED]"'
  );
  sanitized = sanitized.replace(
    /"refresh_token"\s*:\s*"[^"]*"/gi,
    '"refresh_token":"[REDACTED]"'
  );
  sanitized = sanitized.replace(
    /"accessToken"\s*:\s*"[^"]*"/gi,
    '"accessToken":"[REDACTED]"'
  );
  sanitized = sanitized.replace(
    /"refreshToken"\s*:\s*"[^"]*"/gi,
    '"refreshToken":"[REDACTED]"'
  );

  // Remove authorization headers
  sanitized = sanitized.replace(
    /authorization\s*:\s*[^\n]*/gi,
    'authorization: [REDACTED]'
  );
  sanitized = sanitized.replace(
    /Authorization\s*:\s*[^\n]*/gi,
    'Authorization: [REDACTED]'
  );

  // Remove any long base64-like strings that might be tokens (40+ chars of base64)
  sanitized = sanitized.replace(/[A-Za-z0-9+/]{40,}={0,2}/g, '[REDACTED_TOKEN]');

  // Limit length to prevent excessive logging
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + '... [truncated]';
  }

  return sanitized;
}

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

  // Route SignalR hub FIRST - /messaging/messageHub -> /api/v1/messages/hub
  // This must come before the general messaging route to avoid incorrect path stripping
  if (afterProxy.startsWith('/messaging/messageHub')) {
    return `${UNIFIED_API_TARGET}/api/v1/messages/hub${search}`;
  }

  // Route messaging endpoints - strip /messaging prefix if present
  if (afterProxy.startsWith('/messaging/')) {
    // Remove /messaging prefix and route to unified API
    const messagingPath = afterProxy.replace('/messaging', '');
    return `${UNIFIED_API_TARGET}${messagingPath}${search}`;
  }

  // Route checklists endpoints to unified API
  if (afterProxy.startsWith('/api/v1/checklists')) {
    return `${UNIFIED_API_TARGET}${afterProxy}${search}`;
  }

  // Route entity configuration endpoints
  // All entity config endpoints are now in the unified API (8001)
  // This includes: wizardconfigurations, entity-types, requirements, permissions, country-configurations
  if (
    afterProxy.startsWith('/api/v1/wizardconfigurations') ||
    afterProxy.startsWith('/api/v1/entity-types') ||
    afterProxy.startsWith('/api/v1/requirements') ||
    afterProxy.startsWith('/api/v1/permissions') ||
    afterProxy.startsWith('/api/v1/country-configurations')
  ) {
    // All entity config endpoints are in the unified onboarding-api
    return `${UNIFIED_API_TARGET}${afterProxy}${search}`;
  }

  // All other routes go to unified onboarding-api
  return `${UNIFIED_API_TARGET}${afterProxy}${search}`;
}

async function forward(req: NextRequest) {
  const url = resolveUpstream(req.nextUrl.pathname, req.nextUrl.search);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Proxy] Forwarding request:', {
      originalPath: req.nextUrl.pathname,
      resolvedUrl: url,
      method: req.method,
    });
  }

  const headers: Record<string, string> = {};

  // Get NextAuth session from opaque session token in httpOnly cookie (BFF pattern)
  // NextAuth manages sessions via adapter - no custom sessionId needed
  let accessToken: string | null = null;
  let session: {
    user?: { id?: string; email?: string | null; name?: string | null; role?: string };
  } | null = null;
  try {
    session = await auth();
    if (session?.user?.id) {
      // Fetch tokens from NextAuth Account storage via adapter
      const accountTokens = await getAccountTokensFromNextAuth(
        session.user.id,
        'azure-ad'
      );
      if (accountTokens) {
        // Check if token needs refresh (within 60 seconds of expiry)
        const needsRefresh =
          !accountTokens.accessTokenExpiryTime ||
          Date.now() >= accountTokens.accessTokenExpiryTime - 60 * 1000;

        if (needsRefresh && accountTokens.refreshToken) {
          // Token expired or expiring soon - refresh it automatically
          try {
            const issuer =
              process.env.NEXT_PUBLIC_AZURE_AD_ISSUER ||
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
              // For Azure AD, use id_token (v2.0 issuer) instead of access_token (v1.0 issuer)
              const newIdToken = refreshedTokens.id_token;
              const newAccessToken = refreshedTokens.access_token;
              const newRefreshToken =
                refreshedTokens.refresh_token ?? accountTokens.refreshToken;
              const newExpiryTime = Date.now() + refreshedTokens.expires_in * 1000;

              // Update NextAuth Account in Redis via adapter
              await updateNextAuthAccountTokens(
                session.user.id,
                'azure-ad',
                newAccessToken,
                newRefreshToken,
                newExpiryTime,
                newIdToken
              );

              // Use id_token for Azure AD (has v2.0 issuer that backend expects)
              accessToken = newIdToken || newAccessToken;
              
              if (process.env.NODE_ENV === 'development') {
                console.log('[Proxy] Token refreshed successfully for user:', session.user.id);
              }
            } else {
              // Refresh failed - log the error for debugging
              const errorText = await refreshResponse.text().catch(() => 'Unknown error');
              console.error('[Proxy] Token refresh failed:', {
                status: refreshResponse.status,
                error: errorText.substring(0, 200),
                userId: session.user.id,
              });
              // Don't send expired token - backend will return 401
              accessToken = null;
            }
          } catch (refreshError) {
            // Refresh failed - log and don't use expired token
            console.error('[Proxy] Token refresh error:', refreshError instanceof Error ? refreshError.message : 'Unknown error');
            reportApiError(
              refreshError,
              {
                endpoint: url,
                method: req.method,
              },
              {
                tags: { error_type: 'proxy_token_refresh' },
              }
            );
            // Don't use expired token - it will fail anyway
            accessToken = null;
          }
        } else {
          // Token still valid
          accessToken = accountTokens.accessToken;
        }
      }
    }
  } catch (error) {
    reportApiError(
      error,
      {
        endpoint: url,
        method: req.method,
      },
      {
        tags: { error_type: 'proxy_token_retrieval' },
      }
    );
    // Continue without token - backend will return 401 if auth required
  }

  // Inject Authorization header from Redis-stored token (do NOT forward from client)
  if (accessToken) {
    headers['authorization'] = `Bearer ${accessToken}`;
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const contentType = req.headers.get('content-type') || req.headers.get('Content-Type');
  const isMultipartFormData = contentType?.includes('multipart/form-data');

  // Set Content-Type header (will be removed for multipart/form-data later)
  if (contentType) {
    headers['content-type'] = contentType;
    headers['Content-Type'] = contentType;
  } else {
    // Only set default content-type for non-multipart requests
    if (!isMultipartFormData) {
      headers['content-type'] = 'application/json';
      headers['Content-Type'] = 'application/json';
    }
    // For multipart/form-data without explicit content-type, fetch will set it automatically
  }

  // Set user identification headers from session (server-side)
  // These are required by the backend to identify the user
  // Use the session we already retrieved above
  if (session?.user) {
    try {
      // Set user email
      if (session.user.email && !headers['X-User-Email']) {
        headers['X-User-Email'] = session.user.email;
        headers['x-user-email'] = session.user.email;
      }

      // Set user name
      if (session.user.name && !headers['X-User-Name']) {
        headers['X-User-Name'] = session.user.name;
        headers['x-user-name'] = session.user.name;
      }

      // Set user ID - generate from email if not provided (matching backend's MD5-based UUID v3)
      if (!headers['X-User-Id'] && session.user.email) {
        // Generate consistent GUID from email (matching backend's UUID v3 algorithm)
        const email = session.user.email.toLowerCase();
        // Use MD5 hash to generate UUID v3 (matching backend implementation)
        const crypto = await import('crypto');
        const hash = crypto.createHash('md5').update(email, 'utf8').digest();
        // Set version 3 bits (bits 12-15 of time_hi_and_version to 0011)
        hash[6] = (hash[6] & 0x0f) | 0x30;
        // Set variant bits (bits 6-7 of clock_seq_hi_and_reserved to 10)
        hash[8] = (hash[8] & 0x3f) | 0x80;
        // Format as UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        const hex = Array.from(hash)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const formattedUserId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
        headers['X-User-Id'] = formattedUserId;
        headers['x-user-id'] = formattedUserId;
      } else if (session.user.id && !headers['X-User-Id']) {
        // Use session user ID if available
        headers['X-User-Id'] = session.user.id;
        headers['x-user-id'] = session.user.id;
      }

      // Set user role - default to Administrator for admin portal users
      // This is the admin portal, so all authenticated users should have admin access
      if (!headers['X-User-Role']) {
        const role = (session.user as { role?: string }).role || 'Administrator';
        headers['X-User-Role'] = role;
        headers['x-user-role'] = role;
      }
    } catch (error) {
      // If header setting fails, continue without user headers
      // Backend will handle missing headers appropriately
    }
  } else if (process.env.NODE_ENV === 'development') {
    // Development fallback: if no session, use default development headers
    // This allows testing without full authentication setup
    if (!headers['X-User-Email']) {
      headers['X-User-Email'] = 'admin@mukuru.com';
      headers['x-user-email'] = 'admin@mukuru.com';
    }
    if (!headers['X-User-Name']) {
      headers['X-User-Name'] = 'Admin User';
      headers['x-user-name'] = 'Admin User';
    }
    if (!headers['X-User-Role']) {
      headers['X-User-Role'] = 'Administrator';
      headers['x-user-role'] = 'Administrator';
    }
    if (!headers['X-User-Id']) {
      // Generate consistent GUID for admin user
      const email = 'admin@mukuru.com'.toLowerCase();
      const crypto = await import('crypto');
      const hash = crypto.createHash('md5').update(email, 'utf8').digest();
      hash[6] = (hash[6] & 0x0f) | 0x30;
      hash[8] = (hash[8] & 0x3f) | 0x80;
      const hex = Array.from(hash)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const formattedUserId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
      headers['X-User-Id'] = formattedUserId;
      headers['x-user-id'] = formattedUserId;
    }
  }

  // Also forward user identification headers from request (if client set them)
  // Client-set headers take precedence over server-set ones
  // This is especially important for SignalR which sends headers via withUrl options
  const userHeaders = [
    'X-User-Id',
    'X-User-Email',
    'X-User-Name',
    'X-User-Role',
  ] as const;
  for (const headerName of userHeaders) {
    // Check both standard and lowercase versions
    const value =
      req.headers.get(headerName) ||
      req.headers.get(headerName.toLowerCase()) ||
      req.headers.get(`x-${headerName.toLowerCase().replace('x-', '')}`); // Also check x-user-id format

    if (value) {
      const safeKey = headerName as keyof typeof headers;
      headers[safeKey] = value;
      const safeLowerKey = headerName.toLowerCase() as keyof typeof headers;
      headers[safeLowerKey] = value; // Also set lowercase for compatibility
    }
  }

  // For SignalR negotiation, ensure we have user headers even if client didn't send them
  // SignalR negotiation happens before the connection is established, so headers from withUrl might not be forwarded
  const isSignalRNegotiate =
    url.includes('/hub/negotiate') || url.includes('/messageHub/negotiate');
  if (isSignalRNegotiate) {
    // Ensure we have at least development headers for SignalR
    if (!headers['X-User-Email'] && process.env.NODE_ENV === 'development') {
      headers['X-User-Email'] = session?.user?.email || 'admin@mukuru.com';
      headers['x-user-email'] = headers['X-User-Email'];
    }
    if (!headers['X-User-Id'] && headers['X-User-Email']) {
      // Generate user ID from email if not provided
      const email = headers['X-User-Email'].toLowerCase();
      const crypto = await import('crypto');
      const hash = crypto.createHash('md5').update(email, 'utf8').digest();
      hash[6] = (hash[6] & 0x0f) | 0x30;
      hash[8] = (hash[8] & 0x3f) | 0x80;
      const hex = Array.from(hash)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const formattedUserId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
      headers['X-User-Id'] = formattedUserId;
      headers['x-user-id'] = formattedUserId;
    }
    // SignalR negotiation expects application/json
    headers['content-type'] = 'application/json';
    headers['Content-Type'] = 'application/json';
    // SignalR negotiation might need Accept header
    if (!headers['Accept']) {
      headers['Accept'] = 'application/json';
    }
  }

  // Add additional headers for better debugging
  headers['user-agent'] = 'NextJS-Proxy/1.0';

  // Get request body for non-GET requests (but not for DELETE/HEAD which typically don't have bodies)
  // For multipart/form-data, use formData() which preserves the multipart structure
  let requestBody: string | FormData | undefined = undefined;
  if (!['GET', 'HEAD', 'DELETE'].includes(req.method)) {
    try {
      if (isMultipartFormData) {
        // For file uploads, parse FormData and pass it directly to fetch
        // This preserves the multipart structure that the backend expects
        // fetch() will automatically set Content-Type with the correct boundary
        requestBody = await req.formData();
        // Remove Content-Type header - fetch will set it with the correct boundary
        delete headers['content-type'];
        delete headers['Content-Type'];
      } else {
        // For other content types, read as text
        requestBody = await req.text();
      }
    } catch (error) {
      // If body read fails, continue without body
      console.warn('[Proxy] Failed to read request body:', error);
    }
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    body: requestBody || undefined, // Explicitly set to undefined if empty string
    redirect: 'manual',
    // Add cache control to prevent Next.js from caching
    cache: 'no-store',
  };

  try {
    // Add timeout to prevent hanging requests
    // Use 50s timeout (shorter than nginx's 60s) to fail faster and get better error messages
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout

    try {
      // Use native fetch with proper error handling
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        // Log all non-2xx responses for debugging
        let errorText = 'Unknown error';
        try {
          errorText = await res.text();
        } catch (textError) {
          // If reading response text fails, use a default message
          errorText = `Failed to read error response: ${textError instanceof Error ? textError.message : 'Unknown'}`;
        }

        if (process.env.NODE_ENV === 'development') {
          const sanitizedError = sanitizeErrorText(errorText);
          console.error('[Proxy] Backend returned error:', {
            status: res.status,
            statusText: res.statusText,
            url,
            method: req.method,
            error: sanitizedError,
          });
        }

        // For 404 errors, provide more helpful information
        if (res.status === 404) {
          const afterProxy = req.nextUrl.pathname.split('/api/proxy')[1] || '';
          const helpfulMessage = JSON.stringify({
            error: 'Endpoint not found',
            message: `The endpoint ${afterProxy} returned 404. This usually means:`,
            suggestions: [
              '1. The backend service may not be running. Check if the onboarding-api service is running on port 8001.',
              '2. The route may not be registered. Verify the controller is properly registered in Program.cs.',
              '3. The path may be incorrect. Verify the route matches the controller attribute.',
            ],
            attemptedUrl: url,
            originalPath: req.nextUrl.pathname,
          });

          const respHeaders = new Headers();
          respHeaders.set('Access-Control-Allow-Origin', '*');
          respHeaders.set('Content-Type', 'application/json');
          return new NextResponse(helpfulMessage, {
            status: res.status,
            headers: respHeaders,
          });
        }

        // For other errors (5xx), log and return as-is
        if (res.status >= 500) {
          // Re-create response for error handling
          const errorBody = new TextEncoder().encode(errorText);
          const respHeaders = new Headers();
          res.headers.forEach((v, k) => respHeaders.set(k, v));
          respHeaders.set('Access-Control-Allow-Origin', '*');
          return new NextResponse(errorBody, {
            status: res.status,
            headers: respHeaders,
          });
        }

        // For 4xx errors (other than 404), return as-is
        const errorBody = new TextEncoder().encode(errorText);
        const respHeaders = new Headers();
        res.headers.forEach((v, k) => respHeaders.set(k, v));
        respHeaders.set('Access-Control-Allow-Origin', '*');
        return new NextResponse(errorBody, { status: res.status, headers: respHeaders });
      }

      const body = await res.arrayBuffer();

      const respHeaders = new Headers();
      res.headers.forEach((v, k) => respHeaders.set(k, v));
      // ensure CORS for browser even though this is same-origin
      respHeaders.set('Access-Control-Allow-Origin', '*');
      respHeaders.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS, PATCH'
      );
      respHeaders.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role'
      );

      return new NextResponse(body, { status: res.status, headers: respHeaders });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    reportApiError(
      error,
      {
        endpoint: url,
        method: req.method,
      },
      {
        tags: { error_type: 'proxy_request' },
      }
    );
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      const sanitizedErrorMessage = sanitizeErrorText(errorMessage);
      console.error('[Proxy] Request failed:', {
        url,
        method: req.method,
        error: sanitizedErrorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        hasSession: !!session,
        hasAccessToken: !!accessToken,
        // Only log user ID (not email/name for privacy) and role
        userHeaders: {
          'X-User-Id': headers['X-User-Id'],
          'X-User-Role': headers['X-User-Role'],
          hasEmail: !!headers['X-User-Email'],
          hasName: !!headers['X-User-Name'],
        },
      });
    }

    // If it's a connection error, try fallback for entity config endpoints or auth service
    if (
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('terminated') ||
      errorMessage.includes('aborted') ||
      errorMessage.includes('ERR_INVALID_HTTP_RESPONSE') ||
      errorMessage.includes('Invalid HTTP response') ||
      errorMessage.includes('network error')
    ) {
      const afterProxy = req.nextUrl.pathname.split('/api/proxy')[1] || '';

      // If authentication service is down and this is a roles/users endpoint, try unified API as fallback
      if (
        url.includes(AUTH_TARGET) &&
        (afterProxy.startsWith('/api/roles') ||
          afterProxy.startsWith('/api/v1/roles') ||
          afterProxy.startsWith('/api/users') ||
          afterProxy.startsWith('/api/v1/users'))
      ) {
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
          fallbackHeaders.set(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, OPTIONS, PATCH'
          );
          fallbackHeaders.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role'
          );
          return new NextResponse(fallbackBody, {
            status: fallbackRes.status,
            headers: fallbackHeaders,
          });
        } catch {
          // Both services failed - return helpful error
          return new NextResponse(
            JSON.stringify({
              error: 'Backend service unavailable',
              details: `Authentication Service (${AUTH_TARGET}) is not running. Please start the authentication service on port 8090, or ensure the Unified API (${UNIFIED_API_TARGET}) has the roles/users endpoints.`,
              originalError: errorMessage,
              attemptedFallback: fallbackUrl,
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      // If entity config service is down and this is an entity config endpoint, try unified API as fallback
      if (
        url.includes(ENTITY_CONFIG_TARGET) &&
        (afterProxy.startsWith('/api/v1/requirements') ||
          afterProxy.startsWith('/api/v1/entity-types') ||
          afterProxy.startsWith('/api/v1/permissions'))
      ) {
        // Fallback to unified API
        const fallbackUrl = `${UNIFIED_API_TARGET}${afterProxy}${req.nextUrl.search}`;
        try {
          const fallbackRes = await fetch(fallbackUrl, init);
          const fallbackBody = await fallbackRes.arrayBuffer();
          const fallbackHeaders = new Headers();
          fallbackRes.headers.forEach((v, k) => fallbackHeaders.set(k, v));
          fallbackHeaders.set('Access-Control-Allow-Origin', '*');
          fallbackHeaders.set(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, OPTIONS, PATCH'
          );
          fallbackHeaders.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role'
          );
          return new NextResponse(fallbackBody, {
            status: fallbackRes.status,
            headers: fallbackHeaders,
          });
        } catch {
          // Both services failed - return helpful error
          return new NextResponse(
            JSON.stringify({
              error: 'Backend service unavailable',
              details: `Entity Configuration Service (${ENTITY_CONFIG_TARGET}) is not running. Please start the service on port 8003, or ensure the Unified API (${UNIFIED_API_TARGET}) has the requirements endpoint.`,
              originalError: errorMessage,
              attemptedFallback: fallbackUrl,
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      return new NextResponse(
        JSON.stringify({
          error: 'Backend service unavailable',
          details: `Cannot connect to ${url}. Please ensure the backend service is running.`,
          originalError: errorMessage,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Provide more detailed error message in development
    const errorDetails =
      process.env.NODE_ENV === 'development'
        ? {
            error: 'Proxy request failed',
            details: errorMessage,
            url,
            method: req.method,
          }
        : { error: 'Proxy request failed', details: 'Backend service unavailable' };

    return new NextResponse(JSON.stringify(errorDetails), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
