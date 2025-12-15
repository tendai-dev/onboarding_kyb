'use client';

import { Box, VStack, HStack, Flex, Spinner } from '@chakra-ui/react';
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
import { FiFileText, FiEdit3, FiPlus, FiTrash2 } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import {
  entityConfigApiService,
  EntityType,
  Requirement,
} from '../../services/entityConfigApi';
import { SweetAlert } from '../../utils/sweetAlert';

export default function EntityTypesPage() {
  const { condensed } = useSidebar();
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
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
      const [entityTypesData, requirementsData] = await Promise.all([
        entityConfigApiService.getEntityTypes(false, true),
        entityConfigApiService.getRequirements(false),
      ]);
      setEntityTypes(entityTypesData);
      setRequirements(requirementsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load entity types';
      setError(errorMessage);
      console.error('[Entity Types Page] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    const result = await SweetAlert.confirm(
      'Delete Entity Type',
      'Are you sure you want to delete this entity type? This action cannot be undone.',
      'Yes, delete it!',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    try {
      setDeleting(id);
      SweetAlert.loading('Deleting...', 'Please wait while we delete the entity type.');
      await entityConfigApiService.deleteEntityType(id);
      setEntityTypes((prev) => prev.filter((et) => et.id !== id));
      setRefreshKey((prev) => prev + 1);
      SweetAlert.close();
      await SweetAlert.success('Deleted!', 'Entity type has been deleted successfully.');
    } catch (err) {
      SweetAlert.close();
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete entity type';
      setError(errorMessage);
      console.error('Error deleting entity type:', err);
      await SweetAlert.error('Delete Failed', errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const getRequirementNames = (entityTypeRequirements?: EntityType['requirements']) => {
    if (!entityTypeRequirements || entityTypeRequirements.length === 0) {
      return [];
    }
    return entityTypeRequirements.map((etr) => {
      if (etr.requirement) {
        return etr.requirement.displayName;
      }
      const req = requirements.find((r) => r.id === etr.requirementId);
      return req ? req.displayName : etr.requirementId;
    });
  };

  const getEntityIcon = (iconName?: string) => {
    // Dynamically get icon from react-icons/fi
    if (iconName && FiIcons[iconName as keyof typeof FiIcons]) {
      return FiIcons[iconName as keyof typeof FiIcons] as React.ComponentType;
    }
    // Default to FiFileText if icon not found
    return FiFileText;
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredEntityTypes = entityTypes.filter((entity) => {
    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      if (entity.isActive !== isActive) {
        return false;
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        entity.displayName.toLowerCase().includes(query) ||
        entity.code.toLowerCase().includes(query) ||
        entity.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Define columns for DataTable
  const columns: ColumnConfig<EntityType>[] = [
    {
      field: 'displayName',
      header: 'Entity Type',
      sortable: true,
      width: '28%',
      minWidth: '220px',
      render: (value, row) => {
        const IconComponent = getEntityIcon(row.icon);
        return (
          <HStack gap="10px" align="center" w="100%">
            <Box
              w="32px"
              h="32px"
              borderRadius="6px"
              bg="#FFF5F0"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <IconWrapper>
                <IconComponent />
              </IconWrapper>
            </Box>
            <VStack align="start" gap="2px" flex="1" minW="0">
              <Typography
                fontSize="13px"
                fontWeight="500"
                color="mukuru.text.primary"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {row.displayName}
              </Typography>
              <Typography
                fontSize="11px"
                color="#6B7280"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {row.description || 'No description'}
              </Typography>
            </VStack>
          </HStack>
        );
      },
    },
    {
      field: 'code',
      header: 'Code',
      sortable: true,
      width: '15%',
      minWidth: '140px',
      render: (value) => (
        <Typography
          fontSize="12px"
          fontFamily="mono"
          color="mukuru.text.primary"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {String(value || '')}
        </Typography>
      ),
    },
    {
      field: 'requirements',
      header: 'Requirements',
      sortable: false,
      width: '30%',
      minWidth: '200px',
      render: (value, row) => {
        const reqNames = getRequirementNames(row.requirements);
        if (reqNames.length === 0) {
          return (
            <Typography fontSize="12px" color="#9CA3AF" fontStyle="italic">
              No requirements
            </Typography>
          );
        }
        return (
          <VStack align="start" gap="4px" w="100%">
            <HStack gap="4px" wrap="wrap" maxW="100%">
              {reqNames.slice(0, 2).map((req: string, index: number) => (
                <Tag
                  key={index}
                  variant="inactive"
                  style={{ fontSize: '10px', padding: '2px 6px' }}
                >
                  {req.length > 20 ? `${req.substring(0, 20)}...` : req}
                </Tag>
              ))}
              {reqNames.length > 2 && (
                <Tag variant="info" style={{ fontSize: '10px', padding: '2px 6px' }}>
                  +{reqNames.length - 2} more
                </Tag>
              )}
            </HStack>
            <Typography fontSize="10px" color="#9CA3AF">
              {reqNames.length} requirement{reqNames.length !== 1 ? 's' : ''}
            </Typography>
          </VStack>
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
        <Tag
          variant={value ? 'success' : 'inactive'}
          style={{ fontSize: '11px', padding: '2px 8px' }}
        >
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
        const entityType = row as unknown as EntityType;
        return (
          <HStack gap="6px" justify="center" align="center">
            <Tooltip content="Edit entity type">
              <Link
                href={`/entity-types/edit/${entityType.id}`}
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
            <Tooltip content="Delete entity type">
              <button
                onClick={() => handleDelete(entityType.id)}
                disabled={deleting === entityType.id}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #E5E7EB',
                  background: 'white',
                  cursor: deleting === entityType.id ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  opacity: deleting === entityType.id ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (deleting !== entityType.id) {
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
        );
      },
    },
  ];

  // Mukuru theme colors (matching work-queue page)
  const bgColorNew = 'mukuru.grey.100';
  const cardBgNew = 'mukuru.white';
  const borderColorNew = 'mukuru.stroke';

  return (
    <Box minH="100vh" bg={bgColorNew}>
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content Area */}
      <Box
        ml={condensed ? '72px' : '280px'}
        pt="90px"
        minH="100vh"
        bg={bgColorNew}
        transition="margin-left 0.3s ease"
      >
        {/* Page Header */}
        <Box px="24px" pt="24px" pb="16px" bg={cardBgNew}>
          <Flex justify="space-between" align="center">
            <VStack align="start" gap="2px">
              <Typography fontSize="24px" fontWeight="700" color={textColor}>
                Entity Types
              </Typography>
              <Typography fontSize="14px" color="mukuru.grey.600">
                Create and configure entity types for KYB applications
              </Typography>
            </VStack>
            <Link href="/entity-types/create">
              <Button variant="primary" size="md">
                <IconWrapper>
                  <FiPlus size={16} />
                </IconWrapper>
                New Entity Type
              </Button>
            </Link>
          </Flex>
        </Box>

        {/* Status Filter Tabs */}
        <Box
          px="24px"
          bg={cardBgNew}
          borderBottom="1px solid"
          borderColor={borderColorNew}
        >
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
                const label =
                  filter === 'all' ? 'All' : filter === 'active' ? 'Active' : 'Inactive';
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

        {/* Search Row */}
        <Box
          px="24px"
          py="12px"
          bg={cardBgNew}
          borderBottom="1px solid"
          borderColor={borderColorNew}
        >
          <Box maxW="400px">
            <Search
              placeholder="Search by name, code..."
              onSearchChange={handleSearchChange}
            />
          </Box>
        </Box>

        {/* Table Section */}
        <Box
          flex="1"
          minH="0"
          px="24px"
          py="16px"
          bg={bgColorNew}
          display="flex"
          flexDirection="column"
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
              <Spinner size="xl" />
            </Box>
          ) : (
            <Box
              flex="1"
              minH="0"
              bg={cardBgNew}
              borderRadius="8px"
              border="1px solid"
              borderColor={borderColorNew}
              overflow="hidden"
              display="flex"
              flexDirection="column"
              className="entity-types-table-card"
            >
              <style>{`
                /* Table container - use auto layout for better column sizing */
                .entity-types-table-card table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  table-layout: auto !important;
                }
                /* Column widths */
                .entity-types-table-card th:nth-child(1),
                .entity-types-table-card td:nth-child(1) {
                  width: 28% !important;
                  min-width: 220px !important;
                }
                .entity-types-table-card th:nth-child(2),
                .entity-types-table-card td:nth-child(2) {
                  width: 15% !important;
                  min-width: 140px !important;
                }
                .entity-types-table-card th:nth-child(3),
                .entity-types-table-card td:nth-child(3) {
                  width: 30% !important;
                  min-width: 200px !important;
                }
                .entity-types-table-card th:nth-child(4),
                .entity-types-table-card td:nth-child(4) {
                  width: 10% !important;
                  min-width: 80px !important;
                }
                .entity-types-table-card th:nth-child(5),
                .entity-types-table-card td:nth-child(5) {
                  width: 120px !important;
                  min-width: 120px !important;
                }
                /* Ensure proper column spacing */
                .entity-types-table-card th,
                .entity-types-table-card td {
                  padding: 12px 16px !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                  vertical-align: middle !important;
                }
                /* Table header - clean flat design */
                .entity-types-table-card thead {
                  background: #FAFAFA !important;
                }
                .entity-types-table-card thead th {
                  font-size: 11px !important;
                  font-weight: 600 !important;
                  padding: 14px 16px !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  color: #666 !important;
                  border-bottom: 1px solid #E0E0E0 !important;
                  white-space: nowrap !important;
                  background: transparent !important;
                }
                /* Remove container/pill styling */
                .entity-types-table-card thead th * {
                  background: none !important;
                  border: none !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                /* Actions column - center aligned */
                .entity-types-table-card thead th:last-child {
                  text-align: center !important;
                }
                .entity-types-table-card td:last-child {
                  text-align: center !important;
                }
                /* Table body rows */
                .entity-types-table-card tbody tr {
                  border-bottom: 1px solid #F0F0F0 !important;
                }
                .entity-types-table-card tbody tr:hover {
                  background-color: #FAFAFA !important;
                }
                /* Table cells */
                .entity-types-table-card tbody td {
                  padding: 12px 16px !important;
                  font-size: 13px !important;
                  color: #333 !important;
                }
              `}</style>
              <DataTable
                key={`entity-types-${statusFilter}-${searchQuery}-${refreshKey}`}
                data={filteredEntityTypes as unknown as Record<string, unknown>[]}
                columns={columns as unknown as ColumnConfig[]}
                emptyState={{
                  message:
                    searchQuery || statusFilter !== 'all'
                      ? 'No matching entity types found. Try adjusting your search criteria or filters.'
                      : 'No entity types yet. Get started by creating your first entity type.',
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
