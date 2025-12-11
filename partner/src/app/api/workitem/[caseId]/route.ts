import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const { caseId } = params;
    console.log('[WorkItem API] Fetching work item for caseId:', caseId);

    // Fetch work item for this case
    // Use direct backend URL since gateway might not be available
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8001';
    const url = `${backendUrl}/api/v1/workqueue?applicationId=${caseId}`;
    console.log('[WorkItem API] Fetching from:', url);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[WorkItem API] Response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[WorkItem API] Work item not found (404)');
        return NextResponse.json({ workItem: null }, { status: 200 });
      }
      throw new Error(`Backend returned ${response.status}`);
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
    return NextResponse.json(
      { error: 'Failed to fetch work item', workItem: null },
      { status: 500 }
    );
  }
}
