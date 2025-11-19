"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Flex,
  Button,
  Spinner,
  Input
} from "@chakra-ui/react";
import { FiCheckSquare, FiPlus, FiEdit3, FiTrash2, FiSearch, FiX } from "react-icons/fi";
import AdminSidebar from "../../components/AdminSidebar";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { entityConfigApiService, Requirement } from "../../services/entityConfigApi";
import { SweetAlert } from "../../utils/sweetAlert";

export default function KYBRequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await entityConfigApiService.getRequirements(false);
      setRequirements(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load requirements';
      setError(errorMessage);
      console.error('Error loading requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await SweetAlert.confirm(
      'Delete Requirement',
      'Are you sure you want to delete this requirement? This action cannot be undone.',
      'Yes, delete it!',
      'Cancel'
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeleting(id);
      SweetAlert.loading('Deleting...', 'Please wait while we delete the requirement.');
      
      await entityConfigApiService.deleteRequirement(id);
      setRequirements(prev => prev.filter(req => req.id !== id));
      
      SweetAlert.close();
      SweetAlert.success('Deleted!', 'Requirement has been deleted successfully.');
    } catch (err) {
      SweetAlert.close();
      SweetAlert.error('Delete Failed', 'Failed to delete requirement. Please try again.');
      console.error('Error deleting requirement:', err);
    } finally {
      setDeleting(null);
    }
  };

  const filteredRequirements = useMemo(() => {
    return requirements.filter(requirement => {
      // Status filter
      if (statusFilter !== "all") {
        const isActive = statusFilter === "active";
        if (requirement.isActive !== isActive) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          requirement.displayName.toLowerCase().includes(query) ||
          requirement.code.toLowerCase().includes(query) ||
          requirement.description?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [requirements, searchQuery, statusFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  // Design system tokens
  const tokens = {
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "12px",
      lg: "16px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "32px",
    },
    colors: {
      text: {
        primary: "#111827",
        secondary: "#374151",
        tertiary: "#6B7280",
      },
      border: {
        default: "#E5E7EB",
        hover: "#D1D5DB",
        focus: "#3B82F6",
      },
      bg: {
        white: "#FFFFFF",
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
        },
      },
    },
    typography: {
      heading: {
        size: "28px",
        weight: "600",
        lineHeight: "1.2",
        letterSpacing: "-0.02em",
      },
      section: {
        size: "16px",
        weight: "600",
        lineHeight: "1.4",
        letterSpacing: "-0.01em",
      },
      label: {
        size: "13px",
        weight: "500",
      },
      body: {
        size: "14px",
        weight: "400",
      },
      helper: {
        size: "12px",
        weight: "400",
      },
    },
    form: {
      inputHeight: "40px",
      borderRadius: "8px",
      cardRadius: "12px",
      cardPadding: "16px",
      fieldGap: "8px",
      labelInputGap: "4px",
      helperGap: "2px",
      sectionGap: "16px",
      fieldVerticalPadding: "4px",
    },
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50" overflow="hidden">
        <AdminSidebar />
        <Box 
          flex="1" 
          ml="224px" 
          h="100vh"
          display="flex" 
          alignItems="center" 
          justifyContent="center"
        >
          <VStack gap={tokens.spacing.lg}>
            <Spinner size="xl" color="orange.500" />
            <Text color={tokens.colors.text.secondary} fontWeight="500">
              Loading requirements...
            </Text>
          </VStack>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50" overflow="hidden">
      <AdminSidebar />
      
      {/* Main Content Area with Scroll */}
      <Box 
        flex="1" 
        ml="224px" 
        w="calc(100% - 224px)" 
        h="100vh"
        overflowY="auto"
        overflowX="hidden"
      >
        {/* Centered Container */}
        <Flex
          w="100%"
          justify="center"
          px={tokens.spacing["3xl"]}
          py={tokens.spacing.lg}
        >
          <Box 
            w="100%" 
            maxW="1200px"
            textAlign="left"
          >
            {/* Header */}
            <Box mb={tokens.spacing.md} w="100%">
              <HStack justify="space-between" align="flex-start" w="100%" mb={tokens.spacing.sm}>
                <Box flex="1">
                  <Text 
                    fontSize={tokens.typography.heading.size}
                    fontWeight={tokens.typography.heading.weight}
                    color={tokens.colors.text.primary}
                    mb={tokens.spacing.xs}
                    lineHeight={tokens.typography.heading.lineHeight}
                    letterSpacing={tokens.typography.heading.letterSpacing}
                  >
                    KYB Requirements
                  </Text>
                  <Text 
                    fontSize={tokens.typography.body.size}
                    color={tokens.colors.text.tertiary}
                    lineHeight="1.5"
                    fontWeight={tokens.typography.body.weight}
                  >
                    Define and manage requirements for business verification
                  </Text>
                </Box>
                <Link href="/requirements/create">
                  <Button 
                    colorScheme="blue" 
                    size="md"
                    h={tokens.form.inputHeight}
                    px={tokens.spacing["2xl"]}
                    fontSize={tokens.typography.body.size}
                    fontWeight={tokens.typography.label.weight}
                    borderRadius={tokens.form.borderRadius}
                  >
                    <HStack gap={tokens.spacing.sm}>
                      <FiPlus size={16} />
                      <Text>New Requirement</Text>
                    </HStack>
                  </Button>
                </Link>
              </HStack>
            </Box>

            {/* Form Content Container */}
            <VStack 
              gap={tokens.spacing.md} 
              align="stretch" 
              w="100%"
            >
              {/* Search and Filter Card */}
              <Box 
                bg={tokens.colors.bg.white}
                borderRadius={tokens.form.cardRadius}
                border="1px"
                borderColor={tokens.colors.border.default}
                boxShadow="0 1px 3px rgba(0,0,0,0.1)"
                p={tokens.form.cardPadding}
                w="100%"
              >
                <VStack align="stretch" gap={tokens.spacing.sm} w="100%">
                  <Text 
                    fontSize={tokens.typography.section.size}
                    fontWeight={tokens.typography.section.weight}
                    color={tokens.colors.text.primary}
                    lineHeight={tokens.typography.section.lineHeight}
                    letterSpacing={tokens.typography.section.letterSpacing}
                    mb={tokens.spacing.xs}
                    textAlign="left"
                    w="100%"
                  >
                    Search & Filter
                  </Text>
                  
                  <HStack gap={tokens.spacing.md} align="flex-end" w="100%">
                    <Box flex="1">
                      <Text 
                        fontSize={tokens.typography.label.size}
                        fontWeight={tokens.typography.label.weight}
                        color={tokens.colors.text.secondary}
                        mb={tokens.form.labelInputGap}
                        textAlign="left"
                      >
                        Search requirements
                      </Text>
                      <Box position="relative">
                        <FiSearch 
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9CA3AF',
                            zIndex: 1,
                            pointerEvents: 'none'
                          }}
                        />
                        <Input
                          placeholder="Search by name, code, description, or type..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          pl="40px"
                          bg={tokens.colors.bg.gray[50]}
                          border="1px"
                          borderColor={tokens.colors.border.default}
                          color={tokens.colors.text.primary}
                          h={tokens.form.inputHeight}
                          fontSize={tokens.typography.body.size}
                          borderRadius={tokens.form.borderRadius}
                          _placeholder={{ color: "#9CA3AF" }}
                          _focus={{
                            borderColor: tokens.colors.border.focus,
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
                          }}
                          _hover={{ borderColor: tokens.colors.border.hover }}
                          w="100%"
                        />
                      </Box>
                    </Box>

                    <Box minW="200px">
                      <Text 
                        fontSize={tokens.typography.label.size}
                        fontWeight={tokens.typography.label.weight}
                        color={tokens.colors.text.secondary}
                        mb={tokens.form.labelInputGap}
                        textAlign="left"
                      >
                        Status Filter
                      </Text>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: tokens.form.borderRadius,
                          border: `1px solid ${tokens.colors.border.default}`,
                          backgroundColor: tokens.colors.bg.gray[50],
                          fontSize: tokens.typography.body.size,
                          height: tokens.form.inputHeight,
                          color: tokens.colors.text.primary
                        }}
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </Box>

                    {(searchQuery || statusFilter !== "all") && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        size="md"
                        h={tokens.form.inputHeight}
                        borderColor={tokens.colors.border.default}
                        borderRadius={tokens.form.borderRadius}
                        _hover={{ 
                          bg: tokens.colors.bg.gray[50], 
                          borderColor: tokens.colors.border.hover 
                        }}
                      >
                        <HStack gap={tokens.spacing.xs}>
                          <FiX size={16} />
                          <Text fontSize={tokens.typography.body.size}>Clear</Text>
                        </HStack>
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </Box>

              {/* Results Summary */}
              <HStack justify="space-between" align="center" w="100%">
                <Text 
                  fontSize={tokens.typography.section.size}
                  fontWeight={tokens.typography.section.weight}
                  color={tokens.colors.text.primary}
                >
                  Requirements ({filteredRequirements.length})
                </Text>
                {filteredRequirements.length > 0 && (
                  <Text 
                    fontSize={tokens.typography.helper.size}
                    color={tokens.colors.text.tertiary}
                    fontWeight={tokens.typography.helper.weight}
                  >
                    Showing {filteredRequirements.length} of {requirements.length} requirements
                  </Text>
                )}
              </HStack>

              {/* Requirements Table */}
              {filteredRequirements.length === 0 ? (
                <Box 
                  bg={tokens.colors.bg.white}
                  borderRadius={tokens.form.cardRadius}
                  border="1px"
                  borderColor={tokens.colors.border.default}
                  boxShadow="0 1px 3px rgba(0,0,0,0.1)"
                  p={tokens.spacing["3xl"]}
                  textAlign="center"
                  w="100%"
                >
                  <VStack gap={tokens.spacing.lg}>
                    <Box 
                      p={tokens.spacing.lg} 
                      bg="blue.50" 
                      borderRadius="full" 
                      display="inline-block"
                    >
                      <FiCheckSquare size={32} color="#3182CE" />
                    </Box>
                    <VStack gap={tokens.spacing.md}>
                      <Text 
                        fontSize={tokens.typography.section.size}
                        fontWeight={tokens.typography.section.weight}
                        color={tokens.colors.text.primary}
                      >
                        {searchQuery || statusFilter !== "all" ? "No matching requirements" : "No requirements yet"}
                      </Text>
                      <Text 
                        color={tokens.colors.text.tertiary}
                        maxW="400px"
                        fontSize={tokens.typography.body.size}
                        lineHeight="1.5"
                      >
                        {searchQuery || statusFilter !== "all" 
                          ? "Try adjusting your search criteria or filters to find what you're looking for."
                          : "Get started by creating your first requirement to define the information needed for business verification."
                        }
                      </Text>
                    </VStack>
                    
                    {(searchQuery || statusFilter !== "all") && (
                      <Button 
                        variant="outline" 
                        onClick={clearFilters} 
                        size="md"
                        h={tokens.form.inputHeight}
                        px={tokens.spacing.lg}
                        fontSize={tokens.typography.body.size}
                        fontWeight={tokens.typography.label.weight}
                        borderColor={tokens.colors.border.default}
                        borderRadius={tokens.form.borderRadius}
                        _hover={{ 
                          bg: tokens.colors.bg.gray[50], 
                          borderColor: tokens.colors.border.hover 
                        }}
                      >
                        <HStack gap={tokens.spacing.sm}>
                          <FiX size={14} />
                          <Text>Clear Filters</Text>
                        </HStack>
                      </Button>
                    )}
                    
                    {!searchQuery && statusFilter === "all" && (
                      <Link href="/requirements/create">
                        <Button 
                          colorScheme="blue" 
                          size="md"
                          h={tokens.form.inputHeight}
                          px={tokens.spacing["2xl"]}
                          fontSize={tokens.typography.body.size}
                          fontWeight={tokens.typography.label.weight}
                          borderRadius={tokens.form.borderRadius}
                        >
                          <HStack gap={tokens.spacing.sm}>
                            <FiPlus size={16} />
                            <Text>Create First Requirement</Text>
                          </HStack>
                        </Button>
                      </Link>
                    )}
                  </VStack>
                </Box>
              ) : (
                <Box 
                  bg={tokens.colors.bg.white}
                  borderRadius={tokens.form.cardRadius}
                  border="1px"
                  borderColor={tokens.colors.border.default}
                  boxShadow="0 1px 3px rgba(0,0,0,0.1)"
                  overflow="hidden"
                  w="100%"
                >
                  <Box overflowX="auto">
                    <Box as="table" w="100%" style={{ borderCollapse: "collapse" }}>
                      <Box as="thead" bg={tokens.colors.bg.gray[50]}>
                        <Box as="tr" borderBottom="1px" borderColor={tokens.colors.border.default}>
                          <Box 
                            as="th" 
                            px={tokens.spacing.md}
                            py={tokens.spacing.md}
                            textAlign="left"
                            fontSize={tokens.typography.label.size}
                            fontWeight={tokens.typography.label.weight}
                            color={tokens.colors.text.secondary}
                          >
                            Requirement
                          </Box>
                          <Box 
                            as="th" 
                            px={tokens.spacing.md}
                            py={tokens.spacing.md}
                            textAlign="left"
                            fontSize={tokens.typography.label.size}
                            fontWeight={tokens.typography.label.weight}
                            color={tokens.colors.text.secondary}
                          >
                            Code
                          </Box>
                          <Box 
                            as="th" 
                            px={tokens.spacing.md}
                            py={tokens.spacing.md}
                            textAlign="left"
                            fontSize={tokens.typography.label.size}
                            fontWeight={tokens.typography.label.weight}
                            color={tokens.colors.text.secondary}
                          >
                            Type
                          </Box>
                          <Box 
                            as="th" 
                            px={tokens.spacing.md}
                            py={tokens.spacing.md}
                            textAlign="left"
                            fontSize={tokens.typography.label.size}
                            fontWeight={tokens.typography.label.weight}
                            color={tokens.colors.text.secondary}
                          >
                            Field Type
                          </Box>
                          <Box 
                            as="th" 
                            px={tokens.spacing.md}
                            py={tokens.spacing.md}
                            textAlign="left"
                            fontSize={tokens.typography.label.size}
                            fontWeight={tokens.typography.label.weight}
                            color={tokens.colors.text.secondary}
                          >
                            Status
                          </Box>
                          <Box 
                            as="th" 
                            px={tokens.spacing.md}
                            py={tokens.spacing.md}
                            textAlign="center"
                            fontSize={tokens.typography.label.size}
                            fontWeight={tokens.typography.label.weight}
                            color={tokens.colors.text.secondary}
                          >
                            Actions
                          </Box>
                        </Box>
                      </Box>
                      <Box as="tbody">
                        {filteredRequirements.map((requirement) => (
                          <Box 
                            as="tr" 
                            key={requirement.id}
                            borderBottom="1px"
                            borderColor={tokens.colors.border.default}
                            _hover={{ bg: tokens.colors.bg.gray[50] }}
                            transition="background 0.15s ease"
                          >
                            <Box as="td" px={tokens.spacing.md} py={tokens.spacing.md}>
                              <VStack align="start" gap={tokens.spacing.xs}>
                                <Text 
                                  fontSize={tokens.typography.body.size}
                                  fontWeight={tokens.typography.label.weight}
                                  color={tokens.colors.text.primary}
                                  lineHeight="1.4"
                                >
                                  {requirement.displayName}
                                </Text>
                                <Text 
                                  fontSize={tokens.typography.helper.size}
                                  color={tokens.colors.text.tertiary}
                                  lineHeight="1.4"
                                  maxW="300px"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden"
                                  }}
                                >
                                  {requirement.description || "No description provided"}
                                </Text>
                              </VStack>
                            </Box>
                            <Box as="td" px={tokens.spacing.md} py={tokens.spacing.md}>
                              <Text 
                                fontSize={tokens.typography.body.size}
                                fontFamily="mono"
                                color={tokens.colors.text.secondary}
                              >
                                {requirement.code}
                              </Text>
                            </Box>
                            <Box as="td" px={tokens.spacing.md} py={tokens.spacing.md}>
                              <Badge variant="outline" colorScheme="purple" size="sm">
                                {requirement.type}
                              </Badge>
                            </Box>
                            <Box as="td" px={tokens.spacing.md} py={tokens.spacing.md}>
                              {requirement.fieldType ? (
                                <Badge variant="subtle" colorScheme="cyan" size="sm">
                                  {requirement.fieldType}
                                </Badge>
                              ) : (
                                <Text fontSize={tokens.typography.body.size} color={tokens.colors.text.tertiary}>
                                  -
                                </Text>
                              )}
                            </Box>
                            <Box as="td" px={tokens.spacing.md} py={tokens.spacing.md}>
                              <Badge
                                colorScheme={requirement.isActive ? "green" : "gray"}
                                variant="subtle"
                                size="sm"
                              >
                                {requirement.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </Box>
                            <Box as="td" px={tokens.spacing.md} py={tokens.spacing.md} textAlign="center">
                              <HStack gap={tokens.spacing.sm} justify="center">
                                <Link href={`/requirements/edit/${requirement.id}`}>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    colorScheme="blue"
                                    h="32px"
                                    w="32px"
                                    p="0"
                                    borderRadius={tokens.form.borderRadius}
                                  >
                                    <FiEdit3 size={14} />
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  colorScheme="red"
                                  onClick={() => handleDelete(requirement.id)}
                                  loading={deleting === requirement.id}
                                  h="32px"
                                  w="32px"
                                  p="0"
                                  borderRadius={tokens.form.borderRadius}
                                >
                                  <FiTrash2 size={14} />
                                </Button>
                              </HStack>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </VStack>
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
}
