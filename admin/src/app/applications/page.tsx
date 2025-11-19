"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Button,
  Input,
  Badge,
  Icon,
  Flex,
  Spinner,
  Table
} from "@chakra-ui/react";
import { 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiEye, 
  FiEdit,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiBriefcase,
  FiHash,
  FiGlobe,
  FiShield,
  FiTrendingUp,
  FiUser,
  FiCalendar,
  FiMoreVertical
} from "react-icons/fi";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import AdminSidebar from "../../components/AdminSidebar";
import applicationsApi, { Application } from "../../lib/applicationsApi";
import workQueueApi from "../../lib/workQueueApi";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [exporting, setExporting] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await applicationsApi.getApplications({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: debouncedSearchTerm || undefined,
        page: 1,
        pageSize: 1000, // Get all applications for display
      });
      
      setApplications(result.data);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load applications. Please ensure backend services are running.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await applicationsApi.exportApplications({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to export applications');
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'blue';
      case 'IN_PROGRESS': return 'orange';
      case 'RISK_REVIEW': return 'red';
      case 'COMPLETE': return 'green';
      case 'DECLINED': return 'red';
      default: return 'gray';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HIGH': return 'red';
      default: return 'gray';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box>
        <AdminSidebar />
        <Box ml="240px" p="8" bg="gray.50" minH="100vh">
          <Flex justify="center" align="center" h="400px">
            <VStack gap="4">
              <Spinner size="xl" color="orange.500" />
              <Text color="gray.600">Loading applications...</Text>
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
                Applications Management
              </Text>
              <Text color="gray.600">
                Manage all partner and customer applications
              </Text>
            </VStack>
            
            <HStack gap="3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                loading={exporting}
                borderRadius="lg"
                borderColor="gray.300"
                _hover={{ 
                  bg: "orange.50",
                  borderColor: "orange.400",
                  color: "orange.600",
                  transform: "translateY(-1px)",
                  boxShadow: "sm"
                }}
                transition="all 0.2s"
                fontWeight="medium"
              >
                <Icon as={FiDownload} mr="2" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                borderRadius="lg"
                borderColor="gray.300"
                _hover={{ 
                  bg: "gray.50",
                  borderColor: "gray.400",
                  transform: "translateY(-1px)",
                  boxShadow: "sm"
                }}
                transition="all 0.2s"
                fontWeight="medium"
              >
                <Icon as={FiFilter} mr="2" />
                Filters
              </Button>
            </HStack>
          </Flex>

          {/* Error Alert */}
          {error && (
            <Box
              bg="red.50"
              border="1px"
              borderColor="red.200"
              borderRadius="md"
              p="4"
            >
              <HStack gap="3">
                <Icon as={FiAlertCircle} color="red.500" boxSize="5" />
                <VStack align="start" gap="1">
                  <Text fontWeight="semibold" color="red.800">
                    Error loading applications
                  </Text>
                  <Text fontSize="sm" color="red.700">
                    {error}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          )}

          {/* Search and Filters */}
          <Box 
            bg="white" 
            p="6" 
            borderRadius="xl" 
            boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
            border="1px solid"
            borderColor="gray.100"
          >
            <HStack gap="4">
              <Box flex="1" position="relative">
                <HStack
                  bg="gray.50"
                  borderRadius="lg"
                  px="4"
                  py="2"
                  border="1px solid"
                  borderColor="gray.200"
                  _focusWithin={{
                    borderColor: "orange.400",
                    boxShadow: "0 0 0 3px rgba(251, 146, 60, 0.1)"
                  }}
                  transition="all 0.2s"
                >
                  <Icon as={FiSearch} color="gray.400" />
                  <Input
                    placeholder="Search by company name or application ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    border="none"
                    bg="transparent"
                    _focus={{ boxShadow: "none" }}
                    _placeholder={{ color: "gray.400" }}
                  />
                </HStack>
              </Box>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "white",
                  color: "#1A202C",
                  fontWeight: "500",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FB923C";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#FB923C";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(251, 146, 60, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <option value="ALL" style={{ color: "#1A202C" }}>All Status</option>
                <option value="SUBMITTED" style={{ color: "#1A202C" }}>Submitted</option>
                <option value="IN_PROGRESS" style={{ color: "#1A202C" }}>In Progress</option>
                <option value="RISK_REVIEW" style={{ color: "#1A202C" }}>Risk Review</option>
                <option value="COMPLETE" style={{ color: "#1A202C" }}>Complete</option>
                <option value="DECLINED" style={{ color: "#1A202C" }}>Declined</option>
              </select>
            </HStack>
          </Box>

          {/* Applications Table */}
          {filteredApplications.length > 0 && (
            <Box 
              bg="white" 
              borderRadius="xl" 
              boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              border="1px solid"
              borderColor="gray.100"
              overflow="hidden"
            >
              <Table.Root variant="simple" size="md">
                <Table.Header>
                  <Table.Row
                    bg="gray.50"
                    borderBottom="2px solid"
                    borderColor="gray.200"
                  >
                    <Table.ColumnHeader fontWeight="bold" color="gray.700" fontSize="sm" textTransform="uppercase" letterSpacing="wide" minW="200px">
                      Company Name
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="bold" color="gray.700" fontSize="sm" textTransform="uppercase" letterSpacing="wide" minW="180px">
                      Application ID
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="bold" color="gray.700" fontSize="sm" textTransform="uppercase" letterSpacing="wide" minW="120px">
                      Status
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="bold" color="gray.700" fontSize="sm" textTransform="uppercase" letterSpacing="wide" minW="150px">
                      Assigned To
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontWeight="bold" color="gray.700" fontSize="sm" textTransform="uppercase" letterSpacing="wide" minW="100px" textAlign="right">
                      Actions
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredApplications.map((app, index) => (
                  <Table.Row 
                    key={app.id} 
                    borderBottom="1px solid"
                    borderColor="gray.100"
                    _hover={{ 
                      bg: "orange.50",
                      transform: "scale(1.001)",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
                    }}
                    transition="all 0.2s ease"
                    cursor="pointer"
                  >
                    <Table.Cell py="4">
                      <Text 
                        fontWeight="semibold" 
                        color="gray.800" 
                        fontSize="sm"
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '200px'
                        }}
                      >
                        {app.companyName}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py="4">
                      <Text 
                        fontSize="sm" 
                        color="gray.600"
                        fontFamily="mono"
                        fontWeight="medium"
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '180px'
                        }}
                      >
                        {app.id}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py="4">
                      <Badge
                        colorScheme={getStatusColor(app.status || 'SUBMITTED')}
                        variant="solid"
                        fontSize="xs"
                        px="3"
                        py="1.5"
                        borderRadius="md"
                        fontWeight="semibold"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        boxShadow="sm"
                      >
                        {(app.status || 'SUBMITTED').replace('_', ' ')}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell py="4">
                      <HStack gap="2">
                        <Box
                          w="6"
                          h="6"
                          borderRadius="full"
                          bg={app.assignedTo === "Unassigned" || !app.assignedTo ? "gray.200" : "orange.200"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Icon 
                            as={FiUser} 
                            color={app.assignedTo === "Unassigned" || !app.assignedTo ? "gray.500" : "orange.600"} 
                            boxSize="3" 
                          />
                        </Box>
                        <Text 
                          fontSize="sm" 
                          color={app.assignedTo === "Unassigned" || !app.assignedTo ? "gray.500" : "gray.700"} 
                          fontWeight="medium"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '150px'
                          }}
                        >
                          {app.assignedTo || "Unassigned"}
                        </Text>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell py="4" textAlign="right">
                      <HStack gap="2" justify="flex-end">
                        {/* Review Button - Primary action */}
                        <Button
                          size="sm"
                          colorScheme="orange"
                          variant="solid"
                          fontWeight="semibold"
                          _hover={{ 
                            bg: "orange.600",
                            transform: "translateY(-1px)",
                            boxShadow: "md"
                          }}
                          transition="all 0.2s"
                          borderRadius="md"
                          onClick={async () => {
                            try {
                              // Try to get workItemId from the application
                              // Applications from applicationsApi may have workItemId in the enriched data
                              const appWithWorkItem = app as Application & { workItemId?: string };
                              const workItemId = appWithWorkItem.workItemId || app.id;
                              
                              // Navigate to review page
                              // The review page will handle loading the work item by ID
                              window.location.href = `/review/${workItemId}`;
                            } catch (err) {
                              console.error('Error navigating to review:', err);
                              // Fallback to applications page
                              window.location.href = `/applications/${app.id}`;
                            }
                          }}
                        >
                          <HStack gap="1">
                            <Icon as={FiShield} />
                            <Text fontSize="sm" whiteSpace="nowrap">Review</Text>
                          </HStack>
                        </Button>
                        
                        {/* View Button - Secondary action */}
                        <Link href={`/applications/${app.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            _hover={{ 
                              bg: "blue.50",
                              color: "blue.600",
                              transform: "translateY(-1px)",
                              boxShadow: "sm"
                            }}
                            transition="all 0.2s"
                            borderRadius="md"
                          >
                            <HStack gap="1">
                              <Icon as={FiEye} />
                              <Text fontSize="sm" whiteSpace="nowrap">View</Text>
                            </HStack>
                          </Button>
                        </Link>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}

          {/* Empty State */}
          {!error && filteredApplications.length === 0 && (
            <Box
              bg="white"
              p="12"
              borderRadius="lg"
              textAlign="center"
              boxShadow="sm"
            >
              <VStack gap="4">
                <Icon as={FiSearch} boxSize="12" color="gray.400" />
                <Text fontSize="lg" color="gray.600">
                  {applications.length === 0 
                    ? "No applications found" 
                    : "No applications match your search criteria"}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {applications.length === 0
                    ? "Applications will appear here once they are created"
                    : "Try adjusting your search criteria or filters"}
                </Text>
              </VStack>
            </Box>
          )}
        </VStack>
      </Container>
      </Box>
    </Box>
  );
}
