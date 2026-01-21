/* eslint-disable security/detect-object-injection */
import {
  entityConfigApiService,
  RequirementType,
  WizardConfiguration,
  EntityTypeRequirement,
} from '../services/entityConfigApi';

/**
 * Schema-driven renderer for entity configurations
 * Transforms entity configuration into a renderable schema structure
 */

export interface RenderableField {
  code: string;
  label: string;
  type: string;
  value: unknown;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  validationRules?: unknown;
  options?: Array<{ value: string; label: string }>;
  order: number;
}

export interface RenderableSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: RenderableField[];
}

export interface EntitySchema {
  entityTypeId: string;
  entityTypeCode: string;
  entityTypeDisplayName: string;
  sections: RenderableSection[];
  wizardConfiguration?: WizardConfiguration;
}

/**
 * Maps requirement types to section titles
 */
const requirementTypeToSectionTitle: Record<RequirementType, string> = {
  [RequirementType.Information]: 'Overview',
  [RequirementType.Document]: 'Documents',
  [RequirementType.ProofOfIdentity]: 'Identity Verification',
  [RequirementType.ProofOfAddress]: 'Address Verification',
  [RequirementType.OwnershipStructure]: 'Ownership',
  [RequirementType.BoardDirectors]: 'Directors',
  [RequirementType.AuthorizedSignatories]: 'Authorized Signatories',
};

/**
 * Maps requirement types to section descriptions
 */
const requirementTypeToSectionDescription: Record<RequirementType, string> = {
  [RequirementType.Information]: 'Basic entity information',
  [RequirementType.Document]: 'Required documents',
  [RequirementType.ProofOfIdentity]: 'Identity verification documents',
  [RequirementType.ProofOfAddress]: 'Address verification documents',
  [RequirementType.OwnershipStructure]: 'Shareholders and ownership structure',
  [RequirementType.BoardDirectors]: 'Board of directors information',
  [RequirementType.AuthorizedSignatories]: 'Authorized signatories and representatives',
};

/**
 * Fetches entity configuration and transforms it into a renderable schema
 * Now supports wizard configuration for step-based views
 */
