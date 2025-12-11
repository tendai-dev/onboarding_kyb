/* eslint-disable security/detect-object-injection */
'use client';

import {
  Box,
  Container,
  VStack,
  HStack,
  Flex,
  Spinner,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import { Typography, MukuruLogo, Button } from '@mukuru/mukuru-react-components';
import { motion } from 'framer-motion';
import { signIn, useSession, getSession } from 'next-auth/react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FiShield,
  FiLock,
  FiBarChart2,
  FiZap,
  FiCheckCircle,
  FiFileText,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiAward,
  FiMessageCircle,
  FiArrowRight,
  FiStar,
  FiHelpCircle,
} from 'react-icons/fi';

// Use motion.create() instead of deprecated motion()
const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);
const MotionVStack = motion.create(VStack);

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  // Removed unused router
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for callbackUrl in query params first (handles post-auth redirects)
    const urlParams = new URLSearchParams(window.location.search);
    const callbackUrl = urlParams.get('callbackUrl');

    // Determine redirect path
    let redirectPath = '/partner/dashboard';
    if (callbackUrl) {
      try {
        const decodedUrl = decodeURIComponent(callbackUrl);
        // If it's a full URL, extract the path
        if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
          const url = new URL(decodedUrl);
          redirectPath = url.pathname + url.search;
        } else if (decodedUrl.startsWith('/')) {
          redirectPath = decodedUrl;
        } else {
          redirectPath = decodedUrl;
        }
      } catch (error) {
        console.error('Error parsing callbackUrl:', error);
        redirectPath = '/partner/dashboard';
      }
    }

    // If we have a callbackUrl, this means we just came back from Azure AD
    // The session should be established, but might not be detected yet
    // Try multiple approaches to redirect
    if (callbackUrl) {
      console.info('CallbackUrl detected after Azure AD auth, redirecting...', {
        callbackUrl,
        redirectPath,
        status,
      });

      // Approach 1: If session is authenticated, redirect immediately
      if (status === 'authenticated' && session) {
        console.info('Session authenticated, redirecting to:', redirectPath);
        window.location.replace(redirectPath);
        return;
      }

      // Approach 2: Force session check and redirect if found
      getSession()
        .then((sessionData) => {
          console.info('Session check result:', { hasSession: !!sessionData, status });
          if (sessionData) {
            console.info('Session found via getSession, redirecting to:', redirectPath);
            window.location.replace(redirectPath);
          }
        })
        .catch((err) => {
          console.error('Error checking session:', err);
        });

      // Approach 3: If status is loading, wait a bit then redirect anyway
      // (NextAuth should have authenticated by now)
      if (status === 'loading') {
        console.info('Status is loading, waiting for session...');
        const timeout = setTimeout(() => {
          getSession().then((sessionData) => {
            if (sessionData) {
              console.info('Session found after wait, redirecting to:', redirectPath);
              window.location.replace(redirectPath);
            } else {
              // Even if no session, try redirecting - NextAuth might have set cookies
              console.info(
                'No session found but callbackUrl present, attempting redirect anyway'
              );
              window.location.replace(redirectPath);
            }
          });
        }, 500);
        return () => clearTimeout(timeout);
      }

      // Approach 4: If unauthenticated but we have callbackUrl, redirect anyway
      // This handles edge cases where session isn't detected but auth succeeded
      if (status === 'unauthenticated') {
        console.info(
          'Status unauthenticated but callbackUrl present, redirecting anyway'
        );
        // Small delay to let cookies settle
        setTimeout(() => {
          window.location.replace(redirectPath);
        }, 100);
      }

      return;
    }

    // Normal flow: if authenticated, redirect to dashboard
    if (status === 'authenticated' && session) {
      console.info('Authenticated, redirecting to:', redirectPath);
      if (window.location.pathname !== redirectPath.split('?')[0]) {
        window.location.replace(redirectPath);
      }
      return;
    }

    // Check for error in URL parameters (from NextAuth error redirect)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      if (errorParam) {
        const errorMessages: Record<string, string> = {
          Configuration:
            'There is a problem with the server configuration. Please contact support.',
          AccessDenied: 'You do not have permission to sign in.',
          Verification: 'The verification token has expired or has already been used.',
          OAuthCallbackError:
            'An error occurred during the authentication callback. This may be due to a configuration issue. Please try signing in again.',
          OAuthSignin: 'An error occurred while signing in. Please try again.',
          OAuthCreateAccount: 'Could not create an account. Please contact support.',
          EmailCreateAccount: 'Could not create an account with this email.',
          Callback: 'An error occurred in the authentication callback.',
          OAuthAccountNotLinked:
            'An account with this email already exists. Please sign in with your original provider.',
          EmailSignin: 'An error occurred sending the email. Please try again.',
          CredentialsSignin: 'Invalid credentials provided.',
          SessionRequired: 'Please sign in to access this page.',
          Default:
            'An error occurred during authentication. Please try again or contact support if the problem persists.',
        };
        const validErrorParam =
          errorParam && errorParam in errorMessages ? errorParam : 'Default';
        setError(errorMessages[validErrorParam]);
      }
    }
  }, [status, session]);

  const handleAzureADSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn('azure-ad', {
        callbackUrl: '/partner/dashboard',
        redirect: true,
      });
    } catch {
      setError('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="mukuru.background.dark"
      >
        <Spinner size="xl" color="mukuru.buttons.primary" />
      </Box>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect via useEffect
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: 0 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      rotate: i % 2 === 0 ? -3 : 3,
      transition: {
        duration: 0.8,
        delay: i * 0.2,
        ease: 'easeOut',
      },
    }),
    hover: {
      scale: 1.05,
      rotate: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <>
      <MotionBox
        minH="100vh"
        bg="mukuru.background.dark"
        position="relative"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="dark-mode-landing"
      >
        {/* Navigation */}
        <MotionFlex
          justify="space-between"
          align="center"
          px="8"
          py="6"
          position="absolute"
          top="0"
          left="0"
          width="50%"
          zIndex="20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Logo */}
          <HStack gap="3">
            <MukuruLogo height="48px" />
          </HStack>
        </MotionFlex>

        {/* Main Content */}
        <MotionFlex minH="100vh" align="center" position="relative">
          {/* Left Section - Dark Background */}
          <MotionBox
            flex="1"
            px="12"
            py="20"
            position="relative"
            zIndex="10"
            bg="mukuru.background.dark"
          >
            <Container maxW="xl">
              <MotionVStack
                align="start"
                gap="8"
                width="100%"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                <motion.div variants={itemVariants}>
                  <Typography
                    as="h1"
                    fontSize="6xl"
                    fontWeight="bold"
                    color="mukuru.text.inverse"
                    lineHeight="1.1"
                  >
                    Partner Portal
                  </Typography>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Typography
                    as="p"
                    fontSize="xl"
                    color="mukuru.text.inverse"
                    lineHeight="1.6"
                    maxW="l"
                    fontWeight="normal"
                    opacity={0.9}
                  >
                    Access your partner dashboard, manage your applications, track your
                    onboarding progress, and communicate with the Mukuru team.
                  </Typography>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <MotionBox
                    bg="mukuru.cards.dark"
                    boxShadow="xl"
                    borderRadius="2xl"
                    overflow="hidden"
                    p="8"
                    width="100%"
                  >
                    <VStack gap="6" align="stretch">
                      {error && (
                        <Box
                          p="3"
                          bg="mukuru.text.error.dark"
                          border="1px"
                          borderColor="red.200"
                          borderRadius="md"
                        >
                          <Typography fontSize="sm" color="mukuru.text.error">
                            {error}
                          </Typography>
                        </Box>
                      )}

                      <VStack gap="4" align="stretch">
                        <Button
                          onClick={handleAzureADSignIn}
                          width="100%"
                          disabled={isLoading}
                          variant="primary"
                          size="md"
                          bg="mukuru.buttons.primary"
                          _hover={{ bg: 'mukuru.text.accent' }}
                          className="mukuru-primary-button"
                          style={{ backgroundColor: '#F05423', color: 'white' }}
                        >
                          <Typography color="white" fontWeight="semibold">
                            {isLoading ? 'Getting started...' : 'Get Started'}
                          </Typography>
                        </Button>
                      </VStack>

                      <Typography
                        color="mukuru.text.inverse"
                        fontSize="sm"
                        textAlign="center"
                        opacity={0.8}
                      >
                        For registered partners only
                      </Typography>
                    </VStack>
                  </MotionBox>
                </motion.div>
              </MotionVStack>
            </Container>
          </MotionBox>

          {/* Right Section - Orange Background with diagonal cut */}
          <MotionBox
            flex="1"
            position="relative"
            minH="100vh"
            style={{
              background: 'linear-gradient(155deg, #F05423 0%, #F05423 100%)',
              clipPath: 'polygon(5% 0%, 100% 0%, 100% 100%, 0% 100%)',
            }}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Animated background circles */}
            <MotionBox
              position="absolute"
              top="10%"
              right="15%"
              width="140px"
              height="140px"
              borderRadius="50%"
              bg="rgba(255, 255, 255, 0.1)"
              opacity="0.6"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <MotionBox
              position="absolute"
              top="60%"
              right="5%"
              width="100px"
              height="100px"
              borderRadius="50%"
              bg="rgba(255, 255, 255, 0.08)"
              opacity="0.4"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
          </MotionBox>

          {/* Floating Cards positioned within the orange section */}
          {/* Top Card - Secure Access */}
          <MotionBox
            position="absolute"
            top="25%"
            right="20%"
            bg="mukuru.cards.dark"
            p="7"
            borderRadius="xl"
            boxShadow="xl"
            zIndex="15"
            width="320px"
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            custom={0}
            whileHover="hover"
            whileTap={{ scale: 0.95 }}
            style={{ backgroundColor: '#3E3E3E' }}
          >
            <VStack gap="4" align="start">
              <Box
                width="56px"
                height="56px"
                borderRadius="50%"
                bg="mukuru.cards.dark"
                border="3px"
                borderColor="mukuru.buttons.primary"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FiLock} boxSize="6" color="mukuru.buttons.primary" />
              </Box>
              <VStack gap="2" align="start">
                <Typography fontSize="xl" fontWeight="bold" color="mukuru.text.inverse">
                  Secure Access
                </Typography>
                <Typography fontSize="md" color="mukuru.text.inverse" opacity={0.8}>
                  Enterprise-grade authentication
                </Typography>
              </VStack>
            </VStack>
          </MotionBox>

          {/* Middle Card - Application Management */}
          <MotionBox
            position="absolute"
            top="45%"
            right="10%"
            bg="mukuru.cards.dark"
            p="7"
            borderRadius="xl"
            boxShadow="xl"
            zIndex="15"
            width="320px"
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            custom={1}
            whileHover="hover"
            whileTap={{ scale: 0.95 }}
            style={{ backgroundColor: '#3E3E3E' }}
          >
            <VStack gap="4" align="start">
              <HStack justify="space-between" width="100%">
                <Typography fontSize="xl" fontWeight="bold" color="mukuru.text.inverse">
                  Application Management
                </Typography>
                <Box
                  width="24px"
                  height="24px"
                  bg="mukuru.text.success"
                  borderRadius="sm"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiBarChart2} boxSize="4" color="mukuru.text.inverse" />
                </Box>
              </HStack>
              <Typography fontSize="md" color="mukuru.text.inverse" opacity={0.8}>
                Track your application status and progress
              </Typography>
            </VStack>
          </MotionBox>

          {/* Bottom Card - Real-time Monitoring */}
          <MotionBox
            position="absolute"
            top="65%"
            right="25%"
            bg="mukuru.cards.dark"
            p="7"
            borderRadius="xl"
            boxShadow="xl"
            zIndex="15"
            width="320px"
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            custom={2}
            whileHover="hover"
            whileTap={{ scale: 0.95 }}
            style={{ backgroundColor: '#3E3E3E' }}
          >
            <VStack gap="4" align="start">
              <Box
                width="56px"
                height="56px"
                borderRadius="50%"
                bg="mukuru.cards.dark"
                border="3px"
                borderColor="mukuru.buttons.primary"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FiZap} boxSize="6" color="mukuru.buttons.primary" />
              </Box>
              <VStack gap="2" align="start">
                <Typography fontSize="xl" fontWeight="bold" color="mukuru.text.inverse">
                  Real-time Updates
                </Typography>
                <Typography fontSize="md" color="mukuru.text.inverse" opacity={0.8}>
                  Get instant notifications on your application
                </Typography>
              </VStack>
            </VStack>
          </MotionBox>
        </MotionFlex>
      </MotionBox>

      {/* Additional Section - Partner Benefits */}
      <MotionBox
        bg="mukuru.background.dark"
        py="20"
        px="12"
        position="relative"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <Container maxW="7xl">
          <VStack gap="12" align="center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Typography
                as="h2"
                fontSize="4xl"
                fontWeight="bold"
                color="mukuru.text.inverse"
                textAlign="center"
              >
                Why Choose Mukuru Partner Portal?
              </Typography>
            </motion.div>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap="8" width="100%">
              <MotionBox
                bg="mukuru.cards.dark"
                p="8"
                borderRadius="xl"
                boxShadow="xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <VStack gap="4" align="start">
                  <Box
                    width="56px"
                    height="56px"
                    borderRadius="50%"
                    bg="mukuru.cards.dark"
                    border="3px"
                    borderColor="mukuru.buttons.primary"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiFileText} boxSize="6" color="mukuru.buttons.primary" />
                  </Box>
                  <Typography fontSize="xl" fontWeight="bold" color="mukuru.text.inverse">
                    Streamlined Onboarding
                  </Typography>
                  <Typography fontSize="md" color="mukuru.text.inverse" opacity={0.8}>
                    Complete your KYB application with ease. Our intuitive interface
                    guides you through each step of the process.
                  </Typography>
                </VStack>
              </MotionBox>

              <MotionBox
                bg="mukuru.cards.dark"
                p="8"
                borderRadius="xl"
                boxShadow="xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <VStack gap="4" align="start">
                  <Box
                    width="56px"
                    height="56px"
                    borderRadius="50%"
                    bg="mukuru.cards.dark"
                    border="3px"
                    borderColor="mukuru.buttons.primary"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiUsers} boxSize="6" color="mukuru.buttons.primary" />
                  </Box>
                  <Typography fontSize="xl" fontWeight="bold" color="mukuru.text.inverse">
                    Direct Communication
                  </Typography>
                  <Typography fontSize="md" color="mukuru.text.inverse" opacity={0.8}>
                    Communicate directly with our compliance team. Get answers to your
                    questions and receive updates in real-time.
                  </Typography>
                </VStack>
              </MotionBox>

              <MotionBox
                bg="mukuru.cards.dark"
                p="8"
                borderRadius="xl"
                boxShadow="xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <VStack gap="4" align="start">
                  <Box
                    width="56px"
                    height="56px"
                    borderRadius="50%"
                    bg="mukuru.cards.dark"
                    border="3px"
                    borderColor="mukuru.buttons.primary"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiCheckCircle} boxSize="6" color="mukuru.buttons.primary" />
                  </Box>
                  <Typography fontSize="xl" fontWeight="bold" color="mukuru.text.inverse">
                    Document Management
                  </Typography>
                  <Typography fontSize="md" color="mukuru.text.inverse" opacity={0.8}>
                    Upload, manage, and track all your required documents in one secure
                    location. Never lose track of your compliance paperwork.
                  </Typography>
                </VStack>
              </MotionBox>
            </SimpleGrid>
          </VStack>
        </Container>
      </MotionBox>

      {/* How It Works Section */}
      <MotionBox
        bg="mukuru.background.dark"
        py="20"
        px="12"
        position="relative"
        width="100%"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.6 }}
      >
        <Container maxW="7xl">
          <VStack gap="12" align="center">
            <VStack gap="4" align="center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.8 }}
              >
                <Typography
                  as="h2"
                  fontSize="4xl"
                  fontWeight="bold"
                  color="mukuru.text.inverse"
                  textAlign="center"
                >
                  How It Works
                </Typography>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2 }}
              >
                <Typography
                  fontSize="lg"
                  color="mukuru.text.inverse"
                  textAlign="center"
                  opacity={0.8}
                >
                  Get started with Mukuru Partner Portal in three simple steps
                </Typography>
              </motion.div>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap="8" width="100%">
              {[
                {
                  step: '01',
                  title: 'Sign In',
                  description:
                    'Access your partner portal and begin your onboarding journey.',
                  icon: FiFileText,
                },
                {
                  step: '02',
                  title: 'Complete Application',
                  description:
                    'Fill out your KYB application and upload required documents.',
                  icon: FiFileText,
                },
                {
                  step: '03',
                  title: 'Track Progress',
                  description:
                    'Monitor your application status and communicate with our team.',
                  icon: FiTrendingUp,
                },
              ].map((item, index) => (
                <MotionBox
                  key={item.step}
                  bg="mukuru.cards.dark"
                  p="8"
                  borderRadius="xl"
                  boxShadow="xl"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 2 + index * 0.2 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <VStack gap="4" align="start">
                    <HStack gap="4" width="100%">
                      <Box
                        width="64px"
                        height="64px"
                        borderRadius="50%"
                        bg="mukuru.buttons.primary"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Typography
                          fontSize="2xl"
                          fontWeight="bold"
                          color="mukuru.text.inverse"
                        >
                          {item.step}
                        </Typography>
                      </Box>
                      <Box
                        width="56px"
                        height="56px"
                        borderRadius="50%"
                        bg="mukuru.cards.dark"
                        border="3px"
                        borderColor="mukuru.buttons.primary"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={item.icon} boxSize="6" color="mukuru.buttons.primary" />
                      </Box>
                    </HStack>
                    <Typography
                      fontSize="xl"
                      fontWeight="bold"
                      color="mukuru.text.inverse"
                    >
                      {item.title}
                    </Typography>
                    <Typography fontSize="md" color="mukuru.text.inverse" opacity={0.8}>
                      {item.description}
                    </Typography>
                  </VStack>
                </MotionBox>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </MotionBox>

      {/* Features Grid Section */}
      <MotionBox
        bg="mukuru.background.dark"
        py="20"
        px="12"
        position="relative"
        width="100%"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.2 }}
      >
        <Container maxW="7xl">
          <VStack gap="12" align="center">
            <VStack gap="4" align="center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2.6 }}
              >
                <Typography
                  as="h2"
                  fontSize="4xl"
                  fontWeight="bold"
                  color="mukuru.text.inverse"
                  textAlign="center"
                >
                  Everything You Need
                </Typography>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2.8 }}
              >
                <Typography
                  fontSize="lg"
                  color="mukuru.text.inverse"
                  textAlign="center"
                  opacity={0.8}
                >
                  Powerful features to streamline your partner experience
                </Typography>
              </motion.div>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6" width="100%">
              {[
                {
                  icon: FiClock,
                  title: 'Fast Processing',
                  description:
                    'Get your application reviewed quickly with our streamlined process.',
                },
                {
                  icon: FiMessageCircle,
                  title: 'Real-time Messaging',
                  description:
                    'Communicate directly with our compliance team through the portal.',
                },
                {
                  icon: FiAward,
                  title: 'Compliance Ready',
                  description:
                    'Stay compliant with automated document tracking and reminders.',
                },
                {
                  icon: FiBarChart2,
                  title: 'Progress Tracking',
                  description:
                    'Monitor your application status with detailed progress indicators.',
                },
                {
                  icon: FiLock,
                  title: 'Secure Storage',
                  description:
                    'Your documents are encrypted and stored securely in the cloud.',
                },
                {
                  icon: FiZap,
                  title: 'Instant Notifications',
                  description: 'Receive real-time updates on your application status.',
                },
              ].map((feature, index) => (
                <MotionBox
                  key={feature.title}
                  bg="mukuru.cards.dark"
                  p="6"
                  borderRadius="xl"
                  boxShadow="lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 3 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -3 }}
                >
                  <HStack gap="4" align="start">
                    <Box
                      width="48px"
                      height="48px"
                      borderRadius="lg"
                      bg="mukuru.buttons.primary"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon as={feature.icon} boxSize="5" color="mukuru.text.inverse" />
                    </Box>
                    <VStack gap="2" align="start" flex="1">
                      <Typography
                        fontSize="lg"
                        fontWeight="bold"
                        color="mukuru.text.inverse"
                      >
                        {feature.title}
                      </Typography>
                      <Typography fontSize="sm" color="mukuru.text.inverse" opacity={0.8}>
                        {feature.description}
                      </Typography>
                    </VStack>
                  </HStack>
                </MotionBox>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </MotionBox>

      {/* FAQ Section */}
      <MotionBox
        bg="mukuru.background.dark"
        py="20"
        px="12"
        position="relative"
        width="100%"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 3.2 }}
      >
        <Container maxW="4xl">
          <VStack gap="8" align="center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 3.4 }}
            >
              <Typography
                as="h2"
                fontSize="4xl"
                fontWeight="bold"
                color="mukuru.text.inverse"
                textAlign="center"
              >
                Frequently Asked Questions
              </Typography>
            </motion.div>

            <VStack gap="4" width="100%" align="stretch">
              {[
                {
                  question: 'How do I get access to the Partner Portal?',
                  answer:
                    'You need to be a registered partner with Mukuru. Once registered, you can access the portal using your partner credentials.',
                },
                {
                  question: 'What documents do I need to complete my application?',
                  answer:
                    'The required documents vary based on your entity type. The portal will guide you through the specific documents needed for your application.',
                },
                {
                  question: 'How long does the application process take?',
                  answer:
                    'Processing times vary, but most applications are reviewed within 5-7 business days. You can track your progress in real-time through the portal.',
                },
                {
                  question: 'Can I save my application and continue later?',
                  answer:
                    'Yes! You can save your progress at any time and return to complete your application when convenient.',
                },
                {
                  question: 'How do I contact support?',
                  answer:
                    'You can message our compliance team directly through the portal, or use the contact information provided in your partner welcome email.',
                },
              ].map((faq, index) => (
                <MotionBox
                  key={faq.question}
                  bg="mukuru.cards.dark"
                  p="6"
                  borderRadius="xl"
                  boxShadow="lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 3.6 + index * 0.1 }}
                >
                  <VStack gap="3" align="start">
                    <HStack gap="3" width="100%">
                      <Icon
                        as={FiHelpCircle}
                        boxSize="5"
                        color="mukuru.buttons.primary"
                      />
                      <Typography
                        fontSize="lg"
                        fontWeight="semibold"
                        color="mukuru.text.inverse"
                      >
                        {faq.question}
                      </Typography>
                    </HStack>
                    <Typography
                      fontSize="md"
                      color="mukuru.text.inverse"
                      opacity={0.8}
                      pl="8"
                    >
                      {faq.answer}
                    </Typography>
                  </VStack>
                </MotionBox>
              ))}
            </VStack>
          </VStack>
        </Container>
      </MotionBox>

      {/* CTA Section */}
      <MotionBox
        bg="mukuru.primary"
        py="20"
        px="12"
        position="relative"
        width="100%"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 4.2 }}
      >
        <Container maxW="4xl">
          <VStack gap="8" align="center" textAlign="center">
            <VStack gap="4" align="center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 4.4 }}
              >
                <Typography
                  as="h2"
                  fontSize="4xl"
                  fontWeight="bold"
                  color="mukuru.text.inverse"
                  textAlign="center"
                >
                  Ready to Get Started?
                </Typography>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 4.6 }}
              >
                <Typography
                  fontSize="xl"
                  color="mukuru.text.inverse"
                  opacity={0.9}
                  textAlign="center"
                  mb="8"
                >
                  Sign in to access your partner dashboard and begin your onboarding
                  journey
                </Typography>
              </motion.div>
            </VStack>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 4.8 }}
            >
              <Button
                size="md"
                bg="mukuru.cards.dark"
                _hover={{ bg: 'mukuru.background.dark', transform: 'translateY(-2px)' }}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                px="8"
                py="6"
              >
                <HStack gap="2">
                  <Typography fontWeight="semibold" color="mukuru.text.inverse">
                    Sign In Now
                  </Typography>
                  <Icon as={FiArrowRight} color="mukuru.text.inverse" />
                </HStack>
              </Button>
            </motion.div>
          </VStack>
        </Container>
      </MotionBox>

      {/* Footer */}
      <MotionBox
        bg="mukuru.background.dark"
        py="12"
        px="12"
        borderTop="1px"
        borderColor="mukuru.grey.mediumDark"
        position="relative"
        width="100%"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 4.6 }}
      >
        <Container maxW="7xl">
          <VStack gap="6" align="center">
            <HStack gap="3">
              <MukuruLogo height="32px" />
              <Typography fontSize="lg" fontWeight="bold" color="mukuru.text.inverse">
                Partner Portal
              </Typography>
            </HStack>
            <Typography
              fontSize="sm"
              color="mukuru.text.inverse"
              opacity={0.7}
              textAlign="center"
            >
              © {new Date().getFullYear()} Mukuru. All rights reserved.
            </Typography>
            <HStack gap="6" flexWrap="wrap" justify="center">
              <Typography
                fontSize="sm"
                color="mukuru.text.inverse"
                opacity={0.7}
                _hover={{ opacity: 1, color: 'mukuru.buttons.primary' }}
                cursor="pointer"
              >
                Privacy Policy
              </Typography>
              <Typography
                fontSize="sm"
                color="mukuru.text.inverse"
                opacity={0.7}
                _hover={{ opacity: 1, color: 'mukuru.buttons.primary' }}
                cursor="pointer"
              >
                Terms of Service
              </Typography>
              <Typography
                fontSize="sm"
                color="mukuru.text.inverse"
                opacity={0.7}
                _hover={{ opacity: 1, color: 'mukuru.buttons.primary' }}
                cursor="pointer"
              >
                Support
              </Typography>
            </HStack>
          </VStack>
        </Container>
      </MotionBox>
    </>
  );
}
