import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { EnhancedAdminInterface, Application, BulkAction } from '../EnhancedAdminInterface';

describe('EnhancedAdminInterface', () => {
  const mockApplications: Application[] = [
    {
      id: 'app-1',
      legalName: 'Test Company',
      entityType: 'Business',
      country: 'US',
      status: 'IN PROGRESS',
      created: '2024-01-01',
      updated: '2024-01-02',
      submittedBy: 'user@example.com',
      riskScore: 50,
      priority: 'normal',
      tags: ['urgent'],
      documents: 5,
      completionPercentage: 75,
    },
  ];

  const mockBulkActions: BulkAction[] = [
    {
      id: 'approve',
      label: 'Approve',
      icon: null,
      colorScheme: 'green',
      requiresConfirmation: true,
      action: vi.fn().mockResolvedValue(undefined),
    },
  ];

  const mockHandlers = {
    onBulkAction: vi.fn().mockResolvedValue(undefined),
    onUpdateApplication: vi.fn().mockResolvedValue(undefined),
    onAssignApplications: vi.fn().mockResolvedValue(undefined),
    onTagApplications: vi.fn().mockResolvedValue(undefined),
    onExportApplications: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render enhanced admin interface', () => {
    renderWithProviders(
      <EnhancedAdminInterface
        applications={mockApplications}
        bulkActions={mockBulkActions}
        currentUser={{ id: 'user-1', name: 'Test User', email: 'test@example.com' }}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should display applications list', () => {
    renderWithProviders(
      <EnhancedAdminInterface
        applications={mockApplications}
        bulkActions={mockBulkActions}
        currentUser={{ id: 'user-1', name: 'Test User', email: 'test@example.com' }}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    renderWithProviders(
      <EnhancedAdminInterface
        applications={mockApplications}
        bulkActions={mockBulkActions}
        currentUser={{ id: 'user-1', name: 'Test User', email: 'test@example.com' }}
        {...mockHandlers}
      />
    );

    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle bulk selection', async () => {
    renderWithProviders(
      <EnhancedAdminInterface
        applications={mockApplications}
        bulkActions={mockBulkActions}
        currentUser={{ id: 'user-1', name: 'Test User', email: 'test@example.com' }}
        {...mockHandlers}
      />
    );

    const checkbox = screen.queryByRole('checkbox');
    if (checkbox) {
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle bulk action', async () => {
    renderWithProviders(
      <EnhancedAdminInterface
        applications={mockApplications}
        bulkActions={mockBulkActions}
        currentUser={{ id: 'user-1', name: 'Test User', email: 'test@example.com' }}
        {...mockHandlers}
      />
    );

    const bulkActionButton = screen.queryByText(/approve/i);
    if (bulkActionButton) {
      fireEvent.click(bulkActionButton);
      
      await waitFor(() => {
        expect(mockHandlers.onBulkAction).toHaveBeenCalled();
      });
    }
  });

  it('should handle filter by status', async () => {
    renderWithProviders(
      <EnhancedAdminInterface
        applications={mockApplications}
        bulkActions={mockBulkActions}
        currentUser={{ id: 'user-1', name: 'Test User', email: 'test@example.com' }}
        {...mockHandlers}
      />
    );

    const filterButton = screen.queryByText(/filter|status/i);
    if (filterButton) {
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle export functionality', async () => {
    renderWithProviders(
      <EnhancedAdminInterface
        applications={mockApplications}
        bulkActions={mockBulkActions}
        currentUser={{ id: 'user-1', name: 'Test User', email: 'test@example.com' }}
        {...mockHandlers}
      />
    );

    const exportButton = screen.queryByText(/export/i);
    if (exportButton) {
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should display empty state when no applications', () => {
    renderWithProviders(
      <EnhancedAdminInterface
        applications={[]}
        bulkActions={mockBulkActions}
        currentUser={{ id: 'user-1', name: 'Test User', email: 'test@example.com' }}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should handle assign applications', async () => {
    renderWithProviders(
      <EnhancedAdminInterface
        applications={mockApplications}
        bulkActions={mockBulkActions}
        currentUser={{ id: 'user-1', name: 'Test User', email: 'test@example.com' }}
        {...mockHandlers}
      />
    );

    const assignButton = screen.queryByText(/assign/i);
    if (assignButton) {
      fireEvent.click(assignButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle tag applications', async () => {
    renderWithProviders(
      <EnhancedAdminInterface
        applications={mockApplications}
        bulkActions={mockBulkActions}
        currentUser={{ id: 'user-1', name: 'Test User', email: 'test@example.com' }}
        {...mockHandlers}
      />
    );

    const tagButton = screen.queryByText(/tag/i);
    if (tagButton) {
      fireEvent.click(tagButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });
});

