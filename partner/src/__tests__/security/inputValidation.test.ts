import { describe, it, expect } from 'vitest';
import {
  validateInput,
  validateCaseId,
  detectSQLInjection,
  detectXSS,
  detectPathTraversal,
  isValidEmail,
  isValidUUID,
} from '@/lib/requestValidation';

describe('Input Validation Security Tests', () => {
  describe('SQL Injection Detection', () => {
    it('should detect OR-based SQL injection', () => {
      expect(detectSQLInjection("1' OR '1'='1")).toBe(true);
      expect(detectSQLInjection("admin' OR 1=1--")).toBe(true);
    });

    it('should detect UNION-based SQL injection', () => {
      expect(detectSQLInjection("1' UNION SELECT * FROM users--")).toBe(true);
    });

    it('should detect DROP TABLE attempts', () => {
      expect(detectSQLInjection("'; DROP TABLE users--")).toBe(true);
    });

    it('should allow normal input', () => {
      expect(detectSQLInjection('normal text')).toBe(false);
      expect(detectSQLInjection('user@example.com')).toBe(false);
    });
  });

  describe('XSS Detection', () => {
    it('should detect script tags', () => {
      expect(detectXSS('<script>alert("xss")</script>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(detectXSS('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(detectXSS('<img onerror="alert(1)">')).toBe(true);
      expect(detectXSS('<div onclick="malicious()">')).toBe(true);
    });

    it('should detect iframe injection', () => {
      expect(detectXSS('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    it('should allow normal HTML-like text', () => {
      expect(detectXSS('This is <b>bold</b> text')).toBe(false);
    });
  });

  describe('Path Traversal Detection', () => {
    it('should detect ../ patterns', () => {
      expect(detectPathTraversal('../../../etc/passwd')).toBe(true);
      expect(detectPathTraversal('..\\..\\..\\windows\\system32')).toBe(true);
    });

    it('should detect URL-encoded traversal', () => {
      expect(detectPathTraversal('%2e%2e%2f')).toBe(true);
    });

    it('should allow normal paths', () => {
      expect(detectPathTraversal('/api/cases/123')).toBe(false);
      expect(detectPathTraversal('documents/file.pdf')).toBe(false);
    });
  });

  describe('validateInput', () => {
    it('should reject SQL injection attempts', () => {
      const result = validateInput("1' OR '1'='1", 'test@example.com', 'test');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('SQL injection');
    });

    it('should reject XSS attempts', () => {
      const result = validateInput('<script>alert(1)</script>', 'test@example.com', 'test');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('XSS');
    });

    it('should reject path traversal attempts', () => {
      const result = validateInput('../../../etc/passwd', 'test@example.com', 'test');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Path traversal');
    });

    it('should accept and sanitize valid input', () => {
      const result = validateInput('  Valid Input  ', 'test@example.com', 'test');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Valid Input');
    });

    it('should reject empty input', () => {
      const result = validateInput('', 'test@example.com', 'test');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCaseId', () => {
    it('should accept valid UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = validateCaseId(uuid, 'test@example.com');
      
      expect(result.valid).toBe(true);
      expect(result.isGuid).toBe(true);
    });

    it('should accept valid case number', () => {
      const caseNumber = 'CASE-2024-001';
      const result = validateCaseId(caseNumber, 'test@example.com');
      
      expect(result.valid).toBe(true);
      expect(result.isGuid).toBe(false);
    });

    it('should reject SQL injection in case ID', () => {
      const malicious = "123' OR '1'='1";
      const result = validateCaseId(malicious, 'test@example.com');
      
      expect(result.valid).toBe(false);
    });

    it('should reject invalid format', () => {
      const invalid = 'not-a-valid-case-id!@#$%';
      const result = validateCaseId(invalid, 'test@example.com');
      
      expect(result.valid).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('UUID Validation', () => {
    it('should accept valid UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(false);
    });
  });
});
