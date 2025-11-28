import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchWorkItems,
  fetchWorkItemById,
  fetchMyWorkItems,
  fetchPendingApprovals,
  fetchItemsDueForRefresh,
  assignWorkItemUseCase,
  unassignWorkItemUseCase,
  startReviewUseCase,
  submitForApprovalUseCase,
  approveWorkItemUseCase,
  declineWorkItemUseCase,
  completeWorkItemUseCase,
  markForRefreshUseCase,
  addCommentUseCase,
  fetchWorkItemComments,
  fetchWorkItemHistory,
  exportWorkItems,
} from '../workQueueUseCases';
import * as workQueueApi from '../../api/workQueueApi';
import * as workQueueMapper from '../../mappers/workQueueMapper';
import { WorkItemDto, Application, PagedResult } from '../../dtos/workQueue.dto';

// Mock dependencies
vi.mock('../../api/workQueueApi');
vi.mock('../../mappers/workQueueMapper');
vi.mock('../../utils/csvExport', () => ({
  escapeCsvField: (field: string) => field,
  createCsvBlob: (headers: string[], rows: string[][]) => new Blob([headers.join(','), ...rows.map(r => r.join(','))], { type: 'text/csv' }),
}));

// Helper function to create a complete WorkItemDto mock
function createMockWorkItemDto(overrides: Partial<WorkItemDto> = {}): WorkItemDto {
  return {
    id: '1',
    workItemNumber: 'WI-001',
    applicationId: 'app-1',
    applicantName: 'Test Corp',
    entityType: 'Business',
    country: 'US',
    status: 'New',
    priority: 'Normal',
    riskLevel: 'Medium',
    assignedTo: undefined,
    assignedToName: undefined,
    assignedAt: undefined,
    requiresApproval: false,
    approvedBy: undefined,
    approvedByName: undefined,
    approvedAt: undefined,
    rejectionReason: undefined,
    dueDate: '2024-12-31',
    isOverdue: false,
    nextRefreshDate: undefined,
    lastRefreshedAt: undefined,
    refreshCount: 0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  };
}

// Helper function to create a complete Application mock
function createMockApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 'WI-001',
    workItemId: '1',
    legalName: 'Test Corp',
    entityType: 'Business',
    country: 'US',
    status: 'SUBMITTED',
    backendStatus: 'New',
    created: '2024-01-01',
    updated: '2024-01-01',
    submittedBy: 'user@example.com',
    riskScore: 50,
    workItemNumber: 'WI-001',
    applicationId: 'app-1',
    priority: 'Normal',
    riskLevel: 'Medium',
    assignedTo: undefined,
    assignedToName: undefined,
    assignedAt: undefined,
    requiresApproval: false,
    approvedBy: undefined,
    approvedByName: undefined,
    approvedAt: undefined,
    rejectionReason: undefined,
    dueDate: '2024-12-31',
    isOverdue: false,
    nextRefreshDate: undefined,
    lastRefreshedAt: undefined,
    refreshCount: 0,
    ...overrides,
  };
}

