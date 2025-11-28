import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApplications, getApplicationById, updateApplicationStatus } from '../applicationsApi';
import { OnboardingCaseProjection, PagedResult } from '../../dtos/application.dto';

// Mock global fetch
global.fetch = vi.fn();

describe('Applications API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getApplications', () => {
    it('should fetch applications with default pagination', async () => {
      const mockData: PagedResult<OnboardingCaseProjection> = {
        items: [
          {
            caseId: '1',
            status: 'InProgress',
            riskLevel: 'Medium',
            businessLegalName: 'Test Corp',
            type: 'Business',
            createdAt: '2024-01-01',
            progressPercentage: 50,
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await getApplications();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/applications?page=1&pageSize=20'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should fetch applications with custom pagination and filters', async () => {
      const mockData = {
        items: [],
        totalCount: 0,
        page: 2,
        pageSize: 10,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      await getApplications(2, 10, 'test', 'SUBMITTED');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2&pageSize=10&searchTerm=test&status=SUBMITTED'),
        expect.any(Object)
      );
    });

    it('should handle different response formats (items vs data)', async () => {
      const mockData = {
        data: [{ caseId: '1', status: 'InProgress', riskLevel: 'Medium', type: 'Business', createdAt: '2024-01-01', progressPercentage: 50 }],
        total: 1,
        page: 1,
        pageSize: 20,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await getApplications();

      expect(result.items).toEqual(mockData.data);
      expect(result.totalCount).toBe(1);
    });

    it('should handle snake_case response format', async () => {
      const mockData = {
        items: [],
        total_count: 0,
        page: 1,
        page_size: 20,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await getApplications();

      expect(result.totalCount).toBe(0);
      expect(result.pageSize).toBe(20);
    });

    it('should throw error on failed request', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(getApplications()).rejects.toThrow('Failed to fetch applications: 500 Internal Server Error');
    });
  });

  describe('getApplicationById', () => {
    it('should fetch application by ID', async () => {
      const mockData: OnboardingCaseProjection = {
        caseId: '1',
        status: 'InProgress',
        riskLevel: 'Medium',
        businessLegalName: 'Test Corp',
        type: 'Business',
        createdAt: '2024-01-01',
        progressPercentage: 50,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await getApplicationById('1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/applications/1'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error on failed request', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(getApplicationById('999')).rejects.toThrow('Failed to fetch application: 404 Not Found');
    });
  });

  describe('updateApplicationStatus', () => {
    it('should update application status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
      } as Response);

      await updateApplicationStatus('1', 'COMPLETE', 'Notes');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/applications/1/status'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETE', notes: 'Notes' }),
        })
      );
    });

    it('should update application status without notes', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
      } as Response);

      await updateApplicationStatus('1', 'COMPLETE');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ status: 'COMPLETE', notes: undefined }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      await expect(updateApplicationStatus('1', 'INVALID')).rejects.toThrow(
        'Failed to update application status: 400 Bad Request'
      );
    });
  });
});

