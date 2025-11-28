import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { mapFrontendStatusToBackend, getStatusEndpoint, isGuid } from '@/lib/statusMapping';

/**
 * Application Status API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */

// Proxy to update application status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  try {
    const session = await auth();
    const body = await request.json();
    const { status, notes, reason } = body;
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user identification headers (proxy will inject token from Redis)
    if (session?.user) {
      const user = session.user as any;
      if (user.email) headers['X-User-Email'] = user.email;
      if (user.name) headers['X-User-Name'] = user.name;
      if (user.id) headers['X-User-Id'] = user.id;
      if (user.role) headers['X-User-Role'] = user.role;
    }

    // First, we need to get the GUID from the caseId if id is a caseId (like OBC-20251106-88902)
    // Try to resolve the caseId to GUID
    let caseGuid = id;
    
    if (!isGuid(id)) {
      // It's a caseId, need to find the GUID
      try {
        // Route through proxy
        const searchPath = `/api/proxy/projections/v1/cases?searchTerm=${encodeURIComponent(id)}&take=1`;
        const searchUrl = new URL(searchPath, request.url);
        
        const searchResponse = await fetch(searchUrl.toString(), {
          method: 'GET',
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.items && searchData.items.length > 0) {
            const found = searchData.items.find((item: any) => 
              item.caseId === id || item.id === id
            );
            if (found) {
              caseGuid = found.id; // Use the GUID from the projection
            }
          }
        }
      } catch (e) {
        logger.warn('Could not resolve caseId to GUID, using id as-is', {
          tags: { warning_type: 'guid_resolution' },
          extra: { error: e instanceof Error ? e.message : String(e) }
        });
      }
    }

    // Map frontend status to backend status
    const backendStatus = mapFrontendStatusToBackend(status);

    // Use appropriate endpoint based on status - route through proxy
    const endpoint = getStatusEndpoint(status);
    let proxyPath: string;
    let requestBody: any;

    if (endpoint === 'approve') {
      // Use approve endpoint
      proxyPath = `/api/proxy/api/v1/cases/${caseGuid}/approve`;
      requestBody = {
        approvedBy: session?.user?.email || session?.user?.name || 'system',
        notes: notes || ''
      };
    } else if (endpoint === 'reject') {
      // Use reject endpoint
      proxyPath = `/api/proxy/api/v1/cases/${caseGuid}/reject`;
      requestBody = {
        rejectedBy: session?.user?.email || session?.user?.name || 'system',
        reason: reason || notes || 'No reason provided'
      };
    } else {
      // Use status update endpoint
      proxyPath = `/api/proxy/api/v1/cases/${caseGuid}/status`;
      requestBody = {
        status: backendStatus,
        updatedBy: session?.user?.email || session?.user?.name || 'system',
        notes: notes || '',
        reason: reason || ''
      };
    }

    const proxyUrl = new URL(proxyPath, request.url);
    const response = await fetch(proxyUrl.toString(), {
      method: 'PUT',
      headers,
      body: JSON.stringify(requestBody),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(new Error(`API error: ${response.status}`), '[Admin Application Status Update] API error', {
        tags: { error_type: 'api_backend_error' },
        extra: { status: response.status, errorText }
      });
      return NextResponse.json(
        { error: `Failed to update status: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(error, '[Admin Application Status Update] Error', {
      tags: { error_type: 'api_route_error' }
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout');
    
    return NextResponse.json(
      { 
        error: 'Failed to update application status', 
        message: errorMessage,
        details: isConnectionError ? `Cannot connect to backend services. Please ensure they are running.` : undefined
      },
      { status: 500 }
    );
  }
}

