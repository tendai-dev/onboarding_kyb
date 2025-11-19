// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",
  
  // Enable capturing unhandled promise rejections
  captureUnhandledRejections: true,
  
  // Enable capturing uncaught exceptions
  captureUncaughtExceptions: true,
  
  // Set environment
  environment: process.env.NODE_ENV || "development",
  
  // Release tracking
  release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  
  // Filter out certain errors
  ignoreErrors: [
    // Network errors that are expected
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
    // Ignore specific error messages
    "Non-Error promise rejection captured",
  ],
  
  // Configure integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  
  // Before sending event to Sentry
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === "development" && !process.env.SENTRY_ENABLED) {
      return null;
    }
    
    // Add server-specific context
    if (event.request) {
      // Request context is already set
    }
    
    return event;
  },
});

