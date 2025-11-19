/**
 * Sentry error reporting utilities
 * Use these functions instead of console.error/warn for proper error tracking
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Report an error to Sentry with optional context
 */
export function reportError(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
    user?: {
      id?: string;
      email?: string;
      username?: string;
    };
  }
): void {
  if (error instanceof Error) {
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      level: context?.level || "error",
      user: context?.user,
    });
  } else {
    // For non-Error objects, create an Error from the value
    const errorMessage = typeof error === "string" ? error : JSON.stringify(error);
    Sentry.captureException(new Error(errorMessage), {
      tags: context?.tags,
      extra: { originalError: error, ...context?.extra },
      level: context?.level || "error",
      user: context?.user,
    });
  }
}

/**
 * Report a warning to Sentry
 */
export function reportWarning(
  message: string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): void {
  Sentry.captureMessage(message, {
    level: "warning",
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Report an API error with request context
 */
export function reportApiError(
  error: Error | unknown,
  apiContext: {
    endpoint: string;
    method?: string;
    statusCode?: number;
    responseBody?: string;
    requestBody?: unknown;
  },
  additionalContext?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  reportError(error, {
    tags: {
      error_type: "api_error",
      api_endpoint: apiContext.endpoint,
      api_method: apiContext.method || "GET",
      ...additionalContext?.tags,
    },
    extra: {
      api_endpoint: apiContext.endpoint,
      api_method: apiContext.method,
      status_code: apiContext.statusCode,
      response_body: apiContext.responseBody,
      request_body: apiContext.requestBody,
      ...additionalContext?.extra,
    },
  });
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user: {
  id?: string;
  email?: string;
  username?: string;
  name?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username || user.name,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category: category || "default",
    level: level || "info",
    data,
  });
}

/**
 * Wrap an async function to automatically capture errors
 */
export function withErrorReporting<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError(error, context);
      throw error; // Re-throw to maintain original behavior
    }
  }) as T;
}

/**
 * Wrap a sync function to automatically capture errors
 */
export function withErrorReportingSync<T extends (...args: any[]) => any>(
  fn: T,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      reportError(error, context);
      throw error; // Re-throw to maintain original behavior
    }
  }) as T;
}

