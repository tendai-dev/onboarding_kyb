/**
 * DEPRECATED: Token persistence utilities
 * 
 * SECURITY: Tokens are now stored server-side in Redis via NextAuth
 * This file is kept for compatibility but token storage functions are disabled
 * All token access is handled server-side by the API proxy
 */

// Use a global variable to persist state across Fast Refresh (for auth status only, not tokens)
declare global {
  var __authState: {
    lastCheck?: number;
    isAuthenticated?: boolean;
  };
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Initialize global state if it doesn't exist
  if (!global.__authState) {
    global.__authState = {};
  }
}

/**
 * Cache authentication check result for a short period during development
 * This prevents unnecessary redirects during Fast Refresh
 * Note: This only caches auth status, not tokens (tokens are server-side)
 */
export function cacheAuthCheck(isAuthenticated: boolean): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;
  
  global.__authState = {
    lastCheck: Date.now(),
    isAuthenticated
  };
}

/**
 * Get cached authentication status if it's still fresh
 * Returns null if cache is stale or doesn't exist
 */
export function getCachedAuthCheck(): boolean | null {
  if (typeof window === 'undefined') return null;
  if (process.env.NODE_ENV !== 'development') return null;
  
  const cache = global.__authState;
  if (!cache || !cache.lastCheck) return null;
  
  // Cache is valid for 2 seconds during development
  const isFresh = Date.now() - cache.lastCheck < 2000;
  
  return isFresh ? (cache.isAuthenticated ?? null) : null;
}

/**
 * DEPRECATED: Token backup is no longer needed
 * Tokens are stored server-side in Redis via NextAuth
 * This function is kept for compatibility but does nothing
 */
export function backupTokens(): void {
  // SECURITY: Tokens are stored server-side in Redis
  // No need to backup tokens in localStorage/sessionStorage
  console.warn('[DEPRECATED] backupTokens() - tokens are stored server-side in Redis');
}

/**
 * DEPRECATED: Token restoration is no longer needed
 * Tokens are stored server-side in Redis via NextAuth
 * This function is kept for compatibility but does nothing
 */
export function restoreTokensIfNeeded(): boolean {
  // SECURITY: Tokens are stored server-side in Redis
  // No need to restore tokens from localStorage/sessionStorage
  console.warn('[DEPRECATED] restoreTokensIfNeeded() - tokens are stored server-side in Redis');
  return false;
}
