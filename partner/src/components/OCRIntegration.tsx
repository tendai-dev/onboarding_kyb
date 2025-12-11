'use client';
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  VStack,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  useDisclosure,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import { Button, Typography, Tag } from '@/lib/mukuruImports';
import { useState } from 'react';
import { FiEye, FiSave, FiDownload, FiFileText } from 'react-icons/fi';
import { FileUpload } from './FileUpload';

interface OCRResult {
  id: string;
  fileName: string;
  fileType: string;
  extractedText: string;
  confidence: number;
  extractedData: Record<string, any>;
  processingTime: number;
  timestamp: string;
  status: 'processing' | 'completed' | 'failed' | 'reviewed';
  errors?: string[];
}

interface OCRFieldMapping {
  fieldId: string;
  fieldLabel: string;
  extractedValue: any;
  confidence: number;
  verified: boolean;
  suggested: boolean;
}

interface OCRIntegrationProps {
  onDataExtracted: (fieldMappings: OCRFieldMapping[]) => void;
  onDocumentProcessed: (result: OCRResult) => void;
  entityType?: string;
  documentType?: string;
  maxFileSize?: number;
  acceptedTypes?: string[];
}

export function OCRIntegration({
  onDataExtracted,
  onDocumentProcessed: _onDocumentProcessed,
  entityType = 'private_company',
  documentType = 'certificate_incorporation',
  maxFileSize = 10,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff'],
}: OCRIntegrationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<OCRResult | null>(null);
  const [fieldMappings, setFieldMappings] = useState<OCRFieldMapping[]>([]);
  // const [isReviewing, setIsReviewing] = useState(false);

  const {
    open: isReviewOpen,
    onOpen: onReviewOpen,
    onClose: onReviewClose,
  } = useDisclosure();
  const [banner, setBanner] = useState<{
    status: 'success' | 'error';
    message: string;
  } | null>(null);

  const processDocumentWithOCR = async (file: File): Promise<OCRResult> => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate OCR processing with progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      // Mock OCR processing time
      await new Promise((resolve) => setTimeout(resolve, 3000));

      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Simulate OCR extraction based on document type
      const extractedData = await extractDataFromDocument(file, documentType);

      const result: OCRResult = {
        id: `ocr_${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        extractedText: extractedData.fullText,
        confidence: extractedData.confidence,
        extractedData: extractedData.fields,
        processingTime: 3.2,
        timestamp: new Date().toISOString(),
        status: 'completed',
      };

      setOcrResults((prev) => [result, ...prev]);
      setSelectedResult(result);

      // Auto-generate field mappings
      const mappings = generateFieldMappings(result, entityType);
      setFieldMappings(mappings);

      setBanner({
        status: 'success',
        message: `Extracted data from ${file.name} with ${Math.round(result.confidence * 100)}% confidence`,
      });
      setTimeout(() => setBanner(null), 4000);

      return result;
    } catch (error) {
      const errorResult: OCRResult = {
        id: `ocr_error_${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        extractedText: '',
        confidence: 0,
        extractedData: {},
        processingTime: 0,
        timestamp: new Date().toISOString(),
        status: 'failed',
        errors: ['OCR processing failed: ' + (error as Error).message],
      };

      setOcrResults((prev) => [errorResult, ...prev]);

      setBanner({ status: 'error', message: 'Failed to extract data from document' });
      setTimeout(() => setBanner(null), 4000);

      return errorResult;
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const extractDataFromDocument = async (file: File, docType: string): Promise<any> => {
    // Mock OCR extraction based on document type
    const mockExtractions: Record<string, any> = {
      certificate_incorporation: {
        fullText:
          'CERTIFICATE OF INCORPORATION\n\nCompany Name: TechCorp Solutions Ltd\nRegistration Number: 2020/123456/07\nDate of Incorporation: 15 January 2020\nPlace of Incorporation: Johannesburg, South Africa\nAuthorized Capital: R1,000,000\nIssued Capital: R500,000',
        confidence: 0.92,
        fields: {
          companyName: 'TechCorp Solutions Ltd',
          registrationNumber: '2020/123456/07',
          dateOfIncorporation: '2020-01-15',
          placeOfIncorporation: 'Johannesburg, South Africa',
          authorizedCapital: 'R1,000,000',
          issuedCapital: 'R500,000',
        },
      },
      memorandum_association: {
        fullText:
          'MEMORANDUM OF ASSOCIATION\n\nCompany Name: TechCorp Solutions Ltd\nRegistration Number: 2020/123456/07\nMain Business: Software Development and IT Services\nRegistered Address: 123 Business Street, Johannesburg, 2000',
        confidence: 0.88,
        fields: {
          companyName: 'TechCorp Solutions Ltd',
          registrationNumber: '2020/123456/07',
          businessDescription: 'Software Development and IT Services',
          businessAddress: '123 Business Street, Johannesburg, 2000',
        },
      },
      npo_certificate: {
        fullText:
          'NPO REGISTRATION CERTIFICATE\n\nOrganization Name: Community Development Foundation\nNPO Number: 123-456\nRegistration Date: 15 March 2019\nOrganization Type: Non-Profit Organisation\nMain Activities: Community Development and Education',
        confidence: 0.9,
        fields: {
          organizationName: 'Community Development Foundation',
          registrationNumber: '123-456',
          dateOfRegistration: '2019-03-15',
          organizationType: 'Non-Profit Organisation',
          mainActivities: 'Community Development and Education',
        },
      },
      government_certificate: {
        fullText:
          'GOVERNMENT ENTITY CERTIFICATE\n\nEntity Name: Department of Social Development\nRegistration Number: GOV-2020-001\nEstablishment Date: 27 April 1994\nJurisdiction: National\nEntity Type: Government Department',
        confidence: 0.95,
        fields: {
          entityName: 'Department of Social Development',
          registrationNumber: 'GOV-2020-001',
          establishmentDate: '1994-04-27',
          jurisdiction: 'National',
          entityType: 'Government Department',
        },
      },
    };

    return (
      mockExtractions[docType] || {
        fullText: 'Document processed successfully',
        confidence: 0.75,
        fields: {},
      }
    );
  };

  const generateFieldMappings = (
    result: OCRResult,
    _entityType: string
  ): OCRFieldMapping[] => {
    const mappings: OCRFieldMapping[] = [];

    // Map extracted data to form fields based on entity type
    const fieldMappings: Record<string, string> = {
      companyName: 'companyName',
      organizationName: 'organizationName',
      entityName: 'entityName',
      registrationNumber: 'registrationNumber',
      dateOfIncorporation: 'dateOfIncorporation',
      dateOfRegistration: 'dateOfRegistration',
      establishmentDate: 'establishmentDate',
      placeOfIncorporation: 'placeOfIncorporation',
      authorizedCapital: 'authorizedCapital',
      issuedCapital: 'issuedCapital',
      businessDescription: 'businessDescription',
      mainActivities: 'mainActivities',
      businessAddress: 'businessAddress',
      organizationType: 'organizationType',
      entityType: 'entityType',
      jurisdiction: 'jurisdiction',
    };

    Object.entries(result.extractedData).forEach(([key, value]) => {
      const fieldId = fieldMappings[key];
      if (fieldId) {
        mappings.push({
          fieldId,
          fieldLabel: key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase()),
          extractedValue: value,
          confidence: result.confidence,
          verified: false,
          suggested: true,
        });
      }
    });

    return mappings;
  };

  const handleFieldMappingChange = (index: number, field: Partial<OCRFieldMapping>) => {
    setFieldMappings((prev) =>
      prev.map((mapping, i) => (i === index ? { ...mapping, ...field } : mapping))
    );
  };

  const handleApplyMappings = () => {
    const verifiedMappings = fieldMappings.filter((mapping) => mapping.verified);
    onDataExtracted(verifiedMappings);

    setBanner({
      status: 'success',
      message: `Applied ${verifiedMappings.length} field mappings to your form`,
    });
    setTimeout(() => setBanner(null), 2500);

    onReviewClose();
  };

  // Unused helper functions - kept for potential future use
  // const getConfidenceColor = (confidence: number) => {
  //   if (confidence >= 0.8) return 'green';
  //   if (confidence >= 0.6) return 'yellow';
  //   return 'red';
  // };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'completed':
  //       return 'green';
  //     case 'processing':
  //       return 'blue';
  //     case 'failed':
  //       return 'red';
  //     case 'reviewed':
  //       return 'purple';
  //     default:
  //       return 'gray';
  //   }
  // };

  return (
    <Box>
      {/* OCR Processing Area */}
      <Box p="6" bg="white" borderRadius="lg" boxShadow="sm" mb="6">
        <VStack gap="4" align="stretch">
          <HStack justify="space-between">
            <VStack align="start" gap="1">
              <Typography fontSize="lg" fontWeight="semibold" color="mukuru.text.primary">
                OCR Document Processing
              </Typography>
              <Typography fontSize="sm" color="mukuru.text.primary">
                Extract data automatically from your documents
              </Typography>
            </VStack>

            <Tag variant="solid" size="md">
              {entityType} • {documentType}
            </Tag>
          </HStack>

          {isProcessing ? (
            <Box>
              <HStack gap="3" mb="3">
                <Spinner size="sm" color="mukuru.teal" />
                <Typography fontSize="sm" color="mukuru.text.primary">
                  Processing document with OCR...
                </Typography>
              </HStack>
              <Box h="2" bg="mukuru.grey.light" borderRadius="full" overflow="hidden">
                <Box
                  h="2"
                  bg="primary.500"
                  width={`${Math.round(processingProgress)}%`}
                />
              </Box>
            </Box>
          ) : (
            <FileUpload
              onFileUpload={async (file) => {
                const result = await processDocumentWithOCR(file);
                return result.extractedText;
              }}
              acceptedTypes={acceptedTypes}
              maxSize={maxFileSize}
              label="Upload Document for OCR Processing"
              description="Upload a document to automatically extract form data"
            />
          )}
        </VStack>
      </Box>

      {banner && (
        <Box
          p="3"
          bg={banner.status === 'success' ? 'success.50' : 'error.50'}
          border="1px"
          borderColor={banner.status === 'success' ? 'success.200' : 'error.200'}
          borderRadius="md"
          mb="4"
        >
          <Typography
            fontSize="sm"
            color={banner.status === 'success' ? 'success.700' : 'error.700'}
          >
            {banner.message}
          </Typography>
        </Box>
      )}

      {/* OCR Results */}
      {ocrResults.length > 0 && (
        <Box p="6" bg="white" borderRadius="lg" boxShadow="sm" mb="6">
          <VStack gap="4" align="stretch">
            <HStack justify="space-between">
              <Typography fontSize="lg" fontWeight="semibold" color="mukuru.text.primary">
                OCR Results
              </Typography>
              <Tag variant="solid" size="md">
                {ocrResults.length} processed
              </Tag>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
              {ocrResults.map((result) => (
                <Box
                  key={result.id}
                  p="4"
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="mukuru.background.light"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                  onClick={() => {
                    setSelectedResult(result);
                    const mappings = generateFieldMappings(result, entityType);
                    setFieldMappings(mappings);
                    onReviewOpen();
                  }}
                >
                  <VStack gap="3" align="stretch">
                    <HStack justify="space-between">
                      <HStack gap="2">
                        <Icon as={FiFileText} color="mukuru.teal" />
                        <Typography
                          fontSize="sm"
                          fontWeight="medium"
                          color="mukuru.text.primary"
                        >
                          {result.fileName}
                        </Typography>
                      </HStack>
                      <Tag variant="solid" size="md">
                        {result.status}
                      </Tag>
                    </HStack>

                    <HStack justify="space-between">
                      <Typography fontSize="xs" color="mukuru.grey.medium">
                        Confidence: {Math.round(result.confidence * 100)}%
                      </Typography>
                      <Tag variant="solid" size="md">
                        {result.confidence >= 0.8
                          ? 'High'
                          : result.confidence >= 0.6
                            ? 'Medium'
                            : 'Low'}
                      </Tag>
                    </HStack>

                    <Typography fontSize="xs" color="mukuru.text.primary">
                      Processed: {new Date(result.timestamp).toLocaleString()}
                    </Typography>

                    <HStack gap="2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResult(result);
                          const mappings = generateFieldMappings(result, entityType);
                          setFieldMappings(mappings);
                          onReviewOpen();
                        }}
                      >
                        <Icon as={FiEye} mr="1" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download extracted text
                        }}
                      >
                        <Icon as={FiDownload} mr="1" />
                        Download
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>
      )}

      {/* OCR Review Modal */}
      <DialogRoot
        open={isReviewOpen}
        onOpenChange={(e) => (e.open ? onReviewOpen() : onReviewClose())}
      >
        <DialogContent maxW="xl">
          <DialogHeader>
            <DialogTitle>
              <HStack gap="2">
                <Icon as={FiEye} color="mukuru.teal" />
                <Typography color="mukuru.text.primary" fontSize="lg" fontWeight="bold">
                  Review Extracted Data
                </Typography>
              </HStack>
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {selectedResult && (
              <VStack gap="6" align="stretch">
                {/* Document Info */}
                <Box
                  p="4"
                  bg="info.50"
                  borderRadius="md"
                  border="1px"
                  borderColor="info.200"
                >
                  <VStack gap="2" align="stretch">
                    <HStack justify="space-between">
                      <Typography
                        fontSize="sm"
                        fontWeight="medium"
                        color="mukuru.text.primary"
                      >
                        {selectedResult.fileName}
                      </Typography>
                      <Tag variant="solid" size="md">
                        {Math.round(selectedResult.confidence * 100)}% Confidence
                      </Tag>
                    </HStack>
                    <Typography fontSize="xs" color="mukuru.text.primary">
                      Processing time: {selectedResult.processingTime}s
                    </Typography>
                  </VStack>
                </Box>

                {/* Extracted Text Preview */}
                <Box>
                  <Typography
                    fontSize="sm"
                    fontWeight="medium"
                    color="mukuru.text.primary"
                    mb="2"
                  >
                    Extracted Text:
                  </Typography>
                  <Box
                    p="3"
                    bg="mukuru.background.light"
                    borderRadius="md"
                    border="1px"
                    borderColor="gray.200"
                    maxH="200px"
                    overflowY="auto"
                  >
                    <Typography
                      fontSize="xs"
                      color="mukuru.text.primary"
                      whiteSpace="pre-wrap"
                    >
                      {selectedResult.extractedText}
                    </Typography>
                  </Box>
                </Box>

                {/* Field Mappings */}
                <Box>
                  <Typography
                    fontSize="sm"
                    fontWeight="medium"
                    color="mukuru.text.primary"
                    mb="3"
                  >
                    Field Mappings:
                  </Typography>
                  <VStack gap="3" align="stretch">
                    {fieldMappings.map((mapping, index) => (
                      <Box
                        key={index}
                        p="3"
                        border="1px"
                        borderColor="mukuru.grey.light"
                        borderRadius="md"
                        bg="white"
                      >
                        <HStack gap="3" align="start">
                          <input
                            type="checkbox"
                            checked={mapping.verified}
                            onChange={(e) =>
                              handleFieldMappingChange(index, {
                                verified: (e.target as HTMLInputElement).checked,
                              })
                            }
                          />

                          <VStack align="start" gap="1" flex="1">
                            <HStack gap="2">
                              <Typography
                                fontSize="sm"
                                fontWeight="medium"
                                color="mukuru.text.primary"
                              >
                                {mapping.fieldLabel}
                              </Typography>
                              <Tag variant="solid" size="md">
                                {Math.round(mapping.confidence * 100)}%
                              </Tag>
                              {mapping.suggested && (
                                <Tag variant="info" size="md">
                                  Suggested
                                </Tag>
                              )}
                            </HStack>

                            <input
                              value={mapping.extractedValue as any}
                              onChange={(e) =>
                                handleFieldMappingChange(index, {
                                  extractedValue: (e.target as HTMLInputElement).value,
                                })
                              }
                              style={{
                                width: '100%',
                                padding: '6px',
                                borderRadius: 6,
                                border: '1px solid var(--mukuru-grey-light)',
                              }}
                            />
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            <HStack gap="2">
              <Button variant="ghost" onClick={onReviewClose}>
                <Typography color="mukuru.text.primary" fontSize="sm" fontWeight="medium">
                  Cancel
                </Typography>
              </Button>
              <Button
                variant="primary"
                bg="mukuru.buttons.primary"
                _hover={{ bg: 'mukuru.buttons.inactive.orange' }}
                onClick={handleApplyMappings}
                disabled={fieldMappings.filter((m) => m.verified).length === 0}
              >
                <Icon as={FiSave} mr="2" color="mukuru.text.inverse" />
                <Typography color="mukuru.text.inverse" fontSize="sm" fontWeight="medium">
                  Apply Selected Mappings (
                  {fieldMappings.filter((m) => m.verified).length})
                </Typography>
              </Button>
            </HStack>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
