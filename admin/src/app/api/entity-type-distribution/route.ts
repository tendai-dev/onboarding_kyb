import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServerAccessToken } from '@/lib/get-server-token';

// Use 127.0.0.1 instead of localhost for better Node.js compatibility
const PROJECTIONS_API_BASE_URL = process.env.PROJECTIONS_API_BASE_URL || process.env.NEXT_PUBLIC_PROJECTIONS_API_BASE_URL || 'http://127.0.0.1:8007';

export async function GET(request: NextRequest) {
  try {
    // Get the session for user info
    const session = await getServerSession(authOptions);
    
    // Get access token from Redis (not from session)
    const accessToken = await getServerAccessToken(request);

    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');
    
    const url = `${PROJECTIONS_API_BASE_URL}/api/v1/entity-type-distribution${partnerId ? `?partnerId=${partnerId}` : ''}`;
    
    // Prepare headers with authentication token
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add Azure AD token from Redis if available
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Forward user identification headers if available
    if (session?.user) {
      const user = session.user as any;
      if (user.email) headers['X-User-Email'] = user.email;
      if (user.name) headers['X-User-Name'] = user.name;
      if (user.id) headers['X-User-Id'] = user.id;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Entity type distribution API error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Entity type distribution API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entity type distribution', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

