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
  Search, 
  Typography, 
  Tag, 
  Button, 
  IconWrapper,
  DataTable,
  AlertBar,
  Tooltip
} from "@/lib/mukuruImports";
import type { ColumnConfig } from "@mukuru/mukuru-react-components";
import { FiFileText, FiEdit3, FiPlus, FiTrash2, FiBriefcase, FiShield, FiHeart, FiUsers, FiUser, FiGlobe, FiTrendingUp } from "react-icons/fi";
import AdminSidebar from "../../components/AdminSidebar";
import PortalHeader from "../../components/PortalHeader";
import { useSidebar } from "../../contexts/SidebarContext";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { entityConfigApiService, EntityType, Requirement } from "../../services/entityConfigApi";
import { SweetAlert } from "../../utils/sweetAlert";

export default function EntityTypesPage() {
  const { condensed } = useSidebar();
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [entityTypesData, requirementsData] = await Promise.all([
        entityConfigApiService.getEntityTypes(false, true),
        entityConfigApiService.getRequirements(false)
      ]);
      setEntityTypes(entityTypesData);
      setRequirements(requirementsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load entity types';
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
      setEntityTypes(prev => prev.filter(et => et.id !== id));
      setRefreshKey(prev => prev + 1);
      SweetAlert.close();
      await SweetAlert.success('Deleted!', 'Entity type has been deleted successfully.');
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entity type';
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
    return entityTypeRequirements.map(etr => {
      if (etr.requirement) {
        return etr.requirement.displayName;
      }
      const req = requirements.find(r => r.id === etr.requirementId);
      return req ? req.displayName : etr.requirementId;
    });
  };

  const getEntityIcon = (iconName?: string) => {
    const iconMap: Record<string, any> = {
      'FiBriefcase': FiBriefcase,
      'FiShield': FiShield,
      'FiHeart': FiHeart,
      'FiUsers': FiUsers,
      'FiUser': FiUser,
      'FiGlobe': FiGlobe,
      'FiTrendingUp': FiTrendingUp,
      'FiFileText': FiFileText,
    };
    return iconMap[iconName || 'FiFileText'] || FiFileText;
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredEntityTypes = entityTypes.filter(entity => {
    // Status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
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
      width: '350px',
      minWidth: '350px',
      render: (value, row) => {
        const IconComponent = getEntityIcon(row.icon);
        return (
          <HStack gap="12px" align="start" w="100%">
            <Box
              w="40px"
              h="40px"
              borderRadius="8px"
              bg="#FFF4ED"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <IconWrapper>
                <IconComponent size={20} color="#FF6B35" />
              </IconWrapper>
            </Box>
            <VStack align="start" gap="4px" flex="1" minW="0">
              <Typography 
                fontSize="14px" 
                fontWeight="600" 
                color="#111827"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}
              >
                {row.displayName}
              </Typography>
              <Typography 
                fontSize="12px" 
                color="#6B7280"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}
              >
                {row.description || "No description provided"}
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
      width: '200px',
      minWidth: '200px',
      render: (value) => (
        <Box display="flex" alignItems="center" h="100%">
          <Tag variant="info">
            <Typography as="span" fontSize="12px" fontFamily="mono" color="#374151" fontWeight="500">
              {String(value || '')}
            </Typography>
          </Tag>
        </Box>
      ),
    },
    {
      field: 'requirements',
      header: 'Requirements',
      sortable: false,
      width: '280px',
      minWidth: '280px',
      render: (value, row) => {
        const reqNames = getRequirementNames(row.requirements);
        if (reqNames.length === 0) {
          return (
            <Box display="flex" alignItems="center" h="100%">
              <Typography fontSize="13px" color="#9CA3AF" fontStyle="italic">
                No requirements assigned
              </Typography>
            </Box>
          );
        }
        return (
          <VStack align="start" gap="6px" w="100%">
            <HStack gap="4px" wrap="wrap" maxW="100%">
              {reqNames.slice(0, 3).map((req, index) => (
                <Tag key={index} variant="info" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  {req}
                </Tag>
              ))}
              {reqNames.length > 3 && (
                <Tag variant="info" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  +{reqNames.length - 3} more
                </Tag>
              )}
            </HStack>
            <Typography fontSize="11px" color="#6B7280" fontWeight="500">
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
      width: '120px',
      minWidth: '120px',
      render: (value) => (
        <Box display="flex" alignItems="center" h="100%">
          <Tag variant={value ? "success" : "inactive"} style={{ fontWeight: '500' }}>
            {value ? "Active" : "Inactive"}
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
      render: (value, row) => {
        const entityType = row as unknown as EntityType;
        return (
          <Box display="flex" alignItems="center" justifyContent="center" h="100%" w="100%">
            <HStack gap="8px" justify="center" align="center">
              <Tooltip content="Edit entity type">
                <Link href={`/entity-types/edit/${entityType.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151',
                      transition: 'all 0.2s',
                      minWidth: '70px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F9FAFB';
                      e.currentTarget.style.borderColor = '#D1D5DB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <IconWrapper>
                      <FiEdit3 size={14} color="#374151" />
                    </IconWrapper>
                    <span>Edit</span>
                  </button>
                </Link>
              </Tooltip>
              <Tooltip content="Delete entity type">
                <button
                  onClick={() => handleDelete(entityType.id)}
                  disabled={deleting === entityType.id}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    background: deleting === entityType.id ? '#F3F4F6' : '#FFFFFF',
                    cursor: deleting === entityType.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: deleting === entityType.id ? '#9CA3AF' : '#DC2626',
                    transition: 'all 0.2s',
                    minWidth: '75px',
                    opacity: deleting === entityType.id ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (deleting !== entityType.id) {
                      e.currentTarget.style.background = '#FEF2F2';
                      e.currentTarget.style.borderColor = '#FECACA';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (deleting !== entityType.id) {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }
                  }}
                >
                  <IconWrapper>
                    <FiTrash2 size={14} color={deleting === entityType.id ? '#9CA3AF' : '#DC2626'} />
                  </IconWrapper>
                  <span>{deleting === entityType.id ? 'Deleting...' : 'Delete'}</span>
                </button>
              </Tooltip>
            </HStack>
          </Box>
        );
      },
    },
  ];

  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />
      <PortalHeader />
      <Box 
        ml={condensed ? "72px" : "280px"} 
        mt="90px" 
        minH="calc(100vh - 90px)" 
        width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"} 
        bg="gray.50" 
        overflowX="hidden" 
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        <VStack gap="4" align="stretch" w="100%">
          {/* Header */}
          <Container maxW="100%" px="8" py="6" width="full">
            <Flex justify="space-between" align="center" mb="4">
              <Box>
                <Typography fontSize="28px" fontWeight="600" color="#111827" mb="4px">
                  Entity Types
                </Typography>
                <Typography fontSize="14px" color="#6B7280">
                  Create and configure entity types for KYB applications
                </Typography>
              </Box>
              <Link href="/entity-types/create">
                <Button variant="primary" className="mukuru-primary-button">
                  <IconWrapper><FiPlus size={16} /></IconWrapper>
                  New Entity Type
                </Button>
              </Link>
            </Flex>
          </Container>

          {/* Error Display */}
          {error && (
            <Container maxW="100%" px="8" width="full">
              <AlertBar status="error" title="Error loading entity types" description={error} />
            </Container>
          )}

          {/* Search and Filters */}
          <Container maxW="100%" px="8" width="full">
            <VStack gap="4" align="stretch">
              <Box width="100%" maxW="800px">
                <Search
                  placeholder="Search by name, code, or description..."
                  onSearchChange={handleSearchChange}
                />
              </Box>
              
              <HStack gap="2" mb="2">
                <Button
                  variant={statusFilter === "all" ? "primary" : "secondary"}
                  className={statusFilter === "all" ? "mukuru-primary-button" : ""}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                  style={{
                    minWidth: '80px',
                    height: '36px',
                    fontWeight: '500',
                  }}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "active" ? "primary" : "secondary"}
                  className={statusFilter === "active" ? "mukuru-primary-button" : ""}
                  onClick={() => setStatusFilter("active")}
                  size="sm"
                  style={{
                    minWidth: '80px',
                    height: '36px',
                    fontWeight: '500',
                  }}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "primary" : "secondary"}
                  className={statusFilter === "inactive" ? "mukuru-primary-button" : ""}
                  onClick={() => setStatusFilter("inactive")}
                  size="sm"
                  style={{
                    minWidth: '80px',
                    height: '36px',
                    fontWeight: '500',
                  }}
                >
                  Inactive
                </Button>
              </HStack>
            </VStack>
          </Container>

          {/* DataTable */}
          <Container maxW="100%" px="8" py="8" width="full">
            <Box 
              className="work-queue-table-wrapper"
              bg="white"
              borderRadius="12px"
              border="1px solid #E5E7EB"
              overflow="hidden"
              boxShadow="sm"
            >
              <DataTable
                key={`entity-types-${statusFilter}-${searchQuery}-${refreshKey}`}
                data={filteredEntityTypes as unknown as Record<string, unknown>[]}
                columns={columns as unknown as ColumnConfig[]}
                emptyState={{
                  message: searchQuery || statusFilter !== "all" 
                    ? "No matching entity types found. Try adjusting your search criteria or filters."
                    : "No entity types yet. Get started by creating your first entity type."
                }}
              />
            </Box>
          </Container>
        </VStack>
      </Box>
    </Flex>
  );
}
