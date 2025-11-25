/**
 * WorkQueue DTOs
 * Data transfer objects for work queue-related data
 */

/**
 * Backend WorkItem DTO
 */
export interface WorkItemDto {
  id: string;
  workItemNumber: string;
  applicationId: string;
  applicantName: string;
  entityType: string;
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
  rejectionReason?: string;
  dueDate: string;
  isOverdue: boolean;
  nextRefreshDate?: string;
  lastRefreshedAt?: string;
  refreshCount: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Frontend Application domain model (mapped from WorkItemDto)
 */
export interface Application {
  id: string; // Display ID (workItemNumber for display)
  workItemId: string; // Actual GUID for API calls
  legalName: string;
  entityType: string;
  country: string;
  status: 'SUBMITTED' | 'IN PROGRESS' | 'RISK REVIEW' | 'COMPLETE' | 'INCOMPLETE' | 'DECLINED';
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
 * Work item filters
 */
export interface WorkItemFilters {
  status?: string;
  searchTerm?: string;
  country?: string;
  riskLevel?: string;
  page?: number;
  pageSize?: number;
}

