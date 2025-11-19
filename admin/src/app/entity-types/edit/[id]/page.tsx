"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Button,
  Switch,
  SimpleGrid,
  Checkbox,
  Flex,
  Icon,
  Spinner,
  Alert,
  AlertTitle,
  AlertDescription
} from "@chakra-ui/react";
import { FiRefreshCw, FiX, FiSearch } from "react-icons/fi";
import AdminSidebar from "../../../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { entityConfigApiService, EntityType, Requirement } from "../../../../services/entityConfigApi";

export default function EditEntityTypePage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [entityTypeData, requirementsData] = await Promise.all([
        entityConfigApiService.getEntityType(params.id),
        entityConfigApiService.getRequirements(false)
      ]);
      
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
      
      // Populate selected requirements
      if (entityTypeData.requirements) {
        setSelectedRequirements(entityTypeData.requirements.map(etr => etr.requirementId));
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
    setSelectedRequirements(prev => 
      prev.includes(requirementId)
        ? prev.filter(id => id !== requirementId)
        : [...prev, requirementId]
    );
  };

  const handleUpdate = async () => {
    if (!formData.displayName || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Update the entity type
      await entityConfigApiService.updateEntityType(params.id, {
        displayName: formData.displayName,
        description: formData.description,
        isActive: formData.isActive,
        icon: formData.icon || undefined,
      });

      // Update requirements
      if (entityType) {
        const currentRequirementIds = entityType.requirements?.map(etr => etr.requirementId) || [];
        
        // Remove requirements that are no longer selected
        const toRemove = currentRequirementIds.filter(id => !selectedRequirements.includes(id));
        for (const reqId of toRemove) {
          await entityConfigApiService.removeRequirementFromEntityType(params.id, reqId);
        }
        
        // Add new requirements
        const toAdd = selectedRequirements.filter(id => !currentRequirementIds.includes(id));
        for (let i = 0; i < toAdd.length; i++) {
          const reqId = toAdd[i];
          const displayOrder = (currentRequirementIds.length - toRemove.length) + i + 1;
          await entityConfigApiService.addRequirementToEntityType(params.id, {
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
        <Box flex="1" ml="280px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Text color="black" fontWeight="500">Loading entity type...</Text>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (!entityType) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="280px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Text color="black" fontSize="md" fontWeight="600">Entity type not found</Text>
            <Button 
              onClick={() => router.push("/entity-types")}
              colorScheme="orange"
              borderRadius="md"
              fontWeight="500"
              transition="all 0.2s ease"
              _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
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

      {/* Main Content */}
      <Box flex="1" ml="280px" bg="gray.50">
        {/* Header */}
        <Box 
          bg="white" 
          borderBottom="1px solid" 
          borderColor="gray.200" 
          py="6"
          px="0"
          position="sticky"
          top="0"
          zIndex="10"
          boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        >
          <Container maxW="4xl" px="6">
            <VStack align="start" gap="1">
              <Text 
                as="h1" 
                fontSize="2xl" 
                fontWeight="700" 
                color="black"
                letterSpacing="-0.01em"
              >
                Edit Entity Type
              </Text>
              <Text 
                color="black" 
                fontSize="sm"
                opacity={0.65}
                fontWeight="400"
              >
                Update entity type details and requirements.
              </Text>
            </VStack>
          </Container>
        </Box>

        {/* Error Alert */}
        {error && (
          <Container maxW="4xl" py="4" px="6">
            <Alert.Root status="error" borderRadius="md">
              <AlertTitle color="black" fontWeight="600">Error!</AlertTitle>
              <AlertDescription color="black">{error}</AlertDescription>
            </Alert.Root>
          </Container>
        )}

        {/* Form Content */}
        <Container maxW="4xl" py="6" px="6">
          <VStack gap="6" align="stretch">
            {/* General Information */}
            <Box 
              bg="white" 
              borderRadius="lg" 
              border="1px solid" 
              borderColor="gray.200" 
              p="6" 
              boxShadow="sm"
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
              <VStack align="stretch" gap="4">
                <Text 
                  fontSize="sm" 
                  fontWeight="700" 
                  color="black" 
                  mb="2"
                  pb="2"
                  borderBottom="1px solid"
                  borderColor="gray.200"
                >
                  General Information
                </Text>

                <VStack align="stretch" gap="4" mt="2">
                  {/* Code (read-only) */}
                  <VStack align="start" gap="1.5">
                    <Text fontSize="xs" fontWeight="600" color="black" textTransform="uppercase">
                      Code
                    </Text>
                    <Input
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
                    <Text fontSize="xs" color="black" opacity={0.6} fontWeight="400">
                      Code cannot be changed after creation
                    </Text>
                  </VStack>

                  {/* Display Name */}
                  <VStack align="start" gap="1.5">
                    <Text fontSize="xs" fontWeight="600" color="black" textTransform="uppercase">
                      Display Name
                    </Text>
                    <Input
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
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
                    <Text fontSize="xs" color="black" opacity={0.6} fontWeight="400">
                      User-facing name (shown in forms)
                    </Text>
                  </VStack>

                  {/* Description */}
                  <VStack align="start" gap="1.5">
                    <Text fontSize="xs" fontWeight="600" color="black" textTransform="uppercase">
                      Description *
                    </Text>
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
                  <VStack align="start" gap="1.5">
                    <Text fontSize="xs" fontWeight="600" color="black" textTransform="uppercase">
                      Icon (optional)
                    </Text>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
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
                    <Text fontSize="xs" color="black" opacity={0.6} fontWeight="400">
                      Icon name from react-icons (optional)
                    </Text>
                  </VStack>

                  {/* Active Toggle */}
                  <HStack justify="space-between" align="center" pt="2">
                    <VStack align="start" gap="0.5">
                      <Text fontSize="xs" fontWeight="600" color="black" textTransform="uppercase">
                        Active (visible to applicants)
                      </Text>
                    </VStack>
                    <Button
                      onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                      colorScheme={formData.isActive ? "orange" : "gray"}
                      variant={formData.isActive ? "solid" : "outline"}
                      size="md"
                      px="6"
                      py="2"
                      borderRadius="md"
                      fontWeight="500"
                      transition="all 0.2s ease"
                      _hover={{ transform: "translateY(-1px)", boxShadow: "sm" }}
                    >
                      {formData.isActive ? "Active" : "Inactive"}
                    </Button>
                  </HStack>
                </VStack>
              </VStack>
            </Box>

            {/* Requirements Section */}
            <Box 
              bg="white" 
              borderRadius="lg" 
              border="1px solid" 
              borderColor="gray.200" 
              p="6"
              boxShadow="sm"
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
              <VStack align="stretch" gap="4">
                <VStack align="start" gap="1" mb="2" pb="2" borderBottom="1px solid" borderColor="gray.200">
                  <Text fontSize="sm" fontWeight="700" color="black">
                    Requirements
                  </Text>
                  <Text color="black" fontSize="xs" opacity={0.65} fontWeight="400">
                    Select which requirements apply to this entity type
                  </Text>
                </VStack>

                {/* Search Bar */}
                <Box position="relative">
                  <Icon
                    as={FiSearch}
                    position="absolute"
                    left="3"
                    top="50%"
                    transform="translateY(-50%)"
                    color="gray.400"
                    pointerEvents="none"
                    zIndex="1"
                    fontSize="md"
                  />
                  <Input
                    placeholder="Search requirements by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    bg="white"
                    borderColor="gray.300"
                    borderWidth="1px"
                    borderRadius="md"
                    py="3"
                    px="4"
                    pl="10"
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
                        <Text fontSize="sm" color="black" opacity={0.6} fontWeight="500">
                          No requirements found matching "{searchQuery}"
                        </Text>
                        <Text fontSize="xs" color="black" opacity={0.5} mt="1">
                          Try adjusting your search terms
                        </Text>
                      </Box>
                    );
                  }

                  return (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3" mt="2">
                      {filteredRequirements.map((requirement) => (
                        <Box
                          key={requirement.id}
                          p="3"
                          border="1px"
                          borderColor={selectedRequirements.includes(requirement.id) ? "orange.400" : "gray.200"}
                          borderRadius="md"
                          bg={selectedRequirements.includes(requirement.id) ? "orange.50" : "white"}
                          _hover={{ bg: selectedRequirements.includes(requirement.id) ? "orange.100" : "gray.50", borderColor: "orange.400" }}
                          transition="all 0.2s ease"
                          cursor="pointer"
                          onClick={() => handleRequirementToggle(requirement.id)}
                          position="relative"
                        >
                          <HStack gap="2" align="start">
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequirementToggle(requirement.id);
                              }}
                              position="relative"
                              zIndex="2"
                            >
                              <Checkbox.Root
                                checked={selectedRequirements.includes(requirement.id)}
                                onCheckedChange={() => handleRequirementToggle(requirement.id)}
                                colorScheme="orange"
                                size="md"
                                mt="0.5"
                              >
                                <Checkbox.Control>
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox.Root>
                            </Box>
                            <VStack align="start" gap="0.5" flex="1" position="relative" zIndex="1">
                              <Text fontSize="sm" fontWeight="600" color="black">
                                {requirement.displayName}
                              </Text>
                              <Text fontSize="xs" color="black" opacity={0.6} lineHeight="1.4">
                                {requirement.description}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  );
                })()}

                {/* Results Count */}
                {searchQuery.trim() && (
                  <Text fontSize="xs" color="black" opacity={0.6} textAlign="center" pt="2">
                    Showing {allRequirements.filter((req) => {
                      const query = searchQuery.toLowerCase();
                      return (
                        req.displayName.toLowerCase().includes(query) ||
                        (req.description && req.description.toLowerCase().includes(query))
                      );
                    }).length} of {allRequirements.length} requirements
                  </Text>
                )}
              </VStack>
            </Box>

            {/* Action Buttons */}
            <Flex gap="3" justify="flex-end" pt="4" borderTop="1px solid" borderColor="gray.200" mt="2">
              <Button
                onClick={handleCancel}
                variant="outline"
                colorScheme="gray"
                size="md"
                px="6"
                py="2"
                borderRadius="md"
                fontWeight="500"
                disabled={saving || loading}
                borderColor="gray.300"
                color="black"
                _hover={{ 
                  bg: "gray.50",
                  borderColor: "gray.400"
                }}
                transition="all 0.2s ease"
              >
                <Icon as={FiX} mr="2" />
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                colorScheme="orange"
                bg="#FF6B35"
                color="white"
                _hover={{ 
                  bg: "#E55A2B",
                  boxShadow: "md"
                }}
                _active={{ bg: "#CC4A1F" }}
                size="md"
                px="6"
                py="2"
                borderRadius="md"
                fontWeight="600"
                loading={saving}
                loadingText="Updating..."
                disabled={loading}
                transition="all 0.2s ease"
              >
                <Icon as={FiRefreshCw} mr="2" />
                Update
              </Button>
            </Flex>
          </VStack>
        </Container>
      </Box>
    </Flex>
  );
}
