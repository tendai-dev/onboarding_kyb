// Work Queue API service for connecting to backend work queue service

// Use Next.js API route proxy (same origin, no CORS issues)
// This will proxy to the gateway at /api/workqueue
const WORK_QUEUE_API_BASE_URL = typeof window !== 'undefined' 
  ? '' // Use relative URL in browser (will use Next.js API route)
  : (process.env.WORK_QUEUE_API_BASE_URL || 
     process.env.NEXT_PUBLIC_GATEWAY_URL || 
     'http://127.0.0.1:8000');

// Backend DTO types
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

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Frontend Application interface (mapped from WorkItemDto)
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

// Status mapping from backend to frontend
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

// Risk level to score mapping
function mapRiskLevelToScore(riskLevel: string): number {
  const riskMap: Record<string, number> = {
    'Low': 25,
    'Medium': 50,
    'High': 75,
    'Critical': 95,
  };
  
  return riskMap[riskLevel] || 50;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // DO NOT send accessToken - API proxy will inject it from Redis
  // Only add user identification headers for backend
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      // Add user identification headers for backend
      if (session?.user?.email) {
        headers['X-User-Email'] = session.user.email;
      }
      if (session?.user?.name) {
        headers['X-User-Name'] = session.user.name;
      }
      if (session?.user?.role) {
        headers['X-User-Role'] = session.user.role;
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        const { clientSentry } = await import('./sentry-client');
        clientSentry.reportError(error, {
          tags: { error_type: 'work_queue_api', operation: 'get_session' },
          level: 'warning',
        });
      }
    }
  }

  return headers;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = WORK_QUEUE_API_BASE_URL;
  // Use /api/workqueue without trailing slash for query strings to avoid nginx issues
  // For query strings (?page=1), use /api/workqueue?page=1 (no trailing slash)
  // For paths (/123), use /api/workqueue/123 (with trailing slash in location match)
  let cleanEndpoint = endpoint;
  if (endpoint.startsWith('?')) {
    // Query string - no trailing slash needed, use exact match location
    cleanEndpoint = endpoint;
  } else if (!endpoint.startsWith('/')) {
    cleanEndpoint = `/${endpoint}`;
  }
  // For non-query endpoints, ensure they work with the /api/workqueue/ location
  // If baseUrl is empty (browser), use relative URL to Next.js API route
  const url = baseUrl 
    ? `${baseUrl}/api/workqueue${cleanEndpoint}`
    : `/api/workqueue${cleanEndpoint}`;
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    // Read response body once (can only read once)
    let responseText = '';
    try {
      responseText = await response.text();
    } catch (readError) {
      responseText = `Failed to read response body: ${readError instanceof Error ? readError.message : 'Unknown error'}`;
    }
    
    if (!response.ok) {
      let errorMessage = `Work Queue API request failed: ${response.status} ${response.statusText}`;
      
      if (responseText) {
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(responseText);
          // Try to extract a meaningful error message
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (Object.keys(errorData).length > 0) {
            // If it's an object but no message/error field, use the whole response
            errorMessage = JSON.stringify(errorData);
          }
        } catch {
          // If JSON parsing fails, use the raw text if it's not empty
          if (responseText.trim()) {
            errorMessage = responseText;
          }
        }
      }
      
      // Log error details for debugging (always log, not just in development)
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        url: url,
        body: responseText || '(empty)',
        errorMessage: errorMessage
      };
      
      console.error('[WorkQueueAPI] Error response:', errorDetails);
      
      if (typeof window !== 'undefined') {
        try {
          const { clientSentry } = await import('./sentry-client');
          clientSentry.reportError(new Error(errorMessage), {
            tags: { error_type: 'work_queue_api', operation: 'api_request' },
            extra: errorDetails,
            level: 'error',
          });
        } catch (sentryError) {
          // Ignore Sentry errors
        }
      }
      
      throw new Error(errorMessage);
    }

    // Success case - parse JSON response
    if (!responseText || responseText.trim() === '') {
      console.warn('[WorkQueueAPI] Empty response from:', url);
      return null as T;
    }
    
    try {
      const parsed = JSON.parse(responseText);
      return parsed as T;
    } catch (parseError) {
      // If parsing fails, log the error and throw a helpful message
      console.error('[WorkQueueAPI] Failed to parse JSON response:', {
        url: url,
        responseText: responseText.substring(0, 200), // First 200 chars
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      });
      throw new Error(`Invalid JSON response from Work Queue API: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    // If it's a connection error, provide a more helpful message
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const connectionError = new Error(`Cannot connect to Work Queue API at ${url}. Please ensure the backend services are running.`);
      console.error('[WorkQueueAPI] Connection error:', {
        url: url,
        error: error.message
      });
      throw connectionError;
    }
    // Re-throw other errors as-is
    throw error;
  }
}

// Map WorkItemDto to Application
export function mapWorkItemToApplication(workItem: WorkItemDto): Application {
  return {
    id: workItem.workItemNumber || workItem.id, // Display ID
    workItemId: workItem.id, // Actual GUID for API calls
    legalName: workItem.applicantName,
    entityType: workItem.entityType,
    country: workItem.country,
    status: mapBackendStatusToFrontend(workItem.status),
    backendStatus: workItem.status, // Store raw backend status
    created: workItem.createdAt,
    updated: workItem.updatedAt || workItem.createdAt,
    submittedBy: workItem.assignedToName || workItem.assignedTo || 'system',
    riskScore: mapRiskLevelToScore(workItem.riskLevel),
    workItemNumber: workItem.workItemNumber,
    applicationId: workItem.applicationId,
    // Additional fields
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

export const workQueueApi = {
  /**
   * Get all work items with optional filters
   */
  async getWorkItems(filters?: {
    status?: string;
    searchTerm?: string;
    country?: string;
    riskLevel?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Application[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters?.status && filters.status !== 'ALL') {
      // Map frontend status to backend status
      const statusMap: Record<string, string> = {
        'SUBMITTED': 'New',
        'IN PROGRESS': 'InProgress',
        'RISK REVIEW': 'PendingApproval',
        'COMPLETE': 'Completed',
        'DECLINED': 'Declined',
      };
      const backendStatus = statusMap[filters.status] || filters.status;
      params.append('status', backendStatus);
    }
    
    if (filters?.searchTerm) {
      params.append('searchTerm', filters.searchTerm);
    }
    
    if (filters?.country) {
      params.append('country', filters.country);
    }
    
    if (filters?.riskLevel) {
      params.append('riskLevel', filters.riskLevel);
    }
    
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 100; // Get more items for stats calculation
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    const queryString = params.toString();
    const result = await request<any>(`?${queryString}`);
    
    // Handle both camelCase and snake_case response formats
    const items = result.items || result.data || [];
    const totalCount = result.totalCount || result.total_count || 0;
    
    return {
      data: items.map(mapWorkItemToApplication),
      total: totalCount,
    };
  },

  /**
   * Get work item by ID
   */
  async getWorkItemById(id: string): Promise<Application | null> {
    try {
      const workItem = await request<WorkItemDto>(`/${id}`);
      return mapWorkItemToApplication(workItem);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get my assigned work items
   */
  async getMyWorkItems(page: number = 1, pageSize: number = 20): Promise<{ data: Application[]; total: number }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    const result = await request<any>(`/my-items?${params.toString()}`);
    
    // Handle both camelCase and snake_case response formats
    const items = result.items || result.data || [];
    const totalCount = result.totalCount || result.total_count || 0;
    
    return {
      data: items.map(mapWorkItemToApplication),
      total: totalCount,
    };
  },

  /**
   * Get pending approvals
   */
  async getPendingApprovals(page: number = 1, pageSize: number = 20): Promise<{ data: WorkItemDto[]; total: number }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    const result = await request<any>(`/pending-approvals?${params.toString()}`);
    
    // Handle both camelCase and snake_case response formats
    const items = result.items || result.data || [];
    const totalCount = result.totalCount || result.total_count || 0;
    
    return {
      data: items,
      total: totalCount,
    };
  },

  /**
   * Get items due for refresh
   */
  async getItemsDueForRefresh(page: number = 1, pageSize: number = 100, asOfDate?: Date): Promise<PagedResult<WorkItemDto>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (asOfDate) {
      params.append('asOfDate', asOfDate.toISOString());
    }
    const result = await request<PagedResult<WorkItemDto>>(`/due-for-refresh?${params.toString()}`);
    return result;
  },

  /**
   * Get work items as raw DTOs (for approvals page)
   */
  async getWorkItemsAsDto(filters?: {
    status?: string;
    searchTerm?: string;
    country?: string;
    riskLevel?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: WorkItemDto[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters?.status && filters.status !== 'ALL') {
      // Map frontend status to backend status
      const statusMap: Record<string, string> = {
        'SUBMITTED': 'New',
        'IN PROGRESS': 'InProgress',
        'RISK REVIEW': 'PendingApproval',
        'COMPLETE': 'Completed',
        'DECLINED': 'Declined',
      };
      const backendStatus = statusMap[filters.status] || filters.status;
      params.append('status', backendStatus);
    }
    
    if (filters?.searchTerm) {
      params.append('searchTerm', filters.searchTerm);
    }
    
    if (filters?.country) {
      params.append('country', filters.country);
    }
    
    if (filters?.riskLevel) {
      params.append('riskLevel', filters.riskLevel);
    }
    
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 100;
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    const queryString = params.toString();
    const result = await request<any>(`?${queryString}`);
    
    // Handle both camelCase and snake_case response formats
    const items = result.items || result.data || [];
    const totalCount = result.totalCount || result.total_count || 0;
    
    return {
      data: items,
      total: totalCount,
    };
  },

  /**
   * Export work items as CSV
   */
  async exportWorkItems(filters?: {
    status?: string;
    searchTerm?: string;
    country?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.status && filters.status !== 'ALL') {
      const statusMap: Record<string, string> = {
        'SUBMITTED': 'New',
        'IN PROGRESS': 'InProgress',
        'RISK REVIEW': 'PendingApproval',
        'COMPLETE': 'Completed',
        'DECLINED': 'Declined',
      };
      const backendStatus = statusMap[filters.status] || filters.status;
      params.append('status', backendStatus);
    }
    
    if (filters?.searchTerm) {
      params.append('searchTerm', filters.searchTerm);
    }
    
    if (filters?.country) {
      params.append('country', filters.country);
    }
    
    // Get all items for export (no pagination)
    params.append('page', '1');
    params.append('pageSize', '10000');
    
    const queryString = params.toString();
    const result = await request<any>(`?${queryString}`);
    
    // Handle both camelCase and snake_case response formats
    const items = result.items || result.data || [];
    
    // Convert to CSV
    const csvRows: string[] = [];
    
    // CSV Header
    csvRows.push('Application ID,Work Item Number,Legal Name,Entity Type,Country,Status,Priority,Risk Level,Assigned To,Created Date,Updated Date');
    
    // Helper function to escape CSV fields
    const escapeCsvField = (field: string | undefined | null): string => {
      if (!field) return '';
      const str = String(field);
      // If field contains comma, quote, or newline, wrap in quotes and escape quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    // CSV Data
    if (items && items.length > 0) {
      items.forEach((item: WorkItemDto) => {
        const app = mapWorkItemToApplication(item);
        csvRows.push([
          escapeCsvField(app.id),
          escapeCsvField(item.workItemNumber),
          escapeCsvField(app.legalName),
          escapeCsvField(app.entityType),
          escapeCsvField(app.country),
          escapeCsvField(app.status),
          escapeCsvField(item.priority),
          escapeCsvField(item.riskLevel),
          escapeCsvField(item.assignedToName || item.assignedTo),
          escapeCsvField(new Date(app.created).toLocaleDateString()),
          escapeCsvField(new Date(app.updated).toLocaleDateString()),
        ].join(','));
      });
    }
    
    const csvContent = csvRows.join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },


  /**
   * Generate a consistent GUID from a string (email or name)
   * Uses a simple hash to create a deterministic GUID
   */
  generateGuidFromString(str: string): string {
    // Simple hash function to generate consistent GUID-like string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to GUID format: 8-4-4-4-12
    const hex = Math.abs(hash).toString(16).padStart(32, '0');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  },

  /**
   * Assign work item to a user
   */
  async assignWorkItem(id: string, assignedToUserId: string, assignedToUserName: string): Promise<void> {
    // Convert string ID to GUID format if needed
    let userIdGuid: string;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignedToUserId)) {
      // Already a valid GUID (e.g., from JWT "sub" claim)
      userIdGuid = assignedToUserId;
    } else {
      // Generate a consistent GUID from the string (email/name)
      // This is a fallback for backwards compatibility
      userIdGuid = workQueueApi.generateGuidFromString(assignedToUserId);
    }
    
    // Ensure the GUID is valid
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdGuid)) {
      throw new Error(`Invalid user ID format: ${assignedToUserId}`);
    }
    
    const requestBody = {
      AssignedToUserId: userIdGuid, // Backend expects GUID string
      AssignedToUserName: assignedToUserName,
    };
    
    console.log('[WorkQueueAPI] Assigning work item:', { 
      id, 
      requestBody, 
      userIdGuid,
      originalUserId: assignedToUserId,
      isGuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignedToUserId)
    });
    
    await request(`/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  },

  /**
   * Unassign work item
   */
  async unassignWorkItem(id: string): Promise<void> {
    await request(`/${id}/unassign`, {
      method: 'POST',
    });
  },

  /**
   * Start review on work item
   */
  async startReview(id: string): Promise<void> {
    await request(`/${id}/start-review`, {
      method: 'POST',
    });
  },

  /**
   * Submit work item for approval
   */
  async submitForApproval(id: string, notes?: string): Promise<void> {
    await request(`/${id}/submit-for-approval`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || '' }),
    });
  },

  /**
   * Approve work item
   */
  async approveWorkItem(id: string, notes?: string): Promise<void> {
    await request(`/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || '' }),
    });
  },

  /**
   * Decline work item
   */
  async declineWorkItem(id: string, reason: string): Promise<void> {
    await request(`/${id}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Complete work item
   */
  async completeWorkItem(id: string, notes?: string): Promise<void> {
    await request(`/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || '' }),
    });
  },

  /**
   * Mark work item for refresh
   */
  async markForRefresh(id: string): Promise<void> {
    await request(`/${id}/mark-for-refresh`, {
      method: 'POST',
    });
  },

  /**
   * Add comment to work item
   */
  async addComment(id: string, text: string): Promise<void> {
    await request(`/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  /**
   * Get work item history
   */
  async getWorkItemHistory(id: string): Promise<any[]> {
    const result = await request<any[]>(`/${id}/history`);
    return result;
  },

  /**
   * Get work item comments
   */
  async getWorkItemComments(id: string): Promise<any[]> {
    const result = await request<any[]>(`/${id}/comments`);
    return result;
  },
};

export default workQueueApi;


