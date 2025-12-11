/**
 * Work Queue Use Cases
 * Business logic and orchestration for work queue operations
 * This layer coordinates between API clients, mappers, and domain logic
 */

import {
  getWorkItems,
  getWorkItemById,
  getWorkItemByApplicationId,
  getMyWorkItems,
  startReview,
  submitForApproval,
  approveWorkItem,
  completeWorkItem,
  declineWorkItem,
  assignWorkItem,
  unassignWorkItem,
  addComment,
  getComments,
  getHistory,
  markForRefresh,
  getItemsDueForRefresh,
  getPendingApprovals,
} from '../api/workQueueApi';
import {
  mapWorkItemToApplication,
  mapWorkItemsToApplications,
} from '../mappers/workQueueMapper';
import {
  WorkItemDto,
  Application,
  PagedResult,
  WorkItemFilters,
} from '../dtos/workQueue.dto';

/**
 * Get work items with frontend domain model
 */
export async function fetchWorkItems(
  filters?: WorkItemFilters
): Promise<PagedResult<Application>> {
  // Call API to get backend DTOs
  const backendResult = await getWorkItems(filters);

  // Map backend DTOs to frontend domain models
  const applications = mapWorkItemsToApplications(backendResult.items);

  // Return with frontend domain models
  return {
    items: applications,
    totalCount: backendResult.totalCount,
    page: backendResult.page,
    pageSize: backendResult.pageSize,
  };
}

/**
 * Get work item by ID with frontend domain model
 */
export async function fetchWorkItemById(id: string): Promise<Application> {
  // Call API to get backend DTO
  const workItem = await getWorkItemById(id);

  // Map to frontend domain model
  return mapWorkItemToApplication(workItem);
}

/**
 * Get work item by application ID with frontend domain model
 */
export async function fetchWorkItemByApplicationId(applicationId: string): Promise<Application> {
  // Call API to get backend DTO
  const workItem = await getWorkItemByApplicationId(applicationId);

  // Map to frontend domain model
  return mapWorkItemToApplication(workItem);
}

/**
 * Get my assigned work items
 */
export async function fetchMyWorkItems(
  page: number = 1,
  pageSize: number = 20
): Promise<PagedResult<Application>> {
  const backendResult = await getMyWorkItems(page, pageSize);
  const applications = mapWorkItemsToApplications(backendResult.items);

  return {
    items: applications,
    totalCount: backendResult.totalCount,
    page: backendResult.page,
    pageSize: backendResult.pageSize,
  };
}

/**
 * Start review use case
 */
export async function startReviewUseCase(workItemId: string): Promise<void> {
  await startReview(workItemId);
}

/**
 * Submit for approval use case
 */
export async function submitForApprovalUseCase(
  workItemId: string,
  notes?: string
): Promise<void> {
  await submitForApproval(workItemId, notes);
}

/**
 * Approve work item use case
 */
export async function approveWorkItemUseCase(
  workItemId: string,
  notes?: string
): Promise<void> {
  await approveWorkItem(workItemId, notes);
}

/**
 * Complete work item use case
 */
export async function completeWorkItemUseCase(
  workItemId: string,
  notes?: string
): Promise<void> {
  await completeWorkItem(workItemId, notes);
}

/**
 * Decline work item use case
 */
export async function declineWorkItemUseCase(
  workItemId: string,
  reason: string
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Decline reason is required');
  }
  await declineWorkItem(workItemId, reason);
}

/**
 * Assign work item use case
 */
export async function assignWorkItemUseCase(
  workItemId: string,
  userId: string,
  userName: string
): Promise<void> {
  await assignWorkItem(workItemId, userId, userName);
}

/**
 * Unassign work item use case
 */
export async function unassignWorkItemUseCase(workItemId: string): Promise<void> {
  await unassignWorkItem(workItemId);
}

/**
 * Add comment use case
 */
export async function addCommentUseCase(
  workItemId: string,
  text: string,
  authorId: string,
  authorName: string
): Promise<{ id: string }> {
  if (!text || text.trim().length === 0) {
    throw new Error('Comment text is required');
  }
  return addComment(workItemId, text, authorId, authorName);
}

/**
 * Get comments use case
 */
export async function fetchWorkItemComments(workItemId: string): Promise<Array<{
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}>> {
  return getComments(workItemId);
}

/**
 * Get history use case
 */
export async function fetchWorkItemHistory(workItemId: string): Promise<Array<{
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  status: string;
}>> {
  return getHistory(workItemId);
}

/**
 * Mark for refresh use case
 */
export async function markForRefreshUseCase(workItemId: string): Promise<void> {
  await markForRefresh(workItemId);
}

/**
 * Get items due for refresh use case
 */
export async function fetchItemsDueForRefresh(): Promise<Application[]> {
  const workItems = await getItemsDueForRefresh();
  return mapWorkItemsToApplications(workItems);
}

/**
 * Get pending approvals use case
 */
export async function fetchPendingApprovals(
  page: number = 1,
  pageSize: number = 1000
): Promise<PagedResult<Application>> {
  const backendResult = await getPendingApprovals(page, pageSize);
  const applications = mapWorkItemsToApplications(backendResult.items);

  return {
    items: applications,
    totalCount: backendResult.totalCount,
    page: backendResult.page,
    pageSize: backendResult.pageSize,
  };
}

/**
 * Export work items as CSV
 */
export async function exportWorkItems(filters?: {
  status?: string;
  search?: string;
  riskLevel?: string;
}): Promise<Blob> {
  // Get all items for export (no pagination)
  const result = await fetchWorkItems({
    status: filters?.status,
    searchTerm: filters?.search,
    riskLevel: filters?.riskLevel,
    page: 1,
    pageSize: 10000, // Get all items
  });

  // Convert to CSV
  const { escapeCsvField, createCsvBlob } = await import('../utils/csvExport');

  const headers = [
    'Work Item Number',
    'Application ID',
    'Applicant Name',
    'Business Name',
    'Entity Type',
    'Country',
    'Status',
    'Priority',
    'Risk Level',
    'Assigned To',
    'Due Date',
    'Created Date',
  ];

  const rows = result.items.map((item) => [
    escapeCsvField(item.workItemNumber || item.id),
    escapeCsvField(item.applicationId || ''),
    escapeCsvField(item.applicantName || ''),
    escapeCsvField(item.businessName || ''),
    escapeCsvField(item.entityType),
    escapeCsvField(item.country),
    escapeCsvField(item.status),
    escapeCsvField(item.priority || ''),
    escapeCsvField(item.riskLevel || ''),
    escapeCsvField(item.assignedToName || ''),
    escapeCsvField(item.dueDate ? new Date(item.dueDate).toLocaleDateString() : ''),
    escapeCsvField(new Date(item.created).toLocaleDateString()),
  ]);

  return createCsvBlob(headers, rows);
}

