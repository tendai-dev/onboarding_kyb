/* eslint-disable security/detect-object-injection */
/**
 * Work Queue Mappers
 * Functions to transform between backend DTOs and frontend domain models
 */

import { WorkItemDto, Application } from '../dtos/workQueue.dto';

/**
 * Map WorkItemDto (backend DTO) to Application (frontend model)
 */
export function mapWorkItemToApplication(workItem: WorkItemDto): Application {
  // Extract both applicantName and businessName from API response
  const applicantName = workItem.applicantName || '';
  const businessName = workItem.businessName || '';
  
  // Create legalName for backwards compatibility: businessName || applicantName
  const legalName = businessName || applicantName || 'Unknown';

  // Map status from backend to frontend
  const statusMap: Record<string, Application['status']> = {
    New: 'SUBMITTED',
    Assigned: 'IN PROGRESS',
    InProgress: 'IN PROGRESS',
    PendingApproval: 'RISK REVIEW',
    Approved: 'COMPLETE',
    Completed: 'COMPLETE',
    Declined: 'DECLINED',
    Cancelled: 'DECLINED',
    DueForRefresh: 'IN PROGRESS',
  };

  const frontendStatus = statusMap[workItem.status] || 'IN PROGRESS';

  return {
    id: workItem.workItemNumber || workItem.id,
    workItemId: workItem.id,
    legalName,
    applicantName: applicantName || undefined,
    businessName: businessName || undefined,
    entityType: workItem.entityType || 'Unknown',
    country: workItem.country || 'Unknown',
    status: frontendStatus,
    backendStatus: workItem.status,
    created: workItem.createdAt,
    updated: workItem.updatedAt || workItem.createdAt,
    submittedBy: workItem.createdBy || 'System',
    riskScore: undefined, // Not available in work item
    workItemNumber: workItem.workItemNumber,
    applicationId: workItem.applicationId,
    priority: workItem.priority,
    riskLevel: workItem.riskLevel,
    entityTypeDisplayName: workItem.entityTypeDisplayName,
    assignedTo: workItem.assignedTo,
    assignedToName: workItem.assignedToName,
    assignedAt: workItem.assignedAt,
    requiresApproval: workItem.requiresApproval,
    approvedBy: workItem.approvedBy,
    approvedByName: workItem.approvedByName,
    approvedAt: workItem.approvedAt,
    rejectionReason: workItem.rejectionReason,
    dueDate: workItem.dueDate,
    isOverdue: workItem.isOverdue,
    nextRefreshDate: workItem.nextRefreshDate,
    lastRefreshedAt: workItem.lastRefreshedAt,
    refreshCount: workItem.refreshCount,
  };
}

/**
 * Map array of WorkItemDto to array of Application
 */
export function mapWorkItemsToApplications(workItems: WorkItemDto[]): Application[] {
  return workItems.map(mapWorkItemToApplication);
}

