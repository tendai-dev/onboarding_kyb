'use client';

import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
  Heading,
} from '@chakra-ui/react';

interface SchemaField {
  code: string;
  label: string;
  type: string;
  value?: any;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  options?: Array<{ value: string; label: string }>;
  order?: number;
}

interface SchemaSection {
  id: string;
  title: string;
  description?: string;
  fields: SchemaField[];
  order?: number;
}

interface SchemaDrivenViewProps {
  schema: any; // Form schema from API
  applicationData: Record<string, any>; // Application metadata and rawData
  readOnly?: boolean;
}

/**
 * Maps application data to schema field values
 * Uses comprehensive mapping similar to admin entitySchemaRenderer
 */
function mapDataToFieldValue(
  fieldCode: string,
  applicationData: Record<string, any>
): any {
  const metadata = applicationData.metadata || {};
  const rawData = applicationData.rawData || {};
  const code = fieldCode.toUpperCase();
  
  // Comprehensive mapping for common requirement codes
  const mapping: Record<string, (data: any) => any> = {
    // Legal name / Business name
    LEGAL_NAME: (data) =>
      data.businessLegalName ||
      metadata.legal_name ||
      metadata.businessLegalName ||
      metadata.legalName ||
      rawData.businessLegalName ||
      rawData.legal_name ||
      `${data.applicantFirstName || ''} ${data.applicantLastName || ''}`.trim() ||
      '',
    
    // Registration number
    REGISTRATION_NUMBER: (data) =>
      rawData.businessRegistrationNumber ||
      metadata.registration_number ||
      metadata.registrationNumber ||
      metadata.registration_number ||
      rawData.registrationNumber ||
      '',
    
    // Tax ID / TIN
    TAX_ID: (data) =>
      rawData.businessTaxId ||
      metadata.tax_id ||
      metadata.taxId ||
      metadata.tax_number ||
      rawData.taxId ||
      '',
    TAX_NUMBER: (data) =>
      rawData.businessTaxId ||
      metadata.tax_id ||
      metadata.taxId ||
      metadata.tax_number ||
      rawData.taxNumber ||
      '',
    
    // Country of registration/incorporation
    COUNTRY_OF_INCORPORATION: (data) =>
      rawData.businessCountryOfRegistration ||
      metadata.country_of_incorporation ||
      metadata.countryOfIncorporation ||
      metadata.countryOfRegistration ||
      metadata.country_of_registration ||
      rawData.country ||
      data.applicantCountry ||
      '',
    COUNTRY_OF_REGISTRATION: (data) =>
      rawData.businessCountryOfRegistration ||
      metadata.country_of_registration ||
      metadata.countryOfRegistration ||
      metadata.country_of_incorporation ||
      metadata.countryOfIncorporation ||
      rawData.country ||
      '',
    
    // Business address
    BUSINESS_ADDRESS: (data) =>
      rawData.businessAddress ||
      metadata.business_address ||
      metadata.businessAddress ||
      rawData.applicantAddress ||
      metadata.applicant_address ||
      '',
    
    // Industry / Nature of business
    BUSINESS_NATURE: (data) =>
      rawData.businessIndustry ||
      metadata.business_nature ||
      metadata.businessNature ||
      metadata.industry ||
      rawData.industry ||
      '',
    NATURE_OF_BUSINESS: (data) =>
      rawData.businessIndustry ||
      metadata.nature_of_business ||
      metadata.natureOfBusiness ||
      metadata.business_nature ||
      metadata.businessNature ||
      metadata.industry ||
      '',
    
    // Contact person / Primary contact
    CONTACT_PERSON: (data) =>
      `${rawData.applicantFirstName || ''} ${rawData.applicantLastName || ''}`.trim() ||
      metadata.contact_person ||
      metadata.contactPerson ||
      metadata.primary_contact_person ||
      metadata.primaryContactPerson ||
      '',
    PRIMARY_CONTACT_PERSON: (data) =>
      `${rawData.applicantFirstName || ''} ${rawData.applicantLastName || ''}`.trim() ||
      metadata.primary_contact_person ||
      metadata.primaryContactPerson ||
      metadata.contact_person ||
      metadata.contactPerson ||
      '',
    
    // Contact email
    CONTACT_EMAIL: (data) =>
      rawData.applicantEmail ||
      metadata.contact_email ||
      metadata.contactEmail ||
      metadata.email ||
      rawData.email ||
      '',
    
    // Contact phone
    CONTACT_PHONE: (data) =>
      rawData.applicantPhone ||
      metadata.contact_phone ||
      metadata.contactPhone ||
      metadata.phone ||
      rawData.phone ||
      '',
    
    // Applicant first name
    APPLICANT_FIRST_NAME: (data) =>
      rawData.applicantFirstName ||
      metadata.applicant_first_name ||
      metadata.applicantFirstName ||
      rawData.firstName ||
      '',
    
    // Applicant last name
    APPLICANT_LAST_NAME: (data) =>
      rawData.applicantLastName ||
      metadata.applicant_last_name ||
      metadata.applicantLastName ||
      rawData.lastName ||
      '',
    
    // Applicant email
    APPLICANT_EMAIL: (data) =>
      rawData.applicantEmail ||
      metadata.applicant_email ||
      metadata.applicantEmail ||
      metadata.email ||
      rawData.email ||
      '',
    
    // Applicant phone
    APPLICANT_PHONE: (data) =>
      rawData.applicantPhone ||
      metadata.applicant_phone ||
      metadata.applicantPhone ||
      metadata.phone ||
      rawData.phone ||
      '',
    
    // Applicant date of birth
    APPLICANT_DATE_OF_BIRTH: (data) =>
      rawData.applicantDateOfBirth ||
      metadata.applicant_date_of_birth ||
      metadata.applicantDateOfBirth ||
      metadata.date_of_birth ||
      rawData.dateOfBirth ||
      '',
    
    // Applicant nationality
    APPLICANT_NATIONALITY: (data) =>
      rawData.applicantNationality ||
      metadata.applicant_nationality ||
      metadata.applicantNationality ||
      metadata.nationality ||
      rawData.nationality ||
      '',
    
    // Applicant address
    APPLICANT_ADDRESS: (data) =>
      rawData.applicantAddress ||
      metadata.applicant_address ||
      metadata.applicantAddress ||
      metadata.address ||
      rawData.address ||
      '',
    
    // Number of employees
    NUMBER_OF_EMPLOYEES: (data) =>
      rawData.businessNumberOfEmployees ||
      metadata.number_of_employees ||
      metadata.numberOfEmployees ||
      rawData.numberOfEmployees ||
      '',
    
    // Annual revenue
    ANNUAL_REVENUE: (data) =>
      rawData.businessAnnualRevenue ||
      metadata.annual_revenue ||
      metadata.annualRevenue ||
      rawData.annualRevenue ||
      '',
    
    // Date of incorporation
    DATE_OF_INCORPORATION: (data) =>
      metadata.date_of_incorporation ||
      metadata.dateOfIncorporation ||
      metadata.incorporation_date ||
      metadata.incorporationDate ||
      rawData.dateOfIncorporation ||
      '',
    INCORPORATION_DATE: (data) =>
      metadata.date_of_incorporation ||
      metadata.dateOfIncorporation ||
      metadata.incorporation_date ||
      metadata.incorporationDate ||
      rawData.dateOfIncorporation ||
      '',
  };

  // Try direct mapping first
  if (mapping[code]) {
    const value = mapping[code]({ ...rawData, ...metadata, ...applicationData });
    if (value !== null && value !== undefined && value !== '') {
      console.log(`  ✅ Found via direct mapping (${code}):`, value);
      return value;
    }
  }

  // Try multiple variations of the field code in metadata
  const variations = [
    code,
    code.toLowerCase(),
    fieldCode,
    fieldCode.toLowerCase(),
    fieldCode.replace(/_/g, ''),
    fieldCode.replace(/-/g, '_'),
    fieldCode.replace(/_/g, '-'),
    // Also try with common prefixes/suffixes
    `metadata_${fieldCode.toLowerCase()}`,
    `form_${fieldCode.toLowerCase()}`,
  ];
  
  // Check metadata first (most common location)
  for (const variation of variations) {
    if (metadata[variation] !== undefined && metadata[variation] !== null && metadata[variation] !== '') {
      console.log(`  ✅ Found in metadata["${variation}"]:`, metadata[variation]);
      return metadata[variation];
    }
  }
  
  // Check rawData
  for (const variation of variations) {
    if (rawData[variation] !== undefined && rawData[variation] !== null && rawData[variation] !== '') {
      console.log(`  ✅ Found in rawData["${variation}"]:`, rawData[variation]);
      return rawData[variation];
    }
  }
  
  // Also check direct applicationData fields (not nested in metadata/rawData)
  for (const variation of variations) {
    if (applicationData[variation] !== undefined && applicationData[variation] !== null && applicationData[variation] !== '') {
      console.log(`  ✅ Found in applicationData["${variation}"]:`, applicationData[variation]);
      return applicationData[variation];
    }
  }
  
  // Try camelCase conversion
  const camelCase = fieldCode
    .toLowerCase()
    .split(/[_\s-]/)
    .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  if (metadata[camelCase] !== undefined && metadata[camelCase] !== null && metadata[camelCase] !== '') {
    return metadata[camelCase];
  }
  
  if (rawData[camelCase] !== undefined && rawData[camelCase] !== null && rawData[camelCase] !== '') {
    return rawData[camelCase];
  }
  
  // Try snake_case
  const snakeCase = fieldCode.toLowerCase().replace(/-/g, '_');
  if (metadata[snakeCase] !== undefined && metadata[snakeCase] !== null && metadata[snakeCase] !== '') {
    return metadata[snakeCase];
  }
  
  if (rawData[snakeCase] !== undefined && rawData[snakeCase] !== null && rawData[snakeCase] !== '') {
    return rawData[snakeCase];
  }
  
  return null;
}

