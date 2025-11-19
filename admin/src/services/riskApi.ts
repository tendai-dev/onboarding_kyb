import { getSession } from 'next-auth/react';

// Use Next.js API route proxy (same origin, no CORS issues)
// This will proxy to the gateway at /api/risk
const RISK_API_BASE_URL = typeof window !== 'undefined' 
  ? '' // Use relative URL in browser (will use Next.js API route)
  : (process.env.RISK_API_BASE_URL || 
     process.env.NEXT_PUBLIC_GATEWAY_URL || 
     'http://127.0.0.1:8000');
const PROJECTIONS_API_BASE_URL = process.env.NEXT_PUBLIC_PROJECTIONS_API_BASE_URL || 'http://localhost:8090';

// Backend DTO types matching RiskAssessmentDto
export interface RiskAssessmentDto {
  id: string;
  caseId: string;
  partnerId: string;
  overallRiskLevel: string;
  riskScore: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  assessedBy?: string;
  notes?: string;
  factors: RiskFactorDto[];
}

export interface RiskFactorDto {
  id: string;
  type: string;
  level: string;
  score: number;
  description: string;
  source?: string;
  createdAt: string;
  updatedAt?: string;
}

// Case details from projections API
export interface CaseDetails {
  id: string;
  caseId: string;
  type: string;
  status: string;
  businessLegalName?: string;
  businessRegistrationNumber?: string;
  businessCountryOfRegistration?: string;
  applicantFirstName?: string;
  applicantLastName?: string;
  applicantEmail?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  submittedAt?: string;
  metadataJson?: string;
}

// Frontend interface for enriched risk assessment
export interface EnrichedRiskAssessment {
  id: string;
  applicationId: string;
  caseId: string;
  companyName: string;
  entityType: string;
  riskLevel: 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  assignedTo: string;
  submittedDate: string;
  reviewDate?: string;
  reviewer?: string;
  riskFactors: string[];
  recommendations: string[];
}

class RiskApiService {
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
    if (session?.user?.role) {
      headers['X-User-Role'] = session.user.role;
    }

    // Add development headers for backend services (fallback)
    if (process.env.NODE_ENV === 'development' && !session?.user?.email) {
      headers['X-User-Id'] = 'admin-user-id';
      headers['X-User-Email'] = 'admin@mukuru.com';
      headers['X-User-Name'] = 'Admin User';
      headers['X-User-Role'] = 'Administrator';
    }

