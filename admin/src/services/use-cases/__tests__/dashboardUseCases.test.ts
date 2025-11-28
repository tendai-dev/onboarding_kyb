import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchDashboardStats,
  fetchEntityTypeDistribution,
  fetchApplicationTrends,
  fetchDailyTrends,
  fetchDashboardProjection,
} from '../dashboardUseCases';
import * as dashboardApi from '../../api/dashboardApi';
import { DashboardStats, EntityTypeDistribution, DailyTrend, DashboardProjection } from '../../dtos/dashboard.dto';

// Mock dependencies
vi.mock('../../api/dashboardApi');

// Helper to create a minimal valid DashboardProjection
function createDashboardProjection(overrides: Partial<DashboardProjection> = {}): DashboardProjection {
  return {
    generatedAt: new Date().toISOString(),
    partnerId: 'partner-1',
    cases: {
      totalCases: 100,
      activeCases: 50,
      completedCases: 30,
      rejectedCases: 0,
      pendingReviewCases: 20,
      overdueCases: 0,
      individualCases: 0,
      corporateCases: 0,
      trustCases: 0,
      partnershipCases: 0,
      newCasesThisMonth: 0,
      newCasesLastMonth: 0,
      newCasesGrowthPercentage: 0,
      completedCasesThisMonth: 0,
      completedCasesLastMonth: 0,
      completedCasesGrowthPercentage: 0,
      ...overrides.cases,
    },
    performance: {
      averageCompletionTimeHours: 48,
      medianCompletionTimeHours: 0,
      completionRate: 0.85,
      approvalRate: 0,
      rejectionRate: 0,
      slaComplianceRate: 0,
      casesBreachingSla: 0,
      averageResponseTimeHours: 0,
      ...overrides.performance,
    },
    risk: {
      highRiskCases: 0,
      mediumRiskCases: 0,
      lowRiskCases: 0,
      averageRiskScore: 0,
      riskFactorDistribution: {},
      casesRequiringManualReview: 15,
      escalatedCases: 0,
      ...overrides.risk,
    },
    compliance: {
      amlScreeningsPending: 0,
      amlScreeningsCompleted: 0,
      pepMatches: 0,
      sanctionsMatches: 0,
      adverseMediaMatches: 0,
      documentsAwaitingVerification: 0,
      documentsVerified: 0,
      documentsRejected: 0,
      documentVerificationRate: 0,
      auditEventsToday: 0,
      criticalAuditEvents: 0,
      ...overrides.compliance,
    },
    recentActivities: [],
    dailyTrends: [],
    ...overrides,
  };
}

