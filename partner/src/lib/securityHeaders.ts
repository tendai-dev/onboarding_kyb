/**
 * Security Headers Utility
 * Provides consistent security headers across all API responses
 */

/**
 * Get standard security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Permitted-Cross-Domain-Policies': 'none',
  };
}

/**
 * Get Content Security Policy header
 * Customize based on your application's needs
 */
export function getCSPHeader(nonce?: string): string {
  const directives = [
    "default-src 'self'",
    nonce ? `script-src 'self' 'nonce-${nonce}'` : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  return directives.join('; ');
}

/**
 * Apply security headers to a Headers object
 */
export function applySecurityHeaders(headers: Headers, includeCSP: boolean = false): void {
  const securityHeaders = getSecurityHeaders();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  if (includeCSP) {
    headers.set('Content-Security-Policy', getCSPHeader());
  }
}

/**
 * Create a new Headers object with security headers
 */
export function createSecureHeaders(additionalHeaders?: Record<string, string>): Headers {
  const headers = new Headers();
  
  applySecurityHeaders(headers);
  
  if (additionalHeaders) {
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  return headers;
}

/**
 * Security headers for error responses
 */
export function getErrorResponseHeaders(status: number): Headers {
  const headers = createSecureHeaders({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  });

  // Add additional headers for specific error codes
  if (status === 401) {
    headers.set('WWW-Authenticate', 'Bearer realm="API"');
  }

  return headers;
}
