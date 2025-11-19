import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Trends API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');
    const days = searchParams.get('days') || '7';
    
    // Build proxy URL - proxy will handle token injection and refresh
    const proxyPath = `/api/proxy/projections/v1/trends${partnerId ? `?partnerId=${partnerId}` : ''}`;
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Trends API error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Get last N days from the trends data
    const lastNDays = Array.isArray(data) ? data.slice(-parseInt(days)) : [];
    
    // Map to frontend format
    const mappedData = lastNDays.map((trend: any) => ({
      date: new Date(trend.date).toISOString().split('T')[0],
      applications: trend.newCases || 0,
      completed: trend.completedCases || 0,
    }));
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error('Trends API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

