/**
 * Authorization Middleware
 * Ensures all API requests are properly authenticated and authorized
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Verify user session and extract user information
 * Returns null if no valid session exists
 */
export async function verifyUserSession(request: NextRequest): Promise<{
  email: string;
  name: string;
  id: string;
} | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    return {
      email: session.user.email,
      name: session.user.name || session.user.email,
      id: (session.user as any).id || session.user.email,
    };
  } catch (error) {
    console.error('[Authorization] Failed to verify session:', error);
    return null;
  }
}

/**
 * Require authentication for API routes
 * Returns 401 response if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const user = await verifyUserSession(request);
  
  if (!user) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        details: 'Authentication required. Please log in.',
      },
      { status: 401 }
    );
  }
  
  return null; // No error, user is authenticated
}

/**
 * Validate that user owns the resource by PartnerId
 * Returns 403 response if ownership validation fails
 */
export async function validateOwnership(
  userEmail: string,
  resourcePartnerId: string | null | undefined
): Promise<NextResponse | null> {
  if (!resourcePartnerId) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        details: 'Resource ownership cannot be verified',
      },
      { status: 403 }
    );
  }

  // Generate user's PartnerId from email (must match backend logic)
  const crypto = await import('crypto');
  const NAMESPACE_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const namespaceBytes = Buffer.from(NAMESPACE_UUID.replace(/-/g, ''), 'hex');
  const emailBytes = Buffer.from(userEmail.toLowerCase(), 'utf8');
  const hash = crypto
    .createHash('sha1')
    .update(Buffer.concat([namespaceBytes, emailBytes]))
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // Version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // Variant
  const userPartnerId = [
    hash.toString('hex', 0, 4),
    hash.toString('hex', 4, 6),
    hash.toString('hex', 6, 8),
    hash.toString('hex', 8, 10),
    hash.toString('hex', 10, 16),
  ].join('-');

  // Validate ownership
  if (resourcePartnerId.toLowerCase() !== userPartnerId.toLowerCase()) {
    console.error('[Authorization] Ownership validation failed:', {
      userEmail,
      userPartnerId,
      resourcePartnerId,
    });
    
    return NextResponse.json(
      {
        error: 'Forbidden',
        details: 'You do not have permission to access this resource',
      },
      { status: 403 }
    );
  }

  console.info('[Authorization] Ownership validation passed:', {
    userEmail,
    userPartnerId,
  });

  return null; // No error, ownership validated
}

/**
 * Ensure API queries are filtered by user's PartnerId or email
 * Prevents fetching data from other users
 */
export function ensureUserFilter(
  searchParams: URLSearchParams,
  userEmail: string,
  userPartnerId: string
): void {
  // If no partnerId or searchTerm filter exists, add one
  if (!searchParams.has('partnerId') && !searchParams.has('searchTerm')) {
    // Prefer PartnerId filtering (more reliable)
    searchParams.set('partnerId', userPartnerId);
    console.info('[Authorization] Added PartnerId filter to query:', userPartnerId);
  } else if (searchParams.has('partnerId')) {
    // Verify the partnerId matches the user's
    const requestedPartnerId = searchParams.get('partnerId');
    if (requestedPartnerId?.toLowerCase() !== userPartnerId.toLowerCase()) {
      console.warn('[Authorization] Attempted to query different PartnerId:', {
        requested: requestedPartnerId,
        actual: userPartnerId,
      });
      // Override with user's PartnerId
      searchParams.set('partnerId', userPartnerId);
    }
  } else if (searchParams.has('searchTerm')) {
    // Verify the searchTerm matches the user's email
    const requestedEmail = searchParams.get('searchTerm');
    if (requestedEmail?.toLowerCase() !== userEmail.toLowerCase()) {
      console.warn('[Authorization] Attempted to search different email:', {
        requested: requestedEmail,
        actual: userEmail,
      });
      // Override with user's email
      searchParams.set('searchTerm', userEmail);
    }
  }
}
