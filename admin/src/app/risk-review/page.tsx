"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  SimpleGrid,
  Flex,
  Spinner,
  Textarea,
  Avatar
} from "@chakra-ui/react";
import { 
  Search, 
  Typography, 
  Button, 
  Tag, 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  IconWrapper, 
  AlertBar,
  Card,
  DataTable,
  Tooltip
} from "@/lib/mukuruImports";
import type { ColumnConfig } from "@mukuru/mukuru-react-components";
import { 
  FiShield, 
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFlag,
  FiAlertCircle,
  FiEdit3,
  FiFilter
} from "react-icons/fi";
import { WarningIcon, ChevronRightIcon } from "@/lib/mukuruImports";
import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import PortalHeader from "../../components/PortalHeader";
import { useSidebar } from "../../contexts/SidebarContext";
import { riskApiService, EnrichedRiskAssessment } from "../../services/riskApi";
import { fetchApplications, OnboardingCaseProjection } from "../../services";
import { logger } from "../../lib/logger";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type RiskAssessment = EnrichedRiskAssessment;

// Extended type to include cases that need risk review
interface RiskReviewItem extends RiskAssessment {
  needsAssessment?: boolean;
  caseProjection?: OnboardingCaseProjection;
}

type RiskFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export default function RiskReviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { condensed } = useSidebar();
  const [assessments, setAssessments] = useState<RiskReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [classificationModalOpen, setClassificationModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<RiskReviewItem | null>(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [creatingAssessment, setCreatingAssessment] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadRiskAssessments = useCallback(async (filter?: RiskFilter, searchQuery?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[Risk Review Page] Loading risk assessments with filters:', {
        riskLevel: filter || riskFilter,
        search: searchQuery || searchTerm,
      });
      
      const activeFilter = filter || riskFilter;
      const filters: any = {};
      if (activeFilter !== "ALL") {
        let backendRiskLevel: string = activeFilter;
        if (activeFilter === "CRITICAL") {
          backendRiskLevel = "High";
        } else if (activeFilter === "HIGH") {
          backendRiskLevel = "High";
        } else if (activeFilter === "MEDIUM") {
          backendRiskLevel = "Medium";
        } else if (activeFilter === "LOW") {
          backendRiskLevel = "Low";
        }
        filters.riskLevel = backendRiskLevel;
      }
      
      if (searchQuery && searchQuery.trim().length > 0) {
        const looksLikeCaseId = /^[0-9a-f-]{8,}$/i.test(searchQuery.trim()) || searchQuery.trim().length >= 8;
        if (looksLikeCaseId) {
          filters.caseId = searchQuery.trim();
        }
      }
      
      const existingAssessments = await riskApiService.listRiskAssessments(filters);
      
      let casesNeedingReview: OnboardingCaseProjection[] = [];
      if (activeFilter === "ALL" || !activeFilter) {
        try {
          // Use new service structure to fetch applications
          const result = await fetchApplications(1, 1000, undefined, 'SUBMITTED');
          const allCases = result.items.map(app => ({
            id: app.id,
            caseId: app.id,
            businessLegalName: app.companyName,
            applicantFirstName: '',
            applicantLastName: '',
            type: app.entityType,
            status: app.status,
            assignedTo: app.assignedTo,
            assignedToName: app.assignedTo,
            submittedAt: app.submittedDate,
            createdAt: app.submittedDate,
          } as OnboardingCaseProjection));
          const assessmentCaseIds = new Set(existingAssessments.map(a => a.caseId.toLowerCase()));
          casesNeedingReview = allCases.filter((caseItem: OnboardingCaseProjection) => {
            const caseId = (caseItem.caseId || caseItem.id).toLowerCase();
            return !assessmentCaseIds.has(caseId);
          });
        } catch (err) {
          logger.warn("Failed to fetch cases needing review", {
            tags: { error_type: 'risk_review_fetch_error' },
            extra: { error: err }
          });
        }
      }
      
      const combinedItems: RiskReviewItem[] = [
        ...existingAssessments.map(assessment => ({ ...assessment, needsAssessment: false })),
        ...casesNeedingReview.map(caseItem => {
          const caseId = caseItem.caseId || caseItem.id;
          const companyName = caseItem.businessLegalName || 
                            `${caseItem.applicantFirstName || ''} ${caseItem.applicantLastName || ''}`.trim() ||
                            'Unknown Company';
          
          return {
            id: `pending-${caseId}`,
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
      console.error("[Risk Review Page] Failed to load risk assessments:", err);
      setError(err instanceof Error ? err.message : "Failed to load risk assessments. Please ensure the backend services are running.");
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }, [riskFilter, searchTerm]);

  useEffect(() => {
    loadRiskAssessments();
  }, [loadRiskAssessments, refreshKey]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
    if (query.length === 0 || query.length >= 3) {
      loadRiskAssessments(riskFilter, query);
    }
  }, [riskFilter, loadRiskAssessments]);

  useEffect(() => {
    loadRiskAssessments(riskFilter, searchTerm);
  }, [riskFilter]);

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

  const filteredAssessments = assessments.filter(assessment => {
    const searchTermLower = searchTerm.toLowerCase();
    const looksLikeCaseId = searchTerm.length > 0 && (/^[0-9a-f-]{8,}$/i.test(searchTerm.trim()) || searchTerm.trim().length >= 8);
    
    let matchesSearch = true;
    if (searchTerm.length > 0 && !looksLikeCaseId) {
      matchesSearch = assessment.companyName.toLowerCase().includes(searchTermLower) ||
                     assessment.applicationId.toLowerCase().includes(searchTermLower);
    }
    
    const matchesRisk = riskFilter === "ALL" || assessment.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const criticalCount = assessments.filter(a => a.riskLevel === 'CRITICAL').length;
  const highCount = assessments.filter(a => a.riskLevel === 'HIGH').length;
  const pendingCount = assessments.filter(a => {
    const isUnknown = a.riskLevel === 'UNKNOWN' || !a.riskLevel;
    return a.status === 'PENDING' || isUnknown || (a.status === 'IN_REVIEW' && isUnknown);
  }).length;
  const approvedCount = assessments.filter(a => a.status === 'APPROVED').length;

  const columns: ColumnConfig<RiskReviewItem>[] = [
    {
      field: 'companyName',
      header: 'Company Name',
      width: '200px',
      minWidth: '200px',
      render: (value, row) => (
        <Typography fontWeight="medium" color="gray.800">
          {row.companyName}
        </Typography>
      ),
    },
    {
      field: 'applicationId',
      header: 'Application ID',
      width: '150px',
      minWidth: '150px',
      render: (value, row) => (
        <Typography color="gray.600" fontSize="xs">
          {row.applicationId}
        </Typography>
      ),
    },
    {
      field: 'entityType',
      header: 'Entity Type',
      width: '120px',
      minWidth: '120px',
      render: (value, row) => (
        <Typography color="gray.700">
          {row.entityType}
        </Typography>
      ),
    },
    {
      field: 'riskLevel',
      header: 'Risk Level',
      width: '140px',
      minWidth: '140px',
      render: (value, row) => (
        row.riskLevel === 'UNKNOWN' || !row.riskLevel ? (
          <Tag variant="inactive">Not Assessed</Tag>
        ) : (
          <Tag variant={getRiskColor(row.riskLevel) === 'red' ? 'danger' : getRiskColor(row.riskLevel) === 'orange' ? 'warning' : 'info'}>
            {row.riskLevel}
          </Tag>
        )
      ),
    },
    {
      field: 'status',
      header: 'Status',
      width: '120px',
      minWidth: '120px',
      render: (value, row) => (
        <Tag variant={getStatusColor(row.status) === 'green' ? 'success' : getStatusColor(row.status) === 'red' ? 'danger' : getStatusColor(row.status) === 'orange' ? 'warning' : 'info'}>
          {row.status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      field: 'assignedTo',
      header: 'Assigned To',
      width: '140px',
      minWidth: '140px',
      render: (value, row) => (
        <Typography color="gray.700" fontSize="xs">
          {row.assignedTo}
        </Typography>
      ),
    },
    {
      field: 'submittedDate',
      header: 'Submitted',
      width: '120px',
      minWidth: '120px',
      render: (value, row) => (
        <Typography color="gray.600" fontSize="xs">
          {new Date(row.submittedDate).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'riskScore',
      header: 'Risk Score',
      width: '120px',
      minWidth: '120px',
      render: (value, row) => (
        row.riskLevel !== 'UNKNOWN' && row.riskLevel && row.riskScore > 0 ? (
          <HStack gap="1" align="center">
            <Typography fontSize="xs" color="gray.600" minW="35px">
              {row.riskScore}%
            </Typography>
            <Box flex="1" height="6px" bg="gray.200" borderRadius="full" overflow="hidden">
              <Box
                width={`${row.riskScore}%`}
                height="100%"
                bg={row.riskScore >= 80 ? 'red.400' : row.riskScore >= 60 ? 'orange.400' : row.riskScore >= 40 ? 'yellow.400' : 'green.400'}
                borderRadius="full"
              />
            </Box>
          </HStack>
        ) : (
          <Typography fontSize="xs" color="gray.400" fontStyle="italic">
            N/A
          </Typography>
        )
      ),
    },
  ];

  const actionColumn = {
    header: 'Actions',
    width: '200px',
    render: (row: RiskReviewItem) => (
      <HStack gap="2">
        <Tooltip content="Review">
          <button
            onClick={async () => {
              try {
                const workItemId = (row as any).workItemId || row.applicationId;
                router.push(`/review/${workItemId}`);
              } catch (err) {
                console.error('Error navigating to review:', err);
                router.push(`/applications/${row.applicationId}`);
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#F05423',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconWrapper><FiShield size={14} /></IconWrapper>
            Review
          </button>
        </Tooltip>
        {row.needsAssessment ? (
          <Tooltip content="Create Assessment">
            <button
              onClick={async () => {
                if (!row.caseProjection) return;
                setCreatingAssessment(row.caseId);
                try {
                  await riskApiService.createRiskAssessment(
                    row.caseId,
                    row.caseProjection.partnerId
                  );
                  setRefreshKey(prev => prev + 1);
                } catch (err) {
                  console.error('Failed to create risk assessment:', err);
                  alert('Failed to create risk assessment. Please try again.');
                } finally {
                  setCreatingAssessment(null);
                }
              }}
              disabled={creatingAssessment === row.caseId}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                backgroundColor: 'white',
                color: '#111827',
                cursor: creatingAssessment === row.caseId ? 'not-allowed' : 'pointer',
                opacity: creatingAssessment === row.caseId ? 0.5 : 1,
              }}
            >
              Create Assessment
            </button>
          </Tooltip>
        ) : (
          <Tooltip content={row.riskLevel === 'UNKNOWN' || !row.riskLevel ? 'Classify' : 'Update'}>
            <button
              onClick={() => {
                setSelectedAssessment(row);
                setSelectedRiskLevel(row.riskLevel || '');
                setJustification('');
                setClassificationModalOpen(true);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                backgroundColor: 'white',
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <IconWrapper><FiEdit3 size={14} /></IconWrapper>
              {row.riskLevel === 'UNKNOWN' || !row.riskLevel ? 'Classify' : 'Update'}
            </button>
          </Tooltip>
        )}
      </HStack>
    ),
  };

  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />
      <Box 
        ml={condensed ? "72px" : "280px"} 
        mt="90px" 
        minH="calc(100vh - 90px)" 
        width={condensed ? "calc(100% - 72px)" : "calc(100% - 280px)"} 
        bg="gray.50" 
        overflowX="hidden" 
        transition="margin-left 0.3s ease, width 0.3s ease"
      >
        <PortalHeader />
        <Container maxW="100%" px="8" py="6" width="full">
          <VStack gap="4" align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center" mb="4">
              <VStack align="start" gap="1">
                <Typography fontSize="3xl" fontWeight="bold" color="gray.800">
                  Risk Review
                </Typography>
                <Typography color="gray.600">
                  Manually review and classify application risk levels
                </Typography>
              </VStack>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRefreshKey(prev => prev + 1);
                }}
                className="mukuru-primary-button"
              >
                <IconWrapper><FiFilter size={16} /></IconWrapper>
                Refresh
              </Button>
            </Flex>

            {/* Error Alert */}
            {error && (
              <AlertBar status="error" title="Error loading risk assessments">
                {error}
              </AlertBar>
            )}

            {/* Manual Review Notice */}
            <AlertBar status="info" title="Manual Risk Review Required">
              All risk classifications must be done manually by authorized personnel. No automatic risk scoring or classification is performed.
            </AlertBar>

            {/* Risk Summary Cards */}
            <SimpleGrid columns={{ base: 1, md: 4 }} gap="4">
              <Card bg="white" p="4">
                <Flex gap="4" align="center">
                  <Avatar.Root bg="red.100" size="md" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper><FiAlertTriangle size={20} color="#E53E3E" /></IconWrapper>
                  </Avatar.Root>
                  <VStack align="start" gap="0" flex="1">
                    <Typography fontSize="sm" color="gray.600">Critical Risk</Typography>
                    <Typography fontSize="30px" fontWeight="bold" color="red.600" fontFamily="Madera, sans-serif">
                      {criticalCount}
                    </Typography>
                  </VStack>
                  <ChevronRightIcon />
                </Flex>
              </Card>
              
              <Card bg="white" p="4">
                <Flex gap="4" align="center">
                  <Avatar.Root bg="orange.100" size="md" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper><FiFlag size={20} color="#DD6B20" /></IconWrapper>
                  </Avatar.Root>
                  <VStack align="start" gap="0" flex="1">
                    <Typography fontSize="sm" color="gray.600">High Risk</Typography>
                    <Typography fontSize="30px" fontWeight="bold" color="orange.600" fontFamily="Madera, sans-serif">
                      {highCount}
                    </Typography>
                  </VStack>
                  <ChevronRightIcon />
                </Flex>
              </Card>
              
              <Card bg="white" p="4">
                <Flex gap="4" align="center">
                  <Avatar.Root bg="blue.100" size="md" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper><FiClock size={20} color="#3182CE" /></IconWrapper>
                  </Avatar.Root>
                  <VStack align="start" gap="0" flex="1">
                    <Typography fontSize="sm" color="gray.600">Pending Manual Review</Typography>
                    <Typography fontSize="30px" fontWeight="bold" color="blue.600" fontFamily="Madera, sans-serif">
                      {pendingCount}
                    </Typography>
                  </VStack>
                  <ChevronRightIcon />
                </Flex>
              </Card>
              
              <Card bg="white" p="4">
                <Flex gap="4" align="center">
                  <Avatar.Root bg="green.100" size="md" display="flex" alignItems="center" justifyContent="center">
                    <IconWrapper><FiCheckCircle size={20} color="#38A169" /></IconWrapper>
                  </Avatar.Root>
                  <VStack align="start" gap="0" flex="1">
                    <Typography fontSize="sm" color="gray.600">Approved</Typography>
                    <Typography fontSize="30px" fontWeight="bold" color="green.600" fontFamily="Madera, sans-serif">
                      {approvedCount}
                    </Typography>
                  </VStack>
                  <ChevronRightIcon />
                </Flex>
              </Card>
            </SimpleGrid>

            {/* Risk Filter Buttons */}
            <HStack gap="2" mb="2">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as RiskFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant="primary"
                  onClick={() => setRiskFilter(filter)}
                  className="mukuru-primary-button"
                  style={{ opacity: riskFilter === filter ? 1 : 0.7 }}
                >
                  {filter === 'ALL' ? 'All' : filter}
                </Button>
              ))}
            </HStack>

            {/* Search Bar */}
            <Box width="100%" maxW="800px">
              <Search
                placeholder="Search by company name or application ID..."
                onSearchChange={handleSearchChange}
              />
            </Box>

            {/* Risk Assessments Table */}
            <Box className="work-queue-table-wrapper" width="100%">
              <DataTable
                data={filteredAssessments as unknown as Record<string, unknown>[]}
                columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
                actionColumn={actionColumn as unknown as { header?: string; width?: string; render: (row: Record<string, unknown>, index: number) => React.ReactNode }}
                loading={loading}
              />
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Manual Risk Classification Modal */}
      <Modal
        isOpen={classificationModalOpen}
        onClose={() => {
          setClassificationModalOpen(false);
          setSelectedAssessment(null);
          setSelectedRiskLevel('');
          setJustification('');
        }}
        title="Classify Risk Level"
        size="small"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <HStack gap="3" align="center">
            <IconWrapper><FiShield size={20} color="#FB923C" /></IconWrapper>
            <VStack align="start" gap="0">
              <Typography fontSize="lg" fontWeight="700">
                Classify Risk Level
              </Typography>
              <Typography fontSize="sm" color="gray.600">
                Manually set the risk classification for this application
              </Typography>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalBody>
          <VStack gap="5" align="stretch">
            <Box>
              <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                Application
              </Typography>
              <Typography fontSize="sm" color="gray.600">
                {selectedAssessment?.companyName || selectedAssessment?.applicationId}
              </Typography>
            </Box>

            <Box>
              <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                Risk Level <Typography as="span" color="red.500">*</Typography>
              </Typography>
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
              <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                Justification <Typography as="span" color="red.500">*</Typography>
              </Typography>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Provide justification for this risk classification..."
                rows={4}
                resize="vertical"
              />
              <Typography fontSize="xs" color="gray.500" mt="1">
                This justification will be recorded in the audit trail
              </Typography>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="3" justify="flex-end">
            <Button
              variant="secondary"
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
              variant="primary"
              className="mukuru-primary-button"
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
                  setRefreshKey(prev => prev + 1);
                } catch (err) {
                  console.error('Failed to classify risk:', err);
                  alert('Failed to classify risk. Please try again.');
                } finally {
                  setClassifying(false);
                }
              }}
              disabled={classifying || !selectedRiskLevel || !justification.trim()}
            >
              Classify Risk
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>
    </Flex>
  );
}
