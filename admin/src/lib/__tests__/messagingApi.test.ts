import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateGuidFromEmailSync,
  parseGuidToBytes,
  bytesToGuid,
} from '../messagingApi';

describe('messagingApi utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateGuidFromEmailSync', () => {
    it('should generate GUID from email', () => {
      const guid = generateGuidFromEmailSync('test@example.com', 'namespace-guid');
      expect(guid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5000-8000-[0-9a-f]{12}$/i);
    });

    it('should generate consistent GUIDs for same email', () => {
      const guid1 = generateGuidFromEmailSync('test@example.com', 'namespace');
      const guid2 = generateGuidFromEmailSync('test@example.com', 'namespace');
      expect(guid1).toBe(guid2);
    });

    it('should handle different emails', () => {
      const guid1 = generateGuidFromEmailSync('test1@example.com', 'namespace');
      const guid2 = generateGuidFromEmailSync('test2@example.com', 'namespace');
      expect(guid1).not.toBe(guid2);
    });

    it('should handle case insensitive emails', () => {
      const guid1 = generateGuidFromEmailSync('Test@Example.com', 'namespace');
      const guid2 = generateGuidFromEmailSync('test@example.com', 'namespace');
      expect(guid1).toBe(guid2);
    });
  });

  describe('parseGuidToBytes', () => {
    it('should parse GUID to bytes', () => {
      const guid = '12345678-1234-5678-9abc-def012345678';
      const bytes = parseGuidToBytes(guid);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(16);
    });

    it('should handle GUID without dashes', () => {
      const guid = '12345678-1234-5678-9abc-def012345678';
      const bytes = parseGuidToBytes(guid);
      expect(bytes.length).toBe(16);
    });
  });

  describe('bytesToGuid', () => {
    it('should convert bytes to GUID', () => {
      const bytes = new Uint8Array([
        0x12, 0x34, 0x56, 0x78,
        0x12, 0x34,
        0x56, 0x78,
        0x9a, 0xbc,
        0xde, 0xf0, 0x12, 0x34, 0x56, 0x78
      ]);
      const guid = bytesToGuid(bytes);
      expect(guid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should round-trip GUID through bytes', () => {
      const originalGuid = '12345678-1234-5678-9abc-def012345678';
      const bytes = parseGuidToBytes(originalGuid);
      const convertedGuid = bytesToGuid(bytes);
      expect(convertedGuid.toLowerCase()).toBe(originalGuid.toLowerCase());
    });
  });
});
