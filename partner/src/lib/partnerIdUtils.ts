/**
 * PartnerId Utilities
 * Ensures consistent PartnerId generation across the application
 */

import crypto from 'crypto';

/**
 * Generate PartnerId from email using UUID v5
 * This MUST match the backend implementation exactly
 */
export function generatePartnerId(email: string): string {
  if (!email || !email.trim()) {
    throw new Error('Email is required to generate PartnerId');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const NAMESPACE_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  
  const namespaceBytes = Buffer.from(NAMESPACE_UUID.replace(/-/g, ''), 'hex');
  const emailBytes = Buffer.from(normalizedEmail, 'utf8');
  
  const hash = crypto
    .createHash('sha1')
    .update(Buffer.concat([namespaceBytes, emailBytes]))
    .digest();
  
  // Set version (5) and variant bits
  hash[6] = (hash[6] & 0x0f) | 0x50; // Version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // Variant
  
  const partnerId = [
    hash.toString('hex', 0, 4),
    hash.toString('hex', 4, 6),
    hash.toString('hex', 6, 8),
    hash.toString('hex', 8, 10),
    hash.toString('hex', 10, 16),
  ].join('-');

  return partnerId;
}

/**
 * Validate that a PartnerId matches an email
 */
export function validatePartnerIdForEmail(
  partnerId: string,
  email: string
): { valid: boolean; expectedPartnerId?: string; reason?: string } {
  if (!partnerId || !email) {
    return {
      valid: false,
      reason: 'PartnerId and email are required',
    };
  }

  try {
    const expectedPartnerId = generatePartnerId(email);
    const valid = partnerId.toLowerCase() === expectedPartnerId.toLowerCase();

    return {
      valid,
      expectedPartnerId,
      reason: valid ? undefined : 'PartnerId does not match email',
    };
  } catch (error) {
    return {
      valid: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Compare two PartnerIds (case-insensitive)
 */
export function comparePartnerIds(partnerId1: string, partnerId2: string): boolean {
  if (!partnerId1 || !partnerId2) return false;
  return partnerId1.toLowerCase().trim() === partnerId2.toLowerCase().trim();
}

/**
 * Validate PartnerId format (UUID)
 */
export function isValidPartnerIdFormat(partnerId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(partnerId);
}

/**
 * Get PartnerId from session or generate from email
 */
export async function getPartnerIdFromSession(
  session: { user?: { email?: string } } | null
): Promise<string | null> {
  if (!session?.user?.email) {
    return null;
  }

  try {
    return generatePartnerId(session.user.email);
  } catch (error) {
    console.error('[PartnerId] Failed to generate PartnerId:', error);
    return null;
  }
}
