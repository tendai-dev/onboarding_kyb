'use client';

import {
  Box,
  VStack,
  HStack,
  Flex,
  SimpleGrid,
  Textarea,
  Progress,
  Spinner,
  Circle,
  Field,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiHome,
  FiCheckSquare,
  FiUsers,
  FiUserCheck,
  FiFolder,
  FiArrowRight,
  FiArrowLeft,
  FiEdit3,
  FiMessageSquare,
  FiDownload,
  FiEye,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import AdminSidebar from '../../../components/AdminSidebar';
import { useSidebar } from '../../../contexts/SidebarContext';
import { SweetAlert } from '../../../utils/sweetAlert';
import { fetchEntitySchema, EntitySchema } from '../../../lib/entitySchemaRenderer';
import { DynamicFieldRenderer } from '../../../components/DynamicFieldRenderer';
import { DocumentViewer } from '../../../components/DocumentViewer';
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
  Dropdown,
  // Icons
  DocumentIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  EditIcon,
  TickCircleIcon,
  WarningIcon,
  ProfileIcon,
  LocationIcon,
  CalendarIcon,
  MailIcon,
  PhoneIcon,
} from '@mukuru/mukuru-react-components';
import { logger } from '../../../lib/logger';
import { messagingApi } from '../../../lib/messagingApi';
import {
  formatCountryName,
  formatDate,
  formatDateShort,
  formatRelativeTime,
  formatEntityType,
  formatPhoneNumber,
  formatEmail,
  getStatusVariant,
} from '../../../utils/formatters';

// Application interface matching what the detail page expects
interface Application {
  id: string;
  legalName: string;
  entityType: string;
  country: string;
  status:
    | 'SUBMITTED'
    | 'IN PROGRESS'
    | 'RISK REVIEW'
    | 'COMPLETE'
    | 'INCOMPLETE'
    | 'DECLINED';
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

// Use motion.create() instead of deprecated motion()
const MotionBox = motion.create(Box);

export default function AdminApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;
  const { condensed } = useSidebar();
  const [currentStep, setCurrentStep] = useState(1);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Color values for light mode
  const bgColor = 'mukuru.background.light';
  const cardBg = 'white';
  const textColor = 'mukuru.text.primary';
  const borderColor = 'mukuru.grey.light';
  const mutedTextColor = 'mukuru.grey.mediumDark';
  const iconColor = '#64748B';
  const placeholderTextColor = 'mukuru.grey.medium';

  // Calculate sidebar width dynamically
  const sidebarWidth = condensed ? '72px' : '280px';

