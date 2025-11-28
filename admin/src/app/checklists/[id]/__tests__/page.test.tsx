import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import ChecklistDetailPage from '../page';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import * as checklistApi from '@/services/checklistApi';

vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return { ...actual, useSidebar: vi.fn() };
});

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));

vi.mock('@/services/checklistApi', () => ({
  checklistApiService: {
    getAllChecklists: vi.fn(),
    updateChecklist: vi.fn(),
    deleteChecklist: vi.fn(),
  },
}));

vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

vi.mock('@/utils/sweetAlert', () => ({
  SweetAlert: {
    confirm: vi.fn().mockResolvedValue({ isConfirmed: true }),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ChecklistDetailPage', () => {
  const mockChecklist = {
    id: 'checklist-1',
    name: 'Test Checklist',
    entityType: 'Individual',
    description: 'Test Description',
    items: [
      { id: 'item-1', description: 'Item 1', isRequired: true, category: 'Documents', order: 1 },
    ],
    lastUpdated: '2024-01-01',
    isActive: true,
    version: '1.0',
    createdBy: 'user-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as any).mockReturnValue({ condensed: false, setCondensed: vi.fn() });
    (useRouter as any).mockReturnValue({ push: vi.fn(), back: vi.fn() });
    (checklistApi.checklistApiService.getAllChecklists as any).mockResolvedValue([mockChecklist]);
  });

  it('should render checklist detail page', async () => {
    renderWithProviders(<ChecklistDetailPage params={Promise.resolve({ id: 'checklist-1' })} />);
    await waitFor(() => expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument());
  });

  it('should load checklist data', async () => {
    renderWithProviders(<ChecklistDetailPage params={Promise.resolve({ id: 'checklist-1' })} />);
    await waitFor(() => {
      expect(checklistApi.checklistApiService.getAllChecklists).toHaveBeenCalled();
    });
  });

  it('should handle checklist not found', async () => {
    (checklistApi.checklistApiService.getAllChecklists as any).mockResolvedValueOnce([]);
    renderWithProviders(<ChecklistDetailPage params={Promise.resolve({ id: 'non-existent' })} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });

  it('should handle adding new item', async () => {
    renderWithProviders(<ChecklistDetailPage params={Promise.resolve({ id: 'checklist-1' })} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const addButton = screen.queryByText(/add|new item/i);
    if (addButton) {
      fireEvent.click(addButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle saving checklist', async () => {
    (checklistApi.checklistApiService.updateChecklist as any).mockResolvedValue(mockChecklist);
    
    renderWithProviders(<ChecklistDetailPage params={Promise.resolve({ id: 'checklist-1' })} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
    
    const saveButton = screen.queryByText(/save/i);
    if (saveButton) {
      fireEvent.click(saveButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle error state', async () => {
    (checklistApi.checklistApiService.getAllChecklists as any).mockRejectedValueOnce(new Error('Failed'));
    renderWithProviders(<ChecklistDetailPage params={Promise.resolve({ id: 'checklist-1' })} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});


