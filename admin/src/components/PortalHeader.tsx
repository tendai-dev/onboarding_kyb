'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, HStack, Text } from '@chakra-ui/react';
import { useSidebar } from '../contexts/SidebarContext';
import { useState, useCallback } from 'react';
// Import from npm package @mukuru/mukuru-react-components
import {
  Navbar,
  ProfileMenu,
  SelectionMenu,
  MukuruSun,
  SettingsIcon,
} from '@mukuru/mukuru-react-components';
import { FiUser, FiLogOut } from 'react-icons/fi';

export default function PortalHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const { condensed } = useSidebar();
  const userName = session?.user?.name || 'Admin';
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Calculate left offset based on sidebar state
  const sidebarWidth = condensed ? '72px' : '280px';


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
      // Clear all storage first to prevent cached data issues
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear service worker cache if available
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
          } catch (cacheError) {
            console.warn('Error clearing caches:', cacheError);
          }
        }

        // Clear IndexedDB if available
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            await Promise.all(
              databases.map((db) => {
                if (db.name) {
                  return new Promise<void>((resolve, reject) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name!);
                    deleteReq.onsuccess = () => resolve();
                    deleteReq.onerror = () => reject(deleteReq.error);
                    deleteReq.onblocked = () => resolve(); // Continue even if blocked
                  });
                }
                return Promise.resolve();
              })
            );
          } catch (idbError) {
            console.warn('Error clearing IndexedDB:', idbError);
          }
        }
      }

      // Call logout API
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        });
      } catch (apiError) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed, continuing with signOut:', apiError);
      }

      // Sign out from NextAuth - this clears the session cookie
      await signOut({
        callbackUrl: '/',
        redirect: false,
      });

      // Small delay to ensure session is fully cleared before redirect
      // This prevents race conditions where the session might still be valid
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use replace instead of href to prevent back button issues
      // Add cache-busting parameter to prevent cached page
      // Use _logout parameter so login page knows not to redirect
      const timestamp = Date.now();
      window.location.replace(`/?_logout=${timestamp}&nocache=1&t=${timestamp}`);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even on error
      try {
        // Clear storage on error too
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        await signOut({
          callbackUrl: '/',
          redirect: false,
        });
        
        // Small delay before redirect
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        const timestamp = Date.now();
        window.location.replace(`/?_logout=${timestamp}&nocache=1&t=${timestamp}`);
      } catch (signOutError) {
        // Last resort: force redirect with clear indication of logout
        const timestamp = Date.now();
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        window.location.replace(`/?_logout=${timestamp}&nocache=1&t=${timestamp}`);
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
      overflow="visible"
    >
      <Navbar
        bg="mukuru.white"
        height="90px"
        px="6"
        leftComponent={
          <HStack gap="3" align="center">
            {/* Mobile: Show Mukuru Sun logo */}
            <Box display={{ base: 'block', lg: 'none' }}>
              <MukuruSun color="#F05423" height="40px" width="40px" />
            </Box>
            {/* Desktop: Show Admin Portal label with icon */}
            <Box display={{ base: 'none', lg: 'flex' }} alignItems="center" gap="2">
              <SettingsIcon width="32" height="32" color="#F05423" />
              <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                Admin Portal
              </Text>
            </Box>
          </HStack>
        }
        centerComponent={
          <Box display={{ base: 'flex', lg: 'none' }} alignItems="center" gap="2">
            <SettingsIcon width="24" height="24" color="#F05423" />
            <Text fontSize="md" fontWeight="semibold" color="gray.700">
              Admin Portal
            </Text>
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
            <Box display={{ base: 'none', lg: 'block' }} position="relative" zIndex={10001}>
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
