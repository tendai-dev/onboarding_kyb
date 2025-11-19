"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Spinner, Text, VStack, Alert, AlertTitle, AlertDescription, Button, Icon } from "@chakra-ui/react";
import { FiAlertCircle } from "react-icons/fi";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for OAuth errors in URL
  const oauthError = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    // If there's an OAuth error, show it
    if (oauthError) {
      setError(
        errorDescription 
          ? decodeURIComponent(errorDescription)
          : `Authentication error: ${oauthError}. Please check your Keycloak configuration.`
      );
      return;
    }

    // If already authenticated, redirect to dashboard
    if (status === "authenticated" && session) {
      router.replace("/partner/dashboard");
      return;
    }

    // If not authenticated and not already redirecting, start sign-in
    // Only try once - don't loop
    if (status === "unauthenticated" && !isRedirecting && !oauthError) {
      setIsRedirecting(true);
      signIn("keycloak", { 
        callbackUrl: "/partner/dashboard",
        redirect: true // Let NextAuth handle the redirect
      }).catch((error) => {
        console.error('Failed to start sign-in:', error);
        setError('Failed to start authentication. Please check your configuration.');
        setIsRedirecting(false);
      });
    }
  }, [status, session, router, isRedirecting, oauthError, errorDescription]);

  // Show error if present
  if (error) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
        <VStack gap={4} maxW="md" w="100%">
          <Alert.Root status="error" borderRadius="lg">
            <Alert.Indicator>
              <Icon as={FiAlertCircle} />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>Authentication Error</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
          <VStack align="start" gap={2} fontSize="sm" color="gray.500">
            <Text fontWeight="semibold">Common issues:</Text>
            <Text>• Missing NEXTAUTH_SECRET environment variable</Text>
            <Text>• Incorrect NEXTAUTH_URL (should be http://localhost:3000)</Text>
            <VStack align="start" gap={1} ml={4}>
              <Text>• Keycloak redirect URI mismatch - ensure this EXACT URI is registered in Keycloak:</Text>
              <Box bg="gray.100" p={2} borderRadius="md" fontFamily="mono" fontSize="xs">
                http://localhost:3000/api/auth/callback/keycloak
              </Box>
              <Text fontSize="xs" color="gray.400" mt={1}>
                In Keycloak: Clients → kyb-connect-portal → Settings → Valid Redirect URIs
              </Text>
            </VStack>
            <Text>• Keycloak client secret incorrect (if using confidential client)</Text>
            <Text>• Keycloak client Access Type mismatch (public vs confidential)</Text>
            <Text>• Redis not running</Text>
            <Text mt={2} fontSize="xs" color="blue.400">
              💡 Check server console logs for detailed error messages
            </Text>
          </VStack>
          <Button 
            onClick={() => {
              setError(null);
              setIsRedirecting(false);
              router.push('/auth/login');
            }}
          >
            Try Again
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack gap={4}>
        <Spinner size="xl" />
        <Text>
          {status === "loading" 
            ? "Checking authentication..." 
            : isRedirecting 
            ? "Redirecting to sign in..." 
            : "Please wait..."}
        </Text>
      </VStack>
    </Box>
  );
}

