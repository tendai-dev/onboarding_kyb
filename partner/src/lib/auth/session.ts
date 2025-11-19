// SECURITY: Tokens are now stored server-side in Redis via NextAuth
// This file provides compatibility functions that use NextAuth session instead of localStorage
// All token access is handled server-side by the API proxy

import { signOut } from "next-auth/react";

export type AuthUser = {
  sub?: string;
  name: string;
  email?: string;
  givenName?: string;
  familyName?: string;
};

/**
 * Check if user is authenticated using NextAuth session
 * Note: This is a synchronous check that may not be accurate during initial load
 * For accurate checks, use useSession() hook in React components
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if session cookie exists (basic check)
  // For accurate authentication status, use useSession() hook
  const cookies = document.cookie.split(';');
  const hasSessionCookie = cookies.some(cookie => 
    cookie.trim().startsWith('next-auth.session-token=') || 
    cookie.trim().startsWith('__Secure-next-auth.session-token=')
  );
  
  return hasSessionCookie;
}

/**
 * SECURITY: Tokens are stored server-side in Redis
 * This function returns null - tokens should never be accessed from the frontend
 * The API proxy automatically injects tokens from Redis based on the session cookie
 */
export async function getAccessToken(): Promise<string | null> {
  // SECURITY: Do not return tokens from frontend
  // Tokens are stored server-side in Redis and injected by the proxy
  console.warn('[SECURITY] getAccessToken() called - tokens are server-side only. Use API proxy instead.');
  return null;
}

/**
 * SECURITY: Token refresh is handled server-side by NextAuth
 * This function is deprecated - NextAuth handles token refresh automatically
 */
export async function refreshToken(): Promise<boolean> {
  // Token refresh is handled server-side by NextAuth
  // No action needed from frontend
  console.warn('[SECURITY] refreshToken() called - token refresh is handled server-side by NextAuth');
  return false;
}

/**
 * Get authenticated user from NextAuth session
 * Note: This is a synchronous function that may not have accurate data during initial load
 * For accurate user data in React components, use useSession() hook from next-auth/react
 * or useAuth() hook from AuthContext
 */
export function getAuthUser(): AuthUser {
  if (typeof window === 'undefined') {
    return { name: 'User' };
  }

  // Try to get user from NextAuth session via fetch (async but we return sync fallback)
  // For accurate data, components should use useSession() hook
  try {
    // Check if session cookie exists
    const cookies = document.cookie.split(';');
    const hasSessionCookie = cookies.some(cookie => 
      cookie.trim().startsWith('next-auth.session-token=') || 
      cookie.trim().startsWith('__Secure-next-auth.session-token=')
    );
    
    if (!hasSessionCookie) {
      return { name: 'User' };
    }
    
    // Try to get cached session data from sessionStorage (if available)
    // This is a fallback - components should use useSession() hook
    const sessionData = sessionStorage.getItem('nextauth.session.user');
    if (sessionData) {
      try {
        const user = JSON.parse(sessionData);
        return {
          sub: user.id || user.email,
          name: user.name || user.email || 'User',
          email: user.email,
        };
      } catch {
        // Invalid session data
      }
    }
  } catch {
    // Session storage not available or error
  }

  // Fallback: return default user
  // Components should use useSession() hook or useAuth() for accurate data
  return {
    name: 'User',
  };
}

/**
 * Clear session and sign out using NextAuth
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  
  // SECURITY: Clear any legacy localStorage tokens (shouldn't exist, but clean up just in case)
  // Tokens are now stored server-side in Redis, but we clean up localStorage for safety
  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('token_expires_at');
  } catch {
    // Ignore errors if localStorage is not available
  }
  
  // Clear session storage
  sessionStorage.removeItem('nextauth.session.user');
  
  // Sign out using NextAuth (this will clear the session cookie)
  signOut({ callbackUrl: '/auth/login' });
}

/**
 * Redirect to login page
 */
function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  
  // Don't redirect if already on auth pages
  if (window.location.pathname.startsWith('/auth/')) return;
  
  // Use replace to avoid adding to history
  try {
    window.location.replace('/auth/login');
  } catch {
    window.location.href = '/auth/login';
  }
}

/**
 * Build logout URL for Keycloak
 * Note: NextAuth handles logout, but this is kept for compatibility
 */
export function buildLogoutUrl(postLogoutRedirectUri: string): string {
  // NextAuth handles logout, but if needed for Keycloak direct logout:
  const keycloakIssuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || 'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru';
  const base = `${keycloakIssuer}/protocol/openid-connect/logout`;
  const url = new URL(base);
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  return url.toString();
}

/**
 * Logout user using NextAuth
 */
export function logout(postLogoutRedirectUri: string = '/auth/login') {
  // Use NextAuth signOut which handles session cleanup
  signOut({ callbackUrl: postLogoutRedirectUri });
}

/**
 * Get user initials from name
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * DEPRECATED: Token expiration check is handled server-side
 * This function is kept for compatibility but always returns false
 */
export function isTokenExpired(bufferSeconds: number = 120): boolean {
  // Token expiration is handled server-side by NextAuth
  // This function is deprecated
  console.warn('[DEPRECATED] isTokenExpired() - token expiration is handled server-side');
  return false;
}
