"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Flex,
  Spinner,
  SimpleGrid
} from "@chakra-ui/react";
import { Search, Typography, Button, Tag, IconWrapper, Dropdown, Card, AlertBar } from "@/lib/mukuruImports";
import { 
  FiCheckSquare, 
  FiPlus, 
  FiEdit,
  FiTrash2,
  FiFileText,
  FiClock,
  FiUser,
  FiArrowRight
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { SweetAlert } from "../../utils/sweetAlert";
import AdminSidebar from "../../components/AdminSidebar";
import PortalHeader from "../../components/PortalHeader";
import { useSidebar } from "../../contexts/SidebarContext";
import { checklistApiService } from "../../services/checklistApi";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  { value: "ALL", label: "All Entity Types" },
  { value: "Private Company", label: "Private Company" },
  { value: "NPO", label: "NPO" },
  { value: "Government", label: "Government" },
  { value: "Publicly Listed", label: "Publicly Listed" }
];

export default function ChecklistsPage() {
  const { condensed } = useSidebar();
  const router = useRouter();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checklistApiService.getAllChecklists();
      console.log('[ChecklistsPage] Loaded checklists:', data);
      console.log('[ChecklistsPage] Entity types:', data.map(c => ({ id: c.id, name: c.name, entityType: c.entityType })));
      setChecklists(data);
    } catch (err) {
      console.error("Failed to load checklists:", err);
      setError(err instanceof Error ? err.message : "Failed to load checklists. Please ensure the backend services are running.");
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'Private Company': return 'info';
      case 'NPO': return 'success';
      case 'Government': return 'warning';
      case 'Publicly Listed': return 'danger';
      default: return 'info';
    }
  };

  const filteredChecklists = checklists.filter(checklist => {
    const matchesSearch = checklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         checklist.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = entityFilter === "ALL" || checklist.entityType === entityFilter;
    return matchesSearch && matchesEntity;
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
      setChecklists(prev => prev.filter(c => c.id !== id));
      SweetAlert.close();
      await SweetAlert.success('Deleted!', 'Checklist has been deleted successfully.');
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete checklist';
      setError(errorMessage);
      console.error('Error deleting checklist:', err);
      await SweetAlert.error('Delete Failed', errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box 
          ml={condensed ? "72px" : "280px"} 
          mt="90px"
          minH="calc(100vh - 90px)"
          width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
          bg="gray.50"
          transition="margin-left 0.3s ease, width 0.3s ease"
        >
          <PortalHeader />
          <Flex justify="center" align="center" h="400px">
            <VStack gap="4">
              <Spinner size="xl" color="#F05423" />
              <Typography color="gray.600">Loading checklists...</Typography>
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
        ml={condensed ? "72px" : "280px"} 
        mt="90px" 
        minH="calc(100vh - 90px)" 
        width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"} 
        bg="gray.50" 
        overflowX="hidden" 
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        <VStack gap="6" align="stretch" w="100%" pb="8">
          {/* Header */}
          <Box px="8" pt="6" width="full" bg="gray.50">
            <Container maxW="1400px" mx="auto" px="0" width="full">
              <Flex justify="space-between" align="center" width="full">
                <VStack align="start" gap="1">
                  <Typography fontSize="32px" fontWeight="700" color="#111827" letterSpacing="-0.02em">
                    Checklists
                  </Typography>
                  <Typography fontSize="15px" color="#6B7280" fontWeight="400">
                    Manage entity-specific onboarding checklists
                  </Typography>
                </VStack>
                <Button 
                  variant="primary" 
                  className="mukuru-primary-button"
                  size="md"
                  fontWeight="600"
                  style={{
                    padding: '10px 20px',
                    height: '40px'
                  }}
                >
                  <IconWrapper><FiPlus size={18} /></IconWrapper>
                  New Checklist
                </Button>
              </Flex>
            </Container>
          </Box>

          {/* Error Display */}
          {error && (
            <Box px="8" width="full">
              <Container maxW="1400px" mx="auto" px="0" width="full">
                <AlertBar status="error" title="Error loading checklists" description={error} />
              </Container>
            </Box>
          )}

          {/* Search and Filters */}
          <Box px="8" width="full">
            <Container maxW="1400px" mx="auto" px="0" width="full">
              <Card 
                p="6" 
                boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                border="1px solid" 
                borderColor="#E5E7EB" 
                width="full" 
                bg="white"
                borderRadius="12px"
              >
                <HStack gap="4" align="flex-end" width="full">
                  <Box flex="1" minW="0">
                    <Search
                      placeholder="Search checklists by name or description..."
                      onSearchChange={setSearchTerm}
                    />
                  </Box>
                  <Box minW="240px" maxW="300px" flexShrink={0}>
                    <Dropdown
                      label="Entity Type"
                      placeholder="All Entity Types"
                      items={entityTypeOptions.map(opt => ({
                        label: opt.label,
                        value: opt.value
                      }))}
                      defaultValue={entityFilter}
                      onSelectionChange={(value) => setEntityFilter(value as string)}
                    />
                  </Box>
                </HStack>
              </Card>
            </Container>
          </Box>

          {/* Checklists Grid */}
          <Box px="8" width="full" flex="1">
            <Container maxW="1400px" mx="auto" px="0" width="full">
            {filteredChecklists.length === 0 ? (
              <Card 
                p="16" 
                boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                border="1px solid" 
                borderColor="#E5E7EB" 
                width="full" 
                bg="white" 
                minH="500px" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                borderRadius="12px"
              >
                <VStack gap="6" align="center" width="full" py="8">
                  <Box
                    p="10"
                    borderRadius="2xl"
                    bg="linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    border="1px solid"
                    borderColor="#E5E7EB"
                    boxShadow="inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)"
                  >
                    <IconWrapper><FiFileText size={72} color="#9CA3AF" /></IconWrapper>
                  </Box>
                  <VStack gap="3" align="center" maxW="600px" width="full" px="4">
                    <Typography fontSize="24px" fontWeight="700" color="#111827" textAlign="center" letterSpacing="-0.01em">
                      No checklists found
                    </Typography>
                    <Typography color="#6B7280" fontSize="15px" textAlign="center" lineHeight="1.6" width="full" fontWeight="400">
                      {checklists.length === 0 
                        ? "Get started by creating your first checklist to manage entity-specific onboarding requirements and streamline your workflow."
                        : "No checklists match your search criteria. Try adjusting your filters or search terms."}
                    </Typography>
                  </VStack>
                  <Button 
                    variant="primary" 
                    size="md" 
                    mt="2" 
                    fontWeight="600" 
                    className="mukuru-primary-button"
                    style={{
                      padding: '10px 24px',
                      height: '44px'
                    }}
                  >
                    <IconWrapper><FiPlus size={18} /></IconWrapper>
                    Create Your First Checklist
                  </Button>
                </VStack>
              </Card>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} gap="6" width="full">
                {filteredChecklists.map((checklist) => (
                  <Card
                    key={checklist.id}
                    p="0"
                    boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                    border="1px solid"
                    borderColor="#E5E7EB"
                    bg="white"
                    borderRadius="12px"
                    overflow="hidden"
                    _hover={{
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      borderColor: "#F05423",
                      transform: "translateY(-2px)"
                    }}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
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
                      bg={checklist.isActive ? "#22C55E" : "#9CA3AF"}
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
                                    width: '100%'
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
                                  width: '100%'
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
                              borderRadius: '6px'
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
                              borderRadius: '6px'
                            }}
                          >
                            {checklist.isActive ? "Active" : "Inactive"}
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
                        <HStack gap="4" justify="space-between" align="center" width="full" flexWrap="wrap">
                          <VStack align="start" gap="1" flex="1" minW="0">
                            <HStack gap="1.5" align="center">
                              <IconWrapper><FiCheckSquare size={14} color="#6B7280" /></IconWrapper>
                              <Typography fontSize="13px" color="#6B7280" fontWeight="500">
                                <strong style={{ color: '#111827', fontWeight: '600' }}>{checklist.items.length}</strong> items
                              </Typography>
                            </HStack>
                            <HStack gap="1.5" align="center" ml="5">
                              <IconWrapper><FiCheckSquare size={14} color="#F05423" /></IconWrapper>
                              <Typography fontSize="13px" color="#6B7280" fontWeight="500">
                                <strong style={{ color: '#111827', fontWeight: '600' }}>{checklist.items.filter(item => item.isRequired).length}</strong> required
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
                            <IconWrapper><FiClock size={12} color="#9CA3AF" /></IconWrapper>
                            <Typography fontSize="12px" color="#9CA3AF" fontWeight="400">
                              {(() => {
                                try {
                                  const date = new Date(checklist.lastUpdated);
                                  if (isNaN(date.getTime())) {
                                    return 'N/A';
                                  }
                                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                } catch {
                                  return 'N/A';
                                }
                              })()}
                            </Typography>
                          </HStack>
                          <HStack gap="2" flexShrink={0}>
                            <Link href={`/checklists/${checklist.id}`} onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="mukuru-secondary-button"
                                style={{
                                  padding: '6px 12px',
                                  height: '28px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                <IconWrapper><FiEdit size={12} /></IconWrapper>
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
                              _hover={{ bg: "#FEF2F2" }}
                              style={{ 
                                color: deleting === checklist.id ? "#9CA3AF" : "#DC2626",
                                padding: '6px',
                                height: '28px',
                                minWidth: '28px'
                              }}
                            >
                              <IconWrapper>
                                <FiTrash2 size={14} color={deleting === checklist.id ? "#9CA3AF" : "#DC2626"} />
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
            </Container>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
}
