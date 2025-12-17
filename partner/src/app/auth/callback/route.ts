import { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * OAuth callback handler for Keycloak
 * 
 * This route exists because Keycloak is configured with /auth/callback as the redirect URI.
 * We directly invoke NextAuth's handler here to process the OAuth callback.
 * 
 * The authorization request uses redirect_uri=/auth/callback, so the callback
 * must be handled at this same path for the OAuth flow to work correctly.
 */

// Create the NextAuth handler
const handler = NextAuth(authOptions);

export async function GET(request: NextRequest) {
  console.info('[Auth Callback] Processing OAuth callback at /auth/callback');
  console.info('[Auth Callback] Query params:', request.nextUrl.searchParams.toString());
  
  // Invoke NextAuth's handler directly
  // NextAuth will handle the token exchange using the same redirect_uri
  return handler(request, { params: { nextauth: ['callback', 'keycloak'] } });
}

export async function POST(request: NextRequest) {
  console.info('[Auth Callback] Processing POST OAuth callback at /auth/callback');
  return handler(request, { params: { nextauth: ['callback', 'keycloak'] } });
}

