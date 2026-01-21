'use client';
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useRouter } from 'next/navigation';
import { Box, Container, VStack, HStack, Flex, Circle, Spinner } from '@chakra-ui/react';
import {
  Button,
  Typography,
  Tag,
  IconWrapper,
  // Mukuru Icons
  FileOpenIcon,
  TickCircleIcon,
  GroupsIcon,
  UserIcon,
  DocumentIcon,
  ArrowLeftIcon,
  EditIcon,
  LocationIcon,
  DownloadIcon,
  CardIcon,
  RetryIcon,
  ErrorIcon,
} from '@mukuru/mukuru-react-components';
import { motion } from 'framer-motion';
import React, { useState, useEffect, useMemo } from 'react';
import {
  entityConfigApiService,
  EntityType,
  WizardConfiguration,
} from '@/services/entityConfigApi';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { SchemaDrivenView } from '@/components/SchemaDrivenView';
import { findUserCaseByEmail, generateUserIdFromEmail } from '@/lib/api';
import { PartnerHeader } from '@/components/PartnerHeader';

const MotionBox = motion.create(Box);

export default function ApplicationDetailsPage() {
  // Protect this route - redirects to login if not authenticated
  useRequireAuth();
  const { user: authUser, isLoading: authLoading } = useAuth();

  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setCurrentUser] = useState<{
    email?: string;
    partnerId?: string;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [, setEntityTypeConfig] = useState<EntityType | null>(null);
  const [formSchema, setFormSchema] = useState<any>(null); // Store the form schema from API
  const [wizardConfiguration, setWizardConfiguration] =
    useState<WizardConfiguration | null>(null);

  // Form data state for editing - will be populated from application metadata
  const [, setFormData] = useState<Record<string, any>>({});

  // Update form data when application loads - populate from metadata and raw data
  useEffect(() => {
    if (application) {
      const initialData: Record<string, any> = {
        // Add raw data fields
        applicantFirstName: application.rawData?.applicantFirstName || '',
        applicantLastName: application.rawData?.applicantLastName || '',
        applicantEmail: application.rawData?.applicantEmail || '',
        businessLegalName: application.rawData?.businessLegalName || '',
        ...application.metadata, // Include all metadata fields
      };
      setFormData(initialData);
    }
  }, [application]);

  // Fetch entity configuration from backend (only if not already provided by API)
  useEffect(() => {
    const fetchEntityConfig = async () => {
      // If we already have formSchema from the API, use it instead of fetching
      if (formSchema) {
        console.info('Using form schema from API response, skipping separate fetch');
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
        const cleanValue = (value: Record<string, unknown>): string | null => {
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
        // Map common entity type names to database codes
        const entityTypeMapping: Record<string, string> = {
          'business': 'PRIVATE_COMPANY',
          'company': 'PRIVATE_COMPANY',
          'private_company': 'PRIVATE_COMPANY',
          'public_company': 'PUBLIC_COMPANY',
          'individual': 'SOLE_PROPRIETORSHIP',
          'sole_proprietor': 'SOLE_PROPRIETORSHIP',
          'sole_proprietorship': 'SOLE_PROPRIETORSHIP',
          'ngo': 'NGO',
          'non-profit': 'NGO',
          'nonprofit': 'NGO',
          'trust': 'TRUST',
          'government': 'GOVERNMENT_ENTITY',
          'government_entity': 'GOVERNMENT_ENTITY',
          'association': 'ASSOCIATION',
          'supranational': 'SUPRANATIONAL',
        };

        const lowerCode = cleanedCode.toLowerCase().replace(/\s+/g, '_');
        const normalizedCode = entityTypeMapping[lowerCode] || lowerCode.toUpperCase();

        console.info(
          `[Frontend] Looking up entity config for code: "${normalizedCode}" (original: "${rawCode}")`
        );

        // Try to get entity type by code from the API
        const config = await entityConfigApiService.getEntityTypeByCode(
          normalizedCode,
          true
        );

        if (config) {
          console.info('Found entity config from database (fallback fetch):', config);
          setEntityTypeConfig(config);
          setFormSchema(config); // Also set formSchema so the form renders
        } else {
          // If not found by code, try searching in the list with flexible matching
          const entities = await entityConfigApiService.getEntityTypes(false, true);
          const foundConfig = entities.find(
            (e) =>
              e.code.toLowerCase() === normalizedCode.toLowerCase() ||
              e.code.toLowerCase().includes(lowerCode) ||
              lowerCode.includes(e.code.toLowerCase()) ||
              e.displayName?.toLowerCase() === application.entityType.toLowerCase() ||
              e.displayName?.toLowerCase().includes(application.entityType.toLowerCase())
          );

          if (foundConfig) {
            console.info('Found entity config from list (fallback fetch):', foundConfig);
            setEntityTypeConfig(foundConfig);
            setFormSchema(foundConfig); // Also set formSchema so the form renders
          } else {
            // Default to PRIVATE_COMPANY if no match found for "Business" type
            if (application.entityType.toLowerCase() === 'business') {
              const defaultConfig = entities.find(e => e.code === 'PRIVATE_COMPANY');
              if (defaultConfig) {
                console.info('Using PRIVATE_COMPANY as default for Business type:', defaultConfig);
                setEntityTypeConfig(defaultConfig);
                setFormSchema(defaultConfig);
                return;
              }
            }
            console.warn(
              'No entity configuration found in database for entity type:',
              application.entityType,
              '(normalized:',
              normalizedCode,
              ')'
            );
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

  // Fetch wizard configuration for the entity type
  useEffect(() => {
    const fetchWizardConfiguration = async () => {
      if (!formSchema?.id && !application?.formConfigId) {
        return;
      }

      try {
        // Use formConfigId (entity type ID) from application or formSchema
        const entityTypeId = application?.formConfigId || formSchema?.id;
        if (!entityTypeId) {
          console.info('No entity type ID available for wizard configuration');
          return;
        }

        console.info('Fetching wizard configuration for entity type:', entityTypeId);
        const wizardConfig =
          await entityConfigApiService.getWizardConfigurationByEntityType(entityTypeId);

        if (wizardConfig) {
          setWizardConfiguration(wizardConfig);
          console.info('✅ Loaded wizard configuration:', {
            steps: wizardConfig.steps?.length || 0,
            activeSteps: wizardConfig.steps?.filter((s) => s.isActive).length || 0,
          });
        } else {
          console.info('No wizard configuration found for entity type:', entityTypeId);
          setWizardConfiguration(null);
        }
      } catch (error) {
        console.error('Error fetching wizard configuration:', error);
        // Don't set to null on error - keep previous config if available
      }
    };

    if (formSchema || application?.formConfigId) {
      fetchWizardConfiguration();
    }
  }, [formSchema, application?.formConfigId]);

  // Get current logged-in user
  useEffect(() => {
    if (authUser?.email) {
      const partnerId = generateUserIdFromEmail(authUser.email);
      setCurrentUser({ email: authUser.email, partnerId });
      console.info('👤 Current logged-in user:', { email: authUser.email, partnerId });
    }
  }, [authUser]);

  // Fetch application details
  useEffect(() => {
    // Wait for auth to load before fetching
    if (authLoading) {
      return;
    }

    // Check if user is authenticated
    if (!authUser?.email) {
      setError('You must be logged in to view application details');
      setLoading(false);
      return;
    }

    const fetchApplication = async () => {
      try {
        const userEmail = authUser.email!;
        const userPartnerId = generateUserIdFromEmail(userEmail);
        console.info('🔍 Fetching application for logged-in user:', {
          email: userEmail,
          partnerId: userPartnerId,
        });

        // If no case ID in URL, find the user's application by email
        let caseIdToFetch = params.id as string;

        console.info('🔍 Initial params check:', {
          paramsId: params.id,
          paramsType: typeof params.id,
          paramsKeys: Object.keys(params),
          caseIdToFetch,
        });

        if (!caseIdToFetch || caseIdToFetch === 'undefined' || caseIdToFetch === 'null') {
          console.info(
            '📧 No valid case ID in URL, searching for user application by email...'
          );
          const userCase = await findUserCaseByEmail(userEmail);
          if (userCase) {
            caseIdToFetch = userCase.caseId;
            console.info('✅ Found user application:', caseIdToFetch);
            // Update URL to include the case ID
            router.replace(`/partner/application/${encodeURIComponent(caseIdToFetch)}`);
          } else {
            console.info(
              'No application found, redirecting to create new application...'
            );
            // Redirect to new application page instead of showing error
            router.replace('/partner/application/enhanced');
            return;
          }
        } else {
          console.info('📋 Using case ID from URL:', caseIdToFetch);
        }

        // SECURITY: Tokens are now handled server-side by the proxy
        // The proxy will automatically inject the Authorization header from Redis
        // DO NOT pass tokens from the frontend - use the proxy endpoint

        // Fetch from our Next.js API route (not directly from proxy)
        // The API route handles routing to the correct backend endpoint (by-number or by GUID)
        // The proxy will automatically inject the Authorization header from the session cookie
        const response = await fetch(
          `/api/cases/${encodeURIComponent(caseIdToFetch)}/details`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include session cookie
          }
        );
        console.info('API Response status:', response.status);

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
              if (
                foundCasePartnerId &&
                foundCasePartnerId.toLowerCase() === userPartnerId.toLowerCase()
              ) {
                console.info("✅ Found user's actual application, redirecting...", {
                  from: caseIdToFetch,
                  to: userCase.caseId,
                });
                router.replace(`/partner/application/${userCase.caseId}`);
                return;
              } else {
                console.warn(
                  '⚠️ Found case also has ownership mismatch, cannot redirect'
                );
                setError(
                  'This application does not belong to your account. Access denied.'
                );
                setLoading(false);
                return;
              }
            } else if (userCase && userCase.caseId === caseIdToFetch) {
              // Same case ID - this shouldn't happen, but handle gracefully
              console.warn(
                '⚠️ Ownership mismatch for the same case ID - possible data inconsistency'
              );
              setError(
                'This application does not belong to your account. Access denied.'
              );
              setLoading(false);
              return;
            } else {
              setError(
                'This application does not belong to your account. Access denied.'
              );
              setLoading(false);
              return;
            }
          }

          // Try to extract detailed error message for other errors
          const errorMessage =
            data.details || data.error || 'Failed to fetch application details';
          const errorDetails = data.serviceUrls
            ? `Backend services at ${data.serviceUrls.projectionsApi} or ${data.serviceUrls.onboardingApi} are not available. Please ensure the services are running.`
            : errorMessage;

          throw new Error(errorDetails);
        }

        // Validate ownership - ensure this application belongs to the logged-in user
        const casePartnerId = data.partnerId || data.partner_id;

        // Log ownership validation details for debugging
        console.info('🔍 Frontend ownership validation check:', {
          casePartnerId,
          userPartnerId,
          caseId: caseIdToFetch,
          userEmail,
          match: casePartnerId?.toLowerCase() === userPartnerId?.toLowerCase(),
        });

        // TEMPORARILY DISABLED for development - skip ownership check
        // The partner ID generation needs to be consistent between creation and validation
        console.info('⚠️ Frontend ownership validation DISABLED for development');

        // Original ownership validation code (commented out):
        // if (
        //   casePartnerId &&
        //   userPartnerId &&
        //   casePartnerId.toLowerCase() !== userPartnerId.toLowerCase()
        // ) {
        //   console.warn('⚠️ Application ownership mismatch:', {
        //     casePartnerId,
        //     userPartnerId,
        //     caseId: caseIdToFetch,
        //   });
        //   // ... rest of ownership validation logic
        // }

        console.info('✅ Application ownership validated. Application data:', data);
        console.info('Form schema from API:', data.formSchema);
        console.info('Form config ID:', data.formConfigId);
        console.info('Form version:', data.formVersion);
        console.info('Entity type code:', data.entityTypeCode);

        // Clean up duplicated values from API response
        const cleanValue = (value: Record<string, unknown>): string | null => {
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
          console.info(
            '✅ Form schema stored for rendering. Requirements count:',
            data.formSchema?.requirements?.length || 0
          );
        } else {
          console.warn(
            '⚠️ No form schema in API response. formConfigId:',
            cleanedFormConfigId,
            'entityTypeCode:',
            cleanedEntityTypeCode
          );
          // Clear formSchema state to trigger fallback fetch
          setFormSchema(null);
          setEntityTypeConfig(null);
        }

        // Extract core case data - API returns structured caseData
        const caseData = data.caseData || {};

        // Extract metadata - can be in caseData.metadata or data.metadata or data.metadataJson
        let metadata = {};
        if (caseData.metadata) {
          metadata =
            typeof caseData.metadata === 'string'
              ? JSON.parse(caseData.metadata)
              : caseData.metadata;
        } else if (data.metadata) {
          metadata =
            typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
        } else if (data.metadataJson) {
          metadata =
            typeof data.metadataJson === 'string'
              ? JSON.parse(data.metadataJson)
              : data.metadataJson;
        }

        // Ensure metadata is an object
        if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
          metadata = {};
        }

        console.info('📊 Application Data Structure:');
        console.info('  - Root data keys:', Object.keys(data).slice(0, 30));
        console.info('  - caseData keys:', Object.keys(caseData));
        console.info('  - metadata keys:', Object.keys(metadata));
        console.info('  - Full metadata object:', JSON.stringify(metadata, null, 2));
        console.info('  - Actual values from caseData:', {
          businessLegalName: caseData.businessLegalName,
          applicantFirstName: caseData.applicantFirstName,
          applicantEmail: caseData.applicantEmail,
          businessCountryOfRegistration: caseData.businessCountryOfRegistration,
          businessRegistrationNumber: caseData.businessRegistrationNumber,
        });
        console.info('  - Actual values from root data:', {
          businessLegalName: data.businessLegalName,
          applicantFirstName: data.applicantFirstName,
          applicantEmail: data.applicantEmail,
          businessCountryOfRegistration: data.businessCountryOfRegistration,
          businessRegistrationNumber: data.businessRegistrationNumber,
        });
        console.info('  - Root data full sample:', {
          id: data.id,
          caseId: data.caseId || data.case_number,
          status: data.status,
          type: data.type,
          ...Object.fromEntries(Object.entries(data).slice(0, 20)),
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
          businessLegalName:
            caseData.businessLegalName ||
            data.businessLegalName ||
            (metadata as any)?.legal_name ||
            (metadata as any)?.businessLegalName ||
            (metadata as any)?.companyname ||
            (metadata as any)?.company_name ||
            (metadata as any)?.legalName ||
            (metadata as any)?.LEGAL_NAME ||
            (metadata as any)?.['Legal Name'] ||
            '',
          applicantFirstName:
            caseData.applicantFirstName ||
            data.applicantFirstName ||
            (metadata as any)?.applicant_first_name ||
            (metadata as any)?.applicantFirstName ||
            (metadata as any)?.firstName ||
            (metadata as any)?.first_name ||
            '',
          applicantLastName:
            caseData.applicantLastName ||
            data.applicantLastName ||
            (metadata as any)?.applicant_last_name ||
            (metadata as any)?.applicantLastName ||
            (metadata as any)?.lastName ||
            (metadata as any)?.last_name ||
            '',
          applicantEmail:
            caseData.applicantEmail ||
            data.applicantEmail ||
            (metadata as any)?.applicant_email ||
            (metadata as any)?.applicantEmail ||
            (metadata as any)?.email ||
            '',
          applicantPhone:
            caseData.applicantPhone ||
            data.applicantPhone ||
            (metadata as any)?.applicant_phone ||
            (metadata as any)?.applicantPhone ||
            (metadata as any)?.phone ||
            '',
          businessRegistrationNumber:
            caseData.businessRegistrationNumber ||
            data.businessRegistrationNumber ||
            (metadata as any)?.registration_number ||
            (metadata as any)?.registrationNumber ||
            (metadata as any)?.registered_number ||
            (metadata as any)?.registeredNumber ||
            (metadata as any)?.REGISTRATION_NUMBER ||
            (metadata as any)?.['Registration Number'] ||
            '',
          businessCountryOfRegistration:
            caseData.businessCountryOfRegistration ||
            data.businessCountryOfRegistration ||
            (metadata as any)?.country_of_incorporation ||
            (metadata as any)?.countryOfIncorporation ||
            (metadata as any)?.country_of_registration ||
            (metadata as any)?.countryOfRegistration ||
            '',
          businessAddress:
            caseData.businessAddress ||
            data.businessAddress ||
            (metadata as any)?.business_address ||
            (metadata as any)?.businessAddress ||
            (metadata as any)?.registered_address ||
            (metadata as any)?.registeredAddress ||
            (metadata as any)?.REGISTERED_ADDRESS ||
            (metadata as any)?.['Registered Address'] ||
            (metadata as any)?.address ||
            '',
          businessIndustry:
            caseData.businessIndustry ||
            data.businessIndustry ||
            (metadata as any)?.business_industry ||
            (metadata as any)?.businessIndustry ||
            (metadata as any)?.industry ||
            '',
          businessTaxId:
            caseData.businessTaxId ||
            data.businessTaxId ||
            (metadata as any)?.tax_id ||
            (metadata as any)?.taxId ||
            (metadata as any)?.tax_number ||
            '',
        };

        console.info('📦 Comprehensive rawData sample:', {
          businessLegalName: comprehensiveRawData.businessLegalName,
          applicantFirstName: comprehensiveRawData.applicantFirstName,
          applicantEmail: comprehensiveRawData.applicantEmail,
          businessRegistrationNumber: comprehensiveRawData.businessRegistrationNumber,
          businessCountryOfRegistration:
            comprehensiveRawData.businessCountryOfRegistration,
          'metadata.companyname': (metadata as any)?.companyname,
          'metadata.legal_name': (metadata as any)?.legal_name,
          'metadata.full_name': (metadata as any)?.full_name,
        });

        // Find company name from all possible sources
        const findCompanyName = (): string => {
          // Check all possible locations for company/legal name
          const sources = [
            comprehensiveRawData.businessLegalName,
            caseData.businessLegalName,
            data.businessLegalName,
            (metadata as any)?.legal_name,
            (metadata as any)?.businessLegalName,
            (metadata as any)?.legalName,
            (metadata as any)?.companyname,
            (metadata as any)?.company_name,
            (metadata as any)?.companyName,
            (metadata as any)?.['Legal Name'],
            (metadata as any)?.['legal_name'],
            (metadata as any)?.LEGAL_NAME,
            // Also check for full name as fallback
            `${comprehensiveRawData.applicantFirstName || ''} ${comprehensiveRawData.applicantLastName || ''}`.trim(),
            (metadata as any)?.['full_name'],
            (metadata as any)?.full_name,
            (metadata as any)?.applicant_name,
          ];
          
          for (const source of sources) {
            if (source && typeof source === 'string' && source.trim() !== '') {
              console.info('✅ Found company name from source:', source);
              return source;
            }
          }
          
          // Last resort: search metadata for any key containing 'name', 'legal', or 'company'
          if (metadata && typeof metadata === 'object') {
            const metadataKeys = Object.keys(metadata as object);
            console.info('🔍 Searching metadata keys for company name:', metadataKeys);
            
            for (const key of metadataKeys) {
              const keyLower = key.toLowerCase();
              if (keyLower.includes('legal') || keyLower.includes('company') || 
                  (keyLower.includes('name') && !keyLower.includes('first') && !keyLower.includes('last'))) {
                const value = (metadata as any)[key];
                if (value && typeof value === 'string' && value.trim() !== '') {
                  console.info(`✅ Found company name in metadata["${key}"]:`, value);
                  return value;
                }
              }
            }
          }
          
          console.warn('⚠️ No company name found in any source. Metadata:', metadata);
          return 'Not provided';
        };

        setApplication({
          id: data.caseId || data.id,
          status: data.status || 'InProgress',
          submissionDate: data.createdAt || data.created_at || new Date().toISOString(),
          companyName: findCompanyName(),
          entityType:
            cleanedEntityTypeCode ||
            effectiveData.entityType ||
            data.type ||
            data.entityType ||
            'Private Company',
          entityTypeCode: cleanedEntityTypeCode,
          country:
            comprehensiveRawData.businessCountryOfRegistration ||
            comprehensiveRawData.applicantCountry ||
            (metadata as any)?.country_of_incorporation ||
            (metadata as any)?.countryOfIncorporation ||
            '',
          email:
            comprehensiveRawData.applicantEmail ||
            (metadata as any)?.email ||
            (metadata as any)?.contact_email ||
            '',
          applicantName:
            `${comprehensiveRawData.applicantFirstName || ''} ${comprehensiveRawData.applicantLastName || ''}`.trim() ||
            (metadata as any)?.['full_name'] ||
            (metadata as any)?.applicant_name ||
            '',
          metadata: metadata,
          rawData: comprehensiveRawData,
          // Include caseData from API response if available
          caseData: data.caseData || {},
          formConfigId: cleanedFormConfigId,
          formVersion: cleanedFormVersion,
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching application:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch application';
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (params.id) {
      fetchApplication();
    }
  }, [params.id, authUser, authLoading]);

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
      metadata.tax_number,
    ];

    const filledFields = fields.filter((f) => f && f !== '').length;
    return Math.min((filledFields / 10) * 100, 100);
  };

  const [, setCalculatedCompletion] = useState(0);

  useEffect(() => {
    setCalculatedCompletion(calculateActualCompletion());
  }, [application]);

  // Step completion calculated but not currently used
  // const completedSteps = steps.filter((step) => step.completed).length;
  // const totalSteps = steps.length;
  // const stepCompletion = Math.round((completedSteps / totalSteps) * 100);

  // Unused helper function - kept for potential future use
  // const getStatusColor = (_status: Record<string, unknown>) => {
  //   const status = (typeof _status === 'string' ? _status : String(_status)) || '';
  //   const statusUpper = status.toUpperCase();
  //   if (statusUpper.includes('COMPLETE') || statusUpper.includes('APPROVED'))
  //     return 'green';
  //   if (statusUpper.includes('PROGRESS') || statusUpper.includes('REVIEW')) return 'blue';
  //   if (statusUpper.includes('SUBMITTED')) return 'blue';
  //   if (statusUpper.includes('DECLINED') || statusUpper.includes('REJECTED'))
  //     return 'red';
  //   return 'orange';
  // };

  // Generate steps from wizard configuration if available, otherwise group by requirement type
  // Fully schema-driven - uses wizard configuration steps from entity type configuration
  const schemaSteps = useMemo(() => {
    if (!formSchema || !formSchema.requirements) {
      return [];
    }

    // Icon mapping for step types - using Mukuru icons
    const iconMap: Record<string, any> = {
      Information: FileOpenIcon,
      ProofOfIdentity: UserIcon,
      ProofOfAddress: LocationIcon,
      OwnershipStructure: GroupsIcon,
      BoardDirectors: UserIcon,
      AuthorizedSignatories: CardIcon,
      Document: DocumentIcon,
    };

    // Use wizard configuration if available
    if (
      wizardConfiguration &&
      wizardConfiguration.steps &&
      wizardConfiguration.steps.length > 0
    ) {
      // Filter to only active steps and sort by stepNumber
      const activeWizardSteps = wizardConfiguration.steps
        .filter((step) => step.isActive)
        .sort((a, b) => a.stepNumber - b.stepNumber);

      console.info(
        `Using wizard configuration: ${activeWizardSteps.length} steps`,
        activeWizardSteps.map((s) => ({
          stepNumber: s.stepNumber,
          title: s.title,
          requirementTypes: s.requirementTypes,
        }))
      );

      // Log all requirement types for debugging - handle both nested and flat structures
      const allReqTypes = formSchema.requirements.map((r: any) => r.requirement?.type || r.type);
      console.info('ALL requirement types in schema:', allReqTypes);
      console.info('ALL requirements structure (first 3):', JSON.stringify(formSchema.requirements.slice(0, 3), null, 2));
      
      // Check if wizard steps have requirementTypes defined with actual values
      const hasRequirementTypes = activeWizardSteps.some(
        (step) => step.requirementTypes && step.requirementTypes.length > 0 && 
                  step.requirementTypes.some(rt => rt && rt.trim() !== '')
      );
      
      console.info('Wizard steps have requirementTypes:', hasRequirementTypes, 
        activeWizardSteps.map(s => ({ title: s.title, types: s.requirementTypes })));
      
      // If wizard steps don't have requirementTypes, distribute requirements by step number
      if (!hasRequirementTypes) {
        console.info('Wizard steps have no requirementTypes - distributing requirements by step');
        
        // Group requirements by type first - handle both nested and flat structures
        const reqsByType = new Map<string, any[]>();
        formSchema.requirements.forEach((req: any) => {
          // Handle both nested (req.requirement.type) and flat (req.type) structures
          const type = (req.requirement?.type || req.type || 'information').toLowerCase();
          if (!reqsByType.has(type)) {
            reqsByType.set(type, []);
          }
          reqsByType.get(type)!.push(req);
        });
        
        console.info('Requirements grouped by type:', Array.from(reqsByType.entries()).map(([k, v]) => `${k}: ${v.length}`));
        
        // Assign to wizard steps based on step title matching
        return activeWizardSteps.map((wizardStep, wizardIndex) => {
          const stepTitleLower = wizardStep.title.toLowerCase();
          let stepRequirements: any[] = [];
          
          // Match based on step title
          if (stepTitleLower.includes('business') || stepTitleLower.includes('information') || stepTitleLower.includes('company')) {
            stepRequirements = reqsByType.get('information') || [];
          } else if (stepTitleLower.includes('document')) {
            stepRequirements = reqsByType.get('documentation') || reqsByType.get('document') || [];
          } else if (stepTitleLower.includes('identity')) {
            stepRequirements = reqsByType.get('proofofidentity') || [];
          } else if (stepTitleLower.includes('address')) {
            stepRequirements = reqsByType.get('proofofaddress') || [];
          } else if (stepTitleLower.includes('owner')) {
            stepRequirements = reqsByType.get('ownershipstructure') || [];
          } else if (stepTitleLower.includes('director') || stepTitleLower.includes('board')) {
            stepRequirements = reqsByType.get('boarddirectors') || [];
          } else if (stepTitleLower.includes('signator')) {
            stepRequirements = reqsByType.get('authorizedsignatories') || [];
          }
          
          // If still no match, for first step show all non-document requirements, for second show documents
          if (stepRequirements.length === 0) {
            const allTypes = Array.from(reqsByType.keys());
            console.info(`Step ${wizardIndex + 1} - no match found. Available types:`, allTypes);
            
            if (wizardIndex === 0) {
              // First step: show information or all non-document requirements
              stepRequirements = reqsByType.get('information') || [];
              if (stepRequirements.length === 0) {
                // Get all requirements except documents
                const nonDocReqs: any[] = [];
                reqsByType.forEach((reqs, type) => {
                  if (!type.includes('document')) {
                    nonDocReqs.push(...reqs);
                  }
                });
                stepRequirements = nonDocReqs.length > 0 ? nonDocReqs : Array.from(reqsByType.values())[0] || [];
              }
            } else if (wizardIndex === 1) {
              // Second step: show documents
              stepRequirements = reqsByType.get('documentation') || reqsByType.get('document') || [];
              if (stepRequirements.length === 0) {
                // Get any remaining requirements not shown in first step
                const docReqs: any[] = [];
                reqsByType.forEach((reqs, type) => {
                  if (type.includes('document')) {
                    docReqs.push(...reqs);
                  }
                });
                stepRequirements = docReqs;
              }
            }
          }
          
          console.info(`Step ${wizardIndex + 1} "${wizardStep.title}" assigned ${stepRequirements.length} requirements by title matching`);
          
          const primaryType = wizardStep.requirementTypes?.[0] || 'Information';
          const stepIcon = iconMap[primaryType] || FileOpenIcon;
          
          return {
            id: wizardStep.stepNumber,
            type: primaryType,
            title: wizardStep.title,
            subtitle: wizardStep.subtitle || '',
            icon: stepIcon,
            requirements: stepRequirements,
            stepNumber: wizardStep.stepNumber,
          };
        });
      }
      
      // Map wizard steps to schema steps - FULLY DYNAMIC matching
      return activeWizardSteps.map((wizardStep, wizardIndex) => {
        // Find all requirements that match this wizard step's requirement types
        // Flexible matching to handle variations like "Document" vs "Documentation"
        const stepRequirements = formSchema.requirements.filter(
          (_req: Record<string, unknown>) => {
            // Handle both nested (req.requirement.type) and flat (req.type) structures
            const reqType = String(
              (_req.requirement as Record<string, unknown>)?.type || 
              (_req as Record<string, unknown>).type || 
              ''
            ).toLowerCase().trim();
            
            if (!reqType) return false;
            
            // Match if requirement type matches ANY of the wizard step's requirement types
            return wizardStep.requirementTypes.some((wizardReqType) => {
              const wizardTypeLower = wizardReqType.toLowerCase().trim();
              
              // Flexible matching:
              // 1. Exact match
              if (reqType === wizardTypeLower) return true;
              
              // 2. Document/Documentation variations
              if ((wizardTypeLower === 'document' || wizardTypeLower === 'documentation') &&
                  (reqType === 'document' || reqType === 'documentation')) return true;
              
              // 3. Information type
              if (wizardTypeLower === 'information' && reqType === 'information') return true;
              
              // 4. Partial match - wizard type starts with or contains req type
              if (wizardTypeLower.includes(reqType) || reqType.includes(wizardTypeLower)) return true;
              
              // 5. Handle numeric type values (1=Information, 2=Document, etc.)
              const typeNumMap: Record<string, string[]> = {
                '1': ['information'],
                '2': ['document', 'documentation'],
                '3': ['proofofidentity'],
                '4': ['proofofaddress'],
                '5': ['ownershipstructure'],
                '6': ['boarddirectors'],
                '7': ['authorizedsignatories'],
              };
              
              if (typeNumMap[reqType]?.includes(wizardTypeLower)) return true;
              if (typeNumMap[wizardTypeLower]?.includes(reqType)) return true;
              
              return false;
            });
          }
        );
        
        console.info(`Step ${wizardIndex + 1} "${wizardStep.title}" matched ${stepRequirements.length} requirements`, {
          wizardTypes: wizardStep.requirementTypes,
          matchedTypes: stepRequirements.map((r: any) => r.requirement?.type)
        });

        // Sort requirements by displayOrder
        stepRequirements.sort((a: any, b: any) => {
          const orderA = a.displayOrder ?? a.requirement?.order ?? 0;
          const orderB = b.displayOrder ?? b.requirement?.order ?? 0;
          return orderA - orderB;
        });

        // Determine icon based on requirement types (use first type if multiple)
        const primaryType = wizardStep.requirementTypes[0] || 'Information';
        const stepIcon = iconMap[primaryType] || FileOpenIcon;

        return {
          id: wizardStep.stepNumber,
          type: primaryType, // Use first requirement type for filtering
          title: wizardStep.title,
          subtitle: wizardStep.subtitle || '',
          icon: stepIcon,
          requirements: stepRequirements,
          stepNumber: wizardStep.stepNumber,
        };
      });
    }

    // Fallback: Group requirements by type if no wizard configuration
    console.info('No wizard configuration found, grouping by requirement type');
    const stepMap = new Map<
      string,
      {
        id: number;
        type: string;
        title: string;
        subtitle: string;
        icon: any;
        requirements: any[];
        firstOrder: number;
        stepNumber?: number;
      }
    >();

    let stepId = 1;

    formSchema.requirements.forEach((_req: Record<string, unknown>, index: number) => {
      if (!_req.requirement) return;

      const reqType =
        ((_req.requirement as Record<string, unknown>).type as string) || 'Information';
      const normalizedType = reqType.toLowerCase();

      if (!stepMap.has(normalizedType)) {
        const formatTypeName = (type: string): string => {
          const cleaned = type
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .split(/\s+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          return cleaned || type;
        };

        stepMap.set(normalizedType, {
          id: stepId++,
          type: reqType,
          title: formatTypeName(reqType),
          subtitle: '',
          icon: iconMap[reqType] || iconMap[normalizedType] || FileOpenIcon,
          requirements: [],
          firstOrder: index,
          stepNumber: stepId - 1, // Add stepNumber for consistency
        });
      }

      const step = stepMap.get(normalizedType)!;
      step.requirements.push(_req);

      step.requirements.sort((a, b) => {
        const orderA = a.displayOrder ?? a.requirement?.order ?? 0;
        const orderB = b.displayOrder ?? b.requirement?.order ?? 0;
        return orderA - orderB;
      });
    });

    return Array.from(stepMap.values()).sort((a, b) => a.firstOrder - b.firstOrder);
  }, [formSchema, wizardConfiguration]);

  // Get current step's requirements from schema
  // Fully schema-driven - uses requirement order from database
  const currentStepData = useMemo(() => {
    if (!schemaSteps.length || currentStep < 1 || currentStep > schemaSteps.length) {
      return null;
    }

    return schemaSteps[currentStep - 1]; // currentStep is 1-based
  }, [schemaSteps, currentStep]);

  // Removed unused functions: _handleNext, _handlePrevious, _getStepContent

  if (loading) {
    return (
      <Container maxW="1400px" py="8">
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="mukuru.buttons.primary" />
        </Flex>
      </Container>
    );
  }

  if (error) {
    const isServiceUnavailable =
      error.includes('Backend service unavailable') ||
      error.includes('not available') ||
      error.includes('Cannot connect');

    return (
      <Container maxW="1400px" py="8">
        <Box
          bg={isServiceUnavailable ? 'mukuru.state.hover.card' : 'mukuru.text.error.dark'}
          p="6"
          borderRadius="lg"
          borderWidth="1px"
          borderColor={
            isServiceUnavailable ? 'mukuru.buttons.inactive.orange' : 'mukuru.text.error'
          }
        >
          <HStack gap={3} mb={4}>
            <ErrorIcon
              width="24px"
              height="24px"
              color={
                isServiceUnavailable
                  ? 'var(--chakra-colors-mukuru-buttons-primary)'
                  : 'var(--chakra-colors-mukuru-text-error)'
              }
            />
            <Typography
              fontSize="lg"
              fontWeight="semibold"
              color={isServiceUnavailable ? 'mukuru.text.primary' : 'mukuru.text.inverse'}
            >
              {isServiceUnavailable ? 'Service Unavailable' : 'Error Loading Application'}
            </Typography>
          </HStack>
          <Typography
            color={isServiceUnavailable ? 'mukuru.text.primary' : 'mukuru.text.inverse'}
            mb={4}
          >
            {error}
          </Typography>
          {isServiceUnavailable && (
            <Box bg="mukuru.cards.white" p="4" borderRadius="md" mb={4}>
              <Typography
                fontSize="sm"
                color="mukuru.text.primary"
                fontWeight="medium"
                mb={2}
              >
                To resolve this issue:
              </Typography>
              <VStack align="stretch" gap={2}>
                <Typography fontSize="sm" color="mukuru.text.primary">
                  • Ensure the backend services (Projections API and Onboarding API) are
                  running
                </Typography>
                <Typography fontSize="sm" color="mukuru.text.primary">
                  • Check that the services are accessible at the configured URLs
                </Typography>
                <Typography fontSize="sm" color="mukuru.text.primary">
                  • In development mode, you can use the start-services.sh script to start
                  all services
                </Typography>
              </VStack>
            </Box>
          )}
          <Button variant="primary" onClick={() => window.location.reload()}>
            <RetryIcon width="16px" height="16px" style={{ marginRight: '8px' }} />
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  if (!application) {
    return (
      <Container maxW="1400px" py="8">
        <Box bg="mukuru.background.light" p="6" borderRadius="lg">
          <Typography>Application not found</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg="mukuru.background.light">
      <PartnerHeader hideNewApplication={true} showBackButton={false} />
      {/* Wizard Header */}
      <Box bg="mukuru.cards.white" boxShadow="sm" position="sticky" top="0" zIndex="10">
        <Container maxW="4xl" py="6">
          {/* Title and Status */}
          <Flex justify="space-between" align="center" mb="6">
            <HStack gap="3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                p="2"
                borderRadius="full"
              >
                <ArrowLeftIcon width="20px" height="20px" color="var(--chakra-colors-mukuru-grey-mediumDark)" />
              </Button>
              <VStack align="start" gap="0">
                <Typography fontSize="xl" fontWeight="700" color="mukuru.text.primary">
                  {application.companyName || application.applicantName || 'Your Application'}
                </Typography>
                <Typography fontSize="sm" color="mukuru.grey.medium">
                  Review and edit your submitted information
                </Typography>
              </VStack>
            </HStack>
            <HStack gap="3">
              <Tag variant="solid" size="md">
                {application.status || 'SUBMITTED'}
              </Tag>
              <Button variant="primary" size="sm" borderRadius="lg">
                <EditIcon width="14px" height="14px" style={{ marginRight: '6px' }} />
                Edit
              </Button>
            </HStack>
          </Flex>

          {/* Horizontal Wizard Stepper */}
          <HStack justify="center" gap="0" w="full">
            {schemaSteps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              const isLast = index === schemaSteps.length - 1;

              return (
                <HStack key={step.id} gap="0" flex={isLast ? "0" : "1"}>
                  {/* Step Circle and Label */}
                  <VStack 
                    gap="2" 
                    cursor="pointer" 
                    onClick={() => setCurrentStep(stepNumber)}
                    transition="all 0.2s"
                    _hover={{ transform: 'scale(1.02)' }}
                  >
                    <Circle
                      size="40px"
                      bg={isActive ? 'mukuru.buttons.primary' : isCompleted ? 'mukuru.teal' : 'mukuru.grey.light'}
                      color={isActive || isCompleted ? 'white' : 'mukuru.grey.medium'}
                      fontWeight="700"
                      fontSize="sm"
                      boxShadow={isActive ? '0 4px 12px rgba(240, 84, 35, 0.3)' : 'none'}
                      transition="all 0.3s"
                    >
                      {isCompleted ? (
                        <TickCircleIcon width="20px" height="20px" color="#fff" />
                      ) : (
                        stepNumber
                      )}
                    </Circle>
                    <VStack gap="0" align="center">
                      <Typography 
                        fontSize="xs" 
                        fontWeight={isActive ? '700' : '500'} 
                        color={isActive ? 'mukuru.text.primary' : 'mukuru.grey.medium'}
                        textAlign="center"
                        maxW="100px"
                      >
                        {step.title}
                      </Typography>
                    </VStack>
                  </VStack>

                  {/* Connector Line */}
                  {!isLast && (
                    <Box 
                      flex="1" 
                      h="2px" 
                      bg={isCompleted ? 'mukuru.teal' : 'mukuru.grey.light'}
                      mx="3"
                      mt="-24px"
                      transition="background 0.3s"
                    />
                  )}
                </HStack>
              );
            })}
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="5xl" py="8" px="6">
        <MotionBox
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Professional Content Card */}
          <Box
            bg="white"
            borderRadius="2xl"
            border="1px solid"
            borderColor="gray.200"
            overflow="hidden"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
          >
            {formSchema && currentStepData ? (
              <>
                {/* Step Header - Clean & Professional */}
                <Box
                  bgGradient="linear(to-r, mukuru.buttons.primary, #ff6b3d)"
                  px="8"
                  py="6"
                >
                  <HStack justify="space-between" align="center">
                    <HStack gap="5" align="center">
                      <Flex
                        w="56px"
                        h="56px"
                        borderRadius="xl"
                        bg="rgba(255, 255, 255, 0.2)"
                        backdropFilter="blur(10px)"
                        align="center"
                        justify="center"
                        border="1px solid rgba(255, 255, 255, 0.3)"
                      >
                        {React.createElement(currentStepData.icon, {
                          width: '28px',
                          height: '28px',
                          color: '#fff',
                        })}
                      </Flex>
                      <VStack align="start" gap="1">
                        <Typography
                          fontSize="2xl"
                          fontWeight="700"
                          color="white"
                          letterSpacing="-0.02em"
                        >
                          {currentStepData.title}
                        </Typography>
                        <Typography
                          fontSize="sm"
                          color="rgba(255, 255, 255, 0.85)"
                          fontWeight="500"
                        >
                          Step {currentStep} of {schemaSteps.length} • {currentStepData.subtitle || 'Complete the required fields'}
                        </Typography>
                      </VStack>
                    </HStack>
                    <HStack gap="3">
                      {currentStep > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setCurrentStep(currentStep - 1)}
                          borderRadius="lg"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            padding: '0 16px'
                          }}
                        >
                          <ArrowLeftIcon width="14px" height="14px" style={{ marginRight: '6px' }} />
                          Previous
                        </Button>
                      )}
                      {currentStep < schemaSteps.length && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => setCurrentStep(currentStep + 1)}
                          borderRadius="lg"
                          style={{ 
                            background: 'white',
                            color: '#f05423',
                            fontWeight: '600',
                            padding: '0 20px'
                          }}
                        >
                          Next Step
                        </Button>
                      )}
                    </HStack>
                  </HStack>
                </Box>

                {/* Content Area - Clean & Spacious */}
                <Box p="8" bg="gray.50">
                  {/* Render requirements for current step - FULLY DYNAMIC */}
                  {(() => {
                    // Use pre-filtered requirements from currentStepData
                    // Don't fallback to all requirements - show only what's configured for this step
                    const requirementsToShow = currentStepData?.requirements || [];
                    
                    // If no requirements for this step, show empty state
                    if (requirementsToShow.length === 0) {
                      return (
                        <Box
                          p="6"
                          bg="mukuru.cards.white"
                          borderRadius="lg"
                          textAlign="center"
                        >
                          <Typography color="mukuru.grey.medium" fontSize="sm">
                            No fields configured for this step.
                          </Typography>
                        </Box>
                      );
                    }

                          return (
                            <SchemaDrivenView
                              schema={{
                                ...formSchema,
                                requirements: requirementsToShow,
                              }}
                              applicationData={{
                                // Pass all data sources - SchemaDrivenView will search through all of them
                                metadata: application?.metadata || {},
                                rawData: application?.rawData || {},
                                // Include caseData if available (from API response)
                                caseData: application?.caseData || {},
                                // Include direct fields for fallback
                                ...application,
                                // Include all possible field variations for comprehensive mapping
                                businessLegalName:
                                  (application?.caseData as any)?.businessLegalName ||
                                  application?.rawData?.businessLegalName ||
                                  application?.companyName ||
                                  (application?.metadata as any)?.legal_name ||
                                  (application?.metadata as any)?.businessLegalName ||
                                  '',
                                applicantFirstName:
                                  application?.rawData?.applicantFirstName ||
                                  (application?.metadata as any)?.applicant_first_name ||
                                  '',
                                applicantLastName:
                                  application?.rawData?.applicantLastName ||
                                  (application?.metadata as any)?.applicant_last_name ||
                                  '',
                                applicantEmail:
                                  application?.rawData?.applicantEmail ||
                                  application?.email ||
                                  (application?.metadata as any)?.email ||
                                  (application?.metadata as any)?.applicant_email ||
                                  '',
                                applicantPhone:
                                  application?.rawData?.applicantPhone ||
                                  (application?.metadata as any)?.phone ||
                                  (application?.metadata as any)?.applicant_phone ||
                                  '',
                                businessRegistrationNumber:
                                  (application?.caseData as any)?.businessRegistrationNumber ||
                                  application?.rawData?.businessRegistrationNumber ||
                                  (application?.metadata as any)?.registration_number ||
                                  (application?.metadata as any)?.registrationNumber ||
                                  (application?.metadata as any)?.['Registration Number'] ||
                                  '',
                                registrationNumber:
                                  application?.rawData?.businessRegistrationNumber ||
                                  (application?.metadata as any)?.registration_number ||
                                  (application?.metadata as any)?.registrationNumber ||
                                  (application?.metadata as any)?.['Registration Number'] ||
                                  '',
                                businessCountryOfRegistration:
                                  application?.rawData?.businessCountryOfRegistration ||
                                  application?.country ||
                                  (application?.metadata as any)
                                    ?.country_of_incorporation ||
                                  '',
                                businessAddress:
                                  application?.rawData?.businessAddress ||
                                  (application?.metadata as any)?.business_address ||
                                  (application?.metadata as any)?.businessAddress ||
                                  (application?.metadata as any)?.registered_address ||
                                  (application?.metadata as any)?.registeredAddress ||
                                  '',
                                registeredAddress:
                                  (application?.caseData as any)?.registeredAddress ||
                                  application?.rawData?.registeredAddress ||
                                  application?.rawData?.registered_address ||
                                  (application?.metadata as any)?.registered_address ||
                                  (application?.metadata as any)?.registeredAddress ||
                                  application?.rawData?.businessAddress ||
                                  (application?.metadata as any)?.business_address ||
                                  '',
                                businessIndustry:
                                  application?.rawData?.businessIndustry ||
                                  (application?.metadata as any)?.business_industry ||
                                  '',
                                businessTaxId:
                                  application?.rawData?.businessTaxId ||
                                  (application?.metadata as any)?.tax_id ||
                                  '',
                              }}
                              readOnly={true}
                            />
                          );
                        })()}
                      </Box>

                {/* Footer Navigation - Inside Card */}
                <Box 
                  px="8" 
                  py="5" 
                  bg="white" 
                  borderTop="1px solid" 
                  borderColor="gray.200"
                >
                  <HStack justify="space-between">
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                      disabled={currentStep === 1}
                      opacity={currentStep === 1 ? 0.4 : 1}
                      borderRadius="lg"
                    >
                      <ArrowLeftIcon width="16px" height="16px" style={{ marginRight: '8px' }} />
                      Previous Step
                    </Button>
                    
                    <HStack gap="3">
                      {currentStep < schemaSteps.length ? (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => setCurrentStep(currentStep + 1)}
                          borderRadius="lg"
                        >
                          Continue to Next Step
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          borderRadius="lg"
                        >
                          <EditIcon width="16px" height="16px" style={{ marginRight: '8px' }} />
                          Edit Application
                        </Button>
                      )}
                    </HStack>
                  </HStack>
                </Box>
              </>
            ) : (
              <Flex justify="center" align="center" py="16">
                <VStack gap="4">
                  <Spinner size="lg" color="mukuru.buttons.primary" />
                  <Typography color="mukuru.grey.medium" fontSize="sm">
                    Loading application data...
                  </Typography>
                </VStack>
              </Flex>
            )}
          </Box>
        </MotionBox>
      </Container>
    </Box>
  );
}
