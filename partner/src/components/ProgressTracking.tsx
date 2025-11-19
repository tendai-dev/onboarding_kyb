"use client";

import { Box, VStack, HStack, Text, Badge, Icon, Button, Flex, SimpleGrid, useDisclosure, DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogCloseTrigger, Spinner } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiFileText,
  FiHome,
  FiUsers,
  FiUserCheck,
  FiFolder,
  FiPhone,
  FiCheck,
  FiEye,
  FiEdit,
  FiSave,
  FiPlay
} from "react-icons/fi";
import { EntityFormConfig } from "../lib/entityFormConfigs";

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
  isSaving = false
}: ProgressTrackingProps) {
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([]);
  const { open: isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const statuses = config.steps.map((step, index) => {
      const isCurrentStep = index + 1 === currentStep;
      const isCompleted = index + 1 < currentStep;
      
      // Calculate field completion
      const requiredFields = step.fields.filter(field => field.required).length;
      const completedFields = step.fields.filter(field => {
        const value = formData[field.id];
        return field.required && value !== undefined && value !== null && value !== '';
      }).length;
      
      // Calculate document completion
      const requiredDocuments = step.requiredDocuments.length;
      const uploadedDocuments = step.requiredDocuments.filter(docId => {
        // Mock document upload status - in real app, check actual upload status
        return Math.random() > 0.5; // 50% chance for demo
      }).length;
      
      const completionPercentage = requiredFields > 0 
        ? (completedFields / requiredFields) * 100 
        : 100;
      
      return {
        id: step.id,
        title: step.title,
        subtitle: step.subtitle,
        completed: isCompleted,
        inProgress: isCurrentStep,
        blocked: !isCompleted && index > 0 && !config.steps[index - 1].fields.every(field => {
          const value = formData[field.id];
          return !field.required || (value !== undefined && value !== null && value !== '');
        }),
        completionPercentage,
        requiredFields,
        completedFields,
        requiredDocuments,
        uploadedDocuments
      };
    });
    
    setStepStatuses(statuses);
  }, [config, formData, currentStep]);

  const getStepIcon = (status: StepStatus, index: number) => {
    if (status.completed) return FiCheckCircle;
    if (status.inProgress) return FiPlay;
    if (status.blocked) return FiAlertCircle;
    return FiClock;
  };

  const getStepColor = (status: StepStatus) => {
    if (status.completed) return "green";
    if (status.inProgress) return "blue";
    if (status.blocked) return "red";
    return "gray";
  };

  const getOverallProgress = () => {
    const totalSteps = stepStatuses.length;
    const completedSteps = stepStatuses.filter(s => s.completed).length;
    const currentStepProgress = stepStatuses.find(s => s.inProgress)?.completionPercentage || 0;
    
    return ((completedSteps + (currentStepProgress / 100)) / totalSteps) * 100;
  };

  const getNextIncompleteStep = () => {
    return stepStatuses.find(s => !s.completed && !s.blocked);
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
              <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                Application Progress
              </Text>
              <Text fontSize="sm" color="gray.600">
                Complete all steps to submit your application
              </Text>
            </VStack>
            
            <HStack gap="3">
              <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                {Math.round(getOverallProgress())}% Complete
              </Badge>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onSaveProgress}
                loading={isSaving}
                disabled={!isDirty}
              >
                <Icon as={FiSave} mr="2" />
                Save Progress
              </Button>
            </HStack>
          </HStack>
          
          <Box>
            <Box h="3" bg="gray.200" borderRadius="full" overflow="hidden">
              <Box h="3" bg="blue.500" width={`${Math.round(getOverallProgress())}%`} />
            </Box>
          </Box>
          
          {lastSaved && (
            <Text fontSize="xs" color="gray.500">
              Last saved: {new Date(lastSaved).toLocaleString()}
            </Text>
          )}
        </VStack>
      </Box>

      {/* Step-by-Step Progress */}
      <Box p="6" bg="white" borderRadius="lg" boxShadow="sm">
        <VStack gap="4" align="stretch">
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="semibold" color="gray.800">
              Step-by-Step Progress
            </Text>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpen}
            >
              <Icon as={FiEye} mr="1" />
              View Details
            </Button>
          </HStack>
          
          <VStack gap="3" align="stretch">
            {stepStatuses.map((status, index) => (
              <Box
                key={status.id}
                p="4"
                border="1px"
                borderColor={status.blocked ? "red.200" : status.inProgress ? "blue.200" : status.completed ? "green.200" : "gray.200"}
                borderRadius="md"
                bg={status.blocked ? "red.50" : status.inProgress ? "blue.50" : status.completed ? "green.50" : "gray.50"}
                cursor={status.blocked ? "not-allowed" : "pointer"}
                onClick={() => handleStepClick(index)}
                _hover={!status.blocked ? { bg: status.inProgress ? "blue.100" : status.completed ? "green.100" : "gray.100" } : {}}
                transition="all 0.2s"
              >
                <HStack justify="space-between" align="start">
                  <HStack gap="3" align="start">
                    <Icon
                      as={getStepIcon(status, index)}
                      boxSize="5"
                      color={`${getStepColor(status)}.500`}
                      mt="1"
                    />
                    
                    <VStack align="start" gap="1">
                      <Text fontSize="md" fontWeight="medium" color="gray.800">
                        {status.title}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {status.subtitle}
                      </Text>
                      
                      {status.inProgress && (
                        <HStack gap="4" mt="2">
                          <HStack gap="1">
                            <Text fontSize="xs" color="blue.600">
                              Fields: {status.completedFields}/{status.requiredFields}
                            </Text>
                          </HStack>
                          <HStack gap="1">
                            <Text fontSize="xs" color="blue.600">
                              Documents: {status.uploadedDocuments}/{status.requiredDocuments}
                            </Text>
                          </HStack>
                        </HStack>
                      )}
                    </VStack>
                  </HStack>
                  
                  <VStack align="end" gap="1">
                    <Badge
                      colorScheme={getStepColor(status)}
                      variant="subtle"
                      fontSize="xs"
                    >
                      {status.completed ? "Completed" : status.inProgress ? "In Progress" : status.blocked ? "Blocked" : "Pending"}
                    </Badge>
                    
                    {status.inProgress && (
                      <Box width="100px">
                        <Box h="2" bg="gray.200" borderRadius="full" overflow="hidden">
                          <Box h="2" bg="blue.500" width={`${Math.round(status.completionPercentage)}%`} />
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
        <Box p="4" bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200" mt="4">
          <HStack gap="2">
            <Icon as={FiPlay} color="blue.500" />
            <Text fontSize="sm" color="blue.700">
              Next: Complete "{getNextIncompleteStep()?.title}" to continue
            </Text>
          </HStack>
        </Box>
      )}

      {/* Detailed Progress Modal */}
      <DialogRoot open={isOpen} onOpenChange={(e) => (e.open ? onOpen() : onClose())}>
        <DialogContent maxW="xl">
          <DialogHeader>
            <DialogTitle>Detailed Progress Report</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack gap="4" align="stretch">
              {stepStatuses.map((status, index) => (
                <Box key={status.id} p="4" border="1px" borderColor="gray.200" borderRadius="md">
                  <VStack gap="3" align="stretch">
                    <HStack justify="space-between">
                      <HStack gap="2">
                        <Icon
                          as={getStepIcon(status, index)}
                          boxSize="4"
                          color={`${getStepColor(status)}.500`}
                        />
                        <Text fontWeight="medium" color="gray.800">
                          {status.title}
                        </Text>
                      </HStack>
                      <Badge colorScheme={getStepColor(status)} variant="subtle">
                        {Math.round(status.completionPercentage)}%
                      </Badge>
                    </HStack>
                    
                    <Text fontSize="sm" color="gray.600">
                      {status.subtitle}
                    </Text>
                    
                    <SimpleGrid columns={2} gap="4">
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb="1">Required Fields</Text>
                        <HStack gap="2">
                          <Box w="100px" h="2" bg="gray.200" borderRadius="full" overflow="hidden">
                            <Box h="2" bg="blue.500" width={`${Math.round((status.completedFields / Math.max(status.requiredFields,1)) * 100)}%`} />
                          </Box>
                          <Text fontSize="xs" color="gray.600">
                            {status.completedFields}/{status.requiredFields}
                          </Text>
                        </HStack>
                      </Box>
                      
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb="1">Required Documents</Text>
                        <HStack gap="2">
                          <Box w="100px" h="2" bg="gray.200" borderRadius="full" overflow="hidden">
                            <Box h="2" bg="green.500" width={`${Math.round((status.uploadedDocuments / Math.max(status.requiredDocuments,1)) * 100)}%`} />
                          </Box>
                          <Text fontSize="xs" color="gray.600">
                            {status.uploadedDocuments}/{status.requiredDocuments}
                          </Text>
                        </HStack>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                </Box>
              ))}
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
