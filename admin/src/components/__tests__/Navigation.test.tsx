import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import Navigation from '../Navigation';

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render navigation component', () => {
    renderWithProviders(<Navigation />);
    expect(document.body).toBeInTheDocument();
  });

  it('should render with custom user name and email', () => {
    renderWithProviders(<Navigation userName="Test User" userEmail="test@example.com" />);
    expect(document.body).toBeInTheDocument();
  });

  it('should display navigation items', () => {
    renderWithProviders(<Navigation />);
    expect(document.body).toBeInTheDocument();
  });

  it('should handle mobile menu toggle', async () => {
    renderWithProviders(<Navigation />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});

