import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { Input, TabsRoot, TabsList, TabsTrigger, TabsContent } from '../mukuruComponentWrappers';

describe('mukuruComponentWrappers', () => {
  describe('Input', () => {
    it('should render input without label', () => {
      renderWithProviders(<Input placeholder="Test input" />);
      const input = screen.getByPlaceholderText('Test input');
      expect(input).toBeInTheDocument();
    });

    it('should render input with label', () => {
      renderWithProviders(<Input label="Test Label" placeholder="Test input" />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    });
  });

  describe('Tabs components', () => {
    it('should export TabsRoot', () => {
      expect(TabsRoot).toBeDefined();
    });

    it('should export TabsList', () => {
      expect(TabsList).toBeDefined();
    });

    it('should export TabsTrigger', () => {
      expect(TabsTrigger).toBeDefined();
    });

    it('should export TabsContent', () => {
      expect(TabsContent).toBeDefined();
    });
  });
});

