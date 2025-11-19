import { getSession } from 'next-auth/react';

// Use Next.js API route proxy (same origin, no CORS issues)
const MIGRATION_API_BASE_URL = typeof window !== 'undefined' 
  ? '/api/migrations' // Use relative URL in browser (will use Next.js API route)
  : (process.env.MIGRATION_API_BASE_URL || 
     process.env.ONBOARDING_API_BASE_URL ||
     'http://127.0.0.1:8001');

export interface MigrationJobDto {
  id: string;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  startTime?: string;
  endTime?: string;
  errorMessage?: string;
  entityType: string;
  source: string;
}

class MigrationApiService {
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const session = await getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // DO NOT send accessToken - API proxy will inject it from Redis
    // Add user identification headers for backend
    if (session?.user?.email) {
      headers['X-User-Email'] = session.user.email;
    }
    if (session?.user?.name) {
      headers['X-User-Name'] = session.user.name;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, get text
        const text = await response.text().catch(() => 'Unknown error');
        errorData = { error: text || `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Include more details in error message
      const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`;
      const fullError = errorData.details ? `${errorMessage} - ${errorData.details}` : errorMessage;
      throw new Error(fullError);
    }

    return response.json();
  }

  /**
   * Get all migration jobs
   */
  async getMigrationJobs(): Promise<MigrationJobDto[]> {
    const url = `${MIGRATION_API_BASE_URL}`;
    return this.request<MigrationJobDto[]>(url);
  }

  /**
   * Get migration job by ID
   */
  async getMigrationJob(id: string): Promise<MigrationJobDto> {
    const url = `${MIGRATION_API_BASE_URL}/${id}`;
    return this.request<MigrationJobDto>(url);
  }

  /**
   * Start a new migration job
   */
  async startMigration(
    name: string,
    entityType: string,
    file: File,
    source?: string
  ): Promise<MigrationJobDto> {
    const url = `${MIGRATION_API_BASE_URL}/start`;
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('entityType', entityType);
    formData.append('file', file);
    if (source) {
      formData.append('source', source);
    }

    const session = await getSession();
    
    // DO NOT send accessToken - API proxy will inject it from Redis
    // Only add user identification headers for backend
    const headers: Record<string, string> = {};
    if (session?.user?.email) {
      headers['X-User-Email'] = session.user.email;
    }
    if (session?.user?.name) {
      headers['X-User-Name'] = session.user.name;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const migrationApi = new MigrationApiService();

