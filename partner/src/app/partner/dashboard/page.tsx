"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  SimpleGrid,
  Flex,
  Badge,
  Image,
  Circle,
  Icon,
  Alert,
  AlertTitle,
  AlertDescription,
  Spinner
} from "@chakra-ui/react";
import { Button, MukuruLogo } from "@/lib/mukuruImports";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthUser, getInitials, logout } from "@/lib/auth/session";
import { findUserCaseByEmail, getCaseById, getHandlerProfile } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiEdit3, 
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiMapPin,
  FiArrowRight,
  FiPlus,
  FiBarChart,
  FiTarget,
  FiZap,
  FiUser,
  FiMail,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiClipboard,
  FiAward
} from "react-icons/fi";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);
const MotionVStack = motion.create(VStack);
const MotionHStack = motion.create(HStack);
const MotionText = motion.create(Text);
const MotionCircle = motion.create(Circle);

// Application Journey Progress Component
interface JourneyStage {
  id: string;
  label: string;
  icon: any;
  status: string[];
}

const journeyStages: JourneyStage[] = [
  {
    id: 'submitted',
    label: 'Submitted',
    icon: FiSend,
    status: ['SUBMITTED', 'NEW']
  },
  {
    id: 'assigned',
    label: 'Assigned',
    icon: FiUser,
    status: ['ASSIGNED']
  },
  {
    id: 'in_review',
    label: 'In Review',
    icon: FiClipboard,
    status: ['IN PROGRESS', 'INPROGRESS', 'IN_REVIEW']
  },
  {
    id: 'risk_assessment',
    label: 'Risk Assessment',
    icon: FiShield,
    status: ['RISK REVIEW', 'PENDING APPROVAL', 'PENDINGAPPROVAL']
  },
  {
    id: 'approved',
    label: 'Approved',
    icon: FiCheckCircle,
    status: ['APPROVED']
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: FiAward,
    status: ['COMPLETED', 'COMPLETE']
  }
];

