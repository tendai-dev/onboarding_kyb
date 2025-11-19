export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'custom';
  required?: boolean;
  placeholder?: string;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  dependencies?: {
    field: string;
    value: any;
    show?: boolean;
    required?: boolean;
  }[];
  externalValidation?: {
    enabled: boolean;
    apiEndpoint?: string;
    loadingText?: string;
    successText?: string;
    errorText?: string;
  };
  conditional?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  group?: string;
  order?: number;
}

export interface EntityFormConfig {
  entityType: string;
  displayName: string;
  description: string;
  steps: {
    id: string;
    title: string;
    subtitle: string;
    fields: FormField[];
    requiredDocuments: string[];
    // Metadata for integration with checklist and work-queue
    requirementType?: string;
    checklistCategory?: string;
    stepNumber?: number;
  }[];
  requiredDocuments: {
    id: string;
    name: string;
    description: string;
    required: boolean;
    category: string;
  }[];
}

export const entityFormConfigs: Record<string, EntityFormConfig> = {
  'private_company': {
    entityType: 'private_company',
    displayName: 'Private Company / Limited Liability Company',
    description: 'Registered companies and corporations',
    steps: [
      {
        id: 'business_info',
        title: 'Business Information',
        subtitle: 'Company details and registration',
        fields: [
          {
            id: 'companyName',
            label: 'Company Name',
            type: 'text',
            required: true,
            placeholder: 'Enter your company name',
            externalValidation: {
              enabled: true,
              apiEndpoint: '/api/validate/company-name',
              loadingText: 'Validating company name...',
              successText: 'Company name verified',
              errorText: 'Company name not found'
            },
            order: 1
          },
          {
            id: 'country',
            label: 'Country',
            type: 'select',
            required: true,
            placeholder: 'Select country',
            options: [
              { value: 'South Africa', label: 'South Africa' },
              { value: 'Kenya', label: 'Kenya' },
              { value: 'Nigeria', label: 'Nigeria' },
              { value: 'Ghana', label: 'Ghana' },
              { value: 'Zimbabwe', label: 'Zimbabwe' },
              { value: 'Zambia', label: 'Zambia' },
              { value: 'Tanzania', label: 'Tanzania' },
              { value: 'Uganda', label: 'Uganda' },
              { value: 'Rwanda', label: 'Rwanda' },
              { value: 'Mauritius', label: 'Mauritius' }
            ],
            order: 2
          },
          {
            id: 'tradingName',
            label: 'Trading Name (if different)',
            type: 'text',
            required: false,
            placeholder: 'Enter trading name',
            order: 3
          },
          {
            id: 'registrationNumber',
            label: 'Registration Number',
            type: 'text',
            required: true,
            placeholder: 'Enter company registration number',
            externalValidation: {
              enabled: true,
              apiEndpoint: '/api/validate/registration',
              loadingText: 'Validating registration...',
              successText: 'Registration verified',
              errorText: 'Invalid registration number'
            },
            order: 4
          },
          {
            id: 'applicantName',
            label: 'Applicant Full Name',
            type: 'text',
            required: true,
            placeholder: 'Enter your full name',
            order: 5
          },
          {
            id: 'applicantEmail',
            label: 'Applicant Email',
            type: 'email',
            required: true,
            placeholder: 'Enter your email address',
            order: 6
          },
          {
            id: 'taxNumber',
            label: 'Tax Number',
            type: 'text',
            required: true,
            placeholder: 'Enter tax identification number',
            externalValidation: {
              enabled: true,
              apiEndpoint: '/api/validate/tax-number',
              loadingText: 'Validating tax number...',
              successText: 'Tax number verified',
              errorText: 'Invalid tax number'
            },
            order: 7
          },
          {
            id: 'dateOfIncorporation',
            label: 'Date of Incorporation',
            type: 'date',
            required: true,
            order: 8
          },
          {
            id: 'placeOfIncorporation',
            label: 'Place of Incorporation',
            type: 'text',
            required: true,
            placeholder: 'Enter place of incorporation',
            order: 9
          }
        ],
        requiredDocuments: ['certificate_incorporation', 'memorandum_association']
      },
      {
        id: 'business_address',
        title: 'Business Address',
        subtitle: 'Registered and operating addresses',
        fields: [
          {
            id: 'businessAddress',
            label: 'Registered Business Address',
            type: 'textarea',
            required: true,
            placeholder: 'Enter complete business address',
            order: 1
          },
          {
            id: 'businessCity',
            label: 'City',
            type: 'text',
            required: true,
            placeholder: 'Enter city',
            order: 2
          },
          {
            id: 'businessCountry',
            label: 'Country',
            type: 'select',
            required: true,
            options: [
              { value: 'ZA', label: 'South Africa' },
              { value: 'UK', label: 'United Kingdom' },
              { value: 'US', label: 'United States' },
              { value: 'AU', label: 'Australia' },
              { value: 'CA', label: 'Canada' }
            ],
            order: 3
          },
          {
            id: 'businessPostalCode',
            label: 'Postal Code',
            type: 'text',
            required: true,
            placeholder: 'Enter postal code',
            order: 4
          },
          {
            id: 'operatingAddress',
            label: 'Operating Address (if different)',
            type: 'textarea',
            required: false,
            placeholder: 'Enter operating address if different from registered address',
            conditional: {
              field: 'businessAddress',
              operator: 'not_equals',
              value: ''
            },
            order: 5
          }
        ],
        requiredDocuments: ['proof_address']
      },
      {
        id: 'ownership_control',
        title: 'Ownership & Control',
        subtitle: 'Shareholders and beneficial owners',
        fields: [
          {
            id: 'authorizedCapital',
            label: 'Authorized Capital',
            type: 'text',
            required: true,
            placeholder: 'Enter authorized capital amount',
            order: 1
          },
          {
            id: 'issuedCapital',
            label: 'Issued Capital',
            type: 'text',
            required: true,
            placeholder: 'Enter issued capital amount',
            order: 2
          },
          {
            id: 'shareholders',
            label: 'Shareholders',
            type: 'custom',
            required: true,
            description: 'Add all shareholders with 25% or more ownership',
            order: 3
          },
          {
            id: 'beneficialOwners',
            label: 'Beneficial Owners',
            type: 'custom',
            required: true,
            description: 'Add all beneficial owners with 25% or more control',
            order: 4
          }
        ],
        requiredDocuments: ['shareholder_register', 'beneficial_ownership']
      },
      {
        id: 'directors',
        title: 'Directors',
        subtitle: 'Board of directors and management',
        fields: [
          {
            id: 'directors',
            label: 'Directors',
            type: 'custom',
            required: true,
            description: 'Add all directors and their details',
            order: 1
          },
          {
            id: 'authorizedSignatory',
            label: 'Authorized Signatory',
            type: 'custom',
            required: true,
            description: 'Person authorized to sign on behalf of the company',
            order: 2
          }
        ],
        requiredDocuments: ['director_ids', 'board_resolution']
      },
      {
        id: 'contact_details',
        title: 'Contact Details',
        subtitle: 'Key personnel and communication',
        fields: [
          {
            id: 'businessPhone',
            label: 'Business Phone',
            type: 'tel',
            required: true,
            placeholder: 'Enter business phone number',
            order: 1
          },
          {
            id: 'businessEmail',
            label: 'Business Email',
            type: 'email',
            required: true,
            placeholder: 'Enter business email address',
            order: 2
          },
          {
            id: 'website',
            label: 'Website (if applicable)',
            type: 'url',
            required: false,
            placeholder: 'Enter company website',
            order: 3
          },
          {
            id: 'primaryContact',
            label: 'Primary Contact Person',
            type: 'custom',
            required: true,
            description: 'Main contact person for this application',
            order: 4
          }
        ],
        requiredDocuments: []
      }
    ],
    requiredDocuments: [
      {
        id: 'certificate_incorporation',
        name: 'Certificate of Incorporation',
        description: 'Official certificate of incorporation',
        required: true,
        category: 'legal'
      },
      {
        id: 'memorandum_association',
        name: 'Memorandum of Association',
        description: 'Memorandum and articles of association',
        required: true,
        category: 'legal'
      },
      {
        id: 'proof_address',
        name: 'Proof of Business Address',
        description: 'Document proving registered business address',
        required: true,
        category: 'address'
      },
      {
        id: 'shareholder_register',
        name: 'Shareholder Register',
        description: 'Current shareholder register',
        required: true,
        category: 'ownership'
      },
      {
        id: 'beneficial_ownership',
        name: 'Beneficial Ownership Declaration',
        description: 'Declaration of beneficial ownership',
        required: true,
        category: 'ownership'
      },
      {
        id: 'director_ids',
        name: 'Director ID Copies',
        description: 'Copies of ID documents for all directors',
        required: true,
        category: 'identity'
      },
      {
        id: 'board_resolution',
        name: 'Board Resolution',
        description: 'Board resolution authorizing the application',
        required: true,
        category: 'authorization'
      },
      {
        id: 'banking_details',
        name: 'Banking Details',
        description: 'Bank account details and statements',
        required: true,
        category: 'financial'
      },
      {
        id: 'tax_clearance',
        name: 'Tax Clearance Certificate',
        description: 'Valid tax clearance certificate',
        required: false,
        category: 'compliance'
      }
    ]
  },
  
  'npo': {
    entityType: 'npo',
    displayName: 'Non-Profit Organisation (NPO/NGO/PVO)',
    description: 'Non-profit organizations and charities',
    steps: [
      {
        id: 'organization_info',
        title: 'Organization Information',
        subtitle: 'NPO details and registration',
        fields: [
          {
            id: 'organizationName',
            label: 'Organization Name',
            type: 'text',
            required: true,
            placeholder: 'Enter organization name',
            order: 1
          },
          {
            id: 'country',
            label: 'Country',
            type: 'select',
            required: true,
            placeholder: 'Select country',
            options: [
              { value: 'South Africa', label: 'South Africa' },
              { value: 'Kenya', label: 'Kenya' },
              { value: 'Nigeria', label: 'Nigeria' },
              { value: 'Ghana', label: 'Ghana' },
              { value: 'Zimbabwe', label: 'Zimbabwe' },
              { value: 'Zambia', label: 'Zambia' },
              { value: 'Tanzania', label: 'Tanzania' },
              { value: 'Uganda', label: 'Uganda' },
              { value: 'Rwanda', label: 'Rwanda' },
              { value: 'Mauritius', label: 'Mauritius' }
            ],
            order: 2
          },
          {
            id: 'applicantName',
            label: 'Applicant Full Name',
            type: 'text',
            required: true,
            placeholder: 'Enter your full name',
            order: 3
          },
          {
            id: 'applicantEmail',
            label: 'Applicant Email',
            type: 'email',
            required: true,
            placeholder: 'Enter your email address',
            order: 4
          },
          {
            id: 'registrationNumber',
            label: 'NPO Registration Number',
            type: 'text',
            required: true,
            placeholder: 'Enter NPO registration number',
            externalValidation: {
              enabled: true,
              apiEndpoint: '/api/validate/npo-registration',
              loadingText: 'Validating NPO registration...',
              successText: 'NPO registration verified',
              errorText: 'Invalid NPO registration number'
            },
            order: 5
          },
          {
            id: 'dateOfRegistration',
            label: 'Date of Registration',
            type: 'date',
            required: true,
            order: 6
          },
          {
            id: 'organizationType',
            label: 'Organization Type',
            type: 'select',
            required: true,
            options: [
              { value: 'npo', label: 'Non-Profit Organisation' },
              { value: 'ngo', label: 'Non-Governmental Organisation' },
              { value: 'pvo', label: 'Private Voluntary Organisation' },
              { value: 'charity', label: 'Charity' },
              { value: 'foundation', label: 'Foundation' }
            ],
            order: 7
          }
        ],
        requiredDocuments: ['npo_certificate', 'constitution']
      },
      {
        id: 'governance',
        title: 'Governance Structure',
        subtitle: 'Trustees and management structure',
        fields: [
          {
            id: 'trustees',
            label: 'Trustees/Board Members',
            type: 'custom',
            required: true,
            description: 'Add all trustees and board members',
            order: 1
          },
          {
            id: 'executiveDirector',
            label: 'Executive Director',
            type: 'custom',
            required: true,
            description: 'Executive director details',
            order: 2
          },
          {
            id: 'authorizedSignatory',
            label: 'Authorized Signatory',
            type: 'custom',
            required: true,
            description: 'Person authorized to sign on behalf of the organization',
            order: 3
          }
        ],
        requiredDocuments: ['trustee_ids', 'board_resolution']
      },
      {
        id: 'activities',
        title: 'Activities & Mission',
        subtitle: 'Organization activities and objectives',
        fields: [
          {
            id: 'missionStatement',
            label: 'Mission Statement',
            type: 'textarea',
            required: true,
            placeholder: 'Describe your organization\'s mission',
            order: 1
          },
          {
            id: 'mainActivities',
            label: 'Main Activities',
            type: 'textarea',
            required: true,
            placeholder: 'Describe your main activities',
            order: 2
          },
          {
            id: 'targetBeneficiaries',
            label: 'Target Beneficiaries',
            type: 'textarea',
            required: true,
            placeholder: 'Describe your target beneficiaries',
            order: 3
          }
        ],
        requiredDocuments: []
      },
      {
        id: 'financial_info',
        title: 'Financial Information',
        subtitle: 'Financial details and funding',
        fields: [
          {
            id: 'annualBudget',
            label: 'Annual Budget',
            type: 'text',
            required: true,
            placeholder: 'Enter annual budget amount',
            order: 1
          },
          {
            id: 'fundingSources',
            label: 'Main Funding Sources',
            type: 'textarea',
            required: true,
            placeholder: 'Describe your main funding sources',
            order: 2
          },
          {
            id: 'bankingDetails',
            label: 'Banking Details',
            type: 'custom',
            required: true,
            description: 'Bank account details for the organization',
            order: 3
          }
        ],
        requiredDocuments: ['financial_statements', 'banking_details']
      }
    ],
    requiredDocuments: [
      {
        id: 'npo_certificate',
        name: 'NPO Registration Certificate',
        description: 'Official NPO registration certificate',
        required: true,
        category: 'legal'
      },
      {
        id: 'constitution',
        name: 'Constitution',
        description: 'Organization constitution or governing document',
        required: true,
        category: 'legal'
      },
      {
        id: 'trustee_ids',
        name: 'Trustee ID Copies',
        description: 'Copies of ID documents for all trustees',
        required: true,
        category: 'identity'
      },
      {
        id: 'board_resolution',
        name: 'Board Resolution',
        description: 'Board resolution authorizing the application',
        required: true,
        category: 'authorization'
      },
      {
        id: 'financial_statements',
        name: 'Financial Statements',
        description: 'Recent audited financial statements',
        required: true,
        category: 'financial'
      },
      {
        id: 'banking_details',
        name: 'Banking Details',
        description: 'Bank account details and statements',
        required: true,
        category: 'financial'
      }
    ]
  },

  'government': {
    entityType: 'government',
    displayName: 'Government / State Owned Entity',
    description: 'Government departments and state-owned entities',
    steps: [
      {
        id: 'entity_info',
        title: 'Entity Information',
        subtitle: 'Government entity details',
        fields: [
          {
            id: 'entityName',
            label: 'Entity Name',
            type: 'text',
            required: true,
            placeholder: 'Enter entity name',
            order: 1
          },
          {
            id: 'country',
            label: 'Country',
            type: 'select',
            required: true,
            placeholder: 'Select country',
            options: [
              { value: 'South Africa', label: 'South Africa' },
              { value: 'Kenya', label: 'Kenya' },
              { value: 'Nigeria', label: 'Nigeria' },
              { value: 'Ghana', label: 'Ghana' },
              { value: 'Zimbabwe', label: 'Zimbabwe' },
              { value: 'Zambia', label: 'Zambia' },
              { value: 'Tanzania', label: 'Tanzania' },
              { value: 'Uganda', label: 'Uganda' },
              { value: 'Rwanda', label: 'Rwanda' },
              { value: 'Mauritius', label: 'Mauritius' }
            ],
            order: 2
          },
          {
            id: 'applicantName',
            label: 'Applicant Full Name',
            type: 'text',
            required: true,
            placeholder: 'Enter your full name',
            order: 3
          },
          {
            id: 'applicantEmail',
            label: 'Applicant Email',
            type: 'email',
            required: true,
            placeholder: 'Enter your email address',
            order: 4
          },
          {
            id: 'entityType',
            label: 'Entity Type',
            type: 'select',
            required: true,
            options: [
              { value: 'department', label: 'Government Department' },
              { value: 'ministry', label: 'Ministry' },
              { value: 'agency', label: 'Government Agency' },
              { value: 'soe', label: 'State-Owned Enterprise' },
              { value: 'municipality', label: 'Municipality' }
            ],
            order: 5
          },
          {
            id: 'registrationNumber',
            label: 'Government Registration Number',
            type: 'text',
            required: true,
            placeholder: 'Enter government registration number',
            order: 6
          },
          {
            id: 'jurisdiction',
            label: 'Jurisdiction',
            type: 'text',
            required: true,
            placeholder: 'Enter jurisdiction (e.g., National, Provincial, Local)',
            order: 7
          }
        ],
        requiredDocuments: ['government_certificate', 'establishment_act']
      },
      {
        id: 'authority',
        title: 'Authority & Authorization',
        subtitle: 'Legal authority and authorization',
        fields: [
          {
            id: 'legalBasis',
            label: 'Legal Basis',
            type: 'textarea',
            required: true,
            placeholder: 'Describe the legal basis for the entity',
            order: 1
          },
          {
            id: 'authorizedSignatory',
            label: 'Authorized Signatory',
            type: 'custom',
            required: true,
            description: 'Person authorized to sign on behalf of the entity',
            order: 2
          },
          {
            id: 'authorityDocument',
            label: 'Authority Document Reference',
            type: 'text',
            required: true,
            placeholder: 'Reference to the authority document',
            order: 3
          }
        ],
        requiredDocuments: ['authority_document', 'signatory_authorization']
      }
    ],
    requiredDocuments: [
      {
        id: 'government_certificate',
        name: 'Government Certificate',
        description: 'Official government certificate or registration',
        required: true,
        category: 'legal'
      },
      {
        id: 'establishment_act',
        name: 'Establishment Act/Statute',
        description: 'Act or statute establishing the entity',
        required: true,
        category: 'legal'
      },
      {
        id: 'authority_document',
        name: 'Authority Document',
        description: 'Document authorizing the entity to operate',
        required: true,
        category: 'authorization'
      },
      {
        id: 'signatory_authorization',
        name: 'Signatory Authorization',
        description: 'Document authorizing the signatory',
        required: true,
        category: 'authorization'
      }
    ]
  }
};

export const getEntityFormConfig = (entityType: string): EntityFormConfig | null => {
  return entityFormConfigs[entityType] || null;
};

export const getAllEntityTypes = (): Array<{ value: string; label: string; description: string }> => {
  return Object.values(entityFormConfigs).map(config => ({
    value: config.entityType,
    label: config.displayName,
    description: config.description
  }));
};
