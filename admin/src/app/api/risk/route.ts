/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Use Node.js runtime for better fetch compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Risk API base route - handles /api/risk (list/search endpoint)
 * Routes through centralized proxy for BFF pattern
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Build proxy URL - proxy will handle token injection and refresh
    const proxyPath = `/api/proxy/api/v1/risk-assessments${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);

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

    // Forward request through proxy (proxy handles token from httpOnly cookie)
    const response = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers,
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Build proxy URL
    const proxyPath = `/api/proxy/api/v1/risk-assessments${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user identification headers
    if (session?.user) {
      const user = session.user as any;
      if (user.email) headers['X-User-Email'] = user.email;
      if (user.name) headers['X-User-Name'] = user.name;
      if (user.id) headers['X-User-Id'] = user.id;
      if (user.role) headers['X-User-Role'] = user.role;
    }

    // Get request body
    let body: string | undefined;
    try {
      body = await request.text();
    } catch {
      // No body
    }

    // Forward request through proxy
    const response = await fetch(proxyUrl.toString(), {
      method: 'POST',
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
