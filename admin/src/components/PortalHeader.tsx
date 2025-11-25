"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProfileMenu, IconWrapper } from "@/lib/mukuruImports";
import { Box, HStack, Flex, Button } from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";
import { useSidebar } from "../contexts/SidebarContext";

export default function PortalHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const { condensed, setCondensed } = useSidebar();
  const userName = session?.user?.name || "Admin";
  const userEmail = session?.user?.email || "admin@mukuru.com";
  
  // Extract first name for greeting (lowercase as shown in screenshot)
  const firstName = userName.split(" ")[0]?.toLowerCase() || "admin";
  
  // Calculate left offset based on sidebar state
  const sidebarWidth = condensed ? "72px" : "280px";

  return (
    <Box
      position="fixed"
      top="0"
      left={sidebarWidth}
      right="0"
      height="90px"
      bg="white"
      zIndex="999"
      px="6"
      py="4"
      pl="6"
      transition="left 0.3s ease, width 0.3s ease"
      className="portal-header"
      borderBottom="1px solid"
      borderColor="rgba(55, 58, 54, 0.15)"
    >
      <Flex justify="space-between" align="center" width="full" height="full">
        {/* Left side: Collapse button */}
        <HStack gap="4" align="center">
          {/* Collapse/Expand sidebar button - circular grey with orange chevron */}
          <Button
            variant="ghost"
            onClick={() => setCondensed(!condensed)}
            p="2"
            borderRadius="full"
            minW="40px"
            h="40px"
            bg="gray.100"
            _hover={{ bg: "gray.200" }}
            aria-label="Toggle sidebar"
            border="none"
            _focus={{ boxShadow: "none", outline: "none" }}
            _active={{ bg: "gray.200" }}
          >
            <IconWrapper>
              <FiArrowLeft size={20} color="#F05423" />
            </IconWrapper>
          </Button>
        </HStack>

        {/* Right side: Profile Menu - matching screenshot */}
        <HStack gap="4" align="center">
          <ProfileMenu
            user={userName}
            menuItems={[
              {
                id: 0,
                label: userEmail,
                value: "email",
              },
              {
                id: 1,
                label: "My Profile",
                value: "profile",
                onSelect: () => router.push("/profile")
              },
              {
                id: 2,
                label: "Settings",
                value: "settings",
                onSelect: () => router.push("/settings")
              },
              {
                id: 3,
                label: "Log Out",
                value: "logout",
                onSelect: () => router.push("/api/auth/logout")
              }
            ]}
          />
        </HStack>
      </Flex>
    </Box>
  );
}

