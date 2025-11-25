"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Checkbox,
  Badge,
  Flex,
  Icon,
  Tooltip,
  Menu,
  Spinner,
  SimpleGrid,
  useDisclosure,
  Separator
} from "@chakra-ui/react";
import { Search } from "@/lib/mukuruImports";
import { useState, useEffect, useMemo } from "react";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiMoreVertical,
  FiEye,
  FiSend,
  FiArchive,
  FiFlag,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
  FiUser,
  FiTag,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiBarChart,
  FiSettings,
  FiList
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

export interface Application {
  id: string;
  legalName: string;
  entityType: string;
  country: string;
  status: 'SUBMITTED' | 'IN PROGRESS' | 'RISK REVIEW' | 'COMPLETE' | 'INCOMPLETE' | 'DECLINED';
  created: string;
  updated: string;
  submittedBy: string;
  riskScore?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  tags: string[];
  documents: number;
  completionPercentage: number;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: any;
  colorScheme: string;
  requiresConfirmation: boolean;
  action: (selectedIds: string[]) => Promise<void>;
}

export interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'date' | 'text' | 'number';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface EnhancedAdminInterfaceProps {
  applications: Application[];
  onBulkAction: (action: BulkAction, selectedIds: string[]) => Promise<void>;
  onUpdateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
  onAssignApplications: (ids: string[], assigneeId: string) => Promise<void>;
  onTagApplications: (ids: string[], tags: string[]) => Promise<void>;
  onExportApplications: (ids: string[], format: string) => Promise<void>;
  currentUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export function EnhancedAdminInterface({
  applications,
  onBulkAction,
  onUpdateApplication,
  onAssignApplications,
  onTagApplications,
  onExportApplications,
  currentUser
}: EnhancedAdminInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "kanban">("table");
  const [isLoading, setIsLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  
  const { open: isBulkActionOpen, onOpen: onBulkActionOpen, onClose: onBulkActionClose } = useDisclosure();
  const { open: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  const { open: isTagOpen, onOpen: onTagOpen, onClose: onTagClose } = useDisclosure();
  const { open: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const { open: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'SUBMITTED', label: 'Submitted' },
        { value: 'IN PROGRESS', label: 'In Progress' },
        { value: 'RISK REVIEW', label: 'Risk Review' },
        { value: 'COMPLETE', label: 'Complete' },
        { value: 'INCOMPLETE', label: 'Incomplete' },
        { value: 'DECLINED', label: 'Declined' }
      ]
    },
    {
      id: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]
    },
    {
      id: 'country',
      label: 'Country',
      type: 'select',
      options: [
        { value: 'US', label: 'United States' },
        { value: 'UK', label: 'United Kingdom' },
        { value: 'ZA', label: 'South Africa' },
        { value: 'KE', label: 'Kenya' }
      ]
    }
  ];

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'assign',
      label: 'Assign',
      icon: FiUser,
      colorScheme: 'blue',
      requiresConfirmation: false,
      action: async (ids) => {
        onAssignOpen();
      }
    },
    {
      id: 'tag',
      label: 'Add Tags',
      icon: FiTag,
      colorScheme: 'orange',
      requiresConfirmation: false,
      action: async (ids) => {
        onTagOpen();
      }
    },
    {
      id: 'export',
      label: 'Export',
      icon: FiDownload,
      colorScheme: 'green',
      requiresConfirmation: false,
      action: async (ids) => {
        onExportOpen();
      }
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: FiArchive,
      colorScheme: 'gray',
      requiresConfirmation: true,
      action: async (ids) => {
        await onBulkAction(bulkActions.find(a => a.id === 'archive')!, ids);
      }
    }
  ];

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    let filtered = applications.filter(app => {
      const matchesSearch = !searchTerm || 
        app.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return app[key as keyof Application] === value;
      });

      return matchesSearch && matchesFilters;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Application] ?? '';
      const bValue = b[sortBy as keyof Application] ?? '';
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [applications, searchTerm, filters, sortBy, sortOrder]);

  const handleSelectApplication = (id: string) => {
    setSelectedApplications(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedApplications.size === 0) return;
    
    setBulkActionLoading(action.id);
    try {
      await action.action(Array.from(selectedApplications));
      setSelectedApplications(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setBulkActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'SUBMITTED': 'blue',
      'IN PROGRESS': 'orange',
      'RISK REVIEW': 'red',
      'COMPLETE': 'green',
      'INCOMPLETE': 'yellow',
      'DECLINED': 'gray'
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'gray',
      'normal': 'blue',
      'high': 'orange',
      'urgent': 'red'
    };
    return colors[priority] || 'gray';
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" p="6">
        <VStack gap="4" align="stretch">
          <HStack justify="space-between">
            <VStack align="start" gap="1">
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                Application Management
              </Text>
              <Text color="gray.600">
                {filteredApplications.length} of {applications.length} applications
              </Text>
            </VStack>
            
            <HStack gap="3">
              <Button variant="outline" onClick={onFilterOpen}>
                <Icon as={FiFilter} mr="2" />
                Filters
              </Button>
              <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
                <Icon as={viewMode === 'table' ? FiBarChart : FiList} mr="2" />
                {viewMode === 'table' ? 'Grid' : 'Table'}
              </Button>
            </HStack>
          </HStack>

          {/* Search and Actions */}
          <HStack gap="4">
            <Box flex="1" maxW="400px">
              <Search
                placeholder="Search applications..."
                onSearchChange={(query) => setSearchTerm(query)}
              />
            </Box>
            
            <HStack gap="2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '200px',
                  padding: '8px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid #E2E8F0'
                }}
              >
                <option value="updated">Sort by Updated</option>
                <option value="created">Sort by Created</option>
                <option value="legalName">Sort by Name</option>
                <option value="status">Sort by Status</option>
                <option value="priority">Sort by Priority</option>
                <option value="riskScore">Sort by Risk Score</option>
              </select>
              
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <Icon as={sortOrder === 'asc' ? FiChevronUp : FiChevronDown} />
              </Button>
            </HStack>
          </HStack>

          {/* Bulk Actions */}
          {selectedApplications.size > 0 && (
            <Box bg="orange.50" p="4" borderRadius="md" border="1px" borderColor="orange.200">
              <HStack justify="space-between">
                <Text fontWeight="medium" color="orange.800">
                  {selectedApplications.size} application(s) selected
                </Text>
                <HStack gap="2">
                  {bulkActions.map((action) => (
                    <Button
                      key={action.id}
                      size="sm"
                      colorScheme={action.colorScheme}
                      variant="outline"
                      onClick={() => handleBulkAction(action)}
                      loading={bulkActionLoading === action.id}
                      loadingText="Processing..."
                    >
                      <Icon as={action.icon} mr="1" />
                      {action.label}
                    </Button>
                  ))}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedApplications(new Set())}>
                    <Icon as={FiX} />
                  </Button>
                </HStack>
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Main Content */}
      <Box p="6">
        {viewMode === 'table' ? (
          <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
            {/* Table Header */}
            <Flex
              bg="gray.50"
              px="4"
              py="3"
              borderBottom="1px"
              borderColor="gray.200"
              fontWeight="semibold"
              fontSize="sm"
              color="gray.700"
              align="center"
            >
              <Box width="40px">
                <Checkbox.Root
                  checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                  onCheckedChange={(details) => {
                    if (details.checked) {
                      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
                    } else {
                      setSelectedApplications(new Set());
                    }
                  }}
                >
                  <Checkbox.Indicator />
                </Checkbox.Root>
              </Box>
              <Box flex="1" minWidth="200px">Application</Box>
              <Box width="120px">Status</Box>
              <Box width="100px">Priority</Box>
              <Box width="120px">Assigned To</Box>
              <Box width="120px">Progress</Box>
              <Box width="100px">Updated</Box>
              <Box width="80px">Actions</Box>
            </Flex>

            {/* Table Body */}
            <Box maxHeight="600px" overflowY="auto">
              {filteredApplications.map((application) => (
                <Flex
                  key={application.id}
                  px="4"
                  py="3"
                  borderBottom="1px"
                  borderColor="gray.200"
                  _hover={{ bg: 'gray.50' }}
                  align="center"
                >
                  <Box width="40px">
                    <Checkbox.Root
                      checked={selectedApplications.has(application.id)}
                      onCheckedChange={(details) => handleSelectApplication(application.id)}
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Box>
                  <Box flex="1" minWidth="200px">
                    <VStack align="start" gap="1">
                      <Text fontWeight="medium" color="gray.800">
                        {application.legalName}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {application.entityType} • {application.country}
                      </Text>
                      <HStack gap="1">
                        {application.tags.map(tag => (
                          <Badge key={tag} size="sm" variant="outline" colorScheme="blue">
                            {tag}
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  </Box>
                  <Box width="120px">
                    <Badge colorScheme={getStatusColor(application.status)} variant="solid">
                      {application.status}
                    </Badge>
                  </Box>
                  <Box width="100px">
                    <Badge colorScheme={getPriorityColor(application.priority)} variant="subtle">
                      {application.priority}
                    </Badge>
                  </Box>
                  <Box width="120px">
                    <Text fontSize="sm" color="gray.600">
                      {application.assignedTo || 'Unassigned'}
                    </Text>
                  </Box>
                  <Box width="120px">
                    <VStack align="start" gap="1">
                      <Box
                        width="100px"
                        height="8px"
                        bg="gray.200"
                        borderRadius="full"
                        overflow="hidden"
                      >
                        <Box
                          width={`${application.completionPercentage}%`}
                          height="100%"
                          bg="orange.500"
                          transition="width 0.3s"
                        />
                      </Box>
                      <Text fontSize="xs" color="gray.500">
                        {application.completionPercentage}%
                      </Text>
                    </VStack>
                  </Box>
                  <Box width="100px">
                    <Text fontSize="sm" color="gray.600">
                      {new Date(application.updated).toLocaleDateString()}
                    </Text>
                  </Box>
                  <Box width="80px">
                    <Button size="sm" variant="ghost">
                      <Icon as={FiMoreVertical} />
                    </Button>
                  </Box>
                </Flex>
              ))}
            </Box>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
            {filteredApplications.map((application) => (
              <MotionBox
                key={application.id}
                bg="white"
                borderRadius="lg"
                boxShadow="sm"
                p="4"
                border="1px"
                borderColor="gray.200"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <VStack align="stretch" gap="3">
                  <HStack justify="space-between">
                    <Checkbox.Root
                      checked={selectedApplications.has(application.id)}
                      onCheckedChange={(details) => handleSelectApplication(application.id)}
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                    <Badge colorScheme={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </HStack>
                  
                  <VStack align="start" gap="1">
                    <Text fontWeight="bold" fontSize="lg" color="gray.800">
                      {application.legalName}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {application.entityType} • {application.country}
                    </Text>
                  </VStack>

                  <Box
                    width="100%"
                    height="8px"
                    bg="gray.200"
                    borderRadius="full"
                    overflow="hidden"
                  >
                    <Box
                      width={`${application.completionPercentage}%`}
                      height="100%"
                      bg="orange.500"
                      transition="width 0.3s"
                    />
                  </Box>

                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.500">
                      {application.completionPercentage}% Complete
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(application.updated).toLocaleDateString()}
                    </Text>
                  </HStack>
                </VStack>
              </MotionBox>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Filter Modal */}
      {isFilterOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={onFilterClose}
        >
          <Box
            bg="white"
            borderRadius="md"
            maxW="md"
            w="90%"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p="4" borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">Filters</Text>
                <Button variant="ghost" size="sm" onClick={onFilterClose}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
              <VStack gap="4" align="stretch">
                {filterOptions.map((option) => (
                  <Box key={option.id}>
                    <Text fontSize="sm" fontWeight="medium" mb="2">{option.label}</Text>
                    {option.type === 'select' && (
                      <select
                        value={filters[option.id] || ''}
                        onChange={(e: any) => setFilters(prev => ({ ...prev, [option.id]: e.target.value || null }))}
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '14px',
                          borderRadius: '4px',
                          border: '1px solid #E2E8F0'
                        }}
                      >
                        <option value="">Select {option.label.toLowerCase()}</option>
                        {option.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {option.type === 'text' && (
                      <Input
                        placeholder={option.placeholder}
                        value={filters[option.id] || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, [option.id]: e.target.value || null }))}
                      />
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack justify="flex-end" gap="3">
                <Button variant="outline" onClick={() => setFilters({})}>
                  Clear
                </Button>
                <Button colorScheme="blue" onClick={onFilterClose}>
                  Apply
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}

      {/* Assign Modal */}
      {isAssignOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={onAssignClose}
        >
          <Box
            bg="white"
            borderRadius="md"
            maxW="md"
            w="90%"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p="4" borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">Assign to</Text>
                <Button variant="ghost" size="sm" onClick={onAssignClose}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
              <VStack gap="4" align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb="2">Assign to</Text>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <option value="">Select assignee...</option>
                    <option value="admin1">John Smith</option>
                    <option value="admin2">Jane Doe</option>
                    <option value="admin3">Mike Johnson</option>
                  </select>
                </Box>
              </VStack>
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack justify="flex-end" gap="3">
                <Button variant="outline" onClick={onAssignClose}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={onAssignClose}>
                  Assign
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}

      {/* Export Modal */}
      {isExportOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={onExportClose}
        >
          <Box
            bg="white"
            borderRadius="md"
            maxW="md"
            w="90%"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p="4" borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">Export Applications</Text>
                <Button variant="ghost" size="sm" onClick={onExportClose}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
              <VStack gap="4" align="stretch">
                <Text fontSize="sm" color="gray.600">
                  Export {selectedApplications.size} selected applications
                </Text>
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb="2">Export Format</Text>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                    <option value="pdf">PDF</option>
                  </select>
                </Box>
              </VStack>
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack justify="flex-end" gap="3">
                <Button variant="outline" onClick={onExportClose}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={onExportClose}>
                  Export
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}

      {/* Tag Modal */}
      {isTagOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={onTagClose}
        >
          <Box
            bg="white"
            borderRadius="md"
            maxW="md"
            w="90%"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p="4" borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">Add Tags</Text>
                <Button variant="ghost" size="sm" onClick={onTagClose}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
              <VStack gap="4" align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb="2">Tags</Text>
                  <Input placeholder="Enter tags separated by commas..." />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb="2">Existing Tags</Text>
                  <HStack gap="2" flexWrap="wrap">
                    <Badge>High Priority</Badge>
                    <Badge>Review Needed</Badge>
                    <Badge>Follow Up</Badge>
                  </HStack>
                </Box>
              </VStack>
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack justify="flex-end" gap="3">
                <Button variant="outline" onClick={onTagClose}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={onTagClose}>
                  Add Tags
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
