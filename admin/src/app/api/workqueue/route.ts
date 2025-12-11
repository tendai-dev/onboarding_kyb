import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Work Queue API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
export async function GET(request: NextRequest) {
  logger.debug('[Work Queue API Route] GET request received', { url: request.url });
  try {
    const session = await auth();
    logger.debug('[Work Queue API Route] Session', { authenticated: !!session });
    const searchParams = request.nextUrl.searchParams;

    // Build backend query params
    const backendParams = new URLSearchParams();

    // Forward all query params
    if (searchParams.has('status')) {
      backendParams.set('status', searchParams.get('status')!);
    }
    if (searchParams.has('assignedTo')) {
      backendParams.set('assignedTo', searchParams.get('assignedTo')!);
    }
    if (searchParams.has('riskLevel')) {
      backendParams.set('riskLevel', searchParams.get('riskLevel')!);
    }
    if (searchParams.has('priority')) {
      backendParams.set('priority', searchParams.get('priority')!);
    }
    if (searchParams.has('searchTerm')) {
      backendParams.set('searchTerm', searchParams.get('searchTerm')!);
    }
    if (searchParams.has('page')) {
      backendParams.set('page', searchParams.get('page')!);
    }
    if (searchParams.has('pageSize')) {
      backendParams.set('pageSize', searchParams.get('pageSize')!);
    }

    const queryString = backendParams.toString();

    // Build proxy URL - proxy will handle token injection and refresh
    const proxyPath = `/api/proxy/api/v1/workqueue${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user identification headers (proxy will inject token from Redis)
    if (session?.user) {
      const user = session.user as Record<string, unknown>;
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

      logger.error('[Work Queue API Route] Backend error', {
        status: response.status,
        error: errorText,
      });

      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    logger.debug('[Work Queue API Route] Success', { itemCount: data.items?.length || 0 });

    return NextResponse.json(data);
  } catch (error) {
    logger.error(error, '[Work Queue API Route] Error', {
      tags: { error_type: 'workqueue_api_error' },
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

