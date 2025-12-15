'use client';
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Container,
  VStack,
  HStack,
  Flex,
  Image,
  Circle,
  SimpleGrid,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { Button, Typography, Tag, MukuruLogo } from '@/lib/mukuruImports';
import { FiArrowRight, FiSave, FiEye, FiZap, FiMessageSquare } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PartnerHeader } from '@/components/PartnerHeader';
import { useState, useEffect, useMemo } from 'react';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import {
  getEntityFormConfig,
  entityFormConfigs,
  FormField,
  EntityFormConfig,
} from '@/lib/entityFormConfigs';
import { EnhancedDynamicForm } from '@/components/EnhancedDynamicForm';
import { ProgressTracking } from '@/components/ProgressTracking';
import { EnhancedContextualMessaging } from '@/components/EnhancedContextualMessaging';
import { OCRIntegration } from '@/components/OCRIntegration';
import { getAuthUser, getInitials } from '@/lib/auth/session';
import {
  entityConfigApiService,
  EntityType,
  Requirement,
  WizardConfiguration,
} from '@/services/entityConfigApi';
import { uploadFilesToDocumentService } from '@/lib/documentUpload';
import { getIconComponent, getEntityTypeIcon } from '@/utils/iconUtils';

const MotionBox = motion.create(Box);

interface EntityTypeOption {
  value: string;
  label: string;
  description: string;
  icon?: string;
  originalCode?: string;
}

// Map backend entity codes to form config keys
// This handles differences between backend codes and form config keys
const mapEntityCodeToFormConfig = (code: string): string => {
  const codeLower = code.toLowerCase();
  // Map common variations
  const mapping: Record<string, string> = {
    private_company: 'private_company',
    public_company: 'private_company', // Use private company form as fallback
    ngo: 'npo',
    npo: 'npo',
    non_profit: 'npo',
    government: 'government',
    state_owned: 'government',
    sole_proprietor: 'private_company', // Use private company form as fallback
    sole_trader: 'private_company', // Use private company form as fallback (same as sole_proprietor)
    partnership: 'private_company', // Use private company form as fallback
    trust: 'private_company', // Use private company form as fallback
  };

  return mapping[codeLower] || codeLower;
};

