'use client';

import { Box, VStack, HStack, Flex, Spinner, SimpleGrid } from '@chakra-ui/react';
import {
  Button,
  Search,
  Typography,
  DataTable,
  Tag,
  AlertBar,
  Tooltip,
  Dropdown,
  Modal,
} from '@mukuru/mukuru-react-components';
import type { ColumnConfig } from '@mukuru/mukuru-react-components';
import {
  FiDownload,
  FiEye,
  FiEdit2,
  FiUser,
  FiUserPlus,
  FiRefreshCw,
  FiAlertTriangle,
  FiFileText,
  FiBriefcase,
  FiAlertCircle,
  FiPlus,
  FiCheck,
  FiCheckSquare,
  FiX,
  FiClock,
  FiFlag,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
} from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import {
  exportWorkItems,
  WorkItemDto,
} from '../../services';
import { rulesAndPermissionsApiService } from '../../services/rulesAndPermissionsApi';
import { logger } from '../../lib/logger';

type TabFilter = 'All' | 'Active' | 'Completed' | 'MyItems' | 'PendingApprovals';

export default function WorkQueuePage() {
  const router = useRouter();
  const { condensed } = useSidebar();

  // Mukuru Design System color tokens
  const bgColor = 'mukuru.background.light';
  const cardBg = 'mukuru.cards.white';
  const textColor = 'mukuru.text.primary';
  const borderColor = 'mukuru.grey.light';
  const labelColor = 'mukuru.grey.mediumDark';
  const subtleText = 'mukuru.grey.medium';

  const { data: session } = useSession();
  
  // Get current user info
  const currentUserId = session?.user?.id || session?.user?.email || '00000000-0000-0000-0000-000000000001';
  const currentUserName = session?.user?.name || session?.user?.email || 'Current User';

  const [workItems, setWorkItems] = useState<WorkItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [exporting, setExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  
  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Advanced filters
  const [filters, setFilters] = useState<{
    priority?: string;
    riskLevel?: string;
    status?: string;
    assignedTo?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadWorkItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filters based on active tab
      let statusFilter = filters.status;
      let assignedToFilter = filters.assignedTo;
      
      if (activeTab === 'MyItems') {
        // My Items: Show items assigned to current user
        assignedToFilter = currentUserId;
        statusFilter = filters.status; // Allow status filter on top of my items
      } else if (activeTab === 'PendingApprovals') {
        // Pending Approvals: Show items pending approval
        statusFilter = 'PendingApproval';
      } else if (!statusFilter && activeTab === 'Active') {
        statusFilter = undefined; // Will filter client-side
      } else if (!statusFilter && activeTab === 'Completed') {
        statusFilter = undefined; // Will filter client-side
      }

      // Handle "unassigned" filter - we'll filter client-side for now
      // TODO: Update backend to support unassigned filtering
      const isUnassignedFilter = filters.assignedTo === 'unassigned';
      if (isUnassignedFilter && activeTab !== 'MyItems') {
        assignedToFilter = undefined; // Don't send to backend, filter client-side
      }

      // Use getWorkItems directly to get WorkItemDto
      const { getWorkItems } = await import('../../services/api/workQueueApi');
      const result = await getWorkItems({
        page: currentPage,
        pageSize: pageSize,
        status: statusFilter,
        priority: filters.priority,
        riskLevel: filters.riskLevel,
        assignedTo: assignedToFilter,
        searchTerm: searchTerm || undefined,
      });

      // API client already converts PascalCase to camelCase
      const workItemDtos: WorkItemDto[] = result.items.map((item: any) => {
        // Backend returns snake_case: 'id' is the work item ID, 'application_id' is the application ID
        const workItemId = item.id || item.Id || item.workItemId || item.work_item_id;
        const applicationId = item.application_id || item.applicationId || item.ApplicationId;
        return {
          id: String(workItemId), // Work item ID
          workItemId: String(workItemId), // Work item ID (same as id)
          workItemNumber: item.workItemNumber || item.work_item_number || item.WorkItemNumber || '',
          applicationId: String(applicationId || workItemId), // Application ID (fallback to workItemId if missing)
          applicantName: item.applicantName || 'Unknown Applicant',
        businessName: item.businessName,
        entityType: item.entityType || 'Unknown',
        entityTypeDisplayName: item.entityTypeDisplayName,
        country: item.country || 'Unknown',
        status: item.status || 'New',
        priority: item.priority || 'Medium',
        riskLevel: item.riskLevel || 'Unknown',
        assignedTo: item.assignedTo ? String(item.assignedTo) : undefined,
        assignedToName: item.assignedToName,
        assignedAt: item.assignedAt,
        requiresApproval: item.requiresApproval ?? false,
        approvedBy: item.approvedBy ? String(item.approvedBy) : undefined,
        approvedByName: item.approvedByName,
        approvedAt: item.approvedAt,
        approvalNotes: item.approvalNotes,
        rejectionReason: item.rejectionReason,
        rejectedAt: item.rejectedAt,
        dueDate: item.dueDate || item.createdAt,
        isOverdue: item.isOverdue ?? false,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        nextRefreshDate: item.nextRefreshDate,
        lastRefreshedAt: item.lastRefreshedAt,
        refreshCount: item.refreshCount ?? 0,
        createdBy: item.createdBy || 'System',
        updatedBy: item.updatedBy,
        };
      });

      setWorkItems(workItemDtos);
      setTotalCount(result.totalCount);
    } catch (err) {
      logger.error(err, '[Work Queue Page] Error loading work items');
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load work items. Please ensure backend services are running.'
      );
      setWorkItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, searchTerm, activeTab, currentUserId]);

  // Load users when modal opens
  useEffect(() => {
    if (assignModalOpen) {
      loadUsers();
    }
  }, [assignModalOpen]);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const allUsers = await rulesAndPermissionsApiService.getAllUsers(false);
      // Format users for dropdown (all users are shown, can filter by roles if needed)
      const formattedUsers = allUsers
        .map((user) => ({
          id: user.id,
          name: user.name || user.email || 'Unknown User',
          email: user.email || '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setUsers(formattedUsers);
    } catch (err) {
      logger.error(err, '[Work Queue] Error loading users');
      setToast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        type: 'error',
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const handleAssignWorkItem = useCallback(async () => {
    if (!selectedWorkItemId || !selectedUserId) {
      setToast({
        title: 'Validation Error',
        description: 'Please select a user to assign the work item to.',
        type: 'error',
      });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (!selectedUser) {
      setToast({
        title: 'Error',
        description: 'Selected user not found.',
        type: 'error',
      });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    // Validate user ID is a valid GUID format (backend requires Guid type)
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(selectedUser.id)) {
      setToast({
        title: 'Validation Error',
        description: `User ID "${selectedUser.id}" is not in valid GUID format. Please contact support.`,
        type: 'error',
      });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    try {
      const { assignWorkItem } = await import('../../services/api/workQueueApi');
      await assignWorkItem(selectedWorkItemId, selectedUser.id, selectedUser.name);
      setToast({
        title: 'Success',
        description: `Work item assigned to ${selectedUser.name} successfully`,
        type: 'success',
      });
      setAssignModalOpen(false);
      setSelectedWorkItemId(null);
      setSelectedUserId('');
      setRefreshKey((prev) => prev + 1);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      logger.error(err, '[Work Queue] Error assigning work item', {
        tags: {
          workItemId: selectedWorkItemId,
          userId: selectedUser.id,
          userName: selectedUser.name,
        },
      });
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign work item';
      
      // Check if this is a concurrency error - if so, refresh the work queue automatically
      const isConcurrencyError = errorMessage.toLowerCase().includes('modified by another user') ||
                                 errorMessage.toLowerCase().includes('modified by another process');
      
      if (isConcurrencyError) {
        // Refresh the work queue to get the latest data
        await loadWorkItems();
        setToast({
          title: 'Work Item Updated',
          description: 'The work item was modified by another user. The page has been refreshed. Please try assigning again.',
          type: 'error',
        });
        // Keep the modal open so user can try again with fresh data
      } else {
        setToast({
          title: 'Error',
          description: errorMessage,
          type: 'error',
        });
        setTimeout(() => setToast(null), 5000);
      }
    }
  }, [selectedWorkItemId, selectedUserId, users, loadWorkItems]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
  }, []);

  useEffect(() => {
    loadWorkItems();
  }, [loadWorkItems, refreshKey]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, activeTab]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportWorkItems({
        search: searchTerm || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work_queue_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      logger.error(err, 'Error exporting work items');
      setError(err instanceof Error ? err.message : 'Failed to export work items');
    } finally {
      setExporting(false);
    }
  };

  // Filter work items based on tab and unassigned filter (client-side filtering)
  const filteredWorkItems = useMemo(() => {
    return workItems.filter((item) => {
      let matchesTab = true;
      if (activeTab === 'Active') {
        matchesTab = ['New', 'Assigned', 'InProgress', 'PendingApproval'].includes(item.status);
      } else if (activeTab === 'Completed') {
        matchesTab = ['Completed', 'Approved', 'Declined'].includes(item.status);
      } else if (activeTab === 'MyItems') {
        // My Items: Already filtered by backend, but double-check client-side
        matchesTab = item.assignedTo === currentUserId;
      } else if (activeTab === 'PendingApprovals') {
        // Pending Approvals: Already filtered by backend, but double-check client-side
        matchesTab = item.status === 'PendingApproval';
      }

      // Handle unassigned filter client-side (only if not MyItems tab)
      let matchesAssignedFilter = true;
      if (activeTab !== 'MyItems' && filters.assignedTo === 'unassigned') {
        matchesAssignedFilter = !item.assignedToName || item.assignedToName === 'Unassigned';
      } else if (activeTab !== 'MyItems' && filters.assignedTo && filters.assignedTo !== 'unassigned') {
        matchesAssignedFilter = item.assignedTo === filters.assignedTo;
      }

      return matchesTab && matchesAssignedFilter;
    });
  }, [workItems, activeTab, filters.assignedTo, currentUserId]);

  // Get counts for tabs
  const tabCounts = useMemo(() => {
    const active = workItems.filter((item) =>
      ['New', 'Assigned', 'InProgress', 'PendingApproval'].includes(item.status)
    ).length;
    const completed = workItems.filter((item) =>
      ['Completed', 'Approved', 'Declined'].includes(item.status)
    ).length;
    return { all: workItems.length, active, completed };
  }, [workItems]);

  // Get icon for entity type
  const getEntityIcon = (entityType: string) => {
    switch (entityType?.toLowerCase()) {
      case 'individual':
        return <FiUser size={16} color="#F05423" />;
      case 'business':
      case 'private_company':
        return <FiBriefcase size={16} color="#F05423" />;
      default:
        return <FiFileText size={16} color="#F05423" />;
    }
  };

  // Get status variant
  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return 'success';
      case 'InProgress':
      case 'Assigned':
      case 'PendingApproval':
        return 'warning';
      case 'Declined':
        return 'danger';
      default:
        return 'info';
    }
  };

  // Format status for display
  const formatStatus = (status: string): string => {
    if (status === 'InProgress') return 'In Progress';
    if (status === 'PendingApproval') return 'Pending Approval';
    return status;
  };

  // Tab component - Entity Types style (underline on active)
  const Tab = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
    <Box
      as="button"
      pb="2"
      borderBottom="2px solid"
      borderColor={isActive ? 'mukuru.charcoal' : 'transparent'}
      color={isActive ? 'mukuru.charcoal' : subtleText}
      fontWeight={isActive ? '500' : '400'}
      fontSize="sm"
      bg="transparent"
      _hover={{ color: 'mukuru.charcoal' }}
      transition="all 0.15s"
      onClick={onClick}
    >
      {label}
    </Box>
  );

  // Define columns - Entity Types style
  const columns: ColumnConfig<WorkItemDto>[] = [
    {
      field: 'applicantName',
      header: 'WORK ITEM',
      sortable: true,
      render: (value, row) => (
        <HStack gap="3" align="start">
          <Box
            w="8"
            h="8"
            borderRadius="lg"
            bg="orange.50"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            mt="1px"
          >
            {getEntityIcon(row.entityType)}
          </Box>
          <VStack align="start" gap="2px" flex="1" minW="0">
            <Typography 
              fontSize="13px" 
              fontWeight="500" 
              color={textColor}
              style={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                maxWidth: '100%',
                lineHeight: '20px'
              }}
            >
              {row.businessName || value || 'Unknown Applicant'}
            </Typography>
            <Typography 
              fontSize="11px" 
              color="mukuru.grey.medium"
              fontWeight="400"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                lineHeight: '1.3'
              }}
            >
              {row.entityTypeDisplayName || row.entityType || 'Application'}
            </Typography>
          </VStack>
        </HStack>
      ),
    },
    {
      field: 'workItemNumber',
      header: 'CODE',
      sortable: true,
      render: (value, row) => (
        <Typography 
          fontSize="12px" 
          fontFamily="mono" 
          color={textColor}
          style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}
        >
          {value || row.workItemNumber || String(row.id).substring(0, 10).toUpperCase()}
        </Typography>
      ),
    },
    {
      field: 'priority',
      header: 'DETAILS',
      render: (value, row) => (
        <VStack align="start" gap="2px">
          <Typography 
            fontSize="13px" 
            fontWeight="500" 
            color={textColor}
            style={{ lineHeight: '20px' }}
          >
            {row.priority || 'Medium'}
          </Typography>
            <Typography 
              fontSize="11px" 
              fontWeight="400" 
              color={row.riskLevel === 'High' || row.riskLevel === 'Critical' ? 'mukuru.text.error' : 'mukuru.grey.medium'}
              style={{ lineHeight: '1.3' }}
            >
              {row.riskLevel || 'Unknown'}
            </Typography>
        </VStack>
      ),
    },
    {
      field: 'assignedToName',
      header: 'ASSIGNED TO',
      sortable: true,
      render: (value, row) => {
        const assignedTo = String(value || '') || row.assignedToName;
        const isAssigned = assignedTo && assignedTo !== 'Unassigned';
        return (
          <HStack gap="2" align="center">
            <Box
              w="6"
              h="6"
              borderRadius="full"
              bg={isAssigned ? 'mukuru.grey.light' : 'mukuru.grey.light'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <FiUser size={12} color="var(--chakra-colors-mukuru-grey-medium)" />
            </Box>
            <Typography 
              fontSize="13px" 
              fontWeight="500" 
              color={isAssigned ? textColor : 'mukuru.grey.medium'}
              style={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                lineHeight: '20px'
              }}
            >
              {isAssigned ? assignedTo : 'Unassigned'}
            </Typography>
          </HStack>
        );
      },
    },
    {
      field: 'status',
      header: 'STATUS',
      sortable: true,
      render: (value) => {
        const status = String(value) || 'New';
        // Entity Types uses green "Active" badge style
        const isActive = ['New', 'Assigned', 'InProgress', 'PendingApproval'].includes(status);
        return (
          <Typography 
            fontSize="13px" 
            fontWeight="500"
            color={isActive ? 'mukuru.buttons.primary' : status === 'Completed' || status === 'Approved' ? 'mukuru.teal' : 'mukuru.text.error'}
            style={{ lineHeight: '20px' }}
          >
            {formatStatus(status)}
          </Typography>
        );
      },
    },
  ];

  // Helper function to execute action with error handling
  const executeAction = useCallback(async (
    actionFn: () => Promise<void>,
    successMessage: string,
    errorPrefix: string
  ) => {
    try {
      await actionFn();
      setToast({
        title: 'Success',
        description: successMessage,
        type: 'success',
      });
      setRefreshKey((prev) => prev + 1);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      logger.error(err, `[Work Queue] ${errorPrefix}`);
      const errorMessage = err instanceof Error ? err.message : `${errorPrefix} failed`;
      setError(errorMessage);
      setToast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      setTimeout(() => setToast(null), 5000);
    }
  }, []);

  // Action column - Entity Types style (edit, assign, more)
  const actionColumn = {
    header: 'ACTIONS',
    render: (row: WorkItemDto) => {
      const workItemId = String(row.workItemId || row.id);
      const isUnassigned = !row.assignedToName || row.assignedToName === 'Unassigned';
      const isAssignedToMe = row.assignedTo === currentUserId;
      const status = row.status;

      // Determine available actions based on status
      const canStartReview = ['New', 'Assigned'].includes(status);
      const canSubmitForApproval = status === 'InProgress' && row.requiresApproval;
      const canApprove = status === 'PendingApproval';
      const canComplete = status === 'Approved' || (status === 'InProgress' && !row.requiresApproval);
      const canDecline = ['New', 'Assigned', 'InProgress', 'PendingApproval'].includes(status);
      const canCancel = !['Completed', 'Declined', 'Cancelled'].includes(status);
      const canMarkForRefresh = status === 'Completed';
      const canUnassign = isAssignedToMe && !['Completed', 'Declined', 'Cancelled'].includes(status);

      return (
        <HStack gap="1" justify="flex-end" flexWrap="wrap">
          {/* Review/View Details - Always visible */}
          <Tooltip content="Review Application" showArrow variant="light">
            <Link href={`/review/${row.applicationId || row.workItemId || row.id}`} style={{ textDecoration: 'none' }}>
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <FiEdit2 size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
              </Box>
            </Link>
          </Tooltip>

          {/* Assign - If unassigned */}
          {isUnassigned && (
            <Tooltip content="Assign Work Item" showArrow variant="light">
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedWorkItemId(workItemId);
                  setAssignModalOpen(true);
                }}
              >
                <FiUserPlus size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
              </Box>
            </Tooltip>
          )}

          {/* Start Review - If assigned and can start */}
          {canStartReview && !isUnassigned && (
            <Tooltip content="Start Review" showArrow variant="light">
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  try {
                    const { startReview } = await import('../../services/api/workQueueApi');
                    await startReview(workItemId);
                    setToast({
                      title: 'Success',
                      description: 'Review started successfully. Redirecting to review page...',
                      type: 'success',
                    });
                    setRefreshKey((prev) => prev + 1);
                    // Redirect to review page after starting review
                    // Backend returns 'id' as the work item ID - ensure we use that, NOT applicationId
                    // The workItemId should be the same as id (both are the work item ID from backend)
                    const redirectId = row.workItemId || row.id;
                    
                    // Validate that we're not accidentally using applicationId
                    if (!redirectId || redirectId === row.applicationId) {
                      if (process.env.NODE_ENV === 'development') {
                        console.error('[Work Queue] Cannot redirect: work item ID not found or matches applicationId', {
                          workItemId: row.workItemId,
                          id: row.id,
                          applicationId: row.applicationId,
                        });
                      }
                      logger.error('[Work Queue] Cannot redirect: work item ID not found or matches applicationId');
                      setError('Work item ID not found');
                      return;
                    }
                    
                    if (process.env.NODE_ENV === 'development') {
                      console.log('[Work Queue] Redirecting to review page', { 
                        workItemId: row.workItemId, 
                        id: row.id, 
                        applicationId: row.applicationId,
                        redirectId,
                        usingCorrectId: redirectId !== row.applicationId
                      });
                    }
                    setTimeout(() => {
                      router.push(`/review/${redirectId}`);
                    }, 500);
                  } catch (err) {
                    logger.error(err, '[Work Queue] Error starting review');
                    const errorMessage = err instanceof Error ? err.message : 'Error starting review';
                    setError(errorMessage);
                    setToast({
                      title: 'Error',
                      description: errorMessage,
                      type: 'error',
                    });
                    setTimeout(() => setToast(null), 5000);
                  }
                }}
              >
                <FiClock size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
              </Box>
            </Tooltip>
          )}

          {/* Submit for Approval - If in progress and requires approval */}
          {canSubmitForApproval && (
            <Tooltip content="Submit for Approval" showArrow variant="light">
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const { submitForApproval } = await import('../../services/api/workQueueApi');
                  await executeAction(
                    () => submitForApproval(workItemId),
                    'Submitted for approval successfully',
                    'Error submitting for approval'
                  );
                }}
              >
                <FiArrowUp size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
              </Box>
            </Tooltip>
          )}

          {/* Approve - If pending approval */}
          {canApprove && (
            <Tooltip content="Approve" showArrow variant="light">
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const { approveWorkItem } = await import('../../services/api/workQueueApi');
                  await executeAction(
                    () => approveWorkItem(workItemId),
                    'Work item approved successfully',
                    'Error approving work item'
                  );
                }}
              >
                <FiCheck size={16} color="var(--chakra-colors-mukuru-teal)" />
              </Box>
            </Tooltip>
          )}

          {/* Complete - If approved or can complete */}
          {canComplete && (
            <Tooltip content="Complete" showArrow variant="light">
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const { completeWorkItem } = await import('../../services/api/workQueueApi');
                  await executeAction(
                    () => completeWorkItem(workItemId),
                    'Work item completed successfully',
                    'Error completing work item'
                  );
                }}
              >
                <FiCheckSquare size={16} color="var(--chakra-colors-mukuru-teal)" />
              </Box>
            </Tooltip>
          )}

          {/* Decline - If can decline */}
          {canDecline && (
            <Tooltip content="Decline" showArrow variant="light">
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const reason = prompt('Please provide a reason for declining:');
                  if (reason && reason.trim()) {
                    const { declineWorkItem } = await import('../../services/api/workQueueApi');
                    await executeAction(
                      () => declineWorkItem(workItemId, reason),
                      'Work item declined successfully',
                      'Error declining work item'
                    );
                  }
                }}
              >
                <FiX size={16} color="var(--chakra-colors-mukuru-text-error)" />
              </Box>
            </Tooltip>
          )}

          {/* Unassign - If assigned to me */}
          {canUnassign && (
            <Tooltip content="Unassign" showArrow variant="light">
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const { unassignWorkItem } = await import('../../services/api/workQueueApi');
                  await executeAction(
                    () => unassignWorkItem(workItemId),
                    'Work item unassigned successfully',
                    'Error unassigning work item'
                  );
                }}
              >
                <FiUser size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
              </Box>
            </Tooltip>
          )}

          {/* Mark for Refresh - If completed */}
          {canMarkForRefresh && (
            <Tooltip content="Mark for Refresh" showArrow variant="light">
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const { markForRefresh } = await import('../../services/api/workQueueApi');
                  await executeAction(
                    () => markForRefresh(workItemId),
                    'Work item marked for refresh successfully',
                    'Error marking for refresh'
                  );
                }}
              >
                <FiRefreshCw size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
              </Box>
            </Tooltip>
          )}

          {/* Assign to Another User - Only if unassigned */}
          {isUnassigned && (
            <Tooltip content="Assign User" showArrow variant="light">
              <Box
                as="button"
                p="1.5"

                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedWorkItemId(workItemId);
                  setAssignModalOpen(true);
                }}
              >
                <FiUserPlus size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
              </Box>
            </Tooltip>
          )}

          {/* Update Priority - Available for active items */}
          {!['Completed', 'Declined', 'Cancelled'].includes(status) && (
            <Tooltip content="Update Priority" showArrow variant="light">
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const priorities = ['Critical', 'High', 'Medium', 'Low'];
                  const currentPriority = row.priority || 'Medium';
                  const newPriority = prompt(
                    `Update Priority (Current: ${currentPriority}):\nOptions: ${priorities.join(', ')}`,
                    currentPriority
                  );
                  if (newPriority && priorities.includes(newPriority)) {
                    const { updateWorkItemPriority } = await import('../../services/api/workQueueApi');
                    await executeAction(
                      () => updateWorkItemPriority(workItemId, newPriority),
                      'Priority updated successfully',
                      'Error updating priority'
                    );
                  }
                }}
              >
                <FiFlag size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
              </Box>
            </Tooltip>
          )}

          {/* Cancel - If can cancel */}
          {canCancel && (
            <Tooltip content="Cancel" showArrow variant="light">
              <Box
                as="button"
                p="1.5"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const reason = prompt('Please provide a reason for cancelling:');
                  if (reason && reason.trim()) {
                    const { cancelWorkItem } = await import('../../services/api/workQueueApi');
                    await executeAction(
                      () => cancelWorkItem(workItemId, reason),
                      'Work item cancelled successfully',
                      'Error cancelling work item'
                    );
                  }
                }}
              >
                <FiTrash2 size={16} color="var(--chakra-colors-mukuru-text-error)" />
              </Box>
            </Tooltip>
          )}
        </HStack>
      );
    },
  };

  if (loading && workItems.length === 0) {
    return (
      <Flex minH="100vh" bg={bgColor}>
        <AdminSidebar />
        <PortalHeader />
        <Box
          flex="1"
          ml={condensed ? '72px' : '280px'}
          mt="90px"
          minH="calc(100vh - 90px)"
          width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
          bg={bgColor}
        >
          <Flex justify="center" align="center" h="400px">
            <VStack gap="4">
              <Spinner size="xl" color="mukuru.buttons.primary" />
              <Typography color={textColor}>Loading work queue...</Typography>
            </VStack>
          </Flex>
        </Box>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <AdminSidebar />
      <PortalHeader />

      {/* Error Alert */}
      {error && (
        <Box position="fixed" top="100px" right="24px" zIndex={10000} maxW="400px">
          <AlertBar
            status="error"
            title="Error"
            description={error}
            onClose={() => setError(null)}
          />
        </Box>
      )}

      {/* Toast Notification */}
      {toast && (
        <Box position="fixed" top={error ? "160px" : "100px"} right="24px" zIndex={10001} maxW="400px">
          <AlertBar
            status={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => setToast(null)}
          />
        </Box>
      )}

      <Box
        ml={condensed ? '72px' : '280px'}
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        bg={bgColor}
        px="8"
        py="6"
      >
        {/* Header - Requirements Style */}
        <Flex justify="space-between" align="center" mb="6">
          <VStack align="start" gap="2px">
            <Typography fontSize="24px" fontWeight="700" color={textColor}>
              Work Queue
            </Typography>
            <Typography fontSize="14px" color="mukuru.grey.600">
              Manage and review onboarding applications
            </Typography>
          </VStack>
          <HStack gap="3">
            <Tooltip content="Refresh" showArrow variant="light">
              <Box
                as="button"
                p="2"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                onClick={() => !loading && setRefreshKey((prev) => prev + 1)}
                opacity={loading ? 0.5 : 1}
                cursor={loading ? 'not-allowed' : 'pointer'}
              >
                <FiRefreshCw size={18} color="var(--chakra-colors-mukuru-charcoal)" className={loading ? 'animate-spin' : ''} />
              </Box>
            </Tooltip>
            <Button
              variant="ghost"
              leftIcon={<FiDownload size={16} />}
              onClick={handleExport}
              disabled={exporting || loading}
            >
              Export
            </Button>
          </HStack>
        </Flex>

        {/* Stats Row - Inline like Entity Types */}
        <HStack gap="12" mb="4">
          <HStack gap="2" cursor="pointer" onClick={() => setActiveTab('All')}>
            <Typography fontSize="xs" color={subtleText} textTransform="uppercase" letterSpacing="wide">
              Total Items
            </Typography>
            <Typography fontSize="sm" fontWeight="600" color={textColor}>
              {tabCounts.all}
            </Typography>
          </HStack>
          <HStack gap="2" cursor="pointer" onClick={() => setActiveTab('Active')}>
            <Typography fontSize="xs" color={subtleText} textTransform="uppercase" letterSpacing="wide">
              Active
            </Typography>
            <Typography fontSize="sm" fontWeight="600" color="mukuru.buttons.primary">
              {tabCounts.active}
            </Typography>
          </HStack>
          <HStack gap="2" cursor="pointer" onClick={() => setActiveTab('Completed')}>
            <Typography fontSize="xs" color={subtleText} textTransform="uppercase" letterSpacing="wide">
              Completed
            </Typography>
            <Typography fontSize="sm" fontWeight="600" color="mukuru.teal">
              {tabCounts.completed}
            </Typography>
          </HStack>
          <HStack gap="2">
            <Typography fontSize="xs" color={subtleText} textTransform="uppercase" letterSpacing="wide">
              Overdue
            </Typography>
            <Typography fontSize="sm" fontWeight="600" color="mukuru.text.error">
              {workItems.filter((item) => item.isOverdue).length}
            </Typography>
          </HStack>
        </HStack>

        {/* Tabs - Entity Types Style */}
        <HStack gap="6" mb="6">
          <Tab
            label="All"
            isActive={activeTab === 'All'}
            onClick={() => setActiveTab('All')}
          />
          <Tab
            label="Active"
            isActive={activeTab === 'Active'}
            onClick={() => setActiveTab('Active')}
          />
          <Tab
            label="Completed"
            isActive={activeTab === 'Completed'}
            onClick={() => setActiveTab('Completed')}
          />
          <Tab
            label="My Items"
            isActive={activeTab === 'MyItems'}
            onClick={() => setActiveTab('MyItems')}
          />
          <Tab
            label="Pending Approvals"
            isActive={activeTab === 'PendingApprovals'}
            onClick={() => setActiveTab('PendingApprovals')}
          />
        </HStack>

        {/* Search Row - Entity Types Style */}
        <Flex justify="space-between" align="center" mb="6">
          <Box w="300px">
            <Search
              placeholder="Search by name, code..."
              onSearchChange={handleSearchChange}
            />
          </Box>
          <HStack gap="2">
            <Button
              variant="ghost"
              leftIcon={<FiFilter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </HStack>
        </Flex>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Box
            bg={cardBg}
            p="4"
            borderRadius="md"
            border="1px solid"
            borderColor={borderColor}
            mb="4"
          >
            <SimpleGrid columns={{ base: 1, md: 4 }} gap="3">
              <Box>
                <Typography fontSize="xs" fontWeight="500" mb="1.5" color={labelColor}>
                  Priority
                </Typography>
                <Dropdown
                  items={[
                    { value: '', label: 'All Priorities' },
                    { value: 'Critical', label: 'Critical' },
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' },
                  ]}
                  defaultValue={filters.priority || ''}
                  onSelectionChange={(value: string) => setFilters({ ...filters, priority: value || undefined })}
                  placeholder="Select Priority"
                />
              </Box>
              <Box>
                <Typography fontSize="xs" fontWeight="500" mb="1.5" color={labelColor}>
                  Risk Level
                </Typography>
                <Dropdown
                  items={[
                    { value: '', label: 'All Risk Levels' },
                    { value: 'Critical', label: 'Critical' },
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' },
                    { value: 'Unknown', label: 'Unknown' },
                  ]}
                  defaultValue={filters.riskLevel || ''}
                  onSelectionChange={(value: string) => setFilters({ ...filters, riskLevel: value || undefined })}
                  placeholder="Select Risk Level"
                />
              </Box>
              <Box>
                <Typography fontSize="xs" fontWeight="500" mb="1.5" color={labelColor}>
                  Status
                </Typography>
                <Dropdown
                  items={[
                    { value: '', label: 'All Statuses' },
                    { value: 'New', label: 'New' },
                    { value: 'Assigned', label: 'Assigned' },
                    { value: 'InProgress', label: 'In Progress' },
                    { value: 'PendingApproval', label: 'Pending Approval' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Declined', label: 'Declined' },
                  ]}
                  defaultValue={filters.status || ''}
                  onSelectionChange={(value: string) => setFilters({ ...filters, status: value || undefined })}
                  placeholder="Select Status"
                />
              </Box>
              <Box>
                <Typography fontSize="xs" fontWeight="500" mb="1.5" color={labelColor}>
                  Assigned To
                </Typography>
                <Dropdown
                  items={[
                    { value: '', label: 'All Users' },
                    { value: 'unassigned', label: 'Unassigned' },
                    { value: currentUserId, label: 'Me' },
                  ]}
                  defaultValue={filters.assignedTo || ''}
                  onSelectionChange={(value: string) => {
                    if (value === 'unassigned') {
                      setFilters({ ...filters, assignedTo: 'unassigned' });
                    } else if (value === currentUserId) {
                      setFilters({ ...filters, assignedTo: currentUserId });
                    } else {
                      setFilters({ ...filters, assignedTo: undefined });
                    }
                  }}
                  placeholder="Select Assignee"
                />
              </Box>
            </SimpleGrid>
          </Box>
        )}

        {/* Table - Requirements Style */}
        <Box
          bg={cardBg}
          borderRadius="8px"
          border="1px solid"
          borderColor={borderColor}
          overflow="hidden"
          className="work-queue-table-card"
        >
          <style>{`
            /* Make DataTable fill container */
            .work-queue-table-card > div {
              height: 100% !important;
              display: flex !important;
              flex-direction: column !important;
            }
            .work-queue-table-card > div > div:last-child {
              flex: 1 !important;
              overflow: auto !important;
            }
            /* Table container - use auto layout for better column sizing */
            .work-queue-table-card table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: auto !important;
            }
            /* Ensure proper column spacing */
            .work-queue-table-card th,
            .work-queue-table-card td {
              padding: 12px 16px !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              vertical-align: middle !important;
            }
            /* Table header - clean flat design */
            .work-queue-table-card thead {
              background: var(--chakra-colors-mukuru-background-light) !important;
            }
            .work-queue-table-card thead th,
            .work-queue-table-card th[role="columnheader"] {
              font-size: 11px !important;
              font-weight: 600 !important;
              padding: 14px 16px !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
              color: var(--chakra-colors-mukuru-grey-mediumDark) !important;
              border-bottom: 1px solid var(--chakra-colors-mukuru-grey-light) !important;
              white-space: nowrap !important;
              background: transparent !important;
              line-height: 1.2 !important;
            }
            /* Remove ALL container/pill styling */
            .work-queue-table-card thead th *,
            .work-queue-table-card th[role="columnheader"] * {
              background: none !important;
              background-color: transparent !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            /* Header content - simple flex layout */
            .work-queue-table-card thead th > div {
              display: inline-flex !important;
              align-items: center !important;
              gap: 4px !important;
              background: none !important;
              border: none !important;
              padding: 0 !important;
            }
            /* Header text */
            .work-queue-table-card thead th,
            .work-queue-table-card thead th * {
              font-size: 11px !important;
              font-weight: 600 !important;
              color: var(--chakra-colors-mukuru-grey-mediumDark) !important;
              font-family: 'Madera', sans-serif !important;
            }
            /* Sort icon - small and subtle */
            .work-queue-table-card thead th svg {
              width: 10px !important;
              height: 10px !important;
              color: var(--chakra-colors-mukuru-grey-medium) !important;
              flex-shrink: 0 !important;
            }
            /* Actions column - center aligned */
            .work-queue-table-card thead th:last-child {
              text-align: center !important;
            }
            .work-queue-table-card td:last-child {
              text-align: center !important;
            }
            /* Table body rows */
            .work-queue-table-card tbody tr {
              border-bottom: 1px solid var(--chakra-colors-mukuru-grey-light) !important;
            }
            .work-queue-table-card tbody tr:hover {
              background-color: var(--chakra-colors-mukuru-state-hover) !important;
            }
            /* Table cells */
            .work-queue-table-card tbody td {
              padding: 12px 16px !important;
              font-size: 13px !important;
              color: var(--chakra-colors-mukuru-text-primary) !important;
            }
            /* Cell content truncation */
            .work-queue-table-card td > div,
            .work-queue-table-card td > span,
            .work-queue-table-card td > p {
              max-width: 100% !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            /* Ensure VStack alignment in cells */
            .work-queue-table-card td .chakra-stack {
              align-items: flex-start !important;
            }
          `}</style>
          <DataTable
            data={filteredWorkItems as unknown as Record<string, unknown>[]}
            columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
            showActions={true}
            actionColumn={
              actionColumn as unknown as {
                header?: string;
                width?: string;
                render: (row: Record<string, unknown>, index: number) => React.ReactNode;
              }
            }
            loading={loading}
            emptyState={{
              message: 'No work items found',
              content: (
                <VStack gap="4" py="12">
                  <Typography fontSize="sm" color={subtleText}>
                    {searchTerm
                      ? 'No work items match your search criteria'
                      : 'Work items will appear here once applications are submitted'}
                  </Typography>
                </VStack>
              ),
            }}
          />
        </Box>

        {/* Pagination - Entity Types Style */}
        {totalCount > 0 && (
          <Flex justify="space-between" align="center" mt="4">
            <HStack gap="2">
              <Typography fontSize="sm" color={subtleText}>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} items
              </Typography>
              <Typography fontSize="sm" fontWeight="500" color={textColor}>
                {pageSize}
              </Typography>
              <Typography fontSize="sm" color={subtleText}>per page</Typography>
            </HStack>
            <HStack gap="2">
              <HStack
                as="button"
                gap="1"
                opacity={currentPage === 1 || loading ? 0.4 : 1}
                cursor={currentPage === 1 || loading ? 'not-allowed' : 'pointer'}
                onClick={() => currentPage > 1 && !loading && setCurrentPage(prev => prev - 1)}
                _hover={{ color: 'mukuru.charcoal' }}
              >
                <FiChevronLeft size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
                <Typography fontSize="sm" color={subtleText}>Previous</Typography>
              </HStack>
              <HStack gap="1">
                {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => {
                  const totalPages = Math.ceil(totalCount / pageSize);
                  let pageNum: number;
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Box
                      key={pageNum}
                      as="button"
                      px="3"
                      py="1"
                      borderRadius="md"
                      bg={currentPage === pageNum ? 'mukuru.buttons.primary' : 'transparent'}
                      color={currentPage === pageNum ? 'white' : subtleText}
                      fontSize="sm"
                      fontWeight="500"
                      _hover={{ bg: currentPage === pageNum ? 'mukuru.buttons.primary' : 'mukuru.state.hover' }}
                      onClick={() => !loading && setCurrentPage(pageNum)}
                      cursor={loading ? 'not-allowed' : 'pointer'}
                      minW="28px"
                    >
                      {pageNum}
                    </Box>
                  );
                })}
              </HStack>
              <HStack
                as="button"
                gap="1"
                opacity={currentPage >= Math.ceil(totalCount / pageSize) || loading ? 0.4 : 1}
                cursor={currentPage >= Math.ceil(totalCount / pageSize) || loading ? 'not-allowed' : 'pointer'}
                onClick={() => currentPage < Math.ceil(totalCount / pageSize) && !loading && setCurrentPage(prev => prev + 1)}
                _hover={{ color: 'mukuru.charcoal' }}
              >
                <Typography fontSize="sm" color={subtleText}>Next</Typography>
                <FiChevronRight size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
              </HStack>
            </HStack>
          </Flex>
        )}

        {/* Assign Work Item Modal */}
        <Modal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedWorkItemId(null);
            setSelectedUserId('');
          }}
          title=""
          size="small"
          closeOnBackdropClick={true}
          closeOnEsc={true}
        >
          {/* Custom Modal Content - Clean Professional Design */}
          <Box>
            {/* Header Section */}
            <Box 
              px="24px" 
              pt="24px" 
              pb="20px"
              borderBottom="1px solid"
              borderColor={borderColor}
            >
              <HStack gap="16px" align="flex-start">
                {/* Icon Container */}
                <Flex
                  w="48px"
                  h="48px"
                  borderRadius="12px"
                  bg="rgba(240, 84, 35, 0.1)"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <FiUserPlus size={24} color="var(--chakra-colors-mukuru-buttons-primary)" />
                </Flex>
                
                {/* Title & Description */}
                <VStack align="flex-start" gap="4px" flex="1">
                  <Typography 
                    fontSize="18px" 
                    fontWeight="600" 
                    color={textColor}
                    lineHeight="1.3"
                  >
                    Assign Work Item
                  </Typography>
                  <Typography 
                    fontSize="14px" 
                    color={subtleText}
                    lineHeight="1.4"
                  >
                    Select a team member to handle this work item
                  </Typography>
                </VStack>
              </HStack>
            </Box>

            {/* Body Section */}
            <Box px="24px" py="24px">
              {usersLoading ? (
                <Flex 
                  justify="center" 
                  align="center" 
                  py="40px"
                  bg={bgColor}
                  borderRadius="8px"
                  border="1px dashed"
                  borderColor={borderColor}
                >
                  <VStack gap="12px">
                    <Spinner size="lg" color="mukuru.buttons.primary" />
                    <Typography fontSize="14px" color={subtleText}>
                      Loading team members...
                    </Typography>
                  </VStack>
                </Flex>
              ) : users.length === 0 ? (
                <Flex 
                  justify="center" 
                  align="center" 
                  py="40px"
                  bg={bgColor}
                  borderRadius="8px"
                  border="1px dashed"
                  borderColor={borderColor}
                >
                  <VStack gap="12px">
                    <Flex
                      w="56px"
                      h="56px"
                      borderRadius="full"
                      bg="mukuru.grey.light"
                      align="center"
                      justify="center"
                    >
                      <FiUser size={28} color="var(--chakra-colors-mukuru-grey-medium)" />
                    </Flex>
                    <VStack gap="4px">
                      <Typography fontSize="14px" fontWeight="500" color={textColor}>
                        No Team Members
                      </Typography>
                      <Typography fontSize="13px" color={subtleText}>
                        There are no users available for assignment
                      </Typography>
                    </VStack>
                  </VStack>
                </Flex>
              ) : (
                <VStack align="stretch" gap="20px">
                  {/* Form Field - Custom User Selection */}
                  <Box>
                    <Typography 
                      fontSize="13px" 
                      fontWeight="500" 
                      color={labelColor} 
                      mb="12px"
                    >
                      Select Team Member
                    </Typography>
                    
                    {/* User List */}
                    <Box
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="10px"
                      overflow="hidden"
                      bg="white"
                    >
                      <Box 
                        maxH="240px" 
                        overflowY="auto"
                        css={{
                          '&::-webkit-scrollbar': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'var(--chakra-colors-mukuru-grey-light)',
                            borderRadius: '3px',
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            background: 'var(--chakra-colors-mukuru-grey-medium)',
                          },
                        }}
                      >
                        {users.map((user, index) => {
                          const isSelected = selectedUserId === user.id;
                          const initials = user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);
                          
                          return (
                            <Box
                              key={user.id}
                              as="button"
                              w="100%"
                              p="12px 16px"
                              display="flex"
                              alignItems="center"
                              gap="12px"
                              bg={isSelected ? 'rgba(240, 84, 35, 0.08)' : 'transparent'}
                              borderBottom={index < users.length - 1 ? '1px solid' : 'none'}
                              borderColor={borderColor}
                              cursor="pointer"
                              transition="all 0.15s ease"
                              _hover={{
                                bg: isSelected ? 'rgba(240, 84, 35, 0.12)' : 'mukuru.state.hover',
                              }}
                              onClick={() => setSelectedUserId(user.id)}
                              textAlign="left"
                            >
                              {/* Avatar */}
                              <Flex
                                w="36px"
                                h="36px"
                                borderRadius="full"
                                bg={isSelected ? 'mukuru.buttons.primary' : 'mukuru.grey.light'}
                                align="center"
                                justify="center"
                                flexShrink={0}
                                transition="all 0.15s ease"
                              >
                                <Typography 
                                  fontSize="12px" 
                                  fontWeight="600" 
                                  color={isSelected ? 'white' : 'mukuru.grey.mediumDark'}
                                >
                                  {initials}
                                </Typography>
                              </Flex>
                              
                              {/* User Info */}
                              <VStack align="flex-start" gap="2px" flex="1" minW="0">
                                <Typography 
                                  fontSize="14px" 
                                  fontWeight={isSelected ? '600' : '500'}
                                  color={isSelected ? 'mukuru.buttons.primary' : textColor}
                                  lineHeight="1.3"
                                >
                                  {user.name}
                                </Typography>
                                {user.email && (
                                  <Typography 
                                    fontSize="12px" 
                                    color={subtleText}
                                    lineHeight="1.2"
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: '100%',
                                    }}
                                  >
                                    {user.email}
                                  </Typography>
                                )}
                              </VStack>
                              
                              {/* Selection Indicator */}
                              {isSelected && (
                                <Flex
                                  w="20px"
                                  h="20px"
                                  borderRadius="full"
                                  bg="mukuru.buttons.primary"
                                  align="center"
                                  justify="center"
                                  flexShrink={0}
                                >
                                  <FiCheck size={12} color="white" />
                                </Flex>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                    
                    {/* Selected User Summary */}
                    {selectedUserId && (
                      <HStack 
                        mt="12px" 
                        p="10px 12px" 
                        bg="rgba(240, 84, 35, 0.06)"
                        borderRadius="8px"
                        border="1px solid"
                        borderColor="rgba(240, 84, 35, 0.2)"
                      >
                        <FiCheck size={14} color="var(--chakra-colors-mukuru-buttons-primary)" />
                        <Typography fontSize="13px" color={textColor}>
                          <Box as="span" fontWeight="500">
                            {users.find(u => u.id === selectedUserId)?.name}
                          </Box>
                          {' '}will be assigned this work item
                        </Typography>
                      </HStack>
                    )}
                  </Box>
                </VStack>
              )}
            </Box>

            {/* Footer Section */}
            <Box 
              px="24px" 
              py="16px"
              borderTop="1px solid"
              borderColor={borderColor}
              bg={bgColor}
            >
              <HStack gap="12px" justify="flex-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAssignModalOpen(false);
                    setSelectedWorkItemId(null);
                    setSelectedUserId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAssignWorkItem}
                  disabled={!selectedUserId || usersLoading}
                  leftIcon={<FiUserPlus size={16} />}
                >
                  Assign
                </Button>
              </HStack>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
}
