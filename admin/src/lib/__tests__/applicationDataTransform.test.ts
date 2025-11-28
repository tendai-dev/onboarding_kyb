import { describe, it, expect } from 'vitest';

/**
 * Test data transformation logic extracted from API routes
 * These are pure functions that can be tested without mocks
 */

/**
 * Transform onboarding API response to projection format
 * This is the actual transformation logic from applications/[id]/route.ts
 */
function transformOnboardingToProjection(onboardingData: any, id: string): any {
  return {
    id: onboardingData.id || id,
    caseId: onboardingData.case_number || onboardingData.caseNumber || '',
    type: onboardingData.type || '',
    status: onboardingData.status || '',
    partnerId: onboardingData.partner_id || onboardingData.partnerId || '',
    partnerName: onboardingData.partner_name || onboardingData.partnerName || '',
    partnerReferenceId: onboardingData.partner_reference_id || onboardingData.partnerReferenceId || '',
    applicantFirstName: onboardingData.applicant?.first_name || onboardingData.applicant?.firstName || '',
    applicantLastName: onboardingData.applicant?.last_name || onboardingData.applicant?.lastName || '',
    applicantEmail: onboardingData.applicant?.email || '',
    applicantPhone: onboardingData.applicant?.phone_number || onboardingData.applicant?.phoneNumber || '',
    applicantDateOfBirth: onboardingData.applicant?.date_of_birth || onboardingData.applicant?.dateOfBirth,
    applicantNationality: onboardingData.applicant?.nationality || '',
    applicantAddress: onboardingData.applicant?.residential_address?.street || onboardingData.applicant?.residentialAddress?.street || '',
    applicantCity: onboardingData.applicant?.residential_address?.city || onboardingData.applicant?.residentialAddress?.city || '',
    applicantCountry: onboardingData.applicant?.residential_address?.country || onboardingData.applicant?.residentialAddress?.country || '',
    businessLegalName: onboardingData.business?.legal_name || onboardingData.business?.legalName || '',
    businessRegistrationNumber: onboardingData.business?.registration_number || onboardingData.business?.registrationNumber || '',
    businessTaxId: onboardingData.business?.tax_id || onboardingData.business?.taxId || '',
    businessCountryOfRegistration: onboardingData.business?.country_of_registration || onboardingData.business?.countryOfRegistration || '',
    businessAddress: onboardingData.business?.registered_address?.street || onboardingData.business?.registeredAddress?.street || '',
    businessCity: onboardingData.business?.registered_address?.city || onboardingData.business?.registeredAddress?.city || '',
    businessIndustry: onboardingData.business?.industry || '',
    businessNumberOfEmployees: onboardingData.business?.number_of_employees || onboardingData.business?.numberOfEmployees,
    businessAnnualRevenue: onboardingData.business?.annual_revenue || onboardingData.business?.annualRevenue,
    businessWebsite: onboardingData.business?.website || '',
    createdAt: onboardingData.created_at || onboardingData.createdAt || new Date().toISOString(),
    updatedAt: onboardingData.updated_at || onboardingData.updatedAt || new Date().toISOString(),
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
    metadataJson: JSON.stringify(onboardingData.metadata || {}),
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

      const result = transformOnboardingToProjection(onboardingData, 'guid-123');

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

      const result = transformOnboardingToProjection(onboardingData, 'guid-123');

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

      const result = transformOnboardingToProjection(onboardingData, 'guid-123');

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

      const result = transformOnboardingToProjection(onboardingData, 'provided-id');

      expect(result.id).toBe('provided-id');
    });

    it('should handle nested optional fields', () => {
      const onboardingData = {
        id: 'guid-123',
        applicant: {},
        business: {},
      };

      const result = transformOnboardingToProjection(onboardingData, 'guid-123');

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

      const result = transformOnboardingToProjection(onboardingData, 'guid-123');

      expect(result.metadataJson).toBe(JSON.stringify({ complex: { nested: { data: 'value' } } }));
    });

    it('should handle empty metadata', () => {
      const onboardingData = {
        id: 'guid-123',
        metadata: {},
      };

      const result = transformOnboardingToProjection(onboardingData, 'guid-123');

      expect(result.metadataJson).toBe('{}');
    });

    it('should handle missing metadata', () => {
      const onboardingData = {
        id: 'guid-123',
      };

      const result = transformOnboardingToProjection(onboardingData, 'guid-123');

      expect(result.metadataJson).toBe('{}');
    });

    it('should set default values for missing fields', () => {
      const onboardingData = {
        id: 'guid-123',
      };

      const result = transformOnboardingToProjection(onboardingData, 'guid-123');

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
      const onboardingData = {
        id: 'guid-123',
      };

      const before = new Date().toISOString();
      const result = transformOnboardingToProjection(onboardingData, 'guid-123');
      const after = new Date().toISOString();

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.createdAt >= before).toBe(true);
      expect(result.createdAt <= after).toBe(true);
    });
  });
});

