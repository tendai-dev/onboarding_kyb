import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Route segment config
export const _dynamic = 'force-dynamic';
export const _runtime = 'nodejs';

/**
 * Requirements API route with dynamic paths - routes through centralized proxy for BFF pattern
 * Handles sub-paths like /metadata, /by-code/xxx, etc.
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  logger.debug('[Requirements API Route] GET request received', { url: request.url });
  try {
    const session = await auth();
    logger.debug('[Requirements API Route] Session', { authenticated: !!session });
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Extract sub-path from params or URL
    const resolvedParams = await params;
    let subPath = '';
    if (resolvedParams?.path && resolvedParams.path.length > 0) {
      subPath = `/${resolvedParams.path.join('/')}`;
    } else {
      // Fallback: extract from pathname
      const urlPath = new URL(request.url).pathname;
      subPath = urlPath.replace('/api/requirements', '') || '';
    }

    logger.debug('[Requirements API Route] Sub-path extracted', { subPath, queryString });

    // Build proxy URL - proxy will handle token injection and refresh
    const proxyPath = `/api/proxy/api/v1/requirements${subPath}${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);

    logger.debug('[Requirements API Route] Proxying to', { url: proxyUrl.toString() });

    // Prepare headers
    const headers: Record<string, string> = {
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
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (readError) {
        errorText = `Failed to read error response: ${readError instanceof Error ? readError.message : 'Unknown error'}`;
      }

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
        return NextResponse.json([]);
      }
      data = JSON.parse(responseText);
    } catch (parseError) {
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
    logger.error(error, '[Requirements API Route] Request error', {
      tags: { error_type: 'api_request_error' },
    });
    // Return empty array on error to prevent UI breakage
    return NextResponse.json([]);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  logger.debug('[Requirements API Route] POST request received', { url: request.url });
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Extract sub-path from params or URL
    const resolvedParams = await params;
    let subPath = '';
    if (resolvedParams?.path && resolvedParams.path.length > 0) {
      subPath = `/${resolvedParams.path.join('/')}`;
    } else {
      const urlPath = new URL(request.url).pathname;
      subPath = urlPath.replace('/api/requirements', '') || '';
    }

    // Build proxy URL
    const proxyPath = `/api/proxy/api/v1/requirements${subPath}${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.user) {
      const user = session.user as Record<string, unknown>;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      if (user.role) headers['X-User-Role'] = String(user.role);
    }

    // Get request body
    const body = await request.text();

    // Forward request through proxy
    const response = await fetch(proxyUrl.toString(), {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        {
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText || 'No error details available',
        },
        { status: response.status }
      );
    }

    const data = await response.json().catch(async () => {
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logger.error(error, '[Requirements API Route] POST request error', {
      tags: { error_type: 'api_request_error' },
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  logger.debug('[Requirements API Route] PUT request received', { url: request.url });
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const resolvedParams = await params;
    let subPath = '';
    if (resolvedParams?.path && resolvedParams.path.length > 0) {
      subPath = `/${resolvedParams.path.join('/')}`;
    } else {
      const urlPath = new URL(request.url).pathname;
      subPath = urlPath.replace('/api/requirements', '') || '';
    }

    const proxyPath = `/api/proxy/api/v1/requirements${subPath}${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.user) {
      const user = session.user as Record<string, unknown>;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      if (user.role) headers['X-User-Role'] = String(user.role);
    }

    const body = await request.text();

    const response = await fetch(proxyUrl.toString(), {
      method: 'PUT',
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        {
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText || 'No error details available',
        },
        { status: response.status }
      );
    }

    const data = await response.json().catch(async () => {
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logger.error(error, '[Requirements API Route] PUT request error', {
      tags: { error_type: 'api_request_error' },
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  logger.debug('[Requirements API Route] DELETE request received', { url: request.url });
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const resolvedParams = await params;
    let subPath = '';
    if (resolvedParams?.path && resolvedParams.path.length > 0) {
      subPath = `/${resolvedParams.path.join('/')}`;
    } else {
      const urlPath = new URL(request.url).pathname;
      subPath = urlPath.replace('/api/requirements', '') || '';
    }

    const proxyPath = `/api/proxy/api/v1/requirements${subPath}${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.user) {
      const user = session.user as Record<string, unknown>;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      if (user.role) headers['X-User-Role'] = String(user.role);
    }

    const response = await fetch(proxyUrl.toString(), {
      method: 'DELETE',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        {
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText || 'No error details available',
        },
        { status: response.status }
      );
    }

    // DELETE might return 204 No Content
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(async () => {
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logger.error(error, '[Requirements API Route] DELETE request error', {
      tags: { error_type: 'api_request_error' },
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
