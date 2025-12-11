'use client';

import { Box, VStack, HStack, Flex, Spinner, SimpleGrid } from '@chakra-ui/react';
import {
  Search,
  Typography,
  Button,
  Tag,
  DataTable,
  AlertBar,
  Dropdown,
  Tooltip,
} from '@mukuru/mukuru-react-components';
import type { ColumnConfig } from '@mukuru/mukuru-react-components';
import {
  FiRefreshCw,
  FiDownload,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import { riskApiService, EnrichedRiskAssessment } from '../../services/riskApi';
import {
  getApplications,
  OnboardingCaseProjection,
} from '../../services';
import { logger } from '../../lib/logger';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type TabFilter = 'All' | 'Pending' | 'Completed' | 'High Risk';

type RiskAssessment = EnrichedRiskAssessment;

// Extended type to include cases that need risk review
interface RiskReviewItem extends RiskAssessment {
  needsAssessment?: boolean;
}

export default function RiskReviewPage() {
  useSession();
  const { condensed } = useSidebar();
  const router = useRouter();

  // Mukuru Design System color tokens
  const bgColor = 'mukuru.background.light';
  const cardBg = 'mukuru.cards.white';
  const textColor = 'mukuru.text.primary';
  const borderColor = 'mukuru.grey.light';
  const labelColor = 'mukuru.grey.mediumDark';
  const subtleText = 'mukuru.grey.medium';

  const [assessments, setAssessments] = useState<RiskReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filters
  const [filters, setFilters] = useState<{
    riskLevel?: string;
    status?: string;
  }>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const loadAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all risk assessments
      const assessmentsList = await riskApiService.listRiskAssessments({
        page: 1,
        pageSize: 1000,
      });

      // Enrich with case data
      // Fetch all cases once to avoid multiple API calls
      let allCases: OnboardingCaseProjection[] = [];
      try {
        const casesResult = await getApplications(1, 1000);
        allCases = casesResult.items || [];
      } catch (err) {
        logger.error(err, '[Risk Review Page] Error fetching cases for enrichment', {
          tags: { error_type: 'case_fetch_error' },
        });
      }

      const enriched: RiskReviewItem[] = assessmentsList.map((assessment) => {
        try {
          // Try to find case by both id (GUID) and caseId (case number string)
          const caseData = allCases.find(
            (c) => c.id === assessment.caseId || c.caseId === assessment.caseId
          );

          // Build applicant name from available fields
          let applicantName: string | undefined;
          if (caseData) {
            const firstName = caseData.applicantFirstName?.trim() || '';
            const lastName = caseData.applicantLastName?.trim() || '';
            if (firstName || lastName) {
              applicantName = `${firstName} ${lastName}`.trim();
            } else if (caseData.applicantEmail) {
              applicantName = caseData.applicantEmail;
            }
          }

          // Get business name
          const businessName = caseData?.businessLegalName?.trim() || undefined;

          return {
            ...assessment,
            caseNumber: caseData?.caseId || assessment.caseId,
            applicantName,
            businessName,
            entityType: caseData?.type,
            country: caseData?.applicantCountry,
          } as RiskReviewItem;
        } catch (err) {
          logger.error(err, '[Risk Review Page] Error enriching assessment', {
            tags: { error_type: 'enrichment_error', assessmentId: assessment.id },
          });
          return assessment as RiskReviewItem;
        }
      });

      setAssessments(enriched);
    } catch (err) {
      logger.error(err, '[Risk Review Page] Error loading assessments', {
        tags: { error_type: 'risk_review_load_error' },
      });
      setError(err instanceof Error ? err.message : 'Failed to load risk assessments');
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, activeTab]);

  // Filter assessments based on tab and filters
  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        assessment.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Tab filter
      let matchesTab = true;
      if (activeTab === 'Pending') {
        matchesTab = assessment.status === 'InProgress' || assessment.status === 'Pending';
      } else if (activeTab === 'Completed') {
        matchesTab = assessment.status === 'Completed';
      } else if (activeTab === 'High Risk') {
        const level = assessment.overallRiskLevel?.toLowerCase();
        matchesTab = level === 'high' || level === 'mediumhigh';
      }
      
      // Advanced filters
      const matchesRiskLevel =
        !filters.riskLevel || assessment.overallRiskLevel === filters.riskLevel;
      const matchesStatus =
        !filters.status || assessment.status === filters.status;
      
      return matchesSearch && matchesTab && matchesRiskLevel && matchesStatus;
    });
  }, [assessments, searchTerm, activeTab, filters]);

  // Get counts for tabs
  const tabCounts = useMemo(() => {
    const pending = assessments.filter((a) => a.status === 'InProgress' || a.status === 'Pending').length;
    const completed = assessments.filter((a) => a.status === 'Completed').length;
    const highRisk = assessments.filter((a) => {
      const level = a.overallRiskLevel?.toLowerCase();
      return level === 'high' || level === 'mediumhigh';
    }).length;
    return { all: assessments.length, pending, completed, highRisk };
  }, [assessments]);

  // Paginated data
  const paginatedAssessments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssessments.slice(start, start + pageSize);
  }, [filteredAssessments, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAssessments.length / pageSize);

  const getRiskColor = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'LOW':
        return 'green';
      case 'MEDIUM':
        return 'orange';
      case 'HIGH':
        return 'red';
      case 'CRITICAL':
        return 'red';
      default:
        return 'gray';
    }
  };

  const columns: ColumnConfig<RiskReviewItem>[] = [
    {
      field: 'caseId',
      header: 'CASE ID',
      sortable: true,
      render: (value, row) => {
        const caseId = (row.caseNumber as string) || (value as string) || 'N/A';
        return (
          <Typography
            fontSize="12px"
            fontFamily="mono"
            color={textColor}
            style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}
          >
            {caseId}
          </Typography>
        );
      },
    },
    {
      field: 'applicantName',
      header: 'APPLICANT / BUSINESS',
      sortable: true,
      render: (value, row) => (
        <VStack align="start" gap="2px">
          <Typography 
            fontSize="13px" 
            fontWeight="500" 
            color={textColor}
            style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              maxWidth: '100%',
              lineHeight: '20px'
            }}
          >
            {row.businessName || (value as string) || row.caseId || 'N/A'}
          </Typography>
          {row.businessName && value && (
            <Typography 
              fontSize="11px" 
              color="mukuru.grey.medium"
              fontWeight="400"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                lineHeight: '1.3'
              }}
            >
              {value as string}
            </Typography>
          )}
        </VStack>
      ),
    },
    {
      field: 'overallRiskLevel',
      header: 'RISK LEVEL',
      sortable: true,
      render: (value) => {
        const risk = (value as string)?.trim() || '';
        // If risk is empty or "Unknown", show as "Not Assessed"
        const displayRisk = !risk || risk === 'Unknown' ? 'Not Assessed' : risk;
        const color = getRiskColor(risk);
        const variant =
          color === 'red'
            ? 'danger'
            : color === 'orange'
              ? 'warning'
              : color === 'green'
                ? 'success'
                : 'info';
        return <Tag variant={variant}>{displayRisk}</Tag>;
      },
    },
    {
      field: 'riskScore',
      header: 'SCORE',
      sortable: true,
      render: (value) => (
        <Typography 
          fontSize="13px" 
          fontWeight="500" 
          color={textColor}
          style={{ lineHeight: '20px' }}
        >
          {value !== undefined && value !== null ? `${value}%` : '—'}
        </Typography>
      ),
    },
    {
      field: 'status',
      header: 'STATUS',
      sortable: true,
      render: (value, row) => {
        const status = (value as string) || 'InProgress';
        const riskLevel = row.overallRiskLevel?.toLowerCase();
        const isHighRisk = riskLevel === 'high' || riskLevel === 'mediumhigh';
        
        // For high risk cases, check if EDD is required
        // If status is "Completed" but it's high risk, show "Pending EDD" unless EDD form is completed
        // EDD is considered complete if notes contain structured EDD data (JSON format)
        const hasEddCompleted = row.notes && (
          row.notes.includes('"partnerCustomerDetails"') || 
          row.notes.includes('"eddFindings"') ||
          row.notes.includes('"recommendations"')
        );
        
        let displayStatus = status;
        let statusColor = 'mukuru.buttons.primary';
        
        if (isHighRisk && status === 'Completed' && !hasEddCompleted) {
          displayStatus = 'Pending EDD';
          statusColor = 'orange.500';
        } else if (status === 'Completed') {
          statusColor = 'mukuru.teal';
        } else if (status === 'InProgress' || status === 'Pending') {
          displayStatus = 'In Progress';
          statusColor = 'mukuru.buttons.primary';
        } else if (status === 'Rejected') {
          statusColor = 'mukuru.text.error';
        }
        
        return (
          <Typography 
            fontSize="13px" 
            fontWeight="500"
            color={statusColor}
            style={{ lineHeight: '20px' }}
          >
            {displayStatus}
          </Typography>
        );
      },
    },
    {
      field: 'createdAt',
      header: 'CREATED',
      sortable: true,
      render: (value) => (
        <Typography 
          fontSize="13px" 
          color={subtleText}
          style={{ lineHeight: '20px' }}
        >
          {value
            ? new Date(value as string).toLocaleDateString('en-ZA', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </Typography>
      ),
    },
  ];

  // Tab component - Entity Types style (underline on active)
  const Tab = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
    <Box
      as="button"
      pb="2"
      borderBottom="2px solid"
      borderColor={isActive ? 'mukuru.charcoal' : 'transparent'}
      color={isActive ? 'mukuru.charcoal' : subtleText}
      fontWeight={isActive ? '500' : '400'}
      fontSize="sm"
      bg="transparent"
      _hover={{ color: 'mukuru.charcoal' }}
      transition="all 0.15s"
      onClick={onClick}
    >
      {label}
    </Box>
  );

  // Get risk icon
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel?.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return <FiAlertTriangle size={16} color="#E53E3E" />;
      case 'MEDIUM':
        return <FiShield size={16} color="#DD6B20" />;
      case 'LOW':
        return <FiCheckCircle size={16} color="#38A169" />;
      default:
        return <FiShield size={16} color="#718096" />;
    }
  };

  const actionColumn = {
    header: 'ACTIONS',
    width: '100px',
    render: (row: RiskReviewItem) => {
      // ENFORCEMENT: Only show Review button for High or MediumHigh risk cases
      const riskLevel = row.overallRiskLevel?.toLowerCase();
      const isHighRisk = riskLevel === 'high' || riskLevel === 'mediumhigh';
      
      if (!isHighRisk) {
        return (
          <Typography fontSize="sm" color="mukuru.grey.medium" fontStyle="italic">
            N/A
          </Typography>
        );
      }
      
      return (
        <Button
          size="sm"
          variant="primary"
          onClick={() => router.push(`/risk-assessment/${row.id}`)}
        >
          Review
        </Button>
      );
    },
  };

  // Loading state
  if (loading && assessments.length === 0) {
    return (
      <Flex minH="100vh" bg={bgColor}>
        <AdminSidebar />
        <PortalHeader />
        <Box
          flex="1"
          ml={condensed ? '72px' : '280px'}
          mt="90px"
          minH="calc(100vh - 90px)"
          width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
          bg={bgColor}
        >
          <Flex justify="center" align="center" h="400px">
            <VStack gap="4">
              <Spinner size="xl" color="mukuru.buttons.primary" />
              <Typography color={textColor}>Loading risk assessments...</Typography>
            </VStack>
          </Flex>
        </Box>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <AdminSidebar />
      <PortalHeader />

      {/* Error Alert */}
      {error && (
        <Box position="fixed" top="100px" right="24px" zIndex={10000} maxW="400px">
          <AlertBar
            status="error"
            title="Error"
            description={error}
            onClose={() => setError(null)}
          />
        </Box>
      )}

      <Box
        ml={condensed ? '72px' : '280px'}
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        bg={bgColor}
        px="8"
        py="6"
      >
        {/* Header - Work Queue Style */}
        <Flex justify="space-between" align="center" mb="6">
          <VStack align="start" gap="2px">
            <Typography fontSize="24px" fontWeight="700" color={textColor}>
              Risk Review
            </Typography>
            <Typography fontSize="14px" color={subtleText}>
              Review and manage risk assessments
            </Typography>
          </VStack>
          <HStack gap="3">
            <Tooltip content="Refresh" showArrow variant="light">
              <Box
                as="button"
                p="2"
                borderRadius="md"
                bg="transparent"
                _hover={{ bg: 'mukuru.state.hover' }}
                onClick={() => !loading && loadAssessments()}
                opacity={loading ? 0.5 : 1}
                cursor={loading ? 'not-allowed' : 'pointer'}
              >
                <FiRefreshCw size={18} color="var(--chakra-colors-mukuru-charcoal)" className={loading ? 'animate-spin' : ''} />
              </Box>
            </Tooltip>
          </HStack>
        </Flex>

        {/* Stats Row - Inline like Work Queue */}
        <HStack gap="12" mb="4">
          <HStack gap="2" cursor="pointer" onClick={() => setActiveTab('All')}>
            <Typography fontSize="xs" color={subtleText} textTransform="uppercase" letterSpacing="wide">
              Total
            </Typography>
            <Typography fontSize="sm" fontWeight="600" color={textColor}>
              {tabCounts.all}
            </Typography>
          </HStack>
          <HStack gap="2" cursor="pointer" onClick={() => setActiveTab('Pending')}>
            <Typography fontSize="xs" color={subtleText} textTransform="uppercase" letterSpacing="wide">
              Pending
            </Typography>
            <Typography fontSize="sm" fontWeight="600" color="mukuru.buttons.primary">
              {tabCounts.pending}
            </Typography>
          </HStack>
          <HStack gap="2" cursor="pointer" onClick={() => setActiveTab('Completed')}>
            <Typography fontSize="xs" color={subtleText} textTransform="uppercase" letterSpacing="wide">
              Completed
            </Typography>
            <Typography fontSize="sm" fontWeight="600" color="mukuru.teal">
              {tabCounts.completed}
            </Typography>
          </HStack>
          <HStack gap="2" cursor="pointer" onClick={() => setActiveTab('High Risk')}>
            <Typography fontSize="xs" color={subtleText} textTransform="uppercase" letterSpacing="wide">
              High Risk
            </Typography>
            <Typography fontSize="sm" fontWeight="600" color="mukuru.text.error">
              {tabCounts.highRisk}
            </Typography>
          </HStack>
        </HStack>

        {/* Tabs - Work Queue Style */}
        <HStack gap="6" mb="6">
          <Tab
            label="All"
            isActive={activeTab === 'All'}
            onClick={() => setActiveTab('All')}
          />
          <Tab
            label="Pending"
            isActive={activeTab === 'Pending'}
            onClick={() => setActiveTab('Pending')}
          />
          <Tab
            label="Completed"
            isActive={activeTab === 'Completed'}
            onClick={() => setActiveTab('Completed')}
          />
          <Tab
            label="High Risk"
            isActive={activeTab === 'High Risk'}
            onClick={() => setActiveTab('High Risk')}
          />
        </HStack>

        {/* Search Row - Work Queue Style */}
        <Flex justify="space-between" align="center" mb="6">
          <Box w="300px">
            <Search
              placeholder="Search by name, code..."
              onSearchChange={setSearchTerm}
            />
          </Box>
          <HStack gap="2">
            <Button
              variant="ghost"
              leftIcon={<FiFilter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </HStack>
        </Flex>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Box
            bg={cardBg}
            p="4"
            borderRadius="md"
            border="1px solid"
            borderColor={borderColor}
            mb="4"
          >
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="3">
              <Box>
                <Typography fontSize="xs" fontWeight="500" mb="1.5" color={labelColor}>
                  Risk Level
                </Typography>
                <Dropdown
                  items={[
                    { value: '', label: 'All Risk Levels' },
                    { value: 'Critical', label: 'Critical' },
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' },
                  ]}
                  defaultValue={filters.riskLevel || ''}
                  onSelectionChange={(value: string) => setFilters({ ...filters, riskLevel: value || undefined })}
                  placeholder="Select Risk Level"
                />
              </Box>
              <Box>
                <Typography fontSize="xs" fontWeight="500" mb="1.5" color={labelColor}>
                  Status
                </Typography>
                <Dropdown
                  items={[
                    { value: '', label: 'All Statuses' },
                    { value: 'InProgress', label: 'In Progress' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Rejected', label: 'Rejected' },
                  ]}
                  defaultValue={filters.status || ''}
                  onSelectionChange={(value: string) => setFilters({ ...filters, status: value || undefined })}
                  placeholder="Select Status"
                />
              </Box>
              <Box display="flex" alignItems="flex-end">
                {(filters.riskLevel || filters.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({})}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            </SimpleGrid>
          </Box>
        )}

        {/* Table - Work Queue Style */}
        <Box
          bg={cardBg}
          borderRadius="8px"
          border="1px solid"
          borderColor={borderColor}
          overflow="hidden"
          className="risk-review-table-card"
        >
          <style>{`
            /* Make DataTable fill container */
            .risk-review-table-card > div {
              height: 100% !important;
              display: flex !important;
              flex-direction: column !important;
            }
            .risk-review-table-card > div > div:last-child {
              flex: 1 !important;
              overflow: auto !important;
            }
            /* Table container - use auto layout for better column sizing */
            .risk-review-table-card table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: auto !important;
            }
            /* Ensure proper column spacing */
            .risk-review-table-card th,
            .risk-review-table-card td {
              padding: 12px 16px !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              vertical-align: middle !important;
            }
            /* Table header - clean flat design */
            .risk-review-table-card thead {
              background: var(--chakra-colors-mukuru-background-light) !important;
            }
            .risk-review-table-card thead th,
            .risk-review-table-card th[role="columnheader"] {
              font-size: 11px !important;
              font-weight: 600 !important;
              padding: 14px 16px !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
              color: var(--chakra-colors-mukuru-grey-mediumDark) !important;
              border-bottom: 1px solid var(--chakra-colors-mukuru-grey-light) !important;
              white-space: nowrap !important;
              background: transparent !important;
              line-height: 1.2 !important;
            }
            /* Remove ALL container/pill styling */
            .risk-review-table-card thead th *,
            .risk-review-table-card th[role="columnheader"] * {
              background: none !important;
              background-color: transparent !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            /* Header content - simple flex layout */
            .risk-review-table-card thead th > div {
              display: inline-flex !important;
              align-items: center !important;
              gap: 4px !important;
              background: none !important;
              border: none !important;
              padding: 0 !important;
            }
            /* Header text */
            .risk-review-table-card thead th,
            .risk-review-table-card thead th * {
              font-size: 11px !important;
              font-weight: 600 !important;
              color: var(--chakra-colors-mukuru-grey-mediumDark) !important;
              font-family: 'Madera', sans-serif !important;
            }
            /* Sort icon - small and subtle */
            .risk-review-table-card thead th svg {
              width: 10px !important;
              height: 10px !important;
              color: var(--chakra-colors-mukuru-grey-medium) !important;
              flex-shrink: 0 !important;
            }
            /* Actions column - center aligned */
            .risk-review-table-card thead th:last-child {
              text-align: center !important;
            }
            .risk-review-table-card td:last-child {
              text-align: center !important;
            }
            /* Table body rows */
            .risk-review-table-card tbody tr {
              border-bottom: 1px solid var(--chakra-colors-mukuru-grey-light) !important;
            }
            .risk-review-table-card tbody tr:hover {
              background-color: var(--chakra-colors-mukuru-state-hover) !important;
            }
            /* Table cells */
            .risk-review-table-card tbody td {
              padding: 12px 16px !important;
              font-size: 13px !important;
              color: var(--chakra-colors-mukuru-text-primary) !important;
            }
            /* Cell content truncation */
            .risk-review-table-card td > div,
            .risk-review-table-card td > span,
            .risk-review-table-card td > p {
              max-width: 100% !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            /* Ensure VStack alignment in cells */
            .risk-review-table-card td .chakra-stack {
              align-items: flex-start !important;
            }
          `}</style>
          <DataTable
            data={paginatedAssessments as unknown as Record<string, unknown>[]}
            columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
            showActions={true}
            actionColumn={
              actionColumn as unknown as {
                header?: string;
                width?: string;
                render: (row: Record<string, unknown>, index: number) => React.ReactNode;
              }
            }
            loading={loading}
            emptyState={{
              message: 'No risk assessments found',
              content: (
                <VStack gap="4" py="12">
                  <Typography fontSize="sm" color={subtleText}>
                    {searchTerm
                      ? 'No assessments match your search criteria'
                      : 'Risk assessments will appear here once cases are submitted'}
                  </Typography>
                </VStack>
              ),
            }}
          />
        </Box>

        {/* Pagination - Work Queue Style */}
        {filteredAssessments.length > 0 && (
          <Flex justify="space-between" align="center" mt="4">
            <HStack gap="2">
              <Typography fontSize="sm" color={subtleText}>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAssessments.length)} of {filteredAssessments.length} items
              </Typography>
              <Typography fontSize="sm" fontWeight="500" color={textColor}>
                {pageSize}
              </Typography>
              <Typography fontSize="sm" color={subtleText}>per page</Typography>
            </HStack>
            <HStack gap="2">
              <HStack
                as="button"
                gap="1"
                opacity={currentPage === 1 || loading ? 0.4 : 1}
                cursor={currentPage === 1 || loading ? 'not-allowed' : 'pointer'}
                onClick={() => currentPage > 1 && !loading && setCurrentPage(prev => prev - 1)}
                _hover={{ color: 'mukuru.charcoal' }}
              >
                <FiChevronLeft size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
                <Typography fontSize="sm" color={subtleText}>Previous</Typography>
              </HStack>
              <HStack gap="1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Box
                      key={pageNum}
                      as="button"
                      px="3"
                      py="1"
                      borderRadius="md"
                      bg={currentPage === pageNum ? 'mukuru.buttons.primary' : 'transparent'}
                      color={currentPage === pageNum ? 'white' : subtleText}
                      fontSize="sm"
                      fontWeight="500"
                      _hover={{ bg: currentPage === pageNum ? 'mukuru.buttons.primary' : 'mukuru.state.hover' }}
                      onClick={() => !loading && setCurrentPage(pageNum)}
                      cursor={loading ? 'not-allowed' : 'pointer'}
                      minW="28px"
                    >
                      {pageNum}
                    </Box>
                  );
                })}
              </HStack>
              <HStack
                as="button"
                gap="1"
                opacity={currentPage >= totalPages || loading ? 0.4 : 1}
                cursor={currentPage >= totalPages || loading ? 'not-allowed' : 'pointer'}
                onClick={() => currentPage < totalPages && !loading && setCurrentPage(prev => prev + 1)}
                _hover={{ color: 'mukuru.charcoal' }}
              >
                <Typography fontSize="sm" color={subtleText}>Next</Typography>
                <FiChevronRight size={16} color="var(--chakra-colors-mukuru-grey-medium)" />
              </HStack>
            </HStack>
          </Flex>
        )}
      </Box>
    </Box>
  );
}

