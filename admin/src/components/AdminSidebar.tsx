/* eslint-disable react/jsx-props-no-spreading */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box } from '@chakra-ui/react';
import { useSidebar } from '../contexts/SidebarContext';
// Import from npm package @mukuru/mukuru-react-components
import {
  PortalNavigationSidebar,
  ProductIcon,
  UserIcon,
  DocumentIcon,
  SettingsIcon,
  HelpIcon,
  AppIcon,
  FileOpenIcon,
  FilterIcon,
  WarningIcon,
} from '@mukuru/mukuru-react-components';
import type { NavigationItem, HelpCentreItem } from '@mukuru/mukuru-react-components';

export default function AdminSidebar() {
  const { condensed, setCondensed } = useSidebar();
  const [activeItemId, setActiveItemId] = useState('dashboard');
  const pathname = usePathname();
  const router = useRouter();

  // Update activeItemId based on pathname
  useEffect(() => {
    if (pathname === '/dashboard') {
      setActiveItemId('dashboard');
    } else if (pathname?.startsWith('/work-queue')) {
      setActiveItemId('work-queue');
    } else if (pathname?.startsWith('/applications')) {
      setActiveItemId('applications');
    } else if (pathname?.startsWith('/risk-review') || pathname?.startsWith('/risk-assessment')) {
      setActiveItemId('risk-review');
    } else if (
      pathname?.startsWith('/review') ||
      pathname?.startsWith('/approvals')
    ) {
      setActiveItemId('reviews');
    } else if (pathname?.startsWith('/documents')) {
      setActiveItemId('documents');
    } else if (pathname?.startsWith('/requirements')) {
      setActiveItemId('requirements');
    } else if (pathname?.startsWith('/entity-types')) {
      setActiveItemId('entity-types');
    } else if (pathname?.startsWith('/checklists')) {
      setActiveItemId('checklists');
    } else if (pathname?.startsWith('/wizard-configurations')) {
      setActiveItemId('wizard-configurations');
    } else if (pathname?.startsWith('/roles-and-permissions')) {
      setActiveItemId('roles-and-permissions');
    } else if (pathname?.startsWith('/audit-log')) {
      setActiveItemId('audit-log');
    } else if (pathname?.startsWith('/messages')) {
      setActiveItemId('messages');
    } else if (pathname?.startsWith('/notifications')) {
      setActiveItemId('notifications');
    } else if (pathname?.startsWith('/data-migration')) {
      setActiveItemId('data-migration');
    } else if (pathname?.startsWith('/refreshes')) {
      setActiveItemId('refreshes');
    } else if (pathname?.startsWith('/reports')) {
      setActiveItemId('reports');
    } else if (pathname?.startsWith('/profile')) {
      setActiveItemId('profile');
    } else if (pathname?.startsWith('/settings')) {
      setActiveItemId('settings');
    }
  }, [pathname]);

  const navigationItems: NavigationItem[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <ProductIcon width="20" height="20" />,
        isActive: activeItemId === 'dashboard',
        onClick: () => {
          setActiveItemId('dashboard');
          router.push('/dashboard');
        },
      },
      {
        id: 'work-queue',
        label: 'Work Queue',
        icon: <FilterIcon width="20" height="20" />,
        isActive: activeItemId === 'work-queue',
        onClick: () => {
          setActiveItemId('work-queue');
          router.push('/work-queue');
        },
      },
      {
        id: 'applications',
        label: 'Applications',
        icon: <AppIcon width="20" height="20" />,
        isActive: activeItemId === 'applications',
        onClick: () => {
          setActiveItemId('applications');
          router.push('/applications');
        },
      },
      {
        id: 'risk-review',
        label: 'Risk Review',
        icon: <WarningIcon width="20" height="20" />,
        isActive: activeItemId === 'risk-review',
        onClick: () => {
          setActiveItemId('risk-review');
          router.push('/risk-review');
        },
      },
      {
        id: 'documents',
        label: 'Documents',
        icon: <FileOpenIcon width="20" height="20" />,
        isActive: activeItemId === 'documents',
        onClick: () => {
          setActiveItemId('documents');
          router.push('/documents');
        },
      },
      {
        id: 'configuration',
        label: 'Configuration',
        icon: <SettingsIcon width="20" height="20" />,
        isActive: activeItemId === 'configuration',
        onClick: () => {
          setActiveItemId('configuration');
          router.push('/requirements');
        },
        subItems: [
          {
            id: 'requirements',
            label: 'Requirements',
            isActive: activeItemId === 'configuration' && pathname?.startsWith('/requirements'),
            onClick: () => {
              setActiveItemId('configuration');
              router.push('/requirements');
            },
          },
          {
            id: 'entity-types',
            label: 'Entity Types',
            isActive: activeItemId === 'configuration' && pathname?.startsWith('/entity-types'),
            onClick: () => {
              setActiveItemId('configuration');
              router.push('/entity-types');
            },
          },
          {
            id: 'checklists',
            label: 'Checklists',
            isActive: activeItemId === 'configuration' && pathname?.startsWith('/checklists'),
            onClick: () => {
              setActiveItemId('configuration');
              router.push('/checklists');
            },
          },
          {
            id: 'wizard-configurations',
            label: 'Wizard Configurations',
            isActive: activeItemId === 'configuration' && pathname?.startsWith('/wizard-configurations'),
            onClick: () => {
              setActiveItemId('configuration');
              router.push('/wizard-configurations');
            },
          },
          {
            id: 'country-configurations',
            label: 'Country Configurations',
            isActive: activeItemId === 'configuration' && pathname?.startsWith('/country-configurations'),
            onClick: () => {
              setActiveItemId('configuration');
              router.push('/country-configurations');
            },
          },
          {
            id: 'roles-and-permissions',
            label: 'Roles & Permissions',
            isActive: activeItemId === 'configuration' && pathname?.startsWith('/roles-and-permissions'),
            onClick: () => {
              setActiveItemId('configuration');
              router.push('/roles-and-permissions');
            },
          },
        ],
      },
      {
        id: 'system',
        label: 'System',
        icon: <WarningIcon width="20" height="20" />,
        isActive: activeItemId === 'system',
        onClick: () => {
          setActiveItemId('system');
          router.push('/audit-log');
        },
        subItems: [
          {
            id: 'audit-log',
            label: 'Audit Log',
            isActive: activeItemId === 'system' && pathname?.startsWith('/audit-log'),
            onClick: () => {
              setActiveItemId('system');
              router.push('/audit-log');
            },
          },
          {
            id: 'messages',
            label: 'Messages',
            isActive: activeItemId === 'system' && pathname?.startsWith('/messages'),
            onClick: () => {
              setActiveItemId('system');
              router.push('/messages');
            },
          },
          {
            id: 'notifications',
            label: 'Notifications',
            isActive: activeItemId === 'system' && pathname?.startsWith('/notifications'),
            onClick: () => {
              setActiveItemId('system');
              router.push('/notifications');
            },
          },
          {
            id: 'data-migration',
            label: 'Data Migration',
            isActive: activeItemId === 'system' && pathname?.startsWith('/data-migration'),
            onClick: () => {
              setActiveItemId('system');
              router.push('/data-migration');
            },
          },
          {
            id: 'refreshes',
            label: 'Refreshes',
            isActive: activeItemId === 'system' && pathname?.startsWith('/refreshes'),
            onClick: () => {
              setActiveItemId('system');
              router.push('/refreshes');
            },
          },
        ],
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: <DocumentIcon width="20" height="20" />,
        isActive: activeItemId === 'reports',
        onClick: () => {
          setActiveItemId('reports');
          router.push('/reports');
        },
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: <UserIcon width="20" height="20" />,
        isActive: activeItemId === 'profile',
        onClick: () => {
          setActiveItemId('profile');
          router.push('/profile');
        },
      },
    ],
    [router, setActiveItemId, activeItemId, pathname]
  );

  const helpCentreItem: HelpCentreItem = {
    id: 'help-centre',
    label: 'Help Centre',
    icon: <HelpIcon width="20" height="20" />,
    onClick: () => {
      console.info('Help Centre');
      // Add help centre navigation if needed
    },
  };

  return (
    <>
      <style>{`
        /* PortalNavigationSidebar - Mukuru Design System */
        /* Target by wrapper class .mukuru-sidebar */
        
        .mukuru-sidebar nav {
          font-family: 'Madera', 'Helvetica Neue', 'Arial', sans-serif !important;
          background-color: #FFFFFF !important;
        }
        
        /* All buttons in sidebar - 16px text */
        .mukuru-sidebar nav button {
          font-size: 16px !important;
          font-weight: 400 !important;
          color: #373A36 !important;
          padding: 12px 16px !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          width: 100% !important;
          background: transparent !important;
          border: none !important;
          cursor: pointer !important;
          text-align: left !important;
        }
        
        .mukuru-sidebar nav button:hover {
          font-weight: 600 !important;
        }
        
        /* All SVG icons in sidebar - 20px orange */
        .mukuru-sidebar nav svg {
          width: 20px !important;
          height: 20px !important;
          min-width: 20px !important;
          min-height: 20px !important;
          color: #F05423 !important;
          flex-shrink: 0 !important;
        }
        
        /* Logo SVG - larger */
        .mukuru-sidebar nav > div:first-child svg {
          width: auto !important;
          height: 48px !important;
        }
        
        /* Icon container next to text */
        .mukuru-sidebar nav button > div:first-child {
          width: 20px !important;
          height: 20px !important;
          min-width: 20px !important;
          margin-right: 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
        }
        
        /* Text label */
        .mukuru-sidebar nav button > div:nth-child(2) {
          flex: 1 !important;
          font-size: 16px !important;
        }
        
        /* Active state background */
        .mukuru-sidebar nav [style*="background"] {
          background-color: #FDECE9 !important;
        }
        
        /* Toggle button */
        .mukuru-sidebar nav button[aria-label="Toggle sidebar"] {
          width: 36px !important;
          height: 36px !important;
          padding: 0 !important;
          border-radius: 50% !important;
          background-color: #FFFFFF !important;
          box-shadow: 0 4px 4px rgba(0, 0, 0, 0.15) !important;
          position: absolute !important;
          right: -18px !important;
          top: 70px !important;
          z-index: 10 !important;
        }
        
        .mukuru-sidebar nav button[aria-label="Toggle sidebar"] svg {
          width: 16px !important;
          height: 16px !important;
        }
      `}</style>
      <Box
        position="fixed"
        left="0"
        top="0"
        height="100vh"
        zIndex={1000}
        className="mukuru-sidebar"
      >
        <PortalNavigationSidebar
          navigationItems={navigationItems}
          helpCentreItem={helpCentreItem}
          condensed={condensed}
          showToggle={true}
          onToggleCollapse={setCondensed}
          onLogoClick={() => {
            setActiveItemId('dashboard');
            router.push('/dashboard');
          }}
          expandedWidth="280px"
          condensedWidth="72px"
        />
      </Box>
    </>
  );
}
