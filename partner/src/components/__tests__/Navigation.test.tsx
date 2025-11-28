import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import Navigation from '../Navigation';

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render navigation component', () => {
    const { container } = renderWithProviders(<Navigation />);
    expect(container).toBeInTheDocument();
  });

  it('should render with partner nav items', () => {
    renderWithProviders(<Navigation userType="partner" />);
    expect(document.body).toBeInTheDocument();
  });
});

