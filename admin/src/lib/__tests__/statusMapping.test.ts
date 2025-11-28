import { describe, it, expect } from 'vitest';
import {
  mapFrontendStatusToBackend,
  getStatusEndpoint,
  isGuid,
  generateGuidFromString,
  normalizeUserIdToGuid,
} from '../statusMapping';

describe('Status Mapping Utilities', () => {
  describe('mapFrontendStatusToBackend', () => {
    it('should map all frontend statuses to backend statuses', () => {
      expect(mapFrontendStatusToBackend('SUBMITTED')).toBe('Submitted');
      expect(mapFrontendStatusToBackend('IN PROGRESS')).toBe('InProgress');
      expect(mapFrontendStatusToBackend('RISK REVIEW')).toBe('PendingReview');
      expect(mapFrontendStatusToBackend('COMPLETE')).toBe('Approved');
      expect(mapFrontendStatusToBackend('APPROVED')).toBe('Approved');
      expect(mapFrontendStatusToBackend('DECLINED')).toBe('Rejected');
      expect(mapFrontendStatusToBackend('REJECTED')).toBe('Rejected');
    });

    it('should return status as-is if not in map', () => {
      expect(mapFrontendStatusToBackend('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
      expect(mapFrontendStatusToBackend('')).toBe('');
    });
  });

  describe('getStatusEndpoint', () => {
    it('should return approve endpoint for COMPLETE status', () => {
      expect(getStatusEndpoint('COMPLETE')).toBe('approve');
      expect(getStatusEndpoint('APPROVED')).toBe('approve');
    });

    it('should return reject endpoint for DECLINED status', () => {
      expect(getStatusEndpoint('DECLINED')).toBe('reject');
      expect(getStatusEndpoint('REJECTED')).toBe('reject');
    });

    it('should return status endpoint for other statuses', () => {
      expect(getStatusEndpoint('SUBMITTED')).toBe('status');
      expect(getStatusEndpoint('IN PROGRESS')).toBe('status');
      expect(getStatusEndpoint('RISK REVIEW')).toBe('status');
    });
  });

  describe('isGuid', () => {
    it('should identify valid GUIDs', () => {
      expect(isGuid('12345678-1234-1234-1234-123456789012')).toBe(true);
      expect(isGuid('00000000-0000-0000-0000-000000000000')).toBe(true);
      expect(isGuid('ABCDEFAB-CDEF-ABCD-EFAB-CDEFABCDEFAB')).toBe(true);
    });

    it('should reject invalid GUIDs', () => {
      expect(isGuid('not-a-guid')).toBe(false);
      expect(isGuid('12345678-1234-1234-1234')).toBe(false);
      expect(isGuid('12345678-1234-1234-1234-123456789012-extra')).toBe(false);
      expect(isGuid('')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isGuid('ABCDEFAB-CDEF-ABCD-EFAB-CDEFABCDEFAB')).toBe(true);
      expect(isGuid('abcdefab-cdef-abcd-efab-cdefabcdefab')).toBe(true);
      expect(isGuid('AbCdEfAb-CdEf-AbCd-EfAb-CdEfAbCdEfAb')).toBe(true);
    });
  });

  describe('generateGuidFromString', () => {
    it('should generate consistent GUIDs from same input', () => {
      const guid1 = generateGuidFromString('user-123');
      const guid2 = generateGuidFromString('user-123');
      expect(guid1).toBe(guid2);
    });

    it('should generate different GUIDs from different inputs', () => {
      const guid1 = generateGuidFromString('user-123');
      const guid2 = generateGuidFromString('user-456');
      expect(guid1).not.toBe(guid2);
    });

    it('should generate valid GUID format', () => {
      const guid = generateGuidFromString('test-input');
      expect(isGuid(guid)).toBe(true);
    });

    it('should handle empty string', () => {
      const guid = generateGuidFromString('');
      expect(isGuid(guid)).toBe(true);
    });

    it('should handle special characters', () => {
      const guid = generateGuidFromString('user@example.com');
      expect(isGuid(guid)).toBe(true);
    });
  });

  describe('normalizeUserIdToGuid', () => {
    it('should return GUID as-is if already a GUID', () => {
      const guid = '12345678-1234-1234-1234-123456789012';
      expect(normalizeUserIdToGuid(guid)).toBe(guid);
    });

    it('should generate GUID from non-GUID string', () => {
      const userId = 'user-123';
      const normalized = normalizeUserIdToGuid(userId);
      expect(isGuid(normalized)).toBe(true);
      expect(normalized).not.toBe(userId);
    });

    it('should generate consistent GUIDs for same input', () => {
      const userId = 'user-123';
      const normalized1 = normalizeUserIdToGuid(userId);
      const normalized2 = normalizeUserIdToGuid(userId);
      expect(normalized1).toBe(normalized2);
    });
  });
});

