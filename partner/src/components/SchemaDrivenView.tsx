'use client';
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Box, VStack, HStack, SimpleGrid, Flex, Badge } from '@chakra-ui/react';
import {
  Typography,
  Tag,
  Button,
  Card,
  IconWrapper,
  Tooltip,
  // Mukuru Icons
  DocumentIcon,
  FileOpenIcon,
  DownloadIcon,
  VisibleIcon,
  TickCircleIcon,
  PendingIcon,
  ErrorIcon,
  CalendarIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  LocationIcon,
  InfoIcon,
  ReceiptIcon,
  ImageIcon,
  ExternalIcon,
} from '@mukuru/mukuru-react-components';

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
  const appCaseData = applicationData.caseData || {};
  const code = fieldCode.toUpperCase();
  
  // DEBUG: Log all available data sources for registration_number and registered_address
  if (code === 'REGISTRATION_NUMBER' || code === 'REGISTERED_ADDRESS') {
    console.info(`[SchemaDrivenView] 🔍 DEBUG ${code} - All data sources:`, {
      'metadata keys': Object.keys(metadata),
      'rawData keys': Object.keys(rawData),
      'caseData keys': Object.keys(appCaseData),
      'applicationData keys': Object.keys(applicationData),
      // Specific values
      'metadata.registration_number': metadata.registration_number,
      'metadata.registered_address': metadata.registered_address,
      'metadata.registered_legal_name': metadata.registered_legal_name,
      'rawData.businessRegistrationNumber': rawData.businessRegistrationNumber,
      'rawData.registeredAddress': rawData.registeredAddress,
      'caseData.businessRegistrationNumber': appCaseData.businessRegistrationNumber,
      'caseData.registeredAddress': appCaseData.registeredAddress,
      'applicationData.business': applicationData.business,
    });
  }
  
  // Create comprehensive data object with all possible sources
  const data = {
    ...rawData,
    ...metadata,
    ...applicationData,
    // Also include caseData if present
    ...appCaseData,
  };

  // Comprehensive mapping for common requirement codes
  const mapping: Record<string, (data: Record<string, unknown>) => any> = {
    // Legal name / Business name - multiple variations
    LEGAL_NAME: (data) => {
      // Check caseData first (from API route)
      const caseData = applicationData.caseData || {};
      if (caseData.businessLegalName) return caseData.businessLegalName;
      
      // Then check metadata and other sources
      return (
        metadata.registered_legal_name ||  // Exact match for requirement code
        metadata.legal_name ||
        data.businessLegalName ||
        data.legalName ||
        data.legal_name ||
        metadata.businessLegalName ||
        metadata.legalName ||
        metadata['Legal Name'] ||
        rawData.businessLegalName ||
        rawData.legal_name ||
        `${data.applicantFirstName || ''} ${data.applicantLastName || ''}`.trim() ||
        ''
      );
    },
    'REGISTERED/LEGALNAME': (data) => {
      const caseData = applicationData.caseData || {};
      if (caseData.businessLegalName) return caseData.businessLegalName;
      return (
        metadata.registered_legal_name ||
        data.businessLegalName ||
        data.legalName ||
        metadata.legal_name ||
        metadata['Legal Name'] ||
        ''
      );
    },
    REGISTEREDLEGALNAME: (data) => {
      const caseData = applicationData.caseData || {};
      if (caseData.businessLegalName) return caseData.businessLegalName;
      return (
        metadata.registered_legal_name ||
        data.businessLegalName ||
        data.legalName ||
        metadata.legal_name ||
        metadata['Legal Name'] ||
        ''
      );
    },
    REGISTERED_LEGAL_NAME: (data) => {
      const caseData = applicationData.caseData || {};
      if (caseData.businessLegalName) return caseData.businessLegalName;
      return (
        metadata.registered_legal_name ||
        metadata.legal_name ||
        data.businessLegalName ||
        data.legalName ||
        metadata['Legal Name'] ||
        ''
      );
    },

    // Registration number - map to various possible keys
    REGISTRATION_NUMBER: (data) => {
      // Check caseData first (from API route) - but only if value is not empty
      const caseData = applicationData.caseData || {};
      const caseDataValue = caseData.businessRegistrationNumber;
      if (caseDataValue && String(caseDataValue).trim() !== '') {
        console.info(`[SchemaDrivenView] ✅ REGISTRATION_NUMBER found in caseData.businessRegistrationNumber:`, caseDataValue);
        return String(caseDataValue).trim();
      }
      
      // Check rawData (often has the actual values)
      const rawDataValue = rawData.businessRegistrationNumber;
      if (rawDataValue && String(rawDataValue).trim() !== '') {
        console.info(`[SchemaDrivenView] ✅ REGISTRATION_NUMBER found in rawData.businessRegistrationNumber:`, rawDataValue);
        return String(rawDataValue).trim();
      }
      
      // Check metadata with exact requirement code key (snake_case)
      const metadataValue = metadata.registration_number;
      if (metadataValue && String(metadataValue).trim() !== '') {
        console.info(`[SchemaDrivenView] ✅ REGISTRATION_NUMBER found in metadata.registration_number:`, metadataValue);
        return String(metadataValue).trim();
      }
      
      // Log what we found (for debugging)
      console.info(`[SchemaDrivenView] 🔍 REGISTRATION_NUMBER check:`, {
        caseDataValue: caseDataValue,
        rawDataValue: rawDataValue,
        metadataValue: metadataValue,
        caseDataValueType: typeof caseDataValue,
        rawDataValueType: typeof rawDataValue,
      });
      
      // Then check metadata and other sources
      const value = (
        metadata.registrationNumber ||
        metadata['Registration Number'] ||
        metadata.REGISTRATION_NUMBER ||
        data.businessRegistrationNumber ||
        data.registrationNumber ||
        data.registration_number ||
        rawData.registrationNumber ||
        ''
      );
      
      return value && String(value).trim() !== '' ? String(value).trim() : '';
    },

    // Tax ID / TIN
    TAX_ID: (_data) =>
      rawData.businessTaxId ||
      metadata.tax_id ||
      metadata.taxId ||
      metadata.tax_number ||
      rawData.taxId ||
      '',
    TAX_NUMBER: (_data) =>
      rawData.businessTaxId ||
      metadata.tax_id ||
      metadata.taxId ||
      metadata.tax_number ||
      rawData.taxNumber ||
      '',

    // Country of registration/incorporation
    COUNTRY_OF_INCORPORATION: (_data) =>
      rawData.businessCountryOfRegistration ||
      metadata.country_of_incorporation ||
      metadata.countryOfIncorporation ||
      metadata.countryOfRegistration ||
      metadata.country_of_registration ||
      rawData.country ||
      data.applicantCountry ||
      '',
    COUNTRY_OF_REGISTRATION: (_data) =>
      rawData.businessCountryOfRegistration ||
      metadata.country_of_registration ||
      metadata.countryOfRegistration ||
      metadata.country_of_incorporation ||
      metadata.countryOfIncorporation ||
      rawData.country ||
      '',

    // Business address
    BUSINESS_ADDRESS: (_data) =>
      rawData.businessAddress ||
      metadata.business_address ||
      metadata.businessAddress ||
      rawData.applicantAddress ||
      metadata.applicant_address ||
      '',

    // Registered Address (common variation) - check metadata first with exact key
    REGISTERED_ADDRESS: (data) => {
      // Helper to format address object to string
      const formatAddress = (addr: any): string => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr.trim();
        if (typeof addr === 'object') {
          const parts = [
            addr.street || addr.Street,
            addr.street2 || addr.Street2,
            addr.city || addr.City,
            addr.state || addr.State,
            addr.postalCode || addr.PostalCode,
            addr.country || addr.Country,
          ].filter(Boolean);
          return parts.length > 0 ? parts.join(', ') : '';
        }
        return String(addr).trim();
      };
      
      // Check metadata with exact requirement code key (snake_case) FIRST
      const metadataValue = metadata.registered_address;
      const formattedMetadata = formatAddress(metadataValue);
      if (formattedMetadata) {
        console.info(`[SchemaDrivenView] ✅ REGISTERED_ADDRESS found in metadata.registered_address:`, formattedMetadata);
        return formattedMetadata;
      }
      
      // Check caseData (from API route) - but only if value is not empty
      const caseData = applicationData.caseData || {};
      const caseDataValue = caseData.registeredAddress;
      const formattedCaseData = formatAddress(caseDataValue);
      if (formattedCaseData) {
        console.info(`[SchemaDrivenView] ✅ REGISTERED_ADDRESS found in caseData.registeredAddress:`, formattedCaseData);
        return formattedCaseData;
      }
      
      // Check rawData (often has the actual values)
      const rawDataValue = rawData.registeredAddress;
      const formattedRawData = formatAddress(rawDataValue);
      if (formattedRawData) {
        console.info(`[SchemaDrivenView] ✅ REGISTERED_ADDRESS found in rawData.registeredAddress:`, formattedRawData);
        return formattedRawData;
      }
      
      // Check if business object has registeredAddress
      const business = data.business || applicationData.business || {};
      const businessAddr = business.registeredAddress || business.RegisteredAddress;
      const formattedBusiness = formatAddress(businessAddr);
      if (formattedBusiness) {
        console.info(`[SchemaDrivenView] ✅ REGISTERED_ADDRESS found in business.registeredAddress:`, formattedBusiness);
        return formattedBusiness;
      }
      
      // Log what we found (for debugging)
      console.info(`[SchemaDrivenView] 🔍 REGISTERED_ADDRESS check:`, {
        metadataValue: metadataValue,
        caseDataValue: caseDataValue,
        rawDataValue: rawDataValue,
        businessAddr: businessAddr,
        caseDataValueType: typeof caseDataValue,
        rawDataValueType: typeof rawDataValue,
      });
      
      // Then check metadata with all variations
      const value = (
        metadata.registeredAddress ||
        metadata['Registered Address'] ||
        metadata.REGISTERED_ADDRESS ||
        data.registeredAddress ||
        data.registered_address ||
        data.businessAddress ||
        data.business_address ||
        data.address ||
        rawData.registered_address ||
        rawData.businessAddress ||
        metadata.business_address ||
        metadata.businessAddress ||
        rawData.applicantAddress ||
        metadata.applicant_address ||
        metadata.address ||
        rawData.address ||
        ''
      );
      
      return value && String(value).trim() !== '' ? String(value).trim() : '';
    },

    REGISTEREDADDRESS: (data) => {
      // Check caseData first (from API route) - but only if value is not empty
      const caseData = applicationData.caseData || {};
      if (caseData.registeredAddress && String(caseData.registeredAddress).trim() !== '') {
        return String(caseData.registeredAddress).trim();
      }
      
      // Check rawData (often has the actual values)
      if (rawData.registeredAddress && String(rawData.registeredAddress).trim() !== '') {
        return String(rawData.registeredAddress).trim();
      }
      
      const value = (
        data.registeredAddress ||
        data.registered_address ||
        data.businessAddress ||
        rawData.businessAddress ||
        metadata.registered_address ||
        metadata.registeredAddress ||
        metadata.business_address ||
        metadata.businessAddress ||
        rawData.registered_address ||
        ''
      );
      
      return value && String(value).trim() !== '' ? String(value).trim() : '';
    },

    // Industry / Nature of business
    BUSINESS_NATURE: (_data) =>
      rawData.businessIndustry ||
      metadata.business_nature ||
      metadata.businessNature ||
      metadata.industry ||
      rawData.industry ||
      '',
    NATURE_OF_BUSINESS: (_data) =>
      rawData.businessIndustry ||
      metadata.nature_of_business ||
      metadata.natureOfBusiness ||
      metadata.business_nature ||
      metadata.businessNature ||
      metadata.industry ||
      '',

    // Contact person / Primary contact
    CONTACT_PERSON: (_data) =>
      `${rawData.applicantFirstName || ''} ${rawData.applicantLastName || ''}`.trim() ||
      metadata.contact_person ||
      metadata.contactPerson ||
      metadata.primary_contact_person ||
      metadata.primaryContactPerson ||
      '',
    PRIMARY_CONTACT_PERSON: (_data) =>
      `${rawData.applicantFirstName || ''} ${rawData.applicantLastName || ''}`.trim() ||
      metadata.primary_contact_person ||
      metadata.primaryContactPerson ||
      metadata.contact_person ||
      metadata.contactPerson ||
      '',

    // Contact email
    CONTACT_EMAIL: (_data) =>
      rawData.applicantEmail ||
      metadata.contact_email ||
      metadata.contactEmail ||
      metadata.email ||
      rawData.email ||
      '',

    // Contact phone
    CONTACT_PHONE: (_data) =>
      rawData.applicantPhone ||
      metadata.contact_phone ||
      metadata.contactPhone ||
      metadata.phone ||
      rawData.phone ||
      '',

    // Applicant first name
    APPLICANT_FIRST_NAME: (_data) =>
      rawData.applicantFirstName ||
      metadata.applicant_first_name ||
      metadata.applicantFirstName ||
      rawData.firstName ||
      '',

    // Applicant last name
    APPLICANT_LAST_NAME: (_data) =>
      rawData.applicantLastName ||
      metadata.applicant_last_name ||
      metadata.applicantLastName ||
      rawData.lastName ||
      '',

    // Applicant email
    APPLICANT_EMAIL: (_data) =>
      rawData.applicantEmail ||
      metadata.applicant_email ||
      metadata.applicantEmail ||
      metadata.email ||
      rawData.email ||
      '',

    // Applicant phone
    APPLICANT_PHONE: (_data) =>
      rawData.applicantPhone ||
      metadata.applicant_phone ||
      metadata.applicantPhone ||
      metadata.phone ||
      rawData.phone ||
      '',

    // Applicant date of birth
    APPLICANT_DATE_OF_BIRTH: (_data) =>
      rawData.applicantDateOfBirth ||
      metadata.applicant_date_of_birth ||
      metadata.applicantDateOfBirth ||
      metadata.date_of_birth ||
      rawData.dateOfBirth ||
      '',

    // Applicant nationality
    APPLICANT_NATIONALITY: (_data) =>
      rawData.applicantNationality ||
      metadata.applicant_nationality ||
      metadata.applicantNationality ||
      metadata.nationality ||
      rawData.nationality ||
      '',

    // Applicant address
    APPLICANT_ADDRESS: (_data) =>
      rawData.applicantAddress ||
      metadata.applicant_address ||
      metadata.applicantAddress ||
      metadata.address ||
      rawData.address ||
      '',

    // Number of employees
    NUMBER_OF_EMPLOYEES: (_data) =>
      rawData.businessNumberOfEmployees ||
      metadata.number_of_employees ||
      metadata.numberOfEmployees ||
      rawData.numberOfEmployees ||
      '',

    // Annual revenue
    ANNUAL_REVENUE: (_data) =>
      rawData.businessAnnualRevenue ||
      metadata.annual_revenue ||
      metadata.annualRevenue ||
      rawData.annualRevenue ||
      '',

    // Date of incorporation
    DATE_OF_INCORPORATION: (_data) =>
      metadata.date_of_incorporation ||
      metadata.dateOfIncorporation ||
      metadata.incorporation_date ||
      metadata.incorporationDate ||
      rawData.dateOfIncorporation ||
      '',
    INCORPORATION_DATE: (_data) =>
      metadata.date_of_incorporation ||
      metadata.dateOfIncorporation ||
      metadata.incorporation_date ||
      metadata.incorporationDate ||
      rawData.dateOfIncorporation ||
      '',
  };

  // Try direct mapping first
  if (mapping[code]) {
    const value = mapping[code](data);
    if (value !== null && value !== undefined && value !== '') {
      console.info(`[SchemaDrivenView] ✅ Found via direct mapping (${code}):`, value);
      return value;
    }
  }

  // Try normalized code (remove spaces, underscores, hyphens)
  const normalizedCode = code.replace(/[_\s-]/g, '');
  if (normalizedCode !== code && mapping[normalizedCode]) {
    const value = mapping[normalizedCode](data);
    if (value !== null && value !== undefined && value !== '') {
      console.info(
        `[SchemaDrivenView] ✅ Found via normalized mapping (${normalizedCode} from ${code}):`,
        value
      );
      return value;
    }
  }

  // Also try caseData if it exists
  const caseData = applicationData.caseData || {};
  if (caseData && Object.keys(caseData).length > 0) {
    // Try to find the field in caseData using various key formats
    const caseDataKeys = Object.keys(caseData);
    const matchingKey = caseDataKeys.find((key) => {
      const normalizedKey = key.toLowerCase().replace(/[_\s-]/g, '');
      const normalizedCodeLower = code.toLowerCase().replace(/[_\s-]/g, '');
      return normalizedKey === normalizedCodeLower || normalizedKey.includes(normalizedCodeLower);
    });

    if (matchingKey && caseData[matchingKey]) {
      const value = caseData[matchingKey];
      if (value !== null && value !== undefined && value !== '') {
        console.info(`[SchemaDrivenView] ✅ Found in caseData["${matchingKey}"]:`, value);
        return value;
      }
    }
  }

  // Try multiple variations of the field code in metadata
  const variations = [
    code,
    code.toLowerCase(),
    normalizedCode,
    normalizedCode.toLowerCase(),
    fieldCode,
    fieldCode.toLowerCase(),
    fieldCode.replace(/_/g, ''),
    fieldCode.replace(/-/g, '_'),
    fieldCode.replace(/_/g, '-'),
    fieldCode.replace(/\s/g, '_'),
    fieldCode.replace(/\s/g, '-'),
    fieldCode.replace(/\s/g, ''),
    // Also try with common prefixes/suffixes
    `metadata_${fieldCode.toLowerCase()}`,
    `form_${fieldCode.toLowerCase()}`,
    // Try with spaces converted to underscores
    fieldCode.replace(/\s+/g, '_').toLowerCase(),
    fieldCode.replace(/\s+/g, '-').toLowerCase(),
  ];

  // Check metadata first (most common location)
  for (const variation of variations) {
    const value = metadata[variation];
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      String(value).trim() !== ''
    ) {
      console.info(`  ✅ Found in metadata["${variation}"]:`, value);
      return String(value).trim();
    }
  }
  
  // Also try snake_case version directly (common in metadata)
  const snakeCaseKey = fieldCode.toLowerCase().replace(/[_\s-]/g, '_');
  if (metadata[snakeCaseKey] !== undefined) {
    const value = metadata[snakeCaseKey];
    if (value !== null && value !== undefined && value !== '' && String(value).trim() !== '') {
      console.info(`  ✅ Found in metadata["${snakeCaseKey}"] (snake_case):`, value);
      return String(value).trim();
    }
  }

  // Check rawData
  for (const variation of variations) {
    if (
      rawData[variation] !== undefined &&
      rawData[variation] !== null &&
      rawData[variation] !== ''
    ) {
      console.info(`  ✅ Found in rawData["${variation}"]:`, rawData[variation]);
      return rawData[variation];
    }
  }

  // Also check direct applicationData fields (not nested in metadata/rawData)
  for (const variation of variations) {
    if (
      applicationData[variation] !== undefined &&
      applicationData[variation] !== null &&
      applicationData[variation] !== ''
    ) {
      console.info(
        `[SchemaDrivenView] ✅ Found in applicationData["${variation}"]:`,
        applicationData[variation]
      );
      return applicationData[variation];
    }
  }

  // Try fuzzy matching - search for keys that contain the field code or vice versa
  const allDataSources = [
    { name: 'metadata', data: metadata },
    { name: 'rawData', data: rawData },
    { name: 'caseData', data: caseData },
    { name: 'applicationData', data: applicationData },
  ];

  // First, try exact normalized matches (most reliable)
  const normalizedFieldCode = code.toLowerCase().replace(/[_\s-]/g, '');
  for (const source of allDataSources) {
    if (!source.data || typeof source.data !== 'object') continue;

    const sourceKeys = Object.keys(source.data);
    for (const key of sourceKeys) {
      const normalizedKey = key.toLowerCase().replace(/[_\s-]/g, '');
      
      // Exact normalized match
      if (normalizedKey === normalizedFieldCode) {
        const value = source.data[key];
        if (value !== null && value !== undefined && value !== '' && String(value).trim() !== '') {
          console.info(
            `[SchemaDrivenView] ✅ Found via exact normalized match in ${source.name}["${key}"] (matched "${code}"):`,
            value
          );
          return String(value).trim();
        }
      }
    }
  }

  // Then try partial matches (contains)
  for (const source of allDataSources) {
    if (!source.data || typeof source.data !== 'object') continue;

    const sourceKeys = Object.keys(source.data);
    for (const key of sourceKeys) {
      const normalizedKey = key.toLowerCase().replace(/[_\s-]/g, '');

      // Check if key contains code or code contains key (but not already matched exactly)
      if (normalizedKey !== normalizedFieldCode) {
        if (
          normalizedKey.includes(normalizedFieldCode) ||
          normalizedFieldCode.includes(normalizedKey) ||
          // Check if key ends with code or code ends with key
          normalizedKey.endsWith(normalizedFieldCode) ||
          normalizedFieldCode.endsWith(normalizedKey)
        ) {
          const value = source.data[key];
          if (value !== null && value !== undefined && value !== '' && String(value).trim() !== '') {
            console.info(
              `[SchemaDrivenView] ✅ Found via fuzzy match in ${source.name}["${key}"] (matched "${code}"):`,
              value
            );
            return String(value).trim();
          }
        }
      }
    }
  }

  // Try camelCase conversion
  const camelCase = fieldCode
    .toLowerCase()
    .split(/[_\s-]/)
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');

  if (
    metadata[camelCase] !== undefined &&
    metadata[camelCase] !== null &&
    metadata[camelCase] !== ''
  ) {
    return metadata[camelCase];
  }

  if (
    rawData[camelCase] !== undefined &&
    rawData[camelCase] !== null &&
    rawData[camelCase] !== ''
  ) {
    return rawData[camelCase];
  }

  // Try snake_case
  const snakeCase = fieldCode.toLowerCase().replace(/-/g, '_');
  if (
    metadata[snakeCase] !== undefined &&
    metadata[snakeCase] !== null &&
    metadata[snakeCase] !== ''
  ) {
    return metadata[snakeCase];
  }

  if (
    rawData[snakeCase] !== undefined &&
    rawData[snakeCase] !== null &&
    rawData[snakeCase] !== ''
  ) {
    return rawData[snakeCase];
  }

  // Last resort: search for any key that contains significant words from the field code
  const significantWords = fieldCode
    .toLowerCase()
    .replace(/[_\-\/]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Only words with more than 2 chars
  
  if (significantWords.length > 0) {
    const allSources = [
      { name: 'metadata', obj: metadata },
      { name: 'rawData', obj: rawData },
      { name: 'caseData', obj: applicationData.caseData || {} },
      { name: 'applicationData', obj: applicationData },
    ];
    
    for (const source of allSources) {
      if (!source.obj || typeof source.obj !== 'object') continue;
      
      for (const key of Object.keys(source.obj)) {
        const keyLower = key.toLowerCase();
        // Check if key contains ALL significant words
        const matchesAllWords = significantWords.every(word => 
          keyLower.includes(word) || word.includes(keyLower.replace(/[_\-]/g, ''))
        );
        
        if (matchesAllWords) {
          const value = source.obj[key];
          if (value !== null && value !== undefined && value !== '' && typeof value !== 'object') {
            console.info(`[SchemaDrivenView] ✅ Found via word match in ${source.name}["${key}"] for "${fieldCode}":`, value);
            return value;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Formats field value based on type
 */
function formatFieldValue(
  value: any,
  fieldType: string,
  options?: Array<{ value: string; label: string }>
): string {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (fieldType === 'MultiSelect' && options) {
      return value
        .map((val: any) => {
          const option = options.find((opt) => opt.value === String(val));
          return option?.label || String(val);
        })
        .join(', ');
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
    } catch {
      // Invalid date, return as-is
    }
  }

  // Handle select options
  if (fieldType === 'Select' && options) {
    const option = options.find((opt) => opt.value === String(value));
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
 * Get icon component for field type - returns Mukuru icon component
 */
function getFieldIcon(fieldType: string, fieldCode: string): React.ComponentType<any> {
  const code = fieldCode.toLowerCase();

  // Check field code first for more specific icons
  if (code.includes('email')) return MailIcon;
  if (code.includes('phone') || code.includes('tel') || code.includes('mobile'))
    return PhoneIcon;
  if (code.includes('address') || code.includes('location')) return LocationIcon;
  if (code.includes('country') || code.includes('nation')) return LocationIcon;
  if (code.includes('name') || code.includes('person') || code.includes('contact'))
    return UserIcon;
  if (code.includes('registration') || code.includes('number') || code.includes('id'))
    return ReceiptIcon;
  if (code.includes('business') || code.includes('company') || code.includes('industry'))
    return ReceiptIcon;
  if (code.includes('date') || code.includes('birth') || code.includes('incorporation'))
    return CalendarIcon;
  if (
    code.includes('revenue') ||
    code.includes('amount') ||
    code.includes('salary') ||
    code.includes('income')
  )
    return ReceiptIcon;
  if (code.includes('percent') || code.includes('rate') || code.includes('share'))
    return InfoIcon;
  if (code.includes('url') || code.includes('website') || code.includes('link'))
    return ExternalIcon;

  // Check field type
  switch (fieldType.toLowerCase()) {
    case 'file':
    case 'document':
      return DocumentIcon;
    case 'image':
      return ImageIcon;
    case 'date':
      return CalendarIcon;
    case 'email':
      return MailIcon;
    case 'phone':
    case 'tel':
      return PhoneIcon;
    case 'currency':
    case 'money':
      return ReceiptIcon;
    default:
      return FileOpenIcon;
  }
}

/**
 * Get status color and icon for document status - uses Mukuru icons
 */
function getDocumentStatusInfo(status: string): {
  color: string;
  bgColor: string;
  icon: React.ComponentType<any>;
  label: string;
} {
  const statusLower = (status || '').toLowerCase();

  if (
    statusLower.includes('approved') ||
    statusLower.includes('verified') ||
    statusLower.includes('complete')
  ) {
    return {
      color: 'mukuru.text.success',
      bgColor: 'green.50',
      icon: TickCircleIcon,
      label: 'Verified',
    };
  }
  if (
    statusLower.includes('pending') ||
    statusLower.includes('review') ||
    statusLower.includes('submitted')
  ) {
    return {
      color: 'mukuru.buttons.primary',
      bgColor: 'orange.50',
      icon: PendingIcon,
      label: 'Pending Review',
    };
  }
  if (
    statusLower.includes('rejected') ||
    statusLower.includes('declined') ||
    statusLower.includes('failed')
  ) {
    return {
      color: 'mukuru.text.error',
      bgColor: 'red.50',
      icon: ErrorIcon,
      label: 'Rejected',
    };
  }
  return {
    color: 'mukuru.grey.medium',
    bgColor: 'gray.50',
    icon: PendingIcon,
    label: 'Pending',
  };
}

/**
 * Parse document value - handles JSON strings and arrays
 */
function parseDocumentValue(value: any): Array<{
  fileName: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt?: string;
  status?: string;
  requirementCode?: string;
}> {
  if (!value) return [];

  // If it's already an array
  if (Array.isArray(value)) {
    return value.map((doc) => ({
      fileName: doc.fileName || doc.name || 'Document',
      fileSize: doc.fileSize || doc.size,
      fileType: doc.fileType || doc.type || doc.contentType,
      uploadedAt: doc.uploadedAt || doc.createdAt || doc.uploaded_at,
      status: doc.status || 'pending',
      requirementCode: doc.requirementCode || doc.requirement_code,
    }));
  }

  // If it's a string, try to parse as JSON
  if (typeof value === 'string') {
    // Check if it looks like JSON
    if (value.startsWith('[') || value.startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((doc) => ({
            fileName: doc.fileName || doc.name || 'Document',
            fileSize: doc.fileSize || doc.size,
            fileType: doc.fileType || doc.type || doc.contentType,
            uploadedAt: doc.uploadedAt || doc.createdAt || doc.uploaded_at,
            status: doc.status || 'pending',
            requirementCode: doc.requirementCode || doc.requirement_code,
          }));
        }
        // Single object
        return [
          {
            fileName: parsed.fileName || parsed.name || 'Document',
            fileSize: parsed.fileSize || parsed.size,
            fileType: parsed.fileType || parsed.type || parsed.contentType,
            uploadedAt: parsed.uploadedAt || parsed.createdAt || parsed.uploaded_at,
            status: parsed.status || 'pending',
            requirementCode: parsed.requirementCode || parsed.requirement_code,
          },
        ];
      } catch {
        // Not valid JSON, treat as filename
        return [{ fileName: value, status: 'pending' }];
      }
    }
    // Plain string - treat as filename
    return [{ fileName: value, status: 'pending' }];
  }

  // Single object
  if (typeof value === 'object') {
    return [
      {
        fileName: value.fileName || value.name || 'Document',
        fileSize: value.fileSize || value.size,
        fileType: value.fileType || value.type || value.contentType,
        uploadedAt: value.uploadedAt || value.createdAt || value.uploaded_at,
        status: value.status || 'pending',
        requirementCode: value.requirementCode || value.requirement_code,
      },
    ];
  }

  return [];
}

/**
 * Format file size
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Renders a document field with proper card layout - using Mukuru components
 */
function renderDocumentField(field: SchemaField, value: any): React.ReactNode {
  const documents = parseDocumentValue(value);
  const isEmpty = documents.length === 0;

  return (
    <Box
      p="4"
      bg="mukuru.background.light"
      borderRadius="lg"
      _hover={{ bg: 'mukuru.state.hover.card' }}
      transition="all 0.2s"
    >
      <VStack align="stretch" gap="3">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack gap="2" align="center">
            <DocumentIcon
              width="14px"
              height="14px"
              color="var(--chakra-colors-mukuru-grey-medium)"
            />
            <Typography
              fontSize="xs"
              fontWeight="600"
              color="mukuru.grey.mediumDark"
              textTransform="uppercase"
              letterSpacing="0.02em"
            >
              {field.label}
              {field.isRequired && (
                <Typography as="span" color="mukuru.text.error" ml="1">
                  *
                </Typography>
              )}
            </Typography>
          </HStack>
          <Tag variant="solid" size="md">
            {isEmpty ? '0' : documents.length}
          </Tag>
        </HStack>

        {/* Documents List */}
        {isEmpty ? (
          <Box
            p="3"
            bg="mukuru.cards.white"
            borderRadius="md"
            borderWidth="1px"
            borderStyle="dashed"
            borderColor="mukuru.grey.light"
            textAlign="center"
          >
            <Typography fontSize="sm" color="mukuru.grey.medium" fontStyle="italic">
              No documents uploaded
            </Typography>
          </Box>
        ) : (
          <VStack align="stretch" gap="3">
            {documents.map((doc, index) => {
              const statusInfo = getDocumentStatusInfo(doc.status || 'pending');
              const StatusIcon = statusInfo.icon;

              return (
                <Box
                  key={index}
                  p="3"
                  bg="mukuru.cards.white"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="mukuru.grey.light"
                  _hover={{ borderColor: 'mukuru.teal', boxShadow: 'sm' }}
                  transition="all 0.2s"
                >
                  <HStack justify="space-between" align="center">
                    <HStack gap="2" flex="1" minW="0">
                      <FileOpenIcon
                        width="14px"
                        height="14px"
                        color="var(--chakra-colors-mukuru-grey-medium)"
                      />
                      <Box
                        as="span"
                        fontSize="sm"
                        fontWeight="500"
                        color="mukuru.text.primary"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        flex="1"
                        title={doc.fileName}
                      >
                        {doc.fileName}
                      </Box>
                    </HStack>
                    <HStack gap="2">
                      <HStack
                        gap="1"
                        align="center"
                        px="2"
                        py="1"
                        borderRadius="full"
                        bg={statusInfo.bgColor}
                      >
                        <StatusIcon
                          width="10px"
                          height="10px"
                          color={`var(--chakra-colors-${statusInfo.color.replace(/\./g, '-')})`}
                        />
                        <Typography
                          fontSize="xs"
                          fontWeight="500"
                          color={statusInfo.color}
                        >
                          {statusInfo.label}
                        </Typography>
                      </HStack>
                      <Button
                        variant="ghost"
                        size="sm"
                        p="1"
                        minW="auto"
                        h="auto"
                        borderRadius="md"
                        title="View document"
                        onClick={async () => {
                          // Try to open document - check for URL or blob first
                          const docUrl = (doc as any).url || (doc as any).fileUrl || (doc as any).downloadUrl;
                          if (docUrl) {
                            window.open(docUrl, '_blank');
                            return;
                          }
                          
                          // Try to fetch document from backend using storageKey or document ID
                          const storageKey = (doc as any).storageKey || (doc as any).storage_key;
                          const documentId = (doc as any).id || (doc as any).documentId;
                          
                          if (storageKey) {
                            try {
                              // Use direct download endpoint with storage key
                              const downloadUrl = `/api/proxy/api/v1/documents/direct?key=${encodeURIComponent(storageKey)}`;
                              window.open(downloadUrl, '_blank');
                              return;
                            } catch (error) {
                              console.error('Error opening document:', error);
                            }
                          }
                          
                          if (documentId) {
                            try {
                              // Fetch document details to get storage key
                              const response = await fetch(`/api/proxy/api/v1/documents/${documentId}`);
                              if (response.ok) {
                                const docData = await response.json();
                                const key = docData.storageKey || docData.storage_key;
                                if (key) {
                                  const downloadUrl = `/api/proxy/api/v1/documents/direct?key=${encodeURIComponent(key)}`;
                                  window.open(downloadUrl, '_blank');
                                  return;
                                }
                              }
                            } catch (error) {
                              console.error('Error fetching document:', error);
                            }
                          }
                          
                          // Try to find document by filename from case documents API
                          // Get caseId from the page context (passed via window or URL)
                          const caseId = window.location.pathname.split('/').pop();
                          if (caseId && doc.fileName) {
                            try {
                              const response = await fetch(`/api/proxy/api/v1/documents/case/${caseId}`);
                              if (response.ok) {
                                const caseDocuments = await response.json();
                                // Find document by matching filename
                                const matchingDoc = Array.isArray(caseDocuments) 
                                  ? caseDocuments.find((d: any) => 
                                      (d.fileName || d.file_name) === doc.fileName ||
                                      (d.FileName || d.fileName || d.file_name)?.toLowerCase() === doc.fileName?.toLowerCase()
                                    )
                                  : null;
                                
                                if (matchingDoc) {
                                  const key = matchingDoc.storageKey || matchingDoc.storage_key || matchingDoc.StorageKey;
                                  if (key) {
                                    const downloadUrl = `/api/proxy/api/v1/documents/direct?key=${encodeURIComponent(key)}`;
                                    window.open(downloadUrl, '_blank');
                                    return;
                                  }
                                }
                              }
                            } catch (error) {
                              console.error('Error fetching case documents:', error);
                            }
                          }
                          
                          // Fallback: Show alert if no URL available
                          alert(`Document: ${doc.fileName}\nStatus: ${statusInfo.label}\n\nDocument preview not available. The document may need to be downloaded from the server.`);
                        }}
                      >
                        <VisibleIcon
                          width="14px"
                          height="14px"
                          color="var(--chakra-colors-mukuru-grey-medium)"
                        />
                      </Button>
                    </HStack>
                  </HStack>
                </Box>
              );
            })}
          </VStack>
        )}
      </VStack>
    </Box>
  );
}

/**
 * Renders a single field with improved design - using Mukuru components
 */
function renderField(field: SchemaField, value: any): React.ReactNode {
  // Check if this is a document/file field
  const isDocumentField =
    field.type.toLowerCase() === 'file' ||
    field.type.toLowerCase() === 'document' ||
    field.code.toLowerCase().includes('document') ||
    field.code.toLowerCase().includes('_documents') ||
    field.code.toLowerCase().includes('id_documents') ||
    (typeof value === 'string' && (value.startsWith('[{') || value.includes('fileName')));

  if (isDocumentField) {
    return renderDocumentField(field, value);
  }

  const formattedValue = formatFieldValue(value, field.type, field.options);
  const isEmpty =
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  const FieldIcon = getFieldIcon(field.type, field.code);

  return (
    <Box
      p="4"
      bg="mukuru.background.light"
      borderRadius="lg"
      _hover={{ bg: 'mukuru.state.hover.card' }}
      transition="all 0.2s"
      h="full"
    >
      <VStack align="start" gap="2" h="full">
        {/* Label Row */}
        <HStack gap="2" align="center">
          <FieldIcon
            width="14px"
            height="14px"
            color="var(--chakra-colors-mukuru-grey-medium)"
          />
          <Typography
            fontSize="xs"
            fontWeight="600"
            color="mukuru.grey.mediumDark"
            textTransform="uppercase"
            letterSpacing="0.02em"
          >
            {field.label}
            {field.isRequired && (
              <Typography as="span" color="mukuru.text.error" ml="1">
                *
              </Typography>
            )}
          </Typography>
        </HStack>

        {/* Value */}
        <Typography
          fontSize="md"
          fontWeight={isEmpty ? '400' : '600'}
          color={isEmpty ? 'mukuru.grey.medium' : 'mukuru.text.primary'}
          wordBreak="break-word"
          fontStyle={isEmpty ? 'italic' : 'normal'}
          lineHeight="1.4"
        >
          {formattedValue}
        </Typography>

        {/* Help Text */}
        {field.helpText && (
          <Typography
            fontSize="xs"
            color="mukuru.grey.medium"
            fontStyle="italic"
            mt="auto"
          >
            {field.helpText}
          </Typography>
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
  readOnly: _readOnly = true,
}: SchemaDrivenViewProps) {
  if (!schema) {
    return (
      <Box
        p="6"
        bg="mukuru.background.light"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="mukuru.grey.light"
      >
        <Typography color="mukuru.grey.medium" fontSize="sm">
          No schema configuration available. Application data cannot be displayed
          dynamically.
        </Typography>
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
    sections = schema.sections.map((section: Record<string, unknown>) => ({
      id: section.id || `section-${section.title}`,
      title: section.title,
      description: section.description,
      fields: section.fields || [],
      order: section.order || 0,
    }));
  } else if (schema.steps && Array.isArray(schema.steps)) {
    // Form config format - convert steps to sections
    sections = schema.steps.map((step: Record<string, unknown>, index: number) => ({
      id: step.id || `step-${index}`,
      title: step.title || step.name || `Step ${index + 1}`,
      description: step.description,
      fields: step.fields || [],
      order: step.order || index,
    }));
  } else if (schema.requirements && Array.isArray(schema.requirements)) {
    // Entity type config format - group by requirement type
    const sectionsMap = new Map<string, SchemaSection>();

    schema.requirements.forEach((req: Record<string, unknown>) => {
      const requirement = (req.requirement || req) as Record<string, unknown>;
      if (!requirement) return;

      const reqType = String(requirement.type || 'Information');
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

      const requirementCode = String(requirement.code || '');
      const requirementDisplayName = String(
        requirement.displayName || requirement.name || requirementCode
      );

      // Log the field code we're looking for
      console.info(
        `[SchemaDrivenView] 🔍 Mapping field: "${requirementCode}" (${requirementDisplayName})`
      );

      const fieldValue = mapDataToFieldValue(requirementCode, applicationData);

      // Enhanced logging for debugging missing values
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
        console.warn(`[SchemaDrivenView] ⚠️ Field "${requirementCode}" - NO VALUE FOUND`);
        console.info(`  - Field code variations tried:`, {
          original: requirementCode,
          uppercase: requirementCode.toUpperCase(),
          lowercase: requirementCode.toLowerCase(),
          normalized: requirementCode.replace(/[_\s-]/g, ''),
        });
        console.info(
          `  - Available metadata keys (first 30):`,
          Object.keys(applicationData.metadata || {}).slice(0, 30)
        );
        console.info(
          `  - Available rawData keys (first 30):`,
          Object.keys(applicationData.rawData || {}).slice(0, 30)
        );
        console.info(
          `  - Available caseData keys (first 30):`,
          Object.keys(applicationData.caseData || {}).slice(0, 30)
        );
        // Show sample values that might match
        const allKeys = [
          ...Object.keys(applicationData.metadata || {}),
          ...Object.keys(applicationData.rawData || {}),
          ...Object.keys(applicationData.caseData || {}),
        ];
        const normalizedCode = requirementCode.replace(/[_\s-]/g, '').toLowerCase();
        const potentialMatches = allKeys.filter((key) => {
          const normalizedKey = key.replace(/[_\s-]/g, '').toLowerCase();
          return (
            normalizedKey.includes(normalizedCode) ||
            normalizedCode.includes(normalizedKey) ||
            key.toLowerCase().includes(requirementCode.toLowerCase()) ||
            requirementCode.toLowerCase().includes(key.toLowerCase())
          );
        });
        if (potentialMatches.length > 0) {
          console.info(
            `  - Potential matching keys found:`,
            potentialMatches.slice(0, 10)
          );
          // Also show the actual values for these potential matches
          const matchDetails = potentialMatches.slice(0, 10).map((key) => {
            let value = null;
            let source = '';
            if (applicationData.metadata?.[key] !== undefined) {
              value = applicationData.metadata[key];
              source = 'metadata';
            } else if (applicationData.rawData?.[key] !== undefined) {
              value = applicationData.rawData[key];
              source = 'rawData';
            } else if (applicationData.caseData?.[key] !== undefined) {
              value = applicationData.caseData[key];
              source = 'caseData';
            }
            return { key, value, source, isEmpty: !value || String(value).trim() === '' };
          });
          console.info(`  - Potential match details:`, matchDetails);
        }
      }

      section.fields.push({
        code: requirementCode,
        label: requirementDisplayName,
        type: String(requirement.fieldType || 'Text'),
        value: fieldValue,
        helpText: (requirement.helpText || requirement.description) as string | undefined,
        isRequired: (req.isRequired !== undefined
          ? req.isRequired
          : requirement.isRequired) as boolean | undefined,
        options: (requirement.options as Array<Record<string, unknown>> | undefined)?.map(
          (opt: Record<string, unknown>) => ({
            value: String(opt.value),
            label: String(opt.displayText || opt.label || opt.value),
          })
        ),
        order: (req.displayOrder || requirement.order || 0) as number,
      });
    });

    sections = Array.from(sectionsMap.values());
  } else if (schema.fields && Array.isArray(schema.fields)) {
    // Flat fields structure - create a single section
    sections = [
      {
        id: 'main-section',
        title: 'Application Information',
        fields: schema.fields,
        order: 0,
      },
    ];
  }

  // Sort sections by order
  sections.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Sort fields within each section by order
  sections.forEach((section) => {
    section.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  if (sections.length === 0) {
    return (
      <Box
        p="6"
        bg="mukuru.background.light"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="mukuru.grey.light"
      >
        <Typography color="mukuru.grey.medium" fontSize="sm">
          No fields configured in schema. Cannot display application data.
        </Typography>
      </Box>
    );
  }

  return (
    <VStack gap="6" align="stretch">
      {sections.map((section) => {
        // Map field values from application data
        const fieldsWithValues = section.fields
          .map((field) => {
            const mappedValue = mapDataToFieldValue(field.code, applicationData);
            return {
              ...field,
              value:
                field.value !== undefined && field.value !== null && field.value !== ''
                  ? field.value
                  : mappedValue,
            };
          })
          .sort((a, b) => {
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

        // Get section icon based on title - using Mukuru icons
        const getSectionIcon = (title: string): React.ComponentType<any> => {
          const titleLower = title.toLowerCase();
          if (titleLower.includes('document')) return DocumentIcon;
          if (titleLower.includes('information') || titleLower.includes('info'))
            return FileOpenIcon;
          if (titleLower.includes('contact')) return UserIcon;
          if (titleLower.includes('address') || titleLower.includes('location'))
            return LocationIcon;
          if (titleLower.includes('business') || titleLower.includes('company'))
            return ReceiptIcon;
          return FileOpenIcon;
        };

        const SectionIcon = getSectionIcon(section.title || '');

        return (
          <Box
            key={section.id}
            width="100%"
            bg="mukuru.cards.white"
            borderRadius="xl"
            border="1px"
            borderColor="mukuru.grey.light"
            overflow="hidden"
            boxShadow="sm"
            _hover={{ boxShadow: 'md' }}
            transition="all 0.2s"
          >
            {/* Section Header */}
            {section.title && (
              <Box
                bg="mukuru.background.light"
                px="5"
                py="4"
                borderBottom="1px"
                borderColor="mukuru.grey.light"
              >
                <HStack gap="3" align="center">
                  <IconWrapper
                    p="2"
                    borderRadius="lg"
                    bg="mukuru.cards.white"
                    boxShadow="sm"
                  >
                    <SectionIcon
                      width="18px"
                      height="18px"
                      color="var(--chakra-colors-mukuru-buttons-primary)"
                    />
                  </IconWrapper>
                  <VStack align="start" gap="0">
                    <Typography
                      fontSize="md"
                      fontWeight="700"
                      color="mukuru.text.primary"
                      letterSpacing="-0.01em"
                    >
                      {section.title.toUpperCase()}
                    </Typography>
                    {section.description && (
                      <Typography fontSize="xs" color="mukuru.grey.medium">
                        {section.description}
                      </Typography>
                    )}
                  </VStack>
                </HStack>
              </Box>
            )}

            {/* Section Content */}
            <Box p="5">
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="4" width="100%">
                {fieldsWithValues.map((field) => (
                  <Box key={field.code} width="100%">
                    {renderField(field, field.value)}
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </Box>
        );
      })}
    </VStack>
  );
}
