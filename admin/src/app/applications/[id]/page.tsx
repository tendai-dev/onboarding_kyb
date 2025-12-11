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
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);
  const [viewingDocumentName, setViewingDocumentName] = useState('');
  const [viewingDocumentType, setViewingDocumentType] = useState<string | undefined>(
    undefined
  );
  const [viewingDocumentSize, setViewingDocumentSize] = useState<number | undefined>(
    undefined
  );

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

      // Get case ID from URL params
      const caseId = applicationId;
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
        const dFileName = (d.fileName ? String(d.fileName) : '').toLowerCase();
        const searchFileName = (fileName || '').toLowerCase();

        // Exact match
        if (d.fileName === fileName || dFileName === searchFileName) return true;

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

      if (!doc || !doc.storageKey) {
        await SweetAlert.warning(
          'Document Not Found',
          `Could not find document "${fileName}" in the system. Found ${documents.length} document(s) for this application.`
        );
        return;
      }

      // Get download URL - try multiple methods
      let downloadUrl: string | null = null;

      // Method 1: Try download endpoint with storage key
      try {
        const downloadResponse = await fetch(
          `/api/proxy/api/v1/documents/download/${encodeURIComponent(doc.storageKey)}`
        );
        if (downloadResponse.ok) {
          const downloadData = await downloadResponse.json();
          logger.debug('Download URL response received');

          // Try all possible field names for the URL (C# serializes to camelCase by default)
          downloadUrl =
            downloadData.downloadUrl ||
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
            logger.error(
              new Error('Could not extract URL from response'),
              'Failed to extract download URL',
              {
                tags: { error_type: 'url_extraction_error' },
                extra: { downloadData },
              }
            );
          }
        } else {
          const errorText = await downloadResponse.text();
          logger.warn('Download URL request failed', {
            tags: { warning_type: 'download_url_failed' },
            extra: { status: downloadResponse.status, errorText },
          });
        }
      } catch (err) {
        logger.warn('Failed to get download URL from storage key', {
          tags: { warning_type: 'storage_key_download_failed' },
          extra: { error: err },
        });
      }

      // Method 2: Try download endpoint with document ID
      if (!downloadUrl && doc.id) {
        try {
          const downloadResponse = await fetch(
            `/api/proxy/api/v1/documents/${doc.id}/download`
          );
          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json();
            downloadUrl =
              downloadData.downloadUrl ||
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
            extra: { error: err },
          });
        }
      }

      // Method 3: Try download-url POST endpoint
      if (!downloadUrl && doc.storageKey) {
        try {
          const downloadResponse = await fetch(
            `/api/proxy/api/v1/documents/download-url`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                storageKey: doc.storageKey,
                bucketName: doc.bucketName || 'kyb-docs',
              }),
            }
          );
          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json();
            // Try all possible field names (C# serializes to camelCase)
            downloadUrl =
              downloadData.downloadUrl ||
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
              extra: { status: downloadResponse.status, errorText },
            });
          }
        } catch (err) {
          logger.warn('Failed to get download URL from POST endpoint', {
            tags: { warning_type: 'post_endpoint_failed' },
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
          `Failed to get download URL for document. StorageKey: ${doc.storageKey}, DocumentId: ${doc.id}`
        );
      }

      // Open viewer
      setViewingDocumentName(doc.fileName || fileName);
      setViewingDocumentType(doc.type ? String(doc.type) : undefined);
      setViewingDocumentSize(doc.sizeBytes || fileData.fileSize);
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
      if (!applicationId || applicationId.trim() === '' || applicationId === 'undefined' || applicationId === 'null') {
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
        metadata = projection.metadataJson
          ? typeof projection.metadataJson === 'string'
            ? JSON.parse(projection.metadataJson)
            : projection.metadataJson
          : {};
      } catch (parseError) {
        logger.warn('Failed to parse metadataJson, using empty object', {
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
        cleaned: entityTypeCode,
      });

      // Map status from backend to frontend
      const statusMap: Record<string, Application['status']> = {
        Draft: 'IN PROGRESS',
        InProgress: 'IN PROGRESS',
        PendingReview: 'RISK REVIEW',
        Submitted: 'SUBMITTED',
        Approved: 'COMPLETE',
        Rejected: 'DECLINED',
        Cancelled: 'DECLINED',
      };

      const mappedApp: Application = {
        // Use projection.id (GUID) for API calls, not projection.caseId (case number string)
        id: projection.id,
        legalName:
          projection.businessLegalName ||
          `${projection.applicantFirstName || ''} ${projection.applicantLastName || ''}`.trim() ||
          'Unknown',
        entityType:
          projection.type || (metadata.entity_type_display_name as string) || 'Unknown',
        country:
          projection.businessCountryOfRegistration ||
          projection.applicantCountry ||
          'Unknown',
        status: statusMap[projection.status] || 'IN PROGRESS',
        created: projection.createdAt || new Date().toISOString(),
        updated: projection.updatedAt || projection.createdAt || new Date().toISOString(),
        submittedBy: projection.applicantEmail || 'Unknown',
        riskScore: projection.riskScore || 0,
        documents: [], // Documents would need to be fetched separately
        businessInfo: {
          registrationNumber:
            projection.businessRegistrationNumber ||
            (metadata.registrationNumber as string) ||
            '',
          taxId: projection.businessTaxId || (metadata.taxNumber as string) || '',
          businessAddress:
            projection.businessAddress || (metadata.businessAddress as string) || '',
          industry: projection.businessIndustry || (metadata.industry as string) || '',
          employees: projection.businessNumberOfEmployees || 0,
          annualRevenue: projection.businessAnnualRevenue || 0,
        },
        contactInfo: {
          primaryContact:
            `${projection.applicantFirstName || ''} ${projection.applicantLastName || ''}`.trim(),
          email: projection.applicantEmail || '',
          phone: projection.applicantPhone || '',
          address: projection.applicantAddress || '',
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
        await loadEntitySchema(entityTypeCode, data, true); // Enable wizard configuration
      } else {
        logger.error(
          new Error('No entity_type_code found in application metadata'),
          '[Application Loader] Missing entity type code',
          {
            tags: { error_type: 'missing_entity_type_code' },
            extra: { availableKeys: Object.keys(metadata) },
          }
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

      // Close modal and show success
      setIsStatusModalOpen(false);
      setTempStatusUpdate('');
      setTempComment('');

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
      // Add comment via work queue API if work item exists
      const _workItemId = application.id;

      const response = await fetch(`/api/workqueue/${_workItemId}/comments`, {
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
        setTempComment('');

        await SweetAlert.success(
          'Comment Added',
          'Your comment has been added successfully'
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add comment: ${response.status}`);
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
              <Typography
                color="mukuru.text.primary"
                fontSize="18px"
                fontWeight="700"
              >
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
          <Box px="32px" py="12px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="#FAFBFC">
            <HStack gap="8px" align="center">
              <Link href="/work-queue">
                <Typography fontSize="13px" color="mukuru.grey.medium" _hover={{ color: 'mukuru.buttons.primary' }} cursor="pointer">
                  Work Queue
                </Typography>
              </Link>
              <Typography fontSize="13px" color="mukuru.grey.medium">/</Typography>
              <Link href="/applications">
                <Typography fontSize="13px" color="mukuru.grey.medium" _hover={{ color: 'mukuru.buttons.primary' }} cursor="pointer">
                  Applications
                </Typography>
              </Link>
              <Typography fontSize="13px" color="mukuru.grey.medium">/</Typography>
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
                  <Typography fontSize="20px" fontWeight="700" color="mukuru.text.primary">
                    {application.legalName}
                  </Typography>
                  {(() => {
                    const statusValue = application.status.toUpperCase();
                    const getInlineStatusStyles = () => {
                      switch (statusValue) {
                        case 'SUBMITTED':
                          return { bg: '#DBEAFE', color: '#1D4ED8', borderColor: '#93C5FD' };
                        case 'IN PROGRESS':
                          return { bg: '#FEF3C7', color: '#D97706', borderColor: '#FCD34D' };
                        case 'RISK REVIEW':
                          return { bg: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' };
                        case 'COMPLETE':
                        case 'APPROVED':
                          return { bg: '#D1FAE5', color: '#059669', borderColor: '#6EE7B7' };
                        case 'DECLINED':
                        case 'REJECTED':
                          return { bg: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' };
                        default:
                          return { bg: '#F1F5F9', color: '#475569', borderColor: '#CBD5E1' };
                      }
                    };
                    const s = getInlineStatusStyles();
                    return (
                      <Box px="12px" py="4px" borderRadius="full" bg={s.bg} border="1px solid" borderColor={s.borderColor}>
                        <Typography fontSize="11px" fontWeight="600" color={s.color} letterSpacing="0.5px">
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
                  <Typography color="mukuru.grey.light" fontSize="12px">•</Typography>
                  <Typography color="mukuru.grey.medium" fontSize="13px">
                    {formatCountryName(application.country)}
                  </Typography>
                  <Typography color="mukuru.grey.light" fontSize="12px">•</Typography>
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
                  <VStack gap="8px" align="center" cursor="pointer" onClick={() => setCurrentStep(step.id)}>
                    <Box
                      w="44px"
                      h="44px"
                      borderRadius="full"
                      bg={currentStep >= step.id ? 'mukuru.buttons.primary' : 'white'}
                      border="2px solid"
                      borderColor={currentStep >= step.id ? 'mukuru.buttons.primary' : 'mukuru.grey.light'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      boxShadow={currentStep === step.id ? '0 4px 12px rgba(240, 84, 35, 0.3)' : 'none'}
                    >
                      <step.icon size={18} color={currentStep >= step.id ? 'white' : '#94A3B8'} />
                    </Box>
                    <VStack gap="0" align="center">
                      <Typography 
                        fontSize="12px" 
                        fontWeight={currentStep === step.id ? '600' : '500'} 
                        color={currentStep === step.id ? 'mukuru.text.primary' : 'mukuru.grey.medium'}
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
                      bg={currentStep > step.id ? 'mukuru.buttons.primary' : 'mukuru.grey.light'}
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
              const currentStepData = adminSteps.find((step) => step.id === currentStep);

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
                        return { bg: '#DBEAFE', color: '#1D4ED8', borderColor: '#93C5FD' };
                      case 'IN PROGRESS':
                        return { bg: '#FEF3C7', color: '#D97706', borderColor: '#FCD34D' };
                      case 'RISK REVIEW':
                        return { bg: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' };
                      case 'COMPLETE':
                      case 'APPROVED':
                        return { bg: '#D1FAE5', color: '#059669', borderColor: '#6EE7B7' };
                      case 'DECLINED':
                      case 'REJECTED':
                        return { bg: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' };
                      default:
                        return { bg: '#F1F5F9', color: '#475569', borderColor: '#CBD5E1' };
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
                      <Typography fontSize="15px" fontWeight="600" color="mukuru.text.primary">
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
                          borderBottom={index < overviewFields.length - 1 ? '1px solid' : 'none'}
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
                                    {field.type === 'File' || field.type === 'file' ? (
                                      <DynamicFieldRenderer
                                        field={field}
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
                    bg={currentStep === step.id ? 'mukuru.buttons.primary' : currentStep > step.id ? '#D1FAE5' : 'white'}
                    border="2px solid"
                    borderColor={currentStep === step.id ? 'mukuru.buttons.primary' : currentStep > step.id ? '#059669' : 'mukuru.grey.light'}
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
                onClick={() => setCurrentStep(Math.min(adminSteps.length, currentStep + 1))}
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
                <Box p="16px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="#FAFBFC">
                  <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                    Quick Summary
                  </Typography>
                </Box>
                <VStack gap="0" align="stretch">
                  <Flex p="14px 16px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light">
                    <HStack gap="10px">
                      <Box p="8px" borderRadius="8px" bg="#DBEAFE">
                        <FiFileText size={14} color="#1D4ED8" />
                      </Box>
                      <Typography fontSize="13px" color="mukuru.grey.mediumDark">Documents</Typography>
                    </HStack>
                    <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                      {application.documents?.length || 0}
                    </Typography>
                  </Flex>
                  <Flex p="14px 16px" justify="space-between" align="center" borderBottom="1px solid" borderColor="mukuru.grey.light">
                    <HStack gap="10px">
                      <Box p="8px" borderRadius="8px" bg="#FEF3C7">
                        <FiCheckSquare size={14} color="#D97706" />
                      </Box>
                      <Typography fontSize="13px" color="mukuru.grey.mediumDark">Risk Score</Typography>
                    </HStack>
                    <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                      {application.riskScore || 'N/A'}
                    </Typography>
                  </Flex>
                  <Flex p="14px 16px" justify="space-between" align="center">
                    <HStack gap="10px">
                      <Box p="8px" borderRadius="8px" bg="#D1FAE5">
                        <FiUsers size={14} color="#059669" />
                      </Box>
                      <Typography fontSize="13px" color="mukuru.grey.mediumDark">Sections</Typography>
                    </HStack>
                    <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
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
                <Box p="16px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="#FAFBFC">
                  <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                    Quick Actions
                  </Typography>
                </Box>
                <VStack gap="8px" p="16px" align="stretch">
                  <Button variant="primary" size="sm" w="full" onClick={() => setIsStatusModalOpen(true)}>
                    <IconWrapper><FiEdit3 size={14} /></IconWrapper>
                    Update Status
                  </Button>
                  <Button variant="secondary" size="sm" w="full" onClick={() => setIsCommentModalOpen(true)}>
                    <IconWrapper><FiMessageSquare size={14} /></IconWrapper>
                    Add Comment
                  </Button>
                  <Button variant="secondary" size="sm" w="full" onClick={handleExportData} disabled={isExporting}>
                    <IconWrapper><FiDownload size={14} /></IconWrapper>
                    {isExporting ? 'Exporting...' : 'Export Data'}
                  </Button>
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
                <Box p="16px" borderBottom="1px solid" borderColor="mukuru.grey.light" bg="#FAFBFC">
                  <Typography fontSize="14px" fontWeight="600" color="mukuru.text.primary">
                    Activity Timeline
                  </Typography>
                </Box>
                <VStack gap="0" align="stretch" p="16px">
                  <HStack gap="12px" align="start">
                    <Box w="8px" h="8px" borderRadius="full" bg="mukuru.buttons.primary" mt="6px" />
                    <VStack align="start" gap="2px" flex="1">
                      <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                        Application Submitted
                      </Typography>
                      <Typography fontSize="12px" color="mukuru.grey.medium">
                        {formatDateShort(new Date(application.created))}
                      </Typography>
                    </VStack>
                  </HStack>
                  {application.updated !== application.created && (
                    <HStack gap="12px" align="start" mt="12px">
                      <Box w="8px" h="8px" borderRadius="full" bg="#10B981" mt="6px" />
                      <VStack align="start" gap="2px" flex="1">
                        <Typography fontSize="13px" fontWeight="500" color="mukuru.text.primary">
                          Last Updated
                        </Typography>
                        <Typography fontSize="12px" color="mukuru.grey.medium">
                          {formatDateShort(new Date(application.updated))}
                        </Typography>
                      </VStack>
                    </HStack>
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
                <FiMessageSquare size={16} color="mukuru.primary" />
              </IconWrapper>
            </Box>
            <VStack align="start" gap="0">
              <Typography fontSize="lg" fontWeight="700" color="mukuru.text.primary">
                Add Comment
              </Typography>
              <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0.5">
                Add a comment or note to this application
              </Typography>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalBody>
          <Field.Root>
            <Field.Label
              fontSize="sm"
              fontWeight="600"
              color="mukuru.text.primary"
              mb="2"
            >
              Comment
            </Field.Label>
            <Textarea
              placeholder="Enter your comment here..."
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              rows={6}
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
