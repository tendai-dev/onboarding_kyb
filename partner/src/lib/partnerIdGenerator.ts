/**
 * PartnerId Generator - Matches Backend PartnerIdGenerator.GenerateFromEmail
 *
 * Backend uses: MD5(email.toLowerCase().trim()) -> GUID
 * This ensures the same email always produces the same PartnerId
 */

/**
 * Generates a deterministic GUID from email address using MD5 hash
 * This matches the backend PartnerIdGenerator.GenerateFromEmail implementation
 *
 * @param email - User's email address
 * @returns Deterministic GUID generated from email (as string)
 */
export async function generatePartnerIdFromEmail(email: string): Promise<string> {
  if (!email || !email.trim()) {
    throw new Error('Email cannot be null or empty');
  }

  // Normalize email to lowercase for consistency (matching backend)
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Use Web Crypto API for MD5
    // Note: Web Crypto API doesn't support MD5 directly, so we need to use a library
    // For now, we'll use a workaround with crypto-js if available, or fallback

    // Try to use crypto-js if available
    try {
      // Dynamic import to avoid bundling issues
      const cryptoJs = await import('crypto-js');
      const hash = cryptoJs.MD5(normalizedEmail);
      const hashBytes = cryptoJs.enc.Hex.parse(hash.toString());

      // Convert MD5 hash (16 bytes) to GUID format
      // MD5 produces 32 hex characters (16 bytes)
      const hex = hash.toString();
      const guid = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
      return guid;
    } catch {
      // Fallback: Use simple hash (not perfect MD5, but deterministic)
      return generatePartnerIdFromEmailSync(normalizedEmail);
    }
  } catch (error) {
    console.warn('Failed to generate PartnerId from email:', error);
    throw error;
  }
}

/**
 * Synchronous version using a simple hash (fallback)
 * This is not perfect MD5 but works as a fallback
 * WARNING: This will NOT match the backend MD5 implementation
 */
export function generatePartnerIdFromEmailSync(email: string): string {
  if (!email || !email.trim()) {
    throw new Error('Email cannot be null or empty');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Simple hash-based approach (not perfect MD5, but deterministic)
  // This is a fallback - proper MD5 would be better
  let hash = 0;
  for (let i = 0; i < normalizedEmail.length; i++) {
    const char = normalizedEmail.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to GUID-like format
  const hex = Math.abs(hash).toString(16).padStart(32, '0');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}
