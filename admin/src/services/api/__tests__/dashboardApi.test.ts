import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDashboardStats,
  getEntityTypeDistribution,
  getDailyTrends,
  getApplicationTrends,
  getDashboardProjection,
} from '../dashboardApi';
import { DashboardStats, DashboardProjection } from '../../dtos/dashboard.dto';

// Mock fetch
global.fetch = vi.fn();

describe('Dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should fetch dashboard stats', async () => {
      const mockStats: DashboardStats = {
        totalApplications: 100,
        pendingReview: 10,
        riskReview: 5,
        completed: 80,
        incomplete: 3,
        declined: 2,
        avgProcessingTime: 2.5,
        successRate: 95,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await getDashboardStats();

      expect(result).toEqual(mockStats);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard'),
        expect.objectContaining({
          method: 'GET',
          cache: 'no-store',
        })
      );
    });

    it('should fetch dashboard stats with partnerId', async () => {
      const mockStats: DashboardStats = {
        totalApplications: 50,
        pendingReview: 5,
        riskReview: 2,
        completed: 40,
        incomplete: 2,
        declined: 1,
        avgProcessingTime: 2.0,
        successRate: 98,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await getDashboardStats('partner-123');

      expect(result).toEqual(mockStats);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('partnerId=partner-123'),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getDashboardStats()).rejects.toThrow('Failed to fetch dashboard stats');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(getDashboardStats()).rejects.toThrow('Network error');
    });
  });

  describe('getEntityTypeDistribution', () => {
    it('should fetch entity type distribution', async () => {
      const mockDistribution = [
        { name: 'Individual', value: 60 },
        { name: 'Business', value: 40 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDistribution,
      });

      const result = await getEntityTypeDistribution();

      expect(result).toEqual(mockDistribution);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/entity-type-distribution'),
        expect.any(Object)
      );
    });

    it('should fetch entity type distribution with partnerId', async () => {
      const mockDistribution = [
        { name: 'Individual', value: 30 },
        { name: 'Business', value: 20 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDistribution,
      });

      const result = await getEntityTypeDistribution('partner-123');

      expect(result).toEqual(mockDistribution);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('partnerId=partner-123'),
        expect.any(Object)
      );
    });

    it('should handle array response format', async () => {
      const mockDistribution = [
        { name: 'Individual', value: 60 },
        { name: 'Business', value: 40 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDistribution,
      });

      const result = await getEntityTypeDistribution();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockDistribution);
    });

    it('should handle object with items property', async () => {
      const mockResponse = {
        items: [
          { name: 'Individual', value: 60 },
          { name: 'Business', value: 40 },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getEntityTypeDistribution();

      expect(result).toEqual(mockResponse.items);
    });

    it('should handle object with data property', async () => {
      const mockResponse = {
        data: [
          { name: 'Individual', value: 60 },
          { name: 'Business', value: 40 },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getEntityTypeDistribution();

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle empty array', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await getEntityTypeDistribution();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getEntityTypeDistribution()).rejects.toThrow('Failed to fetch entity type distribution');
    });
  });

  describe('getDailyTrends', () => {
    it('should fetch daily trends', async () => {
      const mockTrends = [
        { date: '2024-01-01', submitted: 10, approved: 8, rejected: 1 },
        { date: '2024-01-02', submitted: 12, approved: 10, rejected: 1 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrends,
      });

      const result = await getDailyTrends();

      expect(result).toEqual(mockTrends);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/trends'),
        expect.any(Object)
      );
    });

    it('should fetch daily trends with partnerId', async () => {
      const mockTrends = [
        { date: '2024-01-01', submitted: 5, approved: 4, rejected: 0 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrends,
      });

      const result = await getDailyTrends('partner-123');

      expect(result).toEqual(mockTrends);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('partnerId=partner-123'),
        expect.any(Object)
      );
    });

    it('should handle object with items property', async () => {
      const mockResponse = {
        items: [
          { date: '2024-01-01', submitted: 10, approved: 8, rejected: 1 },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getDailyTrends();

      expect(result).toEqual(mockResponse.items);
    });

    it('should handle object with data property', async () => {
      const mockResponse = {
        data: [
          { date: '2024-01-01', submitted: 10, approved: 8, rejected: 1 },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getDailyTrends();

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getDailyTrends()).rejects.toThrow('Failed to fetch daily trends');
    });
  });

  describe('getApplicationTrends', () => {
    it('should fetch application trends with default days', async () => {
      const mockTrends = [
        { date: '2024-01-01', submitted: 10, approved: 8, rejected: 1 },
        { date: '2024-01-02', submitted: 12, approved: 10, rejected: 1 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrends,
      });

      const result = await getApplicationTrends();

      expect(result).toEqual(mockTrends);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days=7'),
        expect.any(Object)
      );
    });

    it('should fetch application trends with custom days', async () => {
      const mockTrends = [
        { date: '2024-01-01', submitted: 10, approved: 8, rejected: 1 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrends,
      });

      const result = await getApplicationTrends(30);

      expect(result).toEqual(mockTrends);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days=30'),
        expect.any(Object)
      );
    });

    it('should fetch application trends with partnerId', async () => {
      const mockTrends = [
        { date: '2024-01-01', submitted: 5, approved: 4, rejected: 0 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrends,
      });

      const result = await getApplicationTrends(7, 'partner-123');

      expect(result).toEqual(mockTrends);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('partnerId=partner-123'),
        expect.any(Object)
      );
    });

    it('should handle object with items property', async () => {
      const mockResponse = {
        items: [
          { date: '2024-01-01', submitted: 10, approved: 8, rejected: 1 },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getApplicationTrends();

      expect(result).toEqual(mockResponse.items);
    });

    it('should handle object with data property', async () => {
      const mockResponse = {
        data: [
          { date: '2024-01-01', submitted: 10, approved: 8, rejected: 1 },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getApplicationTrends();

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getApplicationTrends()).rejects.toThrow('Failed to fetch application trends');
    });
  });

  describe('getDashboardProjection', () => {
    it('should fetch dashboard projection', async () => {
      const mockProjection: DashboardProjection = {
        generatedAt: new Date().toISOString(),
        partnerId: 'partner-1',
        cases: {
          totalCases: 100,
          activeCases: 25,
          completedCases: 80,
          rejectedCases: 2,
          pendingReviewCases: 20,
          overdueCases: 0,
          individualCases: 0,
          corporateCases: 0,
          trustCases: 0,
          partnershipCases: 0,
          newCasesThisMonth: 20,
          newCasesLastMonth: 15,
          newCasesGrowthPercentage: 0,
          completedCasesThisMonth: 0,
          completedCasesLastMonth: 0,
          completedCasesGrowthPercentage: 0,
        },
        performance: {
          averageCompletionTimeHours: 48,
          medianCompletionTimeHours: 36,
          completionRate: 0.95,
          approvalRate: 0.9,
          rejectionRate: 0.1,
          slaComplianceRate: 0,
          casesBreachingSla: 0,
          averageResponseTimeHours: 0,
        },
        risk: {
          highRiskCases: 10,
          mediumRiskCases: 30,
          lowRiskCases: 60,
          averageRiskScore: 50,
          riskFactorDistribution: {},
          casesRequiringManualReview: 5,
          escalatedCases: 0,
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
        },
        recentActivities: [],
        dailyTrends: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjection,
      });

      const result = await getDashboardProjection();

      expect(result).toEqual(mockProjection);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard'),
        expect.any(Object)
      );
    });

    it('should fetch dashboard projection with partnerId', async () => {
      const mockProjection: DashboardProjection = {
        generatedAt: new Date().toISOString(),
        partnerId: 'partner-123',
        cases: {
          totalCases: 50,
          activeCases: 12,
          completedCases: 40,
          rejectedCases: 1,
          pendingReviewCases: 10,
          overdueCases: 0,
          individualCases: 0,
          corporateCases: 0,
          trustCases: 0,
          partnershipCases: 0,
          newCasesThisMonth: 10,
          newCasesLastMonth: 8,
          newCasesGrowthPercentage: 0,
          completedCasesThisMonth: 0,
          completedCasesLastMonth: 0,
          completedCasesGrowthPercentage: 0,
        },
        performance: {
          averageCompletionTimeHours: 36,
          medianCompletionTimeHours: 24,
          completionRate: 0.98,
          approvalRate: 0.95,
          rejectionRate: 0.05,
          slaComplianceRate: 0,
          casesBreachingSla: 0,
          averageResponseTimeHours: 0,
        },
        risk: {
          highRiskCases: 5,
          mediumRiskCases: 15,
          lowRiskCases: 30,
          averageRiskScore: 45,
          riskFactorDistribution: {},
          casesRequiringManualReview: 2,
          escalatedCases: 0,
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
        },
        recentActivities: [],
        dailyTrends: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjection,
      });

      const result = await getDashboardProjection('partner-123');

      expect(result).toEqual(mockProjection);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('partnerId=partner-123'),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getDashboardProjection()).rejects.toThrow('Failed to fetch dashboard projection');
    });
  });
});

