'use client';

import { Box, VStack, HStack, Flex } from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Search,
  Typography,
  Tag,
  Button,
  IconWrapper,
  DataTable,
  AlertBar,
  Tooltip,
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
import { FiPlus, FiEdit3, FiTrash2 } from 'react-icons/fi';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { entityConfigApiService, Requirement } from '../../services/entityConfigApi';
import { SweetAlert } from '../../utils/sweetAlert';

export default function KYBRequirementsPage() {
  const { condensed } = useSidebar();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const headerBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.info('[Requirements Page] Loading requirements with filters:', {
        status: statusFilter,
        search: searchQuery,
      });
      const requirementsData = await entityConfigApiService.getRequirements(false);
      console.info('[Requirements Page] Requirements loaded:', requirementsData.length);
      // Log a sample requirement to check fieldType
      if (requirementsData.length > 0) {
        console.info('[Requirements Page] Sample requirement:', {
          code: requirementsData[0].code,
          fieldType: requirementsData[0].fieldType,
          type: requirementsData[0].type,
        });
      }
      setRequirements(requirementsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load requirements';
      setError(errorMessage);
      console.error('[Requirements Page] Error loading requirements:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    const result = await SweetAlert.confirm(
      'Delete Requirement',
      'Are you sure you want to delete this requirement? This action cannot be undone.',
      'Yes, delete it!',
      'Cancel'
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeleting(id);
      SweetAlert.loading('Deleting...', 'Please wait while we delete the requirement.');

      await entityConfigApiService.deleteRequirement(id);
      setRequirements((prev) => prev.filter((req) => req.id !== id));
      setRefreshKey((prev) => prev + 1);

      SweetAlert.close();
      SweetAlert.success('Deleted!', 'Requirement has been deleted successfully.');
    } catch (err) {
      SweetAlert.close();
      SweetAlert.error(
        'Delete Failed',
        'Failed to delete requirement. Please try again.'
      );
      console.error('Error deleting requirement:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredRequirements = requirements.filter((requirement) => {
    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      if (requirement.isActive !== isActive) {
        return false;
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        requirement.displayName.toLowerCase().includes(query) ||
        requirement.code.toLowerCase().includes(query) ||
        requirement.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Design system tokens
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _tokens = {
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
    },
    colors: {
      text: {
        primary: '#111827',
        secondary: '#374151',
        tertiary: '#6B7280',
      },
      border: {
        default: '#E5E7EB',
        hover: '#D1D5DB',
        focus: '#3B82F6',
      },
      bg: {
        white: '#FFFFFF',
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
        },
      },
    },
    typography: {
      heading: {
        size: '28px',
        weight: '600',
        lineHeight: '1.2',
        letterSpacing: '-0.02em',
      },
      section: {
        size: '16px',
        weight: '600',
        lineHeight: '1.4',
        letterSpacing: '-0.01em',
      },
      label: {
        size: '13px',
        weight: '500',
      },
      body: {
        size: '14px',
        weight: '400',
      },
      helper: {
        size: '12px',
        weight: '400',
      },
    },
    form: {
      inputHeight: '40px',
      borderRadius: '8px',
      cardRadius: '12px',
      cardPadding: '16px',
      fieldGap: '8px',
      labelInputGap: '4px',
      helperGap: '2px',
      sectionGap: '16px',
      fieldVerticalPadding: '4px',
    },
  };

  // Define columns for DataTable
  const columns: ColumnConfig<Requirement>[] = [
    {
      field: 'displayName',
      header: 'Requirement',
      sortable: true,
      width: '25%',
      minWidth: '200px',
      render: (value, row) => (
        <VStack align="start" gap="2px">
          <Typography fontSize="13px" fontWeight="500" color={textColor} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {row.displayName}
          </Typography>
          <Typography
            fontSize="11px"
            color="#6B7280"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {row.description || 'No description'}
          </Typography>
        </VStack>
      ),
    },
    {
      field: 'code',
      header: 'Code',
      sortable: true,
      width: '20%',
      minWidth: '180px',
      render: (value) => (
        <Typography fontSize="12px" fontFamily="mono" color={textColor} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {String(value || '')}
        </Typography>
      ),
    },
    {
      field: 'type',
      header: 'Type',
      sortable: true,
      width: '15%',
      minWidth: '130px',
      render: (value) => (
        <Tag variant="info" style={{ fontSize: '11px', padding: '2px 8px', whiteSpace: 'nowrap' }}>
          {String(value || '')}
        </Tag>
      ),
    },
    {
      field: 'fieldType',
      header: 'Field Type',
      sortable: true,
      width: '10%',
      minWidth: '90px',
      render: (value, row) => {
        const rowObj = row as unknown as Record<string, unknown>;
        const fieldType = rowObj.fieldType || rowObj.field_type || value;
        return fieldType ? (
          <Tag variant="inactive" style={{ fontSize: '11px', padding: '2px 8px' }}>
            {String(fieldType)}
          </Tag>
        ) : (
          <Typography fontSize="12px" color="#6B7280">-</Typography>
        );
      },
    },
    {
      field: 'isActive',
      header: 'Status',
      sortable: true,
      width: '10%',
      minWidth: '80px',
      render: (value) => (
        <Tag variant={value ? 'success' : 'inactive'} style={{ fontSize: '11px', padding: '2px 8px' }}>
          {value ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      field: 'id',
      header: 'Actions',
      sortable: false,
      width: '100px',
      minWidth: '100px',
      render: (value, row) => {
        const requirement = row as unknown as Requirement;
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            h="100%"
            w="100%"
          >
            <HStack gap="6px" justify="center" align="center">
              <Tooltip content="Edit requirement">
                <Link
                  href={`/requirements/edit/${requirement.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <button
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #E5E7EB',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F9FAFB';
                      e.currentTarget.style.borderColor = '#F05423';
                      e.currentTarget.style.color = '#F05423';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.color = '#374151';
                    }}
                  >
                    <IconWrapper>
                      <FiEdit3 size={16} color="inherit" />
                    </IconWrapper>
                  </button>
                </Link>
              </Tooltip>
              <Tooltip content="Delete requirement">
                <button
                  onClick={() => handleDelete(requirement.id)}
                  disabled={deleting === requirement.id}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    cursor: deleting === requirement.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    opacity: deleting === requirement.id ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (deleting !== requirement.id) {
                      e.currentTarget.style.background = '#FEF2F2';
                      e.currentTarget.style.borderColor = '#EF4444';
                      e.currentTarget.style.color = '#EF4444';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  <IconWrapper>
                    <FiTrash2 size={16} color="inherit" />
                  </IconWrapper>
                </button>
              </Tooltip>
            </HStack>
          </Box>
        );
      },
    },
  ];

  return (
    <Box minH="100vh" bg={bgColor}>
      <AdminSidebar />
      <PortalHeader />

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
                KYB Requirements
              </Typography>
              <Typography fontSize="14px" color="mukuru.grey.600">
                Define and manage requirements for business verification
              </Typography>
            </VStack>
            <Link href="/requirements/create">
              <Button variant="primary" size="md">
                <IconWrapper><FiPlus size={16} /></IconWrapper>
                New Requirement
              </Button>
            </Link>
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
              {(['all', 'active', 'inactive'] as const).map((filter) => {
                const label = filter === 'all' ? 'All' 
                  : filter === 'active' ? 'Active' 
                  : 'Inactive';
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
            className="requirements-table-card"
          >
              <style>{`
                /* Make DataTable fill container */
                .requirements-table-card > div {
                  height: 100% !important;
                  display: flex !important;
                  flex-direction: column !important;
                }
                .requirements-table-card > div > div:last-child {
                  flex: 1 !important;
                  overflow: auto !important;
                }
                /* Table container - use auto layout for better column sizing */
                .requirements-table-card table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  table-layout: auto !important;
                }
                /* Column widths */
                .requirements-table-card th:nth-child(1),
                .requirements-table-card td:nth-child(1) {
                  width: 22% !important;
                  min-width: 180px !important;
                  max-width: 250px !important;
                }
                .requirements-table-card th:nth-child(2),
                .requirements-table-card td:nth-child(2) {
                  width: 22% !important;
                  min-width: 180px !important;
                  max-width: 250px !important;
                }
                .requirements-table-card th:nth-child(3),
                .requirements-table-card td:nth-child(3) {
                  width: 16% !important;
                  min-width: 130px !important;
                }
                .requirements-table-card th:nth-child(4),
                .requirements-table-card td:nth-child(4) {
                  width: 12% !important;
                  min-width: 90px !important;
                }
                .requirements-table-card th:nth-child(5),
                .requirements-table-card td:nth-child(5) {
                  width: 10% !important;
                  min-width: 80px !important;
                }
                .requirements-table-card th:nth-child(6),
                .requirements-table-card td:nth-child(6) {
                  width: 100px !important;
                  min-width: 100px !important;
                  max-width: 100px !important;
                }
                /* Ensure proper column spacing */
                .requirements-table-card th,
                .requirements-table-card td {
                  padding: 12px 16px !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                  vertical-align: middle !important;
                }
                /* Table header - clean flat design */
                .requirements-table-card thead {
                  background: #FAFAFA !important;
                }
                .requirements-table-card thead th,
                .requirements-table-card th[role="columnheader"] {
                  font-size: 11px !important;
                  font-weight: 600 !important;
                  padding: 14px 16px !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  color: #666 !important;
                  border-bottom: 1px solid #E0E0E0 !important;
                  white-space: nowrap !important;
                  background: transparent !important;
                  line-height: 1.2 !important;
                }
                /* Remove ALL container/pill styling */
                .requirements-table-card thead th *,
                .requirements-table-card th[role="columnheader"] * {
                  background: none !important;
                  background-color: transparent !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                /* Header content - simple flex layout */
                .requirements-table-card thead th > div {
                  display: inline-flex !important;
                  align-items: center !important;
                  gap: 4px !important;
                  background: none !important;
                  border: none !important;
                  padding: 0 !important;
                }
                /* Header text */
                .requirements-table-card thead th,
                .requirements-table-card thead th * {
                  font-size: 11px !important;
                  font-weight: 600 !important;
                  color: #666 !important;
                  font-family: 'Madera', sans-serif !important;
                }
                /* Sort icon - small and subtle */
                .requirements-table-card thead th svg {
                  width: 10px !important;
                  height: 10px !important;
                  color: #AAA !important;
                  flex-shrink: 0 !important;
                }
                /* Actions column - center aligned */
                .requirements-table-card thead th:last-child {
                  text-align: center !important;
                }
                .requirements-table-card td:last-child {
                  text-align: center !important;
                }
                /* Hide sort dropdown popup */
                .requirements-table-card [data-scope="popover"],
                .requirements-table-card [data-scope="menu"][data-part="content"],
                .requirements-table-card [role="menu"] {
                  display: none !important;
                }
                /* Table body rows */
                .requirements-table-card tbody tr {
                  border-bottom: 1px solid #F0F0F0 !important;
                }
                .requirements-table-card tbody tr:hover {
                  background-color: #FAFAFA !important;
                }
                /* Table cells */
                .requirements-table-card tbody td {
                  padding: 12px 16px !important;
                  font-size: 13px !important;
                  color: #333 !important;
                }
                /* Cell content truncation */
                .requirements-table-card td > div,
                .requirements-table-card td > span,
                .requirements-table-card td > p {
                  max-width: 100% !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                }
              `}</style>
              <DataTable
                key={`requirements-${statusFilter}-${searchQuery}-${refreshKey}`}
                data={filteredRequirements as unknown as Record<string, unknown>[]}
                columns={columns as unknown as ColumnConfig[]}
                emptyState={{
                  message:
                    searchQuery || statusFilter !== 'all'
                      ? 'No matching requirements found. Try adjusting your search criteria or filters.'
                      : 'No requirements yet. Get started by creating your first requirement.',
                }}
              />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
