"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Flex,
  Spinner
} from "@chakra-ui/react";
import { 
  Button, 
  Search, 
  Typography, 
  DataTable, 
  Tag, 
  IconWrapper,
  AlertBar,
  Tooltip
} from "@/lib/mukuruImports";
import Link from "next/link";
import type { ColumnConfig } from "@mukuru/mukuru-react-components";
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
import AdminSidebar from "../../components/AdminSidebar";
import PortalHeader from "../../components/PortalHeader";
import { useSidebar } from "../../contexts/SidebarContext";
import { fetchApplications, exportApplications, Application } from "../../services";
import { logger } from "../../lib/logger";

export default function ApplicationsPage() {
  const { condensed } = useSidebar();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [exporting, setExporting] = useState(false);

  const loadApplications = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      logger.debug('[Applications Page] Loading applications with filters', {
        status: statusFilter,
        search: search || searchTerm,
      });
      
      // Use new service structure - fetchApplications handles mapping and business logic
      const result = await fetchApplications(
        1,
        1000, // Get all applications for display
        search || searchTerm || undefined,
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      
      logger.debug('[Applications Page] Applications loaded', { count: result.items.length });
      setApplications(result.items);
    } catch (err) {
      logger.error(err, '[Applications Page] Error loading applications', {
        tags: { error_type: 'applications_load_error' }
      });
      setError(err instanceof Error ? err.message : 'Failed to load applications. Please ensure backend services are running.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  // Handler for search changes - Search component handles debouncing internally (500ms)
  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
    // Search component already debounces, so we can call loadApplications directly
    // Note: loadApplications will use the updated searchTerm from state
  }, []);

  // Load applications on mount and when status filter or search term changes
  useEffect(() => {
    loadApplications();
  }, [statusFilter, searchTerm, loadApplications]);

  const handleExport = async () => {
    try {
      setExporting(true);
      // Use new service structure for export
      const blob = await exportApplications({
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
      logger.error(err, 'Error exporting applications', {
        tags: { error_type: 'applications_export_error' }
      });
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

  // Define columns for DataTable
  const columns: ColumnConfig<Application>[] = [
    {
      field: 'companyName',
      header: 'Company Name',
      sortable: true,
      width: '250px',
      minWidth: '250px',
      render: (value: string | number, row: Application) => (
        <Typography 
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
          {value as string}
        </Typography>
      )
    },
    {
      field: 'id',
      header: 'Application ID',
      sortable: true,
      width: '200px',
      minWidth: '200px',
      render: (value) => (
        <Typography 
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
          {value as string}
        </Typography>
      )
    },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      width: '140px',
      minWidth: '140px',
      render: (value) => {
        const status = (value as string) || 'SUBMITTED';
        const color = getStatusColor(status);
        const variant = color === 'green' ? 'success' : color === 'red' ? 'danger' : color === 'orange' ? 'warning' : 'info';
        return (
          <Tag variant={variant}>
            {status.replace('_', ' ')}
          </Tag>
        );
      }
    },
    {
      field: 'assignedTo',
      header: 'Assigned To',
      sortable: true,
      width: '180px',
      minWidth: '180px',
      render: (value, row) => {
        const assignedTo = (value as string) || "Unassigned";
        const isAssigned = assignedTo !== "Unassigned" && assignedTo;
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
              <IconWrapper><FiUser size={16} color={isAssigned ? "#DD6B20" : "#9CA3AF"} /></IconWrapper>
            </Box>
            <Typography 
              fontSize="sm" 
              color={isAssigned ? "gray.700" : "gray.500"} 
              fontWeight="medium"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '150px'
              }}
            >
              {assignedTo}
            </Typography>
          </HStack>
        );
      }
    }
  ];

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <PortalHeader />
        <Box 
          flex="1" 
          ml={condensed ? "72px" : "280px"}
          mt="90px"
          minH="calc(100vh - 90px)" 
          width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
          bg="gray.50" 
          overflowX="hidden"
        >
          <Flex justify="center" align="center" h="400px">
            <VStack gap="4">
              <Spinner size="xl" color="orange.500" />
              <Typography color="gray.600">Loading applications...</Typography>
            </VStack>
          </Flex>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />
      <PortalHeader />
      
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
                  Applications Management
                </Typography>
                <Typography fontSize="md" color="gray.600" fontWeight="normal">
                  Manage all partner and customer applications
                </Typography>
              </VStack>
              <HStack gap="3">
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={handleExport}
                  disabled={exporting}
                  className="mukuru-primary-button"
                >
                  <IconWrapper>
                    <FiDownload size={16} />
                  </IconWrapper>
                  {exporting ? 'Exporting...' : 'Export'}
                </Button>
              </HStack>
            </Flex>
          </Container>
        </Box>

        {/* Content Section */}
        <Box flex="1" bg="gray.50" width="full">
          <Container maxW="100%" px="8" py="8" width="full">
            <VStack gap="4" align="stretch" width="full">
              {/* Error Alert */}
              {error && (
                <AlertBar
                  status="error"
                  title="Error loading applications"
                  description={error}
                />
              )}

              {/* Status Filter Buttons */}
              <HStack gap="2" wrap="wrap" mb="2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setStatusFilter('ALL')}
                  borderRadius="lg"
                  className="mukuru-primary-button"
                  style={{
                    opacity: statusFilter === 'ALL' ? 1 : 0.7
                  }}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setStatusFilter('SUBMITTED')}
                  borderRadius="lg"
                  className="mukuru-primary-button"
                  style={{
                    opacity: statusFilter === 'SUBMITTED' ? 1 : 0.7
                  }}
                >
                  Submitted
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setStatusFilter('IN_PROGRESS')}
                  borderRadius="lg"
                  className="mukuru-primary-button"
                  style={{
                    opacity: statusFilter === 'IN_PROGRESS' ? 1 : 0.7
                  }}
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setStatusFilter('RISK_REVIEW')}
                  borderRadius="lg"
                  className="mukuru-primary-button"
                  style={{
                    opacity: statusFilter === 'RISK_REVIEW' ? 1 : 0.7
                  }}
                >
                  Risk Review
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setStatusFilter('COMPLETE')}
                  borderRadius="lg"
                  className="mukuru-primary-button"
                  style={{
                    opacity: statusFilter === 'COMPLETE' ? 1 : 0.7
                  }}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setStatusFilter('DECLINED')}
                  borderRadius="lg"
                  className="mukuru-primary-button"
                  style={{
                    opacity: statusFilter === 'DECLINED' ? 1 : 0.7
                  }}
                >
                  Declined
                </Button>
              </HStack>

              {/* Search Bar */}
              <Box mb="4" width="100%">
                <Box width="100%" maxW="800px">
                  <Search
                    placeholder="Search by company name or application ID..."
                    onSearchChange={handleSearchChange}
                  />
                </Box>
              </Box>

              {/* Applications Table */}
              <Box 
                bg="white" 
                borderRadius="xl" 
                boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                border="1px solid"
                borderColor="gray.100"
                overflow="hidden"
                color="gray.900"
                className="work-queue-table-wrapper"
                width="100%"
              >
            <DataTable
              data={filteredApplications as unknown as Record<string, unknown>[]}
              columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
              loading={loading}
              emptyState={{
                message: applications.length === 0 
                  ? "No applications found" 
                  : "No applications match your search criteria",
                content: (
                  <VStack gap="4">
                    <IconWrapper><FiSearch size={48} color="#9CA3AF" /></IconWrapper>
                    <Typography fontSize="sm" color="gray.500">
                      {applications.length === 0
                        ? "Applications will appear here once they are created"
                        : "Try adjusting your search criteria or filters"}
                    </Typography>
                  </VStack>
                )
              }}
              showActions={true}
              actionColumn={{
                header: 'Actions',
                width: '150px',
                render: (row, index) => {
                  const app = row as unknown as Application;
                  return (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
                      <Tooltip content="View" showArrow variant="light">
                        <Link href={`/applications/${app.id}`} style={{ textDecoration: 'none' }}>
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
                            aria-label="View"
                          >
                            <IconWrapper><FiEye size={16} /></IconWrapper>
                          </button>
                        </Link>
                      </Tooltip>
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
                          onClick={async () => {
                            try {
                              const appWithWorkItem = row as unknown as Application & { workItemId?: string };
                              const workItemId = appWithWorkItem.workItemId || appWithWorkItem.id;
                              window.location.href = `/review/${workItemId}`;
                            } catch (err) {
                              logger.error(err, 'Error navigating to review', {
                                tags: { error_type: 'navigation_error' }
                              });
                              window.location.href = `/applications/${app.id}`;
                            }
                          }}
                          aria-label="Review"
                        >
                          <IconWrapper><FiShield size={16} /></IconWrapper>
                        </button>
                      </Tooltip>
                    </div>
                  );
                }
              }}
              onRowClick={(row) => {
                const app = row as unknown as Application;
                window.location.href = `/applications/${app.id}`;
              }}
            />
            </Box>
            </VStack>
          </Container>
        </Box>
      </Box>
    </Flex>
  );
}
