/**
 * Centralized logging utility
 * Replaces console.log/warn/error with proper logging that can be controlled
 * and integrated with Sentry in production
 */

import * as Sentry from '@sentry/nextjs';
import { reportError, reportWarning, addBreadcrumb } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: LogLevel;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log info messages
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${message}`, ...args);
    }
    // Add breadcrumb in production for debugging
    if (this.isProduction) {
      addBreadcrumb(message, 'info', 'info' as Sentry.SeverityLevel, { args });
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, options?: LogOptions): void {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`);
    
    // Report to Sentry in production
    if (this.isProduction) {
      reportWarning(message, {
        tags: options?.tags,
        extra: options?.extra,
      });
    }
  }

  /**
   * Log error messages
   */
  error(error: Error | unknown, message?: string, options?: LogOptions): void {
    const errorMessage = message || (error instanceof Error ? error.message : String(error));
    
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${errorMessage}`, error);
    
    // Map LogLevel to Sentry.SeverityLevel
    const sentryLevel: Sentry.SeverityLevel = 
      options?.level === 'warn' ? 'warning' : 
      options?.level === 'error' ? 'error' : 
      options?.level === 'info' ? 'info' : 
      'error';
    
    // Report to Sentry
    reportError(error, {
      tags: options?.tags,
      extra: options?.extra,
      level: sentryLevel,
    });
  }

  /**
   * Log with context (replaces console.log with structured logging)
   */
  log(message: string, context?: Record<string, unknown>, level: LogLevel = 'info'): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(`[${level.toUpperCase()}] ${message}`, context || '');
    }
    
    // Add breadcrumb in production
    if (this.isProduction && level !== 'debug') {
      const sentryLevel: Sentry.SeverityLevel = 
        level === 'warn' ? 'warning' : level === 'error' ? 'error' : 'info';
      addBreadcrumb(message, 'log', sentryLevel, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };

