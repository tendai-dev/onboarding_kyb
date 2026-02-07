'use client';

import { Box, VStack, HStack, Flex, Spinner, SimpleGrid } from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Search,
  Typography,
  Button,
  Tag,
  IconWrapper,
  Dropdown,
  Card,
  AlertBar,
  DataTable,
  Tooltip,
} from '@mukuru/mukuru-react-components';
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
  FiCheckSquare,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiClock,
  FiEdit,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SweetAlert } from '../../utils/sweetAlert';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import { checklistApiService } from '../../services/checklistApi';
import Link from 'next/link';

interface Checklist {
  id: string;
  name: string;
  entityType: string;
  description: string;
  items: ChecklistItem[];
  lastUpdated: string;
  isActive: boolean;
  version: string;
  createdBy: string;
}

interface ChecklistItem {
  id: string;
  description: string;
  isRequired: boolean;
  category: string;
  order: number;
  guidelines?: string;
}

const entityTypeOptions = [
  { value: 'ALL', label: 'All Entity Types' },
  { value: 'Private Company', label: 'Private Company' },
  { value: 'NPO', label: 'NPO' },
  { value: 'Government', label: 'Government' },
  { value: 'Publicly Listed', label: 'Publicly Listed' },
];

export default function ChecklistsPage() {
  const router = useRouter();
  const { condensed } = useSidebar();

  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const headerBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Mukuru theme colors (matching work-queue page)
  const bgColorNew = 'mukuru.grey.100';
  const cardBgNew = 'mukuru.white';
  const borderColorNew = 'mukuru.stroke';

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checklistApiService.getAllChecklists();
      console.info('[ChecklistsPage] Loaded checklists:', data);
      console.info(
        '[ChecklistsPage] Entity types:',
        data.map((c) => ({ id: c.id, name: c.name, entityType: c.entityType }))
      );
      setChecklists(data);
    } catch (err) {
      console.error('Failed to load checklists:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load checklists. Please ensure the backend services are running.'
      );
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'Private Company':
        return 'info';
      case 'NPO':
        return 'success';
      case 'Government':
        return 'warning';
      case 'Publicly Listed':
        return 'danger';
      default:
        return 'info';
    }
  };

  const filteredChecklists = checklists.filter((checklist) => {
    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      if (checklist.isActive !== isActive) return false;
    }
    // Entity filter
    const matchesEntity = entityFilter === 'ALL' || checklist.entityType === entityFilter;
    if (!matchesEntity) return false;
    // Search filter
    if (!searchTerm) return true;
    const matchesSearch =
      checklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = async (id: string, name: string) => {
    const result = await SweetAlert.confirm(
      'Delete Checklist',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      'Yes, delete it!',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    try {
      setDeleting(id);
      SweetAlert.loading('Deleting...', 'Please wait while we delete the checklist.');
      await checklistApiService.deleteChecklist(id);
      setChecklists((prev) => prev.filter((c) => c.id !== id));
      SweetAlert.close();
      await SweetAlert.success('Deleted!', 'Checklist has been deleted successfully.');
    } catch (err) {
      SweetAlert.close();
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete checklist';
      setError(errorMessage);
      console.error('Error deleting checklist:', err);
      await SweetAlert.error('Delete Failed', errorMessage);
    } finally {
      setDeleting(null);
    }
  };

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
                Checklists
              </Typography>
              <Typography fontSize="14px" color="mukuru.grey.600">
                Manage entity-specific onboarding checklists
              </Typography>
            </VStack>
            <Button 
              variant="primary" 
              size="md"
              onClick={() => router.push('/checklists/create')}
            >
              <IconWrapper>
                <FiPlus size={16} />
              </IconWrapper>
              New Checklist
            </Button>
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
            onValueChange={(details) =>
              setStatusFilter(details.value as 'all' | 'active' | 'inactive')
            }
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

        {/* Search and Entity Filter Row */}
        <Box
          px="24px"
          py="12px"
          bg={cardBgNew}
          borderBottom="1px solid"
          borderColor={borderColorNew}
        >
          <HStack gap="16px" align="center">
            <Box maxW="400px" flex="1">
              <Search placeholder="Search checklists..." onSearchChange={setSearchTerm} />
            </Box>
            <Box minW="200px">
              <Dropdown
                placeholder="All Entity Types"
                items={entityTypeOptions.map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                }))}
                defaultValue={entityFilter}
                onSelectionChange={(value) => setEntityFilter(value as string)}
              />
            </Box>
          </HStack>
        </Box>

        {/* Table Section - Like Requirements Page */}
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
            <Flex justify="center" align="center" h="400px">
              <VStack gap="4">
                <Spinner size="xl" color="#F05423" />
                <Typography color="gray.600">Loading checklists...</Typography>
              </VStack>
            </Flex>
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
              className="checklists-table-card"
            >
              <style>{`
                .checklists-table-card table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  table-layout: auto !important;
                }
                .checklists-table-card thead {
                  background: #FAFAFA !important;
                }
                .checklists-table-card th {
                  font-size: 11px !important;
                  font-weight: 600 !important;
                  padding: 14px 16px !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  color: #666 !important;
                  border-bottom: 1px solid #E0E0E0 !important;
                  white-space: nowrap !important;
                }
                .checklists-table-card td {
                  padding: 12px 16px !important;
                  vertical-align: middle !important;
                  border-bottom: 1px solid #F3F4F6 !important;
                }
                .checklists-table-card tr:hover td {
                  background: #F9FAFB !important;
                }
              `}</style>
              <DataTable
                data={filteredChecklists as unknown as Record<string, unknown>[]}
                columns={[
                  {
                    field: 'name',
                    header: 'Checklist',
                    sortable: true,
                    width: '30%',
                    render: (value, row) => {
                      const checklist = row as unknown as Checklist;
                      return (
                        <VStack align="start" gap="2px">
                          <Typography fontSize="13px" fontWeight="500" color={textColor}>
                            {checklist.name}
                          </Typography>
                          <Typography fontSize="11px" color="#6B7280">
                            {checklist.description || 'No description'}
                          </Typography>
                        </VStack>
                      );
                    },
                  },
                  {
                    field: 'entityType',
                    header: 'Entity Type',
                    sortable: true,
                    width: '15%',
                    render: (value, row) => {
                      const checklist = row as unknown as Checklist;
                      return (
                        <Tag variant={getEntityTypeColor(checklist.entityType)} style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {String(value)}
                        </Tag>
                      );
                    },
                  },
                  {
                    field: 'items',
                    header: 'Items',
                    sortable: false,
                    width: '10%',
                    render: (value, row) => {
                      const checklist = row as unknown as Checklist;
                      return (
                        <Typography fontSize="13px" color={textColor}>
                          {checklist.items.length}
                        </Typography>
                      );
                    },
                  },
                  {
                    field: 'items',
                    header: 'Required',
                    sortable: false,
                    width: '10%',
                    render: (value, row) => {
                      const checklist = row as unknown as Checklist;
                      return (
                        <Typography fontSize="13px" color="#F05423" fontWeight="500">
                          {checklist.items.filter((item) => item.isRequired).length}
                        </Typography>
                      );
                    },
                  },
                  {
                    field: 'isActive',
                    header: 'Status',
                    sortable: true,
                    width: '10%',
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
                    render: (value, row) => {
                      const checklist = row as unknown as Checklist;
                      return (
                        <HStack gap="6px" justify="center">
                          <Tooltip content="View checklist">
                            <Link href={`/checklists/${checklist.id}`}>
                              <button
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  border: '1px solid #E5E7EB',
                                  background: 'white',
                                  cursor: 'pointer',
                                }}
                              >
                                <FiEdit size={16} color="#374151" />
                              </button>
                            </Link>
                          </Tooltip>
                          <Tooltip content="Delete checklist">
                            <button
                              onClick={() => handleDelete(checklist.id, checklist.name)}
                              disabled={deleting === checklist.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: '1px solid #E5E7EB',
                                background: 'white',
                                cursor: deleting === checklist.id ? 'not-allowed' : 'pointer',
                                opacity: deleting === checklist.id ? 0.5 : 1,
                              }}
                            >
                              <FiTrash2 size={16} color="#DC2626" />
                            </button>
                          </Tooltip>
                        </HStack>
                      );
                    },
                  },
                ]}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