export async function fetchEntitySchema(
  entityTypeCode: string,
  applicationData: Record<string, unknown>,
  useWizardConfiguration: boolean = true
): Promise<EntitySchema | null> {
  try {
    console.info(
      '[Schema Renderer] Fetching entity schema for code (as-is from application):',
      entityTypeCode,
      'useWizardConfiguration:',
      useWizardConfiguration
    );

    // Fetch entity type with requirements using the EXACT code from the application
    // No normalization - use what's stored in the application metadata
    const entityType = await entityConfigApiService.getEntityTypeByCode(
      entityTypeCode, // Use code directly as stored in application
      true // include requirements
    );

    console.info(
      '[Schema Renderer] Entity type response:',
      entityType
        ? {
            id: entityType.id,
            code: entityType.code,
            displayName: entityType.displayName,
            requirementsCount: entityType.requirements?.length || 0,
            hasRequirements: !!entityType.requirements,
            requirementsType: Array.isArray(entityType.requirements)
              ? 'array'
              : typeof entityType.requirements,
          }
        : 'null'
    );

    if (!entityType) {
      console.error(`[Schema Renderer] ❌ Entity type not found: ${entityTypeCode}`);
      return null;
    }

    // Check if requirements exist and is an array (empty array is OK, we'll handle it)
    if (!entityType.requirements || !Array.isArray(entityType.requirements)) {
      console.error(
        `[Schema Renderer] ❌ No requirements found for entity type: ${entityTypeCode}`,
        {
          entityTypeId: entityType.id,
          requirementsExists: !!entityType.requirements,
          requirementsType: typeof entityType.requirements,
          isArray: Array.isArray(entityType.requirements),
        }
      );
      return null;
    }

    if (entityType.requirements.length === 0) {
      console.warn(
        `[Schema Renderer] ⚠️ Entity type ${entityTypeCode} has no requirements configured`
      );
      // Return a schema with empty sections rather than null, so the UI can still render
      return {
        entityTypeId: entityType.id,
        entityTypeCode: entityType.code,
        entityTypeDisplayName: entityType.displayName || entityType.code,
        sections: [],
        wizardConfiguration: undefined,
      };
    }

    console.info(
      `[Schema Renderer] ✅ Found ${entityType.requirements.length} requirements`
    );

    // Fetch wizard configuration if enabled
    let wizardConfiguration: WizardConfiguration | null = null;
    if (useWizardConfiguration && entityType.id) {
      try {
        wizardConfiguration =
          await entityConfigApiService.getWizardConfigurationByEntityType(entityType.id);
        if (wizardConfiguration) {
          console.info(
            `[Schema Renderer] ✅ Found wizard configuration with ${wizardConfiguration.steps?.length || 0} steps`
          );
        } else {
          console.info(
            '[Schema Renderer] No wizard configuration found, using default sections'
          );
        }
      } catch (err) {
        console.warn('[Schema Renderer] Error fetching wizard configuration:', err);
        // Continue without wizard configuration
      }
    }

    // If wizard configuration exists, use it to organize sections
    let sections: RenderableSection[] = [];

    if (
      wizardConfiguration &&
      wizardConfiguration.steps &&
      wizardConfiguration.steps.length > 0
    ) {
      // Use wizard configuration steps to organize requirements
      console.info('[Schema Renderer] Using wizard configuration to organize sections');

      // Create a map of requirement codes to requirements for quick lookup
      const requirementMap = new Map<string, (typeof entityType.requirements)[0]>();
      for (const entityTypeReq of entityType.requirements) {
        if (entityTypeReq.requirement) {
          requirementMap.set(entityTypeReq.requirement.code, entityTypeReq);
        }
      }

      // Process each wizard step
      // For review, show ALL steps (not just active ones) so reviewers can see everything
      const sortedWizardSteps = [...wizardConfiguration.steps].sort(
        (a, b) => a.stepNumber - b.stepNumber
      );

      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(
          `[Schema Renderer] 🔍 DEBUG: Processing ${sortedWizardSteps.length} wizard steps (all steps for review)`
        );
        console.log(
          `[Schema Renderer] 🔍 DEBUG: Entity type has ${entityType.requirements.length} requirements`
        );
      }
      if (
        entityType.requirements.length > 0 &&
        typeof window !== 'undefined' &&
        process.env.NODE_ENV === 'development'
      ) {
        const firstReq = entityType.requirements[0] as any;
        console.log(`[Schema Renderer] 🔍 DEBUG: First requirement structure:`, {
          keys: Object.keys(firstReq),
          hasRequirement: !!firstReq.requirement,
          requirementType: firstReq.requirement?.type || firstReq.type,
          requirementDisplayName:
            firstReq.requirement?.displayName ||
            firstReq.displayName ||
            firstReq.display_name,
          requirementCode: firstReq.requirement?.code || firstReq.code,
          fullObject: firstReq,
        });
      }

      for (const wizardStep of sortedWizardSteps) {
        // Find requirements that match this step's requirement types
        const stepRequirements: EntityTypeRequirement[] = [];

        console.info(
          `[Schema Renderer] Processing wizard step: "${wizardStep.title}" (ID: ${wizardStep.id})`
        );
        console.info(
          `[Schema Renderer] Wizard step requirement types:`,
          wizardStep.requirementTypes
        );
        console.info(
          `[Schema Renderer] Total entity requirements to check:`,
          entityType.requirements.length
        );

        for (const entityTypeReq of entityType.requirements) {
          // Handle both nested (requirement.requirement) and flat (requirement has properties directly) structures
          const requirement = (entityTypeReq as any).requirement || entityTypeReq;

          if (
            !requirement ||
            (!requirement.type && !requirement.displayName && !requirement.code)
          ) {
            console.error(
              `[Schema Renderer] ⚠️⚠️⚠️ Entity requirement has no valid requirement data:`,
              entityTypeReq
            );
            continue;
          }

          // Normalize displayName (handle both camelCase and snake_case)
          const displayName =
            requirement.displayName ||
            requirement.display_name ||
            requirement.DisplayName ||
            '';
          const code = requirement.code || requirement.Code || '';
          const typeValue = requirement.type || requirement.Type || '';

          // Determine requirement type
          let reqType: RequirementType;
          if (typeof typeValue === 'number') {
            reqType = typeValue as RequirementType;
          } else if (typeof typeValue === 'string') {
            // Normalize the type value for case-insensitive matching
            const normalizedType = typeValue.trim();
            const lowerType = normalizedType.toLowerCase();

            // First, try case-insensitive partial match for common patterns (before exact match)
            // This ensures "DOCUMENTATION" is correctly identified as Document type
            if (lowerType.includes('document') || lowerType === 'documentation') {
              reqType = RequirementType.Document;
            } else if (
              lowerType.includes('identity') ||
              lowerType.includes('proofofidentity')
            ) {
              reqType = RequirementType.ProofOfIdentity;
            } else if (
              lowerType.includes('address') ||
              lowerType.includes('proofofaddress')
            ) {
              reqType = RequirementType.ProofOfAddress;
            } else if (lowerType.includes('ownership')) {
              reqType = RequirementType.OwnershipStructure;
            } else if (lowerType.includes('director') || lowerType.includes('board')) {
              reqType = RequirementType.BoardDirectors;
            } else if (
              lowerType.includes('signatory') ||
              lowerType.includes('authorized')
            ) {
              reqType = RequirementType.AuthorizedSignatories;
            } else {
              // Try exact match in typeMap
              const typeMap: Record<string, RequirementType> = {
                // Standard names (all case variations)
                Information: RequirementType.Information,
                information: RequirementType.Information,
                INFORMATION: RequirementType.Information,
                Document: RequirementType.Document,
                document: RequirementType.Document,
                DOCUMENT: RequirementType.Document,
                Documentation: RequirementType.Document,
                documentation: RequirementType.Document,
                DOCUMENTATION: RequirementType.Document,
                ProofOfIdentity: RequirementType.ProofOfIdentity,
                ProofOfAddress: RequirementType.ProofOfAddress,
                OwnershipStructure: RequirementType.OwnershipStructure,
                BoardDirectors: RequirementType.BoardDirectors,
                AuthorizedSignatories: RequirementType.AuthorizedSignatories,
                // Numeric values
                '1': RequirementType.Information,
                '2': RequirementType.Document,
                '3': RequirementType.ProofOfIdentity,
                '4': RequirementType.ProofOfAddress,
                '5': RequirementType.OwnershipStructure,
                '6': RequirementType.BoardDirectors,
                '7': RequirementType.AuthorizedSignatories,
              };
              // Try exact match
              reqType =
                typeMap[normalizedType] ||
                typeMap[normalizedType.toLowerCase()] ||
                typeMap[normalizedType.toUpperCase()] ||
                RequirementType.Information;
            }
          } else {
            reqType = RequirementType.Information;
          }

          // Log the type mapping for debugging (only in development)
          const mappedTypeName =
            Object.keys(RequirementType).find(
              (key) => RequirementType[key as keyof typeof RequirementType] === reqType
            ) || 'Unknown';
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.log(
              `[Schema Renderer] 🔍 Type mapping: "${typeValue}" -> ${mappedTypeName}/${reqType}`
            );
          }

          // Check if this requirement type matches the wizard step's requirement types
          // Try multiple matching strategies
          const reqTypeName = mappedTypeName;
          const reqTypeString = String(reqType);
          const reqTypeNameLower = reqTypeName.toLowerCase();

          const matches = wizardStep.requirementTypes.some((rt) => {
            const rtLower = String(rt).toLowerCase().trim();
            const rtString = String(rt).trim();
            const rtUpper = String(rt).toUpperCase().trim();

            // Convert wizard step requirement type to numeric if it's a string name
            let rtNumeric: number | null = null;
            if (rtUpper === 'INFORMATION' || rtLower === 'information') {
              rtNumeric = RequirementType.Information;
            } else if (
              rtUpper === 'DOCUMENT' ||
              rtLower === 'document' ||
              rtUpper === 'DOCUMENTATION' ||
              rtLower === 'documentation'
            ) {
              rtNumeric = RequirementType.Document;
            } else if (rtUpper === 'PROOFOFIDENTITY' || rtLower === 'proofofidentity') {
              rtNumeric = RequirementType.ProofOfIdentity;
            } else if (rtUpper === 'PROOFOFADDRESS' || rtLower === 'proofofaddress') {
              rtNumeric = RequirementType.ProofOfAddress;
            } else if (
              rtUpper === 'OWNERSHIPSTRUCTURE' ||
              rtLower === 'ownershipstructure'
            ) {
              rtNumeric = RequirementType.OwnershipStructure;
            } else if (rtUpper === 'BOARDDIRECTORS' || rtLower === 'boarddirectors') {
              rtNumeric = RequirementType.BoardDirectors;
            } else if (
              rtUpper === 'AUTHORIZEDSIGNATORIES' ||
              rtLower === 'authorizedsignatories'
            ) {
              rtNumeric = RequirementType.AuthorizedSignatories;
            } else if (!isNaN(Number(rtString))) {
              rtNumeric = Number(rtString);
            }

            // Try multiple matching strategies - prioritize numeric comparison for accuracy
            const match =
              // Numeric value matches (most reliable)
              (rtNumeric !== null && rtNumeric === reqType) ||
              rtString === String(reqType) ||
              // Exact string matches
              rt === reqTypeName ||
              rtUpper === reqTypeName.toUpperCase() ||
              // Case-insensitive string matches
              rtLower === reqTypeNameLower ||
              // Special handling for DOCUMENTATION/Document variations
              (reqType === RequirementType.Document &&
                (rtUpper === 'DOCUMENTATION' ||
                  rtLower === 'documentation' ||
                  rtLower === 'document' ||
                  rtUpper === 'DOCUMENT')) ||
              (reqType === RequirementType.Information &&
                (rtUpper === 'INFORMATION' || rtLower === 'information')) ||
              // Handle underscores and dashes
              rtLower.replace(/[_-]/g, '') === reqTypeNameLower.replace(/[_-]/g, '') ||
              // Enum value matches
              rt ===
                String(
                  RequirementType[reqType as unknown as keyof typeof RequirementType] ||
                    ''
                );

            return match;
          });

          if (matches) {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
              console.log(
                `[Schema Renderer] ✅ MATCHED requirement "${displayName}" (type: ${reqTypeName}/${reqType}, code: ${code}) to wizard step "${wizardStep.title}"`
              );
            }
            stepRequirements.push(entityTypeReq);
          } else {
            // Only log no-match in development to reduce console noise
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
              console.debug(
                `[Schema Renderer] ❌ NO MATCH - Requirement "${displayName}" (type: ${reqTypeName}/${reqType}, code: ${code}) did NOT match wizard step "${wizardStep.title}" requirement types:`,
                JSON.stringify(wizardStep.requirementTypes, null, 2)
              );
            }
          }
        }

        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log(
            `[Schema Renderer] 📊 SUMMARY for wizard step "${wizardStep.title}": Found ${stepRequirements.length} matching requirements out of ${entityType.requirements.length} total`
          );
        }
        if (stepRequirements.length === 0) {
          console.warn(
            `[Schema Renderer] ⚠️ NO REQUIREMENTS MATCHED for wizard step "${wizardStep.title}". Wizard step expects:`,
            JSON.stringify(wizardStep.requirementTypes, null, 2)
          );
        }

        // Create section from wizard step
        const section: RenderableSection = {
          id: wizardStep.id || `step-${wizardStep.stepNumber}`,
          title: wizardStep.title,
          description: wizardStep.subtitle || undefined,
          order: wizardStep.stepNumber,
          fields: [],
        };

        // Add fields from matching requirements
        for (const entityTypeReq of stepRequirements) {
          // Handle both nested and flat requirement structures
          const requirement = (entityTypeReq as any).requirement || entityTypeReq;
          if (!requirement || (!requirement.code && !requirement.displayName)) continue;

          // Normalize property names
          const reqCode = requirement.code || requirement.Code || '';
          const reqDisplayName =
            requirement.displayName ||
            requirement.display_name ||
            requirement.DisplayName ||
            '';
          const reqFieldType =
            requirement.fieldType ||
            requirement.field_type ||
            requirement.FieldType ||
            'text';
          const reqHelpText =
            requirement.helpText || requirement.help_text || requirement.HelpText || '';
          const reqValidationRules =
            requirement.validationRules ||
            requirement.validation_rules ||
            requirement.ValidationRules;

          const fieldValue = mapRequirementCodeToValue(reqCode, applicationData);

          const field: RenderableField = {
            code: reqCode,
            label: reqDisplayName,
            type: reqFieldType,
            value: fieldValue,
            placeholder: reqHelpText,
            helpText: reqHelpText,
            isRequired:
              entityTypeReq.isRequired !== undefined
                ? entityTypeReq.isRequired
                : (entityTypeReq as any).is_required !== undefined
                  ? (entityTypeReq as any).is_required
                  : false,
            validationRules: reqValidationRules
              ? typeof reqValidationRules === 'string'
                ? JSON.parse(reqValidationRules)
                : reqValidationRules
              : undefined,
            options: requirement.options?.map((opt: any) => ({
              value: opt.value || opt.Value,
              label:
                opt.displayText ||
                opt.display_text ||
                opt.DisplayText ||
                opt.label ||
                opt.Label,
            })),
            order:
              entityTypeReq.displayOrder !== undefined
                ? entityTypeReq.displayOrder
                : (entityTypeReq as any).display_order || 0,
          };

          section.fields.push(field);
        }

        // Sort fields within section
        section.fields.sort((a, b) => a.order - b.order);

        // Always add section, even if empty (for review purposes, we want to show all wizard steps)
        // The UI will handle displaying "No requirements" message
        sections.push(section);

        console.info(
          `[Schema Renderer] Created section for wizard step "${section.title}": ${section.fields.length} fields`
        );
      }
    } else {
      // Fallback to requirement type grouping (original behavior)
      console.info(
        '[Schema Renderer] Using requirement type grouping (no wizard config)'
      );
      const sectionsMap = new Map<RequirementType, RenderableSection>();

      // Process each requirement
      for (const entityTypeReq of entityType.requirements) {
        const requirement = entityTypeReq.requirement;
        if (!requirement) continue;

        // Determine requirement type
        let reqType: RequirementType;
        if (typeof requirement.type === 'number') {
          reqType = requirement.type as RequirementType;
        } else if (typeof requirement.type === 'string') {
          const typeMap: Record<string, RequirementType> = {
            Information: RequirementType.Information,
            Document: RequirementType.Document,
            ProofOfIdentity: RequirementType.ProofOfIdentity,
            ProofOfAddress: RequirementType.ProofOfAddress,
            OwnershipStructure: RequirementType.OwnershipStructure,
            BoardDirectors: RequirementType.BoardDirectors,
            AuthorizedSignatories: RequirementType.AuthorizedSignatories,
            '1': RequirementType.Information,
            '2': RequirementType.Document,
            '3': RequirementType.ProofOfIdentity,
            '4': RequirementType.ProofOfAddress,
            '5': RequirementType.OwnershipStructure,
            '6': RequirementType.BoardDirectors,
            '7': RequirementType.AuthorizedSignatories,
          };
          reqType = typeMap[requirement.type] || RequirementType.Information;
        } else {
          reqType = RequirementType.Information;
        }

        // Get or create section
        if (!sectionsMap.has(reqType)) {
          sectionsMap.set(reqType, {
            id: `section-${reqType}`,
            title: requirementTypeToSectionTitle[reqType] || 'Other',
            description: requirementTypeToSectionDescription[reqType],
            order: reqType,
            fields: [],
          });
        }

        const section = sectionsMap.get(reqType)!;

        // Map application data to field value
        const fieldValue = mapRequirementCodeToValue(requirement.code, applicationData);

        // Create renderable field
        const field: RenderableField = {
          code: requirement.code,
          label: requirement.displayName,
          type: requirement.fieldType,
          value: fieldValue,
          placeholder: requirement.helpText,
          helpText: requirement.helpText,
          isRequired: entityTypeReq.isRequired,
          validationRules: requirement.validationRules
            ? JSON.parse(requirement.validationRules)
            : undefined,
          options: requirement.options?.map((opt) => ({
            value: opt.value,
            label: opt.displayText,
          })),
          order: entityTypeReq.displayOrder,
        };

        section.fields.push(field);
      }

      // Sort fields within each section by order
      sectionsMap.forEach((section) => {
        section.fields.sort((a, b) => a.order - b.order);
      });

      // Convert map to array and sort by order
      sections = Array.from(sectionsMap.values()).sort((a, b) => a.order - b.order);
    }

    console.info(
      `[Schema Renderer] ✅ Created ${sections.length} sections:`,
      sections.map((s) => ({
        id: s.id,
        title: s.title,
        fieldsCount: s.fields.length,
      }))
    );

    const schema = {
      entityTypeId: entityType.id,
      entityTypeCode: entityType.code,
      entityTypeDisplayName: entityType.displayName,
      sections,
      wizardConfiguration: wizardConfiguration || undefined,
    };

    console.info('[Schema Renderer] ✅ Schema created successfully:', {
      sectionsCount: sections.length,
      hasWizardConfig: !!wizardConfiguration,
      wizardSteps: wizardConfiguration?.steps?.length || 0,
    });
    return schema;
  } catch (error) {
    console.error('[Schema Renderer] ❌ Error fetching entity schema:', error);
    console.error(
      '[Schema Renderer] Error details:',
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : error
    );
    return null;
  }
}

