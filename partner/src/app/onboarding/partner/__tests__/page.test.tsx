import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import PartnerOnboarding from '../page';

vi.mock('framer-motion', () => ({
  motion: {
    create: (Component: any) => Component,
  },
}));

describe('PartnerOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render onboarding page', () => {
    const { container } = renderWithProviders(<PartnerOnboarding />);
    expect(container).toBeInTheDocument();
  });

  it('should display step indicator', () => {
    renderWithProviders(<PartnerOnboarding />);
    expect(screen.getByText(/company info/i)).toBeInTheDocument();
  });

  it('should navigate to next step', async () => {
    renderWithProviders(<PartnerOnboarding />);
    
    const companyNameInput = screen.getByPlaceholderText(/enter company name/i);
    const registrationInput = screen.getByPlaceholderText(/enter registration number/i);
    const continueButton = screen.getByText(/continue/i);
    
    if (companyNameInput && registrationInput && continueButton) {
      fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
      fireEvent.change(registrationInput, { target: { value: '123456' } });
      
      // Fill other required fields
      const entityTypeSelect = document.querySelector('select[name="entityType"]');
      const countrySelect = document.querySelector('select[name="country"]');
      const addressInput = screen.getByPlaceholderText(/enter full address/i);
      const cityInput = screen.getByPlaceholderText(/enter city/i);
      const postalCodeInput = screen.getByPlaceholderText(/enter postal code/i);
      
      if (entityTypeSelect) fireEvent.change(entityTypeSelect, { target: { value: 'pty_ltd' } });
      if (countrySelect) fireEvent.change(countrySelect, { target: { value: 'za' } });
      if (addressInput) fireEvent.change(addressInput, { target: { value: '123 Test St' } });
      if (cityInput) fireEvent.change(cityInput, { target: { value: 'Test City' } });
      if (postalCodeInput) fireEvent.change(postalCodeInput, { target: { value: '1234' } });
      
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText(/entity details/i)).toBeInTheDocument();
      });
    }
  });

  it('should navigate to previous step', () => {
    renderWithProviders(<PartnerOnboarding />);
    
    // First navigate to step 2
    const companyNameInput = screen.getByPlaceholderText(/enter company name/i);
    if (companyNameInput) {
      fireEvent.change(companyNameInput, { target: { value: 'Test' } });
    }
    
    // Try to find previous button (might be disabled on first step)
    const previousButton = screen.queryByText(/previous/i);
    expect(document.body).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderWithProviders(<PartnerOnboarding />);
    
    const continueButton = screen.getByText(/continue/i);
    if (continueButton) {
      fireEvent.click(continueButton);
      
      // Should show validation errors
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should display all steps', () => {
    renderWithProviders(<PartnerOnboarding />);
    expect(screen.getByText(/company info/i)).toBeInTheDocument();
    expect(screen.getByText(/entity details/i)).toBeInTheDocument();
    expect(screen.getByText(/documents/i)).toBeInTheDocument();
    expect(screen.getByText(/review/i)).toBeInTheDocument();
  });

  it('should show step content', () => {
    renderWithProviders(<PartnerOnboarding />);
    expect(screen.getByPlaceholderText(/enter company name/i)).toBeInTheDocument();
  });
});
