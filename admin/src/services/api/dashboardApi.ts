/**
 * Dashboard API Client
 * Thin HTTP client for dashboard endpoints
 */

import { DashboardStats, EntityTypeDistribution, DailyTrend, DashboardProjection } from '../dtos/dashboard.dto';

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3001';

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(partnerId?: string): Promise<DashboardStats> {
  const params = new URLSearchParams();
  if (partnerId) {
    params.append('partnerId', partnerId);
  }

  const response = await fetch(`${API_BASE_URL}/api/dashboard?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Get entity type distribution
 */
export async function getEntityTypeDistribution(partnerId?: string): Promise<Array<{ name: string; value: number }>> {
  const params = new URLSearchParams();
  if (partnerId) {
    params.append('partnerId', partnerId);
  }

  const response = await fetch(`${API_BASE_URL}/api/entity-type-distribution?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch entity type distribution: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.items || data.data || [];
}

/**
 * Get daily trends
 */
export async function getDailyTrends(partnerId?: string): Promise<DailyTrend[]> {
  const params = new URLSearchParams();
  if (partnerId) {
    params.append('partnerId', partnerId);
  }

  const response = await fetch(`${API_BASE_URL}/api/trends?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch daily trends: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.items || data.data || [];
}

/**
 * Get application trends
 */
export async function getApplicationTrends(days: number = 7, partnerId?: string): Promise<DailyTrend[]> {
  const params = new URLSearchParams({
    days: days.toString(),
  });
  if (partnerId) {
    params.append('partnerId', partnerId);
  }

  const response = await fetch(`${API_BASE_URL}/api/trends?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch application trends: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.items || data.data || [];
}

/**
 * Get dashboard projection (full dashboard data)
 */
export async function getDashboardProjection(partnerId?: string): Promise<DashboardProjection> {
  const params = new URLSearchParams();
  if (partnerId) {
    params.append('partnerId', partnerId);
  }

  const response = await fetch(`${API_BASE_URL}/api/dashboard?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard projection: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

