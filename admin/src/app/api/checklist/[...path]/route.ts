import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Get backend URL from environment
const getBackendUrl = () => {
  return process.env.PROXY_TARGET || 
         process.env.ONBOARDING_TARGET ||
         process.env.NEXT_PUBLIC_GATEWAY_URL || 
         process.env.NEXT_PUBLIC_BACKEND_URL ||
         'http://localhost:8001';
};

/**
 * Checklist API route - calls backend directly with user headers
 * Backend uses X-User-* headers for authorization when no Bearer token is present
 */
async function forwardRequest(request: NextRequest, method: string) {
  try {
    const session = await auth();
    const pathname = request.nextUrl.pathname;
    const pathAfterChecklist = pathname.replace('/api/checklist', '') || '';
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Remove leading slash and handle empty path
    const servicePath = pathAfterChecklist.startsWith('/')
      ? pathAfterChecklist.substring(1)
      : pathAfterChecklist;

    // Build the backend path
    // servicePath will be like "checklists" or "checklists/377ddc8b-..." 
    // We need to map to /api/v1/checklists or /api/v1/checklists/377ddc8b-...
    let backendPath = '/api/v1/checklists';
    if (servicePath) {
      if (servicePath === 'checklists') {
        // Just /api/checklist/checklists -> /api/v1/checklists
        backendPath = '/api/v1/checklists';
      } else if (servicePath.startsWith('checklists/')) {
        // /api/checklist/checklists/{id} -> /api/v1/checklists/{id}
        const idPart = servicePath.substring('checklists/'.length);
        backendPath = `/api/v1/checklists/${idPart}`;
      } else {
        // Other paths like /api/checklist/something -> /api/v1/checklists/something
        backendPath = `/api/v1/checklists/${servicePath}`;
      }
    }

    // Call backend directly with user headers
    const backendUrl = getBackendUrl();
    const apiUrl = `${backendUrl}${backendPath}${queryString ? `?${queryString}` : ''}`;

    // Prepare headers - backend accepts X-User-* headers for admin portal requests
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-User-Email': session?.user?.email || 'admin@mukuru.com',
      'X-User-Name': session?.user?.name || 'Admin User',
      'X-User-Role': 'Administrator',
    };

    // Add user identification headers
    if (session?.user) {
      const user = session.user as Record<string, unknown>;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      if (user.role) headers['X-User-Role'] = String(user.role) || 'Administrator';
    }

    // Get request body if present
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch {
        // No body
      }
    }

    // Log the request for debugging
    console.log(`[ChecklistProxy] ${method} ${apiUrl}`);
    if (body) {
      console.log(`[ChecklistProxy] Body: ${body.substring(0, 500)}...`);
    }

    // Call backend directly
    const response = await fetch(apiUrl, {
      method,
      headers,
      body: body || undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    
    console.log(`[ChecklistProxy] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText,
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
        error: 'Failed to process checklist request',
        message: errorMessage,
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
