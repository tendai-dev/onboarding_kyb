'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, HStack } from '@chakra-ui/react';
import { useSidebar } from '../contexts/SidebarContext';
import { useState, useCallback } from 'react';
// Import from npm package @mukuru/mukuru-react-components
import {
  Navbar,
  ProfileMenu,
  SelectionMenu,
  ServicesMenu,
  MukuruSun,
  AggregatorServicesIcon,
  EnterprisePaymentsIcon,
  PayInIcon,
  PayOutIcon,
  SettingsIcon,
} from '@mukuru/mukuru-react-components';
import { FiChevronDown, FiUser, FiLogOut } from 'react-icons/fi';
import { IoSettingsOutline } from 'react-icons/io5';

export default function PortalHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const { condensed } = useSidebar();
  const userName = session?.user?.name || 'Admin';
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Calculate left offset based on sidebar state
  const sidebarWidth = condensed ? '72px' : '280px';

  // Services menu items
  const services = [
    {
      id: 0,
      value: 'aggregator',
      label: 'Aggregator Services',
      icon: <AggregatorServicesIcon />,
      link: '',
      description: '',
      onClick: () => router.push('/dashboard'),
    },
    {
      id: 1,
      value: 'enterprise',
      label: 'Enterprise Payments',
      icon: <EnterprisePaymentsIcon />,
      link: '',
      description: '',
      onClick: () => router.push('/dashboard'),
    },
    {
      id: 2,
      value: 'pay-in',
      label: 'Pay In',
      icon: <PayInIcon />,
      link: '',
      description: '',
      onClick: () => router.push('/dashboard'),
    },
    {
      id: 3,
      value: 'pay-out',
      label: 'Pay Out',
      icon: <PayOutIcon />,
      link: '',
      description: '',
      onClick: () => router.push('/dashboard'),
    },
  ];

  const footerLink = {
    id: 'admin-portal',
    label: 'Admin Portal',
    description: 'Account, User, and Partner Management',
    icon: <IoSettingsOutline color="#F05423" size="24px" />,
    isActive: true,
    onClick: () => router.push('/dashboard'),
  };

  // Selection menu items (partner selection)
  const partnerMenuItems = [
    {
      id: 0,
      value: 'partner-1',
      label: 'Woolworths Financial Services',
      onSelect: () => console.log('Partner 1 selected'),
    },
    {
      id: 1,
      value: 'partner-2',
      label: 'Woolworths Food',
      onSelect: () => console.log('Partner 2 selected'),
    },
  ];

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      await signOut({
        callbackUrl: '/',
        redirect: false,
      });

      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      try {
        await signOut({
          callbackUrl: '/',
          redirect: false,
        });
        window.location.href = '/';
      } catch (signOutError) {
        window.location.href = '/';
      }
    }
  }, [isLoggingOut]);

  return (
    <Box
      position="fixed"
      top="0"
      left={sidebarWidth}
      right="0"
      zIndex={999}
      transition="left 0.3s ease"
    >
      <Navbar
        bg="mukuru.white"
        height="90px"
        px="6"
        leftComponent={
          <>
            {/* Mobile: Show Mukuru Sun logo */}
            <Box display={{ base: 'block', lg: 'none' }}>
              <MukuruSun color="#F05423" height="40px" width="40px" />
            </Box>
            {/* Desktop: Show Services Menu */}
            <Box display={{ base: 'none', lg: 'block' }}>
              <ServicesMenu
                label="Admin Portal"
                icon={<SettingsIcon width="32" height="32" color="#F05423" />}
                services={services}
                footerLink={footerLink}
              />
            </Box>
          </>
        }
        centerComponent={
          <Box display={{ base: 'block', lg: 'none' }}>
            <ServicesMenu
              label="Admin Portal"
              icon={<SettingsIcon width="24" height="24" color="#F05423" />}
              services={services}
              footerLink={footerLink}
            />
          </Box>
        }
        rightComponent={
          <HStack gap="4" align="center">
            {/* Desktop: Show Selection Menu */}
            <Box display={{ base: 'none', lg: 'block' }}>
              <SelectionMenu
                label="Woolworths Financial Services"
                menuItems={partnerMenuItems}
                activeId={0}
              />
            </Box>
            {/* Profile Menu */}
            <Box display={{ base: 'none', lg: 'block' }}>
              <ProfileMenu
                user={userName}
                menuItems={[
                  {
                    id: 0,
                    label: 'My Profile',
                    icon: <FiUser />,
                    value: 'profile',
                    onSelect: () => router.push('/profile'),
                  },
                  {
                    id: 1,
                    label: 'Logout',
                    icon: <FiLogOut />,
                    value: 'logout',
                    onSelect: () => {
                      handleLogout().catch((err) => {
                        console.error('Logout handler error:', err);
                      });
                    },
                  },
                ]}
              />
            </Box>
          </HStack>
        }
      />
    </Box>
  );
}
