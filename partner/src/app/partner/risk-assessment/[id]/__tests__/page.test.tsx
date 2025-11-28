import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import RiskAssessmentPage from '../page';
import { useParams } from 'next/navigation';
import { riskApiService } from '@/services/riskApi';
import { getAuthUser } from '@/lib/auth/session';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/api');
vi.mock('@/lib/auth/session');
vi.mock('@/services/riskApi');

global.fetch = vi.fn();

describe('RiskAssessmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ id: 'test-id' });
    (getAuthUser as any).mockReturnValue({ name: 'Test User', email: 'test@example.com' });
    (riskApiService.getRiskAssessmentByCase as any).mockResolvedValue({
      id: 'risk-1',
      caseId: 'test-id',
      overallRiskLevel: 'low',
      riskScore: 30,
    });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'test-id', caseId: 'test-id' }),
    });
  });

  it('should render risk assessment page', () => {
    const { container } = renderWithProviders(<RiskAssessmentPage />);
    expect(container).toBeInTheDocument();
  });

  it('should load risk assessment on mount', async () => {
    renderWithProviders(<RiskAssessmentPage />);
    
    await waitFor(() => {
      expect(riskApiService.getRiskAssessmentByCase).toHaveBeenCalledWith('test-id');
    }, { timeout: 3000 });
  });
});

