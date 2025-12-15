'use client';

import { Box, VStack, Flex, Spinner, HStack } from '@chakra-ui/react';
import {
  Typography,
  Button,
  AlertBar,
  Tag,
  ArrowLeftIcon,
} from '@mukuru/mukuru-react-components';
import AdminSidebar from '../../../components/AdminSidebar';
import PortalHeader from '../../../components/PortalHeader';
import { useSidebar } from '../../../contexts/SidebarContext';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  entityConfigApiService,
  RequirementType,
  FieldType,
  RequirementsMetadata,
} from '../../../services/entityConfigApi';

export default function CreateRequirementPage() {
  const router = useRouter();
  const { condensed } = useSidebar();

  const [formData, setFormData] = useState<{
    code: string;
    displayName: string;
    description: string;
    type: RequirementType;
    fieldType: FieldType;
    validationRules: string;
    helpText: string;
  }>({
    code: '',
    displayName: '',
    description: '',
    type: RequirementType.Information,
    fieldType: FieldType.Text,
    validationRules: '',
    helpText: '',
  });

  // User-friendly validation state
  const [validationState, setValidationState] = useState({
    required: false,
    minLength: '',
    maxLength: '',
    minValue: '',
    maxValue: '',
  });

  // Convert validation state to JSON string
  useEffect(() => {
    const rules: Record<string, unknown> = {};
    if (validationState.required) {
      rules.required = true;
    }
    if (validationState.minLength) {
      const min = parseInt(validationState.minLength);
      if (!isNaN(min) && min > 0) {
        rules.minLength = min;
      }
    }
    if (validationState.maxLength) {
      const max = parseInt(validationState.maxLength);
      if (!isNaN(max) && max > 0) {
        rules.maxLength = max;
      }
    }
    if (validationState.minValue) {
      const min = parseFloat(validationState.minValue);
      if (!isNaN(min)) {
        rules.min = min;
      }
    }
    if (validationState.maxValue) {
      const max = parseFloat(validationState.maxValue);
      if (!isNaN(max)) {
        rules.max = max;
      }
    }

    const jsonString = Object.keys(rules).length > 0 ? JSON.stringify(rules) : '';
    setFormData((prev) => ({ ...prev, validationRules: jsonString }));
  }, [validationState]);

  // Initialize with fallback metadata so dropdowns always have data (memoized)
  const fallbackMetadata: RequirementsMetadata = useMemo(
    () => ({
      requirementTypes: [
        { value: RequirementType.Information, label: 'Information' },
        { value: RequirementType.Document, label: 'Document' },
        { value: RequirementType.ProofOfIdentity, label: 'Proof of Identity' },
        { value: RequirementType.ProofOfAddress, label: 'Proof of Address' },
        { value: RequirementType.OwnershipStructure, label: 'Ownership Structure' },
        { value: RequirementType.BoardDirectors, label: 'Board of Directors' },
        {
          value: RequirementType.AuthorizedSignatories,
          label: 'Authorized Signatories',
        },
      ],
      fieldTypes: [
        { value: FieldType.Text, label: 'Text' },
        { value: FieldType.Email, label: 'Email' },
        { value: FieldType.Phone, label: 'Phone' },
        { value: FieldType.Number, label: 'Number' },
        { value: FieldType.Date, label: 'Date' },
        { value: FieldType.Select, label: 'Select' },
        { value: FieldType.MultiSelect, label: 'Multi-Select' },
        { value: FieldType.Radio, label: 'Radio' },
        { value: FieldType.Checkbox, label: 'Checkbox' },
        { value: FieldType.Textarea, label: 'Textarea' },
        { value: FieldType.File, label: 'File' },
        { value: FieldType.Country, label: 'Country' },
        { value: FieldType.Currency, label: 'Currency' },
        { value: FieldType.Address, label: 'Address' },
      ],
    }),
    []
  );

  const [metadata, setMetadata] = useState<RequirementsMetadata>(fallbackMetadata);
  const [loading, setLoading] = useState(false); // Start with false since we have fallback
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      setMetadataError(null);
      const data = await entityConfigApiService.getRequirementsMetadata();

      // Handle different response structures
      let parsedMetadata: RequirementsMetadata;

      if (Array.isArray(data)) {
        // If API returns an array (wrong endpoint?), use fallback
        parsedMetadata = fallbackMetadata;
      } else if (data && typeof data === 'object') {
        // Try to extract requirementTypes and fieldTypes from various possible structures
        // Handle both camelCase (requirementTypes) and snake_case (requirement_types)
        const reqTypes =
          (data as any).requirementTypes ||
          (data as any).requirement_types ||
          (data as any).RequirementTypes ||
          [];
        const fieldTypes =
          (data as any).fieldTypes ||
          (data as any).field_types ||
          (data as any).FieldTypes ||
          [];

        if (
          Array.isArray(reqTypes) &&
          Array.isArray(fieldTypes) &&
          reqTypes.length > 0 &&
          fieldTypes.length > 0
        ) {
          // Map the backend format to our frontend format
          parsedMetadata = {
            requirementTypes: reqTypes.map((item: any) => ({
              value:
                typeof item.value === 'number'
                  ? item.value
                  : typeof item.Value === 'number'
                    ? item.Value
                    : parseInt(item.value || item.Value || '0') || 0,
              label: item.label || item.Label || String(item.value || item.Value || ''),
            })),
            fieldTypes: fieldTypes.map((item: any) => ({
              value: item.value || item.Value || '',
              label: item.label || item.Label || String(item.value || item.Value || ''),
            })),
          };
        } else {
          throw new Error('Metadata missing required fields or invalid structure');
        }
      } else {
        throw new Error('Invalid metadata structure received');
      }

      // Validate and set metadata
      if (
        parsedMetadata.requirementTypes.length > 0 &&
        parsedMetadata.fieldTypes.length > 0
      ) {
        setMetadata(parsedMetadata);
      } else {
        throw new Error('Metadata missing required fields');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load form options';

      // Only show error if it's not a connection/timeout error (expected when backend is down)
      const isConnectionError =
        errorMessage.includes('Unable to connect') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Failed to fetch');

      if (!isConnectionError) {
        setMetadataError(errorMessage);
      }

      // Always use fallback metadata if API fails (already set as initial state)
      // No need to set it again, just ensure it's there
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.displayName || !formData.description) {
      setError('Please fill in all required fields (Code, Display Name, Description)');
      return;
    }

    // Validate code format (uppercase with underscores)
    if (!/^[A-Z][A-Z0-9_]*$/.test(formData.code)) {
      setError(
        'Code must be uppercase letters, numbers, and underscores only, starting with a letter'
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await entityConfigApiService.createRequirement({
        code: formData.code,
        displayName: formData.displayName,
        description: formData.description,
        type: formData.type,
        fieldType: formData.fieldType,
        validationRules: formData.validationRules || undefined,
        helpText: formData.helpText || undefined,
      });

      router.push('/requirements');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create requirement';
      setError(errorMessage);
      console.error('Error creating requirement:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/requirements');
  };

  return (
    <Flex minH="100vh" bg="#F3F4F6">
      <AdminSidebar />
      <PortalHeader />

      <Box
        flex="1"
        ml={condensed ? '72px' : '280px'}
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        transition="margin-left 0.3s ease, width 0.3s ease"
        p="32px"
        bg="#F3F4F6"
      >
        {/* Back Link */}
        <HStack
          gap="6px"
          mb="16px"
          cursor="pointer"
          onClick={() => router.push('/requirements')}
          w="fit-content"
          _hover={{ opacity: 0.7 }}
        >
          <ArrowLeftIcon color="mukuru.grey.medium" />
          <Typography fontSize="14px" color="mukuru.grey.medium">
            Back
          </Typography>
        </HStack>

        {/* Page Title */}
        <Typography
          as="h1"
          fontSize="28px"
          fontWeight="700"
          color="mukuru.text.primary"
          mb="4px"
        >
          Create Requirement
        </Typography>
        <Typography fontSize="14px" color="mukuru.grey.medium" mb="32px">
          Define a new requirement field that can be assigned to entity types.
        </Typography>

        {/* Error Alerts */}
        {(error || metadataError) && (
          <Box mb="24px">
            <VStack align="stretch" gap="12px">
              {error && <AlertBar status="error" title="Error" description={error} />}
              {metadataError && (
                <AlertBar
                  status="warning"
                  title="Warning"
                  description={`${metadataError}. Using default options.`}
                />
              )}
            </VStack>
          </Box>
        )}

        {/* General Information Card */}
        <Box
          bg="white"
          borderRadius="12px"
          border="1px solid #E5E7EB"
          p="28px"
          mb="24px"
          boxShadow="0 2px 8px rgba(0,0,0,0.06)"
        >
          <Typography
            fontSize="16px"
            fontWeight="600"
            color="mukuru.text.primary"
            mb="20px"
          >
            General Information
          </Typography>

          {/* Two column layout for Code and Display Name */}
          <Flex gap="24px" mb="24px">
            {/* Code Field */}
            <Box flex="1">
              <Typography
                fontSize="13px"
                fontWeight="500"
                color="mukuru.text.primary"
                mb="8px"
              >
                Code <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <input
                value={formData.code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="e.g., REGISTRATION_NUMBER"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #D0D5DD',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#1D2939',
                  outline: 'none',
                  height: '46px',
                }}
              />
              <Typography fontSize="12px" color="mukuru.grey.medium" mt="8px">
                Uppercase letters, numbers, and underscores only
              </Typography>
            </Box>

            {/* Display Name Field */}
            <Box flex="1">
              <Typography
                fontSize="13px"
                fontWeight="500"
                color="mukuru.text.primary"
                mb="8px"
              >
                Display Name <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <input
                value={formData.displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="e.g., Registration Number"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #D0D5DD',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#1D2939',
                  outline: 'none',
                  height: '46px',
                }}
              />
              <Typography fontSize="12px" color="mukuru.grey.medium" mt="8px">
                User-facing name shown in forms
              </Typography>
            </Box>
          </Flex>

          {/* Description Field */}
          <Box>
            <Typography
              fontSize="13px"
              fontWeight="500"
              color="mukuru.text.primary"
              mb="8px"
            >
              Description <span style={{ color: '#EF4444' }}>*</span>
            </Typography>
            <textarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Explain what this requirement is for..."
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '1px solid #D0D5DD',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#1D2939',
                minHeight: '120px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </Box>
        </Box>

        {/* Configuration Card */}
        <Box
          bg="white"
          borderRadius="12px"
          border="1px solid #E5E7EB"
          p="28px"
          mb="24px"
          boxShadow="0 2px 8px rgba(0,0,0,0.06)"
        >
          <Typography
            fontSize="16px"
            fontWeight="600"
            color="mukuru.text.primary"
            mb="20px"
          >
            Configuration
          </Typography>

          <Flex gap="24px">
            {/* Requirement Type */}
            <Box flex="1">
              <Typography
                fontSize="13px"
                fontWeight="500"
                color="mukuru.text.primary"
                mb="8px"
              >
                Requirement Type <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <select
                value={formData.type.toString()}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFormData((prev) => ({
                    ...prev,
                    type: parseInt(e.target.value) as RequirementType,
                  }));
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #D0D5DD',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#1D2939',
                  outline: 'none',
                  cursor: 'pointer',
                  height: '46px',
                }}
              >
                {metadata.requirementTypes.map((type) => (
                  <option key={type.value} value={type.value.toString()}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Box>

            {/* Field Type */}
            <Box flex="1">
              <Typography
                fontSize="13px"
                fontWeight="500"
                color="mukuru.text.primary"
                mb="8px"
              >
                Field Type <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <select
                value={formData.fieldType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFormData((prev) => ({
                    ...prev,
                    fieldType: e.target.value as FieldType,
                  }));
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #D0D5DD',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#1D2939',
                  outline: 'none',
                  cursor: 'pointer',
                  height: '46px',
                }}
              >
                {metadata.fieldTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Box>
          </Flex>
        </Box>

        {/* Advanced Options Card */}
        <Box
          bg="white"
          borderRadius="12px"
          border="1px solid #E5E7EB"
          p="28px"
          mb="24px"
          boxShadow="0 2px 8px rgba(0,0,0,0.06)"
        >
          <Typography
            fontSize="16px"
            fontWeight="600"
            color="mukuru.text.primary"
            mb="20px"
          >
            Advanced Options
          </Typography>

          <VStack align="stretch" gap="20px">
            {/* Required Checkbox */}
            <HStack
              gap="12px"
              cursor="pointer"
              onClick={() =>
                setValidationState((prev) => ({ ...prev, required: !prev.required }))
              }
            >
              <Box
                w="20px"
                h="20px"
                borderRadius="4px"
                border="2px solid"
                borderColor={validationState.required ? '#F05423' : '#D0D5DD'}
                bg={validationState.required ? '#F05423' : 'white'}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                {validationState.required && (
                  <Box as="span" color="white" fontSize="12px" fontWeight="bold">
                    ✓
                  </Box>
                )}
              </Box>
              <Typography fontSize="14px" color="mukuru.text.primary">
                This field is required
              </Typography>
            </HStack>

            {/* Text Length Validation */}
            {(formData.fieldType === FieldType.Text ||
              formData.fieldType === FieldType.Textarea ||
              formData.fieldType === FieldType.Email ||
              formData.fieldType === FieldType.Phone) && (
              <Flex gap="24px">
                <Box flex="1">
                  <Typography
                    fontSize="13px"
                    fontWeight="500"
                    color="mukuru.text.primary"
                    mb="8px"
                  >
                    Minimum Characters
                  </Typography>
                  <input
                    type="number"
                    min={0}
                    value={validationState.minLength}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValidationState((prev) => ({
                        ...prev,
                        minLength: e.target.value,
                      }))
                    }
                    placeholder="e.g., 5"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #D0D5DD',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#1D2939',
                      outline: 'none',
                      height: '46px',
                    }}
                  />
                </Box>
                <Box flex="1">
                  <Typography
                    fontSize="13px"
                    fontWeight="500"
                    color="mukuru.text.primary"
                    mb="8px"
                  >
                    Maximum Characters
                  </Typography>
                  <input
                    type="number"
                    min={0}
                    value={validationState.maxLength}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValidationState((prev) => ({
                        ...prev,
                        maxLength: e.target.value,
                      }))
                    }
                    placeholder="e.g., 100"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #D0D5DD',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#1D2939',
                      outline: 'none',
                      height: '46px',
                    }}
                  />
                </Box>
              </Flex>
            )}

            {/* Number Range Validation */}
            {formData.fieldType === FieldType.Number && (
              <Flex gap="24px">
                <Box flex="1">
                  <Typography
                    fontSize="13px"
                    fontWeight="500"
                    color="mukuru.text.primary"
                    mb="8px"
                  >
                    Minimum Value
                  </Typography>
                  <input
                    type="number"
                    value={validationState.minValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValidationState((prev) => ({
                        ...prev,
                        minValue: e.target.value,
                      }))
                    }
                    placeholder="e.g., 0"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #D0D5DD',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#1D2939',
                      outline: 'none',
                      height: '46px',
                    }}
                  />
                </Box>
                <Box flex="1">
                  <Typography
                    fontSize="13px"
                    fontWeight="500"
                    color="mukuru.text.primary"
                    mb="8px"
                  >
                    Maximum Value
                  </Typography>
                  <input
                    type="number"
                    value={validationState.maxValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValidationState((prev) => ({
                        ...prev,
                        maxValue: e.target.value,
                      }))
                    }
                    placeholder="e.g., 1000"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #D0D5DD',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#1D2939',
                      outline: 'none',
                      height: '46px',
                    }}
                  />
                </Box>
              </Flex>
            )}

            {/* Help Text */}
            <Box>
              <Typography
                fontSize="13px"
                fontWeight="500"
                color="mukuru.text.primary"
                mb="8px"
              >
                Help Text (optional)
              </Typography>
              <textarea
                value={formData.helpText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    helpText: e.target.value,
                  }))
                }
                placeholder="Additional guidance for users filling this field"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #D0D5DD',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#1D2939',
                  minHeight: '80px',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <Typography fontSize="12px" color="mukuru.grey.medium" mt="8px">
                Optional help text shown to users
              </Typography>
            </Box>
          </VStack>
        </Box>

        {/* Action Buttons */}
        <HStack justify="flex-end" gap="12px" mt="24px">
          <Button onClick={handleCancel} variant="secondary" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            variant="primary"
            disabled={
              loading ||
              saving ||
              !formData.code ||
              !formData.displayName ||
              !formData.description
            }
            loading={saving}
          >
            {saving ? 'Creating...' : 'Create Requirement'}
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
}