/**
 * Maps requirement codes to application data values
 * This function needs to handle various requirement codes and map them to the appropriate
 * fields in the application data structure
 */
function mapRequirementCodeToValue(
  requirementCode: string,
  applicationData: Record<string, unknown>
): unknown {
  const _code = requirementCode.toUpperCase();
  // Handle both snake_case (metadata_json) and camelCase (metadataJson) from backend
  const metadataRaw = applicationData.metadata_json || applicationData.metadataJson;
  const metadata = metadataRaw
    ? typeof metadataRaw === 'string'
      ? JSON.parse(metadataRaw)
      : metadataRaw
    : {};

  // Debug logging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(
      `[Map Requirement] Looking for code: "${requirementCode}" (normalized: "${_code}")`
    );
    console.log(
      `[Map Requirement] Application data keys:`,
      Object.keys(applicationData).slice(0, 20)
    );
    console.log(`[Map Requirement] Metadata keys:`, Object.keys(metadata).slice(0, 20));
    console.log(`[Map Requirement] Sample metadata values:`, {
      businessLegalName: applicationData.businessLegalName,
      businessRegistrationNumber: applicationData.businessRegistrationNumber,
      businessAddress: applicationData.businessAddress,
      registration_number: metadata.registration_number,
      registered_address: metadata.registered_address,
      legal_name: metadata.legal_name,
    });
  }

  // Map common requirement codes to application data fields
  const mapping: Record<string, (data: Record<string, unknown>) => unknown> = {
    // Legal name / Business name
    LEGAL_NAME: (data) =>
      data.businessLegalName ||
      data.business_legal_name ||
      metadata.legal_name ||
      metadata.businessLegalName ||
      metadata.registered_legal_name ||
      `${data.applicantFirstName || data.applicant_first_name || ''} ${data.applicantLastName || data.applicant_last_name || ''}`.trim() ||
      '',
    REGISTERED_LEGAL_NAME: (data) =>
      metadata.registered_legal_name ||
      data.businessLegalName ||
      data.business_legal_name ||
      metadata.legal_name ||
      metadata.businessLegalName ||
      '',

    // Registration number
    REGISTRATION_NUMBER: (data) =>
      data.businessRegistrationNumber ||
      metadata.registration_number ||
      metadata.registrationNumber ||
      metadata.registered_number ||
      metadata.registeredNumber ||
      metadata.reg_number ||
      metadata.regNumber ||
      '',
    REGISTERED_NUMBER: (data) =>
      data.businessRegistrationNumber ||
      metadata.registered_number ||
      metadata.registeredNumber ||
      metadata.registration_number ||
      metadata.registrationNumber ||
      '',

    // Tax ID / TIN
    TAX_ID: (data) =>
      data.businessTaxId ||
      metadata.tax_id ||
      metadata.taxId ||
      metadata.tax_number ||
      '',
    TAX_NUMBER: (data) =>
      data.businessTaxId ||
      metadata.tax_id ||
      metadata.taxId ||
      metadata.tax_number ||
      '',

    // Country of registration/incorporation
    COUNTRY_OF_INCORPORATION: (data) =>
      data.businessCountryOfRegistration ||
      metadata.country_of_incorporation ||
      metadata.countryOfIncorporation ||
      metadata.countryOfRegistration ||
      data.applicantCountry ||
      '',

    // Business address
    BUSINESS_ADDRESS: (data) =>
      data.businessAddress ||
      metadata.business_address ||
      metadata.businessAddress ||
      metadata.registered_address ||
      metadata.registeredAddress ||
      metadata.address ||
      data.applicantAddress ||
      '',
    REGISTERED_ADDRESS: (data) =>
      data.businessAddress ||
      metadata.registered_address ||
      metadata.registeredAddress ||
      metadata.business_address ||
      metadata.businessAddress ||
      metadata.address ||
      data.applicantAddress ||
      '',

    // Industry / Nature of business
    BUSINESS_NATURE: (data) =>
      data.businessIndustry ||
      metadata.business_nature ||
      metadata.businessNature ||
      metadata.industry ||
      '',
    NATURE_OF_BUSINESS: (data) =>
      data.businessIndustry ||
      metadata.nature_of_business ||
      metadata.natureOfBusiness ||
      metadata.business_nature ||
      metadata.businessNature ||
      metadata.industry ||
      '',

    // Contact person / Primary contact
    CONTACT_PERSON: (data) =>
      `${data.applicantFirstName || ''} ${data.applicantLastName || ''}`.trim() ||
      metadata.contact_person ||
      metadata.contactPerson ||
      metadata.primary_contact_person ||
      metadata.primaryContactPerson ||
      '',
    PRIMARY_CONTACT_PERSON: (data) =>
      `${data.applicantFirstName || ''} ${data.applicantLastName || ''}`.trim() ||
      metadata.primary_contact_person ||
      metadata.primaryContactPerson ||
      metadata.contact_person ||
      metadata.contactPerson ||
      '',

    // Contact email
    CONTACT_EMAIL: (data) =>
      data.applicantEmail || metadata.contact_email || metadata.contactEmail || '',

    // Contact phone
    CONTACT_PHONE: (data) =>
      data.applicantPhone || metadata.contact_phone || metadata.contactPhone || '',

    // Applicant first name
    APPLICANT_FIRST_NAME: (data) =>
      data.applicantFirstName ||
      metadata.applicant_first_name ||
      metadata.applicantFirstName ||
      '',

    // Applicant last name
    APPLICANT_LAST_NAME: (data) =>
      data.applicantLastName ||
      metadata.applicant_last_name ||
      metadata.applicantLastName ||
      '',

    // Applicant email
    APPLICANT_EMAIL: (data) =>
      data.applicantEmail || metadata.applicant_email || metadata.applicantEmail || '',

    // Applicant phone
    APPLICANT_PHONE: (data) =>
      data.applicantPhone || metadata.applicant_phone || metadata.applicantPhone || '',

    // Applicant date of birth
    APPLICANT_DATE_OF_BIRTH: (data) =>
      data.applicantDateOfBirth ||
      metadata.applicant_date_of_birth ||
      metadata.applicantDateOfBirth ||
      '',

    // Applicant nationality
    APPLICANT_NATIONALITY: (data) =>
      data.applicantNationality ||
      metadata.applicant_nationality ||
      metadata.applicantNationality ||
      '',

    // Applicant address
    APPLICANT_ADDRESS: (data) =>
      data.applicantAddress ||
      metadata.applicant_address ||
      metadata.applicantAddress ||
      '',

    // Number of employees
    NUMBER_OF_EMPLOYEES: (data) =>
      data.businessNumberOfEmployees ||
      metadata.number_of_employees ||
      metadata.numberOfEmployees ||
      '',

    // Annual revenue
    ANNUAL_REVENUE: (data) =>
      data.businessAnnualRevenue ||
      metadata.annual_revenue ||
      metadata.annualRevenue ||
      '',

    // Date of incorporation
    DATE_OF_INCORPORATION: (_data) =>
      metadata.date_of_incorporation ||
      metadata.dateOfIncorporation ||
      metadata.incorporation_date ||
      metadata.incorporationDate ||
      '',
    INCORPORATION_DATE: (_data) =>
      metadata.date_of_incorporation ||
      metadata.dateOfIncorporation ||
      metadata.incorporation_date ||
      metadata.incorporationDate ||
      '',

    // Document uploads - these are stored as JSON strings in metadata
    PROOF_OF_ADDRESS: (_data) => metadata.proof_of_address || metadata.proofOfAddress || '',
    PROOF_OF_LISTING: (_data) => metadata.proof_of_listing || metadata.proofOfListing || '',
    CERTIFICATE_INCORPORATION: (_data) =>
      metadata.certificate_incorporation ||
      metadata.certificateIncorporation ||
      metadata.certificate_of_incorporation ||
      metadata.certificateOfIncorporation ||
      '',
    CERTIFICATE_OF_INCORPORATION: (_data) =>
      metadata.certificate_of_incorporation ||
      metadata.certificateOfIncorporation ||
      metadata.certificate_incorporation ||
      metadata.certificateIncorporation ||
      '',
  };

  // Try direct mapping first
  if (mapping[_code]) {
    const mappedValue = mapping[_code](applicationData);
    if (mappedValue && mappedValue !== '') {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(
          `[Map Requirement] ✅ Found via mapping for "${requirementCode}":`,
          mappedValue
        );
      }
      return mappedValue;
    }
  }

  // Fallback 1: try to find in metadata by exact code match (case-insensitive)
  const metadataKey = Object.keys(metadata).find(
    (key) =>
      key.toUpperCase() === _code ||
      key.toUpperCase().replace(/_/g, '') === _code.replace(/_/g, '')
  );
  if (
    metadataKey &&
    metadata[metadataKey] !== null &&
    metadata[metadataKey] !== undefined &&
    metadata[metadataKey] !== ''
  ) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(
        `[Map Requirement] ✅ Found in metadata by exact match for "${requirementCode}":`,
        metadata[metadataKey]
      );
    }
    return metadata[metadataKey];
  }

  // Fallback 2: try camelCase version in metadata
  const camelCaseKey = _code
    .toLowerCase()
    .split('_')
    .map((word: string, index: number) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
  if (
    metadata[camelCaseKey] !== null &&
    metadata[camelCaseKey] !== undefined &&
    metadata[camelCaseKey] !== ''
  ) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(
        `[Map Requirement] ✅ Found in metadata by camelCase for "${requirementCode}":`,
        metadata[camelCaseKey]
      );
    }
    return metadata[camelCaseKey];
  }

  // Fallback 3: try direct access in applicationData (case-insensitive)
  const appDataKey = Object.keys(applicationData).find(
    (key) =>
      key.toUpperCase() === _code ||
      key.toUpperCase().replace(/_/g, '') === _code.replace(/_/g, '')
  );
  if (
    appDataKey &&
    applicationData[appDataKey] !== null &&
    applicationData[appDataKey] !== undefined &&
    applicationData[appDataKey] !== ''
  ) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(
        `[Map Requirement] ✅ Found in applicationData for "${requirementCode}":`,
        applicationData[appDataKey]
      );
    }
    return applicationData[appDataKey];
  }

  // Fallback 4: try partial match in metadata (contains the code)
  const partialMatch = Object.keys(metadata).find(
    (key) => key.toUpperCase().includes(_code) || _code.includes(key.toUpperCase())
  );
  if (
    partialMatch &&
    metadata[partialMatch] !== null &&
    metadata[partialMatch] !== undefined &&
    metadata[partialMatch] !== ''
  ) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(
        `[Map Requirement] ✅ Found in metadata by partial match for "${requirementCode}":`,
        metadata[partialMatch]
      );
    }
    return metadata[partialMatch];
  }

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      `[Map Requirement] ❌ No value found for requirement code: "${requirementCode}" (normalized: "${_code}")`
    );
    console.warn(`[Map Requirement] Available metadata keys:`, Object.keys(metadata));
    console.warn(
      `[Map Requirement] Available applicationData keys:`,
      Object.keys(applicationData).slice(0, 30)
    );
  }

  return '';
}

