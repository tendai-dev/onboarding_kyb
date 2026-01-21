# Azure AD Redirect URI Setup Instructions

## Quick Fix (Automated)

If you have Azure CLI installed and are logged in:

```bash
cd /root/onboarding_kyc
export AZURE_AD_CLIENT_ID=66879744-7f08-4acd-9a4d-b90da1ee0e59
export NEXTAUTH_URL=https://admin-mukuru.kurasika.tech

az login
az ad app update --id $AZURE_AD_CLIENT_ID --web-redirect-uris "${NEXTAUTH_URL}/api/auth/callback/azure-ad"
```

## Manual Setup (Azure Portal)

1. **Go to Azure Portal**: https://portal.azure.com

2. **Navigate to App Registrations**:
   - Click "Azure Active Directory" (or search for it)
   - Click "App registrations" in the left menu
   - Search for Client ID: `66879744-7f08-4acd-9a4d-b90da1ee0e59`

3. **Open Authentication Settings**:
   - Click on your app registration
   - Click "Authentication" in the left menu

4. **Add Redirect URI**:
   - Under "Redirect URIs", click "Add a platform"
   - Select "Web"
   - Add this **exact** URL (no trailing slash):
     ```
     https://admin-mukuru.kurasika.tech/api/auth/callback/azure-ad
     ```
   - Click "Save"

5. **Verify**:
   - The redirect URI should now appear in the list
   - Make sure it matches exactly (https, no trailing slash)

## Using the Script

If you have the required credentials:

```bash
cd /root/onboarding_kyc
export AZURE_AD_TENANT_ID=your-tenant-id
export AZURE_AD_CLIENT_ID=66879744-7f08-4acd-9a4d-b90da1ee0e59
export AZURE_AD_CLIENT_SECRET=your-client-secret
export NEXTAUTH_URL=https://admin-mukuru.kurasika.tech

./scripts/update-azure-ad-redirect-uri.sh
```

**Note**: The script requires the app to have Microsoft Graph API permissions. If you don't have these permissions, use the manual method above.

## Verify Configuration

After updating, check the diagnostics endpoint:

```bash
curl https://admin-mukuru.kurasika.tech/api/diagnostics
```

This will show the expected redirect URI that must match Azure AD.

## Troubleshooting

- **OAuthCallbackError**: Usually means redirect URI mismatch
- **Check exact URL**: Must be `https://admin-mukuru.kurasika.tech/api/auth/callback/azure-ad` (no trailing slash)
- **Case sensitive**: URLs are case-sensitive
- **Protocol**: Must be `https://` not `http://`