/**
 * Formats field value based on type
 */
function formatFieldValue(value: any, fieldType: string, options?: Array<{ value: string; label: string }>): string {
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
}

/**
 * Renders a single field
 */
function renderField(field: SchemaField, value: any): React.ReactNode {
  const formattedValue = formatFieldValue(value, field.type, field.options);
  const isEmpty = value === null || value === undefined || value === '' || 
                  (Array.isArray(value) && value.length === 0);
  
  return (
    <Box
      p="4"
      bg="white"
      borderRadius="md"
      borderWidth="1px"
      borderColor="gray.200"
      _hover={{ borderColor: "gray.300", boxShadow: "sm" }}
      transition="all 0.2s"
    >
      <VStack align="start" gap="2">
        <HStack justify="space-between" width="100%">
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {field.label}
            {field.isRequired && (
              <Text as="span" color="red.500" ml="1">
                *
              </Text>
            )}
          </Text>
          {field.type === 'File' && value && (
            <Badge colorScheme="blue" fontSize="xs">
              Document
            </Badge>
          )}
        </HStack>
        
        <Text
          fontSize="sm"
          fontWeight={isEmpty ? "normal" : "semibold"}
          color={isEmpty ? "gray.400" : "gray.800"}
          wordBreak="break-word"
          fontStyle={isEmpty ? "italic" : "normal"}
        >
          {formattedValue}
        </Text>
        
        {field.helpText && (
          <Text fontSize="xs" color="gray.500" fontStyle="italic">
            {field.helpText}
          </Text>
        )}
      </VStack>
    </Box>
  );
}

