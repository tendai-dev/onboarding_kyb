'use client';

import { Box, VStack, HStack, Flex, Spinner } from '@chakra-ui/react';
import {
  Typography,
  Button,
  IconWrapper,
  AlertBar,
} from '@mukuru/mukuru-react-components';
import { Input } from '@/lib/mukuruComponentWrappers';
import { FiArrowLeft, FiSave, FiGlobe } from 'react-icons/fi';
import AdminSidebar from '../../../components/AdminSidebar';
import PortalHeader from '../../../components/PortalHeader';
import { useSidebar } from '../../../contexts/SidebarContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import {
  countryConfigApiService,
  CreateCountryProfileRequest,
} from '../../../services/countryConfigApi';
import { SweetAlert } from '../../../utils/sweetAlert';

export default function CreateCountryConfigurationPage() {
  const { condensed } = useSidebar();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCountryProfileRequest>({
    countryCode: '',
    countryName: '',
    description: '',
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{
    countryCode?: string;
    countryName?: string;
  }>({});

  // Mukuru theme colors
  const bgColorNew = 'mukuru.grey.100';
  const cardBgNew = 'mukuru.white';
  const borderColorNew = 'mukuru.stroke';
  const textColor = 'mukuru.text.primary';

  const validateForm = (): boolean => {
    const errors: { countryCode?: string; countryName?: string } = {};

    if (!formData.countryCode.trim()) {
      errors.countryCode = 'Country code is required';
    } else if (formData.countryCode.length < 2 || formData.countryCode.length > 3) {
      errors.countryCode = 'Country code must be 2-3 characters (e.g., ZA, ZW, UK)';
    } else if (!/^[A-Z]+$/.test(formData.countryCode.toUpperCase())) {
      errors.countryCode = 'Country code must contain only letters';
    }

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
      setLoading(true);
      setError(null);

      const request: CreateCountryProfileRequest = {
        countryCode: formData.countryCode.toUpperCase().trim(),
        countryName: formData.countryName.trim(),
        description: formData.description?.trim() || undefined,
      };

      await countryConfigApiService.createCountryProfile(request);

      await SweetAlert.success(
        'Country Profile Created',
        `${request.countryName} has been created successfully.`
      );

      router.push('/country-configurations');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create country profile';
      setError(errorMessage);
      await SweetAlert.error('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateCountryProfileRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Box minH="100vh" bg={bgColorNew}>
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content Area */}
      <Box
        ml={condensed ? '72px' : '280px'}
        pt="90px"
        minH="100vh"
        bg={bgColorNew}
        transition="margin-left 0.3s ease"
      >
        {/* Page Header */}
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
                  Create Country Profile
                </Typography>
                <Typography fontSize="14px" color="mukuru.grey.600">
                  Add a new country configuration to the system
                </Typography>
              </VStack>
            </HStack>
          </Flex>
        </Box>

        {/* Form Section */}
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
                {/* Icon and Title */}
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
                      Enter the basic information for the new country profile
                    </Typography>
                  </VStack>
                </HStack>

                {/* Country Code */}
                <Box>
                  <Typography fontSize="14px" fontWeight="500" color={textColor} mb="8px">
                    Country Code <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <Input
                    placeholder="e.g., ZA, ZW, UK"
                    value={formData.countryCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('countryCode', e.target.value.toUpperCase())
                    }
                    maxLength={3}
                    style={{
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                      letterSpacing: '2px',
                    }}
                  />
                  {validationErrors.countryCode && (
                    <Typography fontSize="12px" color="#EF4444" mt="4px">
                      {validationErrors.countryCode}
                    </Typography>
                  )}
                  <Typography fontSize="12px" color="mukuru.grey.500" mt="4px">
                    Use ISO 3166-1 alpha-2 or alpha-3 country codes
                  </Typography>
                </Box>

                {/* Country Name */}
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

                {/* Description */}
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

                {/* Action Buttons */}
                <HStack
                  gap="12px"
                  justify="flex-end"
                  pt="16px"
                  borderTop="1px solid"
                  borderColor={borderColorNew}
                >
                  <Link href="/country-configurations">
                    <Button variant="secondary" size="md" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                  <Button variant="primary" size="md" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner size="sm" mr="8px" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <IconWrapper>
                          <FiSave size={16} />
                        </IconWrapper>
                        Create Country Profile
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