function ApplicationJourneyProgress({ status }: { status: string }) {
  const normalizedStatus = (status || '').toUpperCase().trim();
  
  // Find current stage index
  const currentStageIndex = journeyStages.findIndex(stage =>
    stage.status.some(s => normalizedStatus.includes(s))
  );
  
  // Default to first stage if not found
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  // Calculate circle center position (half of circle size)
  const circleCenterY = { base: 18, md: 20 }; // Half of 36px/40px
  
  // Calculate progress line width - from first circle center to current stage center
  const totalStages = journeyStages.length;
  const progressPercentage = activeIndex === 0 
    ? 0 
    : (activeIndex / (totalStages - 1)) * 100;
  
  // Calculate width from first circle center to current stage center
  // Available space is 100% minus the radius of first and last circles
  const progressWidthValue = activeIndex === 0 
    ? '0px'
    : `calc((100% - ${circleCenterY.md * 2}px) * ${progressPercentage} / 100)`;
  
  return (
    <Box position="relative" width="100%" py="2">
      {/* Stages Container */}
      <Box position="relative" zIndex={2}>
        <HStack 
          justify="space-between" 
          align="flex-start"
          gap={0}
          width="100%"
          px="0"
          position="relative"
        >
          {/* Continuous Progress Line Background - spans entire width from first to last circle center */}
          <Box
            position="absolute"
            height="3px"
            bg="gray.200"
            borderRadius="full"
            zIndex={0}
            top={{ base: `${circleCenterY.base}px`, md: `${circleCenterY.md}px` }}
            left={{ base: `${circleCenterY.base}px`, md: `${circleCenterY.md}px` }}
            right={{ base: `${circleCenterY.base}px`, md: `${circleCenterY.md}px` }}
            transform="translateY(-50%)"
          />
          
          {/* Continuous Progress Line Fill - spans from first circle center to current stage */}
          <Box
            position="absolute"
            height="3px"
            width={progressWidthValue}
            bg="linear-gradient(90deg, #FF6B35 0%, #F7931E 100%)"
            borderRadius="full"
            transition="width 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
            zIndex={1}
            boxShadow="0 2px 4px rgba(255, 107, 53, 0.3)"
            top={{ base: `${circleCenterY.base}px`, md: `${circleCenterY.md}px` }}
            left={{ base: `${circleCenterY.base}px`, md: `${circleCenterY.md}px` }}
            transform="translateY(-50%)"
          />
          
          {journeyStages.map((stage, index) => {
            const isCompleted = index < activeIndex;
            const isCurrent = index === activeIndex;
            const IconComponent = stage.icon;
            
            return (
              <VStack 
                key={stage.id} 
                gap="1.5" 
                flex="1" 
                align="center"
                maxW={{ base: "60px", md: "100px" }}
                position="relative"
                width="100%"
              >
                {/* Stage Icon Circle */}
                <Box 
                  position="relative"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="100%"
                  zIndex={3}
                >
                  <Circle
                    size={{ base: "36px", md: "40px" }}
                    bg={isCompleted || isCurrent ? "orange.500" : "gray.200"}
                    color={isCompleted || isCurrent ? "white" : "gray.400"}
                    border={isCurrent ? "3px solid" : "2px solid"}
                    borderColor={isCurrent ? "orange.600" : isCompleted ? "orange.400" : "gray.300"}
                    boxShadow={isCurrent 
                      ? "0 0 0 3px rgba(255, 107, 53, 0.15), 0 2px 8px rgba(255, 107, 53, 0.3)" 
                      : isCompleted 
                        ? "0 2px 6px rgba(255, 107, 53, 0.2)" 
                        : "none"
                    }
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                    position="relative"
                    zIndex={3}
                    _hover={{
                      transform: isCurrent ? "scale(1.1)" : "scale(1.05)",
                      transition: "transform 0.2s ease"
                    }}
                  >
                    <Icon 
                      as={IconComponent} 
                      boxSize={{ base: "4", md: "5" }}
                    />
                  </Circle>
                  
                  {/* Current Stage Indicator */}
                  {isCurrent && (
                    <Box
                      position="absolute"
                      top="-3px"
                      right="-3px"
                      width="14px"
                      height="14px"
                      bg="orange.500"
                      borderRadius="full"
                      border="2px solid white"
                      boxShadow="0 2px 6px rgba(255, 107, 53, 0.4)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      zIndex={3}
                    >
                      <motion.div
                        style={{
                          width: "6px",
                          height: "6px",
                          backgroundColor: "white",
                          borderRadius: "50%"
                        }}
                        animate={{
                          opacity: [1, 0.5, 1],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </Box>
                  )}
                  
                  {/* Completed Checkmark */}
                  {isCompleted && (
                    <Box
                      position="absolute"
                      top="-2px"
                      right="-2px"
                      width="14px"
                      height="14px"
                      bg="green.500"
                      borderRadius="full"
                      border="2px solid white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      zIndex={3}
                    >
                      <Icon as={FiCheckCircle} boxSize="2.5" color="white" />
                    </Box>
                  )}
                </Box>

                {/* Stage Label */}
                <VStack gap="0.5" align="center" width="100%">
                  <Text
                    fontSize="10px"
                    fontWeight={isCurrent ? "bold" : isCompleted ? "semibold" : "medium"}
                    color={isCurrent ? "gray.900" : isCompleted ? "gray.700" : "gray.500"}
                    textAlign="center"
                    lineHeight="1.1"
                    px="0.5"
                  >
                    {stage.label}
                  </Text>
                  
                  {/* Current Badge */}
                  {isCurrent && (
                    <Badge
                      bg="orange.500"
                      color="white"
                      fontSize="9px"
                      px="1.5"
                      py="0"
                      borderRadius="full"
                      fontWeight="semibold"
                      boxShadow="0 2px 4px rgba(255, 107, 53, 0.3)"
                    >
                      Current
                    </Badge>
                  )}
                  
                  {/* Completed Badge */}
                  {isCompleted && (
                    <Badge
                      bg="green.50"
                      color="green.700"
                      fontSize="9px"
                      px="1.5"
                      py="0"
                      borderRadius="full"
                      fontWeight="medium"
                    >
                      Done
                    </Badge>
                  )}
                </VStack>
              </VStack>
            );
          })}
        </HStack>
      </Box>
    </Box>
  );
}

function PartnerDashboardContent() {
  // Protect this route - redirects to login if not authenticated
  useRequireAuth();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const submitted = searchParams?.get('submitted') === 'true';
  const caseIdFromUrl = searchParams?.get('caseId');
  
  const [currentUser, setCurrentUser] = useState<{ name: string; email?: string; companyName?: string }>({ name: "User" });
  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [handler, setHandler] = useState<{ id: string; fullName: string; email?: string; firstName?: string; lastName?: string; profileImageUrl?: string } | null>(null);
  const [loadingHandler, setLoadingHandler] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (authUser) {
      setCurrentUser({ name: authUser.name || "", email: authUser.email || "" });
    } else if (!authLoading) {
      // Fallback to direct session check if auth context not loaded yet
      const user = getAuthUser();
      setCurrentUser({ name: user.name, email: user.email });
    }
  }, [authUser, authLoading]);

  // Load application data function - fetches REAL data from API
  const loadApplicationData = useCallback(async (forceRefresh = false) => {
    if (!currentUser.email) {
      setLoading(false);
      return false;
    }
    
    try {
      console.log('🔄 Loading application data from API...', {
        email: currentUser.email,
        caseIdFromUrl,
        forceRefresh
      });
      
      setLoading(true);
      
      // If caseId is provided in URL (from submission), try to fetch it directly first
      let found: any = null;
      if (caseIdFromUrl) {
        console.log('📋 Fetching case by ID:', caseIdFromUrl);
        found = await getCaseById(caseIdFromUrl);
      }
      
      // If not found by ID or no ID provided, search by email
      if (!found) {
        console.log('📧 Fetching case by email:', currentUser.email);
        found = await findUserCaseByEmail(currentUser.email);
      }
      
      if (!found) {
        console.log('⚠️ No application found in API');
        setApplication(null);
        setLoading(false);
        return false;
      }
      
      if (found) {
        // Log what we received from API to debug
        console.log('📊 Dashboard - API Response:', {
          caseId: found.caseId,
          status: found.status,
          progressPercentage: found.progressPercentage,
          type: found.type,
          createdAt: found.createdAt,
          updatedAt: found.updatedAt,
          hasMetadata: !!(found as any).metadataJson
        });
        
        const statusRaw = (found.status || '').toString();
        const statusColor = statusRaw.toLowerCase() === 'approved' ? 'green' :
          statusRaw.toLowerCase().includes('review') ? 'blue' :
          statusRaw.toLowerCase() === 'rejected' ? 'red' : 'orange';

        // Parse metadata to get dynamic fields
        let metadata = {};
        try {
          if ((found as any).metadataJson) {
            metadata = typeof (found as any).metadataJson === 'string' 
              ? JSON.parse((found as any).metadataJson) 
              : (found as any).metadataJson;
          }
        } catch (e) {
          console.warn('Failed to parse metadata:', e);
        }
        
        // Get country from metadata first, then standard fields, then empty
        const countryFromMetadata = (metadata as any)?.country || 
                                    (metadata as any)?.applicant_country || 
                                    (metadata as any)?.business_country ||
                                    (metadata as any)?.country_of_registration;
        
        const country = countryFromMetadata || found.country || found.applicantCountry || '';
        
        // Use REAL progress from API - no fallbacks, no defaults
        const realProgress = found.progressPercentage ?? 0;
        const realStatus = statusRaw.replace('_', ' ').toUpperCase();
        
        console.log('✅ Dashboard - Setting application data:', {
          status: realStatus,
          progress: realProgress,
          country: country || 'NOT PROVIDED',
          type: found.type
        });
        
        setApplication({
          id: found.caseId,
          name: `${found.applicantFirstName ?? ''} ${found.applicantLastName ?? ''}`.trim() || 'Application',
          type: found.type,
          status: realStatus, // REAL status from database
          country: country || '—', // Only show if actually provided
          created: found.createdAt ? new Date(found.createdAt).toLocaleDateString() : '—',
          lastUpdated: found.updatedAt ? new Date(found.updatedAt).toLocaleDateString() : '—',
          completionPercentage: Math.round(realProgress), // REAL progress from database
          riskLevel: (found.riskLevel ?? 'low').toString(),
          statusColor,
          assignedTo: found.assignedTo,
          assignedToName: found.assignedToName,
          metadata: metadata // Store all dynamic fields
        });

        // Load handler profile if assigned
        if (found.assignedTo) {
          setLoadingHandler(true);
          try {
            const handlerProfile = await getHandlerProfile(found.assignedTo);
            if (handlerProfile) {
              setHandler(handlerProfile);
            } else if (found.assignedToName) {
              // Fallback to just the name if profile fetch fails
              setHandler({
                id: found.assignedTo,
                fullName: found.assignedToName,
                email: undefined,
                firstName: undefined,
                lastName: undefined
              });
            }
          } catch (error: any) {
            // Silently handle errors - use assignedToName if available
            if (found.assignedToName) {
              setHandler({
                id: found.assignedTo,
                fullName: found.assignedToName,
                email: undefined,
                firstName: undefined,
                lastName: undefined
              });
            }
          } finally {
            setLoadingHandler(false);
          }
        } else {
          setHandler(null);
        }
        
        setLoading(false);
        return true; // Successfully loaded
      } else {
        setApplication(null);
        setHandler(null);
        setLoading(false);
        return false; // No application found
      }
    } catch (error: any) {
      // Handle service unavailable errors - backend services may not be running
      if (error?.isServiceUnavailable) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Backend service unavailable (503). The projections API may not be running.');
          console.warn('💡 To fix: Ensure the projections API service is running on http://localhost:8007');
        }
      } else {
        console.error('Failed to load application:', error);
      }
      setApplication(null);
      setLoading(false);
      return false; // Error loading
    }
  }, [currentUser.email, caseIdFromUrl]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setRetryCount(0);
    await loadApplicationData(true);
  }, [loadApplicationData]);

  // Initial load and retry logic for newly submitted applications
  useEffect(() => {
    let cancelled = false;
    let retryTimeout: NodeJS.Timeout | null = null;
    let syncTriggered = false;
    
    async function load() {
      if (!currentUser.email) {
        setLoading(false);
        return;
      }
      
      // If case was just submitted and we haven't triggered sync yet, do it now
      if (submitted && !syncTriggered && caseIdFromUrl) {
        syncTriggered = true;
        try {
          // Trigger projections sync to ensure case is available
          const syncResponse = await fetch('/api/proxy/api/v1/sync?forceFullSync=false', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(currentUser.email ? {
                'X-User-Email': currentUser.email,
                'X-User-Name': currentUser.name || currentUser.email,
                'X-User-Role': 'Applicant'
              } : {})
            }
          });
          if (syncResponse.ok) {
            console.log('Projections sync triggered from dashboard');
            // Wait a bit for sync to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (syncError) {
          console.warn('Failed to trigger projections sync:', syncError);
          // Continue anyway - will retry below
        }
      }
      
      setLoading(true);
      const loaded = await loadApplicationData();
      
      if (cancelled) return;
      
      // If application was just submitted but not found, retry a few times
      // (projections service might need time to index the new case)
      if (submitted && !loaded && retryCount < 8) {
        const delay = Math.min(1500 * (retryCount + 1), 6000); // Exponential backoff, max 6s
        retryTimeout = setTimeout(() => {
          if (!cancelled) {
            setRetryCount(prev => prev + 1);
            load(); // Retry
          }
        }, delay);
      } else if (submitted && loaded) {
        // Show success message when application is found
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
        setRetryCount(0); // Reset retry count on success
      } else if (submitted && !loaded && retryCount >= 8) {
        // Max retries reached - show warning but don't block
        console.warn('Application not found after max retries. It may take longer to appear.');
      }
    }
    
    load();
    
    return () => { 
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [currentUser.email, submitted, retryCount, loadApplicationData, caseIdFromUrl]);

  // Show success message when redirected after submission
  useEffect(() => {
    if (submitted) {
      setShowSuccessMessage(true);
      // Clear the URL params after showing message
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/partner/dashboard');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  // Periodic refresh of application data (every 30 seconds)
  useEffect(() => {
    if (!currentUser.email) return;
    
    const refreshInterval = setInterval(() => {
      // Only refresh if we're not currently loading and not retrying
      if (!loading && retryCount === 0) {
        loadApplicationData(false).catch(err => {
          // Silently handle errors - don't spam console
          if (!err?.isServiceUnavailable) {
            console.debug('Periodic refresh failed:', err);
          }
        });
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [currentUser.email, loading, retryCount, loadApplicationData]);

  const partnerData = {
    name: currentUser.name,
    companyName: currentUser.companyName,
    application
  };

  const cardBg = "white";
  const borderColor = "gray.200";

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <MotionBox 
        bg="white" 
        borderBottom="1px" 
        borderColor={borderColor} 
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
              <MukuruLogo height="32px" />
              
            </MotionHStack>
            <MotionHStack 
              gap="4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/partner/profile">
                <Button variant="ghost" size="sm">Profile</Button>
              </Link>
              <Link href="/partner/messages">
                <Button variant="ghost" size="sm">Messages</Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => logout('http://localhost:3000/')}>Logout</Button>
              <Link href="/partner/application/enhanced">
                <MotionBox
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="sm"
                    className="mukuru-primary-button"
                    borderRadius="full"
                    px="6"
                    fontWeight="medium"
                    _hover={{
                      transform: "translateY(-1px)"
                    }}
                    transition="all 0.2s ease"
                  >
                    <Icon as={FiPlus} mr="2" />
                    New Application
                  </Button>
                </MotionBox>
              </Link>
              <MotionBox
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Circle 
                  size="40px" 
                  bg="linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)" 
                  color="white"
                  cursor="pointer"
                  boxShadow="0 4px 12px rgba(255, 107, 53, 0.3)"
                  _hover={{
                    boxShadow: "0 6px 20px rgba(255, 107, 53, 0.4)"
                  }}
                  transition="all 0.2s ease"
                >
                  <Text fontSize="sm" fontWeight="bold" color="white">{getInitials(currentUser.name)}</Text>
                </Circle>
              </MotionBox>
            </MotionHStack>
          </Flex>
        </Container>
      </MotionBox>

      <Container maxW="7xl" py="4">
        <VStack gap="4" align="stretch">
          {/* Success Message Banner */}
          <AnimatePresence>
            {showSuccessMessage && (
              <MotionBox
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert.Root status="success" borderRadius="md" mb="3" p="3">
                  <Icon as={FiCheckCircle} color="green.500" boxSize="4" mr="2" />
                  <VStack align="start" gap="0.5">
                    <AlertTitle fontSize="sm">Application Submitted Successfully!</AlertTitle>
                    <AlertDescription fontSize="xs">
                      Your application has been received and is being processed. {retryCount > 0 && retryCount < 5 && `Refreshing data... (attempt ${retryCount + 1}/5)`}
                    </AlertDescription>
                  </VStack>
                </Alert.Root>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Loading/Retry Indicator */}
          {submitted && retryCount > 0 && retryCount < 5 && !application && (
            <Box bg="blue.50" p="3" borderRadius="md" mb="3" border="1px" borderColor="blue.200">
              <HStack gap="2">
                <Spinner size="sm" color="blue.500" />
                <Text fontSize="xs" color="blue.700">
                  Application is being processed. Refreshing data... ({retryCount}/5)
                </Text>
                <Button size="sm" variant="secondary" onClick={handleRefresh} ml="auto">
                  <Icon as={FiRefreshCw} mr="1" />
                  Refresh Now
                </Button>
              </HStack>
            </Box>
          )}

          {/* Welcome Section */}
          <MotionVStack 
            align="start" 
            gap="2" 
            mb="3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <HStack justify="space-between" width="100%">
              <MotionHStack 
                gap="2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Icon as={FiZap} color="orange.500" boxSize="5" />
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                  Welcome back, {partnerData.name}
                </Text>
              </MotionHStack>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <Icon as={FiRefreshCw} mr="1" />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </HStack>
            <MotionText 
              color="gray.600" 
              fontSize="sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              Manage your partnership applications and track verification status
            </MotionText>
          </MotionVStack>

          {/* Application Journey Progress Bar */}
          {partnerData.application && (
            <MotionBox
              bg="white"
              p="4"
              borderRadius="lg"
              boxShadow="0 2px 12px rgba(0, 0, 0, 0.06)"
              border="1px solid"
              borderColor="gray.100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <VStack gap="3" align="stretch">
                <HStack justify="space-between" align="center">
                  <VStack align="start" gap="0.5">
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      Application Journey
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Track your application progress through each stage
                    </Text>
                  </VStack>
                </HStack>
                <Box pt="1">
                  <ApplicationJourneyProgress 
                    status={partnerData.application.status}
                  />
                </Box>
              </VStack>
            </MotionBox>
          )}

          {/* Statistics Cards */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="4">
              {/* Application Status */}
              <MotionBox 
                bg={cardBg} 
                p="4" 
                borderRadius="lg"
                boxShadow="0 2px 12px rgba(0, 0, 0, 0.06)"
                position="relative"
                overflow="hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.10)",
                  transition: { duration: 0.2 }
                }}
                cursor="pointer"
              >
                <Box 
                  position="absolute" 
                  top="0" 
                  right="0" 
                  width="50px" 
                  height="50px" 
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  borderRadius="0 0 0 50px"
                  opacity="0.1"
                />
                <VStack align="start" gap="2">
                  <HStack justify="space-between" width="100%">
                    <Text fontSize="xs" color="gray.600" fontWeight="medium">Application Status</Text>
                    <Icon as={FiFileText} color="purple.500" boxSize="4" />
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {partnerData.application ? partnerData.application.status : 'No Application'}
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontWeight="medium">Current status</Text>
                </VStack>
              </MotionBox>

              {/* Completion Progress */}
              <MotionBox 
                bg={cardBg} 
                p="4" 
                borderRadius="lg"
                boxShadow="0 2px 12px rgba(0, 0, 0, 0.06)"
                position="relative"
                overflow="hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.10)",
                  transition: { duration: 0.2 }
                }}
                cursor="pointer"
              >
                <Box 
                  position="absolute" 
                  top="0" 
                  right="0" 
                  width="50px" 
                  height="50px" 
                  bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                  borderRadius="0 0 0 50px"
                  opacity="0.1"
                />
                <VStack align="start" gap="2">
                  <HStack justify="space-between" width="100%">
                    <Text fontSize="xs" color="gray.600" fontWeight="medium">Completion</Text>
                    <Icon as={FiCheckCircle} color="blue.500" boxSize="4" />
                  </HStack>
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    {partnerData.application ? `${partnerData.application.completionPercentage}%` : '0%'}
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontWeight="medium">Documents uploaded</Text>
                </VStack>
              </MotionBox>

              {/* Last Updated */}
              <MotionBox 
                bg={cardBg} 
                p="4" 
                borderRadius="lg"
                boxShadow="0 2px 12px rgba(0, 0, 0, 0.06)"
                position="relative"
                overflow="hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.10)",
                  transition: { duration: 0.2 }
                }}
                cursor="pointer"
              >
                <Box 
                  position="absolute" 
                  top="0" 
                  right="0" 
                  width="50px" 
                  height="50px" 
                  bg="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                  borderRadius="0 0 0 50px"
                  opacity="0.1"
                />
                <VStack align="start" gap="2">
                  <HStack justify="space-between" width="100%">
                    <Text fontSize="xs" color="gray.600" fontWeight="medium">Last Updated</Text>
                    <Icon as={FiClock} color="orange.500" boxSize="4" />
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold" color="orange.600">
                    {partnerData.application ? partnerData.application.lastUpdated : 'Not Available'}
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontWeight="medium">Recent activity</Text>
                </VStack>
              </MotionBox>

              {/* Case Handler */}
              {partnerData.application && (
                <MotionBox 
                  bg={cardBg} 
                  p="4" 
                  borderRadius="lg"
                  boxShadow="0 2px 12px rgba(0, 0, 0, 0.06)"
                  position="relative"
                  overflow="hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  whileHover={{ 
                    scale: 1.02, 
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.10)",
                    transition: { duration: 0.2 }
                  }}
                  cursor="pointer"
                >
                  <Box 
                    position="absolute" 
                    top="0" 
                    right="0" 
                    width="50px" 
                    height="50px" 
                    bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    borderRadius="0 0 0 50px"
                    opacity="0.1"
                  />
                  <VStack align="start" gap="2">
                    <HStack justify="space-between" width="100%">
                      <Text fontSize="xs" color="gray.600" fontWeight="medium">Case Handler</Text>
                      <Icon as={FiUser} color="blue.500" boxSize="4" />
                    </HStack>
                    {handler ? (
                      <>
                        <Text 
                          fontSize="lg" 
                          fontWeight="bold" 
                          color="gray.800"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {handler.fullName}
                        </Text>
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">
                          {handler.email || 'Assigned'}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text fontSize="lg" fontWeight="bold" color="gray.400">
                          Not Assigned
                        </Text>
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">
                          Will appear when assigned
                        </Text>
                      </>
                    )}
                  </VStack>
                </MotionBox>
              )}
            </SimpleGrid>
          </MotionBox>

          {/* Your Application */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: handler ? 2.8 : 2.2 }}
          >
            <MotionHStack 
              gap="2" 
              mb="3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: handler ? 2.9 : 2.3 }}
            >
              <Icon as={FiFileText} color="purple.500" boxSize="5" />
              <Text fontSize="lg" fontWeight="bold" color="gray.800">Your Application</Text>
            </MotionHStack>
            
            {partnerData.application ? (
              <MotionBox 
                bg={cardBg} 
                p="4" 
                borderRadius="lg"
                boxShadow="0 2px 12px rgba(0, 0, 0, 0.06)"
                position="relative"
                overflow="hidden"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: handler ? 3.0 : 2.4,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.10)",
                  transition: { duration: 0.2 }
                }}
              >
                {/* Gradient overlay */}
                <Box 
                  position="absolute" 
                  top="0" 
                  right="0" 
                  width="60px" 
                  height="60px" 
                  bg={`linear-gradient(135deg, ${
                    partnerData.application.statusColor === 'green' ? '#43e97b 0%, #38f9d7 100%' :
                    partnerData.application.statusColor === 'blue' ? '#4facfe 0%, #00f2fe 100%' :
                    partnerData.application.statusColor === 'red' ? '#ff6b6b 0%, #ee5a52 100%' :
                    '#fa709a 0%, #fee140 100%'
                  })`}
                  borderRadius="0 0 0 60px"
                  opacity="0.1"
                />
                
                <VStack align="start" gap="5">
                  <HStack justify="space-between" width="100%">
                    <VStack align="start" gap="2">
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">{partnerData.application.name}</Text>
                      <HStack gap="2">
                        <Icon as={FiUsers} color="gray.500" boxSize="4" />
                        <Text fontSize="sm" color="gray.600">{partnerData.application.type}</Text>
                      </HStack>
                    </VStack>
                    <MotionBox
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: handler ? 3.1 : 2.5 }}
                    >
                      <Badge 
                        colorScheme={partnerData.application.statusColor} 
                        fontSize="xs" 
                        px="3" 
                        py="1"
                        borderRadius="full"
                        fontWeight="semibold"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                      >
                        {partnerData.application.status}
                      </Badge>
                    </MotionBox>
                  </HStack>
                  
                  <VStack align="start" gap="3" width="100%">
                    <MotionHStack 
                      justify="space-between" 
                      width="100%"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: handler ? 3.2 : 2.6 }}
                    >
                      <HStack gap="2">
                        <Icon as={FiMapPin} color="gray.500" boxSize="4" />
                        <Text fontSize="sm" color="gray.600">Country:</Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.800">{partnerData.application.country}</Text>
                    </MotionHStack>
                    
                    <MotionHStack 
                      justify="space-between" 
                      width="100%"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: handler ? 3.3 : 2.7 }}
                    >
                      <HStack gap="2">
                        <Icon as={FiCalendar} color="gray.500" boxSize="4" />
                        <Text fontSize="sm" color="gray.600">Created:</Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.800">{partnerData.application.created}</Text>
                    </MotionHStack>

                    <MotionHStack 
                      justify="space-between" 
                      width="100%"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: handler ? 3.4 : 2.8 }}
                    >
                      <HStack gap="2">
                        <Icon as={FiTrendingUp} color="gray.500" boxSize="4" />
                        <Text fontSize="sm" color="gray.600">Progress:</Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.800">{partnerData.application.completionPercentage}%</Text>
                    </MotionHStack>
                  </VStack>
                  
                  <Link href={`/partner/application/${partnerData.application.id}`}>
                    <MotionBox
                      width="100%"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        variant="secondary" 
                        size="md" 
                        width="100%"
                        borderRadius="xl"
                        fontWeight="medium"
                        borderColor="gray.200"
                        _hover={{ 
                          bg: "gray.50",
                          borderColor: "orange.300",
                          color: "orange.600"
                        }}
                        transition="all 0.2s ease"
                      >
                        View Details
                        <Icon as={FiArrowRight} ml="2" />
                      </Button>
                    </MotionBox>
                  </Link>
                </VStack>
              </MotionBox>
            ) : (
              <MotionBox 
                bg={cardBg} 
                p="8" 
                borderRadius="2xl" 
                boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
                textAlign="center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: handler ? 3.0 : 2.4 }}
              >
                <VStack gap="4">
                  <Icon as={FiFileText} color="gray.400" boxSize="12" />
                  <Text fontSize="lg" fontWeight="semibold" color="gray.600">No Application Found</Text>
                  <Text fontSize="sm" color="gray.500">You haven't submitted an application yet.</Text>
                  <Link href="/partner/application/enhanced">
                    <Button 
                      size="md"
                      className="mukuru-primary-button"
                      borderRadius="xl"
                      fontWeight="medium"
                    >
                      <Icon as={FiPlus} mr="2" />
                      Create Application
                    </Button>
                  </Link>
                </VStack>
              </MotionBox>
            )}
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}

export default function PartnerDashboard() {
  return (
    <Suspense fallback={<Box p={8}><Spinner /></Box>}>
      <PartnerDashboardContent />
    </Suspense>
  );
}
