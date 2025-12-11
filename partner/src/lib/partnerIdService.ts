/**
 * PartnerId Service
 *
 * PROBLEM: Both frontend and backend were generating MD5 hashes for PartnerId
 * This creates mismatches and is error-prone.
 *
 * SOLUTION: Backend is the single source of truth for PartnerId generation.
 * Frontend should get PartnerId from backend, not generate it.
 */

/**
 * Get PartnerId from backend for a given email
 * This ensures we use the backend's MD5 implementation (single source of truth)
 *
 * @deprecated Use getPartnerIdFromBackend from '@/lib/api' instead
 * This file is kept for backward compatibility
 *
 * @param email - User's email address
 * @returns PartnerId as GUID string, or null if not available
 */
export async function getPartnerIdFromBackend(email: string): Promise<string | null> {
  // Re-export from api.ts to maintain backward compatibility
  const { getPartnerIdFromBackend: getPartnerIdFromApi } = await import('./api');
  return getPartnerIdFromApi(email);
}

/**
 * Get PartnerId - tries backend first, falls back to local generation
 *
 * @param email - User's email address
 * @returns PartnerId as GUID string
 */
export async function getPartnerId(email: string): Promise<string | null> {
  // PRIMARY: Get from backend (single source of truth)
  const backendPartnerId = await getPartnerIdFromBackend(email);
  if (backendPartnerId) {
    return backendPartnerId;
  }

  // FALLBACK: Generate locally (not recommended, but works as fallback)
  console.warn(
    '⚠️ Could not get PartnerId from backend, using local generation (may not match)'
  );
  try {
    const { generatePartnerIdFromEmail } = await import('./api');
    return await generatePartnerIdFromEmail(email);
  } catch (error) {
    console.error('Failed to generate PartnerId locally:', error);
    return null;
  }
}
