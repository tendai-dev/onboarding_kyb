import { describe, it, expect } from 'vitest';
import { mapProjectionToApplication, mapProjectionsToApplications } from '../applicationMapper';
import { OnboardingCaseProjection, Application } from '../../dtos/application.dto';

describe('Application Mapper', () => {
  describe('mapProjectionToApplication', () => {
    it('should map complete projection to application', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        caseId: 'case-123',
        id: 'id-123',
        status: 'InProgress',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        applicantFirstName: 'John',
        applicantLastName: 'Doe',
        businessCountryOfRegistration: 'US',
        applicantCountry: 'CA',
        type: 'Business',
        assignedToName: 'User1',
        assignedTo: 'user-1',
        submittedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        progressPercentage: 75,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result).toEqual({
        id: 'case-123',
        companyName: 'Test Corp',
        entityType: 'Business',
        status: 'IN_PROGRESS',
        submittedDate: '2024-01-01T00:00:00Z',
        assignedTo: 'User1',
        riskLevel: 'MEDIUM',
        country: 'US',
        progress: 75,
      });
    });

    it('should use applicant name when business legal name is missing', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        caseId: 'case-123',
        status: 'Draft',
        riskLevel: 'Low',
        applicantFirstName: 'Jane',
        applicantLastName: 'Smith',
        applicantCountry: 'CA',
        type: 'Individual',
        createdAt: '2024-01-01T00:00:00Z',
        progressPercentage: 25,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result.companyName).toBe('Jane Smith');
      expect(result.country).toBe('CA');
    });

    it('should use applicant country when business country is missing', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        caseId: 'case-123',
        status: 'Submitted',
        riskLevel: 'High',
        businessLegalName: 'Test Corp',
        applicantCountry: 'UK',
        type: 'Business',
        createdAt: '2024-01-01T00:00:00Z',
        progressPercentage: 50,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result.country).toBe('UK');
    });

    it('should use assignedToName over assignedTo', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        caseId: 'case-123',
        status: 'InProgress',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        assignedToName: 'John Doe',
        assignedTo: 'user-123',
        type: 'Business',
        createdAt: '2024-01-01T00:00:00Z',
        progressPercentage: 50,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result.assignedTo).toBe('John Doe');
    });

    it('should use assignedTo when assignedToName is missing', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        caseId: 'case-123',
        status: 'InProgress',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        assignedTo: 'user-123',
        type: 'Business',
        createdAt: '2024-01-01T00:00:00Z',
        progressPercentage: 50,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result.assignedTo).toBe('user-123');
    });

    it('should use submittedAt over createdAt', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        caseId: 'case-123',
        status: 'Submitted',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        submittedAt: '2024-01-02T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        type: 'Business',
        progressPercentage: 50,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result.submittedDate).toBe('2024-01-02T00:00:00Z');
    });

    it('should use createdAt when submittedAt is missing', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        caseId: 'case-123',
        status: 'Draft',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        createdAt: '2024-01-01T00:00:00Z',
        type: 'Business',
        progressPercentage: 50,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result.submittedDate).toBe('2024-01-01T00:00:00Z');
    });

    it('should round progress percentage', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        caseId: 'case-123',
        status: 'InProgress',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        type: 'Business',
        createdAt: '2024-01-01T00:00:00Z',
        progressPercentage: 75.7,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result.progress).toBe(76);
    });

    it('should map backend status to frontend status correctly', () => {
      const statusMap = [
        { backend: 'Draft', frontend: 'IN_PROGRESS' },
        { backend: 'InProgress', frontend: 'IN_PROGRESS' },
        { backend: 'PendingReview', frontend: 'RISK_REVIEW' },
        { backend: 'Submitted', frontend: 'SUBMITTED' },
        { backend: 'Approved', frontend: 'COMPLETE' },
        { backend: 'Rejected', frontend: 'DECLINED' },
        { backend: 'Cancelled', frontend: 'DECLINED' },
      ];

      statusMap.forEach(({ backend, frontend }) => {
        const projection: Partial<OnboardingCaseProjection> = {
          caseId: 'case-123',
          status: backend,
          riskLevel: 'Medium',
          businessLegalName: 'Test Corp',
          type: 'Business',
          createdAt: '2024-01-01T00:00:00Z',
          progressPercentage: 50,
        };

        const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

        expect(result.status).toBe(frontend);
      });
    });

    it('should map backend risk level to frontend risk level correctly', () => {
      const riskMap = [
        { backend: 'Low', frontend: 'LOW' },
        { backend: 'MediumLow', frontend: 'LOW' },
        { backend: 'Medium', frontend: 'MEDIUM' },
        { backend: 'MediumHigh', frontend: 'HIGH' },
        { backend: 'High', frontend: 'HIGH' },
      ];

      riskMap.forEach(({ backend, frontend }) => {
        const projection: Partial<OnboardingCaseProjection> = {
          caseId: 'case-123',
          status: 'InProgress',
          riskLevel: backend,
          businessLegalName: 'Test Corp',
          type: 'Business',
          createdAt: '2024-01-01T00:00:00Z',
          progressPercentage: 50,
        };

        const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

        expect(result.riskLevel).toBe(frontend);
      });
    });

    it('should use caseId over id', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        caseId: 'case-123',
        id: 'id-456',
        status: 'InProgress',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        type: 'Business',
        createdAt: '2024-01-01T00:00:00Z',
        progressPercentage: 50,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result.id).toBe('case-123');
    });

    it('should handle missing optional fields gracefully', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        id: 'case-123',
        caseId: 'case-123',
        status: 'InProgress',
        riskLevel: 'Medium',
        type: 'Business',
        partnerId: 'partner-1',
        partnerName: 'Partner 1',
        partnerReferenceId: 'ref-1',
        applicantFirstName: '',
        applicantLastName: '',
        applicantEmail: 'test@example.com',
        applicantPhone: '+1234567890',
        applicantNationality: 'US',
        applicantAddress: '123 Main St',
        applicantCity: 'New York',
        applicantCountry: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        progressPercentage: 0,
        totalSteps: 10,
        completedSteps: 0,
        checklistStatus: 'InProgress',
        checklistCompletionPercentage: 0,
        checklistTotalItems: 10,
        checklistCompletedItems: 0,
        checklistRequiredItems: 5,
        checklistCompletedRequiredItems: 0,
        riskScore: 50,
        riskStatus: 'Medium',
        riskFactorCount: 0,
        documentCount: 0,
        verifiedDocumentCount: 0,
        pendingDocumentCount: 0,
        rejectedDocumentCount: 0,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result.companyName).toBe('Unknown');
      expect(result.country).toBe('Unknown');
      expect(result.assignedTo).toBe('Unassigned');
      expect(result.progress).toBe(0);
    });
  });

  describe('mapProjectionsToApplications', () => {
    it('should map array of projections to applications', () => {
      const projections: Partial<OnboardingCaseProjection>[] = [
        {
          caseId: 'case-1',
          status: 'InProgress',
          riskLevel: 'Medium',
          businessLegalName: 'Corp 1',
          type: 'Business',
          createdAt: '2024-01-01T00:00:00Z',
          progressPercentage: 50,
        },
        {
          caseId: 'case-2',
          status: 'Submitted',
          riskLevel: 'High',
          businessLegalName: 'Corp 2',
          type: 'Business',
          createdAt: '2024-01-02T00:00:00Z',
          progressPercentage: 75,
        },
      ];

      const result = mapProjectionsToApplications(projections as OnboardingCaseProjection[]);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('case-1');
      expect(result[0].status).toBe('IN_PROGRESS');
      expect(result[1].id).toBe('case-2');
      expect(result[1].status).toBe('SUBMITTED');
    });

    it('should handle empty array', () => {
      const result = mapProjectionsToApplications([]);

      expect(result).toEqual([]);
    });

    it('should handle large array of projections', () => {
      const projections: Partial<OnboardingCaseProjection>[] = Array.from({ length: 100 }, (_, i) => ({
        caseId: `case-${i}`,
        status: 'InProgress',
        riskLevel: 'Medium',
        businessLegalName: `Corp ${i}`,
        type: 'Business',
        createdAt: '2024-01-01T00:00:00Z',
        progressPercentage: 50,
      }));

      const result = mapProjectionsToApplications(projections as OnboardingCaseProjection[]);

      expect(result).toHaveLength(100);
      expect(result[0].id).toBe('case-0');
      expect(result[99].id).toBe('case-99');
    });

    it('should handle mixed entity types', () => {
      const projections: Partial<OnboardingCaseProjection>[] = [
        {
          caseId: 'case-1',
          status: 'InProgress',
          riskLevel: 'Medium',
          businessLegalName: 'Business Corp',
          type: 'Business',
          createdAt: '2024-01-01T00:00:00Z',
          progressPercentage: 50,
        },
        {
          caseId: 'case-2',
          status: 'Submitted',
          riskLevel: 'Low',
          applicantFirstName: 'John',
          applicantLastName: 'Doe',
          type: 'Individual',
          createdAt: '2024-01-02T00:00:00Z',
          progressPercentage: 75,
        },
      ];

      const result = mapProjectionsToApplications(projections as OnboardingCaseProjection[]);

      expect(result).toHaveLength(2);
      expect(result[0].entityType).toBe('Business');
      expect(result[1].entityType).toBe('Individual');
    });

    it('should handle all status mappings', () => {
      const statuses = ['Draft', 'InProgress', 'PendingReview', 'Submitted', 'Approved', 'Rejected', 'Cancelled'];
      
      statuses.forEach((status) => {
        const projection: Partial<OnboardingCaseProjection> = {
          caseId: 'case-123',
          status: status as any,
          riskLevel: 'Medium',
          businessLegalName: 'Test Corp',
          type: 'Business',
          createdAt: '2024-01-01T00:00:00Z',
          progressPercentage: 50,
        };

        const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

        expect(result.status).toBeDefined();
        expect(typeof result.status).toBe('string');
      });
    });

    it('should handle all risk level mappings', () => {
      const riskLevels = ['Low', 'MediumLow', 'Medium', 'MediumHigh', 'High'];
      
      riskLevels.forEach((riskLevel) => {
        const projection: Partial<OnboardingCaseProjection> = {
          caseId: 'case-123',
          status: 'InProgress',
          riskLevel: riskLevel as any,
          businessLegalName: 'Test Corp',
          type: 'Business',
          createdAt: '2024-01-01T00:00:00Z',
          progressPercentage: 50,
        };

        const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

        expect(result.riskLevel).toBeDefined();
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.riskLevel);
      });
    });

    it('should handle progress percentage edge cases', () => {
      const edgeCases = [0, 50, 100, 50.4, 50.5, 50.6, 99.9, 100.1];
      
      edgeCases.forEach((progress) => {
        const projection: Partial<OnboardingCaseProjection> = {
          caseId: 'case-123',
          status: 'InProgress',
          riskLevel: 'Medium',
          businessLegalName: 'Test Corp',
          type: 'Business',
          createdAt: '2024-01-01T00:00:00Z',
          progressPercentage: progress,
        };

        const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

        expect(result.progress).toBeGreaterThanOrEqual(0);
        expect(result.progress).toBeLessThanOrEqual(100);
        expect(Number.isInteger(result.progress)).toBe(true);
      });
    });

    it('should handle missing dates gracefully', () => {
      const projection: Partial<OnboardingCaseProjection> = {
        caseId: 'case-123',
        status: 'Draft',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        type: 'Business',
        createdAt: '',
        progressPercentage: 50,
      };

      const result = mapProjectionToApplication(projection as OnboardingCaseProjection);

      expect(result.submittedDate).toBeDefined();
    });
  });
});

