/**
 * Risk Assessment API Service (Partner)
 * Client for risk assessment endpoints
 */

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

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

class RiskApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    return headers;
  }

  /**
   * Get risk assessment by case ID
   */
  async getRiskAssessmentByCase(caseId: string): Promise<RiskAssessmentDto> {
    const response = await fetch(
      `${API_BASE_URL}/api/risk/case/${caseId}`,
      {
        method: 'GET',
        headers: await this.getAuthHeaders(),
        cache: 'no-store',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Risk assessment not found');
      }
      throw new Error(
        `Failed to fetch risk assessment: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Create risk assessment
   */
  async createRiskAssessment(
    caseId: string,
    partnerId: string
  ): Promise<RiskAssessmentDto | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/risk`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ caseId, partnerId }),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 409) {
          // Already exists
          return null;
        }
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `Failed to create risk assessment: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error creating risk assessment:', error);
      throw error;
    }
  }

  /**
   * Update risk assessment notes
   */
  async updateRiskAssessmentNotes(
    assessmentId: string,
    notes: string
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/risk/${assessmentId}/notes`,
      {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ notes }),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to update notes: ${response.status}`);
    }
  }

  /**
   * Complete risk assessment
   */
  async completeRiskAssessment(
    assessmentId: string,
    notes?: string
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/risk/${assessmentId}/complete`,
      {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ notes }),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to complete assessment: ${response.status}`);
    }
  }

  /**
   * Parse risk assessment form data from notes
   */
  parseRiskAssessmentForm(assessment: RiskAssessmentDto): RiskAssessmentFormData | null {
    if (!assessment.notes) return null;

    try {
      const notes = assessment.notes;
      const formData: RiskAssessmentFormData = {
        partnerCustomerDetails: '',
        mukuruDetails: '',
        enhancedDueDiligenceFindings: '',
        adverseMediaAssessment: '',
      };

      // Extract sections if they exist in a structured format
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

