/**
 * Integration Service for syncing application progress with backend services
 * Handles communication with Checklist and Work-Queue services
 * SECURITY: All API calls go through the proxy which injects tokens from Redis
 */

const CHECKLIST_API_BASE_URL = typeof window !== 'undefined' 
  ? '/api/proxy' // Use proxy endpoint in browser (tokens injected server-side)
  : (process.env.NEXT_PUBLIC_CHECKLIST_API_BASE_URL || 'http://localhost:8093');
  
const WORK_QUEUE_API_BASE_URL = typeof window !== 'undefined' 
  ? '/api/proxy' // Use proxy endpoint in browser (tokens injected server-side)
  : (process.env.NEXT_PUBLIC_WORK_QUEUE_API_BASE_URL || 'http://localhost:8094');

export interface ChecklistItemUpdate {
  checklistId: string;
  itemCode: string;
  notes?: string;
}

export interface WorkQueueUpdate {
  applicationId: string;
  status?: string;
  progress?: number;
  notes?: string;
}

class IntegrationService {
  private async request<T>(
    baseUrl: string,
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // In browser, use proxy endpoint; server-side can use direct URL
    const url = typeof window !== 'undefined' 
      ? `${baseUrl}${endpoint}` // Proxy endpoint
      : `${baseUrl}${endpoint}`; // Direct URL (server-side)
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    try {
      // SECURITY: Include credentials to send session cookie (browser only)
      // Proxy will automatically inject Authorization header from Redis
      const response = await fetch(url, {
        ...options,
        credentials: typeof window !== 'undefined' ? 'include' : undefined, // Include session cookie in browser
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Integration API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      if (response.status === 204) {
        return null as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Unable to connect to integration service');
      }
      throw error;
    }
  }

  /**
   * Mark a checklist item as completed
   */
  async completeChecklistItem(
    checklistId: string,
    itemId: string,
    completedBy: string,
    notes?: string
  ): Promise<void> {
    await this.request<void>(
      CHECKLIST_API_BASE_URL,
      `/api/v1/checklists/${checklistId}/items/${itemId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({
          completedBy,
          notes,
        }),
      }
    );
  }

  /**
   * Get checklist by case ID
   */
  async getChecklistByCase(caseId: string): Promise<any> {
    return this.request<any>(
      CHECKLIST_API_BASE_URL,
      `/api/v1/checklists/by-case/${caseId}`
    );
  }

  /**
   * Update work queue item status/progress
   */
  async updateWorkQueueItem(
    applicationId: string,
    update: Partial<WorkQueueUpdate>
  ): Promise<void> {
    await this.request<void>(
      WORK_QUEUE_API_BASE_URL,
      `/api/v1/workqueue/items/by-application/${applicationId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(update),
      }
    );
  }

  /**
   * Get work item by application ID
   */
  async getWorkItemByApplication(applicationId: string): Promise<any> {
    return this.request<any>(
      WORK_QUEUE_API_BASE_URL,
      `/api/v1/workqueue/items/by-application/${applicationId}`
    );
  }
}

export const integrationService = new IntegrationService();

