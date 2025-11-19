import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Migration API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
async function forwardRequest(request: NextRequest, method: string) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Build proxy URL - proxy will handle token injection and refresh
    const proxyPath = `/api/proxy/api/v1/migrations${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);
    
    // Prepare headers
    const headers: HeadersInit = {};

    // Add user identification headers (proxy will inject token from Redis)
    if (session?.user) {
      const user = session.user as any;
      if (user.email) headers['X-User-Email'] = user.email;
      if (user.name) headers['X-User-Name'] = user.name;
      if (user.id) headers['X-User-Id'] = user.id;
      if (user.role) headers['X-User-Role'] = user.role;
    }
    
    // For file uploads (POST with FormData), don't set Content-Type - let browser set it with boundary
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('multipart/form-data')) {
      headers['Content-Type'] = contentType;
    }
    
    // Get request body if present
    let body: BodyInit | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      if (contentType?.includes('multipart/form-data')) {
        // For file uploads, get the raw body
        body = await request.arrayBuffer();
      } else {
        body = await request.text();
      }
    }
    
    // Forward request through proxy (proxy handles token from httpOnly cookie)
    const response = await fetch(proxyUrl.toString(), {
      method,
      headers,
      body,
    });

    const responseBody = await response.arrayBuffer();
    const responseHeaders = new Headers();
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
    
    // Ensure CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role');

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Migration API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a connection error
    if (error instanceof Error && (
      error.message.includes('ECONNREFUSED') || 
      error.message.includes('fetch failed') ||
      error.message.includes('network')
    )) {
      return NextResponse.json(
        { 
          error: 'Backend service unavailable', 
          details: `Cannot connect to migrations API. Please ensure the onboarding API service is running.`,
          originalError: errorMessage
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Migration API request failed', details: errorMessage },
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name, X-User-Role',
    },
  });
}

