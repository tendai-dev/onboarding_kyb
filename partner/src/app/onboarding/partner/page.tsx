'use client';
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable security/detect-object-injection */
import { Box, Container, VStack, HStack, Flex, Card } from '@chakra-ui/react';
import { Button, Typography, Input } from '@/lib/mukuruImports';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import { motion } from 'framer-motion';

const MotionCard = motion.div;

const steps = [
  { title: 'Company Info', description: 'Basic company details' },
  { title: 'Entity Details', description: 'Legal entity information' },
  { title: 'Documents', description: 'Upload required documents' },
  { title: 'Review', description: 'Review and submit' },
];

const companyInfoSchema = Yup.object().shape({
  companyName: Yup.string().required('Company name is required'),
  registrationNumber: Yup.string().required('Registration number is required'),
  entityType: Yup.string().required('Entity type is required'),
  country: Yup.string().required('Country is required'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  postalCode: Yup.string().required('Postal code is required'),
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

  const handleSubmit = (values: Record<string, unknown>) => {
    setFormData({ ...formData, ...values });
    handleNext();
  };

  return (
    <Box minH="100vh" bg="mukuru.background.light">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" px="8" py="6">
        <Container maxW="6xl">
          <VStack align="start" gap="4">
            <Typography
              as="h1"
              fontSize="2xl"
              fontWeight="bold"
              color="mukuru.text.primary"
            >
              Partner Onboarding
            </Typography>

            <Box width="100%">
              {/* Custom Stepper */}
              <HStack gap="0" justify="space-between" mb="4">
                {steps.map((step, index) => (
                  <Flex key={index} direction="column" align="center" flex="1">
                    <Box
                      w="8"
                      h="8"
                      borderRadius="full"
                      bg={index <= currentStep ? 'orange.500' : 'gray.200'}
                      color={index <= currentStep ? 'white' : 'gray.500'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="bold"
                      fontSize="sm"
                    >
                      {index < currentStep ? '✓' : index + 1}
                    </Box>
                    <Typography
                      fontSize="sm"
                      fontWeight="medium"
                      mt="2"
                      textAlign="center"
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      fontSize="xs"
                      color="mukuru.grey.medium"
                      textAlign="center"
                      mt="1"
                    >
                      {step.description}
                    </Typography>
                    {index < steps.length - 1 && (
                      <Box
                        position="absolute"
                        top="16px"
                        left="50%"
                        width="100%"
                        height="2px"
                        bg="mukuru.grey.light"
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
          <Card.Root>
            <Card.Header>
              <Typography as="h2" fontSize="xl" fontWeight="semibold">
                {steps[currentStep]?.title ?? 'Unknown Step'}
              </Typography>
              <Typography color="mukuru.text.primary" mt="1">
                {steps[currentStep]?.description ?? ''}
              </Typography>
            </Card.Header>

            <Card.Body>
              {currentStep === 0 && (
                <Formik
                  initialValues={formData}
                  validationSchema={companyInfoSchema}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched }) => (
                    <Form>
                      <VStack gap="6">
                        <Box width="100%">
                          <Typography
                            mb="2"
                            fontWeight="medium"
                            color="mukuru.text.primary"
                          >
                            Company Name
                          </Typography>
                          <Field name="companyName">
                            {({ field }: { field: Record<string, unknown> }) => (
                              <Input
                                {...(field as Record<string, unknown>)}
                                placeholder="Enter company name"
                              />
                            )}
                          </Field>
                          {errors.companyName && touched.companyName && (
                            <Typography color="mukuru.text.error" fontSize="sm" mt="1">
                              {errors.companyName}
                            </Typography>
                          )}
                        </Box>

                        <HStack gap="6" width="100%">
                          <Box flex="1">
                            <Typography
                              mb="2"
                              fontWeight="medium"
                              color="mukuru.text.primary"
                            >
                              Registration Number
                            </Typography>
                            <Field name="registrationNumber">
                              {({ field }: { field: Record<string, unknown> }) => (
                                <Input
                                  {...(field as Record<string, unknown>)}
                                  placeholder="Enter registration number"
                                />
                              )}
                            </Field>
                            {errors.registrationNumber && touched.registrationNumber && (
                              <Typography color="mukuru.text.error" fontSize="sm" mt="1">
                                {errors.registrationNumber}
                              </Typography>
                            )}
                          </Box>

                          <Box flex="1">
                            <Typography
                              mb="2"
                              fontWeight="medium"
                              color="mukuru.text.primary"
                            >
                              Entity Type
                            </Typography>
                            <Field name="entityType">
                              {({ field }: { field: Record<string, unknown> }) => (
                                <select
                                  {...field}
                                  style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--mukuru-grey-light)',
                                    fontSize: '16px',
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
                              <Typography color="mukuru.text.error" fontSize="sm" mt="1">
                                {errors.entityType}
                              </Typography>
                            )}
                          </Box>
                        </HStack>

                        <Box width="100%">
                          <Typography
                            mb="2"
                            fontWeight="medium"
                            color="mukuru.text.primary"
                          >
                            Country
                          </Typography>
                          <Field name="country">
                            {({ field }: { field: Record<string, unknown> }) => (
                              <select
                                {...field}
                                style={{
                                  width: '100%',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: '1px solid #E2E8F0',
                                  fontSize: '16px',
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
                            <Typography color="mukuru.text.error" fontSize="sm" mt="1">
                              {errors.country}
                            </Typography>
                          )}
                        </Box>

                        <Box width="100%">
                          <Typography
                            mb="2"
                            fontWeight="medium"
                            color="mukuru.text.primary"
                          >
                            Address
                          </Typography>
                          <Field name="address">
                            {({ field }: { field: Record<string, unknown> }) => (
                              <Input
                                {...(field as Record<string, unknown>)}
                                placeholder="Enter full address"
                              />
                            )}
                          </Field>
                          {errors.address && touched.address && (
                            <Typography color="mukuru.text.error" fontSize="sm" mt="1">
                              {errors.address}
                            </Typography>
                          )}
                        </Box>

                        <HStack gap="6" width="100%">
                          <Box flex="1">
                            <Typography
                              mb="2"
                              fontWeight="medium"
                              color="mukuru.text.primary"
                            >
                              City
                            </Typography>
                            <Field name="city">
                              {({ field }: { field: Record<string, unknown> }) => (
                                <Input
                                  {...(field as Record<string, unknown>)}
                                  placeholder="Enter city"
                                />
                              )}
                            </Field>
                            {errors.city && touched.city && (
                              <Typography color="mukuru.text.error" fontSize="sm" mt="1">
                                {errors.city}
                              </Typography>
                            )}
                          </Box>

                          <Box flex="1">
                            <Typography
                              mb="2"
                              fontWeight="medium"
                              color="mukuru.text.primary"
                            >
                              Postal Code
                            </Typography>
                            <Field name="postalCode">
                              {({ field }: { field: Record<string, unknown> }) => (
                                <Input
                                  {...(field as Record<string, unknown>)}
                                  placeholder="Enter postal code"
                                />
                              )}
                            </Field>
                            {errors.postalCode && touched.postalCode && (
                              <Typography color="mukuru.text.error" fontSize="sm" mt="1">
                                {errors.postalCode}
                              </Typography>
                            )}
                          </Box>
                        </HStack>

                        <Flex justify="space-between" width="100%" pt="6">
                          <Button variant="ghost" size="md" disabled>
                            Previous
                          </Button>
                          <Button type="submit" variant="primary" size="md">
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
                  <Typography>Entity Details Form - Step 2 content here</Typography>
                  <Flex justify="space-between" width="100%" pt="6">
                    <Button variant="ghost" size="md" onClick={handlePrevious}>
                      Previous
                    </Button>
                    <Button variant="primary" size="md" onClick={handleNext}>
                      Continue
                    </Button>
                  </Flex>
                </VStack>
              )}

              {currentStep === 2 && (
                <VStack gap="6">
                  <Typography>Document Upload - Step 3 content here</Typography>
                  <Flex justify="space-between" width="100%" pt="6">
                    <Button variant="ghost" size="md" onClick={handlePrevious}>
                      Previous
                    </Button>
                    <Button variant="primary" size="md" onClick={handleNext}>
                      Continue
                    </Button>
                  </Flex>
                </VStack>
              )}

              {currentStep === 3 && (
                <VStack gap="6">
                  <Typography>Review and Submit - Step 4 content here</Typography>
                  <Flex justify="space-between" width="100%" pt="6">
                    <Button variant="ghost" size="md" onClick={handlePrevious}>
                      Previous
                    </Button>
                    <Button variant="primary" size="md">
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
