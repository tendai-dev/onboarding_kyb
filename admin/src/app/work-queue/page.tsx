"use client";

import { 
  Box, 
  VStack, 
  HStack,
  SimpleGrid,
  Flex,
  Spinner,
  Container,
  Textarea,
  Field,
  Menu,
  IconButton,
  Icon,
  Avatar
} from "@chakra-ui/react";
import { 
  Typography, 
  Card, 
  Button, 
  Search, 
  AlertBar, 
  Tag,
  DataTable,
  IconWrapper,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsIndicator,
  TabsContent,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  ChevronRightIcon,
  Tooltip,
  EditIcon,
  DeleteIcon
} from "@/lib/mukuruImports";
import type { ColumnConfig } from "@mukuru/mukuru-react-components";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import PortalHeader from "../../components/PortalHeader";
import { useSidebar } from "../../contexts/SidebarContext";
import { 
  FiEye, 
  FiFile, 
  FiMoreVertical,
  FiUser,
  FiPlay,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiClock,
  FiRefreshCw,
  FiUserCheck,
  FiAlertTriangle,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiClock as FiClockIcon,
  FiAlertCircle,
  FiDownload
} from "react-icons/fi";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  fetchWorkItems,
  fetchMyWorkItems,
  fetchPendingApprovals,
  assignWorkItemUseCase,
  unassignWorkItemUseCase,
  startReviewUseCase,
  approveWorkItemUseCase,
  declineWorkItemUseCase,
  completeWorkItemUseCase,
  submitForApprovalUseCase,
  markForRefreshUseCase,
  addCommentUseCase,
  fetchWorkItemComments,
  fetchWorkItemHistory,
  exportWorkItems,
  WorkItemApplication,
} from "../../services";
import { logger } from "../../lib/logger";

type ViewType = 'all' | 'my-items' | 'pending-approvals';
type StatusFilter = 'ALL' | 'SUBMITTED' | 'IN PROGRESS' | 'RISK REVIEW' | 'COMPLETE' | 'DECLINED';

