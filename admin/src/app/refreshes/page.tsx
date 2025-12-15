/* eslint-disable security/detect-object-injection */
'use client';

import { Box, VStack, HStack, SimpleGrid, Flex, Spinner } from '@chakra-ui/react';
import {
  Search,
  Typography,
  Button,
  Tag,
  IconWrapper,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  // Icons
  SettingsIcon,
  WarningIcon,
  TickCircleIcon,
  ProfileIcon,
  CloseIcon,
} from '@mukuru/mukuru-react-components';
import { Input } from '@/lib/mukuruComponentWrappers';
import { FiRefreshCw, FiClock } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '../../components/AdminSidebar';
import { useSidebar } from '../../contexts/SidebarContext';
import { getWorkItems, markForRefreshUseCase, WorkItemDto } from '../../services';
import { getItemsDueForRefresh } from '../../services/api/workQueueApi';
import { logger } from '../../lib/logger';
import { SweetAlert } from '../../utils/sweetAlert';

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
  const _now = new Date();
  const nextRefresh = workItem.nextRefreshDate
    ? new Date(workItem.nextRefreshDate)
    : null;

  if (workItem.status === 'DueForRefresh') {
    status = 'IN_PROGRESS';
  } else if (nextRefresh) {
    const daysUntilDue = Math.ceil(
      (nextRefresh.getTime() - _now.getTime()) / (1000 * 60 * 60 * 24)
    );
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
    const nextRefreshForCycle = new Date(workItem.nextRefreshDate);
    const yearsBetween =
      (nextRefreshForCycle.getTime() - lastRefresh.getTime()) /
      (1000 * 60 * 60 * 24 * 365);
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
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75,
    CRITICAL: 95,
  };
  const riskScore = riskScoreMap[riskLevel] || 50;

  return {
    id: workItem.id,
    applicationId: workItem.applicationId || '',
    companyName: workItem.applicantName || 'Unknown',
    entityType: workItem.entityType || 'Unknown',
    riskLevel,
    status,
    lastRefreshDate: workItem.lastRefreshedAt || workItem.createdAt,
    nextRefreshDate:
      workItem.nextRefreshDate ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
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
  const { condensed } = useSidebar();
  const [refreshes, setRefreshes] = useState<Refresh[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settings, setSettings] = useState<RefreshSettings>({
    lowRiskCycle: 'TRIENNIAL',
    mediumRiskCycle: 'ANNUAL',
    highRiskCycle: 'ANNUAL',
    criticalRiskCycle: 'ANNUAL',
    dueDaysThreshold: 30,
    enableAutoRefresh: true,
    refreshJobSchedule: '0 2 * * *', // Daily at 2 AM UTC
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
      const refreshItems = await getItemsDueForRefresh();
      const mappedRefreshes = refreshItems.map(mapWorkItemToRefresh);

      // Also get all work items to include those that might be in progress or completed
      const allItemsResult = await getWorkItems({
        page: 1,
        pageSize: 100,
      });

      // Combine and deduplicate by ID
      const allRefreshes = [
        ...mappedRefreshes,
        ...allItemsResult.items
          .filter((item) => item.nextRefreshDate || item.lastRefreshedAt)
          .map(mapWorkItemToRefresh),
      ];

      const uniqueRefreshes = Array.from(
        new Map(allRefreshes.map((item) => [item.id, item])).values()
      );

      setRefreshes(uniqueRefreshes);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load refreshes';
      setError(errorMessage);
      logger.error(err, 'Error loading refreshes', {
        tags: { error_type: 'refreshes_load_error' },
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Refresh['status']) => {
    switch (status) {
      case 'SCHEDULED':
        return 'blue';
      case 'DUE':
        return 'orange';
      case 'OVERDUE':
        return 'red';
      case 'IN_PROGRESS':
        return 'purple';
      case 'COMPLETED':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: Refresh['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'red';
      case 'HIGH':
        return 'orange';
      case 'MEDIUM':
        return 'blue';
      case 'LOW':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getRiskColor = (risk: Refresh['riskLevel']) => {
    switch (risk) {
      case 'LOW':
        return 'green';
      case 'MEDIUM':
        return 'orange';
      case 'HIGH':
        return 'red';
      case 'CRITICAL':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getCycleColor = (cycle: Refresh['refreshCycle']) => {
    switch (cycle) {
      case 'ANNUAL':
        return 'blue';
      case 'BIENNIAL':
        return 'orange';
      case 'TRIENNIAL':
        return 'green';
      case 'AD_HOC':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const filteredRefreshes = refreshes.filter((refresh) => {
    const matchesSearch =
      refresh.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refresh.applicationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || refresh.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate counts
  const overdueCount = refreshes.filter(
    (r) =>
      r.status === 'OVERDUE' ||
      (new Date(r.nextRefreshDate) < new Date() && r.status !== 'COMPLETED')
  ).length;
  const dueCount = refreshes.filter((r) => r.status === 'DUE').length;
  const inProgressCount = refreshes.filter((r) => r.status === 'IN_PROGRESS').length;
  const completedCount = refreshes.filter((r) => r.status === 'COMPLETED').length;

  if (loading) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
        <AdminSidebar />
        <Box
          ml={condensed ? '72px' : '280px'}
          minH="100vh"
          bg="mukuru.background.light"
          transition="margin-left 0.3s ease"
        >
          <Flex justify="center" align="center" h="100vh">
            <VStack gap="16px">
              <Spinner size="lg" color="mukuru.buttons.primary" />
              <Typography color="mukuru.grey.medium" fontSize="14px">
                Loading refreshes...
              </Typography>
            </VStack>
          </Flex>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="mukuru.background.light">
      <AdminSidebar />
      <Box
        ml={condensed ? '72px' : '280px'}
        minH="100vh"
        bg="mukuru.background.light"
        transition="margin-left 0.3s ease"
      >
        {/* Page Header */}
        <Box
          px="32px"
          py="24px"
          bg="white"
          borderBottom="1px solid"
          borderColor="mukuru.grey.light"
          position="sticky"
          top="0"
          zIndex={10}
        >
          <Flex justify="space-between" align="center">
            <HStack gap="16px" align="center">
              <Box
                p="12px"
                bg="mukuru.buttons.primary"
                borderRadius="12px"
                boxShadow="0 4px 12px rgba(240, 84, 35, 0.25)"
              >
                <FiRefreshCw size={24} color="white" />
              </Box>
              <VStack align="start" gap="2px">
                <Typography
                  fontSize="24px"
                  fontWeight="700"
                  color="mukuru.text.primary"
                  lineHeight="1.2"
                >
                  Refreshes
                </Typography>
                <Typography fontSize="14px" color="mukuru.grey.medium" fontWeight="400">
                  Manage periodic partner and customer refreshes
                </Typography>
              </VStack>
            </HStack>

            <HStack gap="12px">
              <Button variant="secondary" size="sm" onClick={loadRefreshes}>
                <IconWrapper>
                  <FiRefreshCw size={16} />
                </IconWrapper>
                Refresh
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSettingsModalOpen(true)}
              >
                <IconWrapper>
                  <SettingsIcon width="16" height="16" />
                </IconWrapper>
                Refresh Settings
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Content */}
        <Box px="32px" py="24px">
          <VStack gap="24px" align="stretch">
            {/* Error Alert */}
            {error && (
              <Box
                bg="mukuru.text.error.dark"
                p="4"
                borderRadius="lg"
                border="1px"
                borderColor="mukuru.text.error"
              >
                <Typography color="mukuru.text.error" fontWeight="semibold">
                  Error: {error}
                </Typography>
              </Box>
            )}

            {/* Alerts */}
            {overdueCount > 0 && (
              <Box
                bg="mukuru.text.error.dark"
                p="4"
                borderRadius="lg"
                border="1px"
                borderColor="mukuru.text.error"
              >
                <HStack gap="3">
                  <IconWrapper>
                    <WarningIcon
                      width="20"
                      height="20"
                      color="var(--mukuru-text-error)"
                    />
                  </IconWrapper>
                  <VStack align="start" gap="1">
                    <Typography fontWeight="semibold" color="mukuru.text.error">
                      Overdue Refreshes
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.text.error">
                      {overdueCount} refreshes are overdue and require immediate attention
                    </Typography>
                  </VStack>
                </HStack>
              </Box>
            )}

            {/* Summary Cards */}
            <SimpleGrid columns={{ base: 1, md: 4 }} gap="20px">
              <Box
                bg="white"
                p="24px"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
              >
                <VStack gap="8px">
                  <Box p="12px" borderRadius="full" bg="#FEE2E2">
                    <WarningIcon width="24" height="24" color="#DC2626" />
                  </Box>
                  <Typography fontSize="28px" fontWeight="700" color="#DC2626">
                    {overdueCount}
                  </Typography>
                  <Typography fontSize="14px" color="mukuru.grey.medium" fontWeight="500">
                    Overdue
                  </Typography>
                </VStack>
              </Box>

              <Box
                bg="white"
                p="24px"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
              >
                <VStack gap="8px">
                  <Box p="12px" borderRadius="full" bg="#FEF3C7">
                    <FiClock size={24} color="#D97706" />
                  </Box>
                  <Typography fontSize="28px" fontWeight="700" color="#D97706">
                    {dueCount}
                  </Typography>
                  <Typography fontSize="14px" color="mukuru.grey.medium" fontWeight="500">
                    Due Soon
                  </Typography>
                </VStack>
              </Box>

              <Box
                bg="white"
                p="24px"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
              >
                <VStack gap="8px">
                  <Box p="12px" borderRadius="full" bg="#DBEAFE">
                    <FiRefreshCw size={24} color="#2563EB" />
                  </Box>
                  <Typography fontSize="28px" fontWeight="700" color="#2563EB">
                    {inProgressCount}
                  </Typography>
                  <Typography fontSize="14px" color="mukuru.grey.medium" fontWeight="500">
                    In Progress
                  </Typography>
                </VStack>
              </Box>

              <Box
                bg="white"
                p="24px"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
              >
                <VStack gap="8px">
                  <Box p="12px" borderRadius="full" bg="#D1FAE5">
                    <TickCircleIcon width="24" height="24" color="#059669" />
                  </Box>
                  <Typography fontSize="28px" fontWeight="700" color="#059669">
                    {completedCount}
                  </Typography>
                  <Typography fontSize="14px" color="mukuru.grey.medium" fontWeight="500">
                    Completed
                  </Typography>
                </VStack>
              </Box>
            </SimpleGrid>

            {/* Search and Filters */}
            <Box
              bg="white"
              p="20px"
              borderRadius="16px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
            >
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
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--mukuru-grey-light)',
                    backgroundColor: 'white',
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
            <Box
              bg="white"
              borderRadius="16px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
              overflow="hidden"
            >
              {filteredRefreshes.length === 0 ? (
                <Box p="60px" textAlign="center">
                  <VStack gap="16px">
                    <Box p="20px" borderRadius="full" bg="#F1F5F9">
                      <FiRefreshCw size={40} color="#94A3B8" />
                    </Box>
                    <Typography
                      fontSize="16px"
                      fontWeight="600"
                      color="mukuru.text.primary"
                    >
                      No refreshes found
                    </Typography>
                    <Typography fontSize="14px" color="mukuru.grey.medium">
                      Try adjusting your search criteria or filters
                    </Typography>
                  </VStack>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} gap="0">
                  {filteredRefreshes.map((refresh, index) => (
                    <Box
                      key={refresh.id}
                      bg="white"
                      p="20px"
                      borderRight={{
                        base: 'none',
                        lg: index % 3 !== 2 ? '1px solid' : 'none',
                      }}
                      borderBottom="1px solid"
                      borderColor="mukuru.grey.light"
                      _hover={{ bg: 'mukuru.state.hover.card' }}
                      transition="all 0.15s"
                      cursor="pointer"
                    >
                      <VStack gap="4" align="stretch">
                        {/* Header */}
                        <Flex justify="space-between" align="start">
                          <VStack align="start" gap="1">
                            <Typography
                              fontSize="lg"
                              fontWeight="bold"
                              color="mukuru.text.primary"
                            >
                              {refresh.companyName}
                            </Typography>
                            <Typography fontSize="sm" color="gray.600">
                              {refresh.applicationId}
                            </Typography>
                          </VStack>

                          <VStack gap="1" align="end">
                            <Tag
                              variant={
                                getPriorityColor(refresh.priority) === 'red'
                                  ? 'danger'
                                  : getPriorityColor(refresh.priority) === 'orange'
                                    ? 'warning'
                                    : getPriorityColor(refresh.priority) === 'blue'
                                      ? 'info'
                                      : 'success'
                              }
                            >
                              {refresh.priority}
                            </Tag>
                            <Tag
                              variant={
                                getRiskColor(refresh.riskLevel) === 'red'
                                  ? 'danger'
                                  : getRiskColor(refresh.riskLevel) === 'orange'
                                    ? 'warning'
                                    : 'success'
                              }
                            >
                              {refresh.riskLevel} RISK
                            </Tag>
                            <Tag
                              variant={
                                getStatusColor(refresh.status) === 'red'
                                  ? 'danger'
                                  : getStatusColor(refresh.status) === 'orange'
                                    ? 'warning'
                                    : getStatusColor(refresh.status) === 'purple'
                                      ? 'info'
                                      : getStatusColor(refresh.status) === 'green'
                                        ? 'success'
                                        : 'info'
                              }
                            >
                              {refresh.status.replace('_', ' ')}
                            </Tag>
                          </VStack>
                        </Flex>

                        {/* Risk Score */}
                        <VStack gap="2" align="stretch">
                          <HStack justify="space-between">
                            <Typography fontSize="sm" color="gray.600">
                              Risk Score:
                            </Typography>
                            <Typography
                              fontSize="sm"
                              fontWeight="bold"
                              color={`${refresh.riskScore >= 70 ? 'red' : refresh.riskScore >= 40 ? 'orange' : 'green'}.600`}
                            >
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
                            <Typography fontSize="sm" color="gray.600">
                              Entity Type:
                            </Typography>
                            <Typography
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.800"
                            >
                              {refresh.entityType}
                            </Typography>
                          </HStack>

                          <HStack justify="space-between">
                            <Typography fontSize="sm" color="gray.600">
                              Country:
                            </Typography>
                            <Typography
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.800"
                            >
                              {refresh.country}
                            </Typography>
                          </HStack>

                          <HStack justify="space-between">
                            <Typography fontSize="sm" color="gray.600">
                              Assigned To:
                            </Typography>
                            <Typography
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.800"
                            >
                              {refresh.assignedTo}
                            </Typography>
                          </HStack>

                          <HStack justify="space-between">
                            <Typography fontSize="sm" color="gray.600">
                              Refresh Cycle:
                            </Typography>
                            <Tag
                              variant={
                                getCycleColor(refresh.refreshCycle) === 'blue'
                                  ? 'info'
                                  : getCycleColor(refresh.refreshCycle) === 'orange'
                                    ? 'warning'
                                    : getCycleColor(refresh.refreshCycle) === 'green'
                                      ? 'success'
                                      : 'info'
                              }
                            >
                              {refresh.refreshCycle}
                            </Tag>
                          </HStack>
                        </VStack>

                        {/* Dates */}
                        <VStack gap="2" align="stretch">
                          <HStack justify="space-between">
                            <Typography fontSize="sm" color="gray.600">
                              Last Refresh:
                            </Typography>
                            <Typography
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.800"
                            >
                              {new Date(refresh.lastRefreshDate).toLocaleDateString()}
                            </Typography>
                          </HStack>

                          <HStack justify="space-between">
                            <Typography fontSize="sm" color="gray.600">
                              Next Refresh:
                            </Typography>
                            <Typography
                              fontSize="sm"
                              fontWeight="medium"
                              color={
                                new Date(refresh.nextRefreshDate) < new Date() &&
                                refresh.status !== 'COMPLETED'
                                  ? 'red.600'
                                  : 'gray.800'
                              }
                            >
                              {new Date(refresh.nextRefreshDate).toLocaleDateString()}
                              {new Date(refresh.nextRefreshDate) < new Date() &&
                                refresh.status !== 'COMPLETED' && (
                                  <Typography as="span" color="red.500" ml="1">
                                    (Overdue)
                                  </Typography>
                                )}
                            </Typography>
                          </HStack>
                        </VStack>

                        {/* Actions */}
                        <HStack justify="space-between">
                          <Link href={`/applications/${refresh.applicationId}`}>
                            <Button size="sm" variant="secondary">
                              <IconWrapper>
                                <ProfileIcon width="16" height="16" />
                              </IconWrapper>
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
                                    tags: { error_type: 'mark_refresh_error' },
                                  });
                                  alert('Failed to start refresh. Please try again.');
                                }
                              }
                            }}
                          >
                            <IconWrapper>
                              <FiRefreshCw width="16" height="16" />
                            </IconWrapper>
                            {refresh.status === 'COMPLETED'
                              ? 'Completed'
                              : 'Start Refresh'}
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </VStack>
        </Box>

        {/* Refresh Settings Modal */}
        {settingsModalOpen && (
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="rgba(0, 0, 0, 0.5)"
            zIndex="1000"
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={() => setSettingsModalOpen(false)}
          >
            <Box
              bg="white"
              borderRadius="20px"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              maxW="560px"
              width="90%"
              overflow="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <Box
                p="24px"
                borderBottom="1px solid"
                borderColor="mukuru.grey.light"
                bg="white"
              >
                <Flex justify="space-between" align="center">
                  <HStack gap="16px">
                    <Box
                      p="12px"
                      bg="mukuru.buttons.primary"
                      borderRadius="12px"
                      boxShadow="0 4px 12px rgba(240, 84, 35, 0.25)"
                    >
                      <SettingsIcon width="20" height="20" color="white" />
                    </Box>
                    <VStack align="start" gap="2px">
                      <Typography
                        fontSize="18px"
                        fontWeight="700"
                        color="mukuru.text.primary"
                      >
                        Refresh Settings
                      </Typography>
                      <Typography fontSize="13px" color="mukuru.grey.medium">
                        Configure refresh cycles and compliance settings
                      </Typography>
                    </VStack>
                  </HStack>
                  <Box
                    as="button"
                    p="8px"
                    borderRadius="8px"
                    cursor="pointer"
                    transition="all 0.15s"
                    _hover={{ bg: '#F1F5F9' }}
                    onClick={() => setSettingsModalOpen(false)}
                  >
                    <CloseIcon width="20" height="20" color="#64748B" />
                  </Box>
                </Flex>
              </Box>

              {/* Modal Body */}
              <Box p="24px" maxH="60vh" overflowY="auto">
                <VStack gap="24px" align="stretch">
                  {/* Default Refresh Cycles */}
                  <Box>
                    <Typography
                      fontSize="12px"
                      fontWeight="600"
                      color="mukuru.grey.mediumDark"
                      mb="16px"
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                    >
                      Default Refresh Cycles by Risk Level
                    </Typography>
                    <VStack gap="12px" align="stretch">
                      {[
                        { label: 'Low Risk', key: 'lowRiskCycle' as const },
                        { label: 'Medium Risk', key: 'mediumRiskCycle' as const },
                        { label: 'High Risk', key: 'highRiskCycle' as const },
                        { label: 'Critical Risk', key: 'criticalRiskCycle' as const },
                      ].map((item) => (
                        <Flex
                          key={item.key}
                          justify="space-between"
                          align="center"
                          p="12px 16px"
                          bg="#F8FAFC"
                          borderRadius="10px"
                          border="1px solid"
                          borderColor="mukuru.grey.light"
                        >
                          <Typography
                            fontSize="14px"
                            color="mukuru.text.primary"
                            fontWeight="500"
                          >
                            {item.label}
                          </Typography>
                          <select
                            value={settings[item.key]}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                [item.key]: e.target.value as
                                  | 'ANNUAL'
                                  | 'BIENNIAL'
                                  | 'TRIENNIAL',
                              })
                            }
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #E2E8F0',
                              backgroundColor: 'white',
                              fontSize: '13px',
                              fontWeight: '500',
                              minWidth: '160px',
                              color: '#1E293B',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="ANNUAL">ANNUAL (1 year)</option>
                            <option value="BIENNIAL">BIENNIAL (2 years)</option>
                            <option value="TRIENNIAL">TRIENNIAL (3 years)</option>
                          </select>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>

                  {/* Notification Threshold */}
                  <Box>
                    <Typography
                      fontSize="12px"
                      fontWeight="600"
                      color="mukuru.grey.mediumDark"
                      mb="16px"
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                    >
                      Due Date Notification Threshold
                    </Typography>
                    <Flex
                      align="center"
                      gap="12px"
                      p="16px"
                      bg="#F8FAFC"
                      borderRadius="10px"
                      border="1px solid"
                      borderColor="mukuru.grey.light"
                    >
                      <Typography fontSize="14px" color="mukuru.text.primary">
                        Mark items as &quot;Due&quot;
                      </Typography>
                      <input
                        type="number"
                        value={settings.dueDaysThreshold}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            dueDaysThreshold: parseInt(e.target.value) || 30,
                          })
                        }
                        style={{
                          width: '70px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: 'white',
                          fontSize: '14px',
                          fontWeight: '600',
                          textAlign: 'center',
                          color: '#1E293B',
                        }}
                      />
                      <Typography fontSize="14px" color="mukuru.text.primary">
                        days before refresh date
                      </Typography>
                    </Flex>
                  </Box>

                  {/* Auto Refresh Toggle */}
                  <Box>
                    <Typography
                      fontSize="12px"
                      fontWeight="600"
                      color="mukuru.grey.mediumDark"
                      mb="16px"
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                    >
                      Automatic Refresh Process
                    </Typography>
                    <Flex
                      justify="space-between"
                      align="center"
                      p="16px"
                      bg="#F8FAFC"
                      borderRadius="10px"
                      border="1px solid"
                      borderColor="mukuru.grey.light"
                    >
                      <VStack align="start" gap="4px">
                        <Typography
                          fontSize="14px"
                          fontWeight="500"
                          color="mukuru.text.primary"
                        >
                          Enable Automatic Refresh
                        </Typography>
                        <Typography fontSize="12px" color="mukuru.grey.medium">
                          Scheduled job runs daily to identify items due for refresh
                        </Typography>
                      </VStack>
                      <Box
                        as="button"
                        w="52px"
                        h="28px"
                        bg={settings.enableAutoRefresh ? '#10B981' : '#CBD5E1'}
                        borderRadius="full"
                        position="relative"
                        transition="all 0.2s"
                        cursor="pointer"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            enableAutoRefresh: !settings.enableAutoRefresh,
                          })
                        }
                      >
                        <Box
                          w="24px"
                          h="24px"
                          bg="white"
                          borderRadius="full"
                          position="absolute"
                          top="2px"
                          left={settings.enableAutoRefresh ? '26px' : '2px'}
                          transition="all 0.2s"
                          boxShadow="0 1px 3px rgba(0,0,0,0.15)"
                        />
                      </Box>
                    </Flex>
                  </Box>

                  {/* Job Schedule Info */}
                  {settings.enableAutoRefresh && (
                    <Box
                      p="16px"
                      bg="#DBEAFE"
                      borderRadius="10px"
                      border="1px solid #93C5FD"
                    >
                      <HStack gap="12px">
                        <Box p="8px" bg="#3B82F6" borderRadius="8px">
                          <FiClock size={16} color="white" />
                        </Box>
                        <VStack align="start" gap="2px">
                          <Typography fontSize="13px" fontWeight="600" color="#1E40AF">
                            Schedule: Daily at 2 AM UTC
                          </Typography>
                          <Typography fontSize="12px" color="#3B82F6" fontFamily="mono">
                            Cron: {settings.refreshJobSchedule}
                          </Typography>
                        </VStack>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              </Box>

              {/* Modal Footer */}
              <Box
                p="20px 24px"
                borderTop="1px solid"
                borderColor="mukuru.grey.light"
                bg="#FAFBFC"
              >
                <Flex justify="flex-end" gap="12px">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSettingsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      setSavingSettings(true);
                      try {
                        const response = await fetch(
                          '/api/proxy/api/v1/refresh-settings',
                          {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(settings),
                          }
                        );

                        if (!response.ok) {
                          const errorText = await response.text();
                          throw new Error(
                            errorText || `Failed to save settings: ${response.status}`
                          );
                        }

                        await SweetAlert.success(
                          'Settings Saved',
                          'Refresh settings have been saved successfully!'
                        );
                        setSettingsModalOpen(false);
                      } catch (err) {
                        logger.error(err, 'Error saving settings', {
                          tags: { error_type: 'settings_save_error' },
                        });
                        const errorMessage =
                          err instanceof Error
                            ? err.message
                            : 'Failed to save settings. Please try again.';
                        await SweetAlert.error('Save Failed', errorMessage);
                      } finally {
                        setSavingSettings(false);
                      }
                    }}
                    disabled={savingSettings}
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Flex>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
