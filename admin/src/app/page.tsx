"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Flex,
  Spinner,
  Button as ChakraButton,
  Icon
} from "@chakra-ui/react";
import { Typography, MukuruLogo, IconWrapper } from "@mukuru/mukuru-react-components";
import { motion } from "framer-motion";
import { signIn, useSession, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiShield, FiLock, FiBarChart2, FiZap } from "react-icons/fi";

// Note: motion() is deprecated but still works. The warning is informational.
// To suppress: use @ts-expect-error or wait for framer-motion update
// @ts-expect-error - motion() deprecation warning - will be fixed when framer-motion updates
const MotionBox = motion(Box);

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for callbackUrl in query params first (handles post-auth redirects)
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl');
      
    // Determine redirect path
    let redirectPath = '/dashboard';
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
        } catch (e) {
        console.error('Error parsing callbackUrl:', e);
        redirectPath = '/dashboard';
      }
    }
    
    // If we have a callbackUrl, this means we just came back from Azure AD
    // The session should be established, but might not be detected yet
    // Try multiple approaches to redirect
    if (callbackUrl) {
      console.log('CallbackUrl detected after Azure AD auth, redirecting...', { callbackUrl, redirectPath, status });
      
      // Approach 1: If session is authenticated, redirect immediately
      if (status === "authenticated" && session) {
        console.log('Session authenticated, redirecting to:', redirectPath);
        window.location.replace(redirectPath);
        return;
      }
      
      // Approach 2: Force session check and redirect if found
      getSession().then((sessionData) => {
        console.log('Session check result:', { hasSession: !!sessionData, status });
        if (sessionData) {
          console.log('Session found via getSession, redirecting to:', redirectPath);
          window.location.replace(redirectPath);
        }
      }).catch((err) => {
        console.error('Error checking session:', err);
      });
      
      // Approach 3: If status is loading, wait a bit then redirect anyway
      // (NextAuth should have authenticated by now)
      if (status === "loading") {
        console.log('Status is loading, waiting for session...');
        const timeout = setTimeout(() => {
          getSession().then((sessionData) => {
            if (sessionData) {
              console.log('Session found after wait, redirecting to:', redirectPath);
              window.location.replace(redirectPath);
      } else {
              // Even if no session, try redirecting - NextAuth might have set cookies
              console.log('No session found but callbackUrl present, attempting redirect anyway');
              window.location.replace(redirectPath);
            }
          });
        }, 500);
        return () => clearTimeout(timeout);
      }
      
      // Approach 4: If unauthenticated but we have callbackUrl, redirect anyway
      // This handles edge cases where session isn't detected but auth succeeded
      if (status === "unauthenticated") {
        console.log('Status unauthenticated but callbackUrl present, redirecting anyway');
        // Small delay to let cookies settle
        setTimeout(() => {
          window.location.replace(redirectPath);
        }, 100);
      }
      
      return;
    }
    
    // Normal flow: if authenticated, redirect to dashboard
    if (status === "authenticated" && session) {
      console.log('Authenticated, redirecting to:', redirectPath);
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
          'Configuration': 'There is a problem with the server configuration. Please contact support.',
          'AccessDenied': 'You do not have permission to sign in.',
          'Verification': 'The verification token has expired or has already been used.',
          'OAuthCallbackError': 'An error occurred during the authentication callback. This may be due to a configuration issue. Please try signing in again.',
          'OAuthSignin': 'An error occurred while signing in. Please try again.',
          'OAuthCreateAccount': 'Could not create an account. Please contact support.',
          'EmailCreateAccount': 'Could not create an account with this email.',
          'Callback': 'An error occurred in the authentication callback.',
          'OAuthAccountNotLinked': 'An account with this email already exists. Please sign in with your original provider.',
          'EmailSignin': 'An error occurred sending the email. Please try again.',
          'CredentialsSignin': 'Invalid credentials provided.',
          'SessionRequired': 'Please sign in to access this page.',
          'Default': 'An error occurred during authentication. Please try again or contact support if the problem persists.',
        };
        setError(errorMessages[errorParam] || errorMessages['Default']);
      }
    }
  }, [status, session, router]);

  const handleAzureADSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn("azure-ad", {
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
        <Spinner size="xl" color="orange.500" />
      </Box>
    );
  }

  if (status === "authenticated") {
    return null; // Will redirect via useEffect
  }

  return (
    <Box minH="100vh" bg="gray.50" position="relative">
      {/* Background Pattern */}
      <MotionBox
        position="absolute"
        top="0"
        right="0"
        width="50%"
        height="100%"
        bg="linear-gradient(135deg, #F05423 0%, #DD4A1F 100%)"
        clipPath="polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      />

      <Container maxW="7xl" minH="100vh" display="flex" alignItems="center">
        <Flex width="100%" alignItems="center" gap="12">
          {/* Left Side - Admin Login Form */}
          <MotionBox
            flex="1"
            maxW="500px"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Logo */}
            <Box mb="8">
              <MukuruLogo height="60px" />
            </Box>

            <MotionBox
              bg="white"
              boxShadow="2xl"
              borderRadius="2xl"
              overflow="hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Box p="10">
                <VStack gap="6" align="stretch">
                  <VStack gap="2" align="start">
                    <Typography as="h1" fontSize="3xl" fontWeight="bold" color="gray.800">
                      Admin Access
                    </Typography>
                    <Typography color="gray.600" mt="2">
                      Secure administrative portal with Azure AD authentication
                    </Typography>
                  </VStack>

                  {error && (
                    <Box
                      p="3"
                      bg="red.50"
                      border="1px"
                      borderColor="red.200"
                      borderRadius="md"
                      color="red.700"
                    >
                      <Typography fontSize="sm">{error}</Typography>
                    </Box>
                  )}

                  <VStack gap="4" align="stretch">
                    <ChakraButton
                      onClick={handleAzureADSignIn}
                      width="100%"
                      disabled={isLoading}
                      bg="#F05423"
                      color="white"
                      size="md"
                      fontWeight="semibold"
                      fontSize="md"
                      _hover={{ bg: "#DD4A1F" }}
                      _active={{ bg: "#CA401B" }}
                      loading={isLoading}
                      loadingText="Signing in..."
                    >
                      <HStack gap="2">
                        <Icon as={FiShield} boxSize="20px" color="white" />
                        <Typography color="white" fontWeight="semibold">
                          Sign in with Microsoft
                        </Typography>
                      </HStack>
                    </ChakraButton>

                    <Typography color="gray.500" fontSize="sm" textAlign="center" mt="2">
                      Use your Microsoft account to access the admin portal
                    </Typography>
                  </VStack>

                  <VStack gap="4" mt="4">
                    <Typography color="gray.500" fontSize="sm" textAlign="center">
                      Authorized personnel only
                    </Typography>
                  </VStack>
                </VStack>
              </Box>
            </MotionBox>
          </MotionBox>

          {/* Right Side - Admin Content */}
          <MotionBox
            flex="1"
            color="white"
            zIndex="10"
            position="relative"
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <VStack gap="8" align="start" maxW="400px" pr="8" ml="8">
              <Typography as="h2" fontSize="4xl" fontWeight="bold" lineHeight="1.2" color="white">
                Administrative Portal
              </Typography>
              
              <Typography as="p" fontSize="xl" opacity="0.9" lineHeight="1.6" color="white">
                Secure access to manage applications, monitor compliance, and oversee the digital onboarding process.
              </Typography>

              <VStack gap="4" align="start">
                <HStack gap="3">
                  <Box
                    width="32px"
                    height="32px"
                    borderRadius="50%"
                    bg="rgba(255, 255, 255, 0.2)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiLock} boxSize="18px" color="white" />
                  </Box>
                  <Typography fontSize="lg" color="white">Azure AD authentication</Typography>
                </HStack>
                
                <HStack gap="3">
                  <Box
                    width="32px"
                    height="32px"
                    borderRadius="50%"
                    bg="rgba(255, 255, 255, 0.2)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiBarChart2} boxSize="18px" color="white" />
                  </Box>
                  <Typography fontSize="lg" color="white">Application management</Typography>
                </HStack>
                
                <HStack gap="3">
                  <Box
                    width="32px"
                    height="32px"
                    borderRadius="50%"
                    bg="rgba(255, 255, 255, 0.2)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiZap} boxSize="18px" color="white" />
                  </Box>
                  <Typography fontSize="lg" color="white">Real-time monitoring</Typography>
                </HStack>
              </VStack>
            </VStack>
          </MotionBox>
        </Flex>
      </Container>
    </Box>
  );
}