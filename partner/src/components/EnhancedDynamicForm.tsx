// @ts-nocheck
"use client";

import { Box, VStack, HStack, Text, Input, Textarea, Button, SimpleGrid, Icon, Badge, Spinner, Flex, Select, Circle } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { FiInfo, FiAlertCircle, FiCheckCircle, FiExternalLink, FiUpload, FiUser, FiUsers, FiPlus, FiTrash2, FiArrowRight } from "react-icons/fi";
import { FormField, EntityFormConfig } from "../lib/entityFormConfigs";
import { FileUpload } from "./FileUpload";
import { SweetAlert } from "../utils/sweetAlert";

interface EnhancedDynamicFormProps {
  config: EntityFormConfig;
  formData: any;
  onFieldChange: (fieldId: string, value: any) => void;
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
  onStepComplete,
  currentStep,
  onNext,
  onPrevious,
  onSubmit,
  isLoading = false,
  validationErrors = {},
  onFilesChange
}: EnhancedDynamicFormProps) {
  const [validationStates, setValidationStates] = useState<Record<string, ValidationState>>({});
  const [customFieldData, setCustomFieldData] = useState<Record<string, any>>({});
  // local banner state instead of Chakra useToast (not available in this build)
  const [banner, setBanner] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  // Store File objects temporarily (can't be serialized in formData)
  // Key: fieldId, Value: File object
  const fileObjectsRef = useRef<Map<string, File>>(new Map());

  const currentStepConfig = config.steps[currentStep - 1];
  if (!currentStepConfig) return null;

  const handleFieldChange = async (fieldId: string, value: any) => {
    onFieldChange(fieldId, value);

    // Handle external validation
    const field = currentStepConfig.fields.find(f => f.id === fieldId);
    if (field?.externalValidation?.enabled && value) {
      await validateExternalField(fieldId, value, field.externalValidation);
    }
  };

  const validateExternalField = async (fieldId: string, value: any, validation: any) => {
    setValidationStates(prev => ({
      ...prev,
      [fieldId]: { isValidating: true, isValid: false, message: validation.loadingText }
    }));

    try {
      // Mock external validation - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate validation result
      const isValid = Math.random() > 0.3; // 70% success rate for demo
      
      if (isValid) {
        setValidationStates(prev => ({
          ...prev,
          [fieldId]: { 
            isValidating: false, 
            isValid: true, 
            message: validation.successText,
            data: { verifiedAt: new Date().toISOString() }
          }
        }));
        
        setBanner({ status: 'success', message: validation.successText });
        setTimeout(() => setBanner(null), 3000);
      } else {
        setValidationStates(prev => ({
          ...prev,
          [fieldId]: { 
            isValidating: false, 
            isValid: false, 
            message: validation.errorText 
          }
        }));
        
        setBanner({ status: 'error', message: validation.errorText });
        setTimeout(() => setBanner(null), 5000);
      }
    } catch (error) {
      setValidationStates(prev => ({
        ...prev,
        [fieldId]: { 
          isValidating: false, 
          isValid: false, 
          message: "Validation service unavailable" 
        }
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
      onChange: (e: any) => handleFieldChange(field.id, e.target.value),
      placeholder: field.placeholder,
      required: field.required, // Use 'required' instead of 'isRequired' for DOM elements
      // Use errorBorderColor for error state instead of isInvalid to avoid React DOM warnings
      ...(error ? { 
        errorBorderColor: 'red.500',
        borderColor: 'red.500'
      } : {}),
      disabled: isLoading,
      bg: 'white',
      color: 'black', // Text color for input value
      _placeholder: { 
        color: 'gray.400',
        opacity: 1
      },
      sx: {
        // Ensure placeholder is light gray across all browsers
        '&::placeholder': {
          color: 'gray.400 !important',
          opacity: '1 !important'
        },
        '&::-webkit-input-placeholder': {
          color: 'gray.400 !important',
          opacity: '1 !important'
        },
        '&::-moz-placeholder': {
          color: 'gray.400 !important',
          opacity: '1 !important'
        },
        '&:-ms-input-placeholder': {
          color: 'gray.400 !important',
          opacity: '1 !important'
        },
        // Ensure input text is black when there's a value
        ...(value && {
          color: '#000000',
          WebkitTextFillColor: '#000000'
        })
      },
      // Caret color
      style: { caretColor: '#000000' }
    } as any;

    // Props for native HTML elements (select, checkbox, etc.)
    const nativeProps = {
      value,
      onChange: (e: any) => handleFieldChange(field.id, e.target.value),
      placeholder: field.placeholder,
      required: field.required,
      disabled: isLoading,
      // Note: No isInvalid prop for native HTML elements
    };

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
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--chakra-colors-gray-200)', background: 'white', color: '#000000' }}
              >
                <option value="">Select an option</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
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
              <Text>{field.label}</Text>
            </HStack>
          );
        
        case 'radio':
          return (
            <VStack align="start" gap="2">
              {field.options?.map(option => (
                <HStack key={option.value}>
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    disabled={option.disabled}
                  />
                  <Text>{option.label}</Text>
                </HStack>
              ))}
            </VStack>
          );
        
        case 'file':
          // Handle both legacy string format and new object format
          const existingFileValue = formData[field.id];
          const existingFileName = typeof existingFileValue === 'string' 
            ? existingFileValue 
            : existingFileValue?.fileName || '';
          
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
                handleFieldChange(field.id, fileData);
                
                console.log('📎 File selected and stored (will upload to Document Service after case creation):', {
                  fieldId: field.id,
                  fileName: fileData.fileName,
                  fileSize: fileData.fileSize,
                  fileType: fileData.fileType,
                  requirementCode: field.id
                });
                
                // Return a placeholder URL for FileUpload component display
                // In a real implementation, this would show "Ready to upload" or similar
                return `file://${file.name}`;
              }}
              acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']}
              maxSize={10}
              label={field.label}
              description={field.description || "Upload document"}
            />
          );
        
        case 'custom':
          return renderCustomField(field);
        
        default:
          return <Input {...chakraProps} />;
      }
    })();

    return (
      <Box key={field.id}>
        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="1">
          {field.label}
          {field.externalValidation?.enabled && (
            <Icon as={FiExternalLink} ml="2" boxSize="3" color="blue.500" />
          )}
        </Text>
        
        {fieldElement}
        
        {field.description && (
          <Text fontSize="xs" color="gray.600" mt="1">
            {field.description}
          </Text>
        )}
        
        {error && (
          <Text fontSize="xs" color="red.500" mt="1">
            {error}
          </Text>
        )}
        
        {validationState && (
          <Box mt="2">
            {validationState.isValidating ? (
              <HStack gap="2">
                <Spinner size="xs" color="blue.500" />
                <Text fontSize="xs" color="blue.600">
                  {validationState.message}
                </Text>
              </HStack>
            ) : (
              <HStack gap="2">
                <Icon 
                  as={validationState.isValid ? FiCheckCircle : FiAlertCircle} 
                  boxSize="3" 
                  color={validationState.isValid ? "green.500" : "red.500"} 
                />
                <Text fontSize="xs" color={validationState.isValid ? "green.600" : "red.600"}>
                  {validationState.message}
                </Text>
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
        position: field.id === 'directors' ? '' : undefined
      };
      
      setCustomFieldData(prev => ({
        ...prev,
        [field.id]: [...people, newPerson]
      }));
      
      onFieldChange(field.id, [...people, newPerson]);
    };
    
    const removePerson = (personId: string) => {
      const updatedPeople = people.filter((p: any) => p.id !== personId);
      setCustomFieldData(prev => ({
        ...prev,
        [field.id]: updatedPeople
      }));
      onFieldChange(field.id, updatedPeople);
    };
    
    const updatePerson = (personId: string, fieldName: string, value: any) => {
      const updatedPeople = people.map((p: any) => 
        p.id === personId ? { ...p, [fieldName]: value } : p
      );
      setCustomFieldData(prev => ({
        ...prev,
        [field.id]: updatedPeople
      }));
      onFieldChange(field.id, updatedPeople);
    };

    return (
      <VStack gap="4" align="stretch">
        {people.map((person: any, index: number) => (
          <Box key={person.id} p="4" border="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
            <HStack justify="space-between" mb="3">
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                {field.label} #{index + 1}
              </Text>
              <Button
                size="xs"
                variant="ghost"
                color="red.500"
                onClick={() => removePerson(person.id)}
                disabled={isLoading}
              >
                <Icon as={FiTrash2} />
              </Button>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
              <Input
                placeholder="Full Name"
                value={person.name}
                onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                disabled={isLoading}
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={person.email}
                onChange={(e) => updatePerson(person.id, 'email', e.target.value)}
                disabled={isLoading}
              />
              <Input
                placeholder="Phone Number"
                type="tel"
                value={person.phone}
                onChange={(e) => updatePerson(person.id, 'phone', e.target.value)}
                disabled={isLoading}
              />
              <Input
                placeholder="ID Number"
                value={person.idNumber}
                onChange={(e) => updatePerson(person.id, 'idNumber', e.target.value)}
                disabled={isLoading}
              />
              {field.id === 'shareholders' && (
                <Input
                  placeholder="Ownership %"
                  value={person.ownership}
                  onChange={(e) => updatePerson(person.id, 'ownership', e.target.value)}
                  disabled={isLoading}
                />
              )}
              {field.id === 'directors' && (
                <Input
                  placeholder="Position"
                  value={person.position}
                  onChange={(e) => updatePerson(person.id, 'position', e.target.value)}
                  disabled={isLoading}
                />
              )}
            </SimpleGrid>
            
            <Textarea
              placeholder="Address"
              value={person.address}
              onChange={(e) => updatePerson(person.id, 'address', e.target.value)}
              mt="3"
              rows={2}
              disabled={isLoading}
            />
          </Box>
        ))}
        
        <Button
          variant="outline"
          onClick={addPerson}
          disabled={isLoading}
        >
          <Icon as={FiPlus} mr="2" />
          Add {field.label.slice(0, -1)}
        </Button>
      </VStack>
    );
  };

  const renderPersonField = (field: FormField) => {
    const person = customFieldData[field.id] || {
      name: '',
      email: '',
      phone: '',
      position: '',
      idNumber: ''
    };
    
    const updatePerson = (fieldName: string, value: any) => {
      const updatedPerson = { ...person, [fieldName]: value };
      setCustomFieldData(prev => ({
        ...prev,
        [field.id]: updatedPerson
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
            bg="white"
            color="gray.800"
            _placeholder={{ color: 'gray.500' }}
          />
          <Input
            placeholder="Email Address"
            type="email"
            value={person.email}
            onChange={(e) => updatePerson('email', e.target.value)}
            disabled={isLoading}
            bg="white"
            color="gray.800"
            _placeholder={{ color: 'gray.500' }}
          />
          <Input
            placeholder="Phone Number"
            type="tel"
            value={person.phone}
            onChange={(e) => updatePerson('phone', e.target.value)}
            disabled={isLoading}
            bg="white"
            color="gray.800"
            _placeholder={{ color: 'gray.500' }}
          />
          <Input
            placeholder="Position/Title"
            value={person.position}
            onChange={(e) => updatePerson('position', e.target.value)}
            disabled={isLoading}
            bg="white"
            color="gray.800"
            _placeholder={{ color: 'gray.500' }}
          />
        </SimpleGrid>
        <Input
          placeholder="ID Number"
          value={person.idNumber}
          onChange={(e) => updatePerson('idNumber', e.target.value)}
          disabled={isLoading}
          bg="white"
          color="gray.800"
          _placeholder={{ color: 'gray.500' }}
        />
      </VStack>
    );
  };

  const renderBankingDetailsField = (field: FormField) => {
    const banking = customFieldData[field.id] || {
      bankName: '',
      accountNumber: '',
      accountType: '',
      branchCode: '',
      accountHolder: ''
    };
    
    const updateBanking = (fieldName: string, value: any) => {
      const updatedBanking = { ...banking, [fieldName]: value };
      setCustomFieldData(prev => ({
        ...prev,
        [field.id]: updatedBanking
      }));
      onFieldChange(field.id, updatedBanking);
    };

    return (
      <VStack gap="3" align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
          <Input
            placeholder="Bank Name"
            value={banking.bankName}
            onChange={(e) => updateBanking('bankName', e.target.value)}
            disabled={isLoading}
            bg="white"
            color="gray.800"
            _placeholder={{ color: 'gray.500' }}
          />
          <Input
            placeholder="Account Number"
            value={banking.accountNumber}
            onChange={(e) => updateBanking('accountNumber', e.target.value)}
            disabled={isLoading}
            bg="white"
            color="gray.800"
            _placeholder={{ color: 'gray.500' }}
          />
          <Input
            placeholder="Branch Code"
            value={banking.branchCode}
            onChange={(e) => updateBanking('branchCode', e.target.value)}
            disabled={isLoading}
            bg="white"
            color="gray.800"
            _placeholder={{ color: 'gray.500' }}
          />
          <Select
            placeholder="Account Type"
            value={banking.accountType}
            onChange={(e) => updateBanking('accountType', e.target.value)}
            disabled={isLoading}
          >
            <option value="current">Current Account</option>
            <option value="savings">Savings Account</option>
            <option value="business">Business Account</option>
          </Select>
        </SimpleGrid>
        <Input
          placeholder="Account Holder Name"
          value={banking.accountHolder}
          onChange={(e) => updateBanking('accountHolder', e.target.value)}
          disabled={isLoading}
          bg="white"
          color="gray.800"
          _placeholder={{ color: 'gray.500' }}
        />
      </VStack>
    );
  };

  const isStepComplete = () => {
    // Validate based ONLY on the fields from entity configuration that are displayed in this step
    const requiredFields = currentStepConfig.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => {
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
      return false;
    });
    
    if (missingFields.length > 0) {
      console.log('Step not complete - missing required fields from entity configuration:', {
        currentStep: currentStep,
        stepId: currentStepConfig.id,
        stepTitle: currentStepConfig.title,
        totalFieldsInStep: currentStepConfig.fields.length,
        requiredFieldsInStep: requiredFields.length,
        missingFields: missingFields.map(f => ({
          id: f.id,
          label: f.label,
          currentValue: formData[f.id],
          valueType: typeof formData[f.id]
        })),
        allFieldsInStep: currentStepConfig.fields.map(f => ({
          id: f.id,
          label: f.label,
          required: f.required,
          hasValue: !!(formData[f.id] && (typeof formData[f.id] !== 'string' || formData[f.id].trim() !== ''))
        }))
      });
    }
    
    return missingFields.length === 0;
  };

  const getStepProgress = () => {
    const totalFields = currentStepConfig.fields.length;
    const completedFields = currentStepConfig.fields.filter(field => {
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
      percentage: (totalStepsProgress / config.steps.length)
    };
  };

  const overallProgress = getOverallWizardProgress();
  const nextStep = currentStep < config.steps.length ? config.steps[currentStep] : null;

  return (
    <Box>
      {banner && (
        <Box mb="4" p="3" borderRadius="md" bg={banner.status === 'success' ? 'green.50' : 'red.50'} border="1px" borderColor={banner.status === 'success' ? 'green.200' : 'red.200'}>
          <Text fontSize="sm" color={banner.status === 'success' ? 'green.700' : 'red.700'}>{banner.message}</Text>
        </Box>
      )}
      
      {/* Enhanced Wizard Progress Overview */}
      <Box mb="6" p="5" bgGradient="linear(to-r, blue.50, indigo.50)" borderRadius="xl" border="1px" borderColor="blue.200">
        <VStack gap="4" align="stretch">
          {/* Overall Progress Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                Application Progress
              </Text>
              <Text fontSize="sm" color="gray.600">
                {overallProgress.completedSteps} of {overallProgress.totalSteps} steps completed
              </Text>
            </VStack>
            <Badge colorScheme="blue" variant="solid" fontSize="md" px="3" py="1" borderRadius="full">
              {Math.round(overallProgress.percentage)}% Complete
            </Badge>
          </HStack>

          {/* Overall Progress Bar */}
          <Box>
            <Box h="3" bg="gray.200" borderRadius="full" overflow="hidden" position="relative">
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
                      isCompleted ? "green.400" : 
                      isCurrent ? "blue.500" : 
                      "gray.200"
                    }
                    bg={
                      isCompleted ? "green.50" : 
                      isCurrent ? "blue.50" : 
                      "white"
                    }
                    position="relative"
                  >
                    <HStack gap="2" align="center">
                      <Circle
                        size="24px"
                        bg={
                          isCompleted ? "green.500" : 
                          isCurrent ? "blue.500" : 
                          "gray.300"
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
                        <Text 
                          fontSize="xs" 
                          fontWeight={isCurrent ? "bold" : "medium"}
                          color={
                            isCompleted ? "green.700" : 
                            isCurrent ? "blue.700" : 
                            "gray.600"
                          }
                          noOfLines={1}
                        >
                          {step.title}
                        </Text>
                        {isCurrent && (
                          <Text fontSize="2xs" color="blue.600" fontWeight="medium">
                            Current Step
                          </Text>
                        )}
                        {isCompleted && (
                          <Text fontSize="2xs" color="green.600">
                            Completed
                          </Text>
                        )}
                        {isUpcoming && (
                          <Text fontSize="2xs" color="gray.500">
                            Upcoming
                          </Text>
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
            <Box mt="2" p="3" bg="orange.50" borderRadius="md" border="1px" borderColor="orange.200">
              <HStack gap="2">
                <Icon as={FiArrowRight} color="orange.600" boxSize="4" />
                <VStack align="start" gap="0" flex="1">
                  <Text fontSize="sm" fontWeight="semibold" color="orange.800">
                    Next Step: {nextStep.title}
                  </Text>
                  <Text fontSize="xs" color="orange.700">
                    {nextStep.subtitle}
                  </Text>
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
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              {currentStepConfig.title}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {currentStepConfig.subtitle}
            </Text>
          </VStack>
          <Badge colorScheme="blue" variant="subtle" fontSize="sm" px="3" py="1">
            Step {currentStep} of {config.steps.length}
          </Badge>
        </HStack>
        
        <Box>
          <HStack justify="space-between" mb="2">
            <Text fontSize="sm" fontWeight="medium" color="gray.700">Step Progress</Text>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">{Math.round(getStepProgress())}%</Text>
          </HStack>
          <Box h="3" bg="gray.200" borderRadius="full" overflow="hidden">
            <Box 
              h="100%" 
              bg="blue.500" 
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
          .map(field => renderField(field))}
      </VStack>

      {/* Required Documents */}
      {currentStepConfig.requiredDocuments.length > 0 && (
        <Box mt="8" p="4" bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
          <VStack gap="3" align="stretch">
            <HStack gap="2">
              <Icon as={FiUpload} color="blue.500" />
              <Text fontSize="sm" fontWeight="medium" color="blue.700">
                Required Documents for this Step
              </Text>
            </HStack>
            
            <VStack gap="2" align="stretch">
              {currentStepConfig.requiredDocuments.map(docId => {
                const doc = config.requiredDocuments.find(d => d.id === docId);
                if (!doc) return null;
                
                return (
                  <HStack key={docId} gap="2">
                    <Icon as={FiInfo} boxSize="3" color="blue.500" />
                    <Text fontSize="xs" color="blue.600">
                      {doc.name}: {doc.description}
                    </Text>
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
          variant="outline"
          onClick={onPrevious}
          disabled={currentStep === 1 || isLoading}
        >
          Previous
        </Button>
        
        <HStack gap="3">
          {currentStep === config.steps.length ? (
            <Button
              colorScheme={isStepComplete() ? "blue" : "orange"}
              onClick={async () => {
                if (!isStepComplete()) {
                  console.error('Cannot submit - step not complete');
                  // Check which fields are missing
                  const requiredFields = currentStepConfig.fields.filter(field => field.required);
                  const missingFields = requiredFields.filter(field => {
                    const value = formData[field.id];
                    return value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '');
                  });
                  if (missingFields.length > 0) {
                    await SweetAlert.warning(
                      'Required Fields Missing',
                      `Please fill in the following required fields:\n${missingFields.map(f => `- ${f.label}`).join('\n')}`
                    );
                  }
                  return;
                }
                console.log('Submitting form...');
                onSubmit();
              }}
              disabled={isLoading}
              isLoading={isLoading}
              title={!isStepComplete() ? "Click to see which required fields are missing" : "Submit your application"}
            >
              {!isStepComplete() ? "Complete Required Fields" : "Submit Application"}
            </Button>
          ) : (
            <Button
              colorScheme="blue"
              onClick={onNext}
              disabled={!isStepComplete() || isLoading}
              isLoading={isLoading}
            >
              Next Step
            </Button>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}
