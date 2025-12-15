'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Container,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  Circle,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { Button, Typography, Tag, AlertBar, Card } from '@/lib/mukuruImports';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAuthUser } from '@/lib/auth/session';
import { PartnerHeader } from '@/components/PartnerHeader';
import { AcknowledgementForm } from '@/components/AcknowledgementForm';
import { AcknowledgementEmailNotification } from '@/components/AcknowledgementEmailNotification';
import {
  findUserCaseByEmail,
  getCaseById,
  getHandlerProfile,
  getUserApplications,
} from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiMapPin,
  FiArrowRight,
  FiPlus,
  FiZap,
  FiUser,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiClipboard,
  FiAward,
} from 'react-icons/fi';

const MotionBox = motion.create(Box);
const MotionVStack = motion.create(VStack);
const MotionHStack = motion.create(HStack);
const MotionTypography = motion.create(Typography);

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
    status: ['SUBMITTED', 'NEW'],
  },
  {
    id: 'assigned',
    label: 'Assigned',
    icon: FiUser,
    status: ['ASSIGNED'],
  },
  {
    id: 'in_review',
    label: 'In Review',
    icon: FiClipboard,
    status: ['IN PROGRESS', 'INPROGRESS', 'IN_REVIEW'],
  },
  {
    id: 'risk_assessment',
    label: 'Risk Assessment',
    icon: FiShield,
    status: ['RISK REVIEW', 'PENDING APPROVAL', 'PENDINGAPPROVAL'],
  },
  {
    id: 'approved',
    label: 'Approved',
    icon: FiCheckCircle,
    status: ['APPROVED'],
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: FiAward,
    status: ['COMPLETED', 'COMPLETE'],
  },
];

