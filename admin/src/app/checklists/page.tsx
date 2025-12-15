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
      // TODO: Implement delete API call
      // await checklistApiService.deleteChecklist(id);
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
            <Button variant="primary" size="md">
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

        {/* Content Section */}
        <Box px="24px" py="16px" bg={bgColorNew}>
          {loading ? (
            <Flex justify="center" align="center" h="400px">
              <VStack gap="4">
                <Spinner size="xl" color="#F05423" />
                <Typography color="gray.600">Loading checklists...</Typography>
              </VStack>
            </Flex>
          ) : filteredChecklists.length === 0 ? (
            <Box
              bg={cardBgNew}
              borderRadius="8px"
              border="1px solid"
              borderColor={borderColorNew}
              p="16"
              minH="400px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <VStack gap="6" align="center" maxW="500px">
                <Box
                  p="8"
                  borderRadius="xl"
                  bg="#F9FAFB"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <IconWrapper>
                    <FiFileText size={56} color="#9CA3AF" />
                  </IconWrapper>
                </Box>
                <VStack gap="2" align="center">
                  <Typography
                    fontSize="20px"
                    fontWeight="600"
                    color="#111827"
                    textAlign="center"
                  >
                    No checklists found
                  </Typography>
                  <Typography color="#6B7280" fontSize="14px" textAlign="center">
                    {checklists.length === 0
                      ? 'Get started by creating your first checklist.'
                      : 'No checklists match your filters.'}
                  </Typography>
                </VStack>
                <Button variant="primary" size="md">
                  <IconWrapper>
                    <FiPlus size={16} />
                  </IconWrapper>
                  Create Checklist
                </Button>
              </VStack>
            </Box>
          ) : (
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
              gap="16px"
              width="full"
            >
              {filteredChecklists.map((checklist) => (
                <Card
                  key={checklist.id}
                  p="0"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  border="1px solid"
                  borderColor="#E5E7EB"
                  bg={cardBgNew}
                  borderRadius="8px"
                  overflow="hidden"
                  _hover={{
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    borderColor: '#F05423',
                    transform: 'translateY(-1px)',
                  }}
                  transition="all 0.2s ease"
                  cursor="pointer"
                  onClick={() => router.push(`/checklists/${checklist.id}`)}
                  position="relative"
                  height="100%"
                  display="flex"
                  flexDirection="column"
                >
                  {/* Top Border Accent */}
                  <Box
                    h="4px"
                    bg={checklist.isActive ? '#22C55E' : '#9CA3AF'}
                    width="100%"
                  />

                  <VStack gap="0" align="stretch" width="full" flex="1" p="6">
                    {/* Header Section */}
                    <VStack align="start" gap="3" mb="4" width="full">
                      <HStack gap="2" align="center" w="full" justify="space-between">
                        <HStack gap="2" align="center" flex="1" minW="0">
                          <Box
                            w="40px"
                            h="40px"
                            borderRadius="10px"
                            bg="#FFF4ED"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <IconWrapper>
                              <FiCheckSquare size={20} color="#F05423" />
                            </IconWrapper>
                          </Box>
                          <VStack align="start" gap="1" flex="1" minW="0">
                            <HStack gap="2" align="center" w="full">
                              <Typography
                                fontSize="16px"
                                fontWeight="600"
                                color="#111827"
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  width: '100%',
                                }}
                              >
                                {checklist.name}
                              </Typography>
                              {checklist.isActive && (
                                <Box
                                  w="8px"
                                  h="8px"
                                  borderRadius="full"
                                  bg="#22C55E"
                                  boxShadow="0 0 0 2px rgba(34, 197, 94, 0.2)"
                                  flexShrink={0}
                                />
                              )}
                            </HStack>
                            <Typography
                              fontSize="13px"
                              color="#6B7280"
                              lineHeight="1.5"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                width: '100%',
                              }}
                            >
                              {checklist.description}
                            </Typography>
                          </VStack>
                        </HStack>
                      </HStack>

                      {/* Tags */}
                      <HStack gap="2" flexWrap="wrap" width="full">
                        <Tag
                          variant={getEntityTypeColor(checklist.entityType)}
                          style={{
                            color: '#111827',
                            fontSize: '12px',
                            fontWeight: '500',
                            padding: '4px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          {checklist.entityType}
                        </Tag>
                        <Tag
                          variant={checklist.isActive ? 'success' : 'inactive'}
                          style={{
                            color: checklist.isActive ? '#111827' : '#6B7280',
                            fontSize: '12px',
                            fontWeight: '500',
                            padding: '4px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          {checklist.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                      </HStack>
                    </VStack>

                    {/* Stats Section */}
                    <Box
                      pt="4"
                      pb="4"
                      borderTop="1px solid"
                      borderColor="#E5E7EB"
                      width="full"
                    >
                      <HStack
                        gap="4"
                        justify="space-between"
                        align="center"
                        width="full"
                        flexWrap="wrap"
                      >
                        <VStack align="start" gap="1" flex="1" minW="0">
                          <HStack gap="1.5" align="center">
                            <IconWrapper>
                              <FiCheckSquare size={14} color="#6B7280" />
                            </IconWrapper>
                            <Typography fontSize="13px" color="#6B7280" fontWeight="500">
                              <strong style={{ color: '#111827', fontWeight: '600' }}>
                                {checklist.items.length}
                              </strong>{' '}
                              items
                            </Typography>
                          </HStack>
                          <HStack gap="1.5" align="center" ml="5">
                            <IconWrapper>
                              <FiCheckSquare size={14} color="#F05423" />
                            </IconWrapper>
                            <Typography fontSize="13px" color="#6B7280" fontWeight="500">
                              <strong style={{ color: '#111827', fontWeight: '600' }}>
                                {checklist.items.filter((item) => item.isRequired).length}
                              </strong>{' '}
                              required
                            </Typography>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>

                    {/* Footer Section */}
                    <Box
                      pt="4"
                      borderTop="1px solid"
                      borderColor="#E5E7EB"
                      width="full"
                      mt="auto"
                    >
                      <HStack justify="space-between" align="center" width="full">
                        <HStack gap="1.5" align="center" fontSize="12px" color="#9CA3AF">
                          <IconWrapper>
                            <FiClock size={12} color="#9CA3AF" />
                          </IconWrapper>
                          <Typography fontSize="12px" color="#9CA3AF" fontWeight="400">
                            {(() => {
                              try {
                                const date = new Date(checklist.lastUpdated);
                                if (isNaN(date.getTime())) {
                                  return 'N/A';
                                }
                                return date.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                });
                              } catch {
                                return 'N/A';
                              }
                            })()}
                          </Typography>
                        </HStack>
                        <HStack gap="2" flexShrink={0}>
                          <Link
                            href={`/checklists/${checklist.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="secondary"
                              className="mukuru-secondary-button"
                              style={{
                                padding: '6px 12px',
                                height: '28px',
                                fontSize: '12px',
                                fontWeight: '500',
                              }}
                            >
                              <IconWrapper>
                                <FiEdit size={12} />
                              </IconWrapper>
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(checklist.id, checklist.name);
                            }}
                            disabled={deleting === checklist.id}
                            _hover={{ bg: '#FEF2F2' }}
                            style={{
                              color: deleting === checklist.id ? '#9CA3AF' : '#DC2626',
                              padding: '6px',
                              height: '28px',
                              minWidth: '28px',
                            }}
                          >
                            <IconWrapper>
                              <FiTrash2
                                size={14}
                                color={deleting === checklist.id ? '#9CA3AF' : '#DC2626'}
                              />
                            </IconWrapper>
                          </Button>
                        </HStack>
                      </HStack>
                    </Box>
                  </VStack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Box>
    </Box>
  );
}