  // Admin-specific state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [adminComments, setAdminComments] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [commentsList, setCommentsList] = useState<Array<{
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  }>>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  // Risk assessment state removed - not currently used

  // Modal states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [tempStatusUpdate, setTempStatusUpdate] = useState('');
  const [tempComment, setTempComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Schema-driven state
  const [entitySchema, setEntitySchema] = useState<EntitySchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rawApplicationData, setRawApplicationData] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Document viewer state
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);

  // Backend data state for sidebar
  const [documentsCount, setDocumentsCount] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      action: string;
      performedBy: string;
      timestamp: string;
      details?: string;
    }>
  >([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);
  const [viewingDocumentName, setViewingDocumentName] = useState('');
  const [viewingDocumentType, setViewingDocumentType] = useState<string | undefined>(
    undefined
  );
  const [viewingDocumentSize, setViewingDocumentSize] = useState<number | undefined>(
    undefined
  );

  // Message notification state
  const [applicationUnreadMessages, setApplicationUnreadMessages] = useState(0);

  // Using SweetAlert2 for notifications instead of Chakra UI toaster to avoid initialization issues

  // Handler for document viewing from DynamicFieldRenderer
  const handleDocumentView = async (fileData: Record<string, unknown>) => {
    try {
      if (!fileData) {
        await SweetAlert.warning(
          'Document Not Found',
          'Document information is not available.'
        );
        return;
      }

      // Get case ID from application object (UUID) or fall back to URL params
      // The application.id contains the UUID which is what the documents API expects
      const caseId = application?.id || applicationId;
      if (!caseId) {
        await SweetAlert.warning('Application Not Found', 'Cannot find application ID.');
        return;
      }

      // Fetch documents for this case
      logger.debug('Fetching documents for case', { caseId });
      const response = await fetch(`/api/proxy/api/v1/documents/case/${caseId}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          new Error(`Failed to fetch documents: ${response.status}`),
          'Failed to fetch documents',
          {
            tags: { error_type: 'documents_fetch_error' },
            extra: { status: response.status, errorText },
          }
        );
        throw new Error(
          `Failed to fetch documents: ${response.status} ${response.statusText}`
        );
      }

      const documents = await response.json();
      logger.debug('Documents received', { count: documents?.length || 0 });

      if (!Array.isArray(documents)) {
        logger.error(
          new Error('Documents response is not an array'),
          'Invalid documents response',
          {
            tags: { error_type: 'documents_format_error' },
            extra: { documents },
          }
        );
        await SweetAlert.warning(
          'Invalid Response',
          'The server returned an invalid response. Please try again.'
        );
        return;
      }

      if (documents.length === 0) {
        logger.warn('No documents found for case', {
          tags: { warning_type: 'no_documents' },
          extra: { caseId },
        });
        // Try to find documents by searching all documents
        // This handles cases where documents might have been uploaded but caseId wasn't properly set
        const allDocsResponse = await fetch(
          `/api/proxy/api/v1/documents?skip=0&take=1000`
        );
        if (allDocsResponse.ok) {
          const allDocs = await allDocsResponse.json();
          const allDocumentsList = allDocs.items || [];

          logger.debug('Found total documents in system', {
            count: allDocumentsList.length,
          });

          // First, try to match by caseId (case-insensitive, string comparison)
          let matchingDocs = allDocumentsList.filter((d: Record<string, unknown>) => {
            const docCaseId = String(d.caseId || '').toLowerCase();
            const searchCaseId = String(caseId || '').toLowerCase();
            return docCaseId === searchCaseId || d.caseId === caseId;
          });

          logger.debug('Found documents by caseId match', { count: matchingDocs.length });

          // If no caseId match and we have a filename, try to find by filename
          if (matchingDocs.length === 0 && fileData?.fileName) {
            const searchFileName = String(fileData.fileName).toLowerCase();
            // Handle truncated filenames (e.g., "logo_highres_transparent.pn" should match "logo_highres_transparent.png")
            const searchBase = searchFileName.substring(
              0,
              searchFileName.lastIndexOf('.')
            );

            matchingDocs = allDocumentsList.filter((d: Record<string, unknown>) => {
              const dFileName = (d.fileName ? String(d.fileName) : '').toLowerCase();
              const dBase = dFileName.substring(0, dFileName.lastIndexOf('.'));

              // Exact match
              if (dFileName === searchFileName) return true;

              // Partial match (filename contains search term or vice versa)
              if (
                dFileName.includes(searchFileName) ||
                searchFileName.includes(dFileName)
              )
                return true;

              // Base name match (handles truncated extensions like .pn → .png)
              if (
                searchBase &&
                dBase &&
                (dBase === searchBase ||
                  dBase.includes(searchBase) ||
                  searchBase.includes(dBase))
              )
                return true;

              // Match by key words in filename (e.g., "logo" should match files with "logo" in name)
              const searchWords = searchBase
                .split(/[._-]/)
                .filter((w: string) => w.length > 2);
              const docWords = dBase.split(/[._-]/).filter((w: string) => w.length > 2);
              if (searchWords.some((word: string) => docWords.includes(word)))
                return true;

              return false;
            });

            logger.debug('Found documents by filename', {
              count: matchingDocs.length,
              fileName: fileData.fileName ? String(fileData.fileName) : undefined,
            });
          }

          // If still no matches and there's only 1 document in the system, use it (last resort)
          if (matchingDocs.length === 0 && allDocumentsList.length === 1) {
            logger.debug('Only 1 document in system, using it as fallback');
            matchingDocs = allDocumentsList;
          }

          // If still no matches but we have documents, try to match by any image/document file
          if (
            matchingDocs.length === 0 &&
            allDocumentsList.length > 0 &&
            fileData?.fileName
          ) {
            // Check if the fileData suggests it's an image/document
            const isImage = /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(
              String(fileData.fileName)
            );
            if (isImage) {
              // Find any image file
              matchingDocs = allDocumentsList.filter((d: Record<string, unknown>) => {
                const dFileName = (d.fileName ? String(d.fileName) : '').toLowerCase();
                return /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(dFileName);
              });
              logger.debug('Found image documents as fallback', {
                count: matchingDocs.length,
              });
            }
          }

          if (matchingDocs.length > 0) {
            // Use the matching documents (even if caseId doesn't match)
            documents.push(...matchingDocs);
            logger.debug('Using fallback documents (caseId may not match)', {
              documents: documents.map((d: Record<string, unknown>) => ({
                fileName: d.fileName,
                caseId: d.caseId,
                searchingFor: caseId,
              })),
            });
          } else {
            // Show all available documents for debugging
            logger.debug('All documents in system', {
              documents: allDocumentsList.map((d: Record<string, unknown>) => ({
                fileName: d.fileName,
                caseId: d.caseId,
              })),
              searchingFor: caseId,
              fileData: fileData?.fileName ? String(fileData.fileName) : undefined,
            });

            // Provide more helpful message based on the situation
            let message = `No documents found for application ${caseId}.\n\n`;

            if (allDocumentsList.length === 0) {
              message += `The document database is empty. `;
              if (fileData?.fileName) {
                message += `\n\nThe application metadata references a file "${String(fileData.fileName)}", `;
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

            await SweetAlert.warning('No Documents Found', message);
            return;
          }
        } else {
          await SweetAlert.warning(
            'No Documents',
            `No documents found for this application (ID: ${caseId}).\n\nPlease check if documents have been uploaded.`
          );
          return;
        }
      }

      // More flexible document matching
      const fileName =
        (fileData.fileName ? String(fileData.fileName) : '') ||
        (typeof fileData === 'string' ? fileData : '');
      const requirementCode = fileData.requirementCode
        ? String(fileData.requirementCode)
        : undefined;

      // Try multiple matching strategies
      let doc = documents.find((d: Record<string, unknown>) => {
        // Handle both snake_case (file_name) and camelCase (fileName) from backend
        const dFileName = (d.file_name || d.fileName ? String(d.file_name || d.fileName) : '').toLowerCase();
        const searchFileName = (fileName || '').toLowerCase();

        // Exact match
        if (d.file_name === fileName || d.fileName === fileName || dFileName === searchFileName) return true;

        // Partial match (filename contains search term or vice versa)
        if (dFileName.includes(searchFileName) || searchFileName.includes(dFileName))
          return true;

        // Match by requirement code
        if (
          requirementCode &&
          (d.documentNumber === requirementCode ||
            (d.documentNumber
              ? String(d.documentNumber).includes(requirementCode)
              : false))
        )
          return true;

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
        const fileNameParts = (fileName || '').toLowerCase().split(/[._-]/);
        doc = documents.find((d: Record<string, unknown>) => {
          const dFileName = (d.fileName ? String(d.fileName) : '').toLowerCase();
          return fileNameParts.some(
            (part: string) => part.length > 3 && dFileName.includes(part)
          );
        });
      }

      // If still not found, just use the first document (fallback)
      if (!doc && documents.length > 0) {
        doc = documents[0];
      }

      // Handle both snake_case (storage_key) and camelCase (storageKey) from backend
      const docStorageKey = doc.storage_key || doc.storageKey;
      if (!doc || !docStorageKey) {
        await SweetAlert.warning(
          'Document Not Found',
          `Could not find document "${fileName}" in the system. Found ${documents.length} document(s) for this application.`
        );
        return;
      }

      // Get download URL - try multiple methods
      let downloadUrl: string | null = null;

      // Method 1: Use the direct download endpoint with storage key
      // Backend endpoint: GET /api/v1/documents/direct?key={storageKey}
      if (docStorageKey) {
        // Use our proxy-document endpoint which handles the direct download
        downloadUrl = `/api/proxy-document?storageKey=${encodeURIComponent(String(docStorageKey))}`;
        logger.debug('Using direct download with storage key', { downloadUrl });
      }

      // Method 2: Try POST to download-url endpoint to get presigned URL
      if (!downloadUrl && docStorageKey) {
        try {
          const downloadResponse = await fetch(
            `/api/proxy/api/v1/documents/download-url`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ storageKey: docStorageKey }),
            }
          );
          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json();
            logger.debug('Presigned URL response received');

            // Try all possible field names for the URL
            const presignedUrl =
              downloadData.downloadUrl ||
              downloadData.DownloadUrl ||
              downloadData.url ||
              downloadData.presignedUrl ||
              downloadData.presignedDownloadUrl ||
              (typeof downloadData === 'string' ? downloadData : null) ||
              null;

            if (presignedUrl) {
              // Proxy through our API to avoid CORS issues
              downloadUrl = `/api/proxy-document?url=${encodeURIComponent(presignedUrl)}`;
              logger.debug('Using presigned URL via proxy', { downloadUrl });
            }
          } else {
            const errorText = await downloadResponse.text();
            logger.warn('Presigned URL request failed', {
              tags: { warning_type: 'presigned_url_failed' },
              extra: { status: downloadResponse.status, errorText },
            });
          }
        } catch (err) {
          logger.warn('Failed to get presigned URL', {
            tags: { warning_type: 'presigned_url_error' },
            extra: { error: err },
          });
        }
      }

      // Method 3: Fallback - try document ID based endpoint
      if (!downloadUrl && doc.id) {
        try {
          const downloadResponse = await fetch(
            `/api/proxy/api/v1/documents/download-url`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ documentId: doc.id }),
            }
          );
          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json();
            const presignedUrl =
              downloadData.downloadUrl ||
              downloadData.DownloadUrl ||
              downloadData.url ||
              downloadData.presignedUrl ||
              null;

            if (presignedUrl) {
              downloadUrl = `/api/proxy-document?url=${encodeURIComponent(presignedUrl)}`;
            } else if (docStorageKey) {
              downloadUrl = `/api/proxy-document?storageKey=${encodeURIComponent(String(docStorageKey))}`;
            }

            logger.debug('Download URL from document ID', { downloadUrl });
          }
        } catch (err) {
          logger.warn('Failed to get download URL from document ID', {
            tags: { warning_type: 'document_id_download_failed' },
            extra: { error: err },
          });
        }
      }

      if (!downloadUrl) {
        logger.error(
          new Error('All download URL methods failed'),
          'Failed to get download URL',
          {
            tags: { error_type: 'all_download_methods_failed' },
            extra: { document: doc },
          }
        );
        throw new Error(
          `Failed to get download URL for document. StorageKey: ${docStorageKey}, DocumentId: ${doc.id}`
        );
      }

      // Open viewer - handle both snake_case and camelCase field names
      const docFileName = doc.file_name || doc.fileName || fileName;
      const docType = doc.type ? String(doc.type) : undefined;
      const docSize = doc.size_bytes || doc.sizeBytes || fileData.fileSize;
      setViewingDocumentName(docFileName);
      setViewingDocumentType(docType);
      setViewingDocumentSize(docSize);
      setViewingDocumentUrl(downloadUrl);
      setDocumentViewerOpen(true);
    } catch (err) {
      logger.error(err, 'Error viewing document', {
        tags: { error_type: 'document_view_error' },
      });
      await SweetAlert.error(
        'View Failed',
        err instanceof Error ? err.message : 'Failed to view document. Please try again.'
      );
    }
  };

  const loadApplication = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate applicationId - check for undefined, null, or empty string
      if (
        !applicationId ||
        applicationId.trim() === '' ||
        applicationId === 'undefined' ||
        applicationId === 'null'
      ) {
        logger.warn('Invalid application ID in URL, redirecting to applications list', {
          extra: { applicationId },
        });
        router.replace('/applications');
        return;
      }

      // Fetch full application details from the API route
      const response = await fetch(`/api/applications/${applicationId}`);

      if (!response.ok) {
        // Try to extract error details from response
        let errorMessage = 'Failed to load application';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch {
          // If JSON parsing fails, use status text
          errorMessage =
            response.status === 404
              ? 'Application not found'
              : `Failed to fetch application (${response.status} ${response.statusText})`;
        }
        setError(errorMessage);
        logger.error(new Error(errorMessage), 'Failed to load application', {
          tags: { error_type: 'application_load_error' },
          extra: {
            status: response.status,
            statusText: response.statusText,
            applicationId,
          },
        });
        setLoading(false);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        setError('Invalid response from server. Please try again.');
        logger.error(parseError, 'Failed to parse application response', {
          tags: { error_type: 'json_parse_error' },
          extra: { applicationId },
        });
        setLoading(false);
        return;
      }

      // Store raw application data for schema mapping
      setRawApplicationData(data);

      // Validate that we received valid data
      if (!data || typeof data !== 'object') {
        setError('Invalid application data received from server');
        logger.error(new Error('Invalid data structure'), 'Invalid application data', {
          tags: { error_type: 'invalid_data_structure' },
          extra: { applicationId, dataType: typeof data },
        });
        setLoading(false);
        return;
      }

      // Map backend data to the expected Application format
      const projection = data;
      let metadata: Record<string, unknown> = {};
      try {
        // Backend returns metadata_json (snake_case), try both formats
        const metadataRaw = projection.metadataJson || projection.metadata_json;
        metadata = metadataRaw
          ? typeof metadataRaw === 'string'
            ? JSON.parse(metadataRaw)
            : metadataRaw
          : {};
      } catch (parseError) {
        logger.warn('Failed to parse metadata_json, using empty object', {
          tags: { warning_type: 'metadata_parse_error' },
          extra: { applicationId },
        });
        metadata = {};
      }

      // Get entity type code directly from metadata (this is what was used when creating the application)
      // Clean up the value - handle cases where it might be duplicated or have extra formatting
      let entityTypeCode = (metadata.entity_type_code ||
        metadata.entityTypeCode ||
        null) as string | null;

      if (entityTypeCode) {
        // Ensure it's a string and trim whitespace
        entityTypeCode = String(entityTypeCode).trim();
        // If it's a string with commas (duplicated values), take the first one
        if (entityTypeCode.includes(',')) {
          entityTypeCode = entityTypeCode.split(',')[0].trim();
        }
        // If it's a string with spaces (duplicated values like "TEST_ENTITY TEST_ENTITY"), take the first one
        if (entityTypeCode.includes(' ')) {
          entityTypeCode = entityTypeCode.split(' ')[0].trim();
        }
        // If it's empty after cleaning, set to null
        if (entityTypeCode === '') {
          entityTypeCode = null;
        }
      }

      logger.debug('[Application Loader] Entity type code from metadata', {
        raw: metadata.entity_type_code || metadata.entityTypeCode,
        cleaned: entityTypeCode,
      });

      // Map status from backend to frontend
      // Handle both PascalCase (from domain) and UPPERCASE (from projections)
      const statusMap: Record<string, Application['status']> = {
        Draft: 'IN PROGRESS',
        DRAFT: 'IN PROGRESS',
        InProgress: 'IN PROGRESS',
        IN_PROGRESS: 'IN PROGRESS',
        'IN PROGRESS': 'IN PROGRESS',
        PendingReview: 'RISK REVIEW',
        PENDING_REVIEW: 'RISK REVIEW',
        'RISK REVIEW': 'RISK REVIEW',
        Submitted: 'SUBMITTED',
        SUBMITTED: 'SUBMITTED',
        Approved: 'COMPLETE',
        APPROVED: 'COMPLETE',
        Complete: 'COMPLETE',
        COMPLETE: 'COMPLETE',
        Rejected: 'DECLINED',
        REJECTED: 'DECLINED',
        Declined: 'DECLINED',
        DECLINED: 'DECLINED',
        Cancelled: 'DECLINED',
        CANCELLED: 'DECLINED',
      };

      // Backend returns snake_case, handle both snake_case and camelCase field names
      const legalName =
        projection.business_legal_name ||
        projection.businessLegalName ||
        (metadata.registered_legal_name as string) ||
        `${projection.applicant_first_name || projection.applicantFirstName || ''} ${projection.applicant_last_name || projection.applicantLastName || ''}`.trim() ||
        'Unknown';

      // Entity type should come from metadata, not the case type
      const entityTypeDisplay =
        (metadata.entity_type_display_name as string) ||
        (metadata.entitytype as string) ||
        entityTypeCode ||
        projection.type ||
        'Unknown';

      const country =
        projection.business_country_of_registration ||
        projection.businessCountryOfRegistration ||
        projection.applicant_country ||
        projection.applicantCountry ||
        'Unknown';

      const mappedApp: Application = {
        // Use projection.id (GUID) for API calls, not projection.caseId (case number string)
        id: projection.id,
        legalName: legalName.trim() || 'Unknown',
        entityType: entityTypeDisplay,
        country: country || 'Unknown',
        status: statusMap[projection.status] || 'IN PROGRESS',
        created: projection.created_at || projection.createdAt || new Date().toISOString(),
        updated: projection.updated_at || projection.updatedAt || projection.created_at || projection.createdAt || new Date().toISOString(),
        submittedBy: projection.applicant_email || projection.applicantEmail || 'Unknown',
        riskScore: projection.risk_score || projection.riskScore || 0,
        documents: [], // Documents would need to be fetched separately
        businessInfo: {
          registrationNumber:
            projection.business_registration_number ||
            projection.businessRegistrationNumber ||
            (metadata.registrationNumber as string) ||
            '',
          taxId: projection.business_tax_id || projection.businessTaxId || (metadata.taxNumber as string) || '',
          businessAddress:
            projection.business_address || projection.businessAddress || (metadata.businessAddress as string) || '',
          industry: projection.business_industry || projection.businessIndustry || (metadata.industry as string) || '',
          employees: projection.business_number_of_employees || projection.businessNumberOfEmployees || 0,
          annualRevenue: projection.business_annual_revenue || projection.businessAnnualRevenue || 0,
        },
        contactInfo: {
          primaryContact:
            `${projection.applicant_first_name || projection.applicantFirstName || ''} ${projection.applicant_last_name || projection.applicantLastName || ''}`.trim(),
          email: projection.applicant_email || projection.applicantEmail || '',
          phone: projection.applicant_phone || projection.applicantPhone || '',
          address: projection.applicant_address || projection.applicantAddress || '',
        },
      };

      setApplication(mappedApp);
      setStatusUpdate(mappedApp.status);
      setTempStatusUpdate(mappedApp.status);

      // Fetch entity schema using the EXACT entity_type_code from metadata (no normalization)
      // Enable wizard configuration support
      if (entityTypeCode) {
        logger.debug(
          '[Application Loader] Using entity_type_code from application metadata',
          { entityTypeCode }
        );
        // Load entity schema - but don't fail the whole page if it fails
        try {
          await loadEntitySchema(entityTypeCode, data, true); // Enable wizard configuration
        } catch (schemaError) {
          // Schema loading is optional - log as warning, not error
          logger.warn(`[Application Loader] Could not load entity schema for ${entityTypeCode}: ${schemaError instanceof Error ? schemaError.message : 'Unknown error'}`);
        }
      } else {
        // Entity type code is optional - some applications may not have it
        // This is not an error, just means we can't load the entity schema
        logger.debug(
          '[Application Loader] No entity_type_code in metadata - schema loading skipped',
          { availableKeys: Object.keys(metadata) }
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load application. Please check your connection and try again.';
      setError(errorMessage);
      logger.error(err, 'Error loading application', {
        tags: { error_type: 'application_load_error' },
        extra: {
          applicationId,
          errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  // Fetch documents count for this application
  const loadDocumentsCount = useCallback(async () => {
    if (!applicationId) return;
    try {
      const response = await fetch(`/api/proxy/api/v1/documents/case/${applicationId}`);
      if (response.ok) {
        const documents = await response.json();
        if (Array.isArray(documents)) {
          setDocumentsCount(documents.length);
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch documents count', {
        tags: { warning_type: 'documents_count_error' },
        extra: { error: err },
      });
    }
  }, [applicationId]);

  // Fetch unread messages count for this application
  const loadApplicationMessages = useCallback(async () => {
    if (!applicationId) return;
    try {
      const thread = await messagingApi.getThreadByApplication(applicationId);
      if (thread && thread.unreadCount !== undefined) {
        setApplicationUnreadMessages(thread.unreadCount);
      }
    } catch (err) {
      // Silently ignore - thread may not exist for this application
      setApplicationUnreadMessages(0);
    }
  }, [applicationId]);

  // Fetch audit logs for this application
  const loadAuditLogs = useCallback(async () => {
    if (!applicationId) return;
    setLoadingAuditLogs(true);
    try {
      const response = await fetch(`/api/audit-logs/case/${applicationId}?take=10`);
      if (response.ok) {
        const data = await response.json();
        const logs = data.items || data || [];
        if (Array.isArray(logs)) {
          setAuditLogs(
            logs.map((log: Record<string, unknown>) => ({
              id: String(log.id || log.auditLogId || ''),
              action: String(log.action || log.eventType || log.actionType || 'Activity'),
              performedBy: String(
                log.performedBy || log.userId || log.userName || 'System'
              ),
              timestamp: String(log.timestamp || log.createdAt || log.occurredAt || ''),
              details: log.details ? String(log.details) : undefined,
            }))
          );
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch audit logs', {
        tags: { warning_type: 'audit_logs_error' },
        extra: { error: err },
      });
    } finally {
      setLoadingAuditLogs(false);
    }
  }, [applicationId]);

  // Fetch comments for this application
  const loadComments = useCallback(async () => {
    if (!applicationId) return;
    setCommentsLoading(true);
    try {
      // First get the work item ID for this application
      const workItemResponse = await fetch(`/api/workqueue/by-application/${applicationId}`);
      if (!workItemResponse.ok) {
        if (workItemResponse.status === 404) {
          // No work item yet - this is normal for draft applications
          setCommentsList([]);
          setCommentsLoading(false);
          return;
        }
        const errorText = await workItemResponse.text().catch(() => 'Unknown error');
        logger.error(new Error(`Failed to find work item: ${workItemResponse.status} - ${errorText}`), 'Error fetching work item for comments', {
          tags: { error_type: 'work_item_fetch_error' },
          extra: { applicationId, status: workItemResponse.status },
        });
        setCommentsList([]);
        setCommentsLoading(false);
        return;
      }
      
      const workItemData = await workItemResponse.json();
      // Backend returns snake_case, handle both formats
      const workItemId = workItemData.id || workItemData.workItemId || workItemData.work_item_id;
      
      if (!workItemId) {
        logger.warn('Work item ID not found in response', {
          tags: { warning_type: 'work_item_id_missing' },
          extra: { applicationId, workItemData },
        });
        setCommentsList([]);
        setCommentsLoading(false);
        return;
      }

      // Fetch comments using work item ID
      const response = await fetch(`/api/workqueue/${workItemId}/comments`);
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error(new Error(`Failed to fetch comments: ${response.status} - ${errorText}`), 'Error fetching comments', {
          tags: { error_type: 'comments_fetch_error' },
          extra: { workItemId, status: response.status },
        });
        setCommentsList([]);
        setCommentsLoading(false);
        return;
      }

      const data = await response.json();
      const comments = Array.isArray(data) ? data : (data.comments || data.items || []);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Comments] Fetched comments:', { count: comments.length, comments, rawData: data });
      }

      const mappedComments = comments
        .filter((c: Record<string, unknown>) => {
          // Filter out comments without text
          const text = String(c.text || c.content || c.message || '').trim();
          return text.length > 0;
        })
        .map((c: Record<string, unknown>) => {
          // Handle date parsing - backend returns DateTime which serializes to ISO string
          // Backend uses snake_case (created_at), so handle both snake_case and camelCase
          let createdAt = '';
          const rawCreatedAt = c.createdAt || c.created_at;
          if (rawCreatedAt) {
            try {
              const date = new Date(String(rawCreatedAt));
              if (!isNaN(date.getTime())) {
                createdAt = date.toISOString();
              } else {
                createdAt = String(rawCreatedAt);
              }
            } catch {
              createdAt = String(rawCreatedAt);
            }
          }

          // Backend returns snake_case (author_id, author_name), handle both formats
          return {
            id: String(c.id || c.commentId || c.comment_id || `${c.authorId || c.author_id}-${rawCreatedAt}` || `comment-${Date.now()}-${Math.random()}`),
            text: String(c.text || c.content || c.message || '').trim(),
            authorId: String(c.authorId || c.author_id || c.userId || c.user_id || ''),
            authorName: String(c.authorName || c.author_name || c.userName || c.user_name || c.author || 'Unknown'),
            createdAt: createdAt || String(c.timestamp || c.created || ''),
          };
        })
        // Sort by date descending (newest first) as a fallback (backend should already do this)
        .sort((a: { createdAt: string }, b: { createdAt: string }) => {
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      setCommentsList(mappedComments);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Comments] Mapped and sorted comments:', mappedComments);
      }
    } catch (err) {
      logger.error(err instanceof Error ? err : new Error('Unknown error'), 'Failed to fetch comments', {
        tags: { error_type: 'comments_error' },
        extra: { applicationId, error: err },
      });
      setCommentsList([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [applicationId]);

  // Load sidebar data when application is loaded
  useEffect(() => {
    if (application) {
      loadDocumentsCount();
      loadAuditLogs();
      loadComments();
      loadApplicationMessages();
    }
  }, [application, loadDocumentsCount, loadAuditLogs, loadComments, loadApplicationMessages]);

  // Also load comments when applicationId changes (in case application object doesn't trigger)
  useEffect(() => {
    if (applicationId) {
      loadComments();
    }
  }, [applicationId, loadComments]);

  const loadEntitySchema = async (
    entityTypeCode: string,
    applicationData: Record<string, unknown>,
    useWizardConfiguration: boolean = true
  ) => {
    try {
      setSchemaLoading(true);

      // Use the entity type code DIRECTLY from the application metadata - no normalization needed
      // This is the exact code that was used when the application was created
      logger.debug('[Schema Loader] Using entity type code directly from application', {
        entityTypeCode,
        useWizardConfiguration,
      });

      if (!entityTypeCode || entityTypeCode.trim() === '') {
        logger.error(
          new Error('Entity type code is empty or invalid'),
          '[Schema Loader] Invalid entity type code',
          {
            tags: { error_type: 'invalid_entity_type_code' },
          }
        );
        return;
      }

      const schema = await fetchEntitySchema(
        entityTypeCode.trim(),
        applicationData,
        useWizardConfiguration
      );

      if (schema) {
        logger.debug('[Schema Loader] Successfully loaded entity schema', {
          sectionsCount: schema.sections.length,
          sections: schema.sections.map((section, idx) => ({
            index: idx + 1,
            title: section.title,
            fieldsCount: section.fields.length,
          })),
        });
        setEntitySchema(schema);
      } else {
        logger.error(
          new Error(`No entity schema found for: ${entityTypeCode}`),
          '[Schema Loader] Missing entity schema',
          {
            tags: { error_type: 'missing_entity_schema' },
            extra: { entityTypeCode },
          }
        );
      }
    } catch (err) {
      logger.error(err, '[Schema Loader] Error loading entity schema', {
        tags: { error_type: 'schema_load_error' },
        extra: { stack: err instanceof Error ? err.stack : 'No stack trace' },
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

      // Refresh audit logs to show the status change
      await loadAuditLogs();

      // Close modal and show success
      setIsStatusModalOpen(false);
      setTempStatusUpdate('');
      setTempComment('');

      // Send email notification to partner (non-blocking)
      try {
        const { sendStatusUpdateEmail, sendApprovalEmail, sendRejectionEmail } = await import('../../../lib/notificationService');
        
        // Get recipient email from application
        const recipientEmail = application.contactInfo?.email;
        const recipientName = application.contactInfo?.primaryContact || application.legalName || 'Valued Partner';
        const caseNumber = application.id;
        const applicationName = application.legalName;

        // Get admin name from session
        let adminName: string | undefined;
        try {
          const sessionResponse = await fetch('/api/auth/session');
          if (sessionResponse.ok) {
            const session = await sessionResponse.json();
            adminName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Support Team';
          }
        } catch (error) {
          console.warn('Failed to get admin name:', error);
        }

        if (recipientEmail) {
          // Send appropriate email based on status
          if (tempStatusUpdate === 'APPROVED' || tempStatusUpdate === 'COMPLETE') {
            sendApprovalEmail({
              to: recipientEmail,
              recipientName: recipientName,
              caseId: application.id,
              caseNumber: caseNumber,
              message: tempComment || undefined,
              adminName: adminName,
              link: `https://partner.mukuru.com/dashboard`,
            }).catch((error) => {
              console.warn('Failed to send approval email:', error);
            });
          } else if (tempStatusUpdate === 'DECLINED' || tempStatusUpdate === 'REJECTED') {
            sendRejectionEmail({
              to: recipientEmail,
              recipientName: recipientName,
              caseId: application.id,
              caseNumber: caseNumber,
              reason: tempComment || undefined,
              adminName: adminName,
              link: `https://partner.mukuru.com/dashboard`,
            }).catch((error) => {
              console.warn('Failed to send rejection email:', error);
            });
          } else {
            // Send status update email for other status changes
            sendStatusUpdateEmail({
              to: recipientEmail,
              recipientName: recipientName,
              caseId: application.id,
              caseNumber: caseNumber,
              status: tempStatusUpdate,
              message: tempComment || `Your application status has been updated to ${tempStatusUpdate}.`,
              adminName: adminName,
              link: `https://partner.mukuru.com/dashboard`,
            }).catch((error) => {
              console.warn('Failed to send status update email:', error);
            });
          }
        }
      } catch (error) {
        // Log error but don't block user flow
        console.warn('Error sending status update email:', error);
      }

      await SweetAlert.success(
        'Status Updated',
        `Application status has been updated to ${tempStatusUpdate}`
      );
    } catch (err) {
      logger.error(err, 'Error updating status', {
        tags: { error_type: 'status_update_error' },
      });
      await SweetAlert.error(
        'Update Failed',
        err instanceof Error ? err.message : 'Failed to update status'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!tempComment.trim() || !application) return;

    setIsCommenting(true);
    try {
      // First, get the work item ID for this application/case
      // The work queue API requires work item ID, not case/application ID
      const workItemResponse = await fetch(`/api/workqueue/by-application/${application.id}`);
      
      if (!workItemResponse.ok) {
        if (workItemResponse.status === 404) {
          throw new Error('No work item found for this application. The application may not have been submitted yet.');
        }
        throw new Error(`Failed to find work item: ${workItemResponse.status}`);
      }
      
      const workItemData = await workItemResponse.json();
      // Backend returns snake_case, handle both formats
      const workItemId = workItemData.id || workItemData.workItemId || workItemData.work_item_id;
      
      if (!workItemId) {
        throw new Error('Work item ID not found in response');
      }

      // Now add the comment using the work item ID
      const response = await fetch(`/api/workqueue/${workItemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tempComment }),
      });

      if (response.ok) {
        const responseData = await response.json().catch(() => ({}));
        
        // Update local comments
        setAdminComments(tempComment);

        // Close modal and clear input immediately for better UX
        setIsCommentModalOpen(false);
        const commentText = tempComment;
        setTempComment('');

        // Small delay to ensure backend has processed the comment
        await new Promise(resolve => setTimeout(resolve, 500));

        // Refresh comments list and audit logs
        await loadComments();
        await loadAuditLogs();

        await SweetAlert.success(
          'Comment Added',
          'Your comment has been added successfully'
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Failed to add comment: ${response.status}`;
        logger.error(new Error(errorMessage), 'Failed to add comment - API error', {
          tags: { error_type: 'comment_add_api_error' },
          extra: { workItemId, status: response.status, errorData },
        });
        throw new Error(errorMessage);
      }
    } catch (err) {
      logger.error(err, 'Error adding comment', {
        tags: { error_type: 'comment_add_error' },
      });
      await SweetAlert.error(
        'Comment Failed',
        err instanceof Error ? err.message : 'Failed to add comment'
      );
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

      await SweetAlert.success('Export Successful', 'Application data has been exported');
    } catch (err) {
      logger.error(err, 'Error exporting data', {
        tags: { error_type: 'data_export_error' },
      });
      await SweetAlert.error(
        'Export Failed',
        err instanceof Error ? err.message : 'Failed to export data'
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Generate steps dynamically from entity schema

  // Generate steps from entity schema sections
  const generateStepsFromSchema = (schema: EntitySchema | null) => {
    if (!schema || !schema.sections || schema.sections.length === 0) {
      // Fallback to default steps if no schema
      return [
        {
          id: 1,
          title: 'Overview',
          subtitle: 'Application summary',
          icon: FiFileText,
          active: true,
        },
      ];
    }

    // Create steps from schema sections, sorted by displayOrder
    const sortedSections = [...schema.sections].sort((a, b) => a.order - b.order);

    return sortedSections.map((section, index) => {
      // Determine icon based on section title or requirement type
      let icon = FiFileText;
      const sectionTitleUpper = section.title.toUpperCase();

      if (
        sectionTitleUpper.includes('OVERVIEW') ||
        sectionTitleUpper.includes('INFORMATION')
      ) {
        icon = FiFileText;
      } else if (sectionTitleUpper.includes('DOCUMENT')) {
        icon = FiFolder;
      } else if (
        sectionTitleUpper.includes('OWNERSHIP') ||
        sectionTitleUpper.includes('SHAREHOLDER')
      ) {
        icon = FiUsers;
      } else if (
        sectionTitleUpper.includes('DIRECTOR') ||
        sectionTitleUpper.includes('BOARD')
      ) {
        icon = FiUserCheck;
      } else if (
        sectionTitleUpper.includes('IDENTITY') ||
        sectionTitleUpper.includes('PROOF')
      ) {
        icon = FiUserCheck;
      } else if (sectionTitleUpper.includes('ADDRESS')) {
        icon = FiHome;
      } else if (
        sectionTitleUpper.includes('SIGNATORY') ||
        sectionTitleUpper.includes('AUTHORIZED')
      ) {
        icon = FiUsers;
      }

      return {
        id: index + 1,
        title: section.title,
        subtitle: section.description || `${section.title} details`,
        icon: icon,
        active: true,
        sectionId: section.id,
        sectionOrder: section.order,
      };
    });
  };

  // Generate steps dynamically from schema
  const adminSteps = generateStepsFromSchema(entitySchema);

  // Use the formatter utility for consistent status variant mapping
  const getStatusVariantForTag = (status: string) => {
    return getStatusVariant(status);
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
        <AdminSidebar />
        <Box
          ml={sidebarWidth}
          minH="100vh"
          bg="mukuru.background.light"
          transition="margin-left 0.3s ease"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack gap="24px">
            <Box
              p="20px"
              borderRadius="20px"
              bg="white"
              boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Spinner size="lg" color="mukuru.buttons.primary" />
            </Box>
            <VStack gap="8px" align="center">
              <Typography color="mukuru.text.primary" fontSize="18px" fontWeight="700">
                Loading Application
              </Typography>
              <Typography
                color="mukuru.grey.medium"
                fontSize="14px"
                fontWeight="500"
                textAlign="center"
              >
                Please wait while we fetch the application details...
              </Typography>
            </VStack>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (error || !application) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
        <AdminSidebar />
        <Box
          ml={sidebarWidth}
          minH="100vh"
          bg="mukuru.background.light"
          transition="margin-left 0.3s ease"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            bg="white"
            borderRadius="20px"
            p="40px"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
            maxW="480px"
            textAlign="center"
          >
            <VStack gap="24px">
              <Box p="16px" borderRadius="full" bg="#FEE2E2">
                <WarningIcon width="32" height="32" color="#DC2626" />
              </Box>
              <VStack gap="8px">
                <Typography fontSize="20px" fontWeight="700" color="mukuru.text.primary">
                  {error ? 'Error Loading Application' : 'Application Not Found'}
                </Typography>
                <Typography fontSize="14px" color="mukuru.grey.medium" textAlign="center">
                  {error || 'The application you are looking for could not be found.'}
                </Typography>
              </VStack>
              <Link href="/work-queue">
                <Button variant="secondary" size="sm">
                  <IconWrapper>
                    <ArrowLeftIcon width="16" height="16" />
                  </IconWrapper>
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
    <Box minH="100vh" bg="mukuru.background.light">
      <AdminSidebar />

      {/* Main Content */}
      <Box
        ml={sidebarWidth}
        bg="mukuru.background.light"
        transition="margin-left 0.3s ease"
        minH="100vh"
      >
        {/* Page Header */}
        <Box
          bg="white"
          borderBottom="1px solid"
          borderColor="mukuru.grey.light"
          position="sticky"
          top="0"
          zIndex="10"
        >
          {/* Breadcrumb Row */}
          <Box
            px="32px"
            py="12px"
            borderBottom="1px solid"
            borderColor="mukuru.grey.light"
            bg="#FAFBFC"
          >
            <HStack gap="8px" align="center">
              <Link href="/work-queue">
                <Typography
                  fontSize="13px"
                  color="mukuru.grey.medium"
                  _hover={{ color: 'mukuru.buttons.primary' }}
                  cursor="pointer"
                >
                  Work Queue
                </Typography>
              </Link>
              <Typography fontSize="13px" color="mukuru.grey.medium">
                /
              </Typography>
              <Link href="/applications">
                <Typography
                  fontSize="13px"
                  color="mukuru.grey.medium"
                  _hover={{ color: 'mukuru.buttons.primary' }}
                  cursor="pointer"
                >
                  Applications
                </Typography>
              </Link>
              <Typography fontSize="13px" color="mukuru.grey.medium">
                /
              </Typography>
              <Typography fontSize="13px" color="mukuru.text.primary" fontWeight="500">
                {application.legalName}
              </Typography>
            </HStack>
          </Box>

          {/* Top Header Row */}
          <Flex
            justify="space-between"
            align="center"
            px="32px"
            py="16px"
            borderBottom="1px solid"
            borderColor="mukuru.grey.light"
          >
            <HStack gap="16px" align="center">
              <Box
                p="12px"
                borderRadius="12px"
                bg="mukuru.buttons.primary"
                boxShadow="0 4px 12px rgba(240, 84, 35, 0.25)"
              >
                <FiFileText size={22} color="white" />
              </Box>
              <VStack align="start" gap="2px">
                <HStack gap="12px" align="center">
                  <Typography
                    fontSize="20px"
                    fontWeight="700"
                    color="mukuru.text.primary"
                  >
                    {application.legalName}
                  </Typography>
                  {(() => {
                    const statusValue = application.status.toUpperCase();
                    const getInlineStatusStyles = () => {
                      switch (statusValue) {
                        case 'SUBMITTED':
                          return {
                            bg: '#DBEAFE',
                            color: '#1D4ED8',
                            borderColor: '#93C5FD',
                          };
                        case 'IN PROGRESS':
                          return {
                            bg: '#FEF3C7',
                            color: '#D97706',
                            borderColor: '#FCD34D',
                          };
                        case 'RISK REVIEW':
                          return {
                            bg: '#FEE2E2',
                            color: '#DC2626',
                            borderColor: '#FCA5A5',
                          };
                        case 'COMPLETE':
                        case 'APPROVED':
                          return {
                            bg: '#D1FAE5',
                            color: '#059669',
                            borderColor: '#6EE7B7',
                          };
                        case 'DECLINED':
                        case 'REJECTED':
                          return {
                            bg: '#FEE2E2',
                            color: '#DC2626',
                            borderColor: '#FCA5A5',
                          };
                        default:
                          return {
                            bg: '#F1F5F9',
                            color: '#475569',
                            borderColor: '#CBD5E1',
                          };
                      }
                    };
                    const s = getInlineStatusStyles();
                    return (
                      <Box
                        px="12px"
                        py="4px"
                        borderRadius="full"
                        bg={s.bg}
                        border="1px solid"
                        borderColor={s.borderColor}
                      >
                        <Typography
                          fontSize="11px"
                          fontWeight="600"
                          color={s.color}
                          letterSpacing="0.5px"
                        >
                          {statusValue}
                        </Typography>
                      </Box>
                    );
                  })()}
                </HStack>
                <HStack gap="8px" align="center">
                  <Typography color="mukuru.grey.medium" fontSize="13px">
                    {formatEntityType(application.entityType)}
                  </Typography>
                  <Typography color="mukuru.grey.light" fontSize="12px">
                    •
                  </Typography>
                  <Typography color="mukuru.grey.medium" fontSize="13px">
                    {formatCountryName(application.country)}
                  </Typography>
                  <Typography color="mukuru.grey.light" fontSize="12px">
                    •
                  </Typography>
                  <Typography color="mukuru.grey.medium" fontSize="13px">
                    Submitted {formatRelativeTime(new Date(application.created))}
                  </Typography>
                </HStack>
              </VStack>
            </HStack>
            <HStack gap="10px" align="center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsStatusModalOpen(true)}
              >
                <IconWrapper>
                  <FiEdit3 size={14} />
                </IconWrapper>
                Update Status
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCommentModalOpen(true)}
              >
                <IconWrapper>
                  <FiMessageSquare size={14} />
                </IconWrapper>
                Add Comment
              </Button>
              <Link href={`/messages?applicationId=${applicationId}`}>
                <Box position="relative">
                  <Button variant="secondary" size="sm">
                    <IconWrapper>
                      <MailIcon width="14" height="14" />
                    </IconWrapper>
                    Messages
                  </Button>
                  {applicationUnreadMessages > 0 && (
                    <Box
                      position="absolute"
                      top="-6px"
                      right="-6px"
                      bg="mukuru.buttons.primary"
                      color="white"
                      borderRadius="full"
                      minW="18px"
                      h="18px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="10px"
                      fontWeight="bold"
                      border="2px solid white"
                      boxShadow="0 2px 4px rgba(0,0,0,0.15)"
                    >
                      {applicationUnreadMessages > 99 ? '99+' : applicationUnreadMessages}
                    </Box>
                  )}
                </Box>
              </Link>
              <Box w="1px" h="24px" bg="mukuru.grey.light" />
              <Link href="/work-queue">
                <Button variant="secondary" size="sm">
                  <IconWrapper>
                    <FiArrowLeft size={14} />
                  </IconWrapper>
                  Back
                </Button>
              </Link>
            </HStack>
          </Flex>

          {/* Progress Stepper Row */}
          <Box px="32px" py="16px" bg="#FAFBFC">
            <HStack gap="0" justify="center" align="center" maxW="600px" mx="auto">
              {adminSteps.map((step, index) => (
                <React.Fragment key={step.id}>
                  {/* Step Circle */}
                  <VStack
                    gap="8px"
                    align="center"
                    cursor="pointer"
                    onClick={() => setCurrentStep(step.id)}
                  >
                    <Box
                      w="44px"
                      h="44px"
                      borderRadius="full"
                      bg={currentStep >= step.id ? 'mukuru.buttons.primary' : 'white'}
                      border="2px solid"
                      borderColor={
                        currentStep >= step.id
                          ? 'mukuru.buttons.primary'
                          : 'mukuru.grey.light'
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      boxShadow={
                        currentStep === step.id
                          ? '0 4px 12px rgba(240, 84, 35, 0.3)'
                          : 'none'
                      }
                    >
                      <step.icon
                        size={18}
                        color={currentStep >= step.id ? 'white' : '#94A3B8'}
                      />
                    </Box>
                    <VStack gap="0" align="center">
                      <Typography
                        fontSize="12px"
                        fontWeight={currentStep === step.id ? '600' : '500'}
                        color={
                          currentStep === step.id
                            ? 'mukuru.text.primary'
                            : 'mukuru.grey.medium'
                        }
                        textAlign="center"
                      >
                        {step.title}
                      </Typography>
                    </VStack>
                  </VStack>

                  {/* Connector Line */}
                  {index < adminSteps.length - 1 && (
                    <Box
                      flex="1"
                      h="2px"
                      bg={
                        currentStep > step.id
                          ? 'mukuru.buttons.primary'
                          : 'mukuru.grey.light'
                      }
                      mx="8px"
                      mt="-24px"
                      transition="background 0.2s"
                    />
                  )}
                </React.Fragment>
              ))}
            </HStack>
          </Box>
        </Box>

        {/* Main Content Area with Sidebar */}
        <Flex py="24px" px="32px" gap="24px" align="flex-start">
          {/* Left Content - Steps */}
          <Box flex="1" minW="0">
            <MotionBox
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {(() => {
                // Get the current step's section from the schema
                const currentStepData = adminSteps.find(
                  (step) => step.id === currentStep
                );

                // If schema is loading, show loading state
                if (schemaLoading) {
                  return (
                    <VStack gap="6" align="stretch" w="full">
                      <Card
                        bg={cardBg}
                        borderRadius="xl"
                        border="1px"
                        borderColor="mukuru.grey.light"
                        p={{ base: '6', md: '10' }}
                        boxShadow="lg"
                        w="full"
                      >
                        <VStack gap="6" align="center" py="12" w="full">
                          <Box
                            p="4"
                            borderRadius="xl"
                            bg="mukuru.state.hover.card"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            boxShadow="md"
                            animation="pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                          >
                            <IconWrapper>
                              <FiFileText size={28} color="mukuru.primary" />
                            </IconWrapper>
                          </Box>
                          <VStack gap="2" align="center" w="full" maxW="400px">
                            <Typography
                              fontSize="lg"
                              color="mukuru.text.primary"
                              fontWeight="700"
                              textAlign="center"
                              letterSpacing="-0.01em"
                            >
                              Loading Application Data
                            </Typography>
                            <Typography
                              fontSize="sm"
                              color="mukuru.grey.mediumDark"
                              fontWeight="500"
                              textAlign="center"
                            >
                              Fetching entity schema and configuration from database...
                            </Typography>
                          </VStack>
                          <Progress.Root
                            value={undefined}
                            size="lg"
                            colorScheme="orange"
                            w="full"
                            maxW="400px"
                          >
                            <Progress.Track>
                              <Progress.Range />
                            </Progress.Track>
                          </Progress.Root>
                        </VStack>
                      </Card>
                    </VStack>
                  );
                }

                // Get overview fields from entity schema or use defaults
                const getOverviewFields = () => {
                  // If we have entity schema, get fields from the Overview section
                  if (
                    entitySchema &&
                    entitySchema.sections &&
                    entitySchema.sections.length > 0
                  ) {
                    const overviewSection = entitySchema.sections.find(
                      (section) =>
                        section.title.toLowerCase().includes('overview') ||
                        section.id === 'section-0' ||
                        section.order === 0
                    );

                    if (overviewSection && overviewSection.fields.length > 0) {
                      return overviewSection.fields.map((field) => ({
                        label: field.label,
                        value: field.value,
                        code: field.code,
                        type: field.type,
                      }));
                    }
                  }

                  // Fallback to default fields
                  return [
                    {
                      label: 'Legal Name',
                      value: application.legalName,
                      code: 'legalName',
                      type: 'Text',
                    },
                    {
                      label: 'Entity Type',
                      value: formatEntityType(application.entityType),
                      code: 'entityType',
                      type: 'Text',
                    },
                    {
                      label: 'Country',
                      value: formatCountryName(application.country),
                      code: 'country',
                      type: 'Text',
                    },
                    {
                      label: 'Status',
                      value: application.status,
                      code: 'status',
                      type: 'Status',
                    },
                    {
                      label: 'Submitted Date',
                      value: formatDateShort(application.created),
                      code: 'submittedDate',
                      type: 'Date',
                    },
                    {
                      label: 'Last Updated',
                      value: formatDateShort(application.updated),
                      code: 'lastUpdated',
                      type: 'Date',
                    },
                  ];
                };

                const overviewFields = getOverviewFields();

                // Get icon for field type
                const getFieldIcon = (code: string, type: string) => {
                  const codeUpper = code.toUpperCase();
                  if (codeUpper.includes('NAME') || codeUpper.includes('LEGAL'))
                    return FiFileText;
                  if (codeUpper.includes('TYPE') || codeUpper.includes('ENTITY'))
                    return FiUsers;
                  if (codeUpper.includes('COUNTRY') || codeUpper.includes('ADDRESS'))
                    return FiHome;
                  if (codeUpper.includes('STATUS')) return FiCheckSquare;
                  if (
                    codeUpper.includes('DATE') ||
                    codeUpper.includes('CREATED') ||
                    codeUpper.includes('UPDATED')
                  )
                    return FiFileText;
                  if (codeUpper.includes('EMAIL')) return FiMessageSquare;
                  if (codeUpper.includes('PHONE')) return FiMessageSquare;
                  return FiFileText;
                };

                // Format field value for display
                const formatFieldValue = (
                  value: unknown,
                  type: string,
                  code: string
                ): React.ReactNode => {
                  if (value === null || value === undefined || value === '') {
                    return (
                      <Typography
                        fontSize="sm"
                        fontWeight="medium"
                        color={placeholderTextColor}
                        textAlign="right"
                      >
                        Not provided
                      </Typography>
                    );
                  }

                  if (code === 'status') {
                    const statusValue = String(value).toUpperCase();
                    const getStatusStyles = () => {
                      switch (statusValue) {
                        case 'SUBMITTED':
                          return {
                            bg: '#DBEAFE',
                            color: '#1D4ED8',
                            borderColor: '#93C5FD',
                          };
                        case 'IN PROGRESS':
                          return {
                            bg: '#FEF3C7',
                            color: '#D97706',
                            borderColor: '#FCD34D',
                          };
                        case 'RISK REVIEW':
                          return {
                            bg: '#FEE2E2',
                            color: '#DC2626',
                            borderColor: '#FCA5A5',
                          };
                        case 'COMPLETE':
                        case 'APPROVED':
                          return {
                            bg: '#D1FAE5',
                            color: '#059669',
                            borderColor: '#6EE7B7',
                          };
                        case 'DECLINED':
                        case 'REJECTED':
                          return {
                            bg: '#FEE2E2',
                            color: '#DC2626',
                            borderColor: '#FCA5A5',
                          };
                        default:
                          return {
                            bg: '#F1F5F9',
                            color: '#475569',
                            borderColor: '#CBD5E1',
                          };
                      }
                    };
                    const styles = getStatusStyles();
                    return (
                      <Box
                        px="14px"
                        py="6px"
                        borderRadius="full"
                        bg={styles.bg}
                        border="1px solid"
                        borderColor={styles.borderColor}
                        display="inline-flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Typography
                          fontSize="12px"
                          fontWeight="600"
                          color={styles.color}
                          letterSpacing="0.5px"
                        >
                          {statusValue}
                        </Typography>
                      </Box>
                    );
                  }

                  if (type === 'Date' || code.includes('Date')) {
                    try {
                      const date =
                        typeof value === 'string' ? new Date(value) : (value as Date);
                      if (!isNaN(date.getTime())) {
                        return (
                          <VStack align="end" gap="0.5">
                            <Typography
                              fontSize="sm"
                              fontWeight="medium"
                              color={textColor}
                              textAlign="right"
                            >
                              {formatDateShort(date)}
                            </Typography>
                            <Typography
                              fontSize="xs"
                              color={placeholderTextColor}
                              textAlign="right"
                            >
                              {formatRelativeTime(date)}
                            </Typography>
                          </VStack>
                        );
                      }
                    } catch {
                      // Invalid date, fall through
                    }
                  }

                  // Handle File types - render clickable document links
                  // ONLY treat as document if field type is File OR field code indicates it's a document
                  // Don't be too aggressive - regular text fields should not be treated as documents
                  const isFileType = type === 'File' || type === 'file' || 
                    code.toLowerCase().includes('document') || 
                    code.toLowerCase().includes('file');
                  
                  // Only process as document if it's actually a file type field AND value contains document data
                  if (isFileType && typeof value === 'string' && (value.includes('fileName') || value.startsWith('{'))) {
                    // Try to detect and parse JSON even if it's truncated or malformed
                    let fileData: Record<string, unknown> | null = null;
                    let displayFileName = '';
                    
                    try {
                      // Try to parse complete JSON
                      fileData = JSON.parse(value) as Record<string, unknown>;
                      displayFileName = fileData?.fileName ? String(fileData.fileName) : '';
                    } catch {
                      // JSON might be truncated or malformed - try to extract fileName manually
                      // Try with quotes (handles both complete and truncated strings)
                      const fileNameMatch = value.match(/"fileName"\s*:\s*"([^"]*)/);
                      if (fileNameMatch && fileNameMatch[1]) {
                        displayFileName = fileNameMatch[1];
                        fileData = { fileName: displayFileName };
                      } else {
                        // Try without quotes (handles truncated strings without closing quote)
                        const fileNameMatch2 = value.match(/fileName["\s]*:["\s]*([^,}\s"]+)/);
                        if (fileNameMatch2 && fileNameMatch2[1]) {
                          displayFileName = fileNameMatch2[1].trim();
                          fileData = { fileName: displayFileName };
                        } else {
                          // Try to extract anything after fileName: (handles very truncated JSON)
                          const fileNameMatch3 = value.match(/fileName["\s]*:["\s]*([^,}\s"]*)/);
                          if (fileNameMatch3 && fileNameMatch3[1] && fileNameMatch3[1].trim()) {
                            displayFileName = fileNameMatch3[1].trim();
                            fileData = { fileName: displayFileName };
                          } else if (value.includes('fileName')) {
                            // Last resort: extract the part after fileName: up to the end or next special char
                            const afterColon = value.split(/fileName["\s]*:["\s]*/)[1];
                            if (afterColon) {
                              // Extract up to comma, closing brace, or end of string
                              const extracted = afterColon.split(/[,}\s]/)[0].replace(/^["']|["']$/g, '');
                              if (extracted) {
                                displayFileName = extracted;
                                fileData = { fileName: displayFileName };
                              }
                            }
                          }
                        }
                      }
                    }
                    
                    // Only render as document if we successfully extracted file data
                    if (fileData && displayFileName) {
                      const fileName = displayFileName;
                      const fileSize = fileData.fileSize ? Number(fileData.fileSize) : null;
                      
                      return (
                        <Box
                          p="3"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="orange.200"
                          bg="orange.50"
                          _hover={{
                            borderColor: 'orange.300',
                            bg: 'orange.100',
                            boxShadow: 'sm',
                          }}
                          transition="all 0.2s"
                          cursor="pointer"
                          onClick={() => handleDocumentView(fileData as Record<string, unknown>)}
                          maxW="100%"
                        >
                          <HStack gap="3" justify="space-between" align="center">
                            <HStack gap="2" flex="1" minW="0">
                              <Box
                                color="orange.600"
                                flexShrink={0}
                                display="flex"
                                alignItems="center"
                              >
                                <FiFileText size={18} />
                              </Box>
                              <Box flex="1" minW="0">
                                <Typography
                                  fontSize="sm"
                                  fontWeight="medium"
                                  color="orange.700"
                                  title={fileName}
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {fileName}
                                </Typography>
                                {fileSize && fileSize > 0 && (
                                  <Typography fontSize="xs" color="orange.600" mt="1">
                                    {(fileSize / 1024 / 1024).toFixed(2)} MB
                                  </Typography>
                                )}
                              </Box>
                            </HStack>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDocumentView(fileData as Record<string, unknown>);
                              }}
                              leftIcon={<FiEye size={14} />}
                              flexShrink={0}
                              bg="white"
                              _hover={{ bg: 'orange.50' }}
                              borderColor="orange.300"
                              style={{ color: '#c2410c' }}
                            >
                              View
                            </Button>
                          </HStack>
                        </Box>
                      );
                    }
                  } else if (isFileType && typeof value === 'object' && value !== null) {
                    // Handle object file data
                    const fileData = value as Record<string, unknown>;
                    const displayFileName = fileData?.fileName ? String(fileData.fileName) : '';
                    
                    if (displayFileName) {
                      const fileSize = fileData.fileSize ? Number(fileData.fileSize) : null;
                      
                      return (
                        <Box
                          p="3"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="orange.200"
                          bg="orange.50"
                          _hover={{
                            borderColor: 'orange.300',
                            bg: 'orange.100',
                            boxShadow: 'sm',
                          }}
                          transition="all 0.2s"
                          cursor="pointer"
                          onClick={() => handleDocumentView(fileData)}
                          maxW="100%"
                        >
                          <HStack gap="3" justify="space-between" align="center">
                            <HStack gap="2" flex="1" minW="0">
                              <Box
                                color="orange.600"
                                flexShrink={0}
                                display="flex"
                                alignItems="center"
                              >
                                <FiFileText size={18} />
                              </Box>
                              <Box flex="1" minW="0">
                                <Typography
                                  fontSize="sm"
                                  fontWeight="medium"
                                  color="orange.700"
                                  title={displayFileName}
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {displayFileName}
                                </Typography>
                                {fileSize && fileSize > 0 && (
                                  <Typography fontSize="xs" color="orange.600" mt="1">
                                    {(fileSize / 1024 / 1024).toFixed(2)} MB
                                  </Typography>
                                )}
                              </Box>
                            </HStack>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDocumentView(fileData);
                              }}
                              leftIcon={<FiEye size={14} />}
                              flexShrink={0}
                              bg="white"
                              _hover={{ bg: 'orange.50' }}
                              borderColor="orange.300"
                              style={{ color: '#c2410c' }}
                            >
                              View
                            </Button>
                          </HStack>
                        </Box>
                      );
                    }
                  }
                  // End of file type handling - if we get here, it's not a document or couldn't parse it

                  return (
                    <Typography
                      fontSize="sm"
                      fontWeight="medium"
                      color={textColor}
                      textAlign="right"
                      wordBreak="break-word"
                    >
                      {String(value)}
                    </Typography>
                  );
                };

                // If no schema available or on first step, show Application Overview using profile card style
                if (
                  !entitySchema ||
                  !entitySchema.sections ||
                  entitySchema.sections.length === 0 ||
                  currentStep === 1
                ) {
                  return (
                    <Box
                      bg="white"
                      borderRadius="16px"
                      border="1px solid"
                      borderColor="mukuru.grey.light"
                      overflow="hidden"
                      boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
                    >
                      {/* Card Header */}
                      <Box
                        p="16px 20px"
                        borderBottom="1px solid"
                        borderColor="mukuru.grey.light"
                        bg="#FAFBFC"
                      >
                        <Typography
                          fontSize="15px"
                          fontWeight="600"
                          color="mukuru.text.primary"
                        >
                          Application Overview
                        </Typography>
                      </Box>

                      {/* Card Body */}
                      <Box bg="white">
                        {overviewFields.map((field, index) => (
                          <Box
                            key={field.code || index}
                            px="20px"
                            py="14px"
                            borderBottom={
                              index < overviewFields.length - 1 ? '1px solid' : 'none'
                            }
                            borderColor="mukuru.grey.light"
                            _hover={{ bg: '#FAFBFC' }}
                            transition="background 0.15s"
                          >
                            <Flex justify="space-between" align="center" gap="16px">
                              <HStack gap="12px" flex="1" minW="0">
                                <Box
                                  p="8px"
                                  borderRadius="8px"
                                  bg="#F1F5F9"
                                  flexShrink={0}
                                >
                                  {React.createElement(
                                    getFieldIcon(field.code, field.type),
                                    { size: 16, color: '#64748B' }
                                  )}
                                </Box>
                                <Typography
                                  fontSize="13px"
                                  fontWeight="500"
                                  color="mukuru.grey.mediumDark"
                                >
                                  {field.label}
                                </Typography>
                              </HStack>
                              <Box flexShrink={0} textAlign="right">
                                {formatFieldValue(field.value, field.type, field.code)}
                              </Box>
                            </Flex>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  );
                }

                if (!currentStepData) {
                  return (
                    <VStack gap="6" align="stretch" w="full">
                      <Card
                        bg={cardBg}
                        borderRadius="xl"
                        border="1px"
                        borderColor="mukuru.text.alert"
                        p="6"
                        boxShadow="md"
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
                // At this point, entitySchema is guaranteed to be non-null due to the check above
                if (!entitySchema || !entitySchema.sections) {
                  return null;
                }

                const currentStepDataTyped = currentStepData as {
                  sectionId?: string;
                  sectionOrder?: number;
                  title?: string;
                };
                const currentSection =
                  entitySchema.sections.find(
                    (section) =>
                      currentStepDataTyped.sectionId === section.id ||
                      (section.title === currentStepDataTyped.title &&
                        currentStepDataTyped.sectionOrder === section.order)
                  ) ||
                  entitySchema.sections.find(
                    (section) => section.title === currentStepDataTyped.title
                  ) ||
                  entitySchema.sections[currentStep - 1]; // Fallback to index-based

                if (!currentSection) {
                  return (
                    <VStack gap="6" align="stretch" w="full">
                      <Card
                        bg={cardBg}
                        borderRadius="xl"
                        border="1px"
                        borderColor="mukuru.text.alert"
                        p="6"
                        boxShadow="md"
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
                        bg={cardBg}
                        borderRadius="xl"
                        border="1px"
                        borderColor="mukuru.grey.light"
                        p="6"
                        boxShadow="md"
                        w="full"
                      >
                        <VStack gap="4" align="center" py="8" w="full">
                          <Box
                            p="3"
                            borderRadius="lg"
                            bg="mukuru.state.hover.card"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <IconWrapper>
                              <FiFileText size={24} color="mukuru.primary" />
                            </IconWrapper>
                          </Box>
                          <Typography
                            fontSize="md"
                            color="mukuru.text.primary"
                            fontWeight="600"
                            textAlign="center"
                          >
                            Loading entity schema from database...
                          </Typography>
                          <Progress.Root
                            value={undefined}
                            size="md"
                            colorScheme="orange"
                            w="full"
                            maxW="300px"
                          >
                            <Progress.Track>
                              <Progress.Range />
                            </Progress.Track>
                          </Progress.Root>
                        </VStack>
                      </Card>
                    ) : (
                      <Card
                        bg={cardBg}
                        width="full"
                        height="full"
                        display="flex"
                        flexDirection="column"
                      >
                        {/* Card Header */}
                        <Box
                          p="6"
                          borderBottom="1px"
                          borderColor={borderColor}
                          width="full"
                        >
                          <Typography fontSize="2xl" fontWeight="bold" color={textColor}>
                            {currentSection.title}
                          </Typography>
                          {currentSection.description && (
                            <Typography
                              fontSize="sm"
                              color={mutedTextColor}
                              mt="2"
                              fontWeight="normal"
                            >
                              {currentSection.description}
                            </Typography>
                          )}
                        </Box>

                        {/* Card Body */}
                        <Box
                          p="6"
                          width="full"
                          flex="1"
                          display="flex"
                          flexDirection="column"
                          justifyContent="center"
                        >
                          <VStack align="stretch" gap="4" width="full">
                            {currentSection.fields.map((field, index) => {
                              // Get icon for field
                              const fieldIcon = getFieldIcon(field.code, field.type);

                              // Format field value
                              const fieldValue = formatFieldValue(
                                field.value,
                                field.type,
                                field.code
                              );

                              return (
                                <React.Fragment key={field.code || index}>
                                  <Flex
                                    justify="space-between"
                                    align="center"
                                    width="full"
                                    gap="4"
                                    py="2"
                                  >
                                    <Flex gap="3" align="center" flex="1" minW="0">
                                      <IconWrapper flexShrink={0}>
                                        {React.createElement(fieldIcon, {
                                          size: 16,
                                          color: iconColor,
                                        })}
                                      </IconWrapper>
                                      <Typography
                                        fontSize="sm"
                                        color={mutedTextColor}
                                        flexShrink={0}
                                      >
                                        {field.label}
                                        {field.isRequired && (
                                          <Typography
                                            as="span"
                                            color="mukuru.text.error"
                                            ml="1"
                                          >
                                            *
                                          </Typography>
                                        )}
                                      </Typography>
                                    </Flex>
                                    <Box flexShrink={0} maxW="60%" minW="0">
                                      {field.type === 'File' || field.type === 'file' || 
                                       field.code.toLowerCase().includes('document') ||
                                       field.code.toLowerCase().includes('_documents') ||
                                       (typeof field.value === 'string' && (field.value.includes('"fileName"') || field.value.includes('fileName'))) ? (
                                        <DynamicFieldRenderer
                                          field={{...field, type: 'File'}}
                                          readOnly={true}
                                          onDocumentClick={handleDocumentView}
                                        />
                                      ) : (
                                        fieldValue
                                      )}
                                    </Box>
                                  </Flex>
                                  {index < currentSection.fields.length - 1 && (
                                    <Box width="full" height="1px" bg={borderColor} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </VStack>
                        </Box>
                      </Card>
                    )}

                    {/* Quick Actions - only show on first step */}
                    {currentStep === 1 && (
                      <Card
                        bg={cardBg}
                        borderRadius="xl"
                        border="1px"
                        borderColor="mukuru.grey.light"
                        p={{ base: '5', md: '6' }}
                        boxShadow="lg"
                        w="full"
                        transition="all 0.2s"
                        _hover={{ boxShadow: 'xl' }}
                      >
                        <Box
                          pb="5"
                          mb="5"
                          borderBottom="2px"
                          borderColor="mukuru.grey.light"
                        >
                          <HStack gap="3" align="center">
                            <Box
                              p="2.5"
                              borderRadius="lg"
                              bg="mukuru.state.hover.card"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexShrink={0}
                              boxShadow="sm"
                            >
                              <IconWrapper>
                                <FiCheckSquare size={20} color="mukuru.primary" />
                              </IconWrapper>
                            </Box>
                            <VStack align="start" gap="0.5">
                              <Typography
                                fontSize="lg"
                                fontWeight="700"
                                color="mukuru.text.primary"
                                letterSpacing="-0.01em"
                                lineHeight="1.3"
                              >
                                Quick Actions
                              </Typography>
                              <Typography
                                fontSize="xs"
                                color="mukuru.grey.mediumDark"
                                fontWeight="500"
                              >
                                Manage application status and add notes
                              </Typography>
                            </VStack>
                          </HStack>
                        </Box>
                        <Box pt="2">
                          <HStack
                            gap="3"
                            wrap="wrap"
                            align="center"
                            justify={{ base: 'stretch', md: 'flex-start' }}
                          >
                            <Button
                              variant="primary"
                              onClick={() => setIsStatusModalOpen(true)}
                              size="md"
                              aria-label="Update application status"
                            >
                              <IconWrapper>
                                <FiEdit3 size={16} />
                              </IconWrapper>
                              Update Status
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setIsCommentModalOpen(true)}
                              size="md"
                              aria-label="Add comment to application"
                            >
                              <IconWrapper>
                                <FiMessageSquare size={16} />
                              </IconWrapper>
                              Add Comment
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={handleExportData}
                              disabled={isExporting}
                              size="md"
                              aria-label="Export application data"
                            >
                              <IconWrapper>
                                <FiDownload size={16} />
                              </IconWrapper>
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

            {/* Navigation Footer */}
            <Box
              mt="16px"
              p="16px 20px"
              bg="white"
              borderRadius="16px"
              border="1px solid"
              borderColor="mukuru.grey.light"
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
            >
              <Flex justify="space-between" align="center">
                {/* Previous Button */}
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  size="sm"
                >
                  <IconWrapper>
                    <FiArrowLeft size={16} />
                  </IconWrapper>
                  Previous
                </Button>

                {/* Step Indicators */}
                <HStack gap="8px" align="center">
                  {adminSteps.map((step) => (
                    <Box
                      key={step.id}
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      bg={
                        currentStep === step.id
                          ? 'mukuru.buttons.primary'
                          : currentStep > step.id
                            ? '#D1FAE5'
                            : 'white'
                      }
                      border="2px solid"
                      borderColor={
                        currentStep === step.id
                          ? 'mukuru.buttons.primary'
                          : currentStep > step.id
                            ? '#059669'
                            : 'mukuru.grey.light'
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => setCurrentStep(step.id)}
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.1)' }}
                    >
                      {currentStep > step.id ? (
                        <FiCheckSquare size={14} color="#059669" />
                      ) : (
                        <Typography
                          fontSize="13px"
                          fontWeight="600"
                          color={currentStep === step.id ? 'white' : 'mukuru.grey.medium'}
                        >
                          {step.id}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </HStack>

                {/* Next Button */}
                <Button
                  variant="primary"
                  onClick={() =>
                    setCurrentStep(Math.min(adminSteps.length, currentStep + 1))
                  }
                  disabled={currentStep === adminSteps.length}
                  size="sm"
                >
                  Next
                  <IconWrapper>
                    <FiArrowRight size={16} />
                  </IconWrapper>
                </Button>
              </Flex>
            </Box>
          </Box>

          {/* Right Sidebar - Summary */}
          <Box w="300px" flexShrink={0} display={{ base: 'none', xl: 'block' }}>
            <VStack gap="16px" align="stretch">
              {/* Quick Stats Card */}
              <Box
                bg="white"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                overflow="hidden"
                w="full"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
              >
                <Box
                  p="16px"
                  borderBottom="1px solid"
                  borderColor="mukuru.grey.light"
                  bg="#FAFBFC"
                >
                  <Typography
                    fontSize="14px"
                    fontWeight="600"
                    color="mukuru.text.primary"
                  >
                    Quick Summary
                  </Typography>
                </Box>
                <VStack gap="0" align="stretch">
                  <Flex
                    p="14px 16px"
                    justify="space-between"
                    align="center"
                    borderBottom="1px solid"
                    borderColor="mukuru.grey.light"
                  >
                    <HStack gap="10px">
                      <Box p="8px" borderRadius="8px" bg="#DBEAFE">
                        <FiFileText size={14} color="#1D4ED8" />
                      </Box>
                      <Typography fontSize="13px" color="mukuru.grey.mediumDark">
                        Documents
                      </Typography>
                    </HStack>
                    <Typography
                      fontSize="14px"
                      fontWeight="600"
                      color="mukuru.text.primary"
                    >
                      {documentsCount}
                    </Typography>
                  </Flex>
                  <Flex
                    p="14px 16px"
                    justify="space-between"
                    align="center"
                    borderBottom="1px solid"
                    borderColor="mukuru.grey.light"
                  >
                    <HStack gap="10px">
                      <Box p="8px" borderRadius="8px" bg="#FEF3C7">
                        <FiCheckSquare size={14} color="#D97706" />
                      </Box>
                      <Typography fontSize="13px" color="mukuru.grey.mediumDark">
                        Risk Score
                      </Typography>
                    </HStack>
                    <Typography
                      fontSize="14px"
                      fontWeight="600"
                      color="mukuru.text.primary"
                    >
                      {application.riskScore || 'N/A'}
                    </Typography>
                  </Flex>
                  <Flex p="14px 16px" justify="space-between" align="center">
                    <HStack gap="10px">
                      <Box p="8px" borderRadius="8px" bg="#D1FAE5">
                        <FiUsers size={14} color="#059669" />
                      </Box>
                      <Typography fontSize="13px" color="mukuru.grey.mediumDark">
                        Sections
                      </Typography>
                    </HStack>
                    <Typography
                      fontSize="14px"
                      fontWeight="600"
                      color="mukuru.text.primary"
                    >
                      {adminSteps.length}
                    </Typography>
                  </Flex>
                </VStack>
              </Box>

              {/* Quick Actions Card */}
              <Box
                bg="white"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                overflow="hidden"
                w="full"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
              >
                <Box
                  p="16px"
                  borderBottom="1px solid"
                  borderColor="mukuru.grey.light"
                  bg="#FAFBFC"
                >
                  <Typography
                    fontSize="14px"
                    fontWeight="600"
                    color="mukuru.text.primary"
                  >
                    Quick Actions
                  </Typography>
                </Box>
                <VStack gap="8px" p="16px" align="stretch">
                  <Button
                    variant="primary"
                    size="sm"
                    w="full"
                    onClick={() => setIsStatusModalOpen(true)}
                  >
                    <IconWrapper>
                      <FiEdit3 size={14} />
                    </IconWrapper>
                    Update Status
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    w="full"
                    onClick={() => setIsCommentModalOpen(true)}
                  >
                    <IconWrapper>
                      <FiMessageSquare size={14} />
                    </IconWrapper>
                    Add Comment
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    w="full"
                    onClick={handleExportData}
                    disabled={isExporting}
                  >
                    <IconWrapper>
                      <FiDownload size={14} />
                    </IconWrapper>
                    {isExporting ? 'Exporting...' : 'Export Data'}
                  </Button>
                </VStack>
              </Box>

              {/* Comments Card */}
              <Box
                bg="white"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                overflow="hidden"
                w="full"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
              >
                <Box
                  p="16px"
                  borderBottom="1px solid"
                  borderColor="mukuru.grey.light"
                  bg="#FAFBFC"
                >
                  <HStack justify="space-between" align="center">
                    <Typography
                      fontSize="14px"
                      fontWeight="600"
                      color="mukuru.text.primary"
                    >
                      Comments ({commentsList.length})
                    </Typography>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsCommentModalOpen(true)}
                    >
                      <FiMessageSquare />
                    </Button>
                  </HStack>
                </Box>
                <VStack gap="0" align="stretch" p="16px" maxH="300px" overflowY="auto">
                  {commentsLoading ? (
                    <HStack gap="12px" align="center" justify="center" py="8px">
                      <Spinner size="sm" color="mukuru.buttons.primary" />
                      <Typography fontSize="12px" color="mukuru.grey.medium">
                        Loading comments...
                      </Typography>
                    </HStack>
                  ) : commentsList.length > 0 ? (
                    commentsList.map((comment, index) => (
                      <Box
                        key={comment.id || index}
                        p="12px"
                        bg={index % 2 === 0 ? '#F8FAFC' : 'white'}
                        borderRadius="8px"
                        mb={index < commentsList.length - 1 ? '8px' : '0'}
                      >
                        <VStack align="start" gap="4px">
                          <HStack justify="space-between" w="full">
                            <Typography
                              fontSize="12px"
                              fontWeight="600"
                              color="mukuru.text.primary"
                            >
                              {comment.authorName}
                            </Typography>
                            <Typography fontSize="11px" color="mukuru.grey.medium">
                              {comment.createdAt
                                ? formatDateShort(comment.createdAt)
                                : 'Unknown date'}
                            </Typography>
                          </HStack>
                          <Typography
                            fontSize="13px"
                            color="mukuru.text.primary"
                            lineHeight="1.5"
                          >
                            {comment.text}
                          </Typography>
                        </VStack>
                      </Box>
                    ))
                  ) : (
                    <Box py="16px" textAlign="center">
                      <Typography fontSize="13px" color="mukuru.grey.medium">
                        No comments yet
                      </Typography>
                      <Button
                        size="sm"
                        variant="ghost"
                        mt="8px"
                        onClick={() => setIsCommentModalOpen(true)}
                      >
                        <FiMessageSquare />
                        <Typography ml="4px" fontSize="12px">Add Comment</Typography>
                      </Button>
                    </Box>
                  )}
                </VStack>
              </Box>

              {/* Timeline Card */}
              <Box
                bg="white"
                borderRadius="16px"
                border="1px solid"
                borderColor="mukuru.grey.light"
                overflow="hidden"
                w="full"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
              >
                <Box
                  p="16px"
                  borderBottom="1px solid"
                  borderColor="mukuru.grey.light"
                  bg="#FAFBFC"
                >
                  <Typography
                    fontSize="14px"
                    fontWeight="600"
                    color="mukuru.text.primary"
                  >
                    Activity Timeline
                  </Typography>
                </Box>
                <VStack gap="0" align="stretch" p="16px">
                  {loadingAuditLogs ? (
                    <HStack gap="12px" align="center" justify="center" py="8px">
                      <Spinner size="sm" color="mukuru.buttons.primary" />
                      <Typography fontSize="12px" color="mukuru.grey.medium">
                        Loading...
                      </Typography>
                    </HStack>
                  ) : auditLogs.length > 0 ? (
                    auditLogs.slice(0, 5).map((log, index) => (
                      <HStack
                        key={log.id || index}
                        gap="12px"
                        align="start"
                        mt={index > 0 ? '12px' : '0'}
                      >
                        <Box
                          w="8px"
                          h="8px"
                          borderRadius="full"
                          bg={index === 0 ? 'mukuru.buttons.primary' : '#10B981'}
                          mt="6px"
                        />
                        <VStack align="start" gap="2px" flex="1">
                          <Typography
                            fontSize="13px"
                            fontWeight="500"
                            color="mukuru.text.primary"
                          >
                            {log.action}
                          </Typography>
                          <Typography fontSize="12px" color="mukuru.grey.medium">
                            {log.timestamp
                              ? formatDateShort(new Date(log.timestamp))
                              : 'Unknown date'}
                          </Typography>
                        </VStack>
                      </HStack>
                    ))
                  ) : (
                    <>
                      <HStack gap="12px" align="start">
                        <Box
                          w="8px"
                          h="8px"
                          borderRadius="full"
                          bg="mukuru.buttons.primary"
                          mt="6px"
                        />
                        <VStack align="start" gap="2px" flex="1">
                          <Typography
                            fontSize="13px"
                            fontWeight="500"
                            color="mukuru.text.primary"
                          >
                            Application Submitted
                          </Typography>
                          <Typography fontSize="12px" color="mukuru.grey.medium">
                            {formatDateShort(new Date(application.created))}
                          </Typography>
                        </VStack>
                      </HStack>
                      {application.updated !== application.created && (
                        <HStack gap="12px" align="start" mt="12px">
                          <Box
                            w="8px"
                            h="8px"
                            borderRadius="full"
                            bg="#10B981"
                            mt="6px"
                          />
                          <VStack align="start" gap="2px" flex="1">
                            <Typography
                              fontSize="13px"
                              fontWeight="500"
                              color="mukuru.text.primary"
                            >
                              Last Updated
                            </Typography>
                            <Typography fontSize="12px" color="mukuru.grey.medium">
                              {formatDateShort(new Date(application.updated))}
                            </Typography>
                          </VStack>
                        </HStack>
                      )}
                    </>
                  )}
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setTempStatusUpdate(statusUpdate);
          setTempComment('');
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
              bg="mukuru.state.hover.card"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <IconWrapper>
                <FiEdit3 size={16} color="mukuru.primary" />
              </IconWrapper>
            </Box>
            <VStack align="start" gap="0">
              <Typography fontSize="lg" fontWeight="700" color="mukuru.text.primary">
                Update Application Status
              </Typography>
              <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0.5">
                Change the status of this application
              </Typography>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalBody>
          <VStack gap="5" align="stretch">
            <Field.Root>
              <Field.Label
                fontSize="sm"
                fontWeight="600"
                color="mukuru.text.primary"
                mb="2"
              >
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
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '36px',
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
              <Field.Label
                fontSize="sm"
                fontWeight="600"
                color="mukuru.text.primary"
                mb="2"
              >
                Notes{' '}
                <Typography as="span" color="mukuru.grey.medium" fontWeight="400">
                  (Optional)
                </Typography>
              </Field.Label>
              <Textarea
                placeholder="Add notes about this status change..."
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                rows={4}
                borderRadius="md"
                borderWidth="1.5px"
                borderColor="mukuru.grey.light"
                fontSize="sm"
                color="mukuru.text.primary"
                _focus={{
                  borderColor: 'mukuru.primary',
                  boxShadow: '0 0 0 1px mukuru.primary',
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
                setTempComment('');
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
          setTempComment('');
        }}
        title="Add Comment"
        size="large"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <HStack gap="3" align="center" mb="1">
            <Box
              p="2.5"
              borderRadius="lg"
              bg="mukuru.state.hover.card"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <IconWrapper>
                <FiMessageSquare size={20} color="mukuru.primary" />
              </IconWrapper>
            </Box>
            <VStack align="start" gap="0">
              <Typography fontSize="xl" fontWeight="700" color="mukuru.text.primary">
                Comments
              </Typography>
              <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0.5">
                View and add comments to this application
              </Typography>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalBody>
          {/* Existing Comments List */}
          {commentsList.length > 0 && (
            <Box mb="5">
              <HStack justify="space-between" align="center" mb="3">
                <Typography fontSize="md" fontWeight="600" color="mukuru.text.primary">
                  Previous Comments
                </Typography>
                <Box 
                  px="2.5" 
                  py="1" 
                  bg="mukuru.primary" 
                  borderRadius="full"
                >
                  <Typography fontSize="xs" fontWeight="600" color="white">
                    {commentsList.length}
                  </Typography>
                </Box>
              </HStack>
              <VStack 
                gap="3" 
                align="stretch" 
                maxH="300px" 
                overflowY="auto"
                p="3"
                bg="gray.50"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.200"
              >
                {commentsList.map((comment, index) => (
                  <Box
                    key={comment.id || index}
                    p="4"
                    bg="white"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.200"
                    boxShadow="sm"
                  >
                    <HStack justify="space-between" mb="2">
                      <HStack gap="2">
                        <Box 
                          w="8" 
                          h="8" 
                          borderRadius="full" 
                          bg="mukuru.primary" 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center"
                        >
                          <Typography fontSize="xs" fontWeight="600" color="white">
                            {comment.authorName?.charAt(0)?.toUpperCase() || 'U'}
                          </Typography>
                        </Box>
                        <VStack align="start" gap="0">
                          <Typography fontSize="sm" fontWeight="600" color="mukuru.text.primary">
                            {comment.authorName}
                          </Typography>
                          <Typography fontSize="xs" color="mukuru.grey.medium">
                            {comment.createdAt ? formatDateShort(comment.createdAt) : ''}
                          </Typography>
                        </VStack>
                      </HStack>
                    </HStack>
                    <Typography fontSize="sm" color="mukuru.text.primary" lineHeight="1.5" pl="10">
                      {comment.text}
                    </Typography>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
          
          {/* Add New Comment */}
          <Box 
            p="4" 
            bg="gray.50" 
            borderRadius="lg" 
            border="1px solid" 
            borderColor="gray.200"
          >
            <Field.Root>
              <Field.Label
                fontSize="md"
                fontWeight="600"
                color="mukuru.text.primary"
                mb="3"
              >
                {commentsList.length > 0 ? 'Add New Comment' : 'Write a Comment'}
              </Field.Label>
              <Textarea
                placeholder="Enter your comment here..."
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                rows={5}
                borderRadius="lg"
                borderWidth="1.5px"
                borderColor="gray.300"
                fontSize="sm"
                color="mukuru.text.primary"
                bg="white"
                _focus={{
                  borderColor: 'mukuru.primary',
                  boxShadow: '0 0 0 1px mukuru.primary',
                }}
              />
            </Field.Root>
          </Box>
        </ModalBody>
        <ModalFooter>
          <HStack gap="3" justify="flex-end" w="full">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCommentModalOpen(false);
                setTempComment('');
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
    </Box>
  );
}
