"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text, 
  Image, 
  Flex,
  Button,
  Spinner,
  Icon
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiShield } from "react-icons/fi";

const MotionBox = motion(Box);

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
    
    // Check for error in URL parameters (from NextAuth error redirect)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      if (errorParam) {
        const errorMessages: Record<string, string> = {
          'Configuration': 'There is a problem with the server configuration.',
          'AccessDenied': 'You do not have permission to sign in.',
          'Verification': 'The verification token has expired or has already been used.',
          'Default': 'An error occurred during authentication.',
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
        bg="linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)"
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
              <Image
                src="/mukuru-logo.png"
                alt="Mukuru Logo"
                height="60px"
                width="auto"
              />
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
                    <Text as="h1" fontSize="3xl" fontWeight="bold" color="gray.800">
                      Admin Access
                    </Text>
                    <Text color="gray.600" mt="2">
                      Secure administrative portal with Azure AD authentication
                    </Text>
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
                      <Text fontSize="sm">{error}</Text>
                    </Box>
                  )}

                  <VStack gap="4" align="stretch">
                    <Button
                      onClick={handleAzureADSignIn}
                      variant="solid"
                      colorScheme="blue"
                      size="lg"
                      width="100%"
                      loading={isLoading}
                      loadingText="Signing in..."
                      height="56px"
                      fontSize="lg"
                      fontWeight="semibold"
                    >
                      <HStack gap="2">
                        <Icon as={FiShield} boxSize="5" />
                        <Text>Sign in with Microsoft</Text>
                      </HStack>
                    </Button>

                    <Text color="gray.500" fontSize="sm" textAlign="center" mt="2">
                      Use your Microsoft account to access the admin portal
                    </Text>
                  </VStack>

                  <VStack gap="4" mt="4">
                    <Text color="gray.500" fontSize="sm" textAlign="center">
                      Authorized personnel only
                    </Text>
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
            <VStack gap="8" align="start" maxW="400px" pr="16">
              <Text as="h2" fontSize="4xl" fontWeight="bold" lineHeight="1.2">
                Administrative Portal
              </Text>
              
              <Text as="p" fontSize="xl" opacity="0.9" lineHeight="1.6">
                Secure access to manage applications, monitor compliance, and oversee the digital onboarding process.
              </Text>

              <VStack gap="4" align="start">
                <HStack>
                  <Box
                    width="24px"
                    height="24px"
                    borderRadius="50%"
                    bg="rgba(255, 255, 255, 0.2)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="sm" fontWeight="bold">🔒</Text>
                  </Box>
                  <Text fontSize="lg">Azure AD authentication</Text>
                </HStack>
                
                <HStack>
                  <Box
                    width="24px"
                    height="24px"
                    borderRadius="50%"
                    bg="rgba(255, 255, 255, 0.2)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="sm" fontWeight="bold">📊</Text>
                  </Box>
                  <Text fontSize="lg">Application management</Text>
                </HStack>
                
                <HStack>
                  <Box
                    width="24px"
                    height="24px"
                    borderRadius="50%"
                    bg="rgba(255, 255, 255, 0.2)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="sm" fontWeight="bold">⚡</Text>
                  </Box>
                  <Text fontSize="lg">Real-time monitoring</Text>
                </HStack>
              </VStack>
            </VStack>
          </MotionBox>
        </Flex>
      </Container>
    </Box>
  );
}