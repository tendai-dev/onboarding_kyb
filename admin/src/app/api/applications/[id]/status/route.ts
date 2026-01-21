import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import {
  mapFrontendStatusToBackend,
  getStatusEndpoint,
  isGuid,
} from '@/lib/statusMapping';

// Backend URL - same logic as proxy
const getBackendUrl = () => {
  return process.env.PROXY_TARGET || 
         process.env.ONBOARDING_TARGET ||
         process.env.NEXT_PUBLIC_GATEWAY_URL || 
         process.env.NEXT_PUBLIC_BACKEND_URL ||
         'http://localhost:8001';
};

/**
 * Application Status API route - calls backend directly with token from Redis
 */

// Update application status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[STATUS ROUTE] ===== PUT /api/applications/[id]/status called =====');
  const { id } = await params;
  console.log('[STATUS ROUTE] Application ID:', id);

  if (!id) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  try {
    const session = await auth();
    const body = await request.json();
    const { status, notes, reason } = body;
    console.log('[STATUS ROUTE] Request body:', { status, notes, reason });

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Build headers - NO Bearer token, only X-User headers for dev mode auth
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // For status updates, use X-User headers only (no Bearer token)
    // This allows the backend's development auth middleware to create a fake identity
    // Sending an expired/invalid Bearer token causes Azure AD validation to fail before
    // the dev middleware can kick in
    if (session?.user) {
      const user = session.user as Record<string, unknown>;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      // Always set Administrator role for admin portal users
      headers['X-User-Role'] = 'Administrator';
    }

    logger.info('[Status Update] Headers being sent (no Bearer token)', {
      extra: { 
        hasXUserEmail: !!headers['X-User-Email'],
        hasXUserRole: !!headers['X-User-Role'],
        headerKeys: Object.keys(headers),
      },
    });

    // First, we need to get the GUID from the caseId if id is a caseId (like OBC-20251106-88902)
    // Try to resolve the caseId to GUID
    let caseGuid = id;
    const backendUrl = getBackendUrl();

    if (!isGuid(id)) {
      // It's a caseId, need to find the GUID
      try {
        const searchUrl = `${backendUrl}/projections/v1/cases?searchTerm=${encodeURIComponent(id)}&take=1`;

        const searchResponse = await fetch(searchUrl, {
          method: 'GET',
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.items && searchData.items.length > 0) {
            const found = searchData.items.find(
              (item: Record<string, unknown>) => item.caseId === id || item.id === id
            );
            if (found) {
              caseGuid = found.id; // Use the GUID from the projection
            }
          }
        }
      } catch (e) {
        logger.warn('Could not resolve caseId to GUID, using id as-is', {
          tags: { warning_type: 'guid_resolution' },
          extra: { error: e instanceof Error ? e.message : String(e) },
        });
      }
    }

    // Map frontend status to backend status
    const backendStatus = mapFrontendStatusToBackend(status);

    // Use appropriate endpoint based on status - call backend directly
    const endpoint = getStatusEndpoint(status);
    let apiPath: string;
    let requestBody: unknown;

    if (endpoint === 'approve') {
      // Use approve endpoint
      apiPath = `${backendUrl}/api/v1/cases/${caseGuid}/approve`;
      requestBody = {
        approvedBy: session?.user?.email || session?.user?.name || 'system',
        notes: notes || '',
      };
    } else if (endpoint === 'reject') {
      // Use reject endpoint
      apiPath = `${backendUrl}/api/v1/cases/${caseGuid}/reject`;
      requestBody = {
        rejectedBy: session?.user?.email || session?.user?.name || 'system',
        reason: reason || notes || 'No reason provided',
      };
    } else {
      // Use status update endpoint
      apiPath = `${backendUrl}/api/v1/cases/${caseGuid}/status`;
      requestBody = {
        status: backendStatus,
        updatedBy: session?.user?.email || session?.user?.name || 'system',
        notes: notes || '',
        reason: reason || '',
      };
    }

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers,
      body: JSON.stringify(requestBody),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        new Error(`API error: ${response.status}`),
        '[Admin Application Status Update] API error',
        {
          tags: { error_type: 'api_backend_error' },
          extra: { status: response.status, errorText },
        }
      );
      return NextResponse.json(
        {
          error: `Failed to update status: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(error, '[Admin Application Status Update] Error', {
      tags: { error_type: 'api_route_error' },
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError =
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('timeout');

    return NextResponse.json(
      {
        error: 'Failed to update application status',
        message: errorMessage,
        details: isConnectionError
          ? `Cannot connect to backend services. Please ensure they are running.`
          : undefined,
      },
      { status: 500 }
    );
  }
}
