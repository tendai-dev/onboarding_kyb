/* eslint-disable security/detect-object-injection */
'use client';

import {
  Box,
  VStack,
  HStack,
  Input as ChakraInput,
  Flex,
  Spinner,
  SimpleGrid,
  Checkbox as ChakraCheckbox,
} from '@chakra-ui/react';
import { Typography } from '@mukuru/mukuru-react-components';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import { FiSettings, FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../../components/AdminSidebar';
import { useState, useEffect, useCallback } from 'react';
import {
  entityConfigApiService,
  EntityType,
  RequirementsMetadata,
  Requirement,
} from '../../../services/entityConfigApi';
import { logger } from '../../../lib/logger';

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
  onToggle,
}: {
  requirementId: string;
  requirementDisplayName: string;
  requirementDescription?: string;
  isChecked: boolean;
  stepIndex: number;
  onToggle: () => void;
}) {
  // Create handler that immediately calls onToggle with correct closure
  const handleChange = (details: { checked?: boolean | 'indeterminate' } | boolean) => {
    const checked = typeof details === 'boolean' ? details : details?.checked === true;
    logger.debug('RequirementCheckbox handleChange', {
      requirementId,
      stepIndex,
      checked,
      isChecked,
      hasDetails: !!details,
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
        cursor: 'pointer',
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
            paddingTop: '2px', // Align checkbox with first line of text
          }}
        >
          <ChakraCheckbox.Root
            checked={isChecked}
            onCheckedChange={(details) => handleChange(details)}
            id={`checkbox-${requirementId}-${stepIndex}`}
            name={`checkbox-${requirementId}-${stepIndex}`}
            value={requirementId}
            style={{
              cursor: 'pointer',
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
                cursor: 'pointer',
              }}
            >
              <ChakraCheckbox.Indicator
                style={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                ✓
              </ChakraCheckbox.Indicator>
            </ChakraCheckbox.Control>
          </ChakraCheckbox.Root>
        </Box>
        <VStack
          align="start"
          gap="0"
          flex="1"
          onClick={(e) => {
            e.stopPropagation();
            logger.debug('Text area clicked', { requirementId, stepIndex });
            handleChange({ checked: !isChecked });
          }}
          style={{ cursor: 'pointer', minWidth: 0 }}
        >
          <Typography
            fontSize="sm"
            fontWeight="600"
            color="#111827"
            style={{ color: '#111827', lineHeight: '20px' }}
          >
            {requirementDisplayName}
          </Typography>
          {requirementDescription && (
            <Typography
              fontSize="xs"
              color="#6B7280"
              fontWeight="400"
              style={{ color: '#6B7280' }}
              mt="1"
            >
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

  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const headerBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

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
    },
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
    console.info('useEffect triggered - entityTypeId:', formData.entityTypeId);
    if (formData.entityTypeId) {
      console.info('Loading requirements for entity type:', formData.entityTypeId);
      loadEntityTypeRequirements(formData.entityTypeId);
    } else {
      console.info('No entity type selected, clearing requirements');
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
      console.info('Loaded entity types:', entityTypesData.length, entityTypesData);
      // Debug: log first entity type structure
      if (entityTypesData.length > 0) {
        console.info('First entity type structure:', entityTypesData[0]);
        console.info('First entity type displayName:', entityTypesData[0].displayName);
        console.info('First entity type keys:', Object.keys(entityTypesData[0]));
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
      console.info('Loading requirements for entity type ID:', entityTypeId);

      // Fetch entity type with requirements included
      const allEntityTypes = await entityConfigApiService.getEntityTypes(false, true);
      console.info('All entity types with requirements:', allEntityTypes.length);

      // Try to find by ID (handle both string and GUID formats)
      let _entityType = allEntityTypes.find(
        (et) => et.id === entityTypeId || et.id?.toString() === entityTypeId?.toString()
      );

      // If not found, try to find by case-insensitive comparison
      if (!_entityType) {
        _entityType = allEntityTypes.find(
          (et) =>
            et.id?.toLowerCase() === entityTypeId?.toLowerCase() ||
            et.id?.replace(/-/g, '') === entityTypeId?.replace(/-/g, '')
        );
      }

      console.info(
        'Found entity type:',
        _entityType ? _entityType.displayName : 'NOT FOUND'
      );
      console.info('Entity type requirements:', _entityType?.requirements?.length || 0);

      if (_entityType) {
        setSelectedEntityType(_entityType);

        // Extract requirements from entity type
        console.info(
          'Entity type requirements structure:',
          JSON.stringify(_entityType.requirements, null, 2)
        );

        if (_entityType.requirements && _entityType.requirements.length > 0) {
          // Get all requirement IDs - handle different structures
          const requirementIds = _entityType.requirements
            .map((etr: unknown) => {
              const etrObj = etr as Record<string, unknown>;
              // Try different possible property names
              const id =
                etrObj.requirementId ||
                etrObj.RequirementId ||
                etrObj.requirement_id ||
                (etrObj.requirement &&
                typeof etrObj.requirement === 'object' &&
                'id' in etrObj.requirement
                  ? (etrObj.requirement as Record<string, unknown>).id
                  : undefined) ||
                (etrObj.Requirement &&
                typeof etrObj.Requirement === 'object' &&
                'Id' in etrObj.Requirement
                  ? (etrObj.Requirement as Record<string, unknown>).Id
                  : undefined) ||
                etrObj.id ||
                etrObj.Id;
              console.info('Extracted requirement ID:', id, 'from:', etr);
              return id;
            })
            .filter(Boolean);

          console.info('Requirement IDs to fetch:', requirementIds);

          // Fetch all requirements to get full details
          const allRequirements = await entityConfigApiService.getRequirements(false);
          console.info('All available requirements:', allRequirements.length);
          console.info(
            'Sample requirement IDs:',
            allRequirements.slice(0, 3).map((r) => r.id)
          );

          // Try to match requirements by ID (handle string/GUID comparison)
          const entityReqs = allRequirements.filter((req) => {
            const matches = requirementIds.some((id) => {
              const reqId = req.id?.toString() || '';
              const searchId = id?.toString() || '';
              return (
                reqId === searchId ||
                reqId.toLowerCase() === searchId.toLowerCase() ||
                reqId.replace(/-/g, '') === searchId.replace(/-/g, '')
              );
            });
            return matches;
          });

          console.info('Filtered entity requirements:', entityReqs.length);
          console.info(
            'Matched requirements:',
            entityReqs.map((r) => ({ id: r.id, name: r.displayName }))
          );

          if (entityReqs.length === 0 && requirementIds.length > 0) {
            console.error('⚠️ Requirements not found!');
            console.error('Looking for IDs:', requirementIds);
            console.error(
              'Available requirement IDs:',
              allRequirements.map((r) => r.id)
            );
          }

          setEntityRequirements(entityReqs);
        } else {
          console.info('No requirements found for this entity type');
          setEntityRequirements([]);
        }
      } else {
        console.error('Entity type not found for ID:', formData.entityTypeId);
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
    setSteps((prev) => [
      ...prev,
      {
        title: '',
        subtitle: '',
        requirementTypes: [],
        requirementIds: [],
        checklistCategory: '',
        stepNumber: prev.length + 1,
        isActive: true,
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => {
      const newSteps = prev.filter((_, i) => i !== index);
      // Renumber steps
      return newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 }));
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const newSteps = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSteps.length) return prev;

      const temp = newSteps[index];
      newSteps[index] = newSteps[targetIndex];
      newSteps[targetIndex] = temp;
      // Renumber steps
      return newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 }));
    });
  };

  const updateStep = (index: number, field: string, value: unknown) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step))
    );
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
    const validValue = value in typeMap ? value : null;
    return validValue !== null ? typeMap[validValue] : value.toString();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _toggleRequirementType = (stepIndex: number, requirementTypeValue: string) => {
    const requirementTypeName = getRequirementTypeName(Number(requirementTypeValue));
    setSteps((prev) =>
      prev.map((step, i) => {
        if (i !== stepIndex) return step;
        const types = step.requirementTypes.includes(requirementTypeName)
          ? step.requirementTypes.filter((t) => t !== requirementTypeName)
          : [...step.requirementTypes, requirementTypeName];
        return { ...step, requirementTypes: types };
      })
    );
  };

  const toggleRequirement = useCallback(
    (stepIndex: number, requirementId: string) => {
      console.info('=== toggleRequirement START ===');
      console.info('toggleRequirement called:', {
        stepIndex,
        requirementId,
        timestamp: Date.now(),
      });
      setSteps((prev) => {
        console.info(
          'Current steps state:',
          prev.map((s) => ({
            stepNumber: s.stepNumber,
            requirementIds: s.requirementIds,
          }))
        );
        const newSteps = prev.map((step, i) => {
          if (i !== stepIndex) return step;

          const requirement = entityRequirements.find((r) => r.id === requirementId);
          if (!requirement) {
            console.warn('Requirement not found:', requirementId);
            return step;
          }

          const isSelected = step.requirementIds.includes(requirementId);
          console.info('Requirement selection state:', {
            requirementId,
            isSelected,
            currentIds: step.requirementIds,
          });

          let newRequirementIds: string[];
          let newRequirementTypes: string[];

          if (isSelected) {
            // Remove requirement
            newRequirementIds = step.requirementIds.filter((id) => id !== requirementId);

            // Check if there are other requirements of this type still selected
            const otherRequirementsOfType = entityRequirements.filter(
              (r) =>
                r.type === requirement.type &&
                r.id !== requirementId &&
                newRequirementIds.includes(r.id)
            );

            // If no other requirements of this type are selected, remove the type
            if (otherRequirementsOfType.length === 0) {
              newRequirementTypes = step.requirementTypes.filter(
                (t) => t !== requirement.type
              );
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

          console.info('Updated requirement IDs:', newRequirementIds);
          return {
            ...step,
            requirementIds: newRequirementIds,
            requirementTypes: newRequirementTypes,
          };
        });

        return newSteps;
      });
    },
    [entityRequirements]
  );

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
        steps: steps.map((step) => ({
          title: step.title.trim(),
          subtitle: step.subtitle.trim(),
          requirementTypes: step.requirementTypes,
          checklistCategory: step.checklistCategory.trim() || '',
          stepNumber: step.stepNumber,
          isActive: step.isActive,
        })),
      };

      console.info(
        'Creating wizard configuration with payload:',
        JSON.stringify(payload, null, 2)
      );

      const result = await entityConfigApiService.createWizardConfiguration(payload);

      console.info('Wizard configuration created successfully:', result);

      // Success - navigate to list page
      router.push('/wizard-configurations');
    } catch (err: unknown) {
      let errorMessage = 'Failed to create wizard configuration';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String(err.message);
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
    router.push('/wizard-configurations');
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg={bgColor}>
        <AdminSidebar />
        <Box
          flex="1"
          ml="280px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack gap="4">
            <Spinner size="xl" color="mukuru.buttons.primary" />
            <Typography color="mukuru.text.primary">Loading form...</Typography>
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
    'Additional Documents',
  ];

  return (
    <Flex minH="100vh" bg="mukuru.background.light">
      <AdminSidebar />
      <Box flex="1" ml="280px" bg="mukuru.background.light" overflowY="auto">
        {/* Transparent Header Bar */}
        <Box bg="transparent" py="16px" px="20px">
          <Flex justify="space-between" align="flex-start">
            <VStack align="start" gap="4px">
              <Typography
                fontSize="22px"
                fontWeight="700"
                color="mukuru.text.primary"
                lineHeight="1.2"
              >
                Create Wizard Configuration
              </Typography>
              <Typography fontSize="13px" color="mukuru.grey.medium" fontWeight="400">
                {formData.entityTypeId
                  ? entityTypes.find((et) => et.id === formData.entityTypeId)
                      ?.displayName || 'Select Entity Type'
                  : 'Select Entity Type'}
              </Typography>
            </VStack>
            <HStack gap="8px">
              <Box
                as="button"
                px="12px"
                py="6px"
                borderRadius="6px"
                bg={formData.isActive ? 'mukuru.text.success' : 'mukuru.grey.light'}
                color={formData.isActive ? 'mukuru.white' : 'mukuru.grey.medium'}
                fontSize="11px"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.5px"
                cursor="pointer"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
              >
                {formData.isActive ? 'Active' : 'Inactive'}
              </Box>
              <Box
                as="button"
                display="flex"
                alignItems="center"
                gap="6px"
                px="16px"
                py="8px"
                borderRadius="6px"
                bg="mukuru.buttons.primary"
                color="mukuru.white"
                fontSize="13px"
                fontWeight="600"
                cursor="pointer"
                _hover={{ bg: 'mukuru.state.hover' }}
                onClick={handleCreate}
              >
                <FiSettings size={14} />
                {saving ? 'Creating...' : 'Create Configuration'}
              </Box>
            </HStack>
          </Flex>
        </Box>

        {/* Error Display */}
        {error && (
          <Box
            px="20px"
            py="10px"
            bg="mukuru.text.error"
            borderBottom="1px solid"
            borderColor="mukuru.text.error"
          >
            <Typography fontSize="13px" color="mukuru.white" fontWeight="500">
              {error}
            </Typography>
          </Box>
        )}

        {/* Main Content Area */}
        <Box p="20px">
          {/* Entity Type Selection */}
          <Box
            bg="mukuru.cards.white"
            border="1px solid"
            borderColor="mukuru.grey.light"
            borderRadius="8px"
            p="16px"
            mb="16px"
          >
            <Typography
              fontSize="11px"
              fontWeight="700"
              color="mukuru.grey.mediumDark"
              mb="4px"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              Entity Type
            </Typography>
            {loading ? (
              <Typography fontSize="13px" color="mukuru.grey.medium">
                Loading...
              </Typography>
            ) : (
              <select
                value={formData.entityTypeId}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, entityTypeId: value }));
                  if (value) {
                    setTimeout(() => loadEntityTypeRequirements(value), 100);
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#F5F5F5',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '13px',
                  color: formData.entityTypeId ? '#333333' : '#999999',
                  fontWeight: '500',
                }}
              >
                <option value="">Select an entity type</option>
                {entityTypes.map((et) => (
                  <option key={et.id} value={et.id || ''}>
                    {et.displayName || et.code || 'Unnamed'}
                  </option>
                ))}
              </select>
            )}
          </Box>

          {/* Steps Header */}
          <Flex
            justify="space-between"
            align="center"
            mb="16px"
            bg="mukuru.cards.white"
            px="16px"
            py="12px"
            borderRadius="8px"
            border="1px solid"
            borderColor="mukuru.grey.light"
          >
            <HStack gap="8px">
              <Box w="8px" h="8px" borderRadius="full" bg="mukuru.buttons.primary" />
              <Typography fontSize="14px" fontWeight="700" color="mukuru.text.primary">
                Wizard Steps
              </Typography>
              <Box px="8px" py="2px" borderRadius="full" bg="mukuru.grey.light">
                <Typography fontSize="11px" fontWeight="600" color="mukuru.grey.medium">
                  {steps.length} steps
                </Typography>
              </Box>
            </HStack>
            <Box
              as="button"
              display="flex"
              alignItems="center"
              gap="4px"
              px="12px"
              py="6px"
              borderRadius="6px"
              bg="mukuru.buttons.primary"
              color="mukuru.white"
              fontSize="12px"
              fontWeight="600"
              cursor="pointer"
              onClick={addStep}
            >
              <FiPlus size={12} />
              Add Step
            </Box>
          </Flex>

          {/* Steps List */}
          <VStack align="stretch" gap="12px">
            {steps.map((step, index) => (
              <Box
                key={index}
                bg="mukuru.cards.white"
                border="1px solid"
                borderColor="mukuru.grey.light"
                borderRadius="8px"
                overflow="hidden"
              >
                {/* Step Header - Mukuru Primary */}
                <Flex
                  px="14px"
                  py="10px"
                  bg="mukuru.buttons.primary"
                  justify="space-between"
                  align="center"
                >
                  <HStack gap="12px">
                    <Box
                      w="26px"
                      h="26px"
                      borderRadius="6px"
                      bg="mukuru.white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography
                        fontSize="13px"
                        fontWeight="700"
                        color="mukuru.buttons.primary"
                      >
                        {step.stepNumber}
                      </Typography>
                    </Box>
                    <Typography fontSize="14px" fontWeight="600" color="mukuru.white">
                      {step.title || 'Untitled Step'}
                    </Typography>
                  </HStack>
                  <HStack gap="4px">
                    <Box
                      as="button"
                      w="28px"
                      h="28px"
                      borderRadius="4px"
                      bg="mukuru.white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor={index === 0 ? 'not-allowed' : 'pointer'}
                      opacity={index === 0 ? 0.4 : 1}
                      onClick={() => index > 0 && moveStep(index, 'up')}
                    >
                      <FiArrowUp size={14} style={{ color: '#F05423' }} />
                    </Box>
                    <Box
                      as="button"
                      w="28px"
                      h="28px"
                      borderRadius="4px"
                      bg="mukuru.white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor={index === steps.length - 1 ? 'not-allowed' : 'pointer'}
                      opacity={index === steps.length - 1 ? 0.4 : 1}
                      onClick={() => index < steps.length - 1 && moveStep(index, 'down')}
                    >
                      <FiArrowDown size={14} style={{ color: '#F05423' }} />
                    </Box>
                    {steps.length > 1 && (
                      <Box
                        as="button"
                        w="28px"
                        h="28px"
                        borderRadius="4px"
                        bg="mukuru.white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        onClick={() => removeStep(index)}
                      >
                        <FiTrash2 size={14} style={{ color: '#DC2626' }} />
                      </Box>
                    )}
                  </HStack>
                </Flex>

                {/* Step Body - Clean Form */}
                <Box p="14px" bg="mukuru.cards.white">
                  {/* Title & Subtitle - Inline */}
                  <SimpleGrid columns={2} gap="14px" mb="12px">
                    <Box>
                      <Typography
                        fontSize="11px"
                        fontWeight="700"
                        color="mukuru.grey.mediumDark"
                        mb="4px"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                      >
                        Title
                      </Typography>
                      <ChakraInput
                        value={step.title}
                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                        placeholder="Step title"
                        size="sm"
                        bg="mukuru.grey.light"
                        borderColor="mukuru.grey.light"
                        borderRadius="6px"
                        fontSize="13px"
                        fontWeight="500"
                        _focus={{
                          borderColor: 'mukuru.buttons.primary',
                          bg: 'mukuru.cards.white',
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        fontSize="11px"
                        fontWeight="700"
                        color="mukuru.grey.mediumDark"
                        mb="4px"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                      >
                        Subtitle
                      </Typography>
                      <ChakraInput
                        value={step.subtitle}
                        onChange={(e) => updateStep(index, 'subtitle', e.target.value)}
                        placeholder="Step description"
                        size="sm"
                        bg="mukuru.grey.light"
                        borderColor="mukuru.grey.light"
                        borderRadius="6px"
                        fontSize="13px"
                        fontWeight="500"
                        _focus={{
                          borderColor: 'mukuru.buttons.primary',
                          bg: 'mukuru.cards.white',
                        }}
                      />
                    </Box>
                  </SimpleGrid>

                  {/* Category */}
                  <Box mb="12px">
                    <Typography
                      fontSize="11px"
                      fontWeight="700"
                      color="mukuru.grey.mediumDark"
                      mb="4px"
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                    >
                      Category
                    </Typography>
                    <select
                      value={step.checklistCategory}
                      onChange={(e) =>
                        updateStep(index, 'checklistCategory', e.target.value)
                      }
                      style={{
                        width: '100%',
                        backgroundColor: '#F5F5F5',
                        border: '1px solid #E5E5E5',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        color: '#333333',
                        fontWeight: '500',
                      }}
                    >
                      <option value="">Select category</option>
                      {checklistCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </Box>

                  {/* Requirements */}
                  <Box>
                    <Typography
                      fontSize="11px"
                      fontWeight="700"
                      color="mukuru.grey.mediumDark"
                      mb="4px"
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                    >
                      Requirements ({step.requirementIds.length} selected)
                    </Typography>
                    {!formData.entityTypeId ? (
                      <Box
                        bg="mukuru.grey.light"
                        border="1px solid"
                        borderColor="mukuru.grey.light"
                        borderRadius="6px"
                        p="10px"
                        textAlign="center"
                      >
                        <Typography fontSize="12px" color="mukuru.grey.medium">
                          Select an entity type first
                        </Typography>
                      </Box>
                    ) : entityRequirements.length === 0 ? (
                      <Box
                        bg="mukuru.grey.light"
                        border="1px solid"
                        borderColor="mukuru.grey.light"
                        borderRadius="6px"
                        p="10px"
                        textAlign="center"
                      >
                        <Typography fontSize="12px" color="mukuru.grey.medium">
                          No requirements
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        bg="mukuru.grey.light"
                        border="1px solid"
                        borderColor="mukuru.grey.light"
                        borderRadius="6px"
                        maxH="180px"
                        overflowY="auto"
                      >
                        {(() => {
                          const groupedByTypeMap = new Map<string, Requirement[]>();
                          entityRequirements.forEach((req) => {
                            const type = req.type || 'Other';
                            const existing = groupedByTypeMap.get(type) || [];
                            groupedByTypeMap.set(type, [...existing, req]);
                          });
                          return Array.from(groupedByTypeMap.entries()).map(
                            ([type, reqs]) => (
                              <Box key={type}>
                                <Box bg="mukuru.grey.light" px="10px" py="4px">
                                  <Typography
                                    fontSize="10px"
                                    fontWeight="700"
                                    color="mukuru.grey.mediumDark"
                                    textTransform="uppercase"
                                  >
                                    {type}
                                  </Typography>
                                </Box>
                                {reqs.map((req) => (
                                  <Flex
                                    key={req.id}
                                    gap="10px"
                                    py="8px"
                                    px="10px"
                                    bg="mukuru.cards.white"
                                    borderBottom="1px solid"
                                    borderColor="mukuru.grey.light"
                                    cursor="pointer"
                                    _hover={{ bg: 'mukuru.state.hover.card' }}
                                    onClick={() => toggleRequirement(index, req.id)}
                                    align="flex-start"
                                  >
                                    <Box pt="2px">
                                      <ChakraCheckbox.Root
                                        checked={step.requirementIds.includes(req.id)}
                                        onCheckedChange={() =>
                                          toggleRequirement(index, req.id)
                                        }
                                        size="sm"
                                      >
                                        <ChakraCheckbox.Control>
                                          <ChakraCheckbox.Indicator>
                                            ✓
                                          </ChakraCheckbox.Indicator>
                                        </ChakraCheckbox.Control>
                                      </ChakraCheckbox.Root>
                                    </Box>
                                    <VStack align="start" gap="2px" flex="1">
                                      <Typography
                                        fontSize="13px"
                                        fontWeight="600"
                                        color="mukuru.text.primary"
                                      >
                                        {req.displayName}
                                      </Typography>
                                      {req.description && (
                                        <Typography
                                          fontSize="11px"
                                          color="mukuru.grey.medium"
                                          fontWeight="400"
                                        >
                                          {req.description}
                                        </Typography>
                                      )}
                                    </VStack>
                                  </Flex>
                                ))}
                              </Box>
                            )
                          );
                        })()}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
}
