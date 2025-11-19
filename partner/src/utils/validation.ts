import * as Yup from 'yup';

// Company registration number validation patterns
const registrationPatterns = {
  za: /^\d{4}\/\d{6}\/\d{2}$/, // South Africa: 2019/123456/07
  uk: /^[A-Z0-9]{8}$/, // UK: 12345678
  us: /^\d{2}-\d{7}$/, // US: 12-3456789
  zw: /^[A-Z]{2}\d{6}$/, // Zimbabwe: AB123456
  bw: /^BW\d{8}$/, // Botswana: BW12345678
};

// Phone number validation patterns
const phonePatterns = {
  za: /^(\+27|0)[1-9]\d{8}$/, // South Africa
  uk: /^(\+44|0)[1-9]\d{8,9}$/, // UK
  us: /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/, // US
  zw: /^(\+263|0)[1-9]\d{6,8}$/, // Zimbabwe
  bw: /^(\+267|0)[2-7]\d{6}$/, // Botswana
};

// Tax ID validation patterns
const taxIdPatterns = {
  za: /^\d{10}$/, // South Africa: 10 digits
  uk: /^\d{10}$/, // UK: 10 digits
  us: /^\d{2}-\d{7}$/, // US: XX-XXXXXXX
  zw: /^\d{8}$/, // Zimbabwe: 8 digits
  bw: /^[A-Z]\d{8}$/, // Botswana: Letter + 8 digits
};

// Bank account validation patterns
const bankAccountPatterns = {
  za: /^\d{9,11}$/, // South Africa: 9-11 digits
  uk: /^\d{8}$/, // UK: 8 digits
  us: /^\d{9,12}$/, // US: 9-12 digits
  zw: /^\d{10,13}$/, // Zimbabwe: 10-13 digits
  bw: /^\d{10}$/, // Botswana: 10 digits
};

// Validation schemas for different entity types
export const entityValidationSchemas = {
  pty_ltd: Yup.object().shape({
    companyName: Yup.string()
      .min(2, 'Company name must be at least 2 characters')
      .max(100, 'Company name must not exceed 100 characters')
      .required('Company name is required'),
    registrationNumber: Yup.string()
      .required('Registration number is required')
      .test('valid-format', 'Invalid registration number format', function(value) {
        const country = this.parent.country;
        if (!value || !country) return false;
        const pattern = registrationPatterns[country as keyof typeof registrationPatterns];
        return pattern ? pattern.test(value) : true;
      }),
    directors: Yup.array()
      .of(Yup.object().shape({
        name: Yup.string().required('Director name is required'),
        idNumber: Yup.string().required('ID number is required'),
        nationality: Yup.string().required('Nationality is required'),
      }))
      .min(1, 'At least one director is required'),
    shareholders: Yup.array()
      .of(Yup.object().shape({
        name: Yup.string().required('Shareholder name is required'),
        percentage: Yup.number()
          .min(0, 'Percentage must be positive')
          .max(100, 'Percentage cannot exceed 100%')
          .required('Ownership percentage is required'),
      }))
      .min(1, 'At least one shareholder is required')
      .test('total-percentage', 'Total ownership must equal 100%', function(shareholders) {
        if (!shareholders) return false;
        const total = shareholders.reduce((sum, sh) => sum + (sh.percentage || 0), 0);
        return Math.abs(total - 100) < 0.01; // Allow for small floating point errors
      }),
  }),

  npo_ngo: Yup.object().shape({
    organizationName: Yup.string()
      .min(2, 'Organization name must be at least 2 characters')
      .required('Organization name is required'),
    registrationNumber: Yup.string()
      .required('NPO registration number is required'),
    purpose: Yup.string()
      .min(50, 'Purpose must be at least 50 characters')
      .required('Organization purpose is required'),
    beneficiaries: Yup.string()
      .min(20, 'Beneficiary description must be at least 20 characters')
      .required('Beneficiary information is required'),
    trustees: Yup.array()
      .of(Yup.object().shape({
        name: Yup.string().required('Trustee name is required'),
        role: Yup.string().required('Trustee role is required'),
      }))
      .min(3, 'At least 3 trustees are required'),
  }),

  trust: Yup.object().shape({
    trustName: Yup.string()
      .min(2, 'Trust name must be at least 2 characters')
      .required('Trust name is required'),
    trustDeedDate: Yup.date()
      .max(new Date(), 'Trust deed date cannot be in the future')
      .required('Trust deed date is required'),
    trustees: Yup.array()
      .of(Yup.object().shape({
        name: Yup.string().required('Trustee name is required'),
        idNumber: Yup.string().required('ID number is required'),
        role: Yup.string().required('Trustee role is required'),
      }))
      .min(1, 'At least one trustee is required'),
    beneficiaries: Yup.array()
      .of(Yup.object().shape({
        name: Yup.string().required('Beneficiary name is required'),
        relationship: Yup.string().required('Relationship is required'),
      }))
      .min(1, 'At least one beneficiary is required'),
  }),

  government: Yup.object().shape({
    departmentName: Yup.string()
      .min(2, 'Department name must be at least 2 characters')
      .required('Department name is required'),
    governmentLevel: Yup.string()
      .oneOf(['national', 'provincial', 'local'], 'Invalid government level')
      .required('Government level is required'),
    authorizedOfficer: Yup.object().shape({
      name: Yup.string().required('Authorized officer name is required'),
      title: Yup.string().required('Officer title is required'),
      contactNumber: Yup.string().required('Contact number is required'),
    }),
  }),
};

