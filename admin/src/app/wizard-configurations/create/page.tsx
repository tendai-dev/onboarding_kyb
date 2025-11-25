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
  Checkbox as ChakraCheckbox
} from "@chakra-ui/react";
import { Typography, Button, IconWrapper, AlertBar, Tag, Input, Dropdown } from "@/lib/mukuruImports";
import { FiSettings, FiX, FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from "react-icons/fi";
import AdminSidebar from "../../../components/AdminSidebar";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { entityConfigApiService, EntityType, RequirementsMetadata, RequirementType, Requirement } from "../../../services/entityConfigApi";
import { logger } from "../../../lib/logger";

interface WizardStepForm {
  title: string;
  subtitle: string;
  requirementTypes: string[];
  requirementIds: string[]; // Individual requirement IDs selected
  checklistCategory: string;
  stepNumber: number;
  isActive: boolean;
}

// Separate component for each requirement checkbox to ensure proper isolation
function RequirementCheckbox({
  requirementId,
  requirementDisplayName,
  requirementDescription,
  isChecked,
  stepIndex,
  onToggle
}: {
  requirementId: string;
  requirementDisplayName: string;
  requirementDescription?: string;
  isChecked: boolean;
  stepIndex: number;
  onToggle: () => void;
}) {
  // Create handler that immediately calls onToggle with correct closure
  const handleChange = (details: any) => {
    const checked = details?.checked === true || details === true;
    logger.debug('RequirementCheckbox handleChange', {
      requirementId,
      stepIndex,
      checked,
      isChecked,
      hasDetails: !!details
    });
    // Call onToggle - it should be bound to the correct requirement
    onToggle();
  };

  return (
    <Box 
      w="100%"
      py="1"
      position="relative"
      data-requirement-id={requirementId}
      data-step-index={stepIndex}
      style={{
        position: 'relative',
        zIndex: 1,
        isolation: 'isolate',
        cursor: 'pointer'
      }}
      onClick={(e) => {
        e.stopPropagation();
        logger.debug('Box clicked', { requirementId, stepIndex });
        handleChange({ checked: !isChecked });
      }}
    >
      <HStack gap="3" align="flex-start">
        <Box
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            flexShrink: 0,
            paddingTop: '2px' // Align checkbox with first line of text
          }}
        >
          <ChakraCheckbox.Root
            checked={isChecked}
            onCheckedChange={handleChange}
            id={`checkbox-${requirementId}-${stepIndex}`}
            name={`checkbox-${requirementId}-${stepIndex}`}
            value={requirementId}
            style={{
              cursor: 'pointer'
            }}
          >
            <ChakraCheckbox.Control
              style={{
                backgroundColor: isChecked ? '#F05423' : 'white',
                borderColor: isChecked ? '#F05423' : '#D1D5DB',
                borderWidth: '2px',
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <ChakraCheckbox.Indicator
                style={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ✓
              </ChakraCheckbox.Indicator>
            </ChakraCheckbox.Control>
          </ChakraCheckbox.Root>
        </Box>
        <VStack align="start" gap="0" flex="1" onClick={(e) => {
          e.stopPropagation();
          logger.debug('Text area clicked', { requirementId, stepIndex });
          handleChange({ checked: !isChecked });
        }} style={{ cursor: 'pointer', minWidth: 0 }}>
          <Typography fontSize="sm" fontWeight="600" color="#111827" style={{ color: '#111827', lineHeight: '20px' }}>
            {requirementDisplayName}
          </Typography>
          {requirementDescription && (
            <Typography fontSize="xs" color="#6B7280" fontWeight="400" style={{ color: '#6B7280' }} mt="1">
              {requirementDescription}
            </Typography>
          )}
        </VStack>
      </HStack>
    </Box>
  );
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
    console.log('useEffect triggered - entityTypeId:', formData.entityTypeId);
    if (formData.entityTypeId) {
      console.log('Loading requirements for entity type:', formData.entityTypeId);
      loadEntityTypeRequirements(formData.entityTypeId);
    } else {
      console.log('No entity type selected, clearing requirements');
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
      console.log('Loaded entity types:', entityTypesData.length, entityTypesData);
      // Debug: log first entity type structure
      if (entityTypesData.length > 0) {
        console.log('First entity type structure:', entityTypesData[0]);
        console.log('First entity type displayName:', entityTypesData[0].displayName);
        console.log('First entity type keys:', Object.keys(entityTypesData[0]));
      }
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
      console.log('Loading requirements for entity type ID:', entityTypeId);
      
      // Fetch entity type with requirements included
      const allEntityTypes = await entityConfigApiService.getEntityTypes(false, true);
      console.log('All entity types with requirements:', allEntityTypes.length);
      
      // Try to find by ID (handle both string and GUID formats)
      let entityType = allEntityTypes.find(et => et.id === entityTypeId || et.id?.toString() === entityTypeId?.toString());
      
      // If not found, try to find by case-insensitive comparison
      if (!entityType) {
        entityType = allEntityTypes.find(et => 
          et.id?.toLowerCase() === entityTypeId?.toLowerCase() ||
          et.id?.replace(/-/g, '') === entityTypeId?.replace(/-/g, '')
        );
      }
      
      console.log('Found entity type:', entityType ? entityType.displayName : 'NOT FOUND');
      console.log('Entity type requirements:', entityType?.requirements?.length || 0);
      
      if (entityType) {
        setSelectedEntityType(entityType);
        
        // Extract requirements from entity type
        console.log('Entity type requirements structure:', JSON.stringify(entityType.requirements, null, 2));
        
        if (entityType.requirements && entityType.requirements.length > 0) {
          // Get all requirement IDs - handle different structures
          const requirementIds = entityType.requirements.map((etr: any) => {
            // Try different possible property names
            const id = etr.requirementId || 
                      etr.RequirementId || 
                      etr.requirement_id ||
                      etr.requirement?.id ||
                      etr.Requirement?.Id ||
                      etr.id ||
                      etr.Id;
            console.log('Extracted requirement ID:', id, 'from:', etr);
            return id;
          }).filter(Boolean);
          
          console.log('Requirement IDs to fetch:', requirementIds);
          
          // Fetch all requirements to get full details
          const allRequirements = await entityConfigApiService.getRequirements(false);
          console.log('All available requirements:', allRequirements.length);
          console.log('Sample requirement IDs:', allRequirements.slice(0, 3).map(r => r.id));
          
          // Try to match requirements by ID (handle string/GUID comparison)
          const entityReqs = allRequirements.filter(req => {
            const matches = requirementIds.some(id => {
              const reqId = req.id?.toString() || '';
              const searchId = id?.toString() || '';
              return reqId === searchId || 
                     reqId.toLowerCase() === searchId.toLowerCase() ||
                     reqId.replace(/-/g, '') === searchId.replace(/-/g, '');
            });
            return matches;
          });
          
          console.log('Filtered entity requirements:', entityReqs.length);
          console.log('Matched requirements:', entityReqs.map(r => ({ id: r.id, name: r.displayName })));
          
          if (entityReqs.length === 0 && requirementIds.length > 0) {
            console.error('⚠️ Requirements not found!');
            console.error('Looking for IDs:', requirementIds);
            console.error('Available requirement IDs:', allRequirements.map(r => r.id));
          }
          
          setEntityRequirements(entityReqs);
        } else {
          console.log('No requirements found for this entity type');
          setEntityRequirements([]);
        }
      } else {
        console.error('Entity type not found for ID:', entityTypeId);
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

  const toggleRequirement = useCallback((stepIndex: number, requirementId: string) => {
    console.log('=== toggleRequirement START ===');
    console.log('toggleRequirement called:', { stepIndex, requirementId, timestamp: Date.now() });
    setSteps(prev => {
      console.log('Current steps state:', prev.map(s => ({ stepNumber: s.stepNumber, requirementIds: s.requirementIds })));
      const newSteps = prev.map((step, i) => {
        if (i !== stepIndex) return step;
        
        const requirement = entityRequirements.find(r => r.id === requirementId);
        if (!requirement) {
          console.warn('Requirement not found:', requirementId);
          return step;
        }
        
        const isSelected = step.requirementIds.includes(requirementId);
        console.log('Requirement selection state:', { requirementId, isSelected, currentIds: step.requirementIds });
        
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
        
        console.log('Updated requirement IDs:', newRequirementIds);
        return { ...step, requirementIds: newRequirementIds, requirementTypes: newRequirementTypes };
      });
      
      return newSteps;
    });
  }, [entityRequirements]);

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
            <Typography color="gray.600">Loading form...</Typography>
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
        <Box 
          bg="linear-gradient(135deg, #FFF5F0 0%, #FFFFFF 100%)" 
          borderBottom="1px" 
          borderColor="gray.200" 
          py="8"
          boxShadow="0 1px 3px rgba(0,0,0,0.05)"
        >
          <Container maxW="95%" px="8">
            <VStack align="start" gap="2">
              <Typography 
                as="h1" 
                fontSize="4xl" 
                fontWeight="800" 
                color="#111827" 
                style={{ color: '#111827', letterSpacing: '-0.5px' }}
              >
                Create Wizard Configuration
              </Typography>
              <Typography 
                color="#6B7280" 
                fontSize="md" 
                fontWeight="400" 
                style={{ color: '#6B7280' }}
              >
                Configure a multi-step wizard for entity type applications
              </Typography>
            </VStack>
          </Container>
        </Box>

        {error && (
          <Container maxW="95%" px="8" py="4">
            <AlertBar
              status="error"
              title="Error!"
              description={error}
            />
          </Container>
        )}

        <Container maxW="95%" px="8" py="8">
          <VStack gap="6" align="stretch">
            {/* Basic Information */}
            <Box 
              bg="white" 
              borderRadius="xl" 
              border="1px" 
              borderColor="gray.100" 
              p="8"
              boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              position="relative"
              className="basic-information-section"
              _hover={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
              transition="all 0.3s ease"
              _before={{
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "5px",
                bg: "linear-gradient(180deg, #F05423 0%, #FF6B35 100%)",
                borderTopLeftRadius: "xl",
                borderBottomLeftRadius: "xl"
              }}
            >
              <VStack align="stretch" gap="6">
                <Box>
                  <Typography 
                    fontSize="lg" 
                    fontWeight="700" 
                    color="#111827" 
                    textTransform="uppercase" 
                    letterSpacing="1px" 
                    style={{ color: '#111827' }}
                    mb="1"
                  >
                    Basic Information
                  </Typography>
                  <Box h="3px" w="60px" bg="linear-gradient(90deg, #F05423 0%, #FF6B35 100%)" borderRadius="full" />
                </Box>

                <Box className="mukuru-dropdown-wrapper">
                  {loading ? (
                    <Box>
                      <Typography color="#111827" style={{ color: '#111827' }}>Loading entity types...</Typography>
                    </Box>
                  ) : entityTypes.length === 0 ? (
                    <Box>
                      <Typography color="red.500" style={{ color: '#DC2626' }}>No entity types available. Please check the backend connection.</Typography>
                    </Box>
                  ) : (
                    <>
                      <Dropdown
                        key={`entity-dropdown-${formData.entityTypeId || 'none'}`}
                        label="Entity Type"
                        placeholder="Select an entity type"
                        helpText="Please select the entity type for this wizard configuration"
                        items={entityTypes.map((et) => ({
                          label: et.displayName || et.code || 'Unnamed',
                          value: et.id || ''
                        }))}
                        defaultValue={formData.entityTypeId || undefined}
                        onSelectionChange={(value) => {
                          console.log('Entity type selected:', value);
                          console.log('Selected entity type object:', entityTypes.find(et => et.id === value));
                          setFormData(prev => ({ ...prev, entityTypeId: value || '' }));
                          // Force reload requirements when selection changes
                          if (value) {
                            setTimeout(() => {
                              loadEntityTypeRequirements(value);
                            }, 100);
                          }
                        }}
                      />
                    </>
                  )}
                </Box>

                <HStack 
                  justify="space-between" 
                  align="center" 
                  pt="4" 
                  borderTop="1px" 
                  borderColor="gray.100"
                  bg="gray.50"
                  p="4"
                  borderRadius="lg"
                  mt="2"
                >
                  <VStack align="start" gap="0">
                    <Typography fontSize="sm" fontWeight="600" color="#111827" style={{ color: '#111827' }}>
                      Configuration Status
                    </Typography>
                    <Typography fontSize="xs" color="#6B7280" style={{ color: '#6B7280' }}>
                      Make this wizard available for use
                    </Typography>
                  </VStack>
                  <Button
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    variant={formData.isActive ? "primary" : "secondary"}
                    size="sm"
                    fontWeight="600"
                    style={{
                      backgroundColor: formData.isActive ? '#F05423' : 'transparent',
                      borderColor: formData.isActive ? '#F05423' : '#F05423',
                      color: formData.isActive ? '#FFFFFF' : '#F05423',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '8px 16px',
                      minWidth: 'auto'
                    }}
                  >
                    <Typography 
                      as="span" 
                      fontWeight="600"
                      className={formData.isActive ? "active-button-text" : ""}
                      style={{ 
                        color: formData.isActive ? '#FFFFFF' : '#F05423',
                        WebkitTextFillColor: formData.isActive ? '#FFFFFF' : '#F05423',
                        textAlign: 'center'
                      }}
                    >
                      {formData.isActive ? "Active" : "Inactive"}
                    </Typography>
                  </Button>
                </HStack>
              </VStack>
            </Box>

            {/* Wizard Steps */}
            <Box 
              bg="white" 
              borderRadius="xl" 
              border="1px" 
              borderColor="gray.100" 
              p="8"
              boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              position="relative"
              _hover={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
              transition="all 0.3s ease"
              _before={{
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "5px",
                bg: "linear-gradient(180deg, #F05423 0%, #FF6B35 100%)",
                borderTopLeftRadius: "xl",
                borderBottomLeftRadius: "xl"
              }}
            >
              <VStack align="stretch" gap="6">
                <HStack justify="space-between" align="center" mb="2">
                  <Box>
                    <Typography 
                      fontSize="lg" 
                      fontWeight="700" 
                      color="#111827" 
                      textTransform="uppercase" 
                      letterSpacing="1px" 
                      style={{ color: '#111827' }}
                      mb="1"
                    >
                      Wizard Steps
                    </Typography>
                    <Box h="3px" w="60px" bg="linear-gradient(90deg, #F05423 0%, #FF6B35 100%)" borderRadius="full" />
                  </Box>
                  <Button
                    onClick={addStep}
                    size="md"
                    variant="primary"
                    fontWeight="600"
                    style={{
                      backgroundColor: '#F05423',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textAlign: 'center'
                    }}
                  >
                    <IconWrapper style={{ color: '#FFFFFF', fill: '#FFFFFF' }}>
                      <FiPlus size={18} style={{ color: '#FFFFFF', fill: '#FFFFFF' }} />
                    </IconWrapper>
                    <Typography 
                      as="span" 
                      fontWeight="600"
                      style={{ 
                        color: '#FFFFFF',
                        WebkitTextFillColor: '#FFFFFF',
                        textAlign: 'center'
                      }}
                    >
                      Add Step
                    </Typography>
                  </Button>
                </HStack>

                {steps.map((step, index) => (
                  <Box
                    key={index}
                    border="1px"
                    borderColor="gray.100"
                    borderRadius="xl"
                    p="8"
                    bg="white"
                    boxShadow="0 2px 4px rgba(0,0,0,0.05)"
                    position="relative"
                    _hover={{ 
                      boxShadow: "0 8px 16px rgba(0,0,0,0.1)", 
                      borderColor: "#F05423",
                      transform: "translateY(-2px)"
                    }}
                    transition="all 0.3s ease"
                    mb="6"
                  >
                    <VStack align="stretch" gap="6">
                      <HStack justify="space-between" align="center" mb="2">
                        <HStack gap="3" align="center">
                          <Box
                            bg="linear-gradient(135deg, #F05423 0%, #FF6B35 100%)"
                            color="white"
                            fontWeight="700"
                            px="5"
                            py="2"
                            borderRadius="lg"
                            fontSize="13px"
                            letterSpacing="0.5px"
                            boxShadow="0 2px 4px rgba(240, 84, 35, 0.3)"
                          >
                            Step {step.stepNumber}
                          </Box>
                          {step.title && (
                            <Typography fontSize="md" fontWeight="600" color="#111827" style={{ color: '#111827' }}>
                              {step.title}
                            </Typography>
                          )}
                        </HStack>
                        <HStack gap="2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveStep(index, 'up')}
                            disabled={index === 0}
                            _hover={{ bg: "orange.50", transform: "scale(1.1)" }}
                            _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
                            borderRadius="md"
                            transition="all 0.2s"
                          >
                            <IconWrapper color="orange.500"><FiArrowUp size={18} /></IconWrapper>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveStep(index, 'down')}
                            disabled={index === steps.length - 1}
                            _hover={{ bg: "orange.50", transform: "scale(1.1)" }}
                            _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
                            borderRadius="md"
                            transition="all 0.2s"
                          >
                            <IconWrapper color="orange.500"><FiArrowDown size={18} /></IconWrapper>
                          </Button>
                          {steps.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeStep(index)}
                              _hover={{ bg: "red.50", transform: "scale(1.1)" }}
                              borderRadius="md"
                              transition="all 0.2s"
                            >
                              <IconWrapper color="red.500"><FiTrash2 size={18} /></IconWrapper>
                            </Button>
                          )}
                        </HStack>
                      </HStack>

                      <SimpleGrid columns={2} gap="4">
                        <Field.Root>
                          <Field.Label fontSize="sm" fontWeight="600" color="#111827" mb="2" style={{ color: '#111827' }}>
                            Title *
                          </Field.Label>
                          <ChakraInput
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            placeholder="e.g., Business Information"
                            bg="white"
                            borderColor="gray.200"
                            color="#111827"
                            fontWeight="500"
                            borderRadius="lg"
                            h="44px"
                            _focus={{ borderColor: "#F05423", boxShadow: "0 0 0 3px rgba(240, 84, 35, 0.1)" }}
                            _placeholder={{ color: "gray.400" }}
                            _hover={{ borderColor: "gray.300" }}
                            transition="all 0.2s"
                            required
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label fontSize="sm" fontWeight="600" color="#111827" mb="2" style={{ color: '#111827' }}>
                            Subtitle *
                          </Field.Label>
                          <ChakraInput
                            value={step.subtitle}
                            onChange={(e) => updateStep(index, 'subtitle', e.target.value)}
                            placeholder="e.g., Enter your business details"
                            bg="white"
                            borderColor="gray.200"
                            color="#111827"
                            fontWeight="500"
                            borderRadius="lg"
                            h="44px"
                            _focus={{ borderColor: "#F05423", boxShadow: "0 0 0 3px rgba(240, 84, 35, 0.1)" }}
                            _placeholder={{ color: "gray.400" }}
                            _hover={{ borderColor: "gray.300" }}
                            transition="all 0.2s"
                            required
                          />
                        </Field.Root>
                      </SimpleGrid>

                      <Box className="mukuru-dropdown-wrapper" style={{ color: '#111827' }}>
                        <Dropdown
                          label="Checklist Category"
                          placeholder="Select category (optional)"
                          items={checklistCategories.map((cat) => ({
                            label: cat,
                            value: cat
                          }))}
                          defaultValue={step.checklistCategory || undefined}
                          onSelectionChange={(value) => {
                            updateStep(index, 'checklistCategory', value || '');
                          }}
                        />
                      </Box>

                      <Field.Root>
                        <Field.Label fontSize="sm" fontWeight="bold" color="#111827" mb="3" style={{ color: '#111827' }}>
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
                            <Typography fontSize="sm" color="#6B7280" fontWeight="500" textAlign="center" style={{ color: '#6B7280' }}>
                              Please select an entity type first to see available requirements
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
                            <Typography fontSize="sm" color="#6B7280" fontWeight="500" textAlign="center" style={{ color: '#6B7280' }}>
                              No requirements configured for this entity type yet
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            bg="white"
                            border="1px"
                            borderColor="gray.100"
                            borderRadius="xl"
                            p="6"
                            maxH="450px"
                            overflowY="auto"
                            boxShadow="0 2px 4px rgba(0,0,0,0.05)"
                            _hover={{ borderColor: "gray.200" }}
                            transition="all 0.2s"
                          >
                            {(() => {
                              // Get all requirement IDs selected in previous steps (steps before current index)
                              const previouslySelectedRequirementIds = new Set<string>();
                              for (let i = 0; i < index; i++) {
                                steps[i].requirementIds.forEach(id => previouslySelectedRequirementIds.add(id));
                              }
                              
                              // Filter out requirements that have been selected in previous steps
                              const availableRequirements = entityRequirements.filter(
                                req => !previouslySelectedRequirementIds.has(req.id)
                              );
                              
                              // Group available requirements by type
                              const groupedByType: Record<string, Requirement[]> = {};
                              availableRequirements.forEach(req => {
                                const type = req.type || 'Other';
                                if (!groupedByType[type]) {
                                  groupedByType[type] = [];
                                }
                                groupedByType[type].push(req);
                              });

                              // Show message if no requirements are available (all selected in previous steps)
                              if (availableRequirements.length === 0) {
                                return (
                                  <Box
                                    bg="gray.50"
                                    border="1px"
                                    borderColor="gray.200"
                                    borderRadius="lg"
                                    p="4"
                                    textAlign="center"
                                  >
                                    <Typography fontSize="sm" color="#6B7280" fontWeight="500" style={{ color: '#6B7280' }}>
                                      All available requirements have been selected in previous steps
                                    </Typography>
                                  </Box>
                                );
                              }
                              
                              return (
                                <VStack align="stretch" gap="4" key={`requirements-list-${index}`}>
                                  {Object.entries(groupedByType).map(([type, reqs]) => (
                                    <Box 
                                      key={type} 
                                      border="1px" 
                                      borderColor="gray.100" 
                                      borderRadius="xl" 
                                      p="5" 
                                      bg="linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)"
                                      _hover={{ 
                                        bg: "linear-gradient(135deg, #FFF5F0 0%, #FFFFFF 100%)", 
                                        borderColor: "#F05423",
                                        transform: "translateY(-1px)",
                                        boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
                                      }}
                                      transition="all 0.3s ease"
                                      mb="3"
                                    >
                                      <Typography 
                                        fontSize="xs" 
                                        fontWeight="700" 
                                        color="#F05423" 
                                        mb="4" 
                                        style={{ 
                                          color: '#F05423', 
                                          textTransform: 'uppercase', 
                                          letterSpacing: '1px' 
                                        }}
                                      >
                                        {type.replace(/_/g, ' ')}
                                      </Typography>
                                      <VStack align="stretch" gap="3">
                                        {reqs.map((req, reqIdx) => {
                                          // CRITICAL: Capture values IMMEDIATELY and ensure correct types
                                          const reqId = String(req.id);
                                          const stepIdx = Number(index);
                                          
                                          // Create handler that directly uses the captured values
                                          const handleToggle = () => {
                                            console.log('=== handleToggle START ===');
                                            console.log('reqId:', reqId, 'type:', typeof reqId);
                                            console.log('stepIdx:', stepIdx, 'type:', typeof stepIdx);
                                            console.log('reqIdx:', reqIdx);
                                            console.log('req object:', { 
                                              id: req.id, 
                                              displayName: req.displayName,
                                              code: req.code,
                                              description: req.description,
                                              fullReq: req
                                            });
                                            console.log('Calling toggleRequirement with:', { stepIdx, reqId });
                                            toggleRequirement(stepIdx, reqId);
                                            console.log('=== handleToggle END ===');
                                          };
                                          
                                          const isChecked = step.requirementIds.includes(reqId);
                                          
                                          // The API service now handles transformation, so displayName should be available
                                          // But add fallback just in case
                                          const displayName = req.displayName || req.code || 'Unnamed';
                                          const description = req.description || '';
                                          
                                          return (
                                            <RequirementCheckbox
                                              key={`req-${reqId}-step-${stepIdx}-idx-${reqIdx}`}
                                              requirementId={reqId}
                                              requirementDisplayName={displayName}
                                              requirementDescription={description}
                                              isChecked={isChecked}
                                              stepIndex={stepIdx}
                                              onToggle={handleToggle}
                                            />
                                          );
                                        })}
                                      </VStack>
                                    </Box>
                                  ))}
                                </VStack>
                              );
                            })()}
                          </Box>
                        )}
                        {step.requirementIds.length > 0 && (
                          <Typography fontSize="xs" color="#6B7280" fontWeight="500" mt="3" style={{ color: '#6B7280' }}>
                            {step.requirementIds.length} requirement{step.requirementIds.length !== 1 ? 's' : ''} selected
                          </Typography>
                        )}
                      </Field.Root>

                      <Field.Root>
                        <Field.Label fontSize="sm" fontWeight="bold" color="#111827" mb="2" style={{ color: '#111827' }}>
                          Requirement Types (Auto-selected based on requirements above)
                        </Field.Label>
                        <Box
                          bg="linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)"
                          border="1px"
                          borderColor="gray.100"
                          borderRadius="xl"
                          p="5"
                          _hover={{ borderColor: "#F05423", transform: "translateY(-1px)" }}
                          transition="all 0.3s ease"
                        >
                          {step.requirementTypes.length > 0 ? (
                            <HStack gap="2" flexWrap="wrap">
                              {step.requirementTypes.map((type) => (
                                <Box
                                  key={`${index}-${type}`}
                                  bg="linear-gradient(135deg, #F05423 0%, #FF6B35 100%)"
                                  color="white"
                                  fontWeight="600"
                                  px="4"
                                  py="2"
                                  borderRadius="lg"
                                  fontSize="11px"
                                  textTransform="uppercase"
                                  letterSpacing="0.5px"
                                  boxShadow="0 2px 4px rgba(240, 84, 35, 0.3)"
                                  _hover={{ transform: "scale(1.05)" }}
                                  transition="all 0.2s"
                                >
                                  {type.replace(/_/g, ' ')}
                                </Box>
                              ))}
                            </HStack>
                          ) : (
                            <Typography fontSize="sm" color="#6B7280" fontWeight="400" style={{ color: '#6B7280' }}>
                              Select requirements above to see requirement types
                            </Typography>
                          )}
                        </Box>
                      </Field.Root>

                      <HStack 
                        justify="space-between" 
                        align="center" 
                        pt="4" 
                        borderTop="1px" 
                        borderColor="gray.100"
                        bg="gray.50"
                        p="4"
                        borderRadius="lg"
                        mt="2"
                      >
                        <VStack align="start" gap="0">
                          <Typography fontSize="sm" fontWeight="600" color="#111827" style={{ color: '#111827' }}>
                            Step Status
                          </Typography>
                          <Typography fontSize="xs" color="#6B7280" style={{ color: '#6B7280' }}>
                            Enable or disable this step
                          </Typography>
                        </VStack>
                        <Button
                          onClick={() => updateStep(index, 'isActive', !step.isActive)}
                          variant={step.isActive ? "primary" : "secondary"}
                          size="sm"
                          fontWeight="600"
                          style={{
                            backgroundColor: step.isActive ? '#F05423' : 'transparent',
                            borderColor: step.isActive ? '#F05423' : '#F05423',
                            color: step.isActive ? '#FFFFFF' : '#F05423',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '8px 16px',
                            minWidth: 'auto'
                          }}
                        >
                          <Typography 
                            as="span" 
                            fontWeight="600"
                            className={step.isActive ? "active-button-text" : ""}
                            style={{ 
                              color: step.isActive ? '#FFFFFF' : '#F05423',
                              WebkitTextFillColor: step.isActive ? '#FFFFFF' : '#F05423',
                              textAlign: 'center'
                            }}
                          >
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
            <Flex gap="4" justify="flex-end" pt="6" borderTop="1px" borderColor="gray.100">
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="md"
                disabled={saving || loading}
                fontWeight="600"
              >
                <IconWrapper><FiX size={18} /></IconWrapper>
                <Typography as="span" fontWeight="600">Cancel</Typography>
              </Button>
              <Button
                onClick={handleCreate}
                variant="primary"
                size="md"
                disabled={loading || saving || !metadata || !formData.entityTypeId}
                loading={saving}
                loadingText="Creating..."
                fontWeight="600"
                style={{
                  backgroundColor: '#F05423',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textAlign: 'center'
                }}
              >
                <IconWrapper style={{ color: '#FFFFFF', fill: '#FFFFFF' }}>
                  {!saving && <FiSettings size={18} style={{ color: '#FFFFFF', fill: '#FFFFFF' }} />}
                </IconWrapper>
                <Typography 
                  as="span" 
                  fontWeight="600"
                  style={{ 
                    color: '#FFFFFF',
                    WebkitTextFillColor: '#FFFFFF',
                    textAlign: 'center'
                  }}
                >
                  {saving ? "Creating..." : "Create Configuration"}
                </Typography>
              </Button>
            </Flex>
          </VStack>
        </Container>
      </Box>
    </Flex>
  );
}

