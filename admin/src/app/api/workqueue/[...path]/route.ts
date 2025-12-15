import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Use Node.js runtime for better fetch compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Work Queue API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
async function forwardRequest(request: NextRequest, method: string) {
  try {
    const session = await auth();
    const pathname = request.nextUrl.pathname;
    // Extract path after /api/workqueue - ensure it starts with /
    let pathAfterWorkqueue = pathname.replace('/api/workqueue', '') || '';
    // Ensure path starts with / if it's not empty
    if (pathAfterWorkqueue && !pathAfterWorkqueue.startsWith('/')) {
      pathAfterWorkqueue = `/${pathAfterWorkqueue}`;
    }
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Build proxy URL - proxy will handle token injection and refresh
    const proxyPath = `/api/proxy/api/v1/workqueue${pathAfterWorkqueue}${queryString ? `?${queryString}` : ''}`;
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

    // Get request body if present
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
        if (process.env.NODE_ENV === 'development') {
          console.log('[WorkQueue Route] Request body:', body);
        }
      } catch {
        // No body
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[WorkQueue Route] Forwarding request:', {
        method,
        pathname,
        proxyUrl: proxyUrl.toString(),
        hasBody: !!body,
      });
    }

    // Forward request through proxy (proxy handles token from httpOnly cookie)
    const response = await fetch(proxyUrl.toString(), {
      method,
      headers,
      body: body || undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(30000), // Increased timeout for work item creation
    });

    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = errorData.message || errorData.error || `HTTP ${response.status}`;
      } catch {
        errorText = await response.text().catch(() => `HTTP ${response.status}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.error('[WorkQueue Route] Error response:', {
          status: response.status,
          error: errorText,
        });
      }

      return NextResponse.json(
        { message: errorText, error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[WorkQueue Route] Exception:', error);
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
  return forwardRequest(request, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return forwardRequest(request, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return forwardRequest(request, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return forwardRequest(request, 'DELETE');
}
