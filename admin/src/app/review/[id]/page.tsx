/* eslint-disable security/detect-object-injection */
'use client';

import {
  Box,
  Container,
  VStack,
  HStack,
  Flex,
  SimpleGrid,
  GridItem,
  Textarea,
  Separator,
  Spinner,
  Field,
} from '@chakra-ui/react';
import { Global } from '@emotion/react';
import {
  FiCheckSquare,
  FiFolder,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiMessageSquare,
  FiClock,
  FiShield,
  FiSend,
  FiRefreshCw,
  FiEye,
  FiSave,
  FiFileText,
  FiArrowRight,
  FiUser,
  FiHash,
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiFlag,
  FiAlertTriangle,
  FiFile,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
// Use motion.create() instead of deprecated motion()
const MotionBox = motion.create(Box);
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AdminSidebar from '../../../components/AdminSidebar';
import PortalHeader from '../../../components/PortalHeader';
import { DocumentViewer } from '../../../components/DocumentViewer';
import {
  fetchMyWorkItems,
  fetchWorkItems,
  fetchWorkItemById,
  fetchWorkItemByApplicationId,
  approveWorkItemUseCase,
  declineWorkItemUseCase,
  completeWorkItemUseCase,
  submitForApprovalUseCase,
  addCommentUseCase,
  fetchWorkItemComments,
  fetchWorkItemHistory,
  assignWorkItemUseCase,
  unassignWorkItemUseCase,
  startReviewUseCase,
  markForRefreshUseCase,
  WorkItemApplication,
} from '../../../services';
import { getStepReviewStatus, updateStepReviewStatus } from '../../../services/api/workQueueApi';
import { useSession } from 'next-auth/react';
import { fetchEntitySchema, type EntitySchema, type RenderableField, type RenderableSection } from '../../../lib/entitySchemaRenderer';
import { riskApiService, RiskAssessmentDto } from '../../../services/riskApi';
import { logger } from '../../../lib/logger';
import { useSidebar } from '../../../contexts/SidebarContext';
// Import Tabs components for wizard step navigation
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsIndicator,
} from '../../../lib/mukuruComponentWrappers';
// Import components directly from Mukuru package
import {
  Typography,
  Button,
  Card,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AlertBar,
  Tag,
  IconWrapper,
  Tooltip,
  Link as MukuruLink,
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentIcon,
  TickCircleIcon,
  TickIcon,
  VisibleIcon,
  RetryIcon,
  CloseIcon,
  RecheckIcon,
  InfoIcon,
  WarningIcon,
  SendMoneyIcon,
  DownloadIcon,
  EditIcon,
  DeleteIcon,
  MailIcon,
  CalendarIcon,
  ProfileIcon,
  ErrorIcon,
  PendingIcon,
} from '@mukuru/mukuru-react-components';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;

/**
 * Component to render a wizard step's requirements (information fields and documents)
 */
