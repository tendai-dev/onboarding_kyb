"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Flex,
  Spinner,
  Textarea,
  Checkbox as ChakraCheckbox
} from "@chakra-ui/react";
import { Typography, Button, Tag, Input, IconWrapper, Card, AlertBar } from "@/lib/mukuruImports";
import { 
  FiCheckSquare, 
  FiEdit,
  FiTrash2,
  FiFileText,
  FiDownload,
  FiPlus,
  FiClock,
  FiUser,
  FiArrowLeft
} from "react-icons/fi";
import { useState, useEffect, use } from "react";
import { SweetAlert } from "../../../utils/sweetAlert";
import AdminSidebar from "../../../components/AdminSidebar";
import PortalHeader from "../../../components/PortalHeader";
import { useSidebar } from "../../../contexts/SidebarContext";
import { checklistApiService } from "../../../services/checklistApi";
import { useRouter } from "next/navigation";
import { logger } from "../../../lib/logger";

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

export default function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { condensed } = useSidebar();
  const router = useRouter();
  const { id } = use(params);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    description: "",
    category: "",
    isRequired: false,
    guidelines: ""
  });

  useEffect(() => {
    if (id) {
      loadChecklist();
    }
  }, [id]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      setError(null);
      const allChecklists = await checklistApiService.getAllChecklists();
      logger.debug('[ChecklistDetailPage] All checklists loaded', { count: allChecklists.length });
      const found = allChecklists.find(c => c.id === id);
      if (found) {
        logger.debug('[ChecklistDetailPage] Found checklist', { 
          id: found.id, 
          itemCount: found.items.length 
        });
        logger.debug('[ChecklistDetailPage] Items', { items: found.items });
        setChecklist(found);
      } else {
        logger.error(new Error('Checklist not found'), '[ChecklistDetailPage] Checklist not found', {
          tags: { error_type: 'checklist_not_found' },
          extra: { 
            id, 
            availableIds: allChecklists.map(c => c.id) 
          }
        });
        setError("Checklist not found");
      }
    } catch (err) {
      logger.error(err, "Failed to load checklist", {
        tags: { error_type: 'checklist_load_error' }
      });
      setError(err instanceof Error ? err.message : "Failed to load checklist. Please ensure the backend services are running.");
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

  const addNewItem = async () => {
    if (!newItem.description || !newItem.category) {
      await SweetAlert.warning('Validation Error', 'Please fill in description and category');
      return;
    }

    if (!checklist) return;

    const item: ChecklistItem = {
      id: `ITEM-${Date.now()}`,
      description: newItem.description,
      category: newItem.category,
      isRequired: newItem.isRequired,
      order: checklist.items.length + 1,
      guidelines: newItem.guidelines
    };

    setChecklist(prev => prev ? {
      ...prev,
      items: [...prev.items, item],
      lastUpdated: new Date().toISOString()
    } : null);

    setNewItem({ description: "", category: "", isRequired: false, guidelines: "" });
    await SweetAlert.success('Item Added', 'The new item has been added to the checklist.');
  };

  const removeItem = async (itemId: string) => {
    if (!checklist) return;

    const result = await SweetAlert.confirm(
      'Remove Item',
      'Are you sure you want to remove this item from the checklist?',
      'Yes, remove it',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    setChecklist(prev => prev ? {
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
      lastUpdated: new Date().toISOString()
    } : null);

    await SweetAlert.success('Item Removed', 'The item has been removed from the checklist.');
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
              <Typography color="gray.600">Loading checklist...</Typography>
            </VStack>
          </Flex>
        </Box>
      </Flex>
    );
  }

  if (error || !checklist) {
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
          <Container maxW="100%" px="8" py="8">
            <AlertBar status="error" title="Error loading checklist" description={error || "Checklist not found"} />
            <Button
              variant="secondary"
              mt="4"
              onClick={() => router.push("/checklists")}
              className="mukuru-secondary-button"
            >
              <IconWrapper><FiArrowLeft size={16} /></IconWrapper>
              Back to Checklists
            </Button>
          </Container>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50" direction="column">
      <AdminSidebar />
      <PortalHeader />
      
      {/* Main Content Area - Scrollable */}
      <Box 
        ml={condensed ? "72px" : "280px"} 
        mt="90px"
        width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
        bg="gray.50"
        overflowY="auto"
        overflowX="hidden"
        transition="margin-left 0.3s ease, width 0.3s ease"
        minH="calc(100vh - 90px)"
        maxH="calc(100vh - 90px)"
      >
        {/* Sticky Header */}
        <Box 
          bg="white" 
          borderBottom="1px solid" 
          borderColor="#E5E7EB" 
          py="4"
          position="sticky"
          top="0"
          zIndex="10"
          boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1)"
          width="100%"
        >
          <Container maxW="1200px" px="6" mx="auto" width="full">
            <VStack align="start" gap="3" w="100%">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/checklists")}
                className="mukuru-secondary-button"
                style={{
                  padding: '6px 12px',
                  minWidth: '80px',
                  height: '32px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontWeight: '500',
                  fontSize: '13px',
                  borderRadius: '6px'
                }}
              >
                <IconWrapper><FiArrowLeft size={13} /></IconWrapper>
                Back
              </Button>
              
              <Flex justify="space-between" align="start" width="full" gap="4" flexWrap={{ base: "wrap", lg: "nowrap" }}>
                <VStack align="start" gap="2" flex="1" minW="0">
                  <HStack gap="2" align="center" width="full" flexWrap="wrap">
                    <Typography fontSize="24px" fontWeight="700" color="#111827" letterSpacing="-0.01em" lineHeight="1.3">
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
                  
                  <Typography fontSize="14px" color="#6B7280" lineHeight="1.5" fontWeight="400">
                    {checklist.description}
                  </Typography>
                  
                  <HStack gap="2" flexWrap="wrap">
                    <Tag 
                      variant={getEntityTypeColor(checklist.entityType)} 
                      style={{ 
                        color: '#111827',
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {checklist.entityType}
                    </Tag>
                    <Tag 
                      variant={checklist.isActive ? 'success' : 'inactive'} 
                      style={{ 
                        color: checklist.isActive ? '#111827' : '#6B7280',
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {checklist.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </HStack>
                  
                  <HStack gap="4" fontSize="13px" color="#6B7280" flexWrap="wrap" pt="0">
                    <HStack gap="1" align="center">
                      <Typography fontSize="13px" color="#6B7280" fontWeight="500">
                        Version: <strong style={{ color: '#111827', fontWeight: '600' }}>{checklist.version || '1.0'}</strong>
                      </Typography>
                    </HStack>
                    <HStack gap="1" align="center">
                      <IconWrapper><FiCheckSquare size={13} color="#6B7280" /></IconWrapper>
                      <Typography fontSize="13px" color="#6B7280" fontWeight="500">
                        Items: <strong style={{ color: '#111827', fontWeight: '600' }}>{checklist.items.length}</strong>
                      </Typography>
                    </HStack>
                    <HStack gap="1" align="center">
                      <IconWrapper><FiCheckSquare size={13} color="#F05423" /></IconWrapper>
                      <Typography fontSize="13px" color="#6B7280" fontWeight="500">
                        Required: <strong style={{ color: '#111827', fontWeight: '600' }}>{checklist.items.filter(item => item.isRequired).length}</strong>
                      </Typography>
                    </HStack>
                    <HStack gap="1" align="center">
                      <IconWrapper><FiClock size={13} color="#6B7280" /></IconWrapper>
                      <Typography fontSize="13px" color="#6B7280" fontWeight="500">
                        Updated: <strong style={{ color: '#111827', fontWeight: '600' }}>
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
                        </strong>
                      </Typography>
                    </HStack>
                  </HStack>
                </VStack>
                
                <HStack gap="2" flexShrink={0} align="start">
                  <Button
                    variant="secondary"
                    size="sm"
                    fontWeight="600"
                    className="mukuru-secondary-button"
                    style={{
                      padding: '8px 16px',
                      height: '36px',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <IconWrapper><FiDownload size={14} /></IconWrapper>
                    Export
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fontWeight="600"
                    className="mukuru-primary-button"
                    style={{
                      padding: '8px 16px',
                      height: '36px',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <IconWrapper><FiEdit size={14} /></IconWrapper>
                    Edit
                  </Button>
                </HStack>
              </Flex>
            </VStack>
          </Container>
        </Box>

        {/* Scrollable Main Content */}
        <Box 
          width="100%"
          py="6"
          px="0"
          minH="auto"
        >
          <Container maxW="1200px" px="6" mx="auto" width="full">
            <VStack gap="4" align="stretch" width="full" pb="6" minH="auto">
              {/* Checklist Items */}
              <Card 
                p="0" 
                boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                border="1px solid" 
                borderColor="#E5E7EB" 
                width="full" 
                bg="white"
                borderRadius="10px"
                overflow="visible"
                minH="auto"
              >
                <Box 
                  p="4" 
                  borderBottom="1px solid" 
                  borderColor="#E5E7EB" 
                  bg="white"
                  width="100%"
                >
                  <HStack justify="space-between" align="center" width="full" flexWrap="wrap" gap="2">
                    <Typography fontSize="16px" fontWeight="700" color="#111827" letterSpacing="-0.01em">
                      Checklist Items
                    </Typography>
                    <Tag 
                      variant="info" 
                      style={{ 
                        color: '#111827',
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        whiteSpace: 'nowrap',
                        height: '22px'
                      }}
                    >
                      {checklist.items.length} {checklist.items.length === 1 ? 'item' : 'items'}
                    </Tag>
                  </HStack>
                </Box>
                
                <Box p="4" bg="white" width="100%">
                  {checklist.items.length === 0 ? (
                    <VStack gap="3" align="center" py="16">
                      <Box
                        p="6"
                        borderRadius="xl"
                        bg="linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        border="1px solid"
                        borderColor="#E5E7EB"
                        boxShadow="inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)"
                      >
                        <IconWrapper><FiCheckSquare size={48} color="#9CA3AF" /></IconWrapper>
                      </Box>
                      <VStack gap="1" align="center">
                        <Typography fontSize="16px" fontWeight="600" color="#374151">
                          No items in this checklist
                        </Typography>
                        <Typography fontSize="13px" color="#9CA3AF" textAlign="center">
                          Add items below to get started
                        </Typography>
                      </VStack>
                    </VStack>
                  ) : (
                    <VStack gap="2.5" align="stretch" width="100%">
                      {checklist.items.map((item, index) => (
                        <Card
                          key={`${item.id}-${index}`}
                          p="4"
                          bg="white"
                          border="1px solid"
                          borderColor={item.isRequired ? "#FEE4E2" : "#E5E7EB"}
                          boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                          borderRadius="8px"
                          _hover={{ 
                            borderColor: "#F05423",
                            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.1)",
                            transform: "translateY(-1px)"
                          }}
                          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                          position="relative"
                          width="100%"
                        >
                          {item.isRequired && (
                            <Box
                              position="absolute"
                              top="0"
                              left="0"
                              right="0"
                              height="3px"
                              bg="#F05423"
                              borderRadius="8px 8px 0 0"
                            />
                          )}
                          <Flex 
                            direction={{ base: "column", md: "row" }}
                            justify="space-between" 
                            align={{ base: "stretch", md: "center" }} 
                            gap="3" 
                            width="100%"
                          >
                            <HStack gap="3" align="start" flex="1" minW="0" width="100%">
                              <Box 
                                pt="0.5"
                                flexShrink={0}
                              >
                                <Box
                                  w="28px"
                                  h="28px"
                                  borderRadius="6px"
                                  bg={item.isRequired ? "#FFF5F2" : "#F3F4F6"}
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  border="2px solid"
                                  borderColor={item.isRequired ? "#F05423" : "#D1D5DB"}
                                >
                                  <IconWrapper>
                                    <FiCheckSquare 
                                      size={16} 
                                      color={item.isRequired ? "#F05423" : "#9CA3AF"} 
                                    />
                                  </IconWrapper>
                                </Box>
                              </Box>
                              <VStack align="start" gap="1.5" flex="1" minW="0" width="100%">
                                <HStack gap="2" align="start" w="full" flexWrap="wrap">
                                  <Typography fontSize="14px" fontWeight="700" color="#111827" flexShrink={0} minW="20px">
                                    {index + 1}.
                                  </Typography>
                                  <Typography 
                                    fontSize="14px" 
                                    fontWeight="600" 
                                    color="#111827" 
                                    flex="1" 
                                    lineHeight="1.4"
                                    wordBreak="break-word"
                                    style={{
                                      whiteSpace: 'normal',
                                      overflow: 'visible',
                                      textOverflow: 'clip'
                                    }}
                                  >
                                    {item.description}
                                  </Typography>
                                </HStack>
                                {item.guidelines && (
                                  <Box
                                    pl="6"
                                    pt="0.5"
                                    borderLeft="2px solid"
                                    borderColor="#E5E7EB"
                                    width="100%"
                                  >
                                    <Typography 
                                      fontSize="12px" 
                                      color="#6B7280" 
                                      lineHeight="1.5"
                                      wordBreak="break-word"
                                      style={{
                                        whiteSpace: 'normal',
                                        overflow: 'visible',
                                        textOverflow: 'clip'
                                      }}
                                    >
                                      {item.guidelines}
                                    </Typography>
                                  </Box>
                                )}
                              </VStack>
                            </HStack>
                            
                            <HStack 
                              gap="1.5" 
                              flexShrink={0} 
                              align="center" 
                              flexWrap="wrap"
                              justify={{ base: "flex-start", md: "flex-end" }}
                            >
                              <Tag 
                                variant="info" 
                                style={{ 
                                  color: '#111827',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  padding: '3px 10px',
                                  borderRadius: '5px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  whiteSpace: 'nowrap',
                                  height: '22px'
                                }}
                              >
                                {item.category || 'Other'}
                              </Tag>
                              {item.isRequired && (
                                <Tag 
                                  variant="danger" 
                                  style={{ 
                                    color: '#111827',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    padding: '3px 10px',
                                    borderRadius: '5px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    whiteSpace: 'nowrap',
                                    height: '22px'
                                  }}
                                >
                                  Required
                                </Tag>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeItem(item.id);
                                }}
                                _hover={{ bg: "#FEF2F2" }}
                                aria-label="Delete item"
                                style={{
                                  padding: '4px',
                                  minWidth: '28px',
                                  height: '28px',
                                  borderRadius: '5px',
                                  flexShrink: 0
                                }}
                              >
                                <IconWrapper><FiTrash2 size={13} color="#DC2626" /></IconWrapper>
                              </Button>
                            </HStack>
                          </Flex>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </Box>
              </Card>

              {/* Add New Item */}
              <Card 
                p="4" 
                boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" 
                border="1px solid" 
                borderColor="#E5E7EB" 
                width="full" 
                bg="#F9FAFB"
                borderRadius="10px"
              >
                <VStack gap="3" align="stretch">
                  <Typography fontSize="12px" fontWeight="700" color="#111827" textTransform="uppercase" letterSpacing="0.05em">
                    Add New Item
                  </Typography>
                  
                  <Input
                    placeholder="Enter item description..."
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  />
                  
                  <HStack gap="2" align="flex-end">
                    <Box flex="1">
                      <Input
                        placeholder="Category (e.g., Documents, Information)"
                        value={newItem.category}
                        onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                      />
                    </Box>
                    
                    <HStack 
                      gap="2" 
                      align="center" 
                      px="3" 
                      py="2" 
                      bg="white" 
                      borderRadius="6px" 
                      border="1px solid" 
                      borderColor="#E5E7EB"
                      height="36px"
                      flexShrink={0}
                    >
                      <ChakraCheckbox.Root
                        checked={newItem.isRequired}
                        onCheckedChange={(details) => {
                          const checked = details?.checked === true || (details as any) === true;
                          setNewItem(prev => ({ ...prev, isRequired: checked }));
                        }}
                      >
                        <ChakraCheckbox.Control
                          style={{
                            backgroundColor: newItem.isRequired ? '#F05423' : 'white',
                            borderColor: newItem.isRequired ? '#F05423' : '#D1D5DB',
                          }}
                        >
                          <ChakraCheckbox.Indicator>
                            <IconWrapper><FiCheckSquare size={12} color="white" /></IconWrapper>
                          </ChakraCheckbox.Indicator>
                        </ChakraCheckbox.Control>
                      </ChakraCheckbox.Root>
                      <Typography fontSize="13px" color="#111827" fontWeight="500">Required</Typography>
                    </HStack>
                  </HStack>
                  
                  <Textarea
                    placeholder="Add guidelines or instructions for this item (optional)..."
                    value={newItem.guidelines}
                    onChange={(e) => setNewItem(prev => ({ ...prev, guidelines: e.target.value }))}
                    resize="none"
                    style={{ minHeight: '80px' }}
                  />
                  
                  <HStack justify="flex-end" pt="1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={addNewItem}
                      fontWeight="600"
                      className="mukuru-primary-button"
                      style={{
                        padding: '8px 20px',
                        height: '36px',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    >
                      <IconWrapper><FiPlus size={16} /></IconWrapper>
                      Add Item
                    </Button>
                  </HStack>
                </VStack>
              </Card>
            </VStack>
          </Container>
        </Box>
      </Box>
    </Flex>
  );
}
