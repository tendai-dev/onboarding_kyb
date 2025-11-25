/**
 * Application Mappers
 * Functions to transform between backend DTOs and frontend domain models
 */

import { OnboardingCaseProjection, Application } from '../dtos/application.dto';

// Status mapping from backend to frontend
function mapBackendStatusToFrontend(backendStatus: string): Application['status'] {
  const statusMap: Record<string, Application['status']> = {
    'Draft': 'IN_PROGRESS',
    'InProgress': 'IN_PROGRESS',
    'PendingReview': 'RISK_REVIEW',
    'Submitted': 'SUBMITTED',
    'Approved': 'COMPLETE',
    'Rejected': 'DECLINED',
    'Cancelled': 'DECLINED',
  };
  
  return statusMap[backendStatus] || 'IN_PROGRESS';
}

// Risk level mapping from backend to frontend
function mapBackendRiskLevelToFrontend(riskLevel: string): Application['riskLevel'] {
  const riskMap: Record<string, Application['riskLevel']> = {
    'Low': 'LOW',
    'MediumLow': 'LOW',
    'Medium': 'MEDIUM',
    'MediumHigh': 'HIGH',
    'High': 'HIGH',
  };
  
  return riskMap[riskLevel] || 'MEDIUM';
}

/**
 * Map OnboardingCaseProjection (backend DTO) to Application (frontend model)
 */
export function mapProjectionToApplication(projection: OnboardingCaseProjection): Application {
  // Determine company name - use business legal name if available, otherwise use applicant name
  const companyName = projection.businessLegalName || 
                     `${projection.applicantFirstName} ${projection.applicantLastName}`.trim() ||
                     'Unknown';
  
  // Determine country - use business country if available, otherwise use applicant country
  const country = projection.businessCountryOfRegistration || 
                 projection.applicantCountry || 
                 'Unknown';
  
  // Determine entity type - use type from projection, or derive from business info
  const entityType = projection.type || 
                    (projection.businessLegalName ? 'Business' : 'Individual') ||
                    'Unknown';
  
  // Get assigned to name or fallback
  const assignedTo = projection.assignedToName || 
                    projection.assignedTo || 
                    'Unassigned';
  
  // Get submitted date or created date
  const submittedDate = projection.submittedAt || 
                       projection.createdAt;
  
  // Get progress percentage (round to integer)
  const progress = Math.round(projection.progressPercentage || 0);

  return {
    id: projection.caseId || projection.id,
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
export function mapProjectionsToApplications(projections: OnboardingCaseProjection[]): Application[] {
  return projections.map(mapProjectionToApplication);
}

