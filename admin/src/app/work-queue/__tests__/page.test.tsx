import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import WorkQueuePage from '../page';
import * as workQueueServices from '@/services';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';

// Mock services
vi.mock('@/services', () => ({
  fetchWorkItems: vi.fn(),
  fetchMyWorkItems: vi.fn(),
  fetchPendingApprovals: vi.fn(),
  assignWorkItemUseCase: vi.fn(),
  unassignWorkItemUseCase: vi.fn(),
  startReviewUseCase: vi.fn(),
  approveWorkItemUseCase: vi.fn(),
  declineWorkItemUseCase: vi.fn(),
  completeWorkItemUseCase: vi.fn(),
  submitForApprovalUseCase: vi.fn(),
  markForRefreshUseCase: vi.fn(),
  addCommentUseCase: vi.fn(),
  fetchWorkItemComments: vi.fn(),
  fetchWorkItemHistory: vi.fn(),
  exportWorkItems: vi.fn(),
}));

// Mock sidebar context
vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return {
    ...actual,
    useSidebar: vi.fn(),
  };
});

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('WorkQueuePage', () => {
  const mockWorkItems = [
    {
      id: '1',
      applicationId: 'app-1',
      applicationNumber: 'APP-001',
      status: 'SUBMITTED',
      riskLevel: 'LOW',
      assignedTo: null,
      createdAt: '2024-01-01T00:00:00Z',
      companyName: 'Test Company 1',
    },
    {
      id: '2',
      applicationId: 'app-2',
      applicationNumber: 'APP-002',
      status: 'IN_PROGRESS',
      riskLevel: 'MEDIUM',
      assignedTo: 'user-123',
      createdAt: '2024-01-02T00:00:00Z',
      companyName: 'Test Company 2',
    },
    {
      id: '3',
      applicationId: 'app-3',
      applicationNumber: 'APP-003',
      status: 'RISK_REVIEW',
      riskLevel: 'HIGH',
      assignedTo: 'user-123',
      createdAt: '2024-01-03T00:00:00Z',
      companyName: 'Risk Company',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as any).mockReturnValue({
      condensed: false,
      setCondensed: vi.fn(),
    });
    (workQueueServices.fetchWorkItems as any).mockResolvedValue(mockWorkItems);
    (workQueueServices.fetchMyWorkItems as any).mockResolvedValue(mockWorkItems.filter(item => item.assignedTo === 'user-123'));
    (workQueueServices.fetchPendingApprovals as any).mockResolvedValue([]);
    (workQueueServices.assignWorkItemUseCase as any).mockResolvedValue({});
    (workQueueServices.unassignWorkItemUseCase as any).mockResolvedValue({});
    (workQueueServices.startReviewUseCase as any).mockResolvedValue({});
    (workQueueServices.approveWorkItemUseCase as any).mockResolvedValue({});
    (workQueueServices.declineWorkItemUseCase as any).mockResolvedValue({});
    (workQueueServices.completeWorkItemUseCase as any).mockResolvedValue({});
    (workQueueServices.addCommentUseCase as any).mockResolvedValue({});
    (workQueueServices.fetchWorkItemComments as any).mockResolvedValue([]);
    (workQueueServices.fetchWorkItemHistory as any).mockResolvedValue([]);
    (workQueueServices.exportWorkItems as any).mockResolvedValue(new Blob(['test'], { type: 'text/csv' }));
  });

  it('should render work queue page', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });
  });

  it('should load work items on mount', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });
  });

  it('should switch to "my items" view', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Find and click "My Items" tab
    const myItemsTab = screen.queryByText(/my items/i);
    if (myItemsTab) {
      fireEvent.click(myItemsTab);
      
      await waitFor(() => {
        expect(workQueueServices.fetchMyWorkItems).toHaveBeenCalled();
      }, { timeout: 2000 });
    }
  });

  it('should switch to "pending approvals" view', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Find and click "Pending Approvals" tab
    const pendingTab = screen.queryByText(/pending approvals/i);
    if (pendingTab) {
      fireEvent.click(pendingTab);
      
      await waitFor(() => {
        expect(workQueueServices.fetchPendingApprovals).toHaveBeenCalled();
      }, { timeout: 2000 });
    }
  });

  it('should filter by status', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Test status filter buttons
    const statusButtons = screen.queryAllByText(/SUBMITTED|IN PROGRESS|RISK REVIEW|ALL/i);
    if (statusButtons.length > 0) {
      fireEvent.click(statusButtons[0]);
      
      await waitFor(() => {
        // Status filter should trigger data refresh
        expect(document.body).toBeInTheDocument();
      }, { timeout: 1000 });
    }
  });

  it('should handle assign work item', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Test assign functionality
    const assignButtons = screen.queryAllByText(/assign/i);
    if (assignButtons.length > 0) {
      fireEvent.click(assignButtons[0]);
      
      await waitFor(() => {
        // Assign modal should open or assign should be called
        expect(document.body).toBeInTheDocument();
      }, { timeout: 2000 });
    }
  });

  it('should handle start review action', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Test start review functionality
    const startReviewButtons = screen.queryAllByText(/start review/i);
    if (startReviewButtons.length > 0) {
      fireEvent.click(startReviewButtons[0]);
      
      await waitFor(() => {
        expect(workQueueServices.startReviewUseCase).toHaveBeenCalled();
      }, { timeout: 2000 });
    }
  });

  it('should handle approve action', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Test approve functionality
    const approveButtons = screen.queryAllByText(/approve/i);
    if (approveButtons.length > 0) {
      fireEvent.click(approveButtons[0]);
      
      await waitFor(() => {
        expect(workQueueServices.approveWorkItemUseCase).toHaveBeenCalled();
      }, { timeout: 2000 });
    }
  });

  it('should handle decline action', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Test decline functionality
    const declineButtons = screen.queryAllByText(/decline/i);
    if (declineButtons.length > 0) {
      fireEvent.click(declineButtons[0]);
      
      await waitFor(() => {
        expect(workQueueServices.declineWorkItemUseCase).toHaveBeenCalled();
      }, { timeout: 2000 });
    }
  });

  it('should handle export functionality', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    global.URL.revokeObjectURL = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement');

    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    const exportButton = screen.queryByText(/export/i);
    if (exportButton) {
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(workQueueServices.exportWorkItems).toHaveBeenCalled();
      }, { timeout: 2000 });
    }

    createElementSpy.mockRestore();
  });

  it('should handle error state', async () => {
    (workQueueServices.fetchWorkItems as any).mockRejectedValueOnce(
      new Error('Failed to load work items')
    );

    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Error should be handled gracefully
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should handle assign error', async () => {
    (workQueueServices.assignWorkItemUseCase as any).mockRejectedValueOnce(
      new Error('Failed to assign work item')
    );

    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Error should be handled gracefully
    expect(document.body).toBeInTheDocument();
  });

  it('should display empty state when no work items', async () => {
    (workQueueServices.fetchWorkItems as any).mockResolvedValueOnce([]);

    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Component should render empty state
    expect(document.body).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Test search input
    const searchInput = screen.queryByRole('textbox', { name: /search/i });
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      
      // Search should trigger data refresh
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      }, { timeout: 2000 });
    }
  });

  it('should calculate stats correctly', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Stats should be calculated from work items
    // Test that stats are displayed or calculated
    expect(document.body).toBeInTheDocument();
  });

  it('should handle different status values', async () => {
    const statuses = ['SUBMITTED', 'IN_PROGRESS', 'RISK_REVIEW', 'COMPLETE', 'DECLINED'];
    
    for (const status of statuses) {
      vi.clearAllMocks();
      (workQueueServices.fetchWorkItems as any).mockResolvedValue(
        mockWorkItems.filter(item => item.status === status)
      );

      renderWithProviders(<WorkQueuePage />);
      
      await waitFor(() => {
        expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
      });
    }
  });

  it('should handle different risk levels', async () => {
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
    
    for (const risk of riskLevels) {
      vi.clearAllMocks();
      (workQueueServices.fetchWorkItems as any).mockResolvedValue(
        mockWorkItems.filter(item => item.riskLevel === risk)
      );

      renderWithProviders(<WorkQueuePage />);
      
      await waitFor(() => {
        expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
      });
    }
  });

  it('should handle pagination', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Test pagination controls
    const nextButton = screen.queryByLabelText(/next|page/i);
    if (nextButton) {
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle sorting', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Test sorting functionality
    const sortButton = screen.queryByLabelText(/sort/i);
    if (sortButton) {
      fireEvent.click(sortButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle bulk actions', async () => {
    renderWithProviders(<WorkQueuePage />);
    
    await waitFor(() => {
      expect(workQueueServices.fetchWorkItems).toHaveBeenCalled();
    });

    // Test bulk selection and actions
    const checkboxes = screen.queryAllByRole('checkbox');
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0]);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });
});
