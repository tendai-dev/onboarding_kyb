// Dashboard API service for connecting to backend projections API
// Uses Next.js API routes as proxy to avoid CORS issues

// Use Next.js API routes instead of direct backend calls
const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3001';

export interface DashboardStats {
  totalApplications: number;
  pendingReview: number;
  riskReview: number;
  completed: number;
  incomplete: number;
  declined: number;
  avgProcessingTime: number;
  successRate: number;
}

export interface EntityTypeDistribution {
  type: string;
  count: number;
}

export interface DailyTrend {
  date: string;
  applications: number;
  completed: number;
}

export interface DashboardProjection {
  generatedAt: string;
  partnerId: string;
  partnerName?: string;
  cases: {
    totalCases: number;
    activeCases: number;
    completedCases: number;
    rejectedCases: number;
    pendingReviewCases: number;
    overdueCases: number;
    individualCases: number;
    corporateCases: number;
    trustCases: number;
    partnershipCases: number;
    newCasesThisMonth: number;
    newCasesLastMonth: number;
    newCasesGrowthPercentage: number;
    completedCasesThisMonth: number;
    completedCasesLastMonth: number;
    completedCasesGrowthPercentage: number;
  };
  performance: {
    averageCompletionTimeHours: number;
    medianCompletionTimeHours: number;
    completionRate: number;
    approvalRate: number;
    rejectionRate: number;
    slaComplianceRate: number;
    casesBreachingSla: number;
    averageResponseTimeHours: number;
  };
  risk: {
    highRiskCases: number;
    mediumRiskCases: number;
    lowRiskCases: number;
    averageRiskScore: number;
    riskFactorDistribution: Record<string, number>;
    casesRequiringManualReview: number;
    escalatedCases: number;
  };
  compliance: {
    amlScreeningsPending: number;
    amlScreeningsCompleted: number;
    pepMatches: number;
    sanctionsMatches: number;
    adverseMediaMatches: number;
    documentsAwaitingVerification: number;
    documentsVerified: number;
    documentsRejected: number;
    documentVerificationRate: number;
    auditEventsToday: number;
    criticalAuditEvents: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    caseId: string;
    userId: string;
    userName: string;
    timestamp: string;
    severity: string;
    icon: string;
    color: string;
  }>;
  dailyTrends: Array<{
    date: string;
    newCases: number;
    completedCases: number;
    rejectedCases: number;
    averageRiskScore: number;
    completionRate: number;
    highRiskCases: number;
  }>;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Use Next.js API routes as proxy to avoid CORS issues
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorData: any = { error: 'Unknown error' };
      try {
        const text = await response.text();
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { error: text || `HTTP ${response.status}: ${response.statusText}` };
        }
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Provide more detailed error message
      const errorMessage = errorData.details || errorData.message || errorData.error || `API request failed: ${response.status} ${response.statusText}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).details = errorData;
      throw error;
    }

    return response.json();
  } catch (error) {
    // If it's a connection error, provide a more helpful message
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend API. Please ensure the backend services are running.`);
    }
    throw error;
  }
}

export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(partnerId?: string): Promise<DashboardStats> {
    const dashboard = await request<DashboardProjection>(`/api/dashboard${partnerId ? `?partnerId=${partnerId}` : ''}`);
    
    // Map backend data to frontend format
    return {
      totalApplications: dashboard.cases.totalCases,
      pendingReview: dashboard.cases.pendingReviewCases,
      riskReview: dashboard.risk.casesRequiringManualReview,
      completed: dashboard.cases.completedCases,
      incomplete: dashboard.cases.activeCases - dashboard.cases.pendingReviewCases,
      declined: dashboard.cases.rejectedCases,
      avgProcessingTime: Number(dashboard.performance.averageCompletionTimeHours / 24), // Convert hours to days
      successRate: Number(dashboard.performance.completionRate),
    };
  },

  /**
   * Get entity type distribution
   */
  async getEntityTypeDistribution(partnerId?: string): Promise<EntityTypeDistribution[]> {
    const result = await request<Array<{ name: string; value: number }>>(`/api/entity-type-distribution${partnerId ? `?partnerId=${partnerId}` : ''}`);
    // Map backend format { name, value } to frontend format { type, count }
    return result.map(item => ({
      type: item.name,
      count: item.value
    }));
  },

  /**
   * Get application trends (last 7 days)
   */
  async getApplicationTrends(days: number = 7, partnerId?: string): Promise<DailyTrend[]> {
    // The trends API route already handles the mapping, so we can call it directly
    return request<DailyTrend[]>(`/api/trends?days=${days}${partnerId ? `&partnerId=${partnerId}` : ''}`);
  },

  /**
   * Get full dashboard projection
   */
  async getDashboard(partnerId?: string): Promise<DashboardProjection> {
    return request<DashboardProjection>(`/api/dashboard${partnerId ? `?partnerId=${partnerId}` : ''}`);
  },
};

export default dashboardApi;

