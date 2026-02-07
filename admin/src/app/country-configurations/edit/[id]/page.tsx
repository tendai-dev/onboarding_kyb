'use client';

import { Box, VStack, HStack, Flex, Spinner } from '@chakra-ui/react';
import {
  Typography,
  Button,
  IconWrapper,
  AlertBar,
  Tag,
} from '@mukuru/mukuru-react-components';
import { Input } from '@/lib/mukuruComponentWrappers';
import { FiArrowLeft, FiSave, FiGlobe, FiTag, FiPlus, FiX } from 'react-icons/fi';
import AdminSidebar from '../../../../components/AdminSidebar';
import PortalHeader from '../../../../components/PortalHeader';
import { useSidebar } from '../../../../contexts/SidebarContext';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import {
  countryConfigApiService,
  UpdateCountryProfileRequest,
  CountryProfile,
  ConfigurationTag,
} from '../../../../services/countryConfigApi';
import { SweetAlert } from '../../../../utils/sweetAlert';

export default function EditCountryConfigurationPage() {
  const { condensed } = useSidebar();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryProfile, setCountryProfile] = useState<CountryProfile | null>(null);

  const [formData, setFormData] = useState<UpdateCountryProfileRequest>({
    countryName: '',
    description: '',
  });

  const [validationErrors, setValidationErrors] = useState<{
    countryName?: string;
  }>({});

  // Tag management state
  const [newTagName, setNewTagName] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [removingTagId, setRemovingTagId] = useState<string | null>(null);

  const bgColorNew = 'mukuru.grey.100';
  const cardBgNew = 'mukuru.white';
  const borderColorNew = 'mukuru.stroke';
  const textColor = 'mukuru.text.primary';

  useEffect(() => {
    loadCountryProfile();
  }, [id]);

  const loadCountryProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await countryConfigApiService.getCountryProfile(id);
      setCountryProfile(profile);
      setFormData({
        countryName: profile.countryName,
        description: profile.description || '',
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load country profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { countryName?: string } = {};

    if (!formData.countryName.trim()) {
      errors.countryName = 'Country name is required';
    } else if (formData.countryName.length < 2) {
      errors.countryName = 'Country name must be at least 2 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const request: UpdateCountryProfileRequest = {
        countryName: formData.countryName.trim(),
        description: formData.description?.trim() || undefined,
      };

      await countryConfigApiService.updateCountryProfile(id, request);

      await SweetAlert.success(
        'Country Profile Updated',
        `${request.countryName} has been updated successfully.`
      );

      router.push('/country-configurations');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update country profile';
      setError(errorMessage);
      await SweetAlert.error('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateCountryProfileRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      await SweetAlert.error('Error', 'Tag name is required');
      return;
    }

    try {
      setAddingTag(true);
      await countryConfigApiService.addTag(id, {
        tagName: newTagName.trim().toUpperCase(),
        tagValue: newTagValue.trim() || undefined,
      });

      // Reload profile to get updated tags
      await loadCountryProfile();
      setNewTagName('');
      setNewTagValue('');
      await SweetAlert.success('Tag Added', 'Tag has been added successfully.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add tag';
      await SweetAlert.error('Error', errorMessage);
    } finally {
      setAddingTag(false);
    }
  };

  const handleRemoveTag = async (tag: ConfigurationTag) => {
    const result = await SweetAlert.confirm(
      'Remove Tag',
      `Are you sure you want to remove the tag "${tag.tagName}${tag.tagValue ? `: ${tag.tagValue}` : ''}"?`,
      'Yes, remove it',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    try {
      setRemovingTagId(tag.id);
      await countryConfigApiService.removeTag(id, tag.tagName, tag.tagValue);
      
      // Update local state
      setCountryProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tags: prev.tags.filter((t) => t.id !== tag.id),
        };
      });
      await SweetAlert.success('Tag Removed', 'Tag has been removed successfully.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove tag';
      await SweetAlert.error('Error', errorMessage);
    } finally {
      setRemovingTagId(null);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColorNew}>
        <AdminSidebar />
        <PortalHeader />
        <Box
          ml={condensed ? '72px' : '280px'}
          pt="90px"
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" color="orange.500" />
        </Box>
      </Box>
    );
  }

  if (error && !countryProfile) {
    return (
      <Box minH="100vh" bg={bgColorNew}>
        <AdminSidebar />
        <PortalHeader />
        <Box
          ml={condensed ? '72px' : '280px'}
          pt="90px"
          minH="100vh"
          p="24px"
        >
          <AlertBar status="error" title="Error" description={error} />
          <Link href="/country-configurations">
            <Button variant="secondary" mt="16px">
              Back to Country Configurations
            </Button>
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColorNew}>
      <AdminSidebar />
      <PortalHeader />

      <Box
        ml={condensed ? '72px' : '280px'}
        pt="90px"
        minH="100vh"
        bg={bgColorNew}
        transition="margin-left 0.3s ease"
      >
        <Box
          px="24px"
          pt="24px"
          pb="16px"
          bg={cardBgNew}
          borderBottom="1px solid"
          borderColor={borderColorNew}
        >
          <Flex justify="space-between" align="center">
            <HStack gap="16px" align="center">
              <Link href="/country-configurations">
                <Button variant="ghost" size="sm">
                  <IconWrapper>
                    <FiArrowLeft size={18} />
                  </IconWrapper>
                </Button>
              </Link>
              <VStack align="start" gap="2px">
                <Typography fontSize="24px" fontWeight="700" color={textColor}>
                  Edit Country Profile
                </Typography>
                <Typography fontSize="14px" color="mukuru.grey.600">
                  Update configuration for {countryProfile?.countryName} ({countryProfile?.countryCode})
                </Typography>
              </VStack>
            </HStack>
          </Flex>
        </Box>

        <Box px="24px" py="24px">
          {error && (
            <Box mb="16px">
              <AlertBar status="error" title="Error" description={error} />
            </Box>
          )}

          <Box
            bg={cardBgNew}
            borderRadius="8px"
            border="1px solid"
            borderColor={borderColorNew}
            p="32px"
            maxW="800px"
          >
            <form onSubmit={handleSubmit}>
              <VStack gap="24px" align="stretch">
                <HStack
                  gap="16px"
                  align="center"
                  pb="16px"
                  borderBottom="1px solid"
                  borderColor={borderColorNew}
                >
                  <Box
                    w="48px"
                    h="48px"
                    borderRadius="12px"
                    bg="#FFF5F0"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <IconWrapper>
                      <FiGlobe size={24} color="#F05423" />
                    </IconWrapper>
                  </Box>
                  <VStack align="start" gap="2px">
                    <Typography fontSize="18px" fontWeight="600" color={textColor}>
                      Country Details
                    </Typography>
                    <Typography fontSize="13px" color="mukuru.grey.600">
                      Update the country profile information
                    </Typography>
                  </VStack>
                </HStack>

                <Box>
                  <Typography fontSize="14px" fontWeight="500" color={textColor} mb="8px">
                    Country Code
                  </Typography>
                  <Input
                    value={countryProfile?.countryCode || ''}
                    disabled
                    style={{
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                      letterSpacing: '2px',
                      backgroundColor: '#f5f5f5',
                    }}
                  />
                  <Typography fontSize="12px" color="mukuru.grey.500" mt="4px">
                    Country code cannot be changed after creation
                  </Typography>
                </Box>

                <Box>
                  <Typography fontSize="14px" fontWeight="500" color={textColor} mb="8px">
                    Country Name <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <Input
                    placeholder="e.g., South Africa, Zimbabwe, United Kingdom"
                    value={formData.countryName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('countryName', e.target.value)
                    }
                  />
                  {validationErrors.countryName && (
                    <Typography fontSize="12px" color="#EF4444" mt="4px">
                      {validationErrors.countryName}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography fontSize="14px" fontWeight="500" color={textColor} mb="8px">
                    Description
                  </Typography>
                  <Input
                    placeholder="Optional description for this country configuration..."
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('description', e.target.value)
                    }
                  />
                  <Typography fontSize="12px" color="mukuru.grey.500" mt="4px">
                    Add any notes or context about this country&apos;s configuration
                  </Typography>
                </Box>

                {/* Tags Section */}
                <Box pt="16px" borderTop="1px solid" borderColor={borderColorNew}>
                  <HStack gap="12px" align="center" mb="16px">
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="10px"
                      bg="#E8F5E9"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <IconWrapper>
                        <FiTag size={20} color="#4CAF50" />
                      </IconWrapper>
                    </Box>
                    <VStack align="start" gap="2px">
                      <Typography fontSize="16px" fontWeight="600" color={textColor}>
                        Configuration Tags
                      </Typography>
                      <Typography fontSize="12px" color="mukuru.grey.600">
                        Tags enable rule-based configuration matching (e.g., REGION: AFRICA)
                      </Typography>
                    </VStack>
                  </HStack>

                  {/* Current Tags */}
                  {countryProfile?.tags && countryProfile.tags.length > 0 && (
                    <Box mb="16px">
                      <Typography fontSize="13px" fontWeight="500" color="mukuru.grey.600" mb="8px">
                        Current Tags ({countryProfile.tags.length})
                      </Typography>
                      <HStack gap="8px" wrap="wrap">
                        {countryProfile.tags.map((tag) => (
                          <Tag
                            key={tag.id}
                            variant="info"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              fontSize: '13px',
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{tag.tagName}</span>
                            {tag.tagValue && (
                              <span style={{ color: '#666' }}>: {tag.tagValue}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              disabled={removingTagId === tag.id}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: removingTagId === tag.id ? 'wait' : 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: removingTagId === tag.id ? 0.5 : 1,
                              }}
                            >
                              {removingTagId === tag.id ? (
                                <Spinner size="xs" />
                              ) : (
                                <FiX size={14} color="#EF4444" />
                              )}
                            </button>
                          </Tag>
                        ))}
                      </HStack>
                    </Box>
                  )}

                  {/* Add New Tag */}
                  <Box
                    bg="mukuru.grey.50"
                    p="16px"
                    borderRadius="8px"
                    border="1px dashed"
                    borderColor="mukuru.grey.300"
                  >
                    <Typography fontSize="13px" fontWeight="500" color={textColor} mb="12px">
                      Add New Tag
                    </Typography>
                    <HStack gap="12px" align="flex-end">
                      <Box flex="1">
                        <Typography fontSize="12px" color="mukuru.grey.600" mb="4px">
                          Tag Name <span style={{ color: '#EF4444' }}>*</span>
                        </Typography>
                        <Input
                          placeholder="e.g., REGION, CURRENCY, REGULATORY_FRAMEWORK"
                          value={newTagName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewTagName(e.target.value.toUpperCase())
                          }
                          style={{ textTransform: 'uppercase' }}
                        />
                      </Box>
                      <Box flex="1">
                        <Typography fontSize="12px" color="mukuru.grey.600" mb="4px">
                          Tag Value (optional)
                        </Typography>
                        <Input
                          placeholder="e.g., AFRICA, USD, FATF"
                          value={newTagValue}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewTagValue(e.target.value)
                          }
                        />
                      </Box>
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={handleAddTag}
                        disabled={addingTag || !newTagName.trim()}
                      >
                        {addingTag ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <IconWrapper>
                              <FiPlus size={14} />
                            </IconWrapper>
                            Add Tag
                          </>
                        )}
                      </Button>
                    </HStack>
                  </Box>
                </Box>

                <HStack
                  gap="12px"
                  justify="flex-end"
                  pt="16px"
                  borderTop="1px solid"
                  borderColor={borderColorNew}
                >
                  <Link href="/country-configurations">
                    <Button variant="secondary" size="md" disabled={saving}>
                      Cancel
                    </Button>
                  </Link>
                  <Button variant="primary" size="md" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner size="sm" mr="8px" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IconWrapper>
                          <FiSave size={16} />
                        </IconWrapper>
                        Save Changes
                      </>
                    )}
                  </Button>
                </HStack>
              </VStack>
            </form>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
