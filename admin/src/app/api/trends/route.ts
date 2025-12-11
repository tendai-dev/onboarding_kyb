import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Trends API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');
    const days = searchParams.get('days') || '7';

    // Build proxy URL - proxy will handle token injection and refresh
    // Note: backend doesn't support days parameter, we'll filter client-side
    const queryParams = new URLSearchParams();
    if (partnerId) queryParams.set('partnerId', partnerId);
    const proxyPath = `/api/proxy/api/v1/projections/trends${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user identification headers (proxy will inject token from Redis)
    if (session?.user) {
      interface User {
        email?: string;
        name?: string;
        id?: string;
        role?: string;
      }
      const user: User = session.user as User;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      if (user.role) headers['X-User-Role'] = String(user.role);
    }

    // Forward request through proxy (proxy handles token from httpOnly cookie)
    const response = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      let errorText = '';
      interface ErrorJson {
        message?: string;
        error?: string;
        [key: string]: unknown;
      }
      let errorJson: ErrorJson | null = null;
      try {
        errorText = await response.text();
        try {
          errorJson = JSON.parse(errorText) as ErrorJson;
        } catch {
          // Not JSON, use text as is
        }
      } catch {
        errorText = 'Failed to read error response';
      }

      logger.error(
        new Error(`Trends API error: ${response.status} ${response.statusText}`),
        'Trends API error',
        {
          tags: { error_type: 'api_backend_error' },
          extra: {
            url: proxyUrl.toString(),
            errorText,
            errorJson,
          },
        }
      );

      return NextResponse.json(
        {
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorJson?.message || errorJson?.error || errorText,
          backendError: errorJson,
        },
        { status: response.status }
      );
    }

    const data = (await response.json()) as unknown[];
    // Get last N days from the trends data
    const lastNDays = Array.isArray(data) ? data.slice(-parseInt(days)) : [];

    // Map backend snake_case to frontend camelCase format
    const mappedData = lastNDays.map((trend: unknown) => {
      const trendObj = trend as Record<string, unknown>;
      const trendDate = trendObj.date ? String(trendObj.date) : '';
      const dateStr = trendDate ? new Date(trendDate).toISOString().split('T')[0] : '';
      return {
        date: dateStr,
        applications: Number(trendObj.new_cases ?? trendObj.newCases ?? 0),
        completed: Number(trendObj.completed_cases ?? trendObj.completedCases ?? 0),
      };
    });

    return NextResponse.json(mappedData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      'Trends API proxy error',
      {
        tags: { error_type: 'api_proxy_error' },
        extra: {
          name: error instanceof Error ? error.name : undefined,
        },
      }
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch trends data',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
