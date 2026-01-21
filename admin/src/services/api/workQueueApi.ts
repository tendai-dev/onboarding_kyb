/**
 * Work Queue API Client
 * Thin HTTP client for work queue endpoints
 * All business logic and mapping should be in use-cases layer
 */

import { WorkItemDto, PagedResult, WorkItemFilters } from '../dtos/workQueue.dto';

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3001';

/**
 * Get work items from work queue API
 */
export async function getWorkItems(
  filters?: WorkItemFilters
): Promise<PagedResult<WorkItemDto>> {
  const params = new URLSearchParams();

  // Backend expects these query parameters (case-sensitive)
  if (filters?.status) {
    params.append('status', filters.status);
  }
  if (filters?.assignedTo) {
    // Backend expects Guid? for assignedTo
    params.append('assignedTo', filters.assignedTo);
  }
  if (filters?.riskLevel) {
    params.append('riskLevel', filters.riskLevel);
  }
  // Note: Backend doesn't support 'priority' as a filter parameter in GetWorkItems endpoint
  // Priority filtering should be done client-side if needed
  if (filters?.searchTerm) {
    params.append('searchTerm', filters.searchTerm);
  }
  if (filters?.page) {
    params.append('page', filters.page.toString());
  }
  if (filters?.pageSize) {
    params.append('pageSize', filters.pageSize.toString());
  }

  const url = `${API_BASE_URL}/api/workqueue?${params.toString()}`;

  if (process.env.NODE_ENV === 'development') {
    console.log('[WorkQueue API] Fetching work items:', { url, filters });
  }

  const response = await fetch(`${API_BASE_URL}/api/workqueue?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch work items: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      // Extract detailed error information
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.details) {
        errorMessage = errorData.details;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } catch {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch {
        // Use default error message
      }
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Backend returns snake_case: id, work_item_number, application_id, etc.
  // The 'id' field IS the work item ID (not work_item_id)
  // Handle both snake_case (backend) and camelCase/PascalCase (fallback)
  const items = (data.Items || data.items || data.data || []).map((item: any) => ({
    id: item.id || item.Id || item.work_item_id,
    workItemId: item.id || item.Id || item.workItemId || item.work_item_id, // Backend returns 'id' as the work item ID
    workItemNumber:
      item.workItemNumber || item.work_item_number || item.WorkItemNumber || '',
    applicationId: item.applicationId || item.application_id || item.ApplicationId,
    applicantName: item.applicantName || item.applicant_name || item.ApplicantName || '',
    businessName: item.businessName || item.business_name || item.BusinessName,
    entityType: item.entityType || item.entity_type || item.EntityType || '',
    entityTypeDisplayName:
      item.entityTypeDisplayName ||
      item.entity_type_display_name ||
      item.EntityTypeDisplayName,
    country: item.country || item.Country || '',
    status: item.status || item.Status || '',
    priority: item.priority || item.Priority || '',
    riskLevel: item.riskLevel || item.risk_level || item.RiskLevel || '',
    assignedTo: item.assignedTo || item.assigned_to || item.AssignedTo,
    assignedToName: item.assignedToName || item.assigned_to_name || item.AssignedToName,
    assignedAt: item.assignedAt || item.assigned_at || item.AssignedAt,
    requiresApproval:
      item.requiresApproval ?? item.requires_approval ?? item.RequiresApproval ?? false,
    approvedBy: item.approvedBy || item.approved_by || item.ApprovedBy,
    approvedByName: item.approvedByName || item.approved_by_name || item.ApprovedByName,
    approvedAt: item.approvedAt || item.approved_at || item.ApprovedAt,
    approvalNotes: item.approvalNotes || item.approval_notes || item.ApprovalNotes,
    rejectionReason:
      item.rejectionReason || item.rejection_reason || item.RejectionReason,
    rejectedAt: item.rejectedAt || item.rejected_at || item.RejectedAt,
    nextRefreshDate:
      item.nextRefreshDate || item.next_refresh_date || item.NextRefreshDate,
    lastRefreshedAt:
      item.lastRefreshedAt || item.last_refreshed_at || item.LastRefreshedAt,
    refreshCount: item.refreshCount ?? item.refresh_count ?? item.RefreshCount ?? 0,
    dueDate: item.dueDate || item.due_date || item.DueDate,
    isOverdue: item.isOverdue ?? item.is_overdue ?? item.IsOverdue ?? false,
    createdAt: item.createdAt || item.created_at || item.CreatedAt,
    createdBy: item.createdBy || item.created_by || item.CreatedBy || '',
    updatedAt: item.updatedAt || item.updated_at || item.UpdatedAt,
    updatedBy: item.updatedBy || item.updated_by || item.UpdatedBy,
  }));

  // Transform response to match PagedResult interface
  // Backend returns PascalCase: Items, TotalCount, Page, PageSize
  return {
    items,
    totalCount: data.TotalCount ?? data.totalCount ?? data.total_count ?? data.total ?? 0,
    page: data.Page ?? data.page ?? filters?.page ?? 1,
    pageSize: data.PageSize ?? data.pageSize ?? data.page_size ?? filters?.pageSize ?? 20,
  };
}

/**
 * Get work item by ID
 */
export async function getWorkItemById(id: string): Promise<WorkItemDto> {
  if (!id) {
    throw new Error('Work item ID is required');
  }

  const response = await fetch(`${API_BASE_URL}/api/workqueue/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch work item: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch {
        // Use default error message
      }
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Handle both direct DTO response and wrapped response
  let workItem = data;
  if (data.workItem || data.item) {
    workItem = data.workItem || data.item;
  }

  // Backend returns snake_case, map to camelCase for frontend
  if (workItem && (workItem.id || workItem.workItemId || workItem.application_id)) {
    return {
      id: workItem.id || workItem.Id || workItem.work_item_id,
      workItemId:
        workItem.id || workItem.Id || workItem.workItemId || workItem.work_item_id,
      workItemNumber:
        workItem.workItemNumber ||
        workItem.work_item_number ||
        workItem.WorkItemNumber ||
        '',
      applicationId:
        workItem.applicationId || workItem.application_id || workItem.ApplicationId,
      applicantName:
        workItem.applicantName || workItem.applicant_name || workItem.ApplicantName || '',
      businessName:
        workItem.businessName || workItem.business_name || workItem.BusinessName,
      entityType:
        workItem.entityType || workItem.entity_type || workItem.EntityType || '',
      entityTypeDisplayName:
        workItem.entityTypeDisplayName ||
        workItem.entity_type_display_name ||
        workItem.EntityTypeDisplayName,
      country: workItem.country || workItem.Country || '',
      status: workItem.status || workItem.Status || '',
      priority: workItem.priority || workItem.Priority || '',
      riskLevel: workItem.riskLevel || workItem.risk_level || workItem.RiskLevel || '',
      assignedTo: workItem.assignedTo || workItem.assigned_to || workItem.AssignedTo,
      assignedToName:
        workItem.assignedToName || workItem.assigned_to_name || workItem.AssignedToName,
      assignedAt: workItem.assignedAt || workItem.assigned_at || workItem.AssignedAt,
      requiresApproval:
        workItem.requiresApproval ??
        workItem.requires_approval ??
        workItem.RequiresApproval ??
        false,
      approvedBy: workItem.approvedBy || workItem.approved_by || workItem.ApprovedBy,
      approvedByName:
        workItem.approvedByName || workItem.approved_by_name || workItem.ApprovedByName,
      approvedAt: workItem.approvedAt || workItem.approved_at || workItem.ApprovedAt,
      approvalNotes:
        workItem.approvalNotes || workItem.approval_notes || workItem.ApprovalNotes,
      rejectionReason:
        workItem.rejectionReason || workItem.rejection_reason || workItem.RejectionReason,
      rejectedAt: workItem.rejectedAt || workItem.rejected_at || workItem.RejectedAt,
      nextRefreshDate:
        workItem.nextRefreshDate ||
        workItem.next_refresh_date ||
        workItem.NextRefreshDate,
      lastRefreshedAt:
        workItem.lastRefreshedAt ||
        workItem.last_refreshed_at ||
        workItem.LastRefreshedAt,
      refreshCount:
        workItem.refreshCount ?? workItem.refresh_count ?? workItem.RefreshCount ?? 0,
      dueDate: workItem.dueDate || workItem.due_date || workItem.DueDate,
      isOverdue: workItem.isOverdue ?? workItem.is_overdue ?? workItem.IsOverdue ?? false,
      createdAt: workItem.createdAt || workItem.created_at || workItem.CreatedAt,
      createdBy: workItem.createdBy || workItem.created_by || workItem.CreatedBy || '',
      updatedAt: workItem.updatedAt || workItem.updated_at || workItem.UpdatedAt,
      updatedBy: workItem.updatedBy || workItem.updated_by || workItem.UpdatedBy,
    };
  }

  throw new Error('Invalid work item response format');
}

/**
 * Get work item by application ID
 */
export async function getWorkItemByApplicationId(
  applicationId: string
): Promise<WorkItemDto> {
  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/workqueue/by-application/${applicationId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    let errorMessage = `Failed to fetch work item by application ID: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch {
        // Use default error message
      }
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Handle both direct DTO response and wrapped response
  let workItem = data;
  if (data.workItem || data.item) {
    workItem = data.workItem || data.item;
  }

  // Backend returns snake_case, map to camelCase for frontend
  if (workItem && (workItem.id || workItem.workItemId || workItem.application_id)) {
    return {
      id: workItem.id || workItem.Id || workItem.work_item_id,
      workItemId:
        workItem.id || workItem.Id || workItem.workItemId || workItem.work_item_id,
      workItemNumber:
        workItem.workItemNumber ||
        workItem.work_item_number ||
        workItem.WorkItemNumber ||
        '',
      applicationId:
        workItem.applicationId || workItem.application_id || workItem.ApplicationId,
      applicantName:
        workItem.applicantName || workItem.applicant_name || workItem.ApplicantName || '',
      businessName:
        workItem.businessName || workItem.business_name || workItem.BusinessName,
      entityType:
        workItem.entityType || workItem.entity_type || workItem.EntityType || '',
      entityTypeDisplayName:
        workItem.entityTypeDisplayName ||
        workItem.entity_type_display_name ||
        workItem.EntityTypeDisplayName,
      country: workItem.country || workItem.Country || '',
      status: workItem.status || workItem.Status || '',
      priority: workItem.priority || workItem.Priority || '',
      riskLevel: workItem.riskLevel || workItem.risk_level || workItem.RiskLevel || '',
      assignedTo: workItem.assignedTo || workItem.assigned_to || workItem.AssignedTo,
      assignedToName:
        workItem.assignedToName || workItem.assigned_to_name || workItem.AssignedToName,
      assignedAt: workItem.assignedAt || workItem.assigned_at || workItem.AssignedAt,
      requiresApproval:
        workItem.requiresApproval ??
        workItem.requires_approval ??
        workItem.RequiresApproval ??
        false,
      approvedBy: workItem.approvedBy || workItem.approved_by || workItem.ApprovedBy,
      approvedByName:
        workItem.approvedByName || workItem.approved_by_name || workItem.ApprovedByName,
      approvedAt: workItem.approvedAt || workItem.approved_at || workItem.ApprovedAt,
      approvalNotes:
        workItem.approvalNotes || workItem.approval_notes || workItem.ApprovalNotes,
      rejectionReason:
        workItem.rejectionReason || workItem.rejection_reason || workItem.RejectionReason,
      rejectedAt: workItem.rejectedAt || workItem.rejected_at || workItem.RejectedAt,
      nextRefreshDate:
        workItem.nextRefreshDate ||
        workItem.next_refresh_date ||
        workItem.NextRefreshDate,
      lastRefreshedAt:
        workItem.lastRefreshedAt ||
        workItem.last_refreshed_at ||
        workItem.LastRefreshedAt,
      refreshCount:
        workItem.refreshCount ?? workItem.refresh_count ?? workItem.RefreshCount ?? 0,
      dueDate: workItem.dueDate || workItem.due_date || workItem.DueDate,
      isOverdue: workItem.isOverdue ?? workItem.is_overdue ?? workItem.IsOverdue ?? false,
      createdAt: workItem.createdAt || workItem.created_at || workItem.CreatedAt,
      createdBy: workItem.createdBy || workItem.created_by || workItem.CreatedBy || '',
      updatedAt: workItem.updatedAt || workItem.updated_at || workItem.UpdatedAt,
      updatedBy: workItem.updatedBy || workItem.updated_by || workItem.UpdatedBy,
    };
  }

  throw new Error('Invalid work item response format');
}

/**
 * Get my assigned work items
 */
export async function getMyWorkItems(
  page: number = 1,
  pageSize: number = 20
): Promise<PagedResult<WorkItemDto>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  const response = await fetch(
    `${API_BASE_URL}/api/workqueue/my-items?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch my work items: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Backend returns PascalCase: Items, TotalCount, Page, PageSize
  const items = (data.Items || data.items || data.data || []).map((item: any) => ({
    id: item.id || item.Id,
    workItemId: item.workItemId || item.work_item_id || item.Id,
    workItemNumber:
      item.workItemNumber || item.work_item_number || item.WorkItemNumber || '',
    applicationId: item.applicationId || item.application_id || item.ApplicationId,
    applicantName: item.applicantName || item.applicant_name || item.ApplicantName || '',
    businessName: item.businessName || item.business_name || item.BusinessName,
    entityType: item.entityType || item.entity_type || item.EntityType || '',
    entityTypeDisplayName:
      item.entityTypeDisplayName ||
      item.entity_type_display_name ||
      item.EntityTypeDisplayName,
    country: item.country || item.Country || '',
    status: item.status || item.Status || '',
    priority: item.priority || item.Priority || '',
    riskLevel: item.riskLevel || item.risk_level || item.RiskLevel || '',
    assignedTo: item.assignedTo || item.assigned_to || item.AssignedTo,
    assignedToName: item.assignedToName || item.assigned_to_name || item.AssignedToName,
    assignedAt: item.assignedAt || item.assigned_at || item.AssignedAt,
    requiresApproval:
      item.requiresApproval ?? item.requires_approval ?? item.RequiresApproval ?? false,
    approvedBy: item.approvedBy || item.approved_by || item.ApprovedBy,
    approvedByName: item.approvedByName || item.approved_by_name || item.ApprovedByName,
    approvedAt: item.approvedAt || item.approved_at || item.ApprovedAt,
    approvalNotes: item.approvalNotes || item.approval_notes || item.ApprovalNotes,
    rejectionReason:
      item.rejectionReason || item.rejection_reason || item.RejectionReason,
    rejectedAt: item.rejectedAt || item.rejected_at || item.RejectedAt,
    nextRefreshDate:
      item.nextRefreshDate || item.next_refresh_date || item.NextRefreshDate,
    lastRefreshedAt:
      item.lastRefreshedAt || item.last_refreshed_at || item.LastRefreshedAt,
    refreshCount: item.refreshCount ?? item.refresh_count ?? item.RefreshCount ?? 0,
    dueDate: item.dueDate || item.due_date || item.DueDate,
    isOverdue: item.isOverdue ?? item.is_overdue ?? item.IsOverdue ?? false,
    createdAt: item.createdAt || item.created_at || item.CreatedAt,
    createdBy: item.createdBy || item.created_by || item.CreatedBy || '',
    updatedAt: item.updatedAt || item.updated_at || item.UpdatedAt,
    updatedBy: item.updatedBy || item.updated_by || item.UpdatedBy,
  }));

  return {
    items,
    totalCount: data.TotalCount ?? data.totalCount ?? data.total_count ?? data.total ?? 0,
    page: data.Page ?? data.page ?? page,
    pageSize: data.PageSize ?? data.pageSize ?? data.page_size ?? pageSize,
  };
}

/**
 * Start review for a work item
 */
export async function startReview(workItemId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/workqueue/${workItemId}/start-review`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to start review: ${response.status}`);
  }
}

