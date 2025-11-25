/**
 * CSV Export Utilities
 * Shared utilities for CSV export functionality
 */

/**
 * Escape CSV field to handle commas, quotes, and newlines
 */
export function escapeCsvField(field: string | undefined | null): string {
  if (!field) return '';
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Create CSV blob from rows
 */
export function createCsvBlob(headers: string[], rows: string[][]): Blob {
  const csvRows: string[] = [];
  
  // CSV Header
  csvRows.push(headers.join(','));
  
  // CSV Data
  rows.forEach(row => {
    csvRows.push(row.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

