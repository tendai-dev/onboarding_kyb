"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Textarea,
  Switch,
  SimpleGrid,
  Flex,
  Spinner,
  Input as ChakraInput,
  Checkbox
} from "@chakra-ui/react";
import { Search, Typography, Button, IconWrapper, AlertBar, Input, Tag } from "@/lib/mukuruImports";
import { FiRefreshCw, FiX, FiSearch, FiArrowLeft } from "react-icons/fi";
import AdminSidebar from "../../../../components/AdminSidebar";
import PortalHeader from "../../../../components/PortalHeader";
import { useSidebar } from "../../../../contexts/SidebarContext";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { entityConfigApiService, EntityType, Requirement } from "../../../../services/entityConfigApi";

export default function EditEntityTypePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { condensed } = useSidebar();
  const { id } = use(params);
  const [formData, setFormData] = useState({
    code: '',
    displayName: '',
    description: '',
    icon: '',
    isActive: true
  });
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  // Debug: Log selectedRequirements changes
  useEffect(() => {
    console.log('[Entity Types Edit] selectedRequirements state updated:', selectedRequirements);
    console.log('[Entity Types Edit] selectedRequirements count:', selectedRequirements.length);
    if (selectedRequirements.length > 0 && allRequirements.length > 0) {
      const matched = allRequirements.filter(req => selectedRequirements.includes(String(req.id)));
      console.log('[Entity Types Edit] Matched requirements:', matched.length, 'out of', allRequirements.length);
      console.log('[Entity Types Edit] Matched requirement names:', matched.map(r => r.displayName));
    }
  }, [selectedRequirements, allRequirements]);

  const loadData = async () => {
    if (!id) {
      setError('Entity type ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Load entity type with requirements - Use list endpoint as workaround since single endpoint doesn't work
      console.log('[Entity Types Edit] Loading entity type with ID:', id);
      
      // Try single endpoint first
      let entityTypeData = await entityConfigApiService.getEntityType(id, true);
      console.log('[Entity Types Edit] ✅ Loaded entity type from single endpoint:', entityTypeData);
      console.log('[Entity Types Edit] ✅ Entity type requirements property:', entityTypeData.requirements);
      
      // If no requirements, try getting from list endpoint (which we know works)
      if (!entityTypeData.requirements || entityTypeData.requirements.length === 0) {
        console.log('[Entity Types Edit] ⚠️ No requirements from single endpoint, trying list endpoint...');
        const allEntityTypes = await entityConfigApiService.getEntityTypes(false, true);
        const foundEntityType = allEntityTypes.find(et => et.id === id);
        if (foundEntityType && foundEntityType.requirements && foundEntityType.requirements.length > 0) {
          console.log('[Entity Types Edit] ✅ Found requirements from list endpoint!', foundEntityType.requirements.length);
          // Merge the requirements into the entity type data
          entityTypeData = { ...entityTypeData, requirements: foundEntityType.requirements };
        }
      }
      
      console.log('[Entity Types Edit] ✅ Final entity type data:', entityTypeData);
      console.log('[Entity Types Edit] ✅ Final requirements:', entityTypeData.requirements);
      
      // Load all requirements
      const requirementsData = await entityConfigApiService.getRequirements(false);
      console.log('[Entity Types Edit] ✅ Loaded all requirements:', requirementsData.length);
      
      setEntityType(entityTypeData);
      setAllRequirements(requirementsData);
      
      // Populate form with entity type data
      setFormData({
        code: entityTypeData.code,
        displayName: entityTypeData.displayName,
        description: entityTypeData.description,
        icon: entityTypeData.icon || '',
        isActive: entityTypeData.isActive
      });
      
      // Extract requirements from the API response
      const requirements = entityTypeData.requirements || [];
      console.log('[Entity Types Edit] ✅ Requirements array from API:', requirements);
      console.log('[Entity Types Edit] ✅ Requirements count:', requirements.length);
      
      if (requirements && Array.isArray(requirements) && requirements.length > 0) {
        // Extract requirement IDs
        const requirementIds = requirements.map((etr: any) => {
          const id = String(etr.requirementId || etr.requirement_id || etr.id);
          console.log('[Entity Types Edit] Mapping requirement:', etr, '→ ID:', id);
          return id;
        }).filter(id => id && id !== 'undefined' && id !== 'null');
        
        console.log('[Entity Types Edit] ✅ Extracted requirement IDs:', requirementIds);
        console.log('[Entity Types Edit] ✅ All available requirement IDs:', requirementsData.map(r => String(r.id)));
        
        // Verify matches
        const matched = requirementsData.filter(req => requirementIds.includes(String(req.id)));
        console.log('[Entity Types Edit] ✅ Matched requirements:', matched.length, 'out of', requirementIds.length);
        console.log('[Entity Types Edit] ✅ Matched requirement names:', matched.map(r => r.displayName));
        
        if (matched.length !== requirementIds.length) {
          console.warn('[Entity Types Edit] ⚠️ Some requirements not found in all requirements list!');
          const missingIds = requirementIds.filter(id => !requirementsData.some(r => String(r.id) === id));
          console.warn('[Entity Types Edit] ⚠️ Missing requirement IDs:', missingIds);
        }
        
        setSelectedRequirements(requirementIds);
      } else {
        console.error('[Entity Types Edit] ❌ NO REQUIREMENTS FOUND IN API RESPONSE!');
        console.error('[Entity Types Edit] Entity type data keys:', Object.keys(entityTypeData));
        console.error('[Entity Types Edit] Entity type data:', entityTypeData);
        setSelectedRequirements([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load entity type';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementToggle = (requirementId: string) => {
    console.log('[Entity Types Edit] Toggling requirement:', requirementId);
    setSelectedRequirements(prev => {
      const isCurrentlySelected = prev.includes(requirementId);
      const newSelection = isCurrentlySelected
        ? prev.filter(id => id !== requirementId)
        : [...prev, requirementId];
      console.log('[Entity Types Edit] New selection:', newSelection);
      return newSelection;
    });
  };

  const handleUpdate = async () => {
    if (!formData.displayName || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (!id) {
        setError('Entity type ID is required');
        return;
      }

      // Update the entity type
      await entityConfigApiService.updateEntityType(id, {
        displayName: formData.displayName,
        description: formData.description,
        isActive: formData.isActive,
        icon: formData.icon || undefined,
      });

      // Update requirements
      if (entityType) {
        const currentRequirementIds = entityType.requirements?.map(etr => etr.requirementId) || [];
        
        // Remove requirements that are no longer selected
        const toRemove = currentRequirementIds.filter(reqId => !selectedRequirements.includes(reqId));
        for (const reqId of toRemove) {
          await entityConfigApiService.removeRequirementFromEntityType(id, reqId);
        }
        
        // Add new requirements
        const toAdd = selectedRequirements.filter(reqId => !currentRequirementIds.includes(reqId));
        for (let i = 0; i < toAdd.length; i++) {
          const reqId = toAdd[i];
          const displayOrder = (currentRequirementIds.length - toRemove.length) + i + 1;
          await entityConfigApiService.addRequirementToEntityType(id, {
            requirementId: reqId,
            isRequired: true,
            displayOrder,
          });
        }
      }

      router.push("/entity-types");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update entity type';
      setError(errorMessage);
      console.error('Error updating entity type:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/entity-types");
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <PortalHeader />
        <Box 
          flex="1" 
          ml={condensed ? "72px" : "280px"} 
          mt="90px"
          minH="calc(100vh - 90px)"
          width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
          display="flex" 
          alignItems="center" 
          justifyContent="center"
        >
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Typography color="black" fontWeight="500">Loading entity type...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (!entityType) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <PortalHeader />
        <Box 
          flex="1" 
          ml={condensed ? "72px" : "280px"} 
          mt="90px"
          minH="calc(100vh - 90px)"
          width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
          display="flex" 
          alignItems="center" 
          justifyContent="center"
        >
          <VStack gap="4">
            <Typography color="black" fontSize="md" fontWeight="600">Entity type not found</Typography>
            <Button 
              onClick={() => router.push("/entity-types")}
              variant="primary"
              className="mukuru-primary-button"
            >
              Back to Entity Types
            </Button>
          </VStack>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Left Sidebar */}
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content */}
      <Box 
        flex="1" 
        ml={condensed ? "72px" : "280px"} 
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
        bg="gray.50"
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        {/* Header */}
        <Box 
          bg="white" 
          borderBottom="1px solid" 
          borderColor="gray.200" 
          py="4"
          position="sticky"
          top="90px"
          zIndex="10"
          boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        >
          <Container maxW="8xl" px="10">
            <VStack align="start" gap="3" w="100%">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/entity-types")}
                className="mukuru-secondary-button"
                style={{
                  padding: '6px 12px',
                  minWidth: '80px',
                  height: '32px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                <IconWrapper><FiArrowLeft size={14} /></IconWrapper>
                Back
              </Button>
              <VStack align="start" gap="1" w="100%">
                <Typography 
                  as="h1" 
                  fontSize="24px" 
                  fontWeight="600" 
                  color="#111827"
                  lineHeight="1.3"
                  letterSpacing="-0.01em"
                >
                  Edit Entity Type
                </Typography>
                <Typography 
                  color="#6B7280" 
                  fontSize="14px"
                  fontWeight="400"
                  lineHeight="1.4"
                >
                  Update entity type details and requirements
                </Typography>
              </VStack>
            </VStack>
          </Container>
        </Box>

        {/* Error Alert */}
        {error && (
          <Container maxW="8xl" py="4" px="10">
            <AlertBar
              status="error"
              title="Error!"
              description={error}
            />
          </Container>
        )}

        {/* Form Content */}
        <Container maxW="8xl" py="6" px="10" w="100%">
          <VStack gap="6" align="stretch" w="100%">
            {/* General Information */}
            <Box 
              bg="white" 
              borderRadius="xl" 
              border="1px solid" 
              borderColor="gray.200" 
              p="6" 
              boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                bg: "linear-gradient(90deg, #FF6B35 0%, #FF8C42 100%)"
              }}
            >
              <VStack align="stretch" gap="5">
                <Box pb="3" borderBottom="1px solid" borderColor="gray.100">
                <Typography 
                    fontSize="16px" 
                    fontWeight="600" 
                    color="#111827" 
                    letterSpacing="-0.01em"
                >
                  General Information
                </Typography>
                </Box>

                <VStack align="stretch" gap="4" mt="3">
                  {/* Code (read-only) */}
                  <VStack align="start" gap="2">
                    <Typography fontSize="12px" fontWeight="600" color="#374151" textTransform="uppercase" letterSpacing="0.05em">
                      Code
                    </Typography>
                    <ChakraInput
                      value={formData.code}
                      readOnly
                      bg="gray.50"
                      borderColor="gray.200"
                      borderWidth="1px"
                      borderRadius="md"
                      py="3"
                      px="3"
                      fontSize="sm"
                      color="black"
                      opacity={0.7}
                      cursor="not-allowed"
                    />
                    <Typography fontSize="12px" color="#6B7280" fontWeight="400">
                      Code cannot be changed after creation
                    </Typography>
                  </VStack>

                  {/* Display Name */}
                  <VStack align="start" gap="2">
                    <Typography fontSize="12px" fontWeight="600" color="#374151" textTransform="uppercase" letterSpacing="0.05em">
                      Display Name
                    </Typography>
                    <ChakraInput
                      value={formData.displayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Government / State Owned Entity / Organ of State"
                      bg="white"
                      borderColor="gray.300"
                      borderWidth="1px"
                      borderRadius="md"
                      py="3"
                      px="3"
                      fontSize="sm"
                      color="black"
                      _placeholder={{ color: "gray.400" }}
                      _hover={{ borderColor: "gray.400" }}
                      _focus={{ 
                        borderColor: "orange.500", 
                        boxShadow: "0 0 0 3px rgba(255, 107, 53, 0.1)",
                        outline: "none"
                      }}
                      transition="all 0.2s ease"
                    />
                    <Typography fontSize="12px" color="#6B7280" fontWeight="400">
                      User-facing name (shown in forms)
                    </Typography>
                  </VStack>

                  {/* Description */}
                  <VStack align="start" gap="2">
                    <Typography fontSize="12px" fontWeight="600" color="#374151" textTransform="uppercase" letterSpacing="0.05em">
                      Description *
                    </Typography>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Government entities and state-owned organizations"
                      bg="white"
                      borderColor="gray.300"
                      borderWidth="1px"
                      borderRadius="md"
                      resize="vertical"
                      minH="80px"
                      py="3"
                      px="3"
                      fontSize="sm"
                      color="black"
                      _placeholder={{ color: "gray.400" }}
                      _hover={{ borderColor: "gray.400" }}
                      _focus={{ 
                        borderColor: "orange.500", 
                        boxShadow: "0 0 0 3px rgba(255, 107, 53, 0.1)",
                        outline: "none"
                      }}
                      transition="all 0.2s ease"
                      required
                    />
                  </VStack>

                  {/* Icon */}
                  <VStack align="start" gap="2">
                    <Typography fontSize="12px" fontWeight="600" color="#374151" textTransform="uppercase" letterSpacing="0.05em">
                      Icon (optional)
                    </Typography>
                    <ChakraInput
                      value={formData.icon}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="landmark"
                      bg="white"
                      borderColor="gray.300"
                      borderWidth="1px"
                      borderRadius="md"
                      py="3"
                      px="3"
                      fontSize="sm"
                      color="black"
                      _placeholder={{ color: "gray.400" }}
                      _hover={{ borderColor: "gray.400" }}
                      _focus={{ 
                        borderColor: "orange.500", 
                        boxShadow: "0 0 0 3px rgba(255, 107, 53, 0.1)",
                        outline: "none"
                      }}
                      transition="all 0.2s ease"
                    />
                    <Typography fontSize="12px" color="#6B7280" fontWeight="400">
                      Icon name from react-icons (optional)
                    </Typography>
                  </VStack>

                  {/* Active Toggle */}
                  <HStack justify="space-between" align="center" pt="2" pb="2">
                    <VStack align="start" gap="1">
                      <Typography fontSize="12px" fontWeight="600" color="#374151" textTransform="uppercase" letterSpacing="0.05em">
                        Active (visible to applicants)
                      </Typography>
                      <Typography fontSize="12px" color="#6B7280" fontWeight="400">
                        Toggle to make this entity type available for selection
                      </Typography>
                    </VStack>
                    <Button
                      onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                      variant={formData.isActive ? "primary" : "secondary"}
                      className={formData.isActive ? "mukuru-primary-button" : "mukuru-secondary-button"}
                      size="md"
                      px="6"
                      py="2"
                      borderRadius="md"
                      fontWeight="500"
                      transition="all 0.2s ease"
                    >
                      {formData.isActive ? "Active" : "Inactive"}
                    </Button>
                  </HStack>
                </VStack>
              </VStack>
            </Box>

            {/* Current Requirements Section - Always show for debugging */}
            <Box 
              bg="white" 
              borderRadius="xl" 
              border="1px solid" 
              borderColor="gray.200" 
              p="6"
              boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                bg: selectedRequirements.length > 0 
                  ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
                  : "linear-gradient(90deg, #9CA3AF 0%, #6B7280 100%)"
              }}
            >
              <VStack align="stretch" gap="4">
                <Box pb="3" borderBottom="1px solid" borderColor="gray.100">
                  <HStack justify="space-between" align="center">
                    <VStack align="start" gap="1">
                      <Typography fontSize="16px" fontWeight="600" color="#111827" letterSpacing="-0.01em">
                        Current Requirements
                      </Typography>
                      <Typography color="#6B7280" fontSize="14px" fontWeight="400" lineHeight="1.5">
                        {selectedRequirements.length > 0 
                          ? `${selectedRequirements.length} requirement${selectedRequirements.length !== 1 ? 's' : ''} assigned to this entity type`
                          : 'No requirements currently assigned to this entity type'
                        }
                      </Typography>
                      {/* Debug info */}
                      {!loading && (
                        <Typography fontSize="11px" color="#9CA3AF" fontFamily="mono" mt="1">
                          Debug: selectedRequirements={selectedRequirements.length}, allRequirements={allRequirements.length}, entityType.requirements={entityType?.requirements?.length || 0}
                        </Typography>
                      )}
                    </VStack>
                    {selectedRequirements.length > 0 && (
                      <Tag variant="success" style={{ fontSize: '12px', padding: '4px 12px' }}>
                        {selectedRequirements.length} Active
                      </Tag>
                    )}
                  </HStack>
                </Box>

                {selectedRequirements.length > 0 ? (
                  <VStack align="stretch" gap="3">
                    {/* Show raw data for debugging */}
                    {process.env.NODE_ENV === 'development' && (
                      <Box p="3" bg="yellow.50" border="1px solid" borderColor="yellow.200" borderRadius="md">
                        <Typography fontSize="xs" color="gray.700" fontWeight="600" mb="2">
                          Debug Info:
                        </Typography>
                        <Typography fontSize="xs" color="gray.600" fontFamily="mono">
                          Selected IDs: {selectedRequirements.join(', ')}
                        </Typography>
                        <Typography fontSize="xs" color="gray.600" fontFamily="mono" mt="1">
                          Entity Type Requirements: {entityType?.requirements?.length || 0}
                        </Typography>
                      </Box>
                    )}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                      {allRequirements
                        .filter(req => selectedRequirements.includes(String(req.id)))
                        .map((requirement) => (
                          <Box
                          key={requirement.id}
                          p="3"
                          border="1px solid"
                          borderColor="#10B981"
                          borderRadius="md"
                          bg="#F0FDF4"
                          boxShadow="0 1px 2px rgba(16, 185, 129, 0.1)"
                        >
                          <HStack align="start" gap="2">
                            <Box flex="1">
                              <Typography fontSize="14px" fontWeight="600" color="#111827" mb="1">
                                {requirement.displayName}
                              </Typography>
                              {requirement.description && (
                                <Typography fontSize="12px" color="#6B7280" lineHeight="1.4" style={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {requirement.description}
                                </Typography>
                              )}
                              <HStack gap="2" mt="2">
                                {requirement.type && (
                                  <Tag variant="info" style={{ fontSize: '10px', padding: '2px 8px' }}>
                                    {requirement.type}
                                  </Tag>
                                )}
                                {requirement.fieldType && (
                                  <Tag variant="info" style={{ fontSize: '10px', padding: '2px 8px' }}>
                                    {requirement.fieldType}
                                  </Tag>
                                )}
                              </HStack>
                            </Box>
                          </HStack>
                          </Box>
                        ))}
                    </SimpleGrid>
                    {allRequirements.filter(req => selectedRequirements.includes(String(req.id))).length === 0 && selectedRequirements.length > 0 && (
                      <Box p="4" bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
                        <Typography fontSize="sm" color="red.700" fontWeight="600" mb="2">
                          ⚠️ Warning: Requirements are assigned but not found in the requirements list
                        </Typography>
                        <Typography fontSize="xs" color="red.600" fontFamily="mono">
                          Selected IDs: {selectedRequirements.slice(0, 5).join(', ')}{selectedRequirements.length > 5 ? '...' : ''}
                        </Typography>
                        <Typography fontSize="xs" color="red.600" mt="1">
                          This might indicate a data mismatch. Check the console for details.
                        </Typography>
                      </Box>
                    )}
                  </VStack>
                ) : (
                  <Box 
                    textAlign="center" 
                    py="8" 
                    px="4"
                    border="1px dashed"
                    borderColor="gray.300"
                    borderRadius="md"
                    bg="gray.50"
                  >
                    <Typography fontSize="sm" color="#6B7280" fontWeight="500">
                      No requirements assigned yet
                    </Typography>
                    <Typography fontSize="xs" color="#9CA3AF" mt="1">
                      Select requirements from the section below
                    </Typography>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Requirements Selection Section */}
            <Box 
              bg="white" 
              borderRadius="xl" 
              border="1px solid" 
              borderColor="gray.200" 
              p="6"
              boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                bg: "linear-gradient(90deg, #FF6B35 0%, #FF8C42 100%)"
              }}
            >
              <VStack align="stretch" gap="5">
                <Box pb="3" borderBottom="1px solid" borderColor="gray.100">
                  <VStack align="start" gap="2">
                    <Typography fontSize="16px" fontWeight="600" color="#111827" letterSpacing="-0.01em">
                      Select Requirements
                  </Typography>
                    <Typography color="#6B7280" fontSize="14px" fontWeight="400" lineHeight="1.5">
                      {selectedRequirements.length > 0 
                        ? `${selectedRequirements.length} requirement${selectedRequirements.length !== 1 ? 's' : ''} selected. Search and select additional requirements below.`
                        : 'Search and select requirements that apply to this entity type'
                      }
                  </Typography>
                </VStack>
                </Box>

                {/* Search Bar */}
                <Box>
                  <Search
                    placeholder="Search requirements by name or description..."
                    onSearchChange={(query) => setSearchQuery(query)}
                  />
                </Box>

                {/* Filtered Requirements Grid */}
                {(() => {
                  const filteredRequirements = allRequirements.filter((requirement) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      requirement.displayName.toLowerCase().includes(query) ||
                      (requirement.description && requirement.description.toLowerCase().includes(query))
                    );
                  });

                  if (filteredRequirements.length === 0) {
                    return (
                      <Box 
                        textAlign="center" 
                        py="8" 
                        px="4"
                        border="1px dashed"
                        borderColor="gray.300"
                        borderRadius="md"
                        bg="gray.50"
                      >
                        <Typography fontSize="sm" color="black" opacity={0.6} fontWeight="500">
                          No requirements found matching "{searchQuery}"
                        </Typography>
                        <Typography fontSize="xs" color="black" opacity={0.5} mt="1">
                          Try adjusting your search terms
                        </Typography>
                      </Box>
                    );
                  }

                  return (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="4" mt="2" w="100%">
                      {filteredRequirements.map((requirement) => {
                        const requirementIdStr = String(requirement.id);
                        const isSelected = selectedRequirements.includes(requirementIdStr);
                        // Debug log for first few items
                        if (filteredRequirements.indexOf(requirement) < 3) {
                          console.log(`[Entity Types Edit] Requirement ${requirement.displayName}: id=${requirementIdStr}, isSelected=${isSelected}, selectedRequirements=`, selectedRequirements);
                        }
                        return (
                          <Box
                            key={requirement.id}
                            p="4"
                            border="2px solid"
                            borderColor={isSelected ? "#10B981" : "#E5E7EB"}
                            borderRadius="lg"
                            bg={isSelected ? "#F0FDF4" : "white"}
                            boxShadow={isSelected ? "0 2px 8px rgba(16, 185, 129, 0.2)" : "0 1px 3px rgba(0, 0, 0, 0.1)"}
                            _hover={{ 
                              bg: isSelected ? "#D1FAE5" : "#F9FAFB", 
                              borderColor: isSelected ? "#10B981" : "#F05423",
                              transform: "translateY(-2px)",
                              boxShadow: isSelected ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.15)"
                            }}
                            transition="all 0.2s ease"
                            cursor="pointer"
                            onClick={() => {
                              console.log('Clicking requirement:', requirement.id, 'Current selected:', selectedRequirements);
                              handleRequirementToggle(String(requirement.id));
                            }}
                            position="relative"
                            minH="120px"
                            display="flex"
                            flexDirection="column"
                            style={{
                              opacity: 1
                            }}
                          >
                            <HStack gap="3" align="start" w="100%" flex="1">
                              <Box
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Checkbox clicked:', requirement.id);
                                  handleRequirementToggle(String(requirement.id));
                                }}
                                position="relative"
                                zIndex="2"
                                flexShrink={0}
                                mt="2px"
                                style={{
                                  pointerEvents: 'auto'
                                }}
                              >
                                <Checkbox.Root
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    console.log('Checkbox changed:', requirement.id, checked);
                                    handleRequirementToggle(String(requirement.id));
                                  }}
                                  style={{
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Checkbox.Control
                                    style={{
                                      backgroundColor: isSelected ? '#F05423' : 'white',
                                      borderColor: isSelected ? '#F05423' : '#D1D5DB',
                                      borderWidth: '2px',
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    <Checkbox.Indicator
                                      style={{
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      ✓
                                    </Checkbox.Indicator>
                                  </Checkbox.Control>
                                </Checkbox.Root>
                              </Box>
                              <VStack align="start" gap="1" flex="1" position="relative" zIndex="1" minW="0">
                                <HStack gap="2" align="center" wrap="wrap" w="100%">
                                <Typography 
                                  fontSize="14px" 
                                  fontWeight="600" 
                                  color={isSelected ? "#F05423" : "#111827"}
                                  style={{
                                    wordBreak: "break-word"
                                  }}
                                >
                                  {requirement.displayName}
                                </Typography>
                                  {requirement.type && (
                                    <Tag 
                                      variant="info" 
                                      style={{ 
                                        fontSize: '10px', 
                                        padding: '2px 6px',
                                        textTransform: 'uppercase',
                                        fontWeight: '600'
                                      }}
                                    >
                                      {requirement.type.replace(/_/g, ' ')}
                                    </Tag>
                                  )}
                                </HStack>
                                <Typography 
                                  fontSize="12px" 
                                  color={isSelected ? "#9A3412" : "#6B7280"} 
                                  lineHeight="1.5"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    wordBreak: "break-word"
                                  }}
                                >
                                  {requirement.description || "No description"}
                                </Typography>
                              </VStack>
                            </HStack>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  );
                })()}

                {/* Results Count */}
                {searchQuery.trim() && (
                  <Typography fontSize="xs" color="black" opacity={0.6} textAlign="center" pt="2">
                    Showing {allRequirements.filter((req) => {
                      const query = searchQuery.toLowerCase();
                      return (
                        req.displayName.toLowerCase().includes(query) ||
                        (req.description && req.description.toLowerCase().includes(query))
                      );
                    }).length} of {allRequirements.length} requirements
                  </Typography>
                )}
              </VStack>
            </Box>

            {/* Action Buttons */}
            <Box 
              bg="white" 
              borderRadius="xl" 
              border="1px solid" 
              borderColor="gray.200" 
              p="6"
              boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
            >
              <Flex gap="3" justify="flex-end" align="center">
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  size="sm"
                  disabled={saving || loading}
                  className="mukuru-secondary-button"
                  style={{
                    minWidth: '100px',
                    height: '36px',
                    fontSize: '14px'
                  }}
                >
                  <IconWrapper><FiX size={14} /></IconWrapper>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  variant="primary"
                  className="mukuru-primary-button"
                  size="sm"
                  disabled={loading || saving}
                  style={{
                    minWidth: '120px',
                    height: '36px',
                    fontSize: '14px'
                  }}
                >
                  <IconWrapper><FiRefreshCw size={14} /></IconWrapper>
                  {saving ? "Updating..." : "Update"}
                </Button>
              </Flex>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Flex>
  );
}