/**
 * Submit work item for approval
 */
export async function submitForApproval(
  workItemId: string,
  notes?: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/workqueue/${workItemId}/submit-for-approval`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to submit for approval: ${response.status}`);
  }
}

/**
 * Approve work item
 */
export async function approveWorkItem(workItemId: string, notes?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/workqueue/${workItemId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to approve: ${response.status}`);
  }
}

/**
 * Complete work item
 */
export async function completeWorkItem(
  workItemId: string,
  notes?: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/workqueue/${workItemId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to complete: ${response.status}`);
  }
}

/**
 * Decline work item
 */
export async function declineWorkItem(workItemId: string, reason: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/workqueue/${workItemId}/decline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to decline: ${response.status}`);
  }
}

/**
 * Assign work item
 */
export async function assignWorkItem(
  workItemId: string,
  userId: string,
  userName: string
): Promise<void> {
  // Ensure userId is a valid GUID format (backend expects Guid type)
  // If userId is not a GUID, try to convert email to GUID or use a default
  const validUserId = userId;

  // Check if userId is already a valid GUID
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(userId)) {
    // If not a GUID, try to generate one from the string (for backward compatibility)
    // In production, user IDs should always be GUIDs
    console.warn(
      `User ID "${userId}" is not a valid GUID format. Attempting to use as-is.`
    );
  }

  // Backend uses SnakeCaseLower for JSON serialization (see Program.cs)
  // Send snake_case to match the backend JSON naming policy
  const requestBody = {
    assigned_to_user_id: validUserId,
    assigned_to_user_name: userName,
  };

  console.log('[WorkQueue API] Assign request:', {
    workItemId,
    userId: validUserId,
    userName,
    requestBody,
    url: `${API_BASE_URL}/api/workqueue/${workItemId}/assign`,
  });

  const response = await fetch(`${API_BASE_URL}/api/workqueue/${workItemId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMessage = 'Unknown error';
    let errorDetails: any = null;

    try {
      const responseText = await response.text();
      console.error('[WorkQueue API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });

      try {
        errorDetails = JSON.parse(responseText);
        // Extract detailed error information
        if (errorDetails.errors) {
          const errorMessages = Object.entries(errorDetails.errors)
            .map(
              ([key, value]: [string, any]) =>
                `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
            )
            .join('; ');
          errorMessage =
            errorMessages ||
            errorDetails.message ||
            errorDetails.error ||
            errorDetails.title ||
            `HTTP ${response.status}`;
        } else {
          errorMessage =
            errorDetails.message ||
            errorDetails.error ||
            errorDetails.title ||
            `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch {
        // If not JSON, use the text as error message
        errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (e) {
      console.error('[WorkQueue API] Failed to parse error response:', e);
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Unassign work item
 */
export async function unassignWorkItem(workItemId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/workqueue/${workItemId}/unassign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to unassign: ${response.status}`);
  }
}

/**
 * Add comment to work item
 */
export async function addComment(
  workItemId: string,
  text: string,
  authorId: string,
  authorName: string
): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/workqueue/${workItemId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, authorId, authorName }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to add comment: ${response.status}`);
  }

  return response.json();
}

/**
 * Get comments for work item
 */
export async function getComments(workItemId: string): Promise<
  Array<{
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  }>
> {
  const response = await fetch(`${API_BASE_URL}/api/workqueue/${workItemId}/comments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch comments: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.items || data || [];
}

/**
 * Get history for work item
 */
export async function getHistory(workItemId: string): Promise<
  Array<{
    id: string;
    action: string;
    performedBy: string;
    performedAt: string;
    status: string;
  }>
> {
  const response = await fetch(`${API_BASE_URL}/api/workqueue/${workItemId}/history`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || data || [];
}

/**
 * Mark work item for refresh
 */
export async function markForRefresh(workItemId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/workqueue/${workItemId}/mark-for-refresh`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to mark for refresh: ${response.status}`);
  }
}

/**
 * Get items due for refresh
 */
export async function getItemsDueForRefresh(): Promise<WorkItemDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/workqueue?status=DueForRefresh`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch items due for refresh: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Get pending approvals
 */
export async function getPendingApprovals(
  page: number = 1,
  pageSize: number = 1000
): Promise<PagedResult<WorkItemDto>> {
  return getWorkItems({
    status: 'PendingApproval',
    page,
    pageSize,
  });
}

/**
 * Create work item for a case
 * Uses the sync/case/{caseId} endpoint which:
 * - Checks if case exists and is in Submitted status
 * - Returns existing work item if one already exists (with friendly message)
 * - Creates new work item if none exists
 */
export async function createWorkItemForCase(
  caseId: string
): Promise<{ workItemId: string; alreadyExists?: boolean }> {
  // Validate caseId is a valid GUID format
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!caseId || !guidRegex.test(caseId)) {
    throw new Error(`Invalid case ID format: ${caseId}. Expected a valid GUID.`);
  }

  console.log('[WorkQueue API] Creating work item for case:', { caseId });

  // Use the correct backend endpoint: /api/v1/workqueue/sync/case/{caseId}
  // The Next.js proxy route will forward /api/workqueue/sync/case/{caseId} to the backend
  const response = await fetch(`${API_BASE_URL}/api/workqueue/sync/case/${caseId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to create work item: ${response.status}`;
    try {
      const responseText = await response.text();
      console.error('[WorkQueue API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });

      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (responseText) {
          errorMessage = responseText;
        }
      }
    } catch (e) {
      console.error('[WorkQueue API] Failed to parse error response:', e);
    }
    const error = new Error(errorMessage) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  console.log('[WorkQueue API] Work item response:', data);
  
  // Backend returns { message: "Work item already exists...", workItemId: "..." } if already exists
  const alreadyExists = data.message?.includes('already exists');
  
  return { 
    workItemId: data.workItemId || data.work_item_id || data.id,
    alreadyExists 
  };
}

/**
 * Update work item priority
 */
export async function updateWorkItemPriority(
  workItemId: string,
  priority: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/workqueue/${workItemId}/update-priority`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priority }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to update priority: ${response.status}`);
  }
}

/**
 * Schedule work item refresh
 */
export async function scheduleWorkItemRefresh(
  workItemId: string,
  nextRefreshDate: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/workqueue/${workItemId}/schedule-refresh`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nextRefreshDate }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to schedule refresh: ${response.status}`);
  }
}

/**
 * Cancel work item
 */
export async function cancelWorkItem(workItemId: string, reason: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/workqueue/${workItemId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to cancel work item: ${response.status}`);
  }
}

/**
 * Step Review Status DTO
 */
export interface StepReviewStatusDto {
  stepId: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

/**
 * Get step review status for a work item
 * Returns empty object if no step reviews exist (404 is not an error - it means no reviews yet)
 */
export async function getStepReviewStatus(
  workItemId: string
): Promise<Record<string, StepReviewStatusDto>> {
  const response = await fetch(
    `${API_BASE_URL}/api/workqueue/${workItemId}/step-review`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  // 404 means no step reviews exist yet - this is not an error, return empty object
  if (response.status === 404) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[WorkQueue API] No step reviews found for work item:', workItemId);
    }
    return {};
  }

  if (!response.ok) {
    let errorMessage = `Failed to get step review status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      } catch {
        // Use default message
      }
    }

    // Only throw for non-404 errors (404 is handled above)
    throw new Error(errorMessage);
  }

  const data = await response.json();
  // Handle both snake_case and camelCase from backend
  const result: Record<string, StepReviewStatusDto> = {};

  for (const [stepId, review] of Object.entries(data)) {
    const r = review as any;
    result[stepId] = {
      stepId: r.stepId || r.step_id || stepId,
      completed: r.completed ?? false,
      completedAt: r.completedAt || r.completed_at,
      completedBy: r.completedBy || r.completed_by,
      verified: r.verified ?? false,
      verifiedAt: r.verifiedAt || r.verified_at,
      verifiedBy: r.verifiedBy || r.verified_by,
      approved: r.approved ?? false,
      approvedAt: r.approvedAt || r.approved_at,
      approvedBy: r.approvedBy || r.approved_by,
      notes: r.notes,
    };
  }

  return result;
}

/**
 * Update step review status
 */
export async function updateStepReviewStatus(
  workItemId: string,
  stepId: string,
  field: 'completed' | 'verified' | 'approved',
  value: boolean,
  notes?: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/workqueue/${workItemId}/step-review/${encodeURIComponent(stepId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field,
        value,
        notes: notes || undefined,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(
      error.message || `Failed to update step review status: ${response.status}`
    );
  }
}
