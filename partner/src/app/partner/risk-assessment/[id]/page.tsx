"use client";

import { useParams, useRouter } from "next/navigation";
import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Flex,
  Icon,
  Button,
  Spinner,
  Badge,
  Textarea,
  Heading,
  Alert,
  SimpleGrid
} from "@chakra-ui/react";
import { 
  FiArrowLeft,
  FiSave,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiBriefcase,
  FiFileText,
  FiAlertTriangle
} from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAuthUser } from "@/lib/auth/session";
import { generateUserIdFromEmail } from "@/lib/api";
import { riskApiService, RiskAssessmentDto, RiskAssessmentFormData } from "@/services/riskApi";

const MotionBox = motion.create(Box);

export default function RiskAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentDto | null>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Form data state
  const [formData, setFormData] = useState<RiskAssessmentFormData>({
    partnerCustomerDetails: '',
    mukuruDetails: '',
    enhancedDueDiligenceFindings: '',
    adverseMediaAssessment: ''
  });

  // Load risk assessment and case data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const user = getAuthUser();
        if (!user?.email) {
          setError('You must be logged in to view risk assessment');
          setLoading(false);
          return;
        }

        // Load case details
        // SECURITY: Tokens are now handled server-side by the proxy
        try {
          const caseResponse = await fetch(`/api/proxy/api/v1/cases/${caseId}/details`, {
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include' // Include session cookie - proxy will inject Authorization header
          });

          if (caseResponse.ok) {
            const caseData = await caseResponse.json();
            setCaseData(caseData);
          }
        } catch (err) {
          console.warn('Failed to load case details:', err);
        }

        // Load or create risk assessment
        const userPartnerId = generateUserIdFromEmail(user.email);
        let assessment = await riskApiService.getRiskAssessmentByCase(caseId);

        if (!assessment) {
          // Create new risk assessment if it doesn't exist
          try {
            assessment = await riskApiService.createRiskAssessment(caseId, userPartnerId);
          } catch (err) {
            console.error('Failed to create risk assessment:', err);
            setError('Failed to create risk assessment. Please try again.');
            setLoading(false);
            return;
          }
        }

        setRiskAssessment(assessment);

        // Load existing form data if available
        const existingFormData = riskApiService.parseRiskAssessmentForm(assessment);
        if (existingFormData) {
          setFormData(existingFormData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading risk assessment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load risk assessment');
        setLoading(false);
      }
    };

    if (caseId) {
      loadData();
    }
  }, [caseId]);

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // All fields are optional for draft saves, but we can add validation for completion
    // For now, we'll just check if form has any content
    const hasContent = 
      formData.partnerCustomerDetails.trim().length > 0 ||
      formData.mukuruDetails.trim().length > 0 ||
      formData.enhancedDueDiligenceFindings.trim().length > 0 ||
      formData.adverseMediaAssessment.trim().length > 0;

    if (!hasContent) {
      errors.general = 'Please fill in at least one section before saving';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!riskAssessment) {
      setError('Risk assessment not loaded');
      return;
    }

    // Clear previous errors
    setError(null);
    setSuccess(null);
    setValidationErrors({});

    try {
      setSaving(true);

      await riskApiService.saveRiskAssessmentForm(riskAssessment.id, formData);

      setSuccess('Draft saved successfully');
      
      // Reload assessment to get updated data
      const updated = await riskApiService.getRiskAssessment(riskAssessment.id);
      if (updated) {
        setRiskAssessment(updated);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving risk assessment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save risk assessment';
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!riskAssessment) {
      setError('Risk assessment not loaded');
      return;
    }

    // Validate before completing
    if (!validateForm()) {
      setError('Please fill in at least one section before completing the assessment');
      return;
    }

    // Confirm completion
    const confirmed = window.confirm(
      'Are you sure you want to complete this risk assessment? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);
    setValidationErrors({});

    try {
      setCompleting(true);

      await riskApiService.completeRiskAssessmentWithForm(riskAssessment.id, formData);

      setSuccess('Risk assessment completed successfully');
      
      // Reload assessment to get updated data
      const updated = await riskApiService.getRiskAssessment(riskAssessment.id);
      if (updated) {
        setRiskAssessment(updated);
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error completing risk assessment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete risk assessment';
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setCompleting(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    const upper = level.toUpperCase();
    if (upper === 'LOW' || upper === 'MEDIUMLOW') return 'green';
    if (upper === 'MEDIUM') return 'yellow';
    if (upper === 'HIGH' || upper === 'MEDIUMHIGH') return 'orange';
    if (upper === 'CRITICAL') return 'red';
    return 'gray';
  };

  const getStatusColor = (status: string) => {
    const upper = status.toUpperCase();
    if (upper === 'COMPLETED' || upper === 'APPROVED') return 'green';
    if (upper === 'INPROGRESS' || upper === 'REQUIRESREVIEW' || upper === 'IN_REVIEW') return 'blue';
    if (upper === 'REJECTED') return 'red';
    return 'gray';
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="7xl" py="8">
          <Flex justify="center" align="center" minH="400px">
            <VStack gap="4">
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.600">Loading risk assessment...</Text>
            </VStack>
          </Flex>
        </Container>
      </Box>
    );
  }

  if (error && !riskAssessment) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="7xl" py="8">
          <Alert.Root status="error" borderRadius="lg" mb="4">
            <Alert.Indicator>
              <Icon as={FiAlertCircle} />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
          <Button asChild>
            <Link href="/partner/dashboard">
              <Icon as={FiArrowLeft} mr="2" />
              Back to Dashboard
            </Link>
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="7xl" py="8">
        <VStack gap="6" align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center" flexWrap="wrap" gap="4">
            <HStack gap="4">
              <Button asChild variant="ghost">
                <Link href={`/partner/application/${caseId}`}>
                  <Icon as={FiArrowLeft} mr="2" />
                  Back to Application
                </Link>
              </Button>
              <VStack align="start" gap="1">
                <HStack gap="3">
                  <Icon as={FiShield} boxSize="6" color="blue.500" />
                  <Heading size="lg" color="gray.800">
                    Risk Assessment
                  </Heading>
                </HStack>
                <Text color="gray.600" fontSize="sm">
                  Case ID: {caseId}
                </Text>
              </VStack>
            </HStack>

            {riskAssessment && (
              <HStack gap="3">
                <Badge
                  colorScheme={getRiskLevelColor(riskAssessment.overallRiskLevel)}
                  px="3"
                  py="1"
                  fontSize="sm"
                  borderRadius="full"
                >
                  Risk: {riskAssessment.overallRiskLevel}
                </Badge>
                <Badge
                  colorScheme={getStatusColor(riskAssessment.status)}
                  px="3"
                  py="1"
                  fontSize="sm"
                  borderRadius="full"
                >
                  {riskAssessment.status}
                </Badge>
              </HStack>
            )}
          </Flex>

          {/* Alerts */}
          {error && (
            <Alert.Root status="error" borderRadius="lg">
              <Alert.Indicator>
                <Icon as={FiAlertCircle} />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title>Error</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          {success && (
            <Alert.Root status="success" borderRadius="lg">
              <Alert.Indicator>
                <Icon as={FiCheckCircle} />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title>Success</Alert.Title>
                <Alert.Description>{success}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          {Object.keys(validationErrors).length > 0 && (
            <Alert.Root status="warning" borderRadius="lg">
              <Alert.Indicator>
                <Icon as={FiAlertTriangle} />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title>Validation Error</Alert.Title>
                <Alert.Description>
                  {Object.values(validationErrors).map((msg, idx) => (
                    <Text key={idx}>{msg}</Text>
                  ))}
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          {/* Risk Assessment Form */}
          <Box bg="white" borderRadius="lg" boxShadow="sm" p="6">
            <VStack gap="6" align="stretch">
              {/* Section 1: Partner / Customer details */}
              <Box>
                <Box
                  bg="orange.100"
                  px="4"
                  py="3"
                  borderRadius="md"
                  mb="4"
                >
                  <Text fontWeight="bold" fontSize="lg" color="orange.800">
                    Partner / Customer details
                  </Text>
                </Box>
                <Textarea
                  value={formData.partnerCustomerDetails}
                  onChange={(e) => {
                    setFormData({ ...formData, partnerCustomerDetails: e.target.value });
                    // Clear validation error when user types
                    if (validationErrors.partnerCustomerDetails) {
                      setValidationErrors({ ...validationErrors, partnerCustomerDetails: '' });
                    }
                  }}
                  placeholder="Enter partner/customer details here..."
                  minH="200px"
                  resize="vertical"
                  fontSize="sm"
                  disabled={riskAssessment?.status === 'Completed'}
                  borderColor={validationErrors.partnerCustomerDetails ? 'red.500' : undefined}
                />
                {validationErrors.partnerCustomerDetails && (
                  <Text fontSize="xs" color="red.500" mt="1">
                    {validationErrors.partnerCustomerDetails}
                  </Text>
                )}
              </Box>

              <Box borderTop="1px" borderColor="gray.200" my="4" />

              {/* Section 2: Mukuru details */}
              <Box>
                <Box
                  bg="orange.100"
                  px="4"
                  py="3"
                  borderRadius="md"
                  mb="4"
                >
                  <Text fontWeight="bold" fontSize="lg" color="orange.800">
                    Mukuru details
                  </Text>
                </Box>
                <Textarea
                  value={formData.mukuruDetails}
                  onChange={(e) => {
                    setFormData({ ...formData, mukuruDetails: e.target.value });
                    if (validationErrors.mukuruDetails) {
                      setValidationErrors({ ...validationErrors, mukuruDetails: '' });
                    }
                  }}
                  placeholder="Enter Mukuru details here..."
                  minH="200px"
                  resize="vertical"
                  fontSize="sm"
                  disabled={riskAssessment?.status === 'Completed'}
                  borderColor={validationErrors.mukuruDetails ? 'red.500' : undefined}
                />
                {validationErrors.mukuruDetails && (
                  <Text fontSize="xs" color="red.500" mt="1">
                    {validationErrors.mukuruDetails}
                  </Text>
                )}
              </Box>

              <Box borderTop="1px" borderColor="gray.200" my="4" />

              {/* Section 3: Enhanced Due Diligence Findings */}
              <Box>
                <Box
                  bg="orange.100"
                  px="4"
                  py="3"
                  borderRadius="md"
                  mb="4"
                >
                  <Text fontWeight="bold" fontSize="lg" color="orange.800">
                    Enhanced Due Diligence Findings (completed by Financial Crime Compliance)
                  </Text>
                </Box>
                <Textarea
                  value={formData.enhancedDueDiligenceFindings}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      enhancedDueDiligenceFindings: e.target.value,
                    });
                    if (validationErrors.enhancedDueDiligenceFindings) {
                      setValidationErrors({ ...validationErrors, enhancedDueDiligenceFindings: '' });
                    }
                  }}
                  placeholder="Enter enhanced due diligence findings here..."
                  minH="200px"
                  resize="vertical"
                  fontSize="sm"
                  disabled={riskAssessment?.status === 'Completed'}
                  borderColor={validationErrors.enhancedDueDiligenceFindings ? 'red.500' : undefined}
                />
                {validationErrors.enhancedDueDiligenceFindings && (
                  <Text fontSize="xs" color="red.500" mt="1">
                    {validationErrors.enhancedDueDiligenceFindings}
                  </Text>
                )}
              </Box>

              <Box borderTop="1px" borderColor="gray.200" my="4" />

              {/* Section 4: Adverse media assessment */}
              <Box>
                <Box
                  bg="orange.100"
                  px="4"
                  py="3"
                  borderRadius="md"
                  mb="4"
                >
                  <Text fontWeight="bold" fontSize="lg" color="orange.800">
                    Adverse media assessment (financial crime)
                  </Text>
                </Box>
                <Textarea
                  value={formData.adverseMediaAssessment}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      adverseMediaAssessment: e.target.value,
                    });
                    if (validationErrors.adverseMediaAssessment) {
                      setValidationErrors({ ...validationErrors, adverseMediaAssessment: '' });
                    }
                  }}
                  placeholder="Enter adverse media assessment here..."
                  minH="200px"
                  resize="vertical"
                  fontSize="sm"
                  disabled={riskAssessment?.status === 'Completed'}
                  borderColor={validationErrors.adverseMediaAssessment ? 'red.500' : undefined}
                />
                {validationErrors.adverseMediaAssessment && (
                  <Text fontSize="xs" color="red.500" mt="1">
                    {validationErrors.adverseMediaAssessment}
                  </Text>
                )}
              </Box>

              {/* Action Buttons */}
              <Flex justify="flex-end" gap="3" pt="4" borderTop="1px" borderColor="gray.200">
                <Button
                  variant="outline"
                  colorScheme="blue"
                  onClick={handleSaveDraft}
                  loading={saving}
                  size="lg"
                  disabled={completing || riskAssessment?.status === 'Completed'}
                >
                  <Icon as={FiSave} mr="2" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleComplete}
                  loading={completing}
                  size="lg"
                  disabled={saving || riskAssessment?.status === 'Completed'}
                >
                  <Icon as={FiCheckCircle} mr="2" />
                  {completing ? 'Completing...' : 'Complete Assessment'}
                </Button>
              </Flex>
              
              {riskAssessment?.status === 'Completed' && (
                <Alert.Root status="info" borderRadius="lg" mt="4">
                  <Alert.Indicator>
                    <Icon as={FiCheckCircle} />
                  </Alert.Indicator>
                  <Alert.Content>
                    <Alert.Title>Assessment Completed</Alert.Title>
                    <Alert.Description>
                      This risk assessment has been completed and cannot be modified. 
                      {riskAssessment.completedAt && (
                        <Text fontSize="sm" mt="1">
                          Completed on: {new Date(riskAssessment.completedAt).toLocaleString()}
                        </Text>
                      )}
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}
            </VStack>
          </Box>

          {/* Risk Assessment Info */}
          {riskAssessment && (
            <Box bg="white" borderRadius="lg" boxShadow="sm" p="6">
              <VStack align="stretch" gap="4">
                <Heading size="md" color="gray.800">
                  Assessment Information
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb="1">
                      Risk Score
                    </Text>
                    <Text fontWeight="semibold" fontSize="lg">
                      {riskAssessment.riskScore}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb="1">
                      Overall Risk Level
                    </Text>
                    <Badge
                      colorScheme={getRiskLevelColor(riskAssessment.overallRiskLevel)}
                      px="3"
                      py="1"
                      fontSize="sm"
                    >
                      {riskAssessment.overallRiskLevel}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb="1">
                      Status
                    </Text>
                    <Badge
                      colorScheme={getStatusColor(riskAssessment.status)}
                      px="3"
                      py="1"
                      fontSize="sm"
                    >
                      {riskAssessment.status}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb="1">
                      Created At
                    </Text>
                    <Text fontWeight="semibold">
                      {new Date(riskAssessment.createdAt).toLocaleString()}
                    </Text>
                  </Box>
                  {riskAssessment.completedAt && (
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb="1">
                        Completed At
                      </Text>
                      <Text fontWeight="semibold">
                        {new Date(riskAssessment.completedAt).toLocaleString()}
                      </Text>
                    </Box>
                  )}
                  {riskAssessment.assessedBy && (
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb="1">
                        Assessed By
                      </Text>
                      <Text fontWeight="semibold">{riskAssessment.assessedBy}</Text>
                    </Box>
                  )}
                </SimpleGrid>

                {/* Risk Factors */}
                {riskAssessment.factors && riskAssessment.factors.length > 0 && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb="2" fontWeight="semibold">
                      Risk Factors
                    </Text>
                    <VStack align="stretch" gap="2">
                      {riskAssessment.factors.map((factor) => (
                        <Box
                          key={factor.id}
                          p="3"
                          bg="gray.50"
                          borderRadius="md"
                          borderLeft="4px"
                          borderColor={
                            factor.level === 'High' || factor.level === 'MediumHigh'
                              ? 'red.400'
                              : factor.level === 'Medium'
                              ? 'yellow.400'
                              : 'green.400'
                          }
                        >
                          <HStack justify="space-between" mb="1">
                            <Text fontWeight="semibold" fontSize="sm">
                              {factor.type}
                            </Text>
                            <Badge
                              colorScheme={
                                factor.level === 'High' || factor.level === 'MediumHigh'
                                  ? 'red'
                                  : factor.level === 'Medium'
                                  ? 'yellow'
                                  : 'green'
                              }
                              fontSize="xs"
                            >
                              {factor.level}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.700">
                            {factor.description}
                          </Text>
                          {factor.source && (
                            <Text fontSize="xs" color="gray.500" mt="1">
                              Source: {factor.source}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}