// Common validation schemas
export const commonValidationSchemas = {
  contact: Yup.object().shape({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    phone: Yup.string()
      .required('Phone number is required')
      .test('valid-phone', 'Invalid phone number format', function(value) {
        const country = this.parent.country;
        if (!value || !country) return false;
        const pattern = phonePatterns[country as keyof typeof phonePatterns];
        return pattern ? pattern.test(value) : true;
      }),
    address: Yup.object().shape({
      street: Yup.string().required('Street address is required'),
      city: Yup.string().required('City is required'),
      postalCode: Yup.string().required('Postal code is required'),
      country: Yup.string().required('Country is required'),
    }),
  }),

  banking: Yup.object().shape({
    bankName: Yup.string().required('Bank name is required'),
    accountNumber: Yup.string()
      .required('Account number is required')
      .test('valid-account', 'Invalid account number format', function(value) {
        const country = this.parent.country;
        if (!value || !country) return false;
        const pattern = bankAccountPatterns[country as keyof typeof bankAccountPatterns];
        return pattern ? pattern.test(value) : true;
      }),
    accountType: Yup.string()
      .oneOf(['checking', 'savings', 'business'], 'Invalid account type')
      .required('Account type is required'),
    swiftCode: Yup.string()
      .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code format')
      .when('isInternational', {
        is: true,
        then: (schema) => schema.required('SWIFT code is required for international transfers'),
      }),
  }),

  financial: Yup.object().shape({
    annualRevenue: Yup.number()
      .positive('Annual revenue must be positive')
      .required('Annual revenue is required'),
    expectedMonthlyVolume: Yup.number()
      .positive('Expected monthly volume must be positive')
      .required('Expected monthly volume is required'),
    sourceOfFunds: Yup.string()
      .min(10, 'Source of funds description must be at least 10 characters')
      .required('Source of funds is required'),
    purposeOfAccount: Yup.string()
      .min(10, 'Purpose of account must be at least 10 characters')
      .required('Purpose of account is required'),
  }),
};

