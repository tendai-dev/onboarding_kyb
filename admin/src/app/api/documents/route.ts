import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Get backend URL from environment
const getBackendUrl = () => {
  return process.env.PROXY_TARGET || 
         process.env.ONBOARDING_TARGET ||
         process.env.NEXT_PUBLIC_GATEWAY_URL || 
         process.env.NEXT_PUBLIC_BACKEND_URL ||
         'http://localhost:8001';
};

/**
 * Documents API route - calls backend directly with user headers
 * Backend uses X-User-* headers for authorization when no Bearer token is present
 */
export async function GET(request: NextRequest) {
  logger.debug('[Documents API Route] GET request received', { url: request.url });
  try {
    const session = await auth();
    logger.debug('[Documents API Route] Session', { authenticated: !!session });
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    logger.debug('[Documents API Route] Query params', { queryString });

    // Call backend directly with user headers
    const backendUrl = getBackendUrl();
    const apiUrl = `${backendUrl}/api/v1/documents${queryString ? `?${queryString}` : ''}`;

    // Prepare headers - backend accepts X-User-* headers for admin portal requests
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-User-Email': session?.user?.email || 'admin@mukuru.com',
      'X-User-Name': session?.user?.name || 'Admin User',
      'X-User-Role': 'Administrator',
    };

    // Add user identification headers
    if (session?.user) {
      const user = session.user as Record<string, unknown>;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      if (user.role) headers['X-User-Role'] = String(user.role) || 'Administrator';
    }

    logger.info('[Documents API Route] Calling backend', { url: apiUrl, headers: { ...headers, Authorization: '[REDACTED]' } });

    // Call backend directly
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (readError) {
        errorText = `Failed to read error response: ${readError instanceof Error ? readError.message : 'Unknown error'}`;
      }

      logger.error(
        new Error(`Backend error: ${response.status} ${response.statusText}`),
        '[Documents API Route] Backend error',
        {
          tags: { error_type: 'api_backend_error' },
          extra: {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            url: apiUrl,
          },
        }
      );

      return NextResponse.json(
        {
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText || 'No error details available',
          status: response.status,
        },
        { status: response.status }
      );
    }

    let data;
    try {
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        logger.warn('[Documents API Route] Empty response from backend');
        return NextResponse.json({ items: [], total: 0, totalCount: 0 });
      }
      data = JSON.parse(responseText);
    } catch (parseError) {
      logger.error(parseError, '[Documents API Route] Failed to parse response', {
        tags: { error_type: 'api_parse_error' },
        extra: { url: apiUrl },
      });
      return NextResponse.json(
        {
          error: 'Invalid response from backend',
          message:
            parseError instanceof Error ? parseError.message : 'Failed to parse response',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(error, '[Documents API Route] Request error', {
      tags: { error_type: 'api_request_error' },
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch documents',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
