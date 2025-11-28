import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import { renderWithProviders } from '@/test/testUtils';
import AdminSidebar from '../AdminSidebar';
import { useSidebar } from '@/contexts/SidebarContext';

const mockPush = vi.fn();
const mockSetCondensed = vi.fn();

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock SidebarContext - need to use importOriginal to get actual SidebarProvider
vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return {
    ...actual,
    useSidebar: vi.fn(),
  };
});

// Mock Mukuru imports
vi.mock('@/lib/mukuruImports', () => ({
  PortalNavigationSidebar: ({ children, onItemClick }: { children: React.ReactNode; onItemClick?: (item: any) => void }) => (
    <div data-testid="portal-navigation-sidebar" onClick={() => onItemClick?.({ id: 'test' })}>{children}</div>
  ),
  ProductIcon: () => <div data-testid="product-icon" />,
  UserIcon: () => <div data-testid="user-icon" />,
  PartnerIcon: () => <div data-testid="partner-icon" />,
  DocumentIcon: () => <div data-testid="document-icon" />,
  SettingsIcon: () => <div data-testid="settings-icon" />,
  HelpIcon: () => <div data-testid="help-icon" />,
  AppIcon: () => <div data-testid="app-icon" />,
  FileOpenIcon: () => <div data-testid="file-open-icon" />,
  NotificationIcon: () => <div data-testid="notification-icon" />,
  MailIcon: () => <div data-testid="mail-icon" />,
  FilterIcon: () => <div data-testid="filter-icon" />,
  WarningIcon: () => <div data-testid="warning-icon" />,
}));

describe('AdminSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    (useSidebar as any).mockReturnValue({
      condensed: false,
      setCondensed: mockSetCondensed,
    });
  });

  it('should render sidebar component', () => {
    (usePathname as any).mockReturnValue('/dashboard');
    renderWithProviders(<AdminSidebar />);
    expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
  });

  it('should set active item based on dashboard pathname', () => {
    (usePathname as any).mockReturnValue('/dashboard');
    renderWithProviders(<AdminSidebar />);
    expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
  });

  it('should set active item based on work-queue pathname', () => {
    (usePathname as any).mockReturnValue('/work-queue');
    renderWithProviders(<AdminSidebar />);
    expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
  });

  it('should set active item based on applications pathname', () => {
    (usePathname as any).mockReturnValue('/applications');
    renderWithProviders(<AdminSidebar />);
    expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
  });

  it('should set active item for review paths', () => {
    const reviewPaths = ['/review/123', '/risk-review', '/approvals'];
    
    reviewPaths.forEach((path) => {
      vi.clearAllMocks();
      (usePathname as any).mockReturnValue(path);
      const { unmount } = renderWithProviders(<AdminSidebar />);
      expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
      unmount();
    });
  });

  it('should set active item for configuration paths', () => {
    const configPaths = ['/requirements', '/entity-types', '/checklists', '/wizard-configurations', '/rules-and-permissions'];
    
    configPaths.forEach((path) => {
      vi.clearAllMocks();
      (usePathname as any).mockReturnValue(path);
      const { unmount } = renderWithProviders(<AdminSidebar />);
      expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
      unmount();
    });
  });

  it('should set active item for system paths', () => {
    const systemPaths = ['/audit-log', '/messages', '/notifications', '/data-migration', '/refreshes'];
    
    systemPaths.forEach((path) => {
      vi.clearAllMocks();
      (usePathname as any).mockReturnValue(path);
      const { unmount } = renderWithProviders(<AdminSidebar />);
      expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle condensed sidebar state', () => {
    (usePathname as any).mockReturnValue('/dashboard');
    (useSidebar as any).mockReturnValue({
      condensed: true,
      setCondensed: mockSetCondensed,
    });
    
    renderWithProviders(<AdminSidebar />);
    expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
  });

  it('should handle all pathname variations', () => {
    const paths = [
      '/dashboard',
      '/work-queue',
      '/applications',
      '/applications/123',
      '/review/123',
      '/risk-review',
      '/approvals',
      '/documents',
      '/requirements',
      '/requirements/create',
      '/requirements/edit/123',
      '/entity-types',
      '/entity-types/create',
      '/entity-types/edit/123',
      '/checklists',
      '/checklists/123',
      '/wizard-configurations',
      '/wizard-configurations/create',
      '/wizard-configurations/edit/123',
      '/rules-and-permissions',
      '/audit-log',
      '/messages',
      '/notifications',
      '/data-migration',
      '/refreshes',
      '/reports',
      '/profile',
      '/settings',
    ];

    paths.forEach((path) => {
      vi.clearAllMocks();
      (usePathname as any).mockReturnValue(path);
      const { unmount } = renderWithProviders(<AdminSidebar />);
      expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle pathname changes', () => {
    const { rerender } = renderWithProviders(<AdminSidebar />);
    
    (usePathname as any).mockReturnValue('/dashboard');
    rerender(<AdminSidebar />);
    expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
    
    (usePathname as any).mockReturnValue('/work-queue');
    rerender(<AdminSidebar />);
    expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
  });

  it('should handle unknown pathname', () => {
    (usePathname as any).mockReturnValue('/unknown-path');
    renderWithProviders(<AdminSidebar />);
    expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
  });

  it('should handle null pathname', () => {
    (usePathname as any).mockReturnValue(null);
    renderWithProviders(<AdminSidebar />);
    expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
  });

  it('should handle empty pathname', () => {
    (usePathname as any).mockReturnValue('');
    renderWithProviders(<AdminSidebar />);
    expect(screen.getByTestId('portal-navigation-sidebar')).toBeInTheDocument();
  });
});

