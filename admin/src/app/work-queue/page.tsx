"use client";

import { 
  Box, 
  VStack, 
  HStack,
  Text,
  SimpleGrid,
  Flex,
  Badge,
  Button,
  Input,
  Spinner,
  Container,
  createToaster,
  Toaster,
  Tabs,
  Menu,
  IconButton,
  Dialog,
  Textarea,
  Field,
  Select,
  Checkbox,
  Icon
} from "@chakra-ui/react";
import { useState, useEffect, useCallback, useRef } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { 
  FiSearch, 
  FiEye, 
  FiFile, 
  FiAlertCircle,
  FiMoreVertical,
  FiUser,
  FiPlay,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiClock,
  FiRefreshCw,
  FiUserCheck,
  FiAlertTriangle
} from "react-icons/fi";
import Link from "next/link";
import { useSession } from "next-auth/react";
import workQueueApi, { Application, mapWorkItemToApplication } from "../../lib/workQueueApi";

type ViewType = 'all' | 'my-items' | 'pending-approvals';
type StatusFilter = 'ALL' | 'SUBMITTED' | 'IN PROGRESS' | 'RISK REVIEW' | 'COMPLETE' | 'DECLINED';

export default function WorkQueuePage() {
  const { data: session } = useSession();
  const [viewType, setViewType] = useState<ViewType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    riskReview: 0,
    complete: 0,
    declined: 0,
  });

  // Modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [assignToSelf, setAssignToSelf] = useState(true);
  const [assignToUserId, setAssignToUserId] = useState("");
  const [assignToUserName, setAssignToUserName] = useState("");
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'start-review' | 'approve' | 'decline' | 'complete' | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  // Chakra UI v3 uses createToaster API instead of useToast hook
  // Use useRef to keep toaster stable across renders
  const toasterRef = useRef(createToaster({
    placement: "top-end",
    pauseOnPageIdle: true,
  }));

  // Get current user info
  const currentUser = {
    id: session?.user?.email || '',
    name: session?.user?.name || 'Admin',
    email: session?.user?.email || ''
  };

  const loadApplications = useCallback(async (search?: string, status?: StatusFilter, view?: ViewType) => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      if (view === 'my-items') {
        // Try to get my items from backend
        result = await workQueueApi.getMyWorkItems(1, 1000);
        
        console.log('[Work Queue] My Items result:', {
          count: result.data.length,
          total: result.total,
          items: result.data.map(app => ({
            id: app.id,
            workItemNumber: app.workItemNumber,
            assignedTo: app.assignedTo,
            assignedToName: app.assignedToName,
            status: app.status
          }))
        });
        
        // If no items found, try fallback: get all items and filter by name/email
        if (result.data.length === 0) {
          console.log('[Work Queue] No items from getMyWorkItems, trying fallback filter by name/email');
          const allResult = await workQueueApi.getWorkItems({ pageSize: 1000 });
          
          // Filter by current user's name or email
          const filtered = allResult.data.filter(app => {
            const matchesId = app.assignedTo === currentUser.id || 
                             app.assignedTo === currentUser.email ||
                             app.assignedTo?.toLowerCase() === currentUser.email?.toLowerCase();
            const matchesName = app.assignedToName === currentUser.name ||
                               app.assignedToName?.toLowerCase() === currentUser.name?.toLowerCase();
            
            console.log('[Work Queue] Checking item:', {
              appId: app.id,
              assignedTo: app.assignedTo,
              assignedToName: app.assignedToName,
              currentUserId: currentUser.id,
              currentUserName: currentUser.name,
              currentUserEmail: currentUser.email,
              matchesId,
              matchesName
            });
            
            return matchesId || matchesName;
          });
          
          console.log('[Work Queue] Fallback filter found:', filtered.length, 'items');
          result = { data: filtered, total: filtered.length };
        }
      } else if (view === 'pending-approvals') {
        const pendingResult = await workQueueApi.getPendingApprovals(1, 1000);
        // Convert WorkItemDto[] to Application[]
        setApplications(pendingResult.data.map(mapWorkItemToApplication));
        return; // Early return since we've set the applications
      } else {
        result = await workQueueApi.getWorkItems({
          searchTerm: search || undefined,
          status: status && status !== 'ALL' ? status : undefined,
          pageSize: 1000,
        });
      }
      
      setApplications(result.data);
      
      // Calculate stats from all items (not filtered)
      const allResult = await workQueueApi.getWorkItems({ pageSize: 1000 });
      setStats({
        total: allResult.total,
        submitted: allResult.data.filter(app => app.status === 'SUBMITTED').length,
        inProgress: allResult.data.filter(app => app.status === 'IN PROGRESS').length,
        riskReview: allResult.data.filter(app => app.status === 'RISK REVIEW').length,
        complete: allResult.data.filter(app => app.status === 'COMPLETE').length,
        declined: allResult.data.filter(app => app.status === 'DECLINED').length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load work queue items';
      console.error('Error loading applications:', err);
      setError(errorMessage);
      toasterRef.current.create({
        title: 'Error loading work queue',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadApplications(searchTerm, statusFilter, viewType);
  }, [viewType, statusFilter, loadApplications]);

  useEffect(() => {
    if (searchTerm === '' || loading) return;
    const timer = setTimeout(() => {
      loadApplications(searchTerm, statusFilter, viewType);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, viewType, loadApplications, loading]);

  const handleExport = async () => {
    try {
      const blob = await workQueueApi.exportWorkItems({
        searchTerm: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work-queue-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toasterRef.current.create({
        title: 'Export successful',
        description: 'Work queue data has been exported to CSV',
        type: 'success',
        duration: 3000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export work queue';
      toasterRef.current.create({
        title: 'Export failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    }
  };

  const openAssignModal = (app: Application) => {
    setSelectedApp(app);
    setAssignToSelf(true);
    setAssignToUserId("");
    setAssignToUserName("");
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    console.log('[WorkQueue] handleAssign called', { selectedApp, assignToSelf });
    
    if (!selectedApp) {
      console.error('[WorkQueue] No selected app');
      toasterRef.current.create({
        title: 'Assignment failed',
        description: 'No work item selected',
        type: 'error',
        duration: 3000,
      });
      return;
    }
    
    // Prevent assignment of completed or declined work items
    // Check both frontend status and backend status for reliability
    const isCompleted = selectedApp.status === 'COMPLETE' || 
                       selectedApp.status === 'DECLINED' ||
                       selectedApp.backendStatus === 'Completed' ||
                       selectedApp.backendStatus === 'Declined' ||
                       selectedApp.backendStatus === 'Cancelled';
    
    if (isCompleted) {
      toasterRef.current.create({
        title: 'Assignment not allowed',
        description: 'Cannot assign a work item that is already completed or declined.',
        type: 'error',
        duration: 5000,
      });
      setAssignModalOpen(false);
      return;
    }
    
    try {
      console.log('[WorkQueue] Starting assignment process');
      // For "assign to self", we need to get the user ID from the JWT token (sub claim)
      // This matches what the backend uses for "My Items" queries
      let userId: string;
      let userName: string;
      
      if (assignToSelf) {
        // Get the JWT token's "sub" claim from the session
        // The backend uses this for "My Items" queries, so we need to match it
        try {
          const sessionResponse = await fetch('/api/auth/session');
          const sessionData = await sessionResponse.json();
          
          // Try to decode the JWT token to get the "sub" claim
          // If we can't get it, fall back to email-based GUID (for backwards compatibility)
          if (sessionData?.accessToken) {
            try {
              // Decode JWT token (base64url decode the payload)
              const tokenParts = sessionData.accessToken.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
                if (payload.sub) {
                  userId = payload.sub;
                  userName = currentUser.name;
                } else {
                  // Fallback to email-based GUID
                  userId = currentUser.id;
                  userName = currentUser.name;
                }
              } else {
                userId = currentUser.id;
                userName = currentUser.name;
              }
            } catch {
              // If JWT decode fails, use email-based GUID
              userId = currentUser.id;
              userName = currentUser.name;
            }
          } else {
            userId = currentUser.id;
            userName = currentUser.name;
          }
        } catch {
          // If session fetch fails, use email-based GUID
          userId = currentUser.id;
          userName = currentUser.name;
        }
      } else {
        userId = assignToUserId;
        userName = assignToUserName;
      }
      
      if (!userId || !userName) {
        toasterRef.current.create({
          title: 'Assignment failed',
          description: 'Please select an assignee',
          type: 'error',
          duration: 3000,
        });
        return;
      }

      // Use workItemId (GUID) for API calls
      const workItemId = selectedApp.workItemId || selectedApp.id;
      console.log('[WorkQueue] Calling assignWorkItem API', { 
        workItemId, 
        userId, 
        userName,
        selectedAppWorkItemId: selectedApp.workItemId,
        selectedAppId: selectedApp.id,
        isWorkItemIdGuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workItemId)
      });
      
      // Validate that workItemId is a GUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workItemId)) {
        throw new Error(`Invalid work item ID format: ${workItemId}. Expected a GUID.`);
      }
      
      await workQueueApi.assignWorkItem(workItemId, userId, userName);
      
      console.log('[WorkQueue] Assignment API call successful');
      
      toasterRef.current.create({
        title: 'Assignment successful',
        description: `Work item assigned to ${userName}`,
        type: 'success',
        duration: 3000,
      });

      // If assigning to self, offer to start review
      if (assignToSelf) {
        const startReview = window.confirm(
          `You've assigned this application to yourself. Would you like to start reviewing it now?`
        );
        if (startReview) {
          await handleStartReview(selectedApp.id);
        }
      }

      setAssignModalOpen(false);
      loadApplications(searchTerm, statusFilter, viewType);
    } catch (err) {
      console.error('[WorkQueue] Assignment error:', err);
      let errorMessage = err instanceof Error ? err.message : 'Failed to assign work item';
      
      // Provide user-friendly error messages
      if (errorMessage.includes('Cannot assign completed work item') || 
          errorMessage.includes('completed work item')) {
        errorMessage = 'Cannot assign a work item that is already completed.';
      } else if (errorMessage.includes('Cannot assign declined work item') || 
                 errorMessage.includes('declined work item')) {
        errorMessage = 'Cannot assign a work item that has been declined.';
      }
      
      toasterRef.current.create({
        title: 'Assignment failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    }
  };

  const handleUnassign = async (appId: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      await workQueueApi.unassignWorkItem(workItemId);
      toasterRef.current.create({
        title: 'Unassigned successfully',
        description: 'Work item has been unassigned',
        type: 'success',
        duration: 3000,
      });
      loadApplications(searchTerm, statusFilter, viewType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unassign work item';
      toasterRef.current.create({
        title: 'Unassign failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    }
  };

  const handleStartReview = async (appId: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      
      // Check if review is already started (status is InProgress)
      // Backend only allows start-review when status is "Assigned"
      const isAlreadyInProgress = app?.backendStatus === 'InProgress' || 
                                   app?.status === 'IN PROGRESS';
      
      // Only call start-review API if status is "Assigned"
      // If already "InProgress", just navigate to review page
      if (app?.backendStatus === 'Assigned') {
        // Start the review - this will change status from "Assigned" to "InProgress"
        await workQueueApi.startReview(workItemId);
        
        toasterRef.current.create({
          title: 'Review started',
          description: 'Redirecting to review page...',
          type: 'success',
          duration: 2000,
        });
      } else if (isAlreadyInProgress) {
        // Already in progress, just navigate (don't call API)
        toasterRef.current.create({
          title: 'Opening review',
          description: 'Redirecting to review page...',
          type: 'info',
          duration: 1500,
        });
      } else {
        // Status is neither Assigned nor InProgress - show error
        toasterRef.current.create({
          title: 'Cannot start review',
          description: `Work item must be in "Assigned" status to start review. Current status: ${app?.backendStatus || app?.status}`,
          type: 'error',
          duration: 5000,
        });
        return; // Don't navigate
      }
      
      // Navigate to review page after a short delay
      setTimeout(() => {
        window.location.href = `/review/${workItemId}`;
      }, 500);
    } catch (err: any) {
      // Extract error message from API response
      let errorMessage = 'Failed to start review';
      if (err instanceof Error) {
        errorMessage = err.message;
        // Try to extract more details from error response
        try {
          const errorData = JSON.parse(err.message);
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Not JSON, use the message as is
        }
      }
      
      console.error('[WorkQueue] Error starting review:', err);
      toasterRef.current.create({
        title: 'Failed to start review',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    }
  };

  const openActionModal = (app: Application, type: 'start-review' | 'approve' | 'decline' | 'complete') => {
    setSelectedApp(app);
    setActionType(type);
    setActionNotes("");
    setDeclineReason("");
    setActionModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedApp || !actionType) return;

    try {
      // Use workItemId (GUID) for API calls
      const workItemId = selectedApp.workItemId || selectedApp.id;
      
      switch (actionType) {
        case 'start-review':
          await workQueueApi.startReview(workItemId);
          break;
        case 'approve':
          await workQueueApi.approveWorkItem(workItemId, actionNotes);
          break;
        case 'decline':
          if (!declineReason.trim()) {
            toasterRef.current.create({
              title: 'Decline failed',
              description: 'Please provide a reason for declining',
              type: 'error',
              duration: 3000,
            });
            return;
          }
          await workQueueApi.declineWorkItem(workItemId, declineReason);
          break;
        case 'complete':
          await workQueueApi.completeWorkItem(workItemId, actionNotes);
          break;
      }

      toasterRef.current.create({
        title: 'Action successful',
        description: `${actionType.replace('-', ' ')} completed successfully`,
        type: 'success',
        duration: 3000,
      });

      setActionModalOpen(false);
      loadApplications(searchTerm, statusFilter, viewType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${actionType}`;
      toasterRef.current.create({
        title: 'Action failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    }
  };

  const handleSubmitForApproval = async (appId: string, notes?: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      await workQueueApi.submitForApproval(workItemId, notes);
      toasterRef.current.create({
        title: 'Submitted for approval',
        description: 'Work item has been submitted for approval',
        type: 'success',
        duration: 3000,
      });
      loadApplications(searchTerm, statusFilter, viewType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit for approval';
      toasterRef.current.create({
        title: 'Submission failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    }
  };

  const handleMarkForRefresh = async (appId: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      await workQueueApi.markForRefresh(workItemId);
      toasterRef.current.create({
        title: 'Marked for refresh',
        description: 'Work item has been marked for refresh',
        type: 'success',
        duration: 3000,
      });
      loadApplications(searchTerm, statusFilter, viewType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark for refresh';
      toasterRef.current.create({
        title: 'Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    }
  };

  const loadComments = async (appId: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      const commentsData = await workQueueApi.getWorkItemComments(workItemId);
      setComments(commentsData);
    } catch (err) {
      console.error('Error loading comments:', err);
      setComments([]);
    }
  };

  const loadHistory = async (appId: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      const historyData = await workQueueApi.getWorkItemHistory(workItemId);
      setHistory(historyData);
    } catch (err) {
      console.error('Error loading history:', err);
      setHistory([]);
    }
  };

  const handleAddComment = async () => {
    if (!selectedApp || !newComment.trim()) return;

    try {
      // Use workItemId (GUID) for API calls
      const workItemId = selectedApp.workItemId || selectedApp.id;
      await workQueueApi.addComment(workItemId, newComment);
      toasterRef.current.create({
        title: 'Comment added',
        description: 'Your comment has been added',
        type: 'success',
        duration: 3000,
      });
      setNewComment("");
      loadComments(workItemId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      toasterRef.current.create({
        title: 'Failed to add comment',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    }
  };

  const openCommentsModal = async (app: Application) => {
    setSelectedApp(app);
    setCommentsModalOpen(true);
    await loadComments(app.id);
  };

  const openHistoryModal = async (app: Application) => {
    setSelectedApp(app);
    setHistoryModalOpen(true);
    await loadHistory(app.id);
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'blue.500';
      case 'IN PROGRESS': return 'orange.500';
      case 'RISK REVIEW': return 'red.500';
      case 'COMPLETE': return 'green.500';
      case 'INCOMPLETE': return 'purple.500';
      case 'DECLINED': return 'red.500';
      default: return 'gray.500';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      case 'urgent': return 'red';
      default: return 'gray';
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const filteredApplications = applications;

  if (loading && applications.length === 0 && !error) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="240px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Text color="black">Loading work queue items...</Text>
          </VStack>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />

      <Box flex="1" ml="240px">
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py="4" px="6" boxShadow="sm">
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold" color="black">Work Queue</Text>
            <HStack gap="3">
              <HStack gap="2">
                <FiSearch color="black" size="16" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                  width="300px"
                />
              </HStack>
              <Button 
                size="sm" 
                colorScheme="orange"
                onClick={handleExport}
              >
                <FiFile style={{ marginRight: '8px' }} />
                Export
              </Button>
            </HStack>
          </HStack>
        </Box>

        <Container maxW="8xl" py="6">
          <VStack gap="6" align="stretch">
            {error && (
              <Box p="4" bg="red.50" border="1px" borderColor="red.200" borderRadius="md" color="red.700">
                <HStack gap="2">
                  <Box as={FiAlertCircle} boxSize="5" />
                  <VStack align="start" gap="1" flex="1">
                    <Text fontWeight="semibold">Error loading work queue</Text>
                    <Text fontSize="sm">{error}</Text>
                  </VStack>
                </HStack>
              </Box>
            )}

            {/* View Tabs */}
            <Tabs.Root value={viewType} onValueChange={(e) => setViewType(e.value as ViewType)}>
              <Tabs.List>
                <Tabs.Trigger value="all">All Items</Tabs.Trigger>
                <Tabs.Trigger value="my-items">My Items</Tabs.Trigger>
                <Tabs.Trigger value="pending-approvals">Pending Approvals</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            {/* Status Filter Buttons */}
            {viewType === 'all' && (
              <HStack gap="2" wrap="wrap">
                <Button
                  size="sm"
                  variant={statusFilter === 'ALL' ? 'solid' : 'outline'}
                  colorScheme={statusFilter === 'ALL' ? 'orange' : 'gray'}
                  color={statusFilter === 'ALL' ? undefined : 'black'}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'SUBMITTED' ? 'solid' : 'outline'}
                  colorScheme={statusFilter === 'SUBMITTED' ? 'blue' : 'gray'}
                  color={statusFilter === 'SUBMITTED' ? undefined : 'black'}
                  onClick={() => setStatusFilter('SUBMITTED')}
                >
                  Submitted ({stats.submitted})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'IN PROGRESS' ? 'solid' : 'outline'}
                  colorScheme={statusFilter === 'IN PROGRESS' ? 'orange' : 'gray'}
                  color={statusFilter === 'IN PROGRESS' ? undefined : 'black'}
                  onClick={() => setStatusFilter('IN PROGRESS')}
                >
                  In Progress ({stats.inProgress})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'RISK REVIEW' ? 'solid' : 'outline'}
                  colorScheme={statusFilter === 'RISK REVIEW' ? 'red' : 'gray'}
                  color={statusFilter === 'RISK REVIEW' ? undefined : 'black'}
                  onClick={() => setStatusFilter('RISK REVIEW')}
                >
                  Risk Review ({stats.riskReview})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'COMPLETE' ? 'solid' : 'outline'}
                  colorScheme={statusFilter === 'COMPLETE' ? 'green' : 'gray'}
                  color={statusFilter === 'COMPLETE' ? undefined : 'black'}
                  onClick={() => setStatusFilter('COMPLETE')}
                >
                  Complete ({stats.complete})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'DECLINED' ? 'solid' : 'outline'}
                  colorScheme={statusFilter === 'DECLINED' ? 'red' : 'gray'}
                  color={statusFilter === 'DECLINED' ? undefined : 'black'}
                  onClick={() => setStatusFilter('DECLINED')}
                >
                  Declined ({stats.declined})
                </Button>
              </HStack>
            )}

            {/* Stats Cards */}
            <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} gap="4">
              <Box bg="white" p="4" borderRadius="lg" boxShadow="sm" cursor="pointer" onClick={() => setStatusFilter('ALL')}>
                <VStack gap="2">
                  <Text fontSize="2xl" fontWeight="bold" color="black">{stats.total}</Text>
                  <Text fontSize="sm" color="black">Total</Text>
                </VStack>
              </Box>
              <Box bg="white" p="4" borderRadius="lg" boxShadow="sm" cursor="pointer" onClick={() => setStatusFilter('SUBMITTED')}>
                <VStack gap="2">
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">{stats.submitted}</Text>
                  <Text fontSize="sm" color="black">Submitted</Text>
                </VStack>
              </Box>
              <Box bg="white" p="4" borderRadius="lg" boxShadow="sm" cursor="pointer" onClick={() => setStatusFilter('IN PROGRESS')}>
                <VStack gap="2">
                  <Text fontSize="2xl" fontWeight="bold" color="orange.600">{stats.inProgress}</Text>
                  <Text fontSize="sm" color="black">In Progress</Text>
                </VStack>
              </Box>
              <Box bg="white" p="4" borderRadius="lg" boxShadow="sm" cursor="pointer" onClick={() => setStatusFilter('RISK REVIEW')}>
                <VStack gap="2">
                  <Text fontSize="2xl" fontWeight="bold" color="red.600">{stats.riskReview}</Text>
                  <Text fontSize="sm" color="black">Risk Review</Text>
                </VStack>
              </Box>
              <Box bg="white" p="4" borderRadius="lg" boxShadow="sm" cursor="pointer" onClick={() => setStatusFilter('COMPLETE')}>
                <VStack gap="2">
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">{stats.complete}</Text>
                  <Text fontSize="sm" color="black">Complete</Text>
                </VStack>
              </Box>
              <Box bg="white" p="4" borderRadius="lg" boxShadow="sm" cursor="pointer" onClick={() => setStatusFilter('DECLINED')}>
                <VStack gap="2">
                  <Text fontSize="2xl" fontWeight="bold" color="red.600">{stats.declined}</Text>
                  <Text fontSize="sm" color="black">Declined</Text>
                </VStack>
              </Box>
            </SimpleGrid>

            {/* Applications Table */}
            <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
              <VStack gap="0" align="stretch">
                <HStack bg="gray.50" p="4" fontWeight="semibold" color="black" fontSize="sm">
                  <Box flex="1">Work Item #</Box>
                  <Box flex="2">Applicant Name</Box>
                  <Box flex="1">Entity Type</Box>
                  <Box flex="1">Country</Box>
                  <Box flex="1">Status</Box>
                  <Box flex="1">Assigned To</Box>
                  <Box flex="1">Priority</Box>
                  <Box flex="1">Risk</Box>
                  <Box flex="1">Due Date</Box>
                  <Box flex="1">Actions</Box>
                </HStack>
                
                {filteredApplications.length === 0 ? (
                  <Box p="8" textAlign="center">
                    <Text color="black">No work queue items found</Text>
                  </Box>
                ) : (
                  filteredApplications.map((app) => (
                    <HStack 
                      key={app.id} 
                      p="4" 
                      borderBottom="1px" 
                      borderColor="gray.100"
                      _hover={{ bg: "gray.50" }}
                      fontSize="sm"
                      color="black"
                    >
                      <Box flex="1" fontWeight="medium" color="black">
                        {app.workItemNumber || app.id.substring(0, 8)}
                      </Box>
                      <Box flex="2" color="black">{app.legalName}</Box>
                      <Box flex="1" color="black">{app.entityType}</Box>
                      <Box flex="1" color="black">{app.country}</Box>
                      <Box flex="1">
                        <Badge colorScheme={getStatusBgColor(app.status)} size="sm">
                          {app.status}
                        </Badge>
                      </Box>
                      <Box flex="1" color="black">
                        {app.assignedToName || (
                          <Text fontSize="xs" color="black" fontStyle="italic">Unassigned</Text>
                        )}
                      </Box>
                      <Box flex="1">
                        {app.priority && (
                          <Badge colorScheme={getPriorityColor(app.priority)} size="sm">
                            {app.priority}
                          </Badge>
                        )}
                      </Box>
                      <Box flex="1">
                        {app.riskLevel && (
                          <Badge colorScheme={getRiskColor(app.riskLevel)} size="sm">
                            {app.riskLevel}
                          </Badge>
                        )}
                      </Box>
                      <Box flex="1" color="black">
                        {app.dueDate ? (
                          <VStack align="start" gap="0">
                            <Text fontSize="xs" color="black">
                              {new Date(app.dueDate).toLocaleDateString()}
                            </Text>
                            {app.isOverdue && (
                              <Badge colorScheme="red" size="xs">Overdue</Badge>
                            )}
                          </VStack>
                        ) : (
                          <Text fontSize="xs" color="black">-</Text>
                        )}
                      </Box>
                      <Box flex="1">
                        <HStack gap="1">
                          <Link href={app.applicationId ? `/applications/${app.applicationId}` : `/applications/${app.id}`}>
                            <IconButton size="sm" variant="outline" aria-label="View" color="black">
                              <FiEye />
                            </IconButton>
                          </Link>
                          {/* Start Reviewing button - show prominently when assigned to current user and ready to review */}
                          {app.assignedTo && 
                           (app.assignedTo === currentUser.id || app.assignedToName === currentUser.name) &&
                           (app.backendStatus === 'Assigned' || app.backendStatus === 'InProgress') &&
                           app.status !== 'COMPLETE' && 
                           app.status !== 'DECLINED' && (
                            <Button
                              size="sm"
                              colorScheme="orange"
                              onClick={() => handleStartReview(app.id)}
                            >
                              <HStack gap="1">
                                <Icon as={FiPlay} />
                                <Text>Start Reviewing</Text>
                              </HStack>
                            </Button>
                          )}
                          <Menu.Root positioning={{ placement: "bottom-end" }}>
                            <Menu.Trigger asChild>
                              <IconButton size="sm" variant="outline" aria-label="More actions" color="black">
                                <FiMoreVertical />
                              </IconButton>
                            </Menu.Trigger>
                            <Menu.Positioner>
                              <Menu.Content>
                              {!app.assignedTo && 
                               app.status !== 'COMPLETE' && 
                               app.status !== 'DECLINED' &&
                               app.backendStatus !== 'Completed' &&
                               app.backendStatus !== 'Declined' &&
                               app.backendStatus !== 'Cancelled' && (
                                <Menu.Item 
                                  value="assign" 
                                  onSelect={() => openAssignModal(app)}
                                >
                                  <FiUser style={{ marginRight: '8px' }} />
                                  Assign
                                </Menu.Item>
                              )}
                              {app.assignedTo && app.assignedTo !== currentUser.id && (
                                <Menu.Item 
                                  value="unassign" 
                                  onSelect={() => handleUnassign(app.id)}
                                >
                                  <FiX style={{ marginRight: '8px' }} />
                                  Unassign
                                </Menu.Item>
                              )}
                              {/* Start Review - show if assigned and backend status is "Assigned" or "InProgress" */}
                              {(app.backendStatus === 'Assigned' || app.backendStatus === 'InProgress') && 
                               app.assignedTo && 
                               (app.assignedTo === currentUser.id || app.assignedToName === currentUser.name) && (
                                <Menu.Item 
                                  value="start-review" 
                                  onSelect={() => handleStartReview(app.id)}
                                >
                                  <FiPlay style={{ marginRight: '8px' }} />
                                  Start Review
                                </Menu.Item>
                              )}
                              {app.status === 'IN PROGRESS' && (
                                <>
                                  {app.requiresApproval && (
                                    <Menu.Item 
                                      value="submit-approval" 
                                      onSelect={() => handleSubmitForApproval(app.id)}
                                    >
                                      <FiUserCheck style={{ marginRight: '8px' }} />
                                      Submit for Approval
                                    </Menu.Item>
                                  )}
                                  <Menu.Item 
                                    value="complete" 
                                    onSelect={() => openActionModal(app, 'complete')}
                                  >
                                    <FiCheck style={{ marginRight: '8px' }} />
                                    Complete
                                  </Menu.Item>
                                </>
                              )}
                              {app.status === 'RISK REVIEW' && (
                                <>
                                  <Menu.Item 
                                    value="approve" 
                                    onSelect={() => openActionModal(app, 'approve')}
                                  >
                                    <FiCheck style={{ marginRight: '8px' }} />
                                    Approve
                                  </Menu.Item>
                                  <Menu.Item 
                                    value="decline" 
                                    onSelect={() => openActionModal(app, 'decline')}
                                  >
                                    <FiX style={{ marginRight: '8px' }} />
                                    Decline
                                  </Menu.Item>
                                </>
                              )}
                              <Menu.Item 
                                value="refresh" 
                                onSelect={() => handleMarkForRefresh(app.id)}
                              >
                                <FiRefreshCw style={{ marginRight: '8px' }} />
                                Mark for Refresh
                              </Menu.Item>
                              <Menu.Item 
                                value="comments" 
                                onSelect={() => openCommentsModal(app)}
                              >
                                <FiMessageSquare style={{ marginRight: '8px' }} />
                                Comments
                              </Menu.Item>
                              <Menu.Item 
                                value="history" 
                                onSelect={() => openHistoryModal(app)}
                              >
                                <FiClock style={{ marginRight: '8px' }} />
                                History
                              </Menu.Item>
                              </Menu.Content>
                            </Menu.Positioner>
                          </Menu.Root>
                        </HStack>
                      </Box>
                    </HStack>
                  ))
                )}
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Assign Modal */}
      <Dialog.Root open={assignModalOpen} onOpenChange={(e) => setAssignModalOpen(e.open)}>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="500px"
            borderRadius="xl"
            boxShadow="2xl"
            border="1px"
            borderColor="gray.200"
          >
            <Dialog.Header pb="4" borderBottom="1px" borderColor="gray.100">
              <HStack gap="3" align="center" mb="1">
                <Box
                  p="2"
                  borderRadius="lg"
                  bgGradient="linear(to-br, orange.100, orange.200)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiUserCheck} boxSize="4" color="orange.600" />
                </Box>
                <VStack align="start" gap="0">
                  <Dialog.Title fontSize="lg" fontWeight="700" color="gray.900">
                    Assign Work Item
                  </Dialog.Title>
                  <Dialog.Description fontSize="sm" color="gray.600" mt="0.5">
                    Assign this work item to a user
                  </Dialog.Description>
                </VStack>
              </HStack>
            </Dialog.Header>
            <Dialog.Body py="6">
              <VStack gap="5" align="stretch">
                <Text fontSize="sm" color="gray.700">
                  Assign work item: <strong>{selectedApp?.workItemNumber || selectedApp?.id}</strong>
                </Text>
                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="600" color="gray.700" mb="2">
                    Assign to
                  </Field.Label>
                  <Checkbox.Root
                    checked={assignToSelf}
                    onCheckedChange={(e) => {
                      setAssignToSelf(e.checked as boolean);
                      if (e.checked) {
                        setAssignToUserId(currentUser.id);
                        setAssignToUserName(currentUser.name);
                      }
                    }}
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Label fontSize="sm" color="gray.700">
                      Assign to me ({currentUser.name})
                    </Checkbox.Label>
                  </Checkbox.Root>
                </Field.Root>
                {!assignToSelf && (
                  <Field.Root>
                    <Field.Label fontSize="sm" fontWeight="600" color="gray.700" mb="2">
                      User ID
                    </Field.Label>
                    <Input
                      value={assignToUserId}
                      onChange={(e) => setAssignToUserId(e.target.value)}
                      placeholder="Enter user ID"
                      borderRadius="md"
                      borderWidth="1.5px"
                      borderColor="gray.300"
                      fontSize="sm"
                      color="gray.900"
                      _focus={{
                        borderColor: "orange.400",
                        boxShadow: "0 0 0 1px orange.400"
                      }}
                    />
                  </Field.Root>
                )}
                {!assignToSelf && (
                  <Field.Root>
                    <Field.Label fontSize="sm" fontWeight="600" color="gray.700" mb="2">
                      User Name
                    </Field.Label>
                    <Input
                      value={assignToUserName}
                      onChange={(e) => setAssignToUserName(e.target.value)}
                      placeholder="Enter user name"
                      borderRadius="md"
                      borderWidth="1.5px"
                      borderColor="gray.300"
                      fontSize="sm"
                      color="gray.900"
                      _focus={{
                        borderColor: "orange.400",
                        boxShadow: "0 0 0 1px orange.400"
                      }}
                    />
                  </Field.Root>
                )}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer pt="4" borderTop="1px" borderColor="gray.100">
              <HStack gap="3" justify="flex-end" w="full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAssignModalOpen(false);
                  }}
                  borderRadius="md"
                  px="4"
                  py="2"
                  fontSize="sm"
                  fontWeight="600"
                  borderWidth="1.5px"
                  _hover={{
                    bg: "gray.50",
                    borderColor: "gray.400"
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  colorScheme="orange"
                  bgGradient="linear(to-r, orange.500, orange.600)"
                  _hover={{
                    bgGradient: "linear(to-r, orange.600, orange.700)",
                    boxShadow: "md"
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssign();
                  }}
                  borderRadius="md"
                  px="4"
                  py="2"
                  fontSize="sm"
                  fontWeight="600"
                  boxShadow="sm"
                >
                  Assign
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Action Modal */}
      <Dialog.Root open={actionModalOpen} onOpenChange={(e: { open: boolean }) => setActionModalOpen(e.open)}>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="500px"
            borderRadius="xl"
            boxShadow="2xl"
            border="1px"
            borderColor="gray.200"
          >
            <Dialog.Header pb="4" borderBottom="1px" borderColor="gray.100">
              <Dialog.Title fontSize="lg" fontWeight="700" color="gray.900">
                {actionType === 'start-review' && 'Start Review'}
                {actionType === 'approve' && 'Approve Work Item'}
                {actionType === 'decline' && 'Decline Work Item'}
                {actionType === 'complete' && 'Complete Work Item'}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body py="6">
              <VStack gap="5" align="stretch">
                <Text fontSize="sm" color="gray.700">
                  Work Item: <strong>{selectedApp?.workItemNumber || selectedApp?.id}</strong>
                </Text>
                {actionType === 'decline' && (
                  <Field.Root required>
                    <Field.Label fontSize="sm" fontWeight="600" color="gray.700" mb="2">
                      Reason for Decline
                    </Field.Label>
                    <Textarea
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Please provide a reason for declining this application..."
                      rows={4}
                      borderRadius="md"
                      borderWidth="1.5px"
                      borderColor="gray.300"
                      fontSize="sm"
                      color="gray.900"
                      _focus={{
                        borderColor: "red.400",
                        boxShadow: "0 0 0 1px red.400"
                      }}
                    />
                  </Field.Root>
                )}
                {(actionType === 'approve' || actionType === 'complete') && (
                  <Field.Root>
                    <Field.Label fontSize="sm" fontWeight="600" color="gray.700" mb="2">
                      Notes <Text as="span" color="gray.400" fontWeight="400">(Optional)</Text>
                    </Field.Label>
                    <Textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Add any notes or comments..."
                      rows={4}
                      borderRadius="md"
                      borderWidth="1.5px"
                      borderColor="gray.300"
                      fontSize="sm"
                      color="gray.900"
                      _focus={{
                        borderColor: "green.400",
                        boxShadow: "0 0 0 1px green.400"
                      }}
                    />
                  </Field.Root>
                )}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer pt="4" borderTop="1px" borderColor="gray.100">
              <HStack gap="3" justify="flex-end" w="full">
                <Button
                  variant="outline"
                  onClick={() => setActionModalOpen(false)}
                  borderRadius="md"
                  px="4"
                  py="2"
                  fontSize="sm"
                  fontWeight="600"
                  borderWidth="1.5px"
                  _hover={{
                    bg: "gray.50",
                    borderColor: "gray.400"
                  }}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme={actionType === 'decline' ? 'red' : 'green'}
                  bgGradient={actionType === 'decline' 
                    ? "linear(to-r, red.500, red.600)"
                    : "linear(to-r, green.500, green.600)"}
                  _hover={{
                    bgGradient: actionType === 'decline'
                      ? "linear(to-r, red.600, red.700)"
                      : "linear(to-r, green.600, green.700)",
                    boxShadow: "md"
                  }}
                  onClick={handleAction}
                  disabled={actionType === 'decline' && !declineReason.trim()}
                  borderRadius="md"
                  px="4"
                  py="2"
                  fontSize="sm"
                  fontWeight="600"
                  boxShadow="sm"
                  _disabled={{
                    opacity: 0.5,
                    cursor: "not-allowed"
                  }}
                >
                  {actionType === 'start-review' && 'Start Review'}
                  {actionType === 'approve' && 'Approve'}
                  {actionType === 'decline' && 'Decline'}
                  {actionType === 'complete' && 'Complete'}
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Comments Modal */}
      <Dialog.Root open={commentsModalOpen} onOpenChange={(e: { open: boolean }) => setCommentsModalOpen(e.open)}>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="2xl"
            borderRadius="xl"
            boxShadow="2xl"
            border="1px"
            borderColor="gray.200"
          >
            <Dialog.Header pb="4" borderBottom="1px" borderColor="gray.100">
              <HStack gap="3" align="center" mb="1">
                <Box
                  p="2"
                  borderRadius="lg"
                  bgGradient="linear(to-br, blue.100, blue.200)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiMessageSquare} boxSize="4" color="blue.600" />
                </Box>
                <VStack align="start" gap="0">
                  <Dialog.Title fontSize="lg" fontWeight="700" color="gray.900">
                    Comments - {selectedApp?.workItemNumber || selectedApp?.id}
                  </Dialog.Title>
                  <Dialog.Description fontSize="sm" color="gray.600" mt="0.5">
                    View and add comments for this work item
                  </Dialog.Description>
                </VStack>
              </HStack>
            </Dialog.Header>
            <Dialog.Body py="6">
              <VStack gap="5" align="stretch">
                <Box maxH="400px" overflowY="auto">
                  {comments.length === 0 ? (
                    <Text color="gray.600" fontSize="sm">No comments yet</Text>
                  ) : (
                    <VStack gap="3" align="stretch">
                      {comments.map((comment: any, idx: number) => (
                        <Box key={idx} p="3" bg="gray.50" borderRadius="md">
                          <HStack justify="space-between" mb="2">
                            <Text fontWeight="semibold" fontSize="sm" color="gray.900">{comment.createdBy || 'Unknown'}</Text>
                            <Text fontSize="xs" color="gray.600">
                              {new Date(comment.createdAt).toLocaleString()}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.700">{comment.text}</Text>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="600" color="gray.700" mb="2">
                    Add Comment
                  </Field.Label>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Enter your comment..."
                    rows={3}
                    borderRadius="md"
                    borderWidth="1.5px"
                    borderColor="gray.300"
                    fontSize="sm"
                    color="gray.900"
                    _focus={{
                      borderColor: "orange.400",
                      boxShadow: "0 0 0 1px orange.400"
                    }}
                  />
                </Field.Root>
                <Button
                  colorScheme="orange"
                  bgGradient="linear(to-r, orange.500, orange.600)"
                  _hover={{
                    bgGradient: "linear(to-r, orange.600, orange.700)",
                    boxShadow: "md"
                  }}
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  borderRadius="md"
                  px="4"
                  py="2"
                  fontSize="sm"
                  fontWeight="600"
                  boxShadow="sm"
                  _disabled={{
                    opacity: 0.5,
                    cursor: "not-allowed"
                  }}
                >
                  Add Comment
                </Button>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer pt="4" borderTop="1px" borderColor="gray.100">
              <Button
                variant="outline"
                onClick={() => setCommentsModalOpen(false)}
                borderRadius="md"
                px="4"
                py="2"
                fontSize="sm"
                fontWeight="600"
                borderWidth="1.5px"
                _hover={{
                  bg: "gray.50",
                  borderColor: "gray.400"
                }}
              >
                Close
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* History Modal */}
      <Dialog.Root open={historyModalOpen} onOpenChange={(e: { open: boolean }) => setHistoryModalOpen(e.open)}>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="2xl"
            borderRadius="xl"
            boxShadow="2xl"
            border="1px"
            borderColor="gray.200"
          >
            <Dialog.Header pb="4" borderBottom="1px" borderColor="gray.100">
              <Dialog.Title fontSize="lg" fontWeight="700" color="gray.900">
                History - {selectedApp?.workItemNumber || selectedApp?.id}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body py="6">
              <Box maxH="500px" overflowY="auto">
                {history.length === 0 ? (
                    <Text color="gray.600" fontSize="sm">No history available</Text>
                ) : (
                  <VStack gap="2" align="stretch">
                    {history.map((entry: any, idx: number) => (
                      <Box key={idx} p="3" borderLeft="3px" borderColor="orange.500" bg="gray.50" borderRadius="md">
                        <HStack justify="space-between" mb="1">
                          <Text fontWeight="semibold" fontSize="sm" color="gray.900">{entry.action || entry.description}</Text>
                          <Text fontSize="xs" color="gray.600">
                            {new Date(entry.timestamp || entry.createdAt).toLocaleString()}
                          </Text>
                        </HStack>
                        {entry.performedBy && (
                          <Text fontSize="xs" color="gray.600">By: {entry.performedBy}</Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </Dialog.Body>
            <Dialog.Footer pt="4" borderTop="1px" borderColor="gray.100">
              <Button
                variant="outline"
                onClick={() => setHistoryModalOpen(false)}
                borderRadius="md"
                px="4"
                py="2"
                fontSize="sm"
                fontWeight="600"
                borderWidth="1.5px"
                _hover={{
                  bg: "gray.50",
                  borderColor: "gray.400"
                }}
              >
                Close
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Toaster is rendered automatically by Chakra UI */}
    </Flex>
  );
}