function ApplicationJourneyProgress({ status }: { status: string }) {
  const normalizedStatus = (status || '').toUpperCase().trim();

  // Find current stage index - use exact match or startsWith to avoid partial matches
  const currentStageIndex = journeyStages.findIndex((stage) =>
    stage.status.some((s) => {
      const normalizedStageStatus = s.toUpperCase().trim();
      // Use exact match first (most reliable)
      if (normalizedStatus === normalizedStageStatus) {
        return true;
      }
      // For partial matches, only match if status is longer than stage status
      // This prevents "PENDING" from matching "PENDING APPROVAL", but allows "IN PROGRESS DETAILED" to match "IN PROGRESS"
      if (normalizedStatus.length > normalizedStageStatus.length) {
        return normalizedStatus.startsWith(normalizedStageStatus + ' ');
      }
      return false;
    })
  );

  // Default to first stage if not found
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  // Calculate circle center position (half of circle size)
  const circleCenterY = { base: 18, md: 20 }; // Half of 36px/40px

  // Calculate progress line width - from first circle center to current stage center
  const totalStages = journeyStages.length;
  const progressPercentage =
    activeIndex === 0 ? 0 : (activeIndex / (totalStages - 1)) * 100;

  // Calculate width from first circle center to current stage center
  // Available space is 100% minus the radius of first and last circles
  const progressWidthValue =
    activeIndex === 0
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
            bg="mukuru.grey.light"
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
            bg="linear-gradient(90deg, var(--mukuru-buttons-primary) 0%, var(--mukuru-text-accent) 100%)"
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
                maxW={{ base: '60px', md: '100px' }}
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
                    size={{ base: '36px', md: '40px' }}
                    bg={isCompleted || isCurrent ? 'orange.500' : 'gray.200'}
                    color={isCompleted || isCurrent ? 'white' : 'gray.400'}
                    border={isCurrent ? '3px solid' : '2px solid'}
                    borderColor={
                      isCurrent ? 'orange.600' : isCompleted ? 'orange.400' : 'gray.300'
                    }
                    boxShadow={
                      isCurrent
                        ? '0 0 0 3px rgba(255, 107, 53, 0.15), 0 2px 8px rgba(255, 107, 53, 0.3)'
                        : isCompleted
                          ? '0 2px 6px rgba(255, 107, 53, 0.2)'
                          : 'none'
                    }
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                    position="relative"
                    zIndex={3}
                    _hover={{
                      transform: isCurrent ? 'scale(1.1)' : 'scale(1.05)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <Icon as={IconComponent} boxSize={{ base: '4', md: '5' }} />
                  </Circle>

                  {/* Current Stage Indicator */}
                  {isCurrent && (
                    <Box
                      position="absolute"
                      top="-3px"
                      right="-3px"
                      width="14px"
                      height="14px"
                      bg="mukuru.buttons.primary"
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
                          width: '6px',
                          height: '6px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                        }}
                        animate={{
                          opacity: [1, 0.5, 1],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
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
                      bg="mukuru.text.success"
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
                  <Typography
                    fontSize="10px"
                    fontWeight={isCurrent ? 'bold' : isCompleted ? 'semibold' : 'medium'}
                    color={isCurrent ? 'gray.900' : isCompleted ? 'gray.700' : 'gray.500'}
                    textAlign="center"
                    lineHeight="1.1"
                    px="0.5"
                  >
                    {stage.label}
                  </Typography>

                  {/* Current Badge */}
                  {isCurrent && (
                    <Tag variant="solid" size="md">
                      Current
                    </Tag>
                  )}

                  {/* Completed Badge */}
                  {isCompleted && (
                    <Tag variant="solid" size="md">
                      Done
                    </Tag>
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
  const router = useRouter();
  const submitted = searchParams?.get('submitted') === 'true';
  const caseIdFromUrl = searchParams?.get('caseId');

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email?: string;
    companyName?: string;
    country?: string;
  }>({ name: 'User' });
  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [handler, setHandler] = useState<{
    id: string;
    fullName: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [, setLoadingHandler] = useState<boolean>(false);
  const [acknowledgementEmailSent, setAcknowledgementEmailSent] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [statusChangeEmailSent, setStatusChangeEmailSent] = useState<Set<string>>(new Set());

  // Use ref to track application state without causing dependency issues
  const applicationRef = useRef<any | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (authUser) {
        // Fetch user profile to get country
        try {
          const { getUserProfile } = await import('@/lib/api');
          const profile = await getUserProfile();
          setCurrentUser({
            name: authUser.name || '',
            email: authUser.email || '',
            country: profile.country,
          });
        } catch {
          // Fallback if profile fetch fails
          setCurrentUser({
            name: authUser.name || '',
            email: authUser.email || '',
            country: undefined,
          });
        }
      } else if (!authLoading) {
        // Fallback to direct session check if auth context not loaded yet
        const user = getAuthUser();
        setCurrentUser({
          name: user.name,
          email: user.email,
          country: undefined,
        });
      }
    };

    loadUserProfile();
  }, [authUser, authLoading]);

  // Keep ref in sync with state
  useEffect(() => {
    applicationRef.current = application;
  }, [application]);

  // Detect status changes and send email notifications
  useEffect(() => {
    if (!application || !currentUser.email) return;

    const currentStatus = application.status;
    const statusKey = `${application.id || application.caseId}-${currentStatus}`;

    // Only send email if status actually changed and we haven't sent for this status yet
    if (
      previousStatus &&
      previousStatus !== currentStatus &&
      !statusChangeEmailSent.has(statusKey) &&
      // Don't send for initial load or for statuses that have their own notifications
      previousStatus !== null
    ) {
      // Skip sending email for COMPLETED status (handled by AcknowledgementEmailNotification)
      if (currentStatus !== 'COMPLETED' && currentStatus !== 'COMPLETE') {
        const sendStatusEmail = async () => {
          try {
            const { sendStatusUpdateNotification } = await import('@/lib/notificationService');
            await sendStatusUpdateNotification({
              to: currentUser.email || '',
              applicantName: currentUser.name,
              caseId: application.id || application.caseId,
              caseNumber: application.caseId,
              status: currentStatus,
              message: `Your application status has been updated to ${currentStatus}.`,
              link: `${window.location.origin}/partner/dashboard`,
            });

            // Mark this status as notified
            setStatusChangeEmailSent((prev) => new Set(prev).add(statusKey));
            console.info('Status update email sent for status change:', {
              from: previousStatus,
              to: currentStatus,
            });
          } catch (error) {
            // Log error but don't block user flow
            console.warn('Failed to send status update email:', error);
          }
        };

        // Send email after a short delay to avoid spam
        const timer = setTimeout(sendStatusEmail, 2000);
        return () => clearTimeout(timer);
      }
    }

    // Update previous status
    if (currentStatus) {
      setPreviousStatus(currentStatus);
    }
  }, [application?.status, previousStatus, currentUser.email, currentUser.name, statusChangeEmailSent, application]);

  // Load application data function - fetches REAL data from API
  const loadApplicationData = useCallback(
    async (forceRefresh = false) => {
      if (!currentUser.email) {
        setLoading(false);
        return false;
      }

      try {
        console.info('🔄 Loading application data from API...', {
          email: currentUser.email,
          caseIdFromUrl,
          forceRefresh,
        });

        setLoading(true);

        // If caseId is provided in URL (from submission), try to fetch it directly first
        let found: any = null;
        if (caseIdFromUrl) {
          console.info('📋 Fetching case by ID:', caseIdFromUrl);
          found = await getCaseById(caseIdFromUrl);
          if (found) {
            console.info('✅ Found case by ID:', found.caseId);
          } else {
            console.warn('⚠️ Case not found by ID, will try email search');
          }
        }

        // PRIMARY: Try getUserApplications (more comprehensive, handles multiple cases)
        if (!found) {
          console.info(
            '📧 Fetching applications using getUserApplications:',
            currentUser.email
          );
          try {
            const applications = await getUserApplications(currentUser.email);
            console.info(
              '✅ getUserApplications returned:',
              applications.length,
              'applications'
            );
            if (applications && applications.length > 0) {
              // Get the most recent application
              found = applications[0];
              console.info(
                '✅ Using first application from getUserApplications:',
                found.caseId
              );
            }
          } catch (getUserAppsError) {
            console.warn(
              '⚠️ getUserApplications failed, trying findUserCaseByEmail:',
              getUserAppsError
            );
          }
        }

        // FALLBACK: If getUserApplications didn't work, try findUserCaseByEmail
        if (!found) {
          console.info('📧 Fallback: Fetching case by email:', currentUser.email);
          found = await findUserCaseByEmail(currentUser.email);
          if (found) {
            console.info('✅ Found case by email:', found.caseId);
          }
        }

        // SECURITY: Removed "fetch all cases" fallback to prevent data leakage
        // All queries must be filtered by PartnerId or email at the backend level
        // Client-side filtering is NOT a security measure

        if (!found) {
          console.warn('⚠️ No application found in API after all attempts');
          const existingApp = applicationRef.current;
          console.warn('💡 Debug info:', {
            email: currentUser.email,
            caseIdFromUrl,
            forceRefresh,
            existingApplication: existingApp ? existingApp.caseId : 'none',
          });
          // IMPORTANT: Don't clear existing application unless this is a forced refresh
          // AND we're absolutely certain it doesn't exist (all queries returned empty)
          // This prevents the application from disappearing on page refresh due to temporary API issues
          if (forceRefresh) {
            // Only clear if we're doing a manual refresh and got definitive "no results"
            // But preserve it if we have an existing application and this might be a temporary API issue
            if (!existingApp) {
              // No existing application, safe to clear
              setApplication(null);
            } else {
              // We have an existing application - don't clear it on refresh errors
              // This prevents the "disappearing application" issue
              console.info(
                '💡 Preserving existing application state despite API failure'
              );
            }
          }
          // Don't clear loading state if we're preserving the application
          setLoading(false);
          return false;
        }

        if (found) {
          // Log what we received from API to debug
          console.info('📊 Dashboard - API Response:', {
            caseId: found.caseId,
            status: found.status,
            progressPercentage: found.progressPercentage,
            type: found.type,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            hasMetadata: !!(found as any).metadataJson,
          });

          const statusRaw = (found.status || '').toString();
          const statusColor =
            statusRaw.toLowerCase() === 'approved'
              ? 'green'
              : statusRaw.toLowerCase().includes('review')
                ? 'blue'
                : statusRaw.toLowerCase() === 'rejected'
                  ? 'red'
                  : 'orange';

          // Parse metadata to get dynamic fields
          let metadata = {};
          try {
            if ((found as any).metadataJson) {
              metadata =
                typeof (found as any).metadataJson === 'string'
                  ? JSON.parse((found as any).metadataJson)
                  : (found as any).metadataJson;
            }
          } catch {
            // Silently handle metadata parsing errors
          }

          // Get country from metadata first, then standard fields, then user profile, then empty
          const countryFromMetadata =
            (metadata as any)?.country ||
            (metadata as any)?.applicant_country ||
            (metadata as any)?.business_country ||
            (metadata as any)?.country_of_registration;

          const country =
            countryFromMetadata ||
            found.country ||
            found.applicantCountry ||
            currentUser.country || // Fallback to user profile country
            '';

          // Use REAL progress from API - no fallbacks, no defaults
          const realProgress = found.progressPercentage ?? 0;
          let realStatus = statusRaw.replace(/_/g, ' ').toUpperCase();

          // Get caseId first
          const caseIdForLink = found.caseId || found.caseNumber || found.id;

          // Fetch work item to get real-time status
          let workItemStatus = null;
          try {
            const workItemResponse = await fetch(`/api/workitem/${caseIdForLink}`);
            if (workItemResponse.ok) {
              const workItemData = await workItemResponse.json();
              if (workItemData.workItem) {
                workItemStatus = workItemData.workItem.status;
                console.info('✅ Got work item status:', workItemStatus);

                // Override case status with work item status if available
                if (workItemStatus) {
                  realStatus = workItemStatus.replace(/_/g, ' ').toUpperCase();
                  console.info('✅ Using work item status:', realStatus);
                }

                // Also update assigned info from work item
                if (workItemData.workItem.assignedToName) {
                  found.assignedTo = workItemData.workItem.assignedTo;
                  found.assignedToName = workItemData.workItem.assignedToName;
                  console.info('✅ Updated assigned info from work item:', {
                    assignedTo: found.assignedTo,
                    assignedToName: found.assignedToName,
                  });
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch work item status:', error);
          }

          // Fallback: Override status to ASSIGNED if work item is assigned but case status is still SUBMITTED
          if (
            !workItemStatus &&
            found.assignedTo &&
            (realStatus === 'SUBMITTED' || realStatus === 'NEW')
          ) {
            realStatus = 'ASSIGNED';
            console.info('✅ Overriding status to ASSIGNED (work item assigned)');
          }

          if (!caseIdForLink) {
            console.error('⚠️ No caseId found in application data:', found);
          }

          console.info('✅ Dashboard - Setting application data:', {
            status: realStatus,
            progress: realProgress,
            country: country || 'NOT PROVIDED',
            type: found.type,
            caseId: caseIdForLink,
            hasCaseId: !!caseIdForLink,
            assignedTo: found.assignedTo,
            assignedToName: found.assignedToName,
          });

          setApplication({
            id: caseIdForLink, // Use caseId for the View Details link
            name:
              `${found.applicantFirstName ?? ''} ${found.applicantLastName ?? ''}`.trim() ||
              found.businessLegalName ||
              'Application',
            type: found.type,
            status: realStatus, // REAL status from database
            country: country || '—', // Only show if actually provided
            created: found.createdAt
              ? new Date(found.createdAt).toLocaleDateString()
              : '—',
            lastUpdated: found.updatedAt
              ? new Date(found.updatedAt).toLocaleDateString()
              : '—',
            completionPercentage: Math.round(realProgress), // REAL progress from database
            riskLevel: (found.riskLevel ?? 'low').toString(),
            statusColor,
            assignedTo: found.assignedTo,
            assignedToName: found.assignedToName,
            metadata: metadata, // Store all dynamic fields
          });

          // Load handler profile if assigned
          console.info('🔍 Checking handler assignment:', {
            hasAssignedTo: !!found.assignedTo,
            assignedTo: found.assignedTo,
            assignedToName: found.assignedToName,
          });

          if (found.assignedTo) {
            setLoadingHandler(true);
            try {
              const handlerProfile = await getHandlerProfile(found.assignedTo);
              if (handlerProfile) {
                console.info('✅ Got handler profile from API:', handlerProfile);

                // Check if the profile returned "Unknown User" - if so, use assignedToName if available
                if (handlerProfile.fullName === 'Unknown User' && found.assignedToName) {
                  // Extract username from email (part before @) or use the name directly
                  const displayName = found.assignedToName.includes('@')
                    ? found.assignedToName.split('@')[0]
                    : found.assignedToName;

                  console.info(
                    '✅ Handler profile returned "Unknown User", using assignedToName:',
                    {
                      original: found.assignedToName,
                      displayName: displayName,
                    }
                  );

                  setHandler({
                    id: found.assignedTo,
                    fullName: displayName,
                    email: found.assignedToName.includes('@')
                      ? found.assignedToName
                      : handlerProfile.email,
                    firstName: undefined,
                    lastName: undefined,
                    profileImageUrl: handlerProfile.profileImageUrl,
                  });
                } else {
                  setHandler(handlerProfile);
                }
              } else if (found.assignedToName) {
                // Extract username from email (part before @)
                const displayName = found.assignedToName.includes('@')
                  ? found.assignedToName.split('@')[0]
                  : found.assignedToName;

                console.info('✅ Using assignedToName as fallback:', {
                  original: found.assignedToName,
                  displayName: displayName,
                });

                // Fallback to just the name if profile fetch fails
                setHandler({
                  id: found.assignedTo,
                  fullName: displayName,
                  email: found.assignedToName,
                  firstName: undefined,
                  lastName: undefined,
                });
              }
            } catch (error) {
              console.warn('⚠️ Error fetching handler profile:', error);
              // Silently handle errors - use assignedToName if available
              if (found.assignedToName) {
                // Extract username from email (part before @)
                const displayName = found.assignedToName.includes('@')
                  ? found.assignedToName.split('@')[0]
                  : found.assignedToName;

                console.info('✅ Using assignedToName as error fallback:', displayName);

                setHandler({
                  id: found.assignedTo,
                  fullName: displayName,
                  email: found.assignedToName,
                  firstName: undefined,
                  lastName: undefined,
                });
              }
            } finally {
              setLoadingHandler(false);
            }
          } else {
            console.info('ℹ️ No assignedTo found, setting handler to null');
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
            console.warn(
              '⚠️ Backend service unavailable (503). The projections API may not be running.'
            );
            console.warn(
              '💡 To fix: Ensure the projections API service is running on http://localhost:8007'
            );
          }
        } else {
          console.error('Failed to load application:', error);
        }
        // IMPORTANT: Don't clear application on errors - preserve existing state
        // This prevents the application from disappearing on page refresh due to temporary API issues
        // Only clear if this is a forced refresh and we have no existing application
        const existingApp = applicationRef.current;
        if (forceRefresh && !existingApp) {
          setApplication(null);
        } else if (existingApp) {
          console.info('💡 Preserving existing application state despite API error');
        }
        setLoading(false);
        return false; // Error loading
      }
    },
    [currentUser.email, caseIdFromUrl]
  );

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
    let successTimer: NodeJS.Timeout | null = null;
    let syncTriggered = false;

    async function load() {
      // Wait for email to be available - don't clear application if email isn't ready yet
      if (!currentUser.email) {
        // If we have an existing application, keep it while waiting for email
        if (applicationRef.current) {
          console.info('💡 Waiting for email, preserving existing application');
        }
        setLoading(false);
        return;
      }

      // If case was just submitted and we haven't triggered sync yet, do it now
      if (submitted && !syncTriggered && caseIdFromUrl) {
        syncTriggered = true;
        try {
          // Trigger projections sync to ensure case is available
          // Note: This endpoint may not exist if projections service is not running
          const syncResponse = await fetch('/api/proxy/api/v1/sync?forceFullSync=false', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(currentUser.email
                ? {
                    'X-User-Email': currentUser.email,
                    'X-User-Name': currentUser.name || currentUser.email,
                    'X-User-Role': 'Applicant',
                  }
                : {}),
            },
          });
          if (syncResponse.ok) {
            console.info('Projections sync triggered from dashboard');
            // Wait a bit for sync to complete
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else if (syncResponse.status === 404) {
            // Projections service not available - this is expected in some environments
            console.debug(
              'Projections sync endpoint not available (404) - service may not be running'
            );
          }
        } catch (syncError) {
          // Silently handle - projections service may not be available
          // The onboarding API also triggers sync automatically
          console.debug(
            'Projections sync not available:',
            syncError instanceof Error ? syncError.message : 'Unknown error'
          );
        }
      }

      setLoading(true);
      const loaded = await loadApplicationData();

      if (cancelled) return;

      // If application was just submitted but not found, retry a few times
      // (projections service might need time to index the new case)
      const MAX_RETRIES = 5; // Consistent with UI display
      if (submitted && !loaded && retryCount < MAX_RETRIES) {
        const delay = Math.min(1500 * (retryCount + 1), 6000); // Exponential backoff, max 6s
        retryTimeout = setTimeout(() => {
          if (!cancelled) {
            setRetryCount((prev) => prev + 1);
            load(); // Retry
          }
        }, delay);
      } else if (submitted && loaded) {
        // Show success message when application is found
        setShowSuccessMessage(true);
        successTimer = setTimeout(() => setShowSuccessMessage(false), 5000);
        setRetryCount(0); // Reset retry count on success
      } else if (submitted && !loaded && retryCount >= MAX_RETRIES) {
        // Max retries reached - show warning but don't block
        console.warn(
          'Application not found after max retries. It may take longer to appear.'
        );
      }
    }

    load();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (successTimer) clearTimeout(successTimer);
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
        loadApplicationData(false).catch((err) => {
          // Silently handle errors - don't spam console
          if (!err?.isServiceUnavailable) {
            console.info('Periodic refresh failed:', err);
          }
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [currentUser.email, loading, retryCount, loadApplicationData]);

  const partnerData = {
    name: currentUser.name,
    companyName: currentUser.companyName,
    application,
  };

  const cardBg = 'white';
  const borderColor = 'gray.200';

  return (
    <Box minH="100vh" bg="mukuru.background.light">
      {/* Header */}
      <PartnerHeader 
        showBackButton={false} 
        disableNewApplication={!!application}
      />

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
                <Box mb="3">
                  <AlertBar
                    status="success"
                    title="Application Submitted Successfully!"
                    description={`Your application has been received and is being processed. ${
                      retryCount > 0 && retryCount < 5
                        ? `Refreshing data... (attempt ${retryCount + 1}/5)`
                        : ''
                    }`.trim()}
                  />
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Loading/Retry Indicator */}
          {submitted && retryCount > 0 && retryCount < 5 && !application && (
            <Box
              bg="mukuru.teal"
              p="3"
              borderRadius="md"
              mb="3"
              border="1px"
              borderColor="blue.200"
            >
              <HStack gap="2">
                <Spinner size="sm" color="mukuru.teal" />
                <Typography fontSize="xs" color="mukuru.teal">
                  Application is being processed. Refreshing data... ({retryCount}/5)
                </Typography>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRefresh}
                  ml="auto"
                  leftIcon={<Icon as={FiRefreshCw} color="mukuru.text.primary" />}
                >
                  <Typography
                    color="mukuru.text.primary"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    Refresh Now
                  </Typography>
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
                <Icon as={FiZap} color="mukuru.buttons.primary" boxSize="5" />
                <Typography fontSize="2xl" fontWeight="bold" color="mukuru.text.primary">
                  Welcome back, {partnerData.name}
                </Typography>
              </MotionHStack>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRefresh}
                disabled={loading}
                leftIcon={<Icon as={FiRefreshCw} color="mukuru.text.primary" />}
              >
                <Typography color="mukuru.text.primary" fontSize="sm" fontWeight="medium">
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Typography>
              </Button>
            </HStack>
            <MotionTypography
              color="mukuru.text.primary"
              fontSize="sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              Manage your partnership applications and track verification status
            </MotionTypography>
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
                    <Typography
                      fontSize="md"
                      fontWeight="bold"
                      color="mukuru.text.primary"
                    >
                      Application Journey
                    </Typography>
                    <Typography fontSize="xs" color="mukuru.text.primary">
                      Track your application progress through each stage
                    </Typography>
                  </VStack>
                </HStack>
                <Box pt="1">
                  <ApplicationJourneyProgress status={partnerData.application.status} />
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
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.10)',
                  transition: { duration: 0.2 },
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
                    <Typography
                      fontSize="xs"
                      color="mukuru.text.primary"
                      fontWeight="medium"
                    >
                      Application Status
                    </Typography>
                    <Icon as={FiFileText} color="mukuru.teal" boxSize="4" />
                  </HStack>
                  <Typography fontSize="lg" fontWeight="bold" color="mukuru.text.primary">
                    {partnerData.application
                      ? partnerData.application.status
                      : 'No Application'}
                  </Typography>
                  <Typography
                    fontSize="xs"
                    color="mukuru.grey.medium"
                    fontWeight="medium"
                  >
                    Current status
                  </Typography>
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
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.10)',
                  transition: { duration: 0.2 },
                }}
                cursor="pointer"
              >
                <Box
                  position="absolute"
                  top="0"
                  right="0"
                  width="50px"
                  height="50px"
                  bg="linear-gradient(135deg, var(--mukuru-teal) 0%, var(--mukuru-teal) 100%)"
                  borderRadius="0 0 0 50px"
                  opacity="0.1"
                />
                <VStack align="start" gap="2">
                  <HStack justify="space-between" width="100%">
                    <Typography
                      fontSize="xs"
                      color="mukuru.text.primary"
                      fontWeight="medium"
                    >
                      Completion
                    </Typography>
                    <Icon as={FiCheckCircle} color="mukuru.teal" boxSize="4" />
                  </HStack>
                  <Typography fontSize="xl" fontWeight="bold" color="mukuru.teal">
                    {partnerData.application
                      ? `${partnerData.application.completionPercentage}%`
                      : '0%'}
                  </Typography>
                  <Typography
                    fontSize="xs"
                    color="mukuru.grey.medium"
                    fontWeight="medium"
                  >
                    Documents uploaded
                  </Typography>
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
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.10)',
                  transition: { duration: 0.2 },
                }}
                cursor="pointer"
              >
                <Box
                  position="absolute"
                  top="0"
                  right="0"
                  width="50px"
                  height="50px"
                  bg="linear-gradient(135deg, var(--mukuru-text-alert) 0%, var(--mukuru-text-alert) 100%)"
                  borderRadius="0 0 0 50px"
                  opacity="0.1"
                />
                <VStack align="start" gap="2">
                  <HStack justify="space-between" width="100%">
                    <Typography
                      fontSize="xs"
                      color="mukuru.text.primary"
                      fontWeight="medium"
                    >
                      Last Updated
                    </Typography>
                    <Icon as={FiClock} color="mukuru.buttons.primary" boxSize="4" />
                  </HStack>
                  <Typography
                    fontSize="lg"
                    fontWeight="bold"
                    color="mukuru.buttons.primary"
                  >
                    {partnerData.application
                      ? partnerData.application.lastUpdated
                      : 'Not Available'}
                  </Typography>
                  <Typography
                    fontSize="xs"
                    color="mukuru.grey.medium"
                    fontWeight="medium"
                  >
                    Recent activity
                  </Typography>
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
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.10)',
                    transition: { duration: 0.2 },
                  }}
                  cursor="pointer"
                >
                  <Box
                    position="absolute"
                    top="0"
                    right="0"
                    width="50px"
                    height="50px"
                    bg="linear-gradient(135deg, var(--mukuru-teal) 0%, var(--mukuru-teal) 100%)"
                    borderRadius="0 0 0 50px"
                    opacity="0.1"
                  />
                  <VStack align="start" gap="2">
                    <HStack justify="space-between" width="100%">
                      <Typography fontSize="xs" color="gray.600" fontWeight="medium">
                        Case Handler
                      </Typography>
                      <Icon as={FiUser} color="mukuru.teal" boxSize="4" />
                    </HStack>
                    {handler ? (
                      <>
                        <Typography
                          fontSize="lg"
                          fontWeight="bold"
                          color="mukuru.text.primary"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {handler.fullName}
                        </Typography>
                        <Typography
                          fontSize="xs"
                          color="mukuru.grey.medium"
                          fontWeight="medium"
                        >
                          {handler.email || 'Assigned'}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography
                          fontSize="lg"
                          fontWeight="bold"
                          color="mukuru.grey.medium"
                        >
                          Not Assigned
                        </Typography>
                        <Typography
                          fontSize="xs"
                          color="mukuru.grey.medium"
                          fontWeight="medium"
                        >
                          Will appear when assigned
                        </Typography>
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
              <Icon as={FiFileText} color="mukuru.teal" boxSize="5" />
              <Typography fontSize="lg" fontWeight="bold" color="mukuru.text.primary">
                Your Application
              </Typography>
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
                  ease: 'easeOut',
                }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.10)',
                  transition: { duration: 0.2 },
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
                    partnerData.application.statusColor === 'green'
                      ? 'var(--mukuru-text-success) 0%, var(--mukuru-text-success) 100%'
                      : partnerData.application.statusColor === 'blue'
                        ? 'var(--mukuru-teal) 0%, var(--mukuru-teal) 100%'
                        : partnerData.application.statusColor === 'red'
                          ? 'var(--mukuru-text-error) 0%, var(--mukuru-text-error) 100%'
                          : 'var(--mukuru-text-alert) 0%, var(--mukuru-text-alert) 100%'
                  })`}
                  borderRadius="0 0 0 60px"
                  opacity="0.1"
                />

                <VStack align="start" gap="5">
                  <HStack justify="space-between" width="100%">
                    <VStack align="start" gap="2">
                      <Typography
                        fontSize="lg"
                        fontWeight="bold"
                        color="mukuru.text.primary"
                      >
                        {partnerData.application.name}
                      </Typography>
                      <HStack gap="2">
                        <Icon as={FiUsers} color="mukuru.grey.medium" boxSize="4" />
                        <Typography fontSize="sm" color="mukuru.text.primary">
                          {partnerData.application.type}
                        </Typography>
                      </HStack>
                    </VStack>
                    <MotionBox
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: handler ? 3.1 : 2.5 }}
                    >
                      <Tag variant="solid" size="md">
                        {partnerData.application.status}
                      </Tag>
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
                        <Typography fontSize="sm" color="gray.600">
                          Country:
                        </Typography>
                      </HStack>
                      <Typography fontSize="sm" fontWeight="semibold" color="gray.800">
                        {partnerData.application.country}
                      </Typography>
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
                        <Typography fontSize="sm" color="gray.600">
                          Created:
                        </Typography>
                      </HStack>
                      <Typography fontSize="sm" fontWeight="semibold" color="gray.800">
                        {partnerData.application.created}
                      </Typography>
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
                        <Typography fontSize="sm" color="gray.600">
                          Progress:
                        </Typography>
                      </HStack>
                      <Typography fontSize="sm" fontWeight="semibold" color="gray.800">
                        {partnerData.application.completionPercentage}%
                      </Typography>
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
                          bg: 'gray.50',
                          borderColor: 'orange.300',
                          color: 'orange.600',
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
                  <Icon as={FiFileText} color="mukuru.grey.medium" boxSize="12" />
                  <Typography
                    fontSize="lg"
                    fontWeight="semibold"
                    color="mukuru.text.primary"
                  >
                    No Application Found
                  </Typography>
                  <Typography fontSize="sm" color="mukuru.grey.medium">
                    You haven&apos;t submitted an application yet.
                  </Typography>
                  <Link href="/partner/application/enhanced">
                    <Button
                      size="md"
                      variant="primary"
                      leftIcon={<Icon as={FiPlus} color="white" />}
                      bg="mukuru.buttons.primary"
                      _hover={{ bg: 'mukuru.buttons.inactive.orange' }}
                    >
                      <Typography
                        color="mukuru.text.inverse"
                        fontSize="md"
                        fontWeight="medium"
                      >
                        Start Application
                      </Typography>
                    </Button>
                  </Link>
                </VStack>
              </MotionBox>
            )}
          </MotionBox>

          {/* Acknowledgement Email Notification - Send email when status becomes COMPLETED */}
          {partnerData.application &&
            (partnerData.application.status === 'COMPLETED' ||
              partnerData.application.status === 'COMPLETE') && (
              <AcknowledgementEmailNotification
                application={partnerData.application}
                userEmail={currentUser.email}
                userName={currentUser.name}
                onEmailSent={() => setAcknowledgementEmailSent(true)}
                emailSent={acknowledgementEmailSent}
              />
            )}

          {/* Acknowledgement Card - Show when application is COMPLETED */}
          {partnerData.application &&
            (partnerData.application.status === 'COMPLETED' ||
              partnerData.application.status === 'COMPLETE') && (
              <MotionBox
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: handler ? 3.2 : 2.6 }}
                mt="6"
                width="100%"
              >
                <Card p="6" borderRadius="xl" boxShadow="md" bg="white" width="100%">
                  <Flex
                    direction={{ base: 'column', md: 'row' }}
                    justify="space-between"
                    align={{ base: 'stretch', md: 'center' }}
                    gap="4"
                    width="100%"
                  >
                    <HStack gap="4" flex="1" align="center">
                      <Box
                        p="3"
                        borderRadius="xl"
                        bg="teal.50"
                        color="teal.500"
                        flexShrink={0}
                      >
                        <FiShield size={28} />
                      </Box>
                      <VStack align="start" gap="1" flex="1">
                        <Typography fontSize="lg" fontWeight="bold" color="gray.800">
                          Final Acknowledgement Required
                        </Typography>
                        <Typography fontSize="sm" color="gray.500">
                          Review and sign the acknowledgement to complete your application
                        </Typography>
                      </VStack>
                    </HStack>
                    <Box flexShrink={0}>
                      <Button
                        variant="primary"
                        onClick={() => {
                          if (!partnerData.application) return;
                          const appId = partnerData.application.id ||
                            partnerData.application.caseId ||
                            partnerData.application.Id ||
                            '';
                          if (appId) {
                            router.push(`/partner/acknowledgement/${appId}`);
                          }
                        }}
                        rightIcon={<FiArrowRight size={16} color="white" />}
                        width={{ base: '100%', md: 'auto' }}
                        style={{ color: 'white' }}
                      >
                        Sign Acknowledgement
                      </Button>
                    </Box>
                  </Flex>
                </Card>
              </MotionBox>
            )}
        </VStack>
      </Container>
    </Box>
  );
}

export default function PartnerDashboard() {
  return (
    <Suspense
      fallback={
        <Box p={8}>
          <Spinner />
        </Box>
      }
    >
      <PartnerDashboardContent />
    </Suspense>
  );
}
