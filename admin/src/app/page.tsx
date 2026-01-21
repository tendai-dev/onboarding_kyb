/* eslint-disable security/detect-object-injection */
'use client';

import { Box, Container, VStack, HStack, Flex, Spinner, Icon } from '@chakra-ui/react';
import { Typography, MukuruLogo, Button } from '@mukuru/mukuru-react-components';
import { motion } from 'framer-motion';
import { signIn, useSession, getSession } from 'next-auth/react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { FiShield, FiLock, FiBarChart2, FiZap, FiCheckCircle } from 'react-icons/fi';

// Use motion.create() instead of deprecated motion()
const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);
const MotionVStack = motion.create(VStack);

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  // Removed unused router
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  // Track if we've handled a logout to prevent callbackUrl processing after logout
  const hasHandledLogout = useRef(false);

  // Log session status changes for debugging
  useEffect(() => {
    console.log('[AdminLoginPage] Session status changed:', {
      status,
      hasSession: !!session,
      sessionEmail: session?.user?.email,
      timestamp: new Date().toISOString(),
    });
  }, [status, session]);

  // Add timeout for session loading to prevent infinite spinner
  useEffect(() => {
    console.log('[AdminLoginPage] Session loading state:', { status, sessionTimeout });
    if (status === 'loading') {
      console.log('[AdminLoginPage] Starting 3-second timeout for session loading...');
      const timeout = setTimeout(() => {
        console.warn('[AdminLoginPage] Session loading timeout - showing login page anyway');
        setSessionTimeout(true);
      }, 3000); // 3 second timeout
      return () => {
        console.log('[AdminLoginPage] Clearing session timeout');
        clearTimeout(timeout);
      };
    } else {
      console.log('[AdminLoginPage] Session status resolved:', status);
      setSessionTimeout(false);
    }
  }, [status, sessionTimeout]);

  // Prevent bfcache (back/forward cache) to avoid showing cached pages after logout
  useEffect(() => {
    // Handle pageshow event to detect bfcache restoration
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache - force reload to get fresh state
        console.warn('[AdminLoginPage] Page restored from bfcache, forcing reload');
        window.location.reload();
      }
    };

    // Prevent bfcache by adding unload handler
    const handleBeforeUnload = () => {
      // This helps prevent bfcache
      window.scrollTo(0, 0);
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Add cache-control meta tag to prevent caching
    const metaCacheControl = document.createElement('meta');
    metaCacheControl.httpEquiv = 'Cache-Control';
    metaCacheControl.content = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
    document.head.appendChild(metaCacheControl);

    const metaPragma = document.createElement('meta');
    metaPragma.httpEquiv = 'Pragma';
    metaPragma.content = 'no-cache';
    document.head.appendChild(metaPragma);

    const metaExpires = document.createElement('meta');
    metaExpires.httpEquiv = 'Expires';
    metaExpires.content = '0';
    document.head.appendChild(metaExpires);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      metaCacheControl.remove();
      metaPragma.remove();
      metaExpires.remove();
    };
  }, []);

  // Force dark mode for this page only
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-color-mode', 'dark');
    document.documentElement.style.colorScheme = 'dark';
    document.body.style.backgroundColor = '#222222';
    document.body.style.color = '#ffffff';

    // Force all elements to use dark mode
    const style = document.createElement('style');
    style.id = 'admin-dark-mode';
    style.textContent = `
      body { background-color: #222222 !important; color: #ffffff !important; }
      * { color-scheme: dark !important; }
    `;
    document.head.appendChild(style);

    return () => {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-color-mode');
      document.documentElement.style.colorScheme = '';
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      const styleEl = document.getElementById('admin-dark-mode');
      if (styleEl) styleEl.remove();
    };
  }, []);

  // IMMEDIATE FIX: Remove callbackUrl on page load if it points to localhost or user is unauthenticated
  // This runs immediately, before session checks, to prevent any redirect loops
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const callbackUrl = urlParams.get('callbackUrl');
    const isLogout = urlParams.get('_logout');
    const isSessionExpired = urlParams.get('session_expired');
    
    // Remove callbackUrl immediately if:
    // 1. It points to localhost (invalid in production)
    // 2. User is unauthenticated (and not in logout flow)
    // 3. We're in a logout/session_expired flow
    if (callbackUrl && (isLogout || isSessionExpired || callbackUrl.includes('localhost') || callbackUrl.includes('127.0.0.1'))) {
      console.warn('[AdminLoginPage] Removing callbackUrl immediately on page load', {
        callbackUrl,
        isLogout: !!isLogout,
        isSessionExpired: !!isSessionExpired,
        isLocalhost: callbackUrl.includes('localhost') || callbackUrl.includes('127.0.0.1'),
      });
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('callbackUrl');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []); // Run only once on mount

  useEffect(() => {
    console.log('[AdminLoginPage] useEffect triggered', {
      status,
      hasSession: !!session,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    // Check for logout or session expired parameters - CRITICAL: do not redirect if these are present
    const urlParams = new URLSearchParams(window.location.search);
    const isLogout = urlParams.get('_logout');
    const isSessionExpired = urlParams.get('session_expired');
    const callbackUrl = urlParams.get('callbackUrl');
    
    // AGGRESSIVE FIX: Remove callbackUrl immediately if:
    // 1. User is unauthenticated (not just loading)
    // 2. callbackUrl points to localhost (invalid in production)
    // 3. We're not in a logout/session_expired flow (those are handled separately)
    if (callbackUrl && !isLogout && !isSessionExpired) {
      // Check if callbackUrl points to localhost (should never be used in production)
      const isLocalhostCallback = callbackUrl.includes('localhost') || callbackUrl.includes('127.0.0.1');
      
      // Remove if unauthenticated OR if it's a localhost callbackUrl
      if (status === 'unauthenticated' || isLocalhostCallback) {
        console.warn('[AdminLoginPage] Removing callbackUrl', {
          callbackUrl,
          status,
          reason: status === 'unauthenticated' ? 'user_unauthenticated' : 'localhost_callback',
        });
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('callbackUrl');
        window.history.replaceState({}, '', newUrl.toString());
        // Don't process anything else if we're unauthenticated with a callbackUrl
        if (status === 'unauthenticated' || isLocalhostCallback) {
          return;
        }
      }
    }
    
    // If we're on the login page due to logout or session expiry, prevent any redirects
    // and ensure we stay on the login page regardless of session status
    if (isLogout || isSessionExpired) {
      console.info('[AdminLoginPage] Logout/session expired detected - preventing redirects', {
        isLogout: !!isLogout,
        isSessionExpired: !!isSessionExpired,
      });
      
      // Mark that we've handled logout - this prevents callbackUrl processing even after URL cleanup
      hasHandledLogout.current = true;
      
      // Clear any cached session data aggressively
      if (typeof window !== 'undefined') {
        // Force clear NextAuth session
        if ('caches' in window) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((name) => caches.delete(name));
          });
        }
        
        // Remove ALL parameters from URL to prevent loops, including callbackUrl
        // This is critical because callbackUrl can cause redirect loops after logout
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('_logout');
        newUrl.searchParams.delete('session_expired');
        newUrl.searchParams.delete('nocache');
        newUrl.searchParams.delete('callbackUrl'); // CRITICAL: Remove callbackUrl to prevent redirect loops
        newUrl.searchParams.delete('t'); // Remove timestamp if present
        window.history.replaceState({}, '', newUrl.toString());
      }
      
      // CRITICAL: Do NOT redirect even if session appears authenticated
      // This prevents the death spiral where cached session data causes redirect loops
      return;
    }

    // Check for callbackUrl in query params first (handles post-auth redirects)
    // BUT: Only process callbackUrl if we're NOT coming from a logout
    // Use the ref to check if we've already handled a logout (even if param is now removed)
    if (hasHandledLogout.current) {
      console.info('[AdminLoginPage] Logout was previously handled - ignoring callbackUrl to prevent loops');
      // Also remove callbackUrl from URL if it exists
      if (callbackUrl) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('callbackUrl');
        window.history.replaceState({}, '', newUrl.toString());
      }
      return;
    }
    
    // CRITICAL FIX: If callbackUrl exists but user is unauthenticated, remove it immediately
    // This prevents loops where callbackUrl points to protected routes after logout
    // (Note: We already checked this earlier, but double-check here for safety)
    if (callbackUrl && status === 'unauthenticated') {
      console.warn('[AdminLoginPage] callbackUrl present but user is unauthenticated - removing to prevent loops', {
        callbackUrl,
        status,
      });
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('callbackUrl');
      window.history.replaceState({}, '', newUrl.toString());
      // Don't process callbackUrl if user is not authenticated
      return;
    }
    
    console.log('[AdminLoginPage] URL params:', {
      callbackUrl,
      error: urlParams.get('error'),
      allParams: Object.fromEntries(urlParams),
      status,
    });

    // Determine redirect path
    let redirectPath = '/dashboard';
    if (callbackUrl) {
      try {
        const decodedUrl = decodeURIComponent(callbackUrl);
        
        // CRITICAL: Reject localhost callbackUrls - they should never be used in production
        // This prevents issues where localhost URLs get into production URLs
        if (decodedUrl.includes('localhost') || decodedUrl.includes('127.0.0.1')) {
          console.warn('[AdminLoginPage] Rejecting localhost callbackUrl - removing from URL', {
            callbackUrl: decodedUrl,
          });
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('callbackUrl');
          window.history.replaceState({}, '', newUrl.toString());
          return;
        }
        
        // If it's a full URL, extract the path
        if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
          const url = new URL(decodedUrl);
          redirectPath = url.pathname + url.search;
        } else if (decodedUrl.startsWith('/')) {
          redirectPath = decodedUrl;
        } else {
          redirectPath = decodedUrl;
        }
        
        // Additional safety: if callbackUrl points to a protected route and we're not authenticated, ignore it
        const protectedRoutes = ['/dashboard', '/applications', '/work-queue', '/risk-review', '/approvals'];
        const isProtectedRoute = protectedRoutes.some(route => redirectPath.startsWith(route));
        if (isProtectedRoute && status === 'unauthenticated') {
          console.warn('[AdminLoginPage] callbackUrl points to protected route but user is unauthenticated - ignoring', {
            redirectPath,
            status,
          });
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('callbackUrl');
          window.history.replaceState({}, '', newUrl.toString());
          return;
        }
      } catch (error) {
        console.error('Error parsing callbackUrl:', error);
        redirectPath = '/dashboard';
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

      // Reset the logout flag since we're processing a legitimate callbackUrl (post-auth)
      hasHandledLogout.current = false;

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
      // BUT: Only do this if we haven't handled a logout (prevents loops)
      if (status === 'unauthenticated' && !hasHandledLogout.current) {
        console.info(
          'Status unauthenticated but callbackUrl present, redirecting anyway (post-auth scenario)'
        );
        // Small delay to let cookies settle
        setTimeout(() => {
          // Double-check we still haven't handled logout before redirecting
          if (!hasHandledLogout.current) {
            window.location.replace(redirectPath);
          }
        }, 100);
      } else if (status === 'unauthenticated' && hasHandledLogout.current) {
        console.warn(
          'Status unauthenticated with callbackUrl but logout was handled - NOT redirecting to prevent loop'
        );
        // Remove callbackUrl to prevent future issues
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('callbackUrl');
        window.history.replaceState({}, '', newUrl.toString());
      }

      return;
    }

    // Normal flow: if authenticated, redirect to dashboard
    // BUT only if we're not coming from a logout/session expired scenario
    // Double-check that we don't have logout params (they might have been removed from URL but still processing)
    if (status === 'authenticated' && session) {
      // Final safety check: if URL still has callbackUrl pointing to dashboard but we just logged out,
      // don't redirect. This handles the edge case where logout params were removed but callbackUrl remains
      const currentParams = new URLSearchParams(window.location.search);
      const hasLogoutParam = currentParams.get('_logout') || currentParams.get('session_expired');
      
      // Also check the ref - if we've handled logout, don't redirect even if authenticated
      if (!hasLogoutParam && !hasHandledLogout.current) {
        console.info('Authenticated, redirecting to:', redirectPath);
        if (window.location.pathname !== redirectPath.split('?')[0]) {
          window.location.replace(redirectPath);
        }
      } else {
        console.info('Authenticated but logout detected - preventing redirect to avoid loop', {
          hasLogoutParam: !!hasLogoutParam,
          hasHandledLogout: hasHandledLogout.current,
        });
        // Remove callbackUrl if it exists to prevent future loops
        if (currentParams.get('callbackUrl')) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('callbackUrl');
          window.history.replaceState({}, '', newUrl.toString());
        }
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
        callbackUrl: '/dashboard',
        redirect: true,
      });
    } catch {
      setError('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  // Show login page if session timeout or if loading takes too long
  // This prevents infinite spinner when NextAuth session check hangs
  if (status === 'loading' && !sessionTimeout) {
    console.log('[AdminLoginPage] Rendering loading spinner (status: loading, timeout: false)');
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

  // If session loading timed out, show login page anyway
  // This handles cases where NextAuth session endpoint is slow or unresponsive
  if (sessionTimeout && status === 'loading') {
    console.warn('[AdminLoginPage] Session timeout reached - showing login page despite loading status');
    // Continue to render login page below
  }

  console.log('[AdminLoginPage] Rendering login page', {
    status,
    sessionTimeout,
    hasSession: !!session,
    hasError: !!error,
  });

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
    <MotionBox
      minH="100vh"
      bg="#222222"
      position="relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ backgroundColor: '#222222' }}
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
          bg="#222222"
          style={{ backgroundColor: '#222222' }}
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
                  Administrative Portal
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
                >
                  Secure access to manage applications, monitor compliance, and oversee
                  the digital onboarding process.
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <MotionBox
                  bg="#3E3E3E"
                  boxShadow="xl"
                  borderRadius="2xl"
                  overflow="hidden"
                  p="8"
                  width="100%"
                  style={{ backgroundColor: '#3E3E3E' }}
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
                      >
                        <HStack gap="2">
                          <Icon as={FiShield} boxSize="20px" color="white" />
                          <Typography color="mukuru.text.inverse" fontWeight="semibold">
                            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
                          </Typography>
                        </HStack>
                      </Button>

                      <Typography
                        color="mukuru.text.inverse"
                        fontSize="sm"
                        textAlign="center"
                        mt="2"
                        opacity={0.8}
                      >
                        Use your Microsoft account to access the admin portal
                      </Typography>
                    </VStack>

                    <Typography
                      color="mukuru.text.inverse"
                      fontSize="sm"
                      textAlign="center"
                      opacity={0.8}
                    >
                      Authorized personnel only
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
                Azure AD authentication
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
              Monitor and manage partner applications
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
                Real-time Monitoring
              </Typography>
              <Typography fontSize="md" color="mukuru.text.inverse" opacity={0.8}>
                Track compliance and performance
              </Typography>
            </VStack>
          </VStack>
        </MotionBox>
      </MotionFlex>
    </MotionBox>
  );
}
