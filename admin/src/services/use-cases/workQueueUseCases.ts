/**
 * WorkQueue Use Cases
 * Business logic and orchestration for work queue operations
 */

import {
  getWorkItems,
  getWorkItemById,
  getMyWorkItems,
  getPendingApprovals,
  getItemsDueForRefresh,
  assignWorkItem,
  unassignWorkItem,
  startReview,
  submitForApproval,
  approveWorkItem,
  declineWorkItem,
  completeWorkItem,
  markForRefresh,
  addComment,
  getWorkItemComments,
  getWorkItemHistory,
} from '../api/workQueueApi';
import { mapWorkItemToApplication, mapWorkItemsToApplications } from '../mappers/workQueueMapper';
import { WorkItemDto, Application, PagedResult, WorkItemFilters } from '../dtos/workQueue.dto';

/**
 * Map frontend status to backend status
 */
function mapFrontendStatusToBackend(status: string): string {
  const statusMap: Record<string, string> = {
    'SUBMITTED': 'New',
    'IN PROGRESS': 'InProgress',
    'RISK REVIEW': 'PendingApproval',
    'COMPLETE': 'Completed',
    'DECLINED': 'Declined',
  };
  return statusMap[status] || status;
}

/**
 * Get work items with frontend domain model
 */
export async function fetchWorkItems(filters?: WorkItemFilters): Promise<PagedResult<Application>> {
  // Map frontend status to backend if needed
  const backendFilters = filters ? {
    ...filters,
    status: filters.status && filters.status !== 'ALL' ? mapFrontendStatusToBackend(filters.status) : undefined,
  } : undefined;
  
  const result = await getWorkItems(backendFilters);
  const applications = mapWorkItemsToApplications(result.items);
  
  return {
    items: applications,
    totalCount: result.totalCount,
    page: result.page,
    pageSize: result.pageSize,
  };
}

/**
 * Get work item by ID with frontend domain model
 */
export async function fetchWorkItemById(id: string): Promise<Application | null> {
  const workItem = await getWorkItemById(id);
  if (!workItem) {
    return null;
  }
  return mapWorkItemToApplication(workItem);
}

/**
 * Get my assigned work items
 */
export async function fetchMyWorkItems(page: number = 1, pageSize: number = 20): Promise<PagedResult<Application>> {
  const result = await getMyWorkItems(page, pageSize);
  const applications = mapWorkItemsToApplications(result.items);
  
  return {
    items: applications,
    totalCount: result.totalCount,
    page: result.page,
    pageSize: result.pageSize,
  };
}

/**
 * Get pending approvals
 */
export async function fetchPendingApprovals(page: number = 1, pageSize: number = 20): Promise<PagedResult<WorkItemDto>> {
  return getPendingApprovals(page, pageSize);
}

/**
 * Get items due for refresh
 */
export async function fetchItemsDueForRefresh(page: number = 1, pageSize: number = 100, asOfDate?: Date): Promise<PagedResult<WorkItemDto>> {
  return getItemsDueForRefresh(page, pageSize, asOfDate);
}

/**
 * Assign work item (business logic layer)
 */
export async function assignWorkItemUseCase(id: string, assignedToUserId: string, assignedToUserName: string): Promise<void> {
  // Validate inputs
  if (!id) {
    throw new Error('Work item ID is required');
  }
  if (!assignedToUserId) {
    throw new Error('User ID is required');
  }
  if (!assignedToUserName) {
    throw new Error('User name is required');
  }
  
  await assignWorkItem(id, assignedToUserId, assignedToUserName);
}

/**
 * Unassign work item
 */
export async function unassignWorkItemUseCase(id: string): Promise<void> {
  if (!id) {
    throw new Error('Work item ID is required');
  }
  await unassignWorkItem(id);
}

/**
 * Start review
 */
export async function startReviewUseCase(id: string): Promise<void> {
  if (!id) {
    throw new Error('Work item ID is required');
  }
  await startReview(id);
}

/**
 * Submit for approval
 */
export async function submitForApprovalUseCase(id: string, notes?: string): Promise<void> {
  if (!id) {
    throw new Error('Work item ID is required');
  }
  await submitForApproval(id, notes);
}

/**
 * Approve work item
 */
export async function approveWorkItemUseCase(id: string, notes?: string): Promise<void> {
  if (!id) {
    throw new Error('Work item ID is required');
  }
  await approveWorkItem(id, notes);
}

/**
 * Decline work item
 */
export async function declineWorkItemUseCase(id: string, reason: string): Promise<void> {
  if (!id) {
    throw new Error('Work item ID is required');
  }
  if (!reason || reason.trim().length === 0) {
    throw new Error('Rejection reason is required');
  }
  await declineWorkItem(id, reason);
}

/**
 * Complete work item
 */
export async function completeWorkItemUseCase(id: string, notes?: string): Promise<void> {
  if (!id) {
    throw new Error('Work item ID is required');
  }
  await completeWorkItem(id, notes);
}

/**
 * Mark for refresh
 */
export async function markForRefreshUseCase(id: string): Promise<void> {
  if (!id) {
    throw new Error('Work item ID is required');
  }
  await markForRefresh(id);
}

/**
 * Add comment
 */
export async function addCommentUseCase(id: string, text: string): Promise<void> {
  if (!id) {
    throw new Error('Work item ID is required');
  }
  if (!text || text.trim().length === 0) {
    throw new Error('Comment text is required');
  }
  await addComment(id, text);
}

/**
 * Get work item comments
 */
export async function fetchWorkItemComments(id: string): Promise<any[]> {
  if (!id) {
    throw new Error('Work item ID is required');
  }
  return getWorkItemComments(id);
}

/**
 * Get work item history
 */
export async function fetchWorkItemHistory(id: string): Promise<any[]> {
  if (!id) {
    throw new Error('Work item ID is required');
  }
  return getWorkItemHistory(id);
}

/**
 * Export work items as CSV
 */
export async function exportWorkItems(filters?: {
  status?: string;
  searchTerm?: string;
  country?: string;
}): Promise<Blob> {
  // Map frontend status to backend if needed
  const backendFilters = filters ? {
    ...filters,
    status: filters.status && filters.status !== 'ALL' ? mapFrontendStatusToBackend(filters.status) : undefined,
  } : undefined;
  
  // Get all items for export (no pagination)
  const result = await getWorkItems({
    ...backendFilters,
    page: 1,
    pageSize: 10000,
  });
  
  // Convert to CSV
  const { escapeCsvField, createCsvBlob } = await import('../utils/csvExport');
  const { mapWorkItemToApplication } = await import('../mappers/workQueueMapper');
  
  const headers = [
    'Application ID',
    'Work Item Number',
    'Legal Name',
    'Entity Type',
    'Country',
    'Status',
    'Priority',
    'Risk Level',
    'Assigned To',
    'Created Date',
    'Updated Date'
  ];
  
  const rows = result.items.map(workItem => {
    const app = mapWorkItemToApplication(workItem);
    return [
      escapeCsvField(app.id),
      escapeCsvField(workItem.workItemNumber),
      escapeCsvField(app.legalName),
      escapeCsvField(app.entityType),
      escapeCsvField(app.country),
      escapeCsvField(app.status),
      escapeCsvField(workItem.priority),
      escapeCsvField(workItem.riskLevel),
      escapeCsvField(workItem.assignedToName || workItem.assignedTo),
      escapeCsvField(new Date(app.created).toLocaleDateString()),
      escapeCsvField(new Date(app.updated).toLocaleDateString()),
    ];
  });
  
  return createCsvBlob(headers, rows);
}

