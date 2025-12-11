'use client';
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  VStack,
  HStack,
  Icon,
  SimpleGrid,
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
import { useState, useEffect } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPlay,
  FiSave,
  FiEye,
} from 'react-icons/fi';
import { EntityFormConfig } from '../lib/entityFormConfigs';

interface ProgressTrackingProps {
  config: EntityFormConfig;
  formData: any;
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
      const uploadedDocuments = step.requiredDocuments.filter((_docId) => {
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
              <Tag variant="solid" size="md">
                {Math.round(getOverallProgress())}% Complete
              </Tag>

              <Button
                size="sm"
                variant="ghost"
                onClick={onSaveProgress}
                loading={isSaving}
                disabled={!isDirty}
              >
                <Icon as={FiSave} mr="2" color="mukuru.text.primary" />
                <Typography color="mukuru.text.primary" fontSize="sm" fontWeight="medium">
                  Save Progress
                </Typography>
              </Button>
            </HStack>
          </HStack>

          <Box>
            <Box h="3" bg="mukuru.grey.light" borderRadius="full" overflow="hidden">
              <Box
                h="3"
                bg="mukuru.buttons.primary"
                width={`${Math.round(getOverallProgress())}%`}
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
            <Typography fontSize="lg" fontWeight="semibold" color="mukuru.text.primary">
              Step-by-Step Progress
            </Typography>

            <Button size="sm" variant="ghost" onClick={onOpen}>
              <Icon as={FiEye} mr="1" color="mukuru.text.primary" />
              <Typography color="mukuru.text.primary" fontSize="sm" fontWeight="medium">
                View Details
              </Typography>
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
                    ? 'error.200'
                    : status.inProgress
                      ? 'info.200'
                      : status.completed
                        ? 'success.200'
                        : 'mukuru.grey.light'
                }
                borderRadius="md"
                bg={
                  status.blocked
                    ? 'error.50'
                    : status.inProgress
                      ? 'info.50'
                      : status.completed
                        ? 'success.50'
                        : 'mukuru.background.light'
                }
                cursor={status.blocked ? 'not-allowed' : 'pointer'}
                onClick={() => handleStepClick(index)}
                _hover={
                  !status.blocked
                    ? {
                        bg: status.inProgress
                          ? 'info.100'
                          : status.completed
                            ? 'success.100'
                            : 'mukuru.grey.light',
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
                            <Typography fontSize="xs" color="mukuru.text.primary">
                              Fields: {status.completedFields}/{status.requiredFields}
                            </Typography>
                          </HStack>
                          <HStack gap="1">
                            <Typography fontSize="xs" color="mukuru.text.primary">
                              Documents: {status.uploadedDocuments}/
                              {status.requiredDocuments}
                            </Typography>
                          </HStack>
                        </HStack>
                      )}
                    </VStack>
                  </HStack>

                  <VStack align="end" gap="1">
                    <Tag variant="solid" size="md">
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
                          h="2"
                          bg="mukuru.grey.light"
                          borderRadius="full"
                          overflow="hidden"
                        >
                          <Box
                            h="2"
                            bg="mukuru.buttons.primary"
                            width={`${Math.round(status.completionPercentage)}%`}
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
          bg="mukuru.background.light"
          borderRadius="md"
          border="1px"
          borderColor="mukuru.grey.light"
          mt="4"
        >
          <HStack gap="2">
            <Icon as={FiPlay} color="mukuru.buttons.primary" />
            <Typography fontSize="sm" color="mukuru.text.primary" fontWeight="medium">
              Next: Complete &quot;{getNextIncompleteStep()?.title}&quot; to continue
            </Typography>
          </HStack>
        </Box>
      )}

      {/* Detailed Progress Modal */}
      <DialogRoot open={isOpen} onOpenChange={(e) => (e.open ? onOpen() : onClose())}>
        <DialogContent maxW="xl">
          <DialogHeader>
            <DialogTitle>
              <Typography color="mukuru.text.primary" fontSize="lg" fontWeight="bold">
                Detailed Progress Report
              </Typography>
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack gap="4" align="stretch">
              {stepStatuses.map((status, _index) => (
                <Box
                  key={status.id}
                  p="4"
                  border="1px"
                  borderColor="mukuru.grey.light"
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
                      <Tag variant="solid" size="md">
                        {Math.round(status.completionPercentage)}%
                      </Tag>
                    </HStack>

                    <Typography fontSize="sm" color="mukuru.text.primary">
                      {status.subtitle}
                    </Typography>

                    <SimpleGrid columns={2} gap="4">
                      <Box>
                        <Typography fontSize="xs" color="mukuru.text.primary" mb="1">
                          Required Fields
                        </Typography>
                        <HStack gap="2">
                          <Box
                            w="100px"
                            h="2"
                            bg="mukuru.grey.light"
                            borderRadius="full"
                            overflow="hidden"
                          >
                            <Box
                              h="2"
                              bg="mukuru.buttons.primary"
                              width={`${Math.round((status.completedFields / Math.max(status.requiredFields, 1)) * 100)}%`}
                            />
                          </Box>
                          <Typography fontSize="xs" color="mukuru.text.primary">
                            {status.completedFields}/{status.requiredFields}
                          </Typography>
                        </HStack>
                      </Box>

                      <Box>
                        <Typography fontSize="xs" color="mukuru.text.primary" mb="1">
                          Required Documents
                        </Typography>
                        <HStack gap="2">
                          <Box
                            w="100px"
                            h="2"
                            bg="mukuru.grey.light"
                            borderRadius="full"
                            overflow="hidden"
                          >
                            <Box
                              h="2"
                              bg="success.500"
                              width={`${Math.round((status.uploadedDocuments / Math.max(status.requiredDocuments, 1)) * 100)}%`}
                            />
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
          </DialogBody>
          <DialogFooter>
            <Button
              onClick={onClose}
              variant="primary"
              bg="mukuru.buttons.primary"
              _hover={{ bg: 'mukuru.buttons.inactive.orange' }}
            >
              <Typography color="mukuru.text.inverse" fontSize="sm" fontWeight="medium">
                Close
              </Typography>
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
