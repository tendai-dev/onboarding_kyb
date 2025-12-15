/* eslint-disable security/detect-object-injection */
'use client';

import { Box, VStack, HStack, SimpleGrid, Flex, Spinner } from '@chakra-ui/react';
import {
  Search,
  Typography,
  Button,
  IconWrapper,
  AlertBar,
} from '@mukuru/mukuru-react-components';
import { FiRefreshCw, FiX, FiArrowLeft } from 'react-icons/fi';
import AdminSidebar from '../../../../components/AdminSidebar';
import PortalHeader from '../../../../components/PortalHeader';
import IconPicker from '../../../../components/IconPicker';
import { useSidebar } from '../../../../contexts/SidebarContext';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  entityConfigApiService,
  EntityType,
  Requirement,
} from '../../../../services/entityConfigApi';

export default function EditEntityTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { condensed } = useSidebar();
  const router = useRouter();
  const { id } = use(params);

  const [formData, setFormData] = useState({
    code: '',
    displayName: '',
    description: '',
    icon: '',
    isActive: true,
  });
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  // Debug: Log selectedRequirements changes
  useEffect(() => {
    console.info(
      '[Entity Types Edit] selectedRequirements state updated:',
      selectedRequirements
    );
    console.info(
      '[Entity Types Edit] selectedRequirements count:',
      selectedRequirements.length
    );
    if (selectedRequirements.length > 0 && allRequirements.length > 0) {
      const matched = allRequirements.filter((req) =>
        selectedRequirements.includes(String(req.id))
      );
      console.info(
        '[Entity Types Edit] Matched requirements:',
        matched.length,
        'out of',
        allRequirements.length
      );
      console.info(
        '[Entity Types Edit] Matched requirement names:',
        matched.map((r) => r.displayName)
      );
    }
  }, [selectedRequirements, allRequirements]);

  const loadData = async () => {
    if (!id) {
      setError('Entity type ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Load entity type with requirements - Use list endpoint as workaround since single endpoint doesn't work
      console.info('[Entity Types Edit] Loading entity type with ID:', id);

      // Try single endpoint first
      let entityTypeData = await entityConfigApiService.getEntityType(id, true);
      console.info(
        '[Entity Types Edit] ✅ Loaded entity type from single endpoint:',
        entityTypeData
      );
      console.info(
        '[Entity Types Edit] ✅ Entity type requirements property:',
        entityTypeData.requirements
      );

      // If no requirements, try getting from list endpoint (which we know works)
      if (!entityTypeData.requirements || entityTypeData.requirements.length === 0) {
        console.info(
          '[Entity Types Edit] ⚠️ No requirements from single endpoint, trying list endpoint...'
        );
        const allEntityTypes = await entityConfigApiService.getEntityTypes(false, true);
        const foundEntityType = allEntityTypes.find((et) => et.id === id);
        if (
          foundEntityType &&
          foundEntityType.requirements &&
          foundEntityType.requirements.length > 0
        ) {
          console.info(
            '[Entity Types Edit] ✅ Found requirements from list endpoint!',
            foundEntityType.requirements.length
          );
          // Merge the requirements into the entity type data
          entityTypeData = {
            ...entityTypeData,
            requirements: foundEntityType.requirements,
          };
        }
      }

      console.info('[Entity Types Edit] ✅ Final entity type data:', entityTypeData);
      console.info(
        '[Entity Types Edit] ✅ Final requirements:',
        entityTypeData.requirements
      );

      // Load all requirements
      const requirementsData = await entityConfigApiService.getRequirements(false);
      console.info(
        '[Entity Types Edit] ✅ Loaded all requirements:',
        requirementsData.length
      );

      setEntityType(entityTypeData);
      setAllRequirements(requirementsData);

      // Populate form with entity type data
      setFormData({
        code: entityTypeData.code || '',
        displayName: entityTypeData.displayName || entityTypeData.display_name || '',
        description: entityTypeData.description || '',
        icon: entityTypeData.icon || '',
        isActive: entityTypeData.isActive ?? entityTypeData.is_active ?? true,
      });

      // Extract requirements from the API response
      const requirements = entityTypeData.requirements || [];
      console.info('[Entity Types Edit] ✅ Requirements array from API:', requirements);
      console.info('[Entity Types Edit] ✅ Requirements count:', requirements.length);

      if (requirements && Array.isArray(requirements) && requirements.length > 0) {
        // Extract requirement IDs
        const requirementIds = requirements
          .map((etr) => {
            const id = String(
              (etr as { requirementId?: string; requirement_id?: string; id?: string })
                .requirementId ||
                (etr as { requirementId?: string; requirement_id?: string; id?: string })
                  .requirement_id ||
                (etr as { requirementId?: string; requirement_id?: string; id?: string })
                  .id
            );
            console.info('[Entity Types Edit] Mapping requirement:', etr, '→ ID:', id);
            return id;
          })
          .filter((id) => id && id !== 'undefined' && id !== 'null');

        console.info('[Entity Types Edit] ✅ Extracted requirement IDs:', requirementIds);
        console.info(
          '[Entity Types Edit] ✅ All available requirement IDs:',
          requirementsData.map((r) => String(r.id))
        );

        // Verify matches
        const matched = requirementsData.filter((req) =>
          requirementIds.includes(String(req.id))
        );
        console.info(
          '[Entity Types Edit] ✅ Matched requirements:',
          matched.length,
          'out of',
          requirementIds.length
        );
        console.info(
          '[Entity Types Edit] ✅ Matched requirement names:',
          matched.map((r) => r.displayName)
        );

        if (matched.length !== requirementIds.length) {
          console.warn(
            '[Entity Types Edit] ⚠️ Some requirements not found in all requirements list!'
          );
          const missingIds = requirementIds.filter(
            (id) => !requirementsData.some((r) => String(r.id) === id)
          );
          console.warn('[Entity Types Edit] ⚠️ Missing requirement IDs:', missingIds);
        }

        setSelectedRequirements(requirementIds);
      } else {
        console.error('[Entity Types Edit] ❌ NO REQUIREMENTS FOUND IN API RESPONSE!');
        console.error(
          '[Entity Types Edit] Entity type data keys:',
          Object.keys(entityTypeData)
        );
        console.error('[Entity Types Edit] Entity type data:', entityTypeData);
        setSelectedRequirements([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load entity type';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementToggle = (requirementId: string) => {
    console.info('[Entity Types Edit] Toggling requirement:', requirementId);
    setSelectedRequirements((prev) => {
      const isCurrentlySelected = prev.includes(requirementId);
      const newSelection = isCurrentlySelected
        ? prev.filter((id) => id !== requirementId)
        : [...prev, requirementId];
      console.info('[Entity Types Edit] New selection:', newSelection);
      return newSelection;
    });
  };

  const handleUpdate = async () => {
    if (!formData.displayName || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (!id) {
        setError('Entity type ID is required');
        return;
      }

      // Update the entity type
      await entityConfigApiService.updateEntityType(id, {
        displayName: formData.displayName,
        description: formData.description,
        isActive: formData.isActive,
        icon: formData.icon || undefined,
      });

      // Update requirements
      if (entityType) {
        const currentRequirementIds =
          entityType.requirements?.map(
            (etr) => etr.requirementId || etr.requirement_id || ''
          ) || [];

        // Remove requirements that are no longer selected
        const toRemove = currentRequirementIds.filter(
          (reqId) => !selectedRequirements.includes(reqId)
        );
        for (const reqId of toRemove) {
          await entityConfigApiService.removeRequirementFromEntityType(id, reqId);
        }

        // Add new requirements
        const toAdd = selectedRequirements.filter(
          (reqId) => !currentRequirementIds.includes(reqId)
        );
        for (let i = 0; i < toAdd.length; i++) {
          const reqId = toAdd[i];
          const displayOrder = currentRequirementIds.length - toRemove.length + i + 1;
          await entityConfigApiService.addRequirementToEntityType(id, {
            requirementId: reqId,
            displayOrder: displayOrder,
            isRequired: true,
          });
        }
      }

      router.push('/entity-types');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update entity type';
      setError(errorMessage);
      console.error('Error updating entity type:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/entity-types');
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
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
          <VStack gap="16px">
            <Spinner size="xl" color="mukuru.buttons.primary" />
            <Typography color="mukuru.grey.mediumDark" fontWeight="500">
              Loading entity type...
            </Typography>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (!entityType) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
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
          <VStack gap="16px">
            <Typography color="mukuru.grey.mediumDark" fontSize="16px" fontWeight="600">
              Entity type not found
            </Typography>
            <Button onClick={() => router.push('/entity-types')} variant="primary">
              Back to Entity Types
            </Button>
          </VStack>
        </Box>
      </Box>
    );
  }

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
              Edit Entity Type
            </Typography>
            <Typography fontSize="14px" color="mukuru.grey.medium">
              Update entity type details and requirements
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
                    Code
                  </Typography>
                  <input
                    value={formData.code}
                    readOnly
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
                    Code cannot be changed after creation
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

              {/* Active Toggle */}
              <Flex
                justify="space-between"
                align="center"
                py="12px"
                px="16px"
                bg="mukuru.background.light"
                borderRadius="8px"
              >
                <VStack align="start" gap="2px">
                  <Typography
                    fontSize="13px"
                    fontWeight="500"
                    color="mukuru.text.primary"
                  >
                    Active (visible to applicants)
                  </Typography>
                  <Typography fontSize="11px" color="mukuru.grey.medium">
                    Toggle to make this entity type available for selection
                  </Typography>
                </VStack>
                <Box
                  px="16px"
                  py="6px"
                  bg={formData.isActive ? 'green.50' : 'red.50'}
                  borderRadius="6px"
                  cursor="pointer"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                  _hover={{ opacity: 0.8 }}
                >
                  <Typography
                    fontSize="13px"
                    fontWeight="600"
                    color={formData.isActive ? 'green.600' : 'red.600'}
                  >
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
              </Flex>
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

            {/* Search */}
            <Box mb="16px">
              <Search
                placeholder="Search requirements..."
                onSearchChange={(query) => setSearchQuery(query)}
              />
            </Box>

            {(() => {
              const filteredRequirements = allRequirements.filter((requirement) => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                return (
                  requirement.displayName.toLowerCase().includes(query) ||
                  (requirement.description &&
                    requirement.description.toLowerCase().includes(query))
                );
              });

              if (filteredRequirements.length === 0) {
                return (
                  <Box py="48px" textAlign="center">
                    <Typography fontSize="13px" color="mukuru.grey.medium">
                      {searchQuery
                        ? `No requirements found matching "${searchQuery}"`
                        : 'No requirements available'}
                    </Typography>
                  </Box>
                );
              }

              return (
                <SimpleGrid columns={{ base: 2, lg: 3 }} gap="12px">
                  {filteredRequirements.map((requirement) => {
                    const isSelected = selectedRequirements.includes(
                      String(requirement.id)
                    );
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
                        onClick={() => handleRequirementToggle(String(requirement.id))}
                        _hover={{
                          borderColor: 'mukuru.buttons.primary',
                          bg: isSelected
                            ? 'mukuru.state.hover'
                            : 'mukuru.state.hover.card',
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
              );
            })()}
          </Box>

          {/* Action Buttons */}
          <Box mt="24px" pb="32px">
            <HStack gap="12px">
              <Button
                variant="primary"
                size="md"
                onClick={handleUpdate}
                disabled={
                  loading || saving || !formData.displayName || !formData.description
                }
              >
                <IconWrapper>
                  <FiRefreshCw size={14} />
                </IconWrapper>
                {saving ? 'Updating...' : 'Update Entity Type'}
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
