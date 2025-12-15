/**
 * Request Validation Utilities
 * Validates and sanitizes user input to prevent injection attacks
 */

import { logSuspiciousActivity } from './securityAudit';

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate case number format (alphanumeric with hyphens)
 */
export function isValidCaseNumber(caseNumber: string): boolean {
  const caseNumberRegex = /^[A-Z0-9-]{3,50}$/i;
  return caseNumberRegex.test(caseNumber);
}

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (!input) return '';
  
  // Remove control characters and limit length
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate PartnerId format (UUID)
 */
export function isValidPartnerId(partnerId: string): boolean {
  return isValidUUID(partnerId);
}

/**
 * Detect SQL injection attempts
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bOR\b|\bAND\b).*=.*=/i,
    /UNION.*SELECT/i,
    /DROP.*TABLE/i,
    /INSERT.*INTO/i,
    /DELETE.*FROM/i,
    /UPDATE.*SET/i,
    /EXEC(\s|\+)+(s|x)p\w+/i,
    /--/,
    /;.*DROP/i,
    /\/\*.*\*\//,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Detect XSS attempts
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Detect path traversal attempts
 */
export function detectPathTraversal(input: string): boolean {
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e\\/i,
  ];

  return pathTraversalPatterns.some((pattern) => pattern.test(input));
}

/**
 * Comprehensive input validation
 */
export function validateInput(
  input: string,
  userEmail?: string,
  context?: string
): { valid: boolean; sanitized: string; reason?: string } {
  if (!input) {
    return { valid: false, sanitized: '', reason: 'Empty input' };
  }

  // Check for SQL injection
  if (detectSQLInjection(input)) {
    logSuspiciousActivity(userEmail, 'sql_injection_attempt', {
      input: input.substring(0, 100),
      context,
    });
    return { valid: false, sanitized: '', reason: 'SQL injection detected' };
  }

  // Check for XSS
  if (detectXSS(input)) {
    logSuspiciousActivity(userEmail, 'xss_attempt', {
      input: input.substring(0, 100),
      context,
    });
    return { valid: false, sanitized: '', reason: 'XSS attempt detected' };
  }

  // Check for path traversal
  if (detectPathTraversal(input)) {
    logSuspiciousActivity(userEmail, 'path_traversal_attempt', {
      input: input.substring(0, 100),
      context,
    });
    return { valid: false, sanitized: '', reason: 'Path traversal detected' };
  }

  // Sanitize the input
  const sanitized = sanitizeString(input);

  return { valid: true, sanitized };
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  params: Record<string, string | string[] | undefined>,
  userEmail?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;

    const valueStr = Array.isArray(value) ? value.join(',') : value;
    const validation = validateInput(valueStr, userEmail, `query_param:${key}`);

    if (!validation.valid) {
      errors.push(`Invalid ${key}: ${validation.reason}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate case ID (UUID or case number)
 */
export function validateCaseId(
  caseId: string,
  userEmail?: string
): { valid: boolean; isGuid: boolean; sanitized: string; reason?: string } {
  const validation = validateInput(caseId, userEmail, 'case_id');
  
  if (!validation.valid) {
    return {
      valid: false,
      isGuid: false,
      sanitized: '',
      reason: validation.reason,
    };
  }

  const isGuid = isValidUUID(caseId);
  const isCaseNumber = isValidCaseNumber(caseId);

  if (!isGuid && !isCaseNumber) {
    logSuspiciousActivity(userEmail, 'invalid_case_id_format', {
      caseId: caseId.substring(0, 50),
    });
    return {
      valid: false,
      isGuid: false,
      sanitized: '',
      reason: 'Invalid case ID format',
    };
  }

  return {
    valid: true,
    isGuid,
    sanitized: validation.sanitized,
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page?: string | number,
  pageSize?: string | number
): { valid: boolean; page: number; pageSize: number; errors: string[] } {
  const errors: string[] = [];
  let validPage = 1;
  let validPageSize = 10;

  // Validate page
  if (page !== undefined) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Invalid page number');
    } else if (pageNum > 1000) {
      errors.push('Page number too large');
    } else {
      validPage = pageNum;
    }
  }

  // Validate pageSize
  if (pageSize !== undefined) {
    const pageSizeNum = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;
    if (isNaN(pageSizeNum) || pageSizeNum < 1) {
      errors.push('Invalid page size');
    } else if (pageSizeNum > 100) {
      errors.push('Page size too large (max 100)');
    } else {
      validPageSize = pageSizeNum;
    }
  }

  return {
    valid: errors.length === 0,
    page: validPage,
    pageSize: validPageSize,
    errors,
  };
}
