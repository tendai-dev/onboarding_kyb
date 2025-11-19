"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Button,
  Flex,
  Icon,
  Field,
  Spinner
} from "@chakra-ui/react";
import { FiFileText, FiX } from "react-icons/fi";
import AdminSidebar from "../../../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { entityConfigApiService, Requirement, FieldType } from "../../../../services/entityConfigApi";
import { SweetAlert } from "../../../../utils/sweetAlert";

// Field type options
const fieldTypes = [
  { value: 'Text', label: 'Text' },
  { value: 'Email', label: 'Email' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Number', label: 'Number' },
  { value: 'Date', label: 'Date' },
  { value: 'Select', label: 'Select' },
  { value: 'MultiSelect', label: 'MultiSelect' },
  { value: 'Radio', label: 'Radio' },
  { value: 'Checkbox', label: 'Checkbox' },
  { value: 'Textarea', label: 'Textarea' },
  { value: 'File', label: 'File' },
  { value: 'Country', label: 'Country' },
  { value: 'Currency', label: 'Currency' },
  { value: 'Address', label: 'Address' }
];

export default function EditRequirementPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    fieldType: 'Text' as FieldType,
    isActive: true,
    validationRules: '',
    helpText: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequirement();
  }, [id]);

  const loadRequirement = async () => {
    try {
      setLoading(true);
      setError(null);
      const requirement = await entityConfigApiService.getRequirement(id);
      setFormData({
        displayName: requirement.displayName,
        description: requirement.description || '',
        fieldType: requirement.fieldType as FieldType,
        isActive: requirement.isActive,
        validationRules: requirement.validationRules || '',
        helpText: requirement.helpText || ''
      });
    } catch (err) {
      setError('Failed to load requirement');
      console.error('Error loading requirement:', err);
      SweetAlert.error('Error', 'Failed to load requirement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.displayName.trim()) {
      SweetAlert.error('Validation Error', 'Display name is required.');
      return;
    }

    try {
      setSaving(true);
      await entityConfigApiService.updateRequirement(id, {
        displayName: formData.displayName,
        description: formData.description,
        validationRules: formData.validationRules,
        helpText: formData.helpText,
        isActive: formData.isActive
      });
      SweetAlert.success('Updated!', 'Requirement has been updated successfully.');
      router.push("/requirements");
    } catch (err) {
      console.error('Error updating requirement:', err);
      SweetAlert.error('Update Failed', 'Failed to update requirement. Please try again.');
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
            <Text color="black" fontWeight="500">Loading requirement...</Text>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="280px" p="8">
          <Box 
            bg="red.50" 
            border="1px" 
            borderColor="red.200" 
            borderRadius="lg" 
            p="6"
            boxShadow="sm"
          >
            <Text color="black" fontWeight="600" mb="4">{error}</Text>
            <Button 
              mt="4" 
              onClick={() => router.push("/requirements")}
              colorScheme="orange"
              borderRadius="lg"
              fontWeight="500"
              transition="all 0.2s ease"
              _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
            >
              Go Back
            </Button>
          </Box>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <Box flex="1" ml="280px" bg="gray.50">
        {/* Header */}
        <Box 
          bg="white" 
          borderBottom="1px solid" 
          borderColor="gray.200" 
          py="6"
          px="0"
          position="sticky"
          top="0"
          zIndex="10"
          boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        >
          <Container maxW="4xl" px="6">
            <VStack align="start" gap="1">
              <Text 
                as="h1" 
                fontSize="2xl" 
                fontWeight="700" 
                color="black"
                letterSpacing="-0.01em"
              >
                Edit Requirement
              </Text>
              <Text 
                color="black" 
                fontSize="sm"
                opacity={0.65}
                fontWeight="400"
              >
                Define a requirement field that can be assigned to entity types.
              </Text>
            </VStack>
          </Container>
        </Box>

        {/* Form Content */}
        <Container maxW="4xl" py="6" px="6">
          <Box 
            bg="white" 
            borderRadius="lg" 
            border="1px solid" 
            borderColor="gray.200" 
            p="6" 
            boxShadow="sm"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              bg: "linear-gradient(90deg, #FF6B35 0%, #FF8C42 100%)"
            }}
          >
            <VStack align="stretch" gap="6">
              {/* Basic Information Section */}
              <Box>
                <Text 
                  fontSize="sm" 
                  fontWeight="700" 
                  color="black" 
                  mb="4"
                  pb="2"
                  borderBottom="1px solid"
                  borderColor="gray.200"
                >
                  Basic Information
                </Text>
                <VStack align="stretch" gap="4" mt="3">
                  {/* Display Name */}
                  <Field.Root>
                    <Field.Label 
                      fontSize="xs" 
                      fontWeight="600" 
                      color="black"
                      mb="1.5"
                      textTransform="uppercase"
                    >
                      Display Name
                    </Field.Label>
                    <Input
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Registration Certificate / Incorporation Document"
                      bg="white"
                      borderColor="gray.300"
                      borderWidth="1px"
                      borderRadius="md"
                      py="3"
                      px="3"
                      fontSize="sm"
                      color="black"
                      _placeholder={{ color: "gray.400" }}
                      _hover={{ borderColor: "gray.400" }}
                      _focus={{ 
                        borderColor: "orange.500", 
                        boxShadow: "0 0 0 3px rgba(255, 107, 53, 0.1)",
                        outline: "none"
                      }}
                      transition="all 0.2s ease"
                    />
                    <Text fontSize="xs" color="black" opacity={0.6} mt="1.5" fontWeight="400">
                      User-facing name (shown in forms)
                    </Text>
                  </Field.Root>

                  {/* Description */}
                  <Field.Root>
                    <Field.Label 
                      fontSize="xs" 
                      fontWeight="600" 
                      color="black"
                      mb="1.5"
                      textTransform="uppercase"
                    >
                      Description
                    </Field.Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Registration certificate or incorporation document"
                      bg="white"
                      borderColor="gray.300"
                      borderWidth="1px"
                      borderRadius="md"
                      resize="vertical"
                      minH="80px"
                      py="3"
                      px="3"
                      fontSize="sm"
                      color="black"
                      _placeholder={{ color: "gray.400" }}
                      _hover={{ borderColor: "gray.400" }}
                      _focus={{ 
                        borderColor: "orange.500", 
                        boxShadow: "0 0 0 3px rgba(255, 107, 53, 0.1)",
                        outline: "none"
                      }}
                      transition="all 0.2s ease"
                    />
                  </Field.Root>
                </VStack>
              </Box>

              {/* Field Configuration Section */}
              <Box>
                <Text 
                  fontSize="sm" 
                  fontWeight="700" 
                  color="black" 
                  mb="4"
                  pb="2"
                  borderBottom="1px solid"
                  borderColor="gray.200"
                >
                  Field Configuration
                </Text>
                <VStack align="stretch" gap="4" mt="3">
                  {/* Field Type - Read Only */}
                  <Field.Root>
                    <Field.Label 
                      fontSize="xs" 
                      fontWeight="600" 
                      color="black"
                      mb="1.5"
                      textTransform="uppercase"
                    >
                      Field Type
                    </Field.Label>
                    <Input
                      value={formData.fieldType}
                      disabled
                      bg="gray.50"
                      borderColor="gray.200"
                      borderWidth="1px"
                      borderRadius="md"
                      py="3"
                      px="3"
                      fontSize="sm"
                      color="black"
                      opacity={0.7}
                      cursor="not-allowed"
                    />
                    <Text fontSize="xs" color="black" opacity={0.6} mt="1.5" fontWeight="400">
                      Field type cannot be changed after creation
                    </Text>
                  </Field.Root>

                  {/* Validation Rules */}
                  <Field.Root>
                    <Field.Label 
                      fontSize="xs" 
                      fontWeight="600" 
                      color="black"
                      mb="1.5"
                      textTransform="uppercase"
                    >
                      Validation Rules (JSON)
                    </Field.Label>
                    <Textarea
                      value={formData.validationRules}
                      onChange={(e) => setFormData(prev => ({ ...prev, validationRules: e.target.value }))}
                      placeholder='{"required": true, "acceptedTypes":[".pdf",".jpg",".png"]}'
                      bg="white"
                      borderColor="gray.300"
                      borderWidth="1px"
                      borderRadius="md"
                      resize="vertical"
                      minH="80px"
                      py="3"
                      px="3"
                      fontFamily="mono"
                      fontSize="sm"
                      color="black"
                      _placeholder={{ color: "gray.400" }}
                      _hover={{ borderColor: "gray.400" }}
                      _focus={{ 
                        borderColor: "orange.500", 
                        boxShadow: "0 0 0 3px rgba(255, 107, 53, 0.1)",
                        outline: "none"
                      }}
                      transition="all 0.2s ease"
                    />
                    <Text fontSize="xs" color="black" opacity={0.6} mt="1.5" fontWeight="400">
                      JSON format validation rules
                    </Text>
                  </Field.Root>

                  {/* Help Text */}
                  <Field.Root>
                    <Field.Label 
                      fontSize="xs" 
                      fontWeight="600" 
                      color="black"
                      mb="1.5"
                      textTransform="uppercase"
                    >
                      Help Text
                    </Field.Label>
                    <Textarea
                      value={formData.helpText}
                      onChange={(e) => setFormData(prev => ({ ...prev, helpText: e.target.value }))}
                      placeholder="Additional guidance for users filling this field"
                      bg="white"
                      borderColor="gray.300"
                      borderWidth="1px"
                      borderRadius="md"
                      resize="vertical"
                      minH="80px"
                      py="3"
                      px="3"
                      fontSize="sm"
                      color="black"
                      _placeholder={{ color: "gray.400" }}
                      _hover={{ borderColor: "gray.400" }}
                      _focus={{ 
                        borderColor: "orange.500", 
                        boxShadow: "0 0 0 3px rgba(255, 107, 53, 0.1)",
                        outline: "none"
                      }}
                      transition="all 0.2s ease"
                    />
                    <Text fontSize="xs" color="black" opacity={0.6} mt="1.5" fontWeight="400">
                      Optional help text shown to users
                    </Text>
                  </Field.Root>
                </VStack>
              </Box>

              {/* Status Section */}
              <Box>
                <Text 
                  fontSize="sm" 
                  fontWeight="700" 
                  color="black" 
                  mb="4"
                  pb="2"
                  borderBottom="1px solid"
                  borderColor="gray.200"
                >
                  Status
                </Text>
                <HStack justify="space-between" align="center" mt="3">
                  <VStack align="start" gap="0.5">
                    <Text fontSize="xs" fontWeight="600" color="black" textTransform="uppercase">
                      Active Status
                    </Text>
                    <Text fontSize="xs" color="black" opacity={0.6} fontWeight="400">
                      Make this requirement available for use
                    </Text>
                  </VStack>
                  <Button
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    colorScheme={formData.isActive ? "orange" : "gray"}
                    variant={formData.isActive ? "solid" : "outline"}
                    size="md"
                    px="6"
                    py="2"
                    borderRadius="md"
                    fontWeight="500"
                    transition="all 0.2s ease"
                    _hover={{ transform: "translateY(-1px)", boxShadow: "sm" }}
                  >
                    {formData.isActive ? "Active" : "Inactive"}
                  </Button>
                </HStack>
              </Box>

              {/* Action Buttons */}
              <Flex gap="3" justify="flex-end" pt="4" borderTop="1px solid" borderColor="gray.200" mt="4">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  colorScheme="gray"
                  size="md"
                  px="6"
                  py="2"
                  borderRadius="md"
                  fontWeight="500"
                  disabled={saving || loading}
                  borderColor="gray.300"
                  color="black"
                  _hover={{ 
                    bg: "gray.50",
                    borderColor: "gray.400"
                  }}
                  transition="all 0.2s ease"
                >
                  <Icon as={FiX} mr="2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  colorScheme="orange"
                  bg="#FF6B35"
                  color="white"
                  _hover={{ 
                    bg: "#E55A2B",
                    boxShadow: "md"
                  }}
                  _active={{ bg: "#CC4A1F" }}
                  size="md"
                  px="6"
                  py="2"
                  borderRadius="md"
                  fontWeight="600"
                  loading={saving}
                  loadingText="Updating..."
                  disabled={loading}
                  transition="all 0.2s ease"
                >
                  <Icon as={FiFileText} mr="2" />
                  Update
                </Button>
              </Flex>
            </VStack>
          </Box>
        </Container>
      </Box>
    </Flex>
  );
}
