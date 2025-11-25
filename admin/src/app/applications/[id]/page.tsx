"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Flex,
  Image,
  Circle,
  SimpleGrid,
  Textarea,
  Progress,
  Separator,
  Field
} from "@chakra-ui/react";
import { 
  FiFileText, 
  FiHome, 
  FiCheckSquare, 
  FiUsers, 
  FiUserCheck, 
  FiFolder, 
  FiPhone, 
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiX,
  FiEdit3,
  FiMessageSquare,
  FiClock,
  FiAlertTriangle,
  FiDownload
} from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import AdminSidebar from "../../../components/AdminSidebar";
import { SweetAlert } from "../../../utils/sweetAlert";
import { 
  fetchEntitySchema, 
  EntitySchema, 
  normalizeEntityTypeCode 
} from "../../../lib/entitySchemaRenderer";
import { DynamicFieldRenderer } from "../../../components/DynamicFieldRenderer";
import { DocumentViewer } from "../../../components/DocumentViewer";
import { Typography, Button, Card, Input, Modal, ModalHeader, ModalBody, ModalFooter, AlertBar, Tag, IconWrapper } from "@/lib/mukuruImports";
import { logger } from "../../../lib/logger";

// Application interface matching what the detail page expects
interface Application {
  id: string;
  legalName: string;
  entityType: string;
  country: string;
  status: 'SUBMITTED' | 'IN PROGRESS' | 'RISK REVIEW' | 'COMPLETE' | 'INCOMPLETE' | 'DECLINED';
  created: string;
  updated: string;
  submittedBy: string;
  riskScore?: number;
  documents: Document[];
  businessInfo: BusinessInfo;
  contactInfo: ContactInfo;
}

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  url: string;
}

interface BusinessInfo {
  registrationNumber: string;
  taxId: string;
  businessAddress: string;
  industry: string;
  employees: number;
  annualRevenue: number;
}

interface ContactInfo {
  primaryContact: string;
  email: string;
  phone: string;
  address: string;
}

const MotionBox = motion(Box);

