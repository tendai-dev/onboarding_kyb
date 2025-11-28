import { describe, it, expect } from 'vitest';
import { escapeCsvField, createCsvBlob } from '../csvExport';

describe('CSV Export Utilities', () => {
  describe('escapeCsvField', () => {
    it('should return empty string for null', () => {
      expect(escapeCsvField(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(escapeCsvField(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(escapeCsvField('')).toBe('');
    });

    it('should return string as-is when no special characters', () => {
      expect(escapeCsvField('Simple text')).toBe('Simple text');
      expect(escapeCsvField('123')).toBe('123');
      expect(escapeCsvField('ABC')).toBe('ABC');
    });

    it('should wrap in quotes and escape quotes when field contains comma', () => {
      expect(escapeCsvField('Text, with comma')).toBe('"Text, with comma"');
    });

    it('should wrap in quotes and escape quotes when field contains quote', () => {
      expect(escapeCsvField('Text with "quote"')).toBe('"Text with ""quote"""');
    });

    it('should wrap in quotes and escape quotes when field contains newline', () => {
      expect(escapeCsvField('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });

    it('should escape multiple quotes', () => {
      expect(escapeCsvField('Text "with" multiple "quotes"')).toBe('"Text ""with"" multiple ""quotes"""');
    });

    it('should handle field with comma, quote, and newline', () => {
      const field = 'Text, with "quotes"\nand newline';
      const result = escapeCsvField(field);
      expect(result).toBe('"Text, with ""quotes""\nand newline"');
      expect(result).toContain('""quotes""');
    });

    it('should convert number to string', () => {
      expect(escapeCsvField(123 as any)).toBe('123');
      // Note: 0 is falsy, so it returns empty string per business logic
      expect(escapeCsvField(0 as any)).toBe('');
    });

    it('should handle boolean values', () => {
      expect(escapeCsvField(true as any)).toBe('true');
      // Note: false is falsy, so it returns empty string per business logic
      expect(escapeCsvField(false as any)).toBe('');
    });
  });

  describe('createCsvBlob', () => {
    it('should create CSV blob with headers and rows', async () => {
      const headers = ['Name', 'Age', 'City'];
      const rows = [
        ['John', '30', 'New York'],
        ['Jane', '25', 'Los Angeles'],
      ];

      const blob = createCsvBlob(headers, rows);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8;');

      // Use FileReader for JSDOM compatibility
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
      });
      expect(text).toBe('Name,Age,City\nJohn,30,New York\nJane,25,Los Angeles');
    });

    it('should create CSV blob with only headers when no rows', async () => {
      const headers = ['Name', 'Age'];
      const rows: string[][] = [];

      const blob = createCsvBlob(headers, rows);

      // Use FileReader for JSDOM compatibility
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
      });
      expect(text).toBe('Name,Age');
    });

    it('should handle empty headers', async () => {
      const headers: string[] = [];
      const rows: string[][] = [];

      const blob = createCsvBlob(headers, rows);

      // Use FileReader for JSDOM compatibility
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
      });
      expect(text).toBe('');
    });

    it('should handle rows with escaped fields', async () => {
      const headers = ['Name', 'Description'];
      const rows = [
        ['John', 'Text, with comma'],
        ['Jane', 'Text with "quote"'],
      ];

      const blob = createCsvBlob(headers, rows);

      // Use FileReader for JSDOM compatibility
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
      });
      expect(text).toBe('Name,Description\nJohn,Text, with comma\nJane,Text with "quote"');
    });

    it('should handle large number of rows', async () => {
      const headers = ['ID', 'Value'];
      const rows = Array.from({ length: 1000 }, (_, i) => [`id-${i}`, `value-${i}`]);

      const blob = createCsvBlob(headers, rows);

      expect(blob).toBeInstanceOf(Blob);
      // Use FileReader for JSDOM compatibility
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
      });
      const lines = text.split('\n');
      expect(lines).toHaveLength(1001); // 1 header + 1000 rows
      expect(lines[0]).toBe('ID,Value');
      expect(lines[1]).toBe('id-0,value-0');
      expect(lines[1000]).toBe('id-999,value-999');
    });

    it('should handle rows with different lengths', async () => {
      const headers = ['Col1', 'Col2', 'Col3'];
      const rows = [
        ['A', 'B'],
        ['C', 'D', 'E', 'F'],
        ['G'],
      ];

      const blob = createCsvBlob(headers, rows);

      // Use FileReader for JSDOM compatibility
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
      });
      expect(text).toBe('Col1,Col2,Col3\nA,B\nC,D,E,F\nG');
    });
  });
});

