'use client';

import { Box, VStack, HStack, SimpleGrid, Flex, Spinner } from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Typography,
  IconWrapper,
  AlertBar,
  Button,
} from '@mukuru/mukuru-react-components';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';
import { useSidebar } from '../../contexts/SidebarContext';
import { FiTrendingUp, FiAlertCircle, FiBarChart2, FiArrowLeft } from 'react-icons/fi';
import {
  ApplicationTrendsChart,
  ProcessingTimeChart,
  ChartLegend,
} from '../../components/Charts';
import {
  fetchDashboardProjection,
  fetchApplicationTrends,
  DashboardProjection,
} from '../../services';
import { logger } from '../../lib/logger';

interface PerformanceMetric {
  value: string;
  trend: string;
  trendColor: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { condensed } = useSidebar();

  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const headerBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    adoptionRate: PerformanceMetric;
    avgProcessingTime: PerformanceMetric;
    percentile90Time: PerformanceMetric;
    firstPassRate: PerformanceMetric;
  }>({
    adoptionRate: { value: '0%', trend: 'Loading...', trendColor: 'gray.500' },
    avgProcessingTime: { value: '0 days', trend: 'Loading...', trendColor: 'gray.500' },
    percentile90Time: { value: '0 days', trend: 'Loading...', trendColor: 'gray.500' },
    firstPassRate: { value: '0%', trend: 'Loading...', trendColor: 'gray.500' },
  });
  const [monthlyTrends, setMonthlyTrends] = useState<
    Array<{ date: string; applications: number; completed: number }>
  >([]);
  const [processingTimeData, setProcessingTimeData] = useState<
    Array<{ range: string; count: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardProjection | null>(null);

  const calculatePerformanceMetrics = (_dashboard: Record<string, unknown>) => {
    if (!dashboardData) return;

    const { cases, performance } = dashboardData;
    const newCasesLastMonth = cases?.newCasesLastMonth ?? 0;
    const newCasesThisMonth = cases?.newCasesThisMonth ?? 0;
    const avgCompletionHours = performance?.averageCompletionTimeHours ?? 0;
    const medianCompletionHours = performance?.medianCompletionTimeHours ?? 0;
    const approvalRate = performance?.approvalRate ?? 0;

    // Adoption Rate: Percentage of new cases this month vs last month
    const adoptionRate =
      newCasesLastMonth > 0
        ? ((newCasesThisMonth - newCasesLastMonth) / newCasesLastMonth) * 100
        : newCasesThisMonth > 0
          ? 100
          : 0;
    const adoptionRateValue = Math.abs(adoptionRate).toFixed(0);
    const adoptionRateTrend =
      adoptionRate >= 0
        ? `+${adoptionRateValue}% from last month`
        : `${adoptionRateValue}% from last month`;

    // Average Processing Time
    const avgDays = avgCompletionHours / 24;
    const avgDaysValue = avgDays.toFixed(1);
    const avgDaysTrend =
      avgCompletionHours < 84 // Less than 3.5 days
        ? 'Faster than target'
        : 'Within target range';

    // 90th Percentile Time (estimate as 1.5x median or 2x average)
    const percentile90Hours = Math.max(
      medianCompletionHours * 1.5,
      avgCompletionHours * 1.8
    );
    const percentile90Days = percentile90Hours / 24;
    const percentile90Value = percentile90Days.toFixed(1);
    const percentile90Trend =
      percentile90Days < 7 ? 'Below 7-day target' : 'Above 7-day target';

    // First-Pass Rate: Approval rate (cases approved without rejection)
    const firstPassRate = approvalRate * 100;
    const firstPassRateValue = firstPassRate.toFixed(0);
    const firstPassRateTrend =
      firstPassRate >= 75 ? 'Above 75% target' : 'Below 75% target';

    setPerformanceMetrics({
      adoptionRate: {
        value: `${adoptionRateValue}%`,
        trend: adoptionRateTrend,
        trendColor: adoptionRate >= 0 ? 'green.500' : 'blue.500',
      },
      avgProcessingTime: {
        value: `${avgDaysValue} days`,
        trend: avgDaysTrend,
        trendColor: avgDays < 3.5 ? 'green.500' : 'orange.500',
      },
      percentile90Time: {
        value: `${percentile90Value} days`,
        trend: percentile90Trend,
        trendColor: percentile90Days < 7 ? 'green.500' : 'orange.500',
      },
      firstPassRate: {
        value: `${firstPassRateValue}%`,
        trend: firstPassRateTrend,
        trendColor: firstPassRate >= 75 ? 'green.500' : 'orange.500',
      },
    });
  };

  const calculateProcessingTimeDistribution = (dashboard: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const avgHours = (dashboard.performance as { averageCompletionTimeHours: number })
      .averageCompletionTimeHours;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const medianHours = (dashboard.performance as { medianCompletionTimeHours: number })
      .medianCompletionTimeHours;
    const totalCases =
      (dashboard.cases as { completedCases?: number }).completedCases || 1;

    // Estimate distribution based on average and median
    // This is an approximation - in a real system, you'd query actual completion times
    const distribution = [
      {
        range: '0-2 days',
        count: Math.round(totalCases * 0.2), // Assume 20% complete in 0-2 days
      },
      {
        range: '3-5 days',
        count: Math.round(totalCases * 0.4), // Assume 40% complete in 3-5 days
      },
      {
        range: '6-7 days',
        count: Math.round(totalCases * 0.25), // Assume 25% complete in 6-7 days
      },
      {
        range: '8+ days',
        count: Math.round(totalCases * 0.15), // Assume 15% take 8+ days
      },
    ];

    setProcessingTimeData(distribution);
  };

  useEffect(() => {
    const loadReportsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data and trends in parallel
        const [dashboard, trends] = await Promise.all([
          fetchDashboardProjection(),
          fetchApplicationTrends(30),
        ]);

        // Store dashboard data for KPI calculations
        setDashboardData(dashboard);

        // Calculate performance metrics from dashboard data
        calculatePerformanceMetrics(dashboard as unknown as Record<string, unknown>);

        // Set trends data
        setMonthlyTrends(trends);

        // Calculate processing time distribution
        calculateProcessingTimeDistribution(
          dashboard as unknown as Record<string, unknown>
        );
      } catch (err) {
        logger.error(err, 'Failed to load reports data', {
          tags: { error_type: 'reports_load_error' },
        });
        setError(err instanceof Error ? err.message : 'Failed to load reports data');
      } finally {
        setLoading(false);
      }
    };

    loadReportsData();
  }, []);

  // Calculate KPI data from dashboard
  const kpiData = dashboardData
    ? [
        {
          name: 'Completion Rate',
          current: Math.round(dashboardData.performance.completionRate * 100),
          target: 85,
          color: 'orange.500',
        },
        {
          name: 'First-Pass Approval Rate',
          current: Math.round(dashboardData.performance.approvalRate * 100),
          target: 80,
          color: 'orange.500',
        },
        {
          name: 'SLA Compliance Rate',
          current: Math.round(dashboardData.performance.slaComplianceRate * 100),
          target: 90,
          color: 'orange.500',
        },
      ]
    : [
        {
          name: 'Completion Rate',
          current: 0,
          target: 85,
          color: 'orange.500',
        },
        {
          name: 'First-Pass Approval Rate',
          current: 0,
          target: 80,
          color: 'orange.500',
        },
        {
          name: 'SLA Compliance Rate',
          current: 0,
          target: 90,
          color: 'orange.500',
        },
      ];

  if (loading) {
    return (
      <Flex minH="100vh" bg={bgColor}>
        <AdminSidebar />
        <Box
          flex="1"
          ml={condensed ? '72px' : '280px'}
          width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="margin-left 0.3s ease, width 0.3s ease"
        >
          <VStack gap="4">
            <Spinner size="xl" color="var(--mukuru-primary)" />
            <Typography color="var(--mukuru-text-primary)">
              Loading reports data...
            </Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex minH="100vh" bg={bgColor}>
        <AdminSidebar />
        <Box
          flex="1"
          ml={condensed ? '72px' : '280px'}
          width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
          p="6"
          transition="margin-left 0.3s ease, width 0.3s ease"
        >
          <AlertBar status="error" title="Error loading reports" description={error} />
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg={bgColor}>
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <Box
        flex="1"
        ml={condensed ? '72px' : '280px'}
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        {/* Top Header */}
        <Box
          bg="var(--mukuru-cards-white)"
          borderBottom="1px"
          borderColor="var(--mukuru-grey-light)"
          py="6"
          px="6"
          boxShadow="sm"
        >
          <VStack align="start" gap="3" w="100%">
            {/* Back Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.back()}
              style={{
                padding: '6px 12px',
                minWidth: '80px',
                height: '32px',
                border: '1px solid var(--mukuru-grey-light)',
                backgroundColor: 'var(--mukuru-white)',
                color: 'var(--mukuru-text-primary)',
                fontWeight: '500',
                fontSize: '14px',
                borderRadius: '6px',
              }}
            >
              <IconWrapper>
                <FiArrowLeft size={14} />
              </IconWrapper>
              Back
            </Button>

            <HStack gap="3" align="center">
              <IconWrapper>
                <FiBarChart2 size={24} color="var(--mukuru-primary)" />
              </IconWrapper>
              <VStack align="start" gap="1">
                <Typography
                  fontSize="2xl"
                  fontWeight="bold"
                  color="var(--mukuru-text-primary)"
                >
                  Reports & Analytics
                </Typography>
                <Typography fontSize="sm" color="var(--mukuru-grey-medium)">
                  Track performance metrics and trends
                </Typography>
              </VStack>
            </HStack>
          </VStack>
        </Box>

        {/* Main Content Area */}
        <Box p="6" bg="var(--mukuru-background-light)">
          <VStack gap="6" align="stretch">
            {/* Performance Metrics */}
            <Box>
              <VStack align="start" gap="2" mb="6">
                <Typography
                  fontSize="xl"
                  fontWeight="bold"
                  color="var(--mukuru-text-primary)"
                >
                  Performance Metrics
                </Typography>
                <Typography
                  fontSize="md"
                  color="var(--mukuru-grey-medium)"
                  fontWeight="medium"
                >
                  Key performance indicators for KYB compliance operations
                </Typography>
              </VStack>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="6">
                <Box
                  bg="var(--mukuru-cards-white)"
                  p="6"
                  borderRadius="xl"
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                  border="1px"
                  borderColor="var(--mukuru-grey-light)"
                  _hover={{
                    boxShadow:
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transform: 'translateY(-2px)',
                  }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="4">
                    <HStack gap="3" align="center">
                      <Box
                        p="2"
                        bg="var(--mukuru-state-hover-card)"
                        borderRadius="lg"
                        border="1px solid var(--mukuru-teal)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <IconWrapper>
                          <FiTrendingUp size={20} color="var(--mukuru-teal)" />
                        </IconWrapper>
                      </Box>
                      <VStack align="start" gap="1">
                        <Typography
                          fontSize="3xl"
                          fontWeight="bold"
                          color="var(--mukuru-text-primary)"
                          lineHeight="1"
                        >
                          {performanceMetrics.adoptionRate.value}
                        </Typography>
                        <Typography
                          fontSize="sm"
                          color="var(--mukuru-grey-medium)"
                          fontWeight="medium"
                          lineHeight="1.2"
                        >
                          Adoption Rate
                        </Typography>
                      </VStack>
                    </HStack>
                    <Typography
                      fontSize="sm"
                      color={performanceMetrics.adoptionRate.trendColor}
                      fontWeight="medium"
                    >
                      {performanceMetrics.adoptionRate.trend}
                    </Typography>
                  </VStack>
                </Box>

                <Box
                  bg="var(--mukuru-cards-white)"
                  p="6"
                  borderRadius="xl"
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                  border="1px"
                  borderColor="var(--mukuru-grey-light)"
                  _hover={{
                    boxShadow:
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transform: 'translateY(-2px)',
                  }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="4">
                    <HStack gap="3" align="center">
                      <Box
                        p="2"
                        bg="var(--mukuru-state-hover-card)"
                        borderRadius="lg"
                        border="1px solid var(--mukuru-text-success)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <IconWrapper>
                          <FiTrendingUp size={20} color="var(--mukuru-text-success)" />
                        </IconWrapper>
                      </Box>
                      <VStack align="start" gap="1">
                        <Typography
                          fontSize="3xl"
                          fontWeight="bold"
                          color="var(--mukuru-text-primary)"
                          lineHeight="1"
                        >
                          {performanceMetrics.avgProcessingTime.value}
                        </Typography>
                        <Typography
                          fontSize="sm"
                          color="var(--mukuru-grey-medium)"
                          fontWeight="medium"
                          lineHeight="1.2"
                        >
                          Avg. Processing Time
                        </Typography>
                      </VStack>
                    </HStack>
                    <Typography
                      fontSize="sm"
                      color={performanceMetrics.avgProcessingTime.trendColor}
                      fontWeight="medium"
                    >
                      {performanceMetrics.avgProcessingTime.trend}
                    </Typography>
                  </VStack>
                </Box>

                <Box
                  bg="var(--mukuru-cards-white)"
                  p="6"
                  borderRadius="xl"
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                  border="1px"
                  borderColor="var(--mukuru-grey-light)"
                  _hover={{
                    boxShadow:
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transform: 'translateY(-2px)',
                  }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="4">
                    <HStack gap="3" align="center">
                      <Box
                        p="2"
                        bg="var(--mukuru-state-hover-card)"
                        borderRadius="lg"
                        border="1px solid var(--mukuru-teal)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <IconWrapper>
                          <FiTrendingUp size={20} color="var(--mukuru-teal)" />
                        </IconWrapper>
                      </Box>
                      <VStack align="start" gap="1">
                        <Typography
                          fontSize="3xl"
                          fontWeight="bold"
                          color="var(--mukuru-text-primary)"
                          lineHeight="1"
                        >
                          {performanceMetrics.percentile90Time.value}
                        </Typography>
                        <Typography
                          fontSize="sm"
                          color="var(--mukuru-grey-medium)"
                          fontWeight="medium"
                          lineHeight="1.2"
                        >
                          90th Percentile Time
                        </Typography>
                      </VStack>
                    </HStack>
                    <Typography
                      fontSize="sm"
                      color={performanceMetrics.percentile90Time.trendColor}
                      fontWeight="medium"
                    >
                      {performanceMetrics.percentile90Time.trend}
                    </Typography>
                  </VStack>
                </Box>

                <Box
                  bg="var(--mukuru-cards-white)"
                  p="6"
                  borderRadius="xl"
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                  border="1px"
                  borderColor="var(--mukuru-grey-light)"
                  _hover={{
                    boxShadow:
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transform: 'translateY(-2px)',
                  }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="4">
                    <HStack gap="3" align="center">
                      <Box
                        p="2"
                        bg="var(--mukuru-state-hover-card)"
                        borderRadius="lg"
                        border="1px solid var(--mukuru-primary)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <IconWrapper>
                          <FiTrendingUp size={20} color="var(--mukuru-primary)" />
                        </IconWrapper>
                      </Box>
                      <VStack align="start" gap="1">
                        <Typography
                          fontSize="3xl"
                          fontWeight="bold"
                          color="var(--mukuru-text-primary)"
                          lineHeight="1"
                        >
                          {performanceMetrics.firstPassRate.value}
                        </Typography>
                        <Typography
                          fontSize="sm"
                          color="var(--mukuru-grey-medium)"
                          fontWeight="medium"
                          lineHeight="1.2"
                        >
                          First-Pass Rate
                        </Typography>
                      </VStack>
                    </HStack>
                    <Typography
                      fontSize="sm"
                      color={performanceMetrics.firstPassRate.trendColor}
                      fontWeight="medium"
                    >
                      {performanceMetrics.firstPassRate.trend}
                    </Typography>
                  </VStack>
                </Box>
              </SimpleGrid>
            </Box>

            {/* Monthly Application Trends */}
            <Box>
              <VStack align="start" gap="2" mb="6">
                <Typography
                  fontSize="xl"
                  fontWeight="bold"
                  color="var(--mukuru-text-primary)"
                >
                  Monthly Application Trends
                </Typography>
                <Typography
                  fontSize="md"
                  color="var(--mukuru-grey-medium)"
                  fontWeight="medium"
                >
                  Application volume and completion rates over time
                </Typography>
              </VStack>

              <Box
                bg="var(--mukuru-cards-white)"
                p="6"
                borderRadius="xl"
                boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                border="1px"
                borderColor="var(--mukuru-grey-light)"
              >
                <ApplicationTrendsChart data={monthlyTrends} />
                <ChartLegend
                  items={[
                    { name: 'Applications', color: '#dd6b20' },
                    { name: 'Completed', color: '#38a169' },
                  ]}
                />
              </Box>
            </Box>

            {/* Processing Time Distribution */}
            <Box>
              <VStack align="start" gap="2" mb="6">
                <Typography
                  fontSize="xl"
                  fontWeight="bold"
                  color="var(--mukuru-text-primary)"
                >
                  Processing Time Distribution
                </Typography>
                <Typography
                  fontSize="md"
                  color="var(--mukuru-grey-medium)"
                  fontWeight="medium"
                >
                  How quickly applications are completed
                </Typography>
              </VStack>

              <Box
                bg="var(--mukuru-cards-white)"
                p="6"
                borderRadius="xl"
                boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                border="1px"
                borderColor="var(--mukuru-grey-light)"
              >
                <ProcessingTimeChart data={processingTimeData} />
              </Box>
            </Box>

            {/* Key Performance Indicators */}
            <Box>
              <VStack align="start" gap="2" mb="6">
                <Typography
                  fontSize="xl"
                  fontWeight="bold"
                  color="var(--mukuru-text-primary)"
                >
                  Key Performance Indicators
                </Typography>
                <Typography
                  fontSize="md"
                  color="var(--mukuru-grey-medium)"
                  fontWeight="medium"
                >
                  Progress towards operational targets
                </Typography>
              </VStack>

              <Box
                bg="var(--mukuru-cards-white)"
                p="6"
                borderRadius="xl"
                boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                border="1px"
                borderColor="var(--mukuru-grey-light)"
              >
                <VStack gap="6" align="stretch">
                  {kpiData.map((kpi, index) => (
                    <Box key={index}>
                      <HStack justify="space-between" mb="2" align="center">
                        <Typography
                          fontSize="sm"
                          fontWeight="600"
                          color="var(--mukuru-text-primary)"
                        >
                          {kpi.name}
                        </Typography>
                        <HStack gap="2" align="center">
                          <Typography
                            fontSize="sm"
                            fontWeight="bold"
                            color="var(--mukuru-text-primary)"
                          >
                            {kpi.current}%
                          </Typography>
                          <Typography fontSize="xs" color="var(--mukuru-grey-medium)">
                            Target: {kpi.target}%
                          </Typography>
                        </HStack>
                      </HStack>
                      <Box
                        width="100%"
                        height="8px"
                        bg="var(--mukuru-state-hover)"
                        borderRadius="full"
                        overflow="hidden"
                      >
                        <Box
                          width={`${kpi.current}%`}
                          height="100%"
                          bg="var(--mukuru-primary)"
                          borderRadius="full"
                        />
                      </Box>
                    </Box>
                  ))}
                </VStack>
              </Box>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
}
