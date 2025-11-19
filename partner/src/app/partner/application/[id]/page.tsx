"use client";

import { useParams, useRouter } from "next/navigation";
import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Flex,
  Image,
  Circle,
  SimpleGrid,
  Icon,
  Button,
  Spinner,
  Badge,
  IconButton,
  Input,
  Tag,
  TagLabel,
  Heading
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
  FiClock,
  FiSave,
  FiEdit3,
  FiMail,
  FiMapPin,
  FiGlobe,
  FiCalendar,
  FiBriefcase,
  FiShield,
  FiUser,
  FiDownload,
  FiPrinter,
  FiCreditCard,
  FiActivity,
  FiAlertCircle,
  FiMessageSquare
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { FileUpload } from "../../../../components/FileUpload";
import { uploadToGoogleDrive } from "../../../../lib/googleDriveUpload";
import { entityConfigApiService, EntityType, Requirement } from "@/services/entityConfigApi";
import { EnhancedDynamicForm } from "@/components/EnhancedDynamicForm";
import { FormField, EntityFormConfig } from "@/lib/entityFormConfigs";
import { getAuthUser } from "@/lib/auth/session";
import { SweetAlert } from "@/utils/sweetAlert";
import { SchemaDrivenView } from "@/components/SchemaDrivenView";
import { findUserCaseByEmail, generateUserIdFromEmail } from "@/lib/api";

