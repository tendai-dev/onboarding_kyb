// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry if DSN is provided and not in development
if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.1,
    
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  
  // Enable capturing unhandled promise rejections
  captureUnhandledRejections: true,
  
  // Enable capturing uncaught exceptions
  captureUncaughtExceptions: true,
  
  // Set environment
  environment: process.env.NODE_ENV || "development",
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  
  // Filter out certain errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "atomicFindClose",
    "fb_xd_fragment",
    "bmi_SafeAddOnload",
    "EBCallBackMessageReceived",
    "conduitPage",
    // Network errors that are expected
    "NetworkError",
    "Failed to fetch",
    "Network request failed",
    // Ignore specific error messages
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
  
  // Filter out certain URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],
  
  // Configure integrations
  // BrowserTracing and Replay are automatically included in @sentry/nextjs
  // No need to manually configure them unless using custom settings
  integrations: [
    // Integrations are automatically configured by @sentry/nextjs
  ],
  
    // Before sending event to Sentry
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SENTRY_ENABLED) {
        return null;
      }
      
      // Add additional context
      if (event.user) {
        // User context is already set
      }
      
      return event;
    },
  });
}

