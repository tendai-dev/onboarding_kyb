# Risk Assessment SignNow Integration

## Overview

The Risk Assessment form has been integrated with SignNow for digital signatures. All 7 signature fields now use SignNow instead of plain text input.

## What's Been Added

### 1. SignNow Signature Component
- **File**: `src/components/SignNowSignatureField.tsx`
- Reusable component for SignNow digital signatures
- Features:
  - Send signature invites
  - Check signature status
  - Download signed documents
  - Visual status indicators

### 2. Updated Risk Assessment Form
- **File**: `src/app/risk-assessment/[id]/page.tsx`
- Integrated SignNow signatures for all 7 signers:
  1. Money Laundering Reporting Officer (MLRO)
  2. Group Head of Financial Crime (Inyath Roberts)
  3. Group Head of Compliance (Phumelela Maliza)
  4. Executive Risk and Internal Audit (Nishan Sing)
  5. Group General Counsel (David Isenegger)
  6. Group Chief Commercial Officer (Dougal Bennett)
  7. Group Chief Executive Officer (Andy Jury)

### 3. Features Added
- **PDF Generation**: Form data is converted to PDF when saved
- **SignNow Upload**: PDF is automatically uploaded to SignNow
- **Signature Invites**: Each signer can receive email invites
- **Status Tracking**: Real-time signature status updates
- **Document Download**: Download fully signed documents

## How It Works

1. **Fill out the form** with all risk assessment data
2. **Click "Save Assessment"** - This will:
   - Generate a PDF from the form data
   - Upload it to SignNow
   - Store the SignNow document ID
3. **Send for Signature** - For each signer:
   - Click "Send for Signature" button
   - SignNow sends an email invite
   - Signer receives email and signs the document
4. **Track Status** - Check signature status for each signer
5. **Download** - Once all signatures are complete, download the signed PDF

## Configuration

### Signer Email Addresses

Update the `signerEmails` object in the form to match your organization:

```typescript
const signerEmails: Record<string, string> = {
  mlro: 'mlro@mukuru.com',
  groupHeadFC: 'inyath.roberts@mukuru.com',
  groupHeadCompliance: 'phumelela.maliza@mukuru.com',
  execRiskAudit: 'nishan.sing@mukuru.com',
  groupCounsel: 'david.isenegger@mukuru.com',
  cco: 'dougal.bennett@mukuru.com',
  ceo: 'andy.jury@mukuru.com',
};
```

## Next Steps

### 1. Create PDF Generation API Route

Create `/api/risk-assessment/generate-pdf/route.ts` to generate PDFs from form data.

### 2. Fix Component Issues

- Fix Chakra UI v3 Modal imports
- Fix Button leftIcon prop usage
- Fix useDisclosure property names

### 3. Test Integration

- Test PDF generation
- Test SignNow upload
- Test signature invites
- Test status checking
- Test document download

## API Endpoints Used

- `POST /api/risk-assessment/generate-pdf` - Generate PDF (to be created)
- `POST /api/signnow/document` - Upload document
- `POST /api/signnow/document/:id/invite` - Send signature invite
- `GET /api/signnow/document/:id` - Check document status
- `GET /api/signnow/document/:id/download` - Download signed document

## Status

✅ SignNow integration component created
✅ Risk assessment form updated with SignNow fields
✅ Signature workflow implemented
⚠️ PDF generation API route needs to be created
⚠️ Some component compatibility issues need fixing

