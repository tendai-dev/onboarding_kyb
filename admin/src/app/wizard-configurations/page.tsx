"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Flex,
  Spinner
} from "@chakra-ui/react";
import { Typography, Tag, Button, IconWrapper, AlertBar } from "@/lib/mukuruImports";
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
            <Typography color="gray.700" fontWeight="500">Loading wizard configurations...</Typography>
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
                <IconWrapper><FiSettings size={24} color="#FF6B35" /></IconWrapper>
                <VStack align="start" gap="1">
                  <Typography as="h1" fontSize="2xl" fontWeight="bold" color="gray.900">
                    Wizard Configurations
                  </Typography>
                  <Typography color="gray.700" fontSize="md" fontWeight="500">
                    Configure multi-step wizards for entity type applications
                  </Typography>
                </VStack>
              </HStack>
              <Link href="/wizard-configurations/create">
                <Button
                  variant="primary"
                  size="md"
                  bg="#FF6B35"
                  _hover={{ bg: "#E55A2B" }}
                  _active={{ bg: "#CC4A1F" }}
                >
                  <IconWrapper><FiPlus size={16} /></IconWrapper>
                  New Wizard Configuration
                </Button>
              </Link>
            </Flex>
          </Container>
        </Box>

        {/* Error Alert */}
        {error && (
          <Container maxW="8xl" py="4">
            <AlertBar
              status="error"
              title="Error!"
              description={error}
              icon={<IconWrapper><FiSettings size={20} /></IconWrapper>}
            />
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
                <IconWrapper><FiSettings size={48} color="#A0AEC0" /></IconWrapper>
                <Typography fontSize="lg" fontWeight="bold" color="gray.800">
                  No wizard configurations yet
                </Typography>
                <Typography color="gray.700" fontSize="md" fontWeight="500">
                  Get started by creating your first wizard configuration
                </Typography>
                <Link href="/wizard-configurations/create">
                  <Button
                    variant="primary"
                    size="md"
                    bg="#FF6B35"
                    _hover={{ bg: "#E55A2B" }}
                    _active={{ bg: "#CC4A1F" }}
                  >
                    <IconWrapper><FiPlus size={16} /></IconWrapper>
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
                        <Typography fontSize="lg" fontWeight="bold" color="gray.900">
                          {config.entityTypeDisplayName || config.entity_type_display_name || 'Unknown Entity Type'}
                        </Typography>
                        <Tag 
                          variant={config.isActive ? 'success' : 'inactive'}
                          style={config.isActive ? {
                            backgroundColor: '#22C55E',
                            color: '#FFFFFF',
                            fontWeight: '600',
                            border: 'none',
                            padding: '4px 12px',
                            fontSize: '12px',
                          } : {}}
                        >
                          {config.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                      </HStack>

                      {/* Steps Info */}
                      <HStack gap="4">
                        <HStack gap="2">
                          <IconWrapper><FiList size={16} color="#4A5568" /></IconWrapper>
                          <Typography fontSize="sm" fontWeight="medium" color="gray.700">
                            {config.steps.length} {config.steps.length === 1 ? 'Step' : 'Steps'}
                          </Typography>
                        </HStack>
                        <Typography fontSize="sm" fontWeight="medium" color="gray.600">
                          Created: <span style={{ color: '#2D3748', fontWeight: '600' }}>{new Date(config.createdAt || config.created_at || '').toLocaleDateString()}</span>
                        </Typography>
                        <Typography fontSize="sm" fontWeight="medium" color="gray.600">
                          Updated: <span style={{ color: '#2D3748', fontWeight: '600' }}>{new Date(config.updatedAt || config.updated_at || '').toLocaleDateString()}</span>
                        </Typography>
                      </HStack>

                      {/* Steps Preview */}
                      {config.steps.length > 0 && (
                        <VStack align="start" gap="2" w="100%">
                          <Typography fontSize="sm" fontWeight="bold" color="gray.800">
                            Steps:
                          </Typography>
                          <HStack gap="2" wrap="wrap">
                            {config.steps
                              .sort((a, b) => a.stepNumber - b.stepNumber)
                              .map((step) => (
                                <Tag
                                  key={step.id}
                                  variant="info"
                                  style={{
                                    backgroundColor: '#EDF2F7',
                                    color: '#2D3748',
                                    border: '1px solid #CBD5E0',
                                    fontWeight: '500',
                                    padding: '6px 12px',
                                  }}
                                >
                                  <span style={{ fontWeight: '700', color: '#FF6B35', marginRight: '4px' }}>
                                    {step.stepNumber}.
                                  </span>
                                  {step.title}
                                </Tag>
                              ))}
                          </HStack>
                        </VStack>
                      )}
                    </VStack>

                    {/* Actions */}
                    <HStack gap="3">
                      <Link href={`/wizard-configurations/edit/${config.id}`}>
                        <Box
                          as="button"
                          display="inline-flex"
                          alignItems="center"
                          gap="2"
                          px="4"
                          py="2"
                          bg="white"
                          border="1px solid"
                          borderColor="orange.500"
                          borderRadius="md"
                          fontWeight="600"
                          color="orange.500"
                          cursor="pointer"
                          _hover={{ 
                            bg: "orange.50", 
                            borderColor: "orange.600",
                            color: "orange.600"
                          }}
                          transition="all 0.2s"
                        >
                          <IconWrapper><FiEdit3 size={16} color="#FF6B35" /></IconWrapper>
                          <Typography as="span" color="orange.500" fontWeight="600">Edit</Typography>
                        </Box>
                      </Link>
                      <Box
                        as="button"
                        display="inline-flex"
                        alignItems="center"
                        gap="2"
                        px="4"
                        py="2"
                        bg="white"
                        border="1px solid"
                        borderColor="red.500"
                        borderRadius="md"
                        fontWeight="600"
                        color="red.500"
                        cursor={deleting === config.id ? "not-allowed" : "pointer"}
                        _hover={deleting === config.id ? {} : { 
                          bg: "red.50", 
                          borderColor: "red.600",
                          color: "red.600"
                        }}
                        transition="all 0.2s"
                        onClick={() => !deleting && handleDelete(config.id)}
                        opacity={deleting === config.id ? 0.6 : 1}
                      >
                        <IconWrapper><FiTrash2 size={16} color="#E53E3E" /></IconWrapper>
                        <Typography as="span" color="red.500" fontWeight="600">
                        {deleting === config.id ? "Deleting..." : "Delete"}
                        </Typography>
                      </Box>
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