// Document validation based on Annexure A requirements
export const documentValidation = {
  validateFileType: (file: File, allowedTypes: string[]) => {
    return allowedTypes.includes(file.type);
  },

  validateFileSize: (file: File, maxSizeMB: number) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  validateFileName: (fileName: string) => {
    // Check for valid characters and length
    const validNamePattern = /^[a-zA-Z0-9._-]+$/;
    return validNamePattern.test(fileName) && fileName.length <= 255;
  },

  // Document requirements based on Annexure A
  getRequiredDocuments: (entityType: string, isEPP: boolean = false) => {
    const documentRequirements = {
      pty_ltd: [
        {
          id: 'registration_certificate',
          name: 'Registration Certificate / Certificate of Incorporation',
          description: 'Official company registration certificate',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'registration'
        },
        {
          id: 'trading_name_proof',
          name: 'Proof of Trading/Operating Name',
          description: 'Business letterhead, invoice, or website extract (if different from registered name)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identification'
        },
        {
          id: 'registered_address_proof',
          name: 'Proof of Registered Address',
          description: 'Lease agreement, utility bill, bank statement (not older than 3 months)',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'address'
        },
        {
          id: 'operating_address_proof',
          name: 'Proof of Operating Address',
          description: 'Address proof if different from registered address (not older than 3 months)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'address'
        },
        {
          id: 'directors_list',
          name: 'Board of Directors List',
          description: 'Annual report, financial statements, or company register extract',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'governance'
        },
        {
          id: 'ownership_structure',
          name: 'Ownership Structure',
          description: 'Memorandum of Incorporation, Shareholders Register, Share Certificates',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'ownership'
        },
        {
          id: 'beneficial_owners_id',
          name: 'Beneficial Owners ID Documents',
          description: 'Valid ID/passport for individuals with ≥25% shareholding',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'authorized_persons_id',
          name: 'Authorized Persons ID Documents',
          description: 'Valid ID/passport for all authorized persons',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'mandate_resolution',
          name: 'Mandate/Company Resolution',
          description: 'Signed authorization for mandated persons (EPP only)',
          required: isEPP,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'authorization'
        }
      ],

      publicly_listed: [
        {
          id: 'listing_proof',
          name: 'Proof of Stock Exchange Listing',
          description: 'Print-out from stock exchange website evidencing listing',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'registration'
        },
        {
          id: 'executive_directors_list',
          name: 'Executive Directors List',
          description: 'Annual report, financial statements, or equivalent document',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'governance'
        },
        {
          id: 'authorized_persons_id',
          name: 'Authorized Persons ID Documents',
          description: 'Valid ID/passport for all authorized persons',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'mandate_resolution',
          name: 'Mandate/Company Resolution',
          description: 'Signed authorization for mandated persons (EPP only)',
          required: isEPP,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'authorization'
        }
      ],

      government: [
        {
          id: 'registration_certificate',
          name: 'Registration Certificate/Governing Document',
          description: 'Registration certificate, Act of Parliament, or official registration documents',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'registration'
        },
        {
          id: 'executive_directors_list',
          name: 'Executive Directors/Senior Management List',
          description: 'Annual report, financial statements, or equivalent document',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'governance'
        },
        {
          id: 'authorized_persons_id',
          name: 'Authorized Persons ID Documents',
          description: 'Valid ID/passport for all authorized persons',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'mandate_resolution',
          name: 'Mandate/Government Resolution',
          description: 'Signed authorization for mandated persons (EPP only)',
          required: isEPP,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'authorization'
        }
      ],

      npo_ngo: [
        {
          id: 'registration_certificate',
          name: 'NPO/NGO Registration Certificate',
          description: 'Registration certificate, certificate of incorporation, or governing document',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'registration'
        },
        {
          id: 'npo_license',
          name: 'NPO/NGO Certificate or License',
          description: 'Valid NPO/NGO certificate or license (if applicable in operating country)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'licensing'
        },
        {
          id: 'constitution',
          name: 'Governing Document/Constitution',
          description: 'Constitution, memorandum of incorporation, or governing document',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'governance'
        },
        {
          id: 'trading_name_proof',
          name: 'Proof of Trading/Operating Name',
          description: 'Business letterhead, invoice, or website extract (if different from registered name)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identification'
        },
        {
          id: 'registered_address_proof',
          name: 'Proof of Registered Address',
          description: 'Address proof if not in registration documents (not older than 3 months)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'address'
        },
        {
          id: 'operating_address_proof',
          name: 'Proof of Operating Address',
          description: 'Address proof if different from registered address (not older than 3 months)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'address'
        },
        {
          id: 'key_controllers_list',
          name: 'Key Controllers List',
          description: 'Annual report, financial statements, or official document listing trustees/management',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'governance'
        },
        {
          id: 'beneficial_owners_id',
          name: 'Key Individuals ID Documents',
          description: 'Valid ID/passport for individuals with ≥25% control or management responsibility',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'authorized_persons_id',
          name: 'Authorized Persons ID Documents',
          description: 'Valid ID/passport for all authorized persons',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'mandate_resolution',
          name: 'Mandate/Resolution',
          description: 'Signed authorization for mandated persons (EPP only)',
          required: isEPP,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'authorization'
        }
      ],

      association: [
        {
          id: 'constitution',
          name: 'Constitution/Mission Statement/Charter',
          description: 'Constitution, mission statement, charter, or other official document',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'governance'
        },
        {
          id: 'address_proof',
          name: 'Proof of Address',
          description: 'Lease agreement, utility bill, bank statement (not older than 3 months)',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'address'
        },
        {
          id: 'key_controllers_list',
          name: 'Key Controllers List',
          description: 'Annual report, financial statements, or official document listing members/officials',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'governance'
        },
        {
          id: 'management_id',
          name: 'Management ID Documents',
          description: 'Valid ID/passport for individuals responsible for management',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'authorized_persons_id',
          name: 'Authorized Persons ID Documents',
          description: 'Valid ID/passport for all authorized persons',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'mandate_resolution',
          name: 'Mandate/Resolution',
          description: 'Signed authorization for mandated persons',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'authorization'
        }
      ],

      trust: [
        {
          id: 'trust_deed',
          name: 'Trust Deed',
          description: 'Trust deed or letter of appointment/authority for trustees',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'registration'
        },
        {
          id: 'trading_name_proof',
          name: 'Proof of Trading/Operating Name',
          description: 'Business letterhead, invoice, or website extract (if different from trust name)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identification'
        },
        {
          id: 'registered_address_proof',
          name: 'Proof of Registered Address',
          description: 'Address proof if not in trust deed (not older than 3 months)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'address'
        },
        {
          id: 'operating_address_proof',
          name: 'Proof of Operating Address',
          description: 'Address proof if different from registered address (not older than 3 months)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'address'
        },
        {
          id: 'trustees_beneficiaries_id',
          name: 'Trustees and Beneficiaries ID Documents',
          description: 'Valid ID/passport for all trustees and related parties (beneficiaries/founders/settlor)',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'authorized_persons_id',
          name: 'Authorized Persons ID Documents',
          description: 'Valid ID/passport for all authorized persons',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'mandate_resolution',
          name: 'Trust Resolution/Power of Attorney',
          description: 'Signed authorization for authorized persons (EPP only)',
          required: isEPP,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'authorization'
        }
      ],

      supranational: [
        {
          id: 'authorized_persons_id',
          name: 'Authorized Persons ID Documents',
          description: 'Valid ID/passport for all authorized persons',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'mandate_resolution',
          name: 'Mandate/Resolution',
          description: 'Signed authorization for mandated persons',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'authorization'
        },
        {
          id: 'constitutional_document',
          name: 'Constitutional Document',
          description: 'Reference to reliable website or 3rd party document evidencing existence',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
          category: 'registration'
        }
      ],

      sole_proprietor: [
        {
          id: 'registration_certificate',
          name: 'Registration Certificate',
          description: 'Registration certificate or certificate of incorporation',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'registration'
        },
        {
          id: 'trading_name_proof',
          name: 'Proof of Trading/Operating Name',
          description: 'Business letterhead, invoice, or website extract (if different from registered name)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identification'
        },
        {
          id: 'registered_address_proof',
          name: 'Proof of Registered Address',
          description: 'Address proof if not in registration documents (not older than 3 months)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'address'
        },
        {
          id: 'operating_address_proof',
          name: 'Proof of Operating Address',
          description: 'Address proof if different from registered address (not older than 3 months)',
          required: false,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'address'
        },
        {
          id: 'directors_list',
          name: 'Board of Directors List',
          description: 'Registration certificate, annual report, or official document listing directors',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'governance'
        },
        {
          id: 'ownership_structure',
          name: 'Ownership Structure',
          description: 'Memorandum of incorporation, shareholders register, share certificates',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'ownership'
        },
        {
          id: 'beneficial_owners_id',
          name: 'Beneficial Owners ID Documents',
          description: 'Valid ID/passport for individuals with ≥25% shareholding or management responsibility',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'authorized_persons_id',
          name: 'Authorized Persons ID Documents',
          description: 'Valid ID/passport for all authorized persons',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'identity'
        },
        {
          id: 'mandate_resolution',
          name: 'Mandate/Company Resolution',
          description: 'Signed authorization for mandated persons (EPP only)',
          required: isEPP,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'authorization'
        },
        {
          id: 'proof_of_income',
          name: 'Proof of Income',
          description: 'Bank statement for the business',
          required: true,
          acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
          category: 'financial'
        }
      ]
    };

    // Additional documents for Financial Institutions
    const financialInstitutionDocs = [
      {
        id: 'aml_policy',
        name: 'Anti-Money Laundering Policy',
        description: 'Current AML policy document',
        required: true,
        acceptedFormats: ['.pdf', '.doc', '.docx'],
        category: 'compliance'
      },
      {
        id: 'anti_bribery_policy',
        name: 'Anti-Bribery and Corruption Policy',
        description: 'Current anti-bribery and corruption policy',
        required: true,
        acceptedFormats: ['.pdf', '.doc', '.docx'],
        category: 'compliance'
      },
      {
        id: 'sanctions_policy',
        name: 'Sanctions Policy',
        description: 'Current sanctions policy document',
        required: true,
        acceptedFormats: ['.pdf', '.doc', '.docx'],
        category: 'compliance'
      },
      {
        id: 'regulatory_license',
        name: 'Regulatory License',
        description: 'Banking, ADLA, Insurance, or other regulatory license',
        required: true,
        acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
        category: 'licensing'
      },
      {
        id: 'wolfsberg_questionnaire',
        name: 'Completed Wolfsberg Questionnaire',
        description: 'Completed and signed Wolfsberg questionnaire',
        required: true,
        acceptedFormats: ['.pdf', '.doc', '.docx'],
        category: 'compliance'
      }
    ];

    return documentRequirements[entityType as keyof typeof documentRequirements] || [];
  },

  // Get additional documents for financial institutions
  getFinancialInstitutionDocuments: () => [
    {
      id: 'aml_policy',
      name: 'Anti-Money Laundering Policy',
      description: 'Current AML policy document',
      required: true,
      acceptedFormats: ['.pdf', '.doc', '.docx'],
      category: 'compliance'
    },
    {
      id: 'anti_bribery_policy',
      name: 'Anti-Bribery and Corruption Policy',
      description: 'Current anti-bribery and corruption policy',
      required: true,
      acceptedFormats: ['.pdf', '.doc', '.docx'],
      category: 'compliance'
    },
    {
      id: 'sanctions_policy',
      name: 'Sanctions Policy',
      description: 'Current sanctions policy document',
      required: true,
      acceptedFormats: ['.pdf', '.doc', '.docx'],
      category: 'compliance'
    },
    {
      id: 'regulatory_license',
      name: 'Regulatory License',
      description: 'Banking, ADLA, Insurance, or other regulatory license',
      required: true,
      acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
      category: 'licensing'
    },
    {
      id: 'wolfsberg_questionnaire',
      name: 'Completed Wolfsberg Questionnaire',
      description: 'Completed and signed Wolfsberg questionnaire',
      required: true,
      acceptedFormats: ['.pdf', '.doc', '.docx'],
      category: 'compliance'
    }
  ]
};

