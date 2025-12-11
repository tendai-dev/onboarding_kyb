'use client';

import {
  Box,
  Flex,
  HStack,
  VStack,
  Image,
  Avatar,
  Menu,
  IconButton,
  Drawer,
  useDisclosure,
  useBreakpointValue,
  Link,
} from '@chakra-ui/react';
import { Button, Typography, Tag } from '@/lib/mukuruImports';
import { motion } from 'framer-motion';
import { useState } from 'react';

const MotionBox = motion.create(Box);

interface NavigationProps {
  userType?: 'partner';
  userName?: string;
  userEmail?: string;
}

const partnerDefaultNavItems = [
  { label: 'Dashboard', href: '/partner/dashboard', icon: '🏠' },
  { label: 'My Application', href: '/onboarding/partner', icon: '📝' },
  { label: 'Documents', href: '/partner/documents', icon: '📄' },
  { label: 'Messages', href: '/partner/messages', icon: '💬' },
  { label: 'Signatures', href: '/signature', icon: '✍️' },
];

const partnerNavItems = [
  { label: 'Dashboard', href: '/partner/dashboard', icon: '🏠' },
  { label: 'Onboarding', href: '/onboarding/partner', icon: '📝' },
  { label: 'Documents', href: '/partner/documents', icon: '📄' },
  { label: 'Messages', href: '/partner/messages', icon: '💬' },
];

