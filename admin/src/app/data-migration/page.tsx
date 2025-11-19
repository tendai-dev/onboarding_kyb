"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Button,
  Input,
  SimpleGrid,
  Badge,
  Icon,
  Flex,
  Spinner,
  Textarea
} from "@chakra-ui/react";
import { 
  FiSearch, 
  FiFilter, 
  FiUpload, 
  FiDownload,
  FiFileText,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiSettings
} from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { SweetAlert } from "../../utils/sweetAlert";
import { migrationApi, MigrationJobDto } from "../../services/migrationApi";
import { checklistApiService } from "../../services/checklistApi";
import { entityConfigApiService, EntityType } from "../../services/entityConfigApi";

// MigrationJob matches MigrationJobDto from backend
type MigrationJob = MigrationJobDto;

interface Checklist {
  id: string;
  name: string;
  entityType: string;
  description: string;
  items: ChecklistItem[];
  lastUpdated: string;
  isActive: boolean;
}

interface ChecklistItem {
  id: string;
  description: string;
  isRequired: boolean;
  category: string;
}

export default function DataMigrationPage() {
  const [migrationJobs, setMigrationJobs] = useState<MigrationJob[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [migrationName, setMigrationName] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [startingMigration, setStartingMigration] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadMigrationJobs = async () => {
    try {
      setError(null);
      const jobs = await migrationApi.getMigrationJobs();
      setMigrationJobs(jobs);
    } catch (err) {
      console.error('Error loading migration jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load migration jobs');
    }
  };

  const loadChecklists = async () => {
    try {
      const allChecklists = await checklistApiService.getAllChecklists();
      // Map checklist DTOs to the format expected by the page
      const mappedChecklists: Checklist[] = allChecklists.map(checklist => ({
        id: checklist.id,
        name: checklist.name || `${checklist.entityType} Checklist`,
        entityType: checklist.entityType || 'Unknown',
        description: checklist.description || '',
        lastUpdated: checklist.lastUpdated || new Date().toISOString(),
        isActive: true,
        items: checklist.items.map(item => ({
          id: item.id,
          description: item.description || '',
          isRequired: item.isRequired,
          category: item.category || 'General'
        }))
      }));
      setChecklists(mappedChecklists);
    } catch (err) {
      console.error('Error loading checklists:', err);
      // Don't set error for checklists - it's not critical
    }
  };

  const loadEntityTypes = async () => {
    try {
      const types = await entityConfigApiService.getEntityTypes(false, false); // Only active, no requirements
      setEntityTypes(types);
    } catch (err) {
      console.error('Error loading entity types:', err);
      // Don't set error for entity types - it's not critical, will show empty dropdown
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadMigrationJobs(), loadChecklists(), loadEntityTypes()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Poll for in-progress jobs every 5 seconds
  useEffect(() => {
    const hasInProgressJobs = migrationJobs.some(job => 
      job.status.toUpperCase() === 'IN_PROGRESS' || 
      job.status.toUpperCase() === 'PENDING'
    );
    
    if (hasInProgressJobs) {
      pollingIntervalRef.current = setInterval(() => {
        loadMigrationJobs();
      }, 5000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [migrationJobs]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'orange';
      case 'IN_PROGRESS': return 'blue';
      case 'COMPLETED': return 'green';
      case 'FAILED': return 'red';
      case 'CANCELLED': return 'gray';
      default: return 'gray';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !migrationName || !selectedEntityType) {
      await SweetAlert.warning('Validation Error', 'Please fill in all fields and select a file');
      return;
    }

    setStartingMigration(true);
    try {
      const newJob = await migrationApi.startMigration(
        migrationName,
        selectedEntityType,
        selectedFile,
        selectedFile.name
      );

      // Reload jobs to get the latest from backend (includes the new job)
      await loadMigrationJobs();
      
      // Clear form
      setSelectedFile(null);
      setMigrationName("");
      setSelectedEntityType("");

      await SweetAlert.success('Migration Started', `Migration job "${migrationName}" has been started successfully.`);
      
      // Start polling if not already polling
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          loadMigrationJobs();
        }, 5000);
      }
    } catch (err) {
      console.error('Error starting migration:', err);
      await SweetAlert.error('Migration Failed', err instanceof Error ? err.message : 'Failed to start migration. Please try again.');
    } finally {
      setStartingMigration(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <AdminSidebar />
        <Box ml="240px" p="8" bg="gray.50" minH="100vh">
          <Flex justify="center" align="center" h="400px">
            <Spinner size="xl" color="orange.500" />
          </Flex>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <AdminSidebar />
      <Box ml="240px" p="8" bg="gray.50" minH="100vh">
      <Container maxW="7xl">
        <VStack gap="6" align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                Data Migration
              </Text>
              <Text color="gray.600">
                Import and migrate existing partner/customer data
              </Text>
            </VStack>
            
            <HStack gap="3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMigrationJobs}
              >
                <HStack gap="2">
                  <Icon as={FiSearch} />
                  <Text>Refresh</Text>
                </HStack>
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                <HStack gap="2">
                  <Icon as={FiSettings} />
                  <Text>Migration Settings</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>

          {/* Error Alert */}
          {error && (
            <Box bg="red.50" p="4" borderRadius="md" border="1px" borderColor="red.200">
              <HStack gap="2">
                <Icon as={FiAlertTriangle} boxSize="5" color="red.500" />
                <VStack align="start" gap="1">
                  <Text fontWeight="semibold" color="red.700">Error loading data</Text>
                  <Text fontSize="sm" color="red.600">{error}</Text>
                </VStack>
              </HStack>
            </Box>
          )}

          {/* Migration Jobs */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <VStack gap="4" align="stretch">
              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                  Migration Jobs
                </Text>
                <Button
                  bg="#FF6B35"
                  color="white"
                  _hover={{ bg: "#E55A2B" }}
                  _active={{ bg: "#CC4A1F" }}
                  size="sm"
                  onClick={() => {
                    // Scroll to the "Start New Migration" section
                    document.getElementById('start-migration-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <HStack gap="2">
                    <Icon as={FiUpload} />
                    <Text>New Migration</Text>
                  </HStack>
                </Button>
              </Flex>

              {migrationJobs.length === 0 ? (
                <Box
                  p="8"
                  textAlign="center"
                  border="2px dashed"
                  borderColor="gray.300"
                  borderRadius="lg"
                  bg="gray.50"
                >
                  <VStack gap="3">
                    <Icon as={FiUpload} boxSize="8" color="gray.400" />
                    <Text fontSize="md" color="gray.600" fontWeight="medium">
                      No migration jobs found
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Start a new migration to import partner/customer data
                    </Text>
                  </VStack>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
                  {migrationJobs.map((job) => (
                  <Box
                    key={job.id}
                    p="4"
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    bg="gray.50"
                  >
                    <VStack gap="3" align="stretch">
                      <Flex justify="space-between" align="start">
                        <VStack align="start" gap="1">
                          <Text fontSize="md" fontWeight="semibold" color="gray.800">
                            {job.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500" fontFamily="mono">
                            {job.id}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {job.entityType} • {job.source}
                          </Text>
                        </VStack>
                        
                        <Badge
                          bg={`${getStatusColor(job.status)}.500`}
                          color="white"
                          variant="solid"
                          fontSize="xs"
                          textTransform="capitalize"
                        >
                          {formatStatus(job.status)}
                        </Badge>
                      </Flex>

                      <VStack gap="2" align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Progress:</Text>
                          <Text fontSize="sm" fontWeight="medium" color="gray.800">
                            {job.progress}%
                          </Text>
                        </HStack>
                        
                        <Box
                          width="100%"
                          height="6px"
                          bg="gray.200"
                          borderRadius="full"
                          overflow="hidden"
                        >
                          <Box
                            width={`${job.progress}%`}
                            height="100%"
                            bg={`${getStatusColor(job.status)}.400`}
                            borderRadius="full"
                            transition="width 0.3s ease"
                          />
                        </Box>
                      </VStack>

                      <HStack justify="space-between" fontSize="sm" color="gray.600">
                        <Text>Total: {job.totalRecords}</Text>
                        <Text>Processed: {job.processedRecords}</Text>
                        <Text color="red.600">Failed: {job.failedRecords}</Text>
                      </HStack>

                      {job.errorMessage && (
                        <Box bg="red.50" p="3" borderRadius="md" border="1px" borderColor="red.200">
                          <HStack gap="2">
                            <Icon as={FiAlertTriangle} boxSize="4" color="red.500" />
                            <Text fontSize="sm" color="red.700">{job.errorMessage}</Text>
                          </HStack>
                        </Box>
                      )}

                      <HStack justify="space-between" fontSize="xs" color="gray.500">
                        <VStack align="start" gap="0">
                          <Text fontWeight="medium">Started:</Text>
                          <Text>{formatDate(job.startTime)}</Text>
                        </VStack>
                        {job.endTime && (
                          <VStack align="end" gap="0">
                            <Text fontWeight="medium">Completed:</Text>
                            <Text>{formatDate(job.endTime)}</Text>
                          </VStack>
                        )}
                      </HStack>
                    </VStack>
                  </Box>
                  ))}
                </SimpleGrid>
              )}
            </VStack>
          </Box>

          {/* New Migration Form */}
          <Box id="start-migration-section" bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <VStack gap="4" align="stretch">
              <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                Start New Migration
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                <VStack gap="3" align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                      Migration Name
                    </Text>
                    <Input
                      placeholder="Enter migration name"
                      value={migrationName}
                      onChange={(e) => setMigrationName(e.target.value)}
                    />
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                      Entity Type
                    </Text>
                    <select
                      value={selectedEntityType}
                      onChange={(e) => setSelectedEntityType(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "white",
                        color: "#1A202C"
                      }}
                      disabled={entityTypes.length === 0}
                    >
                      <option value="">
                        {entityTypes.length === 0 ? "Loading entity types..." : "Select entity type"}
                      </option>
                      {entityTypes.map((entityType) => (
                        <option key={entityType.id} value={entityType.displayName}>
                          {entityType.displayName}
                        </option>
                      ))}
                    </select>
                    {entityTypes.length === 0 && (
                      <Text fontSize="xs" color="gray.500" mt="1">
                        No entity types found. Please configure entity types first.
                      </Text>
                    )}
                  </Box>
                </VStack>
                
                <VStack gap="3" align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                      Data File
                    </Text>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "white"
                      }}
                    />
                  </Box>
                  
                  <Button
                    bg="#FF6B35"
                    color="white"
                    _hover={{ bg: "#E55A2B" }}
                    _active={{ bg: "#CC4A1F" }}
                    onClick={handleFileUpload}
                    disabled={!selectedFile || !migrationName || !selectedEntityType || startingMigration}
                    loading={startingMigration}
                    loadingText="Starting..."
                  >
                    <HStack gap="2">
                      <Icon as={FiUpload} />
                      <Text>Start Migration</Text>
                    </HStack>
                  </Button>
                </VStack>
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Checklists */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <VStack gap="4" align="stretch">
              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                  Entity Checklists
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <HStack gap="2">
                    <Icon as={FiFileText} />
                    <Text>Manage Checklists</Text>
                  </HStack>
                </Button>
              </Flex>

              <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
                {checklists.map((checklist) => (
                  <Box
                    key={checklist.id}
                    p="4"
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    bg="gray.50"
                  >
                    <VStack gap="3" align="stretch">
                      <Flex justify="space-between" align="start">
                        <VStack align="start" gap="1">
                          <Text fontSize="md" fontWeight="semibold" color="gray.800">
                            {checklist.name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {checklist.description}
                          </Text>
                        </VStack>
                        
                        <Badge
                          bg={checklist.isActive ? "green.500" : "gray.500"}
                          color="white"
                          variant="subtle"
                          fontSize="xs"
                        >
                          {checklist.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Flex>

                      <VStack gap="2" align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Items:</Text>
                          <Text fontSize="sm" fontWeight="medium" color="gray.800">
                            {checklist.items.length} items
                          </Text>
                        </HStack>
                        
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Required:</Text>
                          <Text fontSize="sm" fontWeight="medium" color="gray.800">
                            {checklist.items.filter(item => item.isRequired).length} required
                          </Text>
                        </HStack>
                      </VStack>

                      <Text fontSize="xs" color="gray.500">
                        Last updated: {new Date(checklist.lastUpdated).toLocaleDateString()}
                      </Text>

                      <HStack justify="space-between">
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <HStack gap="2">
                            <Icon as={FiFileText} />
                            <Text>View Details</Text>
                          </HStack>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <HStack gap="2">
                            <Icon as={FiDownload} />
                            <Text>Export</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>
        </VStack>
      </Container>
      </Box>
    </Box>
  );
}
