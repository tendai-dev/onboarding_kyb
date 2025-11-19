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
import { FiFileText, FiEdit3, FiPlus, FiTrash2 } from "react-icons/fi";
import AdminSidebar from "../../components/AdminSidebar";
import Link from "next/link";
import { useState, useEffect } from "react";
import { entityConfigApiService, EntityType, Requirement } from "../../services/entityConfigApi";
import { SweetAlert } from "../../utils/sweetAlert";

export default function EntityTypesPage() {
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
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
      const [entityTypesData, requirementsData] = await Promise.all([
        entityConfigApiService.getEntityTypes(false, true),
        entityConfigApiService.getRequirements(false)
      ]);
      setEntityTypes(entityTypesData);
      setRequirements(requirementsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load entity types';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await SweetAlert.confirm(
      'Delete Entity Type',
      'Are you sure you want to delete this entity type? This action cannot be undone.',
      'Yes, delete it!',
      'Cancel',
      'warning'
    );
    
    if (!result.isConfirmed) return;
    
    try {
      setDeleting(id);
      SweetAlert.loading('Deleting...', 'Please wait while we delete the entity type.');
      await entityConfigApiService.deleteEntityType(id);
      setEntityTypes(prev => prev.filter(et => et.id !== id));
      setError(null);
      SweetAlert.close();
      await SweetAlert.success('Deleted!', 'Entity type has been deleted successfully.');
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entity type';
      setError(errorMessage);
      console.error('Error deleting entity type:', err);
      await SweetAlert.error('Delete Failed', errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const getRequirementNames = (entityTypeRequirements?: EntityType['requirements']) => {
    if (!entityTypeRequirements || entityTypeRequirements.length === 0) {
      return [];
    }
    return entityTypeRequirements.map(etr => {
      // If requirement is populated, use its displayName
      if (etr.requirement) {
        return etr.requirement.displayName;
      }
      // Otherwise, try to find it in the requirements list
      const req = requirements.find(r => r.id === etr.requirementId);
      return req ? req.displayName : etr.requirementId;
    });
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="280px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Text color="gray.600">Loading entity types...</Text>
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
                <Icon as={FiFileText} boxSize="6" color="orange.500" />
                <VStack align="start" gap="1">
                  <Text as="h1" fontSize="2xl" fontWeight="bold" color="gray.800">
                    Entity Types
                  </Text>
                  <Text color="gray.600" fontSize="md">
                    Create and configure entity types for KYB applications
                  </Text>
                </VStack>
              </HStack>
                     <Link href="/entity-types/create">
                       <Button
                         colorScheme="orange"
                         size="md"
                         bg="#FF6B35"
                         _hover={{ bg: "#E55A2B" }}
                         _active={{ bg: "#CC4A1F" }}
                       >
                         <Icon as={FiPlus} mr="2" />
                         New Entity Type
                       </Button>
                     </Link>
            </Flex>
          </Container>
        </Box>

        {/* Error Alert */}
        {error && (
          <Container maxW="8xl" py="4">
            <Alert.Root status="error" borderRadius="md">
              <Icon as={FiFileText} />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert.Root>
          </Container>
        )}

        {/* Entity Types List */}
        <Container maxW="8xl" py="6">
          <VStack gap="4" align="stretch">
            {entityTypes.map((entity) => (
              <Box
                key={entity.id}
                bg="white"
                borderRadius="xl"
                border="1px"
                borderColor="gray.200"
                p="4"
                _hover={{ boxShadow: "md" }}
                transition="all 0.2s"
              >
                <Flex justify="space-between" align="start">
                  <VStack align="start" gap="3" flex="1">
                    {/* Title and Status */}
                    <HStack gap="3" align="center">
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        {entity.displayName}
                      </Text>
                      <Badge 
                        colorScheme={entity.isActive ? 'green' : 'gray'}
                        size="lg"
                        px="3"
                        py="1"
                      >
                        {entity.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </HStack>

                    {/* Code */}
                    <Badge 
                      variant="subtle" 
                      colorScheme="gray"
                      size="sm"
                      px="2"
                      py="1"
                      borderRadius="md"
                    >
                      {entity.code}
                    </Badge>

                    {/* Description */}
                    <Text color="gray.600" fontSize="md">
                      {entity.description}
                    </Text>

                    {/* Requirements */}
                    {entity.requirements && entity.requirements.length > 0 && (
                      <VStack align="start" gap="2">
                        <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                          Required Documents ({entity.requirements.length}):
                        </Text>
                        <HStack gap="2" wrap="wrap">
                          {getRequirementNames(entity.requirements).map((req, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              colorScheme="blue"
                              size="sm"
                              px="2"
                              py="1"
                              borderRadius="md"
                            >
                              {req}
                            </Badge>
                          ))}
                        </HStack>
                      </VStack>
                    )}
                  </VStack>

                  {/* Actions */}
                  <HStack gap="3">
                    <Link href={`/entity-types/edit/${entity.id}`}>
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
                      onClick={() => handleDelete(entity.id)}
                      loading={deleting === entity.id}
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
        </Container>
      </Box>
    </Flex>
  );
}