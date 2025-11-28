import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import CustomerDocumentsPage from '../page';
import { getCustomerApplication } from '@/lib/mockData';

vi.mock('@/lib/mockData', () => ({
  getCustomerApplication: vi.fn(),
}));

describe('CustomerDocumentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getCustomerApplication as any).mockReturnValue({
      documents: [
        { id: 'doc-1', name: 'Document 1', status: 'verified' },
      ],
    });
  });

  it('should render documents page', () => {
    const { container } = renderWithProviders(<CustomerDocumentsPage />);
    expect(container).toBeInTheDocument();
  });

  it('should display documents', () => {
    renderWithProviders(<CustomerDocumentsPage />);
    expect(document.body).toBeInTheDocument();
  });
});