describe('WorkQueue Use Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchWorkItems', () => {
    it('should fetch work items without filters', async () => {
      const mockWorkItems: WorkItemDto[] = [
        {
          id: '1',
          workItemNumber: 'WI-001',
          applicationId: 'app-1',
          status: 'New',
          applicantName: 'Test Corp',
          entityType: 'Business',
          country: 'US',
          riskLevel: 'Medium',
          priority: 'Normal',
          requiresApproval: false,
          dueDate: '2024-01-10',
          isOverdue: false,
          refreshCount: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];
      const mockBackendResult: PagedResult<WorkItemDto> = {
        items: mockWorkItems,
        totalCount: 1,
        page: 1,
        pageSize: 20,
      };
      const mockApplications: Application[] = [
        {
          id: 'WI-001',
          workItemId: '1',
          legalName: 'Test Corp',
          entityType: 'Business',
          country: 'US',
          status: 'SUBMITTED',
          backendStatus: 'New',
          created: '2024-01-01',
          updated: '2024-01-01',
          submittedBy: 'User1',
          riskScore: 50,
          riskLevel: 'Medium',
        },
      ];

      vi.mocked(workQueueApi.getWorkItems).mockResolvedValue(mockBackendResult);
      vi.mocked(workQueueMapper.mapWorkItemsToApplications).mockReturnValue(mockApplications);

      const result = await fetchWorkItems();

      expect(workQueueApi.getWorkItems).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({
        items: mockApplications,
        totalCount: 1,
        page: 1,
        pageSize: 20,
      });
    });

    it('should map frontend status to backend status', async () => {
      const mockBackendResult: PagedResult<WorkItemDto> = {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
      };

      vi.mocked(workQueueApi.getWorkItems).mockResolvedValue(mockBackendResult);
      vi.mocked(workQueueMapper.mapWorkItemsToApplications).mockReturnValue([]);

      await fetchWorkItems({ status: 'SUBMITTED' });

      expect(workQueueApi.getWorkItems).toHaveBeenCalledWith({
        status: 'New',
      });
    });

    it('should not map status when status is ALL', async () => {
      const mockBackendResult: PagedResult<WorkItemDto> = {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
      };

      vi.mocked(workQueueApi.getWorkItems).mockResolvedValue(mockBackendResult);
      vi.mocked(workQueueMapper.mapWorkItemsToApplications).mockReturnValue([]);

      await fetchWorkItems({ status: 'ALL' });

      expect(workQueueApi.getWorkItems).toHaveBeenCalledWith({
        status: undefined,
      });
    });
  });

  describe('fetchWorkItemById', () => {
    it('should fetch work item by ID and map to application', async () => {
      const mockWorkItem: WorkItemDto = {
        id: '1',
        workItemNumber: 'WI-001',
        applicationId: 'app-1',
        status: 'New',
        applicantName: 'Test Corp',
        entityType: 'Business',
        country: 'US',
        riskLevel: 'Medium',
        priority: 'Normal',
        requiresApproval: false,
        dueDate: '2024-01-10',
        isOverdue: false,
        refreshCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      const mockApplication: Application = {
        id: 'WI-001',
        workItemId: '1',
        legalName: 'Test Corp',
        entityType: 'Business',
        country: 'US',
        status: 'SUBMITTED',
        backendStatus: 'New',
        created: '2024-01-01',
        updated: '2024-01-01',
        submittedBy: 'User1',
        riskScore: 50,
        riskLevel: 'Medium',
      };

      vi.mocked(workQueueApi.getWorkItemById).mockResolvedValue(mockWorkItem);
      vi.mocked(workQueueMapper.mapWorkItemToApplication).mockReturnValue(mockApplication);

      const result = await fetchWorkItemById('1');

      expect(workQueueApi.getWorkItemById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockApplication);
    });

    it('should return null when work item not found', async () => {
      vi.mocked(workQueueApi.getWorkItemById).mockResolvedValue(null);

      const result = await fetchWorkItemById('999');

      expect(result).toBeNull();
      expect(workQueueMapper.mapWorkItemToApplication).not.toHaveBeenCalled();
    });
  });

  describe('fetchMyWorkItems', () => {
    it('should fetch my work items with pagination', async () => {
      const mockBackendResult: PagedResult<WorkItemDto> = {
        items: [],
        totalCount: 0,
        page: 2,
        pageSize: 10,
      };

      vi.mocked(workQueueApi.getMyWorkItems).mockResolvedValue(mockBackendResult);
      vi.mocked(workQueueMapper.mapWorkItemsToApplications).mockReturnValue([]);

      const result = await fetchMyWorkItems(2, 10);

      expect(workQueueApi.getMyWorkItems).toHaveBeenCalledWith(2, 10);
      expect(result).toEqual({
        items: [],
        totalCount: 0,
        page: 2,
        pageSize: 10,
      });
    });
  });

  describe('assignWorkItemUseCase', () => {
    it('should assign work item with valid inputs', async () => {
      vi.mocked(workQueueApi.assignWorkItem).mockResolvedValue(undefined);

      await assignWorkItemUseCase('1', 'user-123', 'John Doe');

      expect(workQueueApi.assignWorkItem).toHaveBeenCalledWith('1', 'user-123', 'John Doe');
    });

    it('should throw error when work item ID is missing', async () => {
      await expect(assignWorkItemUseCase('', 'user-123', 'John Doe')).rejects.toThrow('Work item ID is required');
      expect(workQueueApi.assignWorkItem).not.toHaveBeenCalled();
    });

    it('should throw error when user ID is missing', async () => {
      await expect(assignWorkItemUseCase('1', '', 'John Doe')).rejects.toThrow('User ID is required');
      expect(workQueueApi.assignWorkItem).not.toHaveBeenCalled();
    });

    it('should throw error when user name is missing', async () => {
      await expect(assignWorkItemUseCase('1', 'user-123', '')).rejects.toThrow('User name is required');
      expect(workQueueApi.assignWorkItem).not.toHaveBeenCalled();
    });
  });

  describe('unassignWorkItemUseCase', () => {
    it('should unassign work item', async () => {
      vi.mocked(workQueueApi.unassignWorkItem).mockResolvedValue(undefined);

      await unassignWorkItemUseCase('1');

      expect(workQueueApi.unassignWorkItem).toHaveBeenCalledWith('1');
    });

    it('should throw error when work item ID is missing', async () => {
      await expect(unassignWorkItemUseCase('')).rejects.toThrow('Work item ID is required');
    });
  });

  describe('startReviewUseCase', () => {
    it('should start review', async () => {
      vi.mocked(workQueueApi.startReview).mockResolvedValue(undefined);

      await startReviewUseCase('1');

      expect(workQueueApi.startReview).toHaveBeenCalledWith('1');
    });

    it('should throw error when work item ID is missing', async () => {
      await expect(startReviewUseCase('')).rejects.toThrow('Work item ID is required');
    });
  });

  describe('submitForApprovalUseCase', () => {
    it('should submit for approval', async () => {
      vi.mocked(workQueueApi.submitForApproval).mockResolvedValue(undefined);

      await submitForApprovalUseCase('1', 'Notes');

      expect(workQueueApi.submitForApproval).toHaveBeenCalledWith('1', 'Notes');
    });

    it('should submit for approval without notes', async () => {
      vi.mocked(workQueueApi.submitForApproval).mockResolvedValue(undefined);

      await submitForApprovalUseCase('1');

      expect(workQueueApi.submitForApproval).toHaveBeenCalledWith('1', undefined);
    });
  });

  describe('approveWorkItemUseCase', () => {
    it('should approve work item', async () => {
      vi.mocked(workQueueApi.approveWorkItem).mockResolvedValue(undefined);

      await approveWorkItemUseCase('1', 'Approved');

      expect(workQueueApi.approveWorkItem).toHaveBeenCalledWith('1', 'Approved');
    });
  });

  describe('declineWorkItemUseCase', () => {
    it('should decline work item with reason', async () => {
      vi.mocked(workQueueApi.declineWorkItem).mockResolvedValue(undefined);

      await declineWorkItemUseCase('1', 'Invalid data');

      expect(workQueueApi.declineWorkItem).toHaveBeenCalledWith('1', 'Invalid data');
    });

    it('should throw error when reason is missing', async () => {
      await expect(declineWorkItemUseCase('1', '')).rejects.toThrow('Rejection reason is required');
      expect(workQueueApi.declineWorkItem).not.toHaveBeenCalled();
    });

    it('should throw error when reason is only whitespace', async () => {
      await expect(declineWorkItemUseCase('1', '   ')).rejects.toThrow('Rejection reason is required');
    });
  });

  describe('completeWorkItemUseCase', () => {
    it('should complete work item', async () => {
      vi.mocked(workQueueApi.completeWorkItem).mockResolvedValue(undefined);

      await completeWorkItemUseCase('1', 'Completed');

      expect(workQueueApi.completeWorkItem).toHaveBeenCalledWith('1', 'Completed');
    });
  });

  describe('markForRefreshUseCase', () => {
    it('should mark work item for refresh', async () => {
      vi.mocked(workQueueApi.markForRefresh).mockResolvedValue(undefined);

      await markForRefreshUseCase('1');

      expect(workQueueApi.markForRefresh).toHaveBeenCalledWith('1');
    });
  });

  describe('addCommentUseCase', () => {
    it('should add comment', async () => {
      vi.mocked(workQueueApi.addComment).mockResolvedValue(undefined);

      await addCommentUseCase('1', 'Test comment');

      expect(workQueueApi.addComment).toHaveBeenCalledWith('1', 'Test comment');
    });

    it('should throw error when comment text is missing', async () => {
      await expect(addCommentUseCase('1', '')).rejects.toThrow('Comment text is required');
      expect(workQueueApi.addComment).not.toHaveBeenCalled();
    });
  });

  describe('fetchWorkItemComments', () => {
    it('should fetch work item comments', async () => {
      const mockComments = [{ id: '1', text: 'Comment 1' }];
      vi.mocked(workQueueApi.getWorkItemComments).mockResolvedValue(mockComments);

      const result = await fetchWorkItemComments('1');

      expect(workQueueApi.getWorkItemComments).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockComments);
    });

    it('should throw error when work item ID is missing', async () => {
      await expect(fetchWorkItemComments('')).rejects.toThrow('Work item ID is required');
    });
  });

  describe('fetchWorkItemHistory', () => {
    it('should fetch work item history', async () => {
      const mockHistory = [{ id: '1', action: 'Created' }];
      vi.mocked(workQueueApi.getWorkItemHistory).mockResolvedValue(mockHistory);

      const result = await fetchWorkItemHistory('1');

      expect(workQueueApi.getWorkItemHistory).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockHistory);
    });
  });

  describe('exportWorkItems', () => {
    it('should export work items as CSV', async () => {
      const mockWorkItems: WorkItemDto[] = [
        createMockWorkItemDto({
          id: '1',
          workItemNumber: 'WI-001',
          status: 'New',
          applicantName: 'Test Corp',
          entityType: 'Business',
          country: 'US',
          riskLevel: 'Medium',
          priority: 'Normal',
          assignedToName: 'User1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        }),
      ];
      const mockBackendResult: PagedResult<WorkItemDto> = {
        items: mockWorkItems,
        totalCount: 1,
        page: 1,
        pageSize: 10000,
      };
      const mockApplication: Application = {
        id: 'WI-001',
        workItemId: '1',
        legalName: 'Test Corp',
        entityType: 'Business',
        country: 'US',
        status: 'SUBMITTED',
        backendStatus: 'New',
        created: '2024-01-01',
        updated: '2024-01-01',
        submittedBy: 'User1',
        riskScore: 50,
        riskLevel: 'Medium',
      };

      vi.mocked(workQueueApi.getWorkItems).mockResolvedValue(mockBackendResult);
      vi.mocked(workQueueMapper.mapWorkItemToApplication).mockReturnValue(mockApplication);

      const result = await exportWorkItems();

      expect(workQueueApi.getWorkItems).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10000,
      });
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/csv');
    });

    it('should export work items with filters', async () => {
      const mockBackendResult: PagedResult<WorkItemDto> = {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 10000,
      };

      vi.mocked(workQueueApi.getWorkItems).mockResolvedValue(mockBackendResult);
      vi.mocked(workQueueMapper.mapWorkItemToApplication).mockReturnValue(
        createMockApplication({
          id: 'WI-001',
          workItemId: '1',
          legalName: 'Test',
          entityType: 'Business',
          country: 'US',
          status: 'SUBMITTED',
          backendStatus: 'New',
          created: '2024-01-01',
          updated: '2024-01-01',
          riskScore: 50,
          riskLevel: 'Medium',
        })
      );

      const result = await exportWorkItems({
        status: 'SUBMITTED',
        searchTerm: 'test',
        country: 'US',
      });

      expect(workQueueApi.getWorkItems).toHaveBeenCalledWith({
        status: 'New',
        searchTerm: 'test',
        country: 'US',
        page: 1,
        pageSize: 10000,
      });
      expect(result).toBeInstanceOf(Blob);
    });
  });
});

