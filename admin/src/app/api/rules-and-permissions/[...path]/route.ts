import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Rules and Permissions API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
async function forwardRequest(request: NextRequest, method: string) {
  try {
    const session = await getServerSession(authOptions);
    const pathname = request.nextUrl.pathname;
    const pathAfterBase = pathname.replace('/api/rules-and-permissions', '') || '';
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Build proxy URL - proxy will handle token injection and refresh
    const proxyPath = `/api/proxy/api/v1${pathAfterBase}${queryString ? `?${queryString}` : ''}`;
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
    if (method !== 'GET' && method !== 'DELETE' && method !== 'HEAD') {
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
      let errorMessage = `Rules and Permissions API request failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        if (errorText && errorText.trim().length > 0) {
          errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Proxy request failed', details: errorMessage },
      { status: 502 }
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

export async function PATCH(request: NextRequest) {
  return forwardRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return forwardRequest(request, 'DELETE');
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role',
    },
  });
}

