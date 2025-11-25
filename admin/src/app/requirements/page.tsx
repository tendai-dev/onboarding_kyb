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
import { FiCheckSquare, FiPlus, FiEdit3, FiTrash2, FiX } from "react-icons/fi";
import AdminSidebar from "../../components/AdminSidebar";
import PortalHeader from "../../components/PortalHeader";
import { useSidebar } from "../../contexts/SidebarContext";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { entityConfigApiService, Requirement } from "../../services/entityConfigApi";
import { SweetAlert } from "../../utils/sweetAlert";

export default function KYBRequirementsPage() {
  const { condensed } = useSidebar();
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
      console.log('[Requirements Page] Loading requirements with filters:', {
        status: statusFilter,
        search: searchQuery,
      });
      const requirementsData = await entityConfigApiService.getRequirements(false);
      console.log('[Requirements Page] Requirements loaded:', requirementsData.length);
      // Log a sample requirement to check fieldType
      if (requirementsData.length > 0) {
        console.log('[Requirements Page] Sample requirement:', {
          code: requirementsData[0].code,
          fieldType: requirementsData[0].fieldType,
          type: requirementsData[0].type
        });
      }
      setRequirements(requirementsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load requirements';
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
      setRequirements(prev => prev.filter(req => req.id !== id));
      setRefreshKey(prev => prev + 1);
      
      SweetAlert.close();
      SweetAlert.success('Deleted!', 'Requirement has been deleted successfully.');
    } catch (err) {
      SweetAlert.close();
      SweetAlert.error('Delete Failed', 'Failed to delete requirement. Please try again.');
      console.error('Error deleting requirement:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredRequirements = requirements.filter(requirement => {
    // Status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
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

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  // Design system tokens
  const tokens = {
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "12px",
      lg: "16px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "32px",
    },
    colors: {
      text: {
        primary: "#111827",
        secondary: "#374151",
        tertiary: "#6B7280",
      },
      border: {
        default: "#E5E7EB",
        hover: "#D1D5DB",
        focus: "#3B82F6",
      },
      bg: {
        white: "#FFFFFF",
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
        },
      },
    },
    typography: {
      heading: {
        size: "28px",
        weight: "600",
        lineHeight: "1.2",
        letterSpacing: "-0.02em",
      },
      section: {
        size: "16px",
        weight: "600",
        lineHeight: "1.4",
        letterSpacing: "-0.01em",
      },
      label: {
        size: "13px",
        weight: "500",
      },
      body: {
        size: "14px",
        weight: "400",
      },
      helper: {
        size: "12px",
        weight: "400",
      },
    },
    form: {
      inputHeight: "40px",
      borderRadius: "8px",
      cardRadius: "12px",
      cardPadding: "16px",
      fieldGap: "8px",
      labelInputGap: "4px",
      helperGap: "2px",
      sectionGap: "16px",
      fieldVerticalPadding: "4px",
    },
  };

  // Define columns for DataTable
  const columns: ColumnConfig<Requirement>[] = [
    {
      field: 'displayName',
      header: 'Requirement',
      sortable: true,
      minWidth: '250px',
      render: (value, row) => (
        <VStack align="start" gap="4px">
          <Typography fontSize="14px" fontWeight="500" color="#111827">
            {row.displayName}
          </Typography>
          <Typography 
            fontSize="12px" 
            color="#6B7280"
            maxW="300px"
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
      ),
    },
    {
      field: 'code',
      header: 'Code',
      sortable: true,
      minWidth: '150px',
      render: (value) => (
        <Typography fontSize="14px" fontFamily="mono" color="#374151">
          {String(value || '')}
        </Typography>
      ),
    },
    {
      field: 'type',
      header: 'Type',
      sortable: true,
      minWidth: '120px',
      render: (value) => (
        <Tag variant="info">{String(value || '')}</Tag>
      ),
    },
    {
      field: 'fieldType',
      header: 'Field Type',
      sortable: true,
      minWidth: '120px',
      render: (value, row) => {
        // Try multiple possible field names
        const fieldType = (row as any).fieldType || (row as any).field_type || value;
        return fieldType ? (
          <Tag variant="info" style={{ fontSize: '12px', padding: '4px 8px' }}>
            {String(fieldType)}
          </Tag>
      ) : (
        <Typography fontSize="14px" color="#6B7280">-</Typography>
        );
      },
    },
    {
      field: 'isActive',
      header: 'Status',
      sortable: true,
      minWidth: '100px',
      render: (value) => (
        <Tag variant={value ? "success" : "inactive"}>
          {value ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      field: 'id',
    header: 'Actions',
      sortable: false,
    width: '150px',
      minWidth: '150px',
      render: (value, row) => {
      const requirement = row as unknown as Requirement;
      return (
          <Box display="flex" alignItems="center" justifyContent="center" h="100%" w="100%">
            <HStack gap="6px" justify="center" align="center">
        <Tooltip content="Edit requirement">
                <Link href={`/requirements/edit/${requirement.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  KYB Requirements
                </Typography>
                <Typography fontSize="14px" color="#6B7280">
                  Define and manage requirements for business verification
                </Typography>
              </Box>
              <Link href="/requirements/create">
                <Button variant="primary" className="mukuru-primary-button">
                  <IconWrapper><FiPlus size={16} /></IconWrapper>
                  New Requirement
                </Button>
              </Link>
            </Flex>
          </Container>

          {/* Error Display */}
          {error && (
            <Container maxW="100%" px="8" width="full">
              <AlertBar status="error" title="Error loading requirements" description={error} />
            </Container>
          )}

          {/* Search and Filters */}
          <Container maxW="100%" px="8" width="full">
            <VStack gap="4" align="stretch">
              <Box width="100%" maxW="800px">
                <Search
                  placeholder="Search by name, code, description, or type..."
                  onSearchChange={handleSearchChange}
                />
              </Box>
              
              <HStack gap="2" mb="2">
                <Button
                  variant="primary"
                  className="mukuru-primary-button"
                  onClick={() => setStatusFilter("all")}
                  style={{ opacity: statusFilter === "all" ? 1 : 0.7 }}
                >
                  All
                </Button>
                <Button
                  variant="primary"
                  className="mukuru-primary-button"
                  onClick={() => setStatusFilter("active")}
                  style={{ opacity: statusFilter === "active" ? 1 : 0.7 }}
                >
                  Active
                </Button>
                <Button
                  variant="primary"
                  className="mukuru-primary-button"
                  onClick={() => setStatusFilter("inactive")}
                  style={{ opacity: statusFilter === "inactive" ? 1 : 0.7 }}
                >
                  Inactive
                </Button>
              </HStack>
            </VStack>
          </Container>

          {/* DataTable */}
          <Container maxW="100%" px="8" py="8" width="full">
            <Box className="work-queue-table-wrapper">
              <DataTable
                key={`requirements-${statusFilter}-${searchQuery}-${refreshKey}`}
                data={filteredRequirements as unknown as Record<string, unknown>[]}
                columns={columns as unknown as ColumnConfig[]}
                emptyState={{
                  message: searchQuery || statusFilter !== "all" 
                    ? "No matching requirements found. Try adjusting your search criteria or filters."
                    : "No requirements yet. Get started by creating your first requirement."
                }}
              />
            </Box>
          </Container>
        </VStack>
      </Box>
    </Flex>
  );
}
