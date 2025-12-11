import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
// NOTE: Token functions removed - using session-based auth only (BFF pattern)
// Tokens are stored server-side in Redis and never exposed to client

// All services are now consolidated into the unified onboarding-api
const UNIFIED_API_TARGET =
  process.env.PROXY_TARGET || process.env.ONBOARDING_TARGET || 'http://localhost:8001';
const AUTH_TARGET =
  process.env.PROXY_TARGET_AUTH || process.env.AUTH_TARGET || 'http://localhost:8001';

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

  // Get content type early for logging
  const contentType = req.headers.get('content-type') || req.headers.get('Content-Type');

  // Debug logging for messaging endpoints
  if (req.nextUrl.pathname.includes('/messages')) {
    console.info(`[Proxy] Messaging request - routing to: ${url}`);
    const userHeaders = [
      'X-User-Id',
      'X-User-Email',
      'X-User-Name',
      'X-User-Role',
    ] as const;
    const headerValues: Record<string, string> = {};
    for (const headerName of userHeaders) {
      const value =
        req.headers.get(headerName) || req.headers.get(headerName.toLowerCase());
      if (value) {
        // Safe: headerName is from whitelist
        // eslint-disable-next-line security/detect-object-injection
        headerValues[headerName] = value;
      }
    }
    console.info(`[Proxy] User headers received:`, headerValues);
  }

  // Debug logging for document uploads
  if (req.nextUrl.pathname.includes('/documents/upload')) {
    console.info(`[Proxy] Document upload request - routing to: ${url}`);
    console.info(
      `[Proxy] Document upload - method: ${req.method}, content-type: ${contentType || 'not set'}`
    );
  }

  const headers: Record<string, string> = {};

  // BFF Pattern: Session-based authentication ONLY - NO TOKEN LEAKING
  // Tokens are stored server-side in Redis and never exposed to client
  // We use session email to identify the user, backend handles authentication

  // Get session to extract user email for X-User-Email header
  // This is the secure way - session is in httpOnly cookie, never exposed to client
  let sessionEmail: string | null = null;
  let sessionName: string | null = null;
  let sessionUserId: string | null = null;

  try {
    const session = await auth();
    if (session?.user) {
      sessionEmail = session.user.email || null;
      sessionName = session.user.name || null;
      sessionUserId = session.user.id || null;
      console.info(
        '[Proxy] Session-based auth - user identified from session (no tokens exposed)'
      );
    }
  } catch (error) {
    console.warn('[Proxy] Failed to get session:', error);
    // Continue - will use default dev email if needed
  }

  // NOTE: We intentionally do NOT fetch or forward tokens to prevent token leakage
  // Backend will authenticate using:
  // 1. X-User-Email header (from session) in development mode via DevelopmentAuthMiddleware
  // 2. Or its own token validation in production (if needed)
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
  const userHeaders = [
    'X-User-Id',
    'X-User-Email',
    'X-User-Name',
    'X-User-Role',
  ] as const;
  for (const headerName of userHeaders) {
    const value =
      req.headers.get(headerName) || req.headers.get(headerName.toLowerCase());
    if (value) {
      // Safe: headerName is from whitelist
      const safeKey = headerName as keyof typeof headers;
      // eslint-disable-next-line security/detect-object-injection
      headers[safeKey] = value;
      // Safe: lowercase version of whitelisted header
      const safeLowerKey = headerName.toLowerCase() as keyof typeof headers;
      // eslint-disable-next-line security/detect-object-injection
      headers[safeLowerKey] = value; // Also set lowercase for compatibility
    }
  }

  // Session-based authentication: Always set X-User-Email from session (BFF pattern)
  // This is secure - session is in httpOnly cookie, never exposed to client
  // Backend's DevelopmentAuthMiddleware uses this header for authentication
  if (!headers['X-User-Email'] && !headers['x-user-email']) {
    if (sessionEmail) {
      // Use email from session (secure - from httpOnly cookie)
      headers['X-User-Email'] = sessionEmail;
      headers['x-user-email'] = sessionEmail;
      if (sessionName) {
        headers['X-User-Name'] = sessionName;
        headers['x-user-name'] = sessionName;
      }
      if (sessionUserId) {
        headers['X-User-Id'] = sessionUserId;
        headers['x-user-id'] = sessionUserId;
      }
      headers['X-User-Role'] = 'Applicant';
      headers['x-user-role'] = 'Applicant';
      console.info(
        '[Proxy] Session-based auth - using email from session:',
        sessionEmail
      );
    } else {
      // Fallback: Use default development email if no session (development only)
      const isDevelopment =
        process.env.NODE_ENV === 'development' ||
        process.env.NEXT_PUBLIC_ENV === 'development';
      if (isDevelopment) {
        const devEmail = process.env.DEV_USER_EMAIL || 'dev@mukuru.com';
        headers['X-User-Email'] = devEmail;
        headers['x-user-email'] = devEmail;
        headers['X-User-Name'] = 'Development User';
        headers['x-user-name'] = 'Development User';
        headers['X-User-Role'] = 'Applicant';
        headers['x-user-role'] = 'Applicant';
        console.info('[Proxy] No session - using default development email:', devEmail);
      } else {
        console.warn(
          '[Proxy] No session and not in development - request may fail authentication'
        );
      }
    }
  }

  // Forward schema-driven form headers (CRITICAL for dynamic validation)
  const schemaHeaders = ['X-Entity-Type', 'X-Form-Config-Id', 'X-Form-Version'] as const;
  for (const headerName of schemaHeaders) {
    const value =
      req.headers.get(headerName) || req.headers.get(headerName.toLowerCase());
    if (value) {
      // Safe: headerName is from whitelist
      const safeKey = headerName as keyof typeof headers;
      // eslint-disable-next-line security/detect-object-injection
      headers[safeKey] = value;
      // Safe: lowercase version of whitelisted header
      const safeLowerKey = headerName.toLowerCase() as keyof typeof headers;
      // eslint-disable-next-line security/detect-object-injection
      headers[safeLowerKey] = value; // Also set lowercase for compatibility
      console.info(`[Proxy] Forwarding ${headerName}: ${value}`);
    }
  }

  // Add additional headers for better debugging
  headers['user-agent'] = 'NextJS-Proxy/1.0';

  // Handle request body
  let body: BodyInit | undefined;
  try {
    if (['GET', 'HEAD'].includes(req.method)) {
      body = undefined;
    } else if (contentType?.includes('multipart/form-data')) {
      // For file uploads, parse FormData and forward it directly
      // CRITICAL: Don't touch File objects at all - even get() can cause issues!
      const formData = await req.formData();

      // Log form data fields for debugging (ONLY text fields, never touch File objects)
      if (req.nextUrl.pathname.includes('/documents/upload')) {
        // Only log text fields - never call get() on File fields
        const caseIdValue = formData.get('CaseId') || formData.get('caseId');
        const partnerIdValue = formData.get('PartnerId') || formData.get('partnerId');
        const typeValue = formData.get('Type') || formData.get('type');
        const descriptionValue = formData.get('description') || formData.get('Description');
        const uploadedByValue = formData.get('uploadedBy') || formData.get('UploadedBy');

        // Check if File field exists by checking all keys (without getting the value)
        const hasFile = formData.has('File') || formData.has('file');

        // Log all form data keys for debugging
        const allKeys = Array.from(formData.keys());
        
        console.info(`[Proxy] Document upload FormData fields:`, {
          allKeys,
          File: hasFile ? 'Present (File object)' : 'NOT FOUND',
          CaseId: caseIdValue ? String(caseIdValue) : 'NOT FOUND',
          PartnerId: partnerIdValue ? String(partnerIdValue) : 'NOT FOUND',
          Type: typeValue ? String(typeValue) : 'NOT FOUND',
          Description: descriptionValue ? String(descriptionValue).substring(0, 50) : 'NOT FOUND',
          UploadedBy: uploadedByValue ? String(uploadedByValue) : 'NOT FOUND',
        });
      }

      // Forward FormData directly - don't reconstruct, iterate, or touch File objects
      body = formData;
      // Remove Content-Type header - fetch will set it with the correct boundary
      delete headers['content-type'];
      delete headers['Content-Type'];
    } else {
      // For JSON and other text-based content, read as text
      body = await req.text();
      console.info(`[Proxy] Request body size: ${body.length} bytes`);
    }
  } catch (bodyError) {
    console.error('[Proxy] Error reading request body:', bodyError);
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to read request body',
        details: bodyError instanceof Error ? bodyError.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    body,
    redirect: 'manual',
  };

  try {
    console.info(`[Proxy] Forwarding ${req.method} request to: ${url}`);
    console.info(
      `[Proxy] Request headers:`,
      Object.keys(headers).filter((k) => !k.toLowerCase().includes('authorization'))
    );
    if (body && typeof body === 'string') {
      console.info(
        `[Proxy] Request body preview (first 200 chars):`,
        body.substring(0, 200)
      );
    }

    // Use AbortController for better timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[Proxy] Request timeout after 30 seconds for ${url}`);
      controller.abort();
    }, 30000);

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const responseBody = await res.arrayBuffer();

      // Log errors for debugging (especially 400 and 500)
      if (res.status >= 400) {
        const errorBody = new TextDecoder().decode(responseBody);
        console.error(`[Proxy] Backend ${res.status} error for ${url}:`, errorBody);

        if (req.nextUrl.pathname.includes('/documents/upload')) {
          console.error(`[Proxy] Document upload failed with status ${res.status}`);
          console.error(`[Proxy] Request method: ${req.method}`);
          console.error(`[Proxy] Request URL: ${url}`);
          console.error(
            `[Proxy] Request headers sent:`,
            Object.keys(headers).map((k) => {
              const headerValue = headers[k as keyof typeof headers];
              return `${k}: ${typeof headerValue === 'string' ? headerValue.substring(0, 50) : String(headerValue)}`;
            })
          );
          // Try to get form data info if it was FormData
          if (body instanceof FormData) {
            console.error(`[Proxy] FormData body type: FormData`);
            console.error(
              `[Proxy] FormData entries count: ${Array.from(body.entries()).length}`
            );
          }
        }
      }

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
        'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role, X-Entity-Type, X-Form-Config-Id, X-Form-Version, X-Request-Id'
      );

      return new NextResponse(responseBody, { status: res.status, headers: respHeaders });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('[Proxy] Error:', error, 'URL:', url);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for timeout or abort errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('aborted') ||
      errorMessage.includes('terminated') ||
      (error instanceof Error && error.name === 'AbortError')
    ) {
      console.error(`[Proxy] Request timeout or aborted for ${url}`);
      return new NextResponse(
        JSON.stringify({
          error: 'Request timeout',
          details: `The request to ${url} timed out or was terminated. The backend service may be slow or unavailable.`,
          originalError: errorMessage,
        }),
        {
          status: 504,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // If it's a connection error, provide more helpful message
    if (
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('ENOTFOUND')
    ) {
      console.error(`[Proxy] Connection failed to ${url} - service may not be running`);
      return new NextResponse(
        JSON.stringify({
          error: 'Backend service unavailable',
          details: `Cannot connect to ${url}. Please ensure the backend service is running on port 8001.`,
          originalError: errorMessage,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: 'Proxy request failed', details: errorMessage }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
