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
    // Use localhost for internal server-side calls to avoid SSL issues
    const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
    const proxyPath = `/api/proxy/api/v1/workqueue${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, baseUrl);

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
    // Use 50s timeout (shorter than nginx's 60s) to fail faster and get better error messages
    const response = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(50000), // 50 seconds - shorter than nginx's 60s timeout
    });

    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = errorData.message || errorData.error || `HTTP ${response.status}`;
      } catch {
        errorText = await response.text().catch(() => `HTTP ${response.status}`);
      }

      logger.error(new Error(errorText), '[Work Queue API Route] Backend error', {
        extra: {
          status: response.status,
          error: errorText,
        },
      });

      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    logger.debug('[Work Queue API Route] Success', {
      itemCount: data.items?.length || 0,
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Check if it's a timeout error
    const isTimeout = errorMessage.includes('timeout') || 
                      errorMessage.includes('aborted') ||
                      errorMessage.includes('AbortError') ||
                      (error instanceof Error && error.name === 'AbortError');

    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      '[Work Queue API Route] Error',
      {
        tags: { 
          error_type: isTimeout ? 'workqueue_timeout_error' : 'workqueue_api_error',
          timeout: String(isTimeout),
        },
        extra: {
          name: error instanceof Error ? error.name : undefined,
          isTimeout,
        },
      }
    );

    // Return 504 Gateway Timeout for timeout errors
    if (isTimeout) {
      return NextResponse.json(
        {
          error: 'Work queue request timed out',
          message: 'The work queue request took too long to complete. This may be due to a large dataset or backend service issues.',
          suggestion: 'Please try again in a moment, or contact support if the issue persists.',
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch work queue data',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
