"use client";

import { 
  Box, 
  VStack, 
  HStack,
  Text,
  SimpleGrid,
  Flex,
  Input,
  Spinner,
  Icon
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { FiSearch, FiTrendingUp, FiShield, FiAlertCircle } from "react-icons/fi";
import { auditLogApiService, AuditLogEntryDto } from "../../services/auditLogApi";

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [auditEvents, setAuditEvents] = useState<AuditLogEntryDto[]>([]);
  const [auditSummary, setAuditSummary] = useState({
    totalEvents: 0,
    created: 0,
    updated: 0,
    approved: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Calculate summary statistics from audit events
  const calculateSummary = useCallback((events: AuditLogEntryDto[]) => {
    const totalEvents = events.length;
    const created = events.filter(e => 
      e.action.toUpperCase().includes('CREATE') || 
      e.action.toUpperCase() === 'CREATE'
    ).length;
    const updated = events.filter(e => 
      e.action.toUpperCase().includes('UPDATE') || 
      e.action.toUpperCase() === 'UPDATE'
    ).length;
    const approved = events.filter(e => 
      e.action.toUpperCase().includes('APPROVE') || 
      e.action.toUpperCase() === 'APPROVE'
    ).length;

    return { totalEvents, created, updated, approved };
  }, []);

  // Fetch audit logs from API
  const fetchAuditLogs = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (searchQuery && searchQuery.trim()) {
        // Use search endpoint with search term
        const searchLower = searchQuery.toLowerCase();
        result = await auditLogApiService.searchAuditLogs({
          skip: 0,
          take: 1000, // Get a large batch for filtering
        });
        
        // Client-side filtering for better UX (backend search can be enhanced later)
        const filtered = result.entries.filter(entry => 
          entry.action.toLowerCase().includes(searchLower) ||
          entry.entityType.toLowerCase().includes(searchLower) ||
          entry.entityId.toLowerCase().includes(searchLower) ||
          entry.userId.toLowerCase().includes(searchLower) ||
          entry.description.toLowerCase().includes(searchLower)
        );
        result.entries = filtered;
        result.totalCount = filtered.length;
      } else {
        // Get all audit logs
        result = await auditLogApiService.getAllAuditLogs(0, 1000);
      }

      // Sort by timestamp descending (newest first)
      const sortedEvents = result.entries.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setAuditEvents(sortedEvents);
      setAuditSummary(calculateSummary(sortedEvents));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit logs. Please ensure the audit log service is running.');
      setAuditEvents([]);
      setAuditSummary({ totalEvents: 0, created: 0, updated: 0, approved: 0 });
    } finally {
      setLoading(false);
    }
  }, [calculateSummary]);

  // Initial load
  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    const timer = setTimeout(() => {
      fetchAuditLogs(searchTerm);
    }, 500); // 500ms debounce

    setSearchDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Helper function to get action color based on action type
  const getActionColor = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes('CREATE')) return { bg: 'green.100', color: 'green.700' };
    if (actionUpper.includes('UPDATE')) return { bg: 'blue.100', color: 'blue.700' };
    if (actionUpper.includes('APPROVE')) return { bg: 'purple.100', color: 'purple.700' };
    if (actionUpper.includes('DELETE')) return { bg: 'red.100', color: 'red.700' };
    return { bg: 'gray.100', color: 'gray.700' };
  };

  // Format user display name (use userId if userName not available)
  const getUserDisplayName = (entry: AuditLogEntryDto) => {
    return entry.userId || 'System';
  };


  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <Box flex="1" ml="240px">
        {/* Top Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py="4" px="6" boxShadow="sm">
          <Text fontSize="xl" fontWeight="bold" color="gray.900">Audit Log</Text>
        </Box>

        {/* Main Content Area */}
        <Box p="6" bg="gray.50">
          <VStack gap="6" align="stretch">
            {/* Audit Trail Section */}
            <Box>
              <Flex justify="space-between" align="start" mb="4">
                <VStack align="start" gap="2">
                  <HStack gap="2">
                    <FiShield size={20} color="#374151" />
                    <Text fontSize="xl" fontWeight="bold" color="gray.900">Audit Trail</Text>
                  </HStack>
                  <Text fontSize="md" color="gray.600" fontWeight="medium">Complete history of all system activities and changes</Text>
                </VStack>
                
                {/* Search Bar */}
                <Box position="relative" width="300px">
                  <FiSearch 
                    size={16}
                    color="#9CA3AF"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 1
                    }}
                  />
                  <Input
                    placeholder="Search audit events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg="white"
                    border="1px"
                    borderColor="gray.300"
                    pl="10"
                    _focus={{
                      borderColor: "orange.500",
                      boxShadow: "0 0 0 1px orange.500"
                    }}
                  />
                </Box>
              </Flex>
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="6">
                <Box 
                  bg="white" 
                  p="6" 
                  borderRadius="xl" 
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  border="1px" 
                  borderColor="gray.100"
                  _hover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="4">
                    <HStack gap="3">
                      <Box p="2" bg="blue.50" borderRadius="lg">
                        <FiTrendingUp size={20} color="#3182ce" />
                      </Box>
                      <VStack align="start" gap="1">
                        <Text fontSize="3xl" fontWeight="bold" color="gray.900">{auditSummary.totalEvents}</Text>
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Total Events</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </Box>

                <Box 
                  bg="white" 
                  p="6" 
                  borderRadius="xl" 
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  border="1px" 
                  borderColor="gray.100"
                  _hover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="4">
                    <HStack gap="3">
                      <Box p="2" bg="green.50" borderRadius="lg">
                        <FiTrendingUp size={20} color="#38a169" />
                      </Box>
                      <VStack align="start" gap="1">
                        <Text fontSize="3xl" fontWeight="bold" color="green.500">{auditSummary.created}</Text>
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Created</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </Box>

                <Box 
                  bg="white" 
                  p="6" 
                  borderRadius="xl" 
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  border="1px" 
                  borderColor="gray.100"
                  _hover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="4">
                    <HStack gap="3">
                      <Box p="2" bg="orange.50" borderRadius="lg">
                        <FiTrendingUp size={20} color="#dd6b20" />
                      </Box>
                      <VStack align="start" gap="1">
                        <Text fontSize="3xl" fontWeight="bold" color="orange.500">{auditSummary.updated}</Text>
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Updated</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </Box>

                <Box 
                  bg="white" 
                  p="6" 
                  borderRadius="xl" 
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                  border="1px" 
                  borderColor="gray.100"
                  _hover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap="4">
                    <HStack gap="3">
                      <Box p="2" bg="purple.50" borderRadius="lg">
                        <FiTrendingUp size={20} color="#805ad5" />
                      </Box>
                      <VStack align="start" gap="1">
                        <Text fontSize="3xl" fontWeight="bold" color="purple.500">{auditSummary.approved}</Text>
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Approved</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </Box>
              </SimpleGrid>
            </Box>

            {/* Activity Log Section */}
            <Box>
              <VStack align="start" gap="2" mb="6">
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">Activity Log</Text>
                <Text fontSize="lg" color="gray.600">Append-only record of all actions performed in the system</Text>
              </VStack>
              
              <Box bg="white" borderRadius="lg" boxShadow="sm" border="1px" borderColor="gray.200" overflow="hidden">
                {/* Table Header */}
                <Box bg="gray.50" p="4" borderBottom="1px" borderColor="gray.200">
                  <HStack gap="4" fontSize="sm" fontWeight="medium" color="gray.600">
                    <Box width="200px">Timestamp</Box>
                    <Box width="200px">Actor</Box>
                    <Box width="150px">Action</Box>
                    <Box width="100px">Entity</Box>
                    <Box width="100px">Entity ID</Box>
                  </HStack>
                </Box>
                
                {/* Table Body */}
                {loading ? (
                  <Box p="8" display="flex" justifyContent="center">
                    <VStack gap="2">
                      <Spinner size="md" color="orange.500" />
                      <Text color="gray.600" fontSize="sm">Loading audit logs...</Text>
                    </VStack>
                  </Box>
                ) : error ? (
                  <Box p="8">
                    <Box 
                      bg="red.50" 
                      border="1px" 
                      borderColor="red.200" 
                      borderRadius="md" 
                      p="4"
                    >
                      <HStack gap="2">
                        <Icon as={FiAlertCircle} boxSize="5" color="red.600" />
                        <VStack align="start" gap="1" flex="1">
                          <Text fontWeight="semibold" color="red.700">Error loading audit logs</Text>
                          <Text fontSize="sm" color="red.600">{error}</Text>
                        </VStack>
                      </HStack>
                    </Box>
                  </Box>
                ) : auditEvents.length === 0 ? (
                  <Box p="8" textAlign="center">
                    <Text color="gray.500">No audit log entries found.</Text>
                  </Box>
                ) : (
                  <VStack gap="0" align="stretch">
                    {auditEvents.map((event, index) => {
                      const actionColors = getActionColor(event.action);
                      return (
                        <Box 
                          key={event.id}
                          p="4" 
                          borderBottom={index < auditEvents.length - 1 ? "1px" : "none"} 
                          borderColor="gray.100"
                          _hover={{ bg: "gray.50" }}
                        >
                          <HStack gap="4" fontSize="sm">
                            <Box width="200px">
                              <Text color="gray.600">
                                {new Date(event.timestamp).toLocaleString()}
                              </Text>
                            </Box>
                            <Box width="200px">
                              <Text color="gray.800" fontWeight="medium">
                                {getUserDisplayName(event)}
                              </Text>
                              {event.userRole && (
                                <Text color="gray.500" fontSize="xs">
                                  {event.userRole}
                                </Text>
                              )}
                            </Box>
                            <Box width="150px">
                              <Box
                                bg={actionColors.bg}
                                color={actionColors.color}
                                fontSize="xs"
                                fontWeight="medium"
                                px="2"
                                py="1"
                                borderRadius="sm"
                                display="inline-block"
                              >
                                {event.action}
                              </Box>
                            </Box>
                            <Box width="100px">
                              <Text color="gray.600">{event.entityType}</Text>
                            </Box>
                            <Box width="100px">
                              <Text color="gray.600" fontFamily="mono" fontSize="xs">
                                {event.entityId}
                              </Text>
                            </Box>
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </Box>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
}
