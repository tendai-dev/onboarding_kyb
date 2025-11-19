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
  FiPlus, 
  FiEdit,
  FiTrash2,
  FiCheckSquare,
  FiFileText,
  FiDownload,
  FiUpload,
  FiSettings
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { SweetAlert } from "../../utils/sweetAlert";
import AdminSidebar from "../../components/AdminSidebar";
import { checklistApiService } from "../../services/checklistApi";

interface Checklist {
  id: string;
  name: string;
  entityType: string;
  description: string;
  items: ChecklistItem[];
  lastUpdated: string;
  isActive: boolean;
  version: string;
  createdBy: string;
}

interface ChecklistItem {
  id: string;
  description: string;
  isRequired: boolean;
  category: string;
  order: number;
  guidelines?: string;
}

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newItem, setNewItem] = useState({
    description: "",
    category: "",
    isRequired: false,
    guidelines: ""
  });

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checklistApiService.getAllChecklists();
      setChecklists(data);
    } catch (err) {
      console.error("Failed to load checklists:", err);
      setError(err instanceof Error ? err.message : "Failed to load checklists. Please ensure the backend services are running.");
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'Private Company': return 'blue';
      case 'NPO': return 'green';
      case 'Government': return 'purple';
      case 'Publicly Listed': return 'orange';
      default: return 'gray';
    }
  };

  const filteredChecklists = checklists.filter(checklist => {
    const matchesSearch = checklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         checklist.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = entityFilter === "ALL" || checklist.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const addNewItem = async () => {
    if (!newItem.description || !newItem.category) {
      await SweetAlert.warning('Validation Error', 'Please fill in description and category');
      return;
    }

    if (!selectedChecklist) return;

    const item: ChecklistItem = {
      id: `ITEM-${Date.now()}`,
      description: newItem.description,
      category: newItem.category,
      isRequired: newItem.isRequired,
      order: selectedChecklist.items.length + 1,
      guidelines: newItem.guidelines
    };

    setChecklists(prev => prev.map(checklist => 
      checklist.id === selectedChecklist.id 
        ? {
            ...checklist,
            items: [...checklist.items, item],
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        : checklist
    ));

    setSelectedChecklist(prev => prev ? {
      ...prev,
      items: [...prev.items, item],
      lastUpdated: new Date().toISOString().split('T')[0]
    } : null);

    setNewItem({ description: "", category: "", isRequired: false, guidelines: "" });
  };

  const removeItem = (itemId: string) => {
    if (!selectedChecklist) return;

    setChecklists(prev => prev.map(checklist => 
      checklist.id === selectedChecklist.id 
        ? {
            ...checklist,
            items: checklist.items.filter(item => item.id !== itemId),
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        : checklist
    ));

    setSelectedChecklist(prev => prev ? {
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
      lastUpdated: new Date().toISOString().split('T')[0]
    } : null);
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
                Checklists
              </Text>
              <Text color="gray.600">
                Manage entity-specific onboarding checklists
              </Text>
            </VStack>
            
            <HStack gap="3">
              <Button
                bg="#FF6B35"
                color="white"
                _hover={{ bg: "#E55A2B" }}
                _active={{ bg: "#CC4A1F" }}
                size="sm"
              >
                <HStack gap="2">
                  <Icon as={FiPlus} />
                  <Text>New Checklist</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>

          {/* Search and Filters */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <HStack gap="4">
              <Box flex="1">
                <HStack>
                  <Icon as={FiSearch} color="gray.400" />
                  <Input
                    placeholder="Search checklists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    border="none"
                    _focus={{ boxShadow: "none" }}
                  />
                </HStack>
              </Box>
              
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "white"
                }}
              >
                <option value="ALL">All Entity Types</option>
                <option value="Private Company">Private Company</option>
                <option value="NPO">NPO</option>
                <option value="Government">Government</option>
                <option value="Publicly Listed">Publicly Listed</option>
              </select>
            </HStack>
          </Box>

          {/* Error Message */}
          {error && (
            <Box bg="red.50" border="1px" borderColor="red.200" borderRadius="lg" p="4" mb="4">
              <Text color="red.800" fontWeight="medium">Error loading checklists</Text>
              <Text color="red.600" fontSize="sm" mt="1">{error}</Text>
            </Box>
          )}

          <Flex gap="6" height="600px">
            {/* Checklists List */}
            <Box flex="1" bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
              <Box p="4" borderBottom="1px" borderColor="gray.200">
                <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                  Available Checklists
                </Text>
              </Box>
              
              <Box overflowY="auto" height="calc(100% - 60px)">
                {filteredChecklists.map((checklist) => (
                  <Box
                    key={checklist.id}
                    p="4"
                    borderBottom="1px"
                    borderColor="gray.100"
                    cursor="pointer"
                    bg={checklist.id === selectedChecklist?.id ? "orange.50" : "white"}
                    _hover={{ bg: checklist.id === selectedChecklist?.id ? "orange.50" : "gray.50" }}
                    onClick={() => setSelectedChecklist(checklist)}
                  >
                    <VStack gap="2" align="stretch">
                      <Flex justify="space-between" align="start">
                        <VStack align="start" gap="1">
                          <Text fontSize="md" fontWeight="semibold" color="gray.800">
                            {checklist.name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {checklist.description}
                          </Text>
                        </VStack>
                        
                        <VStack gap="1" align="end">
                          <Badge
                            colorScheme={getEntityTypeColor(checklist.entityType)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {checklist.entityType}
                          </Badge>
                          <Badge
                            colorScheme={checklist.isActive ? "green" : "gray"}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {checklist.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </VStack>
                      </Flex>
                      
                      <HStack justify="space-between" fontSize="sm" color="gray.600">
                        <Text>Items: {checklist.items.length}</Text>
                        <Text>Required: {checklist.items.filter(item => item.isRequired).length}</Text>
                        <Text>Version: {checklist.version}</Text>
                      </HStack>
                      
                      <Text fontSize="xs" color="gray.500">
                        Created by {checklist.createdBy} • Updated {new Date(checklist.lastUpdated).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Checklist Details */}
            <Box flex="1" bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
              {selectedChecklist ? (
                <VStack gap="0" align="stretch" height="100%">
                  {/* Header */}
                  <Box p="4" borderBottom="1px" borderColor="gray.200" bg="gray.50">
                    <VStack gap="2" align="stretch">
                      <Flex justify="space-between" align="start">
                        <VStack align="start" gap="1">
                          <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                            {selectedChecklist.name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {selectedChecklist.description}
                          </Text>
                        </VStack>
                        
                        <HStack gap="2">
                          <Badge
                            colorScheme={getEntityTypeColor(selectedChecklist.entityType)}
                            variant="solid"
                            fontSize="xs"
                          >
                            {selectedChecklist.entityType}
                          </Badge>
                          <Badge
                            colorScheme={selectedChecklist.isActive ? "green" : "gray"}
                            variant="solid"
                            fontSize="xs"
                          >
                            {selectedChecklist.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </HStack>
                      </Flex>
                      
                      <HStack gap="4" fontSize="sm" color="gray.600">
                        <Text>Version: {selectedChecklist.version}</Text>
                        <Text>Items: {selectedChecklist.items.length}</Text>
                        <Text>Required: {selectedChecklist.items.filter(item => item.isRequired).length}</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Checklist Items */}
                  <Box p="4" flex="1" overflowY="auto">
                    <VStack gap="3" align="stretch">
                      {selectedChecklist.items.map((item) => (
                        <Box
                          key={item.id}
                          p="3"
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          bg="gray.50"
                        >
                          <VStack gap="2" align="stretch">
                            <Flex justify="space-between" align="start">
                              <HStack gap="2">
                                <Icon as={FiCheckSquare} boxSize="4" color={item.isRequired ? "red.500" : "gray.400"} />
                                <Text fontSize="sm" fontWeight="medium" color="gray.800">
                                  {item.description}
                                </Text>
                              </HStack>
                              
                              <HStack gap="1">
                                <Badge
                                  colorScheme="blue"
                                  variant="subtle"
                                  fontSize="xs"
                                >
                                  {item.category}
                                </Badge>
                                {item.isRequired && (
                                  <Badge
                                    colorScheme="red"
                                    variant="subtle"
                                    fontSize="xs"
                                  >
                                    Required
                                  </Badge>
                                )}
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Icon as={FiTrash2} boxSize="3" />
                                </Button>
                              </HStack>
                            </Flex>
                            
                            {item.guidelines && (
                              <Text fontSize="xs" color="gray.600" pl="6">
                                {item.guidelines}
                              </Text>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>

                  {/* Add New Item */}
                  <Box p="4" borderTop="1px" borderColor="gray.200" bg="gray.50">
                    <VStack gap="3" align="stretch">
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        Add New Item:
                      </Text>
                      
                      <Input
                        placeholder="Item description"
                        value={newItem.description}
                        onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        size="sm"
                      />
                      
                      <HStack gap="2">
                        <Input
                          placeholder="Category"
                          value={newItem.category}
                          onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                          size="sm"
                          flex="1"
                        />
                        
                        <HStack gap="2">
                          <Box
                            as="button"
                            w="4"
                            h="4"
                            bg={newItem.isRequired ? "#FF6B35" : "white"}
                            border="2px"
                            borderColor={newItem.isRequired ? "#FF6B35" : "gray.300"}
                            borderRadius="sm"
                            position="relative"
                            transition="all 0.2s"
                            onClick={() => setNewItem(prev => ({ ...prev, isRequired: !prev.isRequired }))}
                          >
                            {newItem.isRequired && (
                              <Icon as={FiCheckSquare} boxSize="3" color="white" position="absolute" top="-0.5" left="-0.5" />
                            )}
                          </Box>
                          <Text fontSize="sm" color="gray.700">Required</Text>
                        </HStack>
                      </HStack>
                      
                      <Textarea
                        placeholder="Guidelines (optional)"
                        value={newItem.guidelines}
                        onChange={(e) => setNewItem(prev => ({ ...prev, guidelines: e.target.value }))}
                        size="sm"
                        rows={2}
                        resize="none"
                      />
                      
                      <HStack justify="space-between">
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <HStack gap="2">
                            <Icon as={FiDownload} />
                            <Text>Export Checklist</Text>
                          </HStack>
                        </Button>
                        
                        <Button
                          size="sm"
                          bg="#FF6B35"
                          color="white"
                          _hover={{ bg: "#E55A2B" }}
                          _active={{ bg: "#CC4A1F" }}
                          onClick={addNewItem}
                        >
                          <HStack gap="2">
                            <Icon as={FiPlus} />
                            <Text>Add Item</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              ) : (
                <Flex justify="center" align="center" height="100%">
                  <VStack gap="4">
                    <Icon as={FiFileText} boxSize="12" color="gray.400" />
                    <Text fontSize="lg" color="gray.600">
                      Select a checklist to view details
                    </Text>
                  </VStack>
                </Flex>
              )}
            </Box>
          </Flex>
        </VStack>
      </Container>
      </Box>
    </Box>
  );
}
