'use client';

import { Box, Container, VStack, HStack, Flex, Spinner } from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Typography,
  Tag,
  Button,
  IconWrapper,
  AlertBar,
} from '@mukuru/mukuru-react-components';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import { FiSettings, FiEdit3, FiPlus, FiTrash2, FiList } from 'react-icons/fi';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  entityConfigApiService,
  WizardConfiguration,
} from '../../services/entityConfigApi';
import { SweetAlert } from '../../utils/sweetAlert';

export default function WizardConfigurationsPage() {
  const { condensed } = useSidebar();

  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const headerBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

  const [configurations, setConfigurations] = useState<WizardConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await entityConfigApiService.getWizardConfigurations(false);
      setConfigurations(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load wizard configurations';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await SweetAlert.confirm(
      'Delete Wizard Configuration',
      'Are you sure you want to delete this wizard configuration? This action cannot be undone.',
      'Yes, delete it!',
      'Cancel',
      'warning'
    );

    if (!result.isConfirmed) return;

    try {
      setDeleting(id);
      SweetAlert.loading(
        'Deleting...',
        'Please wait while we delete the wizard configuration.'
      );
      await entityConfigApiService.deleteWizardConfiguration(id);
      setConfigurations((prev) => prev.filter((config) => config.id !== id));
      setError(null);
      SweetAlert.close();
      await SweetAlert.success(
        'Deleted!',
        'Wizard configuration has been deleted successfully.'
      );
    } catch (err) {
      SweetAlert.close();
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete wizard configuration';
      setError(errorMessage);
      console.error('Error deleting wizard configuration:', err);
      await SweetAlert.error('Delete Failed', errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Flex minH="100vh" bg={bgColor}>
      <AdminSidebar />
      <PortalHeader />
      <Box
        ml={condensed ? '72px' : '280px'}
        mt="90px"
        height="calc(100vh - 90px)"
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        bg={bgColor}
        overflowX="hidden"
        overflowY="hidden"
        transition="margin-left 0.3s ease, width 0.3s ease"
        display="flex"
        flexDirection="column"
      >
        {/* Fixed Header Section */}
        <Box
          flexShrink={0}
          bg={bgColor}
          borderBottom="1px solid"
          borderColor={borderColor}
        >
          <Container maxW="100%" px="8" py="6" width="full">
            <Flex justify="space-between" align="flex-start" mb="4">
              <VStack align="flex-start" gap="4px">
                <Typography
                  fontSize="28px"
                  fontWeight="700"
                  color="mukuru.text.primary"
                  lineHeight="1.2"
                >
                  Wizard Configurations
                </Typography>
                <Typography
                  fontSize="14px"
                  color="mukuru.grey.medium"
                  fontWeight="400"
                  lineHeight="1.4"
                >
                  Configure multi-step wizards for entity type applications
                </Typography>
              </VStack>
              <Link href="/wizard-configurations/create">
                <Button
                  variant="primary"
                  className="mukuru-primary-button"
                  bg="mukuru.primary"
                >
                  <IconWrapper>
                    <FiPlus size={16} />
                  </IconWrapper>
                  New Wizard Configuration
                </Button>
              </Link>
            </Flex>
          </Container>

          {/* Error Display */}
          {error && (
            <Container maxW="100%" px="8" pb="4" width="full">
              <AlertBar
                status="error"
                title="Error loading wizard configurations"
                description={error}
              />
            </Container>
          )}
        </Box>

        {/* Scrollable Content Section */}
        <Box
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          bg={bgColor}
          width="full"
          minH="0"
        >
          <Container maxW="100%" px="8" py="4" width="full">
            {loading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minH="200px"
              >
                <Spinner size="xl" />
              </Box>
            ) : configurations.length === 0 ? (
              <Box
                bg={cardBg}
                borderRadius="xl"
                border="1px"
                borderColor="mukuru.grey.light"
                p="12"
                textAlign="center"
              >
                <VStack gap="4">
                  <IconWrapper>
                    <FiSettings size={48} color="var(--mukuru-grey-medium)" />
                  </IconWrapper>
                  <Typography fontSize="lg" fontWeight="bold" color="mukuru.text.primary">
                    No wizard configurations yet
                  </Typography>
                  <Typography color="mukuru.text.primary" fontSize="md" fontWeight="500">
                    Get started by creating your first wizard configuration
                  </Typography>
                  <Link href="/wizard-configurations/create">
                    <Button variant="primary" className="mukuru-primary-button" size="md">
                      <IconWrapper>
                        <FiPlus size={16} />
                      </IconWrapper>
                      Create First Configuration
                    </Button>
                  </Link>
                </VStack>
              </Box>
            ) : (
              <VStack gap="5" align="stretch">
                {configurations.map((config) => (
                  <Box
                    key={config.id}
                    bg={cardBg}
                    borderRadius="16px"
                    border="1px solid"
                    borderColor="#E5E7EB"
                    overflow="hidden"
                    boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
                    _hover={{
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      borderColor: '#D1D5DB',
                    }}
                    transition="all 0.2s ease-in-out"
                  >
                    {/* Card Header */}
                    <Box
                      px="24px"
                      py="20px"
                      borderBottom="1px solid"
                      borderColor="#F3F4F6"
                      bg="#FAFBFC"
                    >
                      <Flex
                        justify="space-between"
                        align="center"
                        gap="16px"
                        flexWrap="wrap"
                      >
                        {/* Title */}
                        <Typography
                          fontSize="18px"
                          fontWeight="700"
                          color="#111827"
                          letterSpacing="-0.01em"
                        >
                          {config.entityTypeDisplayName ||
                            config.entity_type_display_name ||
                            'Unknown Entity Type'}
                        </Typography>

                        {/* Actions */}
                        <HStack gap="10px">
                          <Box
                            px="12px"
                            py="6px"
                            borderRadius="6px"
                            bg={config.isActive ? '#DCFCE7' : '#F3F4F6'}
                            border="1px solid"
                            borderColor={config.isActive ? '#86EFAC' : '#E5E7EB'}
                          >
                            <Typography
                              fontSize="12px"
                              fontWeight="600"
                              color={config.isActive ? '#16A34A' : '#6B7280'}
                            >
                              {config.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                          </Box>
                          <Link href={`/wizard-configurations/edit/${config.id}`}>
                            <Box
                              as="button"
                              display="flex"
                              alignItems="center"
                              gap="6px"
                              px="14px"
                              py="8px"
                              borderRadius="8px"
                              bg="#F05423"
                              color="white"
                              fontSize="13px"
                              fontWeight="600"
                              cursor="pointer"
                              transition="all 0.2s"
                              _hover={{ bg: '#E04A1F', transform: 'translateY(-1px)' }}
                            >
                              <FiEdit3 size={14} />
                              Edit
                            </Box>
                          </Link>
                          <Box
                            as="button"
                            display="flex"
                            alignItems="center"
                            gap="6px"
                            px="14px"
                            py="8px"
                            borderRadius="8px"
                            bg={deleting === config.id ? '#F3F4F6' : '#DC2626'}
                            color={deleting === config.id ? '#9CA3AF' : 'white'}
                            fontSize="13px"
                            fontWeight="600"
                            cursor={deleting === config.id ? 'not-allowed' : 'pointer'}
                            opacity={deleting === config.id ? 0.7 : 1}
                            transition="all 0.2s"
                            _hover={
                              deleting === config.id
                                ? {}
                                : { bg: '#B91C1C', transform: 'translateY(-1px)' }
                            }
                            onClick={() => !deleting && handleDelete(config.id)}
                          >
                            <FiTrash2 size={14} />
                            {deleting === config.id ? 'Deleting...' : 'Delete'}
                          </Box>
                        </HStack>
                      </Flex>
                    </Box>

                    {/* Card Body */}
                    <Box px="24px" py="20px">
                      {/* Meta Info */}
                      <HStack gap="24px" mb="16px" flexWrap="wrap">
                        <HStack gap="8px">
                          <Box
                            w="28px"
                            h="28px"
                            borderRadius="6px"
                            bg="#FFF5F2"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <FiList size={14} color="#F05423" />
                          </Box>
                          <Typography fontSize="14px" fontWeight="600" color="#374151">
                            {config.steps.length}{' '}
                            {config.steps.length === 1 ? 'Step' : 'Steps'}
                          </Typography>
                        </HStack>
                        <HStack gap="6px">
                          <Typography fontSize="13px" color="#6B7280">
                            Created:
                          </Typography>
                          <Typography fontSize="13px" fontWeight="600" color="#374151">
                            {new Date(
                              config.createdAt || config.created_at || ''
                            ).toLocaleDateString()}
                          </Typography>
                        </HStack>
                        <HStack gap="6px">
                          <Typography fontSize="13px" color="#6B7280">
                            Updated:
                          </Typography>
                          <Typography fontSize="13px" fontWeight="600" color="#374151">
                            {new Date(
                              config.updatedAt || config.updated_at || ''
                            ).toLocaleDateString()}
                          </Typography>
                        </HStack>
                      </HStack>

                      {/* Steps Preview */}
                      {config.steps.length > 0 && (
                        <Box>
                          <Typography
                            fontSize="13px"
                            fontWeight="600"
                            color="#6B7280"
                            mb="10px"
                          >
                            Steps:
                          </Typography>
                          <Flex flexWrap="wrap" gap="8px">
                            {config.steps
                              .sort((a, b) => a.stepNumber - b.stepNumber)
                              .map((step) => (
                                <Box
                                  key={step.id}
                                  display="inline-flex"
                                  alignItems="center"
                                  px="12px"
                                  py="8px"
                                  borderRadius="8px"
                                  bg="#F9FAFB"
                                  border="1px solid"
                                  borderColor="#E5E7EB"
                                >
                                  <Typography
                                    fontSize="13px"
                                    fontWeight="700"
                                    color="#F05423"
                                    mr="6px"
                                  >
                                    {step.stepNumber}.
                                  </Typography>
                                  <Typography
                                    fontSize="13px"
                                    fontWeight="500"
                                    color="#374151"
                                  >
                                    {step.title}
                                  </Typography>
                                </Box>
                              ))}
                          </Flex>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </VStack>
            )}
          </Container>
        </Box>
      </Box>
    </Flex>
  );
}
