import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Set correct MIME types for static assets
  if (pathname.startsWith('/_next/static/')) {
    const response = NextResponse.next();

    // Set Content-Type based on file extension
    if (pathname.endsWith('.js')) {
      response.headers.set('Content-Type', 'application/javascript; charset=utf-8');
      response.headers.set('X-Content-Type-Options', 'nosniff');
    } else if (pathname.endsWith('.css')) {
      response.headers.set('Content-Type', 'text/css; charset=utf-8');
      response.headers.set('X-Content-Type-Options', 'nosniff');
    } else if (pathname.endsWith('.json')) {
      response.headers.set('Content-Type', 'application/json; charset=utf-8');
    } else if (pathname.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/)) {
      const ext = pathname.split('.').pop();
      const mimeTypes: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        ico: 'image/x-icon',
        svg: 'image/svg+xml',
        webp: 'image/webp',
      };
      response.headers.set('Content-Type', mimeTypes[ext || ''] || 'application/octet-stream');
    }

    // Cache static assets
    if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$/)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match static files to set correct MIME types
    '/_next/static/:path*',
    // Also match other routes for other middleware logic if needed
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

