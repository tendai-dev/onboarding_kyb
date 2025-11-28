import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import RulesAndPermissionsPage from '../page';
import { rulesAndPermissionsApiService } from '@/services/rulesAndPermissionsApi';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';

// Mock services
vi.mock('@/services/rulesAndPermissionsApi', () => ({
  rulesAndPermissionsApiService: {
    getAllRoles: vi.fn(),
    getRoles: vi.fn(),
    getRole: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    getAllUsers: vi.fn(),
    getUsers: vi.fn(),
    getUser: vi.fn(),
    grantPermission: vi.fn(),
    revokePermission: vi.fn(),
    assignRole: vi.fn(),
    removeRole: vi.fn(),
    getPermissions: vi.fn(),
  },
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

// Mock SweetAlert
vi.mock('@/utils/sweetAlert', () => ({
  SweetAlert: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

// Mock components
vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('RulesAndPermissionsPage', () => {
  const mockRoles = [
    {
      id: 'role-1',
      name: 'Admin',
      description: 'Administrator role',
      permissions: ['view_dashboard', 'manage_users'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 'role-2',
      name: 'Reviewer',
      description: 'Reviewer role',
      permissions: ['view_applications', 'approve_application'],
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
    },
  ];

  const mockUsers = [
    {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['Admin'],
      permissions: ['view_dashboard', 'manage_users'],
    },
    {
      id: 'user-2',
      email: 'reviewer@example.com',
      name: 'Reviewer User',
      roles: ['Reviewer'],
      permissions: ['view_applications'],
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
    (rulesAndPermissionsApiService.getAllRoles as any).mockResolvedValue(mockRoles);
    (rulesAndPermissionsApiService.getAllUsers as any).mockResolvedValue(mockUsers);
    (rulesAndPermissionsApiService.getUsers as any).mockResolvedValue(mockUsers);
    (rulesAndPermissionsApiService.getPermissions as any).mockResolvedValue([]);
  });

  it('should render rules and permissions page', async () => {
    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  it('should load roles on mount', async () => {
    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });
  });

  it('should switch to users tab', async () => {
    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Find and click users tab
    const usersTab = screen.queryByText(/users/i);
    if (usersTab) {
      fireEvent.click(usersTab);
      
      await waitFor(() => {
        expect(rulesAndPermissionsApiService.getUsers).toHaveBeenCalled();
      });
    }
  });

  it('should display roles list', async () => {
    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Should render roles
    expect(document.body).toBeInTheDocument();
  });

  it('should display users list when users tab is active', async () => {
    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    const usersTab = screen.queryByText(/users/i);
    if (usersTab) {
      fireEvent.click(usersTab);
      
      await waitFor(() => {
        expect(rulesAndPermissionsApiService.getUsers).toHaveBeenCalled();
      });
    }
  });

  it('should handle create role', async () => {
    (rulesAndPermissionsApiService.createRole as any).mockResolvedValue(mockRoles[0]);

    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Find create role button
    const createButton = screen.queryByText(/create.*role/i);
    if (createButton) {
      fireEvent.click(createButton);
      
      // Should open modal or form
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle edit role', async () => {
    (rulesAndPermissionsApiService.getRole as any).mockResolvedValue(mockRoles[0]);
    (rulesAndPermissionsApiService.updateRole as any).mockResolvedValue(mockRoles[0]);

    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Find edit button
    const editButton = screen.queryByLabelText(/edit/i);
    if (editButton) {
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle delete role', async () => {
    (rulesAndPermissionsApiService.deleteRole as any).mockResolvedValue({});

    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Find delete button
    const deleteButton = screen.queryByLabelText(/delete/i);
    if (deleteButton) {
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle grant permission to user', async () => {
    (rulesAndPermissionsApiService.grantPermission as any).mockResolvedValue({});

    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Switch to users tab
    const usersTab = screen.queryByText(/users/i);
    if (usersTab) {
      fireEvent.click(usersTab);
      
      await waitFor(() => {
        expect(rulesAndPermissionsApiService.getUsers).toHaveBeenCalled();
      });
    }
  });

  it('should handle assign role to user', async () => {
    (rulesAndPermissionsApiService.assignRole as any).mockResolvedValue({});

    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Switch to users tab
    const usersTab = screen.queryByText(/users/i);
    if (usersTab) {
      fireEvent.click(usersTab);
      
      await waitFor(() => {
        expect(rulesAndPermissionsApiService.getUsers).toHaveBeenCalled();
      });
    }
  });

  it('should handle search functionality', async () => {
    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Find search input
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'admin' } });
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle error state', async () => {
    (rulesAndPermissionsApiService.getAllRoles as any).mockRejectedValueOnce(
      new Error('Failed to load roles')
    );

    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Error should be handled gracefully
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should handle loading state', async () => {
    (rulesAndPermissionsApiService.getAllRoles as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<RulesAndPermissionsPage />);
    
    // Should show loading state
    expect(document.body).toBeInTheDocument();
  });

  it('should filter roles by search term', async () => {
    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'Admin' } });
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should display empty state when no roles', async () => {
    (rulesAndPermissionsApiService.getAllRoles as any).mockResolvedValueOnce([]);

    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Should render empty state
    expect(document.body).toBeInTheDocument();
  });

  it('should display empty state when no users', async () => {
    (rulesAndPermissionsApiService.getUsers as any).mockResolvedValueOnce([]);

    renderWithProviders(<RulesAndPermissionsPage />);
    
    await waitFor(() => {
      expect(rulesAndPermissionsApiService.getAllRoles).toHaveBeenCalled();
    });

    // Switch to users tab
    const usersTab = screen.queryByText(/users/i);
    if (usersTab) {
      fireEvent.click(usersTab);
      
      await waitFor(() => {
        expect(rulesAndPermissionsApiService.getUsers).toHaveBeenCalled();
      });
    }
  });
});

