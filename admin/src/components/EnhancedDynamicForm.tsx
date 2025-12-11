/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable security/detect-object-injection */
'use client';

import {
  Box,
  VStack,
  HStack,
  Textarea,
  SimpleGrid,
  Icon,
  Circle,
  Spinner,
} from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Typography,
  Button,
  Tag,
  Tooltip,
  PhoneInput,
  TypeAhead,
  Dropdown,
} from '@mukuru/mukuru-react-components';
// Import wrapper components (not yet in npm package)
import { Input } from '@/lib/mukuruComponentWrappers';
import { useState } from 'react';
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
import { uploadToGoogleDrive } from '../lib/googleDriveUpload';

interface EnhancedDynamicFormProps {
  config: EntityFormConfig;
  formData: unknown;
  onFieldChange: (fieldId: string, value: unknown) => void;
  onStepComplete: (stepId: string) => void;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  validationErrors?: Record<string, string>;
}

interface ValidationState {
  isValidating: boolean;
  isValid: boolean;
  message: string;
  data?: unknown;
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
}: EnhancedDynamicFormProps) {
  const [validationStates, setValidationStates] = useState<
    Record<string, ValidationState>
  >({});
  const [customFieldData, setCustomFieldData] = useState<Record<string, unknown>>({});
  // const toast = useToast(); // Removed - not available in Chakra UI v3

  const currentStepConfig = config.steps[currentStep - 1];
  if (!currentStepConfig) return null;

  const handleFieldChange = async (fieldId: string, value: unknown) => {
    onFieldChange(fieldId, value);

    // Handle external validation
    const field = currentStepConfig.fields.find((f) => f.id === fieldId);
    if (field?.externalValidation?.enabled && value) {
      await validateExternalField(fieldId, value, field.externalValidation);
    }
  };

  const validateExternalField = async (
    fieldId: string,
    value: unknown,
    validation: unknown
  ) => {
    const validationObj = validation as {
      loadingText?: string;
      successText?: string;
      errorText?: string;
    } | null;
    setValidationStates((prev) => ({
      ...prev,
      [fieldId]: {
        isValidating: true,
        isValid: false,
        message: validationObj?.loadingText || 'Validating...',
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
            message: validationObj?.successText || 'Validation successful',
            data: { verifiedAt: new Date().toISOString() },
          },
        }));

        // toast removed - not available in Chakra UI v3
        console.info('Validation Successful:', validationObj?.successText);
      } else {
        setValidationStates((prev) => ({
          ...prev,
          [fieldId]: {
            isValidating: false,
            isValid: false,
            message: validationObj?.errorText || 'Validation failed',
          },
        }));

        console.error('Validation Failed:', validationObj?.errorText);
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
    const formDataObj = formData as Record<string, unknown> | null;
    const rawValue = formDataObj?.[field.id];
    const value =
      typeof rawValue === 'string'
        ? rawValue
        : typeof rawValue === 'number'
          ? String(rawValue)
          : typeof rawValue === 'boolean'
            ? String(rawValue)
            : '';
    const error = validationErrors[field.id];
    const validationState = validationStates[field.id];

    const baseProps = {
      value,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        handleFieldChange(field.id, e.target.value);
      },
      placeholder: field.placeholder,
      isRequired: field.required,
      isInvalid: !!error,
      disabled: isLoading,
    };

    const fieldElement = (() => {
      switch (field.type) {
        case 'text':
          // Use TypeAhead for fields that might benefit from autocomplete (address, city, country, etc.)
          if (
            field.id.toLowerCase().includes('address') ||
            field.id.toLowerCase().includes('city') ||
            field.id.toLowerCase().includes('country') ||
            field.id.toLowerCase().includes('location')
          ) {
            return (
              <TypeAhead
                value={baseProps.value || ''}
                onChange={(val) => {
                  handleFieldChange(field.id, val);
                }}
                options={[]} // Can be populated with suggestions from API
                placeholder={baseProps.placeholder || 'Start typing...'}
                disabled={baseProps.disabled}
                minSearchLength={2}
                loading={false}
              />
            );
          }
          return <Input {...baseProps} type="text" />;
        case 'email':
        case 'url':
        case 'number':
          return <Input {...baseProps} type={field.type} />;
        case 'tel':
          return (
            <PhoneInput
              value={baseProps.value || ''}
              onChange={(val: string | React.ChangeEvent<HTMLInputElement>) => {
                const stringValue = typeof val === 'string' ? val : val.target.value;
                baseProps.onChange?.({
                  target: { value: stringValue },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
              disabled={baseProps.disabled}
              placeholder={baseProps.placeholder || 'Enter phone number'}
            />
          );

        case 'date':
          return <Input {...baseProps} type="date" />;

        case 'textarea':
          return <Textarea {...baseProps} rows={4} />;

        case 'select':
          return field.options ? (
            <Dropdown
              items={field.options.map((opt) => ({
                label: opt.label,
                value: opt.value,
                disabled: opt.disabled,
              }))}
              placeholder={field.placeholder || 'Select an option'}
              defaultValue={baseProps.value || ''}
              onSelectionChange={(selectedValue) => {
                handleFieldChange(field.id, selectedValue || '');
              }}
            />
          ) : null;

        case 'checkbox':
          return (
            <HStack gap="2">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                disabled={isLoading}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
              />
              <Typography>{field.label}</Typography>
            </HStack>
          );

        case 'radio':
          return (
            <VStack align="start" gap="2">
              {field.options?.map((option) => (
                <HStack key={option.value} gap="2">
                  <input
                    type="radio"
                    id={`${field.id}-${option.value}`}
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    disabled={option.disabled}
                    style={{ cursor: option.disabled ? 'not-allowed' : 'pointer' }}
                  />
                  <label
                    htmlFor={`${field.id}-${option.value}`}
                    style={{
                      cursor: option.disabled ? 'not-allowed' : 'pointer',
                      opacity: option.disabled ? 0.5 : 1,
                    }}
                  >
                    {option.label}
                  </label>
                </HStack>
              ))}
            </VStack>
          );

        case 'file':
          return (
            <FileUpload
              onFileUpload={async (file) => {
                handleFieldChange(field.id, file.name);
                const formDataObj = formData as Record<string, unknown> | null;
                uploadToGoogleDrive(
                  file,
                  `Mukuru Application - ${formDataObj?.companyName && typeof formDataObj.companyName === 'string' ? formDataObj.companyName : 'Company'}`
                );
                return file.name;
              }}
              acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']}
              maxSize={10}
              label={field.label}
              description={field.description || 'Upload document'}
            />
          );

        case 'custom':
          return renderCustomField(field);

        default:
          return <Input {...baseProps} />;
      }
    })();

    return (
      <Box key={field.id}>
        <Typography fontSize="sm" fontWeight="medium" color="mukuru.text.primary" mb="2">
          {field.label}
          {field.externalValidation?.enabled && (
            <Tooltip
              content="This field will be validated against external sources"
              showArrow
            >
              <Icon as={FiExternalLink} ml="2" boxSize="3" color="mukuru.teal" />
            </Tooltip>
          )}
        </Typography>

        {fieldElement}

        {field.description && (
          <Typography fontSize="xs" color="mukuru.text.primary" mt="1">
            {field.description}
          </Typography>
        )}

        {error && (
          <Typography fontSize="xs" color="mukuru.text.error" mt="1">
            {error}
          </Typography>
        )}

        {validationState && (
          <Box mt="2">
            {validationState.isValidating ? (
              <HStack gap="2">
                <Spinner size="xs" color="mukuru.teal" />
                <Typography fontSize="xs" color="mukuru.teal">
                  {validationState.message}
                </Typography>
              </HStack>
            ) : (
              <HStack gap="2">
                <Icon
                  as={validationState.isValid ? FiCheckCircle : FiAlertCircle}
                  boxSize="3"
                  color={validationState.isValid ? 'green.500' : 'red.500'}
                />
                <Typography
                  fontSize="xs"
                  color={validationState.isValid ? 'green.600' : 'red.600'}
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

  const renderCustomField = (field: FormField) => {
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
        return <Textarea placeholder={field.placeholder} />;
    }
  };

  const renderPersonListField = (field: FormField) => {
    const rawPeople = customFieldData[field.id];
    const people = Array.isArray(rawPeople)
      ? (rawPeople as Array<Record<string, unknown>>)
      : [];

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
      const updatedPeople = people.filter((p) => p.id !== personId);
      setCustomFieldData((prev) => ({
        ...prev,
        [field.id]: updatedPeople,
      }));
      onFieldChange(field.id, updatedPeople);
    };

    const updatePerson = (personId: string, fieldName: string, value: unknown) => {
      const updatedPeople = people.map((p) =>
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
        {people.map((person, index: number) => (
          <Box
            key={String(person.id || index)}
            p="4"
            border="1px"
            borderColor="gray.200"
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
                onClick={() => removePerson(String(person.id || ''))}
                disabled={isLoading}
              >
                <Icon as={FiTrash2} />
              </Button>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
              <Input
                placeholder="Full Name"
                value={String(person.name || '')}
                onChange={(e) =>
                  updatePerson(String(person.id || ''), 'name', e.target.value)
                }
                disabled={isLoading}
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={String(person.email || '')}
                onChange={(e) =>
                  updatePerson(String(person.id || ''), 'email', e.target.value)
                }
                disabled={isLoading}
              />
              <PhoneInput
                placeholder="Phone Number"
                value={String(person.phone || '')}
                onChange={(val: string | React.ChangeEvent<HTMLInputElement>) => {
                  const stringValue = typeof val === 'string' ? val : val.target.value;
                  updatePerson(String(person.id || ''), 'phone', stringValue);
                }}
                disabled={isLoading}
              />
              <Input
                placeholder="ID Number"
                value={String(person.idNumber || '')}
                onChange={(e) =>
                  updatePerson(String(person.id || ''), 'idNumber', e.target.value)
                }
                disabled={isLoading}
              />
              {field.id === 'shareholders' && (
                <Input
                  placeholder="Ownership %"
                  value={String(person.ownership || '')}
                  onChange={(e) =>
                    updatePerson(String(person.id || ''), 'ownership', e.target.value)
                  }
                  disabled={isLoading}
                />
              )}
              {field.id === 'directors' && (
                <Input
                  placeholder="Position"
                  value={String(person.position || '')}
                  onChange={(e) =>
                    updatePerson(String(person.id || ''), 'position', e.target.value)
                  }
                  disabled={isLoading}
                />
              )}
            </SimpleGrid>

            <Textarea
              placeholder="Address"
              value={String(person.address || '')}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updatePerson(String(person.id || ''), 'address', e.target.value)
              }
              mt="3"
              rows={2}
              disabled={isLoading}
            />
          </Box>
        ))}

        <Button variant="ghost" onClick={addPerson} disabled={isLoading}>
          <Icon as={FiPlus} mr="2" />
          Add {field.label.slice(0, -1)}
        </Button>
      </VStack>
    );
  };

  const renderPersonField = (field: FormField) => {
    const rawPerson = customFieldData[field.id];
    const person: Record<string, unknown> =
      rawPerson && typeof rawPerson === 'object' && rawPerson !== null
        ? (rawPerson as Record<string, unknown>)
        : {
            name: '',
            email: '',
            phone: '',
            position: '',
            idNumber: '',
          };

    const updatePerson = (fieldName: string, value: unknown) => {
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
            value={String(person.name || '')}
            onChange={(e) => updatePerson('name', e.target.value)}
            disabled={isLoading}
          />
          <Input
            placeholder="Email Address"
            type="email"
            value={String(person.email || '')}
            onChange={(e) => updatePerson('email', e.target.value)}
            disabled={isLoading}
          />
          <PhoneInput
            placeholder="Phone Number"
            value={String(person.phone || '')}
            onChange={(val: string | React.ChangeEvent<HTMLInputElement>) => {
              const stringValue = typeof val === 'string' ? val : val.target.value;
              updatePerson('phone', stringValue);
            }}
            disabled={isLoading}
          />
          <Input
            placeholder="Position/Title"
            value={String(person.position || '')}
            onChange={(e) => updatePerson('position', e.target.value)}
            disabled={isLoading}
          />
        </SimpleGrid>
        <Input
          placeholder="ID Number"
          value={String(person.idNumber || '')}
          onChange={(e) => updatePerson('idNumber', e.target.value)}
          disabled={isLoading}
        />
      </VStack>
    );
  };

  const renderBankingDetailsField = (field: FormField) => {
    const rawBanking = customFieldData[field.id];
    const banking =
      rawBanking && typeof rawBanking === 'object' && rawBanking !== null
        ? (rawBanking as Record<string, unknown>)
        : {
            bankName: '',
            accountNumber: '',
            accountType: '',
            branchCode: '',
            accountHolder: '',
          };

    const updateBanking = (fieldName: string, value: unknown) => {
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
          <Dropdown
            items={[
              { label: 'Current Account', value: 'current' },
              { label: 'Savings Account', value: 'savings' },
              { label: 'Business Account', value: 'business' },
            ]}
            placeholder="Account Type"
            defaultValue={String(banking.accountType || '')}
            onSelectionChange={(value) => {
              if (value) updateBanking('accountType', value);
            }}
          />
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
    const requiredFields = currentStepConfig.fields.filter((field) => field.required);
    const formDataObj = formData as Record<string, unknown> | null;
    return requiredFields.every((field) => {
      const value = formDataObj?.[field.id];
      return value !== undefined && value !== null && value !== '';
    });
  };

  const getStepProgress = () => {
    const totalFields = currentStepConfig.fields.length;
    const formDataObj = formData as Record<string, unknown> | null;
    const completedFields = currentStepConfig.fields.filter((field) => {
      const value = formDataObj?.[field.id];
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
      {/* Enhanced Wizard Progress Overview */}
      <Box
        mb="6"
        p="5"
        bgGradient="linear(to-r, blue.50, indigo.50)"
        borderRadius="xl"
        border="1px"
        borderColor="blue.200"
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
            <Tag variant="info">{Math.round(overallProgress.percentage)}% Complete</Tag>
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
                bgGradient="linear(to-r, blue.500, blue.600)"
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
                      isCompleted ? 'green.400' : isCurrent ? 'blue.500' : 'gray.200'
                    }
                    bg={isCompleted ? 'green.50' : isCurrent ? 'blue.50' : 'white'}
                    position="relative"
                  >
                    <HStack gap="2" align="center">
                      <Circle
                        size="24px"
                        bg={
                          isCompleted ? 'green.500' : isCurrent ? 'blue.500' : 'gray.300'
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
                          color={
                            isCompleted
                              ? 'green.700'
                              : isCurrent
                                ? 'blue.700'
                                : 'gray.600'
                          }
                          lineClamp={1}
                        >
                          {step.title}
                        </Typography>
                        {isCurrent && (
                          <Typography
                            fontSize="2xs"
                            color="mukuru.teal"
                            fontWeight="medium"
                          >
                            Current Step
                          </Typography>
                        )}
                        {isCompleted && (
                          <Typography fontSize="2xs" color="mukuru.text.success">
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
              bg="mukuru.state.hover.card"
              borderRadius="md"
              border="1px"
              borderColor="orange.200"
            >
              <HStack gap="2">
                <Icon as={FiArrowRight} color="mukuru.buttons.primary" boxSize="4" />
                <VStack align="start" gap="0" flex="1">
                  <Typography
                    fontSize="sm"
                    fontWeight="semibold"
                    color="mukuru.buttons.primary"
                  >
                    Next Step: {nextStep.title}
                  </Typography>
                  <Typography fontSize="xs" color="mukuru.buttons.primary">
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
          <Tag variant="info">
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
              bg="mukuru.teal"
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
          .map((field) => renderField(field))}
      </VStack>

      {/* Required Documents */}
      {currentStepConfig.requiredDocuments.length > 0 && (
        <Box
          mt="8"
          p="4"
          bg="mukuru.teal"
          borderRadius="md"
          border="1px"
          borderColor="blue.200"
        >
          <VStack gap="3" align="stretch">
            <HStack gap="2">
              <Icon as={FiUpload} color="blue.500" />
              <Typography fontSize="sm" fontWeight="medium" color="blue.700">
                Required Documents for this Step
              </Typography>
            </HStack>

            <VStack gap="2" align="stretch">
              {currentStepConfig.requiredDocuments.map((docId) => {
                const doc = config.requiredDocuments.find(
                  (d) => (d as { id?: string }).id === docId
                );
                if (!doc) return null;

                return (
                  <HStack key={docId} gap="2">
                    <Icon as={FiInfo} boxSize="3" color="blue.500" />
                    <Typography fontSize="xs" color="blue.600">
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
          Previous
        </Button>

        <HStack gap="3">
          {currentStep === config.steps.length ? (
            <Button
              variant="primary"
              onClick={onSubmit}
              disabled={!isStepComplete() || isLoading}
              loading={isLoading}
            >
              Submit Application
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onNext}
              disabled={!isStepComplete() || isLoading}
              loading={isLoading}
            >
              Next Step
            </Button>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}
