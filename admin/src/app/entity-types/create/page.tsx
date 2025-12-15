'use client';

import { Box, VStack, HStack, SimpleGrid, Flex, Spinner } from '@chakra-ui/react';
import {
  Typography,
  Button,
  IconWrapper,
  AlertBar,
  Card,
} from '@mukuru/mukuru-react-components';
import { Input } from '@/lib/mukuruComponentWrappers';
import { FiFileText, FiX, FiArrowLeft } from 'react-icons/fi';
import AdminSidebar from '../../../components/AdminSidebar';
import PortalHeader from '../../../components/PortalHeader';
import IconPicker from '../../../components/IconPicker';
import { useSidebar } from '../../../contexts/SidebarContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { entityConfigApiService, Requirement } from '../../../services/entityConfigApi';

export default function CreateEntityTypePage() {
  const router = useRouter();
  const { condensed } = useSidebar();

  const [formData, setFormData] = useState({
    code: '',
    displayName: '',
    description: '',
    icon: '',
  });
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequirements();
  }, []);

  // Auto-generate code from display name
  useEffect(() => {
    if (formData.displayName) {
      const generatedCode = formData.displayName
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '') // Remove special characters except spaces
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single underscore
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

      setFormData((prev) => ({ ...prev, code: generatedCode }));
    } else {
      // Clear code when display name is empty
      setFormData((prev) => ({ ...prev, code: '' }));
    }
  }, [formData.displayName]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const requirements = await entityConfigApiService.getRequirements(false);
      setAllRequirements(requirements);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load requirements';
      setError(errorMessage);
      console.error('Error loading requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementToggle = (requirementId: string) => {
    setSelectedRequirements((prev) =>
      prev.includes(requirementId)
        ? prev.filter((id) => id !== requirementId)
        : [...prev, requirementId]
    );
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.displayName || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Create the entity type
      const result = await entityConfigApiService.createEntityType({
        code: formData.code,
        displayName: formData.displayName,
        description: formData.description,
        icon: formData.icon || undefined,
      });

      // Add requirements to the entity type sequentially with retry logic to handle concurrency issues
      const failedRequirements: string[] = [];
      if (selectedRequirements.length > 0) {
        for (let index = 0; index < selectedRequirements.length; index++) {
          const requirementId = selectedRequirements[index];
          let retries = 5;
          let success = false;

          while (retries > 0 && !success) {
            try {
              await entityConfigApiService.addRequirementToEntityType(result.id, {
                requirementId: requirementId,
                isRequired: true,
                displayOrder: index + 1,
              });
              success = true;
              // Add a small delay between requirements to allow database to process
              if (index < selectedRequirements.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 50));
              }
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              // Check if it's a concurrency error
              if (
                errorMessage.includes('modified by another operation') ||
                errorMessage.includes('concurrency')
              ) {
                retries--;
                if (retries > 0) {
                  // Wait before retrying (exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms)
                  const delay = 50 * Math.pow(2, 5 - retries - 1);
                  await new Promise((resolve) => setTimeout(resolve, delay));
                  // Reload the entity type to get the latest version
                  try {
                    await entityConfigApiService.getEntityType(result.id, false);
                  } catch {
                    // Ignore reload errors
                  }
                } else {
                  // After all retries failed, mark this requirement as failed but continue with others
                  const requirement = allRequirements.find((r) => r.id === requirementId);
                  failedRequirements.push(requirement?.displayName || requirementId);
                  console.warn(
                    `Failed to add requirement ${requirementId} after all retries`
                  );
                }
              } else {
                // Not a concurrency error, mark as failed but continue
                const requirement = allRequirements.find((r) => r.id === requirementId);
                failedRequirements.push(requirement?.displayName || requirementId);
                console.warn(`Failed to add requirement ${requirementId}:`, err);
                break; // Exit retry loop for this requirement
              }
            }
          }
        }

        // If some requirements failed, show a warning but still proceed
        if (failedRequirements.length > 0) {
          const successCount = selectedRequirements.length - failedRequirements.length;
          setError(
            `Entity type created successfully, but ${failedRequirements.length} requirement(s) could not be added: ${failedRequirements.join(', ')}. ` +
              `You can edit the entity type to add them manually.`
          );
          // Still navigate to the list page after a short delay
          setTimeout(() => {
            router.push('/entity-types');
          }, 3000);
          return;
        }
      }

      router.push('/entity-types');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create entity type';
      setError(errorMessage);
      console.error('Error creating entity type:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/entity-types');
  };

  return (
    <Box minH="100vh" bg="mukuru.background.light">
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content */}
      <Box
        ml={condensed ? '72px' : '280px'}
        pt="90px"
        minH="100vh"
        bg="mukuru.background.light"
        transition="margin-left 0.3s ease"
      >
        {/* Page Header */}
        <Box
          px="32px"
          py="28px"
          bg="mukuru.cards.white"
          borderBottom="1px solid"
          borderColor="mukuru.grey.light"
        >
          {/* Back Button */}
          <HStack
            gap="6px"
            align="center"
            mb="20px"
            cursor="pointer"
            onClick={() => router.push('/entity-types')}
            _hover={{ bg: 'mukuru.state.hover' }}
            w="fit-content"
            px="8px"
            py="4px"
            borderRadius="4px"
            ml="-8px"
          >
            <FiArrowLeft size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
            <Typography fontSize="13px" color="mukuru.grey.medium">
              Back to Entity Types
            </Typography>
          </HStack>

          <VStack align="start" gap="6px">
            <Typography
              fontSize="26px"
              fontWeight="700"
              color="mukuru.text.primary"
              lineHeight="1.2"
            >
              Create Entity Type
            </Typography>
            <Typography fontSize="14px" color="mukuru.grey.medium">
              Define a new entity type and select which requirements apply.
            </Typography>
          </VStack>
        </Box>

        {/* Form Content */}
        <Box px="32px" py="32px" bg="#F9FAFB">
          {/* Error Alert */}
          {error && (
            <Box mb="24px">
              <AlertBar status="error" title="Error" description={error} />
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

            <VStack align="stretch" gap="20px">
              {/* Code & Display Name Row */}
              <Flex gap="24px">
                {/* Code Field */}
                <Box flex="1">
                  <Typography
                    fontSize="13px"
                    fontWeight="500"
                    color="mukuru.text.primary"
                    mb="8px"
                  >
                    Code{' '}
                    <span style={{ color: 'var(--chakra-colors-mukuru-text-error)' }}>
                      *
                    </span>
                  </Typography>
                  <input
                    value={formData.code}
                    readOnly
                    placeholder="Auto-generated from Display Name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid var(--chakra-colors-mukuru-grey-light)',
                      borderRadius: '6px',
                      backgroundColor: '#f5f5f5',
                      color: 'var(--chakra-colors-mukuru-grey-medium)',
                      cursor: 'not-allowed',
                      outline: 'none',
                    }}
                  />
                  <Typography fontSize="11px" color="mukuru.grey.medium" mt="8px">
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
                    Display Name{' '}
                    <span style={{ color: 'var(--chakra-colors-mukuru-text-error)' }}>
                      *
                    </span>
                  </Typography>
                  <input
                    value={formData.displayName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    placeholder="e.g., Company, NGO, Sole Proprietor"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid var(--chakra-colors-mukuru-grey-light)',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: 'var(--chakra-colors-mukuru-text-primary)',
                      outline: 'none',
                    }}
                  />
                  <Typography fontSize="11px" color="mukuru.grey.medium" mt="8px">
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
                  Description{' '}
                  <span style={{ color: 'var(--chakra-colors-mukuru-text-error)' }}>
                    *
                  </span>
                </Typography>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe this entity type..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid var(--chakra-colors-mukuru-grey-light)',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: 'var(--chakra-colors-mukuru-text-primary)',
                    minHeight: '100px',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </Box>

              {/* Icon Field */}
              <Box>
                <Typography
                  fontSize="13px"
                  fontWeight="500"
                  color="mukuru.text.primary"
                  mb="8px"
                >
                  Icon{' '}
                  <span
                    style={{
                      color: 'var(--chakra-colors-mukuru-grey-medium)',
                      fontWeight: '400',
                    }}
                  >
                    (optional)
                  </span>
                </Typography>
                <IconPicker
                  value={formData.icon}
                  onChange={(iconName) =>
                    setFormData((prev) => ({ ...prev, icon: iconName }))
                  }
                />
                <Typography fontSize="11px" color="mukuru.grey.medium" mt="8px">
                  Select an icon from the Feather Icons library
                </Typography>
              </Box>
            </VStack>
          </Box>

          {/* Requirements Card */}
          <Box
            bg="white"
            borderRadius="12px"
            border="1px solid #E5E7EB"
            p="28px"
            mb="24px"
            boxShadow="0 2px 8px rgba(0,0,0,0.06)"
          >
            <Flex justify="space-between" align="center" mb="20px">
              <VStack align="start" gap="4px">
                <Typography fontSize="16px" fontWeight="600" color="mukuru.text.primary">
                  Requirements
                </Typography>
                <Typography fontSize="12px" color="mukuru.grey.medium">
                  Select which requirements apply to this entity type
                </Typography>
              </VStack>
              <Box
                px="12px"
                py="4px"
                bg="mukuru.state.hover"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.buttons.primary"
              >
                <Typography
                  fontSize="12px"
                  fontWeight="500"
                  color="mukuru.buttons.primary"
                >
                  {selectedRequirements.length} selected
                </Typography>
              </Box>
            </Flex>
            {loading ? (
              <Flex justify="center" py="48px">
                <Spinner size="lg" color="mukuru.buttons.primary" />
              </Flex>
            ) : allRequirements.length === 0 ? (
              <Box py="48px" textAlign="center">
                <Typography fontSize="13px" color="mukuru.grey.medium">
                  No requirements available
                </Typography>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 2, lg: 3 }} gap="12px">
                {allRequirements.map((requirement) => {
                  const isSelected = selectedRequirements.includes(requirement.id);
                  return (
                    <Box
                      key={requirement.id}
                      p="14px"
                      border="1px solid"
                      borderColor={
                        isSelected ? 'mukuru.buttons.primary' : 'mukuru.grey.light'
                      }
                      borderRadius="8px"
                      bg={isSelected ? 'mukuru.state.hover' : 'mukuru.cards.white'}
                      cursor="pointer"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedRequirements((prev) =>
                            prev.filter((id) => id !== requirement.id)
                          );
                        } else {
                          setSelectedRequirements((prev) => [...prev, requirement.id]);
                        }
                      }}
                      _hover={{
                        borderColor: 'mukuru.buttons.primary',
                        bg: isSelected ? 'mukuru.state.hover' : 'mukuru.state.hover.card',
                      }}
                      transition="all 0.15s"
                    >
                      <Flex gap="10px" align="flex-start">
                        <Box
                          w="18px"
                          h="18px"
                          borderRadius="4px"
                          border="2px solid"
                          borderColor={
                            isSelected ? 'mukuru.buttons.primary' : 'mukuru.grey.light'
                          }
                          bg={
                            isSelected ? 'mukuru.buttons.primary' : 'mukuru.cards.white'
                          }
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          mt="1px"
                        >
                          {isSelected && (
                            <Box
                              as="span"
                              color="mukuru.white"
                              fontSize="10px"
                              fontWeight="bold"
                            >
                              ✓
                            </Box>
                          )}
                        </Box>
                        <VStack align="start" gap="2px" flex="1">
                          <Typography
                            fontSize="13px"
                            fontWeight="500"
                            color="mukuru.text.primary"
                          >
                            {requirement.displayName}
                          </Typography>
                          {requirement.description && (
                            <Typography
                              fontSize="11px"
                              color="mukuru.grey.medium"
                              lineHeight="1.3"
                            >
                              {requirement.description.length > 60
                                ? requirement.description.substring(0, 60) + '...'
                                : requirement.description}
                            </Typography>
                          )}
                        </VStack>
                      </Flex>
                    </Box>
                  );
                })}
              </SimpleGrid>
            )}
          </Box>

          {/* Action Buttons - At the bottom */}
          <Box mt="24px" pb="32px">
            <HStack gap="12px">
              <Button
                variant="primary"
                size="md"
                onClick={handleCreate}
                disabled={
                  loading || saving || !formData.displayName || !formData.description
                }
              >
                <IconWrapper>
                  <FiFileText size={14} />
                </IconWrapper>
                {saving ? 'Creating...' : 'Create Entity Type'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleCancel}
                disabled={saving}
              >
                <IconWrapper>
                  <FiX size={14} />
                </IconWrapper>
                Cancel
              </Button>
            </HStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
