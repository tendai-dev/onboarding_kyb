/**
 * Dashboard DTOs
 * Data transfer objects for dashboard-related data
 */

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
  }>;
}

