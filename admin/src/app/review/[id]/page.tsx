"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Flex,
  SimpleGrid,
  Icon,
  Button,
  Badge,
  Card,
  Input,
  Textarea,
  Progress,
  Alert,
  Dialog,
  Field,
  Tabs,
  Separator,
  Spinner
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
import workQueueApi, { Application } from "../../../lib/workQueueApi";
import { useSession } from "next-auth/react";
import { createToaster } from "@chakra-ui/react";
import { useRef } from "react";
import { fetchEntitySchema } from "../../../lib/entitySchemaRenderer";
import { riskApiService, RiskAssessmentDto } from "../../../services/riskApi";

const MotionBox = motion(Box);

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const workItemId = params?.id as string;
  
  const [workItem, setWorkItem] = useState<Application | null>(null);
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
  
  const toasterRef = useRef(createToaster({
    placement: "top-end",
    pauseOnPageIdle: true,
  }));

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
      const result = await workQueueApi.getMyWorkItems(1, 1000);
      const item = result.data.find(w => w.workItemId === workItemId || w.id === workItemId);
      
      if (!item) {
        // Try getting from all work items
        const allResult = await workQueueApi.getWorkItems({ pageSize: 1000 });
        const foundItem = allResult.data.find(w => w.workItemId === workItemId || w.id === workItemId);
        
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
      const commentsData = await workQueueApi.getWorkItemComments(workItemId);
      setComments(commentsData);
    } catch (err) {
      console.error('Error loading comments:', err);
      setComments([]);
    }
  };

  const loadHistory = async () => {
    try {
      const historyData = await workQueueApi.getWorkItemHistory(workItemId);
      setHistory(historyData);
    } catch (err) {
      console.error('Error loading history:', err);
      setHistory([]);
    }
  };

  const handleApprove = async () => {
    if (!workItem) return;
    
    setActionLoading(true);
    try {
      await workQueueApi.approveWorkItem(workItem.workItemId || workItem.id, reviewNotes);
      toasterRef.current.create({
        title: 'Approved',
        description: 'Work item has been approved successfully',
        type: 'success',
        duration: 3000,
      });
      setApproveModalOpen(false);
      setReviewNotes("");
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve work item';
      toasterRef.current.create({
        title: 'Approval failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!workItem || !declineReason.trim()) return;
    
    setActionLoading(true);
    try {
      await workQueueApi.declineWorkItem(workItem.workItemId || workItem.id, declineReason);
      toasterRef.current.create({
        title: 'Declined',
        description: 'Work item has been declined',
        type: 'success',
        duration: 3000,
      });
      setDeclineModalOpen(false);
      setDeclineReason("");
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decline work item';
      toasterRef.current.create({
        title: 'Decline failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!workItem) return;
    
    setActionLoading(true);
    try {
      await workQueueApi.completeWorkItem(workItem.workItemId || workItem.id, reviewNotes);
      toasterRef.current.create({
        title: 'Completed',
        description: 'Work item has been completed successfully',
        type: 'success',
        duration: 3000,
      });
      setCompleteModalOpen(false);
      setReviewNotes("");
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete work item';
      toasterRef.current.create({
        title: 'Completion failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!workItem) return;
    
    setActionLoading(true);
    try {
      await workQueueApi.submitForApproval(workItem.workItemId || workItem.id, reviewNotes);
      toasterRef.current.create({
        title: 'Submitted',
        description: 'Work item has been submitted for approval',
        type: 'success',
        duration: 3000,
      });
      setSubmitApprovalModalOpen(false);
      setReviewNotes("");
      await loadWorkItem();
      router.push('/work-queue');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit for approval';
      toasterRef.current.create({
        title: 'Submission failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !workItem) return;
    
    setActionLoading(true);
    try {
      await workQueueApi.addComment(workItem.workItemId || workItem.id, newComment);
      toasterRef.current.create({
        title: 'Comment added',
        description: 'Your comment has been added',
        type: 'success',
        duration: 3000,
      });
      setNewComment("");
      await loadComments();
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      toasterRef.current.create({
        title: 'Comment failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
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
        
        console.log('[Review Page] Extracted entity type code:', entityTypeCode);
        
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
      console.error('Error loading application data:', err);
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
        
        console.log('[Document Mapping] Application metadata keys:', Object.keys(metadata));
        console.log('[Document Mapping] Requirement map:', Array.from(requirementMap.entries()));
        console.log('[Document Mapping] Documents to map:', docs.map(d => ({ 
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
                  console.log(`[Document Mapping] ✅ Matched ${doc.fileName} to ${reqName} via ${key}`);
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
                    console.log(`[Document Mapping] ✅ Matched ${doc.fileName} to ${reqName} via ${key}`);
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
            console.log(`[Document Mapping] ⚠️ Could not match ${doc.fileName} to any requirement`);
          }
          
          return {
            ...doc,
            requirementName: requirementName || null
          };
        });
      }
      
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
      setDocumentsError(err instanceof Error ? err.message : 'Failed to load documents');
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleViewDocument = async (document: any) => {
    try {
      if (!document || !document.storageKey) {
        toasterRef.current.create({
          title: 'Document error',
          description: 'Document storage key not found',
          type: 'error',
          duration: 3000,
        });
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
      console.error('Error viewing document:', err);
      toasterRef.current.create({
        title: 'View failed',
        description: err instanceof Error ? err.message : 'Failed to view document',
        type: 'error',
        duration: 5000,
      });
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
      console.error('Error loading risk assessment:', err);
      setRiskAssessment(null);
    } finally {
      setRiskAssessmentLoading(false);
    }
  };

  const handleSaveRiskAssessment = async () => {
    if (!workItem || !manualRiskLevel || !riskJustification.trim()) {
      toasterRef.current.create({
        title: 'Validation Error',
        description: 'Please select a risk level and provide a justification',
        type: 'error',
        duration: 5000,
      });
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

      toasterRef.current.create({
        title: 'Risk Assessment Saved',
        description: 'Manual risk level has been saved successfully',
        type: 'success',
        duration: 3000,
      });

      // Reload risk assessment and work item
      await loadRiskAssessment();
      await loadWorkItem();
    } catch (err: any) {
      console.error('Error saving risk assessment:', err);
      toasterRef.current.create({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Failed to save risk assessment',
        type: 'error',
        duration: 5000,
      });
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
            <Text color="gray.600">Loading work item...</Text>
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
            <Alert.Root status="error">
              <Icon as={FiAlertTriangle} />
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>{error || 'Work item not found'}</Alert.Description>
            </Alert.Root>
            <Link href="/work-queue">
              <Button variant="outline">Back to Work Queue</Button>
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
                <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                  Review Work Item
                </Text>
                <Badge colorScheme={getStatusColor(workItem.status)} size="md">
                  {workItem.status}
                </Badge>
                {workItem.riskLevel && (
                  <Badge colorScheme={getRiskColor(workItem.riskLevel)} size="md">
                    {workItem.riskLevel} Risk
                  </Badge>
                )}
              </HStack>
              <Text color="gray.600" fontSize="sm">
                {workItem.workItemNumber || workItem.id} • {workItem.legalName}
              </Text>
            </VStack>
            <HStack gap="2">
              <Link href="/work-queue">
                <Button variant="outline" size="sm">
                  <Icon as={FiArrowLeft} mr="2" />
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
                      <Icon as={step.icon} />
                    </Box>
                    <Text 
                      fontSize="sm" 
                      fontWeight={currentStep === step.id ? "bold" : "medium"}
                      color={currentStep >= step.id ? "gray.900" : "gray.600"}
                    >
                      {step.title}
                    </Text>
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
                  <Card.Root bg="white" boxShadow="md">
                    <Card.Header>
                      <Text fontWeight="bold" fontSize="lg">Work Item Details</Text>
                    </Card.Header>
                    <Card.Body>
                      <VStack align="stretch" gap="3">
                        <HStack justify="space-between">
                          <Text color="gray.600">Work Item #</Text>
                          <Text fontWeight="semibold">{workItem.workItemNumber || workItem.id}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color="gray.600">Applicant Name</Text>
                          <Text fontWeight="semibold">{workItem.legalName}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color="gray.600">Entity Type</Text>
                          <Text fontWeight="semibold">{workItem.entityType}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color="gray.600">Country</Text>
                          <Text fontWeight="semibold">{workItem.country}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color="gray.600">Priority</Text>
                          <Badge colorScheme={workItem.priority?.toLowerCase() === 'high' ? 'red' : 'orange'}>
                            {workItem.priority || 'Medium'}
                          </Badge>
                        </HStack>
                        {workItem.dueDate && (
                          <HStack justify="space-between">
                            <Text color="gray.600">Due Date</Text>
                            <Text fontWeight="semibold">
                              {new Date(workItem.dueDate).toLocaleDateString()}
                            </Text>
                          </HStack>
                        )}
                        {workItem.assignedToName && (
                          <HStack justify="space-between">
                            <Text color="gray.600">Assigned To</Text>
                            <Text fontWeight="semibold">{workItem.assignedToName}</Text>
                          </HStack>
                        )}
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root bg="white" boxShadow="md">
                    <Card.Header>
                      <Text fontWeight="bold" fontSize="lg">Quick Actions</Text>
                    </Card.Header>
                    <Card.Body>
                      <VStack align="stretch" gap="3">
                        <Button
                          colorScheme="blue"
                          onClick={() => setCommentsModalOpen(true)}
                        >
                          <HStack gap="2">
                            <Icon as={FiMessageSquare} />
                            <Text>View Comments ({comments.length})</Text>
                          </HStack>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setHistoryModalOpen(true)}
                        >
                          <HStack gap="2">
                            <Icon as={FiClock} />
                            <Text>View History</Text>
                          </HStack>
                        </Button>
                        <Link href={`/applications/${workItem.applicationId || workItem.id}`}>
                          <Button variant="outline" w="full">
                            <HStack gap="2">
                              <Icon as={FiEye} />
                              <Text>View Full Application</Text>
                            </HStack>
                          </Button>
                        </Link>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                </SimpleGrid>
              )}

              {currentStep === 2 && (
                <Card.Root bg="white" boxShadow="md">
                  <Card.Header>
                    <HStack justify="space-between" align="center" w="full">
                      <Text fontWeight="bold" fontSize="lg">Documents</Text>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadDocuments}
                      >
                        <HStack gap="1">
                          <Icon as={FiRefreshCw} />
                          <Text>Refresh</Text>
                        </HStack>
                      </Button>
                    </HStack>
                  </Card.Header>
                  <Card.Body>
                    {documentsLoading ? (
                      <VStack gap="4" py="8">
                        <Spinner size="lg" color="orange.500" />
                        <Text color="gray.600">Loading documents...</Text>
                      </VStack>
                    ) : documentsError ? (
                      <Alert.Root status="error" borderRadius="md">
                        <Icon as={FiAlertTriangle} />
                        <Alert.Title>Error loading documents</Alert.Title>
                        <Alert.Description>{documentsError}</Alert.Description>
                      </Alert.Root>
                    ) : documents.length === 0 ? (
                      <VStack gap="4" py="8">
                        <Icon as={FiFolder} boxSize="12" color="gray.400" />
                        <Text color="gray.600" fontSize="md">
                          No documents found for this application
                        </Text>
                        <Link href={`/applications/${workItem.applicationId || workItem.id}`}>
                          <Button variant="outline" colorScheme="blue">
                            View Full Application
                          </Button>
                        </Link>
                      </VStack>
                    ) : (
                      <VStack align="stretch" gap="3">
                        <Text color="gray.600" fontSize="sm" mb="2">
                          {documents.length} document{documents.length !== 1 ? 's' : ''} found
                        </Text>
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
                                  <Icon as={FiFileText} boxSize="5" color="orange.600" />
                                </Box>
                                <VStack align="start" gap="1" flex="1" minW="0">
                                  <Badge 
                                    colorScheme={doc.requirementName ? "orange" : "blue"} 
                                    size="sm"
                                    title={doc.requirementName ? `Requirement: ${doc.requirementName}` : undefined}
                                  >
                                    {getDocumentTypeName(doc)}
                                  </Badge>
                                  <Text
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
                                  </Text>
                                  <HStack gap="2" wrap="wrap">
                                    {doc.sizeBytes && (
                                      <Text fontSize="xs" color="gray.500">
                                        {formatFileSize(doc.sizeBytes)}
                                      </Text>
                                    )}
                                  </HStack>
                                  {doc.requirementName && (
                                    <Text fontSize="xs" color="orange.600" fontWeight="medium" mt="1">
                                      📋 {doc.requirementName}
                                    </Text>
                                  )}
                                  {doc.uploadedAt && (
                                    <Text fontSize="xs" color="gray.500">
                                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </Text>
                                  )}
                                </VStack>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDocument(doc);
                                  }}
                                >
                                  <HStack gap="1">
                                    <Icon as={FiEye} />
                                    <Text>View</Text>
                                  </HStack>
                                </Button>
                              </HStack>
                            </Box>
                          ))}
                        </SimpleGrid>
                        <Separator mt="4" />
                        <Link href={`/applications/${workItem.applicationId || workItem.id}`}>
                          <Button variant="outline" colorScheme="blue" w="full" mt="2">
                            <Icon as={FiArrowRight} mr="2" />
                            View Full Application Details
                          </Button>
                        </Link>
                      </VStack>
                    )}
                  </Card.Body>
                </Card.Root>
              )}

              {currentStep === 3 && (
                <Card.Root bg="white" boxShadow="md">
                  <Card.Header>
                    <HStack justify="space-between" align="center" w="full">
                      <Text fontWeight="bold" fontSize="lg">Manual Risk Assessment</Text>
                      {riskAssessment && (
                        <Badge colorScheme="green" size="sm">
                          <HStack gap="1">
                            <Icon as={FiCheck} />
                            <Text>Assessed</Text>
                          </HStack>
                        </Badge>
                      )}
                    </HStack>
                  </Card.Header>
                  <Card.Body>
                    {riskAssessmentLoading ? (
                      <VStack gap="4" py="8">
                        <Spinner size="lg" color="orange.500" />
                        <Text color="gray.600">Loading risk assessment...</Text>
                      </VStack>
                    ) : (
                      <VStack align="stretch" gap="6">
                        {/* Current Risk Assessment Display */}
                        {riskAssessment && (
                          <Box p="4" bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                            <VStack align="stretch" gap="3">
                              <HStack justify="space-between">
                                <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                                  Current Risk Level
                                </Text>
                                <Badge colorScheme={getRiskColor(riskAssessment.overallRiskLevel)} size="lg">
                                  {riskAssessment.overallRiskLevel}
                                </Badge>
                              </HStack>
                              {riskAssessment.riskScore !== undefined && (
                                <Box>
                                  <HStack justify="space-between" mb="2">
                                    <Text fontSize="sm" color="gray.600">Risk Score</Text>
                                    <Text fontWeight="bold" fontSize="sm">{riskAssessment.riskScore}%</Text>
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
                                  <Text fontSize="xs" color="gray.500">Assessed by:</Text>
                                  <Text fontSize="xs" fontWeight="medium">{riskAssessment.assessedBy}</Text>
                                  {riskAssessment.completedAt && (
                                    <>
                                      <Text fontSize="xs" color="gray.400">•</Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {new Date(riskAssessment.completedAt).toLocaleDateString()}
                                      </Text>
                                    </>
                                  )}
                                </HStack>
                              )}
                              {riskAssessment.notes && riskAssessment.notes.includes('MANUAL CLASSIFICATION:') && (
                                <Box mt="2">
                                  <Text fontSize="xs" fontWeight="semibold" color="gray.600" mb="1">
                                    Justification:
                                  </Text>
                                  <Text fontSize="xs" color="gray.700" fontStyle="italic">
                                    {riskAssessment.notes.split('MANUAL CLASSIFICATION:')[1]?.trim() || riskAssessment.notes}
                                  </Text>
                                </Box>
                              )}
                            </VStack>
                          </Box>
                        )}

                        <Separator />

                        {/* Manual Risk Determination Form */}
                        <VStack align="stretch" gap="4">
                          <Text fontWeight="semibold" fontSize="md" color="gray.900">
                            Determine Risk Level
                          </Text>
                          
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
                              variant="outline"
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
                                <Icon as={FiSave} />
                                <Text>Save Risk Assessment</Text>
                              </HStack>
                            </Button>
                          </HStack>
                        </VStack>

                        <Separator />

                        {/* Additional Actions */}
                        <VStack align="stretch" gap="2">
                          <Link href={`/risk-review?search=${workItem.id}`}>
                            <Button variant="outline" w="full">
                              <HStack gap="2">
                                <Icon as={FiShield} />
                                <Text>View Detailed Risk Assessment</Text>
                                <Icon as={FiArrowRight} />
                              </HStack>
                            </Button>
                          </Link>
                        </VStack>
                      </VStack>
                    )}
                  </Card.Body>
                </Card.Root>
              )}

              {currentStep === 4 && (
                <Card.Root bg="white" boxShadow="md">
                  <Card.Header>
                    <Text fontWeight="bold" fontSize="lg">Review & Decision</Text>
                  </Card.Header>
                  <Card.Body>
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
                              colorScheme="green"
                              onClick={() => setCompleteModalOpen(true)}
                              size="lg"
                            >
                              <HStack gap="2">
                                <Icon as={FiCheck} />
                                <Text>Complete Review</Text>
                              </HStack>
                            </Button>
                            {workItem.requiresApproval && (
                              <Button
                                colorScheme="blue"
                                onClick={() => setSubmitApprovalModalOpen(true)}
                                size="lg"
                              >
                                <HStack gap="2">
                                  <Icon as={FiSend} />
                                  <Text>Submit for Approval</Text>
                                </HStack>
                              </Button>
                            )}
                          </>
                        )}
                        {workItem.status === 'RISK REVIEW' && (
                          <>
                            <Button
                              colorScheme="green"
                              onClick={() => setApproveModalOpen(true)}
                              size="lg"
                            >
                              <HStack gap="2">
                                <Icon as={FiCheck} />
                                <Text>Approve</Text>
                              </HStack>
                            </Button>
                            <Button
                              colorScheme="red"
                              onClick={() => setDeclineModalOpen(true)}
                              size="lg"
                            >
                              <HStack gap="2">
                                <Icon as={FiX} />
                                <Text>Decline</Text>
                              </HStack>
                            </Button>
                          </>
                        )}
                      </SimpleGrid>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}
            </MotionBox>

            {/* Navigation */}
            <HStack justify="space-between" mt="4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                <HStack gap="2">
                  <Icon as={FiArrowLeft} />
                  <Text>Previous</Text>
                </HStack>
              </Button>
              <Button
                colorScheme="orange"
                onClick={() => setCurrentStep(Math.min(reviewSteps.length, currentStep + 1))}
                disabled={currentStep === reviewSteps.length}
              >
                <HStack gap="2">
                  <Text>Next</Text>
                  <Icon as={FiArrowRight} />
                </HStack>
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Approve Modal */}
      <Dialog.Root open={approveModalOpen} onOpenChange={(e) => setApproveModalOpen(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="500px">
            <Dialog.Header>
              <Dialog.Title>Approve Work Item</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
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
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap="2">
                <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
                  Cancel
                </Button>
                <Button colorScheme="green" onClick={handleApprove} loading={actionLoading}>
                  Approve
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Decline Modal */}
      <Dialog.Root open={declineModalOpen} onOpenChange={(e) => setDeclineModalOpen(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="500px">
            <Dialog.Header>
              <Dialog.Title>Decline Work Item</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
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
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap="2">
                <Button variant="outline" onClick={() => setDeclineModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleDecline} 
                  loading={actionLoading}
                  disabled={!declineReason.trim()}
                >
                  Decline
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Complete Modal */}
      <Dialog.Root open={completeModalOpen} onOpenChange={(e) => setCompleteModalOpen(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="500px">
            <Dialog.Header>
              <Dialog.Title>Complete Work Item</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
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
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap="2">
                <Button variant="outline" onClick={() => setCompleteModalOpen(false)}>
                  Cancel
                </Button>
                <Button colorScheme="green" onClick={handleComplete} loading={actionLoading}>
                  Complete
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Submit for Approval Modal */}
      <Dialog.Root open={submitApprovalModalOpen} onOpenChange={(e) => setSubmitApprovalModalOpen(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="500px">
            <Dialog.Header>
              <Dialog.Title>Submit for Approval</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
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
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap="2">
                <Button variant="outline" onClick={() => setSubmitApprovalModalOpen(false)}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSubmitForApproval} loading={actionLoading}>
                  Submit
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Comments Modal */}
      <Dialog.Root open={commentsModalOpen} onOpenChange={(e) => setCommentsModalOpen(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="600px">
            <Dialog.Header>
              <Dialog.Title>Comments</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap="4">
                <Box maxH="400px" overflowY="auto">
                  {comments.length === 0 ? (
                    <Text color="gray.600">No comments yet</Text>
                  ) : (
                    <VStack align="stretch" gap="3">
                      {comments.map((comment: any, idx: number) => (
                        <Box key={idx} p="3" bg="gray.50" borderRadius="md">
                          <HStack justify="space-between" mb="2">
                            <Text fontWeight="semibold" fontSize="sm">
                              {comment.createdBy || comment.authorName || 'Unknown'}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {new Date(comment.createdAt || comment.timestamp).toLocaleString()}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.700">
                            {comment.text || comment.comment}
                          </Text>
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
                    colorScheme="blue"
                    onClick={handleAddComment}
                    loading={actionLoading}
                    disabled={!newComment.trim()}
                  >
                    <HStack gap="2">
                      <Icon as={FiMessageSquare} />
                      <Text>Add Comment</Text>
                    </HStack>
                  </Button>
                </VStack>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setCommentsModalOpen(false)}>
                Close
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* History Modal */}
      <Dialog.Root open={historyModalOpen} onOpenChange={(e) => setHistoryModalOpen(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="700px">
            <Dialog.Header>
              <Dialog.Title>History</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box maxH="500px" overflowY="auto">
                {history.length === 0 ? (
                  <Text color="gray.600">No history available</Text>
                ) : (
                  <VStack align="stretch" gap="2">
                    {history.map((entry: any, idx: number) => (
                      <Box key={idx} p="3" borderLeft="3px" borderColor="orange.500" bg="gray.50" borderRadius="md">
                        <HStack justify="space-between" mb="1">
                          <Text fontWeight="semibold" fontSize="sm">
                            {entry.action || entry.description || entry.eventType}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {new Date(entry.timestamp || entry.createdAt).toLocaleString()}
                          </Text>
                        </HStack>
                        {entry.performedBy && (
                          <Text fontSize="xs" color="gray.600">
                            By: {entry.performedBy}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>
                Close
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

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

