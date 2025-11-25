import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Work Queue API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Build proxy URL - proxy will handle token injection and refresh
    const proxyPath = `/api/proxy/api/v1/workqueue${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);
    
    logger.debug('[WorkQueue API Route] Proxying request', { url: proxyUrl.toString() });
    
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
    
    // Forward request through proxy (proxy handles token from httpOnly cookie)
    const response = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(30000), // Increased timeout to 30 seconds
    });

    if (!response.ok) {
      let errorText = '';
      let errorJson: any = null;
      try {
        errorText = await response.text();
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          // Not JSON, use text as is
        }
      } catch (readError) {
        errorText = `Failed to read error response: ${readError instanceof Error ? readError.message : 'Unknown error'}`;
      }
      
      logger.error(new Error(`Backend error: ${response.status} ${response.statusText}`), '[WorkQueue API Route] Backend error', {
        tags: { error_type: 'api_backend_error' },
        extra: {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          errorJson,
          url: proxyUrl.toString()
        }
      });
      
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status} ${response.statusText}`, 
          details: errorJson?.message || errorJson?.error || errorText || 'No error details available',
          backendError: errorJson,
          status: response.status
        },
        { status: response.status }
      );
    }

    let data;
    try {
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        logger.warn('[WorkQueue API Route] Empty response from backend');
        return NextResponse.json({ items: [], total_count: 0, page: 1, page_size: 20 });
      }
      data = JSON.parse(responseText);
    } catch (parseError) {
      logger.error(parseError, '[WorkQueue API Route] Failed to parse response', {
        tags: { error_type: 'api_parse_error' },
        extra: { url: proxyUrl.toString() }
      });
      return NextResponse.json(
        { 
          error: 'Invalid response from backend', 
          message: parseError instanceof Error ? parseError.message : 'Failed to parse response'
        },
        { status: 502 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(error, '[WorkQueue API Route] Request error', {
      tags: { error_type: 'api_request_error' }
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch work queue data', 
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Forward work queue requests through proxy (BFF pattern)
 */
async function forwardRequest(request: NextRequest, method: string) {
  try {
    const session = await auth();
    const pathname = request.nextUrl.pathname;
    const pathAfterWorkqueue = pathname.replace('/api/workqueue', '') || '';
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
      signal: AbortSignal.timeout(30000), // Increased timeout to 30 seconds
    });

    if (!response.ok) {
      let errorText = '';
      let errorJson: any = null;
      try {
        errorText = await response.text();
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          // Not JSON, use text as is
        }
      } catch (readError) {
        errorText = `Failed to read error response: ${readError instanceof Error ? readError.message : 'Unknown error'}`;
      }
      
      logger.error(new Error(`Backend error: ${response.status} ${response.statusText}`), '[WorkQueue API Route] Backend error in forwardRequest', {
        tags: { error_type: 'api_backend_error' },
        extra: {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          errorJson,
          url: proxyUrl.toString()
        }
      });
      
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status} ${response.statusText}`, 
          details: errorJson?.message || errorJson?.error || errorText,
          backendError: errorJson,
        },
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
        error: 'Failed to process work queue request', 
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return forwardRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return forwardRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return forwardRequest(request, 'DELETE');
}

export async function PATCH(request: NextRequest) {
  return forwardRequest(request, 'PATCH');
}

