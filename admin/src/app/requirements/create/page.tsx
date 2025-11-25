"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Textarea,
  Flex,
  Field,
  Spinner,
  Input as ChakraInput
} from "@chakra-ui/react";
import { Typography, Input, Button, IconWrapper, AlertBar } from "@/lib/mukuruImports";
import { FiFileText, FiX } from "react-icons/fi";
import AdminSidebar from "../../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { entityConfigApiService, RequirementType, FieldType, RequirementsMetadata } from "../../../services/entityConfigApi";

export default function CreateRequirementPage() {
  const router = useRouter();
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
    helpText: ''
  });
  const [metadata, setMetadata] = useState<RequirementsMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      const data = await entityConfigApiService.getRequirementsMetadata();
      setMetadata(data);
    } catch (err) {
      console.error('Error loading metadata:', err);
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
      setError('Code must be uppercase letters, numbers, and underscores only, starting with a letter');
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

      router.push("/requirements");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create requirement';
      setError(errorMessage);
      console.error('Error creating requirement:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/requirements");
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

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <Box flex="1" ml="280px">
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py="8">
          <Container maxW="8xl">
            <VStack align="start" gap="2">
              <Typography as="h1" fontSize="3xl" fontWeight="bold" color="gray.800">
                Create Requirement
              </Typography>
              <Typography color="gray.600" fontSize="lg">
                Define a requirement field that can be assigned to entity types.
              </Typography>
            </VStack>
          </Container>
        </Box>

        {/* Error Alert */}
        {error && (
          <Container maxW="8xl" py="4">
            <AlertBar
              status="error"
              title="Error!"
              description={error}
            />
          </Container>
        )}

        {/* Form Content */}
        <Container maxW="4xl" py="8">
          <Box bg="white" borderRadius="xl" border="1px" borderColor="gray.200" p="8" boxShadow="sm">
            <VStack align="stretch" gap="6">
              {/* Code */}
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Code *
                </Field.Label>
                <ChakraInput
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., REGISTRATION_NUMBER, TAX_ID"
                  bg="gray.50"
                  borderColor="gray.300"
                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                  required
                />
                <Typography fontSize="xs" color="gray.500">
                  Uppercase letters, numbers, and underscores only (used in code)
                </Typography>
              </Field.Root>

              {/* Display Name */}
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Display Name *
                </Field.Label>
                <ChakraInput
                  value={formData.displayName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g., Registration Number, Tax ID"
                  bg="gray.50"
                  borderColor="gray.300"
                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                  required
                />
                <Typography fontSize="xs" color="gray.500">
                  User-facing name (shown in forms)
                </Typography>
              </Field.Root>

              {/* Description */}
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Description *
                </Field.Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Explain what this requirement is for..."
                  bg="gray.50"
                  borderColor="gray.300"
                  resize="vertical"
                  minH="100px"
                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                  required
                />
              </Field.Root>

              {/* Requirement Type */}
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Requirement Type *
                </Field.Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: parseInt(e.target.value) as RequirementType }))}
                  style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    width: '100%',
                    color: '#374151'
                  }}
                  required
                >
                  {metadata?.requirementTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <Typography fontSize="xs" color="gray.500">
                  Category of this requirement
                </Typography>
              </Field.Root>

              {/* Field Type */}
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Field Type *
                </Field.Label>
                <select
                  value={formData.fieldType}
                  onChange={(e) => setFormData(prev => ({ ...prev, fieldType: e.target.value as FieldType }))}
                  style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    width: '100%',
                    color: '#374151'
                  }}
                  required
                >
                  {metadata?.fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <Typography fontSize="xs" color="gray.500">
                  How this field should be displayed in forms
                </Typography>
              </Field.Root>

              {/* Validation Rules */}
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Validation Rules (JSON, optional)
                </Field.Label>
                <Textarea
                  value={formData.validationRules}
                  onChange={(e) => setFormData(prev => ({ ...prev, validationRules: e.target.value }))}
                  placeholder='e.g., {"required": true, "minLength": 5, "maxLength": 100}'
                  bg="gray.50"
                  borderColor="gray.300"
                  resize="vertical"
                  minH="80px"
                  fontFamily="mono"
                  fontSize="sm"
                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                />
                <Typography fontSize="xs" color="gray.500">
                  JSON format validation rules (optional)
                </Typography>
              </Field.Root>

              {/* Help Text */}
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Help Text (optional)
                </Field.Label>
                <Textarea
                  value={formData.helpText}
                  onChange={(e) => setFormData(prev => ({ ...prev, helpText: e.target.value }))}
                  placeholder="Additional guidance for users filling this field"
                  bg="gray.50"
                  borderColor="gray.300"
                  resize="vertical"
                  minH="80px"
                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF6B35" }}
                />
                <Typography fontSize="xs" color="gray.500">
                  Optional help text shown to users
                </Typography>
              </Field.Root>

              {/* Action Buttons */}
              <Flex gap="4" justify="start" pt="6">
                <Button
                  onClick={handleCreate}
                  variant="primary"
                  size="md"
                  disabled={loading || !metadata || saving}
                >
                  <IconWrapper><FiFileText size={16} /></IconWrapper>
                  {saving ? "Creating..." : "Create"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  size="md"
                  disabled={saving || loading}
                >
                  <IconWrapper><FiX size={16} /></IconWrapper>
                  Cancel
                </Button>
              </Flex>
            </VStack>
          </Box>
        </Container>
      </Box>
    </Flex>
  );
}
