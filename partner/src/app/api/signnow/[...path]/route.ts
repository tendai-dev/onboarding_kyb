/**
 * SignNow API Proxy Route for Partner App
 * Proxies requests to admin app's SignNow API to keep credentials secure
 * 
 * This allows the partner app to access SignNow functionality through the admin app
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'http://localhost:3001';

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const pathParams = await params;
    const pathSegments = pathParams.path || [];
    const method = request.method;
    const path = `/${pathSegments.join('/')}`;

    // Get session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Construct the full URL to admin app's SignNow API
    const adminUrl = `${ADMIN_API_BASE}/api/signnow${path}`;

    console.info('Proxying SignNow request:', {
      method,
      path,
      adminUrl,
      userEmail: session.user.email,
    });

    // Prepare headers (don't set Content-Type for FormData - let fetch set it with boundary)
    const headers: HeadersInit = {
      Cookie: request.headers.get('cookie') || '',
    };

    // Forward request body
    let body: BodyInit | undefined;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // For FormData, forward it directly
      // Don't set Content-Type header - fetch will set it with the correct boundary
      body = await request.formData();
    } else if (contentType?.includes('application/json')) {
      // For JSON, parse and re-stringify
      const json = await request.json();
      body = JSON.stringify(json);
      headers['Content-Type'] = 'application/json';
    } else if (request.body) {
      // For other types (like PDF downloads), forward as stream
      body = request.body;
      if (contentType) {
        headers['Content-Type'] = contentType;
      }
    }

    // Forward request to admin app
    const response = await fetch(adminUrl, {
      method,
      headers,
      body,
    });

    // Check if this is a download request (PDF or binary)
    const responseContentType = response.headers.get('content-type') || '';
    const isDownload = path.includes('/download') || responseContentType.includes('application/pdf') || responseContentType.includes('application/octet-stream');
    
    if (isDownload) {
      // For downloads, return binary data directly
      const arrayBuffer = await response.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': responseContentType || 'application/pdf',
          'Content-Disposition': response.headers.get('content-disposition') || `attachment; filename="document.pdf"`,
        },
      });
    }

    // For JSON responses, parse and return
    const responseText = await response.text();
    
    // Try to parse as JSON, otherwise return as text
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Not JSON, return as-is
      return new NextResponse(responseText, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': responseContentType || 'text/plain',
        },
      });
    }

    // Return JSON response
    return NextResponse.json(responseData, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error('SignNow proxy error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
