/**
 * Security Audit Logging
 * Tracks security-relevant events for monitoring and compliance
 */

export enum SecurityEventType {
  AUTHENTICATION_SUCCESS = 'AUTHENTICATION_SUCCESS',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  AUTHORIZATION_SUCCESS = 'AUTHORIZATION_SUCCESS',
  AUTHORIZATION_FAILURE = 'AUTHORIZATION_FAILURE',
  OWNERSHIP_VALIDATION_SUCCESS = 'OWNERSHIP_VALIDATION_SUCCESS',
  OWNERSHIP_VALIDATION_FAILURE = 'OWNERSHIP_VALIDATION_FAILURE',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
}

export enum SecuritySeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface SecurityEvent {
  timestamp: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userEmail?: string;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  action?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  success: boolean;
}

class SecurityAuditLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000; // Keep last 1000 events in memory

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Add to in-memory store
    this.events.push(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.shift(); // Remove oldest event
    }

    // Log to console with appropriate level
    const logMessage = this.formatLogMessage(fullEvent);
    switch (event.severity) {
      case SecuritySeverity.CRITICAL:
      case SecuritySeverity.ERROR:
        console.error(logMessage);
        break;
      case SecuritySeverity.WARNING:
        console.warn(logMessage);
        break;
      default:
        console.info(logMessage);
    }

    // In production, you would also send to:
    // - External logging service (e.g., Datadog, Splunk)
    // - SIEM system
    // - Database for compliance/audit trail
  }

  /**
   * Format log message for console output
   */
  private formatLogMessage(event: SecurityEvent): string {
    const parts = [
      `[SECURITY ${event.severity}]`,
      event.type,
      event.success ? '✅' : '❌',
    ];

    if (event.userEmail) parts.push(`user=${event.userEmail}`);
    if (event.resourceType) parts.push(`resource=${event.resourceType}`);
    if (event.resourceId) parts.push(`id=${event.resourceId}`);
    if (event.action) parts.push(`action=${event.action}`);

    if (event.details) {
      parts.push(JSON.stringify(event.details));
    }

    return parts.join(' ');
  }

  /**
   * Get recent security events (for monitoring dashboard)
   */
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: SecurityEventType, limit: number = 100): SecurityEvent[] {
    return this.events.filter((e) => e.type === type).slice(-limit);
  }

  /**
   * Get failed authorization attempts (potential attacks)
   */
  getFailedAuthorizations(limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(
        (e) =>
          (e.type === SecurityEventType.AUTHORIZATION_FAILURE ||
            e.type === SecurityEventType.OWNERSHIP_VALIDATION_FAILURE) &&
          !e.success
      )
      .slice(-limit);
  }

  /**
   * Clear all events (use with caution)
   */
  clear(): void {
    this.events = [];
    console.info('[SECURITY] Audit log cleared');
  }
}

// Singleton instance
export const securityAudit = new SecurityAuditLogger();

// Helper functions for common security events

export function logAuthenticationSuccess(userEmail: string, userId?: string): void {
  securityAudit.log({
    type: SecurityEventType.AUTHENTICATION_SUCCESS,
    severity: SecuritySeverity.INFO,
    userEmail,
    userId,
    success: true,
  });
}

export function logAuthenticationFailure(details?: Record<string, any>): void {
  securityAudit.log({
    type: SecurityEventType.AUTHENTICATION_FAILURE,
    severity: SecuritySeverity.WARNING,
    success: false,
    details,
  });
}

export function logOwnershipValidationSuccess(
  userEmail: string,
  resourceType: string,
  resourceId: string
): void {
  securityAudit.log({
    type: SecurityEventType.OWNERSHIP_VALIDATION_SUCCESS,
    severity: SecuritySeverity.INFO,
    userEmail,
    resourceType,
    resourceId,
    success: true,
  });
}

export function logOwnershipValidationFailure(
  userEmail: string | undefined,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
): void {
  securityAudit.log({
    type: SecurityEventType.OWNERSHIP_VALIDATION_FAILURE,
    severity: SecuritySeverity.ERROR,
    userEmail,
    resourceType,
    resourceId,
    success: false,
    details,
  });
}

export function logSuspiciousActivity(
  userEmail: string | undefined,
  action: string,
  details: Record<string, any>
): void {
  securityAudit.log({
    type: SecurityEventType.SUSPICIOUS_ACTIVITY,
    severity: SecuritySeverity.CRITICAL,
    userEmail,
    action,
    success: false,
    details,
  });
}

export function logDataAccess(
  userEmail: string,
  resourceType: string,
  resourceId: string,
  action: string = 'READ'
): void {
  securityAudit.log({
    type: SecurityEventType.DATA_ACCESS,
    severity: SecuritySeverity.INFO,
    userEmail,
    resourceType,
    resourceId,
    action,
    success: true,
  });
}

export function logDataModification(
  userEmail: string,
  resourceType: string,
  resourceId: string,
  action: string
): void {
  securityAudit.log({
    type: SecurityEventType.DATA_MODIFICATION,
    severity: SecuritySeverity.INFO,
    userEmail,
    resourceType,
    resourceId,
    action,
    success: true,
  });
}
