"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Button,
  Input,
  SimpleGrid,
  Badge,
  Icon,
  Flex,
  Spinner,
  Textarea,
  Alert,
  AlertTitle,
  AlertDescription
} from "@chakra-ui/react";
import { 
  FiSearch, 
  FiFilter, 
  FiCheckCircle, 
  FiXCircle,
  FiClock,
  FiUser,
  FiEdit,
  FiSend,
  FiAlertTriangle
} from "react-icons/fi";
import { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "../../components/AdminSidebar";
import { workQueueApi, WorkItemDto } from "../../lib/workQueueApi";
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
  // Map status
  let status: Approval['status'] = 'PENDING';
  if (workItem.status === 'Approved') {
    status = 'APPROVED';
  } else if (workItem.status === 'Declined') {
    status = 'REJECTED';
  } else if (workItem.status === 'PendingApproval') {
    status = 'PENDING';
  }

  // Map risk level
  const riskLevel = workItem.riskLevel.toUpperCase() as Approval['riskLevel'];
  
  // Map priority
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

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [allApprovals, setAllApprovals] = useState<Approval[]>([]); // Store all for stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get pending approvals (these are items that need approval)
      const pendingResult = await workQueueApi.getPendingApprovals(1, 100);
      const pendingApprovals = pendingResult.data.map(mapWorkItemToApproval);
      
      // Get all work items to calculate stats (including approved/declined)
      // We'll fetch items with different statuses to get complete picture
      const [allItemsResult, approvedResult, declinedResult] = await Promise.all([
        workQueueApi.getWorkItemsAsDto({
          page: 1,
          pageSize: 100
        }),
        workQueueApi.getWorkItemsAsDto({
          status: 'COMPLETE',
          page: 1,
          pageSize: 100
        }),
        workQueueApi.getWorkItemsAsDto({
          status: 'DECLINED',
          page: 1,
          pageSize: 100
        })
      ]);
      
      // Combine all items for stats
      const allItems = [
        ...pendingApprovals,
        ...allItemsResult.data.map(mapWorkItemToApproval),
        ...approvedResult.data.map(mapWorkItemToApproval),
        ...declinedResult.data.map(mapWorkItemToApproval)
      ];
      
      // Remove duplicates by ID
      const uniqueItems = Array.from(
        new Map(allItems.map(item => [item.id, item])).values()
      );
      
      setAllApprovals(uniqueItems);
      // Show pending approvals by default, but allow filtering
      setApprovals(uniqueItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load approvals';
      setError(errorMessage);
      console.error('Error loading approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'REQUIRES_CHANGES': return 'yellow';
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

  const handleApproval = async (approvalId: string, action: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval) return;

    try {
      setProcessing(true);
      SweetAlert.loading(
        action === 'APPROVED' ? 'Approving...' : 'Rejecting...',
        'Please wait while we process your request.'
      );

      if (action === 'APPROVED') {
        await workQueueApi.approveWorkItem(approvalId, approvalComment || undefined);
      } else {
        await workQueueApi.declineWorkItem(approvalId, approvalComment || 'Rejected by approver');
      }

      SweetAlert.close();
      await SweetAlert.success(
        action === 'APPROVED' ? 'Approved!' : 'Rejected!',
        `The approval request has been ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully.`
      );

      // Reload approvals
      await loadApprovals();
      setSelectedApproval(null);
      setApprovalComment("");
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action === 'APPROVED' ? 'approve' : 'reject'} approval`;
      setError(errorMessage);
      console.error(`Error ${action === 'APPROVED' ? 'approving' : 'rejecting'} approval:`, err);
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
    const matchesStatus = statusFilter === "ALL" || 
                         (statusFilter === "PENDING" && approval.status === 'PENDING') ||
                         (statusFilter === "APPROVED" && approval.status === 'APPROVED') ||
                         (statusFilter === "REJECTED" && approval.status === 'REJECTED') ||
                         (statusFilter === "REQUIRES_CHANGES" && approval.status === 'REQUIRES_CHANGES');
    return matchesSearch && matchesStatus;
  });

  const pendingCount = allApprovals.filter(a => a.status === 'PENDING').length;
  const urgentCount = allApprovals.filter(a => a.priority === 'URGENT' && a.status === 'PENDING').length;
  const overdueCount = allApprovals.filter(a => 
    a.status === 'PENDING' && new Date(a.dueDate) < new Date()
  ).length;

  if (loading) {
    return (
      <Box>
        <AdminSidebar />
        <Box ml="240px" p="8" bg="gray.50" minH="100vh">
          <Flex justify="center" align="center" h="400px">
            <VStack gap="4">
              <Spinner size="xl" color="orange.500" />
              <Text color="gray.600">Loading approvals...</Text>
            </VStack>
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
              <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                Approvals
              </Text>
              <Text color="gray.600">
                Senior management approval workflow
              </Text>
            </VStack>
            
            <HStack gap="3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadApprovals}
              >
                <Icon as={FiSearch} style={{ marginRight: '8px' }} />
                Refresh
              </Button>
            </HStack>
          </Flex>

          {/* Error Alert */}
          {error && (
            <Alert.Root status="error" borderRadius="md">
              <Icon as={FiAlertTriangle} />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert.Root>
          )}

          {/* Alerts */}
          {(urgentCount > 0 || overdueCount > 0) && (
            <Box bg="red.50" p="4" borderRadius="lg" border="1px" borderColor="red.200">
              <HStack gap="3">
                <Icon as={FiAlertTriangle} boxSize="5" color="red.500" />
                <VStack align="start" gap="1">
                  <Text fontWeight="semibold" color="red.800">
                    Urgent Approvals Required
                  </Text>
                  <Text fontSize="sm" color="red.700">
                    {urgentCount} urgent and {overdueCount} overdue approvals need immediate attention
                  </Text>
                </VStack>
              </HStack>
            </Box>
          )}

          {/* Summary Cards */}
          <SimpleGrid columns={{ base: 1, md: 4 }} gap="4">
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiClock} boxSize="6" color="orange.500" />
                <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                  {pendingCount}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Pending Approval
                </Text>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiCheckCircle} boxSize="6" color="green.500" />
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {allApprovals.filter(a => a.status === 'APPROVED').length}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Approved
                </Text>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiXCircle} boxSize="6" color="red.500" />
                <Text fontSize="2xl" fontWeight="bold" color="red.600">
                  {allApprovals.filter(a => a.status === 'REJECTED').length}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Rejected
                </Text>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiEdit} boxSize="6" color="blue.500" />
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {allApprovals.filter(a => a.status === 'REQUIRES_CHANGES').length}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Requires Changes
                </Text>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Search and Filters */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <HStack gap="4">
              <Box flex="1">
                <HStack>
                  <Icon as={FiSearch} color="gray.400" />
                  <Input
                    placeholder="Search by company name or application ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    border="none"
                    _focus={{ boxShadow: "none" }}
                  />
                </HStack>
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
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="REQUIRES_CHANGES">Requires Changes</option>
              </select>
            </HStack>
          </Box>

          {/* Approvals Table */}
          <Box bg="white" borderRadius="lg" boxShadow="sm" w="100%" position="relative">
            <Box overflowX="auto" w="100%">
              <Box minW="1000px">
                <VStack gap="0" align="stretch" w="100%">
                  {/* Table Header */}
                  <HStack bg="gray.50" p="4" fontWeight="semibold" color="gray.800" fontSize="sm" borderBottom="1px" borderColor="gray.200" gap="4">
                    <Box w="200px" flexShrink={0}>Company Name</Box>
                    <Box w="200px" flexShrink={0}>Application ID</Box>
                    <Box w="120px" flexShrink={0}>Risk Level</Box>
                    <Box w="120px" flexShrink={0}>Status</Box>
                    <Box w="120px" flexShrink={0}>Due Date</Box>
                    <Box w="300px" flexShrink={0}>Actions</Box>
                  </HStack>
                  
                  {/* Table Rows */}
                  {filteredApprovals.length === 0 ? (
                    <Box p="8" textAlign="center">
                      <Text color="gray.600">No approvals found</Text>
                    </Box>
                  ) : (
                    filteredApprovals.map((approval) => (
                      <HStack 
                        key={approval.id} 
                        p="4" 
                        borderBottom="1px" 
                        borderColor="gray.100"
                        _hover={{ bg: "gray.50" }}
                        fontSize="sm"
                        align="center"
                        gap="4"
                      >
                        {/* Company Name */}
                        <Box w="200px" flexShrink={0} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={approval.companyName}>
                          <Text fontWeight="medium" color="gray.800">
                            {approval.companyName}
                          </Text>
                        </Box>
                        
                        {/* Application ID */}
                        <Box w="200px" flexShrink={0} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={approval.applicationId}>
                          <Text color="gray.600" fontSize="xs">
                            {approval.applicationId}
                            {approval.workItemNumber && ` • ${approval.workItemNumber}`}
                          </Text>
                        </Box>
                        
                        {/* Risk Level */}
                        <Box w="120px" flexShrink={0}>
                          <Badge
                            colorScheme={getRiskColor(approval.riskLevel)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {approval.riskLevel}
                          </Badge>
                        </Box>
                        
                        {/* Status */}
                        <Box w="120px" flexShrink={0}>
                          <Badge
                            colorScheme={getStatusColor(approval.status)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {approval.status.replace('_', ' ')}
                          </Badge>
                        </Box>
                        
                        {/* Due Date */}
                        <Box w="120px" flexShrink={0}>
                          <Text 
                            fontSize="xs" 
                            fontWeight="medium" 
                            color={new Date(approval.dueDate) < new Date() && approval.status === 'PENDING' ? 'red.600' : 'gray.600'}
                          >
                            {new Date(approval.dueDate).toLocaleDateString()}
                            {new Date(approval.dueDate) < new Date() && approval.status === 'PENDING' && (
                              <Text as="span" color="red.500" ml="1" fontSize="xs">⚠</Text>
                            )}
                          </Text>
                        </Box>
                        
                        {/* Actions */}
                        <Box w="300px" flexShrink={0} py="2" px="2">
                          <HStack gap="2" align="center" justify="flex-start">
                            <Link href={`/applications/${approval.applicationId}`}>
                              <Button
                                size="sm"
                                variant="outline"
                              >
                                <Icon as={FiUser} mr="2" />
                                View
                              </Button>
                            </Link>
                            
                            {approval.status === 'PENDING' && (
                              <Button
                                size="sm"
                                colorScheme="orange"
                                variant="solid"
                                onClick={() => setSelectedApproval(approval)}
                              >
                                Review & Approve
                              </Button>
                            )}
                          </HStack>
                        </Box>
                      </HStack>
                    ))
                  )}
                </VStack>
              </Box>
            </Box>
          </Box>
        </VStack>
      </Container>

      {/* Approval Modal */}
      {selectedApproval && (
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
        >
          <Box
            bg="white"
            p="6"
            borderRadius="lg"
            boxShadow="xl"
            maxW="500px"
            width="90%"
          >
            <VStack gap="4" align="stretch">
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                Review Approval Request
              </Text>
              
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                  Company: {selectedApproval.companyName}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                  Application: {selectedApproval.applicationId}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                  Reason: {selectedApproval.reason}
                </Text>
              </Box>
              
              <Textarea
                placeholder="Add your comments..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
              />
              
              <HStack justify="space-between">
                <Button
                  variant="outline"
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
                    colorScheme="red"
                    variant="solid"
                    onClick={() => handleApproval(selectedApproval.id, 'REJECTED')}
                    loading={processing}
                    loadingText="Rejecting..."
                  >
                    <Icon as={FiXCircle} style={{ marginRight: '8px' }} />
                    Reject
                  </Button>
                  
                  <Button
                    colorScheme="green"
                    variant="solid"
                    onClick={() => handleApproval(selectedApproval.id, 'APPROVED')}
                    loading={processing}
                    loadingText="Approving..."
                  >
                    <Icon as={FiCheckCircle} style={{ marginRight: '8px' }} />
                    Approve
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
      </Box>
    </Box>
  );
}
