'use client';

import { Box, VStack, HStack, Flex, Spinner } from '@chakra-ui/react';
import {
  Typography,
  Button,
  AlertBar,
  Tag,
  Switch,
  ArrowLeftIcon,
} from '@mukuru/mukuru-react-components';
import { useRouter } from 'next/navigation';
import PortalHeader from '../../../../components/PortalHeader';
import { useSidebar } from '../../../../contexts/SidebarContext';
import AdminSidebar from '../../../../components/AdminSidebar';
import { useState, useEffect, use } from 'react';
import { entityConfigApiService, FieldType } from '../../../../services/entityConfigApi';
import { SweetAlert } from '../../../../utils/sweetAlert';

export default function EditRequirementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { condensed } = useSidebar();
  const { id } = use(params);

  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    fieldType: 'Text' as FieldType,
    isActive: true,
    validationRules: '',
    helpText: '',
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
        helpText: requirement.helpText || '',
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
        isActive: formData.isActive,
      });
      SweetAlert.success('Updated!', 'Requirement has been updated successfully.');
      router.push('/requirements');
    } catch (err) {
      console.error('Error updating requirement:', err);
      SweetAlert.error(
        'Update Failed',
        'Failed to update requirement. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/requirements');
  };

  // Loading state
  if (loading) {
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
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Typography color="#1D2939" fontWeight="500">
              Loading requirement...
            </Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  // Error state
  if (error) {
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
          p="8"
        >
          <Box maxW="900px" mx="auto">
            <AlertBar status="error" title="Error!" description={error} />
            <Button
              mt="4"
              onClick={() => router.push('/requirements')}
              variant="primary"
              className="mukuru-primary-button"
            >
              Go Back
            </Button>
          </Box>
        </Box>
      </Flex>
    );
  }

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
            Back to Requirements
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
          Edit Requirement
        </Typography>
        <Typography fontSize="14px" color="mukuru.grey.medium" mb="32px">
          Define a requirement field that can be assigned to entity types.
        </Typography>

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
            {/* Code Field (Read-only for edit) */}
            <Box flex="1">
              <Typography
                fontSize="13px"
                fontWeight="500"
                color="mukuru.text.primary"
                mb="8px"
              >
                Code
              </Typography>
              <input
                value={(formData.displayName || '')
                  .toUpperCase()
                  .replace(/\s+/g, '_')
                  .replace(/[^A-Z0-9_]/g, '')}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #D0D5DD',
                  borderRadius: '6px',
                  backgroundColor: '#F5F5F5',
                  color: '#667085',
                  cursor: 'not-allowed',
                  outline: 'none',
                  height: '46px',
                }}
              />
              <Typography fontSize="12px" color="mukuru.grey.medium" mt="8px">
                Auto-generated from display name
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
                value={formData.displayName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                }
                placeholder="e.g., Company, NGO, Sole Proprietor"
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
          <Box mb="24px">
            <Typography
              fontSize="13px"
              fontWeight="500"
              color="mukuru.text.primary"
              mb="8px"
            >
              Description <span style={{ color: '#EF4444' }}>*</span>
            </Typography>
            <textarea
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe this entity type..."
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

          {/* Field Type (optional) */}
          <Box>
            <Typography
              fontSize="13px"
              fontWeight="500"
              color="mukuru.text.primary"
              mb="8px"
            >
              Field Type
            </Typography>
            <input
              value={formData.fieldType || 'File'}
              readOnly
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '1px solid #D0D5DD',
                borderRadius: '6px',
                backgroundColor: '#F5F5F5',
                color: '#667085',
                cursor: 'not-allowed',
                outline: 'none',
                height: '46px',
              }}
            />
            <Typography fontSize="12px" color="mukuru.grey.medium" mt="8px">
              Field type cannot be changed after creation
            </Typography>
          </Box>
        </Box>

        {/* Field Configuration Card */}
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
            Field Configuration
          </Typography>

          {/* Validation Rules */}
          <Box mb="24px">
            <Typography
              fontSize="13px"
              fontWeight="500"
              color="mukuru.text.primary"
              mb="8px"
            >
              Validation Rules (JSON)
            </Typography>
            <textarea
              value={formData.validationRules || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, validationRules: e.target.value }))
              }
              placeholder='{"required": true, "acceptedTypes": [".pdf", ".jpg", ".png"]}'
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '13px',
                fontFamily: 'monospace',
                border: '1px solid #D0D5DD',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#1D2939',
                minHeight: '100px',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <Typography fontSize="12px" color="mukuru.grey.medium" mt="8px">
              JSON format validation rules
            </Typography>
          </Box>

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
              value={formData.helpText || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, helpText: e.target.value }))
              }
              placeholder="Additional guidance for users filling this field..."
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
        </Box>

        {/* Status Card */}
        <Box
          bg="white"
          borderRadius="12px"
          border="1px solid #E5E7EB"
          p="28px"
          mb="24px"
          boxShadow="0 2px 8px rgba(0,0,0,0.06)"
        >
          <HStack justify="space-between" align="center">
            <Box>
              <Typography
                fontSize="16px"
                fontWeight="600"
                color="mukuru.text.primary"
                mb="4px"
              >
                Active Status
              </Typography>
              <Typography fontSize="13px" color="mukuru.grey.medium">
                Make this requirement available for use
              </Typography>
            </Box>
            <HStack gap="12px">
              <Tag variant={formData.isActive ? 'success' : 'inactive'}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </Tag>
              <Switch
                checked={formData.isActive}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
              />
            </HStack>
          </HStack>
        </Box>

        {/* Action Buttons */}
        <HStack justify="flex-end" gap="12px" mt="24px">
          <Button onClick={handleCancel} variant="secondary" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            variant="primary"
            disabled={saving}
            loading={saving}
          >
            {saving ? 'Updating...' : 'Update Requirement'}
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
}
