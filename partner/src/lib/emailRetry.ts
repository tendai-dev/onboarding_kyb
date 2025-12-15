/**
 * Email Retry Utility
 * Handles retry logic for failed email sends
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'network',
    'timeout',
    '503',
    '502',
    '500',
    'rate limit',
    'temporary',
  ],
};

/**
 * Retry email sending with exponential backoff
 */
export async function retryEmailSend(
  emailFn: () => Promise<{ success: boolean; error?: string }>,
  options: RetryOptions = {}
): Promise<{ success: boolean; error?: string; attempts: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let delay = opts.initialDelay;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await emailFn();

      if (result.success) {
        return { ...result, attempts: attempt };
      }

      // Check if error is retryable
      const error = result.error || '';
      const isRetryable = opts.retryableErrors.some((retryableError) =>
        error.toLowerCase().includes(retryableError.toLowerCase())
      );

      if (!isRetryable) {
        // Non-retryable error (e.g., invalid email, authentication error)
        return { success: false, error, attempts: attempt };
      }

      lastError = error;

      // If not the last attempt, wait before retrying
      if (attempt < opts.maxRetries) {
        console.warn(
          `[Email Retry] Attempt ${attempt} failed, retrying in ${delay}ms...`,
          { error }
        );
        await sleep(delay);
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      // If not the last attempt, wait before retrying
      if (attempt < opts.maxRetries) {
        console.warn(
          `[Email Retry] Attempt ${attempt} threw error, retrying in ${delay}ms...`,
          { error: lastError }
        );
        await sleep(delay);
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
      }
    }
  }

  return {
    success: false,
    error: lastError || 'Max retries exceeded',
    attempts: opts.maxRetries,
  };
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: string | Error): boolean {
  const errorMessage =
    error instanceof Error ? error.message : error.toLowerCase();
  
  return DEFAULT_OPTIONS.retryableErrors.some((retryableError) =>
    errorMessage.includes(retryableError.toLowerCase())
  );
}

