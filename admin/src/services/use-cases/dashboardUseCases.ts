/**
 * Dashboard Use Cases
 * Business logic and orchestration for dashboard operations
 */

import { getDashboardStats, getEntityTypeDistribution, getApplicationTrends, getDashboardProjection } from '../api/dashboardApi';
import { DashboardStats, EntityTypeDistribution, DailyTrend, DashboardProjection } from '../dtos/dashboard.dto';

/**
 * Get dashboard statistics
 * Maps from DashboardProjection to DashboardStats
 */
export async function fetchDashboardStats(partnerId?: string): Promise<DashboardStats> {
  // The old API mapped from DashboardProjection, but our new API client already does this
  // If we need the mapping, we should do it here in the use case layer
  const dashboard = await getDashboardProjection(partnerId);
  
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
}

/**
 * Get entity type distribution
 * Maps from backend format { name, value } to frontend format { type, count }
 */
export async function fetchEntityTypeDistribution(partnerId?: string): Promise<EntityTypeDistribution[]> {
  const result = await getEntityTypeDistribution(partnerId);
  // Map backend format { name, value } to frontend format { type, count }
  return result.map(item => ({
    type: item.name,
    count: item.value
  }));
}

/**
 * Get application trends
 */
export async function fetchApplicationTrends(days: number = 7, partnerId?: string): Promise<DailyTrend[]> {
  return getApplicationTrends(days, partnerId);
}

/**
 * Get daily trends (alias for fetchApplicationTrends)
 */
export async function fetchDailyTrends(partnerId?: string): Promise<DailyTrend[]> {
  return getApplicationTrends(7, partnerId);
}

/**
 * Get full dashboard projection
 */
export async function fetchDashboardProjection(partnerId?: string): Promise<DashboardProjection> {
  return getDashboardProjection(partnerId);
}

