"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  SimpleGrid,
  Badge,
  Flex
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@chakra-ui/react";
import { documentValidation } from '../../../utils/validation';

const MotionBox = motion.create(Box);

const entityTypes = [
  { value: 'pty_ltd', label: 'Private Company / Limited Liability Company' },
  { value: 'publicly_listed', label: 'Publicly Listed Entity' },
  { value: 'government', label: 'Government / State Owned Entity' },
  { value: 'npo_ngo', label: 'Non-Profit Organisation (NPO/NGO/PVO)' },
  { value: 'association', label: 'Non-registered Association / Society / Charity' },
  { value: 'trust', label: 'Trust' },
  { value: 'supranational', label: 'Supranational / Inter Governmental' },
  { value: 'sole_proprietor', label: 'Sole Proprietor' }
];

export default function DocumentRequirements() {
  const [selectedEntityType, setSelectedEntityType] = useState('pty_ltd');
  const [isEPP, setIsEPP] = useState(false);

  const requiredDocuments = documentValidation.getRequiredDocuments(selectedEntityType, isEPP);
  const financialInstitutionDocs = documentValidation.getFinancialInstitutionDocuments();

  const getCategoryColor = (category: string) => {
    const colors = {
      registration: 'blue',
      identity: 'green',
      governance: 'purple',
      ownership: 'orange',
      address: 'teal',
      authorization: 'red',
      compliance: 'yellow',
      licensing: 'pink',
      financial: 'cyan'
    };
    return colors[category as keyof typeof colors] || 'gray';
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" px="8" py="6">
        <Container maxW="8xl">
          <VStack align="start" gap="2">
            <Text as="h1" fontSize="2xl" fontWeight="bold" color="gray.800">
              Document Requirements (Annexure A)
            </Text>
            <Text color="gray.600">
              Supporting documents required for each legal entity type
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="8xl" py="8">
        <VStack gap="8" align="stretch">
          {/* Entity Type Selector */}
          <MotionBox
            bg="white"
            borderRadius="xl"
            boxShadow="lg"
            border="1px"
            borderColor="gray.200"
            p="6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <VStack gap="6" align="stretch">
              <Text as="h2" fontSize="xl" fontWeight="semibold">
                Select Entity Type
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
                {entityTypes.map((type) => (
                  <Box
                    key={type.value}
                    p="4"
                    borderRadius="lg"
                    border="2px"
                    borderColor={selectedEntityType === type.value ? "blue.400" : "gray.200"}
                    bg={selectedEntityType === type.value ? "blue.50" : "white"}
                    cursor="pointer"
                    onClick={() => setSelectedEntityType(type.value)}
                    _hover={{ borderColor: "blue.300" }}
                  >
                    <Text fontWeight="medium" fontSize="sm">
                      {type.label}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>

              <HStack gap="4">
                <Box>
                  <label>
                    <input
                      type="checkbox"
                      checked={isEPP}
                      onChange={(e) => setIsEPP(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    <Text as="span" fontSize="sm">
                      Enterprise Payment Partner (EPP) - Additional authorization documents required
                    </Text>
                  </label>
                </Box>
              </HStack>
            </VStack>
          </MotionBox>

          {/* Required Documents */}
          <MotionBox
            bg="white"
            borderRadius="xl"
            boxShadow="lg"
            border="1px"
            borderColor="gray.200"
            p="6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <VStack gap="6" align="stretch">
              <HStack justify="space-between">
                <Text as="h2" fontSize="xl" fontWeight="semibold">
                  Required Documents
                </Text>
                <Badge colorScheme="blue" variant="subtle" px="3" py="1">
                  {requiredDocuments.filter(doc => doc.required).length} Required Documents
                </Badge>
              </HStack>

              <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
                {requiredDocuments.map((doc, index) => (
                  <MotionBox
                    key={doc.id}
                    p="5"
                    borderRadius="lg"
                    border="1px"
                    borderColor="gray.200"
                    bg="gray.50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <VStack align="start" gap="3">
                      <HStack justify="space-between" width="100%">
                        <Badge
                          colorScheme={getCategoryColor(doc.category)}
                          variant="subtle"
                          textTransform="capitalize"
                        >
                          {doc.category}
                        </Badge>
                        {doc.required && (
                          <Badge colorScheme="red" variant="solid" size="sm">
                            Required
                          </Badge>
                        )}
                      </HStack>
                      
                      <Text as="h3" fontSize="md" fontWeight="semibold" color="gray.800">
                        {doc.name}
                      </Text>
                      
                      <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                        {doc.description}
                      </Text>
                      
                      <HStack gap="2" flexWrap="wrap">
                        <Text fontSize="xs" color="gray.500">Accepted formats:</Text>
                        {doc.acceptedFormats.map((format) => (
                          <Badge key={format} variant="outline" size="sm" colorScheme="gray">
                            {format}
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  </MotionBox>
                ))}
              </SimpleGrid>
            </VStack>
          </MotionBox>

          {/* Financial Institution Additional Documents */}
          <MotionBox
            bg="orange.50"
            borderRadius="xl"
            boxShadow="lg"
            border="1px"
            borderColor="orange.200"
            p="6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <VStack gap="6" align="stretch">
              <HStack justify="space-between">
                <VStack align="start" gap="1">
                  <Text as="h2" fontSize="xl" fontWeight="semibold">
                    Additional Documents for Financial Institutions
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Required for banks, insurance companies, and other regulated financial entities
                  </Text>
                </VStack>
                <Badge colorScheme="orange" variant="solid" px="3" py="1">
                  {financialInstitutionDocs.length} Additional Documents
                </Badge>
              </HStack>

              <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
                {financialInstitutionDocs.map((doc, index) => (
                  <MotionBox
                    key={doc.id}
                    p="5"
                    borderRadius="lg"
                    border="1px"
                    borderColor="orange.200"
                    bg="white"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <VStack align="start" gap="3">
                      <HStack justify="space-between" width="100%">
                        <Badge
                          colorScheme={getCategoryColor(doc.category)}
                          variant="subtle"
                          textTransform="capitalize"
                        >
                          {doc.category}
                        </Badge>
                        <Badge colorScheme="red" variant="solid" size="sm">
                          Required
                        </Badge>
                      </HStack>
                      
                      <Text as="h3" fontSize="md" fontWeight="semibold" color="gray.800">
                        {doc.name}
                      </Text>
                      
                      <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                        {doc.description}
                      </Text>
                      
                      <HStack gap="2" flexWrap="wrap">
                        <Text fontSize="xs" color="gray.500">Accepted formats:</Text>
                        {doc.acceptedFormats.map((format) => (
                          <Badge key={format} variant="outline" size="sm" colorScheme="gray">
                            {format}
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  </MotionBox>
                ))}
              </SimpleGrid>
            </VStack>
          </MotionBox>

          {/* Important Notes */}
          <MotionBox
            bg="blue.50"
            borderRadius="xl"
            border="1px"
            borderColor="blue.200"
            p="6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <VStack gap="4" align="start">
              <Text as="h3" fontSize="lg" fontWeight="semibold" color="blue.800">
                Important Notes
              </Text>
              
              <VStack gap="3" align="start">
                <HStack align="start">
                  <Text color="blue.600" fontWeight="bold">•</Text>
                  <Text fontSize="sm" color="blue.700">
                    All address proof documents must be not older than 3 months from the date of application
                  </Text>
                </HStack>
                
                <HStack align="start">
                  <Text color="blue.600" fontWeight="bold">•</Text>
                  <Text fontSize="sm" color="blue.700">
                    ID/Passport copies must be clear and include photographs
                  </Text>
                </HStack>
                
                <HStack align="start">
                  <Text color="blue.600" fontWeight="bold">•</Text>
                  <Text fontSize="sm" color="blue.700">
                    All mandates and resolutions must be signed by authorized persons
                  </Text>
                </HStack>
                
                <HStack align="start">
                  <Text color="blue.600" fontWeight="bold">•</Text>
                  <Text fontSize="sm" color="blue.700">
                    Beneficial ownership information is required for individuals with ≥25% shareholding or control
                  </Text>
                </HStack>
                
                <HStack align="start">
                  <Text color="blue.600" fontWeight="bold">•</Text>
                  <Text fontSize="sm" color="blue.700">
                    Additional verification may be requested by Mukuru during the review process
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </MotionBox>

          {/* Action Buttons */}
          <Flex justify="center" gap="4">
            <Button variant="outline" size="lg">
              Download Checklist
            </Button>
            <Button variant="solid" size="lg">
              Start Application
            </Button>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}
