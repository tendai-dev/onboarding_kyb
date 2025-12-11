/* eslint-disable security/detect-object-injection */
'use client';

import { Box, VStack, HStack, Icon, SimpleGrid, useDisclosure } from '@chakra-ui/react';
// Import components directly from Mukuru package
import { Typography, Tag, Button } from '@mukuru/mukuru-react-components';
import { useState, useEffect } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPlay,
  FiX,
  FiSave,
  FiEye,
} from 'react-icons/fi';
import { EntityFormConfig } from '../lib/entityFormConfigs';

interface ProgressTrackingProps {
  config: EntityFormConfig;
  formData: Record<string, unknown>;
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
  onSaveProgress: () => void;
  onResumeFromStep: (stepIndex: number) => void;
  lastSaved?: string;
  isDirty?: boolean;
  isSaving?: boolean;
}

interface StepStatus {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
  inProgress: boolean;
  blocked: boolean;
  completionPercentage: number;
  requiredFields: number;
  completedFields: number;
  requiredDocuments: number;
  uploadedDocuments: number;
}

export function ProgressTracking({
  config,
  formData,
  currentStep,
  onStepClick,
  onSaveProgress,
  onResumeFromStep,
  lastSaved,
  isDirty = false,
  isSaving = false,
}: ProgressTrackingProps) {
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([]);
  const { open: isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const statuses = config.steps.map((step, index) => {
      const isCurrentStep = index + 1 === currentStep;
      const isCompleted = index + 1 < currentStep;

      // Calculate field completion
      const requiredFields = step.fields.filter((field) => field.required).length;
      const completedFields = step.fields.filter((field) => {
        const value = formData[field.id];
        return field.required && value !== undefined && value !== null && value !== '';
      }).length;

      // Calculate document completion
      const requiredDocuments = step.requiredDocuments.length;
      const uploadedDocuments = step.requiredDocuments.filter(() => {
        // Mock document upload status - in real app, check actual upload status
        return Math.random() > 0.5; // 50% chance for demo
      }).length;

      const completionPercentage =
        requiredFields > 0 ? (completedFields / requiredFields) * 100 : 100;

      return {
        id: step.id,
        title: step.title,
        subtitle: step.subtitle,
        completed: isCompleted,
        inProgress: isCurrentStep,
        blocked:
          !isCompleted &&
          index > 0 &&
          !config.steps[index - 1].fields.every((field) => {
            const value = formData[field.id];
            return (
              !field.required || (value !== undefined && value !== null && value !== '')
            );
          }),
        completionPercentage,
        requiredFields,
        completedFields,
        requiredDocuments,
        uploadedDocuments,
      };
    });

    setStepStatuses(statuses);
  }, [config, formData, currentStep]);

  const getStepIcon = (status: StepStatus) => {
    if (status.completed) return FiCheckCircle;
    if (status.inProgress) return FiPlay;
    if (status.blocked) return FiAlertCircle;
    return FiClock;
  };

  const getStepColor = (status: StepStatus) => {
    if (status.completed) return 'green';
    if (status.inProgress) return 'blue';
    if (status.blocked) return 'red';
    return 'gray';
  };

  const getOverallProgress = () => {
    const totalSteps = stepStatuses.length;
    const completedSteps = stepStatuses.filter((s) => s.completed).length;
    const currentStepProgress =
      stepStatuses.find((s) => s.inProgress)?.completionPercentage || 0;

    return ((completedSteps + currentStepProgress / 100) / totalSteps) * 100;
  };

  const getNextIncompleteStep = () => {
    return stepStatuses.find((s) => !s.completed && !s.blocked);
  };

  const handleStepClick = (index: number) => {
    const step = stepStatuses[index];
    if (step.blocked) return;

    if (step.completed || step.inProgress) {
      onStepClick(index + 1);
    } else {
      onResumeFromStep(index + 1);
    }
  };

  return (
    <Box>
      {/* Overall Progress */}
      <Box p="6" bg="white" borderRadius="lg" boxShadow="sm" mb="6">
        <VStack gap="4" align="stretch">
          <HStack justify="space-between">
            <VStack align="start" gap="1">
              <Typography fontSize="lg" fontWeight="semibold" color="mukuru.text.primary">
                Application Progress
              </Typography>
              <Typography fontSize="sm" color="mukuru.text.primary">
                Complete all steps to submit your application
              </Typography>
            </VStack>

            <HStack gap="3">
              <Tag variant="info">{Math.round(getOverallProgress())}% Complete</Tag>

              <Button
                size="sm"
                variant="ghost"
                onClick={onSaveProgress}
                disabled={!isDirty || isSaving}
              >
                <Icon as={FiSave} mr="2" />
                Save Progress
              </Button>
            </HStack>
          </HStack>

          <Box>
            <Box
              width="100%"
              height="12px"
              bg="mukuru.grey.light"
              borderRadius="full"
              overflow="hidden"
            >
              <Box
                width={`${getOverallProgress()}%`}
                height="100%"
                bg="mukuru.teal"
                transition="width 0.3s"
              />
            </Box>
          </Box>

          {lastSaved && (
            <Typography fontSize="xs" color="mukuru.grey.medium">
              Last saved: {new Date(lastSaved).toLocaleString()}
            </Typography>
          )}
        </VStack>
      </Box>

      {/* Step-by-Step Progress */}
      <Box p="6" bg="white" borderRadius="lg" boxShadow="sm">
        <VStack gap="4" align="stretch">
          <HStack justify="space-between">
            <Typography fontSize="lg" fontWeight="semibold" color="gray.800">
              Step-by-Step Progress
            </Typography>

            <Button size="sm" variant="ghost" onClick={onOpen}>
              <Icon as={FiEye} mr="2" />
              View Details
            </Button>
          </HStack>

          <VStack gap="3" align="stretch">
            {stepStatuses.map((status, index) => (
              <Box
                key={status.id}
                p="4"
                border="1px"
                borderColor={
                  status.blocked
                    ? 'red.200'
                    : status.inProgress
                      ? 'blue.200'
                      : status.completed
                        ? 'green.200'
                        : 'gray.200'
                }
                borderRadius="md"
                bg={
                  status.blocked
                    ? 'red.50'
                    : status.inProgress
                      ? 'blue.50'
                      : status.completed
                        ? 'green.50'
                        : 'gray.50'
                }
                cursor={status.blocked ? 'not-allowed' : 'pointer'}
                onClick={() => handleStepClick(index)}
                _hover={
                  !status.blocked
                    ? {
                        bg: status.inProgress
                          ? 'blue.100'
                          : status.completed
                            ? 'green.100'
                            : 'gray.100',
                      }
                    : {}
                }
                transition="all 0.2s"
              >
                <HStack justify="space-between" align="start">
                  <HStack gap="3" align="start">
                    <Icon
                      as={getStepIcon(status)}
                      boxSize="5"
                      color={`${getStepColor(status)}.500`}
                      mt="1"
                    />

                    <VStack align="start" gap="1">
                      <Typography
                        fontSize="md"
                        fontWeight="medium"
                        color="mukuru.text.primary"
                      >
                        {status.title}
                      </Typography>
                      <Typography fontSize="sm" color="mukuru.text.primary">
                        {status.subtitle}
                      </Typography>

                      {status.inProgress && (
                        <HStack gap="4" mt="2">
                          <HStack gap="1">
                            <Typography fontSize="xs" color="mukuru.teal">
                              Fields: {status.completedFields}/{status.requiredFields}
                            </Typography>
                          </HStack>
                          <HStack gap="1">
                            <Typography fontSize="xs" color="mukuru.teal">
                              Documents: {status.uploadedDocuments}/
                              {status.requiredDocuments}
                            </Typography>
                          </HStack>
                        </HStack>
                      )}
                    </VStack>
                  </HStack>

                  <VStack align="end" gap="1">
                    <Tag
                      variant={
                        status.completed
                          ? 'success'
                          : status.inProgress
                            ? 'info'
                            : status.blocked
                              ? 'danger'
                              : 'inactive'
                      }
                    >
                      {status.completed
                        ? 'Completed'
                        : status.inProgress
                          ? 'In Progress'
                          : status.blocked
                            ? 'Blocked'
                            : 'Pending'}
                    </Tag>

                    {status.inProgress && (
                      <Box width="100px">
                        <Box
                          width="100%"
                          height="8px"
                          bg="mukuru.grey.light"
                          borderRadius="full"
                          overflow="hidden"
                        >
                          <Box
                            width={`${status.completionPercentage}%`}
                            height="100%"
                            bg="mukuru.teal"
                            transition="width 0.3s"
                          />
                        </Box>
                      </Box>
                    )}
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </VStack>
      </Box>

      {/* Next Steps */}
      {getNextIncompleteStep() && (
        <Box
          p="4"
          bg="mukuru.teal"
          borderRadius="md"
          border="1px"
          borderColor="blue.200"
          mt="4"
        >
          <HStack gap="2">
            <Icon as={FiPlay} color="mukuru.teal" />
            <Typography fontSize="sm" color="mukuru.teal">
              Next: Complete &quot;{getNextIncompleteStep()?.title}&quot; to continue
            </Typography>
          </HStack>
        </Box>
      )}

      {/* Detailed Progress Modal */}
      {isOpen && (
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
          onClick={onClose}
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
                <Typography fontWeight="bold" fontSize="lg">
                  Detailed Progress Report
                </Typography>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
              <VStack gap="4" align="stretch">
                {stepStatuses.map((status, _index) => (
                  <Box
                    key={status.id}
                    p="4"
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                  >
                    <VStack gap="3" align="stretch">
                      <HStack justify="space-between">
                        <HStack gap="2">
                          <Icon
                            as={getStepIcon(status)}
                            boxSize="4"
                            color={`${getStepColor(status)}.500`}
                          />
                          <Typography fontWeight="medium" color="mukuru.text.primary">
                            {status.title}
                          </Typography>
                        </HStack>
                        <Tag
                          variant={
                            status.completed
                              ? 'success'
                              : status.inProgress
                                ? 'info'
                                : status.blocked
                                  ? 'danger'
                                  : 'inactive'
                          }
                        >
                          {Math.round(status.completionPercentage)}%
                        </Tag>
                      </HStack>

                      <Typography fontSize="sm" color="mukuru.text.primary">
                        {status.subtitle}
                      </Typography>

                      <SimpleGrid columns={2} gap="4">
                        <Box>
                          <Typography fontSize="xs" color="mukuru.grey.medium" mb="1">
                            Required Fields
                          </Typography>
                          <HStack gap="2">
                            <Box width="100px">
                              <Box
                                width="100%"
                                height="8px"
                                bg="mukuru.grey.light"
                                borderRadius="full"
                                overflow="hidden"
                              >
                                <Box
                                  width={`${(status.completedFields / status.requiredFields) * 100}%`}
                                  height="100%"
                                  bg="mukuru.teal"
                                  transition="width 0.3s"
                                />
                              </Box>
                            </Box>
                            <Typography fontSize="xs" color="mukuru.text.primary">
                              {status.completedFields}/{status.requiredFields}
                            </Typography>
                          </HStack>
                        </Box>

                        <Box>
                          <Typography fontSize="xs" color="mukuru.grey.medium" mb="1">
                            Required Documents
                          </Typography>
                          <HStack gap="2">
                            <Box width="100px">
                              <Box
                                width="100%"
                                height="8px"
                                bg="mukuru.grey.light"
                                borderRadius="full"
                                overflow="hidden"
                              >
                                <Box
                                  width={`${(status.uploadedDocuments / status.requiredDocuments) * 100}%`}
                                  height="100%"
                                  bg="mukuru.text.success"
                                  transition="width 0.3s"
                                />
                              </Box>
                            </Box>
                            <Typography fontSize="xs" color="mukuru.text.primary">
                              {status.uploadedDocuments}/{status.requiredDocuments}
                            </Typography>
                          </HStack>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack justify="flex-end">
                <Button onClick={onClose}>Close</Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
