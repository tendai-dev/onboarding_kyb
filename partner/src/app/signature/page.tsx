'use client';

import {
  Box,
  Container,
  VStack,
  HStack,
  Card,
  SimpleGrid,
  Alert,
} from '@chakra-ui/react';
import { Button, Typography, Tag, Checkbox } from '@/lib/mukuruImports';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
const MotionCard = motion.div;

const documentsToSign = [
  {
    id: 'service_agreement',
    title: 'Mukuru Service Agreement',
    description: 'Terms and conditions for using Mukuru services',
    pages: 12,
    status: 'pending',
    required: true,
  },
  {
    id: 'privacy_policy',
    title: 'Data Privacy and Protection Agreement',
    description: 'Data handling and privacy compliance terms',
    pages: 8,
    status: 'pending',
    required: true,
  },
  {
    id: 'aml_compliance',
    title: 'AML Compliance Declaration',
    description: 'Anti-money laundering compliance agreement',
    pages: 6,
    status: 'pending',
    required: true,
  },
  {
    id: 'risk_disclosure',
    title: 'Risk Disclosure Statement',
    description: 'Understanding of financial risks and responsibilities',
    pages: 4,
    status: 'pending',
    required: false,
  },
];

export default function DigitalSignaturePage() {
  const [selectedDocument, setSelectedDocument] = useState('service_agreement');
  const [signatureData, setSignatureData] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [agreements, setAgreements] = useState<{ [key: string]: boolean }>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocument(docId);
  };

  const handleAgreementChange = (docId: string, checked: boolean) => {
    setAgreements((prev) => ({
      ...prev,
      [docId]: checked,
    }));
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL();
      setSignatureData(dataURL);
      console.info('Signature saved:', dataURL);
    }
  };

  const selectedDoc = documentsToSign.find((doc) => doc.id === selectedDocument);
  const allRequiredAgreed = documentsToSign
    .filter((doc) => doc.required)
    .every((doc) => agreements[doc.id]);

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" px="8" py="6">
        <Container maxW="8xl">
          <VStack align="start" gap="2">
            <Typography as="h1" fontSize="2xl" fontWeight="bold" color="gray.800">
              Digital Signature
            </Typography>
            <Typography color="gray.600">
              Review and sign your onboarding documents
            </Typography>
          </VStack>
        </Container>
      </Box>

      <Container maxW="8xl" py="8">
        <SimpleGrid columns={{ base: 1, lg: 4 }} gap="8">
          {/* Documents List */}
          <Box>
            <MotionCard
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card.Root
                bg="white"
                borderRadius="xl"
                boxShadow="lg"
                border="1px"
                borderColor="gray.200"
              >
                <Card.Header>
                  <Typography as="h3" fontSize="lg" fontWeight="semibold">
                    Documents to Sign
                  </Typography>
                </Card.Header>
                <Card.Body pt="0">
                  <VStack gap="3">
                    {documentsToSign.map((doc) => (
                      <Card.Root
                        key={doc.id}
                        variant="outline"
                        width="100%"
                        cursor="pointer"
                        bg={selectedDocument === doc.id ? 'blue.50' : 'white'}
                        borderColor={
                          selectedDocument === doc.id ? 'blue.200' : 'gray.200'
                        }
                        onClick={() => handleDocumentSelect(doc.id as string)}
                        _hover={{ borderColor: 'blue.300' }}
                      >
                        <Card.Body p="4">
                          <VStack align="start" gap="2">
                            <HStack justify="space-between" width="100%">
                              <Typography fontSize="sm" fontWeight="medium" lineClamp={1}>
                                {doc.title}
                              </Typography>
                              {doc.required && (
                                <Tag variant="solid" size="md">
                                  Required
                                </Tag>
                              )}
                            </HStack>
                            <Typography fontSize="xs" color="gray.600" lineClamp={2}>
                              {doc.description}
                            </Typography>
                            <HStack justify="space-between" width="100%">
                              <Typography fontSize="xs" color="gray.500">
                                {doc.pages} pages
                              </Typography>
                              <Tag variant="solid" size="md">
                                {agreements[doc.id] ? 'Agreed' : doc.status}
                              </Tag>
                            </HStack>
                          </VStack>
                        </Card.Body>
                      </Card.Root>
                    ))}
                  </VStack>
                </Card.Body>
              </Card.Root>
            </MotionCard>
          </Box>

          {/* Document Viewer */}
          <Box gridColumn={{ base: '1', lg: '2 / 4' }}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card.Root
                bg="white"
                borderRadius="xl"
                boxShadow="lg"
                border="1px"
                borderColor="gray.200"
                height="800px"
              >
                <Card.Header>
                  <HStack justify="space-between">
                    <VStack align="start" gap="1">
                      <Typography as="h3" fontSize="lg" fontWeight="semibold">
                        {selectedDoc?.title}
                      </Typography>
                      <Typography fontSize="sm" color="gray.600">
                        {selectedDoc?.description}
                      </Typography>
                    </VStack>
                    <HStack gap="2">
                      <Button variant="ghost" size="sm">
                        Download PDF
                      </Button>
                      <Button variant="ghost" size="sm">
                        Print
                      </Button>
                    </HStack>
                  </HStack>
                </Card.Header>
                <Card.Body pt="0" height="calc(100% - 100px)" overflowY="auto">
                  {/* Mock Document Content */}
                  <Box p="6" bg="gray.50" borderRadius="lg" height="100%">
                    <VStack gap="6" align="start">
                      <Box>
                        <Typography as="h2" fontSize="xl" fontWeight="bold" mb="4">
                          {selectedDoc?.title}
                        </Typography>

                        <Typography fontSize="sm" lineHeight="1.8" color="gray.700">
                          This agreement (&quot;Agreement&quot;) is entered into between
                          Mukuru Financial Services and the Partner/Customer
                          (&quot;You&quot; or &quot;Your&quot;) for the provision of
                          financial services including but not limited to money transfer,
                          payment processing, and related services.
                        </Typography>
                      </Box>

                      <Box>
                        <Typography as="h3" fontSize="lg" fontWeight="semibold" mb="3">
                          1. Services Provided
                        </Typography>
                        <Typography fontSize="sm" lineHeight="1.8" color="gray.700">
                          Mukuru agrees to provide the following services subject to the
                          terms and conditions set forth in this Agreement:
                        </Typography>
                        <VStack align="start" gap="2" mt="3" ml="4">
                          <Typography fontSize="sm" color="gray.700">
                            • Money transfer services
                          </Typography>
                          <Typography fontSize="sm" color="gray.700">
                            • Payment processing
                          </Typography>
                          <Typography fontSize="sm" color="gray.700">
                            • Compliance and regulatory support
                          </Typography>
                          <Typography fontSize="sm" color="gray.700">
                            • Customer support services
                          </Typography>
                        </VStack>
                      </Box>

                      <Box>
                        <Typography as="h3" fontSize="lg" fontWeight="semibold" mb="3">
                          2. Compliance Requirements
                        </Typography>
                        <Typography fontSize="sm" lineHeight="1.8" color="gray.700">
                          You agree to comply with all applicable laws, regulations, and
                          industry standards including but not limited to anti-money
                          laundering (AML) requirements, know your partner (KYC)
                          procedures, and data protection regulations.
                        </Typography>
                      </Box>

                      <Box>
                        <Typography as="h3" fontSize="lg" fontWeight="semibold" mb="3">
                          3. Fees and Charges
                        </Typography>
                        <Typography fontSize="sm" lineHeight="1.8" color="gray.700">
                          Service fees will be as agreed in the separate fee schedule. All
                          fees are subject to change with 30 days written notice.
                        </Typography>
                      </Box>

                      <Alert.Root status="info" borderRadius="lg">
                        <Typography fontSize="sm">ℹ️</Typography>
                        <Box>
                          <Alert.Title fontSize="sm">Important Notice</Alert.Title>
                          <Alert.Description fontSize="sm">
                            Please read this document carefully before signing. By
                            signing, you agree to all terms and conditions.
                          </Alert.Description>
                        </Box>
                      </Alert.Root>
                    </VStack>
                  </Box>
                </Card.Body>
              </Card.Root>
            </MotionCard>
          </Box>

          {/* Signature Panel */}
          <Box>
            <VStack gap="6">
              {/* Agreement Checkboxes */}
              <MotionCard
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card.Root
                  bg="white"
                  borderRadius="xl"
                  boxShadow="lg"
                  border="1px"
                  borderColor="gray.200"
                  width="100%"
                >
                  <Card.Header>
                    <Typography as="h3" fontSize="lg" fontWeight="semibold">
                      Agreement Confirmation
                    </Typography>
                  </Card.Header>
                  <Card.Body pt="0">
                    <VStack gap="4" align="start">
                      {documentsToSign.map((doc) => (
                        <Checkbox
                          key={doc.id}
                          checked={agreements[doc.id] || false}
                          onCheckedChange={(details: { checked: string | boolean }) =>
                            handleAgreementChange(
                              doc.id,
                              details.checked === true || details.checked === 'true'
                            )
                          }
                        >
                          <VStack align="start" gap="1">
                            <Typography fontSize="sm" fontWeight="medium">
                              I agree to {doc.title}
                            </Typography>
                            {doc.required && (
                              <Tag variant="solid" size="md">
                                Required
                              </Tag>
                            )}
                          </VStack>
                        </Checkbox>
                      ))}
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </MotionCard>

              {/* Digital Signature */}
              <MotionCard
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card.Root
                  bg="white"
                  borderRadius="xl"
                  boxShadow="lg"
                  border="1px"
                  borderColor="gray.200"
                  width="100%"
                >
                  <Card.Header>
                    <Typography as="h3" fontSize="lg" fontWeight="semibold">
                      Digital Signature
                    </Typography>
                    <Typography fontSize="sm" color="gray.600" mt="1">
                      Draw your signature in the box below
                    </Typography>
                  </Card.Header>
                  <Card.Body pt="0">
                    <VStack gap="4">
                      <Box
                        border="2px dashed"
                        borderColor="gray.300"
                        borderRadius="lg"
                        p="4"
                        width="100%"
                        bg="gray.50"
                      >
                        <canvas
                          ref={canvasRef}
                          width={280}
                          height={120}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            cursor: 'crosshair',
                          }}
                          onMouseDown={(e) => startDrawing(e)}
                          onMouseMove={(e) => draw(e)}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                        />
                      </Box>

                      <HStack gap="2" width="100%">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSignature}
                          flex="1"
                        >
                          Clear
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={saveSignature}
                          flex="1"
                        >
                          Save
                        </Button>
                      </HStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </MotionCard>

              {/* Submit */}
              <MotionCard
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card.Root
                  bg="green.50"
                  borderRadius="xl"
                  border="1px"
                  borderColor="green.200"
                  width="100%"
                >
                  <Card.Body>
                    <VStack gap="4">
                      <Alert.Root
                        status={allRequiredAgreed ? 'success' : 'warning'}
                        borderRadius="lg"
                      >
                        <Typography fontSize="sm">ℹ️</Typography>
                        <Box>
                          <Alert.Title fontSize="sm">
                            {allRequiredAgreed ? 'Ready to Submit' : 'Action Required'}
                          </Alert.Title>
                          <Alert.Description fontSize="sm">
                            {allRequiredAgreed
                              ? 'All required documents have been agreed to.'
                              : 'Please agree to all required documents before submitting.'}
                          </Alert.Description>
                        </Box>
                      </Alert.Root>

                      <Button
                        variant="primary"
                        size="md"
                        width="100%"
                        disabled={!allRequiredAgreed || !signatureData}
                      >
                        Submit Signed Documents
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </MotionCard>
            </VStack>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
