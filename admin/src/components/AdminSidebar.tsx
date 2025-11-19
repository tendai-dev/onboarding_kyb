"use client";

import { 
  Box, 
  VStack, 
  HStack,
  Text,
  Icon,
  Separator,
  Button,
  Menu
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { 
  FiGrid, 
  FiList, 
  FiBarChart, 
  FiSearch, 
  FiFileText, 
  FiCheckSquare,
  FiSettings,
  FiUser,
  FiChevronDown,
  FiUsers,
  FiMessageSquare,
  FiShield,
  FiRefreshCw,
  FiUpload,
  FiMail,
  FiBell,
  FiClipboard,
  FiZap,
  FiLock,
  FiLogOut,
  FiEdit
} from "react-icons/fi";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Get user information from session
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image || null;
  // Format name better - extract first name and last name properly
  const formatUserName = (name: string): string => {
    if (!name || name === "User") return "User";
    // Split by space and take first and last name
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    // Return "First Last" format, but limit to 2 parts max
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };
  const displayName = formatUserName(userName);

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
      // Show error - could use a toast library here if needed
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard", icon: FiGrid },
    { path: "/work-queue", label: "Work Queue", icon: FiList },
    { path: "/applications", label: "Applications", icon: FiFileText },
    { path: "/messages", label: "Messages", icon: FiMessageSquare },
    { path: "/reports", label: "Reports", icon: FiBarChart },
    { path: "/audit-log", label: "Audit Log", icon: FiSearch }
  ];

  const riskManagementItems = [
    { path: "/risk-review", label: "Risk Review", icon: FiShield },
    { path: "/approvals", label: "Approvals", icon: FiCheckSquare },
    { path: "/refreshes", label: "Refreshes", icon: FiRefreshCw }
  ];

  const dataManagementItems = [
    { path: "/documents", label: "Documents", icon: FiFileText },
    { path: "/data-migration", label: "Data Migration", icon: FiUpload },
    { path: "/checklists", label: "Checklists", icon: FiClipboard },
    { path: "/notifications", label: "Notifications", icon: FiBell }
  ];

  return (
    <Box 
      width="240px" 
      bg="white" 
      borderRight="1px" 
      borderColor="gray.200"
      position="fixed"
      height="100vh"
      overflowY="auto"
      boxShadow="sm"
      zIndex="10"
    >
      <VStack align="stretch" gap="0" height="100%">
        {/* Profile Card Header */}
        <Box p="4" borderBottom="1px" borderColor="gray.100" bg="gray.50">
          <Menu.Root>
            <Menu.Trigger asChild>
              <Box
                cursor="pointer"
                transition="opacity 0.2s"
                borderRadius="md"
                p="2"
                _hover={{ bg: "gray.100", opacity: 0.8 }}
              >
                <HStack gap="3">
                  {userImage && !imageError ? (
                    <Box
                      width="40px"
                      height="40px"
                      borderRadius="lg"
                      overflow="hidden"
                      flexShrink={0}
                      position="relative"
                    >
                      <Image
                        src={userImage}
                        alt={userName}
                        width={40}
                        height={40}
                        style={{ objectFit: "cover" }}
                        onError={() => setImageError(true)}
                        unoptimized
                      />
                    </Box>
                  ) : (
                    <Box 
                      width="40px" 
                      height="40px" 
                      bg="orange.500" 
                      color="white" 
                      borderRadius="lg" 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon as={FiUser} boxSize="5" />
                    </Box>
                  )}
                  <VStack align="start" gap="0" flex="1" minW="0">
                    <Text fontSize="sm" fontWeight="bold" color="gray.800" lineClamp={1}>
                      {status === "loading" ? "Loading..." : displayName}
                    </Text>
                    <Text fontSize="xs" color="gray.500">Administrator</Text>
                    {userEmail && (
                      <Text fontSize="xs" color="gray.400" lineClamp={1}>
                        {userEmail}
                      </Text>
                    )}
                  </VStack>
                  <Icon as={FiChevronDown} color="gray.400" boxSize="4" />
                </HStack>
              </Box>
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item value="profile" onSelect={() => router.push("/profile")}>
                <HStack gap="2">
                  <Icon as={FiUser} />
                  <Text>View Profile</Text>
                </HStack>
              </Menu.Item>
              <Menu.Item value="settings" onSelect={() => router.push("/settings")}>
                <HStack gap="2">
                  <Icon as={FiSettings} />
                  <Text>Settings</Text>
                </HStack>
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item 
                value="logout" 
                onSelect={handleLogout}
                disabled={isLoggingOut}
                color="red.600"
              >
                <HStack gap="2">
                  <Icon as={FiLogOut} />
                  <Text>{isLoggingOut ? "Logging out..." : "Sign Out"}</Text>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </Box>

        {/* Navigation */}
        <VStack align="stretch" gap="0" flex="1" p="3">
          {/* Main Navigation */}
          <VStack align="stretch" gap="1" mb="6">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <HStack 
                    gap="3" 
                    p="2.5" 
                    borderRadius="md" 
                    bg={isActive ? "orange.50" : "transparent"}
                    cursor="pointer"
                    _hover={{ 
                      bg: isActive ? "orange.100" : "gray.50",
                      transform: "translateX(2px)"
                    }}
                    transition="all 0.2s ease"
                    borderLeft={isActive ? "3px solid" : "3px solid transparent"}
                    borderLeftColor={isActive ? "orange.500" : "transparent"}
                  >
                    <Icon 
                      as={IconComponent} 
                      boxSize="4" 
                      color={isActive ? "orange.600" : "gray.500"} 
                    />
                    <Text 
                      fontSize="sm" 
                      color={isActive ? "orange.700" : "gray.700"}
                      fontWeight={isActive ? "semibold" : "medium"}
                    >
                      {item.label}
                    </Text>
                  </HStack>
                </Link>
              );
            })}
          </VStack>

          <Separator my="2" />

          {/* Risk Management Section */}
          <VStack align="stretch" gap="1" mb="4">
            <Text 
              fontSize="xs" 
              fontWeight="semibold" 
              color="gray.400" 
              textTransform="uppercase" 
              letterSpacing="wide" 
              mb="2"
              px="2"
            >
              Risk Management
            </Text>
            
            {riskManagementItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <HStack 
                    gap="3" 
                    p="2.5" 
                    borderRadius="md" 
                    bg={isActive ? "orange.50" : "transparent"}
                    cursor="pointer"
                    _hover={{ 
                      bg: isActive ? "orange.100" : "gray.50",
                      transform: "translateX(2px)"
                    }}
                    transition="all 0.2s ease"
                    borderLeft={isActive ? "3px solid" : "3px solid transparent"}
                    borderLeftColor={isActive ? "orange.500" : "transparent"}
                  >
                    <Icon 
                      as={IconComponent} 
                      boxSize="4" 
                      color={isActive ? "orange.600" : "gray.500"} 
                    />
                    <Text 
                      fontSize="sm" 
                      color={isActive ? "orange.700" : "gray.700"}
                      fontWeight={isActive ? "semibold" : "medium"}
                    >
                      {item.label}
                    </Text>
                  </HStack>
                </Link>
              );
            })}
          </VStack>

          <Separator my="2" />

          {/* Data Management Section */}
          <VStack align="stretch" gap="1" mb="4">
            <Text 
              fontSize="xs" 
              fontWeight="semibold" 
              color="gray.400" 
              textTransform="uppercase" 
              letterSpacing="wide" 
              mb="2"
              px="2"
            >
              Data Management
            </Text>
            
            {dataManagementItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <HStack 
                    gap="3" 
                    p="2.5" 
                    borderRadius="md" 
                    bg={isActive ? "orange.50" : "transparent"}
                    cursor="pointer"
                    _hover={{ 
                      bg: isActive ? "orange.100" : "gray.50",
                      transform: "translateX(2px)"
                    }}
                    transition="all 0.2s ease"
                    borderLeft={isActive ? "3px solid" : "3px solid transparent"}
                    borderLeftColor={isActive ? "orange.500" : "transparent"}
                  >
                    <Icon 
                      as={IconComponent} 
                      boxSize="4" 
                      color={isActive ? "orange.600" : "gray.500"} 
                    />
                    <Text 
                      fontSize="sm" 
                      color={isActive ? "orange.700" : "gray.700"}
                      fontWeight={isActive ? "semibold" : "medium"}
                    >
                      {item.label}
                    </Text>
                  </HStack>
                </Link>
              );
            })}
          </VStack>

          <Separator my="2" />

          {/* Configuration Section */}
          <VStack align="stretch" gap="1">
            <Text 
              fontSize="xs" 
              fontWeight="semibold" 
              color="gray.400" 
              textTransform="uppercase" 
              letterSpacing="wide" 
              mb="2"
              px="2"
            >
              Configuration
            </Text>
            
            <Link href="/entity-types">
              <HStack 
                gap="3" 
                p="2.5" 
                borderRadius="md" 
                bg={pathname === "/entity-types" ? "orange.50" : "transparent"}
                cursor="pointer"
                _hover={{ 
                  bg: pathname === "/entity-types" ? "orange.100" : "gray.50",
                  transform: "translateX(2px)"
                }}
                transition="all 0.2s ease"
                borderLeft={pathname === "/entity-types" ? "3px solid" : "3px solid transparent"}
                borderLeftColor={pathname === "/entity-types" ? "orange.500" : "transparent"}
              >
                <Icon 
                  as={FiFileText} 
                  boxSize="4" 
                  color={pathname === "/entity-types" ? "orange.600" : "gray.500"} 
                />
                <Text 
                  fontSize="sm" 
                  color={pathname === "/entity-types" ? "orange.700" : "gray.700"}
                  fontWeight={pathname === "/entity-types" ? "semibold" : "medium"}
                >
                  Entity Types
                </Text>
              </HStack>
            </Link>

            <Link href="/requirements">
              <HStack 
                gap="3" 
                p="2.5" 
                borderRadius="md" 
                bg={pathname === "/requirements" ? "orange.50" : "transparent"}
                cursor="pointer"
                _hover={{ 
                  bg: pathname === "/requirements" ? "orange.100" : "gray.50",
                  transform: "translateX(2px)"
                }}
                transition="all 0.2s ease"
                borderLeft={pathname === "/requirements" ? "3px solid" : "3px solid transparent"}
                borderLeftColor={pathname === "/requirements" ? "orange.500" : "transparent"}
              >
                <Icon 
                  as={FiCheckSquare} 
                  boxSize="4" 
                  color={pathname === "/requirements" ? "orange.600" : "gray.500"} 
                />
                <Text 
                  fontSize="sm" 
                  color={pathname === "/requirements" ? "orange.700" : "gray.700"}
                  fontWeight={pathname === "/requirements" ? "semibold" : "medium"}
                >
                  Requirements
                </Text>
              </HStack>
            </Link>

            <Link href="/wizard-configurations">
              <HStack 
                gap="3" 
                p="2.5" 
                borderRadius="md" 
                bg={pathname?.startsWith("/wizard-configurations") ? "orange.50" : "transparent"}
                cursor="pointer"
                _hover={{ 
                  bg: pathname?.startsWith("/wizard-configurations") ? "orange.100" : "gray.50",
                  transform: "translateX(2px)"
                }}
                transition="all 0.2s ease"
                borderLeft={pathname?.startsWith("/wizard-configurations") ? "3px solid" : "3px solid transparent"}
                borderLeftColor={pathname?.startsWith("/wizard-configurations") ? "orange.500" : "transparent"}
              >
                <Icon 
                  as={FiZap} 
                  boxSize="4" 
                  color={pathname?.startsWith("/wizard-configurations") ? "orange.600" : "gray.500"} 
                />
                <Text 
                  fontSize="sm" 
                  color={pathname?.startsWith("/wizard-configurations") ? "orange.700" : "gray.700"}
                  fontWeight={pathname?.startsWith("/wizard-configurations") ? "semibold" : "medium"}
                >
                  Wizard Configurations
                </Text>
              </HStack>
            </Link>

            <Link href="/rules-and-permissions">
              <HStack 
                gap="3" 
                p="2.5" 
                borderRadius="md" 
                bg={pathname?.startsWith("/rules-and-permissions") ? "orange.50" : "transparent"}
                cursor="pointer"
                _hover={{ 
                  bg: pathname?.startsWith("/rules-and-permissions") ? "orange.100" : "gray.50",
                  transform: "translateX(2px)"
                }}
                transition="all 0.2s ease"
                borderLeft={pathname?.startsWith("/rules-and-permissions") ? "3px solid" : "3px solid transparent"}
                borderLeftColor={pathname?.startsWith("/rules-and-permissions") ? "orange.500" : "transparent"}
              >
                <Icon 
                  as={FiLock} 
                  boxSize="4" 
                  color={pathname?.startsWith("/rules-and-permissions") ? "orange.600" : "gray.500"} 
                />
                <Text 
                  fontSize="sm" 
                  color={pathname?.startsWith("/rules-and-permissions") ? "orange.700" : "gray.700"}
                  fontWeight={pathname?.startsWith("/rules-and-permissions") ? "semibold" : "medium"}
                >
                  Rules and Permissions
                </Text>
              </HStack>
            </Link>
          </VStack>
        </VStack>
      </VStack>
    </Box>
  );
}
