import { entityConfigApiService, EntityType, Requirement, RequirementType } from '../services/entityConfigApi';

/**
 * Schema-driven renderer for entity configurations
 * Transforms entity configuration into a renderable schema structure
 */

export interface RenderableField {
  code: string;
  label: string;
  type: string;
  value: any;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  validationRules?: any;
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
 */
export async function fetchEntitySchema(
  entityTypeCode: string,
  applicationData: Record<string, any>
): Promise<EntitySchema | null> {
  try {
    console.log('[Schema Renderer] Fetching entity schema for code (as-is from application):', entityTypeCode);
    
    // Fetch entity type with requirements using the EXACT code from the application
    // No normalization - use what's stored in the application metadata
    const entityType = await entityConfigApiService.getEntityTypeByCode(
      entityTypeCode, // Use code directly as stored in application
      true // include requirements
    );

    console.log('[Schema Renderer] Entity type response:', entityType ? {
      id: entityType.id,
      code: entityType.code,
      displayName: entityType.displayName,
      requirementsCount: entityType.requirements?.length || 0
    } : 'null');

    if (!entityType || !entityType.requirements) {
      console.error(`[Schema Renderer] ❌ No entity configuration found for entity type: ${entityTypeCode}`);
      return null;
    }

    console.log(`[Schema Renderer] ✅ Found ${entityType.requirements.length} requirements`);

    // Group requirements by requirement type
    const sectionsMap = new Map<RequirementType, RenderableSection>();

    // Process each requirement
    for (const entityTypeReq of entityType.requirements) {
      const requirement = entityTypeReq.requirement;
      if (!requirement) continue;

      // Determine requirement type
      // The type field is serialized as a string (enum name) from the backend
      let reqType: RequirementType;
      if (typeof requirement.type === 'number') {
        reqType = requirement.type as RequirementType;
      } else if (typeof requirement.type === 'string') {
        // Map string enum names to RequirementType enum values
        const typeMap: Record<string, RequirementType> = {
          'Information': RequirementType.Information,
          'Document': RequirementType.Document,
          'ProofOfIdentity': RequirementType.ProofOfIdentity,
          'ProofOfAddress': RequirementType.ProofOfAddress,
          'OwnershipStructure': RequirementType.OwnershipStructure,
          'BoardDirectors': RequirementType.BoardDirectors,
          'AuthorizedSignatories': RequirementType.AuthorizedSignatories,
          // Also handle numeric strings as fallback
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
        reqType = RequirementType.Information; // Default fallback
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
        options: requirement.options?.map(opt => ({
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
    const sections = Array.from(sectionsMap.values()).sort(
      (a, b) => a.order - b.order
    );

    console.log(`[Schema Renderer] ✅ Created ${sections.length} sections:`, sections.map(s => ({
      id: s.id,
      title: s.title,
      fieldsCount: s.fields.length
    })));

    const schema = {
      entityTypeId: entityType.id,
      entityTypeCode: entityType.code,
      entityTypeDisplayName: entityType.displayName,
      sections,
    };

    console.log('[Schema Renderer] ✅ Schema created successfully:', schema);
    return schema;
  } catch (error) {
    console.error('[Schema Renderer] ❌ Error fetching entity schema:', error);
    console.error('[Schema Renderer] Error details:', error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error);
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
  applicationData: Record<string, any>
): any {
  const code = requirementCode.toUpperCase();
  const metadata = applicationData.metadataJson
    ? (typeof applicationData.metadataJson === 'string'
        ? JSON.parse(applicationData.metadataJson)
        : applicationData.metadataJson)
    : {};

  // Map common requirement codes to application data fields
  const mapping: Record<string, (data: any) => any> = {
    // Legal name / Business name
    LEGAL_NAME: (data) =>
      data.businessLegalName ||
      metadata.legal_name ||
      metadata.businessLegalName ||
      `${data.applicantFirstName || ''} ${data.applicantLastName || ''}`.trim() ||
      '',
    
    // Registration number
    REGISTRATION_NUMBER: (data) =>
      data.businessRegistrationNumber ||
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
      data.applicantEmail ||
      metadata.contact_email ||
      metadata.contactEmail ||
      '',
    
    // Contact phone
    CONTACT_PHONE: (data) =>
      data.applicantPhone ||
      metadata.contact_phone ||
      metadata.contactPhone ||
      '',
    
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
      data.applicantEmail ||
      metadata.applicant_email ||
      metadata.applicantEmail ||
      '',
    
    // Applicant phone
    APPLICANT_PHONE: (data) =>
      data.applicantPhone ||
      metadata.applicant_phone ||
      metadata.applicantPhone ||
      '',
    
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
    DATE_OF_INCORPORATION: (data) =>
      metadata.date_of_incorporation ||
      metadata.dateOfIncorporation ||
      metadata.incorporation_date ||
      metadata.incorporationDate ||
      '',
    INCORPORATION_DATE: (data) =>
      metadata.date_of_incorporation ||
      metadata.dateOfIncorporation ||
      metadata.incorporation_date ||
      metadata.incorporationDate ||
      '',
  };

  // Try direct mapping first
  if (mapping[code]) {
    return mapping[code](applicationData);
  }

  // Fallback: try to find in metadata by code (case-insensitive)
  const metadataKey = Object.keys(metadata).find(
    (key) => key.toUpperCase() === code || key.toUpperCase().replace(/_/g, '') === code.replace(/_/g, '')
  );
  if (metadataKey) {
    return metadata[metadataKey];
  }

  // Final fallback: try camelCase version in metadata
  const camelCaseKey = code
    .toLowerCase()
    .split('_')
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
  if (metadata[camelCaseKey]) {
    return metadata[camelCaseKey];
  }

  return '';
}

/**
 * Normalizes entity type code for lookup by matching against database entity types
 * Fetches actual entity types from the database and matches the input against codes and display names
 */
export async function normalizeEntityTypeCode(entityType: string): Promise<string> {
  if (!entityType) return '';
  
  console.log('[Normalize] Input entity type:', entityType);
  
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
    let matched = allEntityTypes.find(et => 
      et.code.toUpperCase() === inputUpperNoSpaces ||
      et.code.toUpperCase() === inputUpper ||
      et.code.toUpperCase().replace(/_/g, '') === inputUpper.replace(/\s+/g, '').replace(/_/g, '')
    );
    
    if (matched) {
      console.log('[Normalize] ✅ Matched by code:', matched.code);
      return matched.code;
    }
    
    // 2. Match by display name (case-insensitive, flexible)
    matched = allEntityTypes.find(et => {
      const displayNameUpper = et.displayName.toUpperCase();
      const displayNameNoSpaces = displayNameUpper.replace(/\s+/g, '_');
      
      return displayNameUpper === inputUpper ||
             displayNameUpper.includes(inputUpper) ||
             inputUpper.includes(displayNameUpper) ||
             displayNameNoSpaces === inputUpperNoSpaces ||
             displayNameNoSpaces.includes(inputUpperNoSpaces) ||
             inputUpperNoSpaces.includes(displayNameNoSpaces);
    });
    
    if (matched) {
      console.log('[Normalize] ✅ Matched by display name:', matched.code, '(display:', matched.displayName, ')');
      return matched.code;
    }
    
    // 3. Partial match - check if input contains key words from display name or vice versa
    const inputWords = inputUpper.split(/\s+|_/).filter(w => w.length > 2);
    matched = allEntityTypes.find(et => {
      const displayWords = et.displayName.toUpperCase().split(/\s+|_/).filter(w => w.length > 2);
      const codeWords = et.code.toUpperCase().split('_').filter(w => w.length > 2);
      
      // Check if significant words match
      const hasMatchingWords = inputWords.some(iw => 
        displayWords.some(dw => dw.includes(iw) || iw.includes(dw)) ||
        codeWords.some(cw => cw.includes(iw) || iw.includes(cw))
      );
      
      return hasMatchingWords;
    });
    
    if (matched) {
      console.log('[Normalize] ✅ Matched by partial match:', matched.code, '(display:', matched.displayName, ')');
      return matched.code;
    }
    
    // 4. If no match found, return empty string (no fallback)
    console.error('[Normalize] ❌ No match found in database. Available entity types:', 
      allEntityTypes.map(et => `${et.code} (${et.displayName})`).join(', '));
    console.error('[Normalize] ❌ Input entity type does not exist in database:', entityType);
    
    return ''; // Return empty to indicate failure - no fallback
    
  } catch (error) {
    console.error('[Normalize] ❌ Error fetching entity types from database:', error);
    // NO FALLBACK - return empty if database fetch fails
    return '';
  }
}

