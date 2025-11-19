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
  Table,
  Menu,
  createToaster,
  Dialog,
  Image
} from "@chakra-ui/react";
import { 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiEye,
  FiFileText,
  FiCalendar,
  FiUser,
  FiRefreshCw,
  FiMoreVertical,
  FiX
} from "react-icons/fi";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminSidebar from "../../components/AdminSidebar";

const DOCUMENT_API_BASE_URL = process.env.NEXT_PUBLIC_DOCUMENT_API_BASE_URL || 'http://localhost:8008';

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const toaster = createToaster({ placement: "top" });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const skip = (page - 1) * pageSize;
      const url = `/api/proxy/api/v1/documents?skip=${skip}&take=${pageSize}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load documents: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDocuments(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      setDocuments([]);
      toaster.create({
        title: 'Error loading documents',
        description: err instanceof Error ? err.message : 'Failed to load documents',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [page, toaster]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const getDocumentUrl = async (document: Document): Promise<string | null> => {
    try {
      // Use proxy endpoint to avoid CORS and signature issues
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
        toaster.create({
          title: 'View failed',
          description: 'Could not load document. Please try downloading instead.',
          type: 'error',
          duration: 5000,
        });
        setViewerOpen(false);
        setViewingDocument(null);
      }
    } catch (err) {
      console.error('Error viewing document:', err);
      toaster.create({
        title: 'View failed',
        description: err instanceof Error ? err.message : 'Failed to view document',
        type: 'error',
        duration: 5000,
      });
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
      toaster.create({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Failed to download document',
        type: 'error',
        duration: 5000,
      });
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

  if (loading && documents.length === 0) {
    return (
      <Box>
        <AdminSidebar />
        <Box ml="240px" p="8" bg="gray.50" minH="100vh">
          <Container maxW="7xl">
            <Flex justify="center" align="center" minH="400px">
              <VStack gap="4">
                <Spinner size="xl" color="orange.500" />
                <Text color="gray.600">Loading documents...</Text>
              </VStack>
            </Flex>
          </Container>
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
                  Documents
                </Text>
                <Text color="gray.600">
                  View and manage all uploaded documents
                </Text>
              </VStack>
              
              <HStack gap="3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadDocuments()}
                >
                  <Icon as={FiRefreshCw} style={{ marginRight: '8px' }} />
                  Refresh
                </Button>
              </HStack>
            </Flex>

            {/* Search and Filters */}
            <HStack gap="4">
              <Box position="relative" flex="1">
                <Icon 
                  as={FiSearch} 
                  color="gray.400" 
                  position="absolute"
                  left="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex="1"
                  pointerEvents="none"
                />
                <Input
                  placeholder="Search documents by name, case ID, type, or uploader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="white"
                  pl="10"
                />
              </Box>
            </HStack>

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
                  <Icon as={FiFileText} boxSize="5" color="red.600" />
                  <VStack align="start" gap="1" flex="1">
                    <Text fontWeight="semibold" color="red.700">Error loading documents</Text>
                    <Text fontSize="sm" color="red.600">{error}</Text>
                  </VStack>
                </HStack>
              </Box>
            )}

            {/* Documents Table */}
            <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>File Name</Table.ColumnHeader>
                    <Table.ColumnHeader>Type</Table.ColumnHeader>
                    <Table.ColumnHeader>Case ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Size</Table.ColumnHeader>
                    <Table.ColumnHeader>Uploaded By</Table.ColumnHeader>
                    <Table.ColumnHeader>Uploaded At</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredDocuments.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={7} textAlign="center" py="8">
                        <VStack gap="2">
                          <Icon as={FiFileText} boxSize="8" color="gray.400" />
                          <Text color="gray.500">No documents found</Text>
                        </VStack>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <Table.Row key={doc.id} _hover={{ bg: "gray.50" }}>
                        <Table.Cell>
                          <HStack gap="2">
                            <Icon as={FiFileText} color="orange.500" />
                            <Text 
                              fontSize="sm" 
                              fontWeight="medium" 
                              color="orange.600"
                              cursor="pointer"
                              _hover={{ textDecoration: "underline" }}
                              onClick={() => handleView(doc)}
                            >
                              {doc.fileName}
                            </Text>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge colorScheme="blue">
                            {getDocumentTypeName(doc.type)}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Link href={`/applications/${doc.caseId}`}>
                            <Text fontSize="sm" color="orange.600" _hover={{ textDecoration: "underline" }}>
                              {doc.caseId.substring(0, 8)}...
                            </Text>
                          </Link>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" color="gray.600">
                            {formatFileSize(doc.sizeBytes)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" color="gray.600">
                            {doc.uploadedBy}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <HStack gap="2">
                            <Icon as={FiCalendar} boxSize="4" color="gray.400" />
                            <Text fontSize="sm" color="gray.600">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </Text>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell>
                          <HStack gap="2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleView(doc)}
                              title="View document"
                            >
                              <Icon as={FiEye} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              title="Download document"
                            >
                              <Icon as={FiDownload} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(`/applications/${doc.caseId}`, '_blank')}
                              title="View application"
                            >
                              <Icon as={FiFileText} />
                            </Button>
                          </HStack>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <HStack justify="center" gap="2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Text fontSize="sm" color="gray.600">
                  Page {page} of {totalPages} ({total} total documents)
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </HStack>
            )}
          </VStack>
        </Container>
      </Box>

      {/* Document Viewer Modal */}
      <Dialog.Root open={viewerOpen} onOpenChange={(e) => {
        setViewerOpen(e.open);
        if (!e.open) {
          setViewingDocument(null);
          setViewerUrl(null);
        }
      }}>
        <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content maxW="90vw" maxH="90vh" borderRadius="xl" boxShadow="2xl">
            <Dialog.Header pb="4" borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between" align="center">
                <VStack align="start" gap="0">
                  <Dialog.Title fontSize="lg" fontWeight="700">
                    {viewingDocument?.fileName}
                  </Dialog.Title>
                  <Dialog.Description fontSize="sm" color="gray.600">
                    {viewingDocument && getDocumentTypeName(viewingDocument.type)} • {viewingDocument && formatFileSize(viewingDocument.sizeBytes)}
                  </Dialog.Description>
                </VStack>
                <HStack gap="2">
                  {viewingDocument && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(viewingDocument)}
                    >
                      <Icon as={FiDownload} style={{ marginRight: '8px' }} />
                      Download
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setViewerOpen(false);
                      setViewingDocument(null);
                      setViewerUrl(null);
                    }}
                  >
                    <Icon as={FiX} />
                  </Button>
                </HStack>
              </HStack>
            </Dialog.Header>
            <Dialog.Body p="0" overflow="auto">
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
                    <Text color="gray.600">Loading document...</Text>
                  </VStack>
                </Flex>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}

