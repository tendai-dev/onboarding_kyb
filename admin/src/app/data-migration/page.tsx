'use client';

import {
  Box,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import {
  Typography,
  Button,
  Tag,
  IconWrapper,
  Card,
  Switch,
  Dropdown,
  // Icons
  UploadIcon,
  DownloadIcon,
  DocumentIcon,
  SettingsIcon,
  SearchIcon,
  WarningIcon,
  AddIcon,
} from '@mukuru/mukuru-react-components';
import { Input } from '@/lib/mukuruComponentWrappers';
import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { useSidebar } from '../../contexts/SidebarContext';
import { SweetAlert } from '../../utils/sweetAlert';
import { migrationApi, MigrationJobDto } from '../../services/migrationApi';
import { checklistApiService } from '../../services/checklistApi';
import { entityConfigApiService, EntityType } from '../../services/entityConfigApi';

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
  const { condensed } = useSidebar();

  const [migrationJobs, setMigrationJobs] = useState<MigrationJob[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [migrationName, setMigrationName] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('');
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
      const mappedChecklists: Checklist[] = allChecklists.map((checklist) => {
        return {
          id: String(checklist.id || ''),
          name:
            (checklist.name ? String(checklist.name) : '') ||
            `${checklist.entityType ? String(checklist.entityType) : 'Unknown'} Checklist`,
          entityType: checklist.entityType ? String(checklist.entityType) : 'Unknown',
          description: checklist.description ? String(checklist.description) : '',
          lastUpdated: checklist.lastUpdated
            ? String(checklist.lastUpdated)
            : new Date().toISOString(),
          isActive: checklist.isActive ?? true,
          items: (Array.isArray(checklist.items) ? checklist.items : []).map((item) => {
            return {
              id: String(item.id || ''),
              description: item.description ? String(item.description) : '',
              isRequired: Boolean(item.isRequired),
              category: item.category ? String(item.category) : 'General',
            };
          }),
        };
      });
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
    const hasInProgressJobs = migrationJobs.some(
      (job) =>
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

  const getStatusColor = (status: MigrationJob['status']) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'orange';
      case 'IN_PROGRESS':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'FAILED':
        return 'red';
      case 'CANCELLED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatStatus = (status: MigrationJob['status']) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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
      await SweetAlert.warning(
        'Validation Error',
        'Please fill in all fields and select a file'
      );
      return;
    }

    setStartingMigration(true);
    try {
      await migrationApi.startMigration(
        migrationName,
        selectedEntityType,
        selectedFile,
        selectedFile.name
      );

      // Reload jobs to get the latest from backend (includes the new job)
      await loadMigrationJobs();

      // Clear form
      setSelectedFile(null);
      setMigrationName('');
      setSelectedEntityType('');

      await SweetAlert.success(
        'Migration Started',
        `Migration job "${migrationName}" has been started successfully.`
      );

      // Start polling if not already polling
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          loadMigrationJobs();
        }, 5000);
      }
    } catch (err) {
      console.error('Error starting migration:', err);
      await SweetAlert.error(
        'Migration Failed',
        err instanceof Error
          ? err.message
          : 'Failed to start migration. Please try again.'
      );
    } finally {
      setStartingMigration(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
        <AdminSidebar />
        <Box
          ml={condensed ? '72px' : '280px'}
          minH="100vh"
          bg="mukuru.background.light"
          transition="margin-left 0.3s ease"
        >
          <Flex justify="center" align="center" h="100vh">
            <VStack gap="16px">
              <Spinner size="lg" color="mukuru.buttons.primary" />
              <Typography color="mukuru.grey.medium" fontSize="14px">Loading migration data...</Typography>
            </VStack>
          </Flex>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="mukuru.background.light">
      <AdminSidebar />
      <Box
        ml={condensed ? '72px' : '280px'}
        minH="100vh"
        bg="mukuru.background.light"
        transition="margin-left 0.3s ease"
      >
        {/* Page Header */}
        <Box 
          px="32px" 
          py="24px" 
          bg="mukuru.cards.white" 
          borderBottom="1px solid" 
          borderColor="mukuru.grey.light"
          position="sticky"
          top="0"
          zIndex={10}
        >
          <Flex justify="space-between" align="center">
            <HStack gap="16px" align="center">
              <Box 
                p="12px" 
                bg="mukuru.buttons.primary"
                borderRadius="12px"
                boxShadow="0 4px 12px rgba(240, 84, 35, 0.25)"
              >
                <UploadIcon width="24" height="24" color="white" />
              </Box>
              <VStack align="start" gap="2px">
                <Typography fontSize="24px" fontWeight="700" color="mukuru.text.primary" lineHeight="1.2">
                  Data Migration
                </Typography>
                <Typography fontSize="14px" color="mukuru.grey.medium" fontWeight="400">
                  Import and migrate existing partner/customer data
                </Typography>
              </VStack>
            </HStack>

            <HStack gap="12px">
              <Button variant="secondary" size="sm" onClick={loadMigrationJobs}>
                <IconWrapper>
                  <SearchIcon width="16" height="16" />
                </IconWrapper>
                Refresh
              </Button>
              <Button variant="secondary" size="sm">
                <IconWrapper>
                  <SettingsIcon width="16" height="16" />
                </IconWrapper>
                Migration Settings
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Content */}
        <Box px="32px" py="24px">
          <VStack gap="24px" align="stretch">

            {/* Error Alert */}
            {error && (
              <Box
                bg="mukuru.text.error.dark"
                p="4"
                borderRadius="md"
                border="1px"
                borderColor="mukuru.text.error"
              >
                <HStack gap="2">
                  <IconWrapper>
                    <WarningIcon width="20" height="20" color="#E53E3E" />
                  </IconWrapper>
                  <VStack align="start" gap="1">
                    <Typography fontWeight="semibold" color="mukuru.text.error">
                      Error loading data
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.text.error">
                      {error}
                    </Typography>
                  </VStack>
                </HStack>
              </Box>
            )}

            {/* Migration Jobs */}
            <Box 
              bg="white" 
              borderRadius="16px" 
              border="1px solid" 
              borderColor="mukuru.grey.light"
              overflow="hidden"
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
            >
              <Flex 
                justify="space-between" 
                align="center" 
                p="20px"
                borderBottom="1px solid"
                borderColor="mukuru.grey.light"
                bg="white"
              >
                <HStack gap="12px">
                  <Box p="10px" borderRadius="10px" bg="#DBEAFE">
                    <DocumentIcon width="18" height="18" color="#2563EB" />
                  </Box>
                  <Typography fontSize="16px" fontWeight="600" color="mukuru.text.primary">
                    Migration Jobs
                  </Typography>
                </HStack>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    document
                      .getElementById('start-migration-section')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <IconWrapper>
                    <UploadIcon width="16" height="16" />
                  </IconWrapper>
                  New Migration
                </Button>
              </Flex>

              <Box p="20px" bg="white">
                {migrationJobs.length === 0 ? (
                  <Box
                    p="40px"
                    textAlign="center"
                    border="2px dashed"
                    borderColor="mukuru.grey.light"
                    borderRadius="12px"
                    bg="#FAFBFC"
                  >
                    <VStack gap="12px">
                      <Box p="16px" borderRadius="full" bg="#F1F5F9">
                        <UploadIcon width="32" height="32" color="#94A3B8" />
                      </Box>
                      <Typography fontSize="15px" color="mukuru.text.primary" fontWeight="600">
                        No migration jobs found
                      </Typography>
                      <Typography fontSize="13px" color="mukuru.grey.medium">
                        Start a new migration to import partner/customer data
                      </Typography>
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
                        bg="mukuru.background.light"
                      >
                        <VStack gap="3" align="stretch">
                          <Flex justify="space-between" align="start">
                            <VStack align="start" gap="1">
                              <Typography
                                fontSize="md"
                                fontWeight="semibold"
                                color="gray.800"
                              >
                                {job.name}
                              </Typography>
                              <Typography
                                fontSize="xs"
                                color="mukuru.grey.medium"
                                fontFamily="mono"
                              >
                                {job.id}
                              </Typography>
                              <Typography fontSize="sm" color="mukuru.text.primary">
                                {job.entityType} • {job.source}
                              </Typography>
                            </VStack>

                            <Tag
                              variant={
                                getStatusColor(job.status) === 'red'
                                  ? 'danger'
                                  : getStatusColor(job.status) === 'green'
                                    ? 'success'
                                    : getStatusColor(job.status) === 'blue'
                                      ? 'info'
                                      : getStatusColor(job.status) === 'orange'
                                        ? 'warning'
                                        : 'inactive'
                              }
                            >
                              {formatStatus(job.status)}
                            </Tag>
                          </Flex>

                          <VStack gap="2" align="stretch">
                            <HStack justify="space-between">
                              <Typography fontSize="sm" color="mukuru.text.primary">
                                Progress:
                              </Typography>
                              <Typography
                                fontSize="sm"
                                fontWeight="medium"
                                color="gray.800"
                              >
                                {job.progress}%
                              </Typography>
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
                            <Typography>Total: {job.totalRecords}</Typography>
                            <Typography>Processed: {job.processedRecords}</Typography>
                            <Typography color="red.600">
                              Failed: {job.failedRecords}
                            </Typography>
                          </HStack>

                          {job.errorMessage && (
                            <Box
                              bg="red.50"
                              p="3"
                              borderRadius="md"
                              border="1px"
                              borderColor="red.200"
                            >
                              <HStack gap="2">
                                <IconWrapper>
                                  <WarningIcon width="16" height="16" color="#E53E3E" />
                                </IconWrapper>
                                <Typography fontSize="sm" color="red.700">
                                  {job.errorMessage}
                                </Typography>
                              </HStack>
                            </Box>
                          )}

                          <HStack justify="space-between" fontSize="xs" color="gray.500">
                            <VStack align="start" gap="0">
                              <Typography fontWeight="medium">Started:</Typography>
                              <Typography>{formatDate(job.startTime)}</Typography>
                            </VStack>
                            {job.endTime && (
                              <VStack align="end" gap="0">
                                <Typography fontWeight="medium">Completed:</Typography>
                                <Typography>{formatDate(job.endTime)}</Typography>
                              </VStack>
                            )}
                          </HStack>
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            </Box>

            {/* New Migration Form */}
            <Box
              id="start-migration-section"
              bg="white"
              borderRadius="16px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              overflow="hidden"
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
            >
              <Box p="20px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="white">
                <HStack gap="12px">
                  <Box p="10px" borderRadius="10px" bg="#D1FAE5">
                    <UploadIcon width="18" height="18" color="#059669" />
                  </Box>
                  <Typography fontSize="16px" fontWeight="600" color="mukuru.text.primary">
                    Start New Migration
                  </Typography>
                </HStack>
              </Box>
              <Box p="20px" bg="white">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px">
                  <VStack gap="16px" align="stretch">
                    <Box>
                      <Typography
                        fontSize="11px"
                        fontWeight="600"
                        color="mukuru.grey.mediumDark"
                        mb="8px"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                      >
                        Migration Name
                      </Typography>
                      <Input
                        placeholder="Enter migration name"
                        value={migrationName}
                        onChange={(e) => setMigrationName(e.target.value)}
                      />
                    </Box>

                    <Box>
                      <Typography
                        fontSize="11px"
                        fontWeight="600"
                        color="mukuru.grey.mediumDark"
                        mb="8px"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                      >
                        Entity Type
                      </Typography>
                      <select
                        value={selectedEntityType}
                        onChange={(e) => setSelectedEntityType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: 'white',
                          color: '#1E293B',
                          fontSize: '14px',
                        }}
                        disabled={entityTypes.length === 0}
                      >
                        <option value="">
                          {entityTypes.length === 0
                            ? 'Loading entity types...'
                            : 'Select entity type'}
                        </option>
                        {entityTypes.map((entityType) => (
                          <option key={entityType.id} value={entityType.displayName}>
                            {entityType.displayName}
                          </option>
                        ))}
                      </select>
                      {entityTypes.length === 0 && (
                        <Typography fontSize="11px" color="mukuru.grey.mediumDark" mt="6px">
                          No entity types found. Please configure entity types first.
                        </Typography>
                      )}
                    </Box>
                  </VStack>

                  <VStack gap="16px" align="stretch">
                    <Box>
                      <Typography
                        fontSize="11px"
                        fontWeight="600"
                        color="mukuru.grey.mediumDark"
                        mb="8px"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                      >
                        Data File
                      </Typography>
                      <Box
                        p="12px"
                        borderRadius="8px"
                        border="1px solid" borderColor="mukuru.grey.light"
                        bg="mukuru.background.light"
                      >
                        <input
                          type="file"
                          accept=".csv,.xlsx,.pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          style={{
                            width: '100%',
                            fontSize: '14px',
                            color: '#1E293B',
                          }}
                        />
                      </Box>
                    </Box>

                    <Button
                      variant="primary"
                      onClick={handleFileUpload}
                      disabled={
                        !selectedFile ||
                        !migrationName ||
                        !selectedEntityType ||
                        startingMigration
                      }
                    >
                      <IconWrapper>
                        <UploadIcon width="16" height="16" />
                      </IconWrapper>
                      {startingMigration ? 'Starting...' : 'Start Migration'}
                    </Button>
                  </VStack>
                </SimpleGrid>
              </Box>
            </Box>

            {/* Checklists */}
            <Box 
              bg="white" 
              borderRadius="16px" 
              border="1px solid"
              borderColor="mukuru.grey.light"
              overflow="hidden"
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
            >
              <Flex 
                justify="space-between" 
                align="center" 
                p="20px"
                borderBottom="1px solid"
                borderColor="mukuru.grey.light"
                bg="white"
              >
                <HStack gap="12px">
                  <Box p="10px" borderRadius="10px" bg="#FEF3C7">
                    <DocumentIcon width="18" height="18" color="#D97706" />
                  </Box>
                  <Typography fontSize="16px" fontWeight="600" color="mukuru.text.primary">
                    Entity Checklists
                  </Typography>
                </HStack>
                <Button variant="secondary" size="sm">
                  <IconWrapper>
                    <DocumentIcon width="16" height="16" />
                  </IconWrapper>
                  Manage Checklists
                </Button>
              </Flex>
              <Box p="20px" bg="white">

                <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
                  {checklists.map((checklist) => (
                    <Box
                      key={checklist.id}
                      p="4"
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="lg"
                      bg="mukuru.background.light"
                    >
                      <VStack gap="3" align="stretch">
                        <Flex justify="space-between" align="start">
                          <VStack align="start" gap="1">
                            <Typography
                              fontSize="md"
                              fontWeight="semibold"
                              color="gray.800"
                            >
                              {checklist.name}
                            </Typography>
                            <Typography fontSize="sm" color="gray.600">
                              {checklist.description}
                            </Typography>
                          </VStack>

                          <Tag variant={checklist.isActive ? 'success' : 'inactive'}>
                            {checklist.isActive ? 'Active' : 'Inactive'}
                          </Tag>
                        </Flex>

                        <VStack gap="2" align="stretch">
                          <HStack justify="space-between">
                            <Typography fontSize="sm" color="gray.600">
                              Items:
                            </Typography>
                            <Typography
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.800"
                            >
                              {checklist.items.length} items
                            </Typography>
                          </HStack>

                          <HStack justify="space-between">
                            <Typography fontSize="sm" color="gray.600">
                              Required:
                            </Typography>
                            <Typography
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.800"
                            >
                              {checklist.items.filter((item) => item.isRequired).length}{' '}
                              required
                            </Typography>
                          </HStack>
                        </VStack>

                        <Typography fontSize="xs" color="gray.500">
                          Last updated:{' '}
                          {new Date(checklist.lastUpdated).toLocaleDateString()}
                        </Typography>

                        <HStack justify="space-between">
                          <Button size="sm" variant="secondary">
                            <HStack gap="2">
                              <IconWrapper>
                                <DocumentIcon width="16" height="16" />
                              </IconWrapper>
                              <Typography>View Details</Typography>
                            </HStack>
                          </Button>

                          <Button size="sm" variant="secondary">
                            <IconWrapper>
                              <DownloadIcon width="16" height="16" />
                            </IconWrapper>
                            <Typography>Export</Typography>
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}