// Risk assessment validation
export const riskAssessmentValidation = {
  calculateRiskScore: (data: any) => {
    let score = 0;
    let maxScore = 0;

    // Country risk (weight: 25%)
    const countryRiskScores = {
      za: 70, uk: 90, us: 95, zw: 40, bw: 60,
    };
    const countryScore = countryRiskScores[data.country as keyof typeof countryRiskScores] || 50;
    score += countryScore * 0.25;
    maxScore += 100 * 0.25;

    // Entity type risk (weight: 20%)
    const entityRiskScores = {
      pty_ltd: 80, publicly_listed: 90, government: 95, npo_ngo: 60, trust: 70,
    };
    const entityScore = entityRiskScores[data.entityType as keyof typeof entityRiskScores] || 50;
    score += entityScore * 0.20;
    maxScore += 100 * 0.20;

    // Volume risk (weight: 30%)
    const volumeRanges = {
      '0-10k': 90, '10k-50k': 80, '50k-100k': 70, '100k-500k': 60, '500k+': 40,
    };
    const volumeScore = volumeRanges[data.expectedVolume as keyof typeof volumeRanges] || 50;
    score += volumeScore * 0.30;
    maxScore += 100 * 0.30;

    // Documentation completeness (weight: 25%)
    const requiredDocs = documentValidation.getRequiredDocuments(data.entityType, data.country);
    const uploadedDocs = data.uploadedDocuments || [];
    const completeness = (uploadedDocs.length / requiredDocs.length) * 100;
    score += completeness * 0.25;
    maxScore += 100 * 0.25;

    return Math.round((score / maxScore) * 100);
  },

  getRiskLevel: (score: number) => {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  },

  getRequiredApprovals: (riskLevel: string, entityType: string) => {
    const approvals = [];

    if (riskLevel === 'high') {
      approvals.push('senior_manager', 'compliance_officer', 'risk_committee');
    } else if (riskLevel === 'medium') {
      approvals.push('senior_manager', 'compliance_officer');
    } else {
      approvals.push('compliance_officer');
    }

    // Additional approvals for specific entity types
    if (entityType === 'government') {
      approvals.push('legal_counsel');
    }

    if (entityType === 'publicly_listed') {
      approvals.push('senior_manager');
    }

    return [...new Set(approvals)]; // Remove duplicates
  },
};

