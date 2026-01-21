'use client';
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  VStack,
  HStack,
  Textarea,
  SimpleGrid,
  Icon,
  Spinner,
  Circle,
} from '@chakra-ui/react';
import { Button, Typography, Tag, Input } from '@/lib/mukuruImports';
import { useState, useRef } from 'react';
import {
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
  FiExternalLink,
  FiUpload,
  FiPlus,
  FiTrash2,
  FiArrowRight,
} from 'react-icons/fi';
import { FormField, EntityFormConfig } from '../lib/entityFormConfigs';
import { FileUpload } from './FileUpload';
import { SweetAlert } from '../utils/sweetAlert';

interface EnhancedDynamicFormProps {
  config: EntityFormConfig;
  formData: any;
  onFieldChange: (fieldId: string, value: string | boolean | any) => void;
  onStepComplete: (stepId: string) => void;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  validationErrors?: Record<string, string>;
  onFilesChange?: (files: Map<string, File>) => void; // Callback to notify parent of file changes
}

interface ValidationState {
  isValidating: boolean;
  isValid: boolean;
  message: string;
  data?: any;
}

export function EnhancedDynamicForm({
  config,
  formData,
  onFieldChange,
  onStepComplete: _onStepComplete,
  currentStep,
  onNext,
  onPrevious,
  onSubmit,
  isLoading = false,
  validationErrors = {},
  onFilesChange,
}: EnhancedDynamicFormProps) {
  const [validationStates, setValidationStates] = useState<
    Record<string, ValidationState>
  >({});
  const [customFieldData, setCustomFieldData] = useState<Record<string, any>>({});
  // local banner state instead of Chakra useToast (not available in this build)
  const [banner, setBanner] = useState<{
    status: 'success' | 'error';
    message: string;
  } | null>(null);
  // Store File objects temporarily (can't be serialized in formData)
  // Key: fieldId, Value: File object
  const fileObjectsRef = useRef<Map<string, File>>(new Map());

  const currentStepConfig = config.steps[currentStep - 1];
  if (!currentStepConfig) return null;

  const handleFieldChange = async (fieldId: string, value: string | boolean) => {
    onFieldChange(fieldId, value);

    // Handle external validation
    const field = currentStepConfig.fields.find((f) => f.id === fieldId);
    if (field?.externalValidation?.enabled && value) {
      await validateExternalField(fieldId, value, field.externalValidation);
    }
  };

  const validateExternalField = async (
    fieldId: string,
    value: string | boolean,
    validation: {
      enabled: boolean;
      apiEndpoint?: string;
      loadingText?: string;
      successText?: string;
      errorText?: string;
    }
  ) => {
    setValidationStates((prev) => ({
      ...prev,
      [fieldId]: {
        isValidating: true,
        isValid: false,
        message: validation.loadingText || 'Validating...',
      },
    }));

    try {
      // Mock external validation - replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate validation result
      const isValid = Math.random() > 0.3; // 70% success rate for demo

      if (isValid) {
        setValidationStates((prev) => ({
          ...prev,
          [fieldId]: {
            isValidating: false,
            isValid: true,
            message: validation.successText || 'Validation successful',
            data: { verifiedAt: new Date().toISOString() },
          },
        }));

        setBanner({
          status: 'success',
          message: validation.successText || 'Validation successful',
        });
        setTimeout(() => setBanner(null), 3000);
      } else {
        setValidationStates((prev) => ({
          ...prev,
          [fieldId]: {
            isValidating: false,
            isValid: false,
            message: validation.errorText || 'Validation failed',
          },
        }));

        setBanner({
          status: 'error',
          message: validation.errorText || 'Validation failed',
        });
        setTimeout(() => setBanner(null), 5000);
      }
    } catch {
      setValidationStates((prev) => ({
        ...prev,
        [fieldId]: {
          isValidating: false,
          isValid: false,
          message: 'Validation service unavailable',
        },
      }));
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const error = validationErrors[field.id];
    const validationState = validationStates[field.id];

    // Props for Chakra UI components (Input, Textarea)
    // Note: Using errorBorderColor instead of isInvalid to avoid React warning about DOM props
    const chakraProps = {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        handleFieldChange(field.id, e.target.value),
      placeholder: field.placeholder,
      required: field.required, // Use 'required' instead of 'isRequired' for DOM elements
      // Use errorBorderColor for error state instead of isInvalid to avoid React DOM warnings
      ...(error
        ? {
            errorBorderColor: 'error.500',
            borderColor: 'error.500',
          }
        : {}),
      disabled: isLoading,
      bg: 'white',
      color: 'mukuru.text.primary', // Text color for input value
      _placeholder: {
        color: '#D0D0D0',
        opacity: 1,
      },
      sx: {
        // Ensure placeholder is very light gray across all browsers
        '&::placeholder': {
          color: '#D0D0D0 !important',
          opacity: '1 !important',
        },
        '&::-webkit-input-placeholder': {
          color: '#D0D0D0 !important',
          opacity: '1 !important',
        },
        '&::-moz-placeholder': {
          color: '#D0D0D0 !important',
          opacity: '1 !important',
        },
        '&:-ms-input-placeholder': {
          color: '#D0D0D0 !important',
          opacity: '1 !important',
        },
        // Ensure input text is dark when there's a value
        ...(value && {
          color: 'var(--mukuru-text-primary) !important',
          WebkitTextFillColor: 'var(--mukuru-text-primary) !important',
        }),
        // Ensure input text is always visible
        color: 'var(--mukuru-text-primary) !important',
        WebkitTextFillColor: 'var(--mukuru-text-primary) !important',
      },
      // Caret color
      style: { caretColor: 'var(--mukuru-text-primary)' },
    } as any;

    // Props for native HTML elements (select, checkbox, etc.)
    // const nativeProps = {
    //   value,
    //   onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    //     handleFieldChange(field.id, e.target.value),
    //   placeholder: field.placeholder,
    //   required: field.required,
    //   disabled: isLoading,
    //   // Note: No isInvalid prop for native HTML elements
    // };

    const fieldElement = (() => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'url':
        case 'number':
          return <Input {...chakraProps} type={field.type} />;

        case 'date':
          return <Input {...chakraProps} type="date" />;

        case 'textarea':
          return <Textarea {...chakraProps} rows={4} />;

        case 'select':
          return (
            <Box>
              <select
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--mukuru-grey-light)',
                  background: 'white',
                  color: 'var(--mukuru-text-primary)',
                }}
              >
                <option value="" style={{ color: '#D0D0D0' }}>
                  Select an option
                </option>
                {field.options?.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    style={{ color: 'var(--mukuru-text-primary)' }}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </Box>
          );

        case 'checkbox':
          return (
            <HStack>
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                disabled={isLoading}
              />
              <Typography color="mukuru.text.primary">{field.label}</Typography>
            </HStack>
          );

        case 'radio':
          return (
            <VStack align="start" gap="2">
              {field.options?.map((option) => (
                <HStack key={option.value}>
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    disabled={option.disabled}
                  />
                  <Typography color="mukuru.text.primary">{option.label}</Typography>
                </HStack>
              ))}
            </VStack>
          );

        case 'file': {
          // Handle both legacy string format and new object format
          // const existingFileValue = formData[field.id];
          // const existingFileName =
          //   typeof existingFileValue === 'string'
          //     ? existingFileValue
          //     : existingFileValue?.fileName || '';

          return (
            <FileUpload
              onFileUpload={async (file) => {
                // Store File object temporarily (will be uploaded to Document Service after case creation)
                // File objects can't be serialized, so we store them in a ref
                fileObjectsRef.current.set(field.id, file);

                // Notify parent component of file changes
                if (onFilesChange) {
                  onFilesChange(new Map(fileObjectsRef.current));
                }

                // Store file metadata in formData (this can be serialized)
                // Files will be uploaded to Document Service API after case creation
                const fileData = {
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                  uploadedAt: new Date().toISOString(),
                  requirementCode: field.id, // Store the field/requirement code for mapping to DocumentType
                  // Status: 'pending' means file is ready to upload after case creation
                  status: 'pending',
                  // Note: File object is stored in fileObjectsRef, not here (can't serialize File)
                };

                // Store file metadata in formData
                handleFieldChange(field.id, fileData as any);

                console.info(
                  '📎 File selected and stored (will upload to Document Service after case creation):',
                  {
                    fieldId: field.id,
                    fileName: fileData.fileName,
                    fileSize: fileData.fileSize,
                    fileType: fileData.fileType,
                    requirementCode: field.id,
                  }
                );

                // Return a placeholder URL for FileUpload component display
                // In a real implementation, this would show "Ready to upload" or similar
                return `file://${file.name}`;
              }}
              acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']}
              maxSize={10}
              label={field.label}
              description={field.description || 'Upload document'}
            />
          );
        }

        case 'custom':
          return renderCustomField(field);

        default:
          return <Input {...chakraProps} />;
      }
    })();

    return (
      <Box>
        <Typography fontSize="sm" fontWeight="medium" color="mukuru.text.primary" mb="1">
          {field.label}
          {field.externalValidation?.enabled && (
            <Icon as={FiExternalLink} ml="2" boxSize="3" color="info.500" />
          )}
        </Typography>

        {fieldElement}

        {field.description && (
          <Typography fontSize="xs" color="mukuru.text.primary" mt="1">
            {field.description}
          </Typography>
        )}

        {error && (
          <Typography fontSize="xs" color="error.500" mt="1">
            {error}
          </Typography>
        )}

        {validationState && (
          <Box mt="2">
            {validationState.isValidating ? (
              <HStack gap="2">
                <Spinner size="xs" color="info.500" />
                <Typography fontSize="xs" color="info.600">
                  {validationState.message}
                </Typography>
              </HStack>
            ) : (
              <HStack gap="2">
                <Icon
                  as={validationState.isValid ? FiCheckCircle : FiAlertCircle}
                  boxSize="3"
                  color={validationState.isValid ? 'success.500' : 'error.500'}
                />
                <Typography
                  fontSize="xs"
                  color={validationState.isValid ? 'success.600' : 'error.600'}
                >
                  {validationState.message}
                </Typography>
              </HStack>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const renderCustomField = (field: any) => {
    switch (field.id) {
      case 'shareholders':
      case 'beneficialOwners':
      case 'directors':
      case 'trustees':
        return renderPersonListField(field);

      case 'authorizedSignatory':
      case 'executiveDirector':
      case 'primaryContact':
        return renderPersonField(field);

      case 'bankingDetails':
        return renderBankingDetailsField(field);

      default:
        return (
          <Textarea
            placeholder={field.placeholder}
            color="mukuru.text.primary"
            _placeholder={{ color: '#D0D0D0' }}
            bg="white"
          />
        );
    }
  };

  const renderPersonListField = (field: any) => {
    const people = customFieldData[field.id] || [];

    const addPerson = () => {
      const newPerson = {
        id: `person_${Date.now()}`,
        name: '',
        email: '',
        phone: '',
        idNumber: '',
        address: '',
        ownership: field.id === 'shareholders' ? '' : undefined,
        position: field.id === 'directors' ? '' : undefined,
      };

      setCustomFieldData((prev) => ({
        ...prev,
        [field.id]: [...people, newPerson],
      }));

      onFieldChange(field.id, [...people, newPerson]);
    };

    const removePerson = (personId: string) => {
      const updatedPeople = people.filter((p: any) => p.id !== personId);
      setCustomFieldData((prev) => ({
        ...prev,
        [field.id]: updatedPeople,
      }));
      onFieldChange(field.id, updatedPeople);
    };

    const updatePerson = (personId: string, fieldName: string, value: any) => {
      const updatedPeople = people.map((p: any) =>
        p.id === personId ? { ...p, [fieldName]: value } : p
      );
      setCustomFieldData((prev) => ({
        ...prev,
        [field.id]: updatedPeople,
      }));
      onFieldChange(field.id, updatedPeople);
    };

    return (
      <VStack gap="4" align="stretch">
        {people.map((person: any, index: number) => (
          <Box
            key={String(person.id || index)}
            p="4"
            border="1px"
            borderColor="mukuru.grey.light"
            borderRadius="md"
            bg="mukuru.background.light"
          >
            <HStack justify="space-between" mb="3">
              <Typography fontSize="sm" fontWeight="medium" color="mukuru.text.primary">
                {field.label} #{index + 1}
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removePerson(String(person.id))}
                disabled={isLoading}
              >
                <Icon as={FiTrash2} color="mukuru.text.primary" />
              </Button>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
              <Input
                placeholder="Full Name"
                value={String(person.name || '')}
                onChange={(e) => updatePerson(String(person.id), 'name', e.target.value)}
                disabled={isLoading}
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={String(person.email || '')}
                onChange={(e) => updatePerson(String(person.id), 'email', e.target.value)}
                disabled={isLoading}
              />
              <Input
                placeholder="Phone Number"
                type="tel"
                value={String(person.phone || '')}
                onChange={(e) => updatePerson(String(person.id), 'phone', e.target.value)}
                disabled={isLoading}
              />
              <Input
                placeholder="ID Number"
                value={String(person.idNumber || '')}
                onChange={(e) =>
                  updatePerson(String(person.id), 'idNumber', e.target.value)
                }
                disabled={isLoading}
              />
              {field.id === 'shareholders' && (
                <Input
                  placeholder="Ownership %"
                  value={String(person.ownership || '')}
                  onChange={(e) =>
                    updatePerson(String(person.id), 'ownership', e.target.value)
                  }
                  disabled={isLoading}
                />
              )}
              {field.id === 'directors' && (
                <Input
                  placeholder="Position"
                  value={String(person.position || '')}
                  onChange={(e) =>
                    updatePerson(String(person.id), 'position', e.target.value)
                  }
                  disabled={isLoading}
                />
              )}
            </SimpleGrid>

            <Textarea
              placeholder="Address"
              value={String(person.address || '')}
              onChange={(e) => updatePerson(String(person.id), 'address', e.target.value)}
              mt="3"
              rows={2}
              disabled={isLoading}
              color="mukuru.text.primary"
              _placeholder={{ color: '#D0D0D0' }}
              bg="white"
            />
          </Box>
        ))}

        <Button variant="ghost" onClick={addPerson} disabled={isLoading}>
          <Icon as={FiPlus} mr="2" color="mukuru.text.primary" />
          <Typography color="mukuru.text.primary" fontSize="sm" fontWeight="medium">
            Add {field.label.slice(0, -1)}
          </Typography>
        </Button>
      </VStack>
    );
  };

  const renderPersonField = (field: any) => {
    const person = customFieldData[field.id] || {
      name: '',
      email: '',
      phone: '',
      position: '',
      idNumber: '',
    };

    const updatePerson = (fieldName: string, value: any) => {
      const updatedPerson = { ...person, [fieldName]: value };
      setCustomFieldData((prev) => ({
        ...prev,
        [field.id]: updatedPerson,
      }));
      onFieldChange(field.id, updatedPerson);
    };

    return (
      <VStack gap="3" align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
          <Input
            placeholder="Full Name"
            value={person.name}
            onChange={(e) => updatePerson('name', e.target.value)}
            disabled={isLoading}
          />
          <Input
            placeholder="Email Address"
            type="email"
            value={person.email}
            onChange={(e) => updatePerson('email', e.target.value)}
            disabled={isLoading}
          />
          <Input
            placeholder="Phone Number"
            type="tel"
            value={person.phone}
            onChange={(e) => updatePerson('phone', e.target.value)}
            disabled={isLoading}
          />
          <Input
            placeholder="Position/Title"
            value={person.position}
            onChange={(e) => updatePerson('position', e.target.value)}
            disabled={isLoading}
          />
        </SimpleGrid>
        <Input
          placeholder="ID Number"
          value={person.idNumber}
          onChange={(e) => updatePerson('idNumber', e.target.value)}
          disabled={isLoading}
        />
      </VStack>
    );
  };

  const renderBankingDetailsField = (field: any) => {
    const banking = customFieldData[field.id] || {
      bankName: '',
      accountNumber: '',
      accountType: '',
      branchCode: '',
      accountHolder: '',
    };

    const updateBanking = (fieldName: string, value: any) => {
      const updatedBanking = { ...banking, [fieldName]: value };
      setCustomFieldData((prev) => ({
        ...prev,
        [field.id]: updatedBanking,
      }));
      onFieldChange(field.id, updatedBanking);
    };

    return (
      <VStack gap="3" align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
          <Input
            placeholder="Bank Name"
            value={String(banking.bankName || '')}
            onChange={(e) => updateBanking('bankName', e.target.value)}
            disabled={isLoading}
          />
          <Input
            placeholder="Account Number"
            value={String(banking.accountNumber || '')}
            onChange={(e) => updateBanking('accountNumber', e.target.value)}
            disabled={isLoading}
          />
          <Input
            placeholder="Branch Code"
            value={String(banking.branchCode || '')}
            onChange={(e) => updateBanking('branchCode', e.target.value)}
            disabled={isLoading}
          />
          <select
            value={String(banking.accountType || '')}
            onChange={(e) => updateBanking('accountType', e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid var(--mukuru-grey-light)',
              background: 'white',
              color: 'var(--mukuru-text-primary)',
            }}
          >
            <option value="" style={{ color: '#D0D0D0' }}>
              Select Account Type
            </option>
            <option value="current" style={{ color: 'var(--mukuru-text-primary)' }}>
              Current Account
            </option>
            <option value="savings" style={{ color: 'var(--mukuru-text-primary)' }}>
              Savings Account
            </option>
            <option value="business" style={{ color: 'var(--mukuru-text-primary)' }}>
              Business Account
            </option>
          </select>
        </SimpleGrid>
        <Input
          placeholder="Account Holder Name"
          value={String(banking.accountHolder || '')}
          onChange={(e) => updateBanking('accountHolder', e.target.value)}
          disabled={isLoading}
        />
      </VStack>
    );
  };

  const isStepComplete = () => {
    // Validate based ONLY on the fields from entity configuration that are displayed in this step
    const requiredFields = currentStepConfig.fields.filter((field) => field.required);
    const missingFields = requiredFields.filter((field) => {
      const value = formData[field.id];
      // Check for undefined, null, empty string, or whitespace-only strings
      if (value === undefined || value === null || value === '') {
        return true;
      }
      // For strings, check if they're just whitespace
      if (typeof value === 'string' && value.trim() === '') {
        return true;
      }
      // For arrays, check if they're empty
      if (Array.isArray(value) && value.length === 0) {
        return true;
      }
      // For custom field objects (like authorizedSignatory, person fields, etc.)
      // Check if the object has at least one required property filled
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        // For person objects (authorizedSignatory, executiveDirector, primaryContact, etc.)
        // Check if name is filled (required for person objects)
        if (field.type === 'custom' && (field.id === 'authorizedSignatory' || field.id === 'executiveDirector' || field.id === 'primaryContact')) {
          const personValue = value as { name?: string; email?: string; phone?: string; position?: string; idNumber?: string };
          if (!personValue.name || personValue.name.trim() === '') {
            return true; // Name is required for person objects
          }
        }
        // For banking details objects
        if (field.type === 'custom' && field.id === 'bankingDetails') {
          const bankingValue = value as { bankName?: string; accountNumber?: string; accountType?: string; branchCode?: string; accountHolder?: string };
          if (!bankingValue.bankName || bankingValue.bankName.trim() === '' || 
              !bankingValue.accountNumber || bankingValue.accountNumber.trim() === '') {
            return true; // Bank name and account number are required
          }
        }
        // For generic objects, check if they're empty (no properties or all properties are empty)
        const objectKeys = Object.keys(value);
        if (objectKeys.length === 0) {
          return true; // Empty object
        }
        // Check if all properties are empty
        const allEmpty = objectKeys.every(key => {
          const propValue = (value as any)[key];
          return propValue === undefined || propValue === null || propValue === '' || 
                 (typeof propValue === 'string' && propValue.trim() === '');
        });
        if (allEmpty) {
          return true; // All properties are empty
        }
      }
      return false;
    });

    if (missingFields.length > 0) {
      console.info(
        'Step not complete - missing required fields from entity configuration:',
        {
          currentStep: currentStep,
          stepId: currentStepConfig.id,
          stepTitle: currentStepConfig.title,
          totalFieldsInStep: currentStepConfig.fields.length,
          requiredFieldsInStep: requiredFields.length,
          missingFields: missingFields.map((f) => ({
            id: f.id,
            label: f.label,
            currentValue: formData[f.id],
            valueType: typeof formData[f.id],
          })),
          allFieldsInStep: currentStepConfig.fields.map((f) => ({
            id: f.id,
            label: f.label,
            required: f.required,
            hasValue: !!(
              formData[f.id] &&
              (typeof formData[f.id] !== 'string' || formData[f.id].trim() !== '')
            ),
          })),
        }
      );
    }

    return missingFields.length === 0;
  };

  const getStepProgress = () => {
    const totalFields = currentStepConfig.fields.length;
    const completedFields = currentStepConfig.fields.filter((field) => {
      const value = formData[field.id];
      return value !== undefined && value !== null && value !== '';
    }).length;

    return (completedFields / totalFields) * 100;
  };

  const getOverallWizardProgress = () => {
    let totalCompletedSteps = 0;
    let totalStepsProgress = 0;

    config.steps.forEach((step, index) => {
      const stepNumber = index + 1;
      if (stepNumber < currentStep) {
        // Completed steps
        totalCompletedSteps++;
        totalStepsProgress += 100;
      } else if (stepNumber === currentStep) {
        // Current step - add partial progress
        totalStepsProgress += getStepProgress();
      }
      // Future steps contribute 0
    });

    return {
      completedSteps: totalCompletedSteps,
      totalSteps: config.steps.length,
      percentage: totalStepsProgress / config.steps.length,
    };
  };

  const overallProgress = getOverallWizardProgress();
  const nextStep = currentStep < config.steps.length ? config.steps[currentStep] : null;

  return (
    <Box>
      {banner && (
        <Box
          mb="4"
          p="3"
          borderRadius="md"
          bg={banner.status === 'success' ? 'success.50' : 'error.50'}
          border="1px"
          borderColor={banner.status === 'success' ? 'success.200' : 'error.200'}
        >
          <Typography
            fontSize="sm"
            color={banner.status === 'success' ? 'success.700' : 'error.700'}
          >
            {banner.message}
          </Typography>
        </Box>
      )}

      {/* Enhanced Wizard Progress Overview */}
      <Box
        mb="6"
        p="5"
        bgGradient="linear(to-r, info.50, info.100)"
        borderRadius="xl"
        border="1px"
        borderColor="info.200"
      >
        <VStack gap="4" align="stretch">
          {/* Overall Progress Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Typography fontSize="lg" fontWeight="bold" color="mukuru.text.primary">
                Application Progress
              </Typography>
              <Typography fontSize="sm" color="mukuru.text.primary">
                {overallProgress.completedSteps} of {overallProgress.totalSteps} steps
                completed
              </Typography>
            </VStack>
            <Tag variant="solid" size="md">
              {Math.round(overallProgress.percentage)}% Complete
            </Tag>
          </HStack>

          {/* Overall Progress Bar */}
          <Box>
            <Box
              h="3"
              bg="mukuru.grey.light"
              borderRadius="full"
              overflow="hidden"
              position="relative"
            >
              <Box
                h="100%"
                bgGradient="linear(to-r, primary.500, primary.600)"
                width={`${overallProgress.percentage}%`}
                borderRadius="full"
                transition="width 0.5s ease-in-out"
              />
            </Box>
          </Box>

          {/* Step Indicators */}
          <Box mt="2">
            <HStack gap="2" flexWrap="wrap">
              {config.steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;
                const isUpcoming = stepNumber > currentStep;

                return (
                  <Box
                    key={step.id}
                    flex="1"
                    minW="120px"
                    p="3"
                    borderRadius="md"
                    border="2px"
                    borderColor={
                      isCompleted
                        ? 'mukuru.teal'
                        : isCurrent
                          ? 'mukuru.buttons.primary'
                          : 'mukuru.grey.light'
                    }
                    bg={
                      isCompleted
                        ? 'mukuru.background.light'
                        : isCurrent
                          ? 'mukuru.background.light'
                          : 'white'
                    }
                    position="relative"
                  >
                    <HStack gap="2" align="center">
                      <Circle
                        size="24px"
                        bg={
                          isCompleted
                            ? 'mukuru.teal'
                            : isCurrent
                              ? 'mukuru.buttons.primary'
                              : 'mukuru.grey.medium'
                        }
                        color="white"
                        fontWeight="bold"
                        fontSize="xs"
                      >
                        {isCompleted ? (
                          <Icon as={FiCheckCircle} boxSize="3" />
                        ) : (
                          stepNumber
                        )}
                      </Circle>
                      <VStack align="start" gap="0" flex="1">
                        <Typography
                          fontSize="xs"
                          fontWeight={isCurrent ? 'bold' : 'medium'}
                          color="mukuru.text.primary"
                          lineClamp={1}
                        >
                          {step.title}
                        </Typography>
                        {isCurrent && (
                          <Typography
                            fontSize="2xs"
                            color="mukuru.text.primary"
                            fontWeight="medium"
                          >
                            Current Step
                          </Typography>
                        )}
                        {isCompleted && (
                          <Typography fontSize="2xs" color="mukuru.text.primary">
                            Completed
                          </Typography>
                        )}
                        {isUpcoming && (
                          <Typography fontSize="2xs" color="mukuru.grey.medium">
                            Upcoming
                          </Typography>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </HStack>
          </Box>

          {/* Next Step Indicator */}
          {nextStep && (
            <Box
              mt="2"
              p="3"
              bg="mukuru.background.light"
              borderRadius="md"
              border="1px"
              borderColor="mukuru.grey.light"
            >
              <HStack gap="2">
                <Icon as={FiArrowRight} color="mukuru.buttons.primary" boxSize="4" />
                <VStack align="start" gap="0" flex="1">
                  <Typography
                    fontSize="sm"
                    fontWeight="semibold"
                    color="mukuru.text.primary"
                  >
                    Next Step: {nextStep.title}
                  </Typography>
                  <Typography fontSize="xs" color="mukuru.text.primary">
                    {nextStep.subtitle}
                  </Typography>
                </VStack>
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Current Step Details */}
      <VStack gap="4" align="stretch" mb="6">
        <HStack justify="space-between">
          <VStack align="start" gap="1">
            <Typography fontSize="xl" fontWeight="bold" color="mukuru.text.primary">
              {currentStepConfig.title}
            </Typography>
            <Typography fontSize="sm" color="mukuru.text.primary">
              {currentStepConfig.subtitle}
            </Typography>
          </VStack>
          <Tag variant="solid" size="md">
            Step {currentStep} of {config.steps.length}
          </Tag>
        </HStack>

        <Box>
          <HStack justify="space-between" mb="2">
            <Typography fontSize="sm" fontWeight="medium" color="mukuru.text.primary">
              Step Progress
            </Typography>
            <Typography fontSize="sm" fontWeight="semibold" color="mukuru.text.primary">
              {Math.round(getStepProgress())}%
            </Typography>
          </HStack>
          <Box h="3" bg="mukuru.grey.light" borderRadius="full" overflow="hidden">
            <Box
              h="100%"
              bg="mukuru.buttons.primary"
              width={`${Math.round(getStepProgress())}%`}
              borderRadius="full"
              transition="width 0.3s ease-in-out"
            />
          </Box>
        </Box>
      </VStack>

      {/* Form Fields */}
      <VStack gap="6" align="stretch">
        {currentStepConfig.fields
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((field, index) => (
            <Box key={`${currentStep}-${field.id}-${index}`}>{renderField(field)}</Box>
          ))}
      </VStack>

      {/* Required Documents */}
      {currentStepConfig.requiredDocuments.length > 0 && (
        <Box
          mt="8"
          p="4"
          bg="info.50"
          borderRadius="md"
          border="1px"
          borderColor="info.200"
        >
          <VStack gap="3" align="stretch">
            <HStack gap="2">
              <Icon as={FiUpload} color="mukuru.buttons.primary" />
              <Typography fontSize="sm" fontWeight="medium" color="mukuru.text.primary">
                Required Documents for this Step
              </Typography>
            </HStack>

            <VStack gap="2" align="stretch">
              {currentStepConfig.requiredDocuments.map((docId) => {
                const doc = config.requiredDocuments.find((d) => d.id === docId);
                if (!doc) return null;

                return (
                  <HStack key={docId} gap="2">
                    <Icon as={FiInfo} boxSize="3" color="mukuru.teal" />
                    <Typography fontSize="xs" color="mukuru.text.primary">
                      {doc.name}: {doc.description}
                    </Typography>
                  </HStack>
                );
              })}
            </VStack>
          </VStack>
        </Box>
      )}

      {/* Navigation */}
      <HStack justify="space-between" mt="8">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={currentStep === 1 || isLoading}
        >
          <Typography color="mukuru.text.primary" fontSize="sm" fontWeight="medium">
            Previous
          </Typography>
        </Button>

        <HStack gap="3">
          {currentStep === config.steps.length ? (
            <Button
              variant="primary"
              bg="mukuru.buttons.primary"
              _hover={{ bg: 'mukuru.buttons.inactive.orange' }}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.info('🔘 Submit button clicked', {
                  currentStep,
                  totalSteps: config.steps.length,
                  isStepComplete: isStepComplete(),
                  isLoading,
                });

                if (!isStepComplete()) {
                  console.warn('⚠️ Cannot submit - step not complete');
                  // Check which fields are missing
                  const requiredFields = currentStepConfig.fields.filter(
                    (field) => field.required
                  );
                  const missingFields = requiredFields.filter((field) => {
                    const value = formData[field.id];
                    // Check for undefined, null, empty string, or whitespace-only strings
                    if (value === undefined || value === null || value === '') {
                      return true;
                    }
                    // For strings, check if they're just whitespace
                    if (typeof value === 'string' && value.trim() === '') {
                      return true;
                    }
                    // For arrays, check if they're empty
                    if (Array.isArray(value) && value.length === 0) {
                      return true;
                    }
                    // For custom field objects, check if they have required properties
                    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                      if (field.type === 'custom' && (field.id === 'authorizedSignatory' || field.id === 'executiveDirector' || field.id === 'primaryContact')) {
                        const personValue = value as { name?: string; email?: string; phone?: string; position?: string; idNumber?: string };
                        if (!personValue.name || personValue.name.trim() === '') {
                          return true;
                        }
                      }
                      if (field.type === 'custom' && field.id === 'bankingDetails') {
                        const bankingValue = value as { bankName?: string; accountNumber?: string; accountType?: string; branchCode?: string; accountHolder?: string };
                        if (!bankingValue.bankName || bankingValue.bankName.trim() === '' || 
                            !bankingValue.accountNumber || bankingValue.accountNumber.trim() === '') {
                          return true;
                        }
                      }
                      // Check if object is empty
                      const objectKeys = Object.keys(value);
                      if (objectKeys.length === 0) {
                        return true;
                      }
                      const allEmpty = objectKeys.every(key => {
                        const propValue = (value as any)[key];
                        return propValue === undefined || propValue === null || propValue === '' || 
                               (typeof propValue === 'string' && propValue.trim() === '');
                      });
                      if (allEmpty) {
                        return true;
                      }
                    }
                    return false;
                  });
                  
                  if (missingFields.length > 0) {
                    console.warn('❌ Missing required fields:', missingFields.map(f => ({ id: f.id, label: f.label })));
                    await SweetAlert.warning(
                      'Required Fields Missing',
                      `Please fill in the following required fields:\n${missingFields.map((f) => `- ${f.label}`).join('\n')}`
                    );
                  }
                  return;
                }
                
                console.info('✅ Step is complete, calling onSubmit...');
                try {
                  if (typeof onSubmit === 'function') {
                    await onSubmit();
                  } else {
                    console.error('❌ onSubmit is not a function:', typeof onSubmit);
                    await SweetAlert.error(
                      'Submission Error',
                      'The submit handler is not properly configured. Please refresh the page and try again.'
                    );
                  }
                } catch (error) {
                  console.error('❌ Error in onSubmit handler:', error);
                  await SweetAlert.error(
                    'Submission Error',
                    error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
                  );
                }
              }}
              disabled={isLoading}
              loading={isLoading}
              title={
                !isStepComplete()
                  ? 'Click to see which required fields are missing'
                  : 'Submit your application'
              }
            >
              <Typography color="mukuru.text.inverse" fontSize="sm" fontWeight="medium">
                {!isStepComplete() ? 'Complete Required Fields' : 'Submit Application'}
              </Typography>
            </Button>
          ) : (
            <Button
              variant="primary"
              bg="mukuru.buttons.primary"
              _hover={{ bg: 'mukuru.buttons.inactive.orange' }}
              onClick={onNext}
              disabled={!isStepComplete() || isLoading}
              loading={isLoading}
            >
              <Typography color="mukuru.text.inverse" fontSize="sm" fontWeight="medium">
                Next Step
              </Typography>
            </Button>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}
