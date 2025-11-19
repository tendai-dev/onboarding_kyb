"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Button,
  SimpleGrid,
  Icon,
  Badge,
  Tooltip,
  Spinner,
  Flex,
  Circle,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { FiInfo, FiAlertCircle, FiCheckCircle, FiExternalLink, FiUpload, FiUser, FiUsers, FiPlus, FiTrash2, FiArrowRight } from "react-icons/fi";
import { FormField, EntityFormConfig } from "../lib/entityFormConfigs";
import { FileUpload } from "./FileUpload";
import { uploadToGoogleDrive } from "../lib/googleDriveUpload";

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
  validationErrors = {}
}: EnhancedDynamicFormProps) {
  const [validationStates, setValidationStates] = useState<Record<string, ValidationState>>({});
  const [customFieldData, setCustomFieldData] = useState<Record<string, any>>({});
  // const toast = useToast(); // Removed - not available in Chakra UI v3

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
        
        // toast removed - not available in Chakra UI v3
        console.log("Validation Successful:", validation.successText);
      } else {
        setValidationStates(prev => ({
          ...prev,
          [fieldId]: { 
            isValidating: false, 
            isValid: false, 
            message: validation.errorText 
          }
        }));
        
        console.error("Validation Failed:", validation.errorText);
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

    const baseProps = {
      value,
      onChange: (e: any) => handleFieldChange(field.id, e.target.value),
      placeholder: field.placeholder,
      isRequired: field.required,
      isInvalid: !!error,
      disabled: isLoading
    };

    const fieldElement = (() => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'url':
        case 'number':
          return <Input {...baseProps} type={field.type} />;
        
        case 'date':
          return <Input {...baseProps} type="date" />;
        
        case 'textarea':
          return <Textarea {...baseProps} rows={4} />;
        
        case 'select':
          return (
            <select
              {...(baseProps as any)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #E2E8F0'
              }}
            >
              <option value="">Select an option</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        
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
              <Text>{field.label}</Text>
            </HStack>
          );
        
        case 'radio':
          return (
            <VStack align="start" gap="2">
              {field.options?.map(option => (
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
                      opacity: option.disabled ? 0.5 : 1
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
                uploadToGoogleDrive(file, `Mukuru Application - ${formData.companyName || 'Company'}`);
                return file.name;
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
          return <Input {...baseProps} />;
      }
    })();

    return (
      <Box key={field.id}>
        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
          {field.label}
          {field.externalValidation?.enabled && (
            <Tooltip.Root>
              <Tooltip.Trigger>
                <Icon as={FiExternalLink} ml="2" boxSize="3" color="blue.500" />
              </Tooltip.Trigger>
              <Tooltip.Content>
                This field will be validated against external sources
              </Tooltip.Content>
            </Tooltip.Root>
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
          />
          <Input
            placeholder="Account Number"
            value={banking.accountNumber}
            onChange={(e) => updateBanking('accountNumber', e.target.value)}
            disabled={isLoading}
          />
          <Input
            placeholder="Branch Code"
            value={banking.branchCode}
            onChange={(e) => updateBanking('branchCode', e.target.value)}
            disabled={isLoading}
          />
          <select
            value={banking.accountType}
            onChange={(e: any) => updateBanking('accountType', e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #E2E8F0'
            }}
          >
            <option value="">Account Type</option>
            <option value="current">Current Account</option>
            <option value="savings">Savings Account</option>
            <option value="business">Business Account</option>
          </select>
        </SimpleGrid>
        <Input
          placeholder="Account Holder Name"
          value={banking.accountHolder}
          onChange={(e) => updateBanking('accountHolder', e.target.value)}
          disabled={isLoading}
        />
      </VStack>
    );
  };

  const isStepComplete = () => {
    const requiredFields = currentStepConfig.fields.filter(field => field.required);
    return requiredFields.every(field => {
      const value = formData[field.id];
      return value !== undefined && value !== null && value !== '';
    });
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
                          lineClamp={1}
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
              colorScheme="blue"
              onClick={onSubmit}
              disabled={!isStepComplete() || isLoading}
              loading={isLoading}
            >
              Submit Application
            </Button>
          ) : (
            <Button
              colorScheme="blue"
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
