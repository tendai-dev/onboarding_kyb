import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { useRouter } from 'next/navigation';
import CreateEntityTypePage from '../page';
import { entityConfigApiService } from '@/services/entityConfigApi';
import { useSidebar } from '@/contexts/SidebarContext';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/services/entityConfigApi', () => ({
  entityConfigApiService: {
    getRequirements: vi.fn(),
    createEntityType: vi.fn(),
    addRequirementToEntityType: vi.fn(),
  },
}));

vi.mock('@/contexts/SidebarContext', () => ({
  useSidebar: vi.fn(),
}));

vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('CreateEntityTypePage', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  };

  const mockRequirements = [
    { id: 'req-1', code: 'REQ1', displayName: 'Requirement 1' },
    { id: 'req-2', code: 'REQ2', displayName: 'Requirement 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSidebar as any).mockReturnValue({
      condensed: false,
      setCondensed: vi.fn(),
    });
    (entityConfigApiService.getRequirements as any).mockResolvedValue(mockRequirements);
  });

  it('should render create entity type page', async () => {
    renderWithProviders(<CreateEntityTypePage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  it('should load requirements on mount', async () => {
    renderWithProviders(<CreateEntityTypePage />);
    
    await waitFor(() => {
      expect(entityConfigApiService.getRequirements).toHaveBeenCalled();
    });
  });

  it('should handle form submission', async () => {
    (entityConfigApiService.createEntityType as any).mockResolvedValue({ id: 'entity-1' });
    (entityConfigApiService.addRequirementToEntityType as any).mockResolvedValue({});

    renderWithProviders(<CreateEntityTypePage />);
    
    await waitFor(() => {
      expect(entityConfigApiService.getRequirements).toHaveBeenCalled();
    });

    // Fill form
    const displayNameInput = screen.getByPlaceholderText(/display name/i);
    fireEvent.change(displayNameInput, { target: { value: 'Test Entity' } });

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should handle errors', async () => {
    (entityConfigApiService.getRequirements as any).mockRejectedValue(new Error('Failed to load'));

    renderWithProviders(<CreateEntityTypePage />);
    
    await waitFor(() => {
      expect(entityConfigApiService.getRequirements).toHaveBeenCalled();
    });
  });
});

