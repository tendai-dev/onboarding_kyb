import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    console.log('[WorkItem API] Fetching work item for caseId:', caseId);

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required', workItem: null },
        { status: 400 }
      );
    }

    // The caseId might be a case number (e.g., "OBC-20251203-99307") or a GUID
    // The backend workqueue API expects applicationId which should be a GUID
    // We need to resolve the caseId to an application GUID first
    // For now, try using the caseId directly - if it's a GUID it will work, if it's a case number we'll need to resolve it
    
    // URL encode the caseId to handle special characters
    const encodedCaseId = encodeURIComponent(caseId);
    
    // Try to fetch work item using the proxy (which handles authentication)
    // The proxy will route to the backend workqueue API
    const proxyBase = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${proxyBase}/api/proxy/api/v1/workqueue?applicationId=${encodedCaseId}`;
    console.log('[WorkItem API] Fetching from proxy:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookie for proxy authentication
    });

    console.log('[WorkItem API] Response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[WorkItem API] Work item not found (404)');
        return NextResponse.json({ workItem: null }, { status: 200 });
      }
      // Handle service unavailable errors gracefully
      if (response.status === 503 || response.status === 502) {
        console.warn('[WorkItem API] Backend service unavailable');
        return NextResponse.json({ workItem: null }, { status: 200 });
      }
      const errorText = await response.text().catch(() => `HTTP ${response.status}`);
      console.error('[WorkItem API] Backend error:', errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawWorkItem = data.items?.[0] || null;

    // Convert snake_case to camelCase for frontend
    const workItem = rawWorkItem
      ? {
          id: rawWorkItem.id,
          workItemNumber: rawWorkItem.work_item_number,
          applicationId: rawWorkItem.application_id,
          applicantName: rawWorkItem.applicant_name,
          businessName: rawWorkItem.business_name,
          entityType: rawWorkItem.entity_type,
          country: rawWorkItem.country,
          status: rawWorkItem.status,
          priority: rawWorkItem.priority,
          riskLevel: rawWorkItem.risk_level,
          assignedTo: rawWorkItem.assigned_to,
          assignedToName: rawWorkItem.assigned_to_name,
          assignedAt: rawWorkItem.assigned_at,
          createdAt: rawWorkItem.created_at,
          updatedAt: rawWorkItem.updated_at,
        }
      : null;

    console.log(
      '[WorkItem API] Found work item:',
      workItem
        ? {
            id: workItem.id,
            status: workItem.status,
            assignedToName: workItem.assignedToName,
          }
        : 'null'
    );

    return NextResponse.json({ workItem }, { status: 200 });
  } catch (error) {
    console.error('[WorkItem API] Error fetching work item:', error);
    // Return null workItem instead of error to allow dashboard to continue
    // This is a non-critical feature - dashboard can work without work item status
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      console.warn('[WorkItem API] Backend service not available, returning null workItem');
      return NextResponse.json({ workItem: null }, { status: 200 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch work item', workItem: null },
      { status: 500 }
    );
  }
}
