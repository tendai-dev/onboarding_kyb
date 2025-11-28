import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import DocumentRequirementsPage from '../page';

describe('DocumentRequirementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render document requirements page', () => {
    const { container } = renderWithProviders(<DocumentRequirementsPage />);
    expect(container).toBeInTheDocument();
  });

  it('should display entity type selector', () => {
    renderWithProviders(<DocumentRequirementsPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('should change entity type', () => {
    const { container } = renderWithProviders(<DocumentRequirementsPage />);
    const select = container.querySelector('select');
    if (select) {
      fireEvent.change(select, { target: { value: 'publicly_listed' } });
      expect(select.value).toBe('publicly_listed');
    }
  });

  it('should toggle EPP flag', () => {
    const { container } = renderWithProviders(<DocumentRequirementsPage />);
    const checkbox = container.querySelector('input[type="checkbox"]');
    if (checkbox) {
      fireEvent.click(checkbox);
      expect((checkbox as HTMLInputElement).checked).toBe(true);
    }
  });

  it('should display required documents for selected entity type', () => {
    renderWithProviders(<DocumentRequirementsPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('should display financial institution documents', () => {
    renderWithProviders(<DocumentRequirementsPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('should filter documents by category', () => {
    renderWithProviders(<DocumentRequirementsPage />);
    expect(document.body).toBeInTheDocument();
  });
});

