"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  Card,
  Separator,
  Badge,
  Icon,
  Spinner,
  Flex,
} from "@chakra-ui/react";
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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <Box flex="1" ml="240px">
        <Box p="6" bg="gray.50">
          <Container maxW="4xl">
            {/* Header */}
            <HStack mb="6" gap="4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <HStack gap="2">
                    <Icon as={FiArrowLeft} />
                    <Text>Back to Dashboard</Text>
                  </HStack>
                </Button>
              </Link>
            </HStack>

        {/* Profile Card */}
        <Card.Root mb="6">
          <Card.Header>
            <HStack justify="space-between">
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                Profile Management
              </Text>
              <Badge colorScheme="orange" fontSize="sm" px="3" py="1">
                Administrator
              </Badge>
            </HStack>
          </Card.Header>
          <Card.Body>
            <VStack gap="6" align="stretch">
              {/* Profile Picture and Basic Info */}
              <HStack gap="6" p="6" bg="gray.50" borderRadius="lg">
                {userImage ? (
                  <Avatar.Root size="xl">
                    <Avatar.Image src={userImage} alt={displayName} />
                    <Avatar.Fallback>{getInitials(userName)}</Avatar.Fallback>
                  </Avatar.Root>
                ) : (
                  <Avatar.Root size="xl" bg="orange.500" color="white">
                    <Avatar.Fallback>
                      <Icon as={FiUser} boxSize="8" />
                    </Avatar.Fallback>
                  </Avatar.Root>
                )}
                <VStack align="start" gap="2" flex="1">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {displayName}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {userEmail}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Profile picture is managed by Azure AD
                  </Text>
                </VStack>
              </HStack>

              <Separator />

              {/* User Information */}
              <VStack align="stretch" gap="4">
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                  Account Information
                </Text>

                <Box p="4" bg="white" borderRadius="md" border="1px" borderColor="gray.200">
                  <VStack align="stretch" gap="4">
                    <HStack justify="space-between">
                      <HStack gap="3">
                        <Icon as={FiUser} color="gray.500" />
                        <Text fontSize="sm" color="gray.600">
                          Full Name
                        </Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="medium" color="gray.800">
                        {userName}
                      </Text>
                    </HStack>

                    <Separator />

                    <HStack justify="space-between">
                      <HStack gap="3">
                        <Icon as={FiMail} color="gray.500" />
                        <Text fontSize="sm" color="gray.600">
                          Email Address
                        </Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="medium" color="gray.800">
                        {userEmail}
                      </Text>
                    </HStack>

                    <Separator />

                    <HStack justify="space-between">
                      <HStack gap="3">
                        <Icon as={FiShield} color="gray.500" />
                        <Text fontSize="sm" color="gray.600">
                          Role
                        </Text>
                      </HStack>
                      <Badge colorScheme="orange" fontSize="sm" px="2" py="1">
                        Administrator
                      </Badge>
                    </HStack>

                    <Separator />

                    <HStack justify="space-between">
                      <HStack gap="3">
                        <Icon as={FiKey} color="gray.500" />
                        <Text fontSize="sm" color="gray.600">
                          Authentication
                        </Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="medium" color="gray.800">
                        Azure AD (Single Sign-On)
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>

              <Separator />

              {/* Security Information */}
              <VStack align="stretch" gap="4">
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                  Security & Privacy
                </Text>

                <Box p="4" bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                  <VStack align="start" gap="2">
                    <HStack gap="2">
                      <Icon as={FiShield} color="blue.600" />
                      <Text fontSize="sm" fontWeight="semibold" color="blue.800">
                        Secure Authentication
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="blue.700" pl="6">
                      Your account is secured through Azure AD Single Sign-On. 
                      All authentication tokens are stored securely server-side and never exposed to the browser.
                    </Text>
                  </VStack>
                </Box>
              </VStack>

              <Separator />

              {/* Actions */}
              <VStack align="stretch" gap="3">
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                  Actions
                </Text>

                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={handleLogout}
                  loading={isLoggingOut}
                  disabled={isLoggingOut}
                  size="lg"
                >
                  <HStack gap="2">
                    {!isLoggingOut && <Icon as={FiLogOut} />}
                    <Text>{isLoggingOut ? "Logging out..." : "Sign Out"}</Text>
                  </HStack>
                </Button>

                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Signing out will end your session and clear all authentication tokens.
                </Text>
              </VStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Additional Information */}
        <Card.Root>
          <Card.Header>
            <Text fontSize="lg" fontWeight="semibold" color="gray.800">
              Need Help?
            </Text>
          </Card.Header>
          <Card.Body>
            <VStack align="stretch" gap="3">
              <Text fontSize="sm" color="gray.600">
                For profile updates, password changes, or account management, please contact your Azure AD administrator.
              </Text>
              <Text fontSize="sm" color="gray.600">
                Profile information is managed through your organization's Azure Active Directory.
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
          </Container>
        </Box>
      </Box>
    </Flex>
  );
}

