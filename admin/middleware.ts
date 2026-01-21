import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get the session token from cookies
  const sessionToken =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  // If no session token, redirect to login
  // But check if we're already on login page to avoid redirect loops
  if (!sessionToken) {
    const url = new URL(request.url);
    // If already on login page, don't redirect (prevents loops)
    if (url.pathname === '/') {
      // Still add cache-control headers even on login page
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }
    
    const signInUrl = new URL('/', request.url);
    // Don't set callbackUrl if we're coming from logout or session expired to prevent loops
    const isLogout = url.searchParams.get('_logout');
    const isSessionExpired = url.searchParams.get('session_expired');
    // Also check if the request URL already has a callbackUrl (might be from previous redirect)
    const existingCallbackUrl = url.searchParams.get('callbackUrl');
    
    // CRITICAL: Never add callbackUrl if:
    // 1. Coming from logout
    // 2. Coming from session expired
    // 3. There's already a callbackUrl in the URL (prevents accumulation)
    // 4. The protected route is the login page itself
    // This prevents the callbackUrl from pointing to protected routes after logout
    if (!isLogout && !isSessionExpired && !existingCallbackUrl && url.pathname !== '/') {
      // Only add callbackUrl if the target is a protected route (not logout-related)
      const isProtectedRoute = url.pathname.startsWith('/dashboard') ||
                               url.pathname.startsWith('/applications') ||
                               url.pathname.startsWith('/work-queue') ||
                               url.pathname.startsWith('/risk-review') ||
                               url.pathname.startsWith('/approvals');
      
      if (isProtectedRoute) {
        // CRITICAL FIX: Prevent localhost from appearing in production callbackUrls
        // Use production domain from env vars, or relative path, never localhost
        const callbackPath = url.pathname + url.search;
        const requestOrigin = url.origin;
        
        // Get production domain from environment variables
        const productionDomain = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
        
        // If request origin is localhost, use relative path or production domain
        if (requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')) {
          if (productionDomain && !productionDomain.includes('localhost')) {
            // Use production domain from env vars
            const prodUrl = new URL(productionDomain);
            signInUrl.searchParams.set('callbackUrl', prodUrl.origin + callbackPath);
          } else {
            // Fallback: use relative path (no origin)
            signInUrl.searchParams.set('callbackUrl', callbackPath);
          }
        } else {
          // Request origin is already production domain, use it
          signInUrl.searchParams.set('callbackUrl', requestOrigin + callbackPath);
        }
      }
    }
    return NextResponse.redirect(signInUrl);
  }

  // Add cache-control headers to prevent bfcache issues after logout
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/applications/:path*',
    '/requirements/:path*',
    '/entity-types/:path*',
    '/audit-log/:path*',
    '/approvals/:path*',
    '/checklists/:path*',
    '/messages/:path*',
    '/notifications/:path*',
    '/reports/:path*',
    '/risk-review/:path*',
    '/work-queue/:path*',
    '/data-migration/:path*',
    '/refreshes/:path*',
  ],
};
