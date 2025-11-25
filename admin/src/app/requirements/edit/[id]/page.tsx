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
import { FiFileText, FiX, FiArrowLeft } from "react-icons/fi";
import PortalHeader from "../../../../components/PortalHeader";
import { useSidebar } from "../../../../contexts/SidebarContext";
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
  const { condensed } = useSidebar();
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
        <PortalHeader />
        <Box 
          flex="1" 
          ml={condensed ? "72px" : "280px"} 
          mt="90px"
          minH="calc(100vh - 90px)"
          width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
          display="flex" 
          alignItems="center" 
          justifyContent="center"
        >
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Typography color="black" fontWeight="500">Loading requirement...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <PortalHeader />
        <Box 
          flex="1" 
          ml={condensed ? "72px" : "280px"} 
          mt="90px"
          minH="calc(100vh - 90px)"
          width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
          p="8"
          >
          <Container maxW="8xl">
            <AlertBar
              status="error"
              title="Error!"
              description={error}
            />
            <Button 
              mt="4" 
              onClick={() => router.push("/requirements")}
              variant="primary"
              className="mukuru-primary-button"
            >
              Go Back
            </Button>
          </Container>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Left Sidebar */}
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content */}
      <Box 
        flex="1" 
        ml={condensed ? "72px" : "280px"} 
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"}
        bg="gray.50"
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        {/* Header */}
        <Box 
          bg="white" 
          borderBottom="1px solid" 
          borderColor="gray.200" 
          py="4"
          position="sticky"
          top="90px"
          zIndex="10"
          boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        >
          <Container maxW="8xl" px="10">
            <VStack align="start" gap="3" w="100%">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/requirements")}
                className="mukuru-secondary-button"
                style={{
                  padding: '6px 12px',
                  minWidth: '80px',
                  height: '32px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                <IconWrapper><FiArrowLeft size={14} /></IconWrapper>
                Back
              </Button>
              <VStack align="start" gap="1" w="100%">
              <Typography 
                as="h1" 
                  fontSize="24px" 
                  fontWeight="600" 
                  color="#111827"
                  lineHeight="1.3"
                letterSpacing="-0.01em"
              >
                Edit Requirement
              </Typography>
              <Typography 
                  color="#6B7280" 
                  fontSize="14px"
                fontWeight="400"
                  lineHeight="1.4"
              >
                Define a requirement field that can be assigned to entity types.
              </Typography>
              </VStack>
            </VStack>
          </Container>
        </Box>

        {/* Error Alert */}
        {error && (
          <Container maxW="8xl" py="3" px="10">
            <AlertBar
              status="error"
              title="Error!"
              description={error}
            />
          </Container>
        )}

        {/* Form Content */}
        <Container maxW="8xl" py="6" px="10" w="100%">
          <Box 
            bg="white" 
            borderRadius="xl" 
            border="1px solid" 
            borderColor="gray.200" 
            p="6" 
            boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
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
                <Box pb="3" borderBottom="1px solid" borderColor="gray.100">
                <Typography 
                    fontSize="16px" 
                    fontWeight="600" 
                    color="#111827" 
                    letterSpacing="-0.01em"
                >
                  Basic Information
                </Typography>
                </Box>
                <VStack align="stretch" gap="4" mt="3">
                  {/* Display Name */}
                  <VStack align="start" gap="2">
                    <Typography 
                      fontSize="12px" 
                      fontWeight="600" 
                      color="#374151"
                      textTransform="uppercase"
                      letterSpacing="0.05em"
                    >
                      Display Name
                    </Typography>
                    <ChakraInput
                      value={formData.displayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
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
                    <Typography fontSize="12px" color="#6B7280" fontWeight="400">
                      User-facing name (shown in forms)
                    </Typography>
                  </VStack>

                  {/* Description */}
                  <VStack align="start" gap="2">
                    <Typography 
                      fontSize="12px" 
                      fontWeight="600" 
                      color="#374151"
                      textTransform="uppercase"
                      letterSpacing="0.05em"
                    >
                      Description
                    </Typography>
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
                  </VStack>
                </VStack>
              </Box>

              {/* Field Configuration Section */}
              <Box>
                <Box pb="3" borderBottom="1px solid" borderColor="gray.100">
                <Typography 
                    fontSize="16px" 
                    fontWeight="600" 
                    color="#111827" 
                    letterSpacing="-0.01em"
                >
                  Field Configuration
                </Typography>
                </Box>
                <VStack align="stretch" gap="4" mt="3">
                  {/* Field Type - Read Only */}
                  <VStack align="start" gap="2">
                    <Typography 
                      fontSize="12px" 
                      fontWeight="600" 
                      color="#374151"
                      textTransform="uppercase"
                      letterSpacing="0.05em"
                    >
                      Field Type
                    </Typography>
                    <ChakraInput
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
                    <Typography fontSize="12px" color="#6B7280" fontWeight="400">
                      Field type cannot be changed after creation
                    </Typography>
                  </VStack>

                  {/* Validation Rules */}
                  <VStack align="start" gap="2">
                    <Typography 
                      fontSize="12px" 
                      fontWeight="600" 
                      color="#374151"
                      textTransform="uppercase"
                      letterSpacing="0.05em"
                    >
                      Validation Rules (JSON)
                    </Typography>
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
                    <Typography fontSize="12px" color="#6B7280" fontWeight="400">
                      JSON format validation rules
                    </Typography>
                  </VStack>

                  {/* Help Text */}
                  <VStack align="start" gap="2">
                    <Typography 
                      fontSize="12px" 
                      fontWeight="600" 
                      color="#374151"
                      textTransform="uppercase"
                      letterSpacing="0.05em"
                    >
                      Help Text
                    </Typography>
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
                    <Typography fontSize="12px" color="#6B7280" fontWeight="400">
                      Optional help text shown to users
                    </Typography>
                  </VStack>
                </VStack>
              </Box>

              {/* Status Section */}
              <Box>
                <Box pb="3" borderBottom="1px solid" borderColor="gray.100">
                <Typography 
                    fontSize="16px" 
                    fontWeight="600" 
                    color="#111827" 
                    letterSpacing="-0.01em"
                >
                  Status
                </Typography>
                </Box>
                <HStack justify="space-between" align="center" mt="3">
                  <VStack align="start" gap="1">
                    <Typography fontSize="12px" fontWeight="600" color="#374151" textTransform="uppercase" letterSpacing="0.05em">
                      Active Status
                    </Typography>
                    <Typography fontSize="12px" color="#6B7280" fontWeight="400">
                      Make this requirement available for use
                    </Typography>
                  </VStack>
                  <Button
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    variant={formData.isActive ? "primary" : "secondary"}
                    size="md"
                  >
                    {formData.isActive ? "Active" : "Inactive"}
                  </Button>
                </HStack>
              </Box>

              {/* Action Buttons */}
              <Flex gap="3" justify="flex-end" align="center" pt="4" borderTop="1px solid" borderColor="gray.200" mt="2">
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  size="sm"
                  disabled={saving || loading}
                  className="mukuru-secondary-button"
                  style={{
                    minWidth: '100px',
                    height: '36px',
                    fontSize: '14px'
                  }}
                >
                  <IconWrapper><FiX size={14} /></IconWrapper>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  variant="primary"
                  size="sm"
                  disabled={loading || saving}
                  className="mukuru-primary-button"
                  style={{
                    minWidth: '120px',
                    height: '36px',
                    fontSize: '14px'
                  }}
                >
                  <IconWrapper><FiFileText size={14} /></IconWrapper>
                  {saving ? "Updating..." : "Update"}
                </Button>
              </Flex>
            </VStack>
          </Box>
        </Container>
      </Box>
    </Flex>
  );
}
