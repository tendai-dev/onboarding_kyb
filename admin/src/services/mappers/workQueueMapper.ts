/**
 * WorkQueue Mappers
 * Transformations between backend DTOs and frontend domain models
 */

import { WorkItemDto, Application } from '../dtos/workQueue.dto';

/**
 * Map backend status to frontend status
 */
function mapBackendStatusToFrontend(backendStatus: string): Application['status'] {
  const statusMap: Record<string, Application['status']> = {
    'New': 'SUBMITTED',
    'Assigned': 'IN PROGRESS',
    'InProgress': 'IN PROGRESS',
    'PendingApproval': 'RISK REVIEW',
    'Approved': 'COMPLETE',
    'Completed': 'COMPLETE',
    'Declined': 'DECLINED',
    'Cancelled': 'DECLINED',
    'DueForRefresh': 'IN PROGRESS',
  };
  
  return statusMap[backendStatus] || 'IN PROGRESS';
}

/**
 * Map risk level to score
 */
function mapRiskLevelToScore(riskLevel: string): number {
  const riskMap: Record<string, number> = {
    'Low': 25,
    'Medium': 50,
    'High': 75,
    'Critical': 95,
  };
  
  return riskMap[riskLevel] || 50;
}

/**
 * Map WorkItemDto to Application (frontend domain model)
 */
export function mapWorkItemToApplication(workItem: WorkItemDto): Application {
  return {
    id: workItem.workItemNumber || workItem.id, // Use workItemNumber for display
    workItemId: workItem.id, // Actual GUID
    legalName: workItem.applicantName,
    entityType: workItem.entityType,
    country: workItem.country,
    status: mapBackendStatusToFrontend(workItem.status),
    backendStatus: workItem.status,
    created: workItem.createdAt,
    updated: workItem.updatedAt || workItem.createdAt,
    submittedBy: workItem.assignedToName || workItem.assignedTo || 'Unknown',
    riskScore: mapRiskLevelToScore(workItem.riskLevel),
    workItemNumber: workItem.workItemNumber,
    applicationId: workItem.applicationId,
    priority: workItem.priority,
    riskLevel: workItem.riskLevel,
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
 * Map array of WorkItemDto to Application array
 */
export function mapWorkItemsToApplications(workItems: WorkItemDto[]): Application[] {
  return workItems.map(mapWorkItemToApplication);
}

