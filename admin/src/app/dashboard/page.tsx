"use client";

import { 
  Box, 
  VStack, 
  HStack,
  Text,
  SimpleGrid,
  Flex,
  Spinner,
  Icon
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AdminSidebar from "../../components/AdminSidebar";
import { 
  FiFileText, 
  FiClock, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiXCircle,
  FiFile
} from "react-icons/fi";
import { EntityTypeChart, ApplicationTrendsChart, ChartLegend } from "../../components/Charts";
import dashboardApi, { DashboardStats, EntityTypeDistribution, DailyTrend } from "../../lib/dashboardApi";

export default function AdminDashboard() {
  const { data: session } = useSession();
  
  // Get user's first name from session
  const userName = session?.user?.name || "User";
  const firstName = userName.split(" ")[0];
  
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all dashboard data in parallel
      const [stats, entityTypes, trends] = await Promise.all([
        dashboardApi.getDashboardStats(),
        dashboardApi.getEntityTypeDistribution(),
        dashboardApi.getApplicationTrends(7)
      ]);
      
      setDashboardStats(stats);
      setEntityTypeData(entityTypes);
      setTrendsData(trends);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="240px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Text color="gray.600">Loading dashboard data...</Text>
          </VStack>
        </Box>
      </Flex>
    );
  }


  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <Box flex="1" ml="240px">
        {/* Top Header */}
       

        {/* Main Content Area */}
        <Box p="6" bg="gray.50">
        <VStack gap="6" align="stretch">
            {/* Error Message */}
            {error && (
              <Box
                p="4"
                bg="red.50"
                border="1px"
                borderColor="red.200"
                borderRadius="md"
                color="red.700"
              >
                <HStack gap="2">
                  <Icon as={FiAlertTriangle} boxSize="5" />
                  <Text fontWeight="medium">{error}</Text>
                </HStack>
              </Box>
            )}
            
            {/* Welcome Section */}
          <Box>
              <VStack align="start" gap="2" mb="6">
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">Welcome, {firstName}</Text>
                <Text fontSize="md" color="gray.600">Monitor KYB applications and manage compliance workflows</Text>
              </VStack>
            </Box>

            {/* Key Metrics Cards */}
            <Box>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 6 }} gap="4">
                <Box 
                  bg="white" 
                  p="4" 
                  borderRadius="lg" 
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  border="1px" 
                  borderColor="gray.200"
                  _hover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="3">
                    <HStack gap="3" align="center" width="full">
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" whiteSpace="nowrap">Total Applications</Text>
                      <FiFileText size={16} color="#6B7280" />
                    </HStack>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.900">{dashboardStats.totalApplications}</Text>
                  </VStack>
                </Box>
              
                <Box 
                  bg="white" 
                  p="4" 
                  borderRadius="lg" 
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  border="1px" 
                  borderColor="gray.200"
                  _hover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="3">
                    <HStack gap="3" align="center" width="full">
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" whiteSpace="nowrap">Pending Review</Text>
                      <FiClock size={16} color="#3182ce" />
                    </HStack>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">{dashboardStats.pendingReview}</Text>
                  </VStack>
                </Box>

                <Box 
                  bg="white" 
                  p="4" 
                  borderRadius="lg" 
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  border="1px" 
                  borderColor="gray.200"
                  _hover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="3">
                    <HStack gap="3" align="center" width="full">
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" whiteSpace="nowrap">Risk Review</Text>
                      <FiAlertTriangle size={16} color="#d69e2e" />
                    </HStack>
                    <Text fontSize="2xl" fontWeight="bold" color="orange.500">{dashboardStats.riskReview}</Text>
                  </VStack>
                </Box>

                <Box 
                  bg="white" 
                  p="4" 
                  borderRadius="lg" 
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  border="1px" 
                  borderColor="gray.200"
                  _hover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="3">
                    <HStack gap="3" align="center" width="full">
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" whiteSpace="nowrap">Completed</Text>
                      <FiCheckCircle size={16} color="#38a169" />
                    </HStack>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">{dashboardStats.completed}</Text>
                  </VStack>
                </Box>
              
                <Box 
                  bg="white" 
                  p="4" 
                  borderRadius="lg" 
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  border="1px" 
                  borderColor="gray.200"
                  _hover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="3">
                    <HStack gap="3" align="center" width="full">
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" whiteSpace="nowrap">Incomplete</Text>
                      <FiFile size={16} color="#dd6b20" />
                    </HStack>
                    <Text fontSize="2xl" fontWeight="bold" color="orange.500">{dashboardStats.incomplete}</Text>
                  </VStack>
                </Box>
              
                <Box 
                  bg="white" 
                  p="4" 
                  borderRadius="lg" 
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  border="1px" 
                  borderColor="gray.200"
                  _hover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="3">
                    <HStack gap="3" align="center" width="full">
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" whiteSpace="nowrap">Declined</Text>
                      <FiXCircle size={16} color="#e53e3e" />
                    </HStack>
                    <Text fontSize="2xl" fontWeight="bold" color="red.500">{dashboardStats.declined}</Text>
                  </VStack>
                </Box>
            </SimpleGrid>
          </Box>

            {/* Charts Section */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap="8">
              {/* Application Status Distribution */}
          <Box>
                <Box bg="white" p="4" borderRadius="lg" boxShadow="sm" border="1px" borderColor="gray.200">
                  <VStack align="start" gap="3">
                    <VStack align="start" gap="1">
                      <Text fontSize="md" fontWeight="semibold" color="gray.800">Application Status Distribution</Text>
                      <Text fontSize="sm" color="gray.600">Current status breakdown of all applications</Text>
                    </VStack>
                    
                    {/* Pie Chart with Adjacent Labels */}
                    <Box width="320px" height="320px" position="relative" mx="auto">
                      <Box 
                        width="260px" 
                        height="260px" 
                        bg="gray.100" 
                        position="relative" 
                        overflow="visible"
                        borderRadius="50%"
                        mx="auto"
                      >
                        {/* Pie segments */}
                        <Box
                          position="absolute"
                          top="0"
                          left="0"
                          width="100%"
                          height="100%"
                          borderRadius="50%"
                          background="conic-gradient(
                            #3182ce 0deg 90deg,
                            #38a169 90deg 180deg,
                            #e53e3e 180deg 270deg,
                            #dd6b20 270deg 360deg
                          )"
                        />
                        <Box 
                          width="130px" 
                          height="130px" 
                          bg="white" 
                          position="absolute" 
                          top="50%" 
                          left="50%" 
                          transform="translate(-50%, -50%)" 
                          borderRadius="50%"
                        />
                      </Box>
                      
                      {/* Labels positioned adjacent to slices */}
                      <Text 
                        position="absolute" 
                        top="20px" 
                        right="-60px" 
                        fontSize="sm" 
                        fontWeight="medium" 
                        color="blue.500"
                        whiteSpace="nowrap"
                      >
                        Submitted {dashboardStats.totalApplications > 0 ? Math.round((dashboardStats.pendingReview / dashboardStats.totalApplications) * 100) : 0}%
                      </Text>
                      
                      <Text 
                        position="absolute" 
                        top="20px" 
                        left="-60px" 
                        fontSize="sm" 
                        fontWeight="medium" 
                        color="orange.500"
                        whiteSpace="nowrap"
                      >
                        In Progress {dashboardStats.totalApplications > 0 ? Math.round((dashboardStats.incomplete / dashboardStats.totalApplications) * 100) : 0}%
                      </Text>
                      
                      <Text 
                        position="absolute" 
                        bottom="20px" 
                        left="-60px" 
                        fontSize="sm" 
                        fontWeight="medium" 
                        color="red.500"
                        whiteSpace="nowrap"
                      >
                        Risk Review {dashboardStats.totalApplications > 0 ? Math.round((dashboardStats.riskReview / dashboardStats.totalApplications) * 100) : 0}%
                      </Text>
                      
                      <Text 
                        position="absolute" 
                        bottom="20px" 
                        right="-60px" 
                        fontSize="sm" 
                        fontWeight="medium" 
                        color="green.500"
                        whiteSpace="nowrap"
                      >
                        Complete {dashboardStats.totalApplications > 0 ? Math.round((dashboardStats.completed / dashboardStats.totalApplications) * 100) : 0}%
                      </Text>
                    </Box>
                  </VStack>
                </Box>
              </Box>

              {/* Applications by Entity Type */}
              <Box>
                <Box 
                  bg="white" 
                  p="4" 
                  borderRadius="lg" 
                  boxShadow="sm" 
                  border="1px" 
                  borderColor="gray.200"
                >
                  <VStack align="start" gap="3">
                    <VStack align="start" gap="1">
                      <Text fontSize="md" fontWeight="semibold" color="gray.800">Applications by Entity Type</Text>
                      <Text fontSize="sm" color="gray.600">Distribution across business types</Text>
                    </VStack>
                    
                    {/* Working Bar Chart */}
                    {entityTypeData.length > 0 ? (
                      <EntityTypeChart data={entityTypeData} height={320} />
                    ) : (
                      <Box height="320px" display="flex" alignItems="center" justifyContent="center">
                        <Text color="gray.500">No entity type data available</Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </Box>
            </SimpleGrid>

            {/* Application Trend */}
          <Box>
              <Box 
                bg="white" 
                p="8" 
                borderRadius="xl" 
                boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                border="1px" 
                borderColor="gray.100"
              >
                <VStack align="start" gap="6">
                  <VStack align="start" gap="2">
                    <Text fontSize="xl" fontWeight="bold" color="gray.900">Application Trend</Text>
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">New applications over the last 7 days</Text>
                  </VStack>
                  
                  {/* Working Line Chart */}
                  {trendsData.length > 0 ? (
                    <>
                      <ApplicationTrendsChart data={trendsData} />
                      <ChartLegend items={[
                        { name: "Applications", color: "#dd6b20" },
                        { name: "Completed", color: "#38a169" }
                      ]} />
                    </>
                  ) : (
                    <Box height="300px" display="flex" alignItems="center" justifyContent="center">
                      <Text color="gray.500">No trend data available</Text>
                    </Box>
                  )}
                </VStack>
              </Box>
          </Box>
        </VStack>
        </Box>
    </Box>
    </Flex>
  );
}
