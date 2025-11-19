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
import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { migrationApiService, MigrationJobDto } from "../../services/migrationApi";

// MigrationJob interface matches MigrationJobDto from API

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
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [migrationName, setMigrationName] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState("");

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMigrationJobs([
        {
          id: "MIG-001",
          name: "Legacy Partner Data Import",
          status: "COMPLETED",
          progress: 100,
          totalRecords: 1500,
          processedRecords: 1500,
          failedRecords: 12,
          startTime: "2024-01-10T09:00:00Z",
          endTime: "2024-01-10T11:30:00Z",
          entityType: "Private Company",
          source: "Legacy Database"
        },
        {
          id: "MIG-002",
          name: "PDF Forms OCR Processing",
          status: "IN_PROGRESS",
          progress: 65,
          totalRecords: 800,
          processedRecords: 520,
          failedRecords: 8,
          startTime: "2024-01-15T14:00:00Z",
          entityType: "NPO",
          source: "PDF Files"
        },
        {
          id: "MIG-003",
          name: "Customer Data Migration",
          status: "FAILED",
          progress: 30,
          totalRecords: 2000,
          processedRecords: 600,
          failedRecords: 45,
          startTime: "2024-01-12T10:00:00Z",
          endTime: "2024-01-12T12:15:00Z",
          errorMessage: "Data validation failed: Invalid email formats detected",
          entityType: "All Types",
          source: "CRM System"
        }
      ]);

      setChecklists([
        {
          id: "CHECKLIST-001",
          name: "Private Company Checklist",
          entityType: "Private Company",
          description: "Comprehensive checklist for private company onboarding",
          lastUpdated: "2024-01-10",
          isActive: true,
          items: [
            { id: "ITEM-001", description: "Certificate of Incorporation", isRequired: true, category: "Legal Documents" },
            { id: "ITEM-002", description: "Memorandum of Association", isRequired: true, category: "Legal Documents" },
            { id: "ITEM-003", description: "Articles of Association", isRequired: true, category: "Legal Documents" },
            { id: "ITEM-004", description: "Tax Clearance Certificate", isRequired: true, category: "Tax Documents" },
            { id: "ITEM-005", description: "Bank Statements (3 months)", isRequired: true, category: "Financial Documents" }
          ]
        },
        {
          id: "CHECKLIST-002",
          name: "NPO Checklist",
          entityType: "NPO",
          description: "Non-profit organization onboarding checklist",
          lastUpdated: "2024-01-08",
          isActive: true,
          items: [
            { id: "ITEM-006", description: "NPO Registration Certificate", isRequired: true, category: "Legal Documents" },
            { id: "ITEM-007", description: "Constitution", isRequired: true, category: "Legal Documents" },
            { id: "ITEM-008", description: "Trust Deed", isRequired: false, category: "Legal Documents" },
            { id: "ITEM-009", description: "Financial Statements", isRequired: true, category: "Financial Documents" }
          ]
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'IN_PROGRESS': return 'blue';
      case 'COMPLETED': return 'green';
      case 'FAILED': return 'red';
      case 'CANCELLED': return 'gray';
      default: return 'gray';
    }
  };

  const handleFileUpload = () => {
    if (!selectedFile || !migrationName || !selectedEntityType) {
      alert('Please fill in all fields and select a file');
      return;
    }

    const newJob: MigrationJob = {
      id: `MIG-${Date.now()}`,
      name: migrationName,
      status: 'PENDING',
      progress: 0,
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      entityType: selectedEntityType,
      source: selectedFile.name
    };

    setMigrationJobs(prev => [newJob, ...prev]);
    setSelectedFile(null);
    setMigrationName("");
    setSelectedEntityType("");
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
              >
                <HStack gap="2">
                  <Icon as={FiSettings} />
                  <Text>Migration Settings</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>

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
                >
                  <HStack gap="2">
                    <Icon as={FiUpload} />
                    <Text>New Migration</Text>
                  </HStack>
                </Button>
              </Flex>

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
                          <Text fontSize="sm" color="gray.600">
                            {job.entityType} • {job.source}
                          </Text>
                        </VStack>
                        
                        <Badge
                          bg={`${getStatusColor(job.status)}.500`}
                          color="white"
                          variant="solid"
                          fontSize="xs"
                        >
                          {job.status.replace('_', ' ')}
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

                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.500">
                          Started: {job.startTime ? new Date(job.startTime).toLocaleString() : 'Not started'}
                        </Text>
                        {job.endTime && (
                          <Text fontSize="xs" color="gray.500">
                            Completed: {new Date(job.endTime).toLocaleString()}
                          </Text>
                        )}
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* New Migration Form */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
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
                        backgroundColor: "white"
                      }}
                    >
                      <option value="">Select entity type</option>
                      <option value="Private Company">Private Company</option>
                      <option value="Publicly Listed">Publicly Listed</option>
                      <option value="NPO">NPO</option>
                      <option value="Government">Government</option>
                      <option value="All Types">All Types</option>
                    </select>
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
                    disabled={!selectedFile || !migrationName || !selectedEntityType}
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
