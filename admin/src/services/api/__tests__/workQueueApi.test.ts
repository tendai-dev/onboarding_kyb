import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getWorkItems,
  getWorkItemById,
  getMyWorkItems,
  getPendingApprovals,
  getItemsDueForRefresh,
  assignWorkItem,
  unassignWorkItem,
  startReview,
  submitForApproval,
  approveWorkItem,
  declineWorkItem,
  completeWorkItem,
  markForRefresh,
  addComment,
  getWorkItemComments,
  getWorkItemHistory,
} from '../workQueueApi';
import { WorkItemDto } from '../../dtos/workQueue.dto';

// Mock fetch
global.fetch = vi.fn();

// Helper to create a proper Response mock
function createMockResponse(data: any, options: { ok?: boolean; status?: number; statusText?: string } = {}) {
  return {
    ok: options.ok !== false,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    headers: new Headers(),
  };
}

// Helper to create a fetch mock that handles both auth session and API calls
function createFetchMock(apiResponse: any, apiOptions: { ok?: boolean; status?: number; statusText?: string } = {}) {
  return vi.fn().mockImplementation((url: string) => {
    // Mock auth session endpoint (in case window is defined)
    if (typeof url === 'string' && url.includes('/api/auth/session')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
      });
    }
    // Mock API endpoint
    return Promise.resolve(createMockResponse(apiResponse, apiOptions));
  });
}

// Helper for single object responses (like getWorkItemById)
function createFetchMockSingle(apiResponse: any, apiOptions: { ok?: boolean; status?: number; statusText?: string } = {}) {
  return vi.fn().mockImplementation((url: string) => {
    // Mock auth session endpoint (in case window is defined)
    if (typeof url === 'string' && url.includes('/api/auth/session')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
      });
    }
    // For single object responses, return the object directly (not wrapped)
    return Promise.resolve(createMockResponse(apiResponse, apiOptions));
  });
}

// Don't mock window - tests run in Node environment where window is undefined
// This means getAuthHeaders() will skip session fetch (which is what we want for unit tests)

