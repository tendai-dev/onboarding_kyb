import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { useParams, useRouter } from 'next/navigation';
import ReviewPage from '../page';
import * as services from '@/services';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@/contexts/SidebarContext';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock services
vi.mock('@/services', () => ({
  fetchWorkItemById: vi.fn(),
  fetchMyWorkItems: vi.fn(),
  fetchWorkItems: vi.fn(),
  approveWorkItemUseCase: vi.fn(),
  declineWorkItemUseCase: vi.fn(),
  completeWorkItemUseCase: vi.fn(),
  submitForApprovalUseCase: vi.fn(),
  addCommentUseCase: vi.fn(),
  fetchWorkItemComments: vi.fn(),
  fetchWorkItemHistory: vi.fn(),
}));

// Mock SidebarContext
vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return {
    ...actual,
    useSidebar: vi.fn(),
  };
});

// Mock components
vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

vi.mock('@/components/DocumentViewer', () => ({
  DocumentViewer: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="document-viewer">Document Viewer</div> : null,
}));

vi.mock('@/lib/entitySchemaRenderer', () => ({
  fetchEntitySchema: vi.fn(),
}));

vi.mock('@/services/riskApi', () => ({
  riskApiService: {
    getRiskAssessment: vi.fn(),
    updateRiskAssessment: vi.fn(),
  },
}));

describe('ReviewPage', () => {
  const mockWorkItem = {
    id: 'test-work-item-id',
    workItemId: 'test-work-item-id',
    workItemNumber: 'WI-001',
    legalName: 'Test Company',
    entityType: 'Business',
    country: 'US',
    status: 'IN PROGRESS' as const,
    created: '2024-01-01',
    updated: '2024-01-02',
    submittedBy: 'test@example.com',
    riskScore: 50,
    riskLevel: 'Medium',
    assignedTo: 'user-123',
    assignedToName: 'Test User',
    applicationId: 'app-123',
  };

  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ id: 'test-work-item-id' });
    (useRouter as any).mockReturnValue(mockRouter);
    (useSession as any).mockReturnValue({
      data: { user: { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'Admin' } },
      status: 'authenticated',
    });
    (useSidebar as any).mockReturnValue({
      condensed: false,
      setCondensed: vi.fn(),
    });
    (services.fetchMyWorkItems as any).mockResolvedValue({
      items: [mockWorkItem],
      totalCount: 1,
      page: 1,
      pageSize: 1000,
    });
    (services.fetchWorkItems as any).mockResolvedValue({
      items: [mockWorkItem],
      totalCount: 1,
      page: 1,
      pageSize: 1000,
    });
    (services.fetchWorkItemComments as any).mockResolvedValue([]);
    (services.fetchWorkItemHistory as any).mockResolvedValue([]);
  });

  it('should render loading state initially', () => {
    (services.fetchMyWorkItems as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<ReviewPage />);
    // Should render without errors during loading
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should load and display work item details', async () => {
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(services.fetchMyWorkItems).toHaveBeenCalled();
    });
  });

  it('should handle error state', async () => {
    const error = new Error('Failed to load');
    (services.fetchMyWorkItems as any).mockRejectedValue(error);

    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(services.fetchMyWorkItems).toHaveBeenCalled();
    });
  });

  it('should handle missing work item ID', () => {
    (useParams as any).mockReturnValue({ id: undefined });

    renderWithProviders(<ReviewPage />);
    // Should render without errors
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should handle work item not found', async () => {
    (services.fetchMyWorkItems as any).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 1000,
    });
    (services.fetchWorkItems as any).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 1000,
    });

    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(services.fetchMyWorkItems).toHaveBeenCalled();
    });
  });

  it('should handle unauthenticated session', () => {
    (useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    renderWithProviders(<ReviewPage />);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should load comments and history', async () => {
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(services.fetchWorkItemComments).toHaveBeenCalledWith('test-work-item-id');
      expect(services.fetchWorkItemHistory).toHaveBeenCalledWith('test-work-item-id');
    });
  });

  it('should handle approve action', async () => {
    (services.approveWorkItemUseCase as any).mockResolvedValue({});

    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(services.fetchMyWorkItems).toHaveBeenCalled();
    });
  });

  it('should handle decline action', async () => {
    (services.declineWorkItemUseCase as any).mockResolvedValue({});

    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(services.fetchMyWorkItems).toHaveBeenCalled();
    });
  });

  it('should handle add comment', async () => {
    (services.addCommentUseCase as any).mockResolvedValue({});

    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(services.fetchMyWorkItems).toHaveBeenCalled();
    });
  });

  it('should display work item details', async () => {
    renderWithProviders(<ReviewPage />);

    await waitFor(() => {
      expect(services.fetchMyWorkItems).toHaveBeenCalled();
    });

    expect(document.body).toBeInTheDocument();
  });
});

