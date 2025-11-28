import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchApplications,
  fetchApplicationById,
  updateApplicationStatusUseCase,
  fetchApplicationWithDetails,
  exportApplications,
} from '../applicationUseCases';
import * as applicationsApi from '../../api/applicationsApi';
import * as applicationMapper from '../../mappers/applicationMapper';
import { OnboardingCaseProjection, Application, PagedResult } from '../../dtos/application.dto';

// Mock dependencies
vi.mock('../../api/applicationsApi');
vi.mock('../../mappers/applicationMapper');
vi.mock('../../utils/csvExport', () => ({
  escapeCsvField: (field: string) => field,
  createCsvBlob: (headers: string[], rows: string[][]) => new Blob([headers.join(','), ...rows.map(r => r.join(','))], { type: 'text/csv' }),
}));

// Helper function to create a complete OnboardingCaseProjection mock
function createMockProjection(overrides: Partial<OnboardingCaseProjection> = {}): OnboardingCaseProjection {
  return {
    id: '1',
    caseId: '1',
    type: 'Business',
    status: 'InProgress',
    partnerId: 'partner-1',
    partnerName: 'Partner 1',
    partnerReferenceId: 'ref-1',
    applicantFirstName: 'John',
    applicantLastName: 'Doe',
    applicantEmail: 'john@example.com',
    applicantPhone: '+1234567890',
    applicantDateOfBirth: '1990-01-01',
    applicantNationality: 'US',
    applicantAddress: '123 Main St',
    applicantCity: 'New York',
    applicantCountry: 'US',
    progressPercentage: 50,
    totalSteps: 10,
    completedSteps: 5,
    checklistId: 'checklist-1',
    checklistStatus: 'InProgress',
    checklistCompletionPercentage: 50,
    checklistTotalItems: 10,
    checklistCompletedItems: 5,
    checklistRequiredItems: 5,
    checklistCompletedRequiredItems: 3,
    riskAssessmentId: 'risk-1',
    riskLevel: 'Medium',
    riskScore: 50,
    riskStatus: 'Medium',
    riskFactorCount: 2,
    documentCount: 5,
    verifiedDocumentCount: 3,
    pendingDocumentCount: 2,
    rejectedDocumentCount: 0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    submittedAt: '2024-01-01',
    approvedAt: undefined,
    rejectedAt: undefined,
    assignedTo: 'user-1',
    assignedToName: 'User1',
    assignedAt: '2024-01-01',
    requiresManualReview: false,
    hasComplianceIssues: false,
    complianceNotes: undefined,
    metadataJson: '{}',
    businessLegalName: 'Test Corp',
    businessRegistrationNumber: 'REG-12345',
    businessTaxId: 'TAX-123',
    businessCountryOfRegistration: 'US',
    businessAddress: '123 Business St',
    businessCity: 'New York',
    businessIndustry: 'Technology',
    businessNumberOfEmployees: 100,
    businessAnnualRevenue: 1000000,
    businessWebsite: 'https://test.com',
    ...overrides,
  };
}