// External API validation helpers
export const externalValidation = {
  validateCompanyRegistration: async (registrationNumber: string, country: string) => {
    // Mock external API call - replace with actual API integration
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation logic
      const pattern = registrationPatterns[country as keyof typeof registrationPatterns];
      if (!pattern || !pattern.test(registrationNumber)) {
        return { valid: false, error: 'Invalid registration number format' };
      }

      // Mock successful validation
      return {
        valid: true,
        data: {
          companyName: 'Example Company Ltd',
          status: 'Active',
          incorporationDate: '2020-01-15',
          directors: ['John Smith', 'Jane Doe'],
        }
      };
    } catch (error) {
      return { valid: false, error: 'Unable to verify registration number' };
    }
  },

  validateTaxNumber: async (taxNumber: string, country: string) => {
    // Mock tax number validation
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const pattern = taxIdPatterns[country as keyof typeof taxIdPatterns];
      if (!pattern || !pattern.test(taxNumber)) {
        return { valid: false, error: 'Invalid tax number format' };
      }

      return {
        valid: true,
        data: {
          status: 'Active',
          registeredName: 'Example Company Ltd',
        }
      };
    } catch (error) {
      return { valid: false, error: 'Unable to verify tax number' };
    }
  },

  validateBankAccount: async (accountNumber: string, bankCode: string, country: string) => {
    // Mock bank account validation
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const pattern = bankAccountPatterns[country as keyof typeof bankAccountPatterns];
      if (!pattern || !pattern.test(accountNumber)) {
        return { valid: false, error: 'Invalid account number format' };
      }

      return {
        valid: true,
        data: {
          accountName: 'Example Company Ltd',
          bankName: 'Example Bank',
          accountType: 'Business',
        }
      };
    } catch (error) {
      return { valid: false, error: 'Unable to verify bank account' };
    }
  },
};

export default {
  entityValidationSchemas,
  commonValidationSchemas,
  documentValidation,
  riskAssessmentValidation,
  externalValidation,
};
