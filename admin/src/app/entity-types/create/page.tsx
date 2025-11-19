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
  SimpleGrid,
  Flex,
  Icon,
  Checkbox,
  Spinner,
  Alert,
  AlertTitle,
  AlertDescription
} from "@chakra-ui/react";
import { FiFileText, FiX } from "react-icons/fi";
import AdminSidebar from "../../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { entityConfigApiService, Requirement } from "../../../services/entityConfigApi";

export default function CreateEntityTypePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: '',
    displayName: '',
    description: '',
    icon: '',
  });
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequirements();
  }, []);

  // Auto-generate code from display name
  useEffect(() => {
    if (formData.displayName) {
      const generatedCode = formData.displayName
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '') // Remove special characters except spaces
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single underscore
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      
      setFormData(prev => ({ ...prev, code: generatedCode }));
    } else {
      // Clear code when display name is empty
      setFormData(prev => ({ ...prev, code: '' }));
    }
  }, [formData.displayName]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const requirements = await entityConfigApiService.getRequirements(false);
      setAllRequirements(requirements);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load requirements';
      setError(errorMessage);
      console.error('Error loading requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementToggle = (requirementId: string) => {
    setSelectedRequirements((prev) =>
      prev.includes(requirementId)
        ? prev.filter((id) => id !== requirementId)
        : [...prev, requirementId]
    );
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.displayName || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Create the entity type
      const result = await entityConfigApiService.createEntityType({
        code: formData.code,
        displayName: formData.displayName,
        description: formData.description,
        icon: formData.icon || undefined,
      });

      // Add requirements to the entity type
      if (selectedRequirements.length > 0) {
        const requirementPromises = selectedRequirements.map((reqId, index) =>
          entityConfigApiService.addRequirementToEntityType(result.id, {
            requirementId: reqId,
            isRequired: true,
            displayOrder: index + 1,
          })
        );
        await Promise.all(requirementPromises);
      }

      router.push("/entity-types");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create entity type';
      setError(errorMessage);
      console.error('Error creating entity type:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/entity-types");
  };

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <Box flex="1" ml="280px">
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py="8">
          <Container maxW="8xl">
            <VStack align="start" gap="1">
              <Text as="h1" fontSize="3xl" fontWeight="bold" color="gray.800">
                Create Entity Type
              </Text>
              <Text color="gray.600" fontSize="lg">
                Define a new entity type and select which requirements apply.
              </Text>
            </VStack>
          </Container>
        </Box>

        {/* Error Alert */}
        {error && (
          <Container maxW="8xl" py="4">
            <Alert.Root status="error" borderRadius="md">
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert.Root>
          </Container>
        )}

        {/* Form Sections */}
        <Container maxW="8xl" py="8">
          {/* General Information */}
          <Box bg="white" borderRadius="xl" border="1px" borderColor="gray.200" p="6" mb="8">
            <VStack align="stretch" gap="6">
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                General Information
              </Text>

              <VStack align="stretch" gap="4">
                <HStack gap="4" align="start">
                  <VStack align="start" gap="2" flex="1">
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Code *
                    </Text>
                    <Input
                      value={formData.code}
                      readOnly
                      placeholder="e.g., COMPANY, NGO, SOLE_PROPRIETOR"
                      size="md"
                      borderRadius="lg"
                      bg="gray.100"
                      borderColor="gray.300"
                      color="gray.700"
                      cursor="not-allowed"
                      _hover={{ borderColor: "gray.300" }}
                      _focus={{ borderColor: "gray.300", boxShadow: "none" }}
                      _placeholder={{ color: "gray.400" }}
                      required
                    />
                    <Text fontSize="xs" color="gray.500">
                      Uppercase, underscores allowed (used in code)
                    </Text>
                  </VStack>
                  <VStack align="start" gap="2" flex="1">
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Display Name *
                    </Text>
                    <Input
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="e.g., Company, NGO, Sole Proprietor"
                      size="md"
                      borderRadius="lg"
                      bg="gray.50"
                      borderColor="gray.200"
                      color="gray.900"
                      _hover={{ borderColor: "gray.300" }}
                      _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                      _placeholder={{ color: "gray.400" }}
                      required
                    />
                    <Text fontSize="xs" color="gray.500">
                      User-facing name (shown in forms)
                    </Text>
                  </VStack>
                </HStack>

                <VStack align="start" gap="2">
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    Description *
                  </Text>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this entity type..."
                    size="md"
                    borderRadius="lg"
                    bg="gray.50"
                    borderColor="gray.200"
                    color="gray.900"
                    _hover={{ borderColor: "gray.300" }}
                    _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                    _placeholder={{ color: "gray.400" }}
                    minH="100px"
                    required
                  />
                </VStack>

                <VStack align="start" gap="2">
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    Icon (optional)
                  </Text>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g., FiBriefcase, FiHome"
                    size="md"
                    borderRadius="lg"
                    bg="gray.50"
                    borderColor="gray.200"
                    color="gray.900"
                    _hover={{ borderColor: "gray.300" }}
                    _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                    _placeholder={{ color: "gray.400" }}
                  />
                  <Text fontSize="xs" color="gray.500">
                    Icon name from react-icons (optional)
                  </Text>
                </VStack>
              </VStack>
            </VStack>
          </Box>

          {/* Requirements Section */}
          <Box bg="white" borderRadius="xl" border="1px" borderColor="gray.200" p="6" mb="8">
            <VStack align="stretch" gap="6">
              <VStack align="start" gap="1">
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  Requirements
                </Text>
                <Text color="gray.600" fontSize="md">
                  Select which requirements apply to this entity type
                </Text>
              </VStack>

              {loading ? (
                <Flex justify="center" py="8">
                  <Spinner size="lg" color="orange.500" />
                </Flex>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
                  {allRequirements.map((requirement) => (
                    <Box
                      key={requirement.id}
                      p="4"
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="lg"
                      bg="gray.50"
                      _hover={{ bg: "gray.100", borderColor: "gray.300" }}
                      transition="all 0.2s"
                      cursor="pointer"
                      onClick={() => handleRequirementToggle(requirement.id)}
                      position="relative"
                    >
                      <HStack gap="3" align="start">
                        <Box
                          position="relative"
                          zIndex="2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox.Root
                            checked={selectedRequirements.includes(requirement.id)}
                            onCheckedChange={() => handleRequirementToggle(requirement.id)}
                            colorScheme="orange"
                            size="lg"
                            mt="1"
                          >
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Root>
                        </Box>
                        <VStack align="start" gap="1" flex="1" position="relative" zIndex="1">
                          <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                            {requirement.displayName}
                          </Text>
                          <Text fontSize="xs" color="gray.600" lineHeight="1.4">
                            {requirement.description}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </VStack>
          </Box>

          {/* Action Buttons */}
          <Flex justify="start" gap="4" pt="4">
            <Button
              colorScheme="orange"
              size="lg"
              bg="#FF6B35"
              _hover={{ bg: "#E55A2B" }}
              _active={{ bg: "#CC4A1F" }}
              onClick={handleCreate}
              loading={saving}
              loadingText="Creating..."
              disabled={loading}
            >
              <Icon as={FiFileText} mr="2" />
              Create
            </Button>
            <Button
              variant="outline"
              colorScheme="gray"
              size="lg"
              onClick={handleCancel}
              disabled={saving || loading}
            >
              <Icon as={FiX} mr="2" />
              Cancel
            </Button>
          </Flex>
        </Container>
      </Box>
    </Flex>
  );
}
