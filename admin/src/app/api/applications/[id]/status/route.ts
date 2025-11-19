import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServerAccessToken } from '@/lib/get-server-token';

const ONBOARDING_API_BASE = process.env.ONBOARDING_API_BASE_URL || 'http://localhost:8001';

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
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { status, notes, reason } = body;
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Get access token from Redis (not from session)
    const accessToken = await getServerAccessToken(request);

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Azure AD token from Redis if available
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Forward development headers for authentication middleware
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
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (!isGuid) {
      // It's a caseId, need to find the GUID
      try {
        const PROJECTIONS_API_BASE = process.env.PROJECTIONS_API_BASE_URL || 'http://localhost:8007';
        const searchUrl = `${PROJECTIONS_API_BASE}/api/v1/cases?searchTerm=${encodeURIComponent(id)}&take=1`;
        
        const searchResponse = await fetch(searchUrl, {
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
        console.warn('Could not resolve caseId to GUID, using id as-is:', e);
      }
    }

    // Map frontend status to backend status
    const statusMap: Record<string, string> = {
      'SUBMITTED': 'Submitted',
      'IN PROGRESS': 'InProgress',
      'RISK REVIEW': 'PendingReview',
      'COMPLETE': 'Approved',
      'APPROVED': 'Approved',
      'DECLINED': 'Rejected',
      'REJECTED': 'Rejected',
    };
    
    const backendStatus = statusMap[status] || status;

    // Use appropriate endpoint based on status
    let url: string;
    let requestBody: any;

    if (backendStatus === 'Approved') {
      // Use approve endpoint
      url = `${ONBOARDING_API_BASE}/api/v1/cases/${caseGuid}/approve`;
      requestBody = {
        approvedBy: session?.user?.email || session?.user?.name || 'system',
        notes: notes || ''
      };
    } else if (backendStatus === 'Rejected') {
      // Use reject endpoint
      url = `${ONBOARDING_API_BASE}/api/v1/cases/${caseGuid}/reject`;
      requestBody = {
        rejectedBy: session?.user?.email || session?.user?.name || 'system',
        reason: reason || notes || 'No reason provided'
      };
    } else {
      // Use status update endpoint
      url = `${ONBOARDING_API_BASE}/api/v1/cases/${caseGuid}/status`;
      requestBody = {
        status: backendStatus,
        updatedBy: session?.user?.email || session?.user?.name || 'system',
        notes: notes || '',
        reason: reason || ''
      };
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(requestBody),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Admin Application Status Update] API error: ${response.status}`, errorText);
      return NextResponse.json(
        { error: `Failed to update status: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Admin Application Status Update] Error:', error);
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