export default function WorkQueuePage() {
  const { data: session } = useSession();
  const { condensed } = useSidebar();
  const [viewType, setViewType] = useState<ViewType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState("");
  const [applications, setWorkItemApplications] = useState<WorkItemApplication[]>([]);
  const [loading, setLoading] = useState(false); // Start as false - DataTable manages its own loading
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
  const [selectedApp, setSelectedApp] = useState<WorkItemApplication | null>(null);
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
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Toast notifications - using AlertBar for now (can be enhanced later)
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  
  const showToast = (title: string, description: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 5000) => {
    setToast({ title, description, type });
    setTimeout(() => setToast(null), duration);
  };

  // Get current user info - memoize to prevent recreation on every render
  const currentUser = useMemo(() => ({
    id: session?.user?.email || '',
    name: session?.user?.name || 'Admin',
    email: session?.user?.email || ''
  }), [session?.user?.email, session?.user?.name]);

  // Removed loadWorkItemApplications - DataTable handles data fetching via fetchData

  // Handler for search changes - Search component handles debouncing internally (500ms)
  // Note: DataTable handles data fetching via fetchData, so we just update the search term
  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
    // DataTable will automatically refetch when key changes
  }, []);

  const handleExport = async () => {
    try {
      // Use new service structure for export
      const blob = await exportWorkItems({
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
      
      showToast('Export successful', 'Work queue data has been exported to CSV', 'success', 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export work queue';
      showToast('Export failed', errorMessage, 'error', 5000);
    }
  };

  const openAssignModal = (app: WorkItemApplication) => {
    setSelectedApp(app);
    setAssignToSelf(true);
    setAssignToUserId("");
    setAssignToUserName("");
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    logger.debug('[WorkQueue] handleAssign called', { selectedApp, assignToSelf });
    
    if (!selectedApp) {
      logger.error(new Error('No selected app'), '[WorkQueue] No selected app');
      showToast('Assignment failed', 'No work item selected', 'error', 3000);
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
      showToast('Assignment not allowed', 'Cannot assign a work item that is already completed or declined.', 'error', 5000);
      setAssignModalOpen(false);
      return;
    }
    
    try {
      logger.debug('[WorkQueue] Starting assignment process');
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
        showToast('Assignment failed', 'Please select an assignee', 'error', 3000);
        return;
      }

      // Use workItemId (GUID) for API calls
      const workItemId = selectedApp.workItemId || selectedApp.id;
      logger.debug('[WorkQueue] Calling assignWorkItem API', { 
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
      
      await assignWorkItemUseCase(workItemId, userId, userName);
      
      logger.info('[WorkQueue] Assignment API call successful');
      
      showToast('Assignment successful', `Work item assigned to ${userName}`, 'success', 3000);

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
      // Trigger DataTable refresh
      setRefreshKey(prev => prev + 1);
      calculateStats();
    } catch (err) {
      logger.error(err, '[WorkQueue] Assignment error');
      let errorMessage = err instanceof Error ? err.message : 'Failed to assign work item';
      
      // Provide user-friendly error messages
      if (errorMessage.includes('Cannot assign completed work item') || 
          errorMessage.includes('completed work item')) {
        errorMessage = 'Cannot assign a work item that is already completed.';
      } else if (errorMessage.includes('Cannot assign declined work item') || 
                 errorMessage.includes('declined work item')) {
        errorMessage = 'Cannot assign a work item that has been declined.';
      }
      
      showToast('Assignment failed', errorMessage, 'error', 5000);
    }
  };

  const handleUnassign = async (appId: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      await unassignWorkItemUseCase(workItemId);
      showToast('Unassigned successfully', 'Work item has been unassigned', 'success', 3000);
      // Trigger DataTable refresh
      setRefreshKey(prev => prev + 1);
      calculateStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unassign work item';
      showToast('Unassign failed', errorMessage, 'error', 5000);
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
        await startReviewUseCase(workItemId);
        
        showToast('Review started', 'Redirecting to review page...', 'success', 2000);
      } else if (isAlreadyInProgress) {
        // Already in progress, just navigate (don't call API)
        showToast('Opening review', 'Redirecting to review page...', 'info', 1500);
      } else {
        // Status is neither Assigned nor InProgress - show error
        showToast('Cannot start review', `Work item must be in "Assigned" status to start review. Current status: ${app?.backendStatus || app?.status}`, 'error', 5000);
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
      
      logger.error(err, '[WorkQueue] Error starting review');
      showToast('Failed to start review', errorMessage, 'error', 5000);
    }
  };

  const openActionModal = (app: WorkItemApplication, type: 'start-review' | 'approve' | 'decline' | 'complete') => {
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
          await startReviewUseCase(workItemId);
          break;
        case 'approve':
          await approveWorkItemUseCase(workItemId, actionNotes);
          break;
        case 'decline':
          if (!declineReason.trim()) {
            showToast('Decline failed', 'Please provide a reason for declining', 'error', 3000);
            return;
          }
          await declineWorkItemUseCase(workItemId, declineReason);
          break;
        case 'complete':
          await completeWorkItemUseCase(workItemId, actionNotes);
          break;
      }

      showToast('Action successful', `${actionType.replace('-', ' ')} completed successfully`, 'success', 3000);

      setActionModalOpen(false);
      // Trigger DataTable refresh
      setRefreshKey(prev => prev + 1);
      calculateStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${actionType}`;
      showToast('Action failed', errorMessage, 'error', 5000);
    }
  };

  const handleSubmitForApproval = async (appId: string, notes?: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      await submitForApprovalUseCase(workItemId, notes);
      showToast('Submitted for approval', 'Work item has been submitted for approval', 'success', 3000);
      // Trigger DataTable refresh
      setRefreshKey(prev => prev + 1);
      calculateStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit for approval';
      showToast('Submission failed', errorMessage, 'error', 5000);
    }
  };

  const handleMarkForRefresh = async (appId: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      await markForRefreshUseCase(workItemId);
      showToast('Marked for refresh', 'Work item has been marked for refresh', 'success', 3000);
      // Trigger DataTable refresh
      setRefreshKey(prev => prev + 1);
      calculateStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark for refresh';
      showToast('Failed', errorMessage, 'error', 5000);
    }
  };

  const loadComments = async (appId: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      const commentsData = await fetchWorkItemComments(workItemId);
      setComments(commentsData);
    } catch (err) {
      logger.error(err, 'Error loading comments');
      setComments([]);
    }
  };

  const loadHistory = async (appId: string) => {
    try {
      // Find the application to get the actual workItemId (GUID)
      const app = applications.find(a => a.id === appId || a.workItemId === appId);
      const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
      const historyData = await fetchWorkItemHistory(workItemId);
      setHistory(historyData);
    } catch (err) {
      logger.error(err, 'Error loading history');
      setHistory([]);
    }
  };

  const handleAddComment = async () => {
    if (!selectedApp || !newComment.trim()) return;

    try {
      // Use workItemId (GUID) for API calls
      const workItemId = selectedApp.workItemId || selectedApp.id;
      await addCommentUseCase(workItemId, newComment);
      showToast('Comment added', 'Your comment has been added', 'success', 3000);
      setNewComment("");
      loadComments(workItemId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      showToast('Failed to add comment', errorMessage, 'error', 5000);
    }
  };

  const openCommentsModal = async (app: WorkItemApplication) => {
    setSelectedApp(app);
    setCommentsModalOpen(true);
    await loadComments(app.id);
  };

  const openHistoryModal = async (app: WorkItemApplication) => {
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

  const filteredWorkItemApplications = applications;

  // Stats calculation - memoized to avoid recalculating on every render
  const calculateStats = useCallback(async () => {
    try {
      logger.debug('[WorkQueue] Calculating stats...');
      const allResult = await fetchWorkItems({ pageSize: 1000 });
      setStats({
        total: allResult.totalCount,
        submitted: allResult.items.filter(app => app.status === 'SUBMITTED').length,
        inProgress: allResult.items.filter(app => app.status === 'IN PROGRESS').length,
        riskReview: allResult.items.filter(app => app.status === 'RISK REVIEW').length,
        complete: allResult.items.filter(app => app.status === 'COMPLETE').length,
        declined: allResult.items.filter(app => app.status === 'DECLINED').length,
      });
      logger.debug('[WorkQueue] Stats calculated', { total: allResult.totalCount });
    } catch (err) {
      logger.error(err, '[WorkQueue] Error calculating stats');
      // Don't show error toast for stats - it's not critical
    }
  }, []);

  // Load stats on mount and when viewType changes (debounced to avoid rapid calls)
  const statsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (statsTimeoutRef.current) {
      clearTimeout(statsTimeoutRef.current);
    }
    statsTimeoutRef.current = setTimeout(() => {
      calculateStats();
    }, 500); // Debounce stats calculation
    
    return () => {
      if (statsTimeoutRef.current) {
        clearTimeout(statsTimeoutRef.current);
      }
    };
  }, [calculateStats, viewType]);

  // Async mode fetchData function for DataTable
  // Use useCallback to memoize and include viewType and statusFilter in dependencies
  const fetchData = useCallback(async (params: Record<string, string | string[] | null>) => {
    try {
      logger.debug('[WorkQueue] fetchData started');
      setLoading(true);
      setError(null);
      
      const search = params.search as string || searchTerm || '';
      const statusParam = params.status as string | string[] | null;
      const status = Array.isArray(statusParam) ? statusParam[0] : statusParam;
      
      // Use statusFilter from state if not provided in params, or if statusFilter is set
      const effectiveStatus = status || (statusFilter !== 'ALL' ? statusFilter : undefined);
      
      logger.debug('[WorkQueue] fetchData called', { viewType, effectiveStatus, search, params });
      
      let result;
      if (viewType === 'my-items') {
        logger.debug('[WorkQueue] Fetching my items...');
        result = await fetchMyWorkItems(1, 1000);
        logger.debug('[WorkQueue] My items result', { count: result.items.length, total: result.totalCount });
        
        if (result.items.length === 0) {
          logger.debug('[WorkQueue] No items from getMyWorkItems, trying fallback filter');
          const allResult = await fetchWorkItems({ pageSize: 1000 });
          const filtered = allResult.items.filter(app => {
            const matchesId = app.assignedTo === currentUser.id || 
                             app.assignedTo === currentUser.email ||
                             app.assignedTo?.toLowerCase() === currentUser.email?.toLowerCase();
            const matchesName = app.assignedToName === currentUser.name ||
                               app.assignedToName?.toLowerCase() === currentUser.name?.toLowerCase();
            return matchesId || matchesName;
          });
          result = { items: filtered, totalCount: filtered.length, page: 1, pageSize: 1000 };
          logger.debug('[WorkQueue] Fallback filter found', { count: filtered.length });
        }
      } else if (viewType === 'pending-approvals') {
        logger.debug('[WorkQueue] Fetching pending approvals...');
        const pendingResult = await fetchPendingApprovals(1, 1000);
        logger.debug('[WorkQueue] Pending approvals result', { count: pendingResult.items.length, total: pendingResult.totalCount });
        // Pending approvals returns WorkItemDto, need to map to WorkItemApplication
        const { mapWorkItemsToApplications } = await import('../../services/mappers/workQueueMapper');
        const mapped = mapWorkItemsToApplications(pendingResult.items);
        return mapped as unknown as Record<string, unknown>[];
      } else {
        logger.debug('[WorkQueue] Fetching all items...', { search, effectiveStatus });
        result = await fetchWorkItems({
          searchTerm: search || undefined,
          status: effectiveStatus,
          pageSize: 1000,
        });
        logger.debug('[WorkQueue] All items result', { count: result.items.length, total: result.totalCount });
      }
      
      // Update applications state for compatibility
      setWorkItemApplications(result.items);
      
      logger.debug('[WorkQueue] fetchData completed successfully', { count: result.items.length });
      return result.items as unknown as Record<string, unknown>[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load work queue items';
      logger.error(err, '[WorkQueue] Error in fetchData', {
        tags: { error_type: 'fetch_data' },
        extra: {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          viewType,
          statusFilter,
          searchTerm
        }
      });
      setError(errorMessage);
      setToast({ title: 'Error loading work queue', description: errorMessage, type: 'error' });
      setTimeout(() => setToast(null), 5000);
      return [];
    } finally {
      setLoading(false);
    }
  }, [viewType, statusFilter, currentUser, searchTerm]);

  const handleSortChange = (field: string, direction: "asc" | "desc") => {
    setSortConfig({ field, direction });
  };

  // Removed early loading return - DataTable handles its own loading state

  // Prepare DataTable columns
  const columns: ColumnConfig<WorkItemApplication>[] = [
    {
      field: 'workItemNumber',
      header: 'Work Item #',
      sortable: true,
      width: '90px',
      minWidth: '90px',
      render: (value, row) => (
        <Typography fontSize="sm" fontWeight="semibold" color="gray.900">
          {row.workItemNumber || row.id.substring(0, 8)}
        </Typography>
      )
    },
    {
      field: 'legalName',
      header: 'Applicant Name',
      sortable: true,
      width: '150px',
      minWidth: '150px',
      render: (value) => (
        <Typography fontSize="sm" color="gray.800" fontWeight="medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value as string || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'entityType',
      header: 'Entity Type',
      sortable: true,
      width: '100px',
      minWidth: '100px',
      render: (value) => (
        <Typography fontSize="sm" color="gray.700" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value as string || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'country',
      header: 'Country',
      sortable: true,
      width: '80px',
      minWidth: '80px',
      render: (value) => (
        <Typography fontSize="sm" color="gray.700">
          {value as string || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      width: '110px',
      minWidth: '110px',
      render: (value) => {
        const status = value as string;
        const statusVariantMap: Record<string, "success" | "inactive" | "info" | "warning"> = {
          'SUBMITTED': 'info',
          'IN PROGRESS': 'warning',
          'RISK REVIEW': 'warning',
          'COMPLETE': 'success',
          'DECLINED': 'inactive',
        };
        const variant = statusVariantMap[status] || 'info';
        return (
          <Tag variant={variant} size="md" appearance="transparent">
            {status}
          </Tag>
        );
      }
    },
    {
      field: 'assignedToName',
      header: 'Assigned To',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: (value, row) => {
        const assignedTo = (value as string) || row.assignedTo || "Unassigned";
        const isAssigned = assignedTo !== "Unassigned";
        return (
          <HStack gap="2">
            <Box
              w="6"
              h="6"
              borderRadius="full"
              bg={isAssigned ? "orange.200" : "gray.200"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <IconWrapper>
                <FiUser size={12} color={isAssigned ? "#DD6B20" : "#9CA3AF"} />
              </IconWrapper>
            </Box>
            <Typography 
              fontSize="sm" 
              color={isAssigned ? "gray.800" : "gray.500"} 
              fontWeight={isAssigned ? "medium" : "normal"}
              fontStyle={!isAssigned ? "italic" : "normal"}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {assignedTo}
            </Typography>
          </HStack>
        );
      }
    },
        {
          field: 'priority',
          header: 'Priority',
          sortable: true,
          width: '90px',
          minWidth: '90px',
          render: (value) => {
            if (!value) return <Typography fontSize="sm" color="gray.500">-</Typography>;
            const priority = (value as string).toLowerCase();
            const priorityVariantMap: Record<string, "success" | "inactive" | "info" | "warning"> = {
              'low': 'success',
              'medium': 'info',
              'high': 'warning',
              'urgent': 'warning',
            };
            const variant = priorityVariantMap[priority] || 'info';
            return (
              <Tag variant={variant} size="md" appearance="transparent">
                {value as string}
              </Tag>
            );
          }
        },
        {
          field: 'riskLevel',
          header: 'Risk',
          sortable: true,
          width: '80px',
          minWidth: '80px',
          render: (value) => {
            if (!value) return <Typography fontSize="sm" color="gray.500">-</Typography>;
            const risk = (value as string).toLowerCase();
            const riskVariantMap: Record<string, "success" | "inactive" | "info" | "warning"> = {
              'low': 'success',
              'medium': 'info',
              'high': 'warning',
              'critical': 'warning',
            };
            const variant = riskVariantMap[risk] || 'info';
            return (
              <Tag variant={variant} size="md" appearance="transparent">
                {value as string}
              </Tag>
            );
          }
        },
  ];

  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />
      <PortalHeader />
      
      {/* Toast Notification */}
      {toast && (
        <Box
          position="fixed"
          top="20px"
          right="20px"
          zIndex={10000}
          maxW="400px"
        >
          <AlertBar
            status={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => setToast(null)}
          />
        </Box>
      )}

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
        {/* Header Section */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" boxShadow="sm" width="full">
          <Container maxW="100%" px="8" py="6" width="full">
            <Flex justify="space-between" align="center" mb="4">
            <VStack align="start" gap="2">
              <Typography fontSize="3xl" fontWeight="bold" color="gray.900">
                Work Queue
              </Typography>
              <Typography fontSize="md" color="gray.600" fontWeight="normal">
                Manage and track work items across all onboarding cases
              </Typography>
            </VStack>
            <HStack gap="3">
              <Button 
                  variant="primary"
                  size="sm"
                onClick={handleExport}
                  className="mukuru-primary-button"
                  style={{
                    color: 'white',
                    backgroundColor: '#F05423',
                    border: 'none',
                    borderWidth: 0,
                    borderStyle: 'none',
                    borderColor: '#F05423',
                    outline: 'none',
                    outlineWidth: 0,
                    boxShadow: 'none',
                    WebkitBoxShadow: 'none',
                    MozBoxShadow: 'none'
                  }}
              >
                <IconWrapper>
                  <FiDownload size={16} />
                </IconWrapper>
                <span style={{ color: 'white' }}>Export</span>
              </Button>
            </HStack>
          </Flex>

            {/* View Tabs */}
            <TabsRoot defaultValue={viewType} onValueChange={(details: { value: string }) => setViewType(details.value as ViewType)} variant="line">
              <TabsList>
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="my-items">My Items</TabsTrigger>
                <TabsTrigger value="pending-approvals">Pending Approvals</TabsTrigger>
                <TabsIndicator rounded="l2" />
              </TabsList>
            </TabsRoot>
          </Container>
        </Box>

        {/* Content Section */}
        <Box flex="1" bg="gray.50" width="full">
          <TabsRoot defaultValue={viewType} onValueChange={(details: { value: string }) => setViewType(details.value as ViewType)} variant="line">
            <TabsContent value="all">
              <Container maxW="100%" px="8" py="8" width="full">
                <VStack gap="4" align="stretch" width="full">
            {/* Error Alert */}
            {error && (
              <AlertBar
                status="error"
                title="Error loading work queue"
                description={error}
              />
            )}

            {/* Status Filter Buttons */}
                    <HStack gap="2" wrap="wrap" mb="2" mt="0" pt="0" className="status-filter-buttons" style={{ border: 'none', outline: 'none' }}>
                <div
                  onClick={() => setStatusFilter('ALL')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setStatusFilter('ALL');
                    }
                  }}
                  className={`status-filter-btn ${statusFilter === 'ALL' ? "mukuru-primary-button" : "mukuru-secondary-button"}`}
                  style={{
                    color: 'white',
                    background: statusFilter === 'ALL' ? '#F05423' : '#111827',
                    backgroundColor: statusFilter === 'ALL' ? '#F05423' : '#111827',
                    border: `1px solid ${statusFilter === 'ALL' ? '#F05423' : '#111827'}`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: statusFilter === 'ALL' ? '#F05423' : '#111827',
                    outline: '0',
                    outlineWidth: '0',
                    outlineStyle: 'none',
                    outlineColor: 'transparent',
                    boxShadow: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '36px',
                    margin: 0,
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    backgroundClip: 'border-box',
                    WebkitBackgroundClip: 'border-box'
                  }}
                >
                  <span style={{ color: 'white' }}>All</span>
                </div>
                <div
                  onClick={() => setStatusFilter('SUBMITTED')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setStatusFilter('SUBMITTED');
                    }
                  }}
                  className={`status-filter-btn ${statusFilter === 'SUBMITTED' ? "mukuru-primary-button" : "mukuru-secondary-button"}`}
                  style={{
                    color: 'white',
                    background: statusFilter === 'SUBMITTED' ? '#F05423' : '#111827',
                    backgroundColor: statusFilter === 'SUBMITTED' ? '#F05423' : '#111827',
                    border: `1px solid ${statusFilter === 'SUBMITTED' ? '#F05423' : '#111827'}`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: statusFilter === 'SUBMITTED' ? '#F05423' : '#111827',
                    outline: '0',
                    outlineWidth: '0',
                    outlineStyle: 'none',
                    outlineColor: 'transparent',
                    boxShadow: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '36px',
                    margin: 0,
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    backgroundClip: 'border-box',
                    WebkitBackgroundClip: 'border-box'
                  }}
                >
                  <span style={{ color: 'white' }}>Submitted ({stats.submitted})</span>
                </div>
                <div
                  onClick={() => setStatusFilter('IN PROGRESS')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setStatusFilter('IN PROGRESS');
                    }
                  }}
                  className={`status-filter-btn ${statusFilter === 'IN PROGRESS' ? "mukuru-primary-button" : "mukuru-secondary-button"}`}
                  style={{
                    color: 'white',
                    background: statusFilter === 'IN PROGRESS' ? '#F05423' : '#111827',
                    backgroundColor: statusFilter === 'IN PROGRESS' ? '#F05423' : '#111827',
                    border: `1px solid ${statusFilter === 'IN PROGRESS' ? '#F05423' : '#111827'}`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: statusFilter === 'IN PROGRESS' ? '#F05423' : '#111827',
                    outline: '0',
                    outlineWidth: '0',
                    outlineStyle: 'none',
                    outlineColor: 'transparent',
                    boxShadow: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '36px',
                    margin: 0,
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    backgroundClip: 'border-box',
                    WebkitBackgroundClip: 'border-box'
                  }}
                >
                  <span style={{ color: 'white' }}>In Progress ({stats.inProgress})</span>
                </div>
                <div
                  onClick={() => setStatusFilter('RISK REVIEW')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setStatusFilter('RISK REVIEW');
                    }
                  }}
                  className={`status-filter-btn ${statusFilter === 'RISK REVIEW' ? "mukuru-primary-button" : "mukuru-secondary-button"}`}
                  style={{
                    color: 'white',
                    background: statusFilter === 'RISK REVIEW' ? '#F05423' : '#111827',
                    backgroundColor: statusFilter === 'RISK REVIEW' ? '#F05423' : '#111827',
                    border: `1px solid ${statusFilter === 'RISK REVIEW' ? '#F05423' : '#111827'}`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: statusFilter === 'RISK REVIEW' ? '#F05423' : '#111827',
                    outline: '0',
                    outlineWidth: '0',
                    outlineStyle: 'none',
                    outlineColor: 'transparent',
                    boxShadow: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '36px',
                    margin: 0,
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    backgroundClip: 'border-box',
                    WebkitBackgroundClip: 'border-box'
                  }}
                >
                  <span style={{ color: 'white' }}>Risk Review ({stats.riskReview})</span>
                </div>
                <div
                  onClick={() => setStatusFilter('COMPLETE')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setStatusFilter('COMPLETE');
                    }
                  }}
                  className={`status-filter-btn ${statusFilter === 'COMPLETE' ? "mukuru-primary-button" : "mukuru-secondary-button"}`}
                  style={{
                    color: 'white',
                    background: statusFilter === 'COMPLETE' ? '#F05423' : '#111827',
                    backgroundColor: statusFilter === 'COMPLETE' ? '#F05423' : '#111827',
                    border: `1px solid ${statusFilter === 'COMPLETE' ? '#F05423' : '#111827'}`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: statusFilter === 'COMPLETE' ? '#F05423' : '#111827',
                    outline: '0',
                    outlineWidth: '0',
                    outlineStyle: 'none',
                    outlineColor: 'transparent',
                    boxShadow: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '36px',
                    margin: 0,
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    backgroundClip: 'border-box',
                    WebkitBackgroundClip: 'border-box'
                  }}
                >
                  <span style={{ color: 'white' }}>Complete ({stats.complete})</span>
                </div>
                <div
                  onClick={() => setStatusFilter('DECLINED')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setStatusFilter('DECLINED');
                    }
                  }}
                  className={`status-filter-btn ${statusFilter === 'DECLINED' ? "mukuru-primary-button" : "mukuru-secondary-button"}`}
                  style={{
                    color: 'white',
                    background: statusFilter === 'DECLINED' ? '#F05423' : '#111827',
                    backgroundColor: statusFilter === 'DECLINED' ? '#F05423' : '#111827',
                    border: `1px solid ${statusFilter === 'DECLINED' ? '#F05423' : '#111827'}`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: statusFilter === 'DECLINED' ? '#F05423' : '#111827',
                    outline: '0',
                    outlineWidth: '0',
                    outlineStyle: 'none',
                    outlineColor: 'transparent',
                    boxShadow: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '36px',
                    margin: 0,
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    backgroundClip: 'border-box',
                    WebkitBackgroundClip: 'border-box'
                  }}
                >
                  <span style={{ color: 'white' }}>Declined ({stats.declined})</span>
                </div>
              </HStack>

                    {/* Stats Cards - Mukuru Cards */}
            <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap="4">
              <Card 
                width="full" 
                bg="white" 
                onClick={() => setStatusFilter('ALL')}
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="mukuru.orange.100/20" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper>
                                <FiTrendingUp color="#F05423" height="24px" width="24px" />
                    </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              Total
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="gray.800" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {stats.total.toLocaleString()}
                  </Typography>
              </Card>
              
              <Card 
                width="full" 
                bg="white" 
                onClick={() => setStatusFilter('SUBMITTED')}
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="blue.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper>
                                <FiClockIcon color="#3182CE" height="24px" width="24px" />
                    </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              Submitted
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="blue.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {stats.submitted.toLocaleString()}
                  </Typography>
              </Card>
              
              <Card 
                width="full" 
                bg="white" 
                onClick={() => setStatusFilter('IN PROGRESS')}
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="mukuru.orange.100/20" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper>
                                <FiRefreshCw color="#F05423" height="24px" width="24px" />
                    </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              In Progress
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="orange.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {stats.inProgress.toLocaleString()}
                  </Typography>
              </Card>
              
              <Card 
                width="full" 
                bg="white" 
                onClick={() => setStatusFilter('RISK REVIEW')}
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="red.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper>
                                <FiAlertTriangle color="#E53E3E" height="24px" width="24px" />
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
                    {stats.riskReview.toLocaleString()}
                  </Typography>
              </Card>
              
              <Card 
                width="full" 
                bg="white" 
                onClick={() => setStatusFilter('COMPLETE')}
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="green.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper>
                                <FiCheckCircle color="#38A169" height="24px" width="24px" />
                    </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              Complete
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="green.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                    {stats.complete.toLocaleString()}
                  </Typography>
              </Card>
              
              <Card 
                width="full" 
                bg="white" 
                onClick={() => setStatusFilter('DECLINED')}
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="red.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiXCircle color="#C53030" height="24px" width="24px" />
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
                          {stats.declined.toLocaleString()}
                        </Typography>
                      </Card>
                    </SimpleGrid>

                    {/* Work Queue DataTable */}
                    <Box 
                      bg="white" 
                      borderRadius="xl" 
                      boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                      border="1px solid"
                      borderColor="gray.100"
                      overflow="hidden"
                      color="gray.900"
                      className="work-queue-table-wrapper"
                    >
                      <DataTable
                        key={`work-queue-${viewType}-${statusFilter}-${searchTerm}-${refreshKey}`}
                        fetchData={fetchData}
                        columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
                        tableId="work-queue"
                        sortConfig={sortConfig ?? undefined}
                        onSortChange={handleSortChange}
                        showActions={true}
                        actionColumn={{
                          header: 'Actions',
                          width: '120px',
                          render: (row, index) => {
                            const app = row as unknown as WorkItemApplication;
                            return (
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                                <Tooltip content="View" showArrow variant="light">
                                  <Link href={app.applicationId ? `/applications/${app.applicationId}` : `/applications/${app.id}`} style={{ textDecoration: 'none' }}>
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "6px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: "28px",
                                        height: "28px"
                                      }}
                                      aria-label="View"
                                    >
                                      <IconWrapper><FiEye size={14} /></IconWrapper>
                                    </button>
                                  </Link>
                                </Tooltip>
                                {app.assignedTo && 
                                 (app.assignedTo === currentUser.id || app.assignedToName === currentUser.name) &&
                                 (app.backendStatus === 'Assigned' || app.backendStatus === 'InProgress') &&
                                 app.status !== 'COMPLETE' && 
                                 app.status !== 'DECLINED' && (
                                  <Tooltip content="Review" showArrow variant="light">
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      onClick={() => handleStartReview(app.id)}
                                      aria-label="Review"
                                    >
                                      <IconWrapper><FiPlay size={16} /></IconWrapper>
                                    </button>
                                  </Tooltip>
                                )}
                                {!app.assignedTo && 
                                 app.status !== 'COMPLETE' && 
                                 app.status !== 'DECLINED' &&
                                 app.backendStatus !== 'Completed' &&
                                 app.backendStatus !== 'Declined' &&
                                 app.backendStatus !== 'Cancelled' && (
                                  <Tooltip content="Assign" showArrow variant="light">
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      onClick={() => openAssignModal(app)}
                                      aria-label="Assign"
                                    >
                                      <IconWrapper><FiUser size={16} /></IconWrapper>
                                    </button>
                                  </Tooltip>
                                )}
                                {app.status === 'IN PROGRESS' && (
                                  <Tooltip content="Complete" showArrow variant="light">
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      onClick={() => openActionModal(app, 'complete')}
                                      aria-label="Complete"
                                    >
                                      <IconWrapper><FiCheck size={16} /></IconWrapper>
                                    </button>
                                  </Tooltip>
                                )}
                                {app.status === 'RISK REVIEW' && (
                                  <>
                                    <Tooltip content="Approve" showArrow variant="light">
                                      <button
                                        style={{
                                          background: "none",
                                          border: "none",
                                          padding: "8px",
                                          cursor: "pointer",
                                          color: "#E8590C",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center"
                                        }}
                                        onClick={() => openActionModal(app, 'approve')}
                                        aria-label="Approve"
                                      >
                                        <IconWrapper><FiCheck size={16} /></IconWrapper>
                                      </button>
                                    </Tooltip>
                                    <Tooltip content="Decline" showArrow variant="light">
                                      <button
                                        style={{
                                          background: "none",
                                          border: "none",
                                          padding: "8px",
                                          cursor: "pointer",
                                          color: "#E8590C",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center"
                                        }}
                                        onClick={() => openActionModal(app, 'decline')}
                                        aria-label="Decline"
                                      >
                                        <DeleteIcon />
                                      </button>
                                    </Tooltip>
                                  </>
                                )}
                                <Tooltip content="Mark for Refresh" showArrow variant="light">
                                  <button
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: "8px",
                                      cursor: "pointer",
                                      color: "#E8590C",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                    onClick={() => handleMarkForRefresh(app.id)}
                                    aria-label="Mark for Refresh"
                                  >
                                    <IconWrapper><FiRefreshCw size={16} /></IconWrapper>
                                  </button>
                                </Tooltip>
                              </div>
                            );
                          }
                        }}
                        emptyState={{
                          message: "No work queue items found",
                          content: (
                            <VStack gap="4" py="8">
                    <IconWrapper>
                                <FiFile size={48} color="#9CA3AF" />
                    </IconWrapper>
                              <Typography fontSize="lg" fontWeight="semibold" color="gray.700">
                                No work queue items found
                              </Typography>
                              <Typography fontSize="sm" color="gray.600" textAlign="center" maxW="400px">
                                {error 
                                  ? `Error loading work queue: ${error}. Please check your connection and try again.`
                                  : viewType === 'my-items'
                                    ? "You don't have any assigned work items. Work items will appear here once they are assigned to you."
                                    : viewType === 'pending-approvals'
                                      ? "No items are pending approval. Items requiring approval will appear here."
                                      : "Work items are automatically created when onboarding cases are submitted. Submit a new case to see work items here."}
                              </Typography>
                            </VStack>
                          )
                        }}
                      />
                    </Box>
                  </VStack>
                </Container>
              </TabsContent>

              <TabsContent value="my-items">
                <Container maxW="8xl" px="8" py="8" width="full">
                  <VStack gap="6" align="stretch" width="full">
                    {/* Error Alert */}
                    {error && (
                      <AlertBar
                        status="error"
                        title="Error loading work queue"
                        description={error}
                      />
                    )}

                    {/* Stats Cards - Mukuru Cards */}
                    <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap="4">
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="mukuru.orange.100/20" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiTrendingUp color="#F05423" height="24px" width="24px" />
                              </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              Total
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="gray.800" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                          {stats.total.toLocaleString()}
                        </Typography>
                      </Card>
                      
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="blue.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiClockIcon color="#3182CE" height="24px" width="24px" />
                              </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              Submitted
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="blue.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                          {stats.submitted.toLocaleString()}
                        </Typography>
                      </Card>
                      
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="mukuru.orange.100/20" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiRefreshCw color="#F05423" height="24px" width="24px" />
                              </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              In Progress
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="orange.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                          {stats.inProgress.toLocaleString()}
                        </Typography>
                      </Card>
                      
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="red.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiAlertTriangle color="#E53E3E" height="24px" width="24px" />
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
                          {stats.riskReview.toLocaleString()}
                        </Typography>
                      </Card>
                      
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="green.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiCheckCircle color="#38A169" height="24px" width="24px" />
                              </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              Complete
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="green.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                          {stats.complete.toLocaleString()}
                        </Typography>
                      </Card>
                      
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="red.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiXCircle color="#C53030" height="24px" width="24px" />
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
                    {stats.declined.toLocaleString()}
                        </Typography>
                      </Card>
                    </SimpleGrid>

                    {/* Search Bar Above Table */}
                    <Box mb="4" width="100%">
                      <Box width="100%" maxW="800px">
                        <Search
                          placeholder="Search by Name or Email..."
                          onSearchChange={handleSearchChange}
                        />
                      </Box>
                    </Box>

                    {/* Work Queue DataTable */}
                    <Box 
                      bg="white" 
                      borderRadius="xl" 
                      boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                      border="1px solid"
                      borderColor="gray.100"
                      overflow="hidden"
                      color="gray.900"
                      className="work-queue-table-wrapper"
                    >
                      <DataTable
                        key={`work-queue-${viewType}-${statusFilter}-${searchTerm}-${refreshKey}`}
                        fetchData={fetchData}
                        columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
                        tableId="work-queue"
                        sortConfig={sortConfig ?? undefined}
                        onSortChange={handleSortChange}
                        showActions={true}
                        actionColumn={{
                          header: 'Actions',
                          width: '120px',
                          render: (row, index) => {
                            const app = row as unknown as WorkItemApplication;
                            return (
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                                <Tooltip content="View" showArrow variant="light">
                                  <Link href={app.applicationId ? `/applications/${app.applicationId}` : `/applications/${app.id}`} style={{ textDecoration: 'none' }}>
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "6px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: "28px",
                                        height: "28px"
                                      }}
                                      aria-label="View"
                                    >
                                      <IconWrapper><FiEye size={14} /></IconWrapper>
                                    </button>
                                  </Link>
                                </Tooltip>
                                {app.assignedTo && 
                                 (app.assignedTo === currentUser.id || app.assignedToName === currentUser.name) &&
                                 (app.backendStatus === 'Assigned' || app.backendStatus === 'InProgress') &&
                                 app.status !== 'COMPLETE' && 
                                 app.status !== 'DECLINED' && (
                                  <Tooltip content="Review" showArrow variant="light">
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      onClick={() => handleStartReview(app.id)}
                                      aria-label="Review"
                                    >
                                      <IconWrapper><FiPlay size={16} /></IconWrapper>
                                    </button>
                                  </Tooltip>
                                )}
                                {!app.assignedTo && 
                                 app.status !== 'COMPLETE' && 
                                 app.status !== 'DECLINED' &&
                                 app.backendStatus !== 'Completed' &&
                                 app.backendStatus !== 'Declined' &&
                                 app.backendStatus !== 'Cancelled' && (
                                  <Tooltip content="Assign" showArrow variant="light">
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      onClick={() => openAssignModal(app)}
                                      aria-label="Assign"
                                    >
                                      <IconWrapper><FiUser size={16} /></IconWrapper>
                                    </button>
                                  </Tooltip>
                                )}
                                {app.status === 'IN PROGRESS' && (
                                  <Tooltip content="Complete" showArrow variant="light">
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      onClick={() => openActionModal(app, 'complete')}
                                      aria-label="Complete"
                                    >
                                      <IconWrapper><FiCheck size={16} /></IconWrapper>
                                    </button>
                                  </Tooltip>
                                )}
                                {app.status === 'RISK REVIEW' && (
                                  <>
                                    <Tooltip content="Approve" showArrow variant="light">
                                      <button
                                        style={{
                                          background: "none",
                                          border: "none",
                                          padding: "8px",
                                          cursor: "pointer",
                                          color: "#E8590C",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center"
                                        }}
                                        onClick={() => openActionModal(app, 'approve')}
                                        aria-label="Approve"
                                      >
                                        <IconWrapper><FiCheck size={16} /></IconWrapper>
                                      </button>
                                    </Tooltip>
                                    <Tooltip content="Decline" showArrow variant="light">
                                      <button
                                        style={{
                                          background: "none",
                                          border: "none",
                                          padding: "8px",
                                          cursor: "pointer",
                                          color: "#E8590C",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center"
                                        }}
                                        onClick={() => openActionModal(app, 'decline')}
                                        aria-label="Decline"
                                      >
                                        <DeleteIcon />
                                      </button>
                                    </Tooltip>
                                  </>
                                )}
                                <Tooltip content="Mark for Refresh" showArrow variant="light">
                                  <button
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: "8px",
                                      cursor: "pointer",
                                      color: "#E8590C",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                    onClick={() => handleMarkForRefresh(app.id)}
                                    aria-label="Mark for Refresh"
                                  >
                                    <IconWrapper><FiRefreshCw size={16} /></IconWrapper>
                                  </button>
                                </Tooltip>
                              </div>
                            );
                          }
                        }}
                        emptyState={{
                          message: "No work queue items found",
                          content: (
                            <VStack gap="4" py="8">
                              <IconWrapper>
                                <FiFile size={48} color="#9CA3AF" />
                              </IconWrapper>
                              <Typography fontSize="lg" fontWeight="semibold" color="gray.700">
                                No work queue items found
                              </Typography>
                              <Typography fontSize="sm" color="gray.600" textAlign="center" maxW="400px">
                                Work items will appear here once they are created
                  </Typography>
                </VStack>
                          )
                        }}
                      />
                    </Box>
                  </VStack>
                </Container>
              </TabsContent>

              <TabsContent value="pending-approvals">
                <Container maxW="100%" px="8" py="8" width="full">
                  <VStack gap="6" align="stretch" width="full">
                    {/* Error Alert */}
                    {error && (
                      <AlertBar
                        status="error"
                        title="Error loading work queue"
                        description={error}
                      />
                    )}

                    {/* Stats Cards - Mukuru Cards */}
                    <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap="4">
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="mukuru.orange.100/20" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiTrendingUp color="#F05423" height="24px" width="24px" />
                              </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              Total
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="gray.800" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                          {stats.total.toLocaleString()}
                        </Typography>
                      </Card>
                      
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="blue.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiClockIcon color="#3182CE" height="24px" width="24px" />
                              </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              Submitted
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="blue.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                          {stats.submitted.toLocaleString()}
                        </Typography>
                      </Card>
                      
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="mukuru.orange.100/20" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiRefreshCw color="#F05423" height="24px" width="24px" />
                              </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              In Progress
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="orange.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                          {stats.inProgress.toLocaleString()}
                        </Typography>
                      </Card>
                      
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="red.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiAlertTriangle color="#E53E3E" height="24px" width="24px" />
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
                          {stats.riskReview.toLocaleString()}
                        </Typography>
                      </Card>
                      
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="green.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiCheckCircle color="#38A169" height="24px" width="24px" />
                              </IconWrapper>
                            </Avatar.Root>
                            <Typography color="gray.800" fontSize="16px" fontWeight="black" lineHeight="24px">
                              Complete
                            </Typography>
                          </Flex>
                          <Box justifySelf="flex-end">
                            <ChevronRightIcon color="#F05423" width="20px" height="20px" />
                          </Box>
                        </Flex>
                        <Typography color="green.600" fontFamily="Madera" fontSize="30px" fontWeight="black" letterSpacing="0%" lineHeight="40px">
                          {stats.complete.toLocaleString()}
                        </Typography>
                      </Card>
                      
                      <Card 
                        width="full" 
                        bg="white"
                        style={{ cursor: 'pointer' }}
                        className="stats-card"
                      >
                        <Flex alignItems="center" justifyContent="space-between" w="100%" h="100%" mb="4">
                          <Flex alignItems="center" gap="12px" my="auto">
                            <Avatar.Root bg="red.100" height="36px" width="36px" display="flex" alignItems="center" justifyContent="center">
                              <IconWrapper>
                                <FiXCircle color="#C53030" height="24px" width="24px" />
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
                          {stats.declined.toLocaleString()}
                        </Typography>
              </Card>
            </SimpleGrid>

                    {/* Search Bar Above Table */}
                    <Box mb="4" width="100%">
                      <Box width="100%" maxW="800px">
                        <Search
                          placeholder="Search by Name or Email..."
                          onSearchChange={handleSearchChange}
                        />
                      </Box>
                    </Box>

            {/* Work Queue DataTable */}
            <Box 
              bg="white" 
              borderRadius="xl" 
              boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              border="1px solid"
              borderColor="gray.100"
              overflow="hidden"
              color="gray.900"
                      className="work-queue-table-wrapper"
            >
              <DataTable
                        key={`work-queue-${viewType}-${statusFilter}-${searchTerm}-${refreshKey}`}
                        fetchData={fetchData}
                columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
                        tableId="work-queue"
                        sortConfig={sortConfig ?? undefined}
                        onSortChange={handleSortChange}
                        showActions={true}
                        actionColumn={{
                          header: 'Actions',
                          width: '120px',
                          render: (row, index) => {
                            const app = row as unknown as WorkItemApplication;
                            return (
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                                <Tooltip content="View" showArrow variant="light">
                                  <Link href={app.applicationId ? `/applications/${app.applicationId}` : `/applications/${app.id}`} style={{ textDecoration: 'none' }}>
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "6px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: "28px",
                                        height: "28px"
                                      }}
                                      aria-label="View"
                                    >
                                      <IconWrapper><FiEye size={14} /></IconWrapper>
                                    </button>
                                  </Link>
                                </Tooltip>
                                {app.assignedTo && 
                                 (app.assignedTo === currentUser.id || app.assignedToName === currentUser.name) &&
                                 (app.backendStatus === 'Assigned' || app.backendStatus === 'InProgress') &&
                                 app.status !== 'COMPLETE' && 
                                 app.status !== 'DECLINED' && (
                                  <Tooltip content="Review" showArrow variant="light">
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      onClick={() => handleStartReview(app.id)}
                                      aria-label="Review"
                                    >
                                      <IconWrapper><FiPlay size={16} /></IconWrapper>
                                    </button>
                                  </Tooltip>
                                )}
                                {!app.assignedTo && 
                                 app.status !== 'COMPLETE' && 
                                 app.status !== 'DECLINED' &&
                                 app.backendStatus !== 'Completed' &&
                                 app.backendStatus !== 'Declined' &&
                                 app.backendStatus !== 'Cancelled' && (
                                  <Tooltip content="Assign" showArrow variant="light">
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      onClick={() => openAssignModal(app)}
                                      aria-label="Assign"
                                    >
                                      <IconWrapper><FiUser size={16} /></IconWrapper>
                                    </button>
                                  </Tooltip>
                                )}
                                {app.status === 'IN PROGRESS' && (
                                  <Tooltip content="Complete" showArrow variant="light">
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor: "pointer",
                                        color: "#E8590C",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      onClick={() => openActionModal(app, 'complete')}
                                      aria-label="Complete"
                                    >
                                      <IconWrapper><FiCheck size={16} /></IconWrapper>
                                    </button>
                                  </Tooltip>
                                )}
                                {app.status === 'RISK REVIEW' && (
                                  <>
                                    <Tooltip content="Approve" showArrow variant="light">
                                      <button
                                        style={{
                                          background: "none",
                                          border: "none",
                                          padding: "8px",
                                          cursor: "pointer",
                                          color: "#E8590C",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center"
                                        }}
                                        onClick={() => openActionModal(app, 'approve')}
                                        aria-label="Approve"
                                      >
                                        <IconWrapper><FiCheck size={16} /></IconWrapper>
                                      </button>
                                    </Tooltip>
                                    <Tooltip content="Decline" showArrow variant="light">
                                      <button
                                        style={{
                                          background: "none",
                                          border: "none",
                                          padding: "8px",
                                          cursor: "pointer",
                                          color: "#E8590C",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center"
                                        }}
                                        onClick={() => openActionModal(app, 'decline')}
                                        aria-label="Decline"
                                      >
                                        <DeleteIcon />
                                      </button>
                                    </Tooltip>
                                  </>
                                )}
                                <Tooltip content="Mark for Refresh" showArrow variant="light">
                                  <button
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: "8px",
                                      cursor: "pointer",
                                      color: "#E8590C",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                    onClick={() => handleMarkForRefresh(app.id)}
                                    aria-label="Mark for Refresh"
                                  >
                                    <IconWrapper><FiRefreshCw size={16} /></IconWrapper>
                                  </button>
                                </Tooltip>
                              </div>
                            );
                          }
                        }}
                emptyState={{
                          message: "No work queue items found",
                  content: (
                    <VStack gap="4" py="8">
                      <IconWrapper>
                        <FiFile size={48} color="#9CA3AF" />
                      </IconWrapper>
                      <Typography fontSize="lg" fontWeight="semibold" color="gray.700">
                        No work queue items found
                      </Typography>
                      <Typography fontSize="sm" color="gray.600" textAlign="center" maxW="400px">
                                Work items will appear here once they are created
                      </Typography>
                    </VStack>
                  )
                }}
              />
            </Box>
          </VStack>
        </Container>
              </TabsContent>
            </TabsRoot>
        </Box>
      </Box>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Work Item"
        size="small"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
              <HStack gap="3" align="center" mb="1">
                <Box
                  p="2"
                  borderRadius="lg"
                  _focus={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: 0, borderStyle: 'none', borderColor: 'transparent' }}
                  _focusVisible={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: 0, borderStyle: 'none', borderColor: 'transparent' }}
                  _active={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: 0, borderStyle: 'none', borderColor: 'transparent' }}
                  _hover={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: 0, borderStyle: 'none', borderColor: 'transparent' }}
                  bgGradient="linear(to-br, orange.100, orange.200)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
              <IconWrapper><FiUserCheck size={16} color="#DD6B20" /></IconWrapper>
                </Box>
                <VStack align="start" gap="0">
              <Typography fontSize="lg" fontWeight="700" color="gray.900">
                    Assign Work Item
              </Typography>
              <Typography fontSize="sm" color="gray.600" mt="0.5">
                    Assign this work item to a user
              </Typography>
                </VStack>
              </HStack>
        </ModalHeader>
        <ModalBody>
              <VStack gap="5" align="stretch">
                <Typography fontSize="sm" color="gray.700">
                  Assign work item: <strong>{selectedApp?.workItemNumber || selectedApp?.id}</strong>
                </Typography>
                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="600" color="gray.700" mb="2">
                    Assign to
                  </Field.Label>
              <Checkbox
                    checked={assignToSelf}
                onCheckedChange={(details) => {
                  setAssignToSelf(details.checked === true);
                  if (details.checked === true) {
                        setAssignToUserId(currentUser.id);
                        setAssignToUserName(currentUser.name);
                      }
                    }}
                  >
                      Assign to me ({currentUser.name})
              </Checkbox>
                </Field.Root>
                {!assignToSelf && (
                    <Input
                label="User ID"
                      value={assignToUserId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignToUserId(e.target.value)}
                      placeholder="Enter user ID"
              />
                )}
                {!assignToSelf && (
                    <Input
                label="User Name"
                      value={assignToUserName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignToUserName(e.target.value)}
                      placeholder="Enter user name"
              />
                )}
              </VStack>
        </ModalBody>
        <ModalFooter>
              <HStack gap="3" justify="flex-end" w="full">
                <Button
                  type="button"
                      variant="secondary"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                      variant="primary"
                      className="mukuru-primary-button"
              size="sm"
              onClick={handleAssign}
                >
                  Assign
                </Button>
              </HStack>
        </ModalFooter>
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={
          actionType === 'start-review' ? 'Start Review' :
          actionType === 'approve' ? 'Approve Work Item' :
          actionType === 'decline' ? 'Decline Work Item' :
          actionType === 'complete' ? 'Complete Work Item' : ''
        }
        size="small"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="700" color="gray.900">
                {actionType === 'start-review' && 'Start Review'}
                {actionType === 'approve' && 'Approve Work Item'}
                {actionType === 'decline' && 'Decline Work Item'}
                {actionType === 'complete' && 'Complete Work Item'}
          </Typography>
        </ModalHeader>
        <ModalBody>
              <VStack gap="5" align="stretch">
                <Typography fontSize="sm" color="gray.700">
                  Work Item: <strong>{selectedApp?.workItemNumber || selectedApp?.id}</strong>
                </Typography>
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
                      Notes <Typography as="span" fontSize="sm" color="gray.400" fontWeight="400">(Optional)</Typography>
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
        </ModalBody>
        <ModalFooter>
              <HStack gap="3" justify="flex-end" w="full">
                <Button
                  variant="secondary"
              size="sm"
                  onClick={() => setActionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
              variant="primary"
              size="sm"
                  onClick={handleAction}
                  disabled={actionType === 'decline' && !declineReason.trim()}
                >
                  {actionType === 'start-review' && 'Start Review'}
                  {actionType === 'approve' && 'Approve'}
                  {actionType === 'decline' && 'Decline'}
                  {actionType === 'complete' && 'Complete'}
                </Button>
              </HStack>
        </ModalFooter>
      </Modal>

      {/* Comments Modal */}
      <Modal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        size="large"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
              <HStack gap="3" align="center" mb="1">
                <Box
                  p="2"
                  borderRadius="lg"
                  _focus={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: 0, borderStyle: 'none', borderColor: 'transparent' }}
                  _focusVisible={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: 0, borderStyle: 'none', borderColor: 'transparent' }}
                  _active={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: 0, borderStyle: 'none', borderColor: 'transparent' }}
                  _hover={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: 0, borderStyle: 'none', borderColor: 'transparent' }}
                  bgGradient="linear(to-br, blue.100, blue.200)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
              <IconWrapper><FiMessageSquare size={16} color="#3182CE" /></IconWrapper>
                </Box>
                <VStack align="start" gap="0">
              <Typography fontSize="lg" fontWeight="700" color="gray.900">
                    Comments - {selectedApp?.workItemNumber || selectedApp?.id}
              </Typography>
              <Typography fontSize="sm" color="gray.600" mt="0.5">
                    View and add comments for this work item
              </Typography>
                </VStack>
              </HStack>
        </ModalHeader>
        <ModalBody>
              <VStack gap="5" align="stretch">
                <Box maxH="400px" overflowY="auto">
                  {comments.length === 0 ? (
                        <Typography color="gray.600" fontSize="sm">No comments yet</Typography>
                  ) : (
                    <VStack gap="3" align="stretch">
                      {comments.map((comment: any, idx: number) => (
                        <Box key={idx} p="3" bg="gray.50" borderRadius="md">
                          <HStack justify="space-between" mb="2">
                                <Typography fontWeight="semibold" fontSize="sm" color="gray.900">{comment.createdBy || 'Unknown'}</Typography>
                                <Typography fontSize="xs" color="gray.600">
                              {new Date(comment.createdAt).toLocaleString()}
                                </Typography>
                          </HStack>
                              <Typography fontSize="sm" color="gray.700">{comment.text}</Typography>
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
                      variant="primary"
                      className="mukuru-primary-button"
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </Button>
              </VStack>
        </ModalBody>
        <ModalFooter>
              <Button
                    variant="secondary"
            size="sm"
                onClick={() => setCommentsModalOpen(false)}
              >
                Close
              </Button>
        </ModalFooter>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`History - ${selectedApp?.workItemNumber || selectedApp?.id}`}
        size="large"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="700" color="gray.900">
                History - {selectedApp?.workItemNumber || selectedApp?.id}
          </Typography>
        </ModalHeader>
        <ModalBody>
              <Box maxH="500px" overflowY="auto">
                {history.length === 0 ? (
                        <Typography color="gray.600" fontSize="sm">No history available</Typography>
                ) : (
                  <VStack gap="2" align="stretch">
                    {history.map((entry: any, idx: number) => (
                      <Box key={idx} p="3" borderLeft="3px" borderColor="orange.500" bg="gray.50" borderRadius="md">
                        <HStack justify="space-between" mb="1">
                              <Typography fontWeight="semibold" fontSize="sm" color="gray.900">{entry.action || entry.description}</Typography>
                              <Typography fontSize="xs" color="gray.600">
                            {new Date(entry.timestamp || entry.createdAt).toLocaleString()}
                              </Typography>
                        </HStack>
                        {entry.performedBy && (
                              <Typography fontSize="xs" color="gray.600">By: {entry.performedBy}</Typography>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
        </ModalBody>
        <ModalFooter>
              <Button
                    variant="secondary"
            size="sm"
                onClick={() => setHistoryModalOpen(false)}
              >
                Close
              </Button>
        </ModalFooter>
      </Modal>

      {/* Toaster is rendered automatically by Chakra UI */}
    </Flex>
  );
}
