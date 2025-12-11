'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  HStack,
  Flex,
  Icon,
  Spinner,
  Textarea,
  SimpleGrid,
} from '@chakra-ui/react';
import { Button, Typography, Tag, AlertBar } from '@/lib/mukuruImports';
import { FiArrowLeft, FiSave, FiShield, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAuthUser } from '@/lib/auth/session';
import { generateUserIdFromEmail } from '@/lib/api';
import {
  riskApiService,
  RiskAssessmentDto,
  RiskAssessmentFormData,
} from '@/services/riskApi';

export default function RiskAssessmentPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentDto | null>(null);
  const [, setCaseData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form data state
  const [formData, setFormData] = useState<RiskAssessmentFormData>({
    partnerCustomerDetails: '',
    mukuruDetails: '',
    enhancedDueDiligenceFindings: '',
    adverseMediaAssessment: '',
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
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include session cookie - proxy will inject Authorization header
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
        setError('Failed to load risk assessment');
        setLoading(false);
      }
    };

    if (caseId) {
      loadData();
    }
  }, [caseId]);

  const handleSave = async () => {
    if (!riskAssessment) return;

    try {
      setSaving(true);
      setError(null);
      setValidationErrors({});

      // Validate
      if (!formData.partnerCustomerDetails.trim()) {
        setValidationErrors({ partnerCustomerDetails: 'This field is required' });
        return;
      }

      // Save notes (formatted as structured data)
      const notes = `Partner/Customer Details:\n${formData.partnerCustomerDetails}\n\nMukuru Details:\n${formData.mukuruDetails}\n\nEnhanced Due Diligence Findings:\n${formData.enhancedDueDiligenceFindings}\n\nAdverse Media Assessment:\n${formData.adverseMediaAssessment}`;

      await riskApiService.updateRiskAssessmentNotes(riskAssessment.id, notes);

      setSuccess('Risk assessment saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save risk assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!riskAssessment) return;

    try {
      setCompleting(true);
      setError(null);

      const notes = `Partner/Customer Details:\n${formData.partnerCustomerDetails}\n\nMukuru Details:\n${formData.mukuruDetails}\n\nEnhanced Due Diligence Findings:\n${formData.enhancedDueDiligenceFindings}\n\nAdverse Media Assessment:\n${formData.adverseMediaAssessment}`;

      await riskApiService.completeRiskAssessment(riskAssessment.id, notes);

      setSuccess('Risk assessment completed successfully');
      setTimeout(() => {
        setSuccess(null);
        // Navigate back or reload
        window.location.href = '/partner/dashboard';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete risk assessment');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="mukuru.background.light" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="mukuru.buttons.primary" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="mukuru.background.light" p={6}>
      <Container maxW="6xl">
        <VStack align="stretch" gap={6}>
          {/* Header */}
          <HStack justify="space-between">
            <HStack gap={4}>
              <Link href="/partner/dashboard">
                <Button variant="ghost" leftIcon={<FiArrowLeft />}>
                  Back
                </Button>
              </Link>
              <Typography fontSize="2xl" fontWeight="bold">
                Risk Assessment
              </Typography>
            </HStack>
            <HStack gap={2}>
              <Button
                onClick={handleSave}
                disabled={saving}
                leftIcon={<FiSave />}
                variant="outline"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completing}
                leftIcon={<FiCheckCircle />}
                colorScheme="orange"
              >
                {completing ? 'Completing...' : 'Complete'}
              </Button>
            </HStack>
          </HStack>

          {/* Alerts */}
          {error && (
            <AlertBar status="error" title="Error" description={error} />
          )}
          {success && (
            <AlertBar status="success" title="Success" description={success} />
          )}

          {/* Current Assessment Info */}
          {riskAssessment && (
            <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
              <HStack gap={4} mb={4}>
                <Tag variant={riskAssessment.overallRiskLevel === 'High' || riskAssessment.overallRiskLevel === 'Critical' ? 'danger' : 'info'}>
                  {riskAssessment.overallRiskLevel}
                </Tag>
                <Typography fontSize="sm" color="gray.600">
                  Status: {riskAssessment.status}
                </Typography>
                {riskAssessment.riskScore !== undefined && (
                  <Typography fontSize="sm" color="gray.600">
                    Risk Score: {riskAssessment.riskScore}%
                  </Typography>
                )}
              </HStack>
            </Box>
          )}

          {/* Form */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
              <Typography fontSize="lg" fontWeight="bold" mb={4}>
                Partner/Customer Details
              </Typography>
              <Textarea
                value={formData.partnerCustomerDetails}
                onChange={(e) =>
                  setFormData({ ...formData, partnerCustomerDetails: e.target.value })
                }
                placeholder="Enter partner/customer details..."
                minH="200px"
              />
              {validationErrors.partnerCustomerDetails && (
                <Typography fontSize="xs" color="red.500" mt={2}>
                  {validationErrors.partnerCustomerDetails}
                </Typography>
              )}
            </Box>

            <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
              <Typography fontSize="lg" fontWeight="bold" mb={4}>
                Mukuru Details
              </Typography>
              <Textarea
                value={formData.mukuruDetails}
                onChange={(e) =>
                  setFormData({ ...formData, mukuruDetails: e.target.value })
                }
                placeholder="Enter Mukuru details..."
                minH="200px"
              />
            </Box>

            <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
              <Typography fontSize="lg" fontWeight="bold" mb={4}>
                Enhanced Due Diligence Findings
              </Typography>
              <Textarea
                value={formData.enhancedDueDiligenceFindings}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    enhancedDueDiligenceFindings: e.target.value,
                  })
                }
                placeholder="Enter enhanced due diligence findings..."
                minH="200px"
              />
            </Box>

            <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
              <Typography fontSize="lg" fontWeight="bold" mb={4}>
                Adverse Media Assessment
              </Typography>
              <Textarea
                value={formData.adverseMediaAssessment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    adverseMediaAssessment: e.target.value,
                  })
                }
                placeholder="Enter adverse media assessment..."
                minH="200px"
              />
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}

