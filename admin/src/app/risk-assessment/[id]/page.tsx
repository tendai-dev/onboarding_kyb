'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Spinner,
  Textarea,
  SimpleGrid,
  Input,
} from '@chakra-ui/react';
import { Button, Typography, Tag } from '@mukuru/mukuru-react-components';
import {
  FiCheck,
  FiArrowLeft,
  FiSave,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import AdminSidebar from '../../../components/AdminSidebar';
import PortalHeader from '../../../components/PortalHeader';
import { useSidebar } from '../../../contexts/SidebarContext';
import { riskApiService, RiskAssessmentDto } from '../../../services/riskApi';
import { getApplications } from '../../../services/api/applicationsApi';
import { SignNowSignatureField } from '../../../components/SignNowSignatureField';
import { Checkbox } from '@chakra-ui/react';

// ============================================================================
// STYLED COMPONENTS - Using Mukuru Design Tokens
// ============================================================================

// Styled Input with Mukuru tokens
const StyledInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) => (
  <Input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    type={type}
    h="44px"
    borderRadius="8px"
    border="1.5px solid"
    borderColor="#D1D5DB"
    bg="white"
    fontSize="14px"
    color="#1F2937"
    px="14px"
    _placeholder={{ color: '#9CA3AF' }}
    _focus={{ borderColor: '#F05423', boxShadow: '0 0 0 3px rgba(240, 84, 35, 0.12)' }}
    _hover={{ borderColor: '#9CA3AF' }}
  />
);

