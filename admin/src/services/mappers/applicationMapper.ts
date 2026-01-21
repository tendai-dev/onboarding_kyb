/* eslint-disable security/detect-object-injection */
/**
 * Application Mappers
 * Functions to transform between backend DTOs and frontend domain models
 */

import { OnboardingCaseProjection, Application } from '../dtos/application.dto';

// Status mapping from backend to frontend
function mapBackendStatusToFrontend(backendStatus: string): Application['status'] {
  const statusMap: Record<string, Application['status']> = {
    // PascalCase backend statuses (original)
    Draft: 'IN_PROGRESS',
    InProgress: 'IN_PROGRESS',
    PendingReview: 'RISK_REVIEW',
    Submitted: 'SUBMITTED',
    UnderReview: 'IN_PROGRESS',
    Approved: 'COMPLETE',
    Rejected: 'DECLINED',
    Cancelled: 'DECLINED',
    // Uppercase frontend statuses (when synced from work queue)
    IN_PROGRESS: 'IN_PROGRESS',
    SUBMITTED: 'SUBMITTED',
    RISK_REVIEW: 'RISK_REVIEW',
    COMPLETE: 'COMPLETE',
    DECLINED: 'DECLINED',
  };

  return statusMap[backendStatus] || 'IN_PROGRESS';
}

// Risk level mapping from backend to frontend
function mapBackendRiskLevelToFrontend(riskLevel: string): Application['riskLevel'] {
  const riskMap: Record<string, Application['riskLevel']> = {
    Low: 'LOW',
    MediumLow: 'LOW',
    Medium: 'MEDIUM',
    MediumHigh: 'HIGH',
    High: 'HIGH',
  };

  return riskMap[riskLevel] || 'MEDIUM';
}

/**
 * Map OnboardingCaseProjection (backend DTO) to Application (frontend model)
 */
export function mapProjectionToApplication(
  projection: OnboardingCaseProjection
): Application {
  // Helper function to check if a string is truthy and not empty
  // Also checks for common invalid values like "undefined", "null", "N/A", etc.
  const isNonEmptyString = (value: string | undefined | null): boolean => {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    // Check for common invalid values
    const lower = trimmed.toLowerCase();
    const invalidValues = ['undefined', 'null', 'n/a', 'na', 'none', 'unknown', ''];
    return !invalidValues.includes(lower);
  };

  // Parse metadata if available
  let metadata: Record<string, unknown> = {};
  try {
    if (projection.metadataJson) {
      metadata =
        typeof projection.metadataJson === 'string'
          ? JSON.parse(projection.metadataJson)
          : projection.metadataJson;
    }
  } catch {
    // Ignore parse errors, use empty metadata
  }

  // Determine company name - check multiple sources in priority order:
  // 1. businessLegalName (direct field)
  // 2. metadata.legal_name or metadata.businessLegalName
  // 3. applicantFirstName + applicantLastName
  // 4. metadata.companyname or other metadata fields
  // 5. partnerName as last resort
  let companyName = 'Unknown';

  // Try businessLegalName first
  if (isNonEmptyString(projection.businessLegalName)) {
    companyName = projection.businessLegalName.trim();
  }
  // Try metadata fields
  else if (metadata && typeof metadata === 'object') {
    const metadataName =
      (metadata.legal_name as string) ||
      (metadata.businessLegalName as string) ||
      (metadata.legalName as string) ||
      (metadata.companyname as string) ||
      (metadata.company_name as string) ||
      (metadata.business_name as string) ||
      (metadata.businessName as string) ||
      (metadata.name as string);

    if (isNonEmptyString(metadataName)) {
      companyName = String(metadataName).trim();
    }
  }

  // If still unknown, try applicant name
  if (companyName === 'Unknown' || !isNonEmptyString(companyName)) {
    const firstName = (projection.applicantFirstName || '').trim();
    const lastName = (projection.applicantLastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    if (isNonEmptyString(fullName)) {
      companyName = fullName;
    } else if (isNonEmptyString(projection.partnerName)) {
      // Last resort: use partner name
      companyName = projection.partnerName.trim();
    }
  }

  // Determine country - use business country if available, otherwise use applicant country
  const country =
    (isNonEmptyString(projection.businessCountryOfRegistration)
      ? projection.businessCountryOfRegistration
      : null) ||
    (isNonEmptyString(projection.applicantCountry)
      ? projection.applicantCountry
      : null) ||
    'Unknown';

  // Determine entity type - use type from projection, or derive from business info
  const entityType =
    (isNonEmptyString(projection.type) ? projection.type : null) ||
    (isNonEmptyString(projection.businessLegalName) ? 'Business' : 'Individual') ||
    'Unknown';

  // Get assigned to name or fallback - check for empty strings
  const assignedTo =
    (isNonEmptyString(projection.assignedToName) ? projection.assignedToName : null) ||
    (isNonEmptyString(projection.assignedTo) ? projection.assignedTo : null) ||
    'Unassigned';

  // Get submitted date or created date
  const submittedDate = projection.submittedAt || projection.createdAt;

  // Get progress percentage (round to integer)
  const progress = Math.round(projection.progressPercentage || 0);

  return {
    // Use projection.id (the GUID) as the primary identifier for API calls
    // projection.caseId is the case number (display string like "CASE-001"), not the GUID
    id: projection.id,
    companyName,
    entityType,
    status: mapBackendStatusToFrontend(projection.status),
    submittedDate,
    assignedTo,
    riskLevel: mapBackendRiskLevelToFrontend(projection.riskLevel),
    country,
    progress,
  };
}

/**
 * Map array of projections to applications
 */
export function mapProjectionsToApplications(
  projections: OnboardingCaseProjection[]
): Application[] {
  return projections.map(mapProjectionToApplication);
}
