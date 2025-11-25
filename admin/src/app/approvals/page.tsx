"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  SimpleGrid,
  Flex,
  Spinner,
  Textarea,
  Avatar
} from "@chakra-ui/react";
import { 
  Search, 
  Typography, 
  Button, 
  Tag, 
  AlertBar, 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  IconWrapper,
  Card,
  DataTable,
  Tooltip,
  ChevronRightIcon
} from "@/lib/mukuruImports";
import type { ColumnConfig } from "@mukuru/mukuru-react-components";
import { 
  FiCheckCircle, 
  FiXCircle,
  FiClock,
  FiUser,
  FiEdit,
  FiAlertTriangle,
  FiFilter
} from "react-icons/fi";
import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import PortalHeader from "../../components/PortalHeader";
import { useSidebar } from "../../contexts/SidebarContext";
import {
  fetchPendingApprovals,
  approveWorkItemUseCase,
  declineWorkItemUseCase,
  getWorkItems,
  WorkItemDto,
} from "../../services";
import { logger } from "../../lib/logger";
import { SweetAlert } from "../../utils/sweetAlert";

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
}

function mapWorkItemToApproval(workItem: WorkItemDto): Approval {
  let status: Approval['status'] = 'PENDING';
  if (workItem.status === 'Approved') {
    status = 'APPROVED';
  } else if (workItem.status === 'Declined') {
    status = 'REJECTED';
  } else if (workItem.status === 'PendingApproval') {
    status = 'PENDING';
  }

  const riskLevel = workItem.riskLevel.toUpperCase() as Approval['riskLevel'];
  
  let priority: Approval['priority'] = 'MEDIUM';
  if (workItem.priority === 'Urgent') {
    priority = 'URGENT';
  } else if (workItem.priority === 'High') {
    priority = 'HIGH';
  } else if (workItem.priority === 'Low') {
    priority = 'LOW';
  }

  return {
    id: workItem.id,
    applicationId: workItem.applicationId,
    companyName: workItem.applicantName || 'Unknown',
    entityType: workItem.entityType || 'Unknown',
    riskLevel,
    status,
    requestedBy: workItem.assignedToName || 'System',
    requestedDate: workItem.createdAt,
    dueDate: workItem.dueDate,
    approver: workItem.approvedByName,
    approvedDate: workItem.approvedAt,
    comments: workItem.rejectionReason,
    reason: workItem.requiresApproval 
      ? `Requires approval due to ${workItem.riskLevel} risk level`
      : 'Approval required',
    priority,
    workItemNumber: workItem.workItemNumber
  };
}

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CHANGES';

