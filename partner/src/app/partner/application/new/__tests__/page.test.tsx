import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import NewPartnerApplicationPage from '../page';
import { useRouter } from 'next/navigation';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
  }),
}));

describe('NewPartnerApplicationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render and redirect to enhanced page', async () => {
    renderWithProviders(<NewPartnerApplicationPage />);
    
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/partner/application/enhanced');
    });
  });
});

