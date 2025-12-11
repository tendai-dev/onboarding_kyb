# SignNow API Setup Guide

This guide will help you set up SignNow API integration for digital signatures in the admin application.

**Official Documentation:** [SignNow API Documentation](https://docs.signnow.com/docs/signnow/welcome)

## Prerequisites

1. A SignNow account (sign up at https://www.signnow.com/)
2. Access to SignNow API Dashboard
3. Basic understanding of OAuth 2.0 authentication

## Step 1: Register Your Application in SignNow

1. Log in to your SignNow account
2. Click the **plug icon** (⚡) at the bottom left of the screen to access the API Dashboard
3. Click **"Add App"** or **"Add Application"**
4. Provide a name for your application
5. Select the mode:
   - **Development**: For testing and development
   - **Live**: For production use
6. Click **"Add"**
7. Copy your **Basic Authorization Token** (you'll need this for configuration)

## Step 2: Configure Environment Variables

Add the following variables to your `.env` file (or `.env.local` for local development):

```bash
# Option 1: Use Basic Auth Token (recommended)
# This is the Basic Authorization Token from SignNow API Dashboard
# It's a base64-encoded string of "clientId:secretKey"
SIGNNOW_BASIC_AUTH_TOKEN=OTEzNmZjOTFmM2NjNjg5M2Y4YThhZTkyZWIwOTI2ZDM6NDYzZDAwMGM1NzhjMWIwYjI1MmZhMmI1NmQxNGY2YTY=

# Option 2: Use Client ID and Secret (alternative)
# If you prefer to use Client ID and Secret separately
# SIGNNOW_CLIENT_ID=9136fc91f3cc6893f8a8ae92eb0926d3
# SIGNNOW_CLIENT_SECRET=463d000c578c1b0b252fa2b56d14f6a6

# SignNow Account Credentials (required for OAuth token generation)
# These are your SignNow account login credentials
# Use the email address you used to sign up for SignNow (can be Google email/Gmail)
SIGNNOW_USERNAME=your-google-email@gmail.com
SIGNNOW_PASSWORD=your-signnow-password
```

**Note:** The Basic Authorization Token is a base64-encoded string in the format `clientId:secretKey`. You can use either:
- The Basic Authorization Token directly (Option 1 - recommended)
- Or Client ID and Secret separately (Option 2)

**Quick Setup:**
1. Create or edit your `.env.local` file in the `admin/` directory
2. Add your API key:
   ```bash
   SIGNNOW_BASIC_AUTH_TOKEN=a47d7438d950f7406072f700197625b2aacbdd9888aaec34e7b766f67f01636a
   ```
3. Add your SignNow account credentials:
   ```bash
   SIGNNOW_USERNAME=your-email@example.com
   SIGNNOW_PASSWORD=your-password
   ```
4. Restart your Next.js development server

**Important Security Notes:**
- ⚠️ **NEVER commit your `.env.local` file to version control**
- The `.env.local` file is already in `.gitignore` for security
- Use environment variables or a secure secrets management system in production
- The Basic Auth Token (API key) is valid for 30 days
- Access tokens are automatically refreshed by the service

## Step 3: Understanding the Integration

### Architecture

The SignNow integration consists of:

1. **Service Layer** (`src/services/signNowApi.ts`)
   - Handles authentication and token management
   - Provides methods for all SignNow API operations
   - Automatically refreshes access tokens

2. **API Routes** (`src/app/api/signnow/[...path]/route.ts`)
   - Secure server-side proxy for SignNow API calls
   - Keeps credentials on the server
   - Provides RESTful endpoints for client-side usage

### Available Endpoints

All endpoints are prefixed with `/api/signnow`:

- `POST /api/signnow/document` - Upload a document
- `GET /api/signnow/document/:id` - Get document details
- `PUT /api/signnow/document/:id/field` - Add signature fields
- `POST /api/signnow/document/:id/invite` - Send document for signing
- `GET /api/signnow/document/:id/download` - Download signed document
- `GET /api/signnow/document/:id/download/link` - Get download link
- `POST /api/signnow/document/:id/embeddedinvite` - Create embedded signing link
- `PUT /api/signnow/document/:id/fieldinvitecancel/:inviteId` - Cancel invite

## Step 4: Usage Examples

### Upload a Document

```typescript
import { signNowApiService } from '@/services/signNowApi';

// Server-side only
const fileBuffer = await fs.readFile('path/to/document.pdf');
const document = await signNowApiService.uploadDocument(
  fileBuffer,
  'contract.pdf'
);
console.log('Document ID:', document.id);
```

### Add Signature Fields

```typescript
const fields = [
  {
    type: 'signature' as const,
    page_number: 1,
    x: 100,
    y: 200,
    width: 200,
    height: 50,
    required: true,
    role: 'Signer 1',
  },
];

await signNowApiService.addFields(documentId, fields);
```

### Send Document for Signing

```typescript
const inviteData = {
  document_id: documentId,
  invites: [
    {
      to: 'signer@example.com',
      role_id: 'Signer 1',
      subject: 'Please sign this document',
      message: 'Your signature is required on this document.',
    },
  ],
  from: 'sender@example.com',
  subject: 'Document for Signature',
  message: 'Please review and sign the attached document.',
};

const response = await signNowApiService.sendInvite(documentId, inviteData);
```

### Create Embedded Signing Link

```typescript
const { link } = await signNowApiService.createEmbeddedLink(
  documentId,
  'signer@example.com',
  'Signer 1'
);
// Use this link in an iframe or redirect user
```

### Download Signed Document

```typescript
const buffer = await signNowApiService.downloadDocument(documentId);
await fs.writeFile('signed-document.pdf', buffer);
```

### Client-Side Usage (via API Routes)

```typescript
// Upload document
const formData = new FormData();
formData.append('file', file);
formData.append('fileName', 'contract.pdf');

const response = await fetch('/api/signnow/document', {
  method: 'POST',
  body: formData,
});
const document = await response.json();

// Add fields
await fetch(`/api/signnow/document/${document.id}/field`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(fields),
});

// Send invite
await fetch(`/api/signnow/document/${document.id}/invite`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(inviteData),
});
```

## Step 5: Integration with Existing Digital Signature Component

You can integrate SignNow with your existing `DigitalSignature` component:

```typescript
import { signNowApiService } from '@/services/signNowApi';

// In your component
const handleSign = async (signatureData: string, signatureImage: string) => {
  // Upload document to SignNow
  const document = await signNowApiService.uploadDocument(
    documentBuffer,
    'document.pdf'
  );

  // Add signature fields
  await signNowApiService.addFields(document.id, signatureFields);

  // Send for signing
  await signNowApiService.sendInvite(document.id, {
    document_id: document.id,
    invites: [
      {
        to: currentSigner.email,
        subject: 'Please sign this document',
      },
    ],
  });
};
```

## Authentication Flow

1. The service uses your Basic Auth Token or Client ID/Secret to authenticate
2. It requests an OAuth2 access token from SignNow (valid for 30 days)
3. Access tokens are cached and automatically refreshed when needed
4. All API calls use the Bearer token authentication

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const document = await signNowApiService.uploadDocument(buffer, 'file.pdf');
} catch (error) {
  if (error instanceof Error) {
    console.error('SignNow error:', error.message);
    // Handle specific error cases
  }
}
```

## Testing

1. Use SignNow's Development mode for testing
2. Test with sample documents first
3. Verify signature fields are positioned correctly
4. Test the complete signing workflow before going to production

## Production Considerations

1. **Switch to Live Mode**: Update your SignNow app to "Live" mode
2. **Update Credentials**: Use production credentials in your production environment
3. **Monitor Token Expiry**: Access tokens expire after 30 days (automatically handled)
4. **Error Monitoring**: Set up monitoring for SignNow API errors
5. **Rate Limiting**: Be aware of SignNow API rate limits
6. **Webhooks**: Consider setting up webhooks for document status updates

## Additional Resources

- [SignNow API Documentation](https://docs.signnow.com/docs/signnow/welcome) - Official SignNow API documentation
- [SignNow API Reference](https://api.signnow.com/) - API endpoint reference
- [SignNow Developer Portal](https://developers.signnow.com/) - Developer resources and guides

## Troubleshooting

### "SignNow credentials not configured"
- Ensure all required environment variables are set
- Check that `.env` file is in the correct location
- Restart your development server after adding environment variables

### "Failed to get access token"
- Verify your Basic Auth Token or Client ID/Secret are correct
- Check that your SignNow username and password are correct
- Ensure your SignNow account is active

### "Failed to upload document"
- Verify the file format is supported (PDF, DOCX, etc.)
- Check file size limits (SignNow has size restrictions)
- Ensure the document is not corrupted

### Token Expiry Issues
- Access tokens are automatically refreshed
- If you see token errors, check the token cache
- You may need to clear the cache if tokens are corrupted

## Support

For SignNow API-specific issues, contact SignNow support or refer to their documentation.
For integration issues, check the service logs and error messages.