    return headers;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const headers = await this.getAuthHeaders();

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000);
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
        let errorMessage = `Risk API request failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          if (errorText && errorText.trim().length > 0) {
            errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return null as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError || (error instanceof Error && error.message.includes('timeout'))) {
        throw new Error('Unable to connect to Risk service. Please ensure the service is running.');
      }
      throw error;
    }
  }

  /**
   * Get case details from projections API
   */
  private async getCaseDetails(caseId: string): Promise<CaseDetails | null> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${PROJECTIONS_API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch case details: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.warn(`Failed to fetch case details for ${caseId}:`, error);
      return null;
    }
  }

  /**
   * Map backend risk level to frontend format
   * Backend: Unknown, Low, MediumLow, Medium, MediumHigh, High
   * Frontend: UNKNOWN, LOW, MEDIUM, HIGH, CRITICAL
   * Note: Backend doesn't have CRITICAL, so we map High scores (>=90) to CRITICAL for display
   */
  private mapRiskLevel(level: string, score?: number): 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const upperLevel = level.toUpperCase();
    if (upperLevel === 'UNKNOWN' || !level || level.trim() === '') return 'UNKNOWN';
    if (upperLevel === 'LOW' || upperLevel === 'MEDIUMLOW') return 'LOW';
    if (upperLevel === 'MEDIUM') return 'MEDIUM';
    if (upperLevel === 'MEDIUMHIGH') return 'MEDIUM';
    if (upperLevel === 'HIGH') {
      // Map High with score >= 90 to CRITICAL for frontend display
      if (score !== undefined && score >= 90) return 'CRITICAL';
      return 'HIGH';
    }
    if (upperLevel === 'CRITICAL') return 'CRITICAL';
    return 'UNKNOWN'; // Default to UNKNOWN for manual review
  }

  /**
   * Map frontend risk level to backend format
   * Frontend: UNKNOWN, LOW, MEDIUM, HIGH, CRITICAL
   * Backend: Unknown, Low, MediumLow, Medium, MediumHigh, High
   */
  private mapRiskLevelToBackend(level: string): string {
    const upperLevel = level.toUpperCase();
    if (upperLevel === 'UNKNOWN') return 'Unknown';
    if (upperLevel === 'LOW') return 'Low';
    if (upperLevel === 'MEDIUM') return 'Medium';
    if (upperLevel === 'HIGH') return 'High';
    if (upperLevel === 'CRITICAL') return 'High'; // Map CRITICAL to High for backend
    return 'Unknown';
  }

  /**
   * Map backend status to frontend format
   * Backend: InProgress, Completed, Rejected, RequiresReview
   * Frontend: PENDING, IN_REVIEW, APPROVED, REJECTED
   */
  private mapStatus(status: string): 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' {
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'INPROGRESS' || upperStatus === 'REQUIRESREVIEW') return 'IN_REVIEW';
    if (upperStatus === 'COMPLETED') return 'APPROVED';
    if (upperStatus === 'REJECTED') return 'REJECTED';
    // Default to PENDING for unknown statuses
    return 'PENDING';
  }

  /**
   * Get entity type display name from metadata or case type
   */
  private getEntityTypeDisplay(caseDetails: CaseDetails | null): string {
    if (!caseDetails) return 'Unknown';
    
    // Try to parse metadata for entity type
    if (caseDetails.metadataJson) {
      try {
        const metadata = JSON.parse(caseDetails.metadataJson);
        if (metadata.entityType) {
          return metadata.entityType;
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Fallback to case type
    return caseDetails.type || 'Unknown';
  }

  /**
   * Get company name from case details
   */
  private getCompanyName(caseDetails: CaseDetails | null): string {
    if (!caseDetails) return 'Unknown Company';
    
    // For business cases, use business legal name
    if (caseDetails.businessLegalName) {
      return caseDetails.businessLegalName;
    }
    
    // For individual cases, use applicant name
    if (caseDetails.applicantFirstName || caseDetails.applicantLastName) {
      return `${caseDetails.applicantFirstName || ''} ${caseDetails.applicantLastName || ''}`.trim() || 'Individual Applicant';
    }
    
    return 'Unknown Company';
  }

  /**
   * List all risk assessments with enriched case details
   */
  async listRiskAssessments(filters?: {
    partnerId?: string;
    riskLevel?: string;
    status?: string;
    caseId?: string;
  }): Promise<EnrichedRiskAssessment[]> {
    const params = new URLSearchParams();
    if (filters?.partnerId) params.append('partnerId', filters.partnerId);
    if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.caseId) params.append('caseId', filters.caseId);

    const queryString = params.toString();
    // Use Next.js API route proxy (same origin, no CORS issues)
    // This will proxy to the gateway at /api/risk/risk-assessments
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments${queryString ? `?${queryString}` : ''}`;
    
    const assessments = await this.request<RiskAssessmentDto[]>(url);

    // Enrich each assessment with case details
    const enrichedAssessments = await Promise.all(
      assessments.map(async (assessment) => {
        const caseDetails = await this.getCaseDetails(assessment.caseId);
        
        const riskScore = Number(assessment.riskScore);
        return {
          id: assessment.id,
          applicationId: assessment.caseId,
          caseId: assessment.caseId,
          companyName: this.getCompanyName(caseDetails),
          entityType: this.getEntityTypeDisplay(caseDetails),
          // Map risk level with score consideration (High with score >=90 becomes CRITICAL)
          riskLevel: this.mapRiskLevel(assessment.overallRiskLevel, riskScore),
          riskScore: riskScore,
          status: this.mapStatus(assessment.status),
          assignedTo: caseDetails?.assignedToName || caseDetails?.assignedTo || 'Unassigned',
          submittedDate: caseDetails?.submittedAt || assessment.createdAt,
          reviewDate: assessment.completedAt,
          reviewer: assessment.assessedBy,
          riskFactors: assessment.factors.map(f => f.description),
          recommendations: assessment.notes ? [assessment.notes] : [],
        } as EnrichedRiskAssessment;
      })
    );

    return enrichedAssessments;
  }

  /**
   * Get a specific risk assessment by ID
   */
  async getRiskAssessment(id: string): Promise<EnrichedRiskAssessment | null> {
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments/${id}`;
    const assessment = await this.request<RiskAssessmentDto>(url);
    
    if (!assessment) return null;

    const caseDetails = await this.getCaseDetails(assessment.caseId);
    const riskScore = Number(assessment.riskScore);
    
    return {
      id: assessment.id,
      applicationId: assessment.caseId,
      caseId: assessment.caseId,
      companyName: this.getCompanyName(caseDetails),
      entityType: this.getEntityTypeDisplay(caseDetails),
      // Map risk level with score consideration
      riskLevel: this.mapRiskLevel(assessment.overallRiskLevel, riskScore),
      riskScore: riskScore,
      status: this.mapStatus(assessment.status),
      assignedTo: caseDetails?.assignedToName || caseDetails?.assignedTo || 'Unassigned',
      submittedDate: caseDetails?.submittedAt || assessment.createdAt,
      reviewDate: assessment.completedAt,
      reviewer: assessment.assessedBy,
      riskFactors: assessment.factors.map(f => f.description),
      recommendations: assessment.notes ? [assessment.notes] : [],
    };
  }

  /**
   * Get risk assessment by case ID
   */
  async getRiskAssessmentByCase(caseId: string): Promise<EnrichedRiskAssessment | null> {
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments/case/${encodeURIComponent(caseId)}`;
    const assessment = await this.request<RiskAssessmentDto>(url);
    
    if (!assessment) return null;

    const caseDetails = await this.getCaseDetails(assessment.caseId);
    const riskScore = Number(assessment.riskScore);
    
    return {
      id: assessment.id,
      applicationId: assessment.caseId,
      caseId: assessment.caseId,
      companyName: this.getCompanyName(caseDetails),
      entityType: this.getEntityTypeDisplay(caseDetails),
      // Map risk level with score consideration
      riskLevel: this.mapRiskLevel(assessment.overallRiskLevel, riskScore),
      riskScore: riskScore,
      status: this.mapStatus(assessment.status),
      assignedTo: caseDetails?.assignedToName || caseDetails?.assignedTo || 'Unassigned',
      submittedDate: caseDetails?.submittedAt || assessment.createdAt,
      reviewDate: assessment.completedAt,
      reviewer: assessment.assessedBy,
      riskFactors: assessment.factors.map(f => f.description),
      recommendations: assessment.notes ? [assessment.notes] : [],
    };
  }

  /**
   * Manually set risk level (admin decision)
   * Maps frontend risk level (including CRITICAL) to backend format
   */
  async setManualRiskLevel(
    assessmentId: string,
    riskLevel: string,
    justification: string
  ): Promise<any> {
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments/${assessmentId}/set-risk-level`;
    // Map frontend risk level to backend format (CRITICAL -> High)
    const backendRiskLevel = this.mapRiskLevelToBackend(riskLevel);
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify({
        riskLevel: backendRiskLevel,
        justification,
      }),
    });
  }

  /**
   * Complete a risk assessment
   */
  async completeRiskAssessment(assessmentId: string, notes?: string): Promise<any> {
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments/${assessmentId}/complete`;
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  /**
   * Reject a risk assessment
   */
  async rejectRiskAssessment(assessmentId: string, reason: string): Promise<any> {
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments/${assessmentId}/reject`;
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Create a new risk assessment for a case
   */
  async createRiskAssessment(caseId: string, partnerId: string): Promise<any> {
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments`;
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify({ caseId, partnerId }),
    });
  }
}

export const riskApiService = new RiskApiService();

