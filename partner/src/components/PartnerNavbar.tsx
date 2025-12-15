'use client';

import { Box, Circle, Container, Flex, HStack, Icon } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiPlus, FiLogOut, FiMessageSquare } from 'react-icons/fi';
import { Button, MukuruLogo, Typography } from '@mukuru/mukuru-react-components';
import { getInitials } from '@/lib/auth/session';

const MotionBox = motion.create(Box);
const MotionHStack = motion.create(HStack);

interface PartnerNavbarProps {
  currentUser: {
    name: string;
    email?: string;
    companyName?: string;
  };
  hasExistingApplication?: boolean;
}

export function PartnerNavbar({
  currentUser,
  hasExistingApplication = false,
}: PartnerNavbarProps) {
  return (
    <MotionBox
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      py="4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Container maxW="7xl">
        <Flex justify="space-between" align="center">
          <MotionHStack
            gap="4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link href="/partner/dashboard">
              <Box cursor="pointer">
                <MukuruLogo height="32px" />
              </Box>
            </Link>
          </MotionHStack>
          <MotionHStack
            gap="4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Box
              title={
                hasExistingApplication ? 'You already have an active application' : ''
              }
            >
              {hasExistingApplication ? (
                <MotionBox>
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Icon as={FiPlus} color="white" />}
                    bg="mukuru.buttons.inactive.grey"
                    cursor="not-allowed"
                    opacity={0.6}
                    _hover={{ bg: 'mukuru.buttons.inactive.grey' }}
                    disabled
                  >
                    <Typography
                      color="mukuru.text.inverse"
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      New Application
                    </Typography>
                  </Button>
                </MotionBox>
              ) : (
                <Link href="/partner/application/enhanced">
                  <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Icon as={FiPlus} color="white" />}
                      bg="mukuru.buttons.primary"
                      _hover={{ bg: 'mukuru.buttons.inactive.orange' }}
                    >
                      <Typography
                        color="mukuru.text.inverse"
                        fontSize="sm"
                        fontWeight="medium"
                      >
                        New Application
                      </Typography>
                    </Button>
                  </MotionBox>
                </Link>
              )}
            </Box>
            <Link href="/partner/messages">
              <Button variant="ghost" size="sm">
                <Icon as={FiMessageSquare} boxSize="5" color="mukuru.buttons.primary" />
              </Button>
            </Link>
            <Link href="/partner/profile">
              <MotionBox whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Circle
                  size="40px"
                  bg="linear-gradient(135deg, var(--mukuru-buttons-primary) 0%, var(--mukuru-text-accent) 100%)"
                  color="white"
                  cursor="pointer"
                  boxShadow="0 4px 12px rgba(255, 107, 53, 0.3)"
                  _hover={{
                    boxShadow: '0 6px 20px rgba(255, 107, 53, 0.4)',
                  }}
                  transition="all 0.2s ease"
                >
                  <Typography fontSize="sm" fontWeight="bold" color="white">
                    {getInitials(currentUser.name)}
                  </Typography>
                </Circle>
              </MotionBox>
            </Link>
          </MotionHStack>
        </Flex>
      </Container>
    </MotionBox>
  );
}
