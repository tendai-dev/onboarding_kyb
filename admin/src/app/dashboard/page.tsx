"use client";

import { 
  Box, 
  VStack, 
  HStack,
  SimpleGrid,
  Flex,
  Spinner,
  Avatar
} from "@chakra-ui/react";
import { Typography, Card, AlertBar, IconWrapper, ChevronRightIcon, DocumentIcon, WarningIcon, AppIcon } from "@/lib/mukuruImports";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AdminSidebar from "../../components/AdminSidebar";
import PortalHeader from "../../components/PortalHeader";
import { useSidebar } from "../../contexts/SidebarContext";
import { 
  FiFileText, 
  FiClock, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiXCircle,
  FiFile,
  FiTrendingUp,
  FiBarChart,
  FiZap
} from "react-icons/fi";
import { EntityTypeChart, ApplicationTrendsChart, ChartLegend, StatusPieChart } from "../../components/Charts";
import { fetchDashboardStats, fetchEntityTypeDistribution, fetchApplicationTrends, fetchDashboardProjection, DashboardStats, EntityTypeDistribution, DailyTrend } from "../../services";
import { logger } from "../../lib/logger";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { condensed } = useSidebar();
  
  // Debug session in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && session) {
      logger.debug('[Dashboard] Session', {
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
  const userName = session?.user?.name || session?.user?.email || "Admin";
  // Extract first name - if email, get part before @ and split by dot, otherwise get first word
  let firstName = "admin";
  if (userName.includes("@")) {
    // Email format: extract part before @, then get first part before dot
    const emailPart = userName.split("@")[0];
    firstName = emailPart.split(".")[0]?.toLowerCase() || emailPart.toLowerCase();
  } else {
    // Name format: get first word
    firstName = userName.split(" ")[0]?.toLowerCase() || "admin";
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
    successRate: 0
  });
  
  const [entityTypeData, setEntityTypeData] = useState<EntityTypeDistribution[]>([]);
  const [trendsData, setTrendsData] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullDashboard, setFullDashboard] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all dashboard data in parallel with better error handling
      const [statsResult, entityTypesResult, trendsResult, fullDataResult] = await Promise.allSettled([
        fetchDashboardStats(),
        fetchEntityTypeDistribution(),
        fetchApplicationTrends(7),
        fetchDashboardProjection()
      ]);
      
      // Handle stats
      if (statsResult.status === 'fulfilled') {
        setDashboardStats(statsResult.value);
      } else {
        logger.error(statsResult.reason, 'Failed to load dashboard stats', {
          tags: { error_type: 'dashboard_stats_error' }
        });
        setError(statsResult.reason?.message || 'Failed to load dashboard statistics');
      }
      
      // Handle entity types
      if (entityTypesResult.status === 'fulfilled') {
        setEntityTypeData(entityTypesResult.value);
      } else {
        logger.error(entityTypesResult.reason, 'Failed to load entity types', {
          tags: { error_type: 'entity_types_error' }
        });
        // Don't set error for this, just log it
      }
      
      // Handle trends
      if (trendsResult.status === 'fulfilled') {
        setTrendsData(trendsResult.value);
      } else {
        logger.error(trendsResult.reason, 'Failed to load trends', {
          tags: { error_type: 'trends_error' }
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
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data. Please ensure the backend services are running.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare pie chart data
  const pieChartData = [
    { name: 'Pending Review', value: dashboardStats.pendingReview, color: '#3182ce' },
    { name: 'Completed', value: dashboardStats.completed, color: '#38a169' },
    { name: 'Incomplete', value: dashboardStats.incomplete, color: '#dd6b20' },
    { name: 'Risk Review', value: dashboardStats.riskReview, color: '#e53e3e' },
    { name: 'Declined', value: dashboardStats.declined, color: '#718096' }
  ].filter(item => item.value > 0);

  // Don't render until session is loaded to prevent hydration mismatch
  if (status === 'loading') {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <PortalHeader />
        <Box flex="1" ml={condensed ? "72px" : "280px"} mt="90px" display="flex" alignItems="center" justifyContent="center" transition="margin-left 0.3s ease">
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Typography color="gray.600">Loading session...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <PortalHeader />
        <Box flex="1" ml={condensed ? "72px" : "280px"} mt="90px" display="flex" alignItems="center" justifyContent="center" transition="margin-left 0.3s ease">
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Typography color="gray.600">Loading dashboard...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content */}
      <Box 
        flex="1" 
        ml={condensed ? "72px" : "280px"}
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
        bg="gray.50"
        overflowX="hidden"
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        <Box width="full" px="6" py="8">
          <VStack gap="8" align="stretch" width="full">
            {/* Error Message */}
            {error && (
              <AlertBar
                status="error"
                title="API request failed"
                description={error}
              />
            )}
            
            {/* Welcome Section - matching screenshot exactly */}
            <Box mb="6">
              <VStack align="start" gap="2">
                <Typography fontSize="3xl" fontWeight="bold" color="#111827">
                  Hello {firstName}
                </Typography>
                <Typography fontSize="md" color="#374151">
                  Here you'll find everything you need to manage your services, teams and partners
                </Typography>
              </VStack>
            </Box>

            {/* Key Metrics Cards */}
            <Box width="full">
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 6 }} gap="4" width="full" mb="6">
                <Card width="full" bg="white">
                  <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                    <Flex alignItems="center" gap="12px" my="auto">
                      <Avatar.Root bg="mukuru.orange.100/20" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                        <IconWrapper>
                          <DocumentIcon color="#F05423" height="24px" width="24px" />
                        </IconWrapper>
                      </Avatar.Root>
                      <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                        Total Applications
                      </Typography>
                    </Flex>
                    <Box justifySelf="flex-end">
                      <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                    </Box>
                  </Flex>
                  <Typography color="gray.800" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {dashboardStats.totalApplications.toLocaleString()}
                  </Typography>
                </Card>

                <Card width="full" bg="white">
                  <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                    <Flex alignItems="center" gap="12px" my="auto">
                      <Avatar.Root bg="blue.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                        <IconWrapper>
                          <FiClock size={24} color="#3182CE" />
                        </IconWrapper>
                      </Avatar.Root>
                      <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                        Pending Review
                      </Typography>
                    </Flex>
                    <Box justifySelf="flex-end">
                      <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                    </Box>
                  </Flex>
                  <Typography color="blue.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {dashboardStats.pendingReview.toLocaleString()}
                  </Typography>
                </Card>

                <Card width="full" bg="white">
                  <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                    <Flex alignItems="center" gap="12px" my="auto">
                      <Avatar.Root bg="mukuru.orange.100/20" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                        <IconWrapper>
                          <WarningIcon color="#F05423" height="24px" width="24px" />
                        </IconWrapper>
                      </Avatar.Root>
                      <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                        Risk Review
                      </Typography>
                    </Flex>
                    <Box justifySelf="flex-end">
                      <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                    </Box>
                  </Flex>
                  <Typography color="orange.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {dashboardStats.riskReview.toLocaleString()}
                  </Typography>
                </Card>

                <Card width="full" bg="white">
                  <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                    <Flex alignItems="center" gap="12px" my="auto">
                      <Avatar.Root bg="green.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                        <IconWrapper>
                          <FiCheckCircle size={24} color="#38A169" />
                        </IconWrapper>
                      </Avatar.Root>
                      <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                        Completed
                      </Typography>
                    </Flex>
                    <Box justifySelf="flex-end">
                      <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                    </Box>
                  </Flex>
                  <Typography color="green.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {dashboardStats.completed.toLocaleString()}
                  </Typography>
                </Card>

                <Card width="full" bg="white">
                  <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                    <Flex alignItems="center" gap="12px" my="auto">
                      <Avatar.Root bg="mukuru.orange.100/20" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                        <IconWrapper>
                          <DocumentIcon color="#F05423" height="24px" width="24px" />
                        </IconWrapper>
                      </Avatar.Root>
                      <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                        Incomplete
                      </Typography>
                    </Flex>
                    <Box justifySelf="flex-end">
                      <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                    </Box>
                  </Flex>
                  <Typography color="orange.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {dashboardStats.incomplete.toLocaleString()}
                  </Typography>
                </Card>

                <Card width="full" bg="white">
                  <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                    <Flex alignItems="center" gap="12px" my="auto">
                      <Avatar.Root bg="red.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                        <IconWrapper>
                          <FiXCircle size={24} color="#E53E3E" />
                        </IconWrapper>
                      </Avatar.Root>
                      <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                        Declined
                      </Typography>
                    </Flex>
                    <Box justifySelf="flex-end">
                      <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                    </Box>
                  </Flex>
                  <Typography color="red.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {dashboardStats.declined.toLocaleString()}
                  </Typography>
                </Card>
              </SimpleGrid>
            </Box>

            {/* Additional Statistics Cards */}
            <Box width="full">
              <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 4 }} gap="4" width="full">
                <Card width="full" bg="white">
                  <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                    <Flex alignItems="center" gap="12px" my="auto">
                      <Avatar.Root bg="gray.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                        <IconWrapper>
                          <FiClock size={24} color="#9CA3AF" />
                        </IconWrapper>
                      </Avatar.Root>
                      <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                        Avg Processing Time
                      </Typography>
                    </Flex>
                    <Box justifySelf="flex-end">
                      <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                    </Box>
                  </Flex>
                  <Typography color="gray.800" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {dashboardStats.avgProcessingTime > 0 
                      ? `${dashboardStats.avgProcessingTime.toFixed(1)} days`
                      : 'N/A'}
                  </Typography>
                </Card>

                <Card width="full" bg="white">
                  <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                    <Flex alignItems="center" gap="12px" my="auto">
                      <Avatar.Root bg="green.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                        <IconWrapper>
                          <FiTrendingUp size={24} color="#38A169" />
                        </IconWrapper>
                      </Avatar.Root>
                      <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                        Success Rate
                      </Typography>
                    </Flex>
                    <Box justifySelf="flex-end">
                      <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                    </Box>
                  </Flex>
                  <Typography color="green.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {dashboardStats.successRate > 0 
                      ? `${(dashboardStats.successRate * 100).toFixed(1)}%`
                      : '0%'}
                  </Typography>
                </Card>

                <Card width="full" bg="white">
                  <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                    <Flex alignItems="center" gap="12px" my="auto">
                      <Avatar.Root bg="blue.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                        <IconWrapper>
                          <FiZap size={24} color="#3182CE" />
                        </IconWrapper>
                      </Avatar.Root>
                      <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                        New This Month
                      </Typography>
                    </Flex>
                    <Box justifySelf="flex-end">
                      <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                    </Box>
                  </Flex>
                  <Typography color="blue.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {fullDashboard?.cases?.newCasesThisMonth?.toLocaleString() || '0'}
                  </Typography>
                  {fullDashboard?.cases?.newCasesGrowthPercentage !== undefined && (
                    <HStack gap="1" mt="2">
                      <FiTrendingUp size={14} color={fullDashboard.cases.newCasesGrowthPercentage >= 0 ? "#38A169" : "#E53E3E"} />
                      <Typography fontSize="xs" color={fullDashboard.cases.newCasesGrowthPercentage >= 0 ? "green.600" : "red.600"}>
                        {fullDashboard.cases.newCasesGrowthPercentage >= 0 ? '+' : ''}{fullDashboard.cases.newCasesGrowthPercentage.toFixed(1)}% vs last month
                      </Typography>
                    </HStack>
                  )}
                </Card>

                <Card width="full" bg="white">
                  <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                    <Flex alignItems="center" gap="12px" my="auto">
                      <Avatar.Root bg="green.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                        <IconWrapper>
                          <FiBarChart size={24} color="#38A169" />
                        </IconWrapper>
                      </Avatar.Root>
                      <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                        Approval Rate
                      </Typography>
                    </Flex>
                    <Box justifySelf="flex-end">
                      <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                    </Box>
                  </Flex>
                  <Typography color="green.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {fullDashboard?.performance?.approvalRate 
                      ? `${(fullDashboard.performance.approvalRate * 100).toFixed(1)}%`
                      : dashboardStats.totalApplications > 0
                      ? `${((dashboardStats.completed / dashboardStats.totalApplications) * 100).toFixed(1)}%`
                      : '0%'}
                  </Typography>
                </Card>
              </SimpleGrid>
            </Box>

            {/* Charts Section */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6" width="full">
              {/* Application Status Distribution */}
              <Card width="full" bg="white" style={{ width: '100%', height: 'auto' }}>
                <VStack align="start" gap="6" width="full" p="6">
                  <VStack align="start" gap="1" width="full">
                    <Typography fontSize="lg" fontWeight="semibold" color="gray.900">
                      Application Status Distribution
                    </Typography>
                    <Typography fontSize="sm" color="gray.600">
                      Current status breakdown of all applications
                    </Typography>
                  </VStack>
                  
                  {pieChartData.length > 0 ? (
                    <Box width="100%" height="320px" style={{ minWidth: '300px', minHeight: '320px' }}>
                      <StatusPieChart data={pieChartData} />
                    </Box>
                  ) : (
                    <Box width="100%" height="320px" display="flex" alignItems="center" justifyContent="center" bg="gray.50" borderRadius="md">
                      <VStack gap="2">
                        <IconWrapper>
                          <FiFileText size={32} color="#9CA3AF" />
                        </IconWrapper>
                        <Typography color="gray.500" fontSize="sm">No application status data available</Typography>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Card>

              {/* Applications by Entity Type */}
              <Card width="full" bg="white" style={{ width: '100%', height: 'auto' }}>
                <VStack align="start" gap="6" width="full" p="6">
                  <VStack align="start" gap="1" width="full">
                    <Typography fontSize="lg" fontWeight="semibold" color="gray.900">
                      Applications by Entity Type
                    </Typography>
                    <Typography fontSize="sm" color="gray.600">
                      Distribution across business types
                    </Typography>
                  </VStack>
                  
                  {entityTypeData.length > 0 ? (
                    <Box width="100%" height="320px" style={{ minWidth: '300px', minHeight: '320px' }}>
                      <EntityTypeChart data={entityTypeData} height={320} />
                    </Box>
                  ) : (
                    <Box width="100%" height="320px" display="flex" alignItems="center" justifyContent="center" bg="gray.50" borderRadius="md">
                      <VStack gap="2">
                        <IconWrapper>
                          <FiBarChart size={32} color="#9CA3AF" />
                        </IconWrapper>
                        <Typography color="gray.500" fontSize="sm">No entity type data available</Typography>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Card>
            </SimpleGrid>

            {/* Application Trend */}
            <Card width="full" bg="white" style={{ width: '100%', height: 'auto' }}>
              <VStack align="start" gap="6" width="full" p="6">
                <VStack align="start" gap="1" width="full">
                  <Typography fontSize="lg" fontWeight="semibold" color="gray.900">
                    Application Trend
                  </Typography>
                  <Typography fontSize="sm" color="gray.600">
                    New applications over the last 7 days
                  </Typography>
                </VStack>
                
                {trendsData.length > 0 ? (
                  <Box width="100%" height="300px" style={{ minWidth: '300px', minHeight: '300px' }}>
                    <ApplicationTrendsChart data={trendsData} />
                    <Box mt="4">
                      <ChartLegend items={[
                        { name: "Applications", color: "#dd6b20" },
                        { name: "Completed", color: "#38a169" }
                      ]} />
                    </Box>
                  </Box>
                ) : (
                  <Box width="100%" height="300px" display="flex" alignItems="center" justifyContent="center" bg="gray.50" borderRadius="md">
                    <VStack gap="2">
                      <IconWrapper>
                        <FiTrendingUp size={32} color="#9CA3AF" />
                      </IconWrapper>
                      <Typography color="gray.500" fontSize="sm">No trend data available</Typography>
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