/**
 * Schema-driven view component that dynamically renders application data
 * based on the configured schema structure
 */
export function SchemaDrivenView({
  schema,
  applicationData,
  readOnly = true,
}: SchemaDrivenViewProps) {
  if (!schema) {
    return (
      <Box p="6" bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
        <Text color="gray.500" fontSize="sm">
          No schema configuration available. Application data cannot be displayed dynamically.
        </Text>
      </Box>
    );
  }

  // Extract sections from schema
  // Schema can be in different formats:
  // 1. Direct EntitySchema format with sections
  // 2. Form config format with steps
  // 3. Entity type config format with requirements
  
  let sections: SchemaSection[] = [];
  
  if (schema.sections && Array.isArray(schema.sections)) {
    // EntitySchema format
    sections = schema.sections.map((section: any) => ({
      id: section.id || `section-${section.title}`,
      title: section.title,
      description: section.description,
      fields: section.fields || [],
      order: section.order || 0,
    }));
  } else if (schema.steps && Array.isArray(schema.steps)) {
    // Form config format - convert steps to sections
    sections = schema.steps.map((step: any, index: number) => ({
      id: step.id || `step-${index}`,
      title: step.title || step.name || `Step ${index + 1}`,
      description: step.description,
      fields: step.fields || [],
      order: step.order || index,
    }));
  } else if (schema.requirements && Array.isArray(schema.requirements)) {
    // Entity type config format - group by requirement type
    const sectionsMap = new Map<string, SchemaSection>();
    
    schema.requirements.forEach((req: any) => {
      const requirement = req.requirement || req;
      if (!requirement) return;
      
      const reqType = requirement.type || 'Information';
      const sectionId = `section-${reqType}`;
      
      if (!sectionsMap.has(sectionId)) {
        sectionsMap.set(sectionId, {
          id: sectionId,
          title: reqType,
          fields: [],
          order: sectionsMap.size,
        });
      }
      
      const section = sectionsMap.get(sectionId)!;
      
      // Log the field code we're looking for
      console.log(`[SchemaDrivenView] 🔍 Mapping field: "${requirement.code}" (${requirement.displayName || requirement.name})`);
      
      const fieldValue = mapDataToFieldValue(requirement.code, applicationData);
      
      // Log what we found
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
        console.warn(`[SchemaDrivenView] ⚠️ Field "${requirement.code}" - NO VALUE FOUND`);
        console.log(`  - Available metadata keys:`, Object.keys(applicationData.metadata || {}).slice(0, 20));
        console.log(`  - Available rawData keys:`, Object.keys(applicationData.rawData || {}).slice(0, 20));
        console.log(`  - Sample metadata values:`, Object.entries(applicationData.metadata || {}).slice(0, 5).map(([k, v]) => `${k}: ${v}`));
        console.log(`  - Sample rawData values:`, Object.entries(applicationData.rawData || {}).slice(0, 5).map(([k, v]) => `${k}: ${v}`));
      } else {
        console.log(`[SchemaDrivenView] ✅ Field "${requirement.code}" - FOUND VALUE:`, fieldValue);
      }
      
      section.fields.push({
        code: requirement.code,
        label: requirement.displayName || requirement.name || requirement.code,
        type: requirement.fieldType || 'Text',
        value: fieldValue,
        helpText: requirement.helpText || requirement.description,
        isRequired: req.isRequired !== undefined ? req.isRequired : requirement.isRequired,
        options: requirement.options?.map((opt: any) => ({
          value: opt.value,
          label: opt.displayText || opt.label || opt.value,
        })),
        order: req.displayOrder || requirement.order || 0,
      });
    });
    
    sections = Array.from(sectionsMap.values());
  } else if (schema.fields && Array.isArray(schema.fields)) {
    // Flat fields structure - create a single section
    sections = [{
      id: 'main-section',
      title: 'Application Information',
      fields: schema.fields,
      order: 0,
    }];
  }

  // Sort sections by order
  sections.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Sort fields within each section by order
  sections.forEach(section => {
    section.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  if (sections.length === 0) {
    return (
      <Box p="6" bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
        <Text color="gray.500" fontSize="sm">
          No fields configured in schema. Cannot display application data.
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap="6" align="stretch">
      {sections.map((section) => {
        // Map field values from application data
        const fieldsWithValues = section.fields.map(field => {
          const mappedValue = mapDataToFieldValue(field.code, applicationData);
          return {
            ...field,
            value: field.value !== undefined && field.value !== null && field.value !== ''
              ? field.value 
              : mappedValue,
          };
        }).sort((a, b) => {
          // Sort: fields with values first, then required fields, then others
          const aHasValue = a.value !== null && a.value !== undefined && a.value !== '';
          const bHasValue = b.value !== null && b.value !== undefined && b.value !== '';
          if (aHasValue && !bHasValue) return -1;
          if (!aHasValue && bHasValue) return 1;
          if (a.isRequired && !b.isRequired) return -1;
          if (!a.isRequired && b.isRequired) return 1;
          return (a.order || 0) - (b.order || 0);
        });

        // Show all fields from schema (even empty ones) so user knows what's expected
        if (fieldsWithValues.length === 0) {
          return null;
        }

        return (
          <Box key={section.id}>
            <VStack align="start" gap="4">
              <Box width="100%">
                <Heading size="sm" color="gray.700" mb="2">
                  {section.title}
                </Heading>
                {section.description && (
                  <Text fontSize="xs" color="gray.500" mb="4">
                    {section.description}
                  </Text>
                )}
                <Box height="1px" bg="gray.200" width="100%" my="2" />
              </Box>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="4" width="100%">
                {fieldsWithValues.map((field) => (
                  <Box key={field.code}>
                    {renderField(field, field.value)}
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>
        );
      })}
    </VStack>
  );
}