// Styled Textarea with Mukuru tokens
const StyledTextarea = ({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) => (
  <Textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    borderRadius="8px"
    border="1.5px solid"
    borderColor="#D1D5DB"
    bg="white"
    fontSize="14px"
    color="#1F2937"
    p="12px 14px"
    resize="vertical"
    minH="100px"
    _placeholder={{ color: '#9CA3AF' }}
    _focus={{ borderColor: '#F05423', boxShadow: '0 0 0 3px rgba(240, 84, 35, 0.12)' }}
    _hover={{ borderColor: '#9CA3AF' }}
  />
);

// Form Row - Two column layout for label and input
const FormRow = ({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <Box
    py="16px"
    borderBottom="1px solid"
    borderColor="#E5E7EB"
    _last={{ borderBottom: 'none' }}
  >
    <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px" alignItems="start">
      <Box pt="10px">
        <Typography fontSize="14px" fontWeight="600" color="#374151">
          {label}
          {required && (
            <Box as="span" color="#DC2626">
              {' '}
              *
            </Box>
          )}
        </Typography>
      </Box>
      <Box>{children}</Box>
    </SimpleGrid>
  </Box>
);

// Section Header with number badge
const SectionHeader = ({ number, title }: { number: number; title: string }) => (
  <Flex p="16px 20px" bg="#F05423" align="center" gap="14px">
    <Flex
      w="30px"
      h="30px"
      borderRadius="full"
      bg="white"
      align="center"
      justify="center"
      flexShrink={0}
    >
      <Typography fontSize="14px" fontWeight="700" color="#F05423">
        {number}
      </Typography>
    </Flex>
    <Typography fontSize="16px" fontWeight="600" color="white">
      {title}
    </Typography>
  </Flex>
);

// Radio-style Option Card
const OptionCard = ({
  label,
  checked,
  onChange,
  variant = 'default',
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  variant?: 'default' | 'success' | 'danger';
}) => {
  const colors = {
    default: { border: '#F05423', bg: 'rgba(240, 84, 35, 0.06)', check: '#F05423' },
    success: { border: '#10B981', bg: 'rgba(16, 185, 129, 0.06)', check: '#10B981' },
    danger: { border: '#DC2626', bg: 'rgba(220, 38, 38, 0.06)', check: '#DC2626' },
  };
  const color = colors[variant];

  return (
    <HStack
      gap="12px"
      p="12px 18px"
      borderRadius="8px"
      border="2px solid"
      borderColor={checked ? color.border : '#E5E7EB'}
      bg={checked ? color.bg : 'white'}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ borderColor: color.border }}
      onClick={onChange}
    >
      <Box
        w="20px"
        h="20px"
        borderRadius="full"
        border="2px solid"
        borderColor={checked ? color.check : '#9CA3AF'}
        bg={checked ? color.check : 'white'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        transition="all 0.2s"
      >
        {checked && <FiCheck size={12} color="white" />}
      </Box>
      <Typography fontSize="14px" fontWeight="500" color="#374151">
        {label}
      </Typography>
    </HStack>
  );
};

// Checkbox Card for grid selections
const CheckboxCard = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <HStack
    gap="10px"
    p="12px 16px"
    borderRadius="8px"
    border="1.5px solid"
    borderColor={checked ? '#F05423' : '#E5E7EB'}
    bg={checked ? 'rgba(240, 84, 35, 0.04)' : 'white'}
    cursor="pointer"
    transition="all 0.2s"
    _hover={{ borderColor: '#F05423' }}
    onClick={() => onChange(!checked)}
  >
    <Box
      w="18px"
      h="18px"
      borderRadius="4px"
      border="2px solid"
      borderColor={checked ? '#F05423' : '#9CA3AF'}
      bg={checked ? '#F05423' : 'white'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      transition="all 0.2s"
    >
      {checked && <FiCheck size={10} color="white" />}
    </Box>
    <Typography fontSize="13px" fontWeight="500" color="#374151">
      {label}
    </Typography>
  </HStack>
);

// Recommendation section component
const RecommendationSection = ({
  title,
  role,
  recommendation,
  rationale,
  date,
  signature,
  onRecommendationChange,
  onRationaleChange,
  onDateChange,
  onSignatureChange,
  signNowDocumentId,
  signerEmail,
  isApproval = false,
}: {
  title: string;
  role: string;
  recommendation: 'approve' | 'decline' | '';
  rationale: string;
  date: string;
  signature: string;
  onRecommendationChange: (value: 'approve' | 'decline' | '') => void;
  onRationaleChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onSignatureChange: (value: string) => void;
  signNowDocumentId?: string | null;
  signerEmail: string;
  isApproval?: boolean;
}) => (
  <Box
    bg="white"
    borderRadius="12px"
    border="1px solid"
    borderColor="#E5E7EB"
    overflow="hidden"
    mb="20px"
  >
    <Flex
      p="16px 20px"
      bg="#F9FAFB"
      borderBottom="1px solid"
      borderColor="#E5E7EB"
      justify="space-between"
      align="center"
    >
      <Box>
        <Typography fontSize="15px" fontWeight="600" color="#1F2937">
          {title}
        </Typography>
        <Typography fontSize="13px" color="#6B7280">
          {role}
        </Typography>
      </Box>
      {recommendation && (
        <Tag variant={recommendation === 'approve' ? 'success' : 'danger'}>
          {recommendation === 'approve' ? 'Approved' : 'Declined'}
        </Tag>
      )}
    </Flex>
    <Box p="24px">
      <VStack align="stretch" gap="24px">
        {/* Recommendation Options */}
        <Box>
          <Typography fontSize="14px" fontWeight="600" color="#374151" mb="12px">
            Recommendation:
          </Typography>
          <Flex gap="16px" flexWrap="wrap">
            <OptionCard
              label={
                isApproval ? 'Approval with acceptance of risks highlighted' : 'Approve'
              }
              checked={recommendation === 'approve'}
              onChange={() =>
                onRecommendationChange(recommendation === 'approve' ? '' : 'approve')
              }
              variant="success"
            />
            <OptionCard
              label={
                isApproval
                  ? 'Decline as relationship not within risk appetite'
                  : 'Decline'
              }
              checked={recommendation === 'decline'}
              onChange={() =>
                onRecommendationChange(recommendation === 'decline' ? '' : 'decline')
              }
              variant="danger"
            />
          </Flex>
        </Box>

        {/* Rationale */}
        <Box>
          <Typography fontSize="14px" fontWeight="600" color="#374151" mb="8px">
            Rationale for recommendation:
          </Typography>
          <StyledTextarea
            value={rationale}
            onChange={onRationaleChange}
            placeholder="Enter rationale..."
          />
        </Box>

        {/* Date and Signature */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px">
          <Box>
            <Typography fontSize="14px" fontWeight="600" color="#374151" mb="8px">
              Date:
            </Typography>
            <Input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              h="44px"
              borderRadius="8px"
              border="1.5px solid"
              borderColor="#D1D5DB"
              bg="white"
              fontSize="14px"
              px="14px"
              color="#1F2937"
              _focus={{
                borderColor: '#F05423',
                boxShadow: '0 0 0 3px rgba(240, 84, 35, 0.12)',
              }}
              _hover={{ borderColor: '#9CA3AF' }}
            />
          </Box>
          <Box>
            <SignNowSignatureField
              label="Signature"
              signerEmail={signerEmail}
              signerName={role}
              signature={signature}
              onSignatureChange={onSignatureChange}
              documentId={signNowDocumentId || undefined}
              status={signature ? 'sent' : 'pending'}
            />
          </Box>
        </SimpleGrid>
      </VStack>
    </Box>
  </Box>
);

export default function EnhancedDueDiligencePage() {
  const params = useParams();
  const router = useRouter();
  const { condensed } = useSidebar();
  const assessmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentDto | null>(null);

  // Partner/Customer Details
  const [newExisting, setNewExisting] = useState('');
  const [fullEntityName, setFullEntityName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [entityType, setEntityType] = useState('');
  const [businessActivities, setBusinessActivities] = useState('');
  const [highRiskReasons, setHighRiskReasons] = useState('');

  // Mukuru Details
  const [corridor, setCorridor] = useState('');
  const [mukuruEntityName, setMukuruEntityName] = useState('');
  const [products, setProducts] = useState({
    dmt: false,
    imt: false,
    epp: false,
    wallet: false,
    insurance: false,
    billSettlement: false,
  });

  // Enhanced Due Diligence Findings
  const [eddStatus, setEddStatus] = useState<'valid' | 'incomplete' | ''>('');
  const [eddOutstanding, setEddOutstanding] = useState('');
  const [pepExposure, setPepExposure] = useState<'entity' | 'individual' | ''>('');
  const [ddDocuments, setDdDocuments] = useState('');
  const [policyProcedureConcerns, setPolicyProcedureConcerns] = useState('');
  const [mitigatingFactors, setMitigatingFactors] = useState('');

  // Adverse Media Assessment
  const [adverseMediaIdentified, setAdverseMediaIdentified] = useState<'yes' | 'no' | ''>(
    ''
  );
  const [specialInterestCategories, setSpecialInterestCategories] = useState({
    corruption: false,
    financialCrimes: false,
    organisedCrime: false,
    taxCrime: false,
    terrorCrime: false,
    traffickingCrime: false,
    other: '',
  });
  const [adverseMediaSummary, setAdverseMediaSummary] = useState('');
  const [discountingFactors, setDiscountingFactors] = useState('');
  const [otherSources, setOtherSources] = useState('');

  // Recommendations (2nd line of defence)
  const [mlroRecommendation, setMlroRecommendation] = useState<{
    recommendation: 'approve' | 'decline' | '';
    rationale: string;
    date: string;
    signature: string;
  }>({ recommendation: '', rationale: '', date: '', signature: '' });
  const [groupHeadFCRecommendation, setGroupHeadFCRecommendation] = useState<{
    recommendation: 'approve' | 'decline' | '';
    rationale: string;
    date: string;
    signature: string;
  }>({ recommendation: '', rationale: '', date: '', signature: '' });
  const [groupHeadComplianceRecommendation, setGroupHeadComplianceRecommendation] =
    useState<{
      recommendation: 'approve' | 'decline' | '';
      rationale: string;
      date: string;
      signature: string;
    }>({ recommendation: '', rationale: '', date: '', signature: '' });
  const [execRiskAuditRecommendation, setExecRiskAuditRecommendation] = useState<{
    recommendation: 'approve' | 'decline' | '';
    rationale: string;
    date: string;
    signature: string;
  }>({ recommendation: '', rationale: '', date: '', signature: '' });
  const [groupCounselRecommendation, setGroupCounselRecommendation] = useState<{
    recommendation: 'approve' | 'decline' | '';
    rationale: string;
    date: string;
    signature: string;
  }>({ recommendation: '', rationale: '', date: '', signature: '' });

  // Approvals
  const [ccoApproval, setCcoApproval] = useState<{
    recommendation: 'approve' | 'decline' | '';
    rationale: string;
    date: string;
    signature: string;
  }>({ recommendation: '', rationale: '', date: '', signature: '' });
  const [ceoApproval, setCeoApproval] = useState<{
    recommendation: 'approve' | 'decline' | '';
    rationale: string;
    date: string;
    signature: string;
  }>({ recommendation: '', rationale: '', date: '', signature: '' });

  // SignNow document ID - stores the uploaded document ID
  const [signNowDocumentId, setSignNowDocumentId] = useState<string | null>(null);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);

  // Signer email addresses - you can configure these
  const signerEmails: Record<string, string> = {
    mlro: 'mlro@mukuru.com',
    groupHeadFC: 'inyath.roberts@mukuru.com',
    groupHeadCompliance: 'phumelela.maliza@mukuru.com',
    execRiskAudit: 'nishan.sing@mukuru.com',
    groupCounsel: 'david.isenegger@mukuru.com',
    cco: 'dougal.bennett@mukuru.com',
    ceo: 'andy.jury@mukuru.com',
  };

  // Load risk assessment
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (assessmentId) {
          const assessment = await riskApiService.getRiskAssessmentById(assessmentId);
          setRiskAssessment(assessment);

          // ENFORCEMENT: Enhanced Risk Assessment is only available for High or MediumHigh risk cases
          const riskLevel = assessment.overallRiskLevel?.toLowerCase();
          if (riskLevel !== 'high' && riskLevel !== 'mediumhigh') {
            setError(
              `Enhanced Risk Assessment is only available for High or Medium High risk cases. ` +
                `This case is classified as ${assessment.overallRiskLevel || 'Unknown'} risk.`
            );
            setLoading(false);
            // Redirect after a short delay to show the error message
            setTimeout(() => {
              router.push('/risk-review');
            }, 3000);
            return;
          }

          // Restore saved EDD form data from notes if it exists
          if (assessment.notes) {
            try {
              // Check if notes contain JSON EDD data
              const savedData = JSON.parse(assessment.notes);

              // Restore Partner/Customer Details
              if (savedData.partnerCustomerDetails) {
                const pcd = savedData.partnerCustomerDetails;
                if (pcd.newExisting) setNewExisting(pcd.newExisting);
                if (pcd.fullEntityName) setFullEntityName(pcd.fullEntityName);
                if (pcd.registrationNumber) setRegistrationNumber(pcd.registrationNumber);
                if (pcd.entityType) setEntityType(pcd.entityType);
                if (pcd.businessActivities) setBusinessActivities(pcd.businessActivities);
                if (pcd.highRiskReasons) setHighRiskReasons(pcd.highRiskReasons);
              }

              // Restore Mukuru Details
              if (savedData.mukuruDetails) {
                const md = savedData.mukuruDetails;
                if (md.corridor) setCorridor(md.corridor);
                if (md.mukuruEntityName) setMukuruEntityName(md.mukuruEntityName);
                if (md.products) setProducts(md.products);
              }

              // Restore EDD Findings
              if (savedData.eddFindings) {
                const ef = savedData.eddFindings;
                if (ef.eddStatus) setEddStatus(ef.eddStatus);
                if (ef.eddOutstanding) setEddOutstanding(ef.eddOutstanding);
                if (ef.pepExposure) setPepExposure(ef.pepExposure);
                if (ef.ddDocuments) setDdDocuments(ef.ddDocuments);
                if (ef.policyProcedureConcerns)
                  setPolicyProcedureConcerns(ef.policyProcedureConcerns);
                if (ef.mitigatingFactors) setMitigatingFactors(ef.mitigatingFactors);
              }

              // Restore Adverse Media
              if (savedData.adverseMedia) {
                const am = savedData.adverseMedia;
                if (am.adverseMediaIdentified)
                  setAdverseMediaIdentified(am.adverseMediaIdentified);
                if (am.specialInterestCategories)
                  setSpecialInterestCategories(am.specialInterestCategories);
                if (am.adverseMediaSummary)
                  setAdverseMediaSummary(am.adverseMediaSummary);
                if (am.discountingFactors) setDiscountingFactors(am.discountingFactors);
                if (am.otherSources) setOtherSources(am.otherSources);
              }

              // Restore Recommendations
              if (savedData.recommendations) {
                const rec = savedData.recommendations;
                if (rec.mlro) setMlroRecommendation(rec.mlro);
                if (rec.groupHeadFC) setGroupHeadFCRecommendation(rec.groupHeadFC);
                if (rec.groupHeadCompliance)
                  setGroupHeadComplianceRecommendation(rec.groupHeadCompliance);
                if (rec.execRiskAudit) setExecRiskAuditRecommendation(rec.execRiskAudit);
                if (rec.groupCounsel) setGroupCounselRecommendation(rec.groupCounsel);
              }

              // Restore Approvals
              if (savedData.approvals) {
                const app = savedData.approvals;
                if (app.cco) setCcoApproval(app.cco);
                if (app.ceo) setCeoApproval(app.ceo);
              }

              console.log('[EDD Form] Restored saved form data');
            } catch {
              // Notes are not JSON - might be plain text from manual risk assessment
              console.log('[EDD Form] Notes are not JSON EDD data, starting fresh');
            }
          }

          // Fetch case data to pre-fill form fields if not already set from saved data
          if (assessment.caseId) {
            try {
              const casesResult = await getApplications(1, 1000);
              const caseData = casesResult.items.find(
                (c) => c.id === assessment.caseId || c.caseId === assessment.caseId
              );

              if (caseData) {
                // Pre-fill entity name from case data if not already set
                if (!fullEntityName && caseData.businessLegalName) {
                  setFullEntityName(caseData.businessLegalName);
                }
                // Pre-fill registration number if not already set
                if (!registrationNumber && caseData.businessRegistrationNumber) {
                  setRegistrationNumber(caseData.businessRegistrationNumber);
                }
                console.log('[EDD Form] Pre-filled from case data:', {
                  businessName: caseData.businessLegalName,
                  regNumber: caseData.businessRegistrationNumber,
                });
              }
            } catch (caseErr) {
              console.warn('[EDD Form] Could not fetch case data for pre-fill:', caseErr);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading risk assessment:', err);
        setError('Failed to load risk assessment');
        setLoading(false);
      }
    };

    loadData();
  }, [assessmentId, router]);

  // Generate PDF and upload to SignNow
  const generateAndUploadDocument = async (): Promise<string | null> => {
    try {
      setIsGeneratingDocument(true);

      // Generate PDF from form data
      const response = await fetch('/api/risk-assessment/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId,
          formData: {
            partnerCustomerDetails: {
              newExisting,
              fullEntityName,
              registrationNumber,
              entityType,
              businessActivities,
              highRiskReasons,
            },
            mukuruDetails: {
              corridor,
              mukuruEntityName,
              products,
            },
            eddFindings: {
              eddStatus,
              eddOutstanding,
              pepExposure,
              ddDocuments,
              policyProcedureConcerns,
              mitigatingFactors,
            },
            adverseMedia: {
              adverseMediaIdentified,
              specialInterestCategories,
              adverseMediaSummary,
              discountingFactors,
              otherSources,
            },
            recommendations: {
              mlro: mlroRecommendation,
              groupHeadFC: groupHeadFCRecommendation,
              groupHeadCompliance: groupHeadComplianceRecommendation,
              execRiskAudit: execRiskAuditRecommendation,
              groupCounsel: groupCounselRecommendation,
            },
            approvals: {
              cco: ccoApproval,
              ceo: ceoApproval,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();

      // Upload to SignNow
      const formData = new FormData();
      formData.append('file', blob, `risk-assessment-${assessmentId}.pdf`);
      formData.append('fileName', `risk-assessment-${assessmentId}.pdf`);

      const uploadResponse = await fetch('/api/signnow/document', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload document to SignNow');
      }

      const document = await uploadResponse.json();
      setSignNowDocumentId(document.id);
      return document.id;
    } catch (err) {
      console.error('Error generating/uploading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate document');
      return null;
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Try to generate and upload document to SignNow (optional - don't block save if it fails)
      if (!signNowDocumentId) {
        try {
          await generateAndUploadDocument();
        } catch (docErr) {
          console.warn(
            '[EDD Form] SignNow document generation failed (non-blocking):',
            docErr
          );
          // Continue with save - SignNow is optional
        }
      }

      // Build comprehensive notes from all form data
      const formDataJson = JSON.stringify({
        partnerCustomerDetails: {
          newExisting,
          fullEntityName,
          registrationNumber,
          entityType,
          businessActivities,
          highRiskReasons,
        },
        mukuruDetails: {
          corridor,
          mukuruEntityName,
          products,
        },
        eddFindings: {
          eddStatus,
          eddOutstanding,
          pepExposure,
          ddDocuments,
          policyProcedureConcerns,
          mitigatingFactors,
        },
        adverseMedia: {
          adverseMediaIdentified,
          specialInterestCategories,
          adverseMediaSummary,
          discountingFactors,
          otherSources,
        },
        recommendations: {
          mlro: mlroRecommendation,
          groupHeadFC: groupHeadFCRecommendation,
          groupHeadCompliance: groupHeadComplianceRecommendation,
          execRiskAudit: execRiskAuditRecommendation,
          groupCounsel: groupCounselRecommendation,
        },
        approvals: {
          cco: ccoApproval,
          ceo: ceoApproval,
        },
      });

      if (riskAssessment) {
        await riskApiService.updateRiskAssessmentNotes(riskAssessment.id, formDataJson);
      }

      setSuccess('High-Risk Assessment form saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
        <AdminSidebar />
        <PortalHeader />
        <Flex
          minH="100vh"
          ml={condensed ? '72px' : '280px'}
          mt="90px"
          width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
          justify="center"
          align="center"
        >
          <Spinner size="xl" color="mukuru.buttons.primary" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="mukuru.background.light">
      <AdminSidebar />
      <PortalHeader />
      <Box
        minH="100vh"
        ml={condensed ? '72px' : '280px'}
        mt="90px"
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        bg="mukuru.background.light"
        px={{ base: '24px', md: '40px', lg: '60px' }}
        py="32px"
      >
        <Box maxW="900px" mx="auto">
          <VStack align="stretch" gap="24px">
            {/* Header */}
            <Flex justify="space-between" align="center">
              <HStack gap="16px">
                <Link href="/risk-review">
                  <Button variant="secondary" size="sm">
                    <FiArrowLeft style={{ marginRight: '8px' }} />
                    Back to Risk Review
                  </Button>
                </Link>
              </HStack>
              <Button variant="primary" onClick={handleSave} disabled={saving} size="md">
                <FiSave style={{ marginRight: '8px' }} />
                {saving ? 'Saving...' : 'Save Assessment'}
              </Button>
            </Flex>

            {/* Title Card */}
            <Box
              bg="mukuru.cards.white"
              borderRadius="16px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              overflow="hidden"
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
            >
              <Box p="24px" bg="mukuru.buttons.primary" textAlign="center">
                <HStack justify="center" gap="12px" mb="8px">
                  <FiShield size={28} color="white" />
                  <Typography fontSize="22px" fontWeight="700" color="white">
                    Mukuru Group High-Risk Assessment and Approval Form
                  </Typography>
                </HStack>
                <Typography fontSize="13px" color="rgba(255,255,255,0.8)">
                  Complete all sections for high-risk customer/partner assessment
                </Typography>
              </Box>
            </Box>

            {/* Alerts */}
            {error && (
              <Box
                p="16px"
                bg="rgba(220, 38, 38, 0.1)"
                borderRadius="12px"
                border="1px solid"
                borderColor="mukuru.text.error"
              >
                <HStack gap="12px">
                  <FiAlertTriangle color="var(--chakra-colors-mukuru-text-error)" />
                  <Typography fontSize="14px" color="mukuru.text.error">
                    {error}
                  </Typography>
                </HStack>
              </Box>
            )}
            {success && (
              <Box
                p="16px"
                bg="rgba(16, 185, 129, 0.1)"
                borderRadius="12px"
                border="1px solid"
                borderColor="mukuru.text.success"
              >
                <HStack gap="12px">
                  <FiCheckCircle color="var(--chakra-colors-mukuru-text-success)" />
                  <Typography fontSize="14px" color="mukuru.text.success">
                    {success}
                  </Typography>
                </HStack>
              </Box>
            )}

            {/* Section 1: Partner/Customer Details */}
            <Box
              bg="mukuru.cards.white"
              borderRadius="12px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              overflow="hidden"
            >
              <SectionHeader number={1} title="Partner / Customer Details" />
              <Box p="20px">
                <FormRow label="New / Existing" required>
                  <HStack gap="16px">
                    <OptionCard
                      label="New"
                      checked={newExisting === 'new'}
                      onChange={() => setNewExisting('new')}
                    />
                    <OptionCard
                      label="Existing"
                      checked={newExisting === 'existing'}
                      onChange={() => setNewExisting('existing')}
                    />
                  </HStack>
                </FormRow>
                <FormRow label="Full entity name" required>
                  <StyledInput
                    value={fullEntityName}
                    onChange={setFullEntityName}
                    placeholder="Enter full legal entity name"
                  />
                </FormRow>
                <FormRow label="Registration number">
                  <StyledInput
                    value={registrationNumber}
                    onChange={setRegistrationNumber}
                    placeholder="Enter registration number"
                  />
                </FormRow>
                <FormRow label="Entity type">
                  <StyledInput
                    value={entityType}
                    onChange={setEntityType}
                    placeholder="e.g., Private Company, Partnership, Trust"
                  />
                </FormRow>
                <FormRow label="Background and nature of business activities">
                  <StyledTextarea
                    value={businessActivities}
                    onChange={setBusinessActivities}
                    placeholder="Describe the business activities..."
                  />
                </FormRow>
                <Box py="16px">
                  <Typography fontSize="14px" fontWeight="600" color="#374151" mb="10px">
                    The partner/customer has been identified as a high-risk customer for
                    the following reasons:
                  </Typography>
                  <StyledTextarea
                    value={highRiskReasons}
                    onChange={setHighRiskReasons}
                    placeholder="List the reasons for high-risk classification..."
                  />
                </Box>
              </Box>
            </Box>

            {/* Section 2: Mukuru Details */}
            <Box
              bg="mukuru.cards.white"
              borderRadius="12px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              overflow="hidden"
            >
              <SectionHeader number={2} title="Mukuru Details" />
              <Box p="20px">
                <FormRow label="Corridor">
                  <StyledInput
                    value={corridor}
                    onChange={setCorridor}
                    placeholder="e.g., ZA-ZW, UK-ZA"
                  />
                </FormRow>
                <FormRow label="Mukuru entity name">
                  <StyledInput
                    value={mukuruEntityName}
                    onChange={setMukuruEntityName}
                    placeholder="Enter Mukuru entity name"
                  />
                </FormRow>
                <FormRow label="Mukuru product">
                  <SimpleGrid columns={{ base: 2, md: 3 }} gap="12px">
                    <CheckboxCard
                      label="DMT"
                      checked={products.dmt}
                      onChange={(c) => setProducts({ ...products, dmt: c })}
                    />
                    <CheckboxCard
                      label="IMT"
                      checked={products.imt}
                      onChange={(c) => setProducts({ ...products, imt: c })}
                    />
                    <CheckboxCard
                      label="EPP"
                      checked={products.epp}
                      onChange={(c) => setProducts({ ...products, epp: c })}
                    />
                    <CheckboxCard
                      label="Wallet"
                      checked={products.wallet}
                      onChange={(c) => setProducts({ ...products, wallet: c })}
                    />
                    <CheckboxCard
                      label="Insurance"
                      checked={products.insurance}
                      onChange={(c) => setProducts({ ...products, insurance: c })}
                    />
                    <CheckboxCard
                      label="Bill settlement"
                      checked={products.billSettlement}
                      onChange={(c) => setProducts({ ...products, billSettlement: c })}
                    />
                  </SimpleGrid>
                </FormRow>
              </Box>
            </Box>

            {/* Section 3: Enhanced Due Diligence Findings */}
            <Box
              bg="mukuru.cards.white"
              borderRadius="12px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              overflow="hidden"
            >
              <SectionHeader
                number={3}
                title="Enhanced Due Diligence Findings (completed by Financial Crime Compliance)"
              />
              <Box p="20px">
                <FormRow label="Is the AML/CFT EDD valid and complete?">
                  <VStack align="stretch" gap="12px">
                    <HStack gap="16px">
                      <OptionCard
                        label="EDD valid and complete"
                        checked={eddStatus === 'valid'}
                        onChange={() => setEddStatus('valid')}
                        variant="success"
                      />
                      <OptionCard
                        label="EDD incomplete"
                        checked={eddStatus === 'incomplete'}
                        onChange={() => setEddStatus('incomplete')}
                      />
                    </HStack>
                    {eddStatus === 'incomplete' && (
                      <Box>
                        <Typography fontSize="12px" color="#6B7280" mb="8px">
                          If not, list what is outstanding:
                        </Typography>
                        <StyledTextarea
                          value={eddOutstanding}
                          onChange={setEddOutstanding}
                          placeholder="List outstanding items..."
                        />
                      </Box>
                    )}
                  </VStack>
                </FormRow>
                <FormRow label="Is Partner/Customer an Entity with PEP exposure">
                  <HStack gap="16px">
                    <OptionCard
                      label="Entity"
                      checked={pepExposure === 'entity'}
                      onChange={() => setPepExposure('entity')}
                    />
                    <OptionCard
                      label="Individual"
                      checked={pepExposure === 'individual'}
                      onChange={() => setPepExposure('individual')}
                    />
                  </HStack>
                </FormRow>
                <FormRow label="What AML/CFT DD documents were obtained and are available for review?">
                  <StyledTextarea
                    value={ddDocuments}
                    onChange={setDdDocuments}
                    placeholder="List documents obtained..."
                  />
                </FormRow>
                <FormRow label="Are there concerns with any of the AML/CFT policies or procedures?">
                  <StyledTextarea
                    value={policyProcedureConcerns}
                    onChange={setPolicyProcedureConcerns}
                    placeholder="Describe any concerns..."
                  />
                </FormRow>
                <FormRow label="Mitigating factors / measures to consider to above concerns raised">
                  <StyledTextarea
                    value={mitigatingFactors}
                    onChange={setMitigatingFactors}
                    placeholder="Describe mitigating factors..."
                  />
                </FormRow>
              </Box>
            </Box>

            {/* Section 4: Adverse Media Assessment */}
            <Box
              bg="mukuru.cards.white"
              borderRadius="12px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              overflow="hidden"
            >
              <SectionHeader
                number={4}
                title="Adverse Media Assessment (Financial Crime)"
              />
              <Box p="20px">
                <FormRow label="Was Adverse Media identified?">
                  <HStack gap="16px">
                    <OptionCard
                      label="Yes"
                      checked={adverseMediaIdentified === 'yes'}
                      onChange={() => setAdverseMediaIdentified('yes')}
                      variant="danger"
                    />
                    <OptionCard
                      label="No"
                      checked={adverseMediaIdentified === 'no'}
                      onChange={() => setAdverseMediaIdentified('no')}
                      variant="success"
                    />
                  </HStack>
                </FormRow>
                <FormRow label="Special Interest Person / Entity Category (Dow Jones)">
                  <SimpleGrid columns={{ base: 2, md: 3 }} gap="12px">
                    <CheckboxCard
                      label="Corruption"
                      checked={specialInterestCategories.corruption}
                      onChange={(c) =>
                        setSpecialInterestCategories({
                          ...specialInterestCategories,
                          corruption: c,
                        })
                      }
                    />
                    <CheckboxCard
                      label="Financial Crimes"
                      checked={specialInterestCategories.financialCrimes}
                      onChange={(c) =>
                        setSpecialInterestCategories({
                          ...specialInterestCategories,
                          financialCrimes: c,
                        })
                      }
                    />
                    <CheckboxCard
                      label="Organised crime"
                      checked={specialInterestCategories.organisedCrime}
                      onChange={(c) =>
                        setSpecialInterestCategories({
                          ...specialInterestCategories,
                          organisedCrime: c,
                        })
                      }
                    />
                    <CheckboxCard
                      label="Tax crime"
                      checked={specialInterestCategories.taxCrime}
                      onChange={(c) =>
                        setSpecialInterestCategories({
                          ...specialInterestCategories,
                          taxCrime: c,
                        })
                      }
                    />
                    <CheckboxCard
                      label="Terror crime"
                      checked={specialInterestCategories.terrorCrime}
                      onChange={(c) =>
                        setSpecialInterestCategories({
                          ...specialInterestCategories,
                          terrorCrime: c,
                        })
                      }
                    />
                    <CheckboxCard
                      label="Trafficking crime"
                      checked={specialInterestCategories.traffickingCrime}
                      onChange={(c) =>
                        setSpecialInterestCategories({
                          ...specialInterestCategories,
                          traffickingCrime: c,
                        })
                      }
                    />
                  </SimpleGrid>
                  <Box mt="16px">
                    <Typography fontSize="14px" fontWeight="500" color="#374151" mb="8px">
                      Other:
                    </Typography>
                    <StyledInput
                      value={specialInterestCategories.other}
                      onChange={(val) =>
                        setSpecialInterestCategories({
                          ...specialInterestCategories,
                          other: val,
                        })
                      }
                      placeholder="Specify other category..."
                    />
                  </Box>
                </FormRow>
                <FormRow label="Summary of adverse media (including year of adverse event)">
                  <StyledTextarea
                    value={adverseMediaSummary}
                    onChange={setAdverseMediaSummary}
                    placeholder="Summarize adverse media findings..."
                  />
                </FormRow>
                <FormRow label="Discounting factors (if any) in assessing the significance of adverse media">
                  <StyledTextarea
                    value={discountingFactors}
                    onChange={setDiscountingFactors}
                    placeholder="Describe discounting factors..."
                  />
                </FormRow>
                <FormRow label="Other sources used (i.e., open-source internet searches) and summary of adverse media identified">
                  <StyledTextarea
                    value={otherSources}
                    onChange={setOtherSources}
                    placeholder="List other sources and findings..."
                  />
                </FormRow>
              </Box>
            </Box>

            {/* Section 5: Recommendations (2nd line of defence) */}
            <Box
              bg="mukuru.cards.white"
              borderRadius="12px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              overflow="hidden"
            >
              <SectionHeader number={5} title="Recommendations (2nd line of defence)" />
              <Box p="20px">
                <RecommendationSection
                  title="Money Laundering Reporting Officer"
                  role="MLRO"
                  recommendation={mlroRecommendation.recommendation}
                  rationale={mlroRecommendation.rationale}
                  date={mlroRecommendation.date}
                  signature={mlroRecommendation.signature}
                  onRecommendationChange={(v) =>
                    setMlroRecommendation({ ...mlroRecommendation, recommendation: v })
                  }
                  onRationaleChange={(v) =>
                    setMlroRecommendation({ ...mlroRecommendation, rationale: v })
                  }
                  onDateChange={(v) =>
                    setMlroRecommendation({ ...mlroRecommendation, date: v })
                  }
                  onSignatureChange={(v) =>
                    setMlroRecommendation({ ...mlroRecommendation, signature: v })
                  }
                  signNowDocumentId={signNowDocumentId}
                  signerEmail={signerEmails.mlro}
                />
                <RecommendationSection
                  title="Group Head of Financial Crime"
                  role="Inyath Roberts"
                  recommendation={groupHeadFCRecommendation.recommendation}
                  rationale={groupHeadFCRecommendation.rationale}
                  date={groupHeadFCRecommendation.date}
                  signature={groupHeadFCRecommendation.signature}
                  onRecommendationChange={(v) =>
                    setGroupHeadFCRecommendation({
                      ...groupHeadFCRecommendation,
                      recommendation: v,
                    })
                  }
                  onRationaleChange={(v) =>
                    setGroupHeadFCRecommendation({
                      ...groupHeadFCRecommendation,
                      rationale: v,
                    })
                  }
                  onDateChange={(v) =>
                    setGroupHeadFCRecommendation({
                      ...groupHeadFCRecommendation,
                      date: v,
                    })
                  }
                  onSignatureChange={(v) =>
                    setGroupHeadFCRecommendation({
                      ...groupHeadFCRecommendation,
                      signature: v,
                    })
                  }
                  signNowDocumentId={signNowDocumentId}
                  signerEmail={signerEmails.groupHeadFC}
                />
                <RecommendationSection
                  title="Group Head of Compliance"
                  role="Phumelela Maliza"
                  recommendation={groupHeadComplianceRecommendation.recommendation}
                  rationale={groupHeadComplianceRecommendation.rationale}
                  date={groupHeadComplianceRecommendation.date}
                  signature={groupHeadComplianceRecommendation.signature}
                  onRecommendationChange={(v) =>
                    setGroupHeadComplianceRecommendation({
                      ...groupHeadComplianceRecommendation,
                      recommendation: v,
                    })
                  }
                  onRationaleChange={(v) =>
                    setGroupHeadComplianceRecommendation({
                      ...groupHeadComplianceRecommendation,
                      rationale: v,
                    })
                  }
                  onDateChange={(v) =>
                    setGroupHeadComplianceRecommendation({
                      ...groupHeadComplianceRecommendation,
                      date: v,
                    })
                  }
                  onSignatureChange={(v) =>
                    setGroupHeadComplianceRecommendation({
                      ...groupHeadComplianceRecommendation,
                      signature: v,
                    })
                  }
                  signNowDocumentId={signNowDocumentId}
                  signerEmail={signerEmails.groupHeadCompliance}
                />
                <RecommendationSection
                  title="Executive Risk and Internal Audit"
                  role="Nishan Sing"
                  recommendation={execRiskAuditRecommendation.recommendation}
                  rationale={execRiskAuditRecommendation.rationale}
                  date={execRiskAuditRecommendation.date}
                  signature={execRiskAuditRecommendation.signature}
                  onRecommendationChange={(v) =>
                    setExecRiskAuditRecommendation({
                      ...execRiskAuditRecommendation,
                      recommendation: v,
                    })
                  }
                  onRationaleChange={(v) =>
                    setExecRiskAuditRecommendation({
                      ...execRiskAuditRecommendation,
                      rationale: v,
                    })
                  }
                  onDateChange={(v) =>
                    setExecRiskAuditRecommendation({
                      ...execRiskAuditRecommendation,
                      date: v,
                    })
                  }
                  onSignatureChange={(v) =>
                    setExecRiskAuditRecommendation({
                      ...execRiskAuditRecommendation,
                      signature: v,
                    })
                  }
                  signNowDocumentId={signNowDocumentId}
                  signerEmail={signerEmails.execRiskAudit}
                />
                <RecommendationSection
                  title="Group General Counsel"
                  role="David Isenegger"
                  recommendation={groupCounselRecommendation.recommendation}
                  rationale={groupCounselRecommendation.rationale}
                  date={groupCounselRecommendation.date}
                  signature={groupCounselRecommendation.signature}
                  onRecommendationChange={(v) =>
                    setGroupCounselRecommendation({
                      ...groupCounselRecommendation,
                      recommendation: v,
                    })
                  }
                  onRationaleChange={(v) =>
                    setGroupCounselRecommendation({
                      ...groupCounselRecommendation,
                      rationale: v,
                    })
                  }
                  onDateChange={(v) =>
                    setGroupCounselRecommendation({
                      ...groupCounselRecommendation,
                      date: v,
                    })
                  }
                  onSignatureChange={(v) =>
                    setGroupCounselRecommendation({
                      ...groupCounselRecommendation,
                      signature: v,
                    })
                  }
                  signNowDocumentId={signNowDocumentId}
                  signerEmail={signerEmails.groupCounsel}
                />
              </Box>
            </Box>

            {/* Section 6: Approvals and Risk Acceptances */}
            <Box
              bg="mukuru.cards.white"
              borderRadius="12px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              overflow="hidden"
            >
              <SectionHeader number={6} title="Approvals and Risk Acceptances" />
              <Box p="20px">
                <RecommendationSection
                  title="Group Chief Commercial Officer"
                  role="Dougal Bennett"
                  recommendation={ccoApproval.recommendation}
                  rationale={ccoApproval.rationale}
                  date={ccoApproval.date}
                  signature={ccoApproval.signature}
                  onRecommendationChange={(v) =>
                    setCcoApproval({ ...ccoApproval, recommendation: v })
                  }
                  onRationaleChange={(v) =>
                    setCcoApproval({ ...ccoApproval, rationale: v })
                  }
                  onDateChange={(v) => setCcoApproval({ ...ccoApproval, date: v })}
                  onSignatureChange={(v) =>
                    setCcoApproval({ ...ccoApproval, signature: v })
                  }
                  signNowDocumentId={signNowDocumentId}
                  signerEmail={signerEmails.cco}
                  isApproval
                />
                <RecommendationSection
                  title="Group Chief Executive Officer"
                  role="Andy Jury"
                  recommendation={ceoApproval.recommendation}
                  rationale={ceoApproval.rationale}
                  date={ceoApproval.date}
                  signature={ceoApproval.signature}
                  onRecommendationChange={(v) =>
                    setCeoApproval({ ...ceoApproval, recommendation: v })
                  }
                  onRationaleChange={(v) =>
                    setCeoApproval({ ...ceoApproval, rationale: v })
                  }
                  onDateChange={(v) => setCeoApproval({ ...ceoApproval, date: v })}
                  onSignatureChange={(v) =>
                    setCeoApproval({ ...ceoApproval, signature: v })
                  }
                  signNowDocumentId={signNowDocumentId}
                  signerEmail={signerEmails.ceo}
                  isApproval
                />
              </Box>
            </Box>

            {/* Save Button at Bottom */}
            <Flex justify="flex-end" pt="16px">
              <Button variant="primary" onClick={handleSave} disabled={saving} size="md">
                <FiSave style={{ marginRight: '8px' }} />
                {saving ? 'Saving...' : 'Save Assessment'}
              </Button>
            </Flex>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}
