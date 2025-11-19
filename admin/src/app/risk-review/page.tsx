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
  Dialog,
  Textarea
} from "@chakra-ui/react";
import { 
  FiSearch, 
  FiFilter, 
  FiShield, 
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiFlag,
  FiAlertCircle,
  FiEdit3
} from "react-icons/fi";
import { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "../../components/AdminSidebar";
import { riskApiService, EnrichedRiskAssessment } from "../../services/riskApi";
import { applicationsApi, OnboardingCaseProjection } from "../../lib/applicationsApi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type RiskAssessment = EnrichedRiskAssessment;

// Extended type to include cases that need risk review
interface RiskReviewItem extends RiskAssessment {
  needsAssessment?: boolean; // True if this is a case that needs a risk assessment created
  caseProjection?: OnboardingCaseProjection; // Case data if no assessment exists yet
}

export default function RiskReviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [assessments, setAssessments] = useState<RiskReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [classificationModalOpen, setClassificationModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<RiskReviewItem | null>(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [creatingAssessment, setCreatingAssessment] = useState<string | null>(null); // caseId being created

  useEffect(() => {
    loadRiskAssessments();
  }, []);

  const loadRiskAssessments = async (filter?: string, searchQuery?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build filters based on provided filter or current risk filter
      const activeFilter = filter || riskFilter;
      const filters: any = {};
      if (activeFilter !== "ALL") {
        // Map frontend risk level to backend format
        // Backend uses: Unknown, Low, MediumLow, Medium, MediumHigh, High
        // Frontend uses: UNKNOWN, LOW, MEDIUM, HIGH, CRITICAL
        let backendRiskLevel = activeFilter;
        if (activeFilter === "CRITICAL") {
          backendRiskLevel = "High"; // Map CRITICAL to High for backend
        } else if (activeFilter === "HIGH") {
          backendRiskLevel = "High";
        } else if (activeFilter === "MEDIUM") {
          backendRiskLevel = "Medium";
        } else if (activeFilter === "LOW") {
          backendRiskLevel = "Low";
        } else if (activeFilter === "UNKNOWN") {
          backendRiskLevel = "Unknown";
        }
        filters.riskLevel = backendRiskLevel;
      }
      
      // If search term looks like an application ID (UUID or case ID format), search backend
      // Otherwise, we'll do client-side filtering for company name
      if (searchQuery && searchQuery.trim().length > 0) {
        // Check if it looks like a case ID (UUID format or contains dashes/numbers)
        const looksLikeCaseId = /^[0-9a-f-]{8,}$/i.test(searchQuery.trim()) || searchQuery.trim().length >= 8;
        if (looksLikeCaseId) {
          filters.caseId = searchQuery.trim();
        }
      }
      
      // Fetch existing risk assessments
      const existingAssessments = await riskApiService.listRiskAssessments(filters);
      
      // Fetch cases that need risk review (submitted cases without risk assessments)
      // Only fetch if filter is ALL or UNKNOWN (cases needing review)
      let casesNeedingReview: OnboardingCaseProjection[] = [];
      if (activeFilter === "ALL" || activeFilter === "UNKNOWN" || !activeFilter) {
        try {
          const casesResult = await applicationsApi.getApplications({
            status: 'SUBMITTED', // Get submitted cases
            pageSize: 1000
          });
          
          // Get case IDs that already have assessments
          const assessmentCaseIds = new Set(existingAssessments.map(a => a.caseId.toLowerCase()));
          
          // Fetch cases directly from projections API
          const projectionsResponse = await fetch('/api/applications?status=Submitted&take=1000');
          if (projectionsResponse.ok) {
            const projectionsData = await projectionsResponse.json();
            const allCases = projectionsData.items || [];
            
            // Filter to cases without risk assessments
            casesNeedingReview = allCases.filter((caseItem: OnboardingCaseProjection) => {
              const caseId = (caseItem.caseId || caseItem.id).toLowerCase();
              return !assessmentCaseIds.has(caseId);
            });
          }
        } catch (err) {
          console.warn("Failed to fetch cases needing review:", err);
          // Continue with just existing assessments
        }
      }
      
      // Combine existing assessments with cases needing review
      const combinedItems: RiskReviewItem[] = [
        ...existingAssessments.map(assessment => ({ ...assessment, needsAssessment: false })),
        ...casesNeedingReview.map(caseItem => {
          const caseId = caseItem.caseId || caseItem.id;
          const companyName = caseItem.businessLegalName || 
                            `${caseItem.applicantFirstName || ''} ${caseItem.applicantLastName || ''}`.trim() ||
                            'Unknown Company';
          
          return {
            id: `pending-${caseId}`, // Temporary ID for cases without assessments
            applicationId: caseId,
            caseId: caseId,
            companyName: companyName,
            entityType: caseItem.type || 'Unknown',
            riskLevel: 'UNKNOWN' as const,
            riskScore: 0,
            status: 'PENDING' as const,
            assignedTo: caseItem.assignedToName || caseItem.assignedTo || 'Unassigned',
            submittedDate: caseItem.submittedAt || caseItem.createdAt,
            riskFactors: [],
            recommendations: [],
            needsAssessment: true,
            caseProjection: caseItem
          } as RiskReviewItem;
        })
      ];
      
      setAssessments(combinedItems);
    } catch (err) {
      console.error("Failed to load risk assessments:", err);
      setError(err instanceof Error ? err.message : "Failed to load risk assessments. Please ensure the backend services are running.");
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HIGH': return 'red';
      case 'CRITICAL': return 'red';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'IN_REVIEW': return 'blue';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'red';
    if (score >= 60) return 'orange';
    if (score >= 40) return 'yellow';
    return 'green';
  };

  // Filter assessments client-side for company name search
  // Application ID search is handled by backend via loadRiskAssessments
  const filteredAssessments = assessments.filter(assessment => {
    // If search term exists and doesn't look like a case ID, filter by company name client-side
    const searchTermLower = searchTerm.toLowerCase();
    const looksLikeCaseId = searchTerm.length > 0 && (/^[0-9a-f-]{8,}$/i.test(searchTerm.trim()) || searchTerm.trim().length >= 8);
    
    let matchesSearch = true;
    if (searchTerm.length > 0 && !looksLikeCaseId) {
      // Client-side filter for company name
      matchesSearch = assessment.companyName.toLowerCase().includes(searchTermLower) ||
                     assessment.applicationId.toLowerCase().includes(searchTermLower);
    }
    
    // Risk filter is handled by backend, but we keep this for consistency
    const matchesRisk = riskFilter === "ALL" || assessment.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  // Calculate counts from all assessments (not just filtered ones for summary cards)
  const criticalCount = assessments.filter(a => a.riskLevel === 'CRITICAL').length;
  const highCount = assessments.filter(a => a.riskLevel === 'HIGH').length;
  const pendingCount = assessments.filter(a => {
    const isUnknown = a.riskLevel === 'UNKNOWN' || !a.riskLevel;
    return a.status === 'PENDING' || 
           isUnknown ||
           (a.status === 'IN_REVIEW' && isUnknown);
  }).length;
  const approvedCount = assessments.filter(a => a.status === 'APPROVED').length;

  // Reload when risk filter changes
  useEffect(() => {
    loadRiskAssessments(riskFilter, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskFilter]);

  // Reload when search term changes (debounced for backend search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length === 0 || searchTerm.length >= 3) {
        loadRiskAssessments(riskFilter, searchTerm);
      }
    }, 500); // Debounce search by 500ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

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
                Risk Review
              </Text>
              <Text color="gray.600">
                Manually review and classify application risk levels
              </Text>
            </VStack>
            
            <HStack gap="3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadRiskAssessments(riskFilter, searchTerm)}
              >
                <Icon as={FiFilter} style={{ marginRight: '8px' }} />
                Refresh
              </Button>
            </HStack>
          </Flex>

          {/* Error Alert */}
          {error && (
            <Box 
              bg="red.50" 
              border="1px" 
              borderColor="red.200" 
              borderRadius="lg" 
              p="4"
            >
              <HStack gap="2">
                <Icon as={FiAlertCircle} boxSize="5" color="red.600" />
                <VStack align="start" gap="1" flex="1">
                  <Text fontWeight="semibold" color="red.700">Error loading risk assessments</Text>
                  <Text fontSize="sm" color="red.600">{error}</Text>
                </VStack>
              </HStack>
            </Box>
          )}

          {/* Manual Review Notice */}
          <Box bg="blue.50" p="4" borderRadius="lg" border="1px" borderColor="blue.200">
              <HStack gap="3">
              <Icon as={FiShield} boxSize="5" color="blue.500" />
              <VStack align="start" gap="1" flex="1">
                <Text fontWeight="semibold" color="blue.800">
                  Manual Risk Review Required
                  </Text>
                <Text fontSize="sm" color="blue.700">
                  All risk classifications must be done manually by authorized personnel. No automatic risk scoring or classification is performed.
                  </Text>
                </VStack>
              </HStack>
            </Box>

          {/* Risk Summary */}
          <SimpleGrid columns={{ base: 1, md: 4 }} gap="4">
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiAlertTriangle} boxSize="6" color="red.500" />
                <Text fontSize="2xl" fontWeight="bold" color="red.600">
                  {criticalCount}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Critical Risk
                </Text>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiFlag} boxSize="6" color="orange.500" />
                <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                  {highCount}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  High Risk
                </Text>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiClock} boxSize="6" color="blue.500" />
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {pendingCount}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Pending Manual Review
                </Text>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiCheckCircle} boxSize="6" color="green.500" />
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {approvedCount}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Approved
                </Text>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Search and Filters */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <HStack gap="4">
              <Box flex="1">
                <HStack>
                  <Icon as={FiSearch} color="gray.400" />
                  <Input
                    placeholder="Search by company name or application ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    border="none"
                    _focus={{ boxShadow: "none" }}
                  />
                </HStack>
              </Box>
              
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "white"
                }}
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </HStack>
          </Box>

          {/* Risk Assessments Table */}
          <Box bg="white" borderRadius="lg" boxShadow="sm" w="100%" position="relative">
            <Box overflowX="auto" w="100%">
              <Box minW="1400px">
              <VStack gap="0" align="stretch" w="100%">
              {/* Table Header */}
              <HStack bg="gray.50" p="4" fontWeight="semibold" color="gray.800" fontSize="sm" borderBottom="1px" borderColor="gray.200" gap="4">
                <Box w="200px" flexShrink={0}>Company Name</Box>
                <Box w="150px" flexShrink={0}>Application ID</Box>
                <Box w="100px" flexShrink={0}>Entity Type</Box>
                <Box w="120px" flexShrink={0}>Risk Level</Box>
                <Box w="100px" flexShrink={0}>Status</Box>
                <Box w="120px" flexShrink={0}>Assigned To</Box>
                <Box w="100px" flexShrink={0}>Submitted</Box>
                <Box w="120px" flexShrink={0}>Risk Score</Box>
                <Box w="350px" flexShrink={0}>Actions</Box>
              </HStack>
              
              {/* Table Rows */}
              {filteredAssessments.length === 0 ? (
                <Box p="8" textAlign="center">
                  <Text color="gray.600">No risk assessments found</Text>
                </Box>
              ) : (
                filteredAssessments.map((assessment) => {
                  return (
                  <HStack 
                    key={assessment.id} 
                    p="4" 
                    borderBottom="1px" 
                    borderColor="gray.100"
                    _hover={{ bg: "gray.50" }}
                    fontSize="sm"
                    align="center"
                    gap="4"
                  >
                    {/* Company Name */}
                    <Box w="200px" flexShrink={0} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={assessment.companyName}>
                      <Text fontWeight="medium" color="gray.800">
                        {assessment.companyName}
                      </Text>
                    </Box>
                    
                    {/* Application ID */}
                    <Box w="150px" flexShrink={0} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={assessment.applicationId}>
                      <Text color="gray.600" fontSize="xs">
                        {assessment.applicationId}
                      </Text>
                    </Box>
                    
                    {/* Entity Type */}
                    <Box w="100px" flexShrink={0} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      <Text color="gray.700">
                        {assessment.entityType}
                      </Text>
                    </Box>
                    
                    {/* Risk Level */}
                    <Box w="120px" flexShrink={0}>
                      {assessment.riskLevel === 'UNKNOWN' || !assessment.riskLevel ? (
                        <Badge colorScheme="gray" variant="outline" size="sm">
                          Not Assessed
                        </Badge>
                      ) : (
                        <Badge colorScheme={getRiskColor(assessment.riskLevel)} variant="solid" size="sm">
                          {assessment.riskLevel}
                        </Badge>
                      )}
                    </Box>
                    
                    {/* Status */}
                    <Box w="100px" flexShrink={0}>
                      <Badge colorScheme={getStatusColor(assessment.status)} variant="subtle" size="sm">
                        {assessment.status.replace('_', ' ')}
                      </Badge>
                    </Box>
                    
                    {/* Assigned To */}
                    <Box w="120px" flexShrink={0} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={assessment.assignedTo}>
                      <Text color="gray.700" fontSize="xs">
                        {assessment.assignedTo}
                      </Text>
                    </Box>
                    
                    {/* Submitted Date */}
                    <Box w="100px" flexShrink={0}>
                      <Text color="gray.600" fontSize="xs">
                        {new Date(assessment.submittedDate).toLocaleDateString()}
                      </Text>
                    </Box>
                    
                    {/* Risk Score */}
                    <Box w="120px" flexShrink={0}>
                      {assessment.riskLevel !== 'UNKNOWN' && assessment.riskLevel && assessment.riskScore > 0 ? (
                        <HStack gap="1" align="center">
                          <Text fontSize="xs" color="gray.600" minW="35px">
                            {assessment.riskScore}%
                          </Text>
                          <Box
                            flex="1"
                            height="6px"
                            bg="gray.200"
                            borderRadius="full"
                            overflow="hidden"
                          >
                            <Box
                              width={`${assessment.riskScore}%`}
                              height="100%"
                              bg={`${getRiskScoreColor(assessment.riskScore)}.400`}
                              borderRadius="full"
                            />
                          </Box>
                        </HStack>
                      ) : (
                        <Text fontSize="xs" color="gray.400" fontStyle="italic">
                          N/A
                        </Text>
                      )}
                    </Box>
                    
                    {/* Actions - Always visible with fixed width - FORCE VISIBILITY */}
                    <Box 
                      w="350px" 
                      flexShrink={0} 
                      py="2" 
                      px="2"
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                    >
                      <HStack gap="2" align="center" justify="flex-start" w="100%">
                        {/* Review Button - Primary action - ALWAYS SHOW */}
                        <Button
                          size="md"
                          colorScheme="orange"
                          variant="solid"
                          fontWeight="semibold"
                          minW="110px"
                          flexShrink={0}
                          onClick={async () => {
                            try {
                              // Try to get workItemId - first check if assessment has it
                              const workItemId = (assessment as any).workItemId || assessment.applicationId;
                              
                              // Navigate to review page
                              router.push(`/review/${workItemId}`);
                            } catch (err) {
                              console.error('Error navigating to review:', err);
                              // Fallback to applications page
                              router.push(`/applications/${assessment.applicationId}`);
                            }
                          }}
                          _hover={{ 
                            bg: "orange.600",
                            transform: "translateY(-1px)",
                            boxShadow: "md"
                          }}
                          transition="all 0.2s"
                        >
                          <Icon as={FiShield} mr="2" />
                          Review
                        </Button>
                        
                        {/* Secondary actions */}
                        {assessment.needsAssessment ? (
                          <Button
                            size="md"
                            colorScheme="blue"
                            variant="solid"
                            minW="130px"
                            flexShrink={0}
                            loading={creatingAssessment === assessment.caseId}
                            onClick={async () => {
                              if (!assessment.caseProjection) return;
                              
                              setCreatingAssessment(assessment.caseId);
                              try {
                                await riskApiService.createRiskAssessment(
                                  assessment.caseId,
                                  assessment.caseProjection.partnerId
                                );
                                // Reload assessments after creating
                                await loadRiskAssessments(riskFilter, searchTerm);
                              } catch (err) {
                                console.error('Failed to create risk assessment:', err);
                                alert('Failed to create risk assessment. Please try again.');
                              } finally {
                                setCreatingAssessment(null);
                              }
                            }}
                          >
                            Create Assessment
                          </Button>
                        ) : (
                          <Button
                            size="md"
                            colorScheme={assessment.riskLevel === 'UNKNOWN' || !assessment.riskLevel ? "orange" : "blue"}
                            variant="outline"
                            minW="110px"
                            flexShrink={0}
                            onClick={() => {
                              setSelectedAssessment(assessment);
                              setSelectedRiskLevel(assessment.riskLevel || '');
                              setJustification('');
                              setClassificationModalOpen(true);
                            }}
                          >
                            <Icon as={FiEdit3} mr="2" />
                            {assessment.riskLevel === 'UNKNOWN' || !assessment.riskLevel ? 'Classify' : 'Update'}
                          </Button>
                        )}
                      </HStack>
                    </Box>
                  </HStack>
                  );
                })
              )}
              </VStack>
              </Box>
            </Box>
          </Box>
        </VStack>
      </Container>
      </Box>

      {/* Manual Risk Classification Modal */}
      <Dialog.Root open={classificationModalOpen} onOpenChange={(e) => setClassificationModalOpen(e.open)}>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content maxW="500px" borderRadius="xl" boxShadow="2xl">
            <Dialog.Header pb="4" borderBottom="1px" borderColor="gray.100">
              <HStack gap="3" align="center">
                <Icon as={FiShield} boxSize="5" color="orange.500" />
                <VStack align="start" gap="0">
                  <Dialog.Title fontSize="lg" fontWeight="700">
                    Classify Risk Level
                  </Dialog.Title>
                  <Dialog.Description fontSize="sm" color="gray.600">
                    Manually set the risk classification for this application
                  </Dialog.Description>
                </VStack>
              </HStack>
            </Dialog.Header>
            <Dialog.Body py="6">
              <VStack gap="5" align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                    Application
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {selectedAssessment?.companyName || selectedAssessment?.applicationId}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                    Risk Level <Text as="span" color="red.500">*</Text>
                  </Text>
                  <select
                    value={selectedRiskLevel}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRiskLevel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select risk level</option>
                    <option value="LOW">Low Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="HIGH">High Risk</option>
                    <option value="CRITICAL">Critical Risk</option>
                  </select>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                    Justification <Text as="span" color="red.500">*</Text>
                  </Text>
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Provide justification for this risk classification..."
                    rows={4}
                    resize="vertical"
                  />
                  <Text fontSize="xs" color="gray.500" mt="1">
                    This justification will be recorded in the audit trail
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer borderTop="1px" borderColor="gray.100" pt="4">
              <HStack gap="3" justify="flex-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setClassificationModalOpen(false);
                    setSelectedAssessment(null);
                    setSelectedRiskLevel('');
                    setJustification('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="orange"
                  onClick={async () => {
                    if (!selectedAssessment || !selectedRiskLevel || !justification.trim()) {
                      return;
                    }
                    
                    setClassifying(true);
                    try {
                      await riskApiService.setManualRiskLevel(
                        selectedAssessment.id,
                        selectedRiskLevel,
                        justification
                      );
                      setClassificationModalOpen(false);
                      setSelectedAssessment(null);
                      setSelectedRiskLevel('');
                      setJustification('');
                      await loadRiskAssessments(riskFilter, searchTerm);
                    } catch (err) {
                      console.error('Failed to classify risk:', err);
                      alert('Failed to classify risk. Please try again.');
                    } finally {
                      setClassifying(false);
                    }
                  }}
                  loading={classifying}
                  disabled={!selectedRiskLevel || !justification.trim()}
                >
                  Classify Risk
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
