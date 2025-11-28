/**
 * Status Mapping Utilities
 * Pure functions for mapping between frontend and backend statuses
 * These can be tested without mocks
 */

/**
 * Map frontend status to backend status for application status updates
 */
export function mapFrontendStatusToBackend(status: string): string {
  const statusMap: Record<string, string> = {
    'SUBMITTED': 'Submitted',
    'IN PROGRESS': 'InProgress',
    'RISK REVIEW': 'PendingReview',
    'COMPLETE': 'Approved',
    'APPROVED': 'Approved',
    'DECLINED': 'Rejected',
    'REJECTED': 'Rejected',
  };
  
  return statusMap[status] || status;
}

/**
 * Determine which endpoint to use based on status
 */
export function getStatusEndpoint(status: string): 'approve' | 'reject' | 'status' {
  const backendStatus = mapFrontendStatusToBackend(status);
  
  if (backendStatus === 'Approved') {
    return 'approve';
  } else if (backendStatus === 'Rejected') {
    return 'reject';
  } else {
    return 'status';
  }
}

/**
 * Check if a string is a GUID format
 */
export function isGuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Generate GUID from a string (for backwards compatibility)
 */
export function generateGuidFromString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(32, '0');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

/**
 * Normalize user ID to GUID format
 */
export function normalizeUserIdToGuid(userId: string): string {
  if (isGuid(userId)) {
    return userId;
  }
  return generateGuidFromString(userId);
}

