"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Card,
  Flex,
  Progress,
  useSteps
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Button, Input } from "@chakra-ui/react";

const MotionBox = motion(Box);
const MotionCard = motion.div;

const steps = [
  { title: 'Company Info', description: 'Basic company details' },
  { title: 'Entity Details', description: 'Legal entity information' },
  { title: 'Documents', description: 'Upload required documents' },
  { title: 'Review', description: 'Review and submit' },
];

const companyInfoSchema = Yup.object().shape({
  companyName: Yup.string().required("Company name is required"),
  registrationNumber: Yup.string().required("Registration number is required"),
  entityType: Yup.string().required("Entity type is required"),
  country: Yup.string().required("Country is required"),
  address: Yup.string().required("Address is required"),
  city: Yup.string().required("City is required"),
  postalCode: Yup.string().required("Postal code is required"),
});

export default function PartnerOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    entityType: '',
    country: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = (values: any) => {
    setFormData({ ...formData, ...values });
    handleNext();
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" px="8" py="6">
        <Container maxW="6xl">
          <VStack align="start" gap="4">
            <Text as="h1" fontSize="2xl" fontWeight="bold" color="gray.800">
              Partner Onboarding
            </Text>
            
            <Box width="100%">
              {/* Custom Stepper */}
              <HStack gap="0" justify="space-between" mb="4">
                {steps.map((step, index) => (
                  <Flex key={index} direction="column" align="center" flex="1">
                    <Box
                      w="8"
                      h="8"
                      borderRadius="full"
                      bg={index <= currentStep ? "orange.500" : "gray.200"}
                      color={index <= currentStep ? "white" : "gray.500"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="bold"
                      fontSize="sm"
                    >
                      {index < currentStep ? "✓" : index + 1}
                    </Box>
                    <Text fontSize="sm" fontWeight="medium" mt="2" textAlign="center">
                      {step.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500" textAlign="center" mt="1">
                      {step.description}
                    </Text>
                    {index < steps.length - 1 && (
                      <Box
                        position="absolute"
                        top="16px"
                        left="50%"
                        width="100%"
                        height="2px"
                        bg="gray.200"
                        zIndex="-1"
                      />
                    )}
                  </Flex>
                ))}
              </HStack>
            </Box>
          </VStack>
        </Container>
      </Box>

      <Container maxW="4xl" py="8">
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card.Root bg="white" borderRadius="xl" boxShadow="lg">
          <Card.Header>
            <Text as="h2" fontSize="xl" fontWeight="semibold">
              {steps[currentStep].title}
            </Text>
            <Text color="gray.600" mt="1">
              {steps[currentStep].description}
            </Text>
          </Card.Header>

          <Card.Body>
            {currentStep === 0 && (
              <Formik
                initialValues={formData}
                validationSchema={companyInfoSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, isSubmitting }) => (
                  <Form>
                    <VStack gap="6">
                      <Box width="100%">
                        <Text mb="2" fontWeight="medium" color="gray.700">
                          Company Name
                        </Text>
                        <Field name="companyName">
                          {({ field }: any) => (
                            <Input
                              {...field}
                              placeholder="Enter company name"
                              size="lg"
                              isInvalid={errors.companyName && touched.companyName}
                            />
                          )}
                        </Field>
                        {errors.companyName && touched.companyName && (
                          <Text color="red.500" fontSize="sm" mt="1">
                            {errors.companyName}
                          </Text>
                        )}
                      </Box>

                      <HStack gap="6" width="100%">
                        <Box flex="1">
                          <Text mb="2" fontWeight="medium" color="gray.700">
                            Registration Number
                          </Text>
                          <Field name="registrationNumber">
                            {({ field }: any) => (
                              <Input
                                {...field}
                                placeholder="Enter registration number"
                                size="lg"
                                isInvalid={errors.registrationNumber && touched.registrationNumber}
                              />
                            )}
                          </Field>
                          {errors.registrationNumber && touched.registrationNumber && (
                            <Text color="red.500" fontSize="sm" mt="1">
                              {errors.registrationNumber}
                            </Text>
                          )}
                        </Box>

                        <Box flex="1">
                          <Text mb="2" fontWeight="medium" color="gray.700">
                            Entity Type
                          </Text>
                          <Field name="entityType">
                            {({ field }: any) => (
                              <select
                                {...field}
                                style={{
                                  width: '100%',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: '1px solid #E2E8F0',
                                  fontSize: '16px'
                                }}
                              >
                                <option value="">Select entity type</option>
                                <option value="pty_ltd">Pty Ltd / Ltd</option>
                                <option value="publicly_listed">Publicly Listed</option>
                                <option value="government">Government</option>
                                <option value="npo_ngo">NPO / NGO</option>
                                <option value="trust">Trust</option>
                              </select>
                            )}
                          </Field>
                          {errors.entityType && touched.entityType && (
                            <Text color="red.500" fontSize="sm" mt="1">
                              {errors.entityType}
                            </Text>
                          )}
                        </Box>
                      </HStack>

                      <Box width="100%">
                        <Text mb="2" fontWeight="medium" color="gray.700">
                          Country
                        </Text>
                        <Field name="country">
                          {({ field }: any) => (
                            <select
                              {...field}
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                fontSize: '16px'
                              }}
                            >
                              <option value="">Select country</option>
                              <option value="za">South Africa</option>
                              <option value="zw">Zimbabwe</option>
                              <option value="bw">Botswana</option>
                              <option value="uk">United Kingdom</option>
                            </select>
                          )}
                        </Field>
                        {errors.country && touched.country && (
                          <Text color="red.500" fontSize="sm" mt="1">
                            {errors.country}
                          </Text>
                        )}
                      </Box>

                      <Box width="100%">
                        <Text mb="2" fontWeight="medium" color="gray.700">
                          Address
                        </Text>
                        <Field name="address">
                          {({ field }: any) => (
                            <Input
                              {...field}
                              placeholder="Enter full address"
                              size="lg"
                              isInvalid={errors.address && touched.address}
                            />
                          )}
                        </Field>
                        {errors.address && touched.address && (
                          <Text color="red.500" fontSize="sm" mt="1">
                            {errors.address}
                          </Text>
                        )}
                      </Box>

                      <HStack gap="6" width="100%">
                        <Box flex="1">
                          <Text mb="2" fontWeight="medium" color="gray.700">
                            City
                          </Text>
                          <Field name="city">
                            {({ field }: any) => (
                              <Input
                                {...field}
                                placeholder="Enter city"
                                size="lg"
                                isInvalid={errors.city && touched.city}
                              />
                            )}
                          </Field>
                          {errors.city && touched.city && (
                            <Text color="red.500" fontSize="sm" mt="1">
                              {errors.city}
                            </Text>
                          )}
                        </Box>

                        <Box flex="1">
                          <Text mb="2" fontWeight="medium" color="gray.700">
                            Postal Code
                          </Text>
                          <Field name="postalCode">
                            {({ field }: any) => (
                              <Input
                                {...field}
                                placeholder="Enter postal code"
                                size="lg"
                                isInvalid={errors.postalCode && touched.postalCode}
                              />
                            )}
                          </Field>
                          {errors.postalCode && touched.postalCode && (
                            <Text color="red.500" fontSize="sm" mt="1">
                              {errors.postalCode}
                            </Text>
                          )}
                        </Box>
                      </HStack>

                      <Flex justify="space-between" width="100%" pt="6">
                        <Button variant="ghost" size="lg" disabled>
                          Previous
                        </Button>
                        <Button type="submit" variant="solid" size="lg">
                          Continue
                        </Button>
                      </Flex>
                    </VStack>
                  </Form>
                )}
              </Formik>
            )}

            {currentStep === 1 && (
              <VStack gap="6">
                <Text>Entity Details Form - Step 2 content here</Text>
                <Flex justify="space-between" width="100%" pt="6">
                  <Button variant="ghost" size="lg" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button variant="solid" size="lg" onClick={handleNext}>
                    Continue
                  </Button>
                </Flex>
              </VStack>
            )}

            {currentStep === 2 && (
              <VStack gap="6">
                <Text>Document Upload - Step 3 content here</Text>
                <Flex justify="space-between" width="100%" pt="6">
                  <Button variant="ghost" size="lg" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button variant="solid" size="lg" onClick={handleNext}>
                    Continue
                  </Button>
                </Flex>
              </VStack>
            )}

            {currentStep === 3 && (
              <VStack gap="6">
                <Text>Review and Submit - Step 4 content here</Text>
                <Flex justify="space-between" width="100%" pt="6">
                  <Button variant="ghost" size="lg" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button variant="solid" size="lg">
                    Submit Application
                  </Button>
                </Flex>
              </VStack>
            )}
          </Card.Body>
          </Card.Root>
        </MotionCard>
      </Container>
    </Box>
  );
}
