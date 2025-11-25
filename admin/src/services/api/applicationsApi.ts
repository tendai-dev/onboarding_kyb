/**
 * Applications API Client
 * Thin HTTP client for applications endpoints
 * All business logic and mapping should be in use-cases layer
 */

import { OnboardingCaseProjection, PagedResult } from '../dtos/application.dto';

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3001';

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
    throw new Error(`Failed to fetch applications: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Transform response to match PagedResult interface
  return {
    items: data.items || data.data || [],
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
    throw new Error(`Failed to fetch application: ${response.status} ${response.statusText}`);
  }

  return response.json();
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
    throw new Error(`Failed to update application status: ${response.status} ${response.statusText}`);
  }
}