export default function ApprovalsPage() {
  const { condensed } = useSidebar();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [allApprovals, setAllApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.debug('[Approvals Page] Loading approvals...');
      
      const pendingResult = await fetchPendingApprovals(1, 100);
      const pendingApprovals = pendingResult.items.map(mapWorkItemToApproval);
      
      const [allItemsResult, approvedResult, declinedResult] = await Promise.all([
        getWorkItems({
          page: 1,
          pageSize: 100
        }),
        getWorkItems({
          status: 'Completed',
          page: 1,
          pageSize: 100
        }),
        getWorkItems({
          status: 'Declined',
          page: 1,
          pageSize: 100
        })
      ]);
      
      const allItems = [
        ...pendingApprovals,
        ...allItemsResult.items.map(mapWorkItemToApproval),
        ...approvedResult.items.map(mapWorkItemToApproval),
        ...declinedResult.items.map(mapWorkItemToApproval)
      ];
      
      const uniqueItems = Array.from(
        new Map(allItems.map(item => [item.id, item])).values()
      );
      
      setAllApprovals(uniqueItems);
      setApprovals(uniqueItems);
      
      logger.debug('[Approvals Page] Approvals loaded', { count: uniqueItems.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load approvals';
      setError(errorMessage);
      logger.error(err, '[Approvals Page] Error loading approvals', {
        tags: { error_type: 'approvals_load_error' }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals, refreshKey]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'REQUIRES_CHANGES': return 'yellow';
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
        await declineWorkItemUseCase(approvalId, approvalComment || 'Rejected by approver');
      }

      SweetAlert.close();
      await SweetAlert.success(
        action === 'APPROVED' ? 'Approved!' : 'Rejected!',
        `The approval request has been ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully.`
      );

      setRefreshKey(prev => prev + 1);
      setSelectedApproval(null);
      setApprovalComment("");
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action === 'APPROVED' ? 'approve' : 'reject'} approval`;
      setError(errorMessage);
      logger.error(err, `[Approvals Page] Error ${action === 'APPROVED' ? 'approving' : 'rejecting'} approval`, {
        tags: { error_type: 'approval_action_error', action }
      });
      await SweetAlert.error(
        action === 'APPROVED' ? 'Approval Failed' : 'Rejection Failed',
        errorMessage
      );
    } finally {
      setProcessing(false);
    }
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (approval.workItemNumber && approval.workItemNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || approval.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = allApprovals.filter(a => a.status === 'PENDING').length;
  const approvedCount = allApprovals.filter(a => a.status === 'APPROVED').length;
  const rejectedCount = allApprovals.filter(a => a.status === 'REJECTED').length;
  const requiresChangesCount = allApprovals.filter(a => a.status === 'REQUIRES_CHANGES').length;
  const urgentCount = allApprovals.filter(a => a.priority === 'URGENT' && a.status === 'PENDING').length;
  const overdueCount = allApprovals.filter(a => 
    a.status === 'PENDING' && new Date(a.dueDate) < new Date()
  ).length;

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
          variant={getRiskColor(row.riskLevel) === 'red' ? 'danger' : getRiskColor(row.riskLevel) === 'orange' ? 'warning' : 'info'}
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
          variant={getStatusColor(row.status) === 'green' ? 'success' : getStatusColor(row.status) === 'red' ? 'danger' : getStatusColor(row.status) === 'orange' ? 'warning' : 'info'}
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
          color={new Date(row.dueDate) < new Date() && row.status === 'PENDING' ? 'red.600' : 'gray.600'}
        >
          {new Date(row.dueDate).toLocaleDateString()}
          {new Date(row.dueDate) < new Date() && row.status === 'PENDING' && (
            <Typography as="span" color="red.500" ml="1" fontSize="xs">⚠</Typography>
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
        <Tooltip content="View Application">
          <button
            onClick={() => window.location.href = `/applications/${row.applicationId}`}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              color: '#111827',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconWrapper><FiUser size={14} /></IconWrapper>
            View
          </button>
        </Tooltip>
        {row.status === 'PENDING' && (
          <Tooltip content="Review & Approve">
            <button
              onClick={() => setSelectedApproval(row)}
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
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />
      <Box 
        ml={condensed ? "72px" : "280px"} 
        mt="90px" 
        minH="calc(100vh - 90px)" 
        width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"} 
        bg="gray.50" 
        overflowX="hidden" 
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        <PortalHeader />
        <Container maxW="100%" px="8" py="6" width="full">
          <VStack gap="4" align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center" mb="4">
              <VStack align="start" gap="1">
                <Typography fontSize="3xl" fontWeight="bold" color="gray.800">
                  Approvals
                </Typography>
                <Typography color="gray.600">
                  Senior management approval workflow
                </Typography>
              </VStack>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="mukuru-primary-button"
              >
                <IconWrapper><FiFilter size={16} /></IconWrapper>
                Refresh
              </Button>
            </Flex>

            {/* Error Alert */}
            {error && (
              <AlertBar status="error" title="Error loading approvals">
                {error}
              </AlertBar>
            )}

            {/* Urgent/Overdue Alerts */}
            {(urgentCount > 0 || overdueCount > 0) && (
              <AlertBar status="warning" title="Urgent Approvals Required">
                {urgentCount} urgent and {overdueCount} overdue approvals need immediate attention
              </AlertBar>
            )}

            {/* Summary Cards */}
            <SimpleGrid columns={{ base: 1, md: 4 }} gap="4">
              <Card bg="white" p="4">
                <Flex gap="4" align="center">
                  <Avatar.Root bg="orange.100" size="md" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper><FiClock size={20} color="#DD6B20" /></IconWrapper>
                  </Avatar.Root>
                  <VStack align="start" gap="0" flex="1">
                    <Typography fontSize="sm" color="gray.600">Pending Approval</Typography>
                    <Typography fontSize="30px" fontWeight="bold" color="orange.600" fontFamily="Madera, sans-serif">
                      {pendingCount}
                    </Typography>
                  </VStack>
                  <ChevronRightIcon />
                </Flex>
              </Card>
              
              <Card bg="white" p="4">
                <Flex gap="4" align="center">
                  <Avatar.Root bg="green.100" size="md" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper><FiCheckCircle size={20} color="#38A169" /></IconWrapper>
                  </Avatar.Root>
                  <VStack align="start" gap="0" flex="1">
                    <Typography fontSize="sm" color="gray.600">Approved</Typography>
                    <Typography fontSize="30px" fontWeight="bold" color="green.600" fontFamily="Madera, sans-serif">
                      {approvedCount}
                    </Typography>
                  </VStack>
                  <ChevronRightIcon />
                </Flex>
              </Card>
              
              <Card bg="white" p="4">
                <Flex gap="4" align="center">
                  <Avatar.Root bg="red.100" size="md" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper><FiXCircle size={20} color="#E53E3E" /></IconWrapper>
                  </Avatar.Root>
                  <VStack align="start" gap="0" flex="1">
                    <Typography fontSize="sm" color="gray.600">Rejected</Typography>
                    <Typography fontSize="30px" fontWeight="bold" color="red.600" fontFamily="Madera, sans-serif">
                      {rejectedCount}
                    </Typography>
                  </VStack>
                  <ChevronRightIcon />
                </Flex>
              </Card>
              
              <Card bg="white" p="4">
                <Flex gap="4" align="center">
                  <Avatar.Root bg="blue.100" size="md" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper><FiEdit size={20} color="#3182CE" /></IconWrapper>
                  </Avatar.Root>
                  <VStack align="start" gap="0" flex="1">
                    <Typography fontSize="sm" color="gray.600">Requires Changes</Typography>
                    <Typography fontSize="30px" fontWeight="bold" color="blue.600" fontFamily="Madera, sans-serif">
                      {requiresChangesCount}
                    </Typography>
                  </VStack>
                  <ChevronRightIcon />
                </Flex>
              </Card>
            </SimpleGrid>

            {/* Status Filter Buttons */}
            <HStack gap="2" mb="2">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES'] as StatusFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant="primary"
                  onClick={() => setStatusFilter(filter)}
                  className="mukuru-primary-button"
                  style={{ opacity: statusFilter === filter ? 1 : 0.7 }}
                >
                  {filter === 'ALL' ? 'All' : filter === 'REQUIRES_CHANGES' ? 'Requires Changes' : filter}
                </Button>
              ))}
            </HStack>

            {/* Search Bar */}
            <Box width="100%" maxW="800px">
              <Search
                placeholder="Search by company name or application ID..."
                onSearchChange={handleSearchChange}
              />
            </Box>

            {/* Approvals Table */}
            <Box className="work-queue-table-wrapper" width="100%">
              <DataTable
                data={filteredApprovals as unknown as Record<string, unknown>[]}
                columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
                actionColumn={actionColumn as unknown as { header?: string; width?: string; render: (row: Record<string, unknown>, index: number) => React.ReactNode }}
                loading={loading}
              />
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Approval Modal */}
      <Modal
        isOpen={!!selectedApproval}
        onClose={() => {
          setSelectedApproval(null);
          setApprovalComment("");
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
                setSelectedApproval(null);
                setApprovalComment("");
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            
            <HStack gap="2">
              <Button
                variant="primary"
                className="mukuru-primary-button"
                onClick={() => selectedApproval && handleApproval(selectedApproval.id, 'REJECTED')}
                disabled={processing}
              >
                <IconWrapper><FiXCircle size={16} /></IconWrapper>
                Reject
              </Button>
              
              <Button
                variant="primary"
                className="mukuru-primary-button"
                onClick={() => selectedApproval && handleApproval(selectedApproval.id, 'APPROVED')}
                disabled={processing}
              >
                <IconWrapper><FiCheckCircle size={16} /></IconWrapper>
                Approve
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </Modal>
    </Flex>
  );
}
