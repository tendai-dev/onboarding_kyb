"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Flex,
  Icon,
  Field,
  Spinner,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
  SimpleGrid,
  Checkbox
} from "@chakra-ui/react";
import { FiSettings, FiX, FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from "react-icons/fi";
import AdminSidebar from "../../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { entityConfigApiService, EntityType, RequirementsMetadata, RequirementType, Requirement } from "../../../services/entityConfigApi";

interface WizardStepForm {
  title: string;
  subtitle: string;
  requirementTypes: string[];
  requirementIds: string[]; // Individual requirement IDs selected
  checklistCategory: string;
  stepNumber: number;
  isActive: boolean;
}

export default function CreateWizardConfigurationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    entityTypeId: '',
    isActive: true,
  });
  const [steps, setSteps] = useState<WizardStepForm[]>([
    {
      title: '',
      subtitle: '',
      requirementTypes: [],
      requirementIds: [],
      checklistCategory: '',
      stepNumber: 1,
      isActive: true,
    }
  ]);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [metadata, setMetadata] = useState<RequirementsMetadata | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | null>(null);
  const [entityRequirements, setEntityRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.entityTypeId) {
      loadEntityTypeRequirements(formData.entityTypeId);
    } else {
      setSelectedEntityType(null);
      setEntityRequirements([]);
    }
  }, [formData.entityTypeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entityTypesData, metadataData] = await Promise.all([
        entityConfigApiService.getEntityTypes(false, false),
        entityConfigApiService.getRequirementsMetadata(),
      ]);
      setEntityTypes(entityTypesData);
      setMetadata(metadataData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEntityTypeRequirements = async (entityTypeId: string) => {
    try {
      // Fetch entity type with requirements included
      const allEntityTypes = await entityConfigApiService.getEntityTypes(false, true);
      const entityType = allEntityTypes.find(et => et.id === entityTypeId);
      
      if (entityType) {
        setSelectedEntityType(entityType);
        
        // Extract requirements from entity type
        if (entityType.requirements && entityType.requirements.length > 0) {
          // Get all requirement IDs
          const requirementIds = entityType.requirements.map(etr => etr.requirementId);
          
          // Fetch all requirements to get full details
          const allRequirements = await entityConfigApiService.getRequirements(false);
          const entityReqs = allRequirements.filter(req => requirementIds.includes(req.id));
          
          setEntityRequirements(entityReqs);
        } else {
          setEntityRequirements([]);
        }
      } else {
        setSelectedEntityType(null);
        setEntityRequirements([]);
      }
    } catch (err) {
      console.error('Error loading entity type requirements:', err);
      setSelectedEntityType(null);
      setEntityRequirements([]);
    }
  };

  const addStep = () => {
    setSteps(prev => [...prev, {
      title: '',
      subtitle: '',
      requirementTypes: [],
      requirementIds: [],
      checklistCategory: '',
      stepNumber: prev.length + 1,
      isActive: true,
    }]);
  };

  const removeStep = (index: number) => {
    setSteps(prev => {
      const newSteps = prev.filter((_, i) => i !== index);
      // Renumber steps
      return newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 }));
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setSteps(prev => {
      const newSteps = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSteps.length) return prev;
      
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      // Renumber steps
      return newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 }));
    });
  };

  const updateStep = (index: number, field: keyof WizardStepForm, value: any) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ));
  };

  // Map requirement type number to enum name
  const getRequirementTypeName = (value: number): string => {
    const typeMap: Record<number, string> = {
      1: 'Information',
      2: 'Document',
      3: 'ProofOfIdentity',
      4: 'ProofOfAddress',
      5: 'OwnershipStructure',
      6: 'BoardDirectors',
      7: 'AuthorizedSignatories',
    };
    return typeMap[value] || value.toString();
  };

  const toggleRequirementType = (stepIndex: number, requirementTypeValue: number) => {
    const requirementTypeName = getRequirementTypeName(requirementTypeValue);
    setSteps(prev => prev.map((step, i) => {
      if (i !== stepIndex) return step;
      const types = step.requirementTypes.includes(requirementTypeName)
        ? step.requirementTypes.filter(t => t !== requirementTypeName)
        : [...step.requirementTypes, requirementTypeName];
      return { ...step, requirementTypes: types };
    }));
  };

  const toggleRequirement = (stepIndex: number, requirementId: string) => {
    setSteps(prev => prev.map((step, i) => {
      if (i !== stepIndex) return step;
      
      const requirement = entityRequirements.find(r => r.id === requirementId);
      if (!requirement) return step;
      
      const isSelected = step.requirementIds.includes(requirementId);
      let newRequirementIds: string[];
      let newRequirementTypes: string[];
      
      if (isSelected) {
        // Remove requirement
        newRequirementIds = step.requirementIds.filter(id => id !== requirementId);
        
        // Check if there are other requirements of this type still selected
        const otherRequirementsOfType = entityRequirements.filter(
          r => r.type === requirement.type && r.id !== requirementId && newRequirementIds.includes(r.id)
        );
        
        // If no other requirements of this type are selected, remove the type
        if (otherRequirementsOfType.length === 0) {
          newRequirementTypes = step.requirementTypes.filter(t => t !== requirement.type);
        } else {
          newRequirementTypes = step.requirementTypes;
        }
      } else {
        // Add requirement
        newRequirementIds = [...step.requirementIds, requirementId];
        
        // Add requirement type if not already present
        if (!step.requirementTypes.includes(requirement.type)) {
          newRequirementTypes = [...step.requirementTypes, requirement.type];
        } else {
          newRequirementTypes = step.requirementTypes;
        }
      }
      
      return { ...step, requirementIds: newRequirementIds, requirementTypes: newRequirementTypes };
    }));
  };

  const handleCreate = async () => {
    // Clear previous errors
    setError(null);

    if (!formData.entityTypeId) {
      setError('Please select an entity type');
      return;
    }

    if (steps.length === 0) {
      setError('Please add at least one step');
      return;
    }

    // Validate all steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.title || !step.title.trim()) {
        setError(`Step ${i + 1}: Title is required`);
        return;
      }
      if (!step.subtitle || !step.subtitle.trim()) {
        setError(`Step ${i + 1}: Subtitle is required`);
        return;
      }
      if (step.requirementIds.length === 0) {
        setError(`Step ${i + 1}: Please select at least one requirement`);
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        entityTypeId: formData.entityTypeId,
        isActive: formData.isActive,
        steps: steps.map(step => ({
          title: step.title.trim(),
          subtitle: step.subtitle.trim(),
          requirementTypes: step.requirementTypes,
          checklistCategory: step.checklistCategory.trim() || '',
          stepNumber: step.stepNumber,
          isActive: step.isActive,
        })),
      };

      console.log('Creating wizard configuration with payload:', JSON.stringify(payload, null, 2));

      const result = await entityConfigApiService.createWizardConfiguration(payload);

      console.log('Wizard configuration created successfully:', result);

      // Success - navigate to list page
      router.push("/wizard-configurations");
    } catch (err: any) {
      let errorMessage = 'Failed to create wizard configuration';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      console.error('Error creating wizard configuration:', err);
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/wizard-configurations");
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="280px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Text color="gray.600">Loading form...</Text>
          </VStack>
        </Box>
      </Flex>
    );
  }

  const checklistCategories = [
    'Basic Information',
    'Business Details',
    'Legal Documents',
    'Financial Information',
    'Ownership Structure',
    'Compliance',
    'Additional Documents'
  ];

  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />
      <Box flex="1" ml="280px">
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py="6">
          <Container maxW="6xl">
            <VStack align="start" gap="2">
              <Text as="h1" fontSize="2xl" fontWeight="bold" color="gray.800">
                Create Wizard Configuration
              </Text>
              <Text color="gray.600" fontSize="sm">
                Configure a multi-step wizard for entity type applications
              </Text>
            </VStack>
          </Container>
        </Box>

        {error && (
          <Container maxW="6xl" py="4">
            <Alert.Root status="error" borderRadius="md" mb="4">
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert.Root>
          </Container>
        )}

        <Container maxW="6xl" py="6">
          <VStack gap="4" align="stretch">
            {/* Basic Information */}
            <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" p="5">
              <VStack align="stretch" gap="3">
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  Basic Information
                </Text>

                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                    Entity Type *
                  </Field.Label>
                  <select
                    value={formData.entityTypeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, entityTypeId: e.target.value }))}
                    style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      width: '100%',
                      color: '#374151'
                    }}
                    required
                  >
                    <option value="">Select an entity type</option>
                    {entityTypes.map((et) => (
                      <option key={et.id} value={et.id}>
                        {et.displayName}
                      </option>
                    ))}
                  </select>
                </Field.Root>

                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    Active (available for use)
                  </Text>
                  <Button
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    colorScheme={formData.isActive ? "orange" : "gray"}
                    variant={formData.isActive ? "solid" : "outline"}
                    size="md"
                    px="4"
                  >
                    {formData.isActive ? "Active" : "Inactive"}
                  </Button>
                </HStack>
              </VStack>
            </Box>

            {/* Wizard Steps */}
            <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" p="5">
              <VStack align="stretch" gap="3">
                <HStack justify="space-between" align="center">
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    Wizard Steps
                  </Text>
                  <Button
                    onClick={addStep}
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                  >
                    <Icon as={FiPlus} mr="2" />
                    Add Step
                  </Button>
                </HStack>

                {steps.map((step, index) => (
                  <Box
                    key={index}
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    p="4"
                    bg="gray.50"
                  >
                    <VStack align="stretch" gap="3">
                      <HStack justify="space-between" align="center">
                        <Badge colorScheme="blue" size="lg" px="3" py="1">
                          Step {step.stepNumber}
                        </Badge>
                        <HStack gap="2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveStep(index, 'up')}
                            disabled={index === 0}
                          >
                            <Icon as={FiArrowUp} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveStep(index, 'down')}
                            disabled={index === steps.length - 1}
                          >
                            <Icon as={FiArrowDown} />
                          </Button>
                          {steps.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removeStep(index)}
                            >
                              <Icon as={FiTrash2} />
                            </Button>
                          )}
                        </HStack>
                      </HStack>

                      <SimpleGrid columns={2} gap="3">
                        <Field.Root>
                          <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                            Title *
                          </Field.Label>
                          <Input
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            placeholder="e.g., Business Information"
                            bg="white"
                            borderColor="gray.300"
                            _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                            required
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                            Subtitle *
                          </Field.Label>
                          <Input
                            value={step.subtitle}
                            onChange={(e) => updateStep(index, 'subtitle', e.target.value)}
                            placeholder="e.g., Enter your business details"
                            bg="white"
                            borderColor="gray.300"
                            _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                            required
                          />
                        </Field.Root>
                      </SimpleGrid>

                      <Field.Root>
                        <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                          Checklist Category
                        </Field.Label>
                        <select
                          value={step.checklistCategory}
                          onChange={(e) => updateStep(index, 'checklistCategory', e.target.value)}
                          style={{
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            fontSize: '14px',
                            width: '100%',
                            color: '#374151'
                          }}
                        >
                          <option value="">Select category (optional)</option>
                          {checklistCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </Field.Root>

                      <Field.Root>
                        <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                          Requirements * (Select individual requirements)
                        </Field.Label>
                        {!selectedEntityType ? (
                          <Box
                            bg="gray.50"
                            border="1px"
                            borderColor="gray.300"
                            borderRadius="lg"
                            p="4"
                          >
                            <Text fontSize="sm" color="gray.500" textAlign="center">
                              Please select an entity type first to see available requirements
                            </Text>
                          </Box>
                        ) : entityRequirements.length === 0 ? (
                          <Box
                            bg="gray.50"
                            border="1px"
                            borderColor="gray.300"
                            borderRadius="lg"
                            p="4"
                          >
                            <Text fontSize="sm" color="gray.500" textAlign="center">
                              No requirements configured for this entity type yet
                            </Text>
                          </Box>
                        ) : (
                          <Box
                            bg="white"
                            border="1px"
                            borderColor="gray.300"
                            borderRadius="md"
                            p="3"
                            maxH="300px"
                            overflowY="auto"
                          >
                            {(() => {
                              // Group requirements by type
                              const groupedByType: Record<string, Requirement[]> = {};
                              entityRequirements.forEach(req => {
                                const type = req.type || 'Other';
                                if (!groupedByType[type]) {
                                  groupedByType[type] = [];
                                }
                                groupedByType[type].push(req);
                              });

                              return (
                                <VStack align="stretch" gap="4">
                                  {Object.entries(groupedByType).map(([type, reqs]) => (
                                    <Box key={type} border="1px" borderColor="gray.200" borderRadius="md" p="3" bg="gray.50">
                                      <Text fontSize="sm" fontWeight="bold" color="gray.700" mb="2">
                                        {type}
                                      </Text>
                                      <VStack align="stretch" gap="2">
                                        {reqs.map((req) => (
                                          <HStack key={req.id} gap="2" align="start">
                                            <Checkbox.Root
                                              checked={step.requirementIds.includes(req.id)}
                                              onCheckedChange={() => toggleRequirement(index, req.id)}
                                              colorScheme="orange"
                                            >
                                              <Checkbox.Control>
                                                <Checkbox.Indicator />
                                              </Checkbox.Control>
                                            </Checkbox.Root>
                                            <VStack align="start" gap="0" flex="1">
                                              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                                                {req.displayName}
                                              </Text>
                                              {req.description && (
                                                <Text fontSize="xs" color="gray.600">
                                                  {req.description}
                                                </Text>
                                              )}
                                            </VStack>
                                          </HStack>
                                        ))}
                                      </VStack>
                                    </Box>
                                  ))}
                                </VStack>
                              );
                            })()}
                          </Box>
                        )}
                        {step.requirementIds.length > 0 && (
                          <Text fontSize="xs" color="gray.600" mt="2">
                            {step.requirementIds.length} requirement{step.requirementIds.length !== 1 ? 's' : ''} selected
                          </Text>
                        )}
                      </Field.Root>

                      <Field.Root>
                        <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                          Requirement Types (Auto-selected based on requirements above)
                        </Field.Label>
                        <Box
                          bg="gray.50"
                          border="1px"
                          borderColor="gray.300"
                          borderRadius="lg"
                          p="4"
                        >
                          {step.requirementTypes.length > 0 ? (
                            <HStack gap="2" flexWrap="wrap">
                              {step.requirementTypes.map((type) => (
                                <Badge key={type} colorScheme="orange" fontSize="xs" px="2" py="1">
                                  {type}
                                </Badge>
                              ))}
                            </HStack>
                          ) : (
                            <Text fontSize="sm" color="gray.500">
                              Select requirements above to see requirement types
                            </Text>
                          )}
                        </Box>
                      </Field.Root>

                      <HStack justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">
                          Step Active
                        </Text>
                        <Button
                          onClick={() => updateStep(index, 'isActive', !step.isActive)}
                          colorScheme={step.isActive ? "orange" : "gray"}
                          variant={step.isActive ? "solid" : "outline"}
                          size="sm"
                          px="4"
                        >
                          {step.isActive ? "Active" : "Inactive"}
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>

            {/* Action Buttons */}
            <Flex gap="3" justify="start" pt="3">
              <Button
                onClick={handleCreate}
                colorScheme="orange"
                bg="#FF6B35"
                _hover={{ bg: "#E55A2B" }}
                _active={{ bg: "#CC4A1F" }}
                size="lg"
                px="8"
                loading={saving}
                loadingText="Creating..."
                disabled={loading || saving || !metadata || !formData.entityTypeId}
              >
                <Icon as={FiSettings} mr="2" />
                Create
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                colorScheme="gray"
                size="lg"
                px="8"
                disabled={saving || loading}
                borderColor="gray.300"
                color="black"
                _hover={{ 
                  bg: "gray.50",
                  borderColor: "gray.400",
                  transform: "translateY(-1px)",
                  boxShadow: "md"
                }}
                transition="all 0.2s ease"
              >
                <Icon as={FiX} mr="2" />
                Cancel
              </Button>
            </Flex>
          </VStack>
        </Container>
      </Box>
    </Flex>
  );
}