describe('Application Use Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchApplications', () => {
    it('should fetch applications with default pagination', async () => {
      const mockProjections: OnboardingCaseProjection[] = [
        createMockProjection({
          caseId: '1',
          status: 'InProgress',
          riskLevel: 'Medium',
          businessLegalName: 'Test Corp',
          applicantFirstName: 'John',
          applicantLastName: 'Doe',
          businessCountryOfRegistration: 'US',
          type: 'Business',
          assignedToName: 'User1',
          submittedAt: '2024-01-01',
          createdAt: '2024-01-01',
          progressPercentage: 50,
        }),
      ];
      const mockBackendResult: PagedResult<OnboardingCaseProjection> = {
        items: mockProjections,
        totalCount: 1,
        page: 1,
        pageSize: 20,
      };
      const mockApplications: Application[] = [
        {
          id: '1',
          companyName: 'Test Corp',
          entityType: 'Business',
          status: 'IN_PROGRESS',
          submittedDate: '2024-01-01',
          assignedTo: 'User1',
          riskLevel: 'MEDIUM',
          country: 'US',
          progress: 50,
        },
      ];

      vi.mocked(applicationsApi.getApplications).mockResolvedValue(mockBackendResult);
      vi.mocked(applicationMapper.mapProjectionsToApplications).mockReturnValue(mockApplications);

      const result = await fetchApplications();

      expect(applicationsApi.getApplications).toHaveBeenCalledWith(1, 20, undefined, undefined);
      expect(applicationMapper.mapProjectionsToApplications).toHaveBeenCalledWith(mockProjections);
      expect(result).toEqual({
        items: mockApplications,
        totalCount: 1,
        page: 1,
        pageSize: 20,
      });
    });

    it('should fetch applications with custom pagination and filters', async () => {
      const mockBackendResult: PagedResult<OnboardingCaseProjection> = {
        items: [],
        totalCount: 0,
        page: 2,
        pageSize: 10,
      };
      const mockApplications: Application[] = [];

      vi.mocked(applicationsApi.getApplications).mockResolvedValue(mockBackendResult);
      vi.mocked(applicationMapper.mapProjectionsToApplications).mockReturnValue(mockApplications);

      const result = await fetchApplications(2, 10, 'test', 'SUBMITTED');

      expect(applicationsApi.getApplications).toHaveBeenCalledWith(2, 10, 'test', 'SUBMITTED');
      expect(result).toEqual({
        items: mockApplications,
        totalCount: 0,
        page: 2,
        pageSize: 10,
      });
    });
  });

  describe('fetchApplicationById', () => {
    it('should fetch and map application by ID', async () => {
      const mockProjection: OnboardingCaseProjection = createMockProjection({
        id: '1',
        caseId: '1',
        status: 'InProgress',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        applicantFirstName: 'John',
        applicantLastName: 'Doe',
        applicantEmail: 'john@example.com',
        applicantPhone: '+1234567890',
        applicantNationality: 'US',
        applicantAddress: '123 Main St',
        applicantCity: 'New York',
        applicantCountry: 'US',
        businessCountryOfRegistration: 'US',
        type: 'Business',
        partnerId: 'partner-1',
        partnerName: 'Partner 1',
        partnerReferenceId: 'ref-1',
        assignedToName: 'User1',
        submittedAt: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        progressPercentage: 50,
        totalSteps: 10,
        completedSteps: 5,
        checklistStatus: 'InProgress',
        checklistCompletionPercentage: 50,
        checklistTotalItems: 10,
        checklistCompletedItems: 5,
        checklistRequiredItems: 5,
        checklistCompletedRequiredItems: 3,
        riskScore: 50,
        riskStatus: 'Medium',
        riskFactorCount: 2,
        documentCount: 5,
        verifiedDocumentCount: 3,
        pendingDocumentCount: 2,
        rejectedDocumentCount: 0,
      });
      const mockApplication: Application = {
        id: '1',
        companyName: 'Test Corp',
        entityType: 'Business',
        status: 'IN_PROGRESS',
        submittedDate: '2024-01-01',
        assignedTo: 'User1',
        riskLevel: 'MEDIUM',
        country: 'US',
        progress: 50,
      };

      vi.mocked(applicationsApi.getApplicationById).mockResolvedValue(mockProjection);
      vi.mocked(applicationMapper.mapProjectionToApplication).mockReturnValue(mockApplication);

      const result = await fetchApplicationById('1');

      expect(applicationsApi.getApplicationById).toHaveBeenCalledWith('1');
      expect(applicationMapper.mapProjectionToApplication).toHaveBeenCalledWith(mockProjection);
      expect(result).toEqual(mockApplication);
    });
  });

  describe('updateApplicationStatusUseCase', () => {
    it('should update application status with valid status', async () => {
      vi.mocked(applicationsApi.updateApplicationStatus).mockResolvedValue(undefined);

      await updateApplicationStatusUseCase('1', 'COMPLETE', 'Notes');

      expect(applicationsApi.updateApplicationStatus).toHaveBeenCalledWith('1', 'COMPLETE', 'Notes');
    });

    it('should throw error for invalid status', async () => {
      await expect(updateApplicationStatusUseCase('1', 'INVALID_STATUS')).rejects.toThrow(
        'Invalid status: INVALID_STATUS. Must be one of: SUBMITTED, IN_PROGRESS, RISK_REVIEW, COMPLETE, DECLINED'
      );
      expect(applicationsApi.updateApplicationStatus).not.toHaveBeenCalled();
    });

    it('should accept all valid statuses', async () => {
      const validStatuses = ['SUBMITTED', 'IN_PROGRESS', 'RISK_REVIEW', 'COMPLETE', 'DECLINED'];
      
      for (const status of validStatuses) {
        vi.mocked(applicationsApi.updateApplicationStatus).mockResolvedValue(undefined);
        await updateApplicationStatusUseCase('1', status);
        expect(applicationsApi.updateApplicationStatus).toHaveBeenCalledWith('1', status, undefined);
      }
    });
  });

  describe('fetchApplicationWithDetails', () => {
    it('should fetch application with both mapped and raw projection', async () => {
      const mockProjection: OnboardingCaseProjection = createMockProjection({
        id: '1',
        caseId: '1',
        status: 'InProgress',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        applicantFirstName: 'John',
        applicantLastName: 'Doe',
        applicantEmail: 'john@example.com',
        applicantPhone: '+1234567890',
        applicantNationality: 'US',
        applicantAddress: '123 Main St',
        applicantCity: 'New York',
        applicantCountry: 'US',
        businessCountryOfRegistration: 'US',
        type: 'Business',
        partnerId: 'partner-1',
        partnerName: 'Partner 1',
        partnerReferenceId: 'ref-1',
        assignedToName: 'User1',
        submittedAt: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        progressPercentage: 50,
        totalSteps: 10,
        completedSteps: 5,
        checklistStatus: 'InProgress',
        checklistCompletionPercentage: 50,
        checklistTotalItems: 10,
        checklistCompletedItems: 5,
        checklistRequiredItems: 5,
        checklistCompletedRequiredItems: 3,
        riskScore: 50,
        riskStatus: 'Medium',
        riskFactorCount: 2,
        documentCount: 5,
        verifiedDocumentCount: 3,
        pendingDocumentCount: 2,
        rejectedDocumentCount: 0,
      });
      const mockApplication: Application = {
        id: '1',
        companyName: 'Test Corp',
        entityType: 'Business',
        status: 'IN_PROGRESS',
        submittedDate: '2024-01-01',
        assignedTo: 'User1',
        riskLevel: 'MEDIUM',
        country: 'US',
        progress: 50,
      };

      vi.mocked(applicationsApi.getApplicationById).mockResolvedValue(mockProjection);
      vi.mocked(applicationMapper.mapProjectionToApplication).mockReturnValue(mockApplication);

      const result = await fetchApplicationWithDetails('1');

      expect(result).toEqual({
        application: mockApplication,
        projection: mockProjection,
      });
    });
  });

  describe('exportApplications', () => {
    it('should export applications as CSV blob', async () => {
      const mockProjections: OnboardingCaseProjection[] = [
        createMockProjection({
          caseId: '1',
          status: 'InProgress',
          riskLevel: 'Medium',
          businessLegalName: 'Test Corp',
          applicantFirstName: 'John',
          applicantLastName: 'Doe',
          businessCountryOfRegistration: 'US',
          type: 'Business',
          assignedToName: 'User1',
          submittedAt: '2024-01-01',
          createdAt: '2024-01-01',
          progressPercentage: 50,
        }),
      ];
      const mockBackendResult: PagedResult<OnboardingCaseProjection> = {
        items: mockProjections,
        totalCount: 1,
        page: 1,
        pageSize: 10000,
      };
      const mockApplications: Application[] = [
        {
          id: '1',
          companyName: 'Test Corp',
          entityType: 'Business',
          status: 'IN_PROGRESS',
          submittedDate: '2024-01-01',
          assignedTo: 'User1',
          riskLevel: 'MEDIUM',
          country: 'US',
          progress: 50,
        },
      ];

      vi.mocked(applicationsApi.getApplications).mockResolvedValue(mockBackendResult);
      vi.mocked(applicationMapper.mapProjectionsToApplications).mockReturnValue(mockApplications);

      const result = await exportApplications();

      expect(applicationsApi.getApplications).toHaveBeenCalledWith(1, 10000, undefined, undefined);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/csv');
    });

    it('should export applications with filters', async () => {
      const mockBackendResult: PagedResult<OnboardingCaseProjection> = {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 10000,
      };

      vi.mocked(applicationsApi.getApplications).mockResolvedValue(mockBackendResult);
      vi.mocked(applicationMapper.mapProjectionsToApplications).mockReturnValue([]);

      const result = await exportApplications({
        status: 'SUBMITTED',
        search: 'test',
        riskLevel: 'HIGH',
      });

      expect(applicationsApi.getApplications).toHaveBeenCalledWith(1, 10000, 'test', 'SUBMITTED');
      expect(result).toBeInstanceOf(Blob);
    });
  });
});

