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
import { FiGlobe, FiEdit3, FiPlus, FiTrash2, FiSettings } from 'react-icons/fi';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { countryConfigApiService, CountryProfile } from '../../services/countryConfigApi';
import { SweetAlert } from '../../utils/sweetAlert';

export default function CountryConfigurationsPage() {
  const { condensed } = useSidebar();
  const [profiles, setProfiles] = useState<CountryProfile[]>([]);
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
      const includeInactive = statusFilter === 'all';
      const data = await countryConfigApiService.getCountryProfiles(includeInactive);
      setProfiles(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load country configurations';
      setError(errorMessage);
      console.error('[Country Configurations Page] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, countryName: string) => {
    const result = await SweetAlert.confirm(
      'Delete Country Profile',
      `Are you sure you want to delete the country profile for ${countryName}? This action cannot be undone.`,
      'Yes, delete it!',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    try {
      setDeleting(id);
      SweetAlert.loading(
        'Deleting...',
        'Please wait while we delete the country profile.'
      );
      await countryConfigApiService.deleteCountryProfile(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setRefreshKey((prev) => prev + 1);
      SweetAlert.close();
      await SweetAlert.success(
        'Deleted!',
        'Country profile has been deleted successfully.'
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete country profile';
      SweetAlert.close();
      setError(errorMessage);
      await SweetAlert.error('Error', errorMessage);
      console.error('[Country Configurations Page] Error deleting:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (profile: CountryProfile) => {
    try {
      if (profile.isActive) {
        await countryConfigApiService.deactivateCountryProfile(profile.id);
        setProfiles((prev) =>
          prev.map((p) => (p.id === profile.id ? { ...p, isActive: false } : p))
        );
        await SweetAlert.success('Deactivated', 'Country profile has been deactivated.');
      } else {
        await countryConfigApiService.activateCountryProfile(profile.id);
        setProfiles((prev) =>
          prev.map((p) => (p.id === profile.id ? { ...p, isActive: true } : p))
        );
        await SweetAlert.success('Activated', 'Country profile has been activated.');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update country profile';
      await SweetAlert.error('Error', errorMessage);
      console.error('[Country Configurations Page] Error toggling active:', err);
    }
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredProfiles = profiles.filter((profile) => {
    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      if (profile.isActive !== isActive) {
        return false;
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        profile.countryName.toLowerCase().includes(query) ||
        profile.countryCode.toLowerCase().includes(query) ||
        (profile.description?.toLowerCase().includes(query) ?? false)
      );
    }

    return true;
  });

  const columns: ColumnConfig<CountryProfile>[] = [
    {
      field: 'countryName',
      header: 'Country',
      sortable: true,
      width: '300px',
      minWidth: '300px',
      render: (value, row) => {
        return (
          <HStack gap="12px" align="start" w="100%">
            <Box
              w="40px"
              h="40px"
              borderRadius="8px"
              bg="mukuru.state.hover.card"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <IconWrapper>
                <FiGlobe />
              </IconWrapper>
            </Box>
            <VStack align="start" gap="4px" flex="1" minW="0">
              <Typography
                fontSize="14px"
                fontWeight="600"
                color="mukuru.text.primary"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                {row.countryName}
              </Typography>
              <Typography
                fontSize="12px"
                color="mukuru.grey.medium"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {row.description || 'No description provided'}
              </Typography>
            </VStack>
          </HStack>
        );
      },
    },
    {
      field: 'countryCode',
      header: 'Code',
      sortable: true,
      width: '150px',
      minWidth: '150px',
      render: (value) => (
        <Box display="flex" alignItems="center" h="100%">
          <Tag variant="info">
            <Typography
              as="span"
              fontSize="12px"
              fontFamily="mono"
              color="mukuru.text.primary"
              fontWeight="500"
            >
              {String(value || '')}
            </Typography>
          </Tag>
        </Box>
      ),
    },
    {
      field: 'tags',
      header: 'Tags',
      sortable: false,
      width: '280px',
      minWidth: '280px',
      render: (tags) => {
        const tagsArray = Array.isArray(tags) ? tags : [];
        const configTags = tagsArray.filter(
          (tag): tag is { id: string; tagName: string; tagValue?: string } =>
            typeof tag === 'object' && tag !== null && 'tagName' in tag
        );
        if (configTags.length === 0) {
          return (
            <Box display="flex" alignItems="center" h="100%">
              <Typography fontSize="13px" color="mukuru.grey.medium" fontStyle="italic">
                No tags assigned
              </Typography>
            </Box>
          );
        }
        return (
          <VStack align="start" gap="6px" w="100%">
            <HStack gap="4px" wrap="wrap" maxW="100%">
              {configTags.slice(0, 3).map((tag) => (
                <Tag
                  key={tag.id}
                  variant="info"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  {tag.tagName}
                  {tag.tagValue && `: ${tag.tagValue}`}
                </Tag>
              ))}
              {configTags.length > 3 && (
                <Tag variant="info" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  +{configTags.length - 3} more
                </Tag>
              )}
            </HStack>
            <Typography fontSize="11px" color="mukuru.grey.medium" fontWeight="500">
              {configTags.length} tag{configTags.length !== 1 ? 's' : ''}
            </Typography>
          </VStack>
        );
      },
    },
    {
      field: 'isActive',
      header: 'Status',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: (value) => (
        <Box display="flex" alignItems="center" h="100%">
          <Tag variant={value ? 'success' : 'inactive'} style={{ fontWeight: '500' }}>
            {value ? 'Active' : 'Inactive'}
          </Tag>
        </Box>
      ),
    },
    {
      field: 'id',
      header: 'Actions',
      sortable: false,
      width: '200px',
      minWidth: '200px',
      render: (id, row) => {
        const idStr = String(id || '');
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            h="100%"
            w="100%"
          >
            <HStack gap="8px" justify="center" align="center">
              <Tooltip content="Edit country profile">
                <Link
                  href={`/country-configurations/edit/${idStr}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <button
                    style={{
                      padding: '8px 16px',
                      border: '1.5px solid var(--mukuru-primary)',
                      background: 'var(--mukuru-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--mukuru-white)',
                      transition: 'all 0.2s',
                      minWidth: '80px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--mukuru-primary)';
                      e.currentTarget.style.borderColor = 'var(--mukuru-primary)';
                      e.currentTarget.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--mukuru-primary)';
                      e.currentTarget.style.borderColor = 'var(--mukuru-primary)';
                      e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <IconWrapper>
                      <FiEdit3 size={14} color="var(--mukuru-white)" />
                    </IconWrapper>
                    <span>Edit</span>
                  </button>
                </Link>
              </Tooltip>
              <Tooltip content="Delete country profile">
                <button
                  onClick={() => handleDelete(idStr, row.countryName)}
                  disabled={deleting === idStr}
                  style={{
                    padding: '8px 16px',
                    border: '1.5px solid var(--mukuru-text-error)',
                    background:
                      deleting === idStr
                        ? 'var(--mukuru-grey-light)'
                        : 'var(--mukuru-text-error-dark)',
                    cursor: deleting === idStr ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color:
                      deleting === idStr
                        ? 'var(--mukuru-grey-medium)'
                        : 'var(--mukuru-white)',
                    transition: 'all 0.2s',
                    minWidth: '85px',
                    opacity: deleting === idStr ? 0.6 : 1,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    if (deleting !== idStr) {
                      e.currentTarget.style.background = 'var(--mukuru-text-error-dark)';
                      e.currentTarget.style.borderColor = 'var(--mukuru-text-error)';
                      e.currentTarget.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (deleting !== idStr) {
                      e.currentTarget.style.background = 'var(--mukuru-text-error-dark)';
                      e.currentTarget.style.borderColor = 'var(--mukuru-text-error)';
                      e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  <IconWrapper>
                    <FiTrash2
                      size={14}
                      color={
                        deleting === idStr
                          ? 'var(--mukuru-grey-medium)'
                          : 'var(--mukuru-white)'
                      }
                    />
                  </IconWrapper>
                  <span>{deleting === idStr ? 'Deleting...' : 'Delete'}</span>
                </button>
              </Tooltip>
            </HStack>
          </Box>
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
                Country Configurations
              </Typography>
              <Typography fontSize="14px" color="mukuru.grey.600">
                Manage country-specific configurations and compliance settings
              </Typography>
            </VStack>
            <Link href="/country-configurations/create">
              <Button variant="primary" size="md">
                <IconWrapper>
                  <FiPlus size={16} />
                </IconWrapper>
                Country
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
              placeholder="Search by country name, code..."
              onSearchChange={handleSearchChange}
            />
          </Box>
        </Box>

        {/* Table Section */}
        <Box px="24px" py="16px" bg={bgColorNew}>
          {loading ? (
            <Flex justify="center" align="center" h="200px">
              <Spinner size="xl" color="#F05423" />
            </Flex>
          ) : (
            <Box
              bg={cardBgNew}
              borderRadius="8px"
              border="1px solid"
              borderColor={borderColorNew}
              overflow="hidden"
              className="country-table-card"
            >
              <style>{`
                .country-table-card table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  table-layout: auto !important;
                }
                .country-table-card thead {
                  background: #FAFAFA !important;
                }
                .country-table-card thead th {
                  font-size: 11px !important;
                  font-weight: 600 !important;
                  padding: 14px 16px !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  color: #666 !important;
                  border-bottom: 1px solid #E0E0E0 !important;
                  white-space: nowrap !important;
                }
                .country-table-card thead th * {
                  background: none !important;
                  border: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .country-table-card tbody tr {
                  border-bottom: 1px solid #F0F0F0 !important;
                }
                .country-table-card tbody tr:hover {
                  background-color: #FAFAFA !important;
                }
                .country-table-card tbody td {
                  padding: 12px 16px !important;
                  font-size: 13px !important;
                  color: #333 !important;
                }
              `}</style>
              <DataTable
                key={`country-configurations-${statusFilter}-${searchQuery}-${refreshKey}`}
                data={filteredProfiles as unknown as Record<string, unknown>[]}
                columns={columns as unknown as ColumnConfig[]}
                emptyState={{
                  message:
                    searchQuery || statusFilter !== 'all'
                      ? 'No matching country configurations found. Try adjusting your search criteria or filters.'
                      : 'No country configurations yet. Get started by creating your first country profile.',
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
