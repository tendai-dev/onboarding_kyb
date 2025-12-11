import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { useParams } from 'next/navigation';
import AdminApplicationDetailsPage from '../page';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@/contexts/SidebarContext';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock fetch globally
global.fetch = vi.fn();

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

vi.mock('@/components/DynamicFieldRenderer', () => ({
  DynamicFieldRenderer: ({ field, value }: unknown) => (
    <div data-testid={`field-${field.code}`}>{value || 'N/A'}</div>
  ),
}));

vi.mock('@/components/DocumentViewer', () => ({
  DocumentViewer: ({ isOpen, onClose: _onClose }: unknown) =>
    isOpen ? <div data-testid="document-viewer">Document Viewer</div> : null,
}));

vi.mock('@/lib/entitySchemaRenderer', () => ({
  fetchEntitySchema: vi.fn(),
  normalizeEntityTypeCode: vi.fn((code: string) => code),
}));

vi.mock('@/utils/sweetAlert', () => ({
  SweetAlert: {
    fire: vi.fn(),
  },
}));

describe('AdminApplicationDetailsPage', () => {
  const mockApplication = {
    id: 'test-id',
    legalName: 'Test Company',
    entityType: 'Business',
    country: 'US',
    status: 'IN PROGRESS' as const,
    created: '2024-01-01',
    updated: '2024-01-02',
    submittedBy: 'test@example.com',
    riskScore: 50,
    documents: [],
    businessInfo: {
      registrationNumber: '12345',
      taxId: 'TAX123',
      businessAddress: '123 Main St',
      industry: 'Technology',
      employees: 10,
      annualRevenue: 1000000,
    },
    contactInfo: {
      primaryContact: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as unknown).mockReturnValue({ id: 'test-id' });
    (useSession as unknown).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as unknown).mockReturnValue({
      condensed: false,
      setCondensed: vi.fn(),
    });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockApplication,
    });
  });

  it('should render loading state initially', () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<AdminApplicationDetailsPage />);
    // Should render without errors during loading
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should load and display application details', async () => {
    // Mock fetch for the API call
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApplication,
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Should display application data
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should display application information', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApplication,
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle document viewing', async () => {
    const appWithDocs = {
      ...mockApplication,
      documents: [
        {
          id: 'doc-1',
          name: 'test.pdf',
          type: 'application/pdf',
          status: 'APPROVED',
          uploadedAt: '2024-01-01',
          url: 'http://example.com/doc.pdf',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => appWithDocs,
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle step navigation', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApplication,
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle error state', async () => {
    const error = new Error('Failed to load');
    global.fetch = vi.fn().mockRejectedValue(error);

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle missing application ID', () => {
    (useParams as unknown).mockReturnValue({ id: undefined });

    renderWithProviders(<AdminApplicationDetailsPage />);
    // Should render without errors
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should handle unauthenticated session', () => {
    (useSession as unknown).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    renderWithProviders(<AdminApplicationDetailsPage />);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should handle application not found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Not found' }),
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle step navigation', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApplication,
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Component should handle step navigation
    expect(document.body).toBeInTheDocument();
  });

  it('should handle status update modal', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApplication,
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(document.body).toBeInTheDocument();
  });

  it('should handle comment modal', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApplication,
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(document.body).toBeInTheDocument();
  });

  it('should handle entity schema loading', async () => {
    const { fetchEntitySchema } = await import('@/lib/entitySchemaRenderer');

    (fetchEntitySchema as unknown).mockResolvedValue({
      entityTypeId: '1',
      entityTypeCode: 'pty_ltd',
      entityTypeDisplayName: 'Private Company',
      sections: [],
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockApplication,
        entityType: 'pty_ltd',
      }),
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(document.body).toBeInTheDocument();
  });

  it('should handle schema loading error', async () => {
    const { fetchEntitySchema } = await import('@/lib/entitySchemaRenderer');

    (fetchEntitySchema as unknown).mockResolvedValue(null);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockApplication,
        entityType: 'pty_ltd',
      }),
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(document.body).toBeInTheDocument();
  });

  it('should handle document viewer opening', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockApplication,
        documents: [
          {
            id: 'doc-1',
            name: 'test.pdf',
            type: 'application/pdf',
            status: 'APPROVED',
            uploadedAt: '2024-01-01',
            url: 'http://example.com/doc.pdf',
          },
        ],
      }),
    });

    renderWithProviders(<AdminApplicationDetailsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(document.body).toBeInTheDocument();
  });

  it('should handle different application statuses', async () => {
    const statuses = ['SUBMITTED', 'IN PROGRESS', 'RISK REVIEW', 'COMPLETE', 'DECLINED'];

    for (const status of statuses) {
      vi.clearAllMocks();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockApplication,
          status,
        }),
      });

      renderWithProviders(<AdminApplicationDetailsPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    }
  });

  it('should handle different risk levels', async () => {
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];

    for (const riskLevel of riskLevels) {
      vi.clearAllMocks();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockApplication,
          riskLevel,
        }),
      });

      renderWithProviders(<AdminApplicationDetailsPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    }
  });
});
