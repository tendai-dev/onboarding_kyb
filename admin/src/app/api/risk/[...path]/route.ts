import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Risk API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
async function forwardRequest(request: NextRequest, method: string, params?: { path?: string[] }) {
  logger.debug(`[Risk API Route] ${method} request received`, { url: request.url.toString() });
  try {
    const session = await auth();
    const pathname = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Extract the path after /api/risk
    // If params.path exists (from [...path]), use it, otherwise parse from pathname
    let servicePath = '';
    if (params?.path && params.path.length > 0) {
      // Join the path segments
      servicePath = `/${params.path.join('/')}`;
    } else {
      // Fallback: extract from pathname
      const pathAfterRisk = pathname.replace('/api/risk', '') || '';
      servicePath = pathAfterRisk.startsWith('/') ? pathAfterRisk : `/${pathAfterRisk}`;
    }
    
    // If servicePath is just '/risk-assessments', remove it since backend route already includes it
    // Backend route is /api/v1/risk-assessments, so we should map:
    // /api/risk/risk-assessments -> /api/proxy/api/v1/risk-assessments
    // /api/risk/risk-assessments/{id} -> /api/proxy/api/v1/risk-assessments/{id}
    if (servicePath === '/risk-assessments' || servicePath.startsWith('/risk-assessments/')) {
      // Remove the leading /risk-assessments since backend route already includes it
      servicePath = servicePath.replace(/^\/risk-assessments/, '');
    }
    
    // Build proxy URL - proxy will handle token injection and refresh
    // Backend route is [Route("api/v1/risk-assessments")], so we need /api/v1/risk-assessments
    const proxyPath = `/api/proxy/api/v1/risk-assessments${servicePath}${queryString ? `?${queryString}` : ''}`;
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
    
    // Get request body if present
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch (e) {
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
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      return new NextResponse(null, { status: response.status });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to process risk request', 
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return forwardRequest(request, 'GET', params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return forwardRequest(request, 'POST', params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return forwardRequest(request, 'PUT', params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return forwardRequest(request, 'DELETE', params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return forwardRequest(request, 'PATCH', params);
}

