import { describe, it, expect, vi, beforeEach } from 'vitest';
import { riskApiService } from '../riskApi';
import { getSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
}));

global.fetch = vi.fn();

describe('riskApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getSession as any).mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User', role: 'admin' },
    });
  });

  it('should get risk assessment', async () => {
    const mockAssessment = { id: 'risk-1', riskLevel: 'MEDIUM', riskScore: 50 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAssessment,
    });

    const result = await riskApiService.getRiskAssessment('app-1');
    expect(result).toEqual(mockAssessment);
  });

  it('should create risk assessment', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'risk-1' }),
    });

    const result = await riskApiService.createRiskAssessment({} as any);
    expect(result).toHaveProperty('id');
  });

  it('should update risk assessment', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'risk-1' }),
    });

    const result = await riskApiService.updateRiskAssessment('risk-1', {} as any);
    expect(result).toHaveProperty('id');
  });

  it('should get risk assessments', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await riskApiService.getRiskAssessments();
    expect(result).toEqual([]);
  });

  it('should handle errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server Error',
    });

    await expect(riskApiService.getRiskAssessment('app-1')).rejects.toThrow();
  });
});

