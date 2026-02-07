/* eslint-disable security/detect-object-injection */
'use client';

import { Box, Flex, VStack } from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Pagination,
  Typography,
  Link as MukuruLink,
  Search,
  DataTable,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  AlertBar,
  Tag,
  IconWrapper,
  Tooltip,
  DownloadIcon,
  RetryIcon,
} from '@mukuru/mukuru-react-components';
import type { ColumnConfig } from '@mukuru/mukuru-react-components';
// Import wrapper components (not yet in npm package)
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsIndicator,
} from '@/lib/mukuruComponentWrappers';
import {
  FiDownload,
  FiEye,
  FiFileText,
  FiCalendar,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';
import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';

type DocumentTypeFilter = 'ALL' | 'ID' | 'ADDRESS' | 'FINANCIAL' | 'BUSINESS' | 'OTHER';

interface Document {
  id: string;
  documentNumber: string;
  caseId: string;
  partnerId: string;
  type: number | string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  bucketName: string;
  uploadedAt: string;
  uploadedBy: string;
}

const getDocumentTypeName = (type: number | string): string => {
  // Handle string types from backend (e.g., "ArticlesOfIncorporation", "ProofOfAddress")
  if (typeof type === 'string') {
    const stringTypes: Record<string, string> = {
      'Passport': 'Passport',
      'DriversLicense': "Driver's License",
      'NationalId': 'National ID',
      'ProofOfAddress': 'Proof of Address',
      'BankStatement': 'Bank Statement',
      'TaxDocument': 'Tax Document',
      'BusinessRegistration': 'Business Registration',
      'ArticlesOfIncorporation': 'Articles of Incorporation',
      'ShareholderRegistry': 'Shareholder Registry',
      'FinancialStatements': 'Financial Statements',
      'Other': 'Other',
    };
    return stringTypes[type] || type.replace(/([A-Z])/g, ' $1').trim() || 'Unknown';
  }
  
  // Handle numeric types (legacy)
  const numericTypes: Record<number, string> = {
    1: 'Passport',
    2: "Driver's License",
    3: 'National ID',
    4: 'Proof of Address',
    5: 'Bank Statement',
    6: 'Tax Document',
    7: 'Business Registration',
    8: 'Articles of Incorporation',
    9: 'Shareholder Registry',
    10: 'Financial Statements',
    99: 'Other',
  };
  const validType = type in numericTypes ? type : null;
  return validType !== null ? numericTypes[validType] : 'Unknown';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const validIndex = i >= 0 && i < sizes.length ? i : 0;
  return (
    Math.round((bytes / Math.pow(k, validIndex)) * 100) / 100 + ' ' + sizes[validIndex]
  );
};

// Map backend response (snake_case) to frontend interface (camelCase)
// Backend uses JsonNamingPolicy.SnakeCaseLower, so all properties are snake_case
const mapApiDocumentToDocument = (apiDoc: Record<string, unknown>): Document => {
  // Type can be a string (e.g., "ArticlesOfIncorporation") or number
  const typeValue = apiDoc.type || apiDoc.Type;
  // Keep as string if it's a named type, otherwise try to parse as number
  const parsedType = typeof typeValue === 'string' && isNaN(parseInt(typeValue, 10))
    ? typeValue  // Keep string types like "ArticlesOfIncorporation"
    : typeof typeValue === 'number'
      ? typeValue
      : typeof typeValue === 'string'
        ? parseInt(typeValue, 10)
        : 'Other';

  // Handle uploadedAt - can be string or Date object
  let uploadedAtStr = '';
  const uploadedAtValue = apiDoc.uploaded_at || apiDoc.uploadedAt || apiDoc.UploadedAt;
  if (uploadedAtValue) {
    if (typeof uploadedAtValue === 'string') {
      uploadedAtStr = uploadedAtValue;
    } else {
      try {
        uploadedAtStr = new Date(uploadedAtValue as Date).toISOString();
      } catch {
        uploadedAtStr = '';
      }
    }
  }

  return {
    id: String(apiDoc.id || apiDoc.Id || ''),
    documentNumber: String(
      apiDoc.document_number || apiDoc.documentNumber || apiDoc.DocumentNumber || ''
    ),
    caseId: String(apiDoc.case_id || apiDoc.caseId || apiDoc.CaseId || ''),
    partnerId: String(apiDoc.partner_id || apiDoc.partnerId || apiDoc.PartnerId || ''),
    type: parsedType,
    fileName: String(apiDoc.file_name || apiDoc.fileName || apiDoc.FileName || ''),
    contentType: String(
      apiDoc.content_type || apiDoc.contentType || apiDoc.ContentType || ''
    ),
    sizeBytes: Number(apiDoc.size_bytes || apiDoc.sizeBytes || apiDoc.SizeBytes || 0),
    storageKey: String(
      apiDoc.storage_key || apiDoc.storageKey || apiDoc.StorageKey || ''
    ),
    bucketName: String(
      apiDoc.bucket_name || apiDoc.bucketName || apiDoc.BucketName || ''
    ),
    uploadedAt: uploadedAtStr,
    uploadedBy: String(
      apiDoc.uploaded_by || apiDoc.uploadedBy || apiDoc.UploadedBy || ''
    ),
  };
};

export default function DocumentsPage() {
  const { condensed } = useSidebar();
  const [mounted, setMounted] = useState(false);

  // All useState hooks must be declared before any conditional returns
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<DocumentTypeFilter>('ALL');

  // Ensure component is mounted on client side to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mukuru theme colors (matching work-queue page)
  const bgColor = 'mukuru.grey.100';
  const cardBg = 'mukuru.white';
  const textColor = 'mukuru.text.primary';
  const borderColor = 'mukuru.stroke';

  const showToast = (
    title: string,
    description: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 5000
  ) => {
    setToast({ title, description, type });
    setTimeout(() => setToast(null), duration);
  };

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.info('[Documents Page] Loading documents...', { page, pageSize });

      const _skip = (page - 1) * pageSize;
      const _url = `/api/documents?skip=${_skip}&take=${pageSize}`;

      const response = await fetch(_url);
      if (!response.ok) {
        const _errorData = await response.json().catch(() => ({}));
        throw new Error(
          _errorData.error || `Failed to load documents: ${response.statusText}`
        );
      }

      const _data = await response.json();

      // Backend returns snake_case: items, total_count
      const rawDocuments = _data.items || _data.Items || _data || [];

      // Map API response to frontend Document interface
      const mappedDocuments = Array.isArray(rawDocuments)
        ? rawDocuments.map(mapApiDocumentToDocument)
        : [];

      console.info('[Documents Page] Raw API response:', JSON.stringify(_data, null, 2));
      console.info('[Documents Page] First raw document:', rawDocuments[0]);
      console.info('[Documents Page] Mapped documents:', mappedDocuments);

      setDocuments(mappedDocuments);
      setTotal(
        _data.total_count ||
          _data.totalCount ||
          _data.TotalCount ||
          _data.total ||
          mappedDocuments.length
      );

      console.info('[Documents Page] Documents loaded:', mappedDocuments.length);
    } catch (err) {
      console.error('[Documents Page] Error loading documents:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
      setDocuments([]);
      showToast('Error loading documents', errorMessage, 'error', 5000);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments, refreshKey]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  // This ensures ChakraProvider from MukuruComponentProvider is available
  if (!mounted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--mukuru-background-light)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--mukuru-grey-light)',
            borderTop: '4px solid var(--mukuru-buttons-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
    );
  }

  const getDocumentUrl = async (document: Document): Promise<string | null> => {
    try {
      return `/api/proxy-document?storageKey=${encodeURIComponent(document.storageKey)}`;
    } catch (err) {
      console.error('Error getting document URL:', err);
      return null;
    }
  };

  const handleView = async (document: Document) => {
    try {
      setViewingDocument(document);
      setViewerOpen(true);
      setViewerLoading(true);
      setViewerError(null);

      const url = await getDocumentUrl(document);
      if (url) {
        // Test if the document can be fetched before showing iframe
        try {
          const testResponse = await fetch(url, { method: 'HEAD' });
          if (!testResponse.ok) {
            // Try GET to get error message
            const getResponse = await fetch(url);
            const errorData = await getResponse.json().catch(() => null);
            // Extract error message from multiple possible fields
            const errorMsg =
              (errorData?.error && typeof errorData.error === 'string'
                ? errorData.error
                : null) ||
              (errorData?.message && typeof errorData.message === 'string'
                ? errorData.message
                : null) ||
              (errorData?.details && typeof errorData.details === 'string'
                ? errorData.details
                : null) ||
              'Document could not be loaded';
            setViewerError(errorMsg);
            setViewerUrl(null);
          } else {
            setViewerUrl(url);
          }
        } catch {
          // If HEAD fails, try to load anyway (some servers don't support HEAD)
          setViewerUrl(url);
        }
      } else {
        setViewerError('Could not generate document URL');
      }
    } catch (err) {
      console.error('Error viewing document:', err);
      setViewerError(err instanceof Error ? err.message : 'Failed to view document');
    } finally {
      setViewerLoading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const url = await getDocumentUrl(document);
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('No download URL returned');
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      showToast(
        'Download failed',
        err instanceof Error ? err.message : 'Failed to download document',
        'error',
        5000
      );
    }
  };

  const isImageFile = (fileName: string, contentType: string): boolean => {
    if (!fileName || !contentType) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) return contentType.startsWith('image/');
    const ext = fileName.toLowerCase().substring(lastDotIndex);
    return imageExtensions.includes(ext) || contentType.startsWith('image/');
  };

  // Filter by document type category
  const getDocumentTypeCategory = (type: number | string): DocumentTypeFilter => {
    // Handle string types from backend
    if (typeof type === 'string') {
      const idTypes = ['Passport', 'DriversLicense', 'NationalId'];
      const addressTypes = ['ProofOfAddress'];
      const financialTypes = ['BankStatement', 'TaxDocument', 'FinancialStatements'];
      const businessTypes = ['BusinessRegistration', 'ArticlesOfIncorporation', 'ShareholderRegistry'];
      
      if (idTypes.includes(type)) return 'ID';
      if (addressTypes.includes(type)) return 'ADDRESS';
      if (financialTypes.includes(type)) return 'FINANCIAL';
      if (businessTypes.includes(type)) return 'BUSINESS';
      return 'OTHER';
    }
    
    // Handle numeric types (legacy)
    if ([1, 2, 3].includes(type)) return 'ID'; // Passport, Driver's License, National ID
    if ([4].includes(type)) return 'ADDRESS'; // Proof of Address
    if ([5, 6, 10].includes(type)) return 'FINANCIAL'; // Bank Statement, Tax Document, Financial Statements
    if ([7, 8, 9].includes(type)) return 'BUSINESS'; // Business Registration, Articles, Shareholder Registry
    return 'OTHER';
  };

  const filteredDocuments = documents.filter((doc) => {
    // First filter by type
    if (typeFilter !== 'ALL' && getDocumentTypeCategory(doc.type) !== typeFilter) {
      return false;
    }
    // Then filter by search term
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (doc.fileName?.toLowerCase().includes(search) ?? false) ||
      (doc.documentNumber?.toLowerCase().includes(search) ?? false) ||
      (doc.caseId?.toLowerCase().includes(search) ?? false) ||
      getDocumentTypeName(doc.type).toLowerCase().includes(search) ||
      (doc.uploadedBy?.toLowerCase().includes(search) ?? false)
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  const columns: ColumnConfig<Document>[] = [
    {
      field: 'fileName',
      header: 'File Name',
      sortable: true,
      width: '25%',
      render: (value, row) => (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '200px' }}
        >
          <FiFileText size={16} color="#F05423" style={{ flexShrink: 0 }} />
          <Typography
            fontSize="13px"
            fontWeight="500"
            color="#F05423"
            cursor="pointer"
            onClick={() => handleView(row)}
            style={{
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.fileName || 'Unknown'}
          </Typography>
        </div>
      ),
    },
    {
      field: 'type',
      header: 'Type',
      sortable: true,
      width: '12%',
      render: (value) => (
        <Tag variant="info" style={{ whiteSpace: 'nowrap' }}>
          {getDocumentTypeName(value as number)}
        </Tag>
      ),
    },
    {
      field: 'caseId',
      header: 'Case ID',
      sortable: true,
      width: '15%',
      render: (value, row) => {
        const caseId = row.caseId as string;
        if (!caseId) {
          return (
            <Typography fontSize="13px" color="#94A3B8">
              N/A
            </Typography>
          );
        }
        return (
          <MukuruLink href={`/applications/${caseId}`}>
            <Typography
              fontSize="13px"
              color="#F05423"
              _hover={{ textDecoration: 'underline' }}
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '120px',
                display: 'block',
              }}
            >
              {caseId.length > 12 ? `${caseId.substring(0, 12)}...` : caseId}
            </Typography>
          </MukuruLink>
        );
      },
    },
    {
      field: 'sizeBytes',
      header: 'Size',
      sortable: true,
      width: '10%',
      render: (value) => (
        <Typography fontSize="13px" color="#1D2939" style={{ whiteSpace: 'nowrap' }}>
          {formatFileSize((value as number) || 0)}
        </Typography>
      ),
    },
    {
      field: 'uploadedBy',
      header: 'Uploaded By',
      sortable: true,
      width: '12%',
      render: (value) => (
        <Typography
          fontSize="13px"
          color="#1D2939"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100px',
          }}
        >
          {(value as string) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'uploadedAt',
      header: 'Uploaded At',
      sortable: true,
      width: '14%',
      render: (value) => {
        const dateValue = value as string;
        if (!dateValue) {
          return (
            <Typography fontSize="13px" color="#94A3B8">
              N/A
            </Typography>
          );
        }
        try {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCalendar size={14} color="#94A3B8" />
              <Typography
                fontSize="13px"
                color="#1D2939"
                style={{ whiteSpace: 'nowrap' }}
              >
                {new Date(dateValue).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Typography>
            </div>
          );
        } catch {
          return (
            <Typography fontSize="13px" color="#94A3B8">
              Invalid date
            </Typography>
          );
        }
      },
    },
  ];

  const actionColumn = {
    header: 'Actions',
    width: '12%',
    render: (row: Document) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Tooltip content="View">
          <button
            onClick={() => handleView(row)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #E9E9EA',
              backgroundColor: 'white',
              color: '#1D2939',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiEye size={14} />
          </button>
        </Tooltip>
        <Tooltip content="Download">
          <button
            onClick={() => handleDownload(row)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #E9E9EA',
              backgroundColor: 'white',
              color: '#1D2939',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiDownload size={14} />
          </button>
        </Tooltip>
      </div>
    ),
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      <AdminSidebar />
      <PortalHeader />

      {/* Toast Notification */}
      {toast && (
        <Box position="fixed" top="100px" right="24px" zIndex={10000} maxW="400px">
          <AlertBar
            status={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => setToast(null)}
          />
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        ml={condensed ? '72px' : '280px'}
        pt="90px"
        minH="100vh"
        bg={bgColor}
        transition="margin-left 0.3s ease"
      >
        {/* Page Header */}
        <Box px="24px" pt="24px" pb="16px" bg={cardBg}>
          <Flex justify="space-between" align="center">
            <VStack align="start" gap="2px">
              <Typography fontSize="24px" fontWeight="700" color={textColor}>
                Documents
              </Typography>
              <Typography fontSize="14px" color="mukuru.grey.600">
                View and manage all uploaded documents
              </Typography>
            </VStack>
            <Button
              variant="primary"
              size="md"
              onClick={() => setRefreshKey((prev) => prev + 1)}
            >
              <IconWrapper>
                <RetryIcon />
              </IconWrapper>
              Refresh
            </Button>
          </Flex>
        </Box>

        {/* Document Type Filter Tabs */}
        <Box px="24px" bg={cardBg} borderBottom="1px solid" borderColor={borderColor}>
          {error && (
            <Box mb="12px">
              <AlertBar status="error" title="Error" description={error} />
            </Box>
          )}
          <TabsRoot
            value={typeFilter}
            onValueChange={(details) =>
              setTypeFilter(details.value as DocumentTypeFilter)
            }
          >
            <TabsList>
              {(
                [
                  'ALL',
                  'ID',
                  'ADDRESS',
                  'FINANCIAL',
                  'BUSINESS',
                  'OTHER',
                ] as DocumentTypeFilter[]
              ).map((filter) => {
                const label =
                  filter === 'ALL'
                    ? 'All Documents'
                    : filter === 'ID'
                      ? 'ID Documents'
                      : filter === 'ADDRESS'
                        ? 'Address Proof'
                        : filter === 'FINANCIAL'
                          ? 'Financial'
                          : filter === 'BUSINESS'
                            ? 'Business'
                            : 'Other';
                return (
                  <TabsTrigger key={filter} value={filter}>
                    {label}
                  </TabsTrigger>
                );
              })}
              <TabsIndicator />
            </TabsList>
          </TabsRoot>
        </Box>

        {/* Search Row */}
        <Box
          px="24px"
          py="12px"
          bg={cardBg}
          borderBottom="1px solid"
          borderColor={borderColor}
        >
          <Box maxW="400px">
            <Search
              placeholder="Search documents..."
              onSearchChange={handleSearchChange}
            />
          </Box>
        </Box>

        {/* Table Section */}
        <Box
          flex="1"
          minH="0"
          px="24px"
          py="16px"
          bg={bgColor}
          display="flex"
          flexDirection="column"
        >
          <Box
            flex="1"
            minH="0"
            bg={cardBg}
            borderRadius="8px"
            border="1px solid"
            borderColor={borderColor}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            className="documents-table-card"
          >
            <style>{`
              /* Make DataTable fill container */
              .documents-table-card > div {
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
              }
              .documents-table-card > div > div:last-child {
                flex: 1 !important;
                overflow-x: auto !important;
              }
              /* Table container */
              .documents-table-card table {
                width: 100% !important;
                min-width: 900px !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
              }
              /* Column widths */
              .documents-table-card th:nth-child(1),
              .documents-table-card td:nth-child(1) { width: 22% !important; }
              .documents-table-card th:nth-child(2),
              .documents-table-card td:nth-child(2) { width: 12% !important; }
              .documents-table-card th:nth-child(3),
              .documents-table-card td:nth-child(3) { width: 15% !important; }
              .documents-table-card th:nth-child(4),
              .documents-table-card td:nth-child(4) { width: 10% !important; }
              .documents-table-card th:nth-child(5),
              .documents-table-card td:nth-child(5) { width: 13% !important; }
              .documents-table-card th:nth-child(6),
              .documents-table-card td:nth-child(6) { width: 14% !important; }
              .documents-table-card th:nth-child(7),
              .documents-table-card td:nth-child(7) { width: 14% !important; }
              /* Ensure proper column spacing */
              .documents-table-card th,
              .documents-table-card td {
                padding: 14px 16px !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
              }
              /* Table header - clean flat design */
              .documents-table-card thead {
                background: #FAFAFA !important;
              }
              .documents-table-card thead th,
              .documents-table-card th[role="columnheader"] {
                font-size: 12px !important;
                font-weight: 600 !important;
                padding: 14px 16px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.3px !important;
                color: #667085 !important;
                border-bottom: 1px solid #E9E9EA !important;
                white-space: nowrap !important;
                background: #FAFAFA !important;
                line-height: 1 !important;
              }
              /* Remove ALL container/pill styling */
              .documents-table-card thead th *,
              .documents-table-card th[role="columnheader"] * {
                background: none !important;
                background-color: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              /* Table rows */
              .documents-table-card tbody tr {
                border-bottom: 1px solid #F3F4F6 !important;
              }
              .documents-table-card tbody tr:hover {
                background: #F9FAFB !important;
              }
              .documents-table-card tbody td {
                padding: 14px 16px !important;
                font-size: 13px !important;
                color: #1D2939 !important;
                vertical-align: middle !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
              }
              /* Cell content truncation */
              .documents-table-card td > div,
              .documents-table-card td > span,
              .documents-table-card td > p {
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
                max-width: 100% !important;
              }
            `}</style>
            <DataTable
              data={filteredDocuments as unknown as Record<string, unknown>[]}
              columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
              actionColumn={
                actionColumn as unknown as {
                  header?: string;
                  width?: string;
                  render: (
                    row: Record<string, unknown>,
                    index: number
                  ) => React.ReactNode;
                }
              }
              loading={loading}
            />
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box mt="16px">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={total}
                pageSize={pageSize}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Document Viewer Modal - Full Screen Style */}
      <style>{`
        [data-scope="dialog"][data-part="content"] {
          width: 95vw !important;
          max-width: 1400px !important;
          height: 92vh !important;
          max-height: 92vh !important;
          margin: 4vh auto !important;
          border-radius: 16px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05) !important;
          overflow: hidden !important;
        }
        [data-scope="dialog"][data-part="backdrop"] {
          background: rgba(17, 24, 39, 0.7) !important;
          backdrop-filter: blur(4px) !important;
        }
      `}</style>
      <Modal
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewingDocument(null);
          setViewerUrl(null);
        }}
        size="large"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '8px 0',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#111827',
                  letterSpacing: '-0.02em',
                }}
              >
                {viewingDocument?.fileName}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 10px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                  }}
                >
                  {viewingDocument && getDocumentTypeName(viewingDocument.type)}
                </span>
                <span style={{ fontSize: '13px', color: '#9CA3AF' }}>•</span>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                  {viewingDocument && formatFileSize(viewingDocument.sizeBytes)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {viewingDocument && (
                <button
                  onClick={() => handleDownload(viewingDocument)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    backgroundColor: '#F05423',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(240, 84, 35, 0.3)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#E04A1F';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(240, 84, 35, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#F05423';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 84, 35, 0.3)';
                  }}
                >
                  <FiDownload size={16} />
                  Download
                </button>
              )}
              <button
                onClick={() => {
                  setViewerOpen(false);
                  setViewingDocument(null);
                  setViewerUrl(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  backgroundColor: '#F9FAFB',
                  color: '#6B7280',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.color = '#6B7280';
                }}
              >
                <FiX size={22} />
              </button>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div
            style={{
              height: 'calc(92vh - 120px)',
              overflow: 'auto',
              backgroundColor: '#F8FAFC',
            }}
          >
            {viewerLoading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
                minH="500px"
                bg="#F8FAFC"
              >
                <VStack gap="20px" align="center">
                  <Box
                    w="56px"
                    h="56px"
                    borderRadius="full"
                    style={{
                      border: '4px solid #E5E7EB',
                      borderTopColor: '#F05423',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <Typography fontSize="15px" color="#6B7280" fontWeight="500">
                    Loading document...
                  </Typography>
                </VStack>
              </Box>
            ) : viewerError ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '420px',
                  padding: '48px',
                  background: 'linear-gradient(180deg, #FAFBFC 0%, #F3F4F6 100%)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '28px',
                    maxWidth: '400px',
                  }}
                >
                  {/* Icon Container */}
                  <div
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                      border: '2px solid #FECACA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow:
                        '0 8px 24px rgba(220, 38, 38, 0.12), 0 4px 8px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <FiFileText size={44} color="#DC2626" />
                  </div>

                  {/* Text Content */}
                  <div style={{ textAlign: 'center' }}>
                    <h3
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: '22px',
                        fontWeight: '700',
                        color: '#111827',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Unable to Preview Document
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '15px',
                        color: '#6B7280',
                        lineHeight: '1.6',
                        maxWidth: '300px',
                      }}
                    >
                      {viewerError}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
                    {viewingDocument && (
                      <button
                        onClick={() => handleDownload(viewingDocument)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '14px 24px',
                          backgroundColor: '#F05423',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow:
                            '0 4px 14px rgba(240, 84, 35, 0.35), 0 2px 4px rgba(0, 0, 0, 0.08)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#E04A1F';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow =
                            '0 6px 20px rgba(240, 84, 35, 0.4), 0 4px 8px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#F05423';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow =
                            '0 4px 14px rgba(240, 84, 35, 0.35), 0 2px 4px rgba(0, 0, 0, 0.08)';
                        }}
                      >
                        <FiDownload size={18} />
                        Download Instead
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setViewerOpen(false);
                        setViewingDocument(null);
                        setViewerUrl(null);
                        setViewerError(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '14px 28px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '2px solid #E5E7EB',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : viewerUrl && viewingDocument ? (
              isImageFile(viewingDocument.fileName, viewingDocument.contentType) ? (
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#F8FAFC',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    minHeight: 'calc(92vh - 140px)',
                  }}
                >
                  <img
                    src={viewerUrl}
                    alt={viewingDocument.fileName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 'calc(92vh - 180px)',
                      objectFit: 'contain',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    }}
                    onError={() => setViewerError('Failed to load image')}
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#F8FAFC',
                    height: '100%',
                    minHeight: 'calc(92vh - 140px)',
                  }}
                >
                  <iframe
                    src={viewerUrl}
                    style={{
                      width: '100%',
                      height: 'calc(92vh - 180px)',
                      border: 'none',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                    }}
                    title={viewingDocument.fileName}
                    onError={() => setViewerError('Failed to load document')}
                  />
                </div>
              )
            ) : (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  minHeight: 'calc(92vh - 140px)',
                }}
              >
                <Typography color="#667085">No document selected</Typography>
              </div>
            )}
          </div>
        </ModalBody>
      </Modal>
    </Box>
  );
}
