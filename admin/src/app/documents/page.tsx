"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Flex,
  Spinner,
  Image
} from "@chakra-ui/react";
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
  ModalFooter, 
  AlertBar, 
  Tag, 
  IconWrapper,
  Tooltip
} from "@/lib/mukuruImports";
import type { ColumnConfig } from "@mukuru/mukuru-react-components";
import { 
  FiDownload, 
  FiEye,
  FiFileText,
  FiCalendar,
  FiRefreshCw,
  FiX
} from "react-icons/fi";
import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import PortalHeader from "../../components/PortalHeader";
import { useSidebar } from "../../contexts/SidebarContext";

interface Document {
  id: string;
  documentNumber: string;
  caseId: string;
  partnerId: string;
  type: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  bucketName: string;
  uploadedAt: string;
  uploadedBy: string;
}

const getDocumentTypeName = (type: number): string => {
  const types: Record<number, string> = {
    1: "Passport",
    2: "Driver's License",
    3: "National ID",
    4: "Proof of Address",
    5: "Bank Statement",
    6: "Tax Document",
    7: "Business Registration",
    8: "Articles of Incorporation",
    9: "Shareholder Registry",
    10: "Financial Statements",
    99: "Other"
  };
  return types[type] || "Unknown";
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function DocumentsPage() {
  const { condensed } = useSidebar();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (title: string, description: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 5000) => {
    setToast({ title, description, type });
    setTimeout(() => setToast(null), duration);
  };

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[Documents Page] Loading documents...', { page, pageSize });
      
      const skip = (page - 1) * pageSize;
      const url = `/api/documents?skip=${skip}&take=${pageSize}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load documents: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDocuments(data.items || data || []);
      setTotal(data.total || data.totalCount || (data.items || data || []).length);
      
      console.log('[Documents Page] Documents loaded:', (data.items || data || []).length);
    } catch (err) {
      console.error('[Documents Page] Error loading documents:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
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
      const url = await getDocumentUrl(document);
      if (url) {
        setViewerUrl(url);
      } else {
        showToast('View failed', 'Could not load document. Please try downloading instead.', 'error', 5000);
        setViewerOpen(false);
        setViewingDocument(null);
      }
    } catch (err) {
      console.error('Error viewing document:', err);
      showToast('View failed', err instanceof Error ? err.message : 'Failed to view document', 'error', 5000);
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
      showToast('Download failed', err instanceof Error ? err.message : 'Failed to download document', 'error', 5000);
    }
  };

  const isImageFile = (fileName: string, contentType: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return imageExtensions.includes(ext) || contentType.startsWith('image/');
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      doc.fileName.toLowerCase().includes(search) ||
      doc.documentNumber.toLowerCase().includes(search) ||
      doc.caseId.toLowerCase().includes(search) ||
      getDocumentTypeName(doc.type).toLowerCase().includes(search) ||
      doc.uploadedBy.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  const columns: ColumnConfig<Document>[] = [
    {
      field: 'fileName',
      header: 'File Name',
      sortable: true,
      minWidth: '250px',
      render: (value, row) => (
        <HStack gap="2">
          <IconWrapper><FiFileText size={16} color="#DD6B20" /></IconWrapper>
          <Typography 
            fontSize="sm" 
            fontWeight="medium" 
            color="orange.600"
            cursor="pointer"
            onClick={() => handleView(row)}
            style={{ textDecoration: 'none' }}
            _hover={{ textDecoration: "underline" }}
          >
            {row.fileName}
          </Typography>
        </HStack>
      )
    },
    {
      field: 'type',
      header: 'Type',
      sortable: true,
      minWidth: '120px',
      render: (value) => (
        <Tag variant="info">
          {getDocumentTypeName(value as number)}
        </Tag>
      )
    },
    {
      field: 'caseId',
      header: 'Case ID',
      sortable: true,
      minWidth: '150px',
      render: (value, row) => (
        <MukuruLink href={`/applications/${row.caseId}`}>
          <Typography fontSize="sm" color="orange.600" _hover={{ textDecoration: "underline" }}>
            {(row.caseId as string).substring(0, 8)}...
          </Typography>
        </MukuruLink>
      )
    },
    {
      field: 'sizeBytes',
      header: 'Size',
      sortable: true,
      minWidth: '100px',
      render: (value) => (
        <Typography fontSize="sm" color="gray.600">
          {formatFileSize(value as number)}
        </Typography>
      )
    },
    {
      field: 'uploadedBy',
      header: 'Uploaded By',
      sortable: true,
      minWidth: '150px',
      render: (value) => (
        <Typography fontSize="sm" color="gray.600">
          {value as string}
        </Typography>
      )
    },
    {
      field: 'uploadedAt',
      header: 'Uploaded At',
      sortable: true,
      minWidth: '150px',
      render: (value) => (
        <HStack gap="2">
          <IconWrapper><FiCalendar size={16} color="#9CA3AF" /></IconWrapper>
          <Typography fontSize="sm" color="gray.600">
            {new Date(value as string).toLocaleDateString()}
          </Typography>
        </HStack>
      )
    }
  ];

  const actionColumn = {
    header: 'Actions',
    width: '150px',
    render: (row: Document) => (
      <HStack gap="2">
        <Tooltip content="View document">
          <button
            onClick={() => handleView(row)}
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
            <IconWrapper><FiEye size={14} /></IconWrapper>
          </button>
        </Tooltip>
        <Tooltip content="Download document">
          <button
            onClick={() => handleDownload(row)}
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
            <IconWrapper><FiDownload size={14} /></IconWrapper>
          </button>
        </Tooltip>
        <Tooltip content="View application">
          <button
            onClick={() => window.open(`/applications/${row.caseId}`, '_blank')}
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
            <IconWrapper><FiFileText size={14} /></IconWrapper>
          </button>
        </Tooltip>
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
                  Documents
                </Typography>
                <Typography color="gray.600">
                  View and manage all uploaded documents
                </Typography>
              </VStack>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="mukuru-primary-button"
              >
                <IconWrapper><FiRefreshCw size={16} /></IconWrapper>
                Refresh
              </Button>
            </Flex>

            {/* Toast Notification */}
            {toast && (
              <AlertBar
                status={toast.type}
                title={toast.title}
                description={toast.description}
                onClose={() => setToast(null)}
              />
            )}

            {/* Error Alert */}
            {error && (
              <AlertBar status="error" title="Error loading documents">
                {error}
              </AlertBar>
            )}

            {/* Search Bar */}
            <Box width="100%" maxW="800px">
              <Search
                placeholder="Search documents by name, case ID, type, or uploader..."
                onSearchChange={handleSearchChange}
              />
            </Box>

            {/* Documents Table */}
            <Box className="work-queue-table-wrapper" width="100%">
              <DataTable
                data={filteredDocuments as unknown as Record<string, unknown>[]}
                columns={columns as unknown as ColumnConfig<Record<string, unknown>>[]}
                actionColumn={actionColumn as unknown as { header?: string; width?: string; render: (row: Record<string, unknown>, index: number) => React.ReactNode }}
                loading={loading}
              />
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={total}
                pageSize={pageSize}
              />
            )}
          </VStack>
        </Container>
      </Box>

      {/* Document Viewer Modal */}
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
          <HStack justify="space-between" align="center" width="full">
            <VStack align="start" gap="0">
              <Typography fontSize="lg" fontWeight="700">
                {viewingDocument?.fileName}
              </Typography>
              <Typography fontSize="sm" color="gray.600">
                {viewingDocument && getDocumentTypeName(viewingDocument.type)} • {viewingDocument && formatFileSize(viewingDocument.sizeBytes)}
              </Typography>
            </VStack>
            <HStack gap="2">
              {viewingDocument && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(viewingDocument)}
                >
                  <IconWrapper><FiDownload size={16} /></IconWrapper>
                  Download
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setViewerOpen(false);
                  setViewingDocument(null);
                  setViewerUrl(null);
                }}
              >
                <IconWrapper><FiX size={16} /></IconWrapper>
              </Button>
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalBody>
          {viewerUrl && viewingDocument ? (
            isImageFile(viewingDocument.fileName, viewingDocument.contentType) ? (
              <Box p="4" bg="gray.50" display="flex" justifyContent="center" alignItems="center" minH="400px">
                <Image
                  src={viewerUrl}
                  alt={viewingDocument.fileName}
                  maxW="100%"
                  maxH="70vh"
                  objectFit="contain"
                  borderRadius="md"
                />
              </Box>
            ) : (
              <Box p="4" bg="gray.50" minH="400px">
                <iframe
                  src={viewerUrl}
                  style={{
                    width: '100%',
                    height: '70vh',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  title={viewingDocument.fileName}
                />
              </Box>
            )
          ) : (
            <Flex justify="center" align="center" minH="400px">
              <VStack gap="4">
                <Spinner size="xl" color="orange.500" />
                <Typography color="gray.600">Loading document...</Typography>
              </VStack>
            </Flex>
          )}
        </ModalBody>
      </Modal>
    </Flex>
  );
}