function WizardStepContent({
  stepId,
  requirements,
  documents,
  applicationData,
  requirementMap,
  onViewDocument,
  reviewStatus,
  onReviewStatusChange,
  onNotesChange,
}: {
  stepId: string;
  requirements: RenderableField[];
  documents: unknown[];
  applicationData: unknown;
  requirementMap: Map<string, string>;
  onViewDocument: (url: string, name: string, type?: string, size?: number) => void;
  reviewStatus?: {
    completed: boolean;
    verified: boolean;
    approved: boolean;
    completedAt?: string;
    verifiedAt?: string;
    approvedAt?: string;
    completedBy?: string;
    verifiedBy?: string;
    approvedBy?: string;
    notes?: string;
  };
  onReviewStatusChange?: (stepId: string, field: 'completed' | 'verified' | 'approved', value: boolean) => void;
  onNotesChange?: (stepId: string, notes: string) => void;
}) {
  // Separate requirements into information fields and documents
  const informationFields = requirements.filter(f => f.type !== 'file' && f.type !== 'File');
  const documentFields = requirements.filter(f => f.type === 'file' || f.type === 'File');

  // Get application metadata
  const appData = applicationData as Record<string, unknown> | null;
  let metadata: Record<string, unknown> = {};
  if (appData?.metadataJson) {
    try {
      metadata = typeof appData.metadataJson === 'string'
        ? JSON.parse(appData.metadataJson)
        : appData.metadataJson;
    } catch {
      // Ignore parse errors
    }
  }

  return (
    <VStack align="stretch" gap="24px">
      {/* Information Fields Section */}
      {informationFields.length > 0 && (
        <Box
          bg="mukuru.cards.white"
          borderRadius="16px"
          border="1px solid"
          borderColor="mukuru.grey.light"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
          overflow="hidden"
        >
          <Flex 
            p="16px 24px" 
            borderBottom="1px solid" 
            borderColor="mukuru.grey.light" 
            bg="mukuru.background.light"
            align="center"
            justify="space-between"
          >
            <HStack gap="10px">
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg="mukuru.buttons.primary"
              />
              <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
                Information Fields
              </Typography>
            </HStack>
            <Typography fontSize="12px" fontWeight="500" color="mukuru.grey.medium">
              {informationFields.filter(f => {
                const val = f.value;
                return val !== null && val !== undefined && val !== '';
              }).length} / {informationFields.length} provided
            </Typography>
          </Flex>
          <Box p="24px">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px">
              {informationFields.map((field) => {
                // Use the mapped value from entitySchemaRenderer (which uses mapRequirementCodeToValue)
                // This ensures consistent mapping logic
                let fieldValue: unknown = field.value;
                
                // If field.value is empty, try additional fallbacks
                if (!fieldValue || fieldValue === '') {
                  // Try to get value from metadata with various key formats
                  const possibleKeys = [
                    field.code.toLowerCase(),
                    field.code.toUpperCase(),
                    field.code,
                    field.label.toLowerCase().replace(/\s+/g, '_'),
                    field.label.toLowerCase().replace(/\s+/g, '-'),
                    field.label.toLowerCase().replace(/\s+/g, ''),
                  ];
                  
                  for (const key of possibleKeys) {
                    if (metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '') {
                      fieldValue = metadata[key];
                      console.log(`[WizardStepContent] Found value for "${field.code}" via metadata key "${key}":`, fieldValue);
                      break;
                    }
                  }
                  
                  // Also check direct field access in applicationData
                  if ((!fieldValue || fieldValue === '') && appData) {
                    const appDataKey = Object.keys(appData).find(
                      k => k.toLowerCase() === field.code.toLowerCase() || 
                           k.toLowerCase().replace(/_/g, '') === field.code.toLowerCase().replace(/_/g, '')
                    );
                    if (appDataKey && appData[appDataKey] !== null && appData[appDataKey] !== undefined && appData[appDataKey] !== '') {
                      fieldValue = appData[appDataKey];
                      console.log(`[WizardStepContent] Found value for "${field.code}" via applicationData key "${appDataKey}":`, fieldValue);
                    }
                  }
                }

                // Check if field has a value - handle various types including JSON strings
                const hasValue = (() => {
                  if (fieldValue === null || fieldValue === undefined) return false;
                  if (typeof fieldValue === 'string') {
                    const trimmed = fieldValue.trim();
                    if (trimmed === '') return false;
                    // If it's a JSON string, try to parse it to see if it's valid
                    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                      try {
                        const parsed = JSON.parse(trimmed);
                        // Consider it a value if parsed object has meaningful content
                        return parsed !== null && parsed !== undefined && (typeof parsed === 'object' ? Object.keys(parsed).length > 0 : true);
                      } catch {
                        // Not valid JSON, but it's a non-empty string, so it's a value
                        return true;
                      }
                    }
                    return true; // Non-empty string is a value
                  }
                  // For other types (number, boolean, object, array), consider it a value if it's not null/undefined
                  return true;
                })();

                return (
                  <Box 
                    key={field.code}
                    p="16px"
                    borderRadius="12px"
                    border="1px solid"
                    borderColor={hasValue ? "mukuru.grey.light" : "mukuru.text.error"}
                    bg={hasValue ? "mukuru.cards.white" : "rgba(220, 38, 38, 0.04)"}
                    transition="all 0.2s ease"
                    _hover={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                  >
                    {/* Header row with label and status */}
                    <Flex justify="space-between" align="center" mb="12px">
                      <HStack gap="8px" align="center">
                        <Typography 
                          fontSize="13px" 
                          fontWeight="600" 
                          color="mukuru.text.primary"
                          lineHeight="1.4"
                        >
                          {field.label}
                        </Typography>
                        {field.isRequired && (
                          <Box
                            px="8px"
                            py="2px"
                            borderRadius="4px"
                            bg="rgba(220, 38, 38, 0.08)"
                            border="1px solid"
                            borderColor="mukuru.text.error"
                          >
                            <Typography 
                              fontSize="10px" 
                              fontWeight="600" 
                              color="mukuru.text.error"
                              textTransform="uppercase"
                              letterSpacing="0.5px"
                            >
                              Required
                            </Typography>
                          </Box>
                        )}
                      </HStack>
                      <Box
                        px="10px"
                        py="4px"
                        borderRadius="6px"
                        bg={hasValue ? "rgba(16, 185, 129, 0.08)" : "rgba(220, 38, 38, 0.08)"}
                        border="1px solid"
                        borderColor={hasValue ? "mukuru.text.success" : "mukuru.text.error"}
                      >
                        <Typography 
                          fontSize="11px" 
                          fontWeight="600" 
                          color={hasValue ? "mukuru.text.success" : "mukuru.text.error"}
                        >
                          {hasValue ? "Provided" : "Missing"}
                        </Typography>
                      </Box>
                    </Flex>
                    
                    {/* Help text */}
                    {field.helpText && (
                      <Typography fontSize="11px" color="mukuru.grey.medium" mb="10px" lineHeight="1.5">
                        {field.helpText}
                      </Typography>
                    )}
                    
                    {/* Value display */}
                    <Box
                      p="12px 14px"
                      borderRadius="8px"
                      bg={hasValue ? "mukuru.background.light" : "rgba(220, 38, 38, 0.04)"}
                      border="1px solid"
                      borderColor={hasValue ? "mukuru.grey.light" : "mukuru.text.error"}
                    >
                      <Typography 
                        fontSize="13px" 
                        color={hasValue ? "mukuru.text.primary" : "mukuru.text.error"}
                        fontStyle={hasValue ? "normal" : "italic"}
                        lineHeight="1.5"
                      >
                        {hasValue ? String(fieldValue) : "Not provided"}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>
        </Box>
      )}

      {/* Documents Section */}
      {documentFields.length > 0 && (
        <Box
          bg="mukuru.cards.white"
          borderRadius="16px"
          border="1px solid"
          borderColor="mukuru.grey.light"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
          overflow="hidden"
        >
          <Flex 
            p="16px 24px" 
            borderBottom="1px solid" 
            borderColor="mukuru.grey.light" 
            bg="mukuru.background.light"
            align="center"
            justify="space-between"
          >
            <HStack gap="10px">
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg="mukuru.teal"
              />
              <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
                Documents
              </Typography>
            </HStack>
            <Typography fontSize="12px" fontWeight="500" color="mukuru.grey.medium">
              {documentFields.filter(f => {
                const matchingDoc = (documents as Array<Record<string, unknown>>).find(doc => {
                  const reqName = doc.requirementName as string;
                  return reqName === f.label || reqName === requirementMap.get(f.code);
                });
                return !!matchingDoc;
              }).length} / {documentFields.length} uploaded
            </Typography>
          </Flex>
          <Box p="24px">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px">
              {documentFields.map((field) => {
                // Find matching document
                const matchingDoc = (documents as Array<Record<string, unknown>>).find(doc => {
                  const reqName = doc.requirementName as string;
                  return (
                    reqName === field.label ||
                    reqName === requirementMap.get(field.code)
                  );
                });

                const hasDocument = !!matchingDoc;

                return (
                  <Box
                    key={field.code}
                    p="16px"
                    borderRadius="12px"
                    border="1px solid"
                    borderColor={hasDocument ? 'mukuru.grey.light' : 'mukuru.text.error'}
                    bg={hasDocument ? 'mukuru.cards.white' : 'rgba(220, 38, 38, 0.04)'}
                    transition="all 0.2s ease"
                    _hover={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                  >
                    {/* Header row with label and status */}
                    <Flex justify="space-between" align="center" mb="12px">
                      <HStack gap="8px" align="center">
                        <Box
                          w="32px"
                          h="32px"
                          borderRadius="8px"
                          bg={hasDocument ? 'mukuru.background.light' : 'rgba(220, 38, 38, 0.08)'}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <FiFile size={16} color={hasDocument ? 'var(--chakra-colors-mukuru-grey-mediumDark)' : 'var(--chakra-colors-mukuru-text-error)'} />
                        </Box>
                        <Typography 
                          fontSize="13px" 
                          fontWeight="600" 
                          color="mukuru.text.primary"
                          lineHeight="1.4"
                        >
                          {field.label}
                        </Typography>
                        {field.isRequired && (
                          <Box
                            px="8px"
                            py="2px"
                            borderRadius="4px"
                            bg="rgba(220, 38, 38, 0.08)"
                            border="1px solid"
                            borderColor="mukuru.text.error"
                          >
                            <Typography 
                              fontSize="10px" 
                              fontWeight="600" 
                              color="mukuru.text.error"
                              textTransform="uppercase"
                              letterSpacing="0.5px"
                            >
                              Required
                            </Typography>
                          </Box>
                        )}
                      </HStack>
                      <Box
                        px="10px"
                        py="4px"
                        borderRadius="6px"
                        bg={hasDocument ? "rgba(16, 185, 129, 0.08)" : "rgba(220, 38, 38, 0.08)"}
                        border="1px solid"
                        borderColor={hasDocument ? "mukuru.text.success" : "mukuru.text.error"}
                      >
                        <Typography 
                          fontSize="11px" 
                          fontWeight="600" 
                          color={hasDocument ? "mukuru.text.success" : "mukuru.text.error"}
                        >
                          {hasDocument ? "Uploaded" : "Missing"}
                        </Typography>
                      </Box>
                    </Flex>
                    
                    {/* Document name */}
                    {hasDocument && matchingDoc && (
                      <Box mb="10px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        <Typography 
                          fontSize="12px" 
                          fontWeight="500" 
                          color="mukuru.grey.mediumDark"
                          lineHeight="1.4"
                          title={(matchingDoc.fileName || matchingDoc.file_name || matchingDoc.documentNumber || field.label) as string}
                        >
                          {(matchingDoc.fileName || matchingDoc.file_name || matchingDoc.documentNumber || field.label) as string}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Help text */}
                    {field.helpText && (
                      <Typography fontSize="11px" color="mukuru.grey.medium" mb="10px" lineHeight="1.5">
                        {field.helpText}
                      </Typography>
                    )}
                    
                    {/* Action area */}
                    {hasDocument && (
                      <Box mt="4px">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            // Get storageKey from document (try multiple possible field names)
                            const storageKey = matchingDoc.storageKey || matchingDoc.storage_key || matchingDoc.key || matchingDoc.documentKey;
                            // Construct proxy URL from storageKey
                            const url = storageKey 
                              ? `/api/proxy-document?storageKey=${encodeURIComponent(String(storageKey))}`
                              : (matchingDoc.url as string);
                            const name = (matchingDoc.fileName || matchingDoc.file_name) as string || field.label;
                            const type = (matchingDoc.contentType || matchingDoc.content_type || matchingDoc.fileType) as string;
                            const size = (matchingDoc.sizeBytes || matchingDoc.size_bytes || matchingDoc.fileSize) as number;
                            onViewDocument(url, name, type, size);
                          }}
                        >
                          <IconWrapper><FiEye size={14} /></IconWrapper>
                          View Document
                        </Button>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>
        </Box>
      )}

      {informationFields.length === 0 && documentFields.length === 0 && (
        <Box
          bg="mukuru.cards.white"
          borderRadius="16px"
          border="1px solid"
          borderColor="mukuru.grey.light"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
          p="40px"
          textAlign="center"
        >
          <Typography fontSize="14px" color="mukuru.grey.medium">
            No requirements configured for this step.
          </Typography>
        </Box>
      )}

      {/* Step Review Controls */}
      <Box
        bg="mukuru.cards.white"
        borderRadius="16px"
        border="1px solid"
        borderColor="mukuru.grey.light"
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
        overflow="hidden"
      >
        <Flex 
          p="16px 24px" 
          borderBottom="1px solid" 
          borderColor="mukuru.grey.light" 
          bg="mukuru.background.light"
          align="center"
          justify="space-between"
        >
          <HStack gap="10px">
            <Box
              w="8px"
              h="8px"
              borderRadius="full"
              bg="mukuru.teal"
            />
            <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
              Step Review
            </Typography>
          </HStack>
          <Typography fontSize="12px" color="mukuru.grey.medium">
            {[reviewStatus?.completed, reviewStatus?.verified, reviewStatus?.approved].filter(Boolean).length} / 3 completed
          </Typography>
        </Flex>
        <Box p="20px 24px">
          {/* Review Actions - Horizontal Layout */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="12px" mb="16px">
            {/* Completed */}
            <Box
              p="14px"
              borderRadius="10px"
              border="2px solid"
              borderColor={reviewStatus?.completed ? "mukuru.text.success" : "mukuru.grey.light"}
              bg={reviewStatus?.completed ? "rgba(16, 185, 129, 0.08)" : "mukuru.cards.white"}
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{ 
                borderColor: reviewStatus?.completed ? "mukuru.text.success" : "mukuru.buttons.primary",
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
              onClick={() => onReviewStatusChange?.(stepId, 'completed', !reviewStatus?.completed)}
            >
              <HStack gap="10px" align="center">
                <Box
                  w="20px"
                  h="20px"
                  borderRadius="5px"
                  border="2px solid"
                  borderColor={reviewStatus?.completed ? "mukuru.text.success" : "mukuru.grey.medium"}
                  bg={reviewStatus?.completed ? "mukuru.text.success" : "mukuru.cards.white"}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {reviewStatus?.completed && <FiCheck size={12} color="white" />}
                </Box>
                <VStack align="flex-start" gap="0">
                  <Typography fontSize="13px" fontWeight="600" color="mukuru.text.primary">
                    Completed
                  </Typography>
                  <Typography fontSize="10px" color="mukuru.grey.medium">
                    Information reviewed
                  </Typography>
                </VStack>
              </HStack>
            </Box>

            {/* Verified */}
            <Box
              p="14px"
              borderRadius="10px"
              border="2px solid"
              borderColor={reviewStatus?.verified ? "mukuru.teal" : "mukuru.grey.light"}
              bg={reviewStatus?.verified ? "rgba(0, 128, 128, 0.08)" : "mukuru.cards.white"}
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{ 
                borderColor: reviewStatus?.verified ? "mukuru.teal" : "mukuru.buttons.primary",
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
              onClick={() => onReviewStatusChange?.(stepId, 'verified', !reviewStatus?.verified)}
            >
              <HStack gap="10px" align="center">
                <Box
                  w="20px"
                  h="20px"
                  borderRadius="5px"
                  border="2px solid"
                  borderColor={reviewStatus?.verified ? "mukuru.teal" : "mukuru.grey.medium"}
                  bg={reviewStatus?.verified ? "mukuru.teal" : "mukuru.cards.white"}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {reviewStatus?.verified && <FiCheck size={12} color="white" />}
                </Box>
                <VStack align="flex-start" gap="0">
                  <Typography fontSize="13px" fontWeight="600" color="mukuru.text.primary">
                    Verified
                  </Typography>
                  <Typography fontSize="10px" color="mukuru.grey.medium">
                    Data is accurate
                  </Typography>
                </VStack>
              </HStack>
            </Box>

            {/* Approved */}
            <Box
              p="14px"
              borderRadius="10px"
              border="2px solid"
              borderColor={reviewStatus?.approved ? "mukuru.buttons.primary" : "mukuru.grey.light"}
              bg={reviewStatus?.approved ? "rgba(240, 84, 35, 0.08)" : "mukuru.cards.white"}
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{ 
                borderColor: "mukuru.buttons.primary",
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
              onClick={() => onReviewStatusChange?.(stepId, 'approved', !reviewStatus?.approved)}
            >
              <HStack gap="10px" align="center">
                <Box
                  w="20px"
                  h="20px"
                  borderRadius="5px"
                  border="2px solid"
                  borderColor={reviewStatus?.approved ? "mukuru.buttons.primary" : "mukuru.grey.medium"}
                  bg={reviewStatus?.approved ? "mukuru.buttons.primary" : "mukuru.cards.white"}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {reviewStatus?.approved && <FiCheck size={12} color="white" />}
                </Box>
                <VStack align="flex-start" gap="0">
                  <Typography fontSize="13px" fontWeight="600" color="mukuru.text.primary">
                    Approved
                  </Typography>
                  <Typography fontSize="10px" color="mukuru.grey.medium">
                    Ready to proceed
                  </Typography>
                </VStack>
              </HStack>
            </Box>
          </SimpleGrid>

          {/* Notes Field */}
          <Box
            p="14px"
            borderRadius="10px"
            border="1px solid"
            borderColor="mukuru.grey.light"
            bg="mukuru.background.light"
          >
            <Typography fontSize="12px" fontWeight="600" color="mukuru.text.primary" mb="8px">
              Review Notes
            </Typography>
            <Textarea
              placeholder="Add notes about this step..."
              value={reviewStatus?.notes || ''}
              onChange={(e) => onNotesChange?.(stepId, e.target.value)}
              minH="60px"
              borderRadius="8px"
              borderColor="mukuru.grey.light"
              bg="mukuru.cards.white"
              _focus={{ borderColor: 'mukuru.buttons.primary', boxShadow: '0 0 0 1px var(--chakra-colors-mukuru-buttons-primary)' }}
              fontSize="12px"
              resize="none"
            />
          </Box>
        </Box>
      </Box>
    </VStack>
  );
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession(); // Session check for auth
  const { condensed } = useSidebar();
  const workItemId = params?.id as string;
  
  // Get initial step from query parameter
  const initialStep = searchParams?.get('step') ? parseInt(searchParams.get('step')!, 10) : 1;

  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

  const [workItem, setWorkItem] = useState<WorkItemApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | number>(initialStep);
  
  // Wizard-based navigation state
  const [activeWizardStepId, setActiveWizardStepId] = useState<string | null>(null);
  const [loadedWizardSteps, setLoadedWizardSteps] = useState<Set<string>>(new Set());
  const [stepCompletion, setStepCompletion] = useState<Record<string, {
    status: 'complete' | 'partial' | 'incomplete';
    completedCount: number;
    totalCount: number;
    missingRequirements: string[];
  }>>({});

  // Step review status - tracks reviewer actions for each step
  const [stepReviewStatus, setStepReviewStatus] = useState<Record<string, {
    completed: boolean;
    verified: boolean;
    approved: boolean;
    completedAt?: string;
    verifiedAt?: string;
    approvedAt?: string;
    completedBy?: string;
    verifiedBy?: string;
    approvedBy?: string;
    notes?: string;
  }>>({});

  // Review state
  const [reviewNotes, setReviewNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [comments, setComments] = useState<Record<string, unknown>[]>([]);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [newComment, setNewComment] = useState('');

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [submitApprovalModalOpen, setSubmitApprovalModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [refreshModalOpen, setRefreshModalOpen] = useState(false);

  // Assignment state
  const [reassignUserId, setReassignUserId] = useState('');
  const [reassignUserName, setReassignUserName] = useState('');
  const [reviewStarted, setReviewStarted] = useState(false);

  // Document viewer state
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);
  const [viewingDocumentName, setViewingDocumentName] = useState('');
  const [viewingDocumentType, setViewingDocumentType] = useState<string | undefined>(
    undefined
  );
  const [viewingDocumentSize, setViewingDocumentSize] = useState<number | undefined>(
    undefined
  );

  // Documents state
  const [documents, setDocuments] = useState<unknown[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState<unknown>(null);
  const [entitySchema, setEntitySchema] = useState<EntitySchema | null>(null);
  const [requirementMap, setRequirementMap] = useState<Map<string, string>>(new Map());
  // Store full requirement data for validation
  const [entityRequirements, setEntityRequirements] = useState<
    Array<{
      code: string;
      displayName: string;
      description?: string;
      isRequired: boolean;
      type: string;
      fieldType: string;
    }>
  >([]);

  // Risk Assessment state
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentDto | null>(null);
  const [riskAssessmentLoading, setRiskAssessmentLoading] = useState(false);
  const [manualRiskLevel, setManualRiskLevel] = useState<string>('');
  const [riskJustification, setRiskJustification] = useState<string>('');
  const [riskFactors, setRiskFactors] = useState<string>('');
  const [mitigationMeasures, setMitigationMeasures] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [savingRiskAssessment, setSavingRiskAssessment] = useState(false);

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  
  // Ref to store timeout ID for cleanup
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Loading refs to prevent race conditions
  const loadingRefs = useRef({
    applicationData: false,
    documents: false,
    riskAssessment: false,
    workItem: false,
    comments: false,
    history: false,
  });

  const showToast = useCallback((
    title: string,
    description: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 5000
  ) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    setToast({ title, description, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, duration);
  }, []);
  
  // Cleanup toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const loadWorkItem = useCallback(async () => {
    if (loadingRefs.current.workItem) return;
    if (!workItemId) {
      setError('Work item ID is required');
      setLoading(false);
      return;
    }
    
    try {
      loadingRefs.current.workItem = true;
      setLoading(true);
      setError(null);

      // Try to get work item by ID first (assumes it's a work item ID)
      let item: WorkItemApplication;
      try {
        item = await fetchWorkItemById(workItemId);
      } catch (idErr) {
        // If that fails, try as application ID
        console.log('[Review Page] Work item ID lookup failed, trying as application ID:', workItemId);
        try {
          item = await fetchWorkItemByApplicationId(workItemId);
          // If successful, update the URL to use the correct work item ID
          const correctWorkItemId = item.workItemId || item.id;
          if (correctWorkItemId && correctWorkItemId !== workItemId) {
            // Replace URL without page reload
            window.history.replaceState({}, '', `/review/${correctWorkItemId}`);
          }
        } catch (appIdErr) {
          // If both fail, try fallback search
          console.log('[Review Page] Both ID lookups failed, trying fallback search');
          const result = await fetchMyWorkItems(1, 1000);
          const foundItem = result.items.find(
            (w) => w.workItemId === workItemId || w.id === workItemId || w.applicationId === workItemId
          );

          if (!foundItem) {
            // Try getting from all work items
            const allResult = await fetchWorkItems({ pageSize: 1000 });
            const fallbackItem = allResult.items.find(
              (w) => w.workItemId === workItemId || w.id === workItemId || w.applicationId === workItemId
            );

            if (!fallbackItem) {
              setError(`Work item not found. ID: ${workItemId}`);
              return;
            }

            item = fallbackItem;
          } else {
            item = foundItem;
          }
          
          // Update URL to use correct work item ID if found via fallback
          const correctWorkItemId = item.workItemId || item.id;
          if (correctWorkItemId && correctWorkItemId !== workItemId) {
            window.history.replaceState({}, '', `/review/${correctWorkItemId}`);
          }
        }
      }
      
      setWorkItem(item);
    } catch (err) {
      console.error('Error loading work item:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load work item';
      setError(errorMessage);
    } finally {
      setLoading(false);
      loadingRefs.current.workItem = false;
    }
  }, [workItemId]);

  const loadComments = useCallback(async () => {
    if (loadingRefs.current.comments) return;
    
    try {
      loadingRefs.current.comments = true;
      const commentsData = await fetchWorkItemComments(workItemId);
      setComments(commentsData as Record<string, unknown>[]);
    } catch (err) {
      console.error('Error loading comments', err, {
        tags: { error_type: 'comments_load_error' },
      });
      setComments([]);
    } finally {
      loadingRefs.current.comments = false;
    }
  }, [workItemId]);

  const loadHistory = useCallback(async () => {
    if (loadingRefs.current.history) return;
    
    try {
      loadingRefs.current.history = true;
      const historyData = await fetchWorkItemHistory(workItemId);
      setHistory(historyData as Record<string, unknown>[]);
    } catch (err) {
      console.error('Error loading history', err, {
        tags: { error_type: 'history_load_error' },
      });
      setHistory([]);
    } finally {
      loadingRefs.current.history = false;
    }
  }, [workItemId]);

  /**
   * Validates that all required entity requirements are satisfied
   * Returns validation result with missing requirements
   */
  const validateRequirementCompleteness = useCallback((): {
    isValid: boolean;
    missingRequirements: Array<{ code: string; displayName: string }>;
    message: string;
  } => {
    // If no entity requirements configured, skip validation
    if (entityRequirements.length === 0) {
      return { isValid: true, missingRequirements: [], message: '' };
    }

    const missingRequirements: Array<{ code: string; displayName: string }> = [];

    // Get all required document requirements
    const requiredDocs = entityRequirements.filter(
      (req) => req.isRequired && (req.fieldType === 'file' || req.fieldType === 'File')
    );

    // Check if each required document has been uploaded
    const uploadedDocCodes = new Set(
      (documents as Array<Record<string, unknown>>)
        .map((doc) => {
          // Try to find requirement code from document metadata or requirementName
          const reqName = doc.requirementName as string;
          if (reqName) {
            // Find requirement code from requirementMap
            for (const [code, name] of requirementMap.entries()) {
              if (name === reqName) return code;
            }
          }
          // Try to extract from metadata
          const appData = applicationData as Record<string, unknown> | null;
          if (appData?.metadataJson) {
            try {
              const metadata =
                typeof appData.metadataJson === 'string'
                  ? JSON.parse(appData.metadataJson)
                  : appData.metadataJson;
              for (const [key, value] of Object.entries(metadata)) {
                if (
                  value &&
                  String(value).includes(String(doc.id || doc.documentNumber))
                ) {
                  // Check if key matches a requirement code
                  for (const reqCode of requiredDocs.map((r) => r.code)) {
                    if (
                      key.toLowerCase().includes(reqCode.toLowerCase()) ||
                      reqCode.toLowerCase().includes(key.toLowerCase())
                    ) {
                      return reqCode;
                    }
                  }
                }
              }
            } catch {
              // Ignore parse errors
            }
          }
          return null;
        })
        .filter((code): code is string => code !== null)
    );

    // Check each required document
    for (const req of requiredDocs) {
      if (!uploadedDocCodes.has(req.code)) {
        // Also check if any document is mapped to this requirement by name
        const hasMappedDoc = (documents as Array<Record<string, unknown>>).some((doc) => {
          const reqName = doc.requirementName as string;
          return reqName === req.displayName || reqName === requirementMap.get(req.code);
        });

        if (!hasMappedDoc) {
          missingRequirements.push({
            code: req.code,
            displayName: req.displayName,
          });
        }
      }
    }

    const isValid = missingRequirements.length === 0;
    const message = isValid
      ? ''
      : `Missing ${missingRequirements.length} required document(s): ${missingRequirements.map((r) => r.displayName).join(', ')}`;

    return { isValid, missingRequirements, message };
  }, [entityRequirements, documents, requirementMap, applicationData]);

  // Memoize requirements for each step to avoid recalculation
  // MUST be before any early returns to follow Rules of Hooks
  const stepRequirementsMap = useMemo(() => {
    if (!entitySchema?.sections) return new Map<string, RenderableField[]>();
    const map = new Map<string, RenderableField[]>();
    entitySchema.sections.forEach(section => {
      map.set(section.id, section.fields);
    });
    return map;
  }, [entitySchema]);

  // Memoize getRequirementsForStep
  const getRequirementsForStepMemoized = useCallback((stepId: string): RenderableField[] => {
    return stepRequirementsMap.get(stepId) || [];
  }, [stepRequirementsMap]);

  /**
   * Get requirements for a specific wizard step (memoized)
   */
  const getRequirementsForStep = getRequirementsForStepMemoized;

  /**
   * Calculate completion status for a wizard step (memoized)
   */
  const calculateStepCompletion = useCallback((stepId: string): {
    status: 'complete' | 'partial' | 'incomplete';
    completedCount: number;
    totalCount: number;
    missingRequirements: string[];
  } => {
    const requirements = getRequirementsForStep(stepId);
    const requiredFields = requirements.filter(f => f.isRequired);
    const totalCount = requiredFields.length;
    
    if (totalCount === 0) {
      return {
        status: 'complete',
        completedCount: 0,
        totalCount: 0,
        missingRequirements: []
      };
    }

    let completedCount = 0;
    const missingRequirements: string[] = [];

    requiredFields.forEach(field => {
      const isDocument = field.type === 'file' || field.type === 'File';
      let isSatisfied = false;

      if (isDocument) {
        // Check if document exists
        isSatisfied = (documents as Array<Record<string, unknown>>).some(doc => {
          const reqName = doc.requirementName as string;
          return (
            reqName === field.label ||
            reqName === requirementMap.get(field.code)
          );
        });
      } else {
        // Check if information field has value
        const appData = applicationData as Record<string, unknown> | null;
        if (appData?.metadataJson) {
          try {
            const metadata = typeof appData.metadataJson === 'string'
              ? JSON.parse(appData.metadataJson)
              : appData.metadataJson;
            
            // Try multiple possible keys
            const possibleKeys = [
              field.code.toLowerCase(),
              field.code,
              field.label.toLowerCase().replace(/\s+/g, '_'),
              field.label.toLowerCase().replace(/\s+/g, '-'),
            ];
            
            for (const key of possibleKeys) {
              if (metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '') {
                isSatisfied = true;
                break;
              }
            }
            
            // Also check direct field access
            if (!isSatisfied && appData[field.code]) {
              isSatisfied = true;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      if (isSatisfied) {
        completedCount++;
      } else {
        missingRequirements.push(field.label);
      }
    });

    let status: 'complete' | 'partial' | 'incomplete';
    if (completedCount === totalCount) {
      status = 'complete';
    } else if (completedCount > 0) {
      status = 'partial';
    } else {
      status = 'incomplete';
    }

    return {
      status,
      completedCount,
      totalCount,
      missingRequirements
    };
  }, [getRequirementsForStepMemoized, documents, requirementMap, applicationData]);

  /**
   * Calculate completion for all wizard steps
   */
  useEffect(() => {
    if (entitySchema?.wizardConfiguration?.steps && entitySchema.sections) {
      const completion: Record<string, {
        status: 'complete' | 'partial' | 'incomplete';
        completedCount: number;
        totalCount: number;
        missingRequirements: string[];
      }> = {};
      
      entitySchema.wizardConfiguration.steps.forEach(step => {
        if (step.isActive) {
          completion[step.id] = calculateStepCompletion(step.id);
        }
      });

      setStepCompletion(completion);
      
      // Set first wizard step as active if not set
      if (!activeWizardStepId && entitySchema.wizardConfiguration.steps.length > 0) {
        const firstStep = entitySchema.wizardConfiguration.steps
          .filter(s => s.isActive)
          .sort((a, b) => a.stepNumber - b.stepNumber)[0];
        if (firstStep) {
          const firstStepId = `wizard-${firstStep.id}`;
          console.log('[Review Page] Setting initial wizard step:', { firstStepId, wizardStepId: firstStep.id, title: firstStep.title });
          setActiveWizardStepId(String(firstStep.id));
          setCurrentStep(firstStepId);
        }
      }
    }
  }, [entitySchema, documents, applicationData, requirementMap, calculateStepCompletion, activeWizardStepId]);

  /**
   * Lazy load step content when step becomes active
   */
  useEffect(() => {
    if (activeWizardStepId && !loadedWizardSteps.has(activeWizardStepId)) {
      // Mark step as loaded (in a real implementation, you might fetch additional data here)
      setLoadedWizardSteps(prev => new Set([...prev, activeWizardStepId]));
    }
  }, [activeWizardStepId, loadedWizardSteps]);

  /**
   * Jump to first incomplete step
   */
  const jumpToIncompleteStep = useCallback(() => {
    if (!entitySchema?.wizardConfiguration?.steps) return;
    
    const incompleteStep = entitySchema.wizardConfiguration.steps
      .filter(s => s.isActive)
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .find(step => {
        const completion = stepCompletion[step.id];
        return completion?.status !== 'complete';
      });
    
    if (incompleteStep) {
      setActiveWizardStepId(incompleteStep.id);
      setCurrentStep(1); // Switch to wizard steps view
    }
  }, [entitySchema, stepCompletion]);

  const handleApprove = useCallback(async () => {
    if (!workItem) return;

    // Validate requirement completeness before approval
    const validation = validateRequirementCompleteness();
    if (!validation.isValid) {
      showToast('Requirements Not Complete', validation.message, 'error', 7000);
      return;
    }

    setActionLoading(true);
    try {
      await approveWorkItemUseCase(workItem.workItemId || workItem.id, reviewNotes);
      showToast('Approved', 'Work item has been approved successfully', 'success', 3000);
      setApproveModalOpen(false);
      setReviewNotes('');
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to approve work item';
      showToast('Approval failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  }, [workItem, reviewNotes, validateRequirementCompleteness, showToast, loadWorkItem, router]);

  const handleDecline = useCallback(async () => {
    if (!workItem || !declineReason.trim()) return;

    setActionLoading(true);
    try {
      await declineWorkItemUseCase(workItem.workItemId || workItem.id, declineReason);
      showToast('Declined', 'Work item has been declined', 'success', 3000);
      setDeclineModalOpen(false);
      setDeclineReason('');
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to decline work item';
      showToast('Decline failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  }, [workItem, declineReason, showToast, loadWorkItem, router]);

  const handleComplete = useCallback(async () => {
    if (!workItem) return;

    // Validate requirement completeness before completion
    const validation = validateRequirementCompleteness();
    if (!validation.isValid) {
      showToast('Requirements Not Complete', validation.message, 'error', 7000);
      return;
    }

    setActionLoading(true);
    try {
      await completeWorkItemUseCase(workItem.workItemId || workItem.id, reviewNotes);
      showToast(
        'Completed',
        'Work item has been completed successfully',
        'success',
        3000
      );
      setCompleteModalOpen(false);
      setReviewNotes('');
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to complete work item';
      showToast('Completion failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  }, [workItem, reviewNotes, validateRequirementCompleteness, showToast, loadWorkItem, router]);

  const handleSubmitForApproval = useCallback(async () => {
    if (!workItem) return;

    setActionLoading(true);
    try {
      await submitForApprovalUseCase(workItem.workItemId || workItem.id, reviewNotes);
      showToast(
        'Submitted',
        'Work item has been submitted for approval',
        'success',
        3000
      );
      setSubmitApprovalModalOpen(false);
      setReviewNotes('');
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to submit for approval';
      showToast('Submission failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  }, [workItem, reviewNotes, showToast, loadWorkItem, router]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !workItem || !session?.user) return;

    setActionLoading(true);
    try {
      const userId = (session.user as { id?: string }).id || session.user.email || '';
      const userName = session.user.name || session.user.email || 'Current User';
      await addCommentUseCase(workItem.workItemId || workItem.id, newComment, userId, userName);
      showToast('Comment added', 'Your comment has been added', 'success', 3000);
      setNewComment('');
      await loadComments();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      showToast('Comment failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  }, [workItem, newComment, session, showToast, loadComments]);

  // Assign work item to current user
  const handleAssignToMe = useCallback(async () => {
    if (!workItem || !session?.user) return;

    setActionLoading(true);
    try {
      const userId = (session.user as { id?: string }).id || session.user.email || '';
      const userName = session.user.name || session.user.email || 'Current User';
      await assignWorkItemUseCase(workItem.workItemId || workItem.id, userId, userName);
      showToast('Assigned', 'Work item has been assigned to you', 'success', 3000);
      await loadWorkItem();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign work item';
      showToast('Assignment failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  }, [workItem, session, showToast, loadWorkItem]);

  // Load step review status from backend on mount
  useEffect(() => {
    const loadStepReviewStatus = async () => {
      if (workItem?.workItemId || workItem?.id) {
        try {
          const workItemId = workItem.workItemId || workItem.id;
          const status = await getStepReviewStatus(workItemId);
          
          // Transform backend format to frontend format
          const transformed: Record<string, {
            completed: boolean;
            verified: boolean;
            approved: boolean;
            completedAt?: string;
            verifiedAt?: string;
            approvedAt?: string;
            completedBy?: string;
            verifiedBy?: string;
            approvedBy?: string;
            notes?: string;
          }> = {};
          
          for (const [stepId, review] of Object.entries(status)) {
            transformed[stepId] = {
              completed: review.completed ?? false,
              verified: review.verified ?? false,
              approved: review.approved ?? false,
              completedAt: review.completedAt,
              verifiedAt: review.verifiedAt,
              approvedAt: review.approvedAt,
              completedBy: review.completedBy,
              verifiedBy: review.verifiedBy,
              approvedBy: review.approvedBy,
              notes: review.notes,
            };
          }
          
          setStepReviewStatus(transformed);
        } catch (err) {
          // Log warning instead of error - step review status is optional
          // 404 is now handled gracefully in getStepReviewStatus (returns empty object)
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (!errorMessage.includes('404')) {
            console.warn('[Review Page] Failed to load step review status from backend (non-critical):', errorMessage);
          }
          // Don't set error state - step review status is optional, continue with empty object
          // Fallback to localStorage if backend fails (for non-404 errors)
          const storageKey = `workItem_${workItem.workItemId || workItem.id}_stepReviewStatus`;
          try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              const parsed = JSON.parse(stored);
              setStepReviewStatus(parsed);
            } else {
              // Set empty object if no localStorage data
              setStepReviewStatus({});
            }
          } catch (localErr) {
            // If localStorage also fails, just use empty object
            setStepReviewStatus({});
          }
        }
      }
    };
    
    loadStepReviewStatus();
  }, [workItem?.workItemId, workItem?.id]);

  // Handle step review status change
  const handleStepReviewStatusChange = useCallback(async (
    stepId: string,
    field: 'completed' | 'verified' | 'approved',
    value: boolean
  ) => {
    if (!session?.user) {
      showToast('Authentication required', 'Please log in to update review status', 'error', 3000);
      return;
    }

    const userId = (session.user as { id?: string }).id || session.user.email || '';
    const userName = session.user.name || session.user.email || 'Current User';
    const now = new Date().toISOString();

    // Optimistic update
    setStepReviewStatus((prev) => {
      const current = prev[stepId] || {
        completed: false,
        verified: false,
        approved: false,
      };

      const updated = {
        ...current,
        [field]: value,
        [`${field}At`]: value ? now : undefined,
        [`${field}By`]: value ? userId : undefined,
      };

      return {
        ...prev,
        [stepId]: updated,
      };
    });

    // Save to backend
    try {
      const workItemId = workItem?.workItemId || workItem?.id;
      if (workItemId) {
        await updateStepReviewStatus(workItemId, stepId, field, value);
        
        // Also save to localStorage as backup
        setStepReviewStatus((prev) => {
          const storageKey = `workItem_${workItemId}_stepReviewStatus`;
          try {
            localStorage.setItem(storageKey, JSON.stringify(prev));
          } catch (err) {
            console.error('[Review Page] Failed to save step review status to localStorage:', err);
          }
          return prev;
        });
        
        if (value) {
          showToast(
            'Status updated',
            `Step marked as ${field}`,
            'success',
            2000
          );
        } else {
          showToast(
            'Status updated',
            `Step unmarked as ${field}`,
            'success',
            2000
          );
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update review status';
      showToast('Update failed', errorMessage, 'error', 3000);
      
      // Revert optimistic update on error
      setStepReviewStatus((prev) => {
        const current = prev[stepId] || {
          completed: false,
          verified: false,
          approved: false,
        };
        return {
          ...prev,
          [stepId]: {
            ...current,
            [field]: !value,
            [`${field}At`]: current[`${field}At` as keyof typeof current] as string | undefined,
            [`${field}By`]: current[`${field}By` as keyof typeof current] as string | undefined,
          },
        };
      });
    }
  }, [session, showToast, workItem?.workItemId, workItem?.id]);

  // Debounce timer for notes updates
  const notesDebounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Handle notes change with debouncing
  const handleNotesChange = useCallback((stepId: string, notes: string) => {
    if (!session?.user || (!workItem?.workItemId && !workItem?.id)) {
      return;
    }

    // Optimistic update immediately for better UX
    setStepReviewStatus((prev) => {
      const current = prev[stepId] || {
        completed: false,
        verified: false,
        approved: false,
      };

      return {
        ...prev,
        [stepId]: {
          ...current,
          notes,
        },
      };
    });

    // Clear existing debounce timer for this step
    if (notesDebounceTimerRef.current[stepId]) {
      clearTimeout(notesDebounceTimerRef.current[stepId]);
    }

    // Debounce the API call - wait 1 second after user stops typing
    notesDebounceTimerRef.current[stepId] = setTimeout(async () => {
      try {
        const workItemId = workItem?.workItemId || workItem?.id;
        if (workItemId) {
          // Read current state to get the latest field values
          // We'll use a functional update to read the current state
          let currentStatus: typeof stepReviewStatus[string] | undefined;
          setStepReviewStatus((currentState) => {
            currentStatus = currentState[stepId];
            return currentState; // Don't change state, just read it
          });
          
          // Determine which field to use for the update (we need to update at least one field)
          // Use the first available field, or 'completed' as default
          // This ensures we preserve existing field values and don't accidentally change them
          const fieldToUpdate = currentStatus?.completed ? 'completed' : 
                               currentStatus?.verified ? 'verified' : 
                               currentStatus?.approved ? 'approved' : 'completed';
          const valueToUpdate = currentStatus?.[fieldToUpdate] ?? false;
          
          // Update with notes - the backend handler will update notes if provided
          // We use the current field value so it doesn't actually change the field
          await updateStepReviewStatus(workItemId, stepId, fieldToUpdate, valueToUpdate, notes);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update notes';
        console.error('[Review Page] Failed to update notes:', errorMessage);
        // Silently fail for notes to avoid interrupting user's typing
      } finally {
        // Clean up timer reference
        delete notesDebounceTimerRef.current[stepId];
      }
    }, 1000); // 1 second debounce
  }, [session, workItem?.workItemId, workItem?.id]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(notesDebounceTimerRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // Reassign work item to another user
  const handleReassign = useCallback(async () => {
    if (!workItem || !reassignUserId.trim() || !reassignUserName.trim()) return;

    setActionLoading(true);
    try {
      await assignWorkItemUseCase(workItem.workItemId || workItem.id, reassignUserId, reassignUserName);
      showToast('Reassigned', `Work item has been assigned to ${reassignUserName}`, 'success', 3000);
      setReassignModalOpen(false);
      setReassignUserId('');
      setReassignUserName('');
      await loadWorkItem();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reassign work item';
      showToast('Reassignment failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  }, [workItem, reassignUserId, reassignUserName, showToast, loadWorkItem]);

  // Unassign work item
  const handleUnassign = useCallback(async () => {
    if (!workItem) return;

    setActionLoading(true);
    try {
      await unassignWorkItemUseCase(workItem.workItemId || workItem.id);
      showToast('Unassigned', 'Work item has been unassigned', 'success', 3000);
      await loadWorkItem();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unassign work item';
      showToast('Unassign failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  }, [workItem, showToast, loadWorkItem]);

  // Start review
  const handleStartReview = useCallback(async () => {
    if (!workItem || reviewStarted) return;

    // Don't try to start if already in progress
    const status = workItem.status?.toLowerCase();
    if (status === 'inprogress' || status === 'in_progress') {
      setReviewStarted(true);
      return;
    }

    try {
      await startReviewUseCase(workItem.workItemId || workItem.id);
      setReviewStarted(true);
      showToast('Review Started', 'You have started reviewing this work item', 'info', 3000);
      await loadWorkItem();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start review';
      // If already in progress, just mark as started
      if (errorMessage.includes('InProgress') || errorMessage.includes('already')) {
        setReviewStarted(true);
        return;
      }
      console.error('Failed to start review:', err);
      // Don't show error toast - this might fail if already started
    }
  }, [workItem, reviewStarted, showToast, loadWorkItem]);

  // Mark for refresh
  const handleMarkForRefresh = useCallback(async () => {
    if (!workItem) return;

    setActionLoading(true);
    try {
      await markForRefreshUseCase(workItem.workItemId || workItem.id);
      showToast('Marked for Refresh', 'Work item has been marked for document refresh', 'success', 3000);
      setRefreshModalOpen(false);
      await loadWorkItem();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark for refresh';
      showToast('Refresh failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  }, [workItem, showToast, loadWorkItem]);

  const loadApplicationData = useCallback(async () => {
    if (!workItem || loadingRefs.current.applicationData) return;

    try {
      loadingRefs.current.applicationData = true;
      // Always use applicationId - never fall back to work item ID
      const caseId = workItem.applicationId;
      if (!caseId) {
        console.warn('[Review Page] Cannot load application data: applicationId is missing', { workItem });
        return;
      }

      // Fetch application data
      const response = await fetch(`/api/applications/${caseId}`);
      if (response.ok) {
        const appData = await response.json();
        setApplicationData(appData);

        // Extract entity type code from metadata
        const metadata = appData.metadataJson ? JSON.parse(appData.metadataJson) : {};
        let entityTypeCode = metadata.entity_type_code || metadata.entityTypeCode;

        // Clean up entity type code - remove commas, extra spaces, and take first value if it's a list
        if (entityTypeCode) {
          // If it contains a comma, split and take the first part
          if (typeof entityTypeCode === 'string' && entityTypeCode.includes(',')) {
            entityTypeCode = entityTypeCode.split(',')[0].trim();
          }
          // Ensure it's a string and trim whitespace
          entityTypeCode = String(entityTypeCode).trim();
        }

        console.info('[Review Page] Extracted entity type code', { entityTypeCode });

        if (entityTypeCode) {
          // Log application data structure for debugging
          console.log('[Review Page] Application data structure:', {
            rootKeys: Object.keys(appData).slice(0, 30),
            businessLegalName: appData.businessLegalName,
            businessRegistrationNumber: appData.businessRegistrationNumber,
            businessAddress: appData.businessAddress,
            metadataJson: appData.metadataJson ? (typeof appData.metadataJson === 'string' ? 'string (parsed below)' : 'object') : 'missing',
            metadataKeys: appData.metadataJson ? Object.keys(typeof appData.metadataJson === 'string' ? JSON.parse(appData.metadataJson) : appData.metadataJson).slice(0, 30) : [],
            metadataSample: appData.metadataJson ? (() => {
              const meta = typeof appData.metadataJson === 'string' ? JSON.parse(appData.metadataJson) : appData.metadataJson;
              return {
                registration_number: meta.registration_number,
                registered_address: meta.registered_address,
                legal_name: meta.legal_name,
                businessLegalName: meta.businessLegalName,
                businessRegistrationNumber: meta.businessRegistrationNumber,
                businessAddress: meta.businessAddress,
              };
            })() : {},
          });
          
          // Fetch entity schema with wizard configuration support
          const schema = await fetchEntitySchema(entityTypeCode, appData, true);
          if (schema) {
            console.log('[Review Page] Entity schema loaded:', {
              hasWizardConfig: !!schema.wizardConfiguration,
              wizardStepsCount: schema.wizardConfiguration?.steps?.length || 0,
              sectionsCount: schema.sections?.length || 0,
              wizardSteps: schema.wizardConfiguration?.steps,
            });
            
            // Log requirement codes and their mapped values
            console.log('[Review Page] Requirement codes and mapped values:');
            schema.sections.forEach((section) => {
              section.fields.forEach((field) => {
                console.log(`  - ${field.code} (${field.label}):`, {
                  value: field.value,
                  hasValue: field.value !== null && field.value !== undefined && field.value !== '',
                  type: field.type,
                });
              });
            });
            
            setEntitySchema(schema);

            // Create requirement code to display name map for document mapping
            const reqMap = new Map<string, string>();
            // Store full requirement data for validation - include ALL requirements (documents and information)
            const requirements: Array<{
              code: string;
              displayName: string;
              description?: string;
              isRequired: boolean;
              type: string;
              fieldType: string;
            }> = [];

            schema.sections.forEach((section) => {
              section.fields.forEach((field) => {
                // Map documents for document matching
                if (field.type === 'file' || field.type === 'File') {
                  reqMap.set(field.code, field.label);
                }
                // Include ALL required fields (both documents and information)
                if (field.isRequired) {
                  requirements.push({
                    code: field.code,
                    displayName: field.label,
                    description: field.helpText,
                    isRequired: field.isRequired,
                    type: field.type || 'text',
                    fieldType: field.type || 'text', // Use type as fieldType since RenderableField doesn't have fieldType
                  });
                }
              });
            });
            setRequirementMap(reqMap);
            setEntityRequirements(requirements);

            console.info('[Review Page] Loaded entity requirements:', {
              totalRequirements: requirements.length,
              requiredCount: requirements.filter((r) => r.isRequired).length,
              wizardSteps: schema.wizardConfiguration?.steps?.length || 0,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error loading application data', err, {
        tags: { error_type: 'application_data_load_error' },
      });
    } finally {
      loadingRefs.current.applicationData = false;
    }
  }, [workItem]);

  const loadDocuments = useCallback(async () => {
    if (!workItem || loadingRefs.current.documents) return;

    try {
      loadingRefs.current.documents = true;
      setDocumentsLoading(true);
      setDocumentsError(null);

      // Try to get applicationId or caseId from work item
      const caseId = workItem.applicationId || workItem.id;

      if (!caseId) {
        setDocumentsError('No application ID found');
        return;
      }

      // Fetch documents for this case
      const response = await fetch(`/api/proxy/api/v1/documents/case/${caseId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setDocuments([]);
          return;
        }
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }

      const documentsData = await response.json();

      let docs: unknown[] = [];
      if (Array.isArray(documentsData)) {
        docs = documentsData;
      } else if (documentsData.items && Array.isArray(documentsData.items)) {
        docs = documentsData.items;
      }

      // Map documents to requirements based on application metadata
      if (applicationData && requirementMap.size > 0) {
        const appData = applicationData as Record<string, unknown>;
        const metadata =
          appData.metadataJson && typeof appData.metadataJson === 'string'
            ? JSON.parse(appData.metadataJson)
            : {};

        logger.debug('[Document Mapping] Application metadata keys', {
          keys: Object.keys(metadata),
        });
        logger.debug('[Document Mapping] Requirement map', {
          entries: Array.from(requirementMap.entries()),
        });
        logger.debug('[Document Mapping] Documents to map', {
          docs: docs.map((d) => {
            const doc = d as Record<string, unknown>;
            return {
              id: doc.id,
              fileName: doc.fileName,
              documentNumber: doc.documentNumber,
              storageKey: doc.storageKey,
              type: doc.type,
            };
          }),
        });

        docs = docs.map((doc) => {
          const docObj = doc as Record<string, unknown>;
          // Try to find which requirement this document belongs to
          let requirementName: string | null = null;

          const docFileName = (
            docObj.fileName ? String(docObj.fileName) : ''
          ).toLowerCase();
          const docNumber = (
            docObj.documentNumber ? String(docObj.documentNumber) : ''
          ).toLowerCase();
          const docId = docObj.id ? String(docObj.id).toLowerCase() : '';
          const docStorageKey = (
            docObj.storageKey ? String(docObj.storageKey) : ''
          ).toLowerCase();

          // First, check for document ID patterns: ${requirementCode}_document_id
          for (const [reqCode, reqName] of requirementMap.entries()) {
            // Check for document_id and storage_key patterns
            const docIdKey = `${reqCode}_document_id`;
            const storageKeyKey = `${reqCode}_storage_key`;

            // Try various case variations
            const possibleDocIdKeys = [
              docIdKey,
              docIdKey.toLowerCase(),
              docIdKey.toUpperCase(),
              docIdKey.replace(/_/g, ''),
              docIdKey.replace(/_/g, '-'),
            ];

            const possibleStorageKeys = [
              storageKeyKey,
              storageKeyKey.toLowerCase(),
              storageKeyKey.toUpperCase(),
              storageKeyKey.replace(/_/g, ''),
              storageKeyKey.replace(/_/g, '-'),
            ];

            // Check document ID match
            for (const key of possibleDocIdKeys) {
              const safeKey = key as keyof typeof metadata;
              const metadataDocId = metadata[safeKey];
              if (metadataDocId) {
                const metadataDocIdStr = String(metadataDocId).toLowerCase();
                if (metadataDocIdStr === docId || docId === metadataDocIdStr) {
                  requirementName = reqName;
                  logger.debug(
                    `[Document Mapping] ✅ Matched ${docObj.fileName ? String(docObj.fileName) : 'unknown'} to ${reqName} via ${key}`
                  );
                  break;
                }
              }
            }

            if (requirementName) break;

            // Check storage key match
            for (const key of possibleStorageKeys) {
              const safeKey = key as keyof typeof metadata;
              const metadataStorageKey = metadata[safeKey];
              if (metadataStorageKey) {
                const metadataStorageKeyStr = String(metadataStorageKey).toLowerCase();
                if (
                  metadataStorageKeyStr === docStorageKey ||
                  docStorageKey.includes(metadataStorageKeyStr)
                ) {
                  requirementName = reqName;
                  console.info(
                    `[Document Mapping] ✅ Matched ${docObj.fileName ? String(docObj.fileName) : 'unknown'} to ${reqName} via storage key ${key}`
                  );
                  break;
                }
              }
            }

            if (requirementName) break;
          }

          // If not found by document_id pattern, check direct requirement code values
          if (!requirementName) {
            for (const [reqCode, reqName] of requirementMap.entries()) {
              // Try multiple metadata key variations
              const possibleKeys = [
                reqCode,
                reqCode.toLowerCase(),
                reqCode.toUpperCase(),
                reqCode.replace(/_/g, ''),
                reqCode.replace(/_/g, '-'),
                reqCode.replace(/_/g, ' '),
              ];

              for (const key of possibleKeys) {
                const safeKey = key as keyof typeof metadata;
                const metadataValue = metadata[safeKey];
                if (metadataValue) {
                  const metadataStr = String(metadataValue).toLowerCase();

                  // Match if filename, document number, document ID, or storage key appears in metadata
                  if (
                    metadataStr.includes(docFileName) ||
                    metadataStr.includes(docNumber) ||
                    metadataStr.includes(docId) ||
                    metadataStr.includes(docStorageKey) ||
                    docFileName.includes(metadataStr) ||
                    docNumber.includes(metadataStr)
                  ) {
                    requirementName = reqName;
                    logger.debug(
                      `[Document Mapping] ✅ Matched ${docObj.fileName ? String(docObj.fileName) : 'unknown'} to ${reqName} via ${key}`
                    );
                    break;
                  }

                  // Also check if metadata value is a JSON string containing document info
                  try {
                    const parsed =
                      typeof metadataValue === 'string'
                        ? JSON.parse(metadataValue)
                        : metadataValue;
                    if (typeof parsed === 'object' && parsed !== null) {
                      const parsedStr = JSON.stringify(parsed).toLowerCase();
                      if (
                        parsedStr.includes(docFileName) ||
                        parsedStr.includes(docNumber) ||
                        parsedStr.includes(docId) ||
                        parsedStr.includes(docStorageKey)
                      ) {
                        requirementName = reqName;
                        console.info(
                          `[Document Mapping] ✅ Matched ${docObj.fileName ? String(docObj.fileName) : 'unknown'} to ${reqName} via JSON in ${key}`
                        );
                        break;
                      }
                    }
                  } catch {
                    // Not JSON, continue
                  }
                }
              }

              if (requirementName) break;
            }
          }

          // If still not found, check all metadata values for any document reference
          if (!requirementName) {
            for (const [key, value] of Object.entries(metadata)) {
              if (!value) continue;

              const valueStr = String(value).toLowerCase();
              // Check if this metadata value contains any document identifier
              if (
                valueStr.includes(docFileName) ||
                valueStr.includes(docNumber) ||
                valueStr.includes(docId) ||
                valueStr.includes(docStorageKey)
              ) {
                // Try to find which requirement this key belongs to
                for (const [reqCode, reqName] of requirementMap.entries()) {
                  if (
                    key.toLowerCase().includes(reqCode.toLowerCase()) ||
                    reqCode.toLowerCase().includes(key.toLowerCase())
                  ) {
                    requirementName = reqName;
                    console.info(
                      `[Document Mapping] ✅ Matched ${docObj.fileName ? String(docObj.fileName) : 'unknown'} to ${reqName} via metadata key ${key}`
                    );
                    break;
                  }
                }
                if (requirementName) break;
              }
            }
          }

          if (!requirementName) {
            logger.debug(
              `[Document Mapping] ⚠️ Could not match ${docObj.fileName ? String(docObj.fileName) : 'unknown'} to any requirement`
            );
          }

          return {
            ...docObj,
            requirementName: requirementName || null,
          };
        });
      }

      // Log document data for debugging
      console.log('[Review Page] Loaded documents:', {
        count: docs.length,
        documents: docs.map((d) => {
          const doc = d as Record<string, unknown>;
          return {
            id: doc.id,
            fileName: doc.fileName,
            documentNumber: doc.documentNumber,
            type: doc.type,
            storageKey: doc.storageKey ? 'present' : 'missing',
            storage_key: doc.storage_key ? 'present' : 'missing',
            key: doc.key ? 'present' : 'missing',
            requirementName: doc.requirementName,
            sizeBytes: doc.sizeBytes,
            allKeys: Object.keys(doc),
          };
        }),
      });

      setDocuments(docs);
    } catch (err) {
      logger.error(err, 'Error loading documents', {
        tags: { error_type: 'documents_load_error' },
      });
      setDocumentsError(err instanceof Error ? err.message : 'Failed to load documents');
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
      loadingRefs.current.documents = false;
    }
  }, [workItem, applicationData, requirementMap]);

  const handleViewDocument = useCallback(async (document: Record<string, unknown>) => {
    try {
      console.log('[Document Viewer] Attempting to view document:', {
        id: document.id,
        fileName: document.fileName,
        documentNumber: document.documentNumber,
        storageKey: document.storageKey,
        type: document.type,
        hasStorageKey: !!document.storageKey,
        allKeys: Object.keys(document),
      });

      if (!document) {
        console.error('[Document Viewer] No document provided');
        showToast('Document error', 'No document provided', 'error', 3000);
        return;
      }

      // Try multiple possible storage key field names
      const storageKey =
        document.storageKey ||
        document.storage_key ||
        document.storageKey ||
        document.key ||
        document.documentKey;

      if (!storageKey) {
        console.error('[Document Viewer] Document missing storageKey:', {
          document,
          availableKeys: Object.keys(document),
        });
        showToast(
          'Document error',
          'Document storage key not found. Document may not be available for viewing.',
          'error',
          5000
        );
        return;
      }

      // Get document download URL through proxy
      const downloadUrl = `/api/proxy-document?storageKey=${encodeURIComponent(String(storageKey))}`;

      const fileName =
        document.fileName ||
        document.file_name ||
        document.documentNumber ||
        document.document_number ||
        document.name ||
        'Document';

      console.log('[Document Viewer] Setting up viewer:', {
        downloadUrl,
        fileName,
        type: document.type,
        storageKey: String(storageKey).substring(0, 50) + '...',
      });

      setViewingDocumentUrl(downloadUrl);
      setViewingDocumentName(String(fileName));
      setViewingDocumentType(document.type ? String(document.type) : undefined);
      setViewingDocumentSize(
        (document.sizeBytes || document.size_bytes || document.size) as
          | number
          | undefined
      );
      
      // Force the modal to open
      setDocumentViewerOpen(true);

      console.log('[Document Viewer] Viewer state updated, modal should open');
    } catch (err) {
      console.error('[Document Viewer] Error viewing document:', err);
      logger.error(err, 'Error viewing document', {
        tags: { error_type: 'document_view_error' },
      });
      showToast(
        'View failed',
        err instanceof Error ? err.message : 'Failed to view document',
        'error',
        5000
      );
    }
  }, [showToast]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'] as const;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const validIndex = i >= 0 && i < sizes.length ? i : 0;
    return (
      Math.round((bytes / Math.pow(k, validIndex)) * 100) / 100 + ' ' + sizes[validIndex]
    );
  };

  const getDocumentTypeName = (doc: Record<string, unknown>): string => {
    // First try to use requirement name if available
    if (doc.requirementName && typeof doc.requirementName === 'string' && doc.requirementName.trim() !== '') {
      return doc.requirementName;
    }

    // Try to extract from document type enum
    if (doc.type !== undefined && doc.type !== null) {
      const typeMap: Record<number, string> = {
        1: 'Passport Copy',
        2: 'Drivers License',
        3: 'National ID',
        4: 'Proof of Address',
        5: 'Bank Statement',
        6: 'Tax Document',
        7: 'Business Registration',
        8: 'Articles of Incorporation',
        9: 'Shareholder Registry',
        10: 'Financial Statements',
        99: 'Other',
      };
      
      // Handle both number and string types
      let docType: number | null = null;
      if (typeof doc.type === 'number') {
        docType = doc.type;
      } else if (typeof doc.type === 'string') {
        const parsed = parseInt(doc.type, 10);
        if (!isNaN(parsed)) {
          docType = parsed;
        }
      }
      
      if (docType !== null && docType in typeMap) {
        return typeMap[docType];
      }
    }

    // Try to infer from file name patterns
    const fileName = doc.fileName ? String(doc.fileName).toLowerCase() : '';
    if (fileName) {
      if (fileName.includes('passport') || fileName.includes('pass')) return 'Passport Copy';
      if (fileName.includes('national') || fileName.includes('nation') || fileName.includes('id') || fileName.includes('identity')) return 'National ID';
      if (fileName.includes('driver') || fileName.includes('license') || fileName.includes('licence')) return 'Drivers License';
      if (fileName.includes('address') || fileName.includes('proof')) return 'Proof of Address';
      if (fileName.includes('bank') || fileName.includes('statement')) return 'Bank Statement';
      if (fileName.includes('tax') || fileName.includes('clearance')) return 'Tax Document';
      if (fileName.includes('registration') || fileName.includes('register')) return 'Business Registration';
      if (fileName.includes('incorporation') || fileName.includes('articles')) return 'Articles of Incorporation';
      if (fileName.includes('shareholder') || fileName.includes('share')) return 'Shareholder Registry';
      if (fileName.includes('financial') || fileName.includes('statement')) return 'Financial Statements';
    }

    // If we have a document number, try to use that
    if (doc.documentNumber && typeof doc.documentNumber === 'string') {
      return 'Document';
    }

    return 'Document';
  };

  const loadRiskAssessment = useCallback(async () => {
    if (!workItem || loadingRefs.current.riskAssessment) return;

    try {
      loadingRefs.current.riskAssessment = true;
      setRiskAssessmentLoading(true);
      const caseId = workItem.applicationId || workItem.id;

      if (!caseId || caseId.toString().trim() === '') {
        console.warn('[Risk Assessment] No valid caseId found:', {
          applicationId: workItem.applicationId,
          id: workItem.id,
        });
        setRiskAssessment(null);
        return;
      }

      // Clean caseId - remove any leading/trailing whitespace or special characters
      const cleanCaseId = caseId.toString().trim().replace(/^_+/, ''); // Remove leading underscores

      // Try to get risk assessment by case ID
      // Risk assessments are only created manually - we only fetch here, never create
      const assessment = await riskApiService
        .getRiskAssessmentByCase(cleanCaseId)
        .catch(() => null);

      if (assessment) {
        // assessment is already a RiskAssessmentDto, use it directly
        setRiskAssessment(assessment);
        setManualRiskLevel(assessment.overallRiskLevel);

        // Extract justification and enhanced risk analysis fields from notes if they exist
        if (assessment.notes && assessment.notes.includes('MANUAL CLASSIFICATION:')) {
          const fullNotes =
            assessment.notes.split('MANUAL CLASSIFICATION:')[1]?.trim() || '';

          // Parse enhanced risk analysis sections
          const riskFactorsMatch = fullNotes.match(
            /RISK FACTORS IDENTIFIED:\s*\n([\s\S]*?)(?:\n\nMITIGATION MEASURES:|$)/
          );
          const mitigationMatch = fullNotes.match(
            /MITIGATION MEASURES:\s*\n([\s\S]*?)(?:\n\nADDITIONAL NOTES:|$)/
          );
          const additionalNotesMatch = fullNotes.match(
            /ADDITIONAL NOTES:\s*\n([\s\S]*?)$/
          );

          // Extract main justification (everything before RISK FACTORS IDENTIFIED)
          const mainJustification = riskFactorsMatch
            ? fullNotes.substring(0, fullNotes.indexOf('RISK FACTORS IDENTIFIED:')).trim()
            : fullNotes.trim();

          setRiskJustification(mainJustification);

          // Set enhanced risk analysis fields if they exist
          if (riskFactorsMatch) {
            setRiskFactors(riskFactorsMatch[1]?.trim() || '');
          }
          if (mitigationMatch) {
            setMitigationMeasures(mitigationMatch[1]?.trim() || '');
          }
          if (additionalNotesMatch) {
            setAdditionalNotes(additionalNotesMatch[1]?.trim() || '');
          }
        } else if (assessment.notes) {
          // If notes exist but don't have MANUAL CLASSIFICATION prefix, use them as justification
          setRiskJustification(assessment.notes);
        }
      } else {
        setRiskAssessment(null);
        // Initialize with current work item risk level if available
        if (workItem.riskLevel) {
          setManualRiskLevel(workItem.riskLevel);
        }
      }
    } catch (err) {
      // Only log non-404 errors (404s are expected when no assessment exists yet)
      if (
        err instanceof Error &&
        !err.message.includes('404') &&
        !err.message.includes('Not Found')
      ) {
        logger.error(err, 'Error loading risk assessment', {
          tags: { error_type: 'risk_assessment_load_error' },
        });
      }
      setRiskAssessment(null);
    } finally {
      setRiskAssessmentLoading(false);
      loadingRefs.current.riskAssessment = false;
    }
  }, [workItem, applicationData]);

  const handleSaveRiskAssessment = useCallback(async () => {
    if (!workItem || !manualRiskLevel || !riskJustification.trim()) {
      showToast(
        'Validation Error',
        'Please select a risk level and provide a justification',
        'error',
        5000
      );
      return;
    }

    // Note: Enhanced risk analysis fields are optional - no validation required

    try {
      setSavingRiskAssessment(true);

      const caseId = workItem.applicationId || workItem.id;

      if (!caseId) {
        throw new Error('Case ID not found');
      }

      // Clean caseId - remove any leading/trailing whitespace or special characters
      const cleanCaseId = caseId.toString().trim().replace(/^_+/, ''); // Remove leading underscores

      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('[Risk Assessment] Saving with caseId:', {
          original: caseId,
          cleaned: cleanCaseId,
          applicationId: workItem.applicationId,
          workItemId: workItem.id,
        });
      }

      // Get or create basic risk assessment for saving risk level
      // The basic assessment is created when saving risk level
      // Enhanced Risk Assessment form is accessed separately via explicit button
      let assessmentId = riskAssessment?.id;

      if (!assessmentId) {
        // Try to find existing assessment
        let existing = await riskApiService
          .getRiskAssessmentByCase(cleanCaseId)
          .catch(() => null);

        if (!existing) {
          // Create basic risk assessment for saving the risk level
          const appData = applicationData as Record<string, unknown> | null;
          const partnerId =
            (appData?.partnerId as string) ||
            (appData?.partner_id as string) ||
            (appData?.metadataJson && typeof appData.metadataJson === 'string'
              ? ((JSON.parse(appData.metadataJson) as Record<string, unknown>)
                  ?.partnerId as string)
              : null) ||
            '';

          // Log creation attempt
          if (process.env.NODE_ENV === 'development') {
            console.log('[Risk Assessment] Creating assessment:', {
              caseId: cleanCaseId,
              partnerId: partnerId || '(empty)',
              hasPartnerId: !!partnerId,
            });
          }

          try {
            const created = await riskApiService.createRiskAssessment(cleanCaseId, partnerId);

            if (created && typeof created === 'object' && created.id) {
              assessmentId = created.id as string;
              // Fetch the full assessment after a brief delay
              await new Promise((resolve) => setTimeout(resolve, 300));
              existing = await riskApiService
                .getRiskAssessmentByCase(cleanCaseId)
                .catch(() => null);
              
              if (existing) {
                setRiskAssessment(existing);
                assessmentId = existing.id;
              } else if (assessmentId) {
                // If we have the ID but fetch failed, try to use the created object
                setRiskAssessment(created);
              }
            } else {
              // Creation returned null (already exists) - try to fetch it
              existing = await riskApiService
                .getRiskAssessmentByCase(cleanCaseId)
                .catch(() => null);
              
              if (existing) {
                assessmentId = existing.id;
                setRiskAssessment(existing);
              }
            }
          } catch (createError) {
            // Log the error for debugging
            if (process.env.NODE_ENV === 'development') {
              console.error('[Risk Assessment] Creation error:', {
                error: createError,
                caseId: cleanCaseId,
                partnerId: partnerId || '(empty)',
                errorMessage: createError instanceof Error ? createError.message : String(createError),
              });
            }

            // If creation fails, try to fetch in case it was created by another process
            const fetched = await riskApiService
              .getRiskAssessmentByCase(cleanCaseId)
              .catch(() => null);
            
            if (fetched) {
              existing = fetched;
              assessmentId = fetched.id;
              setRiskAssessment(fetched);
            } else {
              // Creation failed and no existing assessment found
              const errorMessage = createError instanceof Error 
                ? createError.message 
                : 'Unknown error';
              
              // Check if it's a validation error (400) vs server error
              if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
                showToast(
                  'Validation Error',
                  'Invalid case ID or partner ID format. Please check the case information.',
                  'error',
                  5000
                );
              } else {
                showToast(
                  'Error',
                  `Failed to create risk assessment: ${errorMessage}. Please try again or contact support.`,
                  'error',
                  5000
                );
              }
              setSavingRiskAssessment(false);
              return;
            }
          }
        } else {
          assessmentId = existing.id;
          setRiskAssessment(existing);
        }

        if (!assessmentId) {
          showToast(
            'Error',
            'Unable to create or find risk assessment. Please try again or contact support.',
            'error',
            5000
          );
          setSavingRiskAssessment(false);
          return;
        }
      }

      // Build comprehensive justification including enhanced risk analysis fields
      let fullJustification = riskJustification;

      if (manualRiskLevel === 'High' || manualRiskLevel === 'MediumHigh') {
        const enhancedAnalysis: string[] = [];

        if (riskFactors.trim()) {
          enhancedAnalysis.push(`\n\nRISK FACTORS IDENTIFIED:\n${riskFactors.trim()}`);
        }

        if (mitigationMeasures.trim()) {
          enhancedAnalysis.push(`\n\nMITIGATION MEASURES:\n${mitigationMeasures.trim()}`);
        }

        if (additionalNotes.trim()) {
          enhancedAnalysis.push(`\n\nADDITIONAL NOTES:\n${additionalNotes.trim()}`);
        }

        if (enhancedAnalysis.length > 0) {
          fullJustification += enhancedAnalysis.join('');
        }
      }

      // Set manual risk level
      await riskApiService.setManualRiskLevel(
        assessmentId,
        manualRiskLevel,
        fullJustification
      );

      showToast(
        'Risk Assessment Saved',
        'Manual risk level has been saved successfully',
        'success',
        3000
      );

      // Reload risk assessment and work item
      await loadRiskAssessment();
      await loadWorkItem();
    } catch (err: unknown) {
      logger.error(err, 'Error saving risk assessment', {
        tags: { error_type: 'risk_assessment_save_error' },
      });
      showToast(
        'Save Failed',
        err instanceof Error ? err.message : 'Failed to save risk assessment',
        'error',
        5000
      );
    } finally {
      setSavingRiskAssessment(false);
    }
  }, [workItem, manualRiskLevel, riskJustification, riskFactors, mitigationMeasures, additionalNotes, riskAssessment, applicationData, showToast, loadRiskAssessment, loadWorkItem]);

  // useEffect hooks - placed after all function declarations
  useEffect(() => {
    if (workItemId) {
      loadWorkItem();
      loadComments();
      loadHistory();
    }
  }, [workItemId, loadWorkItem, loadComments, loadHistory]);

  useEffect(() => {
    // Load application data and entity schema when work item is loaded
    if (workItem) {
      loadApplicationData();
      // Review is started manually from the work queue page, not automatically here
    }
  }, [workItem, loadApplicationData]);

  useEffect(() => {
    // Load documents when Documents step is active and work item is loaded (fallback mode only)
    if ((currentStep === 2 || (typeof currentStep === 'number' && currentStep === 2)) && workItem && !entitySchema?.wizardConfiguration) {
      loadDocuments();
    }
    // Load documents when wizard step is active
    if (typeof currentStep === 'string' && currentStep.startsWith('wizard-') && activeWizardStepId && workItem) {
      loadDocuments();
    }
  }, [currentStep, workItem, applicationData, requirementMap, loadDocuments, entitySchema, activeWizardStepId]);

  useEffect(() => {
    // Load risk assessment when Risk Assessment step is active and work item is loaded
    if ((currentStep === 3 || currentStep === 'risk-assessment') && workItem) {
      loadRiskAssessment();
    }
  }, [currentStep, workItem, applicationData, loadRiskAssessment]);

  useEffect(() => {
    // Clear enhanced risk analysis fields when risk level changes away from HIGH/CRITICAL
    if (manualRiskLevel && manualRiskLevel !== 'High' && manualRiskLevel !== 'MediumHigh') {
      setRiskFactors('');
      setMitigationMeasures('');
      setAdditionalNotes('');
    }
  }, [manualRiskLevel]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUBMITTED: 'blue',
      'IN PROGRESS': 'orange',
      'RISK REVIEW': 'red',
      COMPLETE: 'green',
      DECLINED: 'red',
      INCOMPLETE: 'gray',
    };
    const validStatus = status in colors ? status : null;
    return validStatus !== null ? colors[validStatus] : 'gray';
  };

  const getRiskColor = (riskLevel?: string) => {
    const risk = riskLevel?.toLowerCase() || 'low';
    if (risk.includes('high') || risk.includes('critical')) return 'red';
    if (risk.includes('medium')) return 'orange';
    return 'green';
  };

  // Build review steps: wizard steps + fixed steps (Risk Assessment, Review & Decision)
  const reviewSteps = useMemo(() => {
    const steps: Array<{ id: number | string; title: string; icon: typeof FiFileText; isWizardStep?: boolean; wizardStepId?: string }> = [];
    
    console.log('[Review Steps] Building review steps:', {
      hasEntitySchema: !!entitySchema,
      hasWizardConfig: !!entitySchema?.wizardConfiguration,
      wizardStepsCount: entitySchema?.wizardConfiguration?.steps?.length || 0,
      wizardSteps: entitySchema?.wizardConfiguration?.steps,
    });
    
    // Add wizard steps if available
    if (entitySchema?.wizardConfiguration?.steps && entitySchema.wizardConfiguration.steps.length > 0) {
      // Show ALL wizard steps, not just active ones (for review purposes)
      // The backend might have inactive steps, but we want to show them for review
      const allWizardSteps = entitySchema.wizardConfiguration.steps
        .sort((a, b) => a.stepNumber - b.stepNumber);
      
      const activeWizardSteps = allWizardSteps.filter(s => s.isActive);
      
      console.log('[Review Steps] Found wizard steps:', {
        total: entitySchema.wizardConfiguration.steps.length,
        active: activeWizardSteps.length,
        allSteps: allWizardSteps.map(s => ({
          id: s.id,
          title: s.title,
          isActive: s.isActive,
          stepNumber: s.stepNumber,
        })),
      });
      
      // Use active steps if available, otherwise use all steps (for review)
      const wizardStepsToShow = activeWizardSteps.length > 0 ? activeWizardSteps : allWizardSteps;
      
      if (wizardStepsToShow.length > 0) {
        console.log('[Review Steps] Processing wizard steps:', wizardStepsToShow.map(s => ({ id: s.id, title: s.title, stepNumber: s.stepNumber, isActive: s.isActive })));
        wizardStepsToShow.forEach((wizardStep) => {
          // Use the wizard step ID directly (it's a GUID string)
          const stepId = `wizard-${wizardStep.id}`;
          steps.push({
            id: stepId,
            title: wizardStep.title,
            icon: FiFileText, // Default icon, can be customized per step
            isWizardStep: true,
            wizardStepId: String(wizardStep.id), // Ensure it's a string
          });
          console.log('[Review Steps] Added wizard step:', { stepId, wizardStepId: wizardStep.id, title: wizardStep.title });
        });
      } else {
        // Wizard config exists but no active steps - use fallback
        console.log('[Review Steps] Wizard config exists but no active steps, using fallback');
        steps.push(
          { id: 1, title: 'Overview', icon: FiFileText },
          { id: 2, title: 'Documents', icon: FiFolder }
        );
      }
    } else {
      // Fallback to fixed steps if no wizard configuration
      console.log('[Review Steps] No wizard config, using fallback steps');
      steps.push(
        { id: 1, title: 'Overview', icon: FiFileText },
        { id: 2, title: 'Documents', icon: FiFolder }
      );
    }
    
    // Always add fixed steps at the end
    steps.push(
      { id: 'risk-assessment', title: 'Risk Assessment', icon: FiShield },
      { id: 'review-decision', title: 'Review & Decision', icon: FiCheckSquare }
    );
    
    console.log('[Review Steps] Final steps:', steps);
    return steps;
  }, [entitySchema]);

  // Calculate sidebar width
  const sidebarWidth = condensed ? '72px' : '280px';

  if (loading) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
        <AdminSidebar />
        <PortalHeader />
        <Box
          ml={sidebarWidth}
          mt="90px"
          minH="calc(100vh - 90px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="margin-left 0.3s ease"
        >
          <VStack gap="24px">
            <Box p="20px" borderRadius="16px" bg="mukuru.cards.white" boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)">
              <Spinner size="lg" color="mukuru.buttons.primary" />
            </Box>
            <Typography color="mukuru.text.primary" fontSize="16px" fontWeight="600">
              Loading work item...
            </Typography>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (error || !workItem) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
        <AdminSidebar />
        <PortalHeader />
        <Box
          ml={sidebarWidth}
          mt="90px"
          minH="calc(100vh - 90px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="margin-left 0.3s ease"
        >
          <Box bg="mukuru.cards.white" borderRadius="16px" p="40px" boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)" maxW="400px" textAlign="center">
            <VStack gap="20px">
              <Box p="16px" borderRadius="full" bg="rgba(220, 38, 38, 0.1)">
                <FiAlertTriangle size={32} color="var(--chakra-colors-mukuru-text-error)" />
              </Box>
              <Typography fontSize="18px" fontWeight="600" color="mukuru.text.primary">
                {error ? 'Error Loading Work Item' : 'Work Item Not Found'}
              </Typography>
              <Typography fontSize="14px" color="mukuru.grey.medium">
                {error || 'The work item you are looking for could not be found.'}
              </Typography>
              <Link href="/work-queue">
                <Button variant="secondary" size="sm">
                  <IconWrapper><FiArrowLeft size={16} /></IconWrapper>
                  Back to Work Queue
                </Button>
              </Link>
            </VStack>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="mukuru.background.light"
      overflow="hidden"
    >
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content - Scrollable Area */}
      <Box
        position="absolute"
        top="90px"
        left={sidebarWidth}
        right="0"
        bottom="0"
        bg="mukuru.background.light"
        transition="left 0.3s ease"
        overflowY="auto"
        overflowX="hidden"
      >
        <Box px="32px" py="24px" pb="60px">
          {/* Back Button */}
          <Box mb="20px">
            <Link href="/work-queue">
              <HStack gap="8px" cursor="pointer" _hover={{ opacity: 0.8 }}>
                <FiArrowLeft size={18} color="var(--chakra-colors-mukuru-buttons-primary)" />
                <Typography fontSize="14px" fontWeight="600" color="mukuru.buttons.primary">
                  Back to Queue
                </Typography>
              </HStack>
            </Link>
          </Box>
          {/* Progress Steps with Wizard Support */}
          <Box
            bg="mukuru.cards.white"
            borderRadius="16px"
            border="1px solid"
            borderColor="mukuru.grey.light"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
            p="24px"
            mb="24px"
          >
            {/* Overall Progress Summary */}
            {entitySchema?.wizardConfiguration?.steps && (
              <Box mb="20px" pb="20px" borderBottom="1px solid" borderColor="mukuru.grey.light">
                <Flex justify="space-between" align="center" mb="12px">
                  <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                    Review Progress
                  </Typography>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={jumpToIncompleteStep}
                  >
                    <IconWrapper><FiArrowRight size={14} /></IconWrapper>
                    Jump to Missing
                  </Button>
                </Flex>
                <Flex gap="12px" align="center">
                  {(() => {
                    const wizardSteps = entitySchema.wizardConfiguration!.steps.filter(s => s.isActive);
                    const totalSteps = wizardSteps.length + 2; // +2 for Risk Assessment and Review & Decision
                    const completedSteps = Object.values(stepCompletion).filter(c => c.status === 'complete').length;
                    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
                    return (
                      <>
                        <Box flex="1" h="8px" bg="mukuru.grey.light" borderRadius="full" overflow="hidden">
                          <Box
                            h="100%"
                            bg="mukuru.buttons.primary"
                            borderRadius="full"
                            transition="width 0.3s ease"
                            style={{ width: `${progress}%` }}
                          />
                        </Box>
                        <Typography fontSize="12px" fontWeight="500" color="mukuru.grey.medium">
                          {completedSteps} / {totalSteps} steps complete
                        </Typography>
                      </>
                    );
                  })()}
                </Flex>
              </Box>
            )}

            {/* Step Navigation */}
            <Flex 
              justify="space-between" 
              align="flex-start" 
              maxW="100%" 
              mx="auto" 
              flexWrap="nowrap" 
              gap="8px"
              overflowX="auto"
              pb="4px"
            >
              {reviewSteps.map((step, index) => {
                const isActive = typeof currentStep === 'string' && currentStep.startsWith('wizard-')
                  ? currentStep === step.id
                  : currentStep === step.id;
                const isWizardStep = step.isWizardStep && step.wizardStepId;
                const stepCompletionData = isWizardStep && step.wizardStepId ? stepCompletion[step.wizardStepId] : null;
                const isCompleted = stepCompletionData?.status === 'complete' || 
                  (typeof currentStep === 'number' && typeof step.id === 'number' && currentStep > step.id);
                const isLast = index === reviewSteps.length - 1;
                // Use consistent step numbering for all steps
                const stepNumber = index + 1;
                
                // Get review status for this step
                const reviewStatusForStep = isWizardStep && step.wizardStepId 
                  ? stepReviewStatus[step.wizardStepId] 
                  : undefined;

                return (
                  <Flex key={step.id} align="center" flex={isLast ? '0' : '1'} minW="140px">
                    {/* Step */}
                    <VStack gap="10px" align="center" cursor="pointer" onClick={() => {
                      if (isWizardStep && step.wizardStepId) {
                        console.log('[Review Page] Clicking wizard step:', { stepId: step.id, wizardStepId: step.wizardStepId, title: step.title });
                        setActiveWizardStepId(String(step.wizardStepId));
                        setCurrentStep(step.id);
                      } else {
                        setCurrentStep(step.id);
                      }
                    }}>
                      <Box position="relative">
                        <Box
                          w="52px"
                          h="52px"
                          borderRadius="14px"
                          bg="mukuru.cards.white"
                          border="2px solid"
                          borderColor={isActive ? 'mukuru.buttons.primary' : isCompleted ? 'mukuru.text.success' : 'mukuru.grey.light'}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          transition="all 0.2s ease"
                          _hover={{ transform: 'scale(1.05)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                          boxShadow={isActive ? '0 4px 12px rgba(240, 84, 35, 0.2)' : 'none'}
                        >
                          {isCompleted && !isActive ? (
                            <FiCheck size={22} color="var(--chakra-colors-mukuru-text-success)" />
                          ) : (
                            <step.icon 
                              size={22} 
                              color={isActive ? 'var(--chakra-colors-mukuru-buttons-primary)' : 'var(--chakra-colors-mukuru-grey-medium)'} 
                            />
                          )}
                        </Box>
                        {/* Completion Badge */}
                        {stepCompletionData && stepCompletionData.status !== 'complete' && (
                          <Box
                            position="absolute"
                            top="-6px"
                            right="-6px"
                            minW="22px"
                            h="22px"
                            px="4px"
                            borderRadius="full"
                            bg={stepCompletionData.status === 'partial' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(220, 38, 38, 0.1)'}
                            border="2px solid"
                            borderColor="white"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            boxShadow="0 2px 4px rgba(0, 0, 0, 0.1)"
                          >
                            <Typography fontSize="9px" fontWeight="700" color={stepCompletionData.status === 'partial' ? 'mukuru.text.alert' : 'mukuru.text.error'}>
                              {stepCompletionData.completedCount}/{stepCompletionData.totalCount}
                            </Typography>
                          </Box>
                        )}
                        {/* Review Status Indicator */}
                        {reviewStatusForStep && (reviewStatusForStep.completed || reviewStatusForStep.verified || reviewStatusForStep.approved) && (
                          <HStack
                            position="absolute"
                            bottom="-6px"
                            left="50%"
                            transform="translateX(-50%)"
                            gap="3px"
                            bg="mukuru.cards.white"
                            borderRadius="full"
                            px="5px"
                            py="2px"
                            boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
                            border="1px solid"
                            borderColor="mukuru.grey.light"
                          >
                            {reviewStatusForStep.completed && (
                              <Box w="8px" h="8px" borderRadius="full" bg="mukuru.text.success" title="Completed" />
                            )}
                            {reviewStatusForStep.verified && (
                              <Box w="8px" h="8px" borderRadius="full" bg="mukuru.teal" title="Verified" />
                            )}
                            {reviewStatusForStep.approved && (
                              <Box w="8px" h="8px" borderRadius="full" bg="mukuru.buttons.primary" title="Approved" />
                            )}
                          </HStack>
                        )}
                      </Box>
                      <VStack gap="4px" align="center" maxW="130px">
                        <Typography
                          fontSize="10px"
                          fontWeight="600"
                          color={isActive ? 'mukuru.buttons.primary' : isCompleted ? 'mukuru.text.success' : 'mukuru.grey.medium'}
                          textTransform="uppercase"
                          letterSpacing="0.5px"
                          whiteSpace="nowrap"
                        >
                          Step {stepNumber}
                        </Typography>
                        <Typography
                          fontSize="12px"
                          fontWeight={isActive ? '600' : '500'}
                          color={isActive || isCompleted ? 'mukuru.text.primary' : 'mukuru.grey.medium'}
                          textAlign="center"
                          lineHeight="1.3"
                        >
                          {step.title}
                        </Typography>
                      </VStack>
                    </VStack>

                    {/* Connector Line */}
                    {!isLast && (
                      <Box
                        flex="1"
                        h="3px"
                        bg={isCompleted ? 'mukuru.text.success' : 'mukuru.grey.light'}
                        mx="8px"
                        alignSelf="center"
                        mt="-50px"
                        borderRadius="full"
                        transition="background 0.2s ease"
                        minW="20px"
                      />
                    )}
                  </Flex>
                );
              })}
            </Flex>
          </Box>

          {/* Step Content */}
          <MotionBox
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Render wizard step content */}
            {typeof currentStep === 'string' && currentStep.startsWith('wizard-') && activeWizardStepId && (
              <Box>
                {loadedWizardSteps.has(activeWizardStepId) || true ? (
                  <WizardStepContent
                    stepId={activeWizardStepId}
                    requirements={getRequirementsForStep(activeWizardStepId)}
                    documents={documents}
                    applicationData={applicationData}
                    requirementMap={requirementMap}
                    reviewStatus={stepReviewStatus[activeWizardStepId]}
                    onReviewStatusChange={handleStepReviewStatusChange}
                    onNotesChange={handleNotesChange}
                    onViewDocument={(url, name, type, size) => {
                      setViewingDocumentUrl(url);
                      setViewingDocumentName(name);
                      setViewingDocumentType(type);
                      setViewingDocumentSize(size);
                      setDocumentViewerOpen(true);
                    }}
                  />
                ) : (
                  <Box
                    bg="mukuru.cards.white"
                    borderRadius="16px"
                    border="1px solid"
                    borderColor="mukuru.grey.light"
                    boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
                    p="40px"
                    textAlign="center"
                  >
                    <Spinner size="lg" color="mukuru.buttons.primary" />
                    <Typography mt="16px" fontSize="14px" color="mukuru.grey.medium">
                      Loading step content...
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Overview Step (fallback if no wizard config or step 1) */}
            {(currentStep === 1 || (typeof currentStep === 'number' && currentStep === 1)) && !entitySchema?.wizardConfiguration && (
              <Flex gap="24px" align="flex-start">
                {/* Work Item Details Card */}
                <Box
                  bg="mukuru.cards.white"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor="mukuru.grey.light"
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
                  overflow="hidden"
                  flex="1"
                >
                  <Box p="16px 20px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="mukuru.background.light">
                    <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
                      Work Item Details
                    </Typography>
                  </Box>
                  <Box bg="mukuru.cards.white">
                    {/* Work Item Number */}
                    <Flex px="20px" py="14px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light" _hover={{ bg: 'mukuru.background.light' }}>
                      <HStack gap="12px">
                        <Box p="8px" borderRadius="8px" bg="mukuru.background.light">
                          <FiHash size={16} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                        </Box>
                        <Typography fontSize="13px" color="mukuru.grey.mediumDark">Work Item Number</Typography>
                      </HStack>
                      <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                        {workItem.workItemNumber || workItem.id}
                      </Typography>
                    </Flex>

                    {/* Applicant Name */}
                    <Flex px="20px" py="14px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light" _hover={{ bg: 'mukuru.background.light' }}>
                      <HStack gap="12px">
                        <Box p="8px" borderRadius="8px" bg="mukuru.background.light">
                          <FiUser size={16} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                        </Box>
                        <Typography fontSize="13px" color="mukuru.grey.mediumDark">Applicant Name</Typography>
                      </HStack>
                      <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                        {workItem.legalName}
                      </Typography>
                    </Flex>

                    {/* Entity Type */}
                    <Flex px="20px" py="14px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light" _hover={{ bg: 'mukuru.background.light' }}>
                      <HStack gap="12px">
                        <Box p="8px" borderRadius="8px" bg="mukuru.background.light">
                          <FiBriefcase size={16} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                        </Box>
                        <Typography fontSize="13px" color="mukuru.grey.mediumDark">Entity Type</Typography>
                      </HStack>
                      <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                        {workItem.entityType}
                      </Typography>
                    </Flex>

                    {/* Country */}
                    <Flex px="20px" py="14px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light" _hover={{ bg: 'mukuru.background.light' }}>
                      <HStack gap="12px">
                        <Box p="8px" borderRadius="8px" bg="mukuru.background.light">
                          <FiMapPin size={16} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                        </Box>
                        <Typography fontSize="13px" color="mukuru.grey.mediumDark">Country</Typography>
                      </HStack>
                      <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                        {workItem.country}
                      </Typography>
                    </Flex>

                    {/* Due Date */}
                    {workItem.dueDate && (
                      <Flex px="20px" py="14px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light" _hover={{ bg: 'mukuru.background.light' }}>
                        <HStack gap="12px">
                          <Box p="8px" borderRadius="8px" bg="mukuru.background.light">
                            <FiCalendar size={16} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                          </Box>
                          <Typography fontSize="13px" color="mukuru.grey.mediumDark">Due Date</Typography>
                        </HStack>
                        <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                          {new Date(workItem.dueDate).toLocaleDateString()}
                        </Typography>
                      </Flex>
                    )}

                    {/* Priority */}
                    <Flex px="20px" py="14px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light" _hover={{ bg: 'mukuru.background.light' }}>
                      <HStack gap="12px">
                        <Box p="8px" borderRadius="8px" bg="mukuru.background.light">
                          <FiFlag size={16} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                        </Box>
                        <Typography fontSize="13px" color="mukuru.grey.mediumDark">Priority</Typography>
                      </HStack>
                      <Box px="12px" py="4px" borderRadius="full" bg={workItem.priority?.toLowerCase() === 'high' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(0, 128, 128, 0.1)'} border="1px solid" borderColor={workItem.priority?.toLowerCase() === 'high' ? 'mukuru.text.error' : 'mukuru.teal'}>
                        <Typography fontSize="11px" fontWeight="600" color={workItem.priority?.toLowerCase() === 'high' ? 'mukuru.text.error' : 'mukuru.teal'}>
                          {workItem.priority || 'Medium'}
                        </Typography>
                      </Box>
                    </Flex>

                    {/* Assigned To */}
                    {workItem.assignedToName && (
                      <Flex px="20px" py="14px" justify="space-between" align="center" _hover={{ bg: 'mukuru.background.light' }}>
                        <HStack gap="12px">
                          <Box p="8px" borderRadius="8px" bg="mukuru.background.light">
                            <FiUser size={16} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                          </Box>
                          <Typography fontSize="13px" color="mukuru.grey.mediumDark">Assigned To</Typography>
                        </HStack>
                        <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                          {workItem.assignedToName}
                        </Typography>
                      </Flex>
                    )}
                  </Box>
                </Box>

                {/* Quick Actions Card */}
                <Box
                  bg="mukuru.cards.white"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor="mukuru.grey.light"
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
                  overflow="hidden"
                  w="320px"
                  flexShrink={0}
                >
                  <Box p="16px 20px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="mukuru.background.light">
                    <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
                      Quick Actions
                    </Typography>
                  </Box>
                  <Box
                    p="16px"
                    display="flex"
                    flexDirection="column"
                    justifyContent="flex-start"
                  >
                    <VStack align="stretch" gap="3" width="full">
                      {/* Assignment Actions */}
                      {!workItem.assignedTo && (
                        <Button
                          variant="primary"
                          onClick={handleAssignToMe}
                          size="md"
                          width="full"
                          className="mukuru-primary-button"
                          disabled={actionLoading}
                        >
                          <HStack gap="2" align="center">
                            <FiUser size={16} />
                            <Typography color="mukuru.white">Assign to Me</Typography>
                          </HStack>
                        </Button>
                      )}
                      {workItem.assignedTo && (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => setReassignModalOpen(true)}
                            size="md"
                            width="full"
                            disabled={actionLoading}
                          >
                            <HStack gap="2" align="center">
                              <FiUser size={16} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                              <Typography color="mukuru.text.primary">Reassign</Typography>
                            </HStack>
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={handleUnassign}
                            size="md"
                            width="full"
                            disabled={actionLoading}
                          >
                            <HStack gap="2" align="center">
                              <FiX size={16} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                              <Typography color="mukuru.text.primary">Unassign</Typography>
                            </HStack>
                          </Button>
                        </>
                      )}

                      <Separator />

                      {/* View Actions */}
                      <Button
                        variant="primary"
                        onClick={() => setCommentsModalOpen(true)}
                        size="md"
                        width="full"
                        className="mukuru-primary-button"
                      >
                        <HStack gap="2" align="center">
                          <IconWrapper>
                            <FiMessageSquare size={16} color="mukuru.white" />
                          </IconWrapper>
                          <Typography color="mukuru.white">View Comments</Typography>
                        </HStack>
                        <Typography
                          fontSize="xs"
                          color="mukuru.white"
                          opacity="0.9"
                          mt="1"
                        >
                          {comments.length}{' '}
                          {comments.length === 1 ? 'comment' : 'comments'}
                        </Typography>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setHistoryModalOpen(true)}
                        size="md"
                        width="full"
                      >
                        <HStack gap="2" align="center">
                          <IconWrapper>
                            <FiClock size={16} color="mukuru.grey.medium" />
                          </IconWrapper>
                          <Typography color="mukuru.text.primary">
                            View History
                          </Typography>
                        </HStack>
                      </Button>
                      <Link
                        href={`/applications/${workItem.applicationId || workItem.id}`}
                        style={{ width: '100%' }}
                      >
                        <Button variant="secondary" size="md" width="full">
                          <HStack gap="2" align="center">
                            <IconWrapper>
                              <FiEye size={16} color="mukuru.grey.medium" />
                            </IconWrapper>
                            <Typography color="mukuru.text.primary">
                              View Full Application
                            </Typography>
                          </HStack>
                        </Button>
                      </Link>

                      <Separator />

                      {/* Refresh Action */}
                      <Button
                        variant="secondary"
                        onClick={() => setRefreshModalOpen(true)}
                        size="md"
                        width="full"
                        disabled={actionLoading}
                      >
                        <HStack gap="2" align="center">
                          <FiRefreshCw size={16} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                          <Typography color="mukuru.text.primary">
                            Request Refresh
                          </Typography>
                        </HStack>
                      </Button>
                    </VStack>
                  </Box>
                </Box>

                {/* Requirements Checklist - Show all required responses */}
                {entityRequirements.length > 0 && (
                  <Box
                    bg="mukuru.cards.white"
                    borderRadius="16px"
                    border="1px solid"
                    borderColor="mukuru.grey.light"
                    boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
                    overflow="hidden"
                    w="100%"
                    mt="24px"
                  >
                    <Flex p="16px 20px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="mukuru.background.light" justify="space-between" align="center">
                      <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
                        Required Responses
                      </Typography>
                      {(() => {
                        const validation = validateRequirementCompleteness();
                        const totalRequired = entityRequirements.filter(r => r.isRequired).length;
                        const satisfiedCount = totalRequired - validation.missingRequirements.length;
                        return (
                          <Box px="12px" py="4px" borderRadius="full" bg={validation.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)'} border="1px solid" borderColor={validation.isValid ? 'mukuru.text.success' : 'mukuru.text.alert'}>
                            <Typography fontSize="11px" fontWeight="600" color={validation.isValid ? 'mukuru.text.success' : 'mukuru.text.alert'}>
                              {satisfiedCount}/{totalRequired} Complete
                            </Typography>
                          </Box>
                        );
                      })()}
                    </Flex>
                    <Box p="20px">
                      <VStack align="stretch" gap="16px">
                        {entityRequirements
                          .filter(req => req.isRequired)
                          .sort((a, b) => a.displayName.localeCompare(b.displayName))
                          .map((req) => {
                            const isDocument = req.fieldType === 'file' || req.fieldType === 'File';
                            let isSatisfied = false;
                            let responseValue: string | null = null;
                            let documentInfo: { id: string; fileName: string } | null = null;

                            if (isDocument) {
                              // Check if document exists
                              const matchingDoc = (documents as Array<Record<string, unknown>>).find(
                                (doc) => {
                                  const reqName = doc.requirementName as string;
                                  return (
                                    reqName === req.displayName ||
                                    reqName === requirementMap.get(req.code)
                                  );
                                }
                              );
                              isSatisfied = !!matchingDoc;
                              if (matchingDoc) {
                                documentInfo = {
                                  id: String(matchingDoc.id || ''),
                                  fileName: String(matchingDoc.fileName || matchingDoc.documentNumber || 'Document'),
                                };
                              }
                            } else {
                              // Check if information field has value
                              const appData = applicationData as Record<string, unknown> | null;
                              if (appData?.metadataJson) {
                                try {
                                  const metadata = typeof appData.metadataJson === 'string'
                                    ? JSON.parse(appData.metadataJson)
                                    : appData.metadataJson;
                                  
                                  // Try multiple possible keys
                                  const possibleKeys = [
                                    req.code.toLowerCase(),
                                    req.code,
                                    req.displayName.toLowerCase().replace(/\s+/g, '_'),
                                    req.displayName.toLowerCase().replace(/\s+/g, '-'),
                                  ];
                                  
                                  for (const key of possibleKeys) {
                                    if (metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '') {
                                      responseValue = String(metadata[key]);
                                      isSatisfied = true;
                                      break;
                                    }
                                  }
                                  
                                  // Also check direct field access
                                  if (!isSatisfied && appData[req.code]) {
                                    responseValue = String(appData[req.code]);
                                    isSatisfied = true;
                                  }
                                } catch {
                                  // Ignore parse errors
                                }
                              }
                            }

                            return (
                              <Box
                                key={req.code}
                                p="16px"
                                borderRadius="12px"
                                border="1px solid"
                                borderColor={isSatisfied ? 'mukuru.text.success' : 'mukuru.text.error'}
                                bg={isSatisfied ? 'rgba(16, 185, 129, 0.05)' : 'rgba(220, 38, 38, 0.05)'}
                              >
                                <HStack justify="space-between" align="flex-start" mb={isSatisfied && (responseValue || documentInfo) ? "12px" : "0"}>
                                  <HStack gap="12px" align="flex-start" flex="1">
                                    <Box mt="2px">
                                      {isSatisfied ? (
                                        <FiCheck size={20} color="var(--chakra-colors-mukuru-text-success)" />
                                      ) : (
                                        <FiX size={20} color="var(--chakra-colors-mukuru-text-error)" />
                                      )}
                                    </Box>
                                    <VStack align="flex-start" gap="4px" flex="1">
                                      <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                                        {req.displayName}
                                      </Typography>
                                      {req.description && (
                                        <Typography fontSize="12px" color="mukuru.grey.medium">
                                          {req.description}
                                        </Typography>
                                      )}
                                      {isSatisfied && responseValue && (
                                        <Box mt="8px" p="8px 12px" bg="mukuru.cards.white" borderRadius="8px" border="1px solid" borderColor="mukuru.grey.light" w="100%">
                                          <Typography fontSize="13px" color="mukuru.text.primary" fontWeight="500">
                                            {responseValue}
                                          </Typography>
                                        </Box>
                                      )}
                                      {isSatisfied && documentInfo && (
                                        <HStack mt="8px" gap="8px">
                                          <FiFile size={16} color="var(--chakra-colors-mukuru-text-success)" />
                                          <Typography fontSize="13px" color="mukuru.text.primary" fontWeight="500">
                                            {documentInfo.fileName}
                                          </Typography>
                                          <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => {
                                              const doc = (documents as Array<Record<string, unknown>>).find(
                                                d => String(d.id) === documentInfo!.id
                                              );
                                              if (doc) handleViewDocument(doc);
                                            }}
                                          >
                                            View
                                          </Button>
                                        </HStack>
                                      )}
                                    </VStack>
                                  </HStack>
                                  <Tag 
                                    variant={isSatisfied ? 'success' : 'danger'}
                                    size="md"
                                  >
                                    {isSatisfied ? 'Provided' : 'Missing'}
                                  </Tag>
                                </HStack>
                              </Box>
                            );
                          })}
                      </VStack>
                      {(() => {
                        const validation = validateRequirementCompleteness();
                        if (!validation.isValid) {
                          return (
                            <Box mt="20px" p="16px" bg="rgba(217, 119, 6, 0.1)" borderRadius="12px" border="1px solid" borderColor="mukuru.text.alert">
                              <HStack gap="12px" align="flex-start">
                                <FiAlertTriangle size={20} color="var(--chakra-colors-mukuru-text-alert)" />
                                <VStack align="flex-start" gap="4px" flex="1">
                                  <Typography fontSize="14px" fontWeight="600" color="mukuru.text.alert">
                                    Missing Required Information
                                  </Typography>
                                  <Typography fontSize="13px" color="mukuru.text.alert">
                                    {validation.message}
                                  </Typography>
                                </VStack>
                              </HStack>
                            </Box>
                          );
                        }
                        return null;
                      })()}
                    </Box>
                  </Box>
                )}
              </Flex>
            )}

            {/* Documents Step - Only show if no wizard config (fallback) */}
            {(currentStep === 2 || (typeof currentStep === 'number' && currentStep === 2)) && !entitySchema?.wizardConfiguration && (
              <>
                {/* Requirement Completeness Status */}
                {entityRequirements.length > 0 && (
                  <Box
                    bg="mukuru.cards.white"
                    borderRadius="16px"
                    border="1px solid"
                    borderColor="mukuru.grey.light"
                    boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
                    overflow="hidden"
                    mb="24px"
                  >
                    <Flex p="16px 20px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="mukuru.background.light" justify="space-between" align="center">
                      <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
                        Requirement Status
                      </Typography>
                        {(() => {
                          const validation = validateRequirementCompleteness();
                          const requiredCount = entityRequirements.filter(
                            (r) =>
                              r.isRequired &&
                              (r.fieldType === 'file' || r.fieldType === 'File')
                          ).length;
                          const satisfiedCount =
                            requiredCount - validation.missingRequirements.length;
                          return (
                            <Box px="12px" py="4px" borderRadius="full" bg={validation.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)'} border="1px solid" borderColor={validation.isValid ? 'mukuru.text.success' : 'mukuru.text.alert'}>
                              <Typography fontSize="11px" fontWeight="600" color={validation.isValid ? 'mukuru.text.success' : 'mukuru.text.alert'}>
                                {satisfiedCount}/{requiredCount} Required Documents
                              </Typography>
                            </Box>
                          );
                        })()}
                    </Flex>
                    <Box p="16px 20px">
                      <VStack align="stretch" gap="12px">
                          {entityRequirements
                            .filter(
                              (req) =>
                                req.isRequired &&
                                (req.fieldType === 'file' || req.fieldType === 'File')
                            )
                            .map((req) => {
                              const isSatisfied =
                                (documents as Array<Record<string, unknown>>).some(
                                  (doc) => {
                                    const reqName = doc.requirementName as string;
                                    return (
                                      reqName === req.displayName ||
                                      reqName === requirementMap.get(req.code)
                                    );
                                  }
                                ) ||
                                (documents as Array<Record<string, unknown>>).some(
                                  (doc) => {
                                    // Check metadata for document matching this requirement
                                    const appData = applicationData as Record<
                                      string,
                                      unknown
                                    > | null;
                                    if (appData?.metadataJson) {
                                      try {
                                        const metadata =
                                          typeof appData.metadataJson === 'string'
                                            ? JSON.parse(appData.metadataJson)
                                            : appData.metadataJson;
                                        const docId = doc.id ? String(doc.id) : '';
                                        const docNumber = doc.documentNumber
                                          ? String(doc.documentNumber)
                                          : '';
                                        const docStorageKey = doc.storageKey
                                          ? String(doc.storageKey)
                                          : '';

                                        // Check if any metadata key/value matches this requirement
                                        for (const [key, value] of Object.entries(
                                          metadata
                                        )) {
                                          if (
                                            key
                                              .toLowerCase()
                                              .includes(req.code.toLowerCase()) ||
                                            req.code
                                              .toLowerCase()
                                              .includes(key.toLowerCase())
                                          ) {
                                            const valueStr = String(value).toLowerCase();
                                            if (
                                              valueStr.includes(docId) ||
                                              valueStr.includes(docNumber) ||
                                              valueStr.includes(docStorageKey)
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                      } catch {
                                        // Ignore parse errors
                                      }
                                    }
                                    return false;
                                  }
                                );

                              return (
                                <HStack
                                  key={req.code}
                                  justify="space-between"
                                  align="center"
                                  py="1"
                                >
                                  <HStack gap="2" align="center">
                                    <IconWrapper>
                                      {isSatisfied ? (
                                        <FiCheck
                                          size={16}
                                          color="var(--chakra-colors-mukuru-success)"
                                        />
                                      ) : (
                                        <FiX
                                          size={16}
                                          color="var(--chakra-colors-mukuru-error)"
                                        />
                                      )}
                                    </IconWrapper>
                                    <Typography
                                      fontSize="sm"
                                      color={
                                        isSatisfied
                                          ? 'mukuru.text.primary'
                                          : 'mukuru.error'
                                      }
                                      fontWeight={isSatisfied ? 'normal' : 'medium'}
                                    >
                                      {req.displayName}
                                    </Typography>
                                  </HStack>
                                  <Tag 
                                    variant={isSatisfied ? 'success' : 'danger'}
                                    size="md"
                                  >
                                    {isSatisfied ? 'Satisfied' : 'Missing'}
                                  </Tag>
                                </HStack>
                              );
                            })}
                      </VStack>
                      {(() => {
                        const validation = validateRequirementCompleteness();
                        if (!validation.isValid) {
                          return (
                            <Box mt="16px" p="12px 16px" bg="rgba(217, 119, 6, 0.1)" borderRadius="8px" border="1px solid" borderColor="mukuru.text.alert">
                              <HStack gap="8px">
                                <FiAlertTriangle size={16} color="var(--chakra-colors-mukuru-text-alert)" />
                                <Typography fontSize="13px" fontWeight="500" color="mukuru.text.alert">
                                  {validation.message}
                                </Typography>
                              </HStack>
                            </Box>
                          );
                        }
                        return null;
                      })()}
                    </Box>
                  </Box>
                )}
              </>
            )}
            {currentStep === 2 && (
              <Box
                bg="mukuru.cards.white"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
                overflow="hidden"
              >
                <Flex 
                  p="16px 20px" 
                  borderBottom="1px solid" 
                  borderColor="mukuru.grey.light" 
                  bg="mukuru.background.light"
                  justify="space-between"
                  align="center"
                >
                  <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
                    Documents
                  </Typography>
                  <Button size="sm" variant="primary" onClick={loadDocuments}>
                    <IconWrapper><FiRefreshCw size={14} /></IconWrapper>
                    Refresh
                  </Button>
                </Flex>
                <Box p="20px">
                  <Box>
                    {documentsLoading ? (
                      <VStack gap="4" py="12" align="center">
                        <Spinner size="lg" color="mukuru.primary" />
                        <Typography fontSize="md" color="mukuru.text.primary">
                          Loading documents...
                        </Typography>
                      </VStack>
                    ) : documentsError ? (
                      <AlertBar
                        status="error"
                        title="Error loading documents"
                        description={documentsError}
                      />
                    ) : documents.length === 0 ? (
                      <VStack gap="4" py="12" align="center">
                        <IconWrapper>
                          <DocumentIcon />
                        </IconWrapper>
                        <Typography
                          fontSize="md"
                          fontWeight="500"
                          color="mukuru.text.primary"
                        >
                          No documents found for this application
                        </Typography>
                        <Link
                          href={`/applications/${workItem.applicationId || workItem.id}`}
                        >
                          <Button
                            variant="primary"
                            size="md"
                            className="mukuru-primary-button"
                          >
                            <Typography color="mukuru.white">
                              View Full Application
                            </Typography>
                          </Button>
                        </Link>
                      </VStack>
                    ) : (
                      <VStack align="stretch" gap="16px">
                        <HStack justify="space-between" align="center">
                          <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                            {documents.length} document{documents.length !== 1 ? 's' : ''} found
                          </Typography>
                        </HStack>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px">
                          {[...documents]
                            .sort((a: unknown, b: unknown) => {
                              const docA = a as Record<string, unknown>;
                              const docB = b as Record<string, unknown>;
                              const nameA = (
                                docA.fileName
                                  ? String(docA.fileName)
                                  : docA.documentNumber
                                    ? String(docA.documentNumber)
                                    : ''
                              ).toLowerCase();
                              const nameB = (
                                docB.fileName
                                  ? String(docB.fileName)
                                  : docB.documentNumber
                                    ? String(docB.documentNumber)
                                    : ''
                              ).toLowerCase();
                              return nameA.localeCompare(nameB);
                            })
                            .map((doc: unknown, index: number) => {
                              const docObj = doc as Record<string, unknown>;
                              const requirementName = getDocumentTypeName(docObj);
                              const fileName =
                                docObj.fileName
                                  ? String(docObj.fileName)
                                  : docObj.documentNumber
                                    ? String(docObj.documentNumber)
                                    : `Document ${index + 1}`;
                              return (
                                <Box
                                  key={docObj.id ? String(docObj.id) : `doc-${index}`}
                                  p="16px"
                                  cursor="pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleViewDocument(docObj);
                                  }}
                                  bg="mukuru.cards.white"
                                  borderRadius="12px"
                                  border="1px solid"
                                  borderColor="mukuru.grey.light"
                                  _hover={{
                                    borderColor: 'mukuru.buttons.primary',
                                    boxShadow: '0 4px 12px rgba(240, 84, 35, 0.1)',
                                  }}
                                  transition="all 0.2s"
                                >
                                  <HStack gap="14px" align="flex-start">
                                    <Box
                                      w="44px"
                                      h="44px"
                                      borderRadius="10px"
                                      bg="rgba(240, 84, 35, 0.08)"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      flexShrink={0}
                                    >
                                      <FiFile size={20} color="var(--chakra-colors-mukuru-buttons-primary)" />
                                    </Box>
                                    <VStack align="start" gap="6px" flex="1" minW="0">
                                      {requirementName && requirementName !== 'Document' && requirementName !== 'Unknown' && (
                                        <Box px="8px" py="2px" bg="rgba(240, 84, 35, 0.08)" borderRadius="4px">
                                          <Typography fontSize="10px" fontWeight="600" color="mukuru.buttons.primary" textTransform="uppercase" letterSpacing="0.5px">
                                            {requirementName}
                                          </Typography>
                                        </Box>
                                      )}
                                      <Typography
                                        fontWeight="600"
                                        fontSize="13px"
                                        color="mukuru.text.primary"
                                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                                      >
                                        {fileName}
                                      </Typography>
                                      <HStack gap="12px">
                                        {docObj.sizeBytes && typeof docObj.sizeBytes === 'number' ? (
                                          <Typography fontSize="11px" color="mukuru.grey.medium">
                                            {formatFileSize(docObj.sizeBytes as number)}
                                          </Typography>
                                        ) : null}
                                        {docObj.uploadedAt ? (
                                          <Typography fontSize="11px" color="mukuru.grey.medium">
                                            {new Date(String(docObj.uploadedAt)).toLocaleDateString()}
                                          </Typography>
                                        ) : null}
                                      </HStack>
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleViewDocument(docObj);
                                        }}
                                        className="mukuru-primary-button"
                                        borderRadius="8px"
                                        mt="4px"
                                      >
                                        <HStack gap="6px" align="center">
                                          <FiEye size={14} />
                                          <Typography fontSize="12px" color="white" fontWeight="500">View</Typography>
                                        </HStack>
                                      </Button>
                                    </VStack>
                                  </HStack>
                                </Box>
                              );
                            })}
                        </SimpleGrid>
                        <Box mt="20px" pt="16px" borderTop="1px solid" borderColor="mukuru.grey.light">
                          <Link
                            href={`/applications/${workItem.applicationId || workItem.id}`}
                            style={{ width: '100%' }}
                          >
                            <Button
                              variant="primary"
                              w="full"
                              size="md"
                              className="mukuru-primary-button"
                              borderRadius="10px"
                              h="48px"
                            >
                              <HStack gap="8px" align="center" justify="center">
                                <Typography color="white" fontWeight="500" fontSize="14px">
                                  View Full Application Details
                                </Typography>
                                <FiArrowRight size={16} />
                              </HStack>
                            </Button>
                          </Link>
                        </Box>
                      </VStack>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {(currentStep === 3 || currentStep === 'risk-assessment') && (
              <Box
                bg="mukuru.cards.white"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
                overflow="hidden"
              >
                <Flex 
                  p="16px 20px" 
                  borderBottom="1px solid" 
                  borderColor="mukuru.grey.light" 
                  bg="mukuru.background.light"
                  justify="space-between"
                  align="center"
                >
                  <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
                    Manual Risk Assessment
                  </Typography>
                  {riskAssessment && (
                    <Box px="12px" py="4px" borderRadius="full" bg="#D1FAE5" border="1px solid" borderColor="#6EE7B7">
                      <HStack gap="6px">
                        <FiCheck size={12} color="#059669" />
                        <Typography fontSize="11px" fontWeight="600" color="#059669">Assessed</Typography>
                      </HStack>
                    </Box>
                  )}
                </Flex>
                <Box
                  p="24px"
                >
                  {riskAssessmentLoading ? (
                    <VStack gap="3" py="6" align="center">
                      <Spinner size="md" color="mukuru.primary" />
                      <Typography fontSize="sm" color="mukuru.text.primary">
                        Loading risk assessment...
                      </Typography>
                    </VStack>
                  ) : (
                    <VStack align="stretch" gap="24px" width="full">
                      {/* Current Risk Assessment Display */}
                      {riskAssessment && (
                        <Box
                          bg="mukuru.cards.white"
                          borderRadius="12px"
                          border="1px solid"
                          borderColor="mukuru.grey.light"
                          overflow="hidden"
                        >
                          <Box p="14px 16px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="mukuru.background.light">
                            <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                              Current Risk Assessment
                            </Typography>
                          </Box>
                          <Box p="16px">
                            {/* Risk Level Row */}
                            <Flex py="12px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light">
                              <HStack gap="10px">
                                <Box p="6px" borderRadius="6px" bg="mukuru.background.light">
                                  <FiShield size={14} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                                </Box>
                                <Typography fontSize="13px" color="mukuru.grey.mediumDark">Risk Level</Typography>
                              </HStack>
                              <Box 
                                px="10px" py="3px" borderRadius="full" 
                                bg={getRiskColor(riskAssessment.overallRiskLevel) === 'red' ? '#FEE2E2' : getRiskColor(riskAssessment.overallRiskLevel) === 'orange' ? '#FEF3C7' : '#DBEAFE'} 
                                border="1px solid" 
                                borderColor={getRiskColor(riskAssessment.overallRiskLevel) === 'red' ? '#FCA5A5' : getRiskColor(riskAssessment.overallRiskLevel) === 'orange' ? '#FCD34D' : '#93C5FD'}
                              >
                                <Typography fontSize="11px" fontWeight="600" color={getRiskColor(riskAssessment.overallRiskLevel) === 'red' ? '#DC2626' : getRiskColor(riskAssessment.overallRiskLevel) === 'orange' ? '#D97706' : '#1D4ED8'}>
                                  {riskAssessment.overallRiskLevel}
                                </Typography>
                              </Box>
                            </Flex>

                            {/* Risk Score Row */}
                            {riskAssessment.riskScore !== undefined && (
                              <Flex py="12px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light">
                                <HStack gap="10px">
                                  <Box p="6px" borderRadius="6px" bg="mukuru.background.light">
                                    <FiShield size={14} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                                  </Box>
                                  <Typography fontSize="13px" color="mukuru.grey.mediumDark">Risk Score</Typography>
                                </HStack>
                                <HStack gap="12px">
                                  <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                                    {riskAssessment.riskScore}%
                                  </Typography>
                                  <Box w="80px" h="6px" bg="mukuru.grey.light" borderRadius="full" overflow="hidden">
                                    <Box 
                                      w={`${riskAssessment.riskScore}%`} 
                                      h="full" 
                                      bg={getRiskColor(riskAssessment.overallRiskLevel) === 'red' ? '#EF4444' : getRiskColor(riskAssessment.overallRiskLevel) === 'orange' ? '#F59E0B' : '#3B82F6'} 
                                      borderRadius="full"
                                    />
                                  </Box>
                                </HStack>
                              </Flex>
                            )}

                            {/* Assessed By Row */}
                            {riskAssessment.assessedBy && (
                              <Flex py="12px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light">
                                <HStack gap="10px">
                                  <Box p="6px" borderRadius="6px" bg="mukuru.background.light">
                                    <FiUser size={14} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                                  </Box>
                                  <Typography fontSize="13px" color="mukuru.grey.mediumDark">Assessed By</Typography>
                                </HStack>
                                <VStack align="flex-end" gap="2px">
                                  <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                                    {riskAssessment.assessedBy}
                                  </Typography>
                                  {riskAssessment.completedAt && (
                                    <Typography fontSize="11px" color="mukuru.grey.medium">
                                      {new Date(riskAssessment.completedAt).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </VStack>
                              </Flex>
                            )}

                            {/* Notes/Justification Row */}
                            {riskAssessment.notes && (
                              <Box pt="12px">
                                <Typography fontSize="12px" fontWeight="600" color="mukuru.grey.mediumDark" mb="6px">Notes</Typography>
                                <Box 
                                  fontSize="13px" 
                                  color="mukuru.text.primary" 
                                  lineHeight="1.6"
                                  p="12px"
                                  bg="mukuru.background.light"
                                  borderRadius="8px"
                                  maxH="200px"
                                  overflowY="auto"
                                >
                                  {riskAssessment.notes.split('\n\n').map((section, idx) => {
                                    // Check if this is a section header (e.g., "RISK FACTORS IDENTIFIED:")
                                    const isHeader = section.includes(':') && section.split(':')[0].toUpperCase() === section.split(':')[0];
                                    if (isHeader) {
                                      const [header, ...content] = section.split(':');
                                      return (
                                        <Box key={idx} mb={idx < riskAssessment.notes!.split('\n\n').length - 1 ? "12px" : "0"}>
                                          <Typography fontSize="11px" fontWeight="600" color="mukuru.grey.mediumDark" textTransform="uppercase" mb="4px">
                                            {header.replace('MANUAL CLASSIFICATION', 'Justification')}
                                          </Typography>
                                          <Typography fontSize="13px" color="mukuru.text.primary" whiteSpace="pre-wrap">
                                            {content.join(':').trim()}
                                          </Typography>
                                        </Box>
                                      );
                                    }
                                    return (
                                      <Typography key={idx} fontSize="13px" color="mukuru.text.primary" whiteSpace="pre-wrap" mb={idx < riskAssessment.notes!.split('\n\n').length - 1 ? "8px" : "0"}>
                                        {section}
                                      </Typography>
                                    );
                                  })}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* Manual Risk Determination Form */}
                      <Box
                        bg="mukuru.cards.white"
                        borderRadius="12px"
                        border="1px solid"
                        borderColor="mukuru.grey.light"
                        overflow="hidden"
                      >
                        <Box p="14px 16px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="mukuru.background.light">
                          <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                            Determine Risk Level
                          </Typography>
                        </Box>
                        <Box p="20px">
                          <VStack align="stretch" gap="20px" width="full">
                            {/* Risk Level Field */}
                            <Box width="full">
                              <VStack align="flex-start" gap="4px" mb="10px">
                                <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                                  Risk Level <Box as="span" color="mukuru.text.error">*</Box>
                                </Typography>
                                <Typography fontSize="12px" color="mukuru.grey.medium" lineHeight="1.4">
                                  Select the appropriate risk level based on your manual assessment
                                </Typography>
                              </VStack>
                              <select
                                value={manualRiskLevel}
                                onChange={(e) => setManualRiskLevel(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '12px 14px',
                                  border: '1px solid #E9E9EA',
                                  borderRadius: '10px',
                                  fontSize: '14px',
                                  backgroundColor: 'white',
                                  color: '#373A36',
                                  minHeight: '44px',
                                  cursor: 'pointer',
                                  outline: 'none',
                                }}
                              >
                                <option value="">Select Risk Level</option>
                                <option value="Low">Low</option>
                                <option value="MediumLow">Medium Low</option>
                                <option value="Medium">Medium</option>
                                <option value="MediumHigh">Medium High</option>
                                <option value="High">High</option>
                              </select>
                            </Box>

                            {/* Justification Field */}
                            <Box width="full">
                              <VStack align="flex-start" gap="4px" mb="10px">
                                <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                                  Justification <Box as="span" color="mukuru.text.error">*</Box>
                                </Typography>
                                <Typography fontSize="12px" color="mukuru.grey.medium" lineHeight="1.4">
                                  Provide a detailed justification for the selected risk level. This is required for audit and compliance purposes.
                                </Typography>
                              </VStack>
                              <Textarea
                                value={riskJustification}
                                onChange={(e) => setRiskJustification(e.target.value)}
                                placeholder="Enter your justification for the risk level determination. Include specific factors, concerns, or observations that led to this assessment..."
                                rows={4}
                                resize="vertical"
                                minH="100px"
                                borderRadius="10px"
                                border="1px solid"
                                borderColor="mukuru.grey.light"
                                p="12px"
                                fontSize="13px"
                                color="mukuru.text.primary"
                                bg="mukuru.cards.white"
                                _placeholder={{ color: 'mukuru.grey.medium' }}
                                _focus={{ borderColor: 'mukuru.buttons.primary', boxShadow: '0 0 0 1px rgba(240, 84, 35, 0.2)' }}
                              />
                            </Box>

                            {/* Enhanced Risk Analysis Fields (Optional) */}
                            {/* These fields are optional and available for any risk level */}
                            {(manualRiskLevel === 'High' ||
                              manualRiskLevel === 'MediumHigh' ||
                              riskAssessment?.overallRiskLevel === 'High' ||
                              riskAssessment?.overallRiskLevel === 'MediumHigh') && (
                              <>
                                {/* Risk Factors Identified */}
                                <Box width="full">
                                  <VStack align="flex-start" gap="4px" mb="10px">
                                    <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                                      Risk Factors Identified
                                    </Typography>
                                    <Typography fontSize="12px" color="mukuru.grey.medium" lineHeight="1.4">
                                      List all specific risk factors that contributed to this assessment
                                    </Typography>
                                  </VStack>
                                  <Textarea
                                    value={riskFactors}
                                    onChange={(e) => setRiskFactors(e.target.value)}
                                    placeholder="e.g., High-risk jurisdiction, Complex ownership structure, Unusual transaction patterns, PEP involvement..."
                                    rows={3}
                                    resize="vertical"
                                    minH="80px"
                                    borderRadius="10px"
                                    border="1px solid"
                                    borderColor="mukuru.grey.light"
                                    p="12px"
                                    fontSize="13px"
                                    color="mukuru.text.primary"
                                    bg="mukuru.cards.white"
                                    _placeholder={{ color: 'mukuru.grey.medium' }}
                                    _focus={{ borderColor: 'mukuru.buttons.primary', boxShadow: '0 0 0 1px rgba(240, 84, 35, 0.2)' }}
                                  />
                                </Box>

                                {/* Mitigation Measures */}
                                <Box width="full">
                                  <VStack align="flex-start" gap="4px" mb="10px">
                                    <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                                      Mitigation Measures
                                    </Typography>
                                    <Typography fontSize="12px" color="mukuru.grey.medium" lineHeight="1.4">
                                      Describe any mitigation measures or additional due diligence required
                                    </Typography>
                                  </VStack>
                                  <Textarea
                                    value={mitigationMeasures}
                                    onChange={(e) => setMitigationMeasures(e.target.value)}
                                    placeholder="e.g., Enhanced due diligence, Additional documentation required, Ongoing monitoring, Senior management approval..."
                                    rows={3}
                                    resize="vertical"
                                    minH="80px"
                                    borderRadius="10px"
                                    border="1px solid"
                                    borderColor="mukuru.grey.light"
                                    p="12px"
                                    fontSize="13px"
                                    color="mukuru.text.primary"
                                    bg="mukuru.cards.white"
                                    _placeholder={{ color: 'mukuru.grey.medium' }}
                                    _focus={{ borderColor: 'mukuru.buttons.primary', boxShadow: '0 0 0 1px rgba(240, 84, 35, 0.2)' }}
                                  />
                                </Box>

                                {/* Additional Notes */}
                                <Box width="full">
                                  <VStack align="flex-start" gap="4px" mb="10px">
                                    <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                                      Additional Notes
                                    </Typography>
                                    <Typography fontSize="12px" color="mukuru.grey.medium" lineHeight="1.4">
                                      Any additional observations or recommendations
                                    </Typography>
                                  </VStack>
                                  <Textarea
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    placeholder="Enter any additional notes or recommendations..."
                                    rows={3}
                                    resize="vertical"
                                    minH="80px"
                                    borderRadius="10px"
                                    border="1px solid"
                                    borderColor="mukuru.grey.light"
                                    p="12px"
                                    fontSize="13px"
                                    color="mukuru.text.primary"
                                    bg="mukuru.cards.white"
                                    _placeholder={{ color: 'mukuru.grey.medium' }}
                                    _focus={{ borderColor: 'mukuru.buttons.primary', boxShadow: '0 0 0 1px rgba(240, 84, 35, 0.2)' }}
                                  />
                                </Box>
                              </>
                            )}

                            {/* Create Enhanced Risk Assessment Button */}
                            {/* Only show for High/Critical cases after risk level has been saved */}
                            {riskAssessment?.id &&
                              (riskAssessment.overallRiskLevel === 'HIGH' ||
                                riskAssessment.overallRiskLevel === 'CRITICAL') && (
                                <Box width="full" mt="16px">
                                  <Link 
                                    href={`/risk-assessment/${riskAssessment.id}`} 
                                    style={{ width: '100%' }}
                                  >
                                    <Button 
                                      variant="primary" 
                                      w="full" 
                                      size="md"
                                    >
                                      <FiShield size={16} style={{ marginRight: '8px' }} />
                                      Create Enhanced Risk Assessment
                                      <FiArrowRight size={16} style={{ marginLeft: '8px' }} />
                                    </Button>
                                  </Link>
                                </Box>
                              )}

                            {/* Action Buttons */}
                            <Box width="full" height="1px" bg="mukuru.grey.light" mt="12px" />

                            <HStack gap="16px" justify="flex-end" pt="20px" width="full">
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setManualRiskLevel(
                                    riskAssessment?.overallRiskLevel ||
                                      workItem?.riskLevel ||
                                      ''
                                  );
                                  setRiskJustification('');
                                  setRiskFactors('');
                                  setMitigationMeasures('');
                                  setAdditionalNotes('');
                                }}
                                size="md"
                              >
                                Reset
                              </Button>
                              <Button
                                variant="primary"
                                onClick={handleSaveRiskAssessment}
                                loading={savingRiskAssessment}
                                disabled={!manualRiskLevel || !riskJustification.trim()}
                                size="md"
                              >
                                <FiSave size={16} style={{ marginRight: '8px' }} />
                                Save Risk Assessment
                              </Button>
                            </HStack>
                          </VStack>
                        </Box>
                      </Box>
                    </VStack>
                  )}
                </Box>
              </Box>
            )}

            {(currentStep === 4 || currentStep === 'review-decision') && (
              <Box
                bg="mukuru.cards.white"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
                overflow="hidden"
              >
                <Box p="16px 20px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="mukuru.background.light">
                  <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
                    Review & Decision
                  </Typography>
                </Box>
                <Box p="24px">
                  <VStack align="stretch" gap="24px">
                    {/* Review Notes */}
                    <Box>
                      <Typography fontSize="13px" fontWeight="600" color="mukuru.text.primary" mb="8px">
                        Review Notes
                      </Typography>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Enter your review notes..."
                        rows={5}
                        minH="120px"
                        borderRadius="12px"
                        border="1px solid"
                        borderColor="mukuru.grey.light"
                        p="14px"
                        fontSize="14px"
                        color="mukuru.text.primary"
                        _placeholder={{ color: 'mukuru.grey.medium' }}
                        _focus={{ borderColor: 'mukuru.buttons.primary', boxShadow: '0 0 0 1px rgba(240, 84, 35, 0.2)' }}
                      />
                    </Box>

                    {/* Divider */}
                    <Box h="1px" bg="mukuru.grey.light" />

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                      {workItem.status === 'IN PROGRESS' && (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => setCompleteModalOpen(true)}
                            size="md"
                            w="full"
                            className="mukuru-primary-button"
                          >
                            <HStack gap="2" align="center" justify="center">
                              <IconWrapper>
                                <TickCircleIcon />
                              </IconWrapper>
                              <Typography color="mukuru.white">
                                Complete Review
                              </Typography>
                            </HStack>
                          </Button>
                          {workItem.requiresApproval && (
                            <Button
                              variant="primary"
                              onClick={() => setSubmitApprovalModalOpen(true)}
                              size="md"
                              w="full"
                              className="mukuru-primary-button"
                            >
                              <HStack gap="2" align="center" justify="center">
                                <IconWrapper>
                                  <FiSend size={16} color="mukuru.white" />
                                </IconWrapper>
                                <Typography color="mukuru.white">
                                  Submit for Approval
                                </Typography>
                              </HStack>
                            </Button>
                          )}
                        </>
                      )}
                      {workItem.status === 'RISK REVIEW' && (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => setApproveModalOpen(true)}
                            size="md"
                            w="full"
                            className="mukuru-primary-button"
                          >
                            <HStack gap="2" align="center" justify="center">
                              <IconWrapper>
                                <TickCircleIcon />
                              </IconWrapper>
                              <Typography color="mukuru.white">Approve</Typography>
                            </HStack>
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => setDeclineModalOpen(true)}
                            size="md"
                            w="full"
                            className="mukuru-primary-button"
                          >
                            <HStack gap="2" align="center" justify="center">
                              <IconWrapper>
                                <CloseIcon />
                              </IconWrapper>
                              <Typography color="mukuru.white">Decline</Typography>
                            </HStack>
                          </Button>
                        </>
                      )}
                    </SimpleGrid>
                  </VStack>
                </Box>
              </Box>
            )}
          </MotionBox>
        </Box>
      </Box>

      {/* Approve Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Work Item"
        size="small"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="700" color="mukuru.text.primary">
            Approve Work Item
          </Typography>
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" gap="4">
            <Field.Root>
              <Field.Label color="mukuru.text.primary">Notes (Optional)</Field.Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add approval notes..."
                rows={4}
                color="mukuru.text.primary"
                _placeholder={{ color: 'mukuru.grey.medium', opacity: 1 }}
              />
            </Field.Root>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="2">
            <Button variant="secondary" onClick={() => setApproveModalOpen(false)}>
              <Typography color="mukuru.text.primary">Cancel</Typography>
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={actionLoading}
              className="mukuru-primary-button"
            >
              <Typography color="mukuru.white">Approve</Typography>
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>

      {/* Decline Modal */}
      <Modal
        isOpen={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        title="Decline Work Item"
        size="small"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="700">
            Decline Work Item
          </Typography>
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" gap="4">
            <Field.Root required>
              <Field.Label color="mukuru.text.primary">Reason for Decline</Field.Label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please provide a reason for declining..."
                rows={4}
                color="mukuru.text.primary"
                _placeholder={{ color: 'mukuru.grey.medium', opacity: 1 }}
              />
            </Field.Root>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="2">
            <Button variant="secondary" onClick={() => setDeclineModalOpen(false)}>
              <Typography color="mukuru.text.primary">Cancel</Typography>
            </Button>
            <Button
              variant="primary"
              onClick={handleDecline}
              disabled={actionLoading || !declineReason.trim()}
              className="mukuru-primary-button"
            >
              <Typography color="mukuru.white">Decline</Typography>
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>

      {/* Complete Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Work Item"
        size="small"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="700">
            Complete Work Item
          </Typography>
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" gap="4">
            <Field.Root>
              <Field.Label color="mukuru.text.primary">Notes (Optional)</Field.Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add completion notes..."
                rows={4}
                color="mukuru.text.primary"
                _placeholder={{ color: 'mukuru.grey.medium', opacity: 1 }}
              />
            </Field.Root>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="2">
            <Button variant="secondary" onClick={() => setCompleteModalOpen(false)}>
              <Typography color="mukuru.text.primary">Cancel</Typography>
            </Button>
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={actionLoading}
              className="mukuru-primary-button"
            >
              <Typography color="mukuru.white">Complete</Typography>
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>

      {/* Submit for Approval Modal */}
      <Modal
        isOpen={submitApprovalModalOpen}
        onClose={() => setSubmitApprovalModalOpen(false)}
        title="Submit for Approval"
        size="small"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="700">
            Submit for Approval
          </Typography>
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" gap="4">
            <Field.Root>
              <Field.Label color="mukuru.text.primary">Notes (Optional)</Field.Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes for approval..."
                rows={4}
                color="mukuru.text.primary"
                _placeholder={{ color: 'mukuru.grey.medium', opacity: 1 }}
              />
            </Field.Root>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="2">
            <Button variant="secondary" onClick={() => setSubmitApprovalModalOpen(false)}>
              <Typography color="mukuru.text.primary">Cancel</Typography>
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitForApproval}
              disabled={actionLoading}
              className="mukuru-primary-button"
            >
              <Typography color="mukuru.white">Submit</Typography>
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>

      {/* Comments Modal */}
      {commentsModalOpen && (
        <>
          {/* Backdrop */}
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="rgba(0, 0, 0, 0.5)"
            zIndex={9998}
            onClick={() => setCommentsModalOpen(false)}
          />
          
          {/* Modal */}
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="mukuru.cards.white"
            borderRadius="16px"
            boxShadow="0 20px 60px rgba(0, 0, 0, 0.2)"
            zIndex={9999}
            w="90%"
            maxW="560px"
            maxH="85vh"
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            {/* Header */}
            <Box p="24px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="mukuru.background.light">
              <HStack justify="space-between" align="center">
                <HStack gap="16px">
                  <Box
                    w="48px"
                    h="48px"
                    borderRadius="12px"
                    bg="rgba(240, 84, 35, 0.08)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiMessageSquare size={24} color="var(--chakra-colors-mukuru-buttons-primary)" />
                  </Box>
                  <VStack align="start" gap="2px">
                    <Typography fontSize="18px" fontWeight="600" color="mukuru.text.primary">
                      Comments
                    </Typography>
                    <Typography fontSize="13px" color="mukuru.grey.medium">
                      {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                    </Typography>
                  </VStack>
                </HStack>
                <Box
                  as="button"
                  onClick={() => setCommentsModalOpen(false)}
                  w="36px"
                  h="36px"
                  borderRadius="10px"
                  bg="mukuru.background.light"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  _hover={{ bg: 'mukuru.grey.light' }}
                >
                  <FiX size={20} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                </Box>
              </HStack>
            </Box>

            {/* Content */}
            <Box flex="1" overflowY="auto" p="24px">
              {comments.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py="48px" gap="20px">
                  <Box
                    w="72px"
                    h="72px"
                    borderRadius="16px"
                    bg="mukuru.background.light"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiMessageSquare size={32} color="var(--chakra-colors-mukuru-grey-medium)" />
                  </Box>
                  <VStack gap="8px" maxW="280px">
                    <Typography fontSize="16px" fontWeight="600" color="mukuru.text.primary">
                      No comments yet
                    </Typography>
                    <Typography fontSize="14px" color="mukuru.grey.medium" textAlign="center" lineHeight="1.5">
                      Be the first to add a comment to this work item
                    </Typography>
                  </VStack>
                </Flex>
              ) : (
                <VStack align="stretch" gap="16px">
                  {comments.map((comment: unknown, idx: number) => {
                    const commentObj = comment as Record<string, unknown>;
                    return (
                      <Box
                        key={idx}
                        p="16px"
                        bg="mukuru.background.light"
                        borderRadius="12px"
                        border="1px solid"
                        borderColor="mukuru.grey.light"
                      >
                        <HStack gap="12px" mb="12px">
                          <Box
                            w="36px"
                            h="36px"
                            borderRadius="full"
                            bg="mukuru.grey.light"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <FiUser size={18} color="var(--chakra-colors-mukuru-grey-mediumDark)" />
                          </Box>
                          <VStack align="start" gap="2px" flex="1">
                            <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                              {commentObj.createdBy
                                ? String(commentObj.createdBy)
                                : commentObj.authorName
                                  ? String(commentObj.authorName)
                                  : 'Unknown User'}
                            </Typography>
                            <HStack gap="6px" align="center">
                              <FiClock size={12} color="var(--chakra-colors-mukuru-grey-medium)" />
                              <Typography fontSize="12px" color="mukuru.grey.medium">
                                {new Date(
                                  String(commentObj.createdAt || commentObj.timestamp || Date.now())
                                ).toLocaleString()}
                              </Typography>
                            </HStack>
                          </VStack>
                        </HStack>
                        <Typography fontSize="14px" color="mukuru.text.primary" lineHeight="1.6">
                          {commentObj.text
                            ? String(commentObj.text)
                            : commentObj.comment
                              ? String(commentObj.comment)
                              : 'No comment text'}
                        </Typography>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>

            {/* Footer - Add Comment */}
            <Box p="24px" borderTop="1px solid" borderColor="mukuru.grey.light" bg="mukuru.cards.white">
              <VStack align="stretch" gap="16px">
                <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                  Add Comment
                </Typography>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your comment here..."
                  rows={3}
                  borderRadius="10px"
                  border="1px solid"
                  borderColor="mukuru.grey.light"
                  p="14px"
                  fontSize="14px"
                  color="mukuru.text.primary"
                  bg="mukuru.cards.white"
                  _placeholder={{ color: 'mukuru.grey.medium' }}
                  _focus={{ borderColor: 'mukuru.buttons.primary', boxShadow: '0 0 0 2px rgba(240, 84, 35, 0.15)' }}
                />
                <HStack justify="flex-end" gap="12px">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setNewComment('');
                      setCommentsModalOpen(false);
                    }}
                    size="md"
                    style={{
                      height: '44px',
                      padding: '0 24px',
                      borderRadius: '10px',
                      border: '1px solid #E9E9EA',
                      background: 'white',
                    }}
                  >
                    <Typography fontSize="14px" fontWeight="500" color="mukuru.text.primary">
                      Cancel
                    </Typography>
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAddComment}
                    disabled={actionLoading || !newComment.trim()}
                    loading={actionLoading}
                    className="mukuru-primary-button"
                    size="md"
                    style={{
                      height: '44px',
                      padding: '0 24px',
                      borderRadius: '10px',
                      background: 'var(--chakra-colors-mukuru-buttons-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FiSend size={16} color="white" />
                    <Typography fontSize="14px" fontWeight="500" color="white">
                      Post Comment
                    </Typography>
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </Box>
        </>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <>
          {/* Backdrop */}
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="rgba(0, 0, 0, 0.4)"
            zIndex={9998}
            onClick={() => setHistoryModalOpen(false)}
          />
          
          {/* Modal */}
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="mukuru.cards.white"
            borderRadius="20px"
            boxShadow="0 25px 80px rgba(0, 0, 0, 0.15)"
            zIndex={9999}
            w="90%"
            maxW="480px"
            maxH="80vh"
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            {/* Header */}
            <Box p="20px 24px" borderBottom="1px solid" borderColor="#EAECF0">
              <HStack justify="space-between" align="center">
                <HStack gap="14px">
                  <Box
                    w="44px"
                    h="44px"
                    borderRadius="12px"
                    bg="#FEF3F2"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiClock size={22} color="var(--chakra-colors-mukuru-buttons-primary)" />
                  </Box>
                  <VStack align="start" gap="2px">
                    <Typography fontSize="17px" fontWeight="600" color="#1D2939">
                      Activity History
                    </Typography>
                    <Typography fontSize="13px" color="#667085">
                      {history.length} {history.length === 1 ? 'activity' : 'activities'}
                    </Typography>
                  </VStack>
                </HStack>
                <Box
                  as="button"
                  onClick={() => setHistoryModalOpen(false)}
                  w="32px"
                  h="32px"
                  borderRadius="8px"
                  bg="transparent"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  _hover={{ bg: '#F2F4F7' }}
                  transition="background 0.15s"
                >
                  <FiX size={20} color="#667085" />
                </Box>
              </HStack>
            </Box>

            {/* Content */}
            <Box flex="1" overflowY="auto" p="20px 24px">
              {history.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py="40px" gap="16px">
                  <Box
                    w="64px"
                    h="64px"
                    borderRadius="16px"
                    bg="#F9FAFB"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiClock size={28} color="#98A2B3" />
                  </Box>
                  <VStack gap="6px" maxW="260px">
                    <Typography fontSize="15px" fontWeight="600" color="#1D2939">
                      No history yet
                    </Typography>
                    <Typography fontSize="13px" color="#667085" textAlign="center" lineHeight="1.5">
                      Activity will appear here as actions are performed
                    </Typography>
                  </VStack>
                </Flex>
              ) : (
                <VStack align="stretch" gap="12px">
                  {history.map((entry: unknown, idx: number) => {
                    const entryObj = entry as Record<string, unknown>;
                    const action = entryObj.action
                      ? String(entryObj.action)
                      : entryObj.description
                        ? String(entryObj.description)
                        : entryObj.eventType
                          ? String(entryObj.eventType)
                          : 'Activity';
                    
                    return (
                      <Box
                        key={idx}
                        p="14px 16px"
                        bg="#F9FAFB"
                        borderRadius="10px"
                        borderLeft="3px solid"
                        borderLeftColor="mukuru.buttons.primary"
                        transition="all 0.15s"
                        _hover={{ bg: '#F3F4F6' }}
                      >
                        <HStack justify="space-between" align="center">
                          <HStack gap="12px" flex="1">
                            <Box
                              w="32px"
                              h="32px"
                              borderRadius="8px"
                              bg="mukuru.cards.white"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                            >
                              <FiCheckSquare size={16} color="var(--chakra-colors-mukuru-buttons-primary)" />
                            </Box>
                            <Typography fontSize="14px" fontWeight="500" color="#1D2939">
                              {action}
                            </Typography>
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>

            {/* Footer */}
            <Box p="16px 24px" borderTop="1px solid" borderColor="#EAECF0">
              <Button
                variant="secondary"
                onClick={() => setHistoryModalOpen(false)}
                w="full"
                size="md"
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid #D0D5DD',
                  background: 'white',
                  fontWeight: '500',
                }}
              >
                <Typography fontSize="14px" fontWeight="500" color="#344054">
                  Close
                </Typography>
              </Button>
            </Box>
          </Box>
        </>
      )}

      {/* Reassign Modal */}
      {reassignModalOpen && (
        <>
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="rgba(0, 0, 0, 0.4)"
            zIndex={9998}
            onClick={() => setReassignModalOpen(false)}
          />
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="mukuru.cards.white"
            borderRadius="20px"
            boxShadow="0 25px 80px rgba(0, 0, 0, 0.15)"
            zIndex={9999}
            w="90%"
            maxW="420px"
            overflow="hidden"
          >
            <Box p="20px 24px" borderBottom="1px solid" borderColor="#EAECF0">
              <HStack justify="space-between" align="center">
                <HStack gap="14px">
                  <Box
                    w="44px"
                    h="44px"
                    borderRadius="12px"
                    bg="#FEF3F2"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiUser size={22} color="var(--chakra-colors-mukuru-buttons-primary)" />
                  </Box>
                  <VStack align="start" gap="2px">
                    <Typography fontSize="17px" fontWeight="600" color="#1D2939">
                      Reassign Work Item
                    </Typography>
                    <Typography fontSize="13px" color="#667085">
                      Assign to another team member
                    </Typography>
                  </VStack>
                </HStack>
                <Box
                  as="button"
                  onClick={() => setReassignModalOpen(false)}
                  w="32px"
                  h="32px"
                  borderRadius="8px"
                  bg="transparent"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  _hover={{ bg: '#F2F4F7' }}
                >
                  <FiX size={20} color="#667085" />
                </Box>
              </HStack>
            </Box>
            <Box p="24px">
              <VStack align="stretch" gap="16px">
                <Box>
                  <Typography fontSize="14px" fontWeight="500" color="#344054" mb="6px">
                    User ID
                  </Typography>
                  <Textarea
                    value={reassignUserId}
                    onChange={(e) => setReassignUserId(e.target.value)}
                    placeholder="Enter user ID or email..."
                    rows={1}
                    borderRadius="10px"
                    border="1px solid"
                    borderColor="#D0D5DD"
                    p="12px"
                    fontSize="14px"
                    color="#1D2939"
                    bg="mukuru.cards.white"
                    _placeholder={{ color: '#98A2B3' }}
                    _focus={{ borderColor: 'mukuru.buttons.primary', boxShadow: '0 0 0 2px rgba(240, 84, 35, 0.1)' }}
                  />
                </Box>
                <Box>
                  <Typography fontSize="14px" fontWeight="500" color="#344054" mb="6px">
                    User Name
                  </Typography>
                  <Textarea
                    value={reassignUserName}
                    onChange={(e) => setReassignUserName(e.target.value)}
                    placeholder="Enter user name..."
                    rows={1}
                    borderRadius="10px"
                    border="1px solid"
                    borderColor="#D0D5DD"
                    p="12px"
                    fontSize="14px"
                    color="#1D2939"
                    bg="mukuru.cards.white"
                    _placeholder={{ color: '#98A2B3' }}
                    _focus={{ borderColor: 'mukuru.buttons.primary', boxShadow: '0 0 0 2px rgba(240, 84, 35, 0.1)' }}
                  />
                </Box>
              </VStack>
            </Box>
            <Box p="16px 24px" borderTop="1px solid" borderColor="#EAECF0">
              <HStack justify="flex-end" gap="12px">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setReassignModalOpen(false);
                    setReassignUserId('');
                    setReassignUserName('');
                  }}
                  size="md"
                  style={{ height: '42px', borderRadius: '10px', border: '1px solid #D0D5DD', background: 'white' }}
                >
                  <Typography fontSize="14px" fontWeight="500" color="#344054">Cancel</Typography>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleReassign}
                  disabled={actionLoading || !reassignUserId.trim() || !reassignUserName.trim()}
                  loading={actionLoading}
                  className="mukuru-primary-button"
                  size="md"
                  style={{ height: '42px', borderRadius: '10px', background: 'var(--chakra-colors-mukuru-buttons-primary)' }}
                >
                  <Typography fontSize="14px" fontWeight="500" color="white">Reassign</Typography>
                </Button>
              </HStack>
            </Box>
          </Box>
        </>
      )}

      {/* Request Refresh Modal */}
      {refreshModalOpen && (
        <>
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="rgba(0, 0, 0, 0.4)"
            zIndex={9998}
            onClick={() => setRefreshModalOpen(false)}
          />
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="mukuru.cards.white"
            borderRadius="20px"
            boxShadow="0 25px 80px rgba(0, 0, 0, 0.15)"
            zIndex={9999}
            w="90%"
            maxW="420px"
            overflow="hidden"
          >
            <Box p="20px 24px" borderBottom="1px solid" borderColor="#EAECF0">
              <HStack justify="space-between" align="center">
                <HStack gap="14px">
                  <Box
                    w="44px"
                    h="44px"
                    borderRadius="12px"
                    bg="#FEF3F2"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiRefreshCw size={22} color="var(--chakra-colors-mukuru-buttons-primary)" />
                  </Box>
                  <VStack align="start" gap="2px">
                    <Typography fontSize="17px" fontWeight="600" color="#1D2939">
                      Request Document Refresh
                    </Typography>
                    <Typography fontSize="13px" color="#667085">
                      Ask applicant to update documents
                    </Typography>
                  </VStack>
                </HStack>
                <Box
                  as="button"
                  onClick={() => setRefreshModalOpen(false)}
                  w="32px"
                  h="32px"
                  borderRadius="8px"
                  bg="transparent"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  _hover={{ bg: '#F2F4F7' }}
                >
                  <FiX size={20} color="#667085" />
                </Box>
              </HStack>
            </Box>
            <Box p="24px">
              <Box p="16px" bg="#FEF3F2" borderRadius="12px" border="1px solid" borderColor="#FECDCA">
                <HStack gap="12px" align="start">
                  <FiAlertTriangle size={20} color="var(--chakra-colors-mukuru-buttons-primary)" />
                  <VStack align="start" gap="4px">
                    <Typography fontSize="14px" fontWeight="500" color="#B42318">
                      This will notify the applicant
                    </Typography>
                    <Typography fontSize="13px" color="#667085" lineHeight="1.5">
                      The applicant will be asked to provide updated or additional documents. The work item will be moved to &quot;Pending Refresh&quot; status.
                    </Typography>
                  </VStack>
                </HStack>
              </Box>
            </Box>
            <Box p="16px 24px" borderTop="1px solid" borderColor="#EAECF0">
              <HStack justify="flex-end" gap="12px">
                <Button
                  variant="secondary"
                  onClick={() => setRefreshModalOpen(false)}
                  size="md"
                  style={{ height: '42px', borderRadius: '10px', border: '1px solid #D0D5DD', background: 'white' }}
                >
                  <Typography fontSize="14px" fontWeight="500" color="#344054">Cancel</Typography>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleMarkForRefresh}
                  disabled={actionLoading}
                  loading={actionLoading}
                  className="mukuru-primary-button"
                  size="md"
                  style={{ height: '42px', borderRadius: '10px', background: 'var(--chakra-colors-mukuru-buttons-primary)' }}
                >
                  <HStack gap="8px">
                    <FiRefreshCw size={16} />
                    <Typography fontSize="14px" fontWeight="500" color="white">Request Refresh</Typography>
                  </HStack>
                </Button>
              </HStack>
            </Box>
          </Box>
        </>
      )}

      {/* Document Viewer */}
      <DocumentViewer
        isOpen={documentViewerOpen}
        onClose={() => {
          setDocumentViewerOpen(false);
          setViewingDocumentUrl(null);
          setViewingDocumentName('');
          setViewingDocumentType(undefined);
          setViewingDocumentSize(undefined);
        }}
        documentUrl={viewingDocumentUrl}
        fileName={viewingDocumentName}
        documentType={viewingDocumentType}
        fileSize={viewingDocumentSize}
        onDownload={() => {
          if (viewingDocumentUrl) {
            window.open(viewingDocumentUrl, '_blank');
          }
        }}
      />

      {/* Toast Notifications */}
      {toast && (
        <Box
          position="fixed"
          top="100px"
          right="24px"
          zIndex={10000}
          maxW="400px"
          animation="slideInRight 0.3s ease-out"
        >
          <AlertBar
            status={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => setToast(null)}
          />
        </Box>
      )}
    </Box>
  );
}
