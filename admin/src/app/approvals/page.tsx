'use client';

import { Box, Flex, Textarea, VStack, HStack, Spinner } from '@chakra-ui/react';
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
  Tag,
  TickIcon as CheckIcon,
  DeleteIcon,
  VisibleIcon,
} from '@mukuru/mukuru-react-components';
import type { ColumnConfig } from '@mukuru/mukuru-react-components';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import { FiCheckCircle, FiXCircle, FiRefreshCw, FiEdit2 } from 'react-icons/fi';
import {
  approveWorkItemUseCase,
  declineWorkItemUseCase,
  getWorkItems,
  WorkItemDto,
} from '../../services';
import { getPendingApprovals } from '../../services/api/workQueueApi';
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

type TabFilter = 'PENDING' | 'DECLINED' | 'ALL';

export default function ApprovalsPage() {
  const { condensed } = useSidebar();

  // Mukuru Design System color tokens - matching work-queue page
  const bgColor = 'mukuru.background.light';
  const cardBg = 'mukuru.cards.white';
  const textColor = 'mukuru.text.primary';
  const borderColor = 'mukuru.grey.light';
  const subtleText = 'mukuru.grey.medium';

  const [allApprovals, setAllApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('PENDING');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  // Load data on mount and when refreshKey changes
  const loadApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [pendingResult, declinedResult] = await Promise.all([
        getPendingApprovals(1, 1000),
        getWorkItems({ status: 'Declined', page: 1, pageSize: 1000 }),
      ]);

      const pendingApprovals = pendingResult.items.map(mapWorkItemToApproval);
      const declinedItems = declinedResult.items.map(mapWorkItemToApproval);
      const reviewCompletedItems = [...pendingApprovals, ...declinedItems];
      const uniqueItems = Array.from(
        new Map(reviewCompletedItems.map((item) => [item.id, item])).values()
      );

      setAllApprovals(uniqueItems);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load approvals';
      logger.error(err, '[Approvals Page] Error loading approvals');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals, refreshKey]);

  // Filter approvals based on tab and search
  const filteredApprovals = useMemo(() => {
    let filtered = allApprovals;

    // Filter by tab
    if (activeTab === 'PENDING') {
      filtered = filtered.filter((item) => item.status === 'PENDING');
    } else if (activeTab === 'DECLINED') {
      filtered = filtered.filter((item) => item.status === 'REJECTED');
    }

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.companyName.toLowerCase().includes(search) ||
          item.applicationId.toLowerCase().includes(search) ||
          (item.workItemNumber && item.workItemNumber.toLowerCase().includes(search))
      );
    }

    return filtered;
  }, [allApprovals, activeTab, searchTerm]);

  // Stats
  const stats = useMemo(
    () => ({
      pending: allApprovals.filter((a) => a.status === 'PENDING').length,
      rejected: allApprovals.filter((a) => a.status === 'REJECTED').length,
      total: allApprovals.length,
    }),
    [allApprovals]
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

  // Tab component - matching work-queue page style (underline on active)
  const Tab = ({
    label,
    isActive,
    onClick,
  }: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
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

      <Box
        ml={condensed ? '72px' : '280px'}
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        bg={bgColor}
        px="8"
        py="6"
      >
        {/* Header */}
        <Flex justify="space-between" align="center" mb="8">
          <VStack align="start" gap="1">
            <Typography fontSize="24px" fontWeight="700" color={textColor}>
              Approvals
            </Typography>
            <Typography fontSize="14px" color={subtleText}>
              Review completed cases - pending approval or declined
            </Typography>
          </VStack>
          <Tooltip content="Refresh" showArrow variant="light">
            <Box
              as="button"
              p="2"
              borderRadius="md"
              bg="transparent"
              _hover={{ bg: 'mukuru.state.hover' }}
              onClick={() => setRefreshKey((prev) => prev + 1)}
            >
              <FiRefreshCw size={18} color="var(--chakra-colors-mukuru-charcoal)" />
            </Box>
          </Tooltip>
        </Flex>

        {/* Tabs */}
        <HStack gap="6" mb="6" borderBottom="1px solid" borderColor={borderColor} pb="0">
          <Tab
            label="Pending Approval"
            isActive={activeTab === 'PENDING'}
            onClick={() => setActiveTab('PENDING')}
          />
          <Tab
            label="Declined"
            isActive={activeTab === 'DECLINED'}
            onClick={() => setActiveTab('DECLINED')}
          />
          <Tab
            label="All"
            isActive={activeTab === 'ALL'}
            onClick={() => setActiveTab('ALL')}
          />
        </HStack>

        {/* Search */}
        <Flex justify="space-between" align="center" mb="6">
          <Box w="300px">
            <Search
              placeholder="Search by name, ID..."
              onSearchChange={handleSearchChange}
            />
          </Box>
        </Flex>

        {/* Data Table */}
        <Box
          bg={cardBg}
          borderRadius="8px"
          border="1px solid"
          borderColor={borderColor}
          overflow="hidden"
          className="approvals-table-card"
        >
          <style>{`
            .approvals-table-card table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: auto !important;
            }
            .approvals-table-card th,
            .approvals-table-card td {
              padding: 12px 16px !important;
              vertical-align: middle !important;
            }
            .approvals-table-card thead {
              background: var(--chakra-colors-mukuru-background-light) !important;
            }
            .approvals-table-card thead th {
              font-size: 11px !important;
              font-weight: 600 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
              color: var(--chakra-colors-mukuru-grey-mediumDark) !important;
              border-bottom: 1px solid var(--chakra-colors-mukuru-grey-light) !important;
              white-space: nowrap !important;
            }
            .approvals-table-card tbody tr {
              border-bottom: 1px solid var(--chakra-colors-mukuru-grey-light) !important;
            }
            .approvals-table-card tbody tr:hover {
              background-color: var(--chakra-colors-mukuru-state-hover) !important;
            }
            .approvals-table-card tbody td {
              font-size: 13px !important;
              color: var(--chakra-colors-mukuru-text-primary) !important;
            }
          `}</style>
          <DataTable
            data={filteredApprovals as unknown as Record<string, unknown>[]}
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
              message: 'No approvals found',
              content: (
                <VStack gap="4" py="12">
                  <Box
                    width="14"
                    height="14"
                    borderRadius="full"
                    bg="mukuru.grey.light"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiCheckCircle
                      size={28}
                      color="var(--chakra-colors-mukuru-grey-medium)"
                    />
                  </Box>
                  <Typography fontSize="sm" color={subtleText} textAlign="center">
                    {activeTab === 'PENDING'
                      ? 'Cases that have completed review and are awaiting approval will appear here'
                      : activeTab === 'DECLINED'
                        ? 'Cases that were declined after review will appear here'
                        : 'Cases that have completed review will appear here'}
                  </Typography>
                </VStack>
              ),
            }}
          />
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
          <Typography fontSize="lg" fontWeight="600" color={textColor}>
            Review Approval Request
          </Typography>
        </ModalHeader>
        <ModalBody>
          <VStack gap="4" align="stretch">
            <Box
              bg="mukuru.grey.light"
              borderRadius="md"
              p="4"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack align="start" gap="3">
                <Flex justify="space-between" width="100%">
                  <Typography fontSize="sm" color={subtleText} fontWeight="500">
                    Company
                  </Typography>
                  <Typography fontSize="sm" fontWeight="600" color={textColor}>
                    {selectedApproval?.companyName}
                  </Typography>
                </Flex>
                <Flex justify="space-between" width="100%">
                  <Typography fontSize="sm" color={subtleText} fontWeight="500">
                    Application ID
                  </Typography>
                  <Typography fontSize="sm" fontWeight="600" color={textColor}>
                    {selectedApproval?.applicationId}
                  </Typography>
                </Flex>
                <Flex justify="space-between" width="100%">
                  <Typography fontSize="sm" color={subtleText} fontWeight="500">
                    Risk Level
                  </Typography>
                  <Tag
                    variant={
                      selectedApproval?.riskLevel === 'HIGH' ||
                      selectedApproval?.riskLevel === 'CRITICAL'
                        ? 'danger'
                        : selectedApproval?.riskLevel === 'MEDIUM'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {selectedApproval?.riskLevel}
                  </Tag>
                </Flex>
              </VStack>
            </Box>

            <Box>
              <Typography fontSize="sm" color={subtleText} fontWeight="500" mb="2">
                Comments (optional)
              </Typography>
              <Textarea
                placeholder="Add your comments or reason for decision..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
              />
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Flex justify="space-between" width="100%" gap="3">
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

            <HStack gap="3">
              <Button
                variant="ghost"
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
          </Flex>
        </ModalFooter>
      </Modal>
    </Box>
  );
}
