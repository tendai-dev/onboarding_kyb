import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.ONBOARDING_TARGET || 'http://onboarding-api:8001';

async function forwardRequest(request: NextRequest, method: string) {
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/v1/country-configurations${url.search}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-User-Id': '633a7e94-62e5-be57-97ee-ecf58cedbd75',
    'X-User-Email': 'admin@mukuru.com',
    'X-User-Name': 'Admin User',
    'X-User-Role': 'Administrator',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const body = await request.json();
      options.body = JSON.stringify(body);
    } catch {
      // No body or invalid JSON
    }
  }

  try {
    const response = await fetch(backendUrl, options);
    const contentType = response.headers.get('content-type');

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': contentType || 'text/plain' },
    });
  } catch (error) {
    console.error('Country configurations API error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend', details: String(error) },
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
