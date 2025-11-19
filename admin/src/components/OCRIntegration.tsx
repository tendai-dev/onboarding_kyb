"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Alert,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Badge,
  Flex,
  Spinner,
  Tooltip,
  useDisclosure,
  Input,
  Checkbox,
  Textarea
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import {
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEdit,
  FiSave,
  FiRefreshCw,
  FiDownload,
  FiTrash2,
  FiInfo,
  FiZap,
  FiFile,
  FiImage,
  FiX
} from "react-icons/fi";
import { FileUpload } from "./FileUpload";

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
  onDocumentProcessed,
  entityType = 'private_company',
  documentType = 'certificate_incorporation',
  maxFileSize = 10,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff']
}: OCRIntegrationProps) {
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<OCRResult | null>(null);
  const [fieldMappings, setFieldMappings] = useState<OCRFieldMapping[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  
  const { open: isReviewOpen, onOpen: onReviewOpen, onClose: onReviewClose } = useDisclosure();

  const processDocumentWithOCR = async (file: File): Promise<OCRResult> => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // Simulate OCR processing with progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 200);
      
      // Mock OCR processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
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
        status: 'completed'
      };
      
      setOcrResults(prev => [result, ...prev]);
      setSelectedResult(result);
      
      // Auto-generate field mappings
      const mappings = generateFieldMappings(result, entityType);
      setFieldMappings(mappings);
      
      console.log("OCR Processing Complete:", `Extracted data from ${file.name} with ${Math.round(result.confidence * 100)}% confidence`);
      
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
        errors: ['OCR processing failed: ' + (error as Error).message]
      };
      
      setOcrResults(prev => [errorResult, ...prev]);
      
      console.error("OCR Processing Failed:", "Failed to extract data from document");
      
      return errorResult;
      
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const extractDataFromDocument = async (file: File, docType: string): Promise<any> => {
    // Mock OCR extraction based on document type
    const mockExtractions: Record<string, any> = {
      'certificate_incorporation': {
        fullText: 'CERTIFICATE OF INCORPORATION\n\nCompany Name: TechCorp Solutions Ltd\nRegistration Number: 2020/123456/07\nDate of Incorporation: 15 January 2020\nPlace of Incorporation: Johannesburg, South Africa\nAuthorized Capital: R1,000,000\nIssued Capital: R500,000',
        confidence: 0.92,
        fields: {
          companyName: 'TechCorp Solutions Ltd',
          registrationNumber: '2020/123456/07',
          dateOfIncorporation: '2020-01-15',
          placeOfIncorporation: 'Johannesburg, South Africa',
          authorizedCapital: 'R1,000,000',
          issuedCapital: 'R500,000'
        }
      },
      'memorandum_association': {
        fullText: 'MEMORANDUM OF ASSOCIATION\n\nCompany Name: TechCorp Solutions Ltd\nRegistration Number: 2020/123456/07\nMain Business: Software Development and IT Services\nRegistered Address: 123 Business Street, Johannesburg, 2000',
        confidence: 0.88,
        fields: {
          companyName: 'TechCorp Solutions Ltd',
          registrationNumber: '2020/123456/07',
          businessDescription: 'Software Development and IT Services',
          businessAddress: '123 Business Street, Johannesburg, 2000'
        }
      },
      'npo_certificate': {
        fullText: 'NPO REGISTRATION CERTIFICATE\n\nOrganization Name: Community Development Foundation\nNPO Number: 123-456\nRegistration Date: 15 March 2019\nOrganization Type: Non-Profit Organisation\nMain Activities: Community Development and Education',
        confidence: 0.90,
        fields: {
          organizationName: 'Community Development Foundation',
          registrationNumber: '123-456',
          dateOfRegistration: '2019-03-15',
          organizationType: 'Non-Profit Organisation',
          mainActivities: 'Community Development and Education'
        }
      },
      'government_certificate': {
        fullText: 'GOVERNMENT ENTITY CERTIFICATE\n\nEntity Name: Department of Social Development\nRegistration Number: GOV-2020-001\nEstablishment Date: 27 April 1994\nJurisdiction: National\nEntity Type: Government Department',
        confidence: 0.95,
        fields: {
          entityName: 'Department of Social Development',
          registrationNumber: 'GOV-2020-001',
          establishmentDate: '1994-04-27',
          jurisdiction: 'National',
          entityType: 'Government Department'
        }
      }
    };
    
    return mockExtractions[docType] || {
      fullText: 'Document processed successfully',
      confidence: 0.75,
      fields: {}
    };
  };

  const generateFieldMappings = (result: OCRResult, entityType: string): OCRFieldMapping[] => {
    const mappings: OCRFieldMapping[] = [];
    
    // Map extracted data to form fields based on entity type
    const fieldMappings: Record<string, string> = {
      'companyName': 'companyName',
      'organizationName': 'organizationName',
      'entityName': 'entityName',
      'registrationNumber': 'registrationNumber',
      'dateOfIncorporation': 'dateOfIncorporation',
      'dateOfRegistration': 'dateOfRegistration',
      'establishmentDate': 'establishmentDate',
      'placeOfIncorporation': 'placeOfIncorporation',
      'authorizedCapital': 'authorizedCapital',
      'issuedCapital': 'issuedCapital',
      'businessDescription': 'businessDescription',
      'mainActivities': 'mainActivities',
      'businessAddress': 'businessAddress',
      'organizationType': 'organizationType',
      'entityType': 'entityType',
      'jurisdiction': 'jurisdiction'
    };
    
    Object.entries(result.extractedData).forEach(([key, value]) => {
      const fieldId = fieldMappings[key];
      if (fieldId) {
        mappings.push({
          fieldId,
          fieldLabel: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          extractedValue: value,
          confidence: result.confidence,
          verified: false,
          suggested: true
        });
      }
    });
    
    return mappings;
  };

  const handleFieldMappingChange = (index: number, field: Partial<OCRFieldMapping>) => {
    setFieldMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, ...field } : mapping
    ));
  };

  const handleApplyMappings = () => {
    const verifiedMappings = fieldMappings.filter(mapping => mapping.verified);
    onDataExtracted(verifiedMappings);
    
    console.log("Data Applied:", `Applied ${verifiedMappings.length} field mappings to your form`);
    
    onReviewClose();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "green";
    if (confidence >= 0.6) return "yellow";
    return "red";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return "green";
      case 'processing': return "blue";
      case 'failed': return "red";
      case 'reviewed': return "purple";
      default: return "gray";
    }
  };

  return (
    <Box>
      {/* OCR Processing Area */}
      <Box p="6" bg="white" borderRadius="lg" boxShadow="sm" mb="6">
        <VStack gap="4" align="stretch">
          <HStack justify="space-between">
            <VStack align="start" gap="1">
              <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                OCR Document Processing
              </Text>
              <Text fontSize="sm" color="gray.600">
                Extract data automatically from your documents
              </Text>
            </VStack>
            
            <Badge colorScheme="blue" variant="subtle">
              {entityType} • {documentType}
            </Badge>
          </HStack>
          
          {isProcessing ? (
            <Box>
              <HStack gap="3" mb="3">
                <Spinner size="sm" color="blue.500" />
                <Text fontSize="sm" color="blue.600">
                  Processing document with OCR...
                </Text>
              </HStack>
              <Box
                width="100%"
                height="8px"
                bg="gray.200"
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  width={`${processingProgress}%`}
                  height="100%"
                  bg="blue.500"
                  transition="width 0.3s"
                />
              </Box>
            </Box>
          ) : (
            <FileUpload
              onFileUpload={async (file: File) => {
                const result = await processDocumentWithOCR(file);
                return result.id;
              }}
              acceptedTypes={acceptedTypes}
              maxSize={maxFileSize}
              label="Upload Document for OCR Processing"
              description="Upload a document to automatically extract form data"
            />
          )}
        </VStack>
      </Box>

      {/* OCR Results */}
      {ocrResults.length > 0 && (
        <Box p="6" bg="white" borderRadius="lg" boxShadow="sm" mb="6">
          <VStack gap="4" align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                OCR Results
              </Text>
              <Badge colorScheme="blue" variant="subtle">
                {ocrResults.length} processed
              </Badge>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
              {ocrResults.map((result) => (
                <Box
                  key={result.id}
                  p="4"
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="gray.50"
                  cursor="pointer"
                  _hover={{ bg: "gray.100" }}
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
                        <Icon as={FiFileText} color="blue.500" />
                        <Text fontSize="sm" fontWeight="medium" color="gray.800">
                          {result.fileName}
                        </Text>
                      </HStack>
                      <Badge
                        colorScheme={getStatusColor(result.status)}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {result.status}
                      </Badge>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.500">
                        Confidence: {Math.round(result.confidence * 100)}%
                      </Text>
                      <Badge
                        colorScheme={getConfidenceColor(result.confidence)}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {result.confidence >= 0.8 ? "High" : result.confidence >= 0.6 ? "Medium" : "Low"}
                      </Badge>
                    </HStack>
                    
                    <Text fontSize="xs" color="gray.600">
                      Processed: {new Date(result.timestamp).toLocaleString()}
                    </Text>
                    
                    <HStack gap="2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResult(result);
                          const mappings = generateFieldMappings(result, entityType);
                          setFieldMappings(mappings);
                          onReviewOpen();
                        }}
                      >
                        <Icon as={FiEye} mr="2" />
                        Review
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download extracted text
                        }}
                      >
                        <Icon as={FiDownload} mr="2" />
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
      {isReviewOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={onReviewClose}
        >
          <Box
            bg="white"
            borderRadius="md"
            maxW="xl"
            w="90%"
            maxH="90vh"
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p="4" borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between">
                <HStack gap="2">
                  <Icon as={FiEye} color="blue.500" />
                  <Text fontWeight="bold" fontSize="lg">Review Extracted Data</Text>
                </HStack>
                <Button variant="ghost" size="sm" onClick={onReviewClose}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
            {selectedResult && (
              <VStack gap="6" align="stretch">
                {/* Document Info */}
                <Box p="4" bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                  <VStack gap="2" align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium" color="blue.700">
                        {selectedResult.fileName}
                      </Text>
                      <Badge
                        colorScheme={getConfidenceColor(selectedResult.confidence)}
                        variant="subtle"
                      >
                        {Math.round(selectedResult.confidence * 100)}% Confidence
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="blue.600">
                      Processing time: {selectedResult.processingTime}s
                    </Text>
                  </VStack>
                </Box>
                
                {/* Extracted Text Preview */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                    Extracted Text:
                  </Text>
                  <Box
                    p="3"
                    bg="gray.50"
                    borderRadius="md"
                    border="1px"
                    borderColor="gray.200"
                    maxH="200px"
                    overflowY="auto"
                  >
                    <Text fontSize="xs" color="gray.600" whiteSpace="pre-wrap">
                      {selectedResult.extractedText}
                    </Text>
                  </Box>
                </Box>
                
                {/* Field Mappings */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="3">
                    Field Mappings:
                  </Text>
                  <VStack gap="3" align="stretch">
                    {fieldMappings.map((mapping, index) => (
                      <Box
                        key={index}
                        p="3"
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        bg="white"
                      >
                        <HStack gap="3" align="start">
                          <Checkbox.Root
                            checked={mapping.verified}
                            onCheckedChange={(details) => handleFieldMappingChange(index, { verified: details.checked === true })}
                          >
                            <Checkbox.Indicator />
                          </Checkbox.Root>
                          
                          <VStack align="start" gap="1" flex="1">
                            <HStack gap="2">
                              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                                {mapping.fieldLabel}
                              </Text>
                              <Badge
                                colorScheme={getConfidenceColor(mapping.confidence)}
                                variant="subtle"
                                fontSize="xs"
                              >
                                {Math.round(mapping.confidence * 100)}%
                              </Badge>
                              {mapping.suggested && (
                                <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                                  Suggested
                                </Badge>
                              )}
                            </HStack>
                            
                            <Input
                              value={mapping.extractedValue}
                              onChange={(e) => handleFieldMappingChange(index, { extractedValue: e.target.value })}
                              size="sm"
                              fontSize="xs"
                            />
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack gap="2" justify="flex-end">
                <Button variant="outline" onClick={onReviewClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleApplyMappings}
                  disabled={fieldMappings.filter(m => m.verified).length === 0}
                >
                  <Icon as={FiSave} mr="2" />
                  Apply Selected Mappings ({fieldMappings.filter(m => m.verified).length})
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
