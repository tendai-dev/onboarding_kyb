import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Documents API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
export async function GET(request: NextRequest) {
  logger.debug('[Documents API Route] GET request received', { url: request.url });
  try {
    const session = await auth();
    logger.debug('[Documents API Route] Session', { authenticated: !!session });
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    logger.debug('[Documents API Route] Query params', { queryString });
    
    // Build proxy URL - proxy will handle token injection and refresh
    // The backend endpoint is /api/v1/documents (from DocumentsController)
    // The proxy routes /api/proxy/api/v1/documents to the backend
    const proxyPath = `/api/proxy/api/v1/documents${queryString ? `?${queryString}` : ''}`;
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
      
      logger.error(new Error(`Backend error: ${response.status} ${response.statusText}`), '[Documents API Route] Backend error', {
        tags: { error_type: 'api_backend_error' },
        extra: {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: proxyUrl.toString()
        }
      });
      
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status} ${response.statusText}`, 
          details: errorText || 'No error details available',
          status: response.status
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
    logger.error(error, '[Documents API Route] Request error', {
      tags: { error_type: 'api_request_error' }
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

