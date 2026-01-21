import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Entity Configuration API route - simplified to match working applications route
 */
async function forwardRequest(request: NextRequest, method: string) {
  const pathname = request.nextUrl.pathname;
  
  // Extract the path after /api/entity-config
  let pathAfterBase = pathname.replace('/api/entity-config', '');
  if (pathAfterBase && !pathAfterBase.startsWith('/')) {
    pathAfterBase = '/' + pathAfterBase;
  }
  if (!pathAfterBase) {
    pathAfterBase = '';
  }

  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();

  // Use same pattern as working applications route
  const backendUrl = process.env.PROXY_TARGET || process.env.ONBOARDING_TARGET || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8001';
  const fullUrl = `${backendUrl}/api/v1${pathAfterBase}${queryString ? `?${queryString}` : ''}`;

  logger.debug('[Entity-Config Route] Forwarding', { fullUrl, method });

  try {
    const session = await auth();

    // Build headers - same pattern as applications route
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (session?.user) {
      const user = session.user as Record<string, unknown>;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      if (user.role) headers['X-User-Role'] = String(user.role);
    }
    // Always set admin role for entity-config requests
    headers['X-User-Role'] = 'Administrator';

    // Get request body for non-GET requests
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE' && method !== 'HEAD') {
      try {
        body = await request.text();
      } catch {
        // No body
      }
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body || undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[Entity-Config Route] Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: errorText || `Request failed: ${response.status}` },
        { status: response.status }
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[Entity-Config Route] Error: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Backend request failed', details: errorMessage },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  logger.debug('[Entity-Config Route] GET handler called', {
    pathname: request.nextUrl.pathname,
  });
  return forwardRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return forwardRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return forwardRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return forwardRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return forwardRequest(request, 'DELETE');
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
