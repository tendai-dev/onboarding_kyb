import { getSession } from 'next-auth/react';

const AUDIT_LOG_API_BASE_URL = process.env.NEXT_PUBLIC_AUDIT_LOG_API_BASE_URL || 'http://localhost:8011';

// Types matching the backend DTOs
export interface AuditLogEntryDto {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  caseId?: string;
  partnerId?: string;
  userId: string;
  userRole: string;
  action: string;
  description: string;
  oldValues?: string;
  newValues?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  correlationId?: string;
  severity: string;
  complianceCategory: string;
  hash: string;
  integrityVerified: boolean;
}

export interface AuditLogSearchRequest {
  eventType?: string;
  entityType?: string;
  entityId?: string;
  caseId?: string;
  partnerId?: string;
  userId?: string;
  action?: string;
  severity?: string;
  complianceCategory?: string;
  fromDate?: string;
  toDate?: string;
  skip?: number;
  take?: number;
}

export interface AuditLogSearchResult {
  entries: AuditLogEntryDto[];
  totalCount: number;
  skip: number;
  take: number;
}

class AuditLogApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await getSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // DO NOT send accessToken - API proxy will inject it from Redis
    // Add user identification headers for backend
    if (session?.user?.email) {
      headers['X-User-Email'] = session.user.email;
    }
    if (session?.user?.name) {
      headers['X-User-Name'] = session.user.name;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${AUDIT_LOG_API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const fetchPromise = fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options?.headers,
        },
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Audit Log API request failed: ${response.status} ${response.statusText}`;
        
        // Try to parse error message from JSON response
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // If not JSON, use the text as is
          if (errorText && errorText.trim().length > 0) {
            errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError || (error instanceof Error && error.message.includes('timeout'))) {
        throw new Error('Unable to connect to Audit Log service');
      }
      throw error;
    }
  }

  /**
   * Get audit log entry by ID
   */
  async getAuditLogEntry(id: string): Promise<AuditLogEntryDto> {
    return this.request<AuditLogEntryDto>(`/api/v1/audit-logs/${id}`);
  }

  /**
   * Get audit logs for a specific entity
   */
  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLogEntryDto[]> {
    return this.request<AuditLogEntryDto[]>(`/api/v1/audit-logs/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`);
  }

  /**
   * Get audit logs for a specific case
   */
  async getAuditLogsByCase(caseId: string): Promise<AuditLogEntryDto[]> {
    return this.request<AuditLogEntryDto[]>(`/api/v1/audit-logs/case/${encodeURIComponent(caseId)}`);
  }

  /**
   * Search audit logs with criteria
   */
  async searchAuditLogs(criteria: AuditLogSearchRequest): Promise<AuditLogSearchResult> {
    return this.request<AuditLogSearchResult>('/api/v1/audit-logs/search', {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  }

  /**
   * Get all audit logs (using search with no filters)
   */
  async getAllAuditLogs(skip: number = 0, take: number = 100): Promise<AuditLogSearchResult> {
    return this.searchAuditLogs({ skip, take });
  }
}

export const auditLogApiService = new AuditLogApiService();

