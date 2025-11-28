import { describe, it, expect, vi, beforeEach } from 'vitest';
import { riskApiService } from '../riskApi';
import { getAuthUser } from '@/lib/auth/session';
import { generateUserIdFromEmail } from '@/lib/api';

vi.mock('@/lib/auth/session');
vi.mock('@/lib/api');

global.fetch = vi.fn();

describe('riskApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAuthUser as any).mockReturnValue({ name: 'Test User', email: 'test@example.com' });
    (generateUserIdFromEmail as any).mockReturnValue('test-user-id');
  });

  describe('getRiskAssessment', () => {
    it('should fetch risk assessment', async () => {
      const mockAssessment = {
        id: 'risk-1',
        caseId: 'case-1',
        overallRiskLevel: 'low',
        riskScore: 30,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockAssessment,
      });

      const result = await riskApiService.getRiskAssessment('case-1');

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(riskApiService.getRiskAssessment('case-1')).rejects.toThrow();
    });
  });

  describe('getRiskAssessmentByCase', () => {
    it('should fetch risk assessment by case ID', async () => {
      const mockAssessment = {
        id: 'risk-1',
        caseId: 'case-1',
        overallRiskLevel: 'low',
        riskScore: 30,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockAssessment,
      });

      const result = await riskApiService.getRiskAssessmentByCase('case-1');
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('createRiskAssessment', () => {
    it('should create new risk assessment', async () => {
      const mockAssessment = {
        id: 'risk-1',
        caseId: 'case-1',
        partnerId: 'partner-1',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockAssessment,
      });

      const result = await riskApiService.createRiskAssessment('case-1', 'partner-1');
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('saveRiskAssessmentForm', () => {
    it('should save risk assessment form data', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await riskApiService.saveRiskAssessmentForm('assessment-1', {
        partnerCustomerDetails: 'test',
        mukuruDetails: 'test',
        enhancedDueDiligenceFindings: 'test',
        adverseMediaAssessment: 'test',
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('completeRiskAssessmentWithForm', () => {
    it('should complete risk assessment with form data', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await riskApiService.completeRiskAssessmentWithForm('assessment-1', {
        partnerCustomerDetails: 'test',
        mukuruDetails: 'test',
        enhancedDueDiligenceFindings: 'test',
        adverseMediaAssessment: 'test',
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('parseRiskAssessmentForm', () => {
    it('should parse risk assessment form data', () => {
      const mockAssessment = {
        partnerCustomerDetails: 'test details',
        mukuruDetails: 'test mukuru',
        enhancedDueDiligenceFindings: 'test findings',
        adverseMediaAssessment: 'test assessment',
      };

      const result = riskApiService.parseRiskAssessmentForm(mockAssessment as any);
      expect(result).toBeDefined();
      expect(result?.partnerCustomerDetails).toBe('test details');
    });

    it('should handle missing form data', () => {
      const mockAssessment = {
        id: 'risk-1',
        caseId: 'case-1',
      };

      const result = riskApiService.parseRiskAssessmentForm(mockAssessment as any);
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      await expect(riskApiService.getRiskAssessment('case-1')).rejects.toThrow();
    });

    it('should handle API errors with error message', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: 'Invalid request' }),
      });

      await expect(riskApiService.getRiskAssessment('case-1')).rejects.toThrow('Invalid request');
    });

    it('should handle timeout errors', async () => {
      (global.fetch as any).mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({}),
        }), 20000))
      );

      await expect(riskApiService.getRiskAssessment('case-1')).rejects.toThrow();
    });
  });
});

