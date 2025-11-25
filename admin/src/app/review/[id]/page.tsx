"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Flex,
  SimpleGrid,
  Textarea,
  Progress,
  Separator,
  Spinner,
  Field
} from "@chakra-ui/react";
import { 
  FiFileText, 
  FiCheckSquare, 
  FiUsers, 
  FiUserCheck, 
  FiFolder, 
  FiPhone, 
  FiCheck,
  FiX,
  FiArrowRight,
  FiArrowLeft,
  FiEdit3,
  FiMessageSquare,
  FiClock,
  FiAlertTriangle,
  FiDownload,
  FiShield,
  FiSend,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiFlag,
  FiEye,
  FiSave
} from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AdminSidebar from "../../../components/AdminSidebar";
import { DocumentViewer } from "../../../components/DocumentViewer";
import {
  fetchWorkItemById,
  fetchMyWorkItems,
  fetchWorkItems,
  approveWorkItemUseCase,
  declineWorkItemUseCase,
  completeWorkItemUseCase,
  submitForApprovalUseCase,
  addCommentUseCase,
  fetchWorkItemComments,
  fetchWorkItemHistory,
  WorkItemApplication,
} from "../../../services";
import { logger } from "../../../lib/logger";
import { useSession } from "next-auth/react";
import { fetchEntitySchema } from "../../../lib/entitySchemaRenderer";
import { riskApiService, RiskAssessmentDto } from "../../../services/riskApi";
import { Typography, Button, Card, Input, Modal, ModalHeader, ModalBody, ModalFooter, AlertBar, Tag, IconWrapper, TabsRoot, TabsList, TabsTrigger, TabsIndicator, TabsContent } from "@/lib/mukuruImports";

