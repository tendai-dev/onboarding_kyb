/**
 * Services Index
 * Central export point for all service modules
 * 
 * Usage:
 *   import { fetchApplications, fetchDashboardStats } from '@/services';
 *   import { Application, DashboardStats } from '@/services/dtos/application.dto';
 */

// API Clients
export * from './api/applicationsApi';
export * from './api/dashboardApi';
export * from './api/workQueueApi';

// DTOs
export * from './dtos/application.dto';
export * from './dtos/dashboard.dto';
// WorkQueue exports - use explicit exports to avoid conflicts
export type {
  WorkItemDto,
  Application as WorkItemApplication,
  PagedResult as WorkQueuePagedResult,
  WorkItemFilters,
} from './dtos/workQueue.dto';

// Mappers
export * from './mappers/applicationMapper';
export * from './mappers/workQueueMapper';

// Use Cases
export * from './use-cases/applicationUseCases';
export * from './use-cases/dashboardUseCases';
export * from './use-cases/workQueueUseCases';

// Re-export fetchApplicationTrends for convenience
export { fetchApplicationTrends } from './use-cases/dashboardUseCases';

// Re-export getWorkItems for direct API access (when DTOs are needed)
export { getWorkItems } from './api/workQueueApi';

// Re-export export functions
export { exportApplications } from './use-cases/applicationUseCases';
export { exportWorkItems } from './use-cases/workQueueUseCases';