/**
 * Normalizes entity type code for lookup by matching against database entity types
 * Fetches actual entity types from the database and matches the input against codes and display names
 */
export async function normalizeEntityTypeCode(entityType: string): Promise<string> {
  if (!entityType) return '';

  console.info('[Normalize] Input entity type:', entityType);

  try {
    // Fetch all entity types from the database
    const allEntityTypes = await entityConfigApiService.getEntityTypes(false, false);

    if (!allEntityTypes || allEntityTypes.length === 0) {
      console.warn('[Normalize] ⚠️ No entity types found in database, using input as-is');
      return entityType.trim().toUpperCase().replace(/\s+/g, '_');
    }

    const inputNormalized = entityType.trim();
    const inputUpper = inputNormalized.toUpperCase();
    const inputUpperNoSpaces = inputUpper.replace(/\s+/g, '_');

    // Try to match against database entity types
    // 1. Exact match on code (case-insensitive)
    let matched = allEntityTypes.find(
      (et) =>
        et.code.toUpperCase() === inputUpperNoSpaces ||
        et.code.toUpperCase() === inputUpper ||
        et.code.toUpperCase().replace(/_/g, '') ===
          inputUpper.replace(/\s+/g, '').replace(/_/g, '')
    );

    if (matched) {
      console.info('[Normalize] ✅ Matched by code:', matched.code);
      return matched.code;
    }

    // 2. Match by display name (case-insensitive, flexible)
    matched = allEntityTypes.find((et) => {
      const displayNameUpper = et.displayName.toUpperCase();
      const displayNameNoSpaces = displayNameUpper.replace(/\s+/g, '_');

      return (
        displayNameUpper === inputUpper ||
        displayNameUpper.includes(inputUpper) ||
        inputUpper.includes(displayNameUpper) ||
        displayNameNoSpaces === inputUpperNoSpaces ||
        displayNameNoSpaces.includes(inputUpperNoSpaces) ||
        inputUpperNoSpaces.includes(displayNameNoSpaces)
      );
    });

    if (matched) {
      console.info(
        '[Normalize] ✅ Matched by display name:',
        matched.code,
        '(display:',
        matched.displayName,
        ')'
      );
      return matched.code;
    }

    // 3. Partial match - check if input contains key words from display name or vice versa
    const inputWords = inputUpper.split(/\s+|_/).filter((w) => w.length > 2);
    matched = allEntityTypes.find((et) => {
      const displayWords = et.displayName
        .toUpperCase()
        .split(/\s+|_/)
        .filter((w) => w.length > 2);
      const codeWords = et.code
        .toUpperCase()
        .split('_')
        .filter((w) => w.length > 2);

      // Check if significant words match
      const hasMatchingWords = inputWords.some(
        (iw) =>
          displayWords.some((dw) => dw.includes(iw) || iw.includes(dw)) ||
          codeWords.some((cw) => cw.includes(iw) || iw.includes(cw))
      );

      return hasMatchingWords;
    });

    if (matched) {
      console.info(
        '[Normalize] ✅ Matched by partial match:',
        matched.code,
        '(display:',
        matched.displayName,
        ')'
      );
      return matched.code;
    }

    // 4. If no match found, return empty string (no fallback)
    console.error(
      '[Normalize] ❌ No match found in database. Available entity types:',
      allEntityTypes.map((et) => `${et.code} (${et.displayName})`).join(', ')
    );
    console.error(
      '[Normalize] ❌ Input entity type does not exist in database:',
      entityType
    );

    return ''; // Return empty to indicate failure - no fallback
  } catch (error) {
    console.error('[Normalize] ❌ Error fetching entity types from database:', error);
    // NO FALLBACK - return empty if database fetch fails
    return '';
  }
}
