// @ts-nocheck
"use client";

import {
  Box,
  VStack,
  HStack,
  Textarea,
  SimpleGrid,
  Icon,
  Spinner,
  Flex,
  FormControl,
  FormHelperText,
  FormErrorMessage
} from "@chakra-ui/react";
import { Button, Checkbox, Radio, RadioGroup, Tag, Tooltip, Typography, Dropdown, AlertBar } from "@/lib/mukuruImports";
import { Input, Switch } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiInfo, FiAlertCircle, FiCheckCircle, FiExternalLink } from "react-icons/fi";

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'switch' | 'file' | 'custom';
  required?: boolean;
  placeholder?: string;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  dependencies?: {
    field: string;
    value: any;
    show?: boolean;
    required?: boolean;
  }[];
  externalValidation?: {
    enabled: boolean;
    apiEndpoint?: string;
    loadingText?: string;
    successText?: string;
    errorText?: string;
  };
  conditional?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  group?: string;
  order?: number;
}

export interface DynamicFormProps {
  fields: FormField[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onFieldChange?: (fieldId: string, value: any) => void;
  validationSchema?: any;
  showProgress?: boolean;
  submitText?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function DynamicForm({
  fields,
  initialData = {},
  onSubmit,
  onFieldChange,
  validationSchema,
  showProgress = true,
  submitText = "Submit",
  loading = false,
  disabled = false
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatingFields, setValidatingFields] = useState<Set<string>>(new Set());
  const [externalValidationResults, setExternalValidationResults] = useState<Record<string, { status: 'idle' | 'validating' | 'valid' | 'invalid'; message?: string }>>({});

  // Group fields by group
  const groupedFields = fields.reduce((acc, field) => {
    const group = field.group || 'default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, FormField[]>);

  // Sort fields within each group
  Object.keys(groupedFields).forEach(group => {
    groupedFields[group].sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  const updateField = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    onFieldChange?.(fieldId, value);
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }

    // Trigger external validation if configured
    const field = fields.find(f => f.id === fieldId);
    if (field?.externalValidation?.enabled && value) {
      validateExternalField(fieldId, value, field.externalValidation);
    }
  };

  const validateExternalField = async (fieldId: string, value: any, config: FormField['externalValidation']) => {
    if (!config?.apiEndpoint) return;

    setValidatingFields(prev => new Set(prev).add(fieldId));
    setExternalValidationResults(prev => ({
      ...prev,
      [fieldId]: { status: 'validating' }
    }));

    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation result
      const isValid = Math.random() > 0.3; // 70% success rate for demo
      
      setExternalValidationResults(prev => ({
        ...prev,
        [fieldId]: {
          status: isValid ? 'valid' : 'invalid',
          message: isValid ? config.successText : config.errorText
        }
      }));
    } catch (error) {
      setExternalValidationResults(prev => ({
        ...prev,
        [fieldId]: {
          status: 'invalid',
          message: 'Validation failed. Please try again.'
        }
      }));
    } finally {
      setValidatingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldId);
        return newSet;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.id];
      
      // Required validation
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[field.id] = `${field.label} is required`;
        return;
      }

      // Skip validation if field is empty and not required
      if (!value) return;

      // Type-specific validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }

      if (field.type === 'url' && value) {
        try {
          new URL(value);
        } catch {
          newErrors[field.id] = 'Please enter a valid URL';
        }
      }

      if (field.type === 'number' && value) {
        const num = Number(value);
        if (isNaN(num)) {
          newErrors[field.id] = 'Please enter a valid number';
        } else {
          if (field.validation?.min !== undefined && num < field.validation.min) {
            newErrors[field.id] = `Value must be at least ${field.validation.min}`;
          }
          if (field.validation?.max !== undefined && num > field.validation.max) {
            newErrors[field.id] = `Value must be at most ${field.validation.max}`;
          }
        }
      }

      // Custom validation
      if (field.validation?.custom) {
        const customError = field.validation.custom(value);
        if (customError) {
          newErrors[field.id] = customError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const isFieldVisible = (field: FormField) => {
    if (!field.conditional) return true;

    const { field: conditionalField, operator, value } = field.conditional;
    const conditionalValue = formData[conditionalField];

    switch (operator) {
      case 'equals':
        return conditionalValue === value;
      case 'not_equals':
        return conditionalValue !== value;
      case 'contains':
        return conditionalValue?.includes?.(value);
      case 'greater_than':
        return Number(conditionalValue) > Number(value);
      case 'less_than':
        return Number(conditionalValue) < Number(value);
      default:
        return true;
    }
  };

  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null;

    const value = formData[field.id] || '';
    const error = errors[field.id];
    const isValidating = validatingFields.has(field.id);
    const validationResult = externalValidationResults[field.id];

    const baseProps = {
      id: field.id,
      name: field.id,
      value: value,
      onChange: (e: any) => updateField(field.id, e.target.value),
      placeholder: field.placeholder,
      isDisabled: disabled || isValidating,
      isInvalid: !!error,
      'aria-describedby': field.description ? `${field.id}-description` : undefined
    };

    return (
      <FormControl key={field.id} isRequired={field.required} isInvalid={!!error}>
        <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
          {field.label}
          {field.required && <Typography as="span" color="red.500" ml="1">*</Typography>}
        </Typography>

        <Box position="relative">
          {field.type === 'text' && (
            <Input {...baseProps} type="text" />
          )}

          {field.type === 'email' && (
            <Input {...baseProps} type="email" />
          )}

          {field.type === 'tel' && (
            <Input {...baseProps} type="tel" />
          )}

          {field.type === 'url' && (
            <Input {...baseProps} type="url" />
          )}

          {field.type === 'number' && (
            <Input {...baseProps} type="number" min={field.validation?.min} max={field.validation?.max} />
          )}

          {field.type === 'date' && (
            <Input {...baseProps} type="date" />
          )}

          {field.type === 'textarea' && (
            <Textarea {...baseProps} rows={4} resize="vertical" />
          )}

          {field.type === 'select' && (
            <Dropdown
              value={value || ""}
              onChange={(val) => updateField(field.id, val)}
              disabled={disabled}
              placeholder="Select an option"
            >
              {field.options?.map(option => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </Dropdown>
          )}

          {field.type === 'radio' && (
            <RadioGroup value={value} onChange={(val) => updateField(field.id, val)}>
              <VStack align="start" gap="2">
                {field.options?.map(option => (
                  <Radio key={option.value} value={option.value} isDisabled={option.disabled}>
                    {option.label}
                  </Radio>
                ))}
              </VStack>
            </RadioGroup>
          )}

          {field.type === 'checkbox' && (
            <Checkbox checked={!!value} onCheckedChange={(details) => updateField(field.id, details.checked === true)} disabled={disabled}>
              {field.label}
            </Checkbox>
          )}

          {field.type === 'switch' && (
            <Switch.Root checked={!!value} onCheckedChange={(details) => updateField(field.id, details.checked)} disabled={disabled}>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          )}

          {/* External validation indicator */}
          {isValidating && (
            <Box position="absolute" right="3" top="50%" transform="translateY(-50%)">
              <Spinner size="sm" color="blue.500" />
            </Box>
          )}

          {validationResult?.status === 'valid' && (
            <Box position="absolute" right="3" top="50%" transform="translateY(-50%)">
              <Icon as={FiCheckCircle} color="green.500" boxSize="4" />
            </Box>
          )}

          {validationResult?.status === 'invalid' && (
            <Box position="absolute" right="3" top="50%" transform="translateY(-50%)">
              <Icon as={FiAlertCircle} color="red.500" boxSize="4" />
            </Box>
          )}
        </Box>

        {/* Field description */}
        {field.description && (
          <FormHelperText id={`${field.id}-description`} fontSize="xs" color="gray.600">
            {field.description}
          </FormHelperText>
        )}

        {/* External validation message */}
        {validationResult?.message && (
          <AlertBar 
            variant={validationResult.status === 'valid' ? 'success' : 'error'} 
            title={validationResult.message}
            size="sm"
            mt="2"
          />
        )}

        {/* Error message */}
        {error && (
          <FormErrorMessage fontSize="xs">
            {error}
          </FormErrorMessage>
        )}
      </FormControl>
    );
  };

  const completedFields = fields.filter(field => {
    const value = formData[field.id];
    return field.required ? value && (typeof value !== 'string' || value.trim()) : true;
  }).length;

  const totalRequiredFields = fields.filter(field => field.required).length;
  const progressPercentage = totalRequiredFields > 0 ? (completedFields / totalRequiredFields) * 100 : 100;

  return (
    <Box>
      {/* Progress indicator */}
      {showProgress && (
        <Box mb="6" p="4" bg="gray.50" borderRadius="lg">
          <VStack gap="2" align="stretch">
            <HStack justify="space-between">
              <Typography fontSize="sm" fontWeight="medium" color="gray.700">
                Form Progress
              </Typography>
              <Typography fontSize="sm" color="gray.600">
                {completedFields} of {totalRequiredFields} required fields completed
              </Typography>
            </HStack>
            <Box width="100%" height="2" bg="gray.200" borderRadius="full" overflow="hidden">
              <Box
                width={`${progressPercentage}%`}
                height="100%"
                bg="orange.500"
                borderRadius="full"
                transition="width 0.3s ease"
              />
            </Box>
            <Typography fontSize="xs" color="gray.500" textAlign="center">
              {Math.round(progressPercentage)}% Complete
            </Typography>
          </VStack>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <VStack gap="6" align="stretch">
          {Object.entries(groupedFields).map(([groupName, groupFields]) => (
            <Box key={groupName}>
              {groupName !== 'default' && (
                <Typography fontSize="lg" fontWeight="semibold" color="gray.800" mb="4">
                  {groupName}
                </Typography>
              )}
              
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                {groupFields.map(renderField)}
              </SimpleGrid>
            </Box>
          ))}

          <Flex justify="flex-end" pt="4">
            <Button
              type="submit"
              colorScheme="orange"
              size="lg"
              isLoading={loading}
              loadingText="Submitting..."
              isDisabled={disabled || Object.keys(errors).length > 0}
            >
              {submitText}
            </Button>
          </Flex>
        </VStack>
      </form>
    </Box>
  );
}
