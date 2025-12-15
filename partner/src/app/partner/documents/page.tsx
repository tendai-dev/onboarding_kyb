'use client';

import { Container, VStack, HStack, Flex, Box, Avatar, Circle } from '@chakra-ui/react';
import { Button, Typography, Tag, MukuruLogo } from '@/lib/mukuruImports';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PartnerHeader } from '@/components/PartnerHeader';
import { useState } from 'react';
import { getCustomerApplication } from '../../../lib/mockData';

const MotionBox = motion.create(Box);

export default function CustomerDocumentsPage() {
  const [selectedCategory] = useState('all');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Mock partner email - in real app this would come from auth
  const partnerEmail = 'john.smith@techcorp.com';
  const application = getCustomerApplication(partnerEmail);

  // Unused helper function - kept for potential future use
  // const getDocumentStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'verified':
  //       return 'green';
  //     case 'rejected':
  //       return 'red';
  //     case 'uploaded':
  //       return 'blue';
  //     case 'pending':
  //       return 'orange';
  //     default:
  //       return 'gray';
  //   }
  // };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return '✓';
      case 'rejected':
        return '✗';
      case 'uploaded':
        return '📄';
      case 'pending':
        return '⏳';
      default:
        return '📄';
    }
  };

  const categories = [
    { value: 'all', label: 'All Documents' },
    { value: 'registration', label: 'Registration' },
    { value: 'identity', label: 'Identity' },
    { value: 'governance', label: 'Governance' },
    { value: 'ownership', label: 'Ownership' },
    { value: 'address', label: 'Address' },
    { value: 'authorization', label: 'Authorization' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'licensing', label: 'Licensing' },
    { value: 'financial', label: 'Financial' },
  ];

  const requiredDocuments = [
    { name: 'Certificate of Incorporation', category: 'registration', required: true },
    { name: 'Memorandum of Incorporation', category: 'ownership', required: true },
    { name: 'Director ID Copies', category: 'identity', required: true },
    { name: 'Proof of Registered Address', category: 'address', required: true },
    { name: 'Proof of Operating Address', category: 'address', required: false },
    { name: 'Board Resolution', category: 'authorization', required: true },
    { name: 'Banking Details', category: 'financial', required: true },
    { name: 'Tax Clearance Certificate', category: 'compliance', required: false },
  ];

  const filteredDocuments =
    selectedCategory === 'all'
      ? application?.documents || []
      : application?.documents.filter((doc) => doc.category === selectedCategory) || [];

  const handleFileUpload = (docName: string) => {
    setUploadingDoc(docName);
    // Simulate upload
    setTimeout(() => {
      setUploadingDoc(null);
      // In real app, this would update the document status
    }, 2000);
  };

  if (!application) {
    return (
      <Box
        minH="100vh"
        bg="mukuru.background.light"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography>No application found</Typography>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="mukuru.background.light">
      <PartnerHeader />

      <Container maxW="7xl" py="8">
        <VStack gap="8" align="stretch">
          {/* Page Header */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <VStack align="start" gap="4">
              <Typography fontSize="3xl" fontWeight="bold">
                Document Management
              </Typography>
              <Typography color="gray.600">
                Upload and manage your application documents. All required documents must
                be submitted for approval.
              </Typography>

              {/* Progress Summary */}
              <Box bg="white" p="6" borderRadius="xl" boxShadow="sm" width="100%">
                <HStack justify="space-between">
                  <VStack align="start" gap="1">
                    <Typography fontSize="lg" fontWeight="semibold">
                      Upload Progress
                    </Typography>
                    <Typography fontSize="sm" color="gray.600">
                      {application.documents.length} of{' '}
                      {requiredDocuments.filter((d) => d.required).length} required
                      documents uploaded
                    </Typography>
                  </VStack>
                  <VStack align="end" gap="1">
                    <Typography
                      fontSize="2xl"
                      fontWeight="bold"
                      color="mukuru.buttons.primary"
                    >
                      {Math.round(
                        (application.documents.length /
                          requiredDocuments.filter((d) => d.required).length) *
                          100
                      )}
                      %
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.grey.medium">
                      Complete
                    </Typography>
                  </VStack>
                </HStack>
              </Box>
            </VStack>
          </MotionBox>

          {/* Filter and Upload Section */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Box bg="white" p="6" borderRadius="xl" boxShadow="sm">
              <HStack justify="space-between" mb="6">
                <HStack gap="4">
                  <Typography fontWeight="semibold">Filter by Category:</Typography>
                  <Button variant="ghost" width="200px" justifyContent="space-between">
                    {categories.find((cat) => cat.value === selectedCategory)?.label ||
                      'All Categories'}
                    <Typography>▼</Typography>
                  </Button>
                </HStack>
                <Button variant="primary">
                  <Typography fontSize="lg" mr="2">
                    +
                  </Typography>
                  Upload Document
                </Button>
              </HStack>
            </Box>
          </MotionBox>

          {/* Required Documents Checklist */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Box bg="white" borderRadius="xl" boxShadow="sm" overflow="hidden">
              <Box p="6" borderBottom="1px" borderColor="gray.100">
                <Typography fontSize="xl" fontWeight="semibold">
                  Required Documents
                </Typography>
                <Typography fontSize="sm" color="gray.600" mt="1">
                  Complete this checklist to ensure your application is processed quickly
                </Typography>
              </Box>

              <VStack gap="0" align="stretch">
                {requiredDocuments.map((reqDoc, index) => {
                  const uploadedDoc = application.documents.find((doc) =>
                    doc.name
                      .toLowerCase()
                      .includes(reqDoc.name.toLowerCase().split(' ')[0])
                  );

                  return (
                    <Box
                      key={index}
                      p="4"
                      borderBottom={index < requiredDocuments.length - 1 ? '1px' : 'none'}
                      borderColor="gray.100"
                      bg={
                        uploadedDoc
                          ? uploadedDoc.status === 'verified'
                            ? 'green.50'
                            : 'blue.50'
                          : 'white'
                      }
                    >
                      <Flex justify="space-between" align="center">
                        <HStack gap="4">
                          <Circle
                            size="40px"
                            bg={
                              uploadedDoc
                                ? uploadedDoc.status === 'verified'
                                  ? 'green.100'
                                  : 'blue.100'
                                : 'gray.100'
                            }
                            color={
                              uploadedDoc
                                ? uploadedDoc.status === 'verified'
                                  ? 'green.600'
                                  : 'blue.600'
                                : 'gray.500'
                            }
                          >
                            <Typography fontSize="lg">
                              {uploadedDoc ? getStatusIcon(uploadedDoc.status) : '📄'}
                            </Typography>
                          </Circle>

                          <VStack align="start" gap="1">
                            <HStack gap="2">
                              <Typography fontWeight="semibold">{reqDoc.name}</Typography>
                              {reqDoc.required && (
                                <Tag variant="solid" size="md">
                                  Required
                                </Tag>
                              )}
                            </HStack>
                            <Typography
                              fontSize="sm"
                              color="mukuru.text.primary"
                              textTransform="capitalize"
                            >
                              {reqDoc.category} Document
                            </Typography>
                            {uploadedDoc && (
                              <Typography fontSize="xs" color="mukuru.grey.medium">
                                Uploaded:{' '}
                                {new Date(uploadedDoc.uploadDate!).toLocaleDateString()}
                              </Typography>
                            )}
                          </VStack>
                        </HStack>

                        <VStack align="end" gap="2">
                          {uploadedDoc ? (
                            <>
                              <Tag variant="solid" size="md">
                                {uploadedDoc.status.toUpperCase()}
                              </Tag>
                              <HStack gap="2">
                                <Button size="sm" variant="ghost">
                                  View
                                </Button>
                                <Button size="sm" variant="ghost">
                                  Replace
                                </Button>
                              </HStack>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="primary"
                              loading={uploadingDoc === reqDoc.name}
                              onClick={() => handleFileUpload(reqDoc.name)}
                            >
                              Upload
                            </Button>
                          )}
                        </VStack>
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          </MotionBox>

          {/* Uploaded Documents */}
          {filteredDocuments.length > 0 && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Box bg="white" borderRadius="xl" boxShadow="sm" overflow="hidden">
                <Box p="6" borderBottom="1px" borderColor="gray.100">
                  <Typography fontSize="xl" fontWeight="semibold">
                    {selectedCategory === 'all'
                      ? 'All Uploaded Documents'
                      : `${categories.find((c) => c.value === selectedCategory)?.label} Documents`}
                  </Typography>
                </Box>

                <VStack gap="0" align="stretch">
                  {filteredDocuments.map((doc, index) => (
                    <Box
                      key={doc.id}
                      p="4"
                      borderBottom={index < filteredDocuments.length - 1 ? '1px' : 'none'}
                      borderColor="gray.100"
                    >
                      <Flex justify="space-between" align="center">
                        <HStack gap="4">
                          <Circle size="40px" bg="mukuru.teal" color="mukuru.teal">
                            <Typography fontSize="lg">
                              {getStatusIcon(doc.status)}
                            </Typography>
                          </Circle>

                          <VStack align="start" gap="1">
                            <Typography fontWeight="semibold">{doc.name}</Typography>
                            <Typography
                              fontSize="sm"
                              color="mukuru.text.primary"
                              textTransform="capitalize"
                            >
                              {doc.category} • {doc.type}
                            </Typography>
                            <Typography fontSize="xs" color="gray.500">
                              {doc.fileSize} • Uploaded:{' '}
                              {new Date(doc.uploadDate!).toLocaleDateString()}
                            </Typography>
                          </VStack>
                        </HStack>

                        <VStack align="end" gap="2">
                          <Tag variant="solid" size="md">
                            {doc.status.toUpperCase()}
                          </Tag>
                          <HStack gap="2">
                            <Button size="sm" variant="ghost">
                              Download
                            </Button>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                            <Button size="sm" variant="ghost">
                              Delete
                            </Button>
                          </HStack>
                        </VStack>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </Box>
            </MotionBox>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
