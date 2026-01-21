import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * OAuth callback handler for Keycloak
 * 
 * This route processes OAuth callbacks directly by invoking NextAuth's handler.
 * Keycloak should be configured to redirect to: {NEXTAUTH_URL}/auth/callback
 * 
 * IMPORTANT: The redirect_uri in the Keycloak provider config must match this URL
 * OR we need to update it to use /auth/callback instead of /api/auth/callback/keycloak
 */

const handler = NextAuth(authOptions);

export async function GET(request: NextRequest) {
  try {
    console.info('[Auth Callback] Processing OAuth callback at /auth/callback');
    console.info('[Auth Callback] Full URL:', request.url);
    console.info('[Auth Callback] Query params:', request.nextUrl.searchParams.toString());
    
    // Check for OAuth errors from Keycloak
    const error = request.nextUrl.searchParams.get('error');
    const errorDescription = request.nextUrl.searchParams.get('error_description');
    
    if (error) {
      console.error('[Auth Callback] OAuth error received from Keycloak:', {
        error,
        errorDescription: errorDescription ? decodeURIComponent(errorDescription) : undefined,
      });
      // Redirect to login page with error
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('error', error);
      if (errorDescription) {
        loginUrl.searchParams.set('error_description', errorDescription);
      }
      return NextResponse.redirect(loginUrl);
    }
    
    // Process the callback directly using NextAuth handler
    // We need to construct the request to match what NextAuth expects
    // The path should be /api/auth/callback/keycloak for NextAuth to recognize it
    const nextAuthPath = '/api/auth/callback/keycloak';
    
    // Create a new request with the correct path but same query params
    const nextAuthUrl = new URL(nextAuthPath, request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      nextAuthUrl.searchParams.set(key, value);
    });
    
    // Create a new request object with the correct URL
    const nextAuthRequest = new NextRequest(nextAuthUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    console.info('[Auth Callback] Invoking NextAuth handler with path:', nextAuthPath);
    
    // Invoke NextAuth handler with the callback path
    const response = await handler(nextAuthRequest, {
      params: { nextauth: ['callback', 'keycloak'] },
    });
    
    console.info('[Auth Callback] NextAuth handler completed, status:', response.status);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Auth Callback] ❌ CRITICAL ERROR processing callback:', {
      error: errorMessage,
      stack: errorStack,
      url: request.url,
      queryParams: request.nextUrl.searchParams.toString(),
    });
    
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('error', 'Callback');
    loginUrl.searchParams.set('error_description', errorMessage);
    return NextResponse.redirect(loginUrl);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.info('[Auth Callback] Processing POST OAuth callback at /auth/callback');
    
    // Same processing as GET
    const nextAuthPath = '/api/auth/callback/keycloak';
    const nextAuthUrl = new URL(nextAuthPath, request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      nextAuthUrl.searchParams.set(key, value);
    });
    
    const nextAuthRequest = new NextRequest(nextAuthUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    const response = await handler(nextAuthRequest, {
      params: { nextauth: ['callback', 'keycloak'] },
    });
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Auth Callback] ❌ CRITICAL ERROR in POST callback:', {
      error: errorMessage,
      url: request.url,
    });
    
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('error', 'Callback');
    loginUrl.searchParams.set('error_description', errorMessage);
    return NextResponse.redirect(loginUrl);
  }
}

