"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Separator,
  Spinner,
  Flex,
  SimpleGrid,
} from "@chakra-ui/react";
import { Typography, Button, Tag, Card, IconWrapper } from "@/lib/mukuruImports";
import { Avatar, AvatarImage, AvatarFallback } from "@chakra-ui/react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiShield,
  FiLogOut,
  FiArrowLeft,
  FiEdit,
  FiKey,
} from "react-icons/fi";
import Link from "next/link";
import AdminSidebar from "../../components/AdminSidebar";
import PortalHeader from "../../components/PortalHeader";
import { useSidebar } from "../../contexts/SidebarContext";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { condensed } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call logout API to clear Redis session
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Sign out from NextAuth
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  if (status === "loading") {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="100vh"
      >
        <Spinner size="xl" color="orange.500" />
      </Box>
    );
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const user = session?.user;
  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userImage = user?.image || null;

  // Format name
  const formatUserName = (name: string): string => {
    if (!name || name === "User") return "User";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };
  const displayName = formatUserName(userName);

  // Get initials for avatar
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content */}
      <Box 
        flex="1" 
        ml={condensed ? "72px" : "280px"}
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
        bg="gray.50"
        overflowX="hidden"
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        <Box width="full" px="8" py="8" maxW="full">
          {/* Header */}
          <Box mb="6">
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <Button 
                variant="ghost" 
                size="sm"
                leftIcon={<IconWrapper><FiArrowLeft size={16} color="#F05423" /></IconWrapper>}
                style={{ color: '#F05423', border: 'none' }}
                _hover={{ bg: 'gray.100', border: 'none' }}
                _focus={{ border: 'none', boxShadow: 'none' }}
                _active={{ border: 'none' }}
                className="back-button"
              >
                Back to Dashboard
              </Button>
            </Link>
          </Box>

          {/* Profile Management and Account Information - Side by Side */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6" mb="6" width="full">
            {/* Profile Management Card */}
            <Card bg="white" width="full" height="full" display="flex" flexDirection="column">
              <Box p="6" borderBottom="1px" borderColor="gray.200" width="full">
                <Flex justify="space-between" align="center" width="full">
                  <Typography fontSize="2xl" fontWeight="bold" color="gray.800">
                    Profile Management
                  </Typography>
                  <Tag 
                    variant="warning" 
                    style={{ backgroundColor: '#F05423' }}
                    className="mukuru-primary-tag"
                  >
                    Administrator
                  </Tag>
                </Flex>
              </Box>
              <Box p="6" width="full" flex="1" display="flex" flexDirection="column" justifyContent="center">
                <VStack gap="4" align="center" width="full">
                  {userImage ? (
                    <Avatar.Root size="xl" flexShrink={0}>
                      <AvatarImage src={userImage} alt={displayName} />
                      <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                    </Avatar.Root>
                  ) : (
                    <Avatar.Root size="xl" bg="orange.500" color="white" flexShrink={0}>
                      <AvatarFallback>
                        <IconWrapper><FiUser size={32} /></IconWrapper>
                      </AvatarFallback>
                    </Avatar.Root>
                  )}
                  <VStack align="center" gap="2" width="full">
                    <Typography fontSize="xl" fontWeight="bold" color="gray.800" textAlign="center" width="full">
                      {displayName}
                    </Typography>
                    <Typography fontSize="sm" color="gray.600" textAlign="center" width="full">
                      {userEmail}
                    </Typography>
                    <Typography fontSize="xs" color="gray.500" textAlign="center" width="full">
                      Profile picture is managed by Azure AD
                    </Typography>
                  </VStack>
                </VStack>
              </Box>
            </Card>

            {/* Account Information Card */}
            <Card bg="white" width="full" height="full" display="flex" flexDirection="column">
              <Box p="6" borderBottom="1px" borderColor="gray.200" width="full">
                <Typography fontSize="2xl" fontWeight="bold" color="gray.800">
                  Account Information
                </Typography>
              </Box>
              <Box p="6" width="full" flex="1" display="flex" flexDirection="column" justifyContent="center">
                <VStack align="stretch" gap="4" width="full">
                  <Flex justify="space-between" align="center" width="full" gap="4" py="2">
                    <Flex gap="3" align="center" flex="1" minW="0">
                      <IconWrapper flexShrink={0}><FiUser size={16} color="#718096" /></IconWrapper>
                      <Typography fontSize="sm" color="gray.600" flexShrink={0}>
                        Full Name
                      </Typography>
                    </Flex>
                    <Box flexShrink={0} maxW="60%">
                      <Typography fontSize="sm" fontWeight="medium" color="gray.800" textAlign="right">
                        {userName}
                      </Typography>
                    </Box>
                  </Flex>

                  <Box width="full" height="1px" bg="gray.200" />

                  <Flex justify="space-between" align="center" width="full" gap="4" py="2">
                    <Flex gap="3" align="center" flex="1" minW="0">
                      <IconWrapper flexShrink={0}><FiMail size={16} color="#718096" /></IconWrapper>
                      <Typography fontSize="sm" color="gray.600" flexShrink={0}>
                        Email Address
                      </Typography>
                    </Flex>
                    <Box flexShrink={0} maxW="60%">
                      <Typography fontSize="sm" fontWeight="medium" color="gray.800" textAlign="right">
                        {userEmail}
                      </Typography>
                    </Box>
                  </Flex>

                  <Box width="full" height="1px" bg="gray.200" />

                  <Flex justify="space-between" align="center" width="full" gap="4" py="2">
                    <Flex gap="3" align="center" flex="1" minW="0">
                      <IconWrapper flexShrink={0}><FiShield size={16} color="#718096" /></IconWrapper>
                      <Typography fontSize="sm" color="gray.600" flexShrink={0}>
                        Role
                      </Typography>
                    </Flex>
                    <Box flexShrink={0}>
                      <Tag 
                        variant="warning" 
                        style={{ backgroundColor: '#F05423' }}
                        className="mukuru-primary-tag"
                      >
                        Administrator
                      </Tag>
                    </Box>
                  </Flex>

                  <Box width="full" height="1px" bg="gray.200" />

                  <Flex justify="space-between" align="center" width="full" gap="4" py="2">
                    <Flex gap="3" align="center" flex="1" minW="0">
                      <IconWrapper flexShrink={0}><FiKey size={16} color="#718096" /></IconWrapper>
                      <Typography fontSize="sm" color="gray.600" flexShrink={0}>
                        Authentication
                      </Typography>
                    </Flex>
                    <Box flexShrink={0} maxW="60%">
                      <Typography fontSize="sm" fontWeight="medium" color="gray.800" textAlign="right">
                        Azure AD (Single Sign-On)
                      </Typography>
                    </Box>
                  </Flex>
                </VStack>
              </Box>
            </Card>
          </SimpleGrid>

          {/* Security & Privacy, Actions, and Need Help Cards - Side by Side */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6" width="full">
            {/* Security & Privacy Card */}
            <Card bg="white" width="full" height="full" display="flex" flexDirection="column">
              <Box p="6" borderBottom="1px" borderColor="gray.200" width="full">
                <Typography fontSize="2xl" fontWeight="bold" color="gray.800">
                  Security & Privacy
                </Typography>
              </Box>
              <Box p="6" width="full" flex="1" display="flex" flexDirection="column" justifyContent="center">
                <Box p="6" bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200" width="full">
                  <VStack align="start" gap="3" width="full">
                    <Flex gap="2" align="center" width="full">
                      <IconWrapper flexShrink={0}><FiShield size={16} color="#3182CE" /></IconWrapper>
                      <Typography fontSize="sm" fontWeight="semibold" color="blue.800">
                        Secure Authentication
                      </Typography>
                    </Flex>
                    <Typography fontSize="sm" color="blue.700" pl="6" width="full" lineHeight="1.6">
                      Your account is secured through Azure AD Single Sign-On. 
                      All authentication tokens are stored securely server-side and never exposed to the browser.
                    </Typography>
                  </VStack>
                </Box>
              </Box>
            </Card>

            {/* Actions Card */}
            <Card bg="white" width="full" height="full" display="flex" flexDirection="column">
              <Box p="6" borderBottom="1px" borderColor="gray.200" width="full">
                <Typography fontSize="2xl" fontWeight="bold" color="gray.800">
                  Actions
                </Typography>
              </Box>
              <Box p="6" width="full" flex="1" display="flex" flexDirection="column" justifyContent="center">
                <VStack align="stretch" gap="4" width="full">
                  <Button
                    variant="primary"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    size="md"
                    width="full"
                    style={{ backgroundColor: '#F05423' }}
                    className="mukuru-primary-button"
                  >
                    {!isLoggingOut && <IconWrapper><FiLogOut size={16} color="white" /></IconWrapper>}
                    {isLoggingOut ? "Logging out..." : "Sign Out"}
                  </Button>
                  <Typography fontSize="xs" color="gray.500" textAlign="center" width="full" lineHeight="1.5">
                    Signing out will end your session and clear all authentication tokens.
                  </Typography>
                </VStack>
              </Box>
            </Card>

            {/* Need Help Card */}
            <Card bg="white" width="full" height="full" display="flex" flexDirection="column">
              <Box p="6" borderBottom="1px" borderColor="gray.200" width="full">
                <Typography fontSize="2xl" fontWeight="bold" color="gray.800">
                  Need Help?
                </Typography>
              </Box>
              <Box p="6" width="full" flex="1" display="flex" flexDirection="column" justifyContent="center">
                <VStack align="stretch" gap="3" width="full">
                  <Typography fontSize="sm" color="gray.600" width="full" lineHeight="1.6">
                    For profile updates, password changes, or account management, please contact your Azure AD administrator.
                  </Typography>
                  <Typography fontSize="sm" color="gray.600" width="full" lineHeight="1.6">
                    Profile information is managed through your organization's Azure Active Directory.
                  </Typography>
                </VStack>
              </Box>
            </Card>
          </SimpleGrid>
        </Box>
      </Box>
    </Flex>
  );
}

