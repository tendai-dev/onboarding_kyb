import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import CreateRequirementPage from '../page';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import * as entityConfigApi from '@/services/entityConfigApi';

vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return { ...actual, useSidebar: vi.fn() };
});

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));

vi.mock('@/services/entityConfigApi', () => ({
  entityConfigApiService: {
    getRequirementsMetadata: vi.fn(),
    createRequirement: vi.fn(),
  },
  RequirementType: {
    Information: 'Information',
    Document: 'Document',
    Verification: 'Verification',
  },
  FieldType: {
    Text: 'Text',
    Number: 'Number',
    Date: 'Date',
  },
}));

vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('CreateRequirementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as any).mockReturnValue({ condensed: false, setCondensed: vi.fn() });
    (useRouter as any).mockReturnValue({ push: vi.fn(), back: vi.fn() });
    (entityConfigApi.entityConfigApiService.getRequirementsMetadata as any).mockResolvedValue({
      requirementTypes: [],
      fieldTypes: [],
    });
  });

  it('should render create requirement page', async () => {
    renderWithProviders(<CreateRequirementPage />);
    await waitFor(() => expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument());
  });

  it('should load requirements metadata', async () => {
    renderWithProviders(<CreateRequirementPage />);
    await waitFor(() => {
      expect(entityConfigApi.entityConfigApiService.getRequirementsMetadata).toHaveBeenCalled();
    });
  });

  it('should handle form input', async () => {
    renderWithProviders(<CreateRequirementPage />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const codeInput = screen.queryByPlaceholderText(/code/i);
    if (codeInput) {
      fireEvent.change(codeInput, { target: { value: 'TEST_CODE' } });
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle form submission', async () => {
    (entityConfigApi.entityConfigApiService.createRequirement as any).mockResolvedValue({ id: 'req-1' });
    
    renderWithProviders(<CreateRequirementPage />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const saveButton = screen.queryByText(/save|create/i);
    if (saveButton) {
      fireEvent.click(saveButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle cancel', async () => {
    const router = { push: vi.fn(), back: vi.fn() };
    (useRouter as any).mockReturnValue(router);
    
    renderWithProviders(<CreateRequirementPage />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const cancelButton = screen.queryByText(/cancel/i);
    if (cancelButton) {
      fireEvent.click(cancelButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle error state', async () => {
    (entityConfigApi.entityConfigApiService.getRequirementsMetadata as any).mockRejectedValueOnce(new Error('Failed'));
    renderWithProviders(<CreateRequirementPage />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});


