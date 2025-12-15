'use client';

import { Box, VStack, HStack, Flex, Spinner } from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Button,
  Search,
  Typography,
  DataTable,
  Tag,
  IconWrapper,
  AlertBar,
  Tooltip,
  Dropdown,
} from '@mukuru/mukuru-react-components';
import type { ColumnConfig } from '@mukuru/mukuru-react-components';
// Import wrapper components (not yet in npm package)
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsIndicator,
} from '@/lib/mukuruComponentWrappers';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import {
  FiDownload,
  FiSearch,
  FiEye,
  FiShield,
  FiUser,
  FiCheckCircle,
} from 'react-icons/fi';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import { fetchApplications, exportApplications, Application } from '../../services';
import { logger } from '../../lib/logger';

export default function ApplicationsPage() {
  const { condensed } = useSidebar();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);
  const [sortField, setSortField] = useState<string>('companyName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [submittingToWorkQueue, setSubmittingToWorkQueue] = useState<
    Record<string, boolean>
  >({});
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const headerBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

  const loadApplications = useCallback(
    async (search?: string) => {
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

        logger.debug('[Applications Page] Applications loaded', {
          count: result.items.length,
        });
        setApplications(result.items);
      } catch (err) {
        logger.error(err, '[Applications Page] Error loading applications', {
          tags: { error_type: 'applications_load_error' },
        });
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load applications. Please ensure backend services are running.'
        );
        setApplications([]);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, searchTerm]
  );

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
        tags: { error_type: 'applications_export_error' },
      });
      setError(err instanceof Error ? err.message : 'Failed to export applications');
    } finally {
      setExporting(false);
    }
  };

  const handleSubmitToWorkQueue = async (
    applicationId: string,
    application: Application
  ) => {
    try {
      setSubmittingToWorkQueue((prev) => ({ ...prev, [applicationId]: true }));

      // Import the function dynamically
      const { createWorkItemForCase } = await import('../../services/api/workQueueApi');

      // Create work item for this case
      const result = await createWorkItemForCase(applicationId);

      logger.info('[Applications] Successfully created work item', {
        caseId: applicationId,
        workItemId: result.workItemId,
      });

      setToast({
        title: 'Success',
        description: `Application "${application.companyName || applicationId}" has been submitted to work queue.`,
        type: 'success',
      });

      // Reload applications to refresh the list
      await loadApplications();

      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to submit to work queue';
      const errorStatus = (err as Error & { status?: number }).status;

      logger.error(err, '[Applications] Error submitting to work queue', {
        tags: { error_type: 'work_queue_submit_error' },
        extra: {
          caseId: applicationId,
          status: errorStatus,
        },
      });

      // Check for specific error conditions
      if (
        errorMessage.includes('already exists') ||
        errorMessage.includes('Work item already exists')
      ) {
        setToast({
          title: 'Already in Work Queue',
          description: `Application "${application.companyName || applicationId}" already has a work item.`,
          type: 'info',
        });
      } else if (errorStatus === 404) {
        // 404 could mean case doesn't exist, route not found, or case not in Submitted status
        setToast({
          title: 'Not Found',
          description: `Could not create work item. The application may not exist, may not be in Submitted status, or the backend service may not be running.`,
          type: 'error',
        });
      } else if (errorMessage.includes('not in Submitted status')) {
        setToast({
          title: 'Invalid Status',
          description: `Application "${application.companyName || applicationId}" must be in Submitted status to create a work item. Current status: ${application.status}`,
          type: 'warning',
        });
      } else {
        setToast({
          title: 'Error',
          description:
            errorMessage.length > 200
              ? errorMessage.substring(0, 200) + '...'
              : errorMessage,
          type: 'error',
        });
      }

      setTimeout(() => setToast(null), 8000);
    } finally {
      setSubmittingToWorkQueue((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'blue';
      case 'IN_PROGRESS':
        return 'orange';
      case 'RISK_REVIEW':
        return 'red';
      case 'COMPLETE':
        return 'green';
      case 'DECLINED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
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
      render: (value: string | number, _row: Application) => (
        <Typography
          fontWeight="semibold"
          color={textColor}
          fontSize="sm"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '200px',
          }}
        >
          {value as string}
        </Typography>
      ),
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
          color={textColor}
          fontFamily="mono"
          fontWeight="medium"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '180px',
          }}
        >
          {value as string}
        </Typography>
      ),
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
        const variant =
          color === 'green'
            ? 'success'
            : color === 'red'
              ? 'danger'
              : color === 'orange'
                ? 'warning'
                : 'info';
        return <Tag variant={variant}>{status.replace('_', ' ')}</Tag>;
      },
    },
    {
      field: 'assignedTo',
      header: 'Assigned To',
      sortable: true,
      width: '180px',
      minWidth: '180px',
      render: (value, _row) => {
        const assignedTo = (value as string) || 'Unassigned';
        const isAssigned = assignedTo !== 'Unassigned' && assignedTo;
        return (
          <HStack gap="2">
            <Box
              w="6"
              h="6"
              borderRadius="full"
              bg={isAssigned ? 'orange.200' : 'gray.200'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <IconWrapper>
                <FiUser size={16} color={isAssigned ? '#DD6B20' : '#9CA3AF'} />
              </IconWrapper>
            </Box>
            <Typography
              fontSize="sm"
              color={isAssigned ? 'gray.700' : 'gray.500'}
              fontWeight="medium"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '150px',
              }}
            >
              {assignedTo}
            </Typography>
          </HStack>
        );
      },
    },
  ];

  if (loading) {
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
        >
          <Flex justify="center" align="center" h="400px">
            <VStack gap="4">
              <Spinner size="xl" color="mukuru.buttons.primary" />
              <Typography color={textColor}>Loading applications...</Typography>
            </VStack>
          </Flex>
        </Box>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <AdminSidebar />
      <PortalHeader />

      {/* Toast Notification */}
      {toast && (
        <Box position="fixed" top="100px" right="24px" zIndex={10000} maxW="400px">
          <AlertBar
            status={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => setToast(null)}
          />
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        ml={condensed ? '72px' : '280px'}
        pt="90px"
        minH="100vh"
        bg={bgColor}
        transition="margin-left 0.3s ease"
      >
        {/* Page Header */}
        <Box px="24px" pt="24px" pb="16px" bg={cardBg}>
          <Flex justify="space-between" align="center">
            <VStack align="start" gap="2px">
              <Typography fontSize="24px" fontWeight="700" color={textColor}>
                Applications Management
              </Typography>
              <Typography fontSize="14px" color="mukuru.grey.600">
                Manage all partner and customer applications
              </Typography>
            </VStack>
            <Button
              variant="primary"
              size="md"
              onClick={handleExport}
              disabled={exporting}
            >
              <IconWrapper>
                <FiDownload size={16} />
              </IconWrapper>
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </Flex>
        </Box>

        {/* Status Filter Tabs */}
        <Box px="24px" bg={cardBg} borderBottom="1px solid" borderColor={borderColor}>
          {error && (
            <Box mb="12px">
              <AlertBar status="error" title="Error" description={error} />
            </Box>
          )}
          <TabsRoot
            value={statusFilter}
            onValueChange={(details) => setStatusFilter(details.value)}
          >
            <TabsList>
              {(
                [
                  'ALL',
                  'SUBMITTED',
                  'IN_PROGRESS',
                  'RISK_REVIEW',
                  'COMPLETE',
                  'DECLINED',
                ] as const
              ).map((filter) => {
                const label =
                  filter === 'ALL'
                    ? 'All'
                    : filter === 'IN_PROGRESS'
                      ? 'In Progress'
                      : filter === 'RISK_REVIEW'
                        ? 'Risk Review'
                        : filter === 'SUBMITTED'
                          ? 'Submitted'
                          : filter === 'COMPLETE'
                            ? 'Complete'
                            : 'Declined';
                return (
                  <TabsTrigger key={filter} value={filter}>
                    {label}
                  </TabsTrigger>
                );
              })}
              <TabsIndicator />
            </TabsList>
          </TabsRoot>
        </Box>

        {/* Table Section - Full Width */}
        <Box
          flex="1"
          minH="0"
          px="24px"
          py="16px"
          bg={bgColor}
          display="flex"
          flexDirection="column"
        >
          {/* Search Bar Row - Right aligned */}
          <Flex justify="flex-end" mb="12px">
            <Box width="280px">
              <Search
                placeholder="Search by Name or Email..."
                onSearchChange={handleSearchChange}
              />
            </Box>
          </Flex>

          <Box
            flex="1"
            minH="0"
            bg={cardBg}
            borderRadius="8px"
            border="1px solid"
            borderColor={borderColor}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            className="work-queue-table-card"
          >
            <style>{`
                /* Make DataTable fill container */
                .work-queue-table-card > div {
                  height: 100% !important;
                  display: flex !important;
                  flex-direction: column !important;
                }
                .work-queue-table-card > div > div:last-child {
                  flex: 1 !important;
                  overflow: auto !important;
                }
                /* Table container */
                .work-queue-table-card table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  table-layout: fixed !important;
                }
                /* Ensure proper column spacing */
                .work-queue-table-card th,
                .work-queue-table-card td {
                  padding-left: 12px !important;
                  padding-right: 12px !important;
                }
                /* Table header - clean flat design without containers */
                .work-queue-table-card thead {
                  background: #FAFAFA !important;
                }
                .work-queue-table-card thead th,
                .work-queue-table-card th[role="columnheader"] {
                  font-size: 11px !important;
                  font-weight: 500 !important;
                  padding: 14px 12px !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  color: #888 !important;
                  border-bottom: 1px solid #E0E0E0 !important;
                  white-space: nowrap !important;
                  background: transparent !important;
                  line-height: 1 !important;
                }
                .work-queue-table-card thead th *,
                .work-queue-table-card th[role="columnheader"] * {
                  background: none !important;
                  background-color: transparent !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .work-queue-table-card thead th > div {
                  display: inline-flex !important;
                  align-items: center !important;
                  gap: 4px !important;
                  background: none !important;
                  border: none !important;
                  padding: 0 !important;
                }
                .work-queue-table-card thead th,
                .work-queue-table-card thead th * {
                  font-size: 11px !important;
                  font-weight: 500 !important;
                  color: #888 !important;
                  font-family: 'Madera', sans-serif !important;
                }
                .work-queue-table-card thead th svg {
                  width: 10px !important;
                  height: 10px !important;
                  color: #AAA !important;
                  flex-shrink: 0 !important;
                }
                .work-queue-table-card thead th:last-child {
                  padding-left: 40px !important;
                  text-align: left !important;
                }
                .work-queue-table-card tbody tr {
                  border-bottom: 1px solid #E5E5E5 !important;
                }
                .work-queue-table-card tbody tr:hover {
                  background-color: #FFF8F6 !important;
                }
                .work-queue-table-card tbody td {
                  padding: 12px 16px !important;
                  font-size: 13px !important;
                  color: #373A36 !important;
                }
                .work-queue-table-card [data-scope="popover"],
                .work-queue-table-card [data-scope="menu"][data-part="content"],
                .work-queue-table-card [role="menu"] {
                  display: none !important;
                }
                `}</style>
            <DataTable
              data={filteredApplications as unknown as Record<string, unknown>[]}
              columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
              loading={loading}
              emptyState={{
                message:
                  applications.length === 0
                    ? 'No applications found'
                    : 'No applications match your search criteria',
                content: (
                  <VStack gap="4">
                    <IconWrapper>
                      <FiSearch size={48} color="#9CA3AF" />
                    </IconWrapper>
                    <Typography fontSize="sm" color="mukuru.grey.medium">
                      {applications.length === 0
                        ? 'Applications will appear here once they are created'
                        : 'Try adjusting your search criteria or filters'}
                    </Typography>
                  </VStack>
                ),
              }}
              showActions={true}
              actionColumn={{
                header: 'Actions',
                width: '200px',
                render: (row, _index) => {
                  const app = row as unknown as Application;
                  const isSubmitted = app.status === 'SUBMITTED';
                  const isSubmitting = submittingToWorkQueue[app.id] || false;

                  return (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Tooltip content="View" showArrow variant="light">
                        <Link
                          href={
                            row.id && row.id !== 'undefined' && row.id !== 'null'
                              ? `/applications/${row.id}`
                              : '#'
                          }
                          style={{ textDecoration: 'none' }}
                          onClick={(e) => {
                            if (!row.id || row.id === 'undefined' || row.id === 'null') {
                              e.preventDefault();
                              logger.warn(
                                'Cannot navigate: application ID is missing or invalid',
                                {
                                  extra: { rowId: row.id },
                                }
                              );
                            }
                          }}
                        >
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '8px',
                              cursor: 'pointer',
                              color: '#E8590C',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            aria-label="View"
                          >
                            <IconWrapper>
                              <FiEye size={16} />
                            </IconWrapper>
                          </button>
                        </Link>
                      </Tooltip>
                      {isSubmitted && (
                        <Tooltip
                          content={
                            isSubmitting ? 'Submitting...' : 'Submit to Work Queue'
                          }
                          showArrow
                          variant="light"
                        >
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '8px',
                              cursor: isSubmitting ? 'wait' : 'pointer',
                              color: isSubmitting ? '#9CA3AF' : '#E8590C',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: isSubmitting ? 0.6 : 1,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmitToWorkQueue(app.id, app);
                            }}
                            disabled={isSubmitting}
                            aria-label="Submit to Work Queue"
                          >
                            <IconWrapper>
                              {isSubmitting ? (
                                <Spinner size="sm" color="mukuru.buttons.primary" />
                              ) : (
                                <FiCheckCircle size={16} />
                              )}
                            </IconWrapper>
                          </button>
                        </Tooltip>
                      )}
                      <Tooltip content="Review" showArrow variant="light">
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px',
                            cursor: 'pointer',
                            color: '#E8590C',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const appWithWorkItem = row as unknown as Application & {
                                workItemId?: string;
                              };
                              const workItemId =
                                appWithWorkItem.workItemId || appWithWorkItem.id;
                              // Validate workItemId before navigating
                              if (
                                workItemId &&
                                workItemId !== 'undefined' &&
                                workItemId !== 'null'
                              ) {
                                window.location.href = `/review/${workItemId}`;
                              } else {
                                logger.warn(
                                  'Cannot navigate to review: workItemId is missing or invalid',
                                  {
                                    extra: { workItemId, appId: appWithWorkItem.id },
                                  }
                                );
                              }
                            } catch (err) {
                              logger.error(err, 'Error navigating to review', {
                                tags: { error_type: 'navigation_error' },
                              });
                              // Only navigate to applications if row.id is valid
                              if (row.id && row.id !== 'undefined' && row.id !== 'null') {
                                window.location.href = `/applications/${row.id}`;
                              }
                            }
                          }}
                          aria-label="Review"
                        >
                          <IconWrapper>
                            <FiShield size={16} />
                          </IconWrapper>
                        </button>
                      </Tooltip>
                    </div>
                  );
                },
              }}
              onRowClick={(row) => {
                const app = row as unknown as Application;
                // Check if app.id exists and is valid before navigating
                if (app?.id && app.id !== 'undefined' && app.id !== 'null') {
                  window.location.href = `/applications/${app.id}`;
                } else {
                  logger.warn('Cannot navigate: application ID is missing or invalid', {
                    extra: { appId: app?.id, app },
                  });
                }
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
