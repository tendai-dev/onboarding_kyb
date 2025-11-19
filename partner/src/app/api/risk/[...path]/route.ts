import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getTokenSession } from '@/lib/redis-session';

// Use direct risk service URL (bypass gateway for now)
const RISK_API_BASE_URL = process.env.RISK_API_BASE_URL || 
                          process.env.NEXT_PUBLIC_RISK_API_BASE_URL ||
                          'http://127.0.0.1:8006';

async function forwardRequest(request: NextRequest, method: string) {
  try {
    // Get the path segments (e.g., ['risk-assessments'] from /api/risk/risk-assessments)
    const pathname = request.nextUrl.pathname;
    const pathAfterRisk = pathname.replace('/api/risk', '') || '';
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Use direct risk service URL: /api/v1/risk-assessments
    // pathAfterRisk will be like "/risk-assessments" from "/api/risk/risk-assessments"
    // We need to convert it to "/api/v1/risk-assessments"
    const servicePath = pathAfterRisk.startsWith('/') ? pathAfterRisk : `/${pathAfterRisk}`;
    const url = `${RISK_API_BASE_URL}/api/v1${servicePath}${queryString ? `?${queryString}` : ''}`;
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // SECURITY: Get token from Redis (not from client request)
    // The proxy should inject tokens server-side, not forward from client
    let accessToken: string | null = null;
    try {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      if (token?.sessionId) {
        const tokenSession = await getTokenSession(token.sessionId as string);
        if (tokenSession) {
          // Check if token needs refresh (within 60 seconds of expiry)
          if (tokenSession.accessTokenExpiryTime && Date.now() < tokenSession.accessTokenExpiryTime - 60 * 1000) {
            accessToken = tokenSession.accessToken;
          } else {
            // Token expired or expiring soon - use it anyway and let backend handle 401
            accessToken = tokenSession.accessToken;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get token from session:', error);
      // Continue without token - backend will return 401 if auth required
    }

    // Inject Authorization header from Redis-stored token (do NOT forward from client)
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Forward user identification headers to backend services
    const userHeaders = ['X-User-Id', 'X-User-Email', 'X-User-Name', 'X-User-Role'];
    for (const headerName of userHeaders) {
      const value = request.headers.get(headerName) || request.headers.get(headerName.toLowerCase());
      if (value) {
        headers[headerName] = value;
      }
    }
    
    // In development mode, add test headers if not present and no auth token from Redis
    if (process.env.NODE_ENV === 'development') {
      if (!headers['X-User-Email']) {
        headers['X-User-Email'] = 'partner@example.com';
        headers['X-User-Name'] = 'Partner User';
        headers['X-User-Role'] = 'Partner';
      }
      if (!accessToken) {
        headers['Authorization'] = 'Bearer development-token';
      }
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
    
    const response = await fetch(url, {
      method,
      headers,
      body: body || undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Risk API error: ${response.status} ${response.statusText}`, errorText);
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
    console.error('Risk API proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout');
    
    return NextResponse.json(
      { 
        error: 'Failed to process risk request', 
        message: errorMessage,
        details: isConnectionError ? `Cannot connect to ${RISK_API_BASE_URL}. Please ensure the backend service is running.` : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return forwardRequest(request, 'GET');
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

