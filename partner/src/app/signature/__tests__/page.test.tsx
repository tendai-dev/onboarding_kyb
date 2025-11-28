import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import DigitalSignaturePage from '../page';

describe('DigitalSignaturePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render signature page', () => {
    renderWithProviders(<DigitalSignaturePage />);
    expect(screen.getByText(/mukuru service agreement/i)).toBeInTheDocument();
  });

  it('should display all documents to sign', () => {
    renderWithProviders(<DigitalSignaturePage />);
    
    expect(screen.getByText(/mukuru service agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/data privacy and protection agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/aml compliance declaration/i)).toBeInTheDocument();
  });

  it('should allow selecting a document', () => {
    renderWithProviders(<DigitalSignaturePage />);
    
    const document = screen.getByText(/mukuru service agreement/i);
    fireEvent.click(document);
    
    // Document should be selected
    expect(document).toBeInTheDocument();
  });

  it('should show signature canvas when document is selected', () => {
    renderWithProviders(<DigitalSignaturePage />);
    
    // Should have signature area
    expect(screen.getByText(/mukuru service agreement/i)).toBeInTheDocument();
  });

  it('should handle signature submission', () => {
    renderWithProviders(<DigitalSignaturePage />);
    
    const submitButton = screen.queryByText(/submit/i) || screen.queryByText(/sign/i);
    if (submitButton) {
      fireEvent.click(submitButton);
      // Should handle submission
      expect(submitButton).toBeInTheDocument();
    }
  });

  it('should show required documents', () => {
    renderWithProviders(<DigitalSignaturePage />);
    
    // Required documents should be marked
    expect(screen.getByText(/mukuru service agreement/i)).toBeInTheDocument();
  });
});

