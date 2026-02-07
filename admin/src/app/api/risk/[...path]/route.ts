/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Use Node.js runtime for better fetch compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get backend URL - prioritize runtime env vars over build-time vars
const getBackendUrl = () => {
  return process.env.PROXY_TARGET || 
         process.env.ONBOARDING_TARGET ||
         process.env.NEXT_PUBLIC_GATEWAY_URL || 
         process.env.NEXT_PUBLIC_BACKEND_URL ||
         'http://localhost:8001';
};

/**
 * Risk API route - forwards directly to backend API
 * This avoids issues with internal proxy routing through external URLs
 */
async function forwardRequest(
  request: NextRequest,
  method: string,
  params?: Promise<{ path?: string[] }>
) {
  try {
    const session = await auth();
    const pathname = request.nextUrl.pathname;
    const pathAfterRisk = pathname.replace('/api/risk', '') || '';
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    // Handle empty path (base route) - don't add trailing slash
    const servicePath =
      pathAfterRisk === ''
        ? ''
        : pathAfterRisk.startsWith('/')
          ? pathAfterRisk
          : `/${pathAfterRisk}`;

    // Build direct backend URL instead of going through proxy route
    const backendUrl = `${getBackendUrl()}/api/v1/risk-assessments${servicePath}${queryString ? `?${queryString}` : ''}`;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user identification headers (proxy will inject token from Redis)
    if (session?.user) {
      const user = session.user as any;
      if (user.email) headers['X-User-Email'] = user.email;
      if (user.name) headers['X-User-Name'] = user.name;
      if (user.id) headers['X-User-Id'] = user.id;
      if (user.role) headers['X-User-Role'] = user.role;
    }

    // Forward user identification headers from request
    const userHeaders = [
      'X-User-Id',
      'X-User-Email',
      'X-User-Name',
      'X-User-Role',
    ] as const;
    for (const headerName of userHeaders) {
      const value =
        request.headers.get(headerName) || request.headers.get(headerName.toLowerCase());
      if (value) {
        // Safe: headerName is from whitelist
        const safeKey = headerName as keyof typeof headers;
        // eslint-disable-next-line security/detect-object-injection
        headers[safeKey] = value;
      }
    }

    // Get request body if present
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch {
        // No body
      }
    }

    // Forward request directly to backend API
    const response = await fetch(backendUrl, {
      method,
      headers,
      body: body || undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = errorData.message || errorData.error || `HTTP ${response.status}`;
      } catch {
        errorText = await response.text().catch(() => `HTTP ${response.status}`);
      }

      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return forwardRequest(request, 'GET', params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return forwardRequest(request, 'POST', params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return forwardRequest(request, 'PUT', params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return forwardRequest(request, 'DELETE', params);
}
