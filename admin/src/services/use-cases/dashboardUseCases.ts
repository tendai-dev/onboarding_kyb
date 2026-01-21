/**
 * Dashboard Use Cases
 * Business logic and orchestration for dashboard operations
 */

import {
  getEntityTypeDistribution,
  getApplicationTrends,
  getDashboardProjection,
} from '../api/dashboardApi';
import {
  DashboardStats,
  EntityTypeDistribution,
  DailyTrend,
  DashboardProjection,
} from '../dtos/dashboard.dto';

/**
 * Get dashboard statistics
 * Maps from DashboardProjection to DashboardStats
 * OPTIMIZED: Reuses cached dashboard projection if available to avoid duplicate API calls
 */
let cachedDashboard: DashboardProjection | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5000; // 5 second cache to prevent duplicate calls

export async function fetchDashboardStats(partnerId?: string): Promise<DashboardStats> {
  // Use cached dashboard if available and recent (prevents duplicate API calls)
  const now = Date.now();
  if (cachedDashboard && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    // Map from cached data
    return {
      totalApplications: cachedDashboard.cases.totalCases,
      pendingReview: cachedDashboard.cases.pendingReviewCases,
      riskReview: cachedDashboard.risk.casesRequiringManualReview,
      completed: cachedDashboard.cases.completedCases,
      incomplete: cachedDashboard.cases.activeCases - cachedDashboard.cases.pendingReviewCases,
      declined: cachedDashboard.cases.rejectedCases,
      avgProcessingTime: Number(cachedDashboard.performance.averageCompletionTimeHours / 24),
      successRate: Number(cachedDashboard.performance.completionRate),
    };
  }

  // Fetch fresh data
  const dashboard = await getDashboardProjection(partnerId);
  
  // Cache the result
  cachedDashboard = dashboard;
  cacheTimestamp = now;

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
export async function fetchEntityTypeDistribution(
  partnerId?: string
): Promise<EntityTypeDistribution[]> {
  const result = await getEntityTypeDistribution(partnerId);
  // Map backend format { name, value } to frontend format { type, count }
  return result.map((item) => ({
    type: item.name,
    count: item.value,
  }));
}

/**
 * Get application trends
 */
export async function fetchApplicationTrends(
  days: number = 7,
  partnerId?: string
): Promise<DailyTrend[]> {
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
 * OPTIMIZED: Uses cache to prevent duplicate API calls
 */
export async function fetchDashboardProjection(
  partnerId?: string
): Promise<DashboardProjection> {
  // Use cached dashboard if available and recent
  const now = Date.now();
  if (cachedDashboard && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return cachedDashboard;
  }

  // Fetch fresh data
  const dashboard = await getDashboardProjection(partnerId);
  
  // Cache the result
  cachedDashboard = dashboard;
  cacheTimestamp = now;
  
  return dashboard;
}
