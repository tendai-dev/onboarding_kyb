/**
 * WorkQueue API Client
 * Thin HTTP client for work queue endpoints
 * All business logic and mapping should be in use-cases layer
 */

import { WorkItemDto, PagedResult } from '../dtos/workQueue.dto';

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3001';

/**
 * Get auth headers for API requests
 */
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
      // Silently fail - proxy will handle auth
    }
  }

  return headers;
}

/**
 * Make API request
 */
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let cleanEndpoint = endpoint;
  if (endpoint.startsWith('?')) {
    cleanEndpoint = endpoint;
  } else if (!endpoint.startsWith('/')) {
    cleanEndpoint = `/${endpoint}`;
  }
  
  const url = `${API_BASE_URL}/api/workqueue${cleanEndpoint}`;
  const headers = await getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Work Queue API request failed: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If JSON parsing fails, use status text
    }
    
    throw new Error(errorMessage);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text || text.trim() === '') {
    return null as T;
  }
  
  return JSON.parse(text) as T;
}

/**
 * Get work items (returns raw DTOs)
 */
export async function getWorkItems(filters?: {
  status?: string;
  searchTerm?: string;
  country?: string;
  riskLevel?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<WorkItemDto>> {
  const params = new URLSearchParams();
  
  if (filters?.status && filters.status !== 'ALL') {
    params.append('status', filters.status);
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
  
  const result = await request<any>(`?${params.toString()}`);
  
  // Handle both camelCase and snake_case response formats
  const items = result.items || result.data || [];
  const totalCount = result.totalCount || result.total_count || 0;
  
  return {
    items,
    totalCount,
    page,
    pageSize,
  };
}

/**
 * Get work item by ID
 */
export async function getWorkItemById(id: string): Promise<WorkItemDto | null> {
  try {
    return await request<WorkItemDto>(`/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get my assigned work items
 */
export async function getMyWorkItems(page: number = 1, pageSize: number = 20): Promise<PagedResult<WorkItemDto>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  const result = await request<any>(`/my-items?${params.toString()}`);
  
  const items = result.items || result.data || [];
  const totalCount = result.totalCount || result.total_count || 0;
  
  return {
    items,
    totalCount,
    page,
    pageSize,
  };
}

/**
 * Get pending approvals
 */
export async function getPendingApprovals(page: number = 1, pageSize: number = 20): Promise<PagedResult<WorkItemDto>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  const result = await request<any>(`/pending-approvals?${params.toString()}`);
  
  const items = result.items || result.data || [];
  const totalCount = result.totalCount || result.total_count || 0;
  
  return {
    items,
    totalCount,
    page,
    pageSize,
  };
}

/**
 * Get items due for refresh
 */
export async function getItemsDueForRefresh(page: number = 1, pageSize: number = 100, asOfDate?: Date): Promise<PagedResult<WorkItemDto>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (asOfDate) {
    params.append('asOfDate', asOfDate.toISOString());
  }
  
  return await request<PagedResult<WorkItemDto>>(`/due-for-refresh?${params.toString()}`);
}

/**
 * Assign work item to a user
 */
export async function assignWorkItem(id: string, assignedToUserId: string, assignedToUserName: string): Promise<void> {
  // Generate GUID if needed (for backwards compatibility)
  let userIdGuid: string;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignedToUserId)) {
    userIdGuid = assignedToUserId;
  } else {
    // Simple hash to generate consistent GUID
    let hash = 0;
    for (let i = 0; i < assignedToUserId.length; i++) {
      const char = assignedToUserId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(32, '0');
    userIdGuid = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  }
  
  await request(`/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({
      AssignedToUserId: userIdGuid,
      AssignedToUserName: assignedToUserName,
    }),
  });
}

/**
 * Unassign work item
 */
export async function unassignWorkItem(id: string): Promise<void> {
  await request(`/${id}/unassign`, {
    method: 'POST',
  });
}

/**
 * Start review on work item
 */
export async function startReview(id: string): Promise<void> {
  await request(`/${id}/start-review`, {
    method: 'POST',
  });
}

/**
 * Submit work item for approval
 */
export async function submitForApproval(id: string, notes?: string): Promise<void> {
  await request(`/${id}/submit-for-approval`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || '' }),
  });
}

/**
 * Approve work item
 */
export async function approveWorkItem(id: string, notes?: string): Promise<void> {
  await request(`/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || '' }),
  });
}

/**
 * Decline work item
 */
export async function declineWorkItem(id: string, reason: string): Promise<void> {
  await request(`/${id}/decline`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Complete work item
 */
export async function completeWorkItem(id: string, notes?: string): Promise<void> {
  await request(`/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || '' }),
  });
}

/**
 * Mark work item for refresh
 */
export async function markForRefresh(id: string): Promise<void> {
  await request(`/${id}/mark-for-refresh`, {
    method: 'POST',
  });
}

/**
 * Add comment to work item
 */
export async function addComment(id: string, text: string): Promise<void> {
  await request(`/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/**
 * Get work item comments
 */
export async function getWorkItemComments(id: string): Promise<any[]> {
  return await request<any[]>(`/${id}/comments`);
}

/**
 * Get work item history
 */
export async function getWorkItemHistory(id: string): Promise<any[]> {
  return await request<any[]>(`/${id}/history`);
}

