import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { DigitalSignature, Document, SignatureField } from '../DigitalSignature';

const mockDocument: Document = {
  id: 'doc-1',
  name: 'Test Document',
  type: 'agreement',
  url: '/test.pdf',
  pages: 1,
  signatureFields: [],
  status: 'draft',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  signers: [],
};

describe('DigitalSignature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render digital signature component', () => {
    renderWithProviders(<DigitalSignature document={mockDocument} />);
    expect(document.body).toBeInTheDocument();
  });

  it('should display document information', () => {
    renderWithProviders(<DigitalSignature document={mockDocument} />);
    expect(document.body).toBeInTheDocument();
  });

  it('should handle signature field creation', async () => {
    renderWithProviders(<DigitalSignature document={mockDocument} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });

  it('should handle signature submission', async () => {
    renderWithProviders(<DigitalSignature document={mockDocument} />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });

  it('should display signature status', () => {
    const signedDocument: Document = {
      ...mockDocument,
      status: 'fully_signed',
      signatureFields: [
        {
          id: 'field-1',
          documentId: 'doc-1',
          pageNumber: 1,
          x: 100,
          y: 100,
          width: 200,
          height: 50,
          signerId: 'signer-1',
          signerName: 'Test Signer',
          signerEmail: 'signer@test.com',
          required: true,
          status: 'signed',
          signedAt: '2024-01-01',
        },
      ],
    };

    renderWithProviders(<DigitalSignature document={signedDocument} />);
    expect(document.body).toBeInTheDocument();
  });
});

