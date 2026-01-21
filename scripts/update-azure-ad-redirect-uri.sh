#!/bin/bash

# Script to update Azure AD app registration redirect URI
# This adds the required redirect URI for NextAuth OAuth callbacks

set -e

# Configuration from environment or defaults
AZURE_TENANT_ID="${AZURE_AD_TENANT_ID}"
AZURE_CLIENT_ID="${AZURE_AD_CLIENT_ID:-66879744-7f08-4acd-9a4d-b90da1ee0e59}"
AZURE_CLIENT_SECRET="${AZURE_AD_CLIENT_SECRET}"
NEXTAUTH_URL="${NEXTAUTH_URL:-https://admin-mukuru.kurasika.tech}"

# Redirect URI to add
REDIRECT_URI="${NEXTAUTH_URL}/api/auth/callback/azure-ad"

echo "🔐 Updating Azure AD app registration redirect URI..."
echo "Tenant ID: $AZURE_TENANT_ID"
echo "Client ID: $AZURE_CLIENT_ID"
echo "Redirect URI: $REDIRECT_URI"
echo ""

# Check if required variables are set
if [ -z "$AZURE_TENANT_ID" ]; then
  echo "❌ Error: AZURE_AD_TENANT_ID environment variable is required"
  exit 1
fi

if [ -z "$AZURE_CLIENT_SECRET" ]; then
  echo "⚠️  Warning: AZURE_AD_CLIENT_SECRET not provided"
  echo "You'll need to authenticate interactively or use a service principal"
  echo ""
  echo "Option 1: Use Azure CLI (if installed):"
  echo "  az login"
  echo "  az ad app update --id $AZURE_CLIENT_ID --web-redirect-uris $REDIRECT_URI"
  echo ""
  echo "Option 2: Manual steps in Azure Portal:"
  echo "  1. Go to https://portal.azure.com"
  echo "  2. Navigate to: Azure Active Directory → App registrations"
  echo "  3. Search for Client ID: $AZURE_CLIENT_ID"
  echo "  4. Click on the app → Authentication"
  echo "  5. Under 'Redirect URIs', click 'Add a platform' → 'Web'"
  echo "  6. Add: $REDIRECT_URI"
  echo "  7. Click 'Save'"
  exit 1
fi

# Get access token using client credentials flow
echo "📝 Getting Azure AD access token..."
TOKEN_RESPONSE=$(curl -s -X POST \
  "https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${AZURE_CLIENT_ID}" \
  -d "client_secret=${AZURE_CLIENT_SECRET}" \
  -d "scope=https://graph.microsoft.com/.default")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error: Failed to get access token"
  echo "Response: $TOKEN_RESPONSE"
  echo ""
  echo "Please check:"
  echo "  1. AZURE_AD_TENANT_ID is correct"
  echo "  2. AZURE_AD_CLIENT_ID is correct"
  echo "  3. AZURE_AD_CLIENT_SECRET is correct"
  echo "  4. The app has 'Application' permissions for Microsoft Graph API"
  exit 1
fi

echo "✅ Got access token"
echo ""

# Get current app registration
echo "📝 Getting current app registration..."
APP_RESPONSE=$(curl -s -X GET \
  "https://graph.microsoft.com/v1.0/applications(appId='${AZURE_CLIENT_ID}')" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

if echo "$APP_RESPONSE" | grep -q "error"; then
  echo "❌ Error: Failed to get app registration"
  echo "Response: $APP_RESPONSE"
  exit 1
fi

echo "✅ Got app registration"
echo ""

# Extract current redirect URIs
CURRENT_URIS=$(echo "$APP_RESPONSE" | grep -o '"web".*"redirectUris":\[[^]]*\]' || echo "")

# Check if redirect URI already exists
if echo "$CURRENT_URIS" | grep -q "$REDIRECT_URI"; then
  echo "✅ Redirect URI already exists: $REDIRECT_URI"
  echo "No update needed!"
  exit 0
fi

# Build the update payload
echo "📝 Preparing update payload..."
UPDATE_PAYLOAD=$(cat <<EOF
{
  "web": {
    "redirectUris": ["$REDIRECT_URI"]
  }
}
EOF
)

# Update the app registration
echo "📝 Updating app registration with redirect URI..."
UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  "https://graph.microsoft.com/v1.0/applications(appId='${AZURE_CLIENT_ID}')" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PAYLOAD")

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$UPDATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Successfully updated redirect URI!"
  echo "   Redirect URI: $REDIRECT_URI"
  echo ""
  echo "🎉 Azure AD configuration updated. You can now try logging in again."
else
  echo "❌ Error: Failed to update redirect URI"
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $RESPONSE_BODY"
  echo ""
  echo "Please update manually in Azure Portal:"
  echo "  1. Go to https://portal.azure.com"
  echo "  2. Azure Active Directory → App registrations"
  echo "  3. Search for: $AZURE_CLIENT_ID"
  echo "  4. Authentication → Add redirect URI: $REDIRECT_URI"
  exit 1
fi

