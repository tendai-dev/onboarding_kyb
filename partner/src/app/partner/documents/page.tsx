"use client";

import { 
  Select, 
  Container, 
  VStack, 
  HStack,
  Text,
  SimpleGrid,
  Flex,
  Badge,
  Button,
  Image,
  Circle,
  Input,
  Box,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { getCustomerApplication } from "../../../lib/mockData";

const MotionBox = motion.create(Box);

export default function CustomerDocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  
  // Mock partner email - in real app this would come from auth
  const partnerEmail = "john.smith@techcorp.com";
  const application = getCustomerApplication(partnerEmail);

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'green';
      case 'rejected': return 'red';
      case 'uploaded': return 'blue';
      case 'pending': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return '✓';
      case 'rejected': return '✗';
      case 'uploaded': return '📄';
      case 'pending': return '⏳';
      default: return '📄';
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
    { value: 'financial', label: 'Financial' }
  ];

  const requiredDocuments = [
    { name: 'Certificate of Incorporation', category: 'registration', required: true },
    { name: 'Memorandum of Incorporation', category: 'ownership', required: true },
    { name: 'Director ID Copies', category: 'identity', required: true },
    { name: 'Proof of Registered Address', category: 'address', required: true },
    { name: 'Proof of Operating Address', category: 'address', required: false },
    { name: 'Board Resolution', category: 'authorization', required: true },
    { name: 'Banking Details', category: 'financial', required: true },
    { name: 'Tax Clearance Certificate', category: 'compliance', required: false }
  ];

  const filteredDocuments = selectedCategory === 'all' 
    ? application?.documents || []
    : application?.documents.filter(doc => doc.category === selectedCategory) || [];

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
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <Text>No application found</Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py="4">
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <HStack gap="4">
              <Link href="/partner/dashboard">
                <Button variant="ghost" size="sm">← Back</Button>
              </Link>
              <Image src="/mukuru-logo.png" alt="Mukuru" height="32px" />
              <Text color="gray.600" fontSize="sm">Documents</Text>
            </HStack>
            <HStack gap="4">
              <Circle size="32px" bg="orange.500" color="white">
                <Text fontSize="sm" fontWeight="bold">JD</Text>
              </Circle>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" py="8">
        <VStack gap="8" align="stretch">
          {/* Page Header */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <VStack align="start" gap="4">
              <Text fontSize="3xl" fontWeight="bold">Document Management</Text>
              <Text color="gray.600">
                Upload and manage your application documents. All required documents must be submitted for approval.
              </Text>
              
              {/* Progress Summary */}
              <Box bg="white" p="6" borderRadius="xl" boxShadow="sm" width="100%">
                <HStack justify="space-between">
                  <VStack align="start" gap="1">
                    <Text fontSize="lg" fontWeight="semibold">Upload Progress</Text>
                    <Text fontSize="sm" color="gray.600">
                      {application.documents.length} of {requiredDocuments.filter(d => d.required).length} required documents uploaded
                    </Text>
                  </VStack>
                  <VStack align="end" gap="1">
                    <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                      {Math.round((application.documents.length / requiredDocuments.filter(d => d.required).length) * 100)}%
                    </Text>
                    <Text fontSize="sm" color="gray.500">Complete</Text>
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
                  <Text fontWeight="semibold">Filter by Category:</Text>
                  <Button variant="outline" width="200px" justifyContent="space-between">
                    {categories.find(cat => cat.value === selectedCategory)?.label || "All Categories"}
                    <Text>▼</Text>
                  </Button>
                </HStack>
                <Button colorScheme="orange">
                  <Text fontSize="lg" mr="2">+</Text>
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
                <Text fontSize="xl" fontWeight="semibold">Required Documents</Text>
                <Text fontSize="sm" color="gray.600" mt="1">
                  Complete this checklist to ensure your application is processed quickly
                </Text>
              </Box>
              
              <VStack gap="0" align="stretch">
                {requiredDocuments.map((reqDoc, index) => {
                  const uploadedDoc = application.documents.find(doc => 
                    doc.name.toLowerCase().includes(reqDoc.name.toLowerCase().split(' ')[0])
                  );
                  
                  return (
                    <Box 
                      key={index}
                      p="4" 
                      borderBottom={index < requiredDocuments.length - 1 ? "1px" : "none"} 
                      borderColor="gray.100"
                      bg={uploadedDoc ? (uploadedDoc.status === 'verified' ? 'green.50' : 'blue.50') : 'white'}
                    >
                      <Flex justify="space-between" align="center">
                        <HStack gap="4">
                          <Circle 
                            size="40px" 
                            bg={uploadedDoc ? 
                              (uploadedDoc.status === 'verified' ? 'green.100' : 'blue.100') : 
                              'gray.100'
                            }
                            color={uploadedDoc ? 
                              (uploadedDoc.status === 'verified' ? 'green.600' : 'blue.600') : 
                              'gray.500'
                            }
                          >
                            <Text fontSize="lg">
                              {uploadedDoc ? getStatusIcon(uploadedDoc.status) : '📄'}
                            </Text>
                          </Circle>
                          
                          <VStack align="start" gap="1">
                            <HStack gap="2">
                              <Text fontWeight="semibold">{reqDoc.name}</Text>
                              {reqDoc.required && (
                                <Badge colorScheme="red" size="sm">Required</Badge>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                              {reqDoc.category} Document
                            </Text>
                            {uploadedDoc && (
                              <Text fontSize="xs" color="gray.500">
                                Uploaded: {new Date(uploadedDoc.uploadDate!).toLocaleDateString()}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        
                        <VStack align="end" gap="2">
                          {uploadedDoc ? (
                            <>
                              <Badge colorScheme={getDocumentStatusColor(uploadedDoc.status)}>
                                {uploadedDoc.status.toUpperCase()}
                              </Badge>
                              <HStack gap="2">
                                <Button size="xs" variant="outline">View</Button>
                                <Button size="xs" variant="outline">Replace</Button>
                              </HStack>
                            </>
                          ) : (
                            <Button 
                              size="sm" 
                              colorScheme="orange"
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
                  <Text fontSize="xl" fontWeight="semibold">
                    {selectedCategory === 'all' ? 'All Uploaded Documents' : `${categories.find(c => c.value === selectedCategory)?.label} Documents`}
                  </Text>
                </Box>
                
                <VStack gap="0" align="stretch">
                  {filteredDocuments.map((doc, index) => (
                    <Box 
                      key={doc.id}
                      p="4" 
                      borderBottom={index < filteredDocuments.length - 1 ? "1px" : "none"} 
                      borderColor="gray.100"
                    >
                      <Flex justify="space-between" align="center">
                        <HStack gap="4">
                          <Circle size="40px" bg="blue.100" color="blue.600">
                            <Text fontSize="lg">{getStatusIcon(doc.status)}</Text>
                          </Circle>
                          
                          <VStack align="start" gap="1">
                            <Text fontWeight="semibold">{doc.name}</Text>
                            <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                              {doc.category} • {doc.type}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {doc.fileSize} • Uploaded: {new Date(doc.uploadDate!).toLocaleDateString()}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <VStack align="end" gap="2">
                          <Badge colorScheme={getDocumentStatusColor(doc.status)}>
                            {doc.status.toUpperCase()}
                          </Badge>
                          <HStack gap="2">
                            <Button size="xs" variant="outline">Download</Button>
                            <Button size="xs" variant="outline">View</Button>
                            <Button size="xs" variant="outline" colorScheme="red">Delete</Button>
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
