import { describe, it, expect } from 'vitest';

/**
 * Test data transformation logic extracted from API routes
 * These are pure functions that can be tested without mocks
 */

/**
 * Transform onboarding API response to projection format
 * This is the actual transformation logic from applications/[id]/route.ts
 */
function transformOnboardingToProjection(onboardingData: unknown, id: string): unknown {
  const data = onboardingData as Record<string, unknown>;
  const applicant =
    (data.applicant as Record<string, unknown> | undefined) ||
    ({} as Record<string, unknown>);
  const business =
    (data.business as Record<string, unknown> | undefined) ||
    ({} as Record<string, unknown>);
  const residentialAddress =
    ((applicant.residential_address || applicant.residentialAddress) as
      | Record<string, unknown>
      | undefined) || undefined;
  const registeredAddress =
    ((business.registered_address || business.registeredAddress) as
      | Record<string, unknown>
      | undefined) || undefined;

  return {
    id: (data.id ? String(data.id) : '') || id,
    caseId:
      (data.case_number ? String(data.case_number) : '') ||
      (data.caseNumber ? String(data.caseNumber) : '') ||
      '',
    type: (data.type ? String(data.type) : '') || '',
    status: (data.status ? String(data.status) : '') || '',
    partnerId:
      (data.partner_id ? String(data.partner_id) : '') ||
      (data.partnerId ? String(data.partnerId) : '') ||
      '',
    partnerName:
      (data.partner_name ? String(data.partner_name) : '') ||
      (data.partnerName ? String(data.partnerName) : '') ||
      '',
    partnerReferenceId:
      (data.partner_reference_id ? String(data.partner_reference_id) : '') ||
      (data.partnerReferenceId ? String(data.partnerReferenceId) : '') ||
      '',
    applicantFirstName:
      (applicant.first_name ? String(applicant.first_name) : '') ||
      (applicant.firstName ? String(applicant.firstName) : '') ||
      '',
    applicantLastName:
      (applicant.last_name ? String(applicant.last_name) : '') ||
      (applicant.lastName ? String(applicant.lastName) : '') ||
      '',
    applicantEmail: (applicant.email ? String(applicant.email) : '') || '',
    applicantPhone:
      (applicant.phone_number ? String(applicant.phone_number) : '') ||
      (applicant.phoneNumber ? String(applicant.phoneNumber) : '') ||
      '',
    applicantDateOfBirth:
      (applicant.date_of_birth ? String(applicant.date_of_birth) : '') ||
      (applicant.dateOfBirth ? String(applicant.dateOfBirth) : ''),
    applicantNationality:
      (applicant.nationality ? String(applicant.nationality) : '') || '',
    applicantAddress:
      (residentialAddress?.street ? String(residentialAddress.street) : '') || '',
    applicantCity:
      (residentialAddress?.city ? String(residentialAddress.city) : '') || '',
    applicantCountry:
      (residentialAddress?.country ? String(residentialAddress.country) : '') || '',
    businessLegalName:
      (business.legal_name ? String(business.legal_name) : '') ||
      (business.legalName ? String(business.legalName) : '') ||
      '',
    businessRegistrationNumber:
      (business.registration_number ? String(business.registration_number) : '') ||
      (business.registrationNumber ? String(business.registrationNumber) : '') ||
      '',
    businessTaxId:
      (business.tax_id ? String(business.tax_id) : '') ||
      (business.taxId ? String(business.taxId) : '') ||
      '',
    businessCountryOfRegistration:
      (business.country_of_registration
        ? String(business.country_of_registration)
        : '') ||
      (business.countryOfRegistration ? String(business.countryOfRegistration) : '') ||
      '',
    businessAddress:
      (registeredAddress?.street ? String(registeredAddress.street) : '') || '',
    businessCity: (registeredAddress?.city ? String(registeredAddress.city) : '') || '',
    businessIndustry: (business.industry ? String(business.industry) : '') || '',
    businessNumberOfEmployees:
      (business.number_of_employees ? Number(business.number_of_employees) : undefined) ||
      (business.numberOfEmployees ? Number(business.numberOfEmployees) : undefined),
    businessAnnualRevenue:
      (business.annual_revenue ? Number(business.annual_revenue) : undefined) ||
      (business.annualRevenue ? Number(business.annualRevenue) : undefined),
    businessWebsite: (business.website ? String(business.website) : '') || '',
    createdAt:
      (data.created_at ? String(data.created_at) : '') ||
      (data.createdAt ? String(data.createdAt) : '') ||
      new Date().toISOString(),
    updatedAt:
      (data.updated_at ? String(data.updated_at) : '') ||
      (data.updatedAt ? String(data.updatedAt) : '') ||
      new Date().toISOString(),
    progressPercentage: 0,
    totalSteps: 0,
    completedSteps: 0,
    checklistStatus: '',
    checklistCompletionPercentage: 0,
    checklistTotalItems: 0,
    checklistCompletedItems: 0,
    checklistRequiredItems: 0,
    checklistCompletedRequiredItems: 0,
    riskLevel: 'Medium',
    riskScore: 0,
    riskStatus: '',
    riskFactorCount: 0,
    documentCount: 0,
    verifiedDocumentCount: 0,
    pendingDocumentCount: 0,
    rejectedDocumentCount: 0,
    requiresManualReview: false,
    hasComplianceIssues: false,
    metadataJson: JSON.stringify((data.metadata as Record<string, unknown>) || {}),
  };
}

