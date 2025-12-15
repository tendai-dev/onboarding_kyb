'use client';

import { Box, Container, Flex, HStack, Icon } from '@chakra-ui/react';
import { Button, Typography, MukuruLogo } from '@/lib/mukuruImports';
import { FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface PartnerHeaderProps {
  backHref?: string;
  showNewApplication?: boolean;
  showBackButton?: boolean;
  disableNewApplication?: boolean;
}

export function PartnerHeader({
  backHref = '/partner/dashboard',
  showNewApplication = true,
  showBackButton = true,
  disableNewApplication = false,
}: PartnerHeaderProps) {
  return (
    <Box bg="white" borderBottom="1px" borderColor="mukuru.grey.light" py="4">
      <Container maxW="7xl">
        <Flex justify="space-between" align="center">
          <HStack gap="4">
            {showBackButton && (
              <Link href={backHref}>
                <Button variant="primary" size="sm" className="mukuru-primary-button">
                  ← Back
                </Button>
              </Link>
            )}
            <MukuruLogo height="32px" />
          </HStack>
          <HStack gap="4">
            <Link href="/partner/profile">
              <Button variant="ghost" size="sm">
                <Typography
                  color="mukuru.text.primary"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  Profile
                </Typography>
              </Button>
            </Link>
            <Link href="/partner/messages">
              <Button variant="ghost" size="sm">
                <Typography
                  color="mukuru.text.primary"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  Messages
                </Typography>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  if (typeof window !== 'undefined') {
                    localStorage.clear();
                    sessionStorage.clear();
                  }
                  await signOut({ 
                    callbackUrl: '/auth/login',
                    redirect: true 
                  });
                } catch (error) {
                  console.error('Logout error:', error);
                  window.location.href = '/auth/login';
                }
              }}
            >
              <Typography
                color="mukuru.text.primary"
                fontSize="sm"
                fontWeight="medium"
              >
                Logout
              </Typography>
            </Button>
            {showNewApplication && (
              <Link href={disableNewApplication ? '#' : '/partner/application/enhanced'}>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Icon as={FiArrowRight} />}
                  bg="mukuru.buttons.primary"
                  _hover={{ bg: 'mukuru.buttons.inactive.orange' }}
                  disabled={disableNewApplication}
                  opacity={disableNewApplication ? 0.5 : 1}
                  cursor={disableNewApplication ? 'not-allowed' : 'pointer'}
                  onClick={(e) => {
                    if (disableNewApplication) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Typography
                    color="mukuru.text.inverse"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    → New Application
                  </Typography>
                </Button>
              </Link>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