export default function Navigation({
  userType = 'partner',
  userName = 'John Doe',
  userEmail = 'john@example.com',
}: NavigationProps) {
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const [notifications] = useState(3);

  const getNavItems = () => {
    switch (userType) {
      case 'partner':
        return partnerNavItems;
      default:
        return partnerDefaultNavItems;
    }
  };

  const navItems = getNavItems();

  const NavContent = () => (
    <VStack gap="1" align="stretch">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} _hover={{ textDecoration: 'none' }}>
          <MotionBox
            p="3"
            borderRadius="lg"
            cursor="pointer"
            _hover={{ bg: 'gray.100' }}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <HStack gap="3">
              <Typography fontSize="lg">{item.icon}</Typography>
              <Typography fontWeight="medium" color="mukuru.text.primary">
                {item.label}
              </Typography>
            </HStack>
          </MotionBox>
        </Link>
      ))}
    </VStack>
  );

  return (
    <>
      {/* Desktop Navigation */}
      {!isMobile && (
        <Box
          position="fixed"
          left="0"
          top="0"
          height="100vh"
          width="280px"
          bg="white"
          borderRight="1px"
          borderColor="gray.200"
          zIndex="1000"
          overflowY="auto"
        >
          <VStack gap="0" height="100%">
            {/* Logo */}
            <Box p="6" width="100%" borderBottom="1px" borderColor="gray.100">
              <HStack gap="3">
                <Image
                  src="/mukuru-logo.png"
                  alt="Mukuru Logo"
                  height="40px"
                  width="auto"
                />
                <VStack align="start" gap="0">
                  <Typography
                    as="h2"
                    fontSize="lg"
                    fontWeight="bold"
                    color="mukuru.text.primary"
                  >
                    Mukuru
                  </Typography>
                  <Typography
                    fontSize="sm"
                    color="mukuru.text.primary"
                    textTransform="capitalize"
                  >
                    {userType} Portal
                  </Typography>
                </VStack>
              </HStack>
            </Box>

            {/* Navigation Items */}
            <Box flex="1" p="4" width="100%">
              <NavContent />
            </Box>

            {/* User Profile */}
            <Box p="4" width="100%" borderTop="1px" borderColor="gray.100">
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Box cursor="pointer">
                    <HStack gap="3" p="3" borderRadius="lg" _hover={{ bg: 'gray.50' }}>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback>
                          {userName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <VStack align="start" gap="0" flex="1">
                        <Typography fontSize="sm" fontWeight="medium" lineClamp={1}>
                          {userName}
                        </Typography>
                        <Typography
                          fontSize="xs"
                          color="mukuru.text.primary"
                          lineClamp={1}
                        >
                          {userEmail}
                        </Typography>
                      </VStack>
                      <Typography fontSize="sm" color="mukuru.grey.medium">
                        ⋯
                      </Typography>
                    </HStack>
                  </Box>
                </Menu.Trigger>
                <Menu.Content>
                  <Menu.Item value="profile">Profile Settings</Menu.Item>
                  <Menu.Item value="preferences">Account Preferences</Menu.Item>
                  <Menu.Separator />
                  <Menu.Item value="help" color="error.500">
                    Help & Support
                  </Menu.Item>
                  <Menu.Item value="signout" color="error.500">
                    Sign Out
                  </Menu.Item>
                </Menu.Content>
              </Menu.Root>
            </Box>
          </VStack>
        </Box>
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <>
          {/* Mobile Header */}
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            height="70px"
            bg="white"
            borderBottom="1px"
            borderColor="gray.200"
            zIndex="1000"
            px="4"
          >
            <Flex justify="space-between" align="center" height="100%">
              <HStack gap="3">
                <IconButton aria-label="Open menu" variant="ghost" onClick={onOpen}>
                  <Typography fontSize="lg">☰</Typography>
                </IconButton>
                <Image
                  src="/mukuru-logo.png"
                  alt="Mukuru Logo"
                  height="32px"
                  width="auto"
                />
              </HStack>

              <HStack gap="3">
                <Box position="relative">
                  <IconButton aria-label="Notifications" variant="ghost" size="sm">
                    <Typography fontSize="lg">🔔</Typography>
                  </IconButton>
                  {notifications > 0 && (
                    <Tag variant="solid" size="md">
                      {notifications}
                    </Tag>
                  )}
                </Box>
                <Avatar.Root size="sm">
                  <Avatar.Fallback>
                    {userName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Avatar.Fallback>
                </Avatar.Root>
              </HStack>
            </Flex>
          </Box>

          {/* Mobile Drawer */}
          <Drawer.Root
            open={isOpen}
            placement="start"
            onOpenChange={(e) => !e.open && onClose()}
          >
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content>
                <Drawer.CloseTrigger />
                <Drawer.Header>
                  <HStack gap="3">
                    <Image
                      src="/mukuru-logo.png"
                      alt="Mukuru Logo"
                      height="32px"
                      width="auto"
                    />
                    <VStack align="start" gap="0">
                      <Typography
                        as="h2"
                        fontSize="md"
                        fontWeight="bold"
                        color="gray.800"
                      >
                        Mukuru
                      </Typography>
                      <Typography
                        fontSize="sm"
                        color="gray.600"
                        textTransform="capitalize"
                      >
                        {userType} Portal
                      </Typography>
                    </VStack>
                  </HStack>
                </Drawer.Header>

                <Drawer.Body>
                  <VStack gap="6" align="stretch">
                    <NavContent />

                    <Box pt="6" borderTop="1px" borderColor="gray.100">
                      <VStack gap="4" align="stretch">
                        <HStack gap="3">
                          <Avatar.Root size="md">
                            <Avatar.Fallback>
                              {userName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <VStack align="start" gap="0">
                            <Typography fontSize="sm" fontWeight="medium">
                              {userName}
                            </Typography>
                            <Typography fontSize="xs" color="gray.600">
                              {userEmail}
                            </Typography>
                          </VStack>
                        </HStack>

                        <VStack gap="2" align="stretch">
                          <Button variant="ghost" size="sm" justifyContent="start">
                            Profile Settings
                          </Button>
                          <Button variant="ghost" size="sm" justifyContent="start">
                            Help & Support
                          </Button>
                          <Button variant="ghost" size="sm" justifyContent="start">
                            Sign Out
                          </Button>
                        </VStack>
                      </VStack>
                    </Box>
                  </VStack>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Drawer.Root>
        </>
      )}

      {/* Top Bar for Desktop */}
      {!isMobile && (
        <Box
          position="fixed"
          top="0"
          left="280px"
          right="0"
          height="70px"
          bg="white"
          borderBottom="1px"
          borderColor="gray.200"
          zIndex="999"
          px="6"
        >
          <Flex justify="space-between" align="center" height="100%">
            <Box>{/* Breadcrumb or page title can go here */}</Box>

            <HStack gap="4">
              <Box position="relative">
                <IconButton aria-label="Notifications" variant="ghost" size="sm">
                  <Typography fontSize="lg">🔔</Typography>
                </IconButton>
                {notifications > 0 && (
                  <Tag variant="solid" size="md">
                    {notifications}
                  </Tag>
                )}
              </Box>

              <Button variant="primary" size="sm">
                Quick Action
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}
    </>
  );
}
