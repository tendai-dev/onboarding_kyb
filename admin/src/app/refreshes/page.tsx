"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  SimpleGrid,
  Flex,
  Spinner
} from "@chakra-ui/react";
import { Search, Typography, Button, Tag, IconWrapper, Input } from "@/lib/mukuruImports";
import { 
  FiSearch, 
  FiFilter, 
  FiRefreshCw, 
  FiCalendar,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiUser,
  FiSettings
} from "react-icons/fi";
import { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "../../components/AdminSidebar";
import {
  fetchItemsDueForRefresh,
  getWorkItems,
  markForRefreshUseCase,
  WorkItemDto,
} from "../../services";
import { logger } from "../../lib/logger";
import { SweetAlert } from "../../utils/sweetAlert";

interface Refresh {
  id: string;
  applicationId: string;
  companyName: string;
  entityType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SCHEDULED' | 'DUE' | 'OVERDUE' | 'IN_PROGRESS' | 'COMPLETED';
  lastRefreshDate: string;
  nextRefreshDate: string;
  refreshCycle: 'ANNUAL' | 'BIENNIAL' | 'TRIENNIAL' | 'AD_HOC';
  assignedTo: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  country: string;
  riskScore: number;
  workItemId?: string;
  workItemNumber?: string;
}

function mapWorkItemToRefresh(workItem: WorkItemDto): Refresh {
  // Determine refresh status based on nextRefreshDate and current date
  let status: Refresh['status'] = 'SCHEDULED';
  const now = new Date();
  const nextRefresh = workItem.nextRefreshDate ? new Date(workItem.nextRefreshDate) : null;
  
  if (workItem.status === 'DueForRefresh') {
    status = 'IN_PROGRESS';
  } else if (nextRefresh) {
    const daysUntilDue = Math.ceil((nextRefresh.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 0) {
      status = 'OVERDUE';
    } else if (daysUntilDue <= 30) {
      status = 'DUE';
    } else {
      status = 'SCHEDULED';
    }
  }

  // Map risk level
  const riskLevel = workItem.riskLevel.toUpperCase() as Refresh['riskLevel'];
  
  // Map priority
  let priority: Refresh['priority'] = 'MEDIUM';
  if (workItem.priority === 'Urgent') {
    priority = 'URGENT';
  } else if (workItem.priority === 'High') {
    priority = 'HIGH';
  } else if (workItem.priority === 'Low') {
    priority = 'LOW';
  }

  // Determine refresh cycle based on last refresh and next refresh dates
  let refreshCycle: Refresh['refreshCycle'] = 'ANNUAL';
  if (workItem.lastRefreshedAt && workItem.nextRefreshDate) {
    const lastRefresh = new Date(workItem.lastRefreshedAt);
    const nextRefresh = new Date(workItem.nextRefreshDate);
    const yearsBetween = (nextRefresh.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (yearsBetween >= 2.5) {
      refreshCycle = 'TRIENNIAL';
    } else if (yearsBetween >= 1.5) {
      refreshCycle = 'BIENNIAL';
    } else {
      refreshCycle = 'ANNUAL';
    }
  }

  // Calculate risk score from risk level
  const riskScoreMap: Record<string, number> = {
    'LOW': 25,
    'MEDIUM': 50,
    'HIGH': 75,
    'CRITICAL': 95,
  };
  const riskScore = riskScoreMap[riskLevel] || 50;

  return {
    id: workItem.id,
    applicationId: workItem.applicationId,
    companyName: workItem.applicantName || 'Unknown',
    entityType: workItem.entityType || 'Unknown',
    riskLevel,
    status,
    lastRefreshDate: workItem.lastRefreshedAt || workItem.createdAt,
    nextRefreshDate: workItem.nextRefreshDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    refreshCycle,
    assignedTo: workItem.assignedToName || workItem.assignedTo || 'Unassigned',
    priority,
    country: workItem.country || 'Unknown',
    riskScore,
    workItemId: workItem.id,
    workItemNumber: workItem.workItemNumber,
  };
}

interface RefreshSettings {
  lowRiskCycle: 'ANNUAL' | 'BIENNIAL' | 'TRIENNIAL';
  mediumRiskCycle: 'ANNUAL' | 'BIENNIAL' | 'TRIENNIAL';
  highRiskCycle: 'ANNUAL' | 'BIENNIAL' | 'TRIENNIAL';
  criticalRiskCycle: 'ANNUAL' | 'BIENNIAL' | 'TRIENNIAL';
  dueDaysThreshold: number; // Days before refresh date to mark as "Due"
  enableAutoRefresh: boolean;
  refreshJobSchedule: string; // Cron schedule
}

export default function RefreshesPage() {
  const [refreshes, setRefreshes] = useState<Refresh[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settings, setSettings] = useState<RefreshSettings>({
    lowRiskCycle: 'TRIENNIAL',
    mediumRiskCycle: 'ANNUAL',
    highRiskCycle: 'ANNUAL',
    criticalRiskCycle: 'ANNUAL',
    dueDaysThreshold: 30,
    enableAutoRefresh: true,
    refreshJobSchedule: '0 2 * * *' // Daily at 2 AM UTC
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadRefreshes();
  }, []);

  const loadRefreshes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get items due for refresh from backend
      const result = await fetchItemsDueForRefresh(1, 100);
      const mappedRefreshes = result.items.map(mapWorkItemToRefresh);
      
      // Also get all work items to include those that might be in progress or completed
      const allItemsResult = await getWorkItems({
        page: 1,
        pageSize: 100
      });
      
      // Combine and deduplicate by ID
      const allRefreshes = [
        ...mappedRefreshes,
        ...allItemsResult.items
          .filter(item => item.nextRefreshDate || item.lastRefreshedAt)
          .map(mapWorkItemToRefresh)
      ];
      
      const uniqueRefreshes = Array.from(
        new Map(allRefreshes.map(item => [item.id, item])).values()
      );
      
      setRefreshes(uniqueRefreshes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load refreshes';
      setError(errorMessage);
      logger.error(err, 'Error loading refreshes', {
        tags: { error_type: 'refreshes_load_error' }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'blue';
      case 'DUE': return 'orange';
      case 'OVERDUE': return 'red';
      case 'IN_PROGRESS': return 'purple';
      case 'COMPLETED': return 'green';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'blue';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HIGH': return 'red';
      case 'CRITICAL': return 'red';
      default: return 'gray';
    }
  };

  const getCycleColor = (cycle: string) => {
    switch (cycle) {
      case 'ANNUAL': return 'blue';
      case 'BIENNIAL': return 'orange';
      case 'TRIENNIAL': return 'green';
      case 'AD_HOC': return 'purple';
      default: return 'gray';
    }
  };

  const filteredRefreshes = refreshes.filter(refresh => {
    const matchesSearch = refresh.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         refresh.applicationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || refresh.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const overdueCount = refreshes.filter(r => r.status === 'OVERDUE').length;
  const dueCount = refreshes.filter(r => r.status === 'DUE').length;
  const inProgressCount = refreshes.filter(r => r.status === 'IN_PROGRESS').length;
  const completedCount = refreshes.filter(r => r.status === 'COMPLETED').length;

  if (loading) {
    return (
      <Box>
        <AdminSidebar />
        <Box ml="240px" p="8" bg="gray.50" minH="100vh">
          <Flex justify="center" align="center" h="400px">
            <Spinner size="xl" color="orange.500" />
          </Flex>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <AdminSidebar />
      <Box ml="240px" p="8" bg="gray.50" minH="100vh">
      <Container maxW="7xl">
        <VStack gap="6" align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Typography fontSize="3xl" fontWeight="bold" color="gray.800">
                Refreshes
              </Typography>
              <Typography color="gray.600">
                Manage periodic partner and customer refreshes
              </Typography>
            </VStack>
            
            <HStack gap="3">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadRefreshes}
              >
                <IconWrapper><FiRefreshCw size={16} /></IconWrapper>
                Refresh
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSettingsModalOpen(true)}
              >
                <IconWrapper><FiSettings size={16} /></IconWrapper>
                Refresh Settings
              </Button>
            </HStack>
          </Flex>

          {/* Error Alert */}
          {error && (
            <Box bg="red.50" p="4" borderRadius="lg" border="1px" borderColor="red.200">
              <Typography color="red.800" fontWeight="semibold">
                Error: {error}
              </Typography>
            </Box>
          )}

          {/* Alerts */}
          {overdueCount > 0 && (
            <Box bg="red.50" p="4" borderRadius="lg" border="1px" borderColor="red.200">
              <HStack gap="3">
                <IconWrapper><FiAlertTriangle size={20} color="#E53E3E" /></IconWrapper>
                <VStack align="start" gap="1">
                  <Typography fontWeight="semibold" color="red.800">
                    Overdue Refreshes
                  </Typography>
                  <Typography fontSize="sm" color="red.700">
                    {overdueCount} refreshes are overdue and require immediate attention
                  </Typography>
                </VStack>
              </HStack>
            </Box>
          )}

          {/* Summary Cards */}
          <SimpleGrid columns={{ base: 1, md: 4 }} gap="4">
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <IconWrapper><FiAlertTriangle size={24} color="#E53E3E" /></IconWrapper>
                <Typography fontSize="2xl" fontWeight="bold" color="red.600">
                  {overdueCount}
                </Typography>
                <Typography fontSize="sm" color="gray.600" textAlign="center">
                  Overdue
                </Typography>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <IconWrapper><FiClock size={24} color="#DD6B20" /></IconWrapper>
                <Typography fontSize="2xl" fontWeight="bold" color="orange.600">
                  {dueCount}
                </Typography>
                <Typography fontSize="sm" color="gray.600" textAlign="center">
                  Due Soon
                </Typography>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <IconWrapper><FiRefreshCw size={24} color="#805AD5" /></IconWrapper>
                <Typography fontSize="2xl" fontWeight="bold" color="purple.600">
                  {inProgressCount}
                </Typography>
                <Typography fontSize="sm" color="gray.600" textAlign="center">
                  In Progress
                </Typography>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <IconWrapper><FiCheckCircle size={24} color="#38A169" /></IconWrapper>
                <Typography fontSize="2xl" fontWeight="bold" color="green.600">
                  {completedCount}
                </Typography>
                <Typography fontSize="sm" color="gray.600" textAlign="center">
                  Completed
                </Typography>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Search and Filters */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <HStack gap="4">
              <Box flex="1" maxW="400px">
                <Search
                  placeholder="Search by company name or application ID..."
                  onSearchChange={(query) => setSearchTerm(query)}
                />
              </Box>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "white"
                }}
              >
                <option value="ALL">All Status</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="DUE">Due</option>
                <option value="OVERDUE">Overdue</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </HStack>
          </Box>

          {/* Refreshes Grid */}
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} gap="6">
            {filteredRefreshes.map((refresh) => (
              <Box
                key={refresh.id}
                bg="white"
                p="6"
                borderRadius="lg"
                boxShadow="sm"
                border="1px"
                borderColor="gray.200"
                _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <VStack gap="4" align="stretch">
                  {/* Header */}
                  <Flex justify="space-between" align="start">
                    <VStack align="start" gap="1">
                      <Typography fontSize="lg" fontWeight="bold" color="gray.800">
                        {refresh.companyName}
                      </Typography>
                      <Typography fontSize="sm" color="gray.600">
                        {refresh.applicationId}
                      </Typography>
                    </VStack>
                    
                    <VStack gap="1" align="end">
                      <Tag variant={getPriorityColor(refresh.priority) === 'red' ? 'danger' : getPriorityColor(refresh.priority) === 'orange' ? 'warning' : getPriorityColor(refresh.priority) === 'blue' ? 'info' : 'success'}>
                        {refresh.priority}
                      </Tag>
                      <Tag variant={getRiskColor(refresh.riskLevel) === 'red' ? 'danger' : getRiskColor(refresh.riskLevel) === 'orange' ? 'warning' : 'success'}>
                        {refresh.riskLevel} RISK
                      </Tag>
                      <Tag variant={getStatusColor(refresh.status) === 'red' ? 'danger' : getStatusColor(refresh.status) === 'orange' ? 'warning' : getStatusColor(refresh.status) === 'purple' ? 'info' : getStatusColor(refresh.status) === 'green' ? 'success' : 'info'}>
                        {refresh.status.replace('_', ' ')}
                      </Tag>
                    </VStack>
                  </Flex>

                  {/* Risk Score */}
                  <VStack gap="2" align="stretch">
                    <HStack justify="space-between">
                      <Typography fontSize="sm" color="gray.600">Risk Score:</Typography>
                      <Typography fontSize="sm" fontWeight="bold" color={`${refresh.riskScore >= 70 ? 'red' : refresh.riskScore >= 40 ? 'orange' : 'green'}.600`}>
                        {refresh.riskScore}/100
                      </Typography>
                    </HStack>
                    
                    <Box
                      width="100%"
                      height="6px"
                      bg="gray.200"
                      borderRadius="full"
                      overflow="hidden"
                    >
                      <Box
                        width={`${refresh.riskScore}%`}
                        height="100%"
                        bg={`${refresh.riskScore >= 70 ? 'red' : refresh.riskScore >= 40 ? 'orange' : 'green'}.400`}
                        borderRadius="full"
                        transition="width 0.3s ease"
                      />
                    </Box>
                  </VStack>

                  {/* Details */}
                  <VStack gap="2" align="stretch">
                    <HStack justify="space-between">
                      <Typography fontSize="sm" color="gray.600">Entity Type:</Typography>
                      <Typography fontSize="sm" fontWeight="medium" color="gray.800">
                        {refresh.entityType}
                      </Typography>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Typography fontSize="sm" color="gray.600">Country:</Typography>
                      <Typography fontSize="sm" fontWeight="medium" color="gray.800">
                        {refresh.country}
                      </Typography>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Typography fontSize="sm" color="gray.600">Assigned To:</Typography>
                      <Typography fontSize="sm" fontWeight="medium" color="gray.800">
                        {refresh.assignedTo}
                      </Typography>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Typography fontSize="sm" color="gray.600">Refresh Cycle:</Typography>
                      <Tag variant={getCycleColor(refresh.refreshCycle) === 'blue' ? 'info' : getCycleColor(refresh.refreshCycle) === 'orange' ? 'warning' : getCycleColor(refresh.refreshCycle) === 'green' ? 'success' : 'info'}>
                        {refresh.refreshCycle}
                      </Tag>
                    </HStack>
                  </VStack>

                  {/* Dates */}
                  <VStack gap="2" align="stretch">
                    <HStack justify="space-between">
                      <Typography fontSize="sm" color="gray.600">Last Refresh:</Typography>
                      <Typography fontSize="sm" fontWeight="medium" color="gray.800">
                        {new Date(refresh.lastRefreshDate).toLocaleDateString()}
                      </Typography>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Typography fontSize="sm" color="gray.600">Next Refresh:</Typography>
                      <Typography 
                        fontSize="sm" 
                        fontWeight="medium" 
                        color={new Date(refresh.nextRefreshDate) < new Date() && refresh.status !== 'COMPLETED' ? 'red.600' : 'gray.800'}
                      >
                        {new Date(refresh.nextRefreshDate).toLocaleDateString()}
                        {new Date(refresh.nextRefreshDate) < new Date() && refresh.status !== 'COMPLETED' && (
                          <Typography as="span" color="red.500" ml="1">(Overdue)</Typography>
                        )}
                      </Typography>
                    </HStack>
                  </VStack>

                  {/* Actions */}
                  <HStack justify="space-between">
                    <Link href={`/applications/${refresh.applicationId}`}>
                      <Button
                        size="sm"
                        variant="secondary"
                      >
                        <IconWrapper><FiUser size={16} /></IconWrapper>
                        View Application
                      </Button>
                    </Link>
                    
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={refresh.status === 'COMPLETED'}
                      onClick={async () => {
                        if (refresh.workItemId) {
                          try {
                            await markForRefreshUseCase(refresh.workItemId);
                            await loadRefreshes();
                          } catch (err) {
                            logger.error(err, 'Error marking for refresh', {
                              tags: { error_type: 'mark_refresh_error' }
                            });
                            alert('Failed to start refresh. Please try again.');
                          }
                        }
                      }}
                    >
                      <IconWrapper><FiRefreshCw size={16} /></IconWrapper>
                      {refresh.status === 'COMPLETED' ? 'Completed' : 'Start Refresh'}
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>

          {/* Empty State */}
          {filteredRefreshes.length === 0 && (
            <Box
              bg="white"
              p="12"
              borderRadius="lg"
              textAlign="center"
              boxShadow="sm"
            >
              <VStack gap="4">
                <IconWrapper><FiRefreshCw size={48} color="#A0AEC0" /></IconWrapper>
                <Typography fontSize="lg" color="gray.600">
                  No refreshes found
                </Typography>
                <Typography fontSize="sm" color="gray.500">
                  Try adjusting your search criteria or filters
                </Typography>
              </VStack>
            </Box>
          )}
        </VStack>
      </Container>
      </Box>

      {/* Refresh Settings Modal */}
      {settingsModalOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex="1000"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setSettingsModalOpen(false)}
        >
          <Box
            bg="white"
            p="6"
            borderRadius="lg"
            boxShadow="xl"
            maxW="600px"
            width="90%"
            onClick={(e) => e.stopPropagation()}
          >
            <VStack gap="4" align="stretch">
              <Typography fontSize="lg" fontWeight="bold" color="gray.900">
                Refresh Settings
              </Typography>
              
              <Typography color="gray.900" fontSize="sm">
                Configure refresh cycles and settings for partner and customer compliance reviews.
              </Typography>
              
              {/* Default Refresh Cycles */}
              <Box>
                <Typography fontWeight="semibold" mb="3" fontSize="sm" color="gray.900">Default Refresh Cycles by Risk Level:</Typography>
                <VStack gap="3" align="stretch">
                  <HStack justify="space-between" align="center">
                    <Typography fontSize="sm" color="gray.900" minW="120px">Low Risk:</Typography>
                    <select
                      value={settings.lowRiskCycle}
                      onChange={(e) => setSettings({...settings, lowRiskCycle: e.target.value as any})}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "white",
                        fontSize: "14px",
                        minWidth: "150px",
                        color: "#1A202C"
                      }}
                    >
                      <option value="ANNUAL">ANNUAL (1 year)</option>
                      <option value="BIENNIAL">BIENNIAL (2 years)</option>
                      <option value="TRIENNIAL">TRIENNIAL (3 years)</option>
                    </select>
                  </HStack>
                  <HStack justify="space-between" align="center">
                    <Typography fontSize="sm" color="gray.900" minW="120px">Medium Risk:</Typography>
                    <select
                      value={settings.mediumRiskCycle}
                      onChange={(e) => setSettings({...settings, mediumRiskCycle: e.target.value as any})}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "white",
                        fontSize: "14px",
                        minWidth: "150px",
                        color: "#1A202C"
                      }}
                    >
                      <option value="ANNUAL">ANNUAL (1 year)</option>
                      <option value="BIENNIAL">BIENNIAL (2 years)</option>
                      <option value="TRIENNIAL">TRIENNIAL (3 years)</option>
                    </select>
                  </HStack>
                  <HStack justify="space-between" align="center">
                    <Typography fontSize="sm" color="gray.900" minW="120px">High Risk:</Typography>
                    <select
                      value={settings.highRiskCycle}
                      onChange={(e) => setSettings({...settings, highRiskCycle: e.target.value as any})}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "white",
                        fontSize: "14px",
                        minWidth: "150px",
                        color: "#1A202C"
                      }}
                    >
                      <option value="ANNUAL">ANNUAL (1 year)</option>
                      <option value="BIENNIAL">BIENNIAL (2 years)</option>
                      <option value="TRIENNIAL">TRIENNIAL (3 years)</option>
                    </select>
                  </HStack>
                  <HStack justify="space-between" align="center">
                    <Typography fontSize="sm" color="gray.900" minW="120px">Critical Risk:</Typography>
                    <select
                      value={settings.criticalRiskCycle}
                      onChange={(e) => setSettings({...settings, criticalRiskCycle: e.target.value as any})}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "white",
                        fontSize: "14px",
                        minWidth: "150px",
                        color: "#1A202C"
                      }}
                    >
                      <option value="ANNUAL">ANNUAL (1 year)</option>
                      <option value="BIENNIAL">BIENNIAL (2 years)</option>
                      <option value="TRIENNIAL">TRIENNIAL (3 years)</option>
                    </select>
                  </HStack>
                </VStack>
              </Box>

              {/* Notification Threshold */}
              <Box>
                <Typography fontWeight="semibold" mb="2" fontSize="sm" color="gray.900">Due Date Notification Threshold:</Typography>
                <HStack align="center" gap="2">
                  <Typography fontSize="sm" color="gray.900">Mark items as "Due"</Typography>
                  <Input
                    type="number"
                    value={settings.dueDaysThreshold}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({...settings, dueDaysThreshold: parseInt(e.target.value) || 30})}
                  />
                  <Typography fontSize="sm" color="gray.900">days before refresh date</Typography>
                </HStack>
              </Box>

              {/* Auto Refresh Toggle */}
              <Box>
                <HStack justify="space-between" align="center">
                  <VStack align="start" gap="0">
                    <Typography fontWeight="semibold" fontSize="sm" color="gray.900">Enable Automatic Refresh Process:</Typography>
                    <Typography fontSize="xs" color="gray.900">
                      Scheduled job runs daily to identify items due for refresh
                    </Typography>
                  </VStack>
                  <Button
                    size="sm"
                    variant={settings.enableAutoRefresh ? "primary" : "secondary"}
                    onClick={() => setSettings({...settings, enableAutoRefresh: !settings.enableAutoRefresh})}
                  >
                    {settings.enableAutoRefresh ? "Enabled" : "Disabled"}
                  </Button>
                </HStack>
              </Box>

              {/* Job Schedule Info */}
              {settings.enableAutoRefresh && (
                <Box bg="blue.50" p="3" borderRadius="md" border="1px" borderColor="blue.200">
                  <Typography fontSize="xs" color="gray.900">
                    <Typography as="span" fontWeight="semibold">Schedule:</Typography> Daily at 2 AM UTC
                    <br />
                    <Typography as="span" fontWeight="semibold">Cron:</Typography> {settings.refreshJobSchedule}
                  </Typography>
                </Box>
              )}

              <HStack justify="flex-end" mt="4" gap="2">
                <Button
                  variant="secondary"
                  onClick={() => setSettingsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="orange"
                  onClick={async () => {
                    setSavingSettings(true);
                    try {
                      // Save refresh settings to backend via API proxy
                      const response = await fetch('/api/proxy/api/v1/refresh-settings', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify(settings),
                      });

                      if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(errorText || `Failed to save settings: ${response.status}`);
                      }

                      await SweetAlert.success('Settings Saved', 'Refresh settings have been saved successfully!');
                      setSettingsModalOpen(false);
                    } catch (err) {
                      logger.error(err, 'Error saving settings', {
                        tags: { error_type: 'settings_save_error' }
                      });
                      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings. Please try again.';
                      await SweetAlert.error('Save Failed', errorMessage);
                    } finally {
                      setSavingSettings(false);
                    }
                  }}
                  loading={savingSettings}
                  loadingText="Saving..."
                >
                  Save Settings
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
