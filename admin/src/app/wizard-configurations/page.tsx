"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Badge,
  Flex,
  Button,
  Icon,
  Spinner,
  Alert,
  AlertTitle,
  AlertDescription
} from "@chakra-ui/react";
import { FiSettings, FiEdit3, FiPlus, FiTrash2, FiList } from "react-icons/fi";
import AdminSidebar from "../../components/AdminSidebar";
import Link from "next/link";
import { useState, useEffect } from "react";
import { entityConfigApiService, WizardConfiguration } from "../../services/entityConfigApi";
import { SweetAlert } from "../../utils/sweetAlert";

export default function WizardConfigurationsPage() {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load wizard configurations';
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
      SweetAlert.loading('Deleting...', 'Please wait while we delete the wizard configuration.');
      await entityConfigApiService.deleteWizardConfiguration(id);
      setConfigurations(prev => prev.filter(config => config.id !== id));
      setError(null);
      SweetAlert.close();
      await SweetAlert.success('Deleted!', 'Wizard configuration has been deleted successfully.');
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete wizard configuration';
      setError(errorMessage);
      console.error('Error deleting wizard configuration:', err);
      await SweetAlert.error('Delete Failed', errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="280px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Text color="gray.600">Loading wizard configurations...</Text>
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
      <Box flex="1" ml="240px">
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py="6">
          <Container maxW="8xl">
            <Flex justify="space-between" align="center">
              <HStack gap="3" align="center">
                <Icon as={FiSettings} boxSize="6" color="orange.500" />
                <VStack align="start" gap="1">
                  <Text as="h1" fontSize="2xl" fontWeight="bold" color="gray.800">
                    Wizard Configurations
                  </Text>
                  <Text color="gray.600" fontSize="md">
                    Configure multi-step wizards for entity type applications
                  </Text>
                </VStack>
              </HStack>
              <Link href="/wizard-configurations/create">
                <Button
                  colorScheme="orange"
                  size="md"
                  bg="#FF6B35"
                  _hover={{ bg: "#E55A2B" }}
                  _active={{ bg: "#CC4A1F" }}
                >
                  <Icon as={FiPlus} mr="2" />
                  New Wizard Configuration
                </Button>
              </Link>
            </Flex>
          </Container>
        </Box>

        {/* Error Alert */}
        {error && (
          <Container maxW="8xl" py="4">
            <Alert.Root status="error" borderRadius="md">
              <Icon as={FiSettings} />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert.Root>
          </Container>
        )}

        {/* Configurations List */}
        <Container maxW="8xl" py="6">
          {configurations.length === 0 ? (
            <Box
              bg="white"
              borderRadius="xl"
              border="1px"
              borderColor="gray.200"
              p="12"
              textAlign="center"
            >
              <VStack gap="4">
                <Icon as={FiSettings} boxSize="12" color="gray.400" />
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                  No wizard configurations yet
                </Text>
                <Text color="gray.600" fontSize="md">
                  Get started by creating your first wizard configuration
                </Text>
                <Link href="/wizard-configurations/create">
                  <Button
                    colorScheme="orange"
                    size="md"
                    bg="#FF6B35"
                    _hover={{ bg: "#E55A2B" }}
                    _active={{ bg: "#CC4A1F" }}
                  >
                    <Icon as={FiPlus} mr="2" />
                    Create First Configuration
                  </Button>
                </Link>
              </VStack>
            </Box>
          ) : (
            <VStack gap="4" align="stretch">
              {configurations.map((config) => (
                <Box
                  key={config.id}
                  bg="white"
                  borderRadius="xl"
                  border="1px"
                  borderColor="gray.200"
                  p="6"
                  _hover={{ boxShadow: "md" }}
                  transition="all 0.2s"
                >
                  <Flex justify="space-between" align="start">
                    <VStack align="start" gap="3" flex="1">
                      {/* Title and Status */}
                      <HStack gap="3" align="center">
                        <Text fontSize="lg" fontWeight="bold" color="gray.800">
                          {config.entityTypeDisplayName || 'Unknown Entity Type'}
                        </Text>
                        <Badge 
                          colorScheme={config.isActive ? 'green' : 'gray'}
                          size="lg"
                          px="3"
                          py="1"
                        >
                          {config.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </HStack>

                      {/* Steps Info */}
                      <HStack gap="4">
                        <HStack gap="2">
                          <Icon as={FiList} color="gray.500" />
                          <Text fontSize="sm" color="gray.600">
                            {config.steps.length} {config.steps.length === 1 ? 'Step' : 'Steps'}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          Created: {new Date(config.createdAt).toLocaleDateString()}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Updated: {new Date(config.updatedAt).toLocaleDateString()}
                        </Text>
                      </HStack>

                      {/* Steps Preview */}
                      {config.steps.length > 0 && (
                        <VStack align="start" gap="2" w="100%">
                          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                            Steps:
                          </Text>
                          <HStack gap="2" wrap="wrap">
                            {config.steps
                              .sort((a, b) => a.stepNumber - b.stepNumber)
                              .map((step) => (
                                <Badge
                                  key={step.id}
                                  variant="outline"
                                  colorScheme="blue"
                                  size="sm"
                                  px="2"
                                  py="1"
                                  borderRadius="md"
                                >
                                  {step.stepNumber}. {step.title}
                                </Badge>
                              ))}
                          </HStack>
                        </VStack>
                      )}
                    </VStack>

                    {/* Actions */}
                    <HStack gap="3">
                      <Link href={`/wizard-configurations/edit/${config.id}`}>
                        <Button
                          variant="outline"
                          colorScheme="gray"
                          size="md"
                        >
                          <Icon as={FiEdit3} mr="2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        colorScheme="red"
                        size="md"
                        onClick={() => handleDelete(config.id)}
                        loading={deleting === config.id}
                        loadingText="Deleting..."
                      >
                        <Icon as={FiTrash2} mr="2" />
                        Delete
                      </Button>
                    </HStack>
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </Container>
      </Box>
    </Flex>
  );
}