describe('Dashboard Use Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchDashboardStats', () => {
    it('should fetch and map dashboard stats', async () => {
      const mockProjection = createDashboardProjection();

      vi.mocked(dashboardApi.getDashboardProjection).mockResolvedValue(mockProjection);

      const result = await fetchDashboardStats();

      expect(dashboardApi.getDashboardProjection).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({
        totalApplications: 100,
        pendingReview: 20,
        riskReview: 15,
        completed: 30,
        incomplete: 30, // activeCases - pendingReviewCases
        declined: 0,
        avgProcessingTime: 2, // 48 hours / 24 = 2 days
        successRate: 0.85,
      });
    });

    it('should fetch dashboard stats with partner ID', async () => {
      const mockProjection = createDashboardProjection({
        cases: {
          totalCases: 50,
          activeCases: 25,
          pendingReviewCases: 10,
          completedCases: 15,
          rejectedCases: 0,
          overdueCases: 0,
          individualCases: 0,
          corporateCases: 0,
          trustCases: 0,
          partnershipCases: 0,
          newCasesThisMonth: 0,
          newCasesLastMonth: 0,
          newCasesGrowthPercentage: 0,
          completedCasesThisMonth: 0,
          completedCasesLastMonth: 0,
          completedCasesGrowthPercentage: 0,
        },
        performance: {
          averageCompletionTimeHours: 24,
          medianCompletionTimeHours: 0,
          completionRate: 0.9,
          approvalRate: 0,
          rejectionRate: 0,
          slaComplianceRate: 0,
          casesBreachingSla: 0,
          averageResponseTimeHours: 0,
        },
        risk: {
          highRiskCases: 0,
          mediumRiskCases: 0,
          lowRiskCases: 0,
          averageRiskScore: 0,
          riskFactorDistribution: {},
          casesRequiringManualReview: 8,
          escalatedCases: 0,
        },
      });

      vi.mocked(dashboardApi.getDashboardProjection).mockResolvedValue(mockProjection);

      const result = await fetchDashboardStats('partner-123');

      expect(dashboardApi.getDashboardProjection).toHaveBeenCalledWith('partner-123');
      expect(result.avgProcessingTime).toBe(1); // 24 hours / 24 = 1 day
    });
  });

  describe('fetchEntityTypeDistribution', () => {
    it('should fetch and map entity type distribution', async () => {
      const mockBackendData = [
        { name: 'Business', value: 50 },
        { name: 'Individual', value: 30 },
        { name: 'Partnership', value: 20 },
      ];
      const expectedResult: EntityTypeDistribution[] = [
        { type: 'Business', count: 50 },
        { type: 'Individual', count: 30 },
        { type: 'Partnership', count: 20 },
      ];

      vi.mocked(dashboardApi.getEntityTypeDistribution).mockResolvedValue(mockBackendData);

      const result = await fetchEntityTypeDistribution();

      expect(dashboardApi.getEntityTypeDistribution).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should fetch entity type distribution with partner ID', async () => {
      const mockBackendData = [{ name: 'Business', value: 25 }];

      vi.mocked(dashboardApi.getEntityTypeDistribution).mockResolvedValue(mockBackendData);

      await fetchEntityTypeDistribution('partner-123');

      expect(dashboardApi.getEntityTypeDistribution).toHaveBeenCalledWith('partner-123');
    });
  });

  describe('fetchApplicationTrends', () => {
    it('should fetch application trends with default days', async () => {
      const mockTrends: DailyTrend[] = [
        { date: '2024-01-01', applications: 10, completed: 8 },
        { date: '2024-01-02', applications: 15, completed: 12 },
      ];

      vi.mocked(dashboardApi.getApplicationTrends).mockResolvedValue(mockTrends);

      const result = await fetchApplicationTrends();

      expect(dashboardApi.getApplicationTrends).toHaveBeenCalledWith(7, undefined);
      expect(result).toEqual(mockTrends);
    });

    it('should fetch application trends with custom days', async () => {
      const mockTrends: DailyTrend[] = [{ date: '2024-01-01', applications: 5, completed: 4 }];

      vi.mocked(dashboardApi.getApplicationTrends).mockResolvedValue(mockTrends);

      const result = await fetchApplicationTrends(30, 'partner-123');

      expect(dashboardApi.getApplicationTrends).toHaveBeenCalledWith(30, 'partner-123');
      expect(result).toEqual(mockTrends);
    });
  });

  describe('fetchDailyTrends', () => {
    it('should fetch daily trends (7 days)', async () => {
      const mockTrends: DailyTrend[] = [{ date: '2024-01-01', applications: 10, completed: 8 }];

      vi.mocked(dashboardApi.getApplicationTrends).mockResolvedValue(mockTrends);

      const result = await fetchDailyTrends();

      expect(dashboardApi.getApplicationTrends).toHaveBeenCalledWith(7, undefined);
      expect(result).toEqual(mockTrends);
    });

    it('should fetch daily trends with partner ID', async () => {
      const mockTrends: DailyTrend[] = [{ date: '2024-01-01', applications: 5, completed: 4 }];

      vi.mocked(dashboardApi.getApplicationTrends).mockResolvedValue(mockTrends);

      await fetchDailyTrends('partner-123');

      expect(dashboardApi.getApplicationTrends).toHaveBeenCalledWith(7, 'partner-123');
    });
  });

  describe('fetchDashboardProjection', () => {
    it('should fetch full dashboard projection', async () => {
      const mockProjection = createDashboardProjection();

      vi.mocked(dashboardApi.getDashboardProjection).mockResolvedValue(mockProjection);

      const result = await fetchDashboardProjection();

      expect(dashboardApi.getDashboardProjection).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockProjection);
    });

    it('should fetch dashboard projection with partner ID', async () => {
      const mockProjection = createDashboardProjection({
        partnerId: 'partner-123',
      });

      vi.mocked(dashboardApi.getDashboardProjection).mockResolvedValue(mockProjection);

      const result = await fetchDashboardProjection('partner-123');

      expect(dashboardApi.getDashboardProjection).toHaveBeenCalledWith('partner-123');
      expect(result).toEqual(mockProjection);
    });

    it('should handle empty projection', async () => {
      const mockProjection = createDashboardProjection({
        cases: {
          totalCases: 0,
          activeCases: 0,
          completedCases: 0,
          rejectedCases: 0,
          pendingReviewCases: 0,
          overdueCases: 0,
          individualCases: 0,
          corporateCases: 0,
          trustCases: 0,
          partnershipCases: 0,
          newCasesThisMonth: 0,
          newCasesLastMonth: 0,
          newCasesGrowthPercentage: 0,
          completedCasesThisMonth: 0,
          completedCasesLastMonth: 0,
          completedCasesGrowthPercentage: 0,
        },
        risk: {
          highRiskCases: 0,
          mediumRiskCases: 0,
          lowRiskCases: 0,
          averageRiskScore: 0,
          riskFactorDistribution: {},
          casesRequiringManualReview: 0,
          escalatedCases: 0,
        },
        performance: {
          averageCompletionTimeHours: 0,
          medianCompletionTimeHours: 0,
          completionRate: 0,
          approvalRate: 0,
          rejectionRate: 0,
          slaComplianceRate: 0,
          casesBreachingSla: 0,
          averageResponseTimeHours: 0,
        },
      });

      vi.mocked(dashboardApi.getDashboardProjection).mockResolvedValue(mockProjection);

      const result = await fetchDashboardProjection();

      expect(result.cases.totalCases).toBe(0);
      expect(result.risk.casesRequiringManualReview).toBe(0);
    });
  });
});
