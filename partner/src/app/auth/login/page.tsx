'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Spinner, VStack } from '@chakra-ui/react';
import { Button, Typography, AlertBar } from '@/lib/mukuruImports';
import { signIn, useSession } from 'next-auth/react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current origin for displaying correct callback URLs
  const currentOrigin = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXTAUTH_URL || 'http://localhost:3000');

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
    if (status === 'authenticated' && session) {
      router.replace('/partner/dashboard');
      return;
    }

    // If not authenticated and not already redirecting, start sign-in
    // Only try once - don't loop
    if (status === 'unauthenticated' && !isRedirecting && !oauthError) {
      setIsRedirecting(true);
      signIn('keycloak', {
        callbackUrl: '/partner/dashboard',
        redirect: true, // Let NextAuth handle the redirect
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
          <AlertBar status="error" title="Authentication Error">
            {error}
          </AlertBar>
          <VStack align="start" gap={2} fontSize="sm" color="gray.500">
            <Typography fontWeight="semibold">Common issues:</Typography>
            <Typography>• Missing NEXTAUTH_SECRET environment variable</Typography>
            <Typography>
              • Incorrect NEXTAUTH_URL (should be http://localhost:3000)
            </Typography>
            <VStack align="start" gap={1} ml={4}>
              <Typography>
                • Keycloak redirect URI mismatch - ensure these EXACT URIs are registered in
                Keycloak:
              </Typography>
              <Box
                bg="mukuru.state.hover"
                p={2}
                borderRadius="md"
                fontFamily="mono"
                fontSize="xs"
              >
                {currentOrigin}/api/auth/callback/keycloak
                <br />
                {currentOrigin}/auth/callback
              </Box>
              <Typography fontSize="xs" color="mukuru.grey.medium" mt={1}>
                In Keycloak: Clients → kyb-connect-portal → Settings → Valid Redirect URIs
              </Typography>
            </VStack>
            <Typography>
              • Keycloak client secret incorrect (if using confidential client)
            </Typography>
            <Typography>
              • Keycloak client Access Type mismatch (public vs confidential)
            </Typography>
            <Typography>• Redis not running</Typography>
            <Typography mt={2} fontSize="xs" color="mukuru.teal">
              💡 Check server console logs for detailed error messages
            </Typography>
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
        <Typography>
          {status === 'loading'
            ? 'Checking authentication...'
            : isRedirecting
              ? 'Redirecting to sign in...'
              : 'Please wait...'}
        </Typography>
      </VStack>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
          <VStack gap={4}>
            <Spinner size="xl" />
            <Typography>Loading...</Typography>
          </VStack>
        </Box>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