const MotionBox = motion(Box);

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email?: string; partnerId?: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [entityTypeConfig, setEntityTypeConfig] = useState<EntityType | null>(null);
  const [formSchema, setFormSchema] = useState<any>(null); // Store the form schema from API

  // Form data state for editing - will be populated from application metadata
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Update form data when application loads - populate from metadata and raw data
  useEffect(() => {
    if (application) {
      const initialData: Record<string, any> = {
        // Add raw data fields
        applicantFirstName: application.rawData?.applicantFirstName || '',
        applicantLastName: application.rawData?.applicantLastName || '',
        applicantEmail: application.rawData?.applicantEmail || '',
        businessLegalName: application.rawData?.businessLegalName || '',
        ...application.metadata // Include all metadata fields
      };
      setFormData(initialData);
    }
  }, [application]);

  // Fetch entity configuration from backend (only if not already provided by API)
  useEffect(() => {
    const fetchEntityConfig = async () => {
      // If we already have formSchema from the API, use it instead of fetching
      if (formSchema) {
        console.log('Using form schema from API response, skipping separate fetch');
        return;
      }
      
      if (!application?.entityType || application.entityType === 'Individual') {
        return; // Skip for Individual type
      }
      
      try {
        // Clean and normalize entity type code to match database format
        const rawCode = application.entityTypeCode || application.entityType;
        if (!rawCode) {
          console.warn('No entity type code available for lookup');
          return;
        }
        
        // Clean up duplicated values
        const cleanValue = (value: any): string | null => {
          if (!value) return null;
          const str = String(value).trim();
          if (!str || str === 'null' || str === 'undefined') return null;
          // If comma-separated, take the first value
          if (str.includes(',')) {
            return str.split(',')[0].trim();
          }
          return str;
        };
        
        const cleanedCode = cleanValue(rawCode);
        if (!cleanedCode) {
          console.warn('Entity type code is empty after cleaning');
          return;
        }
        
        // Normalize entity type code to match database format
        const normalizedCode = cleanedCode.toLowerCase()
          .replace(/\s+/g, '_')
          .replace('business', 'company')
          .replace('individual', 'sole_proprietor');
        
        console.log(`[Frontend] Looking up entity config for code: "${normalizedCode}" (original: "${rawCode}")`);
        
        // Try to get entity type by code from the API
        const config = await entityConfigApiService.getEntityTypeByCode(normalizedCode, true);
        
        if (config) {
          console.log('Found entity config from database (fallback fetch):', config);
          setEntityTypeConfig(config);
        } else {
          // If not found by code, try searching in the list
          const entities = await entityConfigApiService.getEntityTypes(false, true);
          const foundConfig = entities.find(e => 
            e.code.toLowerCase() === normalizedCode ||
            e.displayName?.toLowerCase() === application.entityType.toLowerCase()
          );
          
          if (foundConfig) {
            console.log('Found entity config from list (fallback fetch):', foundConfig);
            setEntityTypeConfig(foundConfig);
          } else {
            console.warn('No entity configuration found in database for entity type:', application.entityType, '(normalized:', normalizedCode, ')');
            // Don't set mock data - let the UI handle the missing config gracefully
          }
        }
      } catch (error) {
        console.error('Error fetching entity config from database:', error);
        // Don't use mock data - show error or handle gracefully
        // The UI should handle the case when entityTypeConfig is null
      }
    };

    if (application && !formSchema) {
      fetchEntityConfig();
    }
  }, [application, formSchema]);

  // Get current logged-in user
  useEffect(() => {
    const user = getAuthUser();
    if (user?.email) {
      const partnerId = generateUserIdFromEmail(user.email);
      setCurrentUser({ email: user.email, partnerId });
      console.log('👤 Current logged-in user:', { email: user.email, partnerId });
    }
  }, []);

  // Fetch application details
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        // Get the logged-in user
        const user = getAuthUser();
        if (!user?.email) {
          setError('You must be logged in to view application details');
          setLoading(false);
          return;
        }

        const userEmail = user.email;
        const userPartnerId = generateUserIdFromEmail(userEmail);
        console.log('🔍 Fetching application for logged-in user:', { email: userEmail, partnerId: userPartnerId });

        // If no case ID in URL, find the user's application by email
        let caseIdToFetch = params.id as string;
        if (!caseIdToFetch) {
          console.log('📧 No case ID in URL, searching for user application by email...');
          const userCase = await findUserCaseByEmail(userEmail);
          if (userCase) {
            caseIdToFetch = userCase.caseId;
            console.log('✅ Found user application:', caseIdToFetch);
            // Update URL to include the case ID
            router.replace(`/partner/application/${caseIdToFetch}`);
          } else {
            setError('No application found for your account. Please submit an application first.');
            setLoading(false);
            return;
          }
        }

        // SECURITY: Tokens are now handled server-side by the proxy
        // The proxy will automatically inject the Authorization header from Redis
        // DO NOT pass tokens from the frontend - use the proxy endpoint
        
        // Fetch from our API route that has the REAL data
        // The proxy will automatically inject the Authorization header from the session cookie
        const response = await fetch(`/api/proxy/api/v1/cases/${caseIdToFetch}/details`, {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include session cookie
        });
        console.log('API Response status:', response.status);
        
        const data = await response.json();
        
        // Check if this is an error response
        if (!response.ok) {
          // Handle 403 Forbidden (ownership mismatch) specially
          if (response.status === 403) {
            console.warn('⚠️ Access denied by API - ownership mismatch');
            // Try to find the user's actual application
            const userCase = await findUserCaseByEmail(userEmail);
            if (userCase && userCase.caseId !== caseIdToFetch) {
              // Verify the found case actually belongs to the user
              const foundCasePartnerId = userCase.partnerId;
              if (foundCasePartnerId && foundCasePartnerId.toLowerCase() === userPartnerId.toLowerCase()) {
                console.log('✅ Found user\'s actual application, redirecting...', {
                  from: caseIdToFetch,
                  to: userCase.caseId
                });
                router.replace(`/partner/application/${userCase.caseId}`);
                return;
              } else {
                console.warn('⚠️ Found case also has ownership mismatch, cannot redirect');
                setError('This application does not belong to your account. Access denied.');
                setLoading(false);
                return;
              }
            } else if (userCase && userCase.caseId === caseIdToFetch) {
              // Same case ID - this shouldn't happen, but handle gracefully
              console.warn('⚠️ Ownership mismatch for the same case ID - possible data inconsistency');
              setError('This application does not belong to your account. Access denied.');
              setLoading(false);
              return;
            } else {
              setError('This application does not belong to your account. Access denied.');
              setLoading(false);
              return;
            }
          }
          
          // Try to extract detailed error message for other errors
          const errorMessage = data.details || data.error || 'Failed to fetch application details';
          const errorDetails = data.serviceUrls 
            ? `Backend services at ${data.serviceUrls.projectionsApi} or ${data.serviceUrls.onboardingApi} are not available. Please ensure the services are running.`
            : errorMessage;
          
          throw new Error(errorDetails);
        }
        
        // Validate ownership - ensure this application belongs to the logged-in user
        const casePartnerId = data.partnerId || data.partner_id;
        if (casePartnerId && userPartnerId && casePartnerId.toLowerCase() !== userPartnerId.toLowerCase()) {
          console.warn('⚠️ Application ownership mismatch:', {
            casePartnerId,
            userPartnerId,
            caseId: caseIdToFetch
          });
          // Try to find the user's actual application
          const userCase = await findUserCaseByEmail(userEmail);
          if (userCase && userCase.caseId !== caseIdToFetch) {
            // Verify the found case actually belongs to the user
            const foundCasePartnerId = userCase.partnerId;
            if (foundCasePartnerId && foundCasePartnerId.toLowerCase() === userPartnerId.toLowerCase()) {
              console.log('✅ Found user\'s actual application, redirecting...', {
                from: caseIdToFetch,
                to: userCase.caseId
              });
              router.replace(`/partner/application/${userCase.caseId}`);
              return;
            } else {
              console.warn('⚠️ Found case also has ownership mismatch, cannot redirect');
              setError('This application does not belong to your account. Access denied.');
              setLoading(false);
              return;
            }
          } else if (userCase && userCase.caseId === caseIdToFetch) {
            // Same case ID - this shouldn't happen, but handle gracefully
            console.warn('⚠️ Ownership mismatch for the same case ID - possible data inconsistency');
            setError('This application does not belong to your account. Access denied.');
            setLoading(false);
            return;
          } else {
            setError('This application does not belong to your account. Access denied.');
            setLoading(false);
            return;
          }
        }
        
        console.log('✅ Application ownership validated. Application data:', data);
        console.log('Form schema from API:', data.formSchema);
        console.log('Form config ID:', data.formConfigId);
        console.log('Form version:', data.formVersion);
        console.log('Entity type code:', data.entityTypeCode);
        
        // Clean up duplicated values from API response
        const cleanValue = (value: any): string | null => {
          if (!value) return null;
          const str = String(value).trim();
          if (!str || str === 'null' || str === 'undefined') return null;
          // If comma-separated, take the first value
          if (str.includes(',')) {
            return str.split(',')[0].trim();
          }
          return str;
        };
        
        const cleanedFormConfigId = cleanValue(data.formConfigId);
        const cleanedFormVersion = cleanValue(data.formVersion);
        const cleanedEntityTypeCode = cleanValue(data.entityTypeCode);
        
        // Store the form schema if provided
        if (data.formSchema) {
          setFormSchema(data.formSchema);
          // Also set as entityTypeConfig for compatibility with existing code
          // The formSchema from API should have requirements array
          setEntityTypeConfig(data.formSchema);
          console.log('✅ Form schema stored for rendering. Requirements count:', data.formSchema?.requirements?.length || 0);
        } else {
          console.warn('⚠️ No form schema in API response. formConfigId:', cleanedFormConfigId, 'entityTypeCode:', cleanedEntityTypeCode);
          // Clear formSchema state to trigger fallback fetch
          setFormSchema(null);
          setEntityTypeConfig(null);
        }
        
        // Extract core case data - API returns structured caseData
        const caseData = data.caseData || {};
        
        // Extract metadata - can be in caseData.metadata or data.metadata or data.metadataJson
        let metadata = {};
        if (caseData.metadata) {
          metadata = typeof caseData.metadata === 'string' ? JSON.parse(caseData.metadata) : caseData.metadata;
        } else if (data.metadata) {
          metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
        } else if (data.metadataJson) {
          metadata = typeof data.metadataJson === 'string' ? JSON.parse(data.metadataJson) : data.metadataJson;
        }
        
        // Ensure metadata is an object
        if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
          metadata = {};
        }
        
        console.log('📊 Application Data Structure:');
        console.log('  - Root data keys:', Object.keys(data).slice(0, 30));
        console.log('  - caseData keys:', Object.keys(caseData));
        console.log('  - metadata keys:', Object.keys(metadata));
        console.log('  - Full metadata object:', JSON.stringify(metadata, null, 2));
        console.log('  - Actual values from caseData:', {
          businessLegalName: caseData.businessLegalName,
          applicantFirstName: caseData.applicantFirstName,
          applicantEmail: caseData.applicantEmail,
          businessCountryOfRegistration: caseData.businessCountryOfRegistration,
          businessRegistrationNumber: caseData.businessRegistrationNumber
        });
        console.log('  - Actual values from root data:', {
          businessLegalName: data.businessLegalName,
          applicantFirstName: data.applicantFirstName,
          applicantEmail: data.applicantEmail,
          businessCountryOfRegistration: data.businessCountryOfRegistration,
          businessRegistrationNumber: data.businessRegistrationNumber
        });
        console.log('  - Root data full sample:', {
          id: data.id,
          caseId: data.caseId || data.case_number,
          status: data.status,
          type: data.type,
          ...Object.fromEntries(Object.entries(data).slice(0, 20))
        });
        
        // Use caseData if available, otherwise fall back to root data
        const effectiveData = Object.keys(caseData).length > 0 ? caseData : data;
        
        // Build comprehensive rawData from all available sources
        // Include both structured caseData and root data fields, plus metadata fallbacks
        const comprehensiveRawData = {
          // From caseData (structured fields)
          ...caseData,
          // From root data (direct fields from Projections API)
          ...data,
          // Ensure all common fields are available with fallbacks from multiple sources
          businessLegalName: caseData.businessLegalName || data.businessLegalName || (metadata as any)?.legal_name || (metadata as any)?.businessLegalName || (metadata as any)?.companyname || '',
          applicantFirstName: caseData.applicantFirstName || data.applicantFirstName || (metadata as any)?.applicant_first_name || '',
          applicantLastName: caseData.applicantLastName || data.applicantLastName || (metadata as any)?.applicant_last_name || '',
          applicantEmail: caseData.applicantEmail || data.applicantEmail || (metadata as any)?.applicant_email || (metadata as any)?.email || '',
          applicantPhone: caseData.applicantPhone || data.applicantPhone || (metadata as any)?.applicant_phone || (metadata as any)?.phone || '',
          businessRegistrationNumber: caseData.businessRegistrationNumber || data.businessRegistrationNumber || (metadata as any)?.registration_number || '',
          businessCountryOfRegistration: caseData.businessCountryOfRegistration || data.businessCountryOfRegistration || (metadata as any)?.country_of_incorporation || (metadata as any)?.countryOfIncorporation || '',
          businessAddress: caseData.businessAddress || data.businessAddress || (metadata as any)?.business_address || '',
          businessIndustry: caseData.businessIndustry || data.businessIndustry || (metadata as any)?.business_industry || '',
          businessTaxId: caseData.businessTaxId || data.businessTaxId || (metadata as any)?.tax_id || '',
        };
        
        console.log('📦 Comprehensive rawData sample:', {
          businessLegalName: comprehensiveRawData.businessLegalName,
          applicantFirstName: comprehensiveRawData.applicantFirstName,
          applicantEmail: comprehensiveRawData.applicantEmail,
          businessRegistrationNumber: comprehensiveRawData.businessRegistrationNumber,
          businessCountryOfRegistration: comprehensiveRawData.businessCountryOfRegistration,
          'metadata.companyname': (metadata as any)?.companyname,
          'metadata.legal_name': (metadata as any)?.legal_name,
          'metadata.full_name': (metadata as any)?.full_name,
        });
        
        setApplication({
          id: data.caseId || data.id,
          status: data.status || 'InProgress',
          submissionDate: data.createdAt || data.created_at || new Date().toISOString(),
          companyName: comprehensiveRawData.businessLegalName || 
                      `${comprehensiveRawData.applicantFirstName || ''} ${comprehensiveRawData.applicantLastName || ''}`.trim() || 
                      (metadata as any)?.['full_name'] || 
                      (metadata as any)?.companyName || 
                      (metadata as any)?.legal_name ||
                      'Not provided',
          entityType: cleanedEntityTypeCode || effectiveData.entityType || data.type || data.entityType || 'Private Company',
          entityTypeCode: cleanedEntityTypeCode,
          country: comprehensiveRawData.businessCountryOfRegistration || 
                   comprehensiveRawData.applicantCountry ||
                   (metadata as any)?.country_of_incorporation ||
                   (metadata as any)?.countryOfIncorporation ||
                   '',
          email: comprehensiveRawData.applicantEmail || (metadata as any)?.email || (metadata as any)?.contact_email || '',
          applicantName: `${comprehensiveRawData.applicantFirstName || ''} ${comprehensiveRawData.applicantLastName || ''}`.trim() || 
                        (metadata as any)?.['full_name'] || 
                        (metadata as any)?.applicant_name ||
                        '',
          metadata: metadata,
          rawData: comprehensiveRawData,
          formConfigId: cleanedFormConfigId,
          formVersion: cleanedFormVersion
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching application:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch application';
        setError(errorMessage);
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchApplication();
    }
  }, [params.id]);

  // Convert backend requirement to form field (same logic as enhanced form)
  const convertRequirementToFormField = (requirement: Requirement, isRequired: boolean, displayOrder?: number): FormField => {
    const fieldType = requirement.fieldType?.toLowerCase() || 'text';
    
    // Map backend field types to form field types
    const typeMapping: Record<string, FormField['type']> = {
      'string': 'text',
      'text': 'text',
      'email': 'email',
      'phone': 'tel',
      'tel': 'tel',
      'url': 'url',
      'number': 'number',
      'date': 'date',
      'textarea': 'textarea',
      'select': 'select',
      'dropdown': 'select',
      'checkbox': 'checkbox',
      'radio': 'radio',
      'file': 'file',
      'multiline': 'textarea',
      'boolean': 'checkbox'
    };
    
    const mappedType = typeMapping[fieldType] || 'text';
    
    // Special handling for country fields
    let options = requirement.options?.map(opt => ({
      value: opt.value,
      label: opt.value,
      disabled: false
    }));
    
    // If this is a country field and has no options, provide default countries
    if ((requirement.code.toLowerCase().includes('country') || 
         requirement.displayName?.toLowerCase().includes('country')) && 
        mappedType === 'select' && 
        (!options || options.length === 0)) {
      options = [
        { value: 'South Africa', label: 'South Africa', disabled: false },
        { value: 'Kenya', label: 'Kenya', disabled: false },
        { value: 'Nigeria', label: 'Nigeria', disabled: false },
        { value: 'Ghana', label: 'Ghana', disabled: false },
        { value: 'Zimbabwe', label: 'Zimbabwe', disabled: false },
        { value: 'Zambia', label: 'Zambia', disabled: false },
        { value: 'Tanzania', label: 'Tanzania', disabled: false },
        { value: 'Uganda', label: 'Uganda', disabled: false },
        { value: 'Rwanda', label: 'Rwanda', disabled: false },
        { value: 'Mauritius', label: 'Mauritius', disabled: false }
      ];
    }
    
    return {
      id: requirement.code,
      label: requirement.displayName || requirement.code,
      type: mappedType,
      required: isRequired,
      placeholder: requirement.helpText || `Enter ${requirement.displayName || requirement.code}`,
      description: requirement.description || requirement.helpText,
      options: options,
      validation: requirement.validationRules ? {
        pattern: (requirement.validationRules as any).pattern,
        min: (requirement.validationRules as any).minLength,
        max: (requirement.validationRules as any).maxLength
      } : undefined,
      order: displayOrder
    };
  };

  // Handle field change for dynamic form
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Handle step completion 
  const handleStepComplete = (stepId: string) => {
    console.log('Step completed:', stepId);
  };

  // Save draft functionality
  const handleSaveDraft = async () => {
    // Here you would typically save to your backend
    console.log('Saving draft:', formData);
    
    // For now, just show a success message
    await SweetAlert.success('Draft Saved', 'Draft saved successfully! You can continue later.');
    
    // Exit edit mode
    setIsEditing(false);
  };

  // Handle edit toggle with save functionality
  const handleEditToggle = async () => {
    if (isEditing) {
      // If currently editing, save the changes
      setSaving(true);
      try {
        const applicationId = params.id as string;
        if (!applicationId) {
          throw new Error('Application ID is required');
        }

        // Determine if it's a GUID or case number
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isGuid = guidRegex.test(applicationId);
        
        // Build the update payload from form data
        const updatePayload: any = {
          metadata: formData,
        };

        // If we have structured data, include it
        if (formData.applicantFirstName || formData.applicantLastName) {
          updatePayload.applicant = {
            first_name: formData.applicantFirstName,
            last_name: formData.applicantLastName,
            email: formData.applicantEmail || application?.rawData?.applicantEmail,
            phone_number: formData.applicantPhone || application?.rawData?.applicantPhone,
          };
        }

        if (formData.businessLegalName) {
          updatePayload.business = {
            legal_name: formData.businessLegalName,
            registration_number: formData.businessRegistrationNumber,
            tax_id: formData.businessTaxId,
          };
        }

        // Call backend API to update the application
        const endpoint = isGuid 
          ? `/api/proxy/api/v1/cases/${applicationId}`
          : `/api/proxy/api/v1/cases/by-number/${encodeURIComponent(applicationId)}`;
        
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Failed to save application: ${response.status}`);
        }

        const updatedData = await response.json();
        
        // Update local state with the response
        if (updatedData) {
          setApplication((prev: any) => ({
            ...prev,
            ...updatedData,
            metadata: { ...prev?.metadata, ...formData },
            rawData: { ...prev?.rawData, ...updatePayload.applicant, ...updatePayload.business },
          }));
        }

        await SweetAlert.success('Application Updated', 'Your application has been saved successfully!');
        setIsEditing(false);
      } catch (err) {
        console.error('Error saving application:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to save application. Please try again.';
        await SweetAlert.error('Save Failed', errorMessage);
      } finally {
        setSaving(false);
      }
    } else {
      // If not editing, enter edit mode
      setIsEditing(true);
    }
  };

  // Generate step configuration from entity type
  const generateStepsFromConfig = useMemo(() => {
    // Prioritize formSchema if available (from API), otherwise use entityTypeConfig (from fallback fetch)
    const configToUse = formSchema || entityTypeConfig;
    
    if (!configToUse || !configToUse.requirements || configToUse.requirements.length === 0) {
      // Default fallback for Individual or when no config
      if (!application || application.entityType === 'Individual') {
        // Check what data we have to determine completed steps
        const hasBasicInfo = !!(application?.rawData?.applicantFirstName || application?.metadata?.full_name);
        const hasAddress = !!(application?.rawData?.applicantAddress || application?.metadata?.address);
        const hasDocuments = !!(application?.metadata?.id_document || application?.metadata?.documents);
        
      return [
      {
            id: 0, 
        title: "Entity Type",
            subtitle: "Individual Application", 
        icon: FiFileText,
        completed: true
          },
          { 
            id: 1, 
            title: "Personal Information", 
            subtitle: "Name and contact details", 
            icon: FiHome, 
            completed: hasBasicInfo 
          },
          { 
            id: 2, 
            title: "Address Verification", 
            subtitle: "Residential address", 
            icon: FiHome, 
            completed: hasAddress 
          },
          { 
            id: 3, 
            title: "Identity Documents", 
            subtitle: "ID and proof documents", 
            icon: FiFolder, 
            completed: hasDocuments 
          }
        ];
      }
      // Default for other entity types
      return [
        { id: 0, title: "Entity Type", subtitle: "Business Information", icon: FiFileText, completed: true },
        { id: 1, title: "Business Information", subtitle: "Company details", icon: FiHome, completed: false },
        { id: 2, title: "Registration & Legal", subtitle: "Legal documentation", icon: FiCheckSquare, completed: false },
        { id: 3, title: "Ownership & Control", subtitle: "Shareholder information", icon: FiUsers, completed: false },
        { id: 4, title: "Management & Directors", subtitle: "Board information", icon: FiUserCheck, completed: false },
        { id: 5, title: "Documents", subtitle: "Required documentation", icon: FiFolder, completed: false }
      ];
    }

    // Group requirements by type
    const requirementsByType = new Map<string, typeof configToUse.requirements>();
    configToUse.requirements.forEach((etReq: any) => {
      if (etReq.requirement) {
        const type = etReq.requirement.type;
        if (!requirementsByType.has(type)) {
          requirementsByType.set(type, []);
        }
        requirementsByType.get(type)!.push(etReq);
      }
    });

    // Base step - always have Entity Type
    const baseStep = {
      id: 0,
        title: "Entity Type",
      subtitle: configToUse.displayName || configToUse.code || "Application Type", 
        icon: FiFileText,
        completed: true
    };

    // Define the step mapping with proper icons
    const stepTypeMapping: Record<string, { title: string; subtitle: string; icon: any }> = {
      'Information': { title: 'Business Information', subtitle: 'Company details', icon: FiHome },
      'ProofOfAddress': { title: 'Address Verification', subtitle: 'Business address', icon: FiMapPin },
      'ProofOfIdentity': { title: 'Identity Verification', subtitle: 'Identity documents', icon: FiShield },
      'OwnershipStructure': { title: 'Ownership & Control', subtitle: 'Shareholder information', icon: FiUsers },
      'BoardDirectors': { title: 'Management & Directors', subtitle: 'Board information', icon: FiUserCheck },
      'AuthorizedSignatories': { title: 'Authorized Signatories', subtitle: 'Signing authorities', icon: FiCreditCard },
      'Document': { title: 'Additional Documents', subtitle: 'Supporting documentation', icon: FiFolder }
    };

    // Create dynamic steps from requirements
    const dynamicSteps = Array.from(requirementsByType.keys())
      .map((type, index) => {
        const mapping = stepTypeMapping[type];
        if (!mapping) return null;
        
        const requirements = requirementsByType.get(type) || [];
        const hasRequiredData = requirements.some((req: any) => {
          if (!req.requirement) return false;
          const fieldCode = req.requirement.code;
          return !!(application?.rawData?.[fieldCode] || application?.metadata?.[fieldCode]);
        });

        return {
          id: index + 1,
          title: mapping.title,
          subtitle: mapping.subtitle,
          icon: mapping.icon,
          completed: hasRequiredData,
          requirements: requirements
        };
      })
      .filter(step => step !== null);

    return [baseStep, ...dynamicSteps];
  }, [formSchema, entityTypeConfig, application]);

  const steps = generateStepsFromConfig;

  // Generate dynamic form configuration from entity type
  const dynamicFormConfig = useMemo(() => {
    if (!entityTypeConfig || !entityTypeConfig.requirements) {
      return null;
    }

    // Group requirements by type to create steps
    const requirementsByType = new Map<string, typeof entityTypeConfig.requirements>();
    entityTypeConfig.requirements.forEach(etReq => {
      if (etReq.requirement) {
        const type = etReq.requirement.type;
        if (!requirementsByType.has(type)) {
          requirementsByType.set(type, []);
        }
        requirementsByType.get(type)!.push(etReq);
      }
    });

    // Convert requirements to form fields for current step
    const currentStepType = steps[currentStep]?.title;
    let currentStepRequirements: typeof entityTypeConfig.requirements = [];
    
    // Map step title to requirement type
    const stepToTypeMap: Record<string, string> = {
      'Entity Type': 'Information',
      'Personal Information': 'Information',
      'Business Information': 'Information',
      'Identity Verification': 'ProofOfIdentity',
      'Address Verification': 'ProofOfAddress',
      'Ownership & Control': 'OwnershipStructure',
      'Management & Directors': 'BoardDirectors',
      'Authorized Signatories': 'AuthorizedSignatories',
      'Identity Documents': 'Document',
      'Additional Documents': 'Document'
    };
    
    const requirementType = stepToTypeMap[currentStepType] || 'Information';
    currentStepRequirements = requirementsByType.get(requirementType) || [];

    // Convert to form fields
    const fields = currentStepRequirements
      .filter(req => req.requirement)
      .map((req, index) => convertRequirementToFormField(
        req.requirement!,
        req.isRequired || false,
        req.displayOrder || index
      ))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return {
      entityType: entityTypeConfig.code,
      displayName: entityTypeConfig.displayName || entityTypeConfig.code,
      description: entityTypeConfig.description || '',
      steps: [{
        id: `step_${currentStep}`,
        title: currentStepType,
        subtitle: steps[currentStep]?.subtitle || '',
        fields: fields,
        requiredDocuments: []
      }],
      requiredDocuments: []
    } as EntityFormConfig;
  }, [entityTypeConfig, currentStep, steps]);

  // Calculate actual completion based on what data exists
  const calculateActualCompletion = () => {
    if (!application) return 0;
    
    const rawData = application.rawData || {};
    const metadata = application.metadata || {};
    
    // Check which fields have values
    const fields = [
      rawData.applicantFirstName,
      rawData.applicantLastName,
      rawData.applicantEmail,
      rawData.businessLegalName,
      rawData.businessCountryOfRegistration,
      metadata.full_name,
      metadata.address,
      metadata.phone,
      metadata.company_registration,
      metadata.tax_number
    ];
    
    const filledFields = fields.filter(f => f && f !== '').length;
    return Math.min((filledFields / 10) * 100, 100);
  };

  const [calculatedCompletion, setCalculatedCompletion] = useState(0);
  
  useEffect(() => {
    setCalculatedCompletion(calculateActualCompletion());
  }, [application]);

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const stepCompletion = Math.round((completedSteps / totalSteps) * 100);

  // Get status color helper
  const getStatusColor = (status: string) => {
    const statusUpper = (status || '').toUpperCase();
    if (statusUpper.includes('COMPLETE') || statusUpper.includes('APPROVED')) return 'green';
    if (statusUpper.includes('PROGRESS') || statusUpper.includes('REVIEW')) return 'blue';
    if (statusUpper.includes('SUBMITTED')) return 'blue';
    if (statusUpper.includes('DECLINED') || statusUpper.includes('REJECTED')) return 'red';
    return 'orange';
  };

  // Helper function to map data (same as in SchemaDrivenView)
  // Must be defined before useMemo hooks that use it
  const mapDataToFieldValue = (fieldCode: string, applicationData: Record<string, any>): any => {
    const metadata = applicationData.metadata || {};
    const rawData = applicationData.rawData || {};
    const code = fieldCode.toUpperCase();
    
    // Try metadata first
    const variations = [code, code.toLowerCase(), fieldCode, fieldCode.toLowerCase()];
    for (const variation of variations) {
      if (metadata[variation] !== undefined && metadata[variation] !== null && metadata[variation] !== '') {
        return metadata[variation];
      }
      if (rawData[variation] !== undefined && rawData[variation] !== null && rawData[variation] !== '') {
        return rawData[variation];
      }
    }
    
    // Try camelCase
    const camelCase = fieldCode.toLowerCase().split(/[_\s-]/).map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
    
    if (metadata[camelCase] !== undefined && metadata[camelCase] !== null && metadata[camelCase] !== '') {
      return metadata[camelCase];
    }
    if (rawData[camelCase] !== undefined && rawData[camelCase] !== null && rawData[camelCase] !== '') {
      return rawData[camelCase];
    }
    
    return null;
  };

  // Helper function to format field value
  // Must be defined before useMemo hooks that use it
  const formatFieldValue = (value: any, fieldType: string, options?: Array<{ value: string; label: string }>): string => {
    if (value === null || value === undefined || value === '') {
      return 'Not provided';
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (fieldType === 'MultiSelect' && options) {
        return value.map((val: string) => {
          const option = options.find(opt => opt.value === val);
          return option?.label || val;
        }).join(', ');
      }
      return value.join(', ');
    }
    
    // Handle objects
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Handle dates
    if (fieldType === 'Date' && value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch (e) {
        // Invalid date, return as-is
      }
    }
    
    // Handle select options
    if (fieldType === 'Select' && options) {
      const option = options.find(opt => opt.value === String(value));
      if (option) {
        return option.label;
      }
    }
    
    // Handle currency
    if (fieldType === 'Currency' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
    
    return String(value);
  };

  // Generate steps dynamically from schema requirements
  // Fully schema-driven - uses requirement order from database
  const schemaSteps = useMemo(() => {
    if (!formSchema || !formSchema.requirements) {
      return [];
    }

    // Group requirements by type to create steps
    // Maintain the order as they appear in the schema
    const stepMap = new Map<string, { 
      id: number; 
      type: string;
      title: string; 
      subtitle: string; 
      icon: any; 
      requirements: any[];
      firstOrder: number; // Order of first requirement of this type
    }>();
    
    let stepId = 1;

    formSchema.requirements.forEach((req: any, index: number) => {
      if (!req.requirement) return;
      
      const reqType = req.requirement.type || 'Information';
      
      if (!stepMap.has(reqType)) {
        // Get step metadata from requirement type
        // Format the type name for display (e.g., "ProofOfIdentity" -> "Proof Of Identity")
        const formatTypeName = (type: string): string => {
          return type
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        };
        
        const stepTitle = formatTypeName(reqType);
        // Subtitle can come from requirement description or be empty
        const stepSubtitle = '';
        
        // Icon mapping - minimal, can be extended from schema if icon field exists
        const iconMap: Record<string, any> = {
          'Information': FiFileText,
          'ProofOfIdentity': FiShield,
          'ProofOfAddress': FiMapPin,
          'OwnershipStructure': FiUsers,
          'BoardDirectors': FiUserCheck,
          'AuthorizedSignatories': FiCreditCard,
          'Document': FiFolder,
        };
        
        stepMap.set(reqType, {
          id: stepId++,
          type: reqType,
          title: stepTitle,
          subtitle: stepSubtitle,
          icon: iconMap[reqType] || FiFileText,
          requirements: [],
          firstOrder: index, // Preserve order from schema
        });
      }
      
      // Add requirement to step, maintaining order
      const step = stepMap.get(reqType)!;
      step.requirements.push(req);
      
      // Sort requirements within step by displayOrder
      step.requirements.sort((a, b) => {
        const orderA = a.displayOrder ?? a.requirement?.order ?? 0;
        const orderB = b.displayOrder ?? b.requirement?.order ?? 0;
        return orderA - orderB;
      });
    });

    // Sort steps by first occurrence order in schema (preserves database order)
    return Array.from(stepMap.values())
      .sort((a, b) => a.firstOrder - b.firstOrder);
  }, [formSchema]);

  // Get current step's requirements from schema
  // Fully schema-driven - uses requirement order from database
  const currentStepData = useMemo(() => {
    if (!schemaSteps.length || currentStep < 1 || currentStep > schemaSteps.length) {
      return null;
    }
    
    return schemaSteps[currentStep - 1]; // currentStep is 1-based
  }, [schemaSteps, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepContent = () => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return null;
    
    // For step 0 (Entity Type), show the basic entity information
    if (currentStep === 0) {
      return (
        <VStack gap="6" align="stretch">
          <HStack justify="space-between" align="center">
            <VStack gap="2" align="start">
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                Entity Type
              </Text>
              <Text color="gray.600">
                Business type information
              </Text>
            </VStack>
            <Button 
              size="sm" 
              variant={isEditing ? "solid" : "outline"}
              colorScheme={isEditing ? "green" : "blue"}
              onClick={handleEditToggle}
            >
              <Icon as={FiEdit3} mr="2" />
              {isEditing ? "Save Draft" : "Edit"}
            </Button>
          </HStack>

          {isEditing ? (
            <Box>
              {dynamicFormConfig && dynamicFormConfig.steps[0] && dynamicFormConfig.steps[0].fields.length > 0 ? (
                <EnhancedDynamicForm
                  config={dynamicFormConfig}
                  formData={formData}
                  onFieldChange={handleFieldChange}
                  onStepComplete={handleStepComplete}
                  currentStep={1}
                  onNext={() => setIsEditing(false)}
                  onPrevious={() => setIsEditing(false)}
                  onSubmit={() => setIsEditing(false)}
                  isLoading={false}
                  validationErrors={{}}
                />
              ) : (
                // Fallback: Show basic edit form if no dynamic config
                <Box p="6" bg="orange.50" borderRadius="lg" border="1px" borderColor="orange.200">
                  <VStack gap="4" align="start">
                    <Text fontWeight="semibold" color="orange.800">
                      Dynamic form configuration not available
                  </Text>
                    <Text color="orange.700" fontSize="sm">
                      The form fields for this entity type are being loaded. Please try again in a moment.
                  </Text>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      colorScheme="orange"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel Edit
                    </Button>
              </VStack>
            </Box>
          )}
            </Box>
          ) : (
        <VStack gap="6" align="stretch">
              {/* Entity Type Fields Display */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
                <VStack gap="2" align="start">
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    Company Name
                  </Text>
                  <Text fontWeight="semibold" color="gray.800">
                    {application?.companyName || 'Not provided'}
                  </Text>
                </VStack>

                <VStack gap="2" align="start">
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    Applicant Name
                  </Text>
                  <Text fontWeight="semibold" color="gray.800">
                    {application?.applicantName || 'Not provided'}
                  </Text>
                </VStack>

                <VStack gap="2" align="start">
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    Entity Type
                  </Text>
                  <Badge colorScheme="blue" fontSize="sm">
                    {application?.entityType || 'Private Company'}
                  </Badge>
              </VStack>

                <VStack gap="2" align="start">
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    Email
                  </Text>
                  <Text fontWeight="semibold" color="gray.800">
                    {application?.email || 'Not provided'}
                    </Text>
                  </VStack>

                {application?.country && (
                <VStack gap="2" align="start">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      Country
                    </Text>
                    <Text fontWeight="semibold" color="gray.800">
                      {application.country}
                    </Text>
                  </VStack>
                )}

                <VStack gap="2" align="start">
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    Submission Date
                  </Text>
                  <Text fontWeight="semibold" color="gray.800">
                    {application?.submissionDate 
                      ? new Date(application.submissionDate).toLocaleDateString() 
                      : 'Not available'}
                  </Text>
              </VStack>
            </SimpleGrid>

              {/* Dynamic Fields from Config or Metadata */}
              {entityTypeConfig?.requirements && (
                <Box>
                  <Heading size="sm" mb="4" color="gray.700">
                    Required Information
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                    {(() => {
                      // Get requirements of type 'Information' for entity type step
                      const infoRequirements = entityTypeConfig.requirements.filter(
                        req => req.requirement?.type === 'Information'
                      );
                      
                      const stepFields = infoRequirements.map(req => {
                        if (!req.requirement) return null;
                        
                        const fieldCode = req.requirement.code;
                        const fieldLabel = req.requirement.displayName || fieldCode;
                        
                        // IMPORTANT: Requirement codes are UPPERCASE in entity config, but stored lowercase in metadata
                        // Try lowercase first (standard format), then uppercase, then other variations
                        const lowerCode = fieldCode.toLowerCase();
                        const upperCode = fieldCode.toUpperCase();
                        let value = application?.metadata?.[lowerCode] ||  // Primary: lowercase (standard)
                                   application?.metadata?.[upperCode] ||    // Fallback: uppercase
                                   application?.rawData?.[fieldCode] ||     // Fallback: raw data
                                   application?.metadata?.[fieldCode] ||     // Fallback: exact match
                                   null;
                        
                        if (value === null || value === '') return null;
                        
                        // Format the value based on type
                        if (typeof value === 'boolean') {
                          value = value ? 'Yes' : 'No';
                        } else if (typeof value === 'object' && value !== null) {
                          value = JSON.stringify(value, null, 2);
                        } else if (Array.isArray(value)) {
                          value = value.join(', ');
                        }
      
      return (
                          <VStack key={fieldCode} gap="2" align="start">
                            <Text fontSize="sm" fontWeight="medium" color="gray.600">
                              {fieldLabel}
                  </Text>
                            <Text fontWeight="semibold" color="gray.800">
                              {String(value)}
                  </Text>
                </VStack>
      );
                      }).filter(field => field !== null);
                      
                      // If no configured fields have values, show all available metadata
                      if (stepFields.length === 0 && application?.metadata) {
                        return Object.entries(application.metadata).map(([key, value]) => {
                          if (!value || value === '') return null;
                          
                          // Format the key for display
                          const label = key.replace(/_/g, ' ')
                                          .replace(/([A-Z])/g, ' $1')
                                          .trim()
                                          .split(' ')
                                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                          .join(' ');
                          
                          // Format the value
                          let displayValue = value;
                          if (typeof value === 'boolean') {
                            displayValue = value ? 'Yes' : 'No';
                          } else if (typeof value === 'object' && value !== null) {
                            displayValue = JSON.stringify(value, null, 2);
                          } else if (Array.isArray(value)) {
                            displayValue = value.join(', ');
                          }
                          
      return (
                            <VStack key={key} gap="2" align="start">
                              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                {label}
                  </Text>
                              <Text fontWeight="semibold" color="gray.800">
                                {String(displayValue)}
            </Text>
                </VStack>
      );
                        }).filter(field => field !== null);
                      }
                      
                      return stepFields;
                    })()}
                  </SimpleGrid>
                </Box>
              )}

              {/* Schema-Driven Application Details */}
              <Box bg="gray.50" p="6" borderRadius="lg">
                <Heading size="sm" mb="4" color="gray.700">
                  Complete Application Details
                </Heading>
                
                {/* Use schema-driven view if schema is available */}
                {formSchema ? (
                  <SchemaDrivenView
                    schema={formSchema}
                    applicationData={{
                      metadata: application?.metadata || {},
                      rawData: application?.rawData || {},
                      // Include all application fields for comprehensive mapping
                      ...application,
                      // Explicitly include common fields that might be at different levels
                      businessLegalName: application?.rawData?.businessLegalName || application?.companyName || application?.businessLegalName,
                      applicantFirstName: application?.rawData?.applicantFirstName || application?.applicantFirstName,
                      applicantLastName: application?.rawData?.applicantLastName || application?.applicantLastName,
                      applicantEmail: application?.rawData?.applicantEmail || application?.email || application?.applicantEmail,
                      applicantPhone: application?.rawData?.applicantPhone || application?.applicantPhone,
                      businessRegistrationNumber: application?.rawData?.businessRegistrationNumber || application?.businessRegistrationNumber,
                      businessCountryOfRegistration: application?.rawData?.businessCountryOfRegistration || application?.country || application?.businessCountryOfRegistration,
                      businessAddress: application?.rawData?.businessAddress || application?.businessAddress,
                      businessIndustry: application?.rawData?.businessIndustry || application?.businessIndustry,
                    }}
                    readOnly={true}
                  />
                ) : (
                  /* Fallback to raw data display if no schema */
              <VStack gap="4" align="stretch">
                  {application?.rawData && Object.keys(application.rawData).length > 0 && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb="2">
                        Application Data
                  </Text>
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
                        {Object.entries(application.rawData).map(([key, value]) => {
                          if (!value || value === '') return null;
                          
                          const label = key.replace(/([A-Z])/g, ' $1')
                                          .trim()
                                          .split(' ')
                                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                          .join(' ');
                          
                          return (
                            <Box key={key} p="3" bg="white" borderRadius="md" borderWidth="1px">
                              <Text fontSize="xs" color="gray.500">{label}</Text>
                              <Text fontSize="sm" fontWeight="medium">{String(value)}</Text>
                            </Box>
                          );
                        })}
            </SimpleGrid>
            </Box>
          )}
                  
                  {application?.metadata && Object.keys(application.metadata).length > 0 && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb="2">
                        Additional Information
                  </Text>
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
                        {Object.entries(application.metadata).map(([key, value]) => {
                          if (!value || value === '') return null;
                          
                          const label = key.replace(/_/g, ' ')
                                          .split(' ')
                                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                          .join(' ');
                          
                          return (
                            <Box key={key} p="3" bg="white" borderRadius="md" borderWidth="1px">
                              <Text fontSize="xs" color="gray.500">{label}</Text>
                              <Text fontSize="sm" fontWeight="medium">{String(value)}</Text>
                            </Box>
                          );
                        })}
            </SimpleGrid>
                    </Box>
                  )}
                    
                    {(!application?.rawData || Object.keys(application.rawData).length === 0) &&
                     (!application?.metadata || Object.keys(application.metadata).length === 0) && (
                      <Text fontSize="sm" color="gray.500" textAlign="center" py="4">
                        No application data available to display.
                      </Text>
                  )}
              </VStack>
                )}
            </Box>
            </VStack>
          )}
        </VStack>
      );
    }

    // For other steps, show the completion status and relevant information
    const isCompleted = currentStepData?.completed || false;
    
    return (
      <VStack gap="6" align="stretch">
        <HStack justify="space-between" align="center">
          <VStack gap="2" align="start">
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              {currentStepData?.title || 'Step Content'}
            </Text>
            <Text color="gray.600">
              {currentStepData?.subtitle || 'Step description'}
            </Text>
          </VStack>
          <Button 
            size="sm" 
            variant={isEditing ? "solid" : "outline"}
            colorScheme={isEditing ? "green" : "blue"}
            onClick={handleEditToggle}
          >
            {isEditing ? "Save Draft" : "Edit"}
          </Button>
        </HStack>

        {isEditing ? (
          <Box>
            {dynamicFormConfig && dynamicFormConfig.steps[0] && dynamicFormConfig.steps[0].fields.length > 0 ? (
              <EnhancedDynamicForm
                config={dynamicFormConfig}
                formData={formData}
                onFieldChange={handleFieldChange}
                onStepComplete={handleStepComplete}
                currentStep={1}
                onNext={() => setIsEditing(false)}
                onPrevious={() => setIsEditing(false)}
                onSubmit={() => setIsEditing(false)}
                isLoading={false}
                validationErrors={{}}
              />
            ) : (
              // Fallback message if no fields configured
              <Box p="6" bg="blue.50" borderRadius="lg" border="1px" borderColor="blue.200">
              <VStack gap="4" align="start">
                <HStack gap="2">
                  <Circle size="24px" bg="blue.500" color="white">
                    <Icon as={currentStepData?.icon || FiFileText} boxSize="4" />
                  </Circle>
                  <Text fontWeight="semibold" color="blue.800">{currentStepData?.title || 'Step Information'}</Text>
                </HStack>
                
                <VStack gap="2" align="start" fontSize="sm" color="blue.700">
                  <Text color="blue.700">• No fields configured for this step yet</Text>
                  <Text color="blue.700">• Please contact administrator to configure fields</Text>
                  <Text color="blue.700">• You can view existing data below</Text>
                </VStack>
              </VStack>
              </Box>
            )}
          </Box>
        ) : (
          <Box 
            p="6" 
            bg={isCompleted ? "green.50" : "orange.50"} 
            borderRadius="lg" 
            border="1px" 
            borderColor={isCompleted ? "green.200" : "orange.200"}
          >
            <VStack gap="4" align="start">
              <HStack gap="2">
                <Circle size="24px" bg={isCompleted ? "green.500" : "orange.500"} color="white">
                  <Icon as={isCompleted ? FiCheck : FiClock} boxSize="4" />
                </Circle>
                <Text fontWeight="semibold" color={isCompleted ? "green.800" : "orange.800"}>
                  {isCompleted ? "Step Completed" : "Step Pending"}
                </Text>
              </HStack>
              
              {/* Show relevant fields for this step from metadata/rawData */}
              {(() => {
                // Get requirements for current step type
                const stepRequirements = (steps[currentStep] as any)?.requirements || [];
                
                const stepFields = stepRequirements.map((etReq: any) => {
                  if (!etReq.requirement) return null;
                  
                  const fieldCode = etReq.requirement.code;
                  const fieldLabel = etReq.requirement.displayName || fieldCode;
                  
                  // IMPORTANT: Requirement codes are UPPERCASE in entity config, but stored lowercase in metadata
                  // Try lowercase first (standard format), then uppercase, then other variations
                  const lowerCode = fieldCode.toLowerCase();
                  const upperCode = fieldCode.toUpperCase();
                  let value = application?.metadata?.[lowerCode] ||  // Primary: lowercase (standard)
                             application?.metadata?.[upperCode] ||    // Fallback: uppercase
                             application?.rawData?.[fieldCode] ||     // Fallback: raw data
                             application?.metadata?.[fieldCode] ||     // Fallback: exact match
                             null;
                  
                  if (value === null || value === '') return null;
                  
                  // Format the value based on type
                  if (typeof value === 'boolean') {
                    value = value ? 'Yes' : 'No';
                  } else if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value, null, 2);
                  } else if (Array.isArray(value)) {
                    value = value.join(', ');
                  }
                  
                  return (
                    <VStack key={fieldCode} gap="2" align="start">
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        {fieldLabel}
                      </Text>
                      <Text fontWeight="semibold" color="gray.800">
                        {String(value)}
                      </Text>
                    </VStack>
                  );
                }).filter((field: any) => field !== null);
                
                if (stepFields.length > 0) {
                  return (
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="4" mt="4">
                      {stepFields}
                    </SimpleGrid>
                  );
                }
                
                return (
              <VStack gap="2" align="start" fontSize="sm" color={isCompleted ? "green.700" : "orange.700"}>
                {isCompleted ? (
                  <>
                        <Text color="green.700">✓ All required information has been submitted</Text>
                        <Text color="green.700">✓ Documentation verified</Text>
                        <Text color="green.700">✓ Ready for next step</Text>
                  </>
                ) : (
                  <>
                        <Text color="orange.700">• Information needs to be provided</Text>
                        <Text color="orange.700">• Documentation required</Text>
                        <Text color="orange.700">• Please complete this step to proceed</Text>
                  </>
                )}
              </VStack>
                );
              })()}
            </VStack>
          </Box>
        )}
      </VStack>
    );
  };

  if (loading) {
    return (
      <Container maxW="1400px" py="8">
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="orange.500" />
        </Flex>
      </Container>
    );
  }

  if (error) {
    const isServiceUnavailable = error.includes('Backend service unavailable') || 
                                 error.includes('not available') ||
                                 error.includes('Cannot connect');
    
    return (
      <Container maxW="1400px" py="8">
        <Box 
          bg={isServiceUnavailable ? "orange.50" : "red.50"} 
          p="6" 
          borderRadius="lg"
          borderWidth="1px"
          borderColor={isServiceUnavailable ? "orange.200" : "red.200"}
        >
          <HStack gap={3} mb={4}>
            <Icon as={FiAlertCircle} color={isServiceUnavailable ? "orange.500" : "red.500"} boxSize={6} />
            <Heading size="md" color={isServiceUnavailable ? "orange.700" : "red.700"}>
              {isServiceUnavailable ? "Service Unavailable" : "Error Loading Application"}
            </Heading>
          </HStack>
          <Text color={isServiceUnavailable ? "orange.700" : "red.700"} mb={4}>
            {error}
          </Text>
          {isServiceUnavailable && (
            <Box bg="orange.100" p="4" borderRadius="md" mb={4}>
              <Text fontSize="sm" color="orange.800" fontWeight="medium" mb={2}>
                To resolve this issue:
              </Text>
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm" color="orange.700">
                  • Ensure the backend services (Projections API and Onboarding API) are running
                </Text>
                <Text fontSize="sm" color="orange.700">
                  • Check that the services are accessible at the configured URLs
                </Text>
                <Text fontSize="sm" color="orange.700">
                  • In development mode, you can use the start-services.sh script to start all services
                </Text>
              </VStack>
            </Box>
          )}
          <Button 
            colorScheme={isServiceUnavailable ? "orange" : "red"}
            onClick={() => window.location.reload()}
          >
            <Icon as={FiActivity} mr={2} />
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  if (!application) {
    return (
      <Container maxW="1400px" py="8">
        <Box bg="gray.50" p="6" borderRadius="lg">
          <Text>Application not found</Text>
          </Box>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="8xl" py="6" px="6">
        {/* Header */}
        <Box 
          bg="white" 
          borderBottom="1px" 
          borderColor="gray.200" 
          py="5"
          px="6"
          boxShadow="sm"
          mb="6"
          borderRadius="lg"
        >
          <Flex justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Text 
                as="h1" 
                fontSize="2xl" 
                fontWeight="800" 
                color="gray.900"
                letterSpacing="-0.02em"
                lineHeight="1.2"
              >
                Application Details
                  </Text>
              <HStack gap="2" align="center">
                <Text color="gray.600" fontSize="sm" fontWeight="500">
                  {application.companyName || application.applicantName || 'Not provided'}
                </Text>
                <Text color="gray.400" fontSize="xs">•</Text>
                <Text color="gray.500" fontSize="sm" fontWeight="500">
                  {application.entityType || 'Business'}
                </Text>
              </HStack>
            </VStack>
            <HStack gap="3" align="center">
                    <Badge 
                colorScheme={getStatusColor(application.status)}
                size="md"
                      px="3"
                      py="1"
                borderRadius="full"
                fontSize="xs"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="0.05em"
                boxShadow="sm"
              >
                {application.status || 'SUBMITTED'}
                    </Badge>
                <Link href={`/partner/risk-assessment/${params.id}`}>
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    borderRadius="lg"
                    fontWeight="500"
                    px="3"
                    size="md"
                    _hover={{ 
                      bg: "blue.50",
                      borderColor: "blue.300",
                      transform: "translateY(-1px)",
                      boxShadow: "sm"
                    }}
                    transition="all 0.2s"
                  >
                    <Icon as={FiShield} mr="1.5" boxSize="4" />
                    Risk Assessment
                  </Button>
                </Link>
                <Button
                  variant="outline"
                colorScheme="gray"
                borderRadius="lg"
                fontWeight="500"
                px="3"
                size="md"
                  onClick={() => router.back()}
                _hover={{ 
                  bg: "gray.50",
                  borderColor: "gray.300",
                  transform: "translateY(-1px)",
                  boxShadow: "sm"
                }}
                transition="all 0.2s"
              >
                <Icon as={FiArrowLeft} mr="1.5" boxSize="4" />
                Back
              </Button>
                    </HStack>
          </Flex>

          {/* Progress Stepper */}
          <Box py="3" mt="4">
            <Flex direction="column" gap="3" align="stretch">
              <HStack gap="2" justify="space-between" align="flex-start" position="relative" w="full">
                {schemaSteps.map((step, index) => {
                  const stepNumber = index + 1; // 1-based step number
                  const isActive = currentStep === stepNumber;
                  const isCompleted = currentStep > stepNumber;
                  
                  return (
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
                          bg={isActive || isCompleted
                            ? "linear-gradient(135deg, orange.400, orange.600)" 
                            : "gray.100"}
                          bgGradient={isActive || isCompleted
                            ? "linear(to-br, orange.400, orange.600)" 
                            : undefined}
                          color={isActive || isCompleted ? "white" : "gray.400"}
                          cursor="pointer"
                          onClick={() => setCurrentStep(stepNumber)}
                          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          _hover={{ 
                            transform: "scale(1.08)",
                            boxShadow: isActive || isCompleted
                              ? "0 6px 16px rgba(237, 137, 54, 0.4)" 
                              : "0 3px 10px rgba(0, 0, 0, 0.1)"
                          }}
                          boxShadow={isActive || isCompleted
                            ? "0 4px 12px rgba(237, 137, 54, 0.3)" 
                            : "0 2px 6px rgba(0, 0, 0, 0.05)"}
                          border={isActive ? "3px solid" : "none"}
                          borderColor={isActive ? "orange.300" : "transparent"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          mx="auto"
                        >
                          <Icon as={step.icon} boxSize="5" />
                        </Circle>
                        {index < schemaSteps.length - 1 && (
                          <Box
                            position="absolute"
                            left="calc(50% + 22px)"
                            top="50%"
                            transform="translateY(-50%)"
                            width="calc(100% - 44px)"
                            height="3px"
                            borderRadius="full"
                            bg={isCompleted
                              ? "linear-gradient(90deg, orange.400, orange.500)" 
                              : "gray.200"}
                            bgGradient={isCompleted
                              ? "linear(to-r, orange.400, orange.500)" 
                              : undefined}
                            transition="all 0.4s ease"
                            zIndex="0"
                          />
                        )}
                      </Flex>
                      
                      {/* Labels aligned directly under icons */}
                      <VStack 
                        align="center" 
                        gap="0.5" 
                        w="full"
                        cursor="pointer"
                        onClick={() => setCurrentStep(stepNumber)}
                        transition="all 0.2s"
                        _hover={{ transform: "translateY(-1px)" }}
                        px="1"
                      >
                        <Text 
                          fontSize="xs" 
                          fontWeight={isActive ? "700" : "600"} 
                          color={isActive ? "gray.900" : "gray.700"}
                          transition="all 0.2s"
                          textAlign="center"
                          lineHeight="1.3"
                          whiteSpace="nowrap"
                          w="full"
                        >
                          {step.title}
                        </Text>
                        <Text 
                          fontSize="10px" 
                          color={isActive ? "gray.600" : "gray.500"}
                          fontWeight={isActive ? "500" : "400"}
                          transition="all 0.2s"
                          textAlign="center"
                          lineHeight="1.2"
                          whiteSpace="nowrap"
                          w="full"
                        >
                          {step.subtitle}
                        </Text>
                      </VStack>
                    </Flex>
                  );
                })}
                          </HStack>
            </Flex>
          </Box>
                  </Box>

        {/* Step Content */}
        <VStack gap="6" align="stretch">
          <MotionBox
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
            {/* Main Content Card - Fully Schema-Driven */}
            <Box 
              bg="white" 
              borderRadius="xl" 
              border="1px" 
              borderColor="gray.200" 
              p="6"
              boxShadow="md"
              transition="all 0.2s"
              w="full"
            >
              {formSchema && currentStepData ? (
                <>
                  <Box pb="4" borderBottom="1px" borderColor="gray.100" mb="6">
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
                            <Icon as={currentStepData.icon} boxSize="4" color="blue.600" />
                          </Box>
                          <Text 
                            fontSize="lg" 
                            fontWeight="700" 
                            color="gray.900"
                            letterSpacing="-0.01em"
                            lineHeight="1.3"
                          >
                            {currentStepData.title}
                          </Text>
                        </HStack>
                        {currentStepData.subtitle && (
                          <Text 
                            fontSize="sm" 
                            color="gray.600"
                            fontWeight="500"
                            pl="8"
                            lineHeight="1.4"
                          >
                            {currentStepData.subtitle}
                          </Text>
                        )}
                      </VStack>
                      <Badge 
                        colorScheme="green" 
                        fontSize="10px" 
                        px="2.5"
                        py="0.5"
                        borderRadius="full"
                        fontWeight="700"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                        boxShadow="sm"
                        flexShrink={0}
                        ml="4"
                      >
                        SCHEMA-DRIVEN
                      </Badge>
                    </HStack>
                  </Box>
                  
                  <Box pt="0">
                    {/* Render only requirements for current step type */}
                    <SchemaDrivenView
                      schema={{
                        ...formSchema,
                        // Filter requirements to only show current step's type
                        requirements: formSchema.requirements?.filter((req: any) => {
                          if (!req.requirement) return false;
                          return req.requirement.type === currentStepData.type;
                        }) || []
                      }}
                      applicationData={{
                        // Pass all data sources - SchemaDrivenView will search through all of them
                        metadata: application?.metadata || {},
                        rawData: application?.rawData || {},
                        // Include direct fields for fallback
                        ...application,
                        // Include all possible field variations for comprehensive mapping
                        businessLegalName: application?.rawData?.businessLegalName || application?.companyName || '',
                        applicantFirstName: application?.rawData?.applicantFirstName || '',
                        applicantLastName: application?.rawData?.applicantLastName || '',
                        applicantEmail: application?.rawData?.applicantEmail || application?.email || '',
                        applicantPhone: application?.rawData?.applicantPhone || '',
                        businessRegistrationNumber: application?.rawData?.businessRegistrationNumber || '',
                        businessCountryOfRegistration: application?.rawData?.businessCountryOfRegistration || application?.country || '',
                        businessAddress: application?.rawData?.businessAddress || '',
                        businessIndustry: application?.rawData?.businessIndustry || '',
                        businessTaxId: application?.rawData?.businessTaxId || '',
                      }}
                      readOnly={true}
                    />
                  </Box>
                </>
              ) : formSchema ? (
                // Fallback: show all fields if step filtering fails
                <SchemaDrivenView
                  schema={formSchema}
                  applicationData={{
                    metadata: application?.metadata || {},
                    rawData: application?.rawData || {},
                    ...application,
                    businessLegalName: application?.rawData?.businessLegalName || application?.companyName || application?.businessLegalName,
                    applicantFirstName: application?.rawData?.applicantFirstName || application?.applicantFirstName,
                    applicantLastName: application?.rawData?.applicantLastName || application?.applicantLastName,
                    applicantEmail: application?.rawData?.applicantEmail || application?.email || application?.applicantEmail,
                    applicantPhone: application?.rawData?.applicantPhone || application?.applicantPhone,
                    businessRegistrationNumber: application?.rawData?.businessRegistrationNumber || application?.businessRegistrationNumber,
                    businessCountryOfRegistration: application?.rawData?.businessCountryOfRegistration || application?.country || application?.businessCountryOfRegistration,
                    businessAddress: application?.rawData?.businessAddress || application?.businessAddress,
                    businessIndustry: application?.rawData?.businessIndustry || application?.businessIndustry,
                  }}
                  readOnly={true}
                />
              ) : (
                <Text color="gray.500" fontSize="sm" textAlign="center" py="8">
                  Loading application schema...
                </Text>
              )}
            </Box>

            {/* Quick Actions - only show on first step */}
            {currentStep === 1 && schemaSteps.length > 0 && (
              <Box 
                bg="white" 
                borderRadius="xl" 
                border="1px" 
                borderColor="gray.200" 
                p="6"
                boxShadow="md"
                mt="6"
                w="full"
              >
                <Box pb="4" borderBottom="1px" borderColor="gray.100" mb="4">
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
                      <Icon as={FiCheckSquare} boxSize="4" color="purple.600" />
                    </Box>
                    <Text 
                      fontSize="lg" 
                      fontWeight="700" 
                      color="gray.900"
                      letterSpacing="-0.01em"
                    >
                      Quick Actions
                    </Text>
            </HStack>
                </Box>
                <HStack gap="3" wrap="wrap" align="center">
                <Button 
                  colorScheme="orange"
                    bgGradient="linear(to-r, orange.500, orange.600)"
                    _hover={{ 
                      bgGradient: "linear(to-r, orange.600, orange.700)",
                      transform: "translateY(-1px)",
                      boxShadow: "md"
                    }}
                    _active={{ transform: "translateY(0)" }}
                    borderRadius="md"
                    px="4"
                    py="2.5"
                    h="auto"
                    fontWeight="600"
                    fontSize="sm"
                  >
                    <Icon as={FiEdit3} mr="1.5" boxSize="4" />
                    Update Status
                  </Button>
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => {}}
                    borderRadius="md"
                    px="4"
                    py="2.5"
                    h="auto"
                    fontWeight="600"
                    fontSize="sm"
                    borderWidth="1.5px"
                    _hover={{ 
                      bg: "blue.50",
                      borderColor: "blue.400",
                      transform: "translateY(-1px)",
                      boxShadow: "sm"
                    }}
                    transition="all 0.2s"
                  >
                    <Icon as={FiMessageSquare} mr="1.5" boxSize="4" />
                    Add Comment
                  </Button>
                  <Button
                    variant="outline"
                    colorScheme="green"
                    onClick={() => {}}
                    borderRadius="md"
                    px="4"
                    py="2.5"
                    h="auto"
                    fontWeight="600"
                    fontSize="sm"
                    borderWidth="1.5px"
                    _hover={{ 
                      bg: "green.50",
                      borderColor: "green.400",
                      transform: "translateY(-1px)",
                      boxShadow: "sm"
                    }}
                    transition="all 0.2s"
                  >
                    <Icon as={FiDownload} mr="1.5" boxSize="4" />
                    Export Data
                </Button>
              </HStack>
        </Box>
            )}
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}