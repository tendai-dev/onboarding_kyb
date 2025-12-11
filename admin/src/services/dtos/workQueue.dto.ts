/**
 * Work Queue DTOs (Data Transfer Objects)
 * These types represent the data structures used for Work Queue API communication
 */

export interface WorkItemDto {
  id: string;
  workItemId: string;
  workItemNumber: string;
  applicationId: string;
  applicantName: string;
  businessName?: string;
  entityType: string;
  entityTypeDisplayName?: string;
  country: string;
  status: string;
  priority: string;
  riskLevel: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt?: string;
  nextRefreshDate?: string;
  lastRefreshedAt?: string;
  refreshCount?: number;
  createdBy: string;
  updatedBy?: string;
}

/**
 * Frontend Application domain model (mapped from WorkItemDto)
 */
export interface Application {
  id: string; // Display ID (workItemNumber for display)
  workItemId: string; // Actual GUID for API calls
  legalName: string; // Backwards compatibility - maps to businessName or applicantName
  applicantName?: string; // Person who submitted
  businessName?: string; // Company name if business entity
  entityType: string;
  country: string;
  status:
    | 'SUBMITTED'
    | 'IN PROGRESS'
    | 'RISK REVIEW'
    | 'COMPLETE'
    | 'INCOMPLETE'
    | 'DECLINED';
  backendStatus?: string; // Raw backend status for validation
  created: string;
  updated: string;
  submittedBy: string;
  riskScore?: number;
  workItemNumber?: string;
  applicationId?: string;
  // Additional fields from WorkItemDto
  priority?: string;
  riskLevel?: string;
  entityTypeDisplayName?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  requiresApproval?: boolean;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  dueDate?: string;
  isOverdue?: boolean;
  nextRefreshDate?: string;
  lastRefreshedAt?: string;
  refreshCount?: number;
}

/**
 * Paged result wrapper
 */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Work Item filters for querying
 */
export interface WorkItemFilters {
  status?: string;
  assignedTo?: string;
  riskLevel?: string;
  priority?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

