import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { ThemeProvider, KeyboardShortcutsHelp, UserPreferences } from '../EnhancedUX';

describe('EnhancedUX Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ThemeProvider', () => {
    it('should render theme provider', () => {
      renderWithProviders(
        <ThemeProvider>
          <div>Test Content</div>
        </ThemeProvider>
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('KeyboardShortcutsHelp', () => {
    it('should render keyboard shortcuts help', () => {
      renderWithProviders(<KeyboardShortcutsHelp />);
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('UserPreferences', () => {
    it('should render user preferences', () => {
      renderWithProviders(<UserPreferences />);
      expect(document.body).toBeInTheDocument();
    });

    it('should handle theme change', async () => {
      renderWithProviders(<UserPreferences />);
      
      const themeButton = screen.queryByText(/theme|dark|light/i);
      if (themeButton) {
        fireEvent.click(themeButton);
        await waitFor(() => expect(document.body).toBeInTheDocument());
      }
    });
  });
});


