"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Input as ChakraInput,
  Flex,
  Field,
  Spinner,
  SimpleGrid,
  Checkbox
} from "@chakra-ui/react";
import { Typography, Button, IconWrapper, AlertBar, Tag, Input } from "@/lib/mukuruImports";
import { FiSettings, FiX, FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from "react-icons/fi";
import AdminSidebar from "../../../../components/AdminSidebar";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { entityConfigApiService, WizardConfiguration, EntityType, RequirementsMetadata, Requirement } from "../../../../services/entityConfigApi";

interface WizardStepForm {
  title: string;
  subtitle: string;
  requirementTypes: string[];
  requirementIds: string[]; // Individual requirement IDs selected
  checklistCategory: string;
  stepNumber: number;
  isActive: boolean;
}

export default function EditWizardConfigurationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [formData, setFormData] = useState({
    entityTypeId: '',
    isActive: true,
  });
  const [steps, setSteps] = useState<WizardStepForm[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [metadata, setMetadata] = useState<RequirementsMetadata | null>(null);
  const [wizardConfig, setWizardConfig] = useState<WizardConfiguration | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | null>(null);
  const [entityRequirements, setEntityRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

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
      setError(null);
      const [wizardConfigData, entityTypesData, metadataData] = await Promise.all([
        entityConfigApiService.getWizardConfiguration(id),
        entityConfigApiService.getEntityTypes(false, false),
        entityConfigApiService.getRequirementsMetadata(),
      ]);
      
      setWizardConfig(wizardConfigData);
      setEntityTypes(entityTypesData);
      setMetadata(metadataData);
      
      // Populate form
      setFormData({
        entityTypeId: wizardConfigData.entityTypeId,
        isActive: wizardConfigData.isActive,
      });
      
      // Populate steps
      const sortedSteps = [...wizardConfigData.steps].sort((a, b) => a.stepNumber - b.stepNumber);
      setSteps(sortedSteps.map(step => ({
        title: step.title,
        subtitle: step.subtitle,
        requirementTypes: step.requirementTypes,
        requirementIds: [], // Will be populated after entity requirements are loaded
        checklistCategory: step.checklistCategory,
        stepNumber: step.stepNumber,
        isActive: step.isActive,
      })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load wizard configuration';
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
          
          // Populate requirementIds in steps based on requirementTypes
          // Select all requirements that match the requirement types in each step
          setSteps(prev => prev.map(step => {
            const matchingRequirementIds = entityReqs
              .filter(req => step.requirementTypes.includes(req.type))
              .map(req => req.id);
            return { ...step, requirementIds: matchingRequirementIds };
          }));
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
      return newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 }));
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setSteps(prev => {
      const newSteps = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSteps.length) return prev;
      
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
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

  const handleUpdate = async () => {
    // Clear previous errors
    setError(null);

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

      await entityConfigApiService.updateWizardConfiguration(id, {
        isActive: formData.isActive,
        steps: steps.map(step => ({
          title: step.title.trim(),
          subtitle: step.subtitle.trim(),
          requirementTypes: step.requirementTypes,
          checklistCategory: step.checklistCategory.trim() || '',
          stepNumber: step.stepNumber,
          isActive: step.isActive,
        })),
      });

      router.push("/wizard-configurations");
    } catch (err: any) {
      let errorMessage = 'Failed to update wizard configuration';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      console.error('Error updating wizard configuration:', err);
      
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
            <Typography color="gray.700" fontWeight="500">Loading wizard configuration...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (!wizardConfig) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="280px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Typography color="red.600" fontSize="lg">Wizard configuration not found</Typography>
            <Button onClick={() => router.push("/wizard-configurations")}>Back to Wizard Configurations</Button>
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
              <Typography as="h1" fontSize="2xl" fontWeight="bold" color="gray.900">
                Edit Wizard Configuration
              </Typography>
              <Typography color="gray.700" fontSize="sm" fontWeight="500">
                Update wizard configuration for {wizardConfig.entityTypeDisplayName || 'Entity Type'}
              </Typography>
            </VStack>
          </Container>
        </Box>

        {error && (
          <Container maxW="6xl" py="4">
            <AlertBar
              status="error"
              title="Error!"
              description={error}
            />
          </Container>
        )}

        <Container maxW="6xl" py="6">
          <VStack gap="4" align="stretch">
            {/* Basic Information */}
            <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" p="5">
              <VStack align="stretch" gap="3">
                <Typography fontSize="lg" fontWeight="bold" color="gray.900">
                  Basic Information
                </Typography>

                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="bold" color="gray.800">
                    Entity Type
                  </Field.Label>
                  <input
                    type="text"
                    value={entityTypes.find(et => et.id === formData.entityTypeId)?.displayName || wizardConfig?.entityTypeDisplayName || wizardConfig?.entity_type_display_name || 'Loading...'}
                    readOnly
                    style={{
                      width: '100%',
                      backgroundColor: '#F3F4F6',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '14px',
                      color: '#111827',
                      fontWeight: '600',
                      cursor: 'not-allowed',
                      outline: 'none'
                    }}
                  />
                  <Typography fontSize="xs" color="gray.600" fontWeight="500">
                    Entity type cannot be changed after creation
                  </Typography>
                </Field.Root>

                <HStack justify="space-between" align="center">
                  <Typography fontSize="sm" fontWeight="bold" color="gray.800">
                    Active (available for use)
                  </Typography>
                  <Button
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    variant={formData.isActive ? "primary" : "secondary"}
                    size="md"
                    bg={formData.isActive ? "#22C55E" : "white"}
                    border={formData.isActive ? "none" : "1px solid"}
                    borderColor={formData.isActive ? "transparent" : "gray.300"}
                    fontWeight="600"
                    _hover={formData.isActive ? { bg: "#16A34A" } : { bg: "gray.50" }}
                  >
                    <Typography as="span" color={formData.isActive ? "white" : "gray.700"} fontWeight="600">
                    {formData.isActive ? "Active" : "Inactive"}
                    </Typography>
                  </Button>
                </HStack>
              </VStack>
            </Box>

            {/* Wizard Steps */}
            <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" p="5">
              <VStack align="stretch" gap="3">
                <HStack justify="space-between" align="center">
                  <Typography fontSize="lg" fontWeight="bold" color="gray.900">
                    Wizard Steps
                  </Typography>
                  <Button
                    onClick={addStep}
                    size="sm"
                    variant="secondary"
                    bg="#FF6B35"
                    fontWeight="600"
                    _hover={{ bg: "#E55A2B" }}
                  >
                    <IconWrapper><FiPlus size={16} /></IconWrapper>
                    <Typography as="span" color="white" fontWeight="600">Add Step</Typography>
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
                        <Tag 
                          variant="info"
                          style={{
                            backgroundColor: '#3B82F6',
                            color: '#FFFFFF',
                            fontWeight: '600',
                            padding: '4px 12px',
                            fontSize: '12px',
                          }}
                        >
                          Step {step.stepNumber}
                        </Tag>
                        <HStack gap="2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveStep(index, 'up')}
                            disabled={index === 0}
                          >
                            <IconWrapper><FiArrowUp size={16} /></IconWrapper>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveStep(index, 'down')}
                            disabled={index === steps.length - 1}
                          >
                            <IconWrapper><FiArrowDown size={16} /></IconWrapper>
                          </Button>
                          {steps.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeStep(index)}
                            >
                              <IconWrapper><FiTrash2 size={16} /></IconWrapper>
                            </Button>
                          )}
                        </HStack>
                      </HStack>

                      <SimpleGrid columns={2} gap="3">
                        <Field.Root>
                          <Field.Label fontSize="sm" fontWeight="bold" color="gray.800">
                            Title *
                          </Field.Label>
                          <ChakraInput
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            placeholder="e.g., Business Information"
                            bg="white"
                            borderColor="gray.300"
                            borderWidth="1px"
                            borderRadius="md"
                            py="3"
                            px="3"
                            fontSize="sm"
                            color="gray.900"
                            fontWeight="500"
                            _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                            _placeholder={{ color: "gray.400" }}
                            required
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label fontSize="sm" fontWeight="bold" color="gray.800">
                            Subtitle *
                          </Field.Label>
                          <ChakraInput
                            value={step.subtitle}
                            onChange={(e) => updateStep(index, 'subtitle', e.target.value)}
                            placeholder="e.g., Enter your business details"
                            bg="white"
                            borderColor="gray.300"
                            borderWidth="1px"
                            borderRadius="md"
                            py="3"
                            px="3"
                            fontSize="sm"
                            color="gray.900"
                            fontWeight="500"
                            _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                            _placeholder={{ color: "gray.400" }}
                            required
                          />
                        </Field.Root>
                      </SimpleGrid>

                      <Field.Root>
                        <Field.Label fontSize="sm" fontWeight="bold" color="gray.800">
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
                            color: '#111827',
                            fontWeight: '500'
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
                        <Field.Label fontSize="sm" fontWeight="bold" color="gray.800">
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
                            <Typography fontSize="sm" color="gray.700" fontWeight="500" textAlign="center">
                              Loading entity requirements...
                            </Typography>
                          </Box>
                        ) : entityRequirements.length === 0 ? (
                          <Box
                            bg="gray.50"
                            border="1px"
                            borderColor="gray.300"
                            borderRadius="lg"
                            p="4"
                          >
                            <Typography fontSize="sm" color="gray.700" fontWeight="500" textAlign="center">
                              No requirements configured for this entity type yet
                            </Typography>
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
                                      <Typography fontSize="sm" fontWeight="bold" color="gray.900" mb="2">
                                        {type}
                                      </Typography>
                                      <VStack align="stretch" gap="2">
                                        {reqs.map((req) => (
                                          <HStack key={req.id} gap="2" align="start">
                                            <Checkbox.Root
                                              checked={step.requirementIds.includes(req.id)}
                                              onCheckedChange={() => toggleRequirement(index, req.id)}
                                            >
                                              <Checkbox.Control>
                                                <Checkbox.Indicator />
                                              </Checkbox.Control>
                                            </Checkbox.Root>
                                            <VStack align="start" gap="0" flex="1">
                                              <Typography fontSize="sm" fontWeight="600" color="gray.900">
                                                {req.displayName}
                                              </Typography>
                                              {req.description && (
                                                <Typography fontSize="xs" color="gray.700" fontWeight="500" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                  {req.description}
                                                </Typography>
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
                          <Typography fontSize="xs" color="gray.700" fontWeight="600" mt="2">
                            {step.requirementIds.length} requirement{step.requirementIds.length !== 1 ? 's' : ''} selected
                          </Typography>
                        )}
                      </Field.Root>

                      <Field.Root>
                        <Field.Label fontSize="sm" fontWeight="bold" color="gray.800">
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
                                <Tag 
                                  key={type} 
                                  variant="warning"
                                  style={{
                                    backgroundColor: '#F59E0B',
                                    color: '#FFFFFF',
                                    fontWeight: '600',
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                  }}
                                >
                                  {type}
                                </Tag>
                              ))}
                            </HStack>
                          ) : (
                            <Typography fontSize="sm" color="gray.600" fontWeight="500">
                              Select requirements above to see requirement types
                            </Typography>
                          )}
                        </Box>
                      </Field.Root>

                      <HStack justify="space-between" align="center">
                        <Typography fontSize="sm" fontWeight="bold" color="gray.800">
                          Step Active
                        </Typography>
                        <Button
                          onClick={() => updateStep(index, 'isActive', !step.isActive)}
                          variant={step.isActive ? "primary" : "secondary"}
                          size="sm"
                          bg={step.isActive ? "#22C55E" : "white"}
                          border={step.isActive ? "none" : "1px solid"}
                          borderColor={step.isActive ? "transparent" : "gray.300"}
                          fontWeight="600"
                          _hover={step.isActive ? { bg: "#16A34A" } : { bg: "gray.50" }}
                        >
                          <Typography as="span" color={step.isActive ? "white" : "gray.700"} fontWeight="600">
                          {step.isActive ? "Active" : "Inactive"}
                          </Typography>
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
                onClick={handleUpdate}
                variant="primary"
                size="md"
                disabled={loading || saving}
                bg="#FF6B35"
                fontWeight="600"
                _hover={{ bg: "#E55A2B" }}
                _active={{ bg: "#CC4A1F" }}
              >
                <IconWrapper><FiSettings size={16} /></IconWrapper>
                <Typography as="span" color="white" fontWeight="600">
                {saving ? "Updating..." : "Update"}
                </Typography>
              </Button>
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="md"
                disabled={saving || loading}
                bg="white"
                border="1px solid"
                borderColor="gray.300"
                fontWeight="600"
                _hover={{ bg: "gray.50", borderColor: "gray.400" }}
              >
                <IconWrapper><FiX size={16} /></IconWrapper>
                <Typography as="span" color="gray.700" fontWeight="600">Cancel</Typography>
              </Button>
            </Flex>
          </VStack>
        </Container>
      </Box>
    </Flex>
  );
}

