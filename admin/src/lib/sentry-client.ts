/**
 * Client-side Sentry utilities
 * This file ensures Sentry is only imported on the client side
 * Use this in React components and client-side code
 */

"use client";

import { 
  reportError, 
  reportWarning, 
  reportApiError, 
  setUserContext, 
  clearUserContext 
} from './sentry';

// Re-export for convenience
export { 
  reportError, 
  reportWarning, 
  reportApiError, 
  setUserContext, 
  clearUserContext 
};

// Convenience object for easier imports
export const clientSentry = {
  reportError,
  reportWarning,
  reportApiError,
  setUserContext,
  clearUserContext,
};

