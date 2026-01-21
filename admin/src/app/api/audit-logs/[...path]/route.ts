import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Get backend URL - call backend directly to avoid SSL issues with self-referencing proxy
const getBackendUrl = () => {
  return process.env.PROXY_TARGET || 
         process.env.ONBOARDING_TARGET ||
         process.env.NEXT_PUBLIC_GATEWAY_URL || 
         'http://localhost:8001';
};

/**
 * Audit Log API route - calls backend directly with X-User headers
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

    // Build backend URL directly (avoid proxy to prevent SSL issues)
    const backendUrl = getBackendUrl();
    const apiPath = `${backendUrl}/api/v1/audit-logs${servicePath}${queryString ? `?${queryString}` : ''}`;

    logger.debug('[Audit Log API Route] Forwarding to backend', {
      originalPath: pathname,
      servicePath,
      apiPath,
      method,
    });

    // Prepare headers - use X-User headers for dev mode auth
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user identification headers for dev mode authentication
    if (session?.user) {
      const user = session.user as Record<string, unknown>;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      headers['X-User-Role'] = 'Administrator'; // Admin portal users are administrators
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

    // Forward request directly to backend
    const response = await fetch(apiPath, {
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
