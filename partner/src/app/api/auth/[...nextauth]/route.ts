import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const handler = NextAuth(authOptions);

// NextAuth App Router handlers with comprehensive error handling
// Note: In Next.js App Router, params might be a Promise
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> | { nextauth: string[] } }
) {
  try {
    // Resolve params if it's a Promise (Next.js 15+)
    const params = await Promise.resolve(context.params);
    
    const isCallback = request.nextUrl.pathname.includes('/callback');
    
    console.info('[NextAuth Handler] GET request:', {
      path: request.nextUrl.pathname,
      searchParams: request.nextUrl.searchParams.toString(),
      nextauth: params.nextauth,
      isCallback,
      hasCode: request.nextUrl.searchParams.has('code'),
      hasState: request.nextUrl.searchParams.has('state'),
      hasError: request.nextUrl.searchParams.has('error'),
    });
    
    // Call NextAuth handler
    const response = await handler(request, { params });
    
    if (isCallback) {
      console.info('[NextAuth Handler] Callback processed successfully');
    }
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[NextAuth Handler] ❌ CRITICAL ERROR in GET handler:', {
      error: errorMessage,
      stack: errorStack,
      path: request.nextUrl.pathname,
      searchParams: request.nextUrl.searchParams.toString(),
      isCallback: request.nextUrl.pathname.includes('/callback'),
    });
    
    // If it's a callback error, redirect to login with error details
    if (request.nextUrl.pathname.includes('/callback')) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('error', 'Callback');
      loginUrl.searchParams.set('error_description', errorMessage);
      return NextResponse.redirect(loginUrl);
    }
    
    // Re-throw for non-callback errors to let NextAuth handle it
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> | { nextauth: string[] } }
) {
  try {
    // Resolve params if it's a Promise (Next.js 15+)
    const params = await Promise.resolve(context.params);
    
    const isCallback = request.nextUrl.pathname.includes('/callback');
    
    console.info('[NextAuth Handler] POST request:', {
      path: request.nextUrl.pathname,
      nextauth: params.nextauth,
      isCallback,
    });
    
    const response = await handler(request, { params });
    
    if (isCallback) {
      console.info('[NextAuth Handler] POST callback processed successfully');
    }
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[NextAuth Handler] ❌ CRITICAL ERROR in POST handler:', {
      error: errorMessage,
      stack: errorStack,
      path: request.nextUrl.pathname,
      isCallback: request.nextUrl.pathname.includes('/callback'),
    });
    
    // If it's a callback error, redirect to login with error details
    if (request.nextUrl.pathname.includes('/callback')) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('error', 'Callback');
      loginUrl.searchParams.set('error_description', errorMessage);
      return NextResponse.redirect(loginUrl);
    }
    
    // Re-throw for non-callback errors
    throw error;
  }
}
