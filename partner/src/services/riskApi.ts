import { getAuthUser } from '@/lib/auth/session';
import { generateUserIdFromEmail } from '@/lib/api';

// SECURITY: All API calls go through the proxy which injects tokens from Redis
// Use the proxy endpoint instead of direct API calls
const RISK_API_BASE_URL = typeof window !== 'undefined' 
  ? '/api/proxy' // Use proxy endpoint in browser (tokens injected server-side)
  : (process.env.RISK_API_BASE_URL || 
     process.env.NEXT_PUBLIC_RISK_API_BASE_URL || 
     'http://127.0.0.1:8006');

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

// Extended interface for risk assessment with additional fields
export interface RiskAssessmentFormData {
  partnerCustomerDetails: string;
  mukuruDetails: string;
  enhancedDueDiligenceFindings: string;
  adverseMediaAssessment: string;
}

class RiskApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = getAuthUser();
    
    // SECURITY: Tokens are now handled server-side by the proxy
    // DO NOT pass Authorization header - proxy will inject it from Redis
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user identification headers (proxy will forward these)
    if (user?.email) {
      headers['X-User-Email'] = user.email;
      headers['X-User-Name'] = user.name || user.email;
      headers['X-User-Role'] = 'Partner';
      const userId = generateUserIdFromEmail(user.email);
      headers['X-User-Id'] = userId;
    }

    return headers;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const headers = await this.getAuthHeaders();

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000);
      });

      // SECURITY: Include credentials to send session cookie
      // Proxy will automatically inject Authorization header from Redis
      const fetchPromise = fetch(url, {
        ...options,
        credentials: 'include', // Include session cookie
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
   * Get risk assessment by case ID
   */
  async getRiskAssessmentByCase(caseId: string): Promise<RiskAssessmentDto | null> {
    // Use proxy endpoint - tokens injected server-side
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments/case/${encodeURIComponent(caseId)}`;
    try {
      return await this.request<RiskAssessmentDto>(url);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get risk assessment by ID
   */
  async getRiskAssessment(id: string): Promise<RiskAssessmentDto | null> {
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments/${id}`;
    try {
      return await this.request<RiskAssessmentDto>(url);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new risk assessment for a case
   */
  async createRiskAssessment(caseId: string, partnerId: string): Promise<RiskAssessmentDto> {
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments`;
    return this.request<RiskAssessmentDto>(url, {
      method: 'POST',
      body: JSON.stringify({ caseId, partnerId }),
    });
  }

  /**
   * Add a risk factor to an assessment
   */
  async addRiskFactor(
    assessmentId: string,
    type: string,
    level: string,
    score: number,
    description: string,
    source?: string
  ): Promise<any> {
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments/${assessmentId}/factors`;
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify({ type, level, score, description, source }),
    });
  }

  /**
   * Update risk assessment notes without completing (for draft saves)
   */
  async updateRiskAssessmentNotes(assessmentId: string, notes: string): Promise<any> {
    const url = `${RISK_API_BASE_URL}/api/risk/risk-assessments/${assessmentId}/notes`;
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
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
   * Save risk assessment form data as draft (without completing)
   * This stores the form data in the notes field as JSON
   */
  async saveRiskAssessmentForm(assessmentId: string, formData: RiskAssessmentFormData): Promise<any> {
    const notes = JSON.stringify(formData);
    return this.updateRiskAssessmentNotes(assessmentId, notes);
  }

  /**
   * Complete risk assessment with form data
   * This stores the form data and marks the assessment as completed
   */
  async completeRiskAssessmentWithForm(assessmentId: string, formData: RiskAssessmentFormData): Promise<any> {
    const notes = JSON.stringify(formData);
    return this.completeRiskAssessment(assessmentId, notes);
  }

  /**
   * Get risk assessment form data from notes
   */
  parseRiskAssessmentForm(assessment: RiskAssessmentDto): RiskAssessmentFormData | null {
    if (!assessment.notes) {
      return null;
    }

    try {
      return JSON.parse(assessment.notes) as RiskAssessmentFormData;
    } catch {
      // If parsing fails, return null
      return null;
    }
  }
}

export const riskApiService = new RiskApiService();

