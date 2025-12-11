'use client';

import {
  Box,
  VStack,
  HStack,
  Flex,
  Spinner,
  Grid,
} from '@chakra-ui/react';
import {
  Search,
  Typography,
  Button,
  Tag,
  IconWrapper,
  Dropdown,
  Checkbox,
  Tooltip,
  RetryIcon,
  FilterIcon,
  TickCircleIcon,
  ErrorIcon,
  EditIcon,
  DeleteIcon,
  DocumentIcon,
} from '@mukuru/mukuru-react-components';
import { useState, useEffect, useCallback, useRef } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { useSidebar } from '../../contexts/SidebarContext';
import { FiShield, FiActivity, FiClock, FiUser, FiHash, FiFileText, FiLayers, FiCalendar } from 'react-icons/fi';
import { auditLogApiService, AuditLogEntryDto } from '../../services/auditLogApi';

export default function AuditLogPage() {
  const { condensed } = useSidebar();

  const [auditEvents, setAuditEvents] = useState<AuditLogEntryDto[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AuditLogEntryDto | null>(null);
  const [auditSummary, setAuditSummary] = useState({
    totalEvents: 0,
    created: 0,
    updated: 0,
    approved: 0,
    deleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const isFetchingRef = useRef(false);
  const hasInitialLoadRef = useRef(false);
  const lastSearchQueryRef = useRef<string | undefined>(undefined);

  // Calculate summary statistics from audit events
  const calculateSummary = useCallback((events: AuditLogEntryDto[]) => {
    const totalEvents = events.length;
    const created = events.filter(
      (e) => e.action.toUpperCase().includes('CREATE')
    ).length;
    const updated = events.filter(
      (e) => e.action.toUpperCase().includes('UPDATE')
    ).length;
    const approved = events.filter(
      (e) => e.action.toUpperCase().includes('APPROVE')
    ).length;
    const deleted = events.filter(
      (e) => e.action.toUpperCase().includes('DELETE')
    ).length;

    return { totalEvents, created, updated, approved, deleted };
  }, []);

  // Fetch audit logs from API
  const fetchAuditLogs = useCallback(
    async (searchQuery?: string) => {
      if (isFetchingRef.current) return;

      const normalizedQuery = searchQuery?.trim() || undefined;
      if (lastSearchQueryRef.current === normalizedQuery && hasInitialLoadRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        let result;

        if (searchQuery && searchQuery.trim()) {
          const searchLower = searchQuery.toLowerCase();
          result = await auditLogApiService.searchAuditLogs({
            skip: 0,
            take: 1000,
          });

          const filtered = result.entries.filter(
            (entry) =>
              entry.action.toLowerCase().includes(searchLower) ||
              entry.entityType.toLowerCase().includes(searchLower) ||
              entry.entityId.toLowerCase().includes(searchLower) ||
              entry.userId.toLowerCase().includes(searchLower) ||
              entry.description.toLowerCase().includes(searchLower)
          );
          result.entries = filtered;
          result.totalCount = filtered.length;
        } else {
          result = await auditLogApiService.getAllAuditLogs(0, 1000);
        }

        const sortedEvents = result.entries.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setAuditEvents(sortedEvents);
        setAuditSummary(calculateSummary(sortedEvents));
        lastSearchQueryRef.current = normalizedQuery;
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to load audit logs. Please ensure the audit log service is running.';

        if (err instanceof Error && err.message.includes('Unable to connect')) {
          setError('Unable to connect to Audit Log service. The service may not be running.');
        } else {
          setError(errorMessage);
        }

        setAuditEvents([]);
        setAuditSummary({ totalEvents: 0, created: 0, updated: 0, approved: 0, deleted: 0 });
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [calculateSummary]
  );

  useEffect(() => {
    if (!hasInitialLoadRef.current && !isFetchingRef.current) {
      hasInitialLoadRef.current = true;
      fetchAuditLogs();
    }
  }, []);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchTerm(query);
      const normalizedQuery = query?.trim() || undefined;
      if (!isFetchingRef.current && lastSearchQueryRef.current !== normalizedQuery) {
        fetchAuditLogs(normalizedQuery);
      }
    },
    [fetchAuditLogs]
  );

  const handleRefresh = () => {
    lastSearchQueryRef.current = undefined;
    hasInitialLoadRef.current = false;
    fetchAuditLogs(searchTerm);
  };

  // Get action icon based on action type
  const getActionIcon = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes('CREATE')) return <TickCircleIcon width="16" height="16" />;
    if (actionUpper.includes('UPDATE')) return <EditIcon width="16" height="16" />;
    if (actionUpper.includes('DELETE')) return <DeleteIcon width="16" height="16" />;
    if (actionUpper.includes('APPROVE')) return <TickCircleIcon width="16" height="16" />;
    return <DocumentIcon width="16" height="16" />;
  };

  // Get action tag variant
  const getActionTagVariant = (action: string): 'solid' | 'danger' | 'success' | 'warning' => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes('DELETE') || actionUpper.includes('ERROR')) return 'danger';
    if (actionUpper.includes('CREATE') || actionUpper.includes('APPROVE')) return 'success';
    if (actionUpper.includes('UPDATE')) return 'warning';
    return 'solid';
  };

  // Get action color for icon background
  const getActionColor = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes('DELETE') || actionUpper.includes('ERROR')) return { bg: '#FEE2E2', color: '#DC2626' };
    if (actionUpper.includes('CREATE') || actionUpper.includes('APPROVE')) return { bg: '#D1FAE5', color: '#059669' };
    if (actionUpper.includes('UPDATE')) return { bg: '#FEF3C7', color: '#D97706' };
    return { bg: '#E5E7EB', color: '#6B7280' };
  };

  // Format relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter events based on filter type
  const filteredEvents = auditEvents.filter((event) => {
    const actionUpper = event.action.toUpperCase();
    
    if (filterType === 'CREATE' && !actionUpper.includes('CREATE')) return false;
    if (filterType === 'UPDATE' && !actionUpper.includes('UPDATE')) return false;
    if (filterType === 'DELETE' && !actionUpper.includes('DELETE')) return false;
    if (filterType === 'APPROVE' && !actionUpper.includes('APPROVE')) return false;
    
    if (showOnlyErrors && !actionUpper.includes('ERROR') && !actionUpper.includes('FAIL')) {
      return false;
    }
    
    return true;
  });

  return (
    <Box minH="100vh" bg="#F8FAFC">
      <AdminSidebar />

      {/* Main Content */}
      <Box
        ml={condensed ? '72px' : '280px'}
        minH="100vh"
        bg="#F8FAFC"
        transition="margin-left 0.3s ease"
      >
        {/* Page Header */}
        <Box 
          px="32px" 
          py="24px" 
          bg="white" 
          borderBottom="1px solid" 
          borderColor="#E2E8F0"
          position="sticky"
          top="0"
          zIndex={10}
        >
          <Flex justify="space-between" align="center">
            <HStack gap="16px" align="center">
              <Box 
                p="12px" 
                bg="linear-gradient(135deg, #F05423 0%, #FF7A50 100%)"
                borderRadius="12px"
                boxShadow="0 4px 12px rgba(240, 84, 35, 0.25)"
              >
                <FiShield size={24} color="white" />
              </Box>
              <VStack align="start" gap="2px">
                <Typography fontSize="24px" fontWeight="700" color="#1E293B" lineHeight="1.2">
                  Audit Log
                </Typography>
                <Typography fontSize="14px" color="#64748B" fontWeight="400">
                  Monitor and track all system activities in real-time
                </Typography>
              </VStack>
            </HStack>

            <HStack gap="12px">
              {/* Stats Pills */}
              <HStack gap="8px">
                <Box 
                  px="16px" 
                  py="8px" 
                  bg="#F1F5F9" 
                  borderRadius="20px"
                  border="1px solid #E2E8F0"
                >
                  <HStack gap="6px">
                    <Box w="8px" h="8px" borderRadius="full" bg="#10B981" />
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">
                      {auditSummary.created}
                    </Typography>
                    <Typography fontSize="13px" color="#64748B">Created</Typography>
                  </HStack>
                </Box>
                <Box 
                  px="16px" 
                  py="8px" 
                  bg="#F1F5F9" 
                  borderRadius="20px"
                  border="1px solid #E2E8F0"
                >
                  <HStack gap="6px">
                    <Box w="8px" h="8px" borderRadius="full" bg="#F59E0B" />
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">
                      {auditSummary.updated}
                    </Typography>
                    <Typography fontSize="13px" color="#64748B">Updated</Typography>
                  </HStack>
                </Box>
                <Box 
                  px="16px" 
                  py="8px" 
                  bg="#F1F5F9" 
                  borderRadius="20px"
                  border="1px solid #E2E8F0"
                >
                  <HStack gap="6px">
                    <Box w="8px" h="8px" borderRadius="full" bg="#EF4444" />
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">
                      {auditSummary.deleted}
                    </Typography>
                    <Typography fontSize="13px" color="#64748B">Deleted</Typography>
                  </HStack>
                </Box>
              </HStack>

              <Box w="1px" h="32px" bg="#E2E8F0" />
              
              <Tooltip content="Refresh audit logs">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefresh}
                >
                  <IconWrapper>
                    <RetryIcon width="16" height="16" />
                  </IconWrapper>
                  Refresh
                </Button>
              </Tooltip>
            </HStack>
          </Flex>
        </Box>

        {/* Content Area */}
        <Box px="32px" py="24px" h="calc(100vh - 97px)" overflow="hidden">
          <Flex gap="24px" h="100%">
            {/* Left Panel - Events List */}
            <Box
              w="420px"
              minW="380px"
              maxW="480px"
              flexShrink={0}
              display="flex"
              flexDirection="column"
              bg="white"
              borderRadius="16px"
              border="1px solid #E2E8F0"
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
              overflow="hidden"
            >
              {/* Search & Filters */}
              <Box p="20px" borderBottom="1px solid #E2E8F0" bg="white">
                <VStack gap="16px" align="stretch">
                  <Search
                    placeholder="Search events, users, entities..."
                    onSearchChange={handleSearchChange}
                  />
                  
                  <Flex gap="12px" align="center">
                    <Box flex="1">
                      <Dropdown
                        items={[
                          { label: 'All Events', value: 'ALL' },
                          { label: 'Created', value: 'CREATE' },
                          { label: 'Updated', value: 'UPDATE' },
                          { label: 'Deleted', value: 'DELETE' },
                          { label: 'Approved', value: 'APPROVE' },
                        ]}
                        placeholder="Filter by action"
                        defaultValue={filterType}
                        onSelectionChange={(val) => setFilterType(val as string)}
                      />
                    </Box>
                    <Checkbox
                      checked={showOnlyErrors}
                      onCheckedChange={(details) => setShowOnlyErrors(details.checked === true)}
                    >
                      <HStack gap="6px">
                        <ErrorIcon width="14" height="14" color="#EF4444" />
                        <Typography fontSize="13px" color="#475569" fontWeight="500">
                          Errors
                        </Typography>
                      </HStack>
                    </Checkbox>
                  </Flex>
                </VStack>
              </Box>

              {/* Events Count */}
              <Box px="20px" py="12px" bg="#F8FAFC" borderBottom="1px solid #E2E8F0">
                <Typography fontSize="12px" fontWeight="600" color="#64748B" textTransform="uppercase" letterSpacing="0.5px">
                  {loading ? 'Loading...' : `${filteredEvents.length} Events`}
                </Typography>
              </Box>

              {/* Events List */}
              <Box flex="1" overflowY="auto" p="12px">
                {loading ? (
                  <Flex justify="center" align="center" h="300px">
                    <VStack gap="16px">
                      <Spinner size="lg" color="orange.500" />
                      <Typography color="#64748B" fontSize="14px">Loading audit logs...</Typography>
                    </VStack>
                  </Flex>
                ) : error ? (
                  <Flex justify="center" align="center" h="300px">
                    <VStack gap="16px" textAlign="center" px="20px">
                      <Box p="16px" borderRadius="full" bg="#FEE2E2">
                        <ErrorIcon width="32" height="32" color="#DC2626" />
                      </Box>
                      <Typography color="#1E293B" fontSize="15px" fontWeight="600">
                        Unable to load events
                      </Typography>
                      <Typography color="#64748B" fontSize="13px" maxW="280px">
                        {error}
                      </Typography>
                      <Button variant="secondary" size="sm" onClick={handleRefresh}>
                        <IconWrapper><RetryIcon width="14" height="14" /></IconWrapper>
                        Try Again
                      </Button>
                    </VStack>
                  </Flex>
                ) : filteredEvents.length === 0 ? (
                  <Flex justify="center" align="center" h="300px">
                    <VStack gap="16px" textAlign="center">
                      <Box p="16px" borderRadius="full" bg="#F1F5F9">
                        <FiShield size={32} color="#94A3B8" />
                      </Box>
                      <Typography color="#1E293B" fontSize="15px" fontWeight="600">
                        No events found
                      </Typography>
                      <Typography color="#64748B" fontSize="13px">
                        {searchTerm || filterType !== 'ALL' 
                          ? 'Try adjusting your filters' 
                          : 'Events will appear here'}
                      </Typography>
                    </VStack>
                  </Flex>
                ) : (
                  <VStack gap="8px" align="stretch">
                    {filteredEvents.map((event) => {
                      const actionColors = getActionColor(event.action);
                      const isSelected = event.id === selectedEvent?.id;
                      
                      return (
                        <Box
                          key={event.id}
                          p="16px"
                          borderRadius="12px"
                          cursor="pointer"
                          bg={isSelected ? '#FFF7ED' : 'white'}
                          border="1px solid"
                          borderColor={isSelected ? '#F05423' : '#E2E8F0'}
                          boxShadow={isSelected ? '0 0 0 3px rgba(240, 84, 35, 0.1)' : 'none'}
                          _hover={{
                            bg: isSelected ? '#FFF7ED' : '#F8FAFC',
                            borderColor: isSelected ? '#F05423' : '#CBD5E1',
                            transform: 'translateY(-1px)',
                            boxShadow: isSelected 
                              ? '0 0 0 3px rgba(240, 84, 35, 0.1)' 
                              : '0 4px 12px rgba(0, 0, 0, 0.05)',
                          }}
                          onClick={() => setSelectedEvent(event)}
                          transition="all 0.2s ease"
                        >
                          <Flex gap="12px" align="start">
                            <Box
                              p="10px"
                              borderRadius="10px"
                              bg={actionColors.bg}
                              flexShrink={0}
                            >
                              <Box color={actionColors.color}>
                                {getActionIcon(event.action)}
                              </Box>
                            </Box>
                            
                            <Box flex="1" minW="0">
                              <Flex justify="space-between" align="start" mb="6px">
                                <Typography 
                                  fontSize="14px" 
                                  fontWeight="600" 
                                  color="#1E293B"
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  whiteSpace="nowrap"
                                >
                                  {event.entityType}
                                </Typography>
                                <Typography fontSize="12px" color="#94A3B8" flexShrink={0} ml="8px">
                                  {getRelativeTime(event.timestamp)}
                                </Typography>
                              </Flex>
                              
                              {event.description && (
                                <Typography 
                                  fontSize="13px" 
                                  color="#64748B" 
                                  mb="10px"
                                  lineHeight="1.5"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {event.description}
                                </Typography>
                              )}
                              
                              <Flex gap="8px" align="center" flexWrap="wrap">
                                <Tag variant={getActionTagVariant(event.action)}>
                                  {event.action}
                                </Tag>
                                <Typography fontSize="12px" color="#94A3B8">•</Typography>
                                <Typography fontSize="12px" color="#64748B" fontFamily="mono">
                                  {event.entityId?.substring(0, 8)}...
                                </Typography>
                              </Flex>
                            </Box>
                          </Flex>
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </Box>
            </Box>

            {/* Right Panel - Event Details */}
            <Box
              flex="1"
              display="flex"
              flexDirection="column"
              bg="white"
              borderRadius="16px"
              border="1px solid #E2E8F0"
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
              overflow="hidden"
            >
              {selectedEvent ? (
                <>
                  {/* Detail Header */}
                  <Box 
                    p="24px" 
                    borderBottom="1px solid #E2E8F0"
                    bg="linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)"
                  >
                    <Flex justify="space-between" align="start" mb="16px">
                      <VStack align="start" gap="8px">
                        <Tag variant={getActionTagVariant(selectedEvent.action)}>
                          {selectedEvent.action}
                        </Tag>
                        <Typography fontSize="22px" fontWeight="700" color="#1E293B">
                          {selectedEvent.entityType}
                        </Typography>
                      </VStack>
                    </Flex>
                    
                    <Flex gap="24px">
                      <HStack gap="8px">
                        <Box p="6px" borderRadius="6px" bg="#F1F5F9">
                          <FiUser size={14} color="#64748B" />
                        </Box>
                        <Typography fontSize="13px" color="#64748B">
                          {selectedEvent.userId || 'System'}
                        </Typography>
                      </HStack>
                      <HStack gap="8px">
                        <Box p="6px" borderRadius="6px" bg="#F1F5F9">
                          <FiClock size={14} color="#64748B" />
                        </Box>
                        <Typography fontSize="13px" color="#64748B">
                          {new Date(selectedEvent.timestamp).toLocaleString()}
                        </Typography>
                      </HStack>
                    </Flex>
                  </Box>

                  {/* Detail Content */}
                  <Box flex="1" overflowY="auto" p="24px">
                    <VStack gap="24px" align="stretch">
                      {/* Description */}
                      {selectedEvent.description && (
                        <Box>
                          <HStack gap="8px" mb="12px">
                            <FiFileText size={16} color="#64748B" />
                            <Typography fontSize="12px" fontWeight="600" color="#64748B" textTransform="uppercase" letterSpacing="0.5px">
                              Description
                            </Typography>
                          </HStack>
                          <Box p="16px" bg="#F8FAFC" borderRadius="12px" border="1px solid #E2E8F0">
                            <Typography fontSize="14px" color="#1E293B" lineHeight="1.7">
                              {selectedEvent.description}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Entity Details */}
                      <Box>
                        <HStack gap="8px" mb="12px">
                          <FiLayers size={16} color="#64748B" />
                          <Typography fontSize="12px" fontWeight="600" color="#64748B" textTransform="uppercase" letterSpacing="0.5px">
                            Entity Details
                          </Typography>
                        </HStack>
                        <Grid templateColumns="1fr 1fr" gap="12px">
                          <Box p="16px" bg="#F8FAFC" borderRadius="12px" border="1px solid #E2E8F0">
                            <Typography fontSize="11px" color="#94A3B8" fontWeight="500" mb="4px" textTransform="uppercase">
                              Entity Type
                            </Typography>
                            <Typography fontSize="14px" color="#1E293B" fontWeight="600">
                              {selectedEvent.entityType}
                            </Typography>
                          </Box>
                          <Box p="16px" bg="#F8FAFC" borderRadius="12px" border="1px solid #E2E8F0">
                            <Typography fontSize="11px" color="#94A3B8" fontWeight="500" mb="4px" textTransform="uppercase">
                              Entity ID
                            </Typography>
                            <Typography fontSize="14px" color="#1E293B" fontWeight="600" fontFamily="mono">
                              {selectedEvent.entityId}
                            </Typography>
                          </Box>
                        </Grid>
                      </Box>

                      {/* Actor Details */}
                      <Box>
                        <HStack gap="8px" mb="12px">
                          <FiUser size={16} color="#64748B" />
                          <Typography fontSize="12px" fontWeight="600" color="#64748B" textTransform="uppercase" letterSpacing="0.5px">
                            Actor Details
                          </Typography>
                        </HStack>
                        <Grid templateColumns="1fr 1fr" gap="12px">
                          <Box p="16px" bg="#F8FAFC" borderRadius="12px" border="1px solid #E2E8F0">
                            <Typography fontSize="11px" color="#94A3B8" fontWeight="500" mb="4px" textTransform="uppercase">
                              User ID
                            </Typography>
                            <Typography fontSize="14px" color="#1E293B" fontWeight="600">
                              {selectedEvent.userId || 'System'}
                            </Typography>
                          </Box>
                          {selectedEvent.userRole && (
                            <Box p="16px" bg="#F8FAFC" borderRadius="12px" border="1px solid #E2E8F0">
                              <Typography fontSize="11px" color="#94A3B8" fontWeight="500" mb="4px" textTransform="uppercase">
                                Role
                              </Typography>
                              <Typography fontSize="14px" color="#1E293B" fontWeight="600">
                                {selectedEvent.userRole}
                              </Typography>
                            </Box>
                          )}
                        </Grid>
                      </Box>

                      {/* Timestamp */}
                      <Box>
                        <HStack gap="8px" mb="12px">
                          <FiCalendar size={16} color="#64748B" />
                          <Typography fontSize="12px" fontWeight="600" color="#64748B" textTransform="uppercase" letterSpacing="0.5px">
                            Timestamp
                          </Typography>
                        </HStack>
                        <Grid templateColumns="1fr 1fr" gap="12px">
                          <Box p="16px" bg="#F8FAFC" borderRadius="12px" border="1px solid #E2E8F0">
                            <Typography fontSize="11px" color="#94A3B8" fontWeight="500" mb="4px" textTransform="uppercase">
                              Date
                            </Typography>
                            <Typography fontSize="14px" color="#1E293B" fontWeight="600">
                              {new Date(selectedEvent.timestamp).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </Typography>
                          </Box>
                          <Box p="16px" bg="#F8FAFC" borderRadius="12px" border="1px solid #E2E8F0">
                            <Typography fontSize="11px" color="#94A3B8" fontWeight="500" mb="4px" textTransform="uppercase">
                              Time
                            </Typography>
                            <Typography fontSize="14px" color="#1E293B" fontWeight="600">
                              {new Date(selectedEvent.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        </Grid>
                      </Box>

                      {/* Event ID */}
                      <Box>
                        <HStack gap="8px" mb="12px">
                          <FiHash size={16} color="#64748B" />
                          <Typography fontSize="12px" fontWeight="600" color="#64748B" textTransform="uppercase" letterSpacing="0.5px">
                            Event ID
                          </Typography>
                        </HStack>
                        <Box p="16px" bg="#F1F5F9" borderRadius="12px" border="1px solid #E2E8F0">
                          <Typography fontSize="13px" color="#475569" fontFamily="mono" wordBreak="break-all">
                            {selectedEvent.id}
                          </Typography>
                        </Box>
                      </Box>
                    </VStack>
                  </Box>
                </>
              ) : (
                <Flex justify="center" align="center" h="100%">
                  <VStack gap="20px" textAlign="center">
                    <Box 
                      p="24px" 
                      borderRadius="full" 
                      bg="linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)"
                    >
                      <FiActivity size={40} color="#94A3B8" />
                    </Box>
                    <VStack gap="8px">
                      <Typography color="#1E293B" fontSize="18px" fontWeight="600">
                        Select an event to view details
                      </Typography>
                      <Typography color="#64748B" fontSize="14px" maxW="300px">
                        Choose an audit event from the list to view its complete details and metadata
                      </Typography>
                    </VStack>
                  </VStack>
                </Flex>
              )}
            </Box>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