const MotionBox = motion(Box);

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const workItemId = params?.id as string;
  
  const [workItem, setWorkItem] = useState<WorkItemApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Review state
  const [reviewNotes, setReviewNotes] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  
  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [submitApprovalModalOpen, setSubmitApprovalModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  
  // Document viewer state
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);
  const [viewingDocumentName, setViewingDocumentName] = useState("");
  const [viewingDocumentType, setViewingDocumentType] = useState<string | undefined>(undefined);
  const [viewingDocumentSize, setViewingDocumentSize] = useState<number | undefined>(undefined);
  
  // Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [entitySchema, setEntitySchema] = useState<any>(null);
  const [requirementMap, setRequirementMap] = useState<Map<string, string>>(new Map());
  
  // Risk Assessment state
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentDto | null>(null);
  const [riskAssessmentLoading, setRiskAssessmentLoading] = useState(false);
  const [manualRiskLevel, setManualRiskLevel] = useState<string>("");
  const [riskJustification, setRiskJustification] = useState<string>("");
  const [savingRiskAssessment, setSavingRiskAssessment] = useState(false);
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);
  
  // Toast notifications
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  
  const showToast = (title: string, description: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 5000) => {
    setToast({ title, description, type });
    setTimeout(() => setToast(null), duration);
  };

  useEffect(() => {
    if (workItemId) {
      loadWorkItem();
      loadComments();
      loadHistory();
    }
  }, [workItemId]);

  useEffect(() => {
    // Load application data and entity schema when work item is loaded
    if (workItem) {
      loadApplicationData();
    }
  }, [workItem]);

  useEffect(() => {
    // Load documents when Documents step is active and work item is loaded
    if (currentStep === 2 && workItem) {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, workItem, applicationData, requirementMap]);

  useEffect(() => {
    // Load risk assessment when Risk Assessment step is active and work item is loaded
    if (currentStep === 3 && workItem) {
      loadRiskAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, workItem]);

  const loadWorkItem = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get work item details
      const result = await fetchMyWorkItems(1, 1000);
      const item = result.items.find(w => w.workItemId === workItemId || w.id === workItemId);
      
      if (!item) {
        // Try getting from all work items
        const allResult = await fetchWorkItems({ pageSize: 1000 });
        const foundItem = allResult.items.find(w => w.workItemId === workItemId || w.id === workItemId);
        
        if (!foundItem) {
          setError('Work item not found');
          return;
        }
        
        setWorkItem(foundItem);
      } else {
        setWorkItem(item);
      }
    } catch (err) {
      console.error('Error loading work item:', err);
      setError(err instanceof Error ? err.message : 'Failed to load work item');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const commentsData = await fetchWorkItemComments(workItemId);
      setComments(commentsData);
    } catch (err) {
      logger.error(err, 'Error loading comments', {
        tags: { error_type: 'comments_load_error' }
      });
      setComments([]);
    }
  };

  const loadHistory = async () => {
    try {
      const historyData = await fetchWorkItemHistory(workItemId);
      setHistory(historyData);
    } catch (err) {
      logger.error(err, 'Error loading history', {
        tags: { error_type: 'history_load_error' }
      });
      setHistory([]);
    }
  };

  const handleApprove = async () => {
    if (!workItem) return;
    
    setActionLoading(true);
    try {
      await approveWorkItemUseCase(workItem.workItemId || workItem.id, reviewNotes);
      showToast('Approved', 'Work item has been approved successfully', 'success', 3000);
      setApproveModalOpen(false);
      setReviewNotes("");
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve work item';
      showToast('Approval failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!workItem || !declineReason.trim()) return;
    
    setActionLoading(true);
    try {
      await declineWorkItemUseCase(workItem.workItemId || workItem.id, declineReason);
      showToast('Declined', 'Work item has been declined', 'success', 3000);
      setDeclineModalOpen(false);
      setDeclineReason("");
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decline work item';
      showToast('Decline failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!workItem) return;
    
    setActionLoading(true);
    try {
      await completeWorkItemUseCase(workItem.workItemId || workItem.id, reviewNotes);
      showToast('Completed', 'Work item has been completed successfully', 'success', 3000);
      setCompleteModalOpen(false);
      setReviewNotes("");
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete work item';
      showToast('Completion failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!workItem) return;
    
    setActionLoading(true);
    try {
      await submitForApprovalUseCase(workItem.workItemId || workItem.id, reviewNotes);
      showToast('Submitted', 'Work item has been submitted for approval', 'success', 3000);
      setSubmitApprovalModalOpen(false);
      setReviewNotes("");
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit for approval';
      showToast('Submission failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !workItem) return;
    
    setActionLoading(true);
    try {
      await addCommentUseCase(workItem.workItemId || workItem.id, newComment);
      showToast('Comment added', 'Your comment has been added', 'success', 3000);
      setNewComment("");
      await loadComments();
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      showToast('Comment failed', errorMessage, 'error', 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const loadApplicationData = async () => {
    if (!workItem) return;
    
    try {
      const caseId = workItem.applicationId || workItem.id;
      if (!caseId) return;
      
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
        
        logger.debug('[Review Page] Extracted entity type code', { entityTypeCode });
        
        if (entityTypeCode) {
          // Fetch entity schema
          const schema = await fetchEntitySchema(entityTypeCode, appData);
          if (schema) {
            setEntitySchema(schema);
            
            // Create requirement code to display name map
            const reqMap = new Map<string, string>();
            schema.sections.forEach(section => {
              section.fields.forEach(field => {
                if (field.type === 'file' || field.type === 'File') {
                  reqMap.set(field.code, field.label);
                }
              });
            });
            setRequirementMap(reqMap);
          }
        }
      }
    } catch (err) {
      logger.error(err, 'Error loading application data', {
        tags: { error_type: 'application_data_load_error' }
      });
    }
  };

  const loadDocuments = async () => {
    if (!workItem) return;
    
    try {
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
      
      let docs: any[] = [];
      if (Array.isArray(documentsData)) {
        docs = documentsData;
      } else if (documentsData.items && Array.isArray(documentsData.items)) {
        docs = documentsData.items;
      }
      
      // Map documents to requirements based on application metadata
      if (applicationData && requirementMap.size > 0) {
        const metadata = applicationData.metadataJson ? JSON.parse(applicationData.metadataJson) : {};
        
        logger.debug('[Document Mapping] Application metadata keys', { keys: Object.keys(metadata) });
        logger.debug('[Document Mapping] Requirement map', { entries: Array.from(requirementMap.entries()) });
        logger.debug('[Document Mapping] Documents to map', { docs: docs.map(d => ({ 
          id: d.id, 
          fileName: d.fileName, 
          documentNumber: d.documentNumber,
          storageKey: d.storageKey,
          type: d.type 
        })));
        
        docs = docs.map(doc => {
          // Try to find which requirement this document belongs to
          let requirementName = null;
          
          const docFileName = (doc.fileName || '').toLowerCase();
          const docNumber = (doc.documentNumber || '').toLowerCase();
          const docId = doc.id ? String(doc.id).toLowerCase() : '';
          const docStorageKey = (doc.storageKey || '').toLowerCase();
          
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
              const metadataDocId = metadata[key];
              if (metadataDocId) {
                const metadataDocIdStr = String(metadataDocId).toLowerCase();
                if (metadataDocIdStr === docId || docId === metadataDocIdStr) {
                  requirementName = reqName;
                  logger.debug(`[Document Mapping] ✅ Matched ${doc.fileName} to ${reqName} via ${key}`);
                  break;
                }
              }
            }
            
            if (requirementName) break;
            
            // Check storage key match
            for (const key of possibleStorageKeys) {
              const metadataStorageKey = metadata[key];
              if (metadataStorageKey) {
                const metadataStorageKeyStr = String(metadataStorageKey).toLowerCase();
                if (metadataStorageKeyStr === docStorageKey || docStorageKey.includes(metadataStorageKeyStr)) {
                  requirementName = reqName;
                  console.log(`[Document Mapping] ✅ Matched ${doc.fileName} to ${reqName} via storage key ${key}`);
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
                const metadataValue = metadata[key];
                if (metadataValue) {
                  const metadataStr = String(metadataValue).toLowerCase();
                  
                  // Match if filename, document number, document ID, or storage key appears in metadata
                  if (metadataStr.includes(docFileName) || 
                      metadataStr.includes(docNumber) ||
                      metadataStr.includes(docId) ||
                      metadataStr.includes(docStorageKey) ||
                      docFileName.includes(metadataStr) ||
                      docNumber.includes(metadataStr)) {
                    requirementName = reqName;
                    logger.debug(`[Document Mapping] ✅ Matched ${doc.fileName} to ${reqName} via ${key}`);
                    break;
                  }
                  
                  // Also check if metadata value is a JSON string containing document info
                  try {
                    const parsed = typeof metadataValue === 'string' ? JSON.parse(metadataValue) : metadataValue;
                    if (typeof parsed === 'object' && parsed !== null) {
                      const parsedStr = JSON.stringify(parsed).toLowerCase();
                      if (parsedStr.includes(docFileName) || 
                          parsedStr.includes(docNumber) ||
                          parsedStr.includes(docId) ||
                          parsedStr.includes(docStorageKey)) {
                        requirementName = reqName;
                        console.log(`[Document Mapping] ✅ Matched ${doc.fileName} to ${reqName} via JSON in ${key}`);
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
              if (valueStr.includes(docFileName) || 
                  valueStr.includes(docNumber) ||
                  valueStr.includes(docId) ||
                  valueStr.includes(docStorageKey)) {
                // Try to find which requirement this key belongs to
                for (const [reqCode, reqName] of requirementMap.entries()) {
                  if (key.toLowerCase().includes(reqCode.toLowerCase()) || 
                      reqCode.toLowerCase().includes(key.toLowerCase())) {
                    requirementName = reqName;
                    console.log(`[Document Mapping] ✅ Matched ${doc.fileName} to ${reqName} via metadata key ${key}`);
                    break;
                  }
                }
                if (requirementName) break;
              }
            }
          }
          
          if (!requirementName) {
            logger.debug(`[Document Mapping] ⚠️ Could not match ${doc.fileName} to any requirement`);
          }
          
          return {
            ...doc,
            requirementName: requirementName || null
          };
        });
      }
      
      setDocuments(docs);
    } catch (err) {
      logger.error(err, 'Error loading documents', {
        tags: { error_type: 'documents_load_error' }
      });
      setDocumentsError(err instanceof Error ? err.message : 'Failed to load documents');
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleViewDocument = async (document: any) => {
    try {
      if (!document || !document.storageKey) {
        showToast('Document error', 'Document storage key not found', 'error', 3000);
        return;
      }

      // Get document download URL through proxy
      const downloadUrl = `/api/proxy-document?storageKey=${encodeURIComponent(document.storageKey)}`;
      
      setViewingDocumentUrl(downloadUrl);
      setViewingDocumentName(document.fileName || document.documentNumber || 'Document');
      setViewingDocumentType(document.type ? String(document.type) : undefined);
      setViewingDocumentSize(document.sizeBytes);
      setDocumentViewerOpen(true);
    } catch (err) {
      logger.error(err, 'Error viewing document', {
        tags: { error_type: 'document_view_error' }
      });
      showToast('View failed', err instanceof Error ? err.message : 'Failed to view document', 'error', 5000);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeName = (doc: any): string => {
    // First try to use requirement name if available
    if (doc.requirementName) {
      return doc.requirementName;
    }
    
    // Fall back to document type enum
    if (doc.type) {
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
      return typeMap[doc.type] || `Type ${doc.type}`;
    }
    
    return 'Unknown';
  };

  const loadRiskAssessment = async () => {
    if (!workItem) return;
    
    try {
      setRiskAssessmentLoading(true);
      const caseId = workItem.applicationId || workItem.id;
      
      if (!caseId) {
        setRiskAssessment(null);
        return;
      }
      
      // Try to get risk assessment by case ID
      const assessment = await riskApiService.getRiskAssessmentByCase(caseId);
      
      if (assessment) {
        // Convert to RiskAssessmentDto format
        const riskData: RiskAssessmentDto = {
          id: assessment.id,
          caseId: assessment.caseId,
          partnerId: '',
          overallRiskLevel: assessment.riskLevel,
          riskScore: assessment.riskScore,
          status: assessment.status,
          createdAt: assessment.submittedDate,
          completedAt: assessment.reviewDate,
          assessedBy: assessment.reviewer,
          notes: assessment.recommendations?.join(', ') || '',
          factors: assessment.riskFactors?.map((f, i) => ({
            id: `factor-${i}`,
            type: 'General',
            level: assessment.riskLevel,
            score: assessment.riskScore,
            description: f,
            createdAt: assessment.submittedDate,
          })) || [],
        };
        
        setRiskAssessment(riskData);
        setManualRiskLevel(assessment.riskLevel);
        
        // Extract justification from notes if it exists
        if (riskData.notes && riskData.notes.includes('MANUAL CLASSIFICATION:')) {
          const justification = riskData.notes.split('MANUAL CLASSIFICATION:')[1]?.trim() || '';
          setRiskJustification(justification);
        }
      } else {
        setRiskAssessment(null);
        // Initialize with current work item risk level if available
        if (workItem.riskLevel) {
          setManualRiskLevel(workItem.riskLevel.toUpperCase());
        }
      }
    } catch (err) {
      logger.error(err, 'Error loading risk assessment', {
        tags: { error_type: 'risk_assessment_load_error' }
      });
      setRiskAssessment(null);
    } finally {
      setRiskAssessmentLoading(false);
    }
  };

  const handleSaveRiskAssessment = async () => {
    if (!workItem || !manualRiskLevel || !riskJustification.trim()) {
      showToast('Validation Error', 'Please select a risk level and provide a justification', 'error', 5000);
      return;
    }

    try {
      setSavingRiskAssessment(true);
      
      const caseId = workItem.applicationId || workItem.id;
      
      if (!caseId) {
        throw new Error('Case ID not found');
      }

      // Get or create risk assessment
      let assessmentId = riskAssessment?.id;
      
      if (!assessmentId) {
        // Try to find existing assessment
        const existing = await riskApiService.getRiskAssessmentByCase(caseId);
        if (existing) {
          assessmentId = existing.id;
        } else {
          // Create new assessment if none exists
          // Note: This might need to be done through a different endpoint
          // For now, we'll try to set the risk level on the work item
          throw new Error('Risk assessment not found. Please create one first through the Risk Review page.');
        }
      }

      // Set manual risk level
      await riskApiService.setManualRiskLevel(
        assessmentId,
        manualRiskLevel,
        riskJustification
      );

      showToast('Risk Assessment Saved', 'Manual risk level has been saved successfully', 'success', 3000);

      // Reload risk assessment and work item
      await loadRiskAssessment();
      await loadWorkItem();
    } catch (err: any) {
      logger.error(err, 'Error saving risk assessment', {
        tags: { error_type: 'risk_assessment_save_error' }
      });
      showToast('Save Failed', err instanceof Error ? err.message : 'Failed to save risk assessment', 'error', 5000);
    } finally {
      setSavingRiskAssessment(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'SUBMITTED': 'blue',
      'IN PROGRESS': 'orange',
      'RISK REVIEW': 'red',
      'COMPLETE': 'green',
      'DECLINED': 'red',
      'INCOMPLETE': 'gray'
    };
    return colors[status] || 'gray';
  };

  const getRiskColor = (riskLevel?: string) => {
    const risk = riskLevel?.toLowerCase() || 'low';
    if (risk.includes('high') || risk.includes('critical')) return 'red';
    if (risk.includes('medium')) return 'orange';
    return 'green';
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="240px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Typography color="gray.600">Loading work item...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (error || !workItem) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="240px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <AlertBar
              status="error"
              title="Error"
              description={error || 'Work item not found'}
            />
            <Link href="/work-queue">
              <Button variant="secondary">Back to Work Queue</Button>
            </Link>
          </VStack>
        </Box>
      </Flex>
    );
  }

  const reviewSteps = [
    { id: 1, title: 'Overview', icon: FiFileText },
    { id: 2, title: 'Documents', icon: FiFolder },
    { id: 3, title: 'Risk Assessment', icon: FiShield },
    { id: 4, title: 'Review & Decision', icon: FiCheckSquare },
  ];

  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />
      
      <Box flex="1" ml="240px">
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py="4" px="6" boxShadow="sm">
          <HStack justify="space-between" align="center">
            <VStack align="start" gap="1">
              <HStack gap="3">
                <Typography fontSize="2xl" fontWeight="bold" color="gray.900">
                  Review Work Item
                </Typography>
                <Tag variant={getStatusColor(workItem.status) === 'green' ? 'success' : getStatusColor(workItem.status) === 'red' ? 'danger' : 'info'}>
                  {workItem.status}
                </Tag>
                {workItem.riskLevel && (
                  <Tag variant={getRiskColor(workItem.riskLevel) === 'red' ? 'danger' : getRiskColor(workItem.riskLevel) === 'orange' ? 'warning' : 'info'}>
                    {workItem.riskLevel} Risk
                  </Tag>
                )}
              </HStack>
              <Typography color="gray.600" fontSize="sm">
                {workItem.workItemNumber || workItem.id} • {workItem.legalName}
              </Typography>
            </VStack>
            <HStack gap="2">
              <Link href="/work-queue">
                <Button variant="secondary" size="sm">
                  <IconWrapper><FiArrowLeft size={16} /></IconWrapper>
                  Back to Queue
                </Button>
              </Link>
            </HStack>
          </HStack>
        </Box>

        <Container maxW="8xl" py="6">
          <VStack gap="6" align="stretch">
            {/* Progress Steps */}
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <HStack gap="2" justify="space-between">
                {reviewSteps.map((step, index) => (
                  <Flex key={step.id} align="center" gap="2" flex="1">
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="full"
                      bg={currentStep >= step.id ? "orange.500" : "gray.200"}
                      color={currentStep >= step.id ? "white" : "gray.600"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => setCurrentStep(step.id)}
                    >
                      <IconWrapper><step.icon size={16} /></IconWrapper>
                    </Box>
                    <Typography 
                      fontSize="sm" 
                      fontWeight={currentStep === step.id ? "bold" : "medium"}
                      color={currentStep >= step.id ? "gray.900" : "gray.600"}
                    >
                      {step.title}
                    </Typography>
                    {index < reviewSteps.length - 1 && (
                      <Box flex="1" h="2px" bg={currentStep > step.id ? "orange.500" : "gray.200"} ml="2" />
                    )}
                  </Flex>
                ))}
              </HStack>
            </Box>

            {/* Step Content */}
            <MotionBox
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
                  <Card bg="white" boxShadow="md" p="6">
                    <Typography fontWeight="bold" fontSize="lg" mb="4">Work Item Details</Typography>
                    <Box>
                      <VStack align="stretch" gap="3">
                        <HStack justify="space-between">
                          <Typography color="gray.600">Work Item #</Typography>
                          <Typography fontWeight="semibold">{workItem.workItemNumber || workItem.id}</Typography>
                        </HStack>
                        <HStack justify="space-between">
                          <Typography color="gray.600">Applicant Name</Typography>
                          <Typography fontWeight="semibold">{workItem.legalName}</Typography>
                        </HStack>
                        <HStack justify="space-between">
                          <Typography color="gray.600">Entity Type</Typography>
                          <Typography fontWeight="semibold">{workItem.entityType}</Typography>
                        </HStack>
                        <HStack justify="space-between">
                          <Typography color="gray.600">Country</Typography>
                          <Typography fontWeight="semibold">{workItem.country}</Typography>
                        </HStack>
                        <HStack justify="space-between">
                          <Typography color="gray.600">Priority</Typography>
                          <Tag variant={workItem.priority?.toLowerCase() === 'high' ? 'danger' : 'warning'}>
                            {workItem.priority || 'Medium'}
                          </Tag>
                        </HStack>
                        {workItem.dueDate && (
                          <HStack justify="space-between">
                            <Typography color="gray.600">Due Date</Typography>
                            <Typography fontWeight="semibold">
                              {new Date(workItem.dueDate).toLocaleDateString()}
                            </Typography>
                          </HStack>
                        )}
                        {workItem.assignedToName && (
                          <HStack justify="space-between">
                            <Typography color="gray.600">Assigned To</Typography>
                            <Typography fontWeight="semibold">{workItem.assignedToName}</Typography>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  </Card>

                  <Card bg="white" boxShadow="md" p="6">
                    <Typography fontWeight="bold" fontSize="lg" mb="4">Quick Actions</Typography>
                    <VStack align="stretch" gap="3">
                      <Button
                        variant="primary"
                        onClick={() => setCommentsModalOpen(true)}
                      >
                        <HStack gap="2">
                          <IconWrapper><FiMessageSquare size={16} /></IconWrapper>
                          <Typography>View Comments ({comments.length})</Typography>
                        </HStack>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setHistoryModalOpen(true)}
                      >
                        <HStack gap="2">
                          <IconWrapper><FiClock size={16} /></IconWrapper>
                          <Typography>View History</Typography>
                        </HStack>
                      </Button>
                      <Link href={`/applications/${workItem.applicationId || workItem.id}`}>
                        <Button variant="secondary" w="full">
                          <HStack gap="2">
                            <IconWrapper><FiEye size={16} /></IconWrapper>
                            <Typography>View Full Application</Typography>
                          </HStack>
                        </Button>
                      </Link>
                    </VStack>
                  </Card>
                </SimpleGrid>
              )}

              {currentStep === 2 && (
                <Card bg="white" boxShadow="md" p="6">
                  <HStack justify="space-between" align="center" w="full" mb="4">
                    <Typography fontWeight="bold" fontSize="lg">Documents</Typography>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={loadDocuments}
                    >
                      <HStack gap="1">
                        <IconWrapper><FiRefreshCw size={16} /></IconWrapper>
                        <Typography>Refresh</Typography>
                      </HStack>
                    </Button>
                  </HStack>
                  <Box>
                    {documentsLoading ? (
                      <VStack gap="4" py="8">
                        <Spinner size="lg" color="orange.500" />
                        <Typography color="gray.600">Loading documents...</Typography>
                      </VStack>
                    ) : documentsError ? (
                      <AlertBar
                        status="error"
                        title="Error loading documents"
                        description={documentsError}
                      />
                    ) : documents.length === 0 ? (
                      <VStack gap="4" py="8">
                        <IconWrapper><FiFolder size={48} color="#9CA3AF" /></IconWrapper>
                        <Typography color="gray.600" fontSize="md">
                          No documents found for this application
                        </Typography>
                        <Link href={`/applications/${workItem.applicationId || workItem.id}`}>
                          <Button variant="secondary">
                            View Full Application
                          </Button>
                        </Link>
                      </VStack>
                    ) : (
                      <VStack align="stretch" gap="3">
                        <Typography color="gray.600" fontSize="sm" mb="2">
                          {documents.length} document{documents.length !== 1 ? 's' : ''} found
                        </Typography>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
                          {documents.map((doc: any, index: number) => (
                            <Box
                              key={doc.id || index}
                              p="4"
                              border="1px"
                              borderColor="gray.200"
                              borderRadius="lg"
                              _hover={{
                                borderColor: "orange.400",
                                boxShadow: "md",
                                transform: "translateY(-2px)"
                              }}
                              transition="all 0.2s"
                              cursor="pointer"
                              onClick={() => handleViewDocument(doc)}
                            >
                              <HStack gap="3" align="start">
                                <Box
                                  p="2"
                                  borderRadius="md"
                                  bg="orange.100"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  flexShrink={0}
                                >
                                  <IconWrapper><FiFileText size={20} color="#DD6B20" /></IconWrapper>
                                </Box>
                                <VStack align="start" gap="1" flex="1" minW="0">
                                  <Tag 
                                    variant={doc.requirementName ? "warning" : "info"}
                                    title={doc.requirementName ? `Requirement: ${doc.requirementName}` : undefined}
                                  >
                                    {getDocumentTypeName(doc)}
                                  </Tag>
                                  <Typography
                                    fontWeight="semibold"
                                    fontSize="sm"
                                    color="gray.900"
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: '100%'
                                    }}
                                  >
                                    {doc.fileName || doc.documentNumber || `Document ${index + 1}`}
                                  </Typography>
                                  <HStack gap="2" wrap="wrap">
                                    {doc.sizeBytes && (
                                      <Typography fontSize="xs" color="gray.500">
                                        {formatFileSize(doc.sizeBytes)}
                                      </Typography>
                                    )}
                                  </HStack>
                                  {doc.requirementName && (
                                    <Typography fontSize="xs" color="orange.600" fontWeight="medium" mt="1">
                                      📋 {doc.requirementName}
                                    </Typography>
                                  )}
                                  {doc.uploadedAt && (
                                    <Typography fontSize="xs" color="gray.500">
                                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </VStack>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDocument(doc);
                                  }}
                                >
                                  <HStack gap="1">
                                    <IconWrapper><FiEye size={16} /></IconWrapper>
                                    <Typography>View</Typography>
                                  </HStack>
                                </Button>
                              </HStack>
                            </Box>
                          ))}
                        </SimpleGrid>
                        <Separator mt="4" />
                        <Link href={`/applications/${workItem.applicationId || workItem.id}`}>
                          <Button variant="secondary" w="full" mt="2">
                            <IconWrapper><FiArrowRight size={16} /></IconWrapper>
                            View Full Application Details
                          </Button>
                        </Link>
                      </VStack>
                    )}
                  </Box>
                </Card>
              )}

              {currentStep === 3 && (
                <Card bg="white" boxShadow="md" p="6">
                  <HStack justify="space-between" align="center" w="full" mb="4">
                    <Typography fontWeight="bold" fontSize="lg">Manual Risk Assessment</Typography>
                      {riskAssessment && (
                        <Tag variant="success">
                          <HStack gap="1">
                            <IconWrapper><FiCheck size={14} /></IconWrapper>
                            <Typography fontSize="sm">Assessed</Typography>
                          </HStack>
                        </Tag>
                      )}
                    </HStack>
                  <Box>
                    {riskAssessmentLoading ? (
                      <VStack gap="4" py="8">
                        <Spinner size="lg" color="orange.500" />
                        <Typography color="gray.600">Loading risk assessment...</Typography>
                      </VStack>
                    ) : (
                      <VStack align="stretch" gap="6">
                        {/* Current Risk Assessment Display */}
                        {riskAssessment && (
                          <Box p="4" bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                            <VStack align="stretch" gap="3">
                              <HStack justify="space-between">
                                <Typography fontWeight="semibold" fontSize="sm" color="gray.700">
                                  Current Risk Level
                                </Typography>
                                <Tag variant={getRiskColor(riskAssessment.overallRiskLevel) === 'red' ? 'danger' : getRiskColor(riskAssessment.overallRiskLevel) === 'orange' ? 'warning' : 'info'}>
                                  {riskAssessment.overallRiskLevel}
                                </Tag>
                              </HStack>
                              {riskAssessment.riskScore !== undefined && (
                                <Box>
                                  <HStack justify="space-between" mb="2">
                                    <Typography fontSize="sm" color="gray.600">Risk Score</Typography>
                                    <Typography fontWeight="bold" fontSize="sm">{riskAssessment.riskScore}%</Typography>
                                  </HStack>
                                  <Progress.Root value={riskAssessment.riskScore} colorScheme={getRiskColor(riskAssessment.overallRiskLevel)}>
                                    <Progress.Track>
                                      <Progress.Range />
                                    </Progress.Track>
                                  </Progress.Root>
                                </Box>
                              )}
                              {riskAssessment.assessedBy && (
                                <HStack gap="2">
                                  <Typography fontSize="xs" color="gray.500">Assessed by:</Typography>
                                  <Typography fontSize="xs" fontWeight="medium">{riskAssessment.assessedBy}</Typography>
                                  {riskAssessment.completedAt && (
                                    <>
                                      <Typography fontSize="xs" color="gray.400">•</Typography>
                                      <Typography fontSize="xs" color="gray.500">
                                        {new Date(riskAssessment.completedAt).toLocaleDateString()}
                                      </Typography>
                                    </>
                                  )}
                                </HStack>
                              )}
                              {riskAssessment.notes && riskAssessment.notes.includes('MANUAL CLASSIFICATION:') && (
                                <Box mt="2">
                                  <Typography fontSize="xs" fontWeight="semibold" color="gray.600" mb="1">
                                    Justification:
                                  </Typography>
                                  <Typography fontSize="xs" color="gray.700" fontStyle="italic">
                                    {riskAssessment.notes.split('MANUAL CLASSIFICATION:')[1]?.trim() || riskAssessment.notes}
                                  </Typography>
                                </Box>
                              )}
                            </VStack>
                          </Box>
                        )}

                        <Separator />

                        {/* Manual Risk Determination Form */}
                        <VStack align="stretch" gap="4">
                          <Typography fontWeight="semibold" fontSize="md" color="gray.900">
                            Determine Risk Level
                          </Typography>
                          
                          <Field.Root required>
                            <Field.Label>Risk Level</Field.Label>
                            <Field.HelperText>
                              Select the appropriate risk level based on your manual assessment
                            </Field.HelperText>
                            <select
                              value={manualRiskLevel}
                              onChange={(e) => setManualRiskLevel(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'white'
                              }}
                            >
                              <option value="">Select Risk Level</option>
                              <option value="LOW">Low</option>
                              <option value="MEDIUMLOW">Medium Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="MEDIUMHIGH">Medium High</option>
                              <option value="HIGH">High</option>
                              <option value="CRITICAL">Critical</option>
                            </select>
                          </Field.Root>

                          <Field.Root required>
                            <Field.Label>Justification</Field.Label>
                            <Field.HelperText>
                              Provide a detailed justification for the selected risk level. This is required for audit and compliance purposes.
                            </Field.HelperText>
                            <Textarea
                              value={riskJustification}
                              onChange={(e) => setRiskJustification(e.target.value)}
                              placeholder="Enter your justification for the risk level determination. Include specific factors, concerns, or observations that led to this assessment..."
                              rows={6}
                              resize="vertical"
                            />
                          </Field.Root>

                          <HStack gap="3" justify="flex-end" pt="2">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setManualRiskLevel(riskAssessment?.overallRiskLevel || workItem?.riskLevel?.toUpperCase() || '');
                                setRiskJustification('');
                              }}
                            >
                              Reset
                            </Button>
                            <Button
                              colorScheme="orange"
                              onClick={handleSaveRiskAssessment}
                              loading={savingRiskAssessment}
                              disabled={!manualRiskLevel || !riskJustification.trim()}
                            >
                              <HStack gap="2">
                                <IconWrapper><FiSave size={16} /></IconWrapper>
                                <Typography>Save Risk Assessment</Typography>
                              </HStack>
                            </Button>
                          </HStack>
                        </VStack>

                        <Separator />

                        {/* Additional Actions */}
                        <VStack align="stretch" gap="2">
                          <Link href={`/risk-review?search=${workItem.id}`}>
                            <Button variant="secondary" w="full">
                              <HStack gap="2">
                                <IconWrapper><FiShield size={16} /></IconWrapper>
                                <Typography>View Detailed Risk Assessment</Typography>
                                <IconWrapper><FiArrowRight size={16} /></IconWrapper>
                              </HStack>
                            </Button>
                          </Link>
                        </VStack>
                      </VStack>
                    )}
                  </Box>
                </Card>
              )}

              {currentStep === 4 && (
                <Card bg="white" boxShadow="md" p="6">
                  <Typography fontWeight="bold" fontSize="lg" mb="4">Review & Decision</Typography>
                  <Box>
                    <VStack align="stretch" gap="4">
                      <Field.Root>
                        <Field.Label>Review Notes</Field.Label>
                        <Textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Enter your review notes..."
                          rows={6}
                        />
                      </Field.Root>

                      <Separator />

                      <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
                        {workItem.status === 'IN PROGRESS' && (
                          <>
                            <Button
                              variant="primary"
                              onClick={() => setCompleteModalOpen(true)}
                              size="md"
                            >
                              <HStack gap="2">
                                <IconWrapper><FiCheck size={16} /></IconWrapper>
                                <Typography>Complete Review</Typography>
                              </HStack>
                            </Button>
                            {workItem.requiresApproval && (
                              <Button
                                variant="primary"
                                onClick={() => setSubmitApprovalModalOpen(true)}
                                size="md"
                              >
                                <HStack gap="2">
                                  <IconWrapper><FiSend size={16} /></IconWrapper>
                                  <Typography>Submit for Approval</Typography>
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
                            >
                              <HStack gap="2">
                                <IconWrapper><FiCheck size={16} /></IconWrapper>
                                <Typography>Approve</Typography>
                              </HStack>
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => setDeclineModalOpen(true)}
                              size="md"
                            >
                              <HStack gap="2">
                                <IconWrapper><FiX size={16} /></IconWrapper>
                                <Typography>Decline</Typography>
                              </HStack>
                            </Button>
                          </>
                        )}
                      </SimpleGrid>
                    </VStack>
                  </Box>
                </Card>
              )}
            </MotionBox>

            {/* Navigation */}
            <HStack justify="space-between" mt="4">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                <HStack gap="2">
                  <IconWrapper><FiArrowLeft size={16} /></IconWrapper>
                  <Typography>Previous</Typography>
                </HStack>
              </Button>
              <Button
                variant="primary"
                onClick={() => setCurrentStep(Math.min(reviewSteps.length, currentStep + 1))}
                disabled={currentStep === reviewSteps.length}
              >
                <HStack gap="2">
                  <Typography>Next</Typography>
                  <IconWrapper><FiArrowRight size={16} /></IconWrapper>
                </HStack>
              </Button>
            </HStack>
          </VStack>
        </Container>
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
          <Typography fontSize="lg" fontWeight="700" color="gray.900">Approve Work Item</Typography>
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" gap="4">
            <Field.Root>
              <Field.Label>Notes (Optional)</Field.Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add approval notes..."
                rows={4}
              />
            </Field.Root>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="2">
            <Button variant="secondary" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApprove} disabled={actionLoading}>
              Approve
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
          <Typography fontSize="lg" fontWeight="700" color="gray.900">Decline Work Item</Typography>
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" gap="4">
            <Field.Root required>
              <Field.Label>Reason for Decline</Field.Label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please provide a reason for declining..."
                rows={4}
              />
            </Field.Root>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="2">
            <Button variant="secondary" onClick={() => setDeclineModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleDecline} 
              disabled={actionLoading || !declineReason.trim()}
            >
              Decline
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
          <Typography fontSize="lg" fontWeight="700" color="gray.900">Complete Work Item</Typography>
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" gap="4">
            <Field.Root>
              <Field.Label>Notes (Optional)</Field.Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add completion notes..."
                rows={4}
              />
            </Field.Root>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="2">
            <Button variant="secondary" onClick={() => setCompleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleComplete} disabled={actionLoading}>
              Complete
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
          <Typography fontSize="lg" fontWeight="700" color="gray.900">Submit for Approval</Typography>
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" gap="4">
            <Field.Root>
              <Field.Label>Notes (Optional)</Field.Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes for approval..."
                rows={4}
              />
            </Field.Root>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="2">
            <Button variant="secondary" onClick={() => setSubmitApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitForApproval} disabled={actionLoading}>
              Submit
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>

      {/* Comments Modal */}
      <Modal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        title="Comments"
        size="large"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="700" color="gray.900">Comments</Typography>
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" gap="4">
            <Box maxH="400px" overflowY="auto">
              {comments.length === 0 ? (
                <Typography color="gray.600">No comments yet</Typography>
              ) : (
                <VStack align="stretch" gap="3">
                  {comments.map((comment: any, idx: number) => (
                    <Box key={idx} p="3" bg="gray.50" borderRadius="md">
                      <HStack justify="space-between" mb="2">
                        <Typography fontWeight="semibold" fontSize="sm">
                          {comment.createdBy || comment.authorName || 'Unknown'}
                        </Typography>
                        <Typography fontSize="xs" color="gray.600">
                          {new Date(comment.createdAt || comment.timestamp).toLocaleString()}
                        </Typography>
                      </HStack>
                      <Typography fontSize="sm" color="gray.700">
                        {comment.text || comment.comment}
                      </Typography>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
            <Separator />
            <VStack align="stretch" gap="2">
              <Field.Root>
                <Field.Label>Add Comment</Field.Label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Enter your comment..."
                  rows={3}
                />
              </Field.Root>
              <Button
                variant="primary"
                onClick={handleAddComment}
                disabled={actionLoading || !newComment.trim()}
              >
                <HStack gap="2">
                  <IconWrapper><FiMessageSquare size={16} /></IconWrapper>
                  <Typography>Add Comment</Typography>
                </HStack>
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCommentsModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="History"
        size="large"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="700" color="gray.900">History</Typography>
        </ModalHeader>
        <ModalBody>
          <Box maxH="500px" overflowY="auto">
            {history.length === 0 ? (
              <Typography color="gray.600">No history available</Typography>
            ) : (
              <VStack align="stretch" gap="2">
                {history.map((entry: any, idx: number) => (
                  <Box key={idx} p="3" borderLeft="3px" borderColor="orange.500" bg="gray.50" borderRadius="md">
                    <HStack justify="space-between" mb="1">
                      <Typography fontWeight="semibold" fontSize="sm">
                        {entry.action || entry.description || entry.eventType}
                      </Typography>
                      <Typography fontSize="xs" color="gray.600">
                        {new Date(entry.timestamp || entry.createdAt).toLocaleString()}
                      </Typography>
                    </HStack>
                    {entry.performedBy && (
                      <Typography fontSize="xs" color="gray.600">
                        By: {entry.performedBy}
                      </Typography>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setHistoryModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Document Viewer */}
      <DocumentViewer
        isOpen={documentViewerOpen}
        onClose={() => {
          setDocumentViewerOpen(false);
          setViewingDocumentUrl(null);
          setViewingDocumentName("");
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
    </Flex>
  );
}

