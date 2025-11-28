import { describe, it, expect } from 'vitest';
import { mapWorkItemToApplication, mapWorkItemsToApplications } from '../workQueueMapper';
import { WorkItemDto, Application } from '../../dtos/workQueue.dto';

// Helper to create a minimal valid WorkItemDto
function createWorkItemDto(overrides: Partial<WorkItemDto> = {}): WorkItemDto {
  return {
    id: 'work-item-123',
    workItemNumber: 'WI-001',
    applicationId: 'app-123',
    status: 'New',
    applicantName: 'Test Corp',
    entityType: 'Business',
    country: 'US',
    riskLevel: 'Medium',
    priority: 'Normal',
    requiresApproval: false,
    dueDate: '2024-01-10T00:00:00Z',
    isOverdue: false,
    refreshCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('WorkQueue Mapper', () => {
  describe('mapWorkItemToApplication', () => {
    it('should map complete work item to application', () => {
      const workItem = createWorkItemDto({
        assignedTo: 'user-123',
        assignedToName: 'John Doe',
        assignedAt: '2024-01-01T00:00:00Z',
        requiresApproval: true,
        approvedBy: 'user-456',
        approvedByName: 'Jane Smith',
        approvedAt: '2024-01-02T00:00:00Z',
        rejectionReason: undefined,
        nextRefreshDate: '2024-02-01T00:00:00Z',
        lastRefreshedAt: undefined,
        updatedAt: '2024-01-02T00:00:00Z',
      });

      const result = mapWorkItemToApplication(workItem);

      expect(result).toEqual({
        id: 'WI-001',
        workItemId: 'work-item-123',
        legalName: 'Test Corp',
        entityType: 'Business',
        country: 'US',
        status: 'SUBMITTED',
        backendStatus: 'New',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-02T00:00:00Z',
        submittedBy: 'John Doe',
        riskScore: 50,
        workItemNumber: 'WI-001',
        applicationId: 'app-123',
        priority: 'Normal',
        riskLevel: 'Medium',
        assignedTo: 'user-123',
        assignedToName: 'John Doe',
        assignedAt: '2024-01-01T00:00:00Z',
        requiresApproval: true,
        approvedBy: 'user-456',
        approvedByName: 'Jane Smith',
        approvedAt: '2024-01-02T00:00:00Z',
        rejectionReason: undefined,
        dueDate: '2024-01-10T00:00:00Z',
        isOverdue: false,
        nextRefreshDate: '2024-02-01T00:00:00Z',
        lastRefreshedAt: undefined,
        refreshCount: 0,
      });
    });

    it('should use workItemNumber as id when available', () => {
      const workItem = createWorkItemDto();

      const result = mapWorkItemToApplication(workItem);

      expect(result.id).toBe('WI-001');
      expect(result.workItemId).toBe('work-item-123');
    });

    it('should use id when workItemNumber is missing', () => {
      const workItem = createWorkItemDto({
        workItemNumber: '',
      });

      const result = mapWorkItemToApplication(workItem);

      expect(result.id).toBe('work-item-123');
      expect(result.workItemId).toBe('work-item-123');
    });

    it('should map status correctly', () => {
      const statusMap = [
        { backend: 'New', frontend: 'SUBMITTED' },
        { backend: 'Assigned', frontend: 'IN PROGRESS' },
        { backend: 'InProgress', frontend: 'IN PROGRESS' },
        { backend: 'PendingApproval', frontend: 'RISK REVIEW' },
        { backend: 'Approved', frontend: 'COMPLETE' },
        { backend: 'Completed', frontend: 'COMPLETE' },
        { backend: 'Declined', frontend: 'DECLINED' },
        { backend: 'Cancelled', frontend: 'DECLINED' },
        { backend: 'DueForRefresh', frontend: 'IN PROGRESS' },
      ];

      statusMap.forEach(({ backend, frontend }) => {
        const workItem = createWorkItemDto({ status: backend });
        const result = mapWorkItemToApplication(workItem);
        expect(result.status).toBe(frontend);
        expect(result.backendStatus).toBe(backend);
      });
    });

    it('should map risk level to score', () => {
      const riskMap = [
        { level: 'Low', score: 25 },
        { level: 'Medium', score: 50 },
        { level: 'High', score: 75 },
        { level: 'Critical', score: 95 },
      ];

      riskMap.forEach(({ level, score }) => {
        const workItem = createWorkItemDto({ riskLevel: level });
        const result = mapWorkItemToApplication(workItem);
        expect(result.riskScore).toBe(score);
      });
    });

    it('should use assignedToName when available', () => {
      const workItem = createWorkItemDto({
        assignedTo: 'user-123',
        assignedToName: 'John Doe',
      });

      const result = mapWorkItemToApplication(workItem);

      expect(result.submittedBy).toBe('John Doe');
    });

    it('should fallback to assignedTo when assignedToName is missing', () => {
      const workItem = createWorkItemDto({
        assignedTo: 'user-123',
        assignedToName: undefined,
      });

      const result = mapWorkItemToApplication(workItem);

      expect(result.submittedBy).toBe('user-123');
    });

    it('should use Unknown when neither assignedTo nor assignedToName is available', () => {
      const workItem = createWorkItemDto({
        assignedTo: undefined,
        assignedToName: undefined,
      });

      const result = mapWorkItemToApplication(workItem);

      expect(result.submittedBy).toBe('Unknown');
    });

    it('should use updatedAt when available, otherwise createdAt', () => {
      const workItemWithUpdated = createWorkItemDto({
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      });

      const workItemWithoutUpdated = createWorkItemDto({
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: undefined,
      });

      const resultWithUpdated = mapWorkItemToApplication(workItemWithUpdated);
      const resultWithoutUpdated = mapWorkItemToApplication(workItemWithoutUpdated);

      expect(resultWithUpdated.updated).toBe('2024-01-02T00:00:00Z');
      expect(resultWithoutUpdated.updated).toBe('2024-01-01T00:00:00Z');
    });

    it('should map all fields correctly', () => {
      const workItem = createWorkItemDto({
        id: 'guid-123',
        workItemNumber: 'WI-999',
        applicationId: 'app-999',
        applicantName: 'Acme Corp',
        entityType: 'Partnership',
        country: 'CA',
        status: 'PendingApproval',
        priority: 'High',
        riskLevel: 'High',
        assignedTo: 'user-789',
        assignedToName: 'Alice Johnson',
        assignedAt: '2024-01-15T00:00:00Z',
        requiresApproval: true,
        approvedBy: 'user-456',
        approvedByName: 'Bob Smith',
        approvedAt: '2024-01-20T00:00:00Z',
        rejectionReason: 'Incomplete documentation',
        dueDate: '2024-02-01T00:00:00Z',
        isOverdue: true,
        nextRefreshDate: '2024-03-01T00:00:00Z',
        lastRefreshedAt: '2024-01-10T00:00:00Z',
        refreshCount: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-25T00:00:00Z',
      });

      const result = mapWorkItemToApplication(workItem);

      expect(result).toMatchObject({
        id: 'WI-999',
        workItemId: 'guid-123',
        legalName: 'Acme Corp',
        entityType: 'Partnership',
        country: 'CA',
        status: 'RISK REVIEW',
        backendStatus: 'PendingApproval',
        priority: 'High',
        riskLevel: 'High',
        riskScore: 75,
        assignedTo: 'user-789',
        assignedToName: 'Alice Johnson',
        assignedAt: '2024-01-15T00:00:00Z',
        requiresApproval: true,
        approvedBy: 'user-456',
        approvedByName: 'Bob Smith',
        approvedAt: '2024-01-20T00:00:00Z',
        rejectionReason: 'Incomplete documentation',
        dueDate: '2024-02-01T00:00:00Z',
        isOverdue: true,
        nextRefreshDate: '2024-03-01T00:00:00Z',
        lastRefreshedAt: '2024-01-10T00:00:00Z',
        refreshCount: 3,
        applicationId: 'app-999',
        workItemNumber: 'WI-999',
      });
    });

    it('should handle default risk score for unknown risk level', () => {
      const workItem = createWorkItemDto({
        riskLevel: 'Unknown',
      });

      const result = mapWorkItemToApplication(workItem);

      expect(result.riskScore).toBe(50); // Default medium score
    });

    it('should handle default status for unknown status', () => {
      const workItem = createWorkItemDto({
        status: 'UnknownStatus',
      });

      const result = mapWorkItemToApplication(workItem);

      expect(result.status).toBe('IN PROGRESS'); // Default status
      expect(result.backendStatus).toBe('UnknownStatus');
    });
  });

  describe('mapWorkItemsToApplications', () => {
    it('should map array of work items to applications', () => {
      const workItems: WorkItemDto[] = [
        createWorkItemDto({
          id: '1',
          workItemNumber: 'WI-001',
          status: 'New',
        }),
        createWorkItemDto({
          id: '2',
          workItemNumber: 'WI-002',
          status: 'InProgress',
        }),
        createWorkItemDto({
          id: '3',
          workItemNumber: 'WI-003',
          status: 'Completed',
        }),
      ];

      const result = mapWorkItemsToApplications(workItems);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('WI-001');
      expect(result[0].status).toBe('SUBMITTED');
      expect(result[1].id).toBe('WI-002');
      expect(result[1].status).toBe('IN PROGRESS');
      expect(result[2].id).toBe('WI-003');
      expect(result[2].status).toBe('COMPLETE');
    });

    it('should handle empty array', () => {
      const result = mapWorkItemsToApplications([]);
      expect(result).toEqual([]);
    });

    it('should map work items with missing optional fields', () => {
      const workItem = createWorkItemDto({
        riskLevel: 'Medium',
      });

      const result = mapWorkItemToApplication(workItem);

      expect(result.riskLevel).toBe('Medium');
      expect(result.riskScore).toBe(50);
    });
  });
});
