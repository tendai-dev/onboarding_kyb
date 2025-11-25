/**
 * Application Use Cases
 * Business logic and orchestration for application operations
 * This layer coordinates between API clients, mappers, and domain logic
 */

import { getApplications, getApplicationById, updateApplicationStatus } from '../api/applicationsApi';
import { mapProjectionToApplication, mapProjectionsToApplications } from '../mappers/applicationMapper';
import { Application, OnboardingCaseProjection, PagedResult } from '../dtos/application.dto';

/**
 * Get applications with frontend domain model
 */
export async function fetchApplications(
  page: number = 1,
  pageSize: number = 20,
  searchTerm?: string,
  status?: string
): Promise<PagedResult<Application>> {
  // Call API to get backend DTOs
  const backendResult = await getApplications(page, pageSize, searchTerm, status);
  
  // Map backend DTOs to frontend domain models
  const applications = mapProjectionsToApplications(backendResult.items);
  
  // Return with frontend domain models
  return {
    items: applications,
    totalCount: backendResult.totalCount,
    page: backendResult.page,
    pageSize: backendResult.pageSize,
  };
}

/**
 * Get application by ID with frontend domain model
 */
export async function fetchApplicationById(id: string): Promise<Application> {
  // Call API to get backend DTO
  const projection = await getApplicationById(id);
  
  // Map to frontend domain model
  return mapProjectionToApplication(projection);
}

/**
 * Update application status (business logic layer)
 */
export async function updateApplicationStatusUseCase(
  id: string,
  status: string,
  notes?: string
): Promise<void> {
  // Validate status transition (business logic)
  const validStatuses = ['SUBMITTED', 'IN_PROGRESS', 'RISK_REVIEW', 'COMPLETE', 'DECLINED'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  // Call API
  await updateApplicationStatus(id, status, notes);
}

/**
 * Get application with full details (includes related data)
 */
export async function fetchApplicationWithDetails(id: string): Promise<{
  application: Application;
  projection: OnboardingCaseProjection;
}> {
  const projection = await getApplicationById(id);
  const application = mapProjectionToApplication(projection);
  
  return {
    application,
    projection,
  };
}

/**
 * Export applications as CSV
 */
export async function exportApplications(filters?: {
  status?: string;
  search?: string;
  riskLevel?: string;
}): Promise<Blob> {
  // Get all items for export (no pagination)
  const result = await fetchApplications(
    1,
    10000, // Get all items
    filters?.search,
    filters?.status
  );
  
  // Convert to CSV
  const { escapeCsvField, createCsvBlob } = await import('../utils/csvExport');
  
  const headers = [
    'Application ID',
    'Company Name',
    'Entity Type',
    'Country',
    'Status',
    'Risk Level',
    'Assigned To',
    'Progress',
    'Submitted Date'
  ];
  
  const rows = result.items.map(app => [
    escapeCsvField(app.id),
    escapeCsvField(app.companyName),
    escapeCsvField(app.entityType),
    escapeCsvField(app.country),
    escapeCsvField(app.status),
    escapeCsvField(app.riskLevel),
    escapeCsvField(app.assignedTo),
    escapeCsvField(`${app.progress}%`),
    escapeCsvField(new Date(app.submittedDate).toLocaleDateString()),
  ]);
  
  return createCsvBlob(headers, rows);
}
