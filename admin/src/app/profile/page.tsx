'use client';

import { Box, VStack, Spinner, Flex, Grid, GridItem } from '@chakra-ui/react';
import { Typography, Button, Tag } from '@mukuru/mukuru-react-components';
import {
  FiUser,
  FiMail,
  FiShield,
  FiLogOut,
  FiArrowLeft,
  FiKey,
  FiCheck,
} from 'react-icons/fi';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';

// Card wrapper component for consistent styling
const CardBox = ({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: unknown;
}) => (
  <Box
    bg="white"
    borderRadius="8px"
    boxShadow="0 1px 3px rgba(0,0,0,0.08)"
    border="1px solid"
    borderColor="gray.100"
    overflow="hidden"
    {...props}
  >
    {children}
  </Box>
);

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { condensed } = useSidebar();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut({ callbackUrl: '/', redirect: true });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="100vh"
        bg="#F5F5F5"
      >
        <VStack gap="4">
          <Spinner size="xl" color="#F05423" />
          <Typography color="#333">Loading profile...</Typography>
        </VStack>
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const user = session?.user;
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const userImage = user?.image || null;

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  return (
    <Flex minH="100vh" bg="#F5F5F5">
      <AdminSidebar />
      <PortalHeader />

      <Box
        flex="1"
        ml={condensed ? '72px' : '280px'}
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        bg="#F5F5F5"
        overflowY="auto"
        transition="margin-left 0.3s ease, width 0.3s ease"
        p="24px"
      >
        {/* Back Navigation */}
        <Link
          href="/dashboard"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          <Flex
            align="center"
            gap="8px"
            mb="16px"
            cursor="pointer"
            _hover={{ opacity: 0.7 }}
          >
            <FiArrowLeft size={14} color="#F05423" />
            <Typography fontSize="14px" fontWeight="500" color="#F05423">
              Back to Dashboard
            </Typography>
          </Flex>
        </Link>

        {/* Page Title */}
        <Flex align="center" gap="12px" mb="24px">
          <Typography fontSize="20px" fontWeight="700" color="#1a1a1a">
            Profile Management
          </Typography>
          <Tag variant="success">Administrator</Tag>
        </Flex>

        {/* Row 1: Profile + Account Info - Using CSS Grid */}
        <Grid templateColumns={{ base: '1fr', lg: '300px 1fr' }} gap="20px" mb="20px">
          {/* Profile Card */}
          <GridItem>
            <CardBox h="100%">
              <Box bg="#F05423" h="60px" />
              <Box px="20px" pb="24px" mt="-30px" textAlign="center">
                {userImage ? (
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="full"
                    overflow="hidden"
                    border="3px solid white"
                    boxShadow="md"
                    mx="auto"
                    mb="16px"
                    bg="white"
                  >
                    <img
                      src={userImage}
                      alt={userName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ) : (
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="full"
                    bg="#F05423"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    border="3px solid white"
                    boxShadow="md"
                    mx="auto"
                    mb="16px"
                  >
                    <Typography fontSize="20px" fontWeight="700" color="white">
                      {getInitials(userName)}
                    </Typography>
                  </Box>
                )}
                <Typography fontSize="16px" fontWeight="600" color="#1a1a1a">
                  {userName}
                </Typography>
                <Typography fontSize="13px" color="#666" mt="4px">
                  {userEmail}
                </Typography>
                <Typography fontSize="11px" color="#999" mt="12px">
                  Profile picture is managed by Azure AD
                </Typography>
              </Box>
            </CardBox>
          </GridItem>

          {/* Account Information Card */}
          <GridItem>
            <CardBox h="100%">
              <Box px="20px" py="14px" borderBottom="1px solid #eee">
                <Typography fontSize="15px" fontWeight="600" color="#1a1a1a">
                  Account Information
                </Typography>
              </Box>
              <Box px="20px" py="12px">
                <Flex
                  justify="space-between"
                  align="center"
                  py="12px"
                  borderBottom="1px solid #eee"
                >
                  <Flex gap="12px" align="center">
                    <FiUser size={16} color="#888" />
                    <Typography fontSize="13px" color="#666">
                      Full Name
                    </Typography>
                  </Flex>
                  <Typography fontSize="13px" fontWeight="500" color="#1a1a1a">
                    {userName}
                  </Typography>
                </Flex>
                <Flex
                  justify="space-between"
                  align="center"
                  py="12px"
                  borderBottom="1px solid #eee"
                >
                  <Flex gap="12px" align="center">
                    <FiMail size={16} color="#888" />
                    <Typography fontSize="13px" color="#666">
                      Email Address
                    </Typography>
                  </Flex>
                  <Typography fontSize="13px" fontWeight="500" color="#1a1a1a">
                    {userEmail}
                  </Typography>
                </Flex>
                <Flex
                  justify="space-between"
                  align="center"
                  py="12px"
                  borderBottom="1px solid #eee"
                >
                  <Flex gap="12px" align="center">
                    <FiShield size={16} color="#888" />
                    <Typography fontSize="13px" color="#666">
                      Role
                    </Typography>
                  </Flex>
                  <Tag variant="success">Administrator</Tag>
                </Flex>
                <Flex justify="space-between" align="center" py="12px">
                  <Flex gap="12px" align="center">
                    <FiKey size={16} color="#888" />
                    <Typography fontSize="13px" color="#666">
                      Authentication
                    </Typography>
                  </Flex>
                  <Typography fontSize="13px" fontWeight="500" color="#1a1a1a">
                    Azure AD (Single Sign-On)
                  </Typography>
                </Flex>
              </Box>
            </CardBox>
          </GridItem>
        </Grid>

        {/* Row 2: Security, Actions, Help - Using CSS Grid */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="20px">
          {/* Security & Privacy Card */}
          <GridItem>
            <CardBox h="100%">
              <Box px="20px" py="14px" borderBottom="1px solid #eee">
                <Typography fontSize="15px" fontWeight="600" color="#1a1a1a">
                  Security & Privacy
                </Typography>
              </Box>
              <Box p="20px">
                <Box
                  p="14px"
                  bg="rgba(0, 150, 136, 0.06)"
                  borderRadius="6px"
                  borderLeft="3px solid #009688"
                  mb="16px"
                >
                  <Flex gap="12px" align="flex-start">
                    <FiShield
                      size={16}
                      color="#009688"
                      style={{ marginTop: '2px', flexShrink: 0 }}
                    />
                    <Box>
                      <Typography
                        fontSize="13px"
                        fontWeight="600"
                        color="#1a1a1a"
                        mb="6px"
                      >
                        Secure Authentication
                      </Typography>
                      <Typography fontSize="12px" color="#666" lineHeight="1.6">
                        Your account is secured through Azure AD Single Sign-On. All
                        authentication tokens are stored securely server-side and never
                        exposed to the browser.
                      </Typography>
                    </Box>
                  </Flex>
                </Box>
                <VStack align="stretch" gap="10px">
                  <Flex gap="10px" align="center">
                    <FiCheck size={14} color="#22c55e" />
                    <Typography fontSize="12px" color="#333">
                      Two-factor authentication enabled
                    </Typography>
                  </Flex>
                  <Flex gap="10px" align="center">
                    <FiCheck size={14} color="#22c55e" />
                    <Typography fontSize="12px" color="#333">
                      Session tokens encrypted
                    </Typography>
                  </Flex>
                  <Flex gap="10px" align="center">
                    <FiCheck size={14} color="#22c55e" />
                    <Typography fontSize="12px" color="#333">
                      Secure server-side storage
                    </Typography>
                  </Flex>
                </VStack>
              </Box>
            </CardBox>
          </GridItem>

          {/* Actions Card */}
          <GridItem>
            <CardBox h="100%">
              <Box px="20px" py="14px" borderBottom="1px solid #eee">
                <Typography fontSize="15px" fontWeight="600" color="#1a1a1a">
                  Actions
                </Typography>
              </Box>
              <Box p="20px">
                <Button
                  variant="primary"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  loading={isLoggingOut}
                  loadingText="Signing out..."
                  size="md"
                  width="full"
                  leftIcon={<FiLogOut size={14} />}
                >
                  Sign Out
                </Button>
                <Typography
                  fontSize="11px"
                  color="#888"
                  textAlign="center"
                  mt="14px"
                  lineHeight="1.6"
                >
                  Signing out will end your session and clear all authentication tokens.
                </Typography>
              </Box>
            </CardBox>
          </GridItem>

          {/* Need Help Card */}
          <GridItem>
            <CardBox h="100%">
              <Box px="20px" py="14px" borderBottom="1px solid #eee">
                <Typography fontSize="15px" fontWeight="600" color="#1a1a1a">
                  Need Help?
                </Typography>
              </Box>
              <Box p="20px">
                <Typography fontSize="13px" color="#666" lineHeight="1.7" mb="14px">
                  For profile updates, password changes, or account management, please
                  contact your Azure AD administrator.
                </Typography>
                <Typography fontSize="13px" color="#666" lineHeight="1.7">
                  Profile information is managed through your organization&apos;s Azure
                  Active Directory.
                </Typography>
              </Box>
            </CardBox>
          </GridItem>
        </Grid>
      </Box>
    </Flex>
  );
}