describe('WorkQueue API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for both auth session and API calls
    // Since tests run in Node (window is undefined), getAuthHeaders won't call fetch
    // But we still need to mock it for the actual API calls
    global.fetch = vi.fn().mockImplementation((url: string) => {
      // Mock auth session endpoint (in case window is defined)
      if (typeof url === 'string' && url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
        });
      }
      // Default mock for API calls - will be overridden in individual tests
      return Promise.resolve({
        ok: true,
        json: async () => ({ items: [], totalCount: 0 }),
        text: async () => JSON.stringify({ items: [], totalCount: 0 }),
      });
    });
  });

  describe('getWorkItems', () => {
    it('should fetch work items without filters', async () => {
      const mockResponse = {
        items: [
          { id: '1', workItemNumber: 'WI-001', status: 'New', applicantName: 'Test Corp' },
          { id: '2', workItemNumber: 'WI-002', status: 'InProgress', applicantName: 'Test Corp 2' },
        ],
        totalCount: 2,
      };

      (global.fetch as any).mockImplementation((url: string) => {
        // Mock auth session endpoint
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
          });
        }
        // Mock API endpoint
        return Promise.resolve({
          ok: true,
          json: async () => mockResponse,
          text: async () => JSON.stringify(mockResponse),
        });
      });

      const result = await getWorkItems();

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(100);
    });

    it('should fetch work items with status filter', async () => {
      const mockResponse = {
        items: [{ id: '1', workItemNumber: 'WI-001', status: 'New' }],
        totalCount: 1,
      };

      global.fetch = createFetchMock(mockResponse);

      const result = await getWorkItems({ status: 'New' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=New'),
        expect.any(Object)
      );
      expect(result.items).toHaveLength(1);
    });

    it('should fetch work items with searchTerm filter', async () => {
      const mockResponse = {
        items: [{ id: '1', workItemNumber: 'WI-001', applicantName: 'Test Corp' }],
        totalCount: 1,
      };

      global.fetch = createFetchMock(mockResponse);

      const result = await getWorkItems({ searchTerm: 'Test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('searchTerm=Test'),
        expect.any(Object)
      );
      expect(result.items).toHaveLength(1);
    });

    it('should fetch work items with all filters', async () => {
      const mockResponse = {
        items: [{ id: '1', workItemNumber: 'WI-001' }],
        totalCount: 1,
      };

      global.fetch = createFetchMock(mockResponse);

      const result = await getWorkItems({
        status: 'New',
        searchTerm: 'Test',
        country: 'US',
        riskLevel: 'Medium',
        page: 2,
        pageSize: 20,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=New'),
        expect.any(Object)
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(20);
    });

    it('should handle camelCase and snake_case response formats', async () => {
      const mockResponseSnakeCase = {
        data: [{ id: '1', workItemNumber: 'WI-001' }],
        total_count: 1,
      };

      global.fetch = createFetchMock(mockResponseSnakeCase);

      const result = await getWorkItems();

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        items: [],
        totalCount: 0,
      };

      global.fetch = createFetchMock(mockResponse);

      const result = await getWorkItems();

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should handle API errors', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
          });
        }
        // Return error response - error message will be extracted from error.error
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
          text: async () => JSON.stringify({ error: 'Server error' }),
        });
      });

      // The error message will be 'Server error' (from error.error), not the full message
      await expect(getWorkItems()).rejects.toThrow('Server error');
    });

    it('should not include status filter when status is ALL', async () => {
      const mockResponse = {
        items: [],
        totalCount: 0,
      };

      global.fetch = createFetchMock(mockResponse);

      await getWorkItems({ status: 'ALL' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('status=ALL'),
        expect.any(Object)
      );
    });
  });

  describe('getWorkItemById', () => {
    it('should fetch work item by ID', async () => {
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
        dueDate: '2024-12-31',
        isOverdue: false,
        refreshCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      global.fetch = createFetchMockSingle(mockWorkItem);

      const result = await getWorkItemById('1');

      expect(result).toEqual(mockWorkItem);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1'),
        expect.any(Object)
      );
    });

    it('should return null when work item not found', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
          });
        }
        // Return 404 error - getWorkItemById checks for '404' in error message
        // The error message format is: "Work Queue API request failed: 404 Not Found"
        // But if error.error is set, it uses that: "Not found"
        // So we need to ensure the error message contains "404"
        // The code uses: errorData.error || errorMessage
        // So we should set error.error to something that includes "404"
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ error: '404 Not found' }), // Include "404" in error message
          text: async () => JSON.stringify({ error: '404 Not found' }),
        });
      });

      const result = await getWorkItemById('999');

      expect(result).toBeNull();
    });

    it('should throw error for other API errors', async () => {
      global.fetch = createFetchMockSingle({ error: 'Server error' }, { ok: false, status: 500, statusText: 'Internal Server Error' });

      await expect(getWorkItemById('1')).rejects.toThrow();
    });
  });

  describe('getMyWorkItems', () => {
    it('should fetch my work items with pagination', async () => {
      const mockResponse = {
        items: [{ id: '1', workItemNumber: 'WI-001' }],
        totalCount: 1,
      };

      global.fetch = createFetchMock(mockResponse);

      const result = await getMyWorkItems(2, 10);

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/my-items'),
        expect.any(Object)
      );
    });

    it('should handle snake_case response format', async () => {
      const mockResponse = {
        data: [{ id: '1' }],
        total_count: 1,
      };

      global.fetch = createFetchMock(mockResponse);

      const result = await getMyWorkItems();

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });
  });

  describe('getPendingApprovals', () => {
    it('should fetch pending approvals', async () => {
      const mockResponse = {
        items: [{ id: '1', workItemNumber: 'WI-001', status: 'PendingApproval' }],
        totalCount: 1,
      };

      global.fetch = createFetchMock(mockResponse);

      const result = await getPendingApprovals(1, 20);

      expect(result.items).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/pending-approvals'),
        expect.any(Object)
      );
    });
  });

  describe('getItemsDueForRefresh', () => {
    it('should fetch items due for refresh', async () => {
      const mockResponse = {
        items: [{ id: '1', workItemNumber: 'WI-001' }],
        totalCount: 1,
        page: 1,
        pageSize: 100,
      };

      global.fetch = createFetchMock(mockResponse);

      const result = await getItemsDueForRefresh();

      expect(result.items).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/due-for-refresh'),
        expect.any(Object)
      );
    });

    it('should include asOfDate when provided', async () => {
      const mockResponse = {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 100,
      };

      const asOfDate = new Date('2024-01-01');

      global.fetch = createFetchMock(mockResponse);

      await getItemsDueForRefresh(1, 100, asOfDate);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('asOfDate='),
        expect.any(Object)
      );
    });
  });

  describe('assignWorkItem', () => {
    it('should assign work item with GUID userId', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => null,
          text: async () => '',
        });
      });

      const guid = '12345678-1234-1234-1234-123456789012';
      await assignWorkItem('1', guid, 'John Doe');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/assign'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(guid),
        })
      );
    });

    it('should generate GUID from non-GUID userId', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => null,
          text: async () => '',
        });
      });

      await assignWorkItem('1', 'user-123', 'John Doe');

      const call = (global.fetch as any).mock.calls.find((c: any[]) => 
        typeof c[0] === 'string' && c[0].includes('/api/workqueue/1/assign')
      );
      const body = JSON.parse(call[1].body);
      
      // Should generate a GUID format
      expect(body.AssignedToUserId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(body.AssignedToUserName).toBe('John Doe');
    });

    it('should handle assignment errors', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Invalid assignment' }),
          text: async () => JSON.stringify({ error: 'Invalid assignment' }),
        });
      });

      await expect(assignWorkItem('1', 'user-123', 'John Doe')).rejects.toThrow();
    });
  });

  describe('unassignWorkItem', () => {
    it('should unassign work item', async () => {
      global.fetch = createFetchMock(null);

      await unassignWorkItem('1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/unassign'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('startReview', () => {
    it('should start review', async () => {
      global.fetch = createFetchMock(null);

      await startReview('1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/start-review'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('submitForApproval', () => {
    it('should submit for approval with notes', async () => {
      global.fetch = createFetchMock(null);

      await submitForApproval('1', 'Ready for approval');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/submit-for-approval'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Ready for approval'),
        })
      );
    });

    it('should submit for approval without notes', async () => {
      global.fetch = createFetchMock(null);

      await submitForApproval('1');

      const call = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.notes).toBe('');
    });
  });

  describe('approveWorkItem', () => {
    it('should approve work item with notes', async () => {
      global.fetch = createFetchMock(null);

      await approveWorkItem('1', 'Approved');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/approve'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Approved'),
        })
      );
    });

    it('should approve work item without notes', async () => {
      global.fetch = createFetchMock(null);

      await approveWorkItem('1');

      const call = (global.fetch as any).mock.calls.find((c: any[]) => 
        typeof c[0] === 'string' && c[0].includes('/api/workqueue/1/approve')
      );
      const body = JSON.parse(call[1].body);
      expect(body.notes).toBe('');
    });
  });

  describe('declineWorkItem', () => {
    it('should decline work item with reason', async () => {
      global.fetch = createFetchMock(null);

      await declineWorkItem('1', 'Does not meet requirements');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/decline'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Does not meet requirements'),
        })
      );
    });
  });

  describe('completeWorkItem', () => {
    it('should complete work item with notes', async () => {
      global.fetch = createFetchMock(null);

      await completeWorkItem('1', 'Completed');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/complete'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Completed'),
        })
      );
    });
  });

  describe('markForRefresh', () => {
    it('should mark work item for refresh', async () => {
      global.fetch = createFetchMock(null);

      await markForRefresh('1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/mark-for-refresh'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('addComment', () => {
    it('should add comment to work item', async () => {
      global.fetch = createFetchMock(null);

      await addComment('1', 'Test comment');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/comments'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test comment'),
        })
      );
    });
  });

  describe('getWorkItemComments', () => {
    it('should fetch work item comments', async () => {
      const mockComments = [
        { id: '1', text: 'Comment 1', createdAt: '2024-01-01' },
        { id: '2', text: 'Comment 2', createdAt: '2024-01-02' },
      ];

      global.fetch = createFetchMock(mockComments);

      const result = await getWorkItemComments('1');

      expect(result).toEqual(mockComments);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/comments'),
        expect.any(Object)
      );
    });

    it('should handle empty comments', async () => {
      global.fetch = createFetchMock([]);

      const result = await getWorkItemComments('1');

      expect(result).toEqual([]);
    });
  });

  describe('getWorkItemHistory', () => {
    it('should fetch work item history', async () => {
      const mockHistory = [
        { id: '1', action: 'Created', timestamp: '2024-01-01' },
        { id: '2', action: 'Assigned', timestamp: '2024-01-02' },
      ];

      global.fetch = createFetchMock(mockHistory);

      const result = await getWorkItemHistory('1');

      expect(result).toEqual(mockHistory);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workqueue/1/history'),
        expect.any(Object)
      );
    });
  });

  describe('request function edge cases', () => {
    it('should handle endpoint starting with ?', async () => {
      const mockResponse = { items: [], totalCount: 0 };

      global.fetch = createFetchMock(mockResponse);

      await getWorkItems({ searchTerm: 'test' });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle endpoint not starting with /', async () => {
      const mockResponse = { items: [], totalCount: 0 };

      global.fetch = createFetchMock(mockResponse);

      await getWorkItems();

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle empty response text', async () => {
      global.fetch = createFetchMock(null);

      const result = await unassignWorkItem('1');

      expect(result).toBeUndefined();
    });

    it('should handle non-JSON error responses', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Invalid JSON');
          },
          text: async () => 'Invalid JSON',
        });
      });

      await expect(getWorkItems()).rejects.toThrow('Work Queue API request failed');
    });
  });

  describe('getAuthHeaders', () => {
    it('should work without session headers in Node environment', async () => {
      const mockResponse = { items: [], totalCount: 0 };

      // In Node environment, window is undefined, so getAuthHeaders skips session fetch
      global.fetch = createFetchMock(mockResponse);

      const result = await getWorkItems();

      // Should work without session headers
      expect(result.items).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only the work items fetch, no session fetch
    });

    it('should include user headers when session is available in browser', async () => {
      const mockResponse = { items: [], totalCount: 0 };

      // Mock window to simulate browser environment
      Object.defineProperty(global, 'window', {
        value: { location: { origin: 'http://localhost:3000' } },
        writable: true,
        configurable: true,
      });

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { email: 'test@example.com', name: 'Test User', role: 'admin' } }),
          text: async () => '',
        })
        .mockResolvedValueOnce(createMockResponse(mockResponse));

      await getWorkItems();

      // Check that session was fetched (first call) and work items (second call)
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // Cleanup
      delete (global as any).window;
    });

    it('should handle session fetch failure gracefully in browser', async () => {
      const mockResponse = { items: [], totalCount: 0 };

      // Mock window to simulate browser environment
      Object.defineProperty(global, 'window', {
        value: { location: { origin: 'http://localhost:3000' } },
        writable: true,
        configurable: true,
      });

      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Session fetch failed'))
        .mockResolvedValueOnce(createMockResponse(mockResponse));

      // Should still work without session headers
      const result = await getWorkItems();
      expect(result.items).toEqual([]);
      
      // Cleanup
      delete (global as any).window;
    });
  });
});