export default function EnhancedNewPartnerApplicationPage() {
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email?: string;
    companyName?: string;
  }>({
    name: 'User',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastState, setToastState] = useState<{
    status: 'success' | 'error' | 'info';
    title: string;
    description?: string;
  } | null>(null);
  const [entityTypes, setEntityTypes] = useState<EntityTypeOption[]>([]);
  const [loadingEntityTypes, setLoadingEntityTypes] = useState(true);
  const [entityTypesError, setEntityTypesError] = useState<string | null>(null);
  const [selectedEntityTypeData, setSelectedEntityTypeData] = useState<EntityType | null>(
    null
  );
  const [loadingEntityTypeData, setLoadingEntityTypeData] = useState(false);
  const [wizardConfiguration, setWizardConfiguration] =
    useState<WizardConfiguration | null>(null);
  const [loadingWizardConfig, setLoadingWizardConfig] = useState(false);
  // Store File objects temporarily (will be uploaded to Document Service after case creation)
  const [fileObjects, setFileObjects] = useState<Map<string, File>>(new Map());

  const showToast = (args: {
    status: 'success' | 'error' | 'info';
    title: string;
    description?: string;
  }) => {
    setToastState(args);
    setTimeout(() => setToastState(null), 5000);
  };

  // Fetch entity types from backend
  useEffect(() => {
    const loadEntityTypes = async () => {
      try {
        setLoadingEntityTypes(true);
        setEntityTypesError(null);
        const data = await entityConfigApiService.getEntityTypes(false, false);

        // Map backend data to frontend format
        // Normalize codes to lowercase and map to form config keys
        // Deduplicate by original code to prevent duplicate keys
        const seenCodes = new Set<string>();
        const mappedTypes: EntityTypeOption[] = data
          .filter((et) => {
            // Filter active and deduplicate by code
            if (!et.isActive) return false;
            const codeKey = et.code.toLowerCase();
            if (seenCodes.has(codeKey)) {
              console.warn(
                `Duplicate entity type code detected: ${et.code}. Skipping duplicate.`
              );
              return false;
            }
            seenCodes.add(codeKey);
            return true;
          })
          .map((et) => {
            const formConfigKey = mapEntityCodeToFormConfig(et.code);
            // Determine icon: use backend icon if available, otherwise map from entity type
            const iconName = et.icon || getEntityTypeIcon(et.displayName, et.code);
            return {
              value: formConfigKey, // Use mapped key for form config lookup
              label: et.displayName,
              description: et.description || 'No description available',
              icon: iconName, // Include icon from backend or mapped icon
              originalCode: et.code, // Keep original for reference (unique identifier)
            };
          });

        // Log if some entity types don't have static form configs (they'll use backend-generated forms)
        // This is expected behavior, so we use debug level instead of warning
        mappedTypes.forEach((et) => {
          const config = getEntityFormConfig(et.value);
          if (!config) {
            console.info(
              `No static form config for entity type: ${et.value} (original code: ${et.originalCode}). Will use backend-generated form from Entity Configuration Service.`
            );
          }
        });

        console.info(
          `[Enhanced Page] Loaded ${mappedTypes.length} entity types from backend`
        );
        setEntityTypes(mappedTypes);
      } catch (err) {
        console.error('Error loading entity types:', err);
        console.error('Error details:', err instanceof Error ? err.message : String(err));
        setEntityTypesError('Failed to load entity types. Please try again later.');
        showToast({
          status: 'error',
          title: 'Loading Error',
          description: 'Failed to load entity types from the server',
        });
        // Fallback to empty array - page will show error state
        setEntityTypes([]);
      } finally {
        setLoadingEntityTypes(false);
      }
    };

    loadEntityTypes();
  }, []);

  // Convert backend requirement to form field
  const convertRequirementToFormField = (
    req: Requirement,
    isRequired: boolean,
    displayOrder: number
  ): FormField => {
    // Map backend fieldType to frontend field type (case-insensitive)
    const fieldTypeMap: Record<string, FormField['type']> = {
      text: 'text',
      email: 'email',
      phone: 'tel',
      tel: 'tel',
      number: 'number',
      date: 'date',
      textarea: 'textarea',
      select: 'select',
      multiselect: 'select',
      file: 'file',
      checkbox: 'checkbox',
      radio: 'radio',
    };

    // Determine field type - check fieldType first, then requirement type
    let fieldType: FormField['type'] = 'text';

    if (req.fieldType) {
      const normalizedFieldType = req.fieldType.toLowerCase().trim();
      fieldType = fieldTypeMap[normalizedFieldType] || 'text';

      // Log if we couldn't map the fieldType
      if (!fieldTypeMap[normalizedFieldType]) {
        console.warn(
          `Unknown fieldType "${req.fieldType}" for requirement "${req.displayName}" (${req.code}). ` +
            `Using default "text". Available types: ${Object.keys(fieldTypeMap).join(', ')}`
        );
      }
    }

    // Auto-detect file type based on requirement type or name
    // Requirements with type "DOCUMENTATION" or names containing "document", "file", "upload" should be file fields
    const requirementType = req.type?.toUpperCase() || '';
    const requirementName = req.displayName?.toLowerCase() || '';
    const requirementCode = req.code?.toLowerCase() || '';

    if (
      requirementType === 'DOCUMENTATION' ||
      requirementType === 'DOCUMENT' ||
      requirementName.includes('document') ||
      requirementName.includes('file') ||
      requirementName.includes('upload') ||
      requirementName.includes('id document') ||
      requirementCode.includes('document') ||
      requirementCode.includes('file') ||
      requirementCode.includes('upload')
    ) {
      // Override to file type if it's a documentation requirement
      if (fieldType !== 'file') {
        console.info(
          `Auto-detected file type for requirement "${req.displayName}" ` +
            `(type: ${requirementType}, fieldType: ${req.fieldType})`
        );
        fieldType = 'file';
      }
    }

    // Parse validation rules if present
    let validation: FormField['validation'] | undefined;
    if (req.validationRules) {
      try {
        const rules = JSON.parse(req.validationRules);
        validation = {
          min: rules.minLength || rules.min,
          max: rules.maxLength || rules.max,
          pattern: rules.pattern,
        };
      } catch {
        console.warn('Failed to parse validation rules:', req.validationRules);
      }
    }

    // Convert requirement options to form field options
    const options = req.options?.map((opt) => ({
      value: opt.value,
      label: opt.displayText,
      disabled: false,
    }));

    console.info(
      `Converting requirement "${req.displayName}" (${req.code}): ` +
        `type="${req.type}", fieldType="${req.fieldType}" → formFieldType="${fieldType}"`
    );

    return {
      id: req.code.toLowerCase(),
      label: req.displayName,
      type: fieldType,
      required: isRequired,
      placeholder: req.description || `Enter ${req.displayName.toLowerCase()}`,
      description: req.helpText || req.description,
      validation,
      options,
      order: displayOrder,
    };
  };

  // Generate form config from backend entity type requirements
  const generateFormConfigFromBackend = (
    entityType: EntityType
  ): EntityFormConfig | null => {
    if (!entityType.requirements || entityType.requirements.length === 0) {
      console.warn(
        `⚠️ Entity type "${entityType.displayName}" has no requirements. ` +
          `Cannot generate form. Please add requirements to this entity type in the admin portal.`
      );
      return null;
    }

    console.info(
      `Generating form config for "${entityType.displayName}" with ${entityType.requirements.length} requirements`
    );

    // Group requirements by type (case-insensitive for matching)
    const requirementsByType = new Map<string, typeof entityType.requirements>();

    // Debug: Check if requirements are present
    console.info(
      `Processing ${entityType.requirements?.length || 0} requirements for entity type "${entityType.displayName}"`
    );

    entityType.requirements.forEach((etReq, index) => {
      if (!etReq.requirement) {
        console.warn(`Requirement at index ${index} has no requirement object:`, etReq);
        return;
      }

      const type = etReq.requirement.type;
      // Store with original case, but also create lowercase key for matching
      const typeKey = type.toLowerCase();
      if (!requirementsByType.has(typeKey)) {
        requirementsByType.set(typeKey, []);
      }
      requirementsByType.get(typeKey)!.push(etReq);

      console.info(
        `Requirement "${etReq.requirement.displayName}" (${etReq.requirement.code}) ` +
          `has type "${type}" (key: "${typeKey}")`
      );
    });

    const requirementTypes = Array.from(requirementsByType.keys());
    console.info('Requirements grouped by type:', requirementTypes);
    console.info(
      `Total requirements: ${entityType.requirements?.length || 0}, ` +
        `Grouped into ${requirementTypes.length} types:`,
      requirementTypes.map((type) => ({
        type,
        count: requirementsByType.get(type)?.length || 0,
      }))
    );

    // Use wizard configuration steps if available, otherwise fall back to hardcoded steps
    let stepDefinitions: Array<{
      types: string[];
      title: string;
      subtitle: string;
      checklistCategory: string;
      stepNumber: number;
    }> = [];

    if (
      wizardConfiguration &&
      wizardConfiguration.steps &&
      wizardConfiguration.steps.length > 0
    ) {
      // Use wizard configuration steps - filter to only active steps and sort by stepNumber
      const activeWizardSteps = wizardConfiguration.steps
        .filter((step) => step.isActive)
        .sort((a, b) => a.stepNumber - b.stepNumber);

      stepDefinitions = activeWizardSteps.map((wizardStep) => ({
        types: wizardStep.requirementTypes || [],
        title: wizardStep.title,
        subtitle: wizardStep.subtitle,
        checklistCategory: wizardStep.checklistCategory || 'Compliance',
        stepNumber: wizardStep.stepNumber,
      }));

      console.info(
        `Using wizard configuration: ${activeWizardSteps.length} steps`,
        stepDefinitions.map((s) => ({
          title: s.title,
          stepNumber: s.stepNumber,
          requirementTypes: s.types,
        }))
      );
    } else {
      // Fallback to hardcoded steps if no wizard configuration
      console.info('No wizard configuration found, using fallback steps');
      stepDefinitions = [
        {
          types: ['Information'],
          title: 'Business Information',
          subtitle: 'Company details and registration',
          checklistCategory: 'Compliance',
          stepNumber: 1,
        },
        {
          types: ['ProofOfIdentity'],
          title: 'Identity Verification',
          subtitle: 'Proof of identity documents and verification',
          checklistCategory: 'Identity',
          stepNumber: 2,
        },
        {
          types: ['ProofOfAddress'],
          title: 'Address Verification',
          subtitle: 'Proof of address documents',
          checklistCategory: 'Address',
          stepNumber: 3,
        },
        {
          types: ['OwnershipStructure'],
          title: 'Ownership & Control',
          subtitle: 'Shareholders, beneficial owners, and ownership structure',
          checklistCategory: 'Compliance',
          stepNumber: 4,
        },
        {
          types: ['BoardDirectors'],
          title: 'Management & Directors',
          subtitle: 'Board of directors and key management personnel',
          checklistCategory: 'Compliance',
          stepNumber: 5,
        },
        {
          types: ['AuthorizedSignatories'],
          title: 'Authorized Signatories',
          subtitle: 'Persons authorized to sign on behalf of the entity',
          checklistCategory: 'Compliance',
          stepNumber: 6,
        },
        {
          types: ['Document', 'Documentation'],
          title: 'Additional Documents',
          subtitle: 'Any additional required documents and certificates',
          checklistCategory: 'Documentation',
          stepNumber: 7,
        },
      ];
    }

    const steps = stepDefinitions
      .map((stepInfo) => {
        // Collect requirements that match any of the step's requirement types (case-insensitive)
        const matchingReqs: typeof entityType.requirements = [];
        stepInfo.types.forEach((reqType) => {
          // Try exact match first, then case-insensitive match
          const typeKey = reqType.toLowerCase();
          const reqs = requirementsByType.get(typeKey);
          if (reqs) {
            matchingReqs.push(...reqs);
          } else {
            // Try to find by partial match (e.g., "INFORMATION" matches "Information")
            for (const [key, value] of requirementsByType.entries()) {
              if (
                key.toLowerCase() === typeKey ||
                key.toLowerCase().includes(typeKey) ||
                typeKey.includes(key.toLowerCase())
              ) {
                matchingReqs.push(...value);
                break;
              }
            }
          }
        });

        console.info(
          `Step "${stepInfo.title}" (types: ${stepInfo.types.join(', ')}) matched ${matchingReqs.length} requirements`
        );

        // Sort by display order
        const sortedReqs = [...matchingReqs].sort(
          (a, b) => a.displayOrder - b.displayOrder
        );

        const fields = sortedReqs
          .filter((etReq) => etReq.requirement && etReq.requirement.isActive)
          .map((etReq) =>
            convertRequirementToFormField(
              etReq.requirement!,
              etReq.isRequired,
              etReq.displayOrder
            )
          );

        // If using wizard configuration, show ALL steps even if they have no fields
        // This ensures the wizard steps are always displayed as configured
        const isWizardConfigStep =
          wizardConfiguration &&
          wizardConfiguration.steps &&
          wizardConfiguration.steps.length > 0;

        // Only filter out steps if:
        // 1. Not using wizard config (fallback mode) AND
        // 2. No matching requirements found
        if (!isWizardConfigStep && matchingReqs.length === 0) {
          return null;
        }

        // For wizard config steps, show them even with empty fields
        // For fallback steps, only show if they have fields
        if (!isWizardConfigStep && fields.length === 0) {
          return null;
        }

        return {
          id: `step-${stepInfo.stepNumber}`,
          title: stepInfo.title,
          subtitle: stepInfo.subtitle,
          fields: fields.length > 0 ? fields : [], // Allow empty fields for wizard config steps
          requiredDocuments: fields.filter((f) => f.type === 'file').map((f) => f.id),
          // Metadata for integration
          requirementType: stepInfo.types.join(','), // Store all types for this step
          checklistCategory: stepInfo.checklistCategory,
          stepNumber: stepInfo.stepNumber,
        };
      })
      .filter((step) => step !== null) as EntityFormConfig['steps'];

    if (steps.length === 0) {
      return null;
    }

    console.info(
      `Generated form config with ${steps.length} steps from ${
        wizardConfiguration ? 'wizard configuration' : 'fallback'
      }`
    );

    return {
      entityType: entityType.code.toLowerCase(),
      displayName: entityType.displayName,
      description: entityType.description,
      steps,
      requiredDocuments: [],
    };
  };

  // Get entity form configuration - prioritize backend data over static configs
  // Use useMemo to recompute when backend data or selected entity type changes
  // IMPORTANT: Wait for wizard config to finish loading before generating form
  // This prevents the form from flickering/disappearing
  const entityConfig = useMemo(() => {
    // Don't generate config if we're still loading wizard config
    // This prevents the form from showing fallback steps and then switching to wizard steps
    if (loadingWizardConfig && selectedEntityTypeData?.id) {
      console.info('Waiting for wizard configuration to load...');
      return null;
    }

    let config: EntityFormConfig | null = null;

    // First, try to generate config from backend requirements
    if (
      selectedEntityTypeData &&
      selectedEntityTypeData.requirements &&
      selectedEntityTypeData.requirements.length > 0
    ) {
      config = generateFormConfigFromBackend(selectedEntityTypeData);
      if (config) {
        console.info('Using backend-generated form config:', config);
      }
    }

    // Fallback to static config if backend doesn't have requirements
    if (!config) {
      config = getEntityFormConfig(selectedEntityType);
      if (!config && selectedEntityType) {
        // Try to find the entity type in the list to get display name
        const entityTypeInfo = entityTypes.find((et) => et.value === selectedEntityType);
        const fallbackConfig = getEntityFormConfig('private_company');
        if (fallbackConfig && entityTypeInfo) {
          // Use fallback config but with the correct entity type info
          config = {
            ...fallbackConfig,
            entityType: selectedEntityType,
            displayName: entityTypeInfo.label,
            description: entityTypeInfo.description,
          };
        }
      }
    }

    return config;
  }, [
    selectedEntityTypeData,
    selectedEntityType,
    entityTypes,
    wizardConfiguration,
    loadingWizardConfig,
  ]);

  // Debug logging
  useEffect(() => {
    if (selectedEntityType) {
      console.info('Selected entity type:', selectedEntityType);
      console.info('Entity config found:', !!entityConfig);
      if (!entityConfig) {
        console.warn('No entity config found for:', selectedEntityType);
        console.info('Available configs:', Object.keys(entityFormConfigs));
      }
    }
  }, [selectedEntityType, entityConfig]);

  // Initial form data
  const initialFormData: Record<string, any> = {
    entityType: '',
    // Will be populated based on entity type configuration
  };

  // Use form persistence hook
  const { formData, updateField, isDirty, lastSaved, isSaving, saveError, forceSave } =
    useFormPersistence(initialFormData, { formId: 'new-application' });

  // Update form data when entity type changes
  useEffect(() => {
    if (selectedEntityType && selectedEntityType !== formData.entityType) {
      updateField('entityType', selectedEntityType);
    }
  }, [selectedEntityType, formData.entityType, updateField]);

  // Fetch entity type data with requirements when selected
  useEffect(() => {
    const loadEntityTypeData = async () => {
      if (!selectedEntityType) {
        setSelectedEntityTypeData(null);
        return;
      }

      try {
        setLoadingEntityTypeData(true);
        // Find the entity type ID from the entity types list
        const entityTypeOption = entityTypes.find(
          (et) => et.value === selectedEntityType
        );
        if (!entityTypeOption || !entityTypeOption.originalCode) {
          console.warn('Entity type not found in list');
          return;
        }

        // Get all entity types with requirements to find the one we need
        const allEntityTypes = await entityConfigApiService.getEntityTypes(false, true);
        const entityTypeData = allEntityTypes.find(
          (et) => et.code.toLowerCase() === entityTypeOption.originalCode?.toLowerCase()
        );

        if (entityTypeData) {
          // If requirements don't have the nested requirement object, fetch them separately
          if (
            entityTypeData.requirements &&
            entityTypeData.requirements.length > 0 &&
            entityTypeData.requirements.some((r) => !r.requirement)
          ) {
            console.info(
              `Entity type has ${entityTypeData.requirements.length} requirements but missing nested requirement objects. Fetching requirements...`
            );

            // Fetch all requirements
            const allRequirements = await entityConfigApiService.getRequirements();

            // Map requirement IDs to requirement objects
            const requirementsMap = new Map(allRequirements.map((req) => [req.id, req]));

            // Merge requirement details into entity type requirements
            entityTypeData.requirements = entityTypeData.requirements.map((etReq) => ({
              ...etReq,
              requirement: requirementsMap.get(etReq.requirementId),
            }));

            console.info(
              `Merged ${entityTypeData.requirements.filter((r) => r.requirement).length} requirements with full details`
            );
          }

          setSelectedEntityTypeData(entityTypeData);
          console.info('Loaded entity type data:', entityTypeData);
          console.info(
            `Entity type "${entityTypeData.displayName}" has ${entityTypeData.requirements?.length || 0} requirements:`,
            entityTypeData.requirements?.map((r) => ({
              id: r.id,
              requirementId: r.requirementId,
              requirementType: r.requirement?.type,
              requirementCode: r.requirement?.code,
              displayName: r.requirement?.displayName,
              isActive: r.requirement?.isActive,
            }))
          );

          if (!entityTypeData.requirements || entityTypeData.requirements.length === 0) {
            console.warn(
              `⚠️ Entity type "${entityTypeData.displayName}" has no requirements. ` +
                `The wizard configuration steps won't have any fields to display. ` +
                `Please add requirements to this entity type in the admin portal.`
            );
          }
        } else {
          console.warn('Entity type data not found');
          setSelectedEntityTypeData(null);
        }
      } catch (err) {
        console.error('Error loading entity type data:', err);
        setSelectedEntityTypeData(null);
      } finally {
        setLoadingEntityTypeData(false);
      }
    };

    loadEntityTypeData();
  }, [selectedEntityType, entityTypes]);

  // Fetch wizard configuration when entity type data is loaded
  useEffect(() => {
    const loadWizardConfiguration = async () => {
      if (!selectedEntityTypeData?.id) {
        // Only clear wizard config if entity type data is explicitly cleared
        // Don't clear it during loading to prevent flickering
        if (selectedEntityTypeData === null) {
          setWizardConfiguration(null);
        }
        return;
      }

      try {
        setLoadingWizardConfig(true);
        const wizardConfig =
          await entityConfigApiService.getWizardConfigurationByEntityType(
            selectedEntityTypeData.id
          );
        if (wizardConfig) {
          setWizardConfiguration(wizardConfig);
          console.info('Loaded wizard configuration:', wizardConfig);
          console.info(
            `Wizard config has ${wizardConfig.steps?.length || 0} steps:`,
            wizardConfig.steps?.map((s) => ({
              stepNumber: s.stepNumber,
              title: s.title,
              isActive: s.isActive,
              requirementTypes: s.requirementTypes,
            }))
          );
        } else {
          console.info(
            'No wizard configuration found for entity type:',
            selectedEntityTypeData.id
          );
          // Only set to null if we're sure there's no config
          // This prevents flickering when the API call is slow
          setWizardConfiguration(null);
        }
      } catch (err) {
        // Handle 404 gracefully - it's expected that not all entity types have wizard configs
        if (err instanceof Error && err.message.includes('404')) {
          console.info(
            'No wizard configuration found for entity type:',
            selectedEntityTypeData.id
          );
          setWizardConfiguration(null);
        } else {
          console.error('Error loading wizard configuration:', err);
        }
        // Don't set to null on other errors - keep previous config to prevent flickering
      } finally {
        setLoadingWizardConfig(false);
      }
    };

    loadWizardConfiguration();
  }, [selectedEntityTypeData?.id]);

  const handleEntityTypeSelect = (_entityType: Record<string, unknown> | string) => {
    let entityTypeValue: string;
    if (typeof _entityType === 'string') {
      entityTypeValue = _entityType;
    } else {
      entityTypeValue = ((_entityType as { value?: string }).value || '') as string;
    }
    setSelectedEntityType(entityTypeValue);
    setCurrentStep(1);
    setValidationErrors({});
  };

  const handleFieldChange = (fieldId: string, value: string | boolean | any) => {
    updateField(fieldId, value);

    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Sync step completion with checklist and work-queue services
  const handleStepComplete = async (stepId: string) => {
    if (!entityConfig) return;

    const step = entityConfig.steps.find((s) => s.id === stepId);
    if (!step) return;

    console.info(`Step ${stepId} (${step.title}) completed`);

    // Note: caseId, checklistId, and applicationId are not available in new application flow
    // These would be available after case creation, but this is a new application page
    // This function is kept for future use when editing existing applications
    try {
      // Future: If we have a case ID, update checklist items for this step
      // const caseId = ...; // Would come from props or state after case creation
      // const checklistId = ...; // Would come from props or state after case creation
      // if (caseId && checklistId && step.checklistCategory) {
      //   // Implementation for existing applications
      // }
      // Future: Update work queue progress if we have an application ID
      // const applicationId = ...; // Would come from props or state after case creation
      // if (applicationId) {
      //   const progress = Math.round((currentStep / entityConfig.steps.length) * 100);
      //   await integrationService.updateWorkQueueItem(applicationId, {
      //     progress,
      //     notes: `Completed step: ${step.title}`,
      //   });
      // }
    } catch (err) {
      console.error('Error syncing step completion:', err);
      // Don't block user flow if sync fails
    }
  };

  const handleNext = async () => {
    if (!entityConfig) return;

    const currentStepConfig = entityConfig.steps[currentStep - 1];
    if (!currentStepConfig) return;

    // Validate current step
    const errors: Record<string, string> = {};
    currentStepConfig.fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors[field.id] = `${field.label} is required`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast({
        status: 'error',
        title: 'Validation Error',
        description: 'Please complete all required fields before proceeding',
      });
      return;
    }

    setValidationErrors({});

    // Sync step completion with backend services before moving to next step
    if (currentStepConfig) {
      await handleStepComplete(currentStepConfig.id);
    }

    if (currentStep < entityConfig.steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!entityConfig) return;

    // Log file state before submission
    console.info('📋 Form submission started:', {
      fileObjectsCount: fileObjects.size,
      fileObjectsKeys: Array.from(fileObjects.keys()),
      fileObjectsNames: Array.from(fileObjects.values()).map((f) => f.name),
    });

    // Prevent double submission
    if (isSubmitting) {
      console.warn('⚠️ Submission already in progress, ignoring duplicate call');
      return;
    }

    setIsSubmitting(true);
    console.info('🎯 Starting submission process...');

    try {
      // DYNAMIC VALIDATION: Validate based ONLY on the Entity Configuration Service requirements
      // that are actually being used in the form (from entityConfig.steps)

      if (!entityConfig || !entityConfig.steps || entityConfig.steps.length === 0) {
        console.error('❌ Cannot validate: entityConfig is missing or has no steps');
        showToast({
          status: 'error',
          title: 'Validation Error',
          description: 'Form configuration is missing. Please refresh and try again.',
        });
        setIsSubmitting(false);
        return;
      }

      const errors: Record<string, string> = {};
      const validatedFields: Array<{
        stepId: string;
        stepTitle: string;
        fieldId: string;
        fieldLabel: string;
        required: boolean;
      }> = [];

      // Validate ONLY the fields that are in the entityConfig being used to render the form
      // This entityConfig comes from the backend Entity Configuration Service
      // It contains ONLY the fields configured for this specific entity type
      // IMPORTANT: This is the SAME entityConfig passed to EnhancedDynamicForm (config={entityConfig})
      // So validation matches exactly what's displayed in the form - no hardcoded fields!
      entityConfig.steps.forEach((step) => {
        if (!step.fields || step.fields.length === 0) {
          return; // Skip steps with no fields
        }

        step.fields.forEach((field) => {
          // Track all fields being validated for debugging
          validatedFields.push({
            stepId: step.id,
            stepTitle: step.title,
            fieldId: field.id,
            fieldLabel: field.label,
            required: field.required || false,
          });

          // Only validate required fields from the dynamic entity configuration
          // field.required comes from the backend requirement configuration (etReq.isRequired)
          if (field.required) {
            const value = formData[field.id];
            // Check for empty values (null, undefined, empty string, or whitespace-only)
            const isEmpty =
              value === undefined ||
              value === null ||
              value === '' ||
              (typeof value === 'string' && value.trim() === '') ||
              (Array.isArray(value) && value.length === 0);

            if (isEmpty) {
              // Use field.label from entity config, not hardcoded text
              errors[field.id] = `${field.label} is required`;
            }
          }
        });
      });

      // Log validation details for debugging
      // This confirms we're using the entity config that's actually rendering the form
      console.info('🔍 Validation check - Using entity configuration:', {
        entityType: entityConfig.entityType,
        displayName: entityConfig.displayName,
        source: selectedEntityTypeData
          ? 'Backend Entity Configuration Service'
          : 'Static fallback config',
        totalSteps: entityConfig.steps.length,
        totalFields: validatedFields.length,
        requiredFields: validatedFields.filter((f) => f.required).length,
        missingFields: Object.keys(errors).length,
        validatedFields: validatedFields.map((f) => ({
          step: f.stepTitle,
          fieldId: f.fieldId,
          fieldLabel: f.fieldLabel,
          required: f.required,
        })),
        formDataKeys: Object.keys(formData),
        errors: errors,
      });

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        const missingFieldsList = Object.keys(errors)
          .map((k) => {
            const field = validatedFields.find((f) => f.fieldId === k);
            return field ? field.fieldLabel : k;
          })
          .join(', ');

        console.warn(
          '❌ Dynamic validation failed. Missing required fields from entity configuration:',
          {
            missingFields: missingFieldsList,
            missingFieldIds: Object.keys(errors),
            stepBreakdown: entityConfig.steps.map((step) => ({
              stepTitle: step.title,
              requiredFields: step.fields
                .filter((f) => f.required)
                .map((f) => ({
                  id: f.id,
                  label: f.label,
                  hasValue: !!(
                    formData[f.id] &&
                    (typeof formData[f.id] !== 'string' || formData[f.id].trim() !== '')
                  ),
                })),
            })),
          }
        );

        showToast({
          status: 'error',
          title: 'Submission Failed',
          description: `Please complete all required fields: ${missingFieldsList}`,
        });
        setIsSubmitting(false); // Reset submitting state so button is enabled again
        return;
      }

      console.info(
        '✅ Dynamic validation passed - all required fields from entity configuration are filled'
      );

      // Try to submit to backend API first
      try {
        // Backend will generate PartnerId from authenticated user's email automatically
        // We still validate email exists in form data for user feedback, but backend uses authenticated user's email
        // Look for email in various possible field names (based on requirement codes)
        // Try to get user email from form data or current user
        // If not found, we'll try to get it from authenticated session
        const userEmail =
          formData['email'] ||
          formData['contact_email'] ||
          formData['applicant_email'] ||
          formData['personOfContact.email'] ||
          formData['applicant.email'] ||
          currentUser.email ||
          '';

        console.info('Looking for user email:', {
          foundEmail: userEmail,
          formDataKeys: Object.keys(formData),
          emailFields: {
            email: formData['email'],
            contact_email: formData['contact_email'],
            applicant_email: formData['applicant_email'],
            currentUserEmail: currentUser.email,
          },
        });

        // Note: Backend will use authenticated user's email from token to generate PartnerId
        // This validation is just for user feedback - backend doesn't rely on form email for PartnerId
        // Try to get email from authenticated session if not in form data
        let finalUserEmail = userEmail;
        if (!finalUserEmail) {
          try {
            const { getAuthUser } = await import('@/lib/auth/session');
            const authUser = getAuthUser();
            if (authUser?.email) {
              finalUserEmail = authUser.email;
              console.info('Using email from authenticated session:', finalUserEmail);
            }
          } catch (error) {
            console.warn('Could not get email from session:', error);
          }
        }

        // Only show warning if we still don't have an email, but don't block submission
        // Backend will use authenticated user's email from token anyway
        if (!finalUserEmail) {
          console.warn(
            '⚠️ No email found in form data or session, but proceeding anyway. ' +
              'Backend will use authenticated user email from token.'
          );
          // Don't block submission - backend will handle it
        }

        // Use finalUserEmail for applicant email if we have it, otherwise backend will use authenticated user's email
        const applicantEmail = finalUserEmail || 'will-be-set-by-backend';

        // Extract data from formData to create application
        // DYNAMICALLY map all form fields from entity configuration requirements
        // Field codes in formData are the requirement codes in lowercase (see convertRequirementToFormField)
        const getFieldValue = (fieldCode: string, fallbacks: string[] = []): any => {
          // Try direct field code first (lowercase as stored in formData)
          const lowerCode = fieldCode.toLowerCase();
          if (
            formData[lowerCode] !== undefined &&
            formData[lowerCode] !== null &&
            formData[lowerCode] !== ''
          ) {
            return formData[lowerCode];
          }
          // Try fallbacks
          for (const fallback of fallbacks) {
            const lowerFallback = fallback.toLowerCase();
            if (
              formData[lowerFallback] !== undefined &&
              formData[lowerFallback] !== null &&
              formData[lowerFallback] !== ''
            ) {
              return formData[lowerFallback];
            }
          }
          return undefined; // Return undefined instead of empty string to allow proper filtering
        };

        // Helper to get name parts from full name field
        const getNameParts = (
          fullName: string
        ): { firstName: string; lastName: string } => {
          if (!fullName) return { firstName: '', lastName: '' };
          const parts = fullName.trim().split(/\s+/);
          if (parts.length === 1) return { firstName: parts[0], lastName: '' };
          return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
        };

        // DYNAMICALLY build applicant object based on ACTUAL requirement codes from entity configuration
        // This ensures we only map fields that are actually configured in the entity type
        const requirements = selectedEntityTypeData?.requirements || [];
        const requirementMap = new Map<string, string>(); // Maps requirement code (uppercase) to formData key (lowercase)

        requirements.forEach((req) => {
          if (req.requirement?.code) {
            const codeUpper = req.requirement.code.toUpperCase();
            const codeLower = req.requirement.code.toLowerCase();
            requirementMap.set(codeUpper, codeLower);
          }
        });

        // Helper to find requirement code by pattern (e.g., find FIRST_NAME, GIVEN_NAME, etc.)
        const findRequirementValue = (patterns: string[]): any => {
          for (const pattern of patterns) {
            for (const [codeUpper, codeLower] of requirementMap.entries()) {
              if (codeUpper.includes(pattern) || codeUpper === pattern) {
                const value = getFieldValue(codeLower);
                if (value !== undefined && value !== null && value !== '') {
                  return value;
                }
              }
            }
          }
          return undefined;
        };

        // Map applicant fields DYNAMICALLY based on actual requirement codes
        // Only use fields that exist in the entity configuration
        const fullNameValue = findRequirementValue([
          'FULL_NAME',
          'NAME',
          'APPLICANT_NAME',
          'PERSON_OF_CONTACT',
          'CONTACT_NAME',
        ]);
        const nameParts = getNameParts(fullNameValue || '');

        const firstNameValue =
          findRequirementValue(['FIRST_NAME', 'FIRSTNAME', 'GIVEN_NAME']) ||
          nameParts.firstName;
        const lastNameValue =
          findRequirementValue(['LAST_NAME', 'LASTNAME', 'SURNAME', 'FAMILY_NAME']) ||
          nameParts.lastName;
        const emailValue =
          findRequirementValue(['EMAIL', 'APPLICANT_EMAIL', 'CONTACT_EMAIL']) ||
          finalUserEmail ||
          userEmail;
        const phoneValue = findRequirementValue([
          'PHONE',
          'PHONE_NUMBER',
          'CONTACT_PHONE',
          'MOBILE',
          'TELEPHONE',
        ]);
        const nationalityValue = findRequirementValue([
          'NATIONALITY',
          'COUNTRY_OF_NATIONALITY',
        ]);
        const dateOfBirthValue = findRequirementValue([
          'DATE_OF_BIRTH',
          'DOB',
          'BIRTH_DATE',
        ]);

        // Address fields - dynamically find from requirements
        const addressLine1Value = findRequirementValue([
          'ADDRESS',
          'RESIDENTIAL_ADDRESS',
          'APPLICANT_ADDRESS',
          'STREET_ADDRESS',
          'ADDRESS_LINE1',
          'ADDRESS_LINE_1',
        ]);
        const addressLine2Value = findRequirementValue([
          'ADDRESS_LINE2',
          'ADDRESS_LINE_2',
          'ADDRESS2',
        ]);
        const cityValue = findRequirementValue([
          'CITY',
          'APPLICANT_CITY',
          'RESIDENTIAL_CITY',
        ]);
        const stateValue = findRequirementValue(['STATE', 'PROVINCE', 'APPLICANT_STATE']);
        const postalCodeValue = findRequirementValue([
          'POSTAL_CODE',
          'POSTCODE',
          'ZIP_CODE',
          'APPLICANT_POSTAL_CODE',
        ]);
        const countryValue = findRequirementValue([
          'COUNTRY',
          'APPLICANT_COUNTRY',
          'RESIDENTIAL_COUNTRY',
          'COUNTRY_OF_RESIDENCE',
        ]);

        console.info('🔍 Dynamic applicant field mapping from entity requirements:', {
          requirementCodes: Array.from(requirementMap.keys()),
          mappedFields: {
            firstName: firstNameValue,
            lastName: lastNameValue,
            email: emailValue,
            phone: phoneValue,
            nationality: nationalityValue,
            dateOfBirth: dateOfBirthValue,
            address: {
              line1: addressLine1Value,
              line2: addressLine2Value,
              city: cityValue,
              state: stateValue,
              postalCode: postalCodeValue,
              country: countryValue,
            },
          },
          formDataKeys: Object.keys(formData),
        });

        // Build applicant object - ONLY include fields that have values (from configured requirements)
        const applicant: any = {};

        if (firstNameValue) applicant.firstName = firstNameValue;
        if (lastNameValue) applicant.lastName = lastNameValue;
        if (emailValue) applicant.email = emailValue;
        if (phoneValue) applicant.phoneNumber = phoneValue;
        if (nationalityValue) applicant.nationality = nationalityValue;
        if (dateOfBirthValue) applicant.dateOfBirth = dateOfBirthValue;

        // Only include address if at least one field has a value
        const hasAddressData = addressLine1Value || cityValue || countryValue;
        if (hasAddressData) {
          applicant.residentialAddress = {
            line1: addressLine1Value || '',
            line2: addressLine2Value || '',
            city: cityValue || '',
            state: stateValue || '',
            postalCode: postalCodeValue || '',
            country: countryValue || '',
          };
        }

        // Determine if this is a business entity type DYNAMICALLY from requirements
        // Check if entity type has business-related requirements
        // Requirements come with uppercase codes (LEGAL_NAME, REGISTRATION_NUMBER, etc.)
        // Note: 'requirements' is already declared above
        const requirementCodes = requirements
          .filter((req) => req.requirement)
          .map((req) => req.requirement!.code?.toUpperCase() || '');

        // Business-related requirement codes (check uppercase versions)
        const businessCodes = [
          'LEGAL_NAME',
          'BUSINESS_LEGAL_NAME',
          'COMPANY_NAME',
          'REGISTRATION_NUMBER',
          'BUSINESS_REGISTRATION',
          'INCORPORATION',
          'BUSINESS_ADDRESS',
          'REGISTERED_ADDRESS',
          'TRADING_NAME',
          'TRADE_NAME',
          'BUSINESS_NAME',
          'COUNTRY_OF_REGISTRATION',
          'COUNTRY_OF_INCORPORATION',
          'BUSINESS_ADDRESS',
          'TAX_NUMBER',
          'TAX_ID',
        ];

        // Check requirement types for business indicators
        const businessTypes = [
          'OwnershipStructure',
          'BoardDirectors',
          'AuthorizedSignatories',
        ];

        const hasBusinessCodes = requirementCodes.some((code) =>
          businessCodes.some((bc) => code.includes(bc))
        );

        const hasBusinessTypes = requirements.some((req) => {
          const type = req.requirement?.type || '';
          return businessTypes.some((bt) => type.includes(bt));
        });

        const isBusinessEntity = hasBusinessCodes || hasBusinessTypes;

        // Debug logging
        console.info('Business entity detection:', {
          requirementCodes,
          hasBusinessCodes,
          hasBusinessTypes,
          isBusinessEntity,
          requirementsCount: requirements.length,
        });

        // Build business object dynamically from entity configuration requirements
        // Extract business fields from the dynamic requirements configured for this entity type
        let business: any = undefined;
        if (isBusinessEntity && selectedEntityTypeData?.requirements) {
          // Dynamically extract business fields based on requirements configured for this entity type
          // Requirements use UPPERCASE codes, but formData uses lowercase (from convertRequirementToFormField)
          const businessRequirements = selectedEntityTypeData.requirements
            .filter((req) => req.requirement)
            .map((req) => ({
              codeUpper: req.requirement!.code?.toUpperCase() || '',
              codeLower: req.requirement!.code?.toLowerCase() || '',
              type: req.requirement!.type,
              fieldType: req.requirement!.fieldType,
            }));

          // Find business name from requirements - check all possible business name requirement codes
          // Map uppercase requirement codes to lowercase formData keys
          const businessNameReqs = businessRequirements.filter((r) =>
            [
              'LEGAL_NAME',
              'BUSINESS_LEGAL_NAME',
              'COMPANY_NAME',
              'BUSINESS_NAME',
              'REGISTERED_NAME',
              'TRADING_NAME',
              'TRADE_NAME',
            ].some((bc) => r.codeUpper.includes(bc))
          );

          const businessLegalName =
            businessNameReqs.length > 0
              ? getFieldValue(
                  businessNameReqs[0].codeLower,
                  businessNameReqs.slice(1).map((r) => r.codeLower)
                )
              : null;

          // Check if this entity type is likely a sole trader by checking requirement codes
          const isSoleTrader =
            businessRequirements.some(
              (r) =>
                r.codeUpper.includes('PROPRIETOR') ||
                r.codeUpper.includes('SOLE') ||
                r.codeUpper.includes('TRADER')
            ) ||
            selectedEntityTypeData.code?.toLowerCase().includes('sole') ||
            selectedEntityTypeData.code?.toLowerCase().includes('trader');

          const finalBusinessName =
            businessLegalName ||
            currentUser.companyName || // Use company name from user profile
            (isSoleTrader
              ? `${nameParts.firstName} ${nameParts.lastName}`.trim()
              : null) ||
            `${nameParts.firstName} ${nameParts.lastName}`.trim(); // Last resort

          console.info('🏢 Business name determination:', {
            businessLegalName,
            userCompanyName: currentUser.companyName,
            finalBusinessName,
            isSoleTrader,
          });

          // Find registration number from requirements
          const registrationReqs = businessRequirements.filter((r) =>
            [
              'REGISTRATION_NUMBER',
              'BUSINESS_REGISTRATION',
              'COMPANY_REGISTRATION',
              'TAX_NUMBER',
              'TAX_ID',
            ].some((rc) => r.codeUpper.includes(rc))
          );

          const registrationNumber =
            registrationReqs.length > 0
              ? getFieldValue(
                  registrationReqs[0].codeLower,
                  registrationReqs.slice(1).map((r) => r.codeLower)
                )
              : '';

          // Find country of registration from requirements
          const countryReqs = businessRequirements.filter((r) =>
            [
              'COUNTRY_OF_REGISTRATION',
              'COUNTRY_OF_INCORPORATION',
              'REGISTRATION_COUNTRY',
              'INCORPORATION_COUNTRY',
              'BUSINESS_COUNTRY',
            ].some((cc) => r.codeUpper.includes(cc))
          );

          const countryOfRegistration =
            countryReqs.length > 0
              ? getFieldValue(
                  countryReqs[0].codeLower,
                  countryReqs.slice(1).map((r) => r.codeLower)
                )
              : applicant.residentialAddress.country || '';

          // Find business address fields from requirements
          const addressReqs = businessRequirements.filter((r) =>
            ['BUSINESS_ADDRESS', 'REGISTERED_ADDRESS', 'COMPANY_ADDRESS'].some((ac) =>
              r.codeUpper.includes(ac)
            )
          );

          const addressLine1 =
            addressReqs.length > 0
              ? getFieldValue(
                  addressReqs[0].codeLower,
                  addressReqs.slice(1).map((r) => r.codeLower)
                )
              : applicant.residentialAddress.line1 || '';

          // Always build business object for business entity types
          if (finalBusinessName || isBusinessEntity) {
            const businessLegalName =
              finalBusinessName ||
              `${nameParts.firstName} ${nameParts.lastName}`.trim() ||
              'Business';

            console.info(
              '💼 Creating business object with legal name:',
              businessLegalName
            );

            business = {
              legalName: businessLegalName,
              registrationNumber: registrationNumber || '',
              countryOfRegistration: countryOfRegistration || '',
              registeredAddress: {
                line1: addressLine1 || applicant.residentialAddress.line1 || '',
                line2:
                  getFieldValue('business_address_line2', [
                    'registered_address_line2',
                    'business_address_line_2',
                    'company_address_line2',
                  ]) ||
                  applicant.residentialAddress.line2 ||
                  '',
                city:
                  getFieldValue('business_city', [
                    'registered_city',
                    'company_city',
                    'business_city_of_registration',
                  ]) ||
                  applicant.residentialAddress.city ||
                  '',
                state:
                  getFieldValue('business_state', [
                    'registered_state',
                    'company_state',
                    'business_state_of_registration',
                  ]) ||
                  applicant.residentialAddress.state ||
                  '',
                postalCode:
                  getFieldValue('business_postal_code', [
                    'registered_postal_code',
                    'company_postal_code',
                    'business_postcode',
                  ]) ||
                  applicant.residentialAddress.postalCode ||
                  '',
                country:
                  countryOfRegistration || applicant.residentialAddress.country || '',
              },
            };
          }
        }

        // Convert date string to ISO date format (YYYY-MM-DD) if present
        // Backend expects date format, not datetime
        if (applicant.dateOfBirth) {
          try {
            const date = new Date(applicant.dateOfBirth);
            if (isNaN(date.getTime())) {
              console.warn('Invalid date format for dateOfBirth:', applicant.dateOfBirth);
              applicant.dateOfBirth = undefined;
            } else {
              // Format as YYYY-MM-DD (date only, not datetime)
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              applicant.dateOfBirth = `${year}-${month}-${day}`;
            }
          } catch (error) {
            console.warn('Error processing dateOfBirth:', error, applicant.dateOfBirth);
            applicant.dateOfBirth = undefined;
          }
        }

        // Map entity type code to backend enum format
        // Backend expects: PRIVATE_COMPANY, PUBLIC_COMPANY, SOLE_PROPRIETOR, PARTNERSHIP, TRUST, NPO, etc.
        const mapEntityTypeToBackend = (code: string | undefined): string => {
          if (!code) return 'PRIVATE_COMPANY';
          const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '_');
          // Handle common variations
          if (upperCode.includes('PRIVATE') || upperCode.includes('COMPANY'))
            return 'PRIVATE_COMPANY';
          if (upperCode.includes('PUBLIC')) return 'PUBLIC_COMPANY';
          // Handle sole trader/proprietor variations
          if (
            upperCode.includes('SOLE') ||
            upperCode.includes('PROPRIETOR') ||
            upperCode.includes('TRADER')
          )
            return 'SOLE_PROPRIETOR';
          if (upperCode.includes('PARTNERSHIP')) return 'PARTNERSHIP';
          if (upperCode.includes('TRUST')) return 'TRUST';
          if (
            upperCode.includes('NPO') ||
            upperCode.includes('NGO') ||
            upperCode.includes('NON_PROFIT')
          )
            return 'NPO';
          return upperCode;
        };

        // Build application data with all mapped fields
        // API uses snake_case_lower naming policy (see Program.cs JsonNamingPolicy.SnakeCaseLower)
        // OnboardingType enum: 1=Individual, 2=Business
        // For business entity types, always use type 2 (Business), even if business object is minimal
        const onboardingType = isBusinessEntity ? 2 : 1; // 1=Individual, 2=Business

        const mappedEntityTypeCode = mapEntityTypeToBackend(
          selectedEntityTypeData?.code || formData['entityType']
        );
        const originalEntityTypeCode =
          selectedEntityTypeData?.code || formData['entityType'] || '';

        // Debug: Log what we're sending
        console.info('Submitting application with data:', {
          mappedEntityType: mappedEntityTypeCode,
          originalEntityTypeCode,
          isBusinessEntity,
          onboardingType,
          partnerId: 'Will be generated by backend from authenticated user email',
          applicant: {
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            email: applicant.email,
            dateOfBirth: applicant.dateOfBirth ? 'Date set' : 'Not set',
          },
          business: business
            ? {
                legalName: business.legalName,
                hasAddress: !!(
                  business.registeredAddress?.line1 && business.registeredAddress?.city
                ),
              }
            : 'Not set',
          formDataKeys: Object.keys(formData).filter(
            (k) => formData[k] !== undefined && formData[k] !== null && formData[k] !== ''
          ),
        });

        // DYNAMIC VALIDATION:
        // The form already validates required fields based on Entity Configuration Service requirements.
        // We only need to ensure we can construct a valid API request with the data we have.

        // Transform full_name to firstName/lastName if needed (for API format)
        // ONLY if we have a full_name value from the form
        if ((!applicant.firstName || !applicant.lastName) && fullNameValue) {
          const trimmedName = fullNameValue.trim();
          if (trimmedName) {
            const parts = trimmedName.split(/\s+/);
            applicant.firstName = parts[0] || '';
            applicant.lastName = parts.slice(1).join(' ') || '';
          }
        }

        // NO HARDCODED VALIDATION - validation is already done based on entityConfig.steps above
        // The form validation at the top of handleSubmit ensures all required fields from the
        // dynamic entity configuration are filled. We only need to format the data for the API here.

        // Format nationality to 2-character ISO code if present (only if field exists in form)
        // Map common country names to ISO codes, otherwise take first 2 characters
        if (applicant.nationality) {
          const countryNameToCode: Record<string, string> = {
            'south africa': 'ZA',
            kenya: 'KE',
            nigeria: 'NG',
            ghana: 'GH',
            zimbabwe: 'ZW',
            zambia: 'ZM',
            tanzania: 'TZ',
            uganda: 'UG',
            rwanda: 'RW',
            mauritius: 'MU',
            'united states': 'US',
            'united kingdom': 'GB',
            'united states of america': 'US',
          };

          const normalized = applicant.nationality.trim().toLowerCase();
          if (countryNameToCode[normalized]) {
            applicant.nationality = countryNameToCode[normalized];
          } else {
            // If it's already 2 characters, use as-is (assume it's already a code)
            // Otherwise, take first 2 characters
            applicant.nationality =
              applicant.nationality.length === 2
                ? applicant.nationality.toUpperCase()
                : applicant.nationality.toUpperCase().substring(0, 2);
          }
        }

        // For business entities, provide defaults if needed for API format
        // The form already validated based on Entity Configuration Service requirements
        if (isBusinessEntity && onboardingType === 2 && business) {
          // Provide defaults for business name (use applicant name as fallback for sole traders)
          if (!business.legalName) {
            business.legalName =
              `${applicant.firstName} ${applicant.lastName}`.trim() || 'Business Name';
          }

          // Use residential address as fallback for business address if missing
          if (
            !business.registeredAddress.line1 ||
            !business.registeredAddress.city ||
            !business.registeredAddress.country
          ) {
            business.registeredAddress = {
              line1:
                business.registeredAddress.line1 || applicant.residentialAddress.line1,
              line2:
                business.registeredAddress.line2 ||
                applicant.residentialAddress.line2 ||
                '',
              city: business.registeredAddress.city || applicant.residentialAddress.city,
              state:
                business.registeredAddress.state ||
                applicant.residentialAddress.state ||
                '',
              postalCode:
                business.registeredAddress.postalCode ||
                applicant.residentialAddress.postalCode ||
                '',
              country:
                business.registeredAddress.country ||
                applicant.residentialAddress.country,
            };
          }
        }

        // Collect ALL dynamic fields from requirements that aren't already mapped
        // Store them in metadata so nothing is lost
        const mappedFields = new Set([
          // Applicant fields
          'first_name',
          'last_name',
          'middle_name',
          'email',
          'phone_number',
          'date_of_birth',
          'nationality',
          'tax_id',
          'passport_number',
          'drivers_license_number',
          // Address fields
          'address',
          'address_line1',
          'address_line2',
          'city',
          'state',
          'postal_code',
          'country',
          'residential_address',
          'applicant_address',
          'applicant_city',
          'applicant_country',
          // Business fields
          'legal_name',
          'business_legal_name',
          'company_name',
          'business_name',
          'registered_name',
          'trading_name',
          'registration_number',
          'business_registration_number',
          'country_of_registration',
          'business_country',
          'business_address',
          'registered_address',
          'business_city',
          'business_state',
          'business_postal_code',
          // Standard fields
          'entitytype',
          'partner_reference_id',
          'reference_id',
        ]);

        // Collect all other form fields as metadata
        const metadata: Record<string, any> = {};

        // Store entity type configuration info
        metadata['entity_type_code'] = originalEntityTypeCode;
        metadata['entity_type_display_name'] = selectedEntityTypeData?.displayName || '';

        // Store all dynamic requirement-based fields
        // IMPORTANT: Use requirement.code as the key (normalized to lowercase) to match entity config
        // ALSO store mapped fields in metadata for display purposes (they're also in business/applicant objects)
        Object.keys(formData).forEach((key) => {
          const lowerKey = key.toLowerCase();
          const value = formData[key];

          // Skip empty values only
          // Note: File upload objects are preserved (they contain fileName, googleDriveUrl, etc.)
          const isEmpty =
            value === undefined ||
            value === null ||
            value === '' ||
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0);

          if (!isEmpty) {
            // Store ALL non-empty fields with requirement code as key (lowercase version of requirement.code)
            // This ensures consistency: entity config uses UPPERCASE codes, we store lowercase in metadata
            // File uploads are stored as objects with fileName, googleDriveUrl, fileId, etc.
            // NOTE: We now store ALL fields including mapped ones, so they're available for display
            metadata[lowerKey] = value;
          }
        });

        // Store requirement codes that were configured for this entity type
        // This helps with validation and debugging
        if (selectedEntityTypeData?.requirements) {
          const requirementCodes = selectedEntityTypeData.requirements
            .filter((req) => req.requirement)
            .map((req) => req.requirement!.code.toLowerCase()); // Store lowercase for consistency
          metadata['configured_requirements'] = requirementCodes.join(',');

          // Also store a mapping of requirement codes to their display names for reference
          const requirementMap: Record<string, string> = {};
          selectedEntityTypeData.requirements.forEach((req) => {
            if (req.requirement) {
              requirementMap[req.requirement.code.toLowerCase()] =
                req.requirement.displayName;
            }
          });
          metadata['requirement_display_names'] = JSON.stringify(requirementMap);
        }

        // Build applicant object - ONLY include fields that exist in formData (from dynamic form)
        // Do NOT add hardcoded defaults - only send what's actually configured in the entity form
        // The applicant object was built dynamically above based on actual requirement codes
        const applicantData: any = {};

        // Log what we have from the dynamic mapping
        console.info('📋 Building applicantData from dynamic mapping:', {
          applicantObject: applicant,
          applicantKeys: Object.keys(applicant),
          hasFirstName: !!applicant.firstName,
          hasLastName: !!applicant.lastName,
          hasEmail: !!applicant.email,
          hasPhone: !!applicant.phoneNumber,
          hasDateOfBirth: !!applicant.dateOfBirth,
          hasNationality: !!applicant.nationality,
          hasAddress: !!applicant.residentialAddress,
          addressData: applicant.residentialAddress,
        });

        // Only include fields that have values (from configured requirements)
        // These come from the entity configuration service requirements
        if (applicant.firstName) applicantData.first_name = applicant.firstName;
        if (applicant.lastName) applicantData.last_name = applicant.lastName;

        // Email is REQUIRED for ownership validation - always include it
        if (applicant.email) {
          applicantData.email = applicant.email;
        } else {
          console.warn('⚠️ No email in applicant data - ownership validation may fail');
          applicantData.email = ''; // Will be populated by backend from session
        }

        if (applicant.middleName) applicantData.middle_name = applicant.middleName;
        if (applicant.phoneNumber) applicantData.phone_number = applicant.phoneNumber;
        if (applicant.dateOfBirth) applicantData.date_of_birth = applicant.dateOfBirth;
        if (applicant.nationality) applicantData.nationality = applicant.nationality;

        // Always include residential address (backend requires it, even if empty)
        applicantData.residential_address = applicant.residentialAddress
          ? {
              line1: applicant.residentialAddress.line1 || '',
              line2: applicant.residentialAddress.line2 || '',
              city: applicant.residentialAddress.city || '',
              state: applicant.residentialAddress.state || '',
              postal_code: applicant.residentialAddress.postalCode || '',
              country: applicant.residentialAddress.country || '',
            }
          : {
              line1: '',
              line2: '',
              city: '',
              state: '',
              postal_code: '',
              country: '',
            };

        // Log final applicantData structure
        console.info('📤 Final applicantData being sent:', {
          applicantData,
          applicantDataKeys: Object.keys(applicantData),
          hasAllRequiredFields: {
            first_name: !!applicantData.first_name,
            last_name: !!applicantData.last_name,
            email: !!applicantData.email,
            phone_number: !!applicantData.phone_number,
            date_of_birth: !!applicantData.date_of_birth,
            nationality: !!applicantData.nationality,
            residential_address: !!applicantData.residential_address,
          },
        });

        const applicationData = {
          type: onboardingType,
          // partner_id is intentionally omitted - backend will generate it from authenticated user's email
          // This ensures the PartnerId matches the authenticated user and prevents mismatches
          partner_reference_id:
            formData['partner_reference_id'] || formData['reference_id'] || '',
          applicant: applicantData,
          business: business
            ? {
                legal_name: business.legalName,
                registration_number: business.registrationNumber,
                country_of_registration: business.countryOfRegistration,
                registered_address: {
                  line1: business.registeredAddress.line1,
                  line2: business.registeredAddress.line2 || '',
                  city: business.registeredAddress.city,
                  state: business.registeredAddress.state || '',
                  postal_code: business.registeredAddress.postalCode || '',
                  country: business.registeredAddress.country,
                },
              }
            : undefined,
          // Include metadata with all dynamic fields
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        };

        // Log the partnerId that would be generated (for debugging)
        // Backend will generate it from authenticated user's email automatically
        console.info(
          '📝 PartnerId will be generated by backend from authenticated user email:',
          finalUserEmail || userEmail || 'Will use authenticated session email'
        );

        // Try to create application via API
        // Use the onboarding API endpoint (port 8001) via proxy
        const { getAuthUser } = await import('@/lib/auth/session');
        const user = getAuthUser();

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Add schema-driven form headers for dynamic validation (backend checks headers first)
        if (originalEntityTypeCode) {
          headers['X-Entity-Type'] = originalEntityTypeCode;
          console.info(
            '📋 Added X-Entity-Type header for schema-based validation:',
            originalEntityTypeCode
          );
        }

        // Add form configuration ID and version if available from entity type data
        if (selectedEntityTypeData?.id) {
          headers['X-Form-Config-Id'] = selectedEntityTypeData.id;
          console.info('📋 Added X-Form-Config-Id header:', selectedEntityTypeData.id);
        }

        // Use updatedAt as version indicator (or a version field if available)
        if (selectedEntityTypeData?.updatedAt) {
          // Use timestamp as version identifier
          const version = new Date(selectedEntityTypeData.updatedAt).getTime().toString();
          headers['X-Form-Version'] = version;
          console.info('📋 Added X-Form-Version header:', version);
        } else if (selectedEntityTypeData?.id) {
          // Fallback: use ID hash as version
          headers['X-Form-Version'] = '1';
          console.info('📋 Added X-Form-Version header (default): 1');
        }

        // Add user identification headers
        if (user?.email) {
          headers['X-User-Email'] = user.email;
          headers['X-User-Name'] = user.name || user.email;
          headers['X-User-Role'] = 'Applicant';
        }

        console.info('📤 Submitting to API:', {
          url: '/api/proxy/api/v1/cases',
          partnerId: 'Will be generated by backend from authenticated user email',
          userEmail:
            finalUserEmail || userEmail || 'Will use authenticated session email',
          type: applicationData.type,
          applicant: {
            firstName: applicationData.applicant.first_name,
            lastName: applicationData.applicant.last_name,
            email: applicationData.applicant.email,
            hasAddress: !!applicationData.applicant.residential_address?.line1,
          },
          business: applicationData.business
            ? {
                legalName: applicationData.business?.legal_name,
                hasRegistrationNumber: !!applicationData.business?.registration_number,
              }
            : 'None',
          metadataKeys: Object.keys(applicationData.metadata || {}),
        });

        // Log the exact data being sent for debugging
        // Log the EXACT applicant data being sent
        console.info('🚀 Making API call with data:', {
          applicant: applicationData.applicant,
          applicantKeys: Object.keys(applicationData.applicant || {}),
          applicantHasAddress: !!applicationData.applicant?.residential_address,
          addressKeys: applicationData.applicant?.residential_address
            ? Object.keys(applicationData.applicant.residential_address)
            : [],
          business: business ? 'Set' : 'Not set',
          type: applicationData.type,
          fullApplicationData: JSON.stringify(applicationData, null, 2),
        });

        let response;
        try {
          response = await fetch('/api/proxy/api/v1/cases', {
            method: 'POST',
            headers,
            body: JSON.stringify(applicationData),
          });
          console.info('✅ API call completed, status:', response.status);
        } catch (fetchError) {
          console.error('❌ Fetch failed:', fetchError);
          throw fetchError;
        }

        const responseText = await response.text();
        console.info('📨 API Response:', {
          status: response.status,
          statusText: response.statusText,
          bodyLength: responseText.length,
          body: responseText.substring(0, 500), // First 500 chars
        });

        if (response.ok) {
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (error) {
            console.error('Failed to parse response JSON:', error, responseText);
            throw new Error('Invalid response from server');
          }

          // Backend returns both case_id (Guid) and case_number (string)
          // Use case_number for display/linking since that's what projections API uses
          const createdCaseId = result.case_number || result.case_id || result.caseId;
          const caseGuid = result.case_id || result.id;

          if (!createdCaseId) {
            console.error('No case ID returned from backend:', result);
            throw new Error('Case was created but no case ID was returned');
          }

          if (!caseGuid) {
            console.error(
              'No case GUID returned from backend (needed for document upload):',
              result
            );
            console.warn('⚠️ Document upload will be skipped - case GUID is missing');
          }

          console.info('✅ Case created successfully:', {
            caseId: createdCaseId,
            caseGuid: caseGuid || 'MISSING',
            partnerId: result.partner_id || 'Not in response',
            fileObjectsCount: fileObjects.size,
            fullResult: result,
          });

          // Upload files to Document Service after case creation
          if (fileObjects.size > 0 && caseGuid) {
            try {
              console.info(
                `📎 Uploading ${fileObjects.size} file(s) to Document Service...`
              );

              // Get partner ID - backend generates it from email using MD5 hash
              // We need to generate it the same way the backend does for document upload
              let partnerId = '';

              // PRIMARY: Get PartnerId from case creation response (backend provides it)
              // Check both snake_case and camelCase formats, and ensure it's a valid non-empty string
              const responsePartnerId = result.partner_id || result.partnerId;
              if (
                responsePartnerId &&
                typeof responsePartnerId === 'string' &&
                responsePartnerId.trim() !== ''
              ) {
                partnerId = responsePartnerId.trim();
                console.info(
                  '✅ Using PartnerId from case creation response (backend):',
                  partnerId
                );
              } else {
                // FALLBACK: Get PartnerId from backend endpoint (single source of truth)
                // Try to get email from multiple sources
                const userEmail = user?.email || currentUser?.email;
                if (userEmail) {
                  try {
                    const { getPartnerIdFromBackend } = await import('@/lib/api');
                    const backendPartnerId = await getPartnerIdFromBackend(userEmail);
                    if (backendPartnerId) {
                      partnerId = backendPartnerId;
                      console.info('✅ Got PartnerId from backend endpoint:', partnerId);
                    } else {
                      console.warn(
                        '⚠️ Could not get PartnerId from backend - document upload may fail'
                      );
                    }
                  } catch (error) {
                    console.warn('⚠️ Failed to get PartnerId from backend:', error);
                  }
                } else {
                  console.warn(
                    '⚠️ No user email available - cannot get PartnerId for document upload'
                  );
                }
              }

              if (!partnerId) {
                console.warn('⚠️ Cannot upload files: Partner ID not available');
              } else {
                // Prepare files for upload
                const filesToUpload = Array.from(fileObjects.entries()).map(
                  ([requirementCode, file]) => ({
                    file,
                    requirementCode,
                    description: formData[requirementCode]?.fileName || file.name,
                  })
                );

                // Upload all files
                const uploadResults = await uploadFilesToDocumentService(
                  caseGuid,
                  partnerId,
                  filesToUpload,
                  user?.email
                );

                // Log results and store document IDs in metadata
                const uploadedDocuments: Record<string, string> = {};
                uploadResults.forEach(({ requirementCode, result, error }) => {
                  if (error) {
                    console.error(
                      `❌ Failed to upload file for ${requirementCode}:`,
                      error
                    );
                  } else if (result.documentId) {
                    console.info(
                      `✅ File uploaded successfully for ${requirementCode}:`,
                      {
                        documentId: result.documentId,
                        documentNumber: result.documentNumber,
                        storageKey: result.storageKey,
                      }
                    );
                    uploadedDocuments[`${requirementCode}_document_id`] =
                      result.documentId;
                    uploadedDocuments[`${requirementCode}_storage_key`] =
                      result.storageKey;
                  }
                });

                // Update case metadata with document IDs (optional - can be done via separate API call if needed)
                if (Object.keys(uploadedDocuments).length > 0) {
                  console.info('📋 Document IDs stored:', uploadedDocuments);
                }
              }
            } catch (uploadError) {
              console.error('❌ Error uploading files to Document Service:', uploadError);
              // Don't fail the entire submission - files can be uploaded later
              showToast({
                status: 'error',
                title: 'File Upload Warning',
                description:
                  'Case created successfully, but some files failed to upload. You can upload them later.',
              });
            }
          } else {
            // Log why files were not uploaded
            if (fileObjects.size === 0) {
              console.info('ℹ️ No files to upload - fileObjects is empty');
            } else if (!caseGuid) {
              console.warn(
                '⚠️ Cannot upload files - case GUID is missing from API response'
              );
              showToast({
                status: 'error',
                title: 'File Upload Error',
                description:
                  'Case created successfully, but files could not be uploaded because case ID is missing. Please contact support.',
              });
            } else {
              console.warn('⚠️ Cannot upload files - unknown reason');
            }
          }

          // Trigger projections sync to ensure case is available in read model
          // This is a best-effort call - don't block on it
          // Note: The onboarding API also triggers sync automatically, but we trigger it here
          // to ensure immediate visibility (with a small delay to let the DB transaction commit)
          try {
            // Wait a bit for the database transaction to commit
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Trigger projections sync (optional - service may not be available)
            // Note: This endpoint may not exist if projections service is not running
            const syncResponse = await fetch(
              '/api/proxy/api/v1/sync?forceFullSync=false',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(user?.email
                    ? {
                        'X-User-Email': user.email,
                        'X-User-Name': user.name || user.email,
                        'X-User-Role': 'Applicant',
                      }
                    : {}),
                },
              }
            );

            if (syncResponse.ok) {
              const syncResult = await syncResponse.json();
              console.info('✅ Projections sync completed:', syncResult);
            } else if (syncResponse.status === 404) {
              // Projections service not available - this is expected in some environments
              console.debug(
                'Projections sync endpoint not available (404) - service may not be running'
              );
            } else {
              // Other errors - log but don't fail
              const errorText = await syncResponse.text();
              console.debug('Projections sync returned non-200 status:', {
                status: syncResponse.status,
                error: errorText,
              });
            }
          } catch (syncError) {
            // Silently handle - projections service may not be available
            // The onboarding API also triggers sync automatically, and admin can manually sync
            console.debug(
              'Projections sync not available:',
              syncError instanceof Error ? syncError.message : 'Unknown error'
            );
          }

          console.info('✅ APPLICATION SUBMITTED SUCCESSFULLY:', {
            caseId: createdCaseId,
            caseGuid: caseGuid,
            message:
              'Case created successfully. Check console for any background operation errors.',
          });

          showToast({
            status: 'success',
            title: 'Application Submitted Successfully',
            description: `Your application has been submitted. Case ID: ${createdCaseId}. Redirecting to dashboard...`,
          });

          // Wait longer to ensure all background operations complete
          // This gives time to see any errors from file uploads or sync operations
          console.info(
            '⏳ Waiting 4 seconds before redirect to allow background operations to complete...'
          );
          setTimeout(async () => {
            console.info('✅ Redirecting to dashboard now');
            
            // Send welcome email notification (non-blocking)
            try {
              const { sendWelcomeNotification } = await import('@/lib/notificationService');
              const applicantName = applicationData.applicant?.first_name && applicationData.applicant?.last_name
                ? `${applicationData.applicant.first_name} ${applicationData.applicant.last_name}`.trim()
                : applicationData.applicant?.first_name || applicationData.applicant?.last_name || currentUser?.name || 'Valued Partner';
              
              sendWelcomeNotification({
                to: finalUserEmail || userEmail || currentUser?.email || '',
                applicantName: applicantName,
                caseId: caseGuid || createdCaseId,
                caseNumber: createdCaseId,
                link: `${window.location.origin}/partner/dashboard`,
              }).catch((error) => {
                // Log error but don't block user flow
                console.warn('Failed to send welcome email:', error);
              });
            } catch (error) {
              // Log error but don't block user flow
              console.warn('Error importing notification service:', error);
            }
            
            window.location.href = `/partner/dashboard?submitted=true&caseId=${createdCaseId}`;
          }, 4000); // Increased from 2s to 4s to see any late errors
          return;
        } else {
          // Handle error response - DO NOT SILENTLY FAIL
          let errorMessage = `Server error: ${response.status} ${response.statusText}`;
          let errorDetails = '';
          try {
            const errorJson = JSON.parse(responseText);
            errorMessage =
              errorJson.error || errorJson.message || errorJson.title || errorMessage;

            // Extract detailed validation errors
            if (errorJson.errors) {
              const validationErrors = Object.entries(errorJson.errors)
                .map(([field, messages]: [string, any]) => {
                  const fieldName =
                    field
                      .split('.')
                      .pop()
                      ?.replace(/([A-Z])/g, ' $1')
                      .trim() || field;
                  const msgList = Array.isArray(messages) ? messages : [messages];
                  return `${fieldName}: ${msgList.join(', ')}`;
                })
                .join('; ');
              errorDetails = validationErrors || errorJson.details || '';
            } else {
              errorDetails = errorJson.details || errorJson.message || '';
            }
          } catch {
            errorDetails = responseText.substring(0, 200) || '';
          }

          // Special handling for 401 Unauthorized
          if (response.status === 401) {
            errorMessage = '❌ AUTHENTICATION FAILED';
            errorDetails =
              'You are not authenticated or your session has expired. Please log in again. The authentication token may not be properly forwarded to the backend.';

            console.error('🚨 AUTHENTICATION ERROR:', {
              status: 401,
              message: 'Authentication token missing or invalid',
              endpoint: '/api/proxy/api/v1/cases',
              solution:
                'Check that the /api/proxy route is forwarding the access token from Redis',
            });
          }

          // Special handling for 503 Service Unavailable
          if (response.status === 503) {
            errorMessage = '❌ BACKEND SERVICE NOT RUNNING';
            errorDetails =
              "The kyb-case-api service is not running on port 8001. TO FIX: Start the backend service using 'docker-compose up -d kyb-case-api' and try again. Your form data has been saved locally as a draft.";

            // Auto-save the form data as a draft when service is unavailable
            try {
              await forceSave();
              console.info(
                '✅ Form data saved locally as draft due to service unavailability'
              );
            } catch (saveError) {
              console.warn('Failed to save draft:', saveError);
            }

            // Log clear instructions
            console.error('🚨 BACKEND SERVICE REQUIRED:', {
              service: 'kyb-case-api',
              port: '8001',
              endpoint: 'http://localhost:8001/api/v1/cases',
              action: 'Start the service: docker-compose up -d kyb-case-api',
              checkStatus: 'docker ps --filter "name=kyb_case_api"',
            });
          }

          // Log error once with all relevant details
          console.error('🚨 API submission failed:', {
            status: response?.status || 'unknown',
            statusText: response?.statusText || 'unknown',
            error: errorMessage,
            details: errorDetails,
            responseText: responseText?.substring(0, 500) || 'no response text',
            submittedData: {
              type: applicationData.type,
              partnerId: 'Generated by backend from authenticated user email',
              hasApplicant: !!applicationData.applicant,
              hasBusiness: !!applicationData.business,
            },
          });

          // Show very clear error message for 503
          if (response.status === 503) {
            showToast({
              status: 'error',
              title: '❌ Backend Service Not Running',
              description:
                'The kyb-case-api service must be started on port 8001 to submit applications. Run: docker-compose up -d kyb-case-api. Your form has been saved as a draft.',
            });
          } else {
            showToast({
              status: 'error',
              title: errorMessage,
              description:
                errorDetails ||
                'Please try again later or contact support if the problem persists.',
            });
          }

          // Create error with message for re-throwing (will be caught by outer catch)
          const submissionError = new Error(errorMessage);
          (submissionError as any).status = response.status;
          (submissionError as any).details = errorDetails;
          throw submissionError;
        }
      } catch (apiError: any) {
        // Only log if this is a fetch error (not already logged above)
        // If it's a response error, it was already logged in the else block above
        if (
          apiError?.name === 'TypeError' ||
          apiError?.message?.includes('fetch failed')
        ) {
          console.error('❌ Network error during submission:', {
            message: apiError?.message,
            name: apiError?.name,
          });
        }

        // Check if it's a connection/service unavailable error
        const isServiceUnavailable =
          apiError?.status === 503 ||
          apiError?.message?.includes('Backend service unavailable') ||
          apiError?.message?.includes('Service Unavailable') ||
          apiError?.message?.includes('ECONNREFUSED') ||
          apiError?.message?.includes('fetch failed');

        // Show error to user - DO NOT show fake success
        if (isServiceUnavailable && !apiError?.details) {
          // Try to save as draft (if not already saved)
          try {
            await forceSave();
            console.info('✅ Form data saved locally as draft');
          } catch (saveError) {
            console.warn('Failed to save draft:', saveError);
          }

          showToast({
            status: 'error',
            title: 'Service Unavailable',
            description:
              'The backend service is not running. Your form has been saved locally. Please start the backend service and try again.',
          });
        } else if (!apiError?.details) {
          // Only show toast if not already shown above
          showToast({
            status: 'error',
            title: 'Submission Failed',
            description:
              apiError?.message ||
              'Failed to submit application. Please check your connection and try again.',
          });
        }

        // DO NOT redirect - let user see the error and retry
        throw apiError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      // Only log if error wasn't already logged above
      // Most errors are already logged in the inner catch blocks
      if (!error?.status && !error?.details) {
        console.error('❌ Unexpected submission error:', {
          message: error?.message,
          name: error?.name,
        });
      }

      // Check if it's a service unavailable error
      const isServiceUnavailable =
        error?.status === 503 ||
        error?.message?.includes('Backend service unavailable') ||
        error?.message?.includes('Service Unavailable') ||
        error?.message?.includes('ECONNREFUSED') ||
        error?.message?.includes('fetch failed');

      // Only show toast if not already shown in inner catch blocks
      if (isServiceUnavailable && !error?.details) {
        showToast({
          status: 'error',
          title: 'Service Unavailable',
          description:
            "The backend service is not running. Your form data has been saved locally. Please start the backend service (kyb-case-api on port 8001) using 'docker-compose up -d kyb-case-api' and try submitting again.",
        });
      } else if (!error?.details) {
        showToast({
          status: 'error',
          title: 'Submission Failed',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to submit application. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleResumeFromStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleSaveProgress = async () => {
    await forceSave();
    showToast({
      status: 'success',
      title: 'Progress Saved',
      description: 'Your progress has been saved successfully',
    });
  };

  // const handleValidationComplete = (fieldId: Record<string, unknown>) => {
  //   if (result.isValid && result.data) {
  //     // Auto-populate fields based on validation result
  //     Object.entries(result.data).forEach(([key, value]) => {
  //       const fieldMapping: Record<string, string> = {
  //         companyName: 'companyName',
  //         registeredName: 'companyName',
  //         registrationNumber: 'registrationNumber',
  //         incorporationDate: 'dateOfIncorporation',
  //         address: 'businessAddress',
  //         authorizedCapital: 'authorizedCapital',
  //         issuedCapital: 'issuedCapital',
  //       };
  //
  //       const mappedField = fieldMapping[key];
  //       if (mappedField && !formData[mappedField]) {
  //         updateField(mappedField, value);
  //       }
  //     });
  //   }
  // };

  interface OCRFieldMapping {
    fieldId: string;
    fieldLabel: string;
    extractedValue: any;
  }

  interface OCRResult {
    id: string;
    fileName: string;
    fileType: string;
    extractedData: Record<string, any>;
    confidence: number;
    errors?: string[];
  }

  const handleDataExtracted = (fieldMappings: OCRFieldMapping[]) => {
    fieldMappings.forEach((mapping) => {
      if (mapping?.fieldId && mapping?.extractedValue !== undefined) {
        updateField(mapping.fieldId, mapping.extractedValue);
      }
    });
  };

  const handleDocumentProcessed = (result: OCRResult) => {
    console.info('Document processed:', result);
  };

  const handleSendMessage = async (
    content: string,
    context?: Record<string, unknown>,
    attachments?: File[]
  ) => {
    console.info('Sending message:', { content, context, attachments });
    // Implement message sending logic
  };

  const handleReplyToMessage = async (messageId: string, content: string) => {
    console.info('Replying to message:', { messageId, content });
    // Implement reply logic
  };

  const handleForwardMessage = async (messageId: string, toConversationId: string) => {
    console.info('Forwarding message:', { messageId, toConversationId });
    // Implement forward logic
  };

  const handleStarMessage = async (messageId: string) => {
    console.info('Starring message:', messageId);
    // Implement star logic
  };

  const handleArchiveConversation = async (conversationId: string) => {
    console.info('Archiving conversation:', conversationId);
    // Implement archive logic
  };

  const handleAssignConversation = async (conversationId: string, adminId: string) => {
    console.info('Assigning conversation:', { conversationId, adminId });
    // Implement assign logic
  };

  const handleTagConversation = async (conversationId: string, tags: string[]) => {
    console.info('Tagging conversation:', { conversationId, tags });
    // Implement tag logic
  };

  useEffect(() => {
    const user = getAuthUser();
    setCurrentUser({ name: user.name, email: user.email });

    // Check if user already has an application
    const checkExistingApplication = async () => {
      if (!user.email) return;

      try {
        const { findUserCaseByEmail } = await import('@/lib/api');
        const existingCase = await findUserCaseByEmail(user.email);

        if (existingCase?.caseId) {
          console.info('⚠️ User already has an application, redirecting to view it...');
          // Redirect to the existing application details page
          window.location.href = `/partner/application/${existingCase.caseId}`;
          return;
        }
      } catch (error) {
        console.info('No existing application found, proceeding with new application');
      }
    };

    // Fetch user profile to get company name
    const fetchUserProfile = async () => {
      try {
        const { getUserProfile } = await import('@/lib/api');
        const profile = await getUserProfile();
        console.info('📋 User profile loaded:', profile);
        if (profile?.companyName) {
          setCurrentUser((prev) => ({ ...prev, companyName: profile.companyName }));
          console.info('✅ Loaded company name from profile:', profile.companyName);
        } else {
          console.warn('⚠️ No company name in profile');
        }
      } catch (error) {
        console.error('❌ Could not load user profile:', error);
      }
    };

    checkExistingApplication();
    fetchUserProfile();
  }, []);

  // Entity Type Selection
  if (!selectedEntityType) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
        <PartnerHeader />
        <Container maxW="7xl" py="12">
          <VStack gap="8" align="stretch">
            <VStack gap="4" align="center" textAlign="center">
              <Typography fontSize="4xl" fontWeight="bold" color="mukuru.text.primary">
                Start Your Application
              </Typography>
              <Typography fontSize="lg" color="mukuru.text.primary" maxW="2xl">
                Choose your entity type to begin the onboarding process. We&apos;ll
                customize the form based on your selection.
              </Typography>
            </VStack>

            {loadingEntityTypes ? (
              <VStack gap="4" py="12">
                <Spinner size="xl" color="orange.500" />
                <Typography color="mukuru.text.primary">
                  Loading entity types...
                </Typography>
              </VStack>
            ) : entityTypesError ? (
              <Box p="6" bg="red.50" borderRadius="lg" border="1px" borderColor="red.200">
                <VStack gap="2" align="center">
                  <Typography fontWeight="semibold" color="red.800">
                    Error Loading Entity Types
                  </Typography>
                  <Typography color="red.700" fontSize="sm">
                    {entityTypesError}
                  </Typography>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => window.location.reload()}
                    mt="2"
                    bg="mukuru.buttons.primary"
                    _hover={{ bg: 'mukuru.buttons.inactive.orange' }}
                  >
                    <Typography
                      color="mukuru.text.inverse"
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      Retry
                    </Typography>
                  </Button>
                </VStack>
              </Box>
            ) : entityTypes.length === 0 ? (
              <Box
                p="6"
                bg="yellow.50"
                borderRadius="lg"
                border="1px"
                borderColor="yellow.200"
              >
                <Typography textAlign="center" color="yellow.800">
                  No entity types available. Please contact support.
                </Typography>
              </Box>
            ) : (
              <Box>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
                  {entityTypes.map((entity, index) => (
                    <MotionBox
                      key={entity.originalCode || entity.value || `entity-${index}`}
                      p="6"
                      bg="white"
                      borderRadius="xl"
                      boxShadow="lg"
                      border="2px"
                      borderColor="mukuru.grey.light"
                      cursor="pointer"
                      h="100%"
                      minH="160px"
                      display="flex"
                      flexDirection="row"
                      alignItems="stretch"
                      onClick={() => handleEntityTypeSelect(entity.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <HStack gap="4" align="stretch" flex="1" width="100%" h="100%">
                        <Circle
                          size="16"
                          bg="#f76834"
                          color="white"
                          flexShrink="0"
                          alignSelf="center"
                        >
                          <Icon as={getIconComponent(entity.icon)} boxSize="8" />
                        </Circle>

                        <VStack
                          gap="2"
                          align="start"
                          flex="1"
                          width="100%"
                          justify="center"
                          minH="0"
                          minW="0"
                        >
                          <Typography
                            fontSize="md"
                            fontWeight="semibold"
                            color="mukuru.text.primary"
                            lineHeight="1.4"
                            wordBreak="break-word"
                            overflowWrap="break-word"
                            width="100%"
                          >
                            {entity.label}
                          </Typography>
                          <Typography
                            fontSize="sm"
                            color="mukuru.text.primary"
                            lineHeight="1.5"
                            wordBreak="break-word"
                            overflowWrap="break-word"
                            width="100%"
                          >
                            {entity.description}
                          </Typography>
                        </VStack>

                        <Button
                          size="icon"
                          variant="primary"
                          bg="mukuru.buttons.primary"
                          borderRadius="full"
                          flexShrink="0"
                          px="4"
                          minW="44px"
                          w="44px"
                          h="44px"
                          alignSelf="center"
                          _hover={{ bg: 'mukuru.buttons.inactive.orange' }}
                        >
                          <Icon as={FiArrowRight} color="mukuru.text.inverse" />
                        </Button>
                      </HStack>
                    </MotionBox>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </VStack>
        </Container>
      </Box>
    );
  }

  // Show loading state while fetching entity type data
  if (loadingEntityTypeData) {
    return (
      <Box
        minH="100vh"
        bg="mukuru.background.light"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack gap="4">
          <Spinner size="xl" color="orange.500" />
          <Typography color="mukuru.text.primary">
            Loading form configuration...
          </Typography>
          <Typography fontSize="sm" color="mukuru.text.primary">
            Fetching requirements for {selectedEntityType}...
          </Typography>
        </VStack>
      </Box>
    );
  }

  if (!entityConfig) {
    return (
      <Box
        minH="100vh"
        bg="mukuru.background.light"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack gap="4">
          <Spinner size="xl" color="blue.500" />
          <Typography color="mukuru.text.primary">Loading application form...</Typography>
          {selectedEntityType && (
            <Typography fontSize="sm" color="mukuru.text.primary" mt="4">
              Selected: {selectedEntityType}
            </Typography>
          )}
          <Box
            p="4"
            bg="yellow.50"
            borderRadius="md"
            border="1px"
            borderColor="yellow.200"
            maxW="md"
            mt="4"
          >
            <Typography fontSize="sm" color="yellow.800" textAlign="center">
              Form configuration not found for entity type: &quot;{selectedEntityType}
              &quot;.
              {selectedEntityTypeData &&
              (!selectedEntityTypeData.requirements ||
                selectedEntityTypeData.requirements.length === 0)
                ? ' No requirements have been configured for this entity type yet. Please contact support.'
                : ' Please contact support or try selecting a different entity type.'}
            </Typography>
            <Button
              size="sm"
              mt="3"
              onClick={() => setSelectedEntityType('')}
              variant="primary"
              bg="mukuru.buttons.primary"
              _hover={{ bg: 'mukuru.buttons.inactive.orange' }}
            >
              <Typography color="mukuru.text.inverse" fontSize="sm" fontWeight="medium">
                Go Back to Selection
              </Typography>
            </Button>
          </Box>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="mukuru.background.light">
      <PartnerHeader />
      <Container maxW="6xl" py="8">
        <VStack gap="8" align="stretch">
          {toastState && (
            <Box
              p="3"
              borderRadius="md"
              bg={
                toastState.status === 'success'
                  ? 'green.50'
                  : toastState.status === 'error'
                    ? 'red.50'
                    : 'blue.50'
              }
              border="1px"
              borderColor={
                toastState.status === 'success'
                  ? 'green.200'
                  : toastState.status === 'error'
                    ? 'red.200'
                    : 'blue.200'
              }
            >
              <HStack gap="2">
                <Typography fontWeight="semibold" color="mukuru.text.primary">
                  {toastState.title}
                </Typography>
                {toastState.description && (
                  <Typography color="mukuru.text.primary">
                    {toastState.description}
                  </Typography>
                )}
              </HStack>
            </Box>
          )}
          {/* Header */}
          <Box p="6" bg="white" borderRadius="lg" boxShadow="sm">
            <HStack justify="space-between" align="center" wrap="wrap" gap="4">
              <VStack align="start" gap="2">
                <HStack gap="3">
                  <Typography
                    fontSize="2xl"
                    fontWeight="bold"
                    color="mukuru.text.primary"
                  >
                    {entityConfig.displayName} Application
                  </Typography>
                  <Tag variant="solid" size="md">
                    Step {currentStep} of {entityConfig.steps.length}
                  </Tag>
                </HStack>
                <Typography color="mukuru.text.primary">
                  {entityConfig.description}
                </Typography>
                {/* Stage Stepper */}
                <HStack gap="2" mt="2" align="center">
                  {entityConfig.steps.map((s, idx) => (
                    <Box
                      key={s.id}
                      h="8px"
                      flex="1"
                      borderRadius="full"
                      bg={
                        idx + 1 <= currentStep
                          ? 'mukuru.buttons.primary'
                          : 'mukuru.grey.light'
                      }
                    />
                  ))}
                </HStack>
              </VStack>

              <HStack gap="2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProgress(!showProgress)}
                  borderRadius="md"
                >
                  <Icon as={FiEye} mr="2" color="mukuru.text.primary" />
                  <Typography
                    color="mukuru.text.primary"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    {showProgress ? 'Hide' : 'Show'} Progress
                  </Typography>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMessaging(!showMessaging)}
                  borderRadius="md"
                >
                  <Icon as={FiMessageSquare} mr="2" color="mukuru.text.primary" />
                  <Typography
                    color="mukuru.text.primary"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    Messages
                  </Typography>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOCR(!showOCR)}
                  borderRadius="md"
                >
                  <Icon as={FiZap} mr="2" color="mukuru.text.primary" />
                  <Typography
                    color="mukuru.text.primary"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    OCR
                  </Typography>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveProgress}
                  borderRadius="md"
                >
                  <Icon as={FiSave} mr="2" color="mukuru.text.primary" />
                  <Typography
                    color="mukuru.text.primary"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    Save Progress
                  </Typography>
                </Button>
              </HStack>
            </HStack>
          </Box>

          {/* Progress Tracking */}
          {showProgress && (
            <ProgressTracking
              config={entityConfig}
              formData={formData}
              currentStep={currentStep}
              onStepClick={handleStepClick}
              onSaveProgress={handleSaveProgress}
              onResumeFromStep={handleResumeFromStep}
              lastSaved={lastSaved ? lastSaved.toISOString() : undefined}
              isDirty={isDirty}
              isSaving={isSaving}
            />
          )}

          {/* OCR Integration */}
          {showOCR && (
            <OCRIntegration
              onDataExtracted={handleDataExtracted}
              onDocumentProcessed={handleDocumentProcessed}
              entityType={selectedEntityType}
              documentType={
                entityConfig.steps[currentStep - 1]?.requiredDocuments[0] ||
                'certificate_incorporation'
              }
            />
          )}

          {/* Main Form */}
          <Box p="6" bg="white" borderRadius="lg" boxShadow="sm">
            <EnhancedDynamicForm
              config={entityConfig}
              formData={formData}
              onFieldChange={handleFieldChange}
              onStepComplete={handleStepComplete}
              currentStep={currentStep}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              validationErrors={validationErrors}
              onFilesChange={(files) => {
                console.info('📎 File objects updated in parent component:', {
                  fileCount: files.size,
                  fileKeys: Array.from(files.keys()),
                  fileNames: Array.from(files.values()).map((f) => f.name),
                });
                setFileObjects(files);
              }}
            />
          </Box>

          {/* Contextual Messaging */}
          {showMessaging && (
            <Box p="6" bg="white" borderRadius="lg" boxShadow="sm" height="600px">
              <EnhancedContextualMessaging
                conversations={[]}
                messages={[]}
                currentApplicationId={`APP-${Date.now()}`}
                onSendMessage={handleSendMessage}
                onReplyToMessage={handleReplyToMessage}
                onForwardMessage={handleForwardMessage}
                onStarMessage={handleStarMessage}
                onArchiveConversation={handleArchiveConversation}
                onAssignConversation={handleAssignConversation}
                onTagConversation={handleTagConversation}
                currentUser={{
                  id: 'partner-1',
                  name: 'John Doe',
                  type: 'partner',
                }}
                applicationSections={entityConfig.steps.map((step) => ({
                  id: step.id,
                  title: step.title,
                  fields: step.fields.map((field) => ({
                    id: field.id,
                    label: field.label,
                    value: formData[field.id],
                  })),
                }))}
                applicationDocuments={[]}
              />
            </Box>
          )}

          {/* Save Error Alert */}
          {saveError && (
            <Box p="3" borderRadius="md" bg="red.50" border="1px" borderColor="red.200">
              <HStack gap="2">
                <Typography fontWeight="semibold" color="mukuru.text.primary">
                  Save Error:
                </Typography>
                <Typography color="mukuru.text.primary">{saveError}</Typography>
              </HStack>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
