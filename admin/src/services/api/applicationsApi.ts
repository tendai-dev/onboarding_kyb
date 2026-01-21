/**
 * Applications API Client
 * Thin HTTP client for applications endpoints
 * All business logic and mapping should be in use-cases layer
 */

import { OnboardingCaseProjection, PagedResult } from '../dtos/application.dto';

// Use NEXTAUTH_URL or NEXT_PUBLIC_APP_URL for server-side requests, relative path for client-side
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return ''; // Use relative path in browser
  }
  // Server-side: use NEXTAUTH_URL or NEXT_PUBLIC_APP_URL, fallback to localhost
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
};
const API_BASE_URL = getApiBaseUrl();

// Helper function to convert snake_case to camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Transform snake_case object keys to camelCase
function transformKeys<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item)) as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[snakeToCamel(key)] = transformKeys(value);
    }
    return result as T;
  }
  return obj as T;
}

/**
 * Get applications from projections API
 */
export async function getApplications(
  page: number = 1,
  pageSize: number = 20,
  searchTerm?: string,
  status?: string
): Promise<PagedResult<OnboardingCaseProjection>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (searchTerm) {
    params.append('searchTerm', searchTerm);
  }

  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`${API_BASE_URL}/api/applications?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch applications: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Transform response to match PagedResult interface
  // Transform snake_case keys to camelCase
  const items = transformKeys<OnboardingCaseProjection[]>(data.items || data.data || []);

  return {
    items,
    totalCount: data.total_count || data.totalCount || data.total || 0,
    page: data.page || page,
    pageSize: data.page_size || data.pageSize || pageSize,
  };
}

/**
 * Get application by ID
 */
export async function getApplicationById(id: string): Promise<OnboardingCaseProjection> {
  const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch application: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return transformKeys<OnboardingCaseProjection>(data);
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  id: string,
  status: string,
  notes?: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/applications/${id}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to update application status: ${response.status} ${response.statusText}`
    );
  }
}
