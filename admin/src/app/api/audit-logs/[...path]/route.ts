import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Audit Log API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
async function forwardRequest(
  request: NextRequest,
  method: string,
  params?: Promise<{ path?: string[] }>
) {
  logger.debug(`[Audit Log API Route] ${method} request received`, {
    url: request.url.toString(),
  });
  try {
    const session = await auth();
    const pathname = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Extract the path after /api/audit-logs
    let servicePath = '';
    const resolvedParams = params ? await params : undefined;
    if (resolvedParams?.path && resolvedParams.path.length > 0) {
      servicePath = `/${resolvedParams.path.join('/')}`;
    } else {
      const pathAfterBase = pathname.replace('/api/audit-logs', '') || '';
      servicePath = pathAfterBase.startsWith('/') ? pathAfterBase : `/${pathAfterBase}`;
    }

    // Build proxy URL - proxy will handle token injection and refresh
    // Backend route is /api/v1/audit-logs, so we need /api/v1/audit-logs
    const proxyPath = `/api/proxy/api/v1/audit-logs${servicePath}${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);

    logger.debug('[Audit Log API Route] Forwarding', {
      originalPath: pathname,
      servicePath,
      proxyPath,
      proxyUrl: proxyUrl.toString(),
      method,
    });

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

    // Get request body if present
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE' && method !== 'HEAD') {
      try {
        body = await request.text();
      } catch {
        // No body
      }
    }

    // Forward request through proxy (proxy handles token from httpOnly cookie)
    const response = await fetch(proxyUrl.toString(), {
      method,
      headers,
      body: body || undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Audit Log API request failed: ${response.status} ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        if (errorText && errorText.trim().length > 0) {
          errorMessage =
            errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
        }
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(error, '[Audit Log API Route] Error', {
      tags: { error_type: 'api_route_error' },
    });
    return NextResponse.json(
      {
        error: 'Failed to process audit log request',
        message: errorMessage,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return forwardRequest(request, 'PATCH', params);
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role',
    },
  });
}
