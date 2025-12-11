# SignNow Quick Setup

## Your OAuth 2.0 Credentials

You've received your SignNow OAuth 2.0 credentials:

**Basic Authorization Token:**
```
OTEzNmZjOTFmM2NjNjg5M2Y4YThhZTkyZWIwOTI2ZDM6NDYzZDAwMGM1NzhjMWIwYjI1MmZhMmI1NmQxNGY2YTY=
```

**Alternative - Client ID and Secret:**
- Client ID: `9136fc91f3cc6893f8a8ae92eb0926d3`
- Secret Key: `463d000c578c1b0b252fa2b56d14f6a6`
- Application ID: `5c91772475b14f6d900d7773b6db91cae6f5d704`

## Setup Steps

### 1. Create/Edit `.env.local` file

In the `admin/` directory, create or edit `.env.local` file and add:

```bash
# SignNow OAuth 2.0 - Basic Authorization Token (recommended)
SIGNNOW_BASIC_AUTH_TOKEN=OTEzNmZjOTFmM2NjNjg5M2Y4YThhZTkyZWIwOTI2ZDM6NDYzZDAwMGM1NzhjMWIwYjI1MmZhMmI1NmQxNGY2YTY=

# OR use Client ID and Secret instead:
# SIGNNOW_CLIENT_ID=9136fc91f3cc6893f8a8ae92eb0926d3
# SIGNNOW_CLIENT_SECRET=463d000c578c1b0b252fa2b56d14f6a6

# Your SignNow Account Credentials (required for OAuth token generation)
# Use the email address you used to sign up for SignNow (can be Google email)
SIGNNOW_USERNAME=your-google-email@gmail.com
SIGNNOW_PASSWORD=your-signnow-password
```

**Important:** Replace `your-google-email@gmail.com` and `your-signnow-password` with your actual SignNow account credentials (the Google email you used to sign up for SignNow and your SignNow password).

### 2. Restart Your Development Server

After adding the environment variables, restart your Next.js server:

```bash
npm run dev
```

### 3. Test the Integration

You can test the integration by making a simple API call. The service will automatically:
- Authenticate with SignNow using your API key
- Get an OAuth access token
- Cache the token for future requests

## Verify Configuration

To verify everything is set up correctly, you can check the service logs when making your first API call. If you see authentication errors, double-check:

1. ✅ API key is correctly set in `.env.local`
2. ✅ SignNow username and password are correct
3. ✅ `.env.local` file is in the `admin/` directory
4. ✅ Development server has been restarted

## Security Reminder

⚠️ **Never commit `.env.local` to version control!** This file should already be in `.gitignore`, but always verify before committing.

## Next Steps

Once configured, you can:
- Upload documents: `POST /api/signnow/document`
- Send documents for signing: `POST /api/signnow/document/:id/invite`
- Download signed documents: `GET /api/signnow/document/:id/download`

See `docs/SIGNNOW_SETUP.md` for detailed usage examples.

**Official Documentation:** [SignNow API Documentation](https://docs.signnow.com/docs/signnow/welcome)

