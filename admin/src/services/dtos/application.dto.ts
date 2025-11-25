/**
 * Application DTOs (Data Transfer Objects)
 * These types represent the data structures used for API communication
 */

// Backend DTO types from OnboardingCaseProjection
export interface OnboardingCaseProjection {
  id: string;
  caseId: string;
  type: string;
  status: string;
  partnerId: string;
  partnerName: string;
  partnerReferenceId: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantDateOfBirth?: string;
  applicantNationality: string;
  applicantAddress: string;
  applicantCity: string;
  applicantCountry: string;
  progressPercentage: number;
  totalSteps: number;
  completedSteps: number;
  checklistId?: string;
  checklistStatus: string;
  checklistCompletionPercentage: number;
  checklistTotalItems: number;
  checklistCompletedItems: number;
  checklistRequiredItems: number;
  checklistCompletedRequiredItems: number;
  riskAssessmentId?: string;
  riskLevel: string;
  riskScore: number;
  riskStatus: string;
  riskFactorCount: number;
  documentCount: number;
  verifiedDocumentCount: number;
  pendingDocumentCount: number;
  rejectedDocumentCount: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  requiresManualReview: boolean;
  hasComplianceIssues: boolean;
  complianceNotes?: string;
  metadataJson: string;
  businessLegalName: string;
  businessRegistrationNumber: string;
  businessTaxId: string;
  businessCountryOfRegistration: string;
  businessAddress: string;
  businessCity: string;
  businessIndustry: string;
  businessNumberOfEmployees?: number;
  businessAnnualRevenue?: number;
  businessWebsite: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Frontend Application interface
export interface Application {
  id: string;
  companyName: string;
  entityType: string;
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'RISK_REVIEW' | 'COMPLETE' | 'DECLINED';
  submittedDate: string;
  assignedTo: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  country: string;
  progress: number;
}