describe('Application Data Transformation', () => {
  describe('transformOnboardingToProjection', () => {
    it('should transform snake_case onboarding data to projection format', () => {
      const onboardingData = {
        id: 'guid-123',
        case_number: 'OBC-20241106-88902',
        status: 'InProgress',
        type: 'Business',
        partner_id: 'partner-1',
        partner_name: 'Partner 1',
        applicant: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '+1234567890',
          residential_address: {
            street: '123 Main St',
            city: 'New York',
            country: 'US',
          },
        },
        business: {
          legal_name: 'Test Corp',
          registration_number: 'REG-123',
          tax_id: 'TAX-123',
          country_of_registration: 'US',
          registered_address: {
            street: '456 Business Ave',
            city: 'Boston',
          },
          industry: 'Technology',
          number_of_employees: 100,
          annual_revenue: 1000000,
          website: 'https://test.com',
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        metadata: { key: 'value' },
      };

      const result = transformOnboardingToProjection(
        onboardingData,
        'guid-123'
      ) as Record<string, unknown>;

      expect(result.id).toBe('guid-123');
      expect(result.caseId).toBe('OBC-20241106-88902');
      expect(result.applicantFirstName).toBe('John');
      expect(result.applicantLastName).toBe('Doe');
      expect(result.businessLegalName).toBe('Test Corp');
      expect(result.metadataJson).toBe(JSON.stringify({ key: 'value' }));
    });

    it('should transform camelCase onboarding data to projection format', () => {
      const onboardingData = {
        id: 'guid-123',
        caseNumber: 'OBC-20241106-88902',
        status: 'InProgress',
        type: 'Business',
        partnerId: 'partner-1',
        partnerName: 'Partner 1',
        applicant: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phoneNumber: '+1234567890',
          residentialAddress: {
            street: '789 Oak St',
            city: 'Los Angeles',
            country: 'US',
          },
        },
        business: {
          legalName: 'Test Corp 2',
          registrationNumber: 'REG-456',
          taxId: 'TAX-456',
          countryOfRegistration: 'CA',
          registeredAddress: {
            street: '321 Pine St',
            city: 'Toronto',
          },
          industry: 'Finance',
          numberOfEmployees: 200,
          annualRevenue: 2000000,
          website: 'https://test2.com',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        metadata: { key2: 'value2' },
      };

      const result = transformOnboardingToProjection(
        onboardingData,
        'guid-123'
      ) as Record<string, unknown>;

      expect(result.caseId).toBe('OBC-20241106-88902');
      expect(result.applicantFirstName).toBe('Jane');
      expect(result.applicantLastName).toBe('Smith');
      expect(result.businessLegalName).toBe('Test Corp 2');
      expect(result.businessCountryOfRegistration).toBe('CA');
    });

    it('should handle missing optional fields', () => {
      const onboardingData = {
        id: 'guid-123',
        status: 'Draft',
      };

      const result = transformOnboardingToProjection(
        onboardingData,
        'guid-123'
      ) as Record<string, unknown>;

      expect(result.id).toBe('guid-123');
      expect(result.caseId).toBe('');
      expect(result.applicantFirstName).toBe('');
      expect(result.businessLegalName).toBe('');
      expect(result.progressPercentage).toBe(0);
      expect(result.riskLevel).toBe('Medium');
    });

    it('should use provided id when onboardingData.id is missing', () => {
      const onboardingData = {
        status: 'InProgress',
      };

      const result = transformOnboardingToProjection(
        onboardingData,
        'provided-id'
      ) as Record<string, unknown>;

      expect(result.id).toBe('provided-id');
    });

    it('should handle nested optional fields', () => {
      const onboardingData = {
        id: 'guid-123',
        applicant: {},
        business: {},
      };

      const result = transformOnboardingToProjection(
        onboardingData,
        'guid-123'
      ) as Record<string, unknown>;

      expect(result.applicantFirstName).toBe('');
      expect(result.applicantEmail).toBe('');
      expect(result.businessLegalName).toBe('');
      expect(result.businessAddress).toBe('');
    });

    it('should handle metadata transformation', () => {
      const onboardingData = {
        id: 'guid-123',
        metadata: { complex: { nested: { data: 'value' } } },
      };

      const result = transformOnboardingToProjection(
        onboardingData,
        'guid-123'
      ) as Record<string, unknown>;

      expect(result.metadataJson).toBe(
        JSON.stringify({ complex: { nested: { data: 'value' } } })
      );
    });

    it('should handle empty metadata', () => {
      const onboardingData = {
        id: 'guid-123',
        metadata: {},
      };

      const result = transformOnboardingToProjection(
        onboardingData,
        'guid-123'
      ) as Record<string, unknown>;

      expect(result.metadataJson).toBe('{}');
    });

    it('should handle missing metadata', () => {
      const onboardingData = {
        id: 'guid-123',
      };

      const result = transformOnboardingToProjection(
        onboardingData,
        'guid-123'
      ) as Record<string, unknown>;

      expect(result.metadataJson).toBe('{}');
    });

    it('should set default values for missing fields', () => {
      const onboardingData = {
        id: 'guid-123',
      };

      const result = transformOnboardingToProjection(
        onboardingData,
        'guid-123'
      ) as Record<string, unknown>;

      expect(result.progressPercentage).toBe(0);
      expect(result.totalSteps).toBe(0);
      expect(result.completedSteps).toBe(0);
      expect(result.checklistStatus).toBe('');
      expect(result.riskLevel).toBe('Medium');
      expect(result.riskScore).toBe(0);
      expect(result.requiresManualReview).toBe(false);
      expect(result.hasComplianceIssues).toBe(false);
    });

    it('should use current timestamp for missing dates', () => {
      const beforeTimestamp = new Date().toISOString();
      const onboardingData = {
        id: 'guid-123',
      };

      const result = transformOnboardingToProjection(
        onboardingData,
        'guid-123'
      ) as Record<string, unknown>;
      const afterTimestamp = new Date().toISOString();

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      const createdAt = result.createdAt as string;
      expect(typeof createdAt === 'string' && createdAt >= beforeTimestamp).toBe(true);
      expect(typeof createdAt === 'string' && createdAt <= afterTimestamp).toBe(true);
    });
  });
});
