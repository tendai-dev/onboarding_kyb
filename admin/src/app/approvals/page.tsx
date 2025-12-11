'use client';

import {
  Box,
  SimpleGrid,
  Flex,
  Container,
  Textarea,
  VStack,
  HStack,
} from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Typography,
  Card,
  Button,
  Search,
  AlertBar,
  DataTable,
  IconWrapper,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
  ChevronRightIcon,
  Tag,
  TickIcon as CheckIcon,
  DeleteIcon,
  VisibleIcon,
} from '@mukuru/mukuru-react-components';
import type { ColumnConfig } from '@mukuru/mukuru-react-components';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import { FiCheckCircle, FiXCircle, FiClock, FiEdit, FiFilter } from 'react-icons/fi';
import {
  fetchPendingApprovals,
  approveWorkItemUseCase,
  declineWorkItemUseCase,
  getWorkItems,
  WorkItemDto,
  mapWorkItemsToApplications,
  WorkItemApplication,
} from '../../services';
import { logger } from '../../lib/logger';
import { SweetAlert } from '../../utils/sweetAlert';
import Link from 'next/link';

interface Approval {
  id: string;
  applicationId: string;
  companyName: string;
  entityType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CHANGES';
  requestedBy: string;
  requestedDate: string;
  dueDate: string;
  approver?: string;
  approvedDate?: string;
  comments?: string;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  workItemNumber?: string;
  workItemId?: string;
}

function mapWorkItemToApproval(workItem: WorkItemDto): Approval {
  let status: Approval['status'] = 'PENDING';
  if (workItem.status === 'Approved' || workItem.status === 'Completed') {
    status = 'APPROVED';
  } else if (workItem.status === 'Declined') {
    status = 'REJECTED';
  } else if (workItem.status === 'PendingApproval') {
    status = 'PENDING';
  }

  // Fix: Handle undefined riskLevel
  const riskLevelValue = workItem.riskLevel || (workItem as any).risk_level || 'MEDIUM';
  const riskLevel = riskLevelValue.toUpperCase() as Approval['riskLevel'];

  let priority: Approval['priority'] = 'MEDIUM';
  const priorityValue = workItem.priority || '';
  if (priorityValue === 'Urgent') {
    priority = 'URGENT';
  } else if (priorityValue === 'High') {
    priority = 'HIGH';
  } else if (priorityValue === 'Low') {
    priority = 'LOW';
  }

  const workItemAny = workItem as any;
  const applicantName =
    workItemAny.applicantName || workItemAny.applicant_name || 'Unknown';
  const applicationId =
    workItemAny.applicationId || workItemAny.application_id || workItem.id;
  const entityType = workItemAny.entityType || workItemAny.entity_type || 'Unknown';
  const workItemNumber = workItemAny.workItemNumber || workItemAny.work_item_number;
  const dueDate =
    workItemAny.dueDate ||
    workItemAny.due_date ||
    workItemAny.createdAt ||
    workItemAny.created_at ||
    new Date().toISOString();
  const assignedToName =
    workItemAny.assignedToName || workItemAny.assigned_to_name || 'System';
  const approvedByName = workItemAny.approvedByName || workItemAny.approved_by_name;
  const approvedAt = workItemAny.approvedAt || workItemAny.approved_at;
  const rejectionReason = workItemAny.rejectionReason || workItemAny.rejection_reason;
  const requiresApproval =
    workItemAny.requiresApproval || workItemAny.requires_approval || false;

  return {
    id: workItem.id,
    applicationId,
    companyName: applicantName,
    entityType,
    riskLevel,
    status,
    requestedBy: assignedToName,
    requestedDate:
      workItemAny.createdAt || workItemAny.created_at || new Date().toISOString(),
    dueDate,
    approver: approvedByName,
    approvedDate: approvedAt,
    comments: rejectionReason,
    reason: requiresApproval
      ? `Requires approval due to ${riskLevel} risk level`
      : 'Approval required',
    priority,
    workItemNumber,
    workItemId: workItem.id,
  };
}

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CHANGES';

