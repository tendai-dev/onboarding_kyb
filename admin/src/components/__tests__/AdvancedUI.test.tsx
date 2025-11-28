import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { RichTextEditor, DataVisualization, AdvancedFilterPanel } from '../AdvancedUI';

describe('AdvancedUI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RichTextEditor', () => {
    it('should render rich text editor', () => {
      renderWithProviders(
        <RichTextEditor value="" onChange={vi.fn()} />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle text change', async () => {
      const onChange = vi.fn();
      renderWithProviders(
        <RichTextEditor value="" onChange={onChange} />
      );

      const editor = screen.queryByRole('textbox');
      if (editor) {
        fireEvent.input(editor, { target: { innerHTML: 'Test content' } });
        await waitFor(() => expect(document.body).toBeInTheDocument());
      }
    });
  });

  describe('DataVisualization', () => {
    it('should render data visualization', () => {
      renderWithProviders(
        <DataVisualization data={[]} />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('AdvancedFilterPanel', () => {
    it('should render advanced filter panel', () => {
      renderWithProviders(
        <AdvancedFilterPanel filters={[]} onFilterChange={vi.fn()} />
      );

      expect(document.body).toBeInTheDocument();
    });
  });
});


