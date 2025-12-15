'use client';

import { Box, VStack, HStack, SimpleGrid, Flex, Spinner, Avatar } from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Typography,
  Card,
  AlertBar,
  IconWrapper,
  DocumentIcon,
  WarningIcon,
} from '@mukuru/mukuru-react-components';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import { useState, useEffect, useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiBarChart,
  FiZap,
} from 'react-icons/fi';
import {
  EntityTypeChart,
  ApplicationTrendsChart,
  ChartLegend,
  StatusPieChart,
} from '../../components/Charts';
import {
  fetchDashboardStats,
  fetchEntityTypeDistribution,
  fetchApplicationTrends,
  fetchDashboardProjection,
  DashboardStats,
  EntityTypeDistribution,
  DailyTrend,
  DashboardProjection,
} from '../../services';
import { logger } from '../../lib/logger';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { condensed } = useSidebar();

  // Color mode values for dark/light mode support - ALL hooks must be called before any conditional returns
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const greyMediumDark = useColorModeValue('mukuru.grey.mediumDark', 'mukuru.grey.300');
  const greyMedium = useColorModeValue('mukuru.grey.medium', 'mukuru.grey.400');
  const avatarBg = useColorModeValue('mukuru.grey.100', 'mukuru.grey.500');

  // Debug session in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && session) {
      // Session debugging in development
      console.info('[Dashboard] Session', {
        hasSession: !!session,
        hasUser: !!session.user,
        userName: session.user?.name,
        userEmail: session.user?.email,
        userId: session.user?.id,
        status,
      });
    }
  }, [session, status]);

  // Get user's name from session - prioritize name, fallback to email
  const userName = session?.user?.name || session?.user?.email || 'Admin';
  // Extract first name - if email, get part before @ and split by dot, otherwise get first word
  let firstName = 'admin';
  if (userName.includes('@')) {
    // Email format: extract part before @, then get first part before dot
    const emailPart = userName.split('@')[0];
    firstName = emailPart.split('.')[0]?.toLowerCase() || emailPart.toLowerCase();
  } else {
    // Name format: get first word
    firstName = userName.split(' ')[0]?.toLowerCase() || 'admin';
  }

  // State for dashboard data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingReview: 0,
    riskReview: 0,
    completed: 0,
    incomplete: 0,
    declined: 0,
    avgProcessingTime: 0,
    successRate: 0,
  });

  const [entityTypeData, setEntityTypeData] = useState<EntityTypeDistribution[]>([]);
  const [trendsData, setTrendsData] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullDashboard, setFullDashboard] = useState<DashboardProjection | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel with better error handling
      const [statsResult, entityTypesResult, trendsResult, fullDataResult] =
        await Promise.allSettled([
          fetchDashboardStats(),
          fetchEntityTypeDistribution(),
          fetchApplicationTrends(7),
          fetchDashboardProjection(),
        ]);

      // Handle stats
      if (statsResult.status === 'fulfilled') {
        setDashboardStats(statsResult.value);
      } else {
        logger.error(statsResult.reason, 'Failed to load dashboard stats', {
          tags: { error_type: 'dashboard_stats_error' },
        });
        setError(statsResult.reason?.message || 'Failed to load dashboard statistics');
      }

      // Handle entity types
      if (entityTypesResult.status === 'fulfilled') {
        setEntityTypeData(entityTypesResult.value);
      } else {
        console.error('Failed to load entity types', entityTypesResult.reason, {
          tags: { error_type: 'entity_types_error' },
        });
        // Don't set error for this, just log it
      }

      // Handle trends
      if (trendsResult.status === 'fulfilled') {
        setTrendsData(trendsResult.value);
      } else {
        console.error('Failed to load trends', trendsResult.reason, {
          tags: { error_type: 'trends_error' },
        });
        // Don't set error for this, just log it
      }

      // Handle full dashboard data
      if (fullDataResult.status === 'fulfilled') {
        setFullDashboard(fullDataResult.value);
      } else {
        console.error('Failed to load full dashboard:', fullDataResult.reason);
        // Don't set error for this, just log it
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load dashboard data. Please ensure the backend services are running.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Prepare pie chart data - memoized to prevent unnecessary recalculations
  const pieChartData = useMemo(
    () =>
      [
        { name: 'Pending Review', value: dashboardStats.pendingReview, color: '#3182ce' },
        { name: 'Completed', value: dashboardStats.completed, color: '#38a169' },
        { name: 'Incomplete', value: dashboardStats.incomplete, color: '#dd6b20' },
        { name: 'Risk Review', value: dashboardStats.riskReview, color: '#e53e3e' },
        { name: 'Declined', value: dashboardStats.declined, color: '#718096' },
      ].filter((item) => item.value > 0),
    [
      dashboardStats.pendingReview,
      dashboardStats.completed,
      dashboardStats.incomplete,
      dashboardStats.riskReview,
      dashboardStats.declined,
    ]
  );

  // Don't render until session is loaded to prevent hydration mismatch
  if (status === 'loading') {
    return (
      <Flex minH="100vh" bg="mukuru.background.light">
        <AdminSidebar />
        <PortalHeader />
        <Box
          flex="1"
          ml={condensed ? '72px' : '280px'}
          mt="90px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="margin-left 0.3s ease"
        >
          <VStack gap="4">
            <Spinner size="xl" color="mukuru.buttons.primary" />
            <Typography color="mukuru.text.primary">Loading session...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (loading) {
    return (
      <Flex minH="100vh" bg={bgColor}>
        <AdminSidebar />
        <PortalHeader />
        <Box
          flex="1"
          ml={condensed ? '72px' : '280px'}
          mt="90px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="margin-left 0.3s ease"
        >
          <VStack gap="4">
            <Spinner size="xl" color="mukuru.buttons.primary" />
            <Typography color={textColor}>Loading dashboard...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg={bgColor}>
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content */}
      <Box
        flex="1"
        ml={condensed ? '72px' : '280px'}
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        bg={bgColor}
        overflowX="hidden"
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        <Box width="full" px="6" py="8">
          <VStack gap="8" align="stretch" width="full">
            {/* Error Message */}
            {error && (
              <AlertBar status="error" title="API request failed" description={error} />
            )}

            {/* Welcome Section - matching screenshot exactly */}
            <Box mb="6">
              <VStack align="start" gap="2">
                <Typography fontSize="3xl" fontWeight="bold" color={textColor}>
                  Hello {firstName}
                </Typography>
                <Typography fontSize="md" color={greyMediumDark}>
                  Here you&apos;ll find everything you need to manage your services, teams
                  and partners
                </Typography>
              </VStack>
            </Box>

            {/* Key Metrics Cards */}
            <Box width="full">
              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
                gap="4"
                width="full"
                mb="6"
              >
                <Card width="full" height="100%">
                  <VStack
                    align="stretch"
                    gap={{ base: 3, md: 4 }}
                    width="100%"
                    height="100%"
                    p={{ base: 4, md: 5 }}
                  >
                    <Flex
                      alignItems="flex-start"
                      justifyContent="space-between"
                      w="100%"
                      gap="2"
                      flexWrap="nowrap"
                    >
                      <Flex
                        alignItems="center"
                        gap={{ base: 2, md: 3 }}
                        flex="1"
                        minW="0"
                      >
                        <Box
                          height={{ base: '28px', md: '36px' }}
                          width={{ base: '28px', md: '36px' }}
                          flexShrink={0}
                        >
                          <Avatar.Root
                            bg="mukuru.orange.100/20"
                            height="100%"
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Box
                              width={{ base: '18px', md: '24px' }}
                              height={{ base: '18px', md: '24px' }}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <DocumentIcon
                                color="#F05423"
                                height="24px"
                                width="24px"
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                              />
                            </Box>
                          </Avatar.Root>
                        </Box>
                        <Box flex="1" minW="0">
                          <Typography
                            color={textColor}
                            fontSize="14px"
                            fontWeight="black"
                            lineHeight="20px"
                            title="Total Applications"
                          >
                            Total Applications
                          </Typography>
                        </Box>
                      </Flex>
                    </Flex>
                    <Typography
                      fontFamily="Madera"
                      fontSize="28px"
                      fontWeight="black"
                      letterSpacing="0%"
                      lineHeight="36px"
                      color={textColor}
                      wordBreak="break-word"
                    >
                      {dashboardStats.totalApplications.toLocaleString()}
                    </Typography>
                  </VStack>
                </Card>

                <Card width="full" height="100%">
                  <VStack
                    align="stretch"
                    gap={{ base: 3, md: 4 }}
                    width="100%"
                    height="100%"
                    p={{ base: 3, md: 4 }}
                  >
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      w="100%"
                      gap="2"
                      flexWrap="nowrap"
                    >
                      <Flex
                        alignItems="center"
                        gap={{ base: 2, md: 3 }}
                        minW="0"
                        flex="1"
                      >
                        <Box
                          height={{ base: '32px', md: '36px' }}
                          width={{ base: '32px', md: '36px' }}
                          flexShrink={0}
                        >
                          <Avatar.Root
                            bg="blue.100"
                            height="100%"
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Box
                              width={{ base: '18px', md: '24px' }}
                              height={{ base: '18px', md: '24px' }}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <FiClock
                                size={24}
                                color="#3182CE"
                                style={{ width: '100%', height: '100%' }}
                              />
                            </Box>
                          </Avatar.Root>
                        </Box>
                        <Box flex="1" minW="0" overflow="hidden">
                          <Typography
                            color={textColor}
                            fontSize="14px"
                            fontWeight="black"
                            lineHeight="20px"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            title="Pending Review"
                          >
                            Pending Review
                          </Typography>
                        </Box>
                      </Flex>
                    </Flex>
                    <Typography
                      color="mukuru.teal"
                      fontFamily="Madera"
                      fontSize="28px"
                      fontWeight="black"
                      letterSpacing="0%"
                      lineHeight="36px"
                      wordBreak="break-word"
                    >
                      {dashboardStats.pendingReview.toLocaleString()}
                    </Typography>
                  </VStack>
                </Card>

                <Card width="full" height="100%">
                  <VStack
                    align="stretch"
                    gap={{ base: 3, md: 4 }}
                    width="100%"
                    height="100%"
                    p={{ base: 3, md: 4 }}
                  >
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      w="100%"
                      gap="2"
                      flexWrap="nowrap"
                    >
                      <Flex
                        alignItems="center"
                        gap={{ base: 2, md: 3 }}
                        minW="0"
                        flex="1"
                      >
                        <Box
                          height={{ base: '32px', md: '36px' }}
                          width={{ base: '32px', md: '36px' }}
                          flexShrink={0}
                        >
                          <Avatar.Root
                            bg="mukuru.orange.100/20"
                            height="100%"
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Box
                              width={{ base: '18px', md: '24px' }}
                              height={{ base: '18px', md: '24px' }}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <WarningIcon
                                color="#F05423"
                                height="24px"
                                width="24px"
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                              />
                            </Box>
                          </Avatar.Root>
                        </Box>
                        <Box flex="1" minW="0" overflow="hidden">
                          <Typography
                            color={textColor}
                            fontSize="14px"
                            fontWeight="black"
                            lineHeight="20px"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            title="Risk Review"
                          >
                            Risk Review
                          </Typography>
                        </Box>
                      </Flex>
                    </Flex>
                    <Typography
                      color="mukuru.buttons.primary"
                      fontFamily="Madera"
                      fontSize="28px"
                      fontWeight="black"
                      letterSpacing="0%"
                      lineHeight="36px"
                      wordBreak="break-word"
                    >
                      {dashboardStats.riskReview.toLocaleString()}
                    </Typography>
                  </VStack>
                </Card>

                <Card width="full" height="100%">
                  <VStack
                    align="stretch"
                    gap={{ base: 3, md: 4 }}
                    width="100%"
                    height="100%"
                    p={{ base: 3, md: 4 }}
                  >
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      w="100%"
                      gap="2"
                      flexWrap="nowrap"
                    >
                      <Flex
                        alignItems="center"
                        gap={{ base: 2, md: 3 }}
                        minW="0"
                        flex="1"
                      >
                        <Box
                          height={{ base: '32px', md: '36px' }}
                          width={{ base: '32px', md: '36px' }}
                          flexShrink={0}
                        >
                          <Avatar.Root
                            bg="green.100"
                            height="100%"
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Box
                              width={{ base: '18px', md: '24px' }}
                              height={{ base: '18px', md: '24px' }}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <FiCheckCircle
                                size={24}
                                color="#38A169"
                                style={{ width: '100%', height: '100%' }}
                              />
                            </Box>
                          </Avatar.Root>
                        </Box>
                        <Box flex="1" minW="0" overflow="hidden">
                          <Typography
                            color={textColor}
                            fontSize="14px"
                            fontWeight="black"
                            lineHeight="20px"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            title="Completed"
                          >
                            Completed
                          </Typography>
                        </Box>
                      </Flex>
                    </Flex>
                    <Typography
                      color="mukuru.text.success"
                      fontFamily="Madera"
                      fontSize="28px"
                      fontWeight="black"
                      letterSpacing="0%"
                      lineHeight="36px"
                      wordBreak="break-word"
                    >
                      {dashboardStats.completed.toLocaleString()}
                    </Typography>
                  </VStack>
                </Card>

                <Card width="full" height="100%">
                  <VStack
                    align="stretch"
                    gap={{ base: 3, md: 4 }}
                    width="100%"
                    height="100%"
                    p={{ base: 3, md: 4 }}
                  >
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      w="100%"
                      gap="2"
                      flexWrap="nowrap"
                    >
                      <Flex
                        alignItems="center"
                        gap={{ base: 2, md: 3 }}
                        minW="0"
                        flex="1"
                      >
                        <Box
                          height={{ base: '32px', md: '36px' }}
                          width={{ base: '32px', md: '36px' }}
                          flexShrink={0}
                        >
                          <Avatar.Root
                            bg="mukuru.orange.100/20"
                            height="100%"
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Box
                              width={{ base: '18px', md: '24px' }}
                              height={{ base: '18px', md: '24px' }}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <DocumentIcon
                                color="#F05423"
                                height="24px"
                                width="24px"
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                              />
                            </Box>
                          </Avatar.Root>
                        </Box>
                        <Box flex="1" minW="0" overflow="hidden">
                          <Typography
                            color={textColor}
                            fontSize="14px"
                            fontWeight="black"
                            lineHeight="20px"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            title="Incomplete"
                          >
                            Incomplete
                          </Typography>
                        </Box>
                      </Flex>
                    </Flex>
                    <Typography
                      color="mukuru.buttons.primary"
                      fontFamily="Madera"
                      fontSize="28px"
                      fontWeight="black"
                      letterSpacing="0%"
                      lineHeight="36px"
                      wordBreak="break-word"
                    >
                      {dashboardStats.incomplete.toLocaleString()}
                    </Typography>
                  </VStack>
                </Card>

                <Card width="full" height="100%">
                  <VStack
                    align="stretch"
                    gap={{ base: 3, md: 4 }}
                    width="100%"
                    height="100%"
                    p={{ base: 3, md: 4 }}
                  >
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      w="100%"
                      gap="2"
                      flexWrap="nowrap"
                    >
                      <Flex
                        alignItems="center"
                        gap={{ base: 2, md: 3 }}
                        minW="0"
                        flex="1"
                      >
                        <Box
                          height={{ base: '32px', md: '36px' }}
                          width={{ base: '32px', md: '36px' }}
                          flexShrink={0}
                        >
                          <Avatar.Root
                            bg="red.100"
                            height="100%"
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Box
                              width={{ base: '18px', md: '24px' }}
                              height={{ base: '18px', md: '24px' }}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <FiXCircle
                                size={24}
                                color="#E53E3E"
                                style={{ width: '100%', height: '100%' }}
                              />
                            </Box>
                          </Avatar.Root>
                        </Box>
                        <Box flex="1" minW="0" overflow="hidden">
                          <Typography
                            color={textColor}
                            fontSize="14px"
                            fontWeight="black"
                            lineHeight="20px"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            title="Declined"
                          >
                            Declined
                          </Typography>
                        </Box>
                      </Flex>
                    </Flex>
                    <Typography
                      color="red.600"
                      fontFamily="Madera"
                      fontSize="28px"
                      fontWeight="black"
                      letterSpacing="0%"
                      lineHeight="36px"
                      wordBreak="break-word"
                    >
                      {dashboardStats.declined.toLocaleString()}
                    </Typography>
                  </VStack>
                </Card>
              </SimpleGrid>
            </Box>

            {/* Additional Statistics Cards */}
            <Box width="full">
              <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 4 }} gap="4" width="full">
                <Card width="full" height="100%">
                  <VStack
                    align="stretch"
                    gap={{ base: 3, md: 4 }}
                    width="100%"
                    height="100%"
                    p={{ base: 3, md: 4 }}
                  >
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      w="100%"
                      gap="2"
                      flexWrap="nowrap"
                    >
                      <Flex
                        alignItems="center"
                        gap={{ base: 2, md: 3 }}
                        minW="0"
                        flex="1"
                      >
                        <Box
                          height={{ base: '32px', md: '36px' }}
                          width={{ base: '32px', md: '36px' }}
                          flexShrink={0}
                        >
                          <Avatar.Root
                            bg={avatarBg}
                            height="100%"
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <IconWrapper>
                              <FiClock size={24} color="#9CA3AF" />
                            </IconWrapper>
                          </Avatar.Root>
                        </Box>
                        <Typography
                          color={textColor}
                          fontSize="14px"
                          fontWeight="black"
                          lineHeight="20px"
                          wordBreak="break-word"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                          flex="1"
                          minW="0"
                        >
                          Avg Processing Time
                        </Typography>
                      </Flex>
                    </Flex>
                    <Typography
                      fontFamily="Madera"
                      fontSize="28px"
                      fontWeight="black"
                      letterSpacing="0%"
                      lineHeight="36px"
                      color={textColor}
                      wordBreak="break-word"
                    >
                      {dashboardStats.avgProcessingTime > 0
                        ? `${dashboardStats.avgProcessingTime.toFixed(1)} days`
                        : 'N/A'}
                    </Typography>
                  </VStack>
                </Card>

                <Card width="full" height="100%">
                  <VStack
                    align="stretch"
                    gap={{ base: 3, md: 4 }}
                    width="100%"
                    height="100%"
                    p={{ base: 3, md: 4 }}
                  >
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      w="100%"
                      gap="2"
                      flexWrap="nowrap"
                    >
                      <Flex
                        alignItems="center"
                        gap={{ base: 2, md: 3 }}
                        minW="0"
                        flex="1"
                      >
                        <Box
                          height={{ base: '32px', md: '36px' }}
                          width={{ base: '32px', md: '36px' }}
                          flexShrink={0}
                        >
                          <Avatar.Root
                            bg="green.100"
                            height="100%"
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <IconWrapper>
                              <FiTrendingUp size={24} color="#38A169" />
                            </IconWrapper>
                          </Avatar.Root>
                        </Box>
                        <Typography
                          color={textColor}
                          fontSize="14px"
                          fontWeight="black"
                          lineHeight="20px"
                          wordBreak="break-word"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                          flex="1"
                          minW="0"
                        >
                          Success Rate
                        </Typography>
                      </Flex>
                    </Flex>
                    <Typography
                      color="mukuru.text.success"
                      fontFamily="Madera"
                      fontSize="28px"
                      fontWeight="black"
                      letterSpacing="0%"
                      lineHeight="36px"
                      wordBreak="break-word"
                    >
                      {dashboardStats.successRate > 0
                        ? `${(dashboardStats.successRate * 100).toFixed(1)}%`
                        : '0%'}
                    </Typography>
                  </VStack>
                </Card>

                <Card width="full" height="100%">
                  <VStack
                    align="stretch"
                    gap={{ base: 3, md: 4 }}
                    width="100%"
                    height="100%"
                    p={{ base: 3, md: 4 }}
                  >
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      w="100%"
                      gap="2"
                      flexWrap="nowrap"
                    >
                      <Flex
                        alignItems="center"
                        gap={{ base: 2, md: 3 }}
                        minW="0"
                        flex="1"
                      >
                        <Box
                          height={{ base: '32px', md: '36px' }}
                          width={{ base: '32px', md: '36px' }}
                          flexShrink={0}
                        >
                          <Avatar.Root
                            bg="blue.100"
                            height="100%"
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <IconWrapper>
                              <FiZap size={24} color="#3182CE" />
                            </IconWrapper>
                          </Avatar.Root>
                        </Box>
                        <Typography
                          color={textColor}
                          fontSize="14px"
                          fontWeight="black"
                          lineHeight="20px"
                          wordBreak="break-word"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                          flex="1"
                          minW="0"
                        >
                          New This Month
                        </Typography>
                      </Flex>
                    </Flex>
                    <VStack align="start" gap="2">
                      <Typography
                        color="mukuru.teal"
                        fontFamily="Madera"
                        fontSize="28px"
                        fontWeight="black"
                        letterSpacing="0%"
                        lineHeight="36px"
                        wordBreak="break-word"
                      >
                        {fullDashboard?.cases?.newCasesThisMonth?.toLocaleString() || '0'}
                      </Typography>
                      {fullDashboard?.cases?.newCasesGrowthPercentage !== undefined && (
                        <HStack gap="1" flexWrap="wrap">
                          <FiTrendingUp
                            size={14}
                            color={
                              fullDashboard.cases.newCasesGrowthPercentage >= 0
                                ? '#38A169'
                                : '#E53E3E'
                            }
                          />
                          <Typography
                            fontSize="10px"
                            color={
                              fullDashboard.cases.newCasesGrowthPercentage >= 0
                                ? 'green.600'
                                : 'red.600'
                            }
                            wordBreak="break-word"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {fullDashboard.cases.newCasesGrowthPercentage >= 0 ? '+' : ''}
                            {fullDashboard.cases.newCasesGrowthPercentage.toFixed(1)}% vs
                            last month
                          </Typography>
                        </HStack>
                      )}
                    </VStack>
                  </VStack>
                </Card>

                <Card width="full" height="100%">
                  <VStack
                    align="stretch"
                    gap={{ base: 3, md: 4 }}
                    width="100%"
                    height="100%"
                    p={{ base: 3, md: 4 }}
                  >
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      w="100%"
                      gap="2"
                      flexWrap="nowrap"
                    >
                      <Flex
                        alignItems="center"
                        gap={{ base: 2, md: 3 }}
                        minW="0"
                        flex="1"
                      >
                        <Box
                          height={{ base: '32px', md: '36px' }}
                          width={{ base: '32px', md: '36px' }}
                          flexShrink={0}
                        >
                          <Avatar.Root
                            bg="green.100"
                            height="100%"
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <IconWrapper>
                              <FiBarChart size={24} color="#38A169" />
                            </IconWrapper>
                          </Avatar.Root>
                        </Box>
                        <Typography
                          color={textColor}
                          fontSize="14px"
                          fontWeight="black"
                          lineHeight="20px"
                          wordBreak="break-word"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                          flex="1"
                          minW="0"
                        >
                          Approval Rate
                        </Typography>
                      </Flex>
                    </Flex>
                    <Typography
                      color="mukuru.text.success"
                      fontFamily="Madera"
                      fontSize="28px"
                      fontWeight="black"
                      letterSpacing="0%"
                      lineHeight="36px"
                      wordBreak="break-word"
                    >
                      {fullDashboard?.performance?.approvalRate
                        ? `${(fullDashboard.performance.approvalRate * 100).toFixed(1)}%`
                        : dashboardStats.totalApplications > 0
                          ? `${((dashboardStats.completed / dashboardStats.totalApplications) * 100).toFixed(1)}%`
                          : '0%'}
                    </Typography>
                  </VStack>
                </Card>
              </SimpleGrid>
            </Box>

            {/* Charts Section */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6" width="full">
              {/* Application Status Distribution */}
              <Card width="full" height="100%">
                <VStack align="start" gap="6" width="full" p="6">
                  <VStack align="start" gap="1" width="full">
                    <Typography fontSize="lg" fontWeight="semibold" color={textColor}>
                      Application Status Distribution
                    </Typography>
                    <Typography fontSize="sm" color={greyMediumDark}>
                      Current status breakdown of all applications
                    </Typography>
                  </VStack>

                  {pieChartData.length > 0 ? (
                    <Box
                      width="100%"
                      height="320px"
                      style={{ minWidth: '300px', minHeight: '320px' }}
                    >
                      <StatusPieChart data={pieChartData} />
                    </Box>
                  ) : (
                    <Box
                      width="100%"
                      height="320px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="mukuru.background.light"
                      borderRadius="md"
                    >
                      <VStack gap="2">
                        <IconWrapper>
                          <FiFileText size={32} color="#9CA3AF" />
                        </IconWrapper>
                        <Typography color={greyMedium} fontSize="sm">
                          No application status data available
                        </Typography>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Card>

              {/* Applications by Entity Type */}
              <Card width="full" height="100%">
                <VStack align="start" gap="6" width="full" p="6">
                  <VStack align="start" gap="1" width="full">
                    <Typography fontSize="lg" fontWeight="semibold" color={textColor}>
                      Applications by Entity Type
                    </Typography>
                    <Typography fontSize="sm" color={greyMediumDark}>
                      Distribution across business types
                    </Typography>
                  </VStack>

                  {entityTypeData.length > 0 ? (
                    <Box
                      width="100%"
                      height="320px"
                      style={{ minWidth: '300px', minHeight: '320px' }}
                    >
                      <EntityTypeChart data={entityTypeData} height={320} />
                    </Box>
                  ) : (
                    <Box
                      width="100%"
                      height="320px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="mukuru.background.light"
                      borderRadius="md"
                    >
                      <VStack gap="2">
                        <IconWrapper>
                          <FiBarChart size={32} color="#9CA3AF" />
                        </IconWrapper>
                        <Typography color={greyMedium} fontSize="sm">
                          No entity type data available
                        </Typography>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Card>
            </SimpleGrid>

            {/* Application Trend */}
            <Card width="full" height="100%">
              <VStack align="start" gap="6" width="full" p="6">
                <VStack align="start" gap="1" width="full">
                  <Typography fontSize="lg" fontWeight="semibold" color={textColor}>
                    Application Trend
                  </Typography>
                  <Typography fontSize="sm" color={greyMediumDark}>
                    New applications over the last 7 days
                  </Typography>
                </VStack>

                {trendsData.length > 0 ? (
                  <Box
                    width="100%"
                    height="300px"
                    style={{ minWidth: '300px', minHeight: '300px' }}
                  >
                    <ApplicationTrendsChart data={trendsData} />
                    <Box mt="4">
                      <ChartLegend
                        items={[
                          { name: 'Applications', color: '#dd6b20' },
                          { name: 'Completed', color: '#38a169' },
                        ]}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box
                    width="100%"
                    height="300px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="mukuru.background.light"
                    borderRadius="md"
                  >
                    <VStack gap="2">
                      <IconWrapper>
                        <FiTrendingUp size={32} color="#9CA3AF" />
                      </IconWrapper>
                      <Typography color={greyMedium} fontSize="sm">
                        No trend data available
                      </Typography>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Card>
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
}