export default function ApprovalsPage() {
  const { condensed } = useSidebar();

  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const headerBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [allApprovals, setAllApprovals] = useState<Approval[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const pendingCount = allApprovals.filter((a) => a.status === 'PENDING').length;
    const approvedCount = allApprovals.filter((a) => a.status === 'APPROVED').length;
    const rejectedCount = allApprovals.filter((a) => a.status === 'REJECTED').length;
    const requiresChangesCount = allApprovals.filter(
      (a) => a.status === 'REQUIRES_CHANGES'
    ).length;
    return {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      requiresChanges: requiresChangesCount,
    };
  }, [allApprovals]);

  // Async fetchData function for DataTable
  const fetchData = useCallback(
    async (params: Record<string, unknown>) => {
      try {
        logger.debug('[Approvals Page] fetchData started');
        setError(null);

        const search = (params.search as string) || searchTerm || '';

        logger.debug('[Approvals Page] fetchData called', {
          statusFilter,
          search,
          params,
        });

        // Fetch pending approvals
        const pendingResult = await fetchPendingApprovals(1, 1000);
        const pendingApprovals = pendingResult.items.map(mapWorkItemToApproval);

        // Fetch all work items to get approved/declined ones
        const [allItemsResult, approvedResult, declinedResult] = await Promise.all([
          getWorkItems({
            page: 1,
            pageSize: 1000,
          }),
          getWorkItems({
            status: 'Completed',
            page: 1,
            pageSize: 1000,
          }),
          getWorkItems({
            status: 'Declined',
            page: 1,
            pageSize: 1000,
          }),
        ]);

        // Map all work items to approvals
        const allItems = [
          ...pendingApprovals,
          ...allItemsResult.items.map(mapWorkItemToApproval),
          ...approvedResult.items.map(mapWorkItemToApproval),
          ...declinedResult.items.map(mapWorkItemToApproval),
        ];

        // Remove duplicates by ID
        const uniqueItems = Array.from(
          new Map(allItems.map((item) => [item.id, item])).values()
        );

        // Filter by status
        let filtered = uniqueItems;
        if (statusFilter !== 'ALL') {
          filtered = uniqueItems.filter((item) => item.status === statusFilter);
        }

        // Filter by search term
        if (search) {
          filtered = filtered.filter(
            (item) =>
              item.companyName.toLowerCase().includes(search.toLowerCase()) ||
              item.applicationId.toLowerCase().includes(search.toLowerCase()) ||
              (item.workItemNumber &&
                item.workItemNumber.toLowerCase().includes(search.toLowerCase()))
          );
        }

        setAllApprovals(uniqueItems);
        setApprovals(filtered);

        logger.debug('[Approvals Page] fetchData completed successfully', {
          count: filtered.length,
        });
        return filtered as unknown as Record<string, unknown>[];
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load approvals';
        logger.error(err, '[Approvals Page] Error in fetchData', {
          tags: { error_type: 'fetch_data' },
        });
        setError(errorMessage);
        return [];
      }
    },
    [statusFilter, searchTerm]
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
  }, []);

  const getStatusColor = (status: Approval['status']) => {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'red';
      case 'REQUIRES_CHANGES':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getRiskColor = (risk: Approval['riskLevel']) => {
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

  const handleApproval = async (approvalId: string, action: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval) return;

    try {
      setProcessing(true);
      SweetAlert.loading(
        action === 'APPROVED' ? 'Approving...' : 'Rejecting...',
        'Please wait while we process your request.'
      );

      if (action === 'APPROVED') {
        await approveWorkItemUseCase(approvalId, approvalComment || undefined);
      } else {
        await declineWorkItemUseCase(
          approvalId,
          approvalComment || 'Rejected by approver'
        );
      }

      SweetAlert.close();
      await SweetAlert.success(
        action === 'APPROVED' ? 'Approved!' : 'Rejected!',
        `The approval request has been ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully.`
      );

      setRefreshKey((prev) => prev + 1);
      setApprovalModalOpen(false);
      setSelectedApproval(null);
      setApprovalComment('');
    } catch (err) {
      SweetAlert.close();
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to ${action === 'APPROVED' ? 'approve' : 'reject'} approval`;
      setError(errorMessage);
      logger.error(
        err,
        `[Approvals Page] Error ${action === 'APPROVED' ? 'approving' : 'rejecting'} approval`,
        {
          tags: { error_type: 'approval_action_error', action },
        }
      );
      await SweetAlert.error(
        action === 'APPROVED' ? 'Approval Failed' : 'Rejection Failed',
        errorMessage
      );
    } finally {
      setProcessing(false);
    }
  };

  const columns: ColumnConfig<Approval>[] = [
    {
      field: 'companyName',
      header: 'Company Name',
      width: '200px',
      minWidth: '200px',
      render: (value, row) => (
        <Typography fontWeight="medium" color="gray.800">
          {row.companyName}
        </Typography>
      ),
    },
    {
      field: 'applicationId',
      header: 'Application ID',
      width: '200px',
      minWidth: '200px',
      render: (value, row) => (
        <Typography color="gray.600" fontSize="xs">
          {row.applicationId}
          {row.workItemNumber && ` • ${row.workItemNumber}`}
        </Typography>
      ),
    },
    {
      field: 'riskLevel',
      header: 'Risk Level',
      width: '120px',
      minWidth: '120px',
      render: (value, row) => (
        <Tag
          variant={
            getRiskColor(row.riskLevel) === 'red'
              ? 'danger'
              : getRiskColor(row.riskLevel) === 'orange'
                ? 'warning'
                : 'info'
          }
        >
          {row.riskLevel}
        </Tag>
      ),
    },
    {
      field: 'status',
      header: 'Status',
      width: '120px',
      minWidth: '120px',
      render: (value, row) => (
        <Tag
          variant={
            getStatusColor(row.status) === 'green'
              ? 'success'
              : getStatusColor(row.status) === 'red'
                ? 'danger'
                : getStatusColor(row.status) === 'orange'
                  ? 'warning'
                  : 'info'
          }
        >
          {row.status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      field: 'dueDate',
      header: 'Due Date',
      width: '120px',
      minWidth: '120px',
      render: (value, row) => (
        <Typography
          fontSize="xs"
          fontWeight="medium"
          color={
            new Date(row.dueDate) < new Date() && row.status === 'PENDING'
              ? 'red.600'
              : 'gray.600'
          }
        >
          {new Date(row.dueDate).toLocaleDateString()}
          {new Date(row.dueDate) < new Date() && row.status === 'PENDING' && (
            <Typography as="span" color="red.500" ml="1" fontSize="xs">
              ⚠
            </Typography>
          )}
        </Typography>
      ),
    },
  ];

  const actionColumn = {
    header: 'Actions',
    width: '200px',
    render: (row: Approval) => (
      <HStack gap="2">
        <Tooltip content="View Application" showArrow variant="light">
          <Link
            href={`/applications/${row.applicationId}`}
            style={{ textDecoration: 'none' }}
          >
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: '6px',
                cursor: 'pointer',
                color: 'mukuru.buttons.primary',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '28px',
                height: '28px',
              }}
              aria-label="View"
            >
              <IconWrapper>
                <VisibleIcon />
              </IconWrapper>
            </button>
          </Link>
        </Tooltip>
        {row.status === 'PENDING' && (
          <Tooltip content="Review & Approve" showArrow variant="light">
            <button
              onClick={() => {
                setSelectedApproval(row);
                setApprovalModalOpen(true);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#F05423',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              Review & Approve
            </button>
          </Tooltip>
        )}
      </HStack>
    ),
  };

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
        overflowX="hidden"
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        {/* Header Section */}
        <Box
          bg={headerBg}
          borderBottom="1px solid"
          borderColor={borderColor}
          boxShadow="sm"
          width="full"
        >
          <Container maxW="100%" px="16px" py="12px" width="full">
            <Flex justify="space-between" align="center" width="full">
              <Flex direction="column" align="start" gap="4px" flex="1">
                <Typography
                  fontSize="28px"
                  fontWeight="600"
                  color={textColor}
                  letterSpacing="-0.02em"
                >
                  Approvals
                </Typography>
                <Typography fontSize="14px" color="mukuru.grey.medium" fontWeight="400">
                  Senior management approval workflow
                </Typography>
              </Flex>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setRefreshKey((prev) => prev + 1)}
                className="mukuru-primary-button"
              >
                <IconWrapper>
                  <FiFilter size={16} />
                </IconWrapper>
                Refresh
              </Button>
            </Flex>
          </Container>
        </Box>

        {/* Content Section */}
        <Box flex="1" bg={bgColor} width="full">
          <Container maxW="100%" px="16px" py="16px" width="full">
            <VStack gap="12px" align="stretch" width="full">
              {/* Error Alert */}
              {error && (
                <AlertBar
                  status="error"
                  title="Error loading approvals"
                  description={error}
                />
              )}

              {/* Summary Cards */}
              <SimpleGrid columns={{ base: 1, md: 4 }} gap="4">
                <Card bg={cardBg} p="4">
                  <Flex gap="4" align="center">
                    <Box
                      bg="orange.100"
                      borderRadius="full"
                      width="48px"
                      height="48px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <IconWrapper>
                        <FiClock size={20} color="#DD6B20" />
                      </IconWrapper>
                    </Box>
                    <VStack align="start" gap="0" flex="1">
                      <Typography fontSize="sm" color="gray.600">
                        Pending Approval
                      </Typography>
                      <Typography
                        fontSize="30px"
                        fontWeight="bold"
                        color="orange.600"
                        fontFamily="Madera, sans-serif"
                      >
                        {stats.pending}
                      </Typography>
                    </VStack>
                    <ChevronRightIcon />
                  </Flex>
                </Card>

                <Card bg={cardBg} p="4">
                  <Flex gap="4" align="center">
                    <Box
                      bg="green.100"
                      borderRadius="full"
                      width="48px"
                      height="48px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <IconWrapper>
                        <FiCheckCircle size={20} color="#38A169" />
                      </IconWrapper>
                    </Box>
                    <VStack align="start" gap="0" flex="1">
                      <Typography fontSize="sm" color="gray.600">
                        Approved
                      </Typography>
                      <Typography
                        fontSize="30px"
                        fontWeight="bold"
                        color="green.600"
                        fontFamily="Madera, sans-serif"
                      >
                        {stats.approved}
                      </Typography>
                    </VStack>
                    <ChevronRightIcon />
                  </Flex>
                </Card>

                <Card bg={cardBg} p="4">
                  <Flex gap="4" align="center">
                    <Box
                      bg="red.100"
                      borderRadius="full"
                      width="48px"
                      height="48px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <IconWrapper>
                        <FiXCircle size={20} color="#E53E3E" />
                      </IconWrapper>
                    </Box>
                    <VStack align="start" gap="0" flex="1">
                      <Typography fontSize="sm" color="gray.600">
                        Rejected
                      </Typography>
                      <Typography
                        fontSize="30px"
                        fontWeight="bold"
                        color="red.600"
                        fontFamily="Madera, sans-serif"
                      >
                        {stats.rejected}
                      </Typography>
                    </VStack>
                    <ChevronRightIcon />
                  </Flex>
                </Card>

                <Card bg={cardBg} p="4">
                  <Flex gap="4" align="center">
                    <Box
                      bg="blue.100"
                      borderRadius="full"
                      width="48px"
                      height="48px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <IconWrapper>
                        <FiEdit size={20} color="#3182CE" />
                      </IconWrapper>
                    </Box>
                    <VStack align="start" gap="0" flex="1">
                      <Typography fontSize="sm" color="gray.600">
                        Requires Changes
                      </Typography>
                      <Typography
                        fontSize="30px"
                        fontWeight="bold"
                        color="blue.600"
                        fontFamily="Madera, sans-serif"
                      >
                        {stats.requiresChanges}
                      </Typography>
                    </VStack>
                    <ChevronRightIcon />
                  </Flex>
                </Card>
              </SimpleGrid>

              {/* Status Filter Buttons */}
              <Flex gap="8px" mb="8px" wrap="wrap" align="center">
                {(
                  [
                    'ALL',
                    'PENDING',
                    'APPROVED',
                    'REJECTED',
                    'REQUIRES_CHANGES',
                  ] as StatusFilter[]
                ).map((filter) => {
                  const isActive = statusFilter === filter;
                  return (
                    <Button
                      key={filter}
                      size="sm"
                      variant={isActive ? 'primary' : 'secondary'}
                      onClick={() => setStatusFilter(filter)}
                      className={isActive ? 'mukuru-primary-button' : ''}
                      style={{
                        ...(isActive
                          ? {}
                          : {
                              backgroundColor: 'white',
                              color: '#E8590C',
                              borderColor: '#E8590C',
                              borderWidth: '1px',
                              borderStyle: 'solid',
                            }),
                      }}
                    >
                      {filter === 'ALL'
                        ? 'All'
                        : filter === 'REQUIRES_CHANGES'
                          ? 'Requires Changes'
                          : filter}
                    </Button>
                  );
                })}
              </Flex>

              {/* Search Bar */}
              <Box width="100%" maxW="800px" mb="4px">
                <Search
                  placeholder="Search by company name or application ID..."
                  onSearchChange={handleSearchChange}
                />
              </Box>

              {/* Approvals Table */}
              <Box
                bg={cardBg}
                borderRadius="xl"
                boxShadow="sm"
                border="1px solid"
                borderColor="mukuru.grey.light"
                overflow="hidden"
                color={textColor}
                className="work-queue-table-wrapper"
                width="100%"
              >
                <DataTable
                  key={`approvals-${statusFilter}-${searchTerm}-${refreshKey}`}
                  fetchData={fetchData}
                  columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
                  tableId="approvals"
                  showActions={true}
                  actionColumn={
                    actionColumn as unknown as {
                      header?: string;
                      width?: string;
                      render: (
                        row: Record<string, unknown>,
                        index: number
                      ) => React.ReactNode;
                    }
                  }
                  emptyState={{
                    message:
                      approvals.length === 0
                        ? 'No approvals found'
                        : 'No approvals match your search criteria',
                    content: (
                      <VStack gap="4">
                        <Typography fontSize="sm" color="mukuru.grey.medium">
                          {approvals.length === 0
                            ? 'Approvals will appear here once they are created'
                            : 'Try adjusting your search criteria or filters'}
                        </Typography>
                      </VStack>
                    ),
                  }}
                />
              </Box>
            </VStack>
          </Container>
        </Box>
      </Box>

      {/* Approval Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => {
          setApprovalModalOpen(false);
          setSelectedApproval(null);
          setApprovalComment('');
        }}
        title="Review Approval Request"
        size="small"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="bold" color="gray.800">
            Review Approval Request
          </Typography>
        </ModalHeader>
        <ModalBody>
          <VStack gap="4" align="stretch">
            <Box>
              <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                Company: {selectedApproval?.companyName}
              </Typography>
              <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                Application: {selectedApproval?.applicationId}
              </Typography>
              <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                Reason: {selectedApproval?.reason}
              </Typography>
            </Box>

            <Textarea
              placeholder="Add your comments..."
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              rows={3}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack justify="space-between" w="full">
            <Button
              variant="secondary"
              onClick={() => {
                setApprovalModalOpen(false);
                setSelectedApproval(null);
                setApprovalComment('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>

            <HStack gap="2">
              <Button
                variant="primary"
                className="mukuru-primary-button"
                onClick={() =>
                  selectedApproval &&
                  handleApproval(
                    selectedApproval.workItemId || selectedApproval.id,
                    'REJECTED'
                  )
                }
                disabled={processing}
              >
                <IconWrapper>
                  <DeleteIcon />
                </IconWrapper>
                Reject
              </Button>

              <Button
                variant="primary"
                className="mukuru-primary-button"
                onClick={() =>
                  selectedApproval &&
                  handleApproval(
                    selectedApproval.workItemId || selectedApproval.id,
                    'APPROVED'
                  )
                }
                disabled={processing}
              >
                <IconWrapper>
                  <CheckIcon />
                </IconWrapper>
                Approve
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </Modal>
    </Flex>
  );
}
