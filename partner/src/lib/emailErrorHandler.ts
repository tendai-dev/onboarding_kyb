/**
 * Email Error Handler
 * Provides user-friendly error messages and error handling utilities
 */

export interface EmailError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  retryAfter?: number;
}

/**
 * Parse email API error and return user-friendly message
 * Note: Errors come from the backend API which uses SendGrid
 */
export function parseEmailError(error: unknown): EmailError {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Network error. Please check your internet connection and try again.',
        retryable: true,
      };
    }

    // Timeout errors
    if (errorMessage.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: error.message,
        userMessage: 'Request timed out. Please try again.',
        retryable: true,
        retryAfter: 5000, // 5 seconds
      };
    }

    // Authentication errors
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      return {
        code: 'AUTH_ERROR',
        message: error.message,
        userMessage: 'Authentication failed. Please log in again.',
        retryable: false,
      };
    }

    // Rate limit errors
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return {
        code: 'RATE_LIMIT_ERROR',
        message: error.message,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        retryable: true,
        retryAfter: 60000, // 1 minute
      };
    }

    // Server errors (5xx)
    if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
      return {
        code: 'SERVER_ERROR',
        message: error.message,
        userMessage: 'Server error. Please try again later.',
        retryable: true,
        retryAfter: 10000, // 10 seconds
      };
    }

    // Invalid email errors
    if (errorMessage.includes('invalid email') || errorMessage.includes('bad request')) {
      return {
        code: 'INVALID_EMAIL',
        message: error.message,
        userMessage: 'Invalid email address. Please check the email and try again.',
        retryable: false,
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: 'An error occurred while sending the email. Please try again.',
      retryable: true,
    };
  }

  // Unknown error type
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  return parseEmailError(error).userMessage;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return parseEmailError(error).retryable;
}

/**
 * Get retry delay for error
 */
export function getRetryDelay(error: unknown): number {
  const parsed = parseEmailError(error);
  return parsed.retryAfter || 1000; // Default 1 second
}

/**
 * Log email error with context
 */
export function logEmailError(
  error: unknown,
  context: {
    emailType: string;
    recipient: string;
    additionalInfo?: Record<string, any>;
  }
): void {
  const parsed = parseEmailError(error);
  
  console.error('[Email Error]', {
    code: parsed.code,
    message: parsed.message,
    userMessage: parsed.userMessage,
    retryable: parsed.retryable,
    context: {
      emailType: context.emailType,
      recipient: context.recipient,
      ...context.additionalInfo,
    },
  });
}