export default function AdminApplicationDetailsPage() {
  const params = useParams();
  const applicationId = params?.id as string;
  const [currentStep, setCurrentStep] = useState(1);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Admin-specific state
  const [adminComments, setAdminComments] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [riskAssessment, setRiskAssessment] = useState({
    score: 65,
    factors: [
      { name: 'Business Type', score: 70, weight: 25 },
      { name: 'Geographic Risk', score: 80, weight: 20 },
      { name: 'Volume Risk', score: 60, weight: 30 },
      { name: 'Documentation', score: 50, weight: 25 }
    ]
  });

  // Modal states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [tempStatusUpdate, setTempStatusUpdate] = useState("");
  const [tempComment, setTempComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Schema-driven state
  const [entitySchema, setEntitySchema] = useState<EntitySchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [rawApplicationData, setRawApplicationData] = useState<Record<string, any> | null>(null);

  // Document viewer state
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);
  const [viewingDocumentName, setViewingDocumentName] = useState("");
  const [viewingDocumentType, setViewingDocumentType] = useState<string | undefined>(undefined);
  const [viewingDocumentSize, setViewingDocumentSize] = useState<number | undefined>(undefined);

  // Using SweetAlert2 for notifications instead of Chakra UI toaster to avoid initialization issues

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  // Handler for document viewing from DynamicFieldRenderer
  const handleDocumentView = async (fileData: any) => {
    try {
      if (!fileData) {
        await SweetAlert.warning("Document Not Found", "Document information is not available.");
        return;
      }

      // Get case ID from URL params
      const caseId = applicationId;
      if (!caseId) {
        await SweetAlert.warning("Application Not Found", "Cannot find application ID.");
        return;
      }

      // Fetch documents for this case
      logger.debug('Fetching documents for case', { caseId });
      const response = await fetch(`/api/proxy/api/v1/documents/case/${caseId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(new Error(`Failed to fetch documents: ${response.status}`), 'Failed to fetch documents', {
          tags: { error_type: 'documents_fetch_error' },
          extra: { status: response.status, errorText }
        });
        throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
      }

      const documents = await response.json();
      logger.debug('Documents received', { count: documents?.length || 0 });
      
      if (!Array.isArray(documents)) {
        logger.error(new Error('Documents response is not an array'), 'Invalid documents response', {
          tags: { error_type: 'documents_format_error' },
          extra: { documents }
        });
        await SweetAlert.warning("Invalid Response", "The server returned an invalid response. Please try again.");
        return;
      }
      
      if (documents.length === 0) {
        logger.warn('No documents found for case', {
          tags: { warning_type: 'no_documents' },
          extra: { caseId }
        });
        // Try to find documents by searching all documents
        // This handles cases where documents might have been uploaded but caseId wasn't properly set
        const allDocsResponse = await fetch(`/api/proxy/api/v1/documents?skip=0&take=1000`);
        if (allDocsResponse.ok) {
          const allDocs = await allDocsResponse.json();
          const allDocumentsList = allDocs.items || [];
          
          logger.debug('Found total documents in system', { count: allDocumentsList.length });
          
          // First, try to match by caseId (case-insensitive, string comparison)
          let matchingDocs = allDocumentsList.filter((d: any) => {
            const docCaseId = String(d.caseId || '').toLowerCase();
            const searchCaseId = String(caseId || '').toLowerCase();
            return docCaseId === searchCaseId || d.caseId === caseId;
          });
          
          logger.debug('Found documents by caseId match', { count: matchingDocs.length });
          
          // If no caseId match and we have a filename, try to find by filename
          if (matchingDocs.length === 0 && fileData?.fileName) {
            const searchFileName = fileData.fileName.toLowerCase();
            // Handle truncated filenames (e.g., "logo_highres_transparent.pn" should match "logo_highres_transparent.png")
            const searchBase = searchFileName.substring(0, searchFileName.lastIndexOf('.'));
            
            matchingDocs = allDocumentsList.filter((d: any) => {
              const dFileName = d.fileName?.toLowerCase() || '';
              const dBase = dFileName.substring(0, dFileName.lastIndexOf('.'));
              
              // Exact match
              if (dFileName === searchFileName) return true;
              
              // Partial match (filename contains search term or vice versa)
              if (dFileName.includes(searchFileName) || searchFileName.includes(dFileName)) return true;
              
              // Base name match (handles truncated extensions like .pn → .png)
              if (searchBase && dBase && (dBase === searchBase || dBase.includes(searchBase) || searchBase.includes(dBase))) return true;
              
              // Match by key words in filename (e.g., "logo" should match files with "logo" in name)
              const searchWords = searchBase.split(/[._-]/).filter((w: string) => w.length > 2);
              const docWords = dBase.split(/[._-]/).filter((w: string) => w.length > 2);
              if (searchWords.some((word: string) => docWords.includes(word))) return true;
              
              return false;
            });
            
            logger.debug('Found documents by filename', { count: matchingDocs.length, fileName: fileData.fileName });
          }
          
          // If still no matches and there's only 1 document in the system, use it (last resort)
          if (matchingDocs.length === 0 && allDocumentsList.length === 1) {
            logger.debug('Only 1 document in system, using it as fallback');
            matchingDocs = allDocumentsList;
          }
          
          // If still no matches but we have documents, try to match by any image/document file
          if (matchingDocs.length === 0 && allDocumentsList.length > 0 && fileData?.fileName) {
            // Check if the fileData suggests it's an image/document
            const isImage = /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(fileData.fileName);
            if (isImage) {
              // Find any image file
              matchingDocs = allDocumentsList.filter((d: any) => {
                const dFileName = d.fileName?.toLowerCase() || '';
                return /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(dFileName);
              });
              logger.debug('Found image documents as fallback', { count: matchingDocs.length });
            }
          }
          
          if (matchingDocs.length > 0) {
            // Use the matching documents (even if caseId doesn't match)
            documents.push(...matchingDocs);
            logger.debug('Using fallback documents (caseId may not match)', { 
              documents: documents.map((d: any) => ({
                fileName: d.fileName,
                caseId: d.caseId,
                searchingFor: caseId
              }))
            });
          } else {
            // Show all available documents for debugging
            logger.debug('All documents in system', {
              documents: allDocumentsList.map((d: any) => ({
                fileName: d.fileName,
                caseId: d.caseId
              })),
              searchingFor: caseId,
              fileData: fileData?.fileName
            });
            
            // Provide more helpful message based on the situation
            let message = `No documents found for application ${caseId}.\n\n`;
            
            if (allDocumentsList.length === 0) {
              message += `The document database is empty. `;
              if (fileData?.fileName) {
                message += `\n\nThe application metadata references a file "${fileData.fileName}", `;
                message += `but the document record was deleted (possibly when applications were cleared).\n\n`;
                message += `Please re-upload the document if needed.`;
              } else {
                message += `\n\nIf you expected documents to be here, they may have been deleted. `;
                message += `Please upload new documents.`;
              }
            } else {
              message += `Found ${allDocumentsList.length} total document(s) in system, `;
              message += `but none are linked to this application.\n\n`;
              message += `If you uploaded a document, it may not be linked to this application. `;
              message += `Please check the Documents page to verify.`;
            }
            
            await SweetAlert.warning("No Documents Found", message);
            return;
          }
        } else {
          await SweetAlert.warning(
            "No Documents", 
            `No documents found for this application (ID: ${caseId}).\n\nPlease check if documents have been uploaded.`
          );
          return;
        }
      }

      // More flexible document matching
      const fileName = fileData.fileName || (typeof fileData === 'string' ? fileData : '');
      const requirementCode = fileData.requirementCode;
      
      // Try multiple matching strategies
      let doc = documents.find((d: any) => {
        const dFileName = d.fileName?.toLowerCase() || '';
        const searchFileName = fileName?.toLowerCase() || '';
        
        // Exact match
        if (d.fileName === fileName || dFileName === searchFileName) return true;
        
        // Partial match (filename contains search term or vice versa)
        if (dFileName.includes(searchFileName) || searchFileName.includes(dFileName)) return true;
        
        // Match by requirement code
        if (requirementCode && (d.documentNumber === requirementCode || d.documentNumber?.includes(requirementCode))) return true;
        
        // Match by file extension if filenames are similar
        const dExt = dFileName.substring(dFileName.lastIndexOf('.'));
        const searchExt = searchFileName.substring(searchFileName.lastIndexOf('.'));
        if (dExt && searchExt && dExt === searchExt) {
          // If extensions match, check if base names are similar
          const dBase = dFileName.replace(dExt, '');
          const searchBase = searchFileName.replace(searchExt, '');
          if (dBase.includes(searchBase) || searchBase.includes(dBase)) return true;
        }
        
        return false;
      });

      // If still not found, try to find any document with similar characteristics
      if (!doc && fileName) {
        const fileNameParts = fileName.toLowerCase().split(/[._-]/);
        doc = documents.find((d: any) => {
          const dFileName = d.fileName?.toLowerCase() || '';
          return fileNameParts.some((part: string) => part.length > 3 && dFileName.includes(part));
        });
      }

      // If still not found, just use the first document (fallback)
      if (!doc && documents.length > 0) {
        doc = documents[0];
      }

      if (!doc || !doc.storageKey) {
        await SweetAlert.warning("Document Not Found", `Could not find document "${fileName}" in the system. Found ${documents.length} document(s) for this application.`);
        return;
      }

      // Get download URL - try multiple methods
      let downloadUrl: string | null = null;
      
      // Method 1: Try download endpoint with storage key
      try {
        const downloadResponse = await fetch(`/api/proxy/api/v1/documents/download/${encodeURIComponent(doc.storageKey)}`);
        if (downloadResponse.ok) {
          const downloadData = await downloadResponse.json();
          logger.debug('Download URL response received');
          
          // Try all possible field names for the URL (C# serializes to camelCase by default)
          downloadUrl = downloadData.downloadUrl || 
                       downloadData.DownloadUrl || 
                       downloadData.url || 
                       downloadData.presignedUrl ||
                       downloadData.presignedDownloadUrl ||
                       downloadData.downloadURL ||
                       (typeof downloadData === 'string' ? downloadData : null) ||
                       null;
          
          // Proxy MinIO URLs through our API to avoid CORS and signature issues
          if (downloadUrl && doc.storageKey) {
            // Use our proxy endpoint instead of direct MinIO URL
            downloadUrl = `/api/proxy-document?storageKey=${encodeURIComponent(doc.storageKey)}`;
            logger.debug('Using proxy endpoint for document', { downloadUrl });
          } else if (downloadUrl) {
            // If we don't have storageKey but have a URL, still proxy it
            downloadUrl = `/api/proxy-document?url=${encodeURIComponent(downloadUrl)}`;
            logger.debug('Using proxy endpoint with URL', { downloadUrl });
          }
          
          logger.debug('Extracted download URL', { downloadUrl });
          
          // If still no URL, log the full response for debugging
          if (!downloadUrl) {
            logger.error(new Error('Could not extract URL from response'), 'Failed to extract download URL', {
              tags: { error_type: 'url_extraction_error' },
              extra: { downloadData }
            });
          }
        } else {
          const errorText = await downloadResponse.text();
          logger.warn('Download URL request failed', {
            tags: { warning_type: 'download_url_failed' },
            extra: { status: downloadResponse.status, errorText }
          });
        }
      } catch (err) {
        logger.warn('Failed to get download URL from storage key', {
          tags: { warning_type: 'storage_key_download_failed' },
          extra: { error: err }
        });
      }
      
      // Method 2: Try download endpoint with document ID
      if (!downloadUrl && doc.id) {
        try {
          const downloadResponse = await fetch(`/api/proxy/api/v1/documents/${doc.id}/download`);
          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json();
            downloadUrl = downloadData.downloadUrl || 
                         downloadData.DownloadUrl || 
                         downloadData.url || 
                         downloadData.presignedUrl ||
                         null;
            
            // Proxy through our API
            if (downloadUrl && doc.storageKey) {
              downloadUrl = `/api/proxy-document?storageKey=${encodeURIComponent(doc.storageKey)}`;
            } else if (downloadUrl) {
              downloadUrl = `/api/proxy-document?url=${encodeURIComponent(downloadUrl)}`;
            }
            
            logger.debug('Download URL from document ID', { downloadUrl });
          }
        } catch (err) {
          logger.warn('Failed to get download URL from document ID', {
            tags: { warning_type: 'document_id_download_failed' },
            extra: { error: err }
          });
        }
      }
      
      // Method 3: Try download-url POST endpoint
      if (!downloadUrl && doc.storageKey) {
        try {
          const downloadResponse = await fetch(`/api/proxy/api/v1/documents/download-url`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              storageKey: doc.storageKey,
              bucketName: doc.bucketName || 'kyb-docs' || 'documents'
            })
          });
          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json();
            // Try all possible field names (C# serializes to camelCase)
            downloadUrl = downloadData.downloadUrl || 
                             downloadData.DownloadUrl || 
                             downloadData.url || 
                             downloadData.presignedUrl ||
                             downloadData.presignedDownloadUrl ||
                             downloadData.downloadURL ||
                             null;
            
            // Proxy through our API
            if (downloadUrl && doc.storageKey) {
              downloadUrl = `/api/proxy-document?storageKey=${encodeURIComponent(doc.storageKey)}`;
            } else if (downloadUrl) {
              downloadUrl = `/api/proxy-document?url=${encodeURIComponent(downloadUrl)}`;
            }
            
            logger.debug('Download URL from POST endpoint', { downloadUrl });
          } else {
            const errorText = await downloadResponse.text();
            logger.warn('POST download URL request failed', {
              tags: { warning_type: 'post_download_failed' },
              extra: { status: downloadResponse.status, errorText }
            });
          }
        } catch (err) {
          logger.warn('Failed to get download URL from POST endpoint', {
            tags: { warning_type: 'post_endpoint_failed' },
            extra: { error: err }
          });
        }
      }
      
      if (!downloadUrl) {
        logger.error(new Error('All download URL methods failed'), 'Failed to get download URL', {
          tags: { error_type: 'all_download_methods_failed' },
          extra: { document: doc }
        });
        throw new Error(`Failed to get download URL for document. StorageKey: ${doc.storageKey}, DocumentId: ${doc.id}`);
      }

      // Open viewer
      setViewingDocumentName(doc.fileName || fileName);
      setViewingDocumentType(doc.type ? String(doc.type) : undefined);
      setViewingDocumentSize(doc.sizeBytes || fileData.fileSize);
      setViewingDocumentUrl(downloadUrl);
      setDocumentViewerOpen(true);
    } catch (err) {
      logger.error(err, 'Error viewing document', {
        tags: { error_type: 'document_view_error' }
      });
      await SweetAlert.error("View Failed", err instanceof Error ? err.message : 'Failed to view document. Please try again.');
    }
  };

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch full application details from the API route
      const response = await fetch(`/api/applications/${applicationId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Application not found');
          return;
        }
        throw new Error(`Failed to fetch application: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store raw application data for schema mapping
      setRawApplicationData(data);
      
      // Map backend data to the expected Application format
      const projection = data;
      const metadata = projection.metadataJson ? JSON.parse(projection.metadataJson) : {};
      
      // Get entity type code directly from metadata (this is what was used when creating the application)
      // Clean up the value - handle cases where it might be duplicated or have extra formatting
      let entityTypeCode = metadata.entity_type_code || metadata.entityTypeCode || null;
      
      if (entityTypeCode) {
        // If it's a string with commas (duplicated values), take the first one
        if (typeof entityTypeCode === 'string' && entityTypeCode.includes(',')) {
          entityTypeCode = entityTypeCode.split(',')[0].trim();
        }
        // Ensure it's a string and trim whitespace
        entityTypeCode = String(entityTypeCode).trim();
        // If it's empty after cleaning, set to null
        if (entityTypeCode === '') {
          entityTypeCode = null;
        }
      }
      
      logger.debug('[Application Loader] Entity type code from metadata', {
        raw: metadata.entity_type_code || metadata.entityTypeCode,
        cleaned: entityTypeCode
      });
      
      // Map status from backend to frontend
      const statusMap: Record<string, Application['status']> = {
        'Draft': 'IN PROGRESS',
        'InProgress': 'IN PROGRESS',
        'PendingReview': 'RISK REVIEW',
        'Submitted': 'SUBMITTED',
        'Approved': 'COMPLETE',
        'Rejected': 'DECLINED',
        'Cancelled': 'DECLINED',
      };
      
      const mappedApp: Application = {
        id: projection.caseId || projection.id,
        legalName: projection.businessLegalName || `${projection.applicantFirstName || ''} ${projection.applicantLastName || ''}`.trim() || 'Unknown',
        entityType: projection.type || metadata.entity_type_display_name || 'Unknown',
        country: projection.businessCountryOfRegistration || projection.applicantCountry || 'Unknown',
        status: statusMap[projection.status] || 'IN PROGRESS',
        created: projection.createdAt || new Date().toISOString(),
        updated: projection.updatedAt || projection.createdAt || new Date().toISOString(),
        submittedBy: projection.applicantEmail || 'Unknown',
        riskScore: projection.riskScore || 0,
        documents: [], // Documents would need to be fetched separately
        businessInfo: {
          registrationNumber: projection.businessRegistrationNumber || metadata.registrationNumber || '',
          taxId: projection.businessTaxId || metadata.taxNumber || '',
          businessAddress: projection.businessAddress || metadata.businessAddress || '',
          industry: projection.businessIndustry || metadata.industry || '',
          employees: projection.businessNumberOfEmployees || 0,
          annualRevenue: projection.businessAnnualRevenue || 0,
        },
        contactInfo: {
          primaryContact: `${projection.applicantFirstName || ''} ${projection.applicantLastName || ''}`.trim(),
          email: projection.applicantEmail || '',
          phone: projection.applicantPhone || '',
          address: projection.applicantAddress || '',
        },
      };
      
      setApplication(mappedApp);
      setStatusUpdate(mappedApp.status);
      setTempStatusUpdate(mappedApp.status);
      
      // Fetch entity schema using the EXACT entity_type_code from metadata (no normalization)
      if (entityTypeCode) {
        logger.debug('[Application Loader] Using entity_type_code from application metadata', { entityTypeCode });
        await loadEntitySchema(entityTypeCode, data);
      } else {
        logger.error(new Error('No entity_type_code found in application metadata'), '[Application Loader] Missing entity type code', {
          tags: { error_type: 'missing_entity_type_code' },
          extra: { availableKeys: Object.keys(metadata) }
        });
      }
    } catch (err) {
      setError('Failed to load application');
      logger.error(err, 'Error loading application', {
        tags: { error_type: 'application_load_error' }
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEntitySchema = async (entityTypeCode: string, applicationData: Record<string, any>) => {
    try {
      setSchemaLoading(true);
      
      // Use the entity type code DIRECTLY from the application metadata - no normalization needed
      // This is the exact code that was used when the application was created
        logger.debug('[Schema Loader] Using entity type code directly from application', { entityTypeCode });
      
      if (!entityTypeCode || entityTypeCode.trim() === '') {
        logger.error(new Error('Entity type code is empty or invalid'), '[Schema Loader] Invalid entity type code', {
          tags: { error_type: 'invalid_entity_type_code' }
        });
        return;
      }
      
      const schema = await fetchEntitySchema(entityTypeCode.trim(), applicationData);
      
      if (schema) {
        logger.debug('[Schema Loader] Successfully loaded entity schema', {
          sectionsCount: schema.sections.length,
          sections: schema.sections.map((section, idx) => ({
            index: idx + 1,
            title: section.title,
            fieldsCount: section.fields.length
          }))
        });
        setEntitySchema(schema);
      } else {
        logger.error(new Error(`No entity schema found for: ${entityTypeCode}`), '[Schema Loader] Missing entity schema', {
          tags: { error_type: 'missing_entity_schema' },
          extra: { entityTypeCode }
        });
      }
    } catch (err) {
      logger.error(err, '[Schema Loader] Error loading entity schema', {
        tags: { error_type: 'schema_load_error' },
        extra: { stack: err instanceof Error ? err.stack : 'No stack trace' }
      });
      // Don't set error state - schema is optional, fallback to hardcoded fields
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!application || !tempStatusUpdate) return;
    
    setIsUpdating(true);
    try {
      // Call the real API endpoint to update status
      const response = await fetch(`/api/applications/${application.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: tempStatusUpdate,
          notes: tempComment || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update status: ${response.status}`);
      }

      // Update local state
      setStatusUpdate(tempStatusUpdate);
      
      // Reload application to get updated data
      await loadApplication();
      
      // Close modal and show success
      setIsStatusModalOpen(false);
      setTempStatusUpdate("");
      setTempComment("");
      
      await SweetAlert.success("Status Updated", `Application status has been updated to ${tempStatusUpdate}`);
    } catch (err) {
      logger.error(err, 'Error updating status', {
        tags: { error_type: 'status_update_error' }
      });
      await SweetAlert.error("Update Failed", err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!tempComment.trim() || !application) return;
    
    setIsCommenting(true);
    try {
      // Add comment via work queue API if work item exists
      const workItemId = application.id;
      
      const response = await fetch(`/api/workqueue/${workItemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tempComment }),
      });

      if (response.ok) {
        // Update local comments
        setAdminComments(tempComment);
        
        // Close modal and show success
        setIsCommentModalOpen(false);
        setTempComment("");
        
        await SweetAlert.success("Comment Added", "Your comment has been added successfully");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add comment: ${response.status}`);
      }
    } catch (err) {
      logger.error(err, 'Error adding comment', {
        tags: { error_type: 'comment_add_error' }
      });
      await SweetAlert.error("Comment Failed", err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleExportData = async () => {
    if (!application) return;
    
    setIsExporting(true);
    try {
      // Create a comprehensive export of the application data
      const exportData = {
        applicationId: application.id,
        legalName: application.legalName,
        entityType: application.entityType,
        country: application.country,
        status: application.status,
        submittedDate: application.created,
        lastUpdated: application.updated,
        applicant: application.submittedBy,
        riskScore: application.riskScore || 0,
        businessInfo: application.businessInfo,
        contactInfo: application.contactInfo,
        documents: application.documents,
      };

      // Convert to JSON
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `application_${application.id}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      await SweetAlert.success("Export Successful", "Application data has been exported");
    } catch (err) {
      logger.error(err, 'Error exporting data', {
        tags: { error_type: 'data_export_error' }
      });
      await SweetAlert.error("Export Failed", err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate steps dynamically from entity schema
  // Map requirement types to icons
  const getIconForRequirementType = (requirementType: string): any => {
    const iconMap: Record<string, any> = {
      'Information': FiFileText,
      'Document': FiFolder,
      'ProofOfIdentity': FiUserCheck,
      'ProofOfAddress': FiHome,
      'OwnershipStructure': FiUsers,
      'BoardDirectors': FiUserCheck,
      'AuthorizedSignatories': FiUsers,
    };
    return iconMap[requirementType] || FiFileText;
  };

  // Generate steps from entity schema sections
  const generateStepsFromSchema = (schema: EntitySchema | null) => {
    if (!schema || !schema.sections || schema.sections.length === 0) {
      // Fallback to default steps if no schema
      return [
    {
      id: 1,
      title: "Overview",
      subtitle: "Application summary",
      icon: FiFileText,
      active: true
        }
      ];
    }

    // Create steps from schema sections, sorted by displayOrder
    const sortedSections = [...schema.sections].sort((a, b) => a.order - b.order);
    
    return sortedSections.map((section, index) => {
      // Determine icon based on section title or requirement type
      let icon = FiFileText;
      const sectionTitleUpper = section.title.toUpperCase();
      
      if (sectionTitleUpper.includes('OVERVIEW') || sectionTitleUpper.includes('INFORMATION')) {
        icon = FiFileText;
      } else if (sectionTitleUpper.includes('DOCUMENT')) {
        icon = FiFolder;
      } else if (sectionTitleUpper.includes('OWNERSHIP') || sectionTitleUpper.includes('SHAREHOLDER')) {
        icon = FiUsers;
      } else if (sectionTitleUpper.includes('DIRECTOR') || sectionTitleUpper.includes('BOARD')) {
        icon = FiUserCheck;
      } else if (sectionTitleUpper.includes('IDENTITY') || sectionTitleUpper.includes('PROOF')) {
        icon = FiUserCheck;
      } else if (sectionTitleUpper.includes('ADDRESS')) {
        icon = FiHome;
      } else if (sectionTitleUpper.includes('SIGNATORY') || sectionTitleUpper.includes('AUTHORIZED')) {
        icon = FiUsers;
      }

      return {
        id: index + 1,
        title: section.title,
        subtitle: section.description || `${section.title} details`,
        icon: icon,
        active: true,
        sectionId: section.id,
        sectionOrder: section.order
      };
    });
  };

  // Generate steps dynamically from schema
  const adminSteps = generateStepsFromSchema(entitySchema);

  const getStatusColor = (status: string) => {
    const colors = {
      'SUBMITTED': "blue",
      'IN PROGRESS': "orange", 
      'COMPLETE': "green",
      'DECLINED': "red",
      'RISK REVIEW': "yellow",
      'INCOMPLETE': "gray"
    };
    return colors[status as keyof typeof colors] || "gray";
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "red";
    if (score >= 60) return "yellow";
    return "green";
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="280px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <IconWrapper><FiFileText size={32} color="#DD6B20" /></IconWrapper>
            <Typography color="gray.600">Loading application details...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (error || !application) {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="280px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <AlertBar
              status="error"
              title="Error!"
              description={error || 'Application not found'}
            />
            <Link href="/work-queue">
              <Button variant="secondary">
                <IconWrapper><FiArrowLeft size={16} /></IconWrapper>
                Back to Work Queue
              </Button>
            </Link>
          </VStack>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <Box flex="1" ml="240px" bg="gradient-to-br" bgGradient="linear(to-br, gray.50, white)">
      {/* Header */}
        <Box 
          bg="white" 
          borderBottom="1px" 
          borderColor="gray.200" 
          py="5"
          boxShadow="sm"
          position="sticky"
          top="0"
          zIndex="10"
        >
        <Container maxW="8xl">
            <Flex justify="space-between" align="center" mb="4">
              <HStack gap="3" align="center">
                <Box
                  p="2.5"
                  borderRadius="lg"
                  bgGradient="linear(to-br, orange.400, orange.600)"
                  boxShadow="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <IconWrapper><FiFileText size={20} color="white" /></IconWrapper>
                </Box>
                <VStack align="start" gap="0.5">
                  <Typography 
                    as="h1" 
                    fontSize="2xl" 
                    fontWeight="800" 
                    color="gray.900"
                    letterSpacing="-0.02em"
                    lineHeight="1.2"
                  >
                    Application Review
                  </Typography>
                  <HStack gap="2" align="center">
                    <Typography color="gray.600" fontSize="sm" fontWeight="500">
                      {application.legalName}
                    </Typography>
                    <Typography color="gray.400" fontSize="xs">•</Typography>
                    <Typography color="gray.500" fontSize="sm" fontWeight="500">
                      {application.entityType}
                    </Typography>
                  </HStack>
                </VStack>
              </HStack>
              <HStack gap="3" align="center">
                <Tag
                  variant={getStatusColor(application.status) === 'green' ? 'success' : getStatusColor(application.status) === 'red' ? 'danger' : 'info'}
                >
                  {application.status}
                </Tag>
                <Link href="/work-queue">
                  <Button 
                    variant="secondary"
                    size="md"
                  >
                    <IconWrapper><FiArrowLeft size={16} /></IconWrapper>
                    Back to Queue
                  </Button>
                </Link>
              </HStack>
            </Flex>

            {/* Progress Stepper */}
            <Box py="3">
              <Flex direction="column" gap="3" align="stretch">
                {/* Icons and connecting lines */}
                <HStack gap="2" justify="space-between" align="flex-start" position="relative" w="full">
                  {adminSteps.map((step, index) => (
                    <Flex 
                      key={step.id} 
                      align="stretch" 
                      gap="0" 
                      flex="1" 
                      position="relative"
                      direction="column"
                    >
                      {/* Icon row - centered */}
                      <Flex 
                        align="center" 
                        justify="center" 
                        w="full" 
                        position="relative"
                        mb="2"
                      >
                        <Circle
                          size="44px"
                          bg={currentStep >= step.id 
                            ? "linear-gradient(135deg, orange.400, orange.600)" 
                            : "gray.100"}
                          bgGradient={currentStep >= step.id 
                            ? "linear(to-br, orange.400, orange.600)" 
                            : undefined}
                          color={currentStep >= step.id ? "white" : "gray.400"}
                          cursor="pointer"
                          onClick={() => setCurrentStep(step.id)}
                          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          _hover={{ 
                            transform: "scale(1.08)",
                            boxShadow: currentStep >= step.id 
                              ? "0 6px 16px rgba(237, 137, 54, 0.4)" 
                              : "0 3px 10px rgba(0, 0, 0, 0.1)"
                          }}
                          boxShadow={currentStep >= step.id 
                            ? "0 4px 12px rgba(237, 137, 54, 0.3)" 
                            : "0 2px 6px rgba(0, 0, 0, 0.05)"}
                          border={currentStep === step.id ? "3px solid" : "none"}
                          borderColor={currentStep === step.id ? "orange.300" : "transparent"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          mx="auto"
                        >
                          <IconWrapper><step.icon size={20} /></IconWrapper>
                        </Circle>
                        {index < adminSteps.length - 1 && (
                          <Box
                            position="absolute"
                            left="calc(50% + 22px)"
                            top="50%"
                            transform="translateY(-50%)"
                            width="calc(100% - 44px)"
                            height="3px"
                            borderRadius="full"
                            bg={currentStep > step.id 
                              ? "linear-gradient(90deg, orange.400, orange.500)" 
                              : "gray.200"}
                            bgGradient={currentStep > step.id 
                              ? "linear(to-r, orange.400, orange.500)" 
                              : undefined}
                            transition="all 0.4s ease"
                            zIndex="0"
                          />
                        )}
                      </Flex>
                      
                      {/* Labels aligned directly under icons - perfectly centered */}
                      <VStack 
                        align="center" 
                        gap="0.5" 
                        w="full"
                        cursor="pointer"
                        onClick={() => setCurrentStep(step.id)}
                        transition="all 0.2s"
                        _hover={{ transform: "translateY(-1px)" }}
                        px="1"
                      >
                        <Typography 
                          fontSize="xs" 
                          fontWeight={currentStep === step.id ? "700" : "600"} 
                          color={currentStep === step.id ? "gray.900" : "gray.700"}
                          transition="all 0.2s"
                          textAlign="center"
                          lineHeight="1.3"
                          whiteSpace="nowrap"
                          w="full"
                        >
                          {step.title}
                        </Typography>
                        <Typography 
                          fontSize="10px" 
                          color={currentStep === step.id ? "gray.600" : "gray.500"}
                          fontWeight={currentStep === step.id ? "500" : "400"}
                          transition="all 0.2s"
                          textAlign="center"
                          lineHeight="1.2"
                          whiteSpace="nowrap"
                          w="full"
                        >
                          {step.subtitle}
                        </Typography>
                      </VStack>
                    </Flex>
                  ))}
                </HStack>
              </Flex>
            </Box>
        </Container>
      </Box>

        {/* Step Content */}
      <Container maxW="8xl" py="4" px="6">
          <MotionBox
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {(() => {
              // Get the current step's section from the schema
              const currentStepData = adminSteps.find(step => step.id === currentStep);
              
              // If schema is loading or not available, show loading state
              if (schemaLoading || !entitySchema) {
                return (
                  <VStack gap="6" align="stretch" w="full">
                    <Card 
                      bg="white" 
                      borderRadius="xl" 
                      border="1px" 
                      borderColor="gray.200" 
                      p="6"
                      boxShadow="md"
                      w="full"
                    >
                      <VStack gap="4" align="center" py="8" w="full">
                        <Box
                          p="3"
                          borderRadius="lg"
                          bgGradient="linear(to-br, orange.100, orange.200)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <IconWrapper><FiFileText size={24} color="#DD6B20" /></IconWrapper>
                        </Box>
                        <Typography fontSize="md" color="gray.700" fontWeight="600" textAlign="center">
                          Loading entity schema from database...
                        </Typography>
                        <Progress.Root value={undefined} size="md" colorScheme="orange" w="full" maxW="300px">
                          <Progress.Track>
                            <Progress.Range />
                          </Progress.Track>
                        </Progress.Root>
                      </VStack>
                    </Card>
                  </VStack>
                );
              }
              
              if (!currentStepData) {
                return (
                  <VStack gap="6" align="stretch" w="full">
                    <Card 
                      bg="white" 
                      borderRadius="xl" 
                      border="1px" 
                      borderColor="yellow.200" 
                      p="6"
                      boxShadow="md"
                      bgGradient="linear(to-br, white, yellow.50)"
                      w="full"
                    >
                      <AlertBar
                        status="warning"
                        title="Step Not Found"
                        description={`Step ${currentStep} could not be found in the schema.`}
                      />
                    </Card>
                  </VStack>
                );
              }

              // Find the section that matches this step
              // Use sectionId if available, otherwise match by title and order
              const currentSection = entitySchema.sections.find(
                section => (currentStepData as any).sectionId === section.id || 
                          (section.title === currentStepData.title && 
                           (currentStepData as any).sectionOrder === section.order)
              ) || entitySchema.sections.find(
                section => section.title === currentStepData.title
              ) || entitySchema.sections[currentStep - 1]; // Fallback to index-based

              if (!currentSection) {
                return (
                  <VStack gap="6" align="stretch" w="full">
                    <Card 
                      bg="white" 
                      borderRadius="xl" 
                      border="1px" 
                      borderColor="yellow.200" 
                      p="6"
                      boxShadow="md"
                      bgGradient="linear(to-br, white, yellow.50)"
                      w="full"
                    >
                      <AlertBar
                        status="warning"
                        title="Section Not Found"
                        description={`The section for step "${currentStepData.title}" could not be found in the schema.`}
                      />
                    </Card>
                  </VStack>
                );
              }

              // Render the section dynamically
              return (
                <VStack gap="6" align="stretch" w="full">
                  {schemaLoading ? (
                    <Card 
                      bg="white" 
                      borderRadius="xl" 
                      border="1px" 
                      borderColor="gray.200" 
                      p="6"
                      boxShadow="md"
                      w="full"
                    >
                      <VStack gap="4" align="center" py="8" w="full">
                          <Box
                            p="3"
                            borderRadius="lg"
                            bgGradient="linear(to-br, orange.100, orange.200)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <IconWrapper><FiFileText size={24} color="#DD6B20" /></IconWrapper>
                          </Box>
                          <Typography fontSize="md" color="gray.700" fontWeight="600" textAlign="center">
                            Loading entity schema from database...
                          </Typography>
                          <Progress.Root value={undefined} size="md" colorScheme="orange" w="full" maxW="300px">
                            <Progress.Track>
                              <Progress.Range />
                            </Progress.Track>
                          </Progress.Root>
                        </VStack>
                    </Card>
                  ) : (
                    <Card 
                      bg="white" 
                      borderRadius="xl" 
                      border="1px" 
                      borderColor="gray.200" 
                      p="6"
                      boxShadow="md"
                      transition="all 0.2s"
                      w="full"
                    >
                      <Box pb="4" borderBottom="1px" borderColor="gray.100" mb="4">
                        <HStack justify="space-between" align="flex-start" w="full">
                          <VStack align="start" gap="1.5" flex="1">
                            <HStack gap="2.5" align="center">
                              <Box
                                p="1.5"
                                borderRadius="md"
                                bgGradient="linear(to-br, blue.100, blue.200)"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                              >
                                <IconWrapper><currentStepData.icon size={16} color="#3182CE" /></IconWrapper>
                              </Box>
                              <Typography 
                                fontSize="lg" 
                                fontWeight="700" 
                                color="gray.900"
                                letterSpacing="-0.01em"
                                lineHeight="1.3"
                              >
                                {currentSection.title}
                              </Typography>
                            </HStack>
                            {currentSection.description && (
                              <Typography 
                                fontSize="sm" 
                                color="gray.600"
                                fontWeight="500"
                                pl="8"
                                lineHeight="1.4"
                              >
                                {currentSection.description}
                              </Typography>
                            )}
                          </VStack>
                          <Tag 
                            variant="success"
                          >
                            Schema-Driven
                          </Tag>
                        </HStack>
                      </Box>
                      <Box pt="6">
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" w="full">
                          {currentSection.fields.map((field) => (
                            <Box key={field.code} w="full">
                              <DynamicFieldRenderer 
                                field={field} 
                                readOnly={true}
                                onDocumentClick={handleDocumentView}
                              />
                            </Box>
                          ))}
                        </SimpleGrid>
                      </Box>
                    </Card>
                  )}

                  {/* Quick Actions - only show on first step */}
                  {currentStep === 1 && (
                    <Card 
                      bg="white" 
                      borderRadius="xl" 
                      border="1px" 
                      borderColor="gray.200" 
                      p="6"
                      boxShadow="md"
                      w="full"
                    >
                      <Box pb="4" mb="4">
                        <HStack gap="2.5" align="center">
                          <Box
                            p="1.5"
                            borderRadius="md"
                            bgGradient="linear(to-br, purple.100, purple.200)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <IconWrapper><FiCheckSquare size={16} color="#805AD5" /></IconWrapper>
                          </Box>
                          <Typography 
                            fontSize="lg" 
                            fontWeight="700" 
                            color="gray.900"
                            letterSpacing="-0.01em"
                            lineHeight="1.3"
                          >
                            Quick Actions
                          </Typography>
                        </HStack>
                      </Box>
                      <Box pt="0">
                        <HStack gap="3" wrap="wrap" align="center">
                          <Button
                            variant="primary"
                            onClick={() => setIsStatusModalOpen(true)}
                          >
                            <IconWrapper><FiEdit3 size={16} /></IconWrapper>
                            Update Status
                          </Button>
                          <Button 
                            variant="secondary"
                            onClick={() => setIsCommentModalOpen(true)}
                          >
                            <IconWrapper><FiMessageSquare size={16} /></IconWrapper>
                            Add Comment
                          </Button>
                          <Button 
                            variant="secondary"
                            onClick={handleExportData}
                            disabled={isExporting}
                          >
                            <IconWrapper><FiDownload size={16} /></IconWrapper>
                            {isExporting ? 'Exporting...' : 'Export Data'}
                          </Button>
                        </HStack>
                      </Box>
                    </Card>
                  )}
                          </VStack>
              );
            })()}
          </MotionBox>

          {/* Navigation */}
          <HStack 
            justify="space-between" 
            align="center"
            mt="6" 
            p="3" 
            bg="white" 
            borderRadius="lg" 
            boxShadow="sm"
            border="1px"
            borderColor="gray.200"
            w="full"
          >
            <Button
              variant="secondary"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <IconWrapper><FiArrowLeft size={16} /></IconWrapper>
              Previous
            </Button>
            
            <HStack gap="1.5" p="1" bg="gray.50" borderRadius="md" align="center">
              {adminSteps.map((step) => (
                <Button
                  key={step.id}
                  size="sm"
                  variant={currentStep === step.id ? "primary" : "ghost"}
                  onClick={() => setCurrentStep(step.id)}
                >
                  {step.id}
                </Button>
              ))}
            </HStack>

            <Button
              variant="primary"
              onClick={() => setCurrentStep(Math.min(adminSteps.length, currentStep + 1))}
              disabled={currentStep === adminSteps.length}
            >
              Next
              <IconWrapper><FiArrowRight size={16} /></IconWrapper>
            </Button>
          </HStack>
      </Container>
    </Box>

    {/* Status Update Modal */}
    <Modal
      isOpen={isStatusModalOpen}
      onClose={() => {
        setIsStatusModalOpen(false);
        setTempStatusUpdate(statusUpdate);
        setTempComment("");
      }}
      title="Update Application Status"
      size="small"
      closeOnBackdropClick={true}
      closeOnEsc={true}
    >
      <ModalHeader>
        <HStack gap="3" align="center" mb="1">
          <Box
            p="2"
            borderRadius="lg"
            bgGradient="linear(to-br, orange.100, orange.200)"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <IconWrapper><FiEdit3 size={16} color="#DD6B20" /></IconWrapper>
          </Box>
          <VStack align="start" gap="0">
            <Typography fontSize="lg" fontWeight="700" color="gray.900">
              Update Application Status
            </Typography>
            <Typography fontSize="sm" color="gray.600" mt="0.5">
              Change the status of this application
            </Typography>
          </VStack>
        </HStack>
      </ModalHeader>
      <ModalBody>
            <VStack gap="5" align="stretch">
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="600" color="gray.700" mb="2">
                  New Status
                </Field.Label>
                <Box position="relative">
                  <select
                    value={tempStatusUpdate}
                    onChange={(e) => setTempStatusUpdate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      borderRadius: '8px',
                      border: '1.5px solid #E2E8F0',
                      backgroundColor: 'white',
                      color: '#1A202C',
                      fontWeight: '500',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '36px'
                    }}
                  >
                    <option value="">Select status...</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="IN PROGRESS">In Progress</option>
                    <option value="RISK REVIEW">Risk Review</option>
                    <option value="COMPLETE">Complete</option>
                    <option value="DECLINED">Declined</option>
                    <option value="INCOMPLETE">Incomplete</option>
                  </select>
                </Box>
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="600" color="gray.700" mb="2">
                  Notes <Typography as="span" color="gray.400" fontWeight="400">(Optional)</Typography>
                </Field.Label>
                <Textarea
                  placeholder="Add notes about this status change..."
                  value={tempComment}
                  onChange={(e) => setTempComment(e.target.value)}
                  rows={4}
                  borderRadius="md"
                  borderWidth="1.5px"
                  borderColor="gray.300"
                  fontSize="sm"
                  color="gray.900"
                  _focus={{
                    borderColor: "orange.400",
                    boxShadow: "0 0 0 1px orange.400"
                  }}
                />
              </Field.Root>
            </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="3" justify="flex-end" w="full">
            <Button
              variant="secondary"
              onClick={() => {
                setIsStatusModalOpen(false);
                setTempStatusUpdate(statusUpdate);
                setTempComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStatusUpdate}
              disabled={isUpdating || !tempStatusUpdate}
            >
              Update Status
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>

    {/* Add Comment Modal */}
    <Modal
      isOpen={isCommentModalOpen}
      onClose={() => {
        setIsCommentModalOpen(false);
        setTempComment("");
      }}
      title="Add Comment"
      size="small"
      closeOnBackdropClick={true}
      closeOnEsc={true}
    >
      <ModalHeader>
        <HStack gap="3" align="center" mb="1">
          <Box
            p="2"
            borderRadius="lg"
            bgGradient="linear(to-br, blue.100, blue.200)"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <IconWrapper><FiMessageSquare size={16} color="#3182CE" /></IconWrapper>
          </Box>
          <VStack align="start" gap="0">
            <Typography fontSize="lg" fontWeight="700" color="gray.900">
              Add Comment
            </Typography>
            <Typography fontSize="sm" color="gray.600" mt="0.5">
              Add a comment or note to this application
            </Typography>
          </VStack>
        </HStack>
      </ModalHeader>
      <ModalBody>
        <Field.Root>
          <Field.Label fontSize="sm" fontWeight="600" color="gray.700" mb="2">
            Comment
          </Field.Label>
          <Textarea
            placeholder="Enter your comment here..."
            value={tempComment}
            onChange={(e) => setTempComment(e.target.value)}
            rows={6}
            borderRadius="md"
            borderWidth="1.5px"
            borderColor="gray.300"
            fontSize="sm"
            color="gray.900"
            _focus={{
              borderColor: "blue.400",
              boxShadow: "0 0 0 1px blue.400"
            }}
          />
        </Field.Root>
      </ModalBody>
      <ModalFooter>
        <HStack gap="3" justify="flex-end" w="full">
          <Button
            variant="secondary"
            onClick={() => {
              setIsCommentModalOpen(false);
              setTempComment("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddComment}
            disabled={isCommenting || !tempComment.trim()}
          >
            Add Comment
          </Button>
        </HStack>
      </ModalFooter>
    </Modal>

      {/* Document Viewer Modal */}
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