"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Flex,
  Icon,
  Badge,
  useDisclosure,
  Input,
  Textarea,
  Checkbox,
  SimpleGrid,
  Image,
  Spinner,
  Tooltip
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import {
  FiEdit3,
  FiCheck,
  FiX,
  FiDownload,
  FiUpload,
  FiEye,
  FiLock,
  FiUnlock,
  FiUser,
  FiCalendar,
  FiClock,
  FiShield,
  FiFileText,
  FiSend,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiAlertTriangle
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

export interface SignatureField {
  id: string;
  documentId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signerId: string;
  signerName: string;
  signerEmail: string;
  required: boolean;
  status: 'pending' | 'signed' | 'declined';
  signedAt?: string;
  signatureData?: string;
  signatureImage?: string;
  comments?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'agreement' | 'contract' | 'policy' | 'form';
  url: string;
  pages: number;
  signatureFields: SignatureField[];
  status: 'draft' | 'pending_signatures' | 'partially_signed' | 'fully_signed' | 'declined';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  signers: Array<{
    id: string;
    name: string;
    email: string;
    role: 'primary' | 'secondary' | 'witness';
    status: 'pending' | 'signed' | 'declined';
  }>;
}

export interface SignatureSession {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  status: 'active' | 'completed' | 'expired';
  startedAt: string;
  completedAt?: string;
  ipAddress: string;
  userAgent: string;
  signatureData?: string;
  signatureImage?: string;
  auditTrail: Array<{
    action: string;
    timestamp: string;
    details: string;
  }>;
}

interface DigitalSignatureProps {
  document: Document;
  currentSigner: {
    id: string;
    name: string;
    email: string;
  };
  onSign: (signatureData: string, signatureImage: string) => Promise<void>;
  onDecline: (reason: string) => Promise<void>;
  onDownload: () => void;
  onViewDocument: () => void;
}

export function DigitalSignature({
  document,
  currentSigner,
  onSign,
  onDecline,
  onDownload,
  onViewDocument
}: DigitalSignatureProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");
  const [signatureImage, setSignatureImage] = useState<string>("");
  const [declineReason, setDeclineReason] = useState("");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [selectedField, setSelectedField] = useState<SignatureField | null>(null);
  const [session, setSession] = useState<SignatureSession | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<any>(null);
  
  const { open: isDeclineOpen, onOpen: onDeclineOpen, onClose: onDeclineClose } = useDisclosure();
  const { open: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

  // Initialize signature session
  useEffect(() => {
    const newSession: SignatureSession = {
      id: `session_${Date.now()}`,
      documentId: document.id,
      signerId: currentSigner.id,
      signerName: currentSigner.name,
      signerEmail: currentSigner.email,
      status: 'active',
      startedAt: new Date().toISOString(),
      ipAddress: '192.168.1.1', // Mock IP
      userAgent: navigator.userAgent,
      auditTrail: [
        {
          action: 'session_started',
          timestamp: new Date().toISOString(),
          details: 'Signature session initiated'
        }
      ]
    };
    setSession(newSession);
  }, [document.id, currentSigner]);

  // Get signature fields for current page
  const currentPageFields = document.signatureFields.filter(field => field.pageNumber === currentPage);

  // Calculate signing progress
  const totalFields = document.signatureFields.length;
  const signedFields = document.signatureFields.filter(field => field.status === 'signed').length;
  const progressPercentage = totalFields > 0 ? (signedFields / totalFields) * 100 : 0;

  const handleSignatureStart = (field: SignatureField) => {
    setSelectedField(field);
    setShowSignaturePad(true);
    
    // Add to audit trail
    if (session) {
      setSession(prev => ({
        ...prev!,
        auditTrail: [
          ...prev!.auditTrail,
          {
            action: 'signature_started',
            timestamp: new Date().toISOString(),
            details: `Started signing field: ${field.id}`
          }
        ]
      }));
    }
  };

  const handleSignatureComplete = async () => {
    if (!signatureData || !selectedField) return;

    setIsSigning(true);
    try {
      await onSign(signatureData, signatureImage);
      
      // Update session
      if (session) {
        setSession(prev => ({
          ...prev!,
          auditTrail: [
            ...prev!.auditTrail,
            {
              action: 'signature_completed',
              timestamp: new Date().toISOString(),
              details: `Completed signing field: ${selectedField.id}`
            }
          ]
        }));
      }
      
      setShowSignaturePad(false);
      setSelectedField(null);
      setSignatureData("");
      setSignatureImage("");
    } catch (error) {
      console.error('Error signing document:', error);
    } finally {
      setIsSigning(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) return;

    try {
      await onDecline(declineReason);
      onDeclineClose();
    } catch (error) {
      console.error('Error declining document:', error);
    }
  };

  const clearSignature = () => {
    setSignatureData("");
    setSignatureImage("");
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'green';
      case 'pending': return 'orange';
      case 'declined': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return FiCheckCircle;
      case 'pending': return FiClock;
      case 'declined': return FiX;
      default: return FiClock;
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" p="6">
        <VStack gap="4" align="stretch">
          <HStack justify="space-between">
            <VStack align="start" gap="1">
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                Digital Signature
              </Text>
              <Text color="gray.600">
                {document.name} • {document.type.toUpperCase()}
              </Text>
            </VStack>
            
            <HStack gap="3">
              <Button variant="outline" onClick={onViewDocument}>
                <Icon as={FiEye} mr="2" />
                View Document
              </Button>
              <Button variant="outline" onClick={onDownload}>
                <Icon as={FiDownload} mr="2" />
                Download
              </Button>
            </HStack>
          </HStack>

          {/* Progress */}
          <Box>
            <HStack justify="space-between" mb="2">
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Signing Progress
              </Text>
              <Text fontSize="sm" color="gray.600">
                {signedFields} of {totalFields} fields signed
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
                width={`${progressPercentage}%`}
                height="100%"
                bg="orange.500"
                transition="width 0.3s"
              />
            </Box>
            <Text fontSize="xs" color="gray.500" mt="1" textAlign="center">
              {Math.round(progressPercentage)}% Complete
            </Text>
          </Box>

          {/* Signer Info */}
          <HStack justify="space-between" p="4" bg="orange.50" borderRadius="lg">
            <HStack gap="3">
              <Icon as={FiUser} color="orange.600" boxSize="5" />
              <VStack align="start" gap="0">
                <Text fontWeight="medium" color="orange.800">
                  {currentSigner.name}
                </Text>
                <Text fontSize="sm" color="orange.600">
                  {currentSigner.email}
                </Text>
              </VStack>
            </HStack>
            
            <HStack gap="4">
              <VStack align="center" gap="0">
                <Icon as={FiCalendar} color="orange.600" boxSize="4" />
                <Text fontSize="xs" color="orange.600">
                  {new Date().toLocaleDateString()}
                </Text>
              </VStack>
              <VStack align="center" gap="0">
                <Icon as={FiShield} color="orange.600" boxSize="4" />
                <Text fontSize="xs" color="orange.600">
                  Secure
                </Text>
              </VStack>
            </HStack>
          </HStack>
        </VStack>
      </Box>

      {/* Main Content */}
      <Flex>
        {/* Document Viewer */}
        <Box flex="1" p="6">
          <VStack gap="4" align="stretch">
            {/* Page Navigation */}
            <HStack justify="center" gap="2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Text fontSize="sm" color="gray.600">
                Page {currentPage} of {document.pages}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.min(document.pages, currentPage + 1))}
                disabled={currentPage === document.pages}
              >
                Next
              </Button>
            </HStack>

            {/* Document Preview */}
            <Box
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              border="1px"
              borderColor="gray.200"
              p="4"
              position="relative"
              minH="600px"
            >
              {/* Mock document content */}
              <VStack gap="4" align="stretch">
                <Text fontSize="lg" fontWeight="bold" textAlign="center">
                  {document.name}
                </Text>
                <Box height="1px" bg="gray.200" my="2" />
                <Text fontSize="sm" color="gray.600">
                  This is a preview of page {currentPage} of the document. 
                  In a real implementation, this would show the actual document content.
                </Text>
                
                {/* Signature Fields Overlay */}
                {currentPageFields.map((field) => (
                  <Box
                    key={field.id}
                    position="absolute"
                    left={`${field.x}%`}
                    top={`${field.y}%`}
                    width={`${field.width}%`}
                    height={`${field.height}%`}
                    border="2px"
                    borderColor={field.status === 'signed' ? 'green.500' : 'orange.500'}
                    borderStyle={field.status === 'signed' ? 'solid' : 'dashed'}
                    borderRadius="md"
                    bg={field.status === 'signed' ? 'green.50' : 'orange.50'}
                    cursor={field.status === 'pending' ? 'pointer' : 'default'}
                    onClick={() => field.status === 'pending' && handleSignatureStart(field)}
                    _hover={field.status === 'pending' ? { bg: 'orange.100' } : {}}
                    transition="all 0.2s"
                  >
                    <VStack
                      height="100%"
                      justify="center"
                      align="center"
                      gap="1"
                      p="2"
                    >
                      {field.status === 'signed' ? (
                        <>
                          <Icon as={FiCheckCircle} color="green.500" boxSize="4" />
                          <Text fontSize="xs" color="green.600" textAlign="center">
                            Signed by {field.signerName}
                          </Text>
                          <Text fontSize="xs" color="green.500">
                            {new Date(field.signedAt!).toLocaleDateString()}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Icon as={FiEdit3} color="orange.500" boxSize="4" />
                          <Text fontSize="xs" color="orange.600" textAlign="center">
                            Click to sign
                          </Text>
                          <Text fontSize="xs" color="orange.500">
                            {field.signerName}
                          </Text>
                        </>
                      )}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          </VStack>
        </Box>

        {/* Sidebar */}
        <Box width="350px" bg="white" borderLeft="1px" borderColor="gray.200" p="6">
          <VStack gap="6" align="stretch">
            {/* Signing Instructions */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="gray.800" mb="3">
                Signing Instructions
              </Text>
              <VStack gap="3" align="stretch">
                <HStack gap="3">
                  <Icon as={FiInfo} color="blue.500" boxSize="4" />
                  <Text fontSize="sm" color="gray.600">
                    Review the document carefully before signing
                  </Text>
                </HStack>
                <HStack gap="3">
                  <Icon as={FiShield} color="green.500" boxSize="4" />
                  <Text fontSize="sm" color="gray.600">
                    Your signature is legally binding
                  </Text>
                </HStack>
                <HStack gap="3">
                  <Icon as={FiLock} color="orange.500" boxSize="4" />
                  <Text fontSize="sm" color="gray.600">
                    All actions are recorded for audit purposes
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Signature Fields Status */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="gray.800" mb="3">
                Signature Fields
              </Text>
              <VStack gap="2" align="stretch">
                {document.signatureFields.map((field) => (
                  <HStack
                    key={field.id}
                    p="3"
                    bg={field.pageNumber === currentPage ? 'orange.50' : 'gray.50'}
                    borderRadius="md"
                    border={field.pageNumber === currentPage ? '1px' : 'none'}
                    borderColor={field.pageNumber === currentPage ? 'orange.200' : 'transparent'}
                  >
                    <Icon as={getStatusIcon(field.status)} color={`${getStatusColor(field.status)}.500`} boxSize="4" />
                    <VStack align="start" gap="0" flex="1">
                      <Text fontSize="sm" fontWeight="medium" color="gray.800">
                        Page {field.pageNumber}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {field.signerName}
                      </Text>
                    </VStack>
                    <Badge colorScheme={getStatusColor(field.status)} size="sm">
                      {field.status}
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Action Buttons */}
            <VStack gap="3" align="stretch">
              <Button
                colorScheme="orange"
                size="lg"
                onClick={() => {
                  const pendingField = document.signatureFields.find(f => f.status === 'pending');
                  if (pendingField) {
                    handleSignatureStart(pendingField);
                  }
                }}
                disabled={document.signatureFields.every(f => f.status !== 'pending')}
              >
                <Icon as={FiEdit3} mr="2" />
                Sign Document
              </Button>
              
              <Button
                variant="outline"
                colorScheme="red"
                onClick={onDeclineOpen}
              >
                <Icon as={FiX} mr="2" />
                Decline to Sign
              </Button>
            </VStack>

            {/* Audit Trail */}
            {session && (
              <Box>
                <Text fontSize="lg" fontWeight="semibold" color="gray.800" mb="3">
                  Audit Trail
                </Text>
                <VStack gap="2" align="stretch" maxH="200px" overflowY="auto">
                  {session.auditTrail.map((entry, index) => (
                    <HStack key={index} gap="2" align="start">
                      <Icon as={FiClock} color="gray.400" boxSize="3" mt="1" />
                      <VStack align="start" gap="0" flex="1">
                        <Text fontSize="xs" fontWeight="medium" color="gray.700">
                          {entry.action.replace('_', ' ').toUpperCase()}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>
      </Flex>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
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
          onClick={() => setShowSignaturePad(false)}
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
                <Text fontWeight="bold" fontSize="lg">
                  Sign Document - {selectedField?.signerName}
                </Text>
                <Button variant="ghost" size="sm" onClick={() => setShowSignaturePad(false)}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
            <VStack gap="4" align="stretch">
              <Box bg="blue.50" border="1px" borderColor="blue.200" borderRadius="md" p="3">
                <HStack gap="2">
                  <Icon as={FiInfo} color="blue.600" boxSize="5" />
                  <Text fontSize="sm" color="blue.700">
                    Please sign in the box below. Your signature will be legally binding.
                  </Text>
                </HStack>
              </Box>
              
              {/* Signature Canvas */}
              <Box
                border="2px"
                borderColor="gray.300"
                borderRadius="md"
                bg="white"
                minH="200px"
                position="relative"
              >
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  style={{
                    width: '100%',
                    height: '200px',
                    cursor: 'crosshair',
                    borderRadius: '6px'
                  }}
                />
                
                {!signatureData && (
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    color="gray.400"
                    pointerEvents="none"
                  >
                    <Text fontSize="sm">Sign here</Text>
                  </Box>
                )}
              </Box>
              
              <HStack justify="space-between">
                <Button variant="outline" onClick={clearSignature}>
                  <Icon as={FiRefreshCw} mr="2" />
                  Clear
                </Button>
                
                <HStack>
                  <Button variant="outline" onClick={() => setShowSignaturePad(false)}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="orange"
                    onClick={handleSignatureComplete}
                    loading={isSigning}
                    disabled={!signatureData}
                  >
                    <Icon as={FiCheck} mr="2" />
                    Sign & Complete
                  </Button>
                </HStack>
              </HStack>
            </VStack>
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack justify="flex-end" gap="3">
                <Button variant="outline" onClick={() => setShowSignaturePad(false)}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSignatureComplete}>
                  Sign Document
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}

      {/* Decline Modal */}
      {isDeclineOpen && (
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
          onClick={onDeclineClose}
        >
          <Box
            bg="white"
            borderRadius="md"
            maxW="md"
            w="90%"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p="4" borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">Decline to Sign</Text>
                <Button variant="ghost" size="sm" onClick={onDeclineClose}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
            <VStack gap="4" align="stretch">
              <Box bg="orange.50" border="1px" borderColor="orange.200" borderRadius="md" p="3">
                <HStack gap="2" align="start">
                  <Icon as={FiAlertTriangle} color="orange.600" boxSize="5" />
                  <VStack align="start" gap="1" flex="1">
                    <Text fontWeight="semibold" fontSize="sm" color="orange.700">Are you sure?</Text>
                    <Text fontSize="sm" color="orange.600">
                      Declining to sign this document will cancel the signing process. 
                      This action cannot be undone.
                    </Text>
                  </VStack>
                </HStack>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" mb="2">Reason for declining (required)</Text>
                <Textarea
                  placeholder="Please provide a reason for declining to sign..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={4}
                />
              </Box>
            </VStack>
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack justify="flex-end" gap="3">
                <Button variant="outline" onClick={onDeclineClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDecline}
                  disabled={!declineReason.trim()}
                >
                  Decline to Sign
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
