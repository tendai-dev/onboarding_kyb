/**
 * Risk Assessment API Service
 * Client for risk assessment endpoints
 */

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3001';

export interface RiskFactorDto {
  id: string;
  type: string;
  level: string;
  score?: number;
  description: string;
  createdAt: string;
}

export interface RiskAssessmentDto {
  id: string;
  caseId: string;
  partnerId: string;
  overallRiskLevel: string;
  riskScore?: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  assessedBy?: string;
  notes?: string;
  factors: RiskFactorDto[];
}

export interface RiskAssessmentFormData {
  partnerCustomerDetails: string;
  mukuruDetails: string;
  enhancedDueDiligenceFindings: string;
  adverseMediaAssessment: string;
}

export interface EnrichedRiskAssessment extends RiskAssessmentDto {
  caseNumber?: string;
  applicantName?: string;
  businessName?: string;
  entityType?: string;
  country?: string;
}

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

class RiskApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    return headers;
  }

  /**
   * Get risk assessment by case ID
   * Returns null if not found (404) instead of throwing
   */
  async getRiskAssessmentByCase(caseId: string): Promise<RiskAssessmentDto | null> {
    // Clean caseId - remove leading underscores and trim
    const cleanCaseId = caseId.trim().replace(/^_+/, '');

    // Encode the caseId to handle special characters in URL
    const encodedCaseId = encodeURIComponent(cleanCaseId);

    const response = await fetch(`${API_BASE_URL}/api/risk/case/${encodedCaseId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        // 404 is expected when assessment doesn't exist yet - return null instead of throwing
        return null;
      }
      throw new Error(
        `Failed to fetch risk assessment: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return transformKeys<RiskAssessmentDto>(data);
  }

  /**
   * Create risk assessment
   */
  async createRiskAssessment(
    caseId: string,
    partnerId: string
  ): Promise<RiskAssessmentDto | null> {
    try {
      // Validate inputs
      if (!caseId || caseId.trim() === '') {
        throw new Error('Case ID is required');
      }

      // Clean caseId - remove leading underscores and trim
      const cleanCaseId = caseId.trim().replace(/^_+/, '');
      const cleanPartnerId = partnerId?.trim() || '';

      // Log request for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('[Risk API] Creating risk assessment:', {
          originalCaseId: caseId,
          cleanCaseId,
          hasPartnerId: !!cleanPartnerId,
          partnerIdLength: cleanPartnerId.length,
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/risk`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        // Backend uses snake_case naming policy, so send case_id and partner_id
        body: JSON.stringify({ case_id: cleanCaseId, partner_id: cleanPartnerId }),
      });

      if (!response.ok) {
        // Get error details for better debugging
        let errorData: any = {};
        let errorText = '';
        try {
          errorData = await response.json();
          errorText = errorData.message || errorData.error || errorData.title || '';
        } catch {
          errorText = await response
            .text()
            .catch(() => `HTTP ${response.status} ${response.statusText}`);
        }

        // Log error for debugging
        if (process.env.NODE_ENV === 'development') {
          console.error('[Risk API] Create assessment error:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            errorText,
            caseId: cleanCaseId,
            partnerId: cleanPartnerId || '(empty)',
          });
        }

        // Handle different error cases
        if (response.status === 409) {
          // Already exists - this is not an error, return null to indicate it exists
          return null;
        }

        if (response.status === 400) {
          // Bad request - check if it's "already exists" error
          const errorMessage = errorText || 'Invalid request parameters';

          // Backend returns 400 with "already exists" message instead of 409
          if (errorMessage.toLowerCase().includes('already exists')) {
            return null; // Treat as "exists" - not an error
          }

          // Provide more detailed error message
          throw new Error(
            `Validation failed: ${errorMessage}. Case ID: ${cleanCaseId}, Partner ID: ${cleanPartnerId || 'not provided'}`
          );
        }

        // For other errors, get the error message
        throw new Error(
          errorText ||
            `Failed to create risk assessment: ${response.status} ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      // Re-throw with more context if it's not already an Error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to create risk assessment: ${String(error)}`);
    }
  }

  /**
   * Set manual risk level
   */
  async setManualRiskLevel(
    assessmentId: string,
    riskLevel: string,
    justification: string
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/risk/${assessmentId}/set-risk-level`,
      {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        // Backend uses snake_case naming policy
        body: JSON.stringify({ risk_level: riskLevel, justification }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to set risk level: ${response.status}`);
    }
  }

  /**
   * List risk assessments with filters
   */
  async listRiskAssessments(filters?: {
    caseId?: string;
    partnerId?: string;
    status?: string;
    riskLevel?: string;
    page?: number;
    pageSize?: number;
  }): Promise<RiskAssessmentDto[]> {
    const params = new URLSearchParams();
    if (filters?.caseId) params.append('caseId', filters.caseId);
    if (filters?.partnerId) params.append('partnerId', filters.partnerId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/api/risk?${params.toString()}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to list risk assessments: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const items = data.items || data || [];
    return transformKeys<RiskAssessmentDto[]>(items);
  }

  /**
   * Get risk assessment by ID
   */
  async getRiskAssessmentById(assessmentId: string): Promise<RiskAssessmentDto> {
    const response = await fetch(`${API_BASE_URL}/api/risk/${assessmentId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch risk assessment: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return transformKeys<RiskAssessmentDto>(data);
  }

  /**
   * Update risk assessment notes
   */
  async updateRiskAssessmentNotes(assessmentId: string, notes: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/risk/${assessmentId}/notes`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to update notes: ${response.status}`);
    }
  }

  /**
   * Add risk factor
   */
  async addRiskFactor(
    assessmentId: string,
    factor: {
      type: string;
      level: string;
      score?: number;
      description: string;
    }
  ): Promise<RiskFactorDto> {
    const response = await fetch(`${API_BASE_URL}/api/risk/${assessmentId}/factors`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(factor),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to add risk factor: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Complete risk assessment
   */
  async completeRiskAssessment(assessmentId: string, notes?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/risk/${assessmentId}/complete`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(
        error.message || `Failed to complete assessment: ${response.status}`
      );
    }
  }

  /**
   * Reject risk assessment
   */
  async rejectRiskAssessment(assessmentId: string, reason: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/risk/${assessmentId}/reject`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to reject assessment: ${response.status}`);
    }
  }

  /**
   * Parse risk assessment form data from notes
   */
  parseRiskAssessmentForm(assessment: RiskAssessmentDto): RiskAssessmentFormData | null {
    if (!assessment.notes) return null;

    try {
      // Try to parse structured form data from notes
      const notes = assessment.notes;
      const formData: RiskAssessmentFormData = {
        partnerCustomerDetails: '',
        mukuruDetails: '',
        enhancedDueDiligenceFindings: '',
        adverseMediaAssessment: '',
      };

      // Extract sections if they exist in a structured format
      // This is a simple parser - adjust based on actual format
      const sections = notes.split('\n\n');
      sections.forEach((section) => {
        if (section.includes('Partner/Customer Details:')) {
          formData.partnerCustomerDetails = section
            .replace('Partner/Customer Details:', '')
            .trim();
        } else if (section.includes('Mukuru Details:')) {
          formData.mukuruDetails = section.replace('Mukuru Details:', '').trim();
        } else if (section.includes('Enhanced Due Diligence Findings:')) {
          formData.enhancedDueDiligenceFindings = section
            .replace('Enhanced Due Diligence Findings:', '')
            .trim();
        } else if (section.includes('Adverse Media Assessment:')) {
          formData.adverseMediaAssessment = section
            .replace('Adverse Media Assessment:', '')
            .trim();
        }
      });

      return formData;
    } catch {
      return null;
    }
  }
}

export const riskApiService = new RiskApiService();
