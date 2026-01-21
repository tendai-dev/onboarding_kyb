#!/bin/bash

# Script to update Keycloak client redirect URIs
# This updates the kyb-connect-portal client to include the correct callback URLs

set -e

# Configuration
KEYCLOAK_URL="${KEYCLOAK_URL:-https://keycloak-staging.app-stg.mukuru.io}"
REALM="${REALM:-mukuru}"
CLIENT_ID="${CLIENT_ID:-kyb-connect-portal}"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD}"

# Redirect URIs to add (both localhost and production)
REDIRECT_URIS=(
  "http://localhost:3000/api/auth/callback/keycloak"
  "http://localhost:3000/auth/callback"
  "http://localhost:3000/*"
  "https://partner-mukuru.kurasika.tech/api/auth/callback/keycloak"
  "https://partner-mukuru.kurasika.tech/auth/callback"
  "https://partner-mukuru.kurasika.tech/*"
)

WEB_ORIGINS=(
  "http://localhost:3000"
  "https://partner-mukuru.kurasika.tech"
)

echo "🔐 Updating Keycloak client redirect URIs..."
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm: $REALM"
echo "Client ID: $CLIENT_ID"
echo ""

# Check if admin password is provided
if [ -z "$ADMIN_PASSWORD" ]; then
  echo "❌ Error: KEYCLOAK_ADMIN_PASSWORD environment variable is required"
  echo "Usage: KEYCLOAK_ADMIN_PASSWORD=your-password ./update-keycloak-redirect-uris.sh"
  exit 1
fi

# Get admin access token
echo "📝 Getting admin access token..."
TOKEN_RESPONSE=$(curl -s -X POST \
  "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASSWORD}")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error: Failed to get access token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Got access token"
echo ""

# Get client UUID
echo "📝 Getting client UUID for client ID: $CLIENT_ID..."
CLIENT_RESPONSE=$(curl -s -X GET \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

CLIENT_UUID=$(echo $CLIENT_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_UUID" ]; then
  echo "❌ Error: Client '$CLIENT_ID' not found"
  echo "Response: $CLIENT_RESPONSE"
  exit 1
fi

echo "✅ Found client UUID: $CLIENT_UUID"
echo ""

# Get current client configuration
echo "📝 Getting current client configuration..."
CURRENT_CLIENT=$(curl -s -X GET \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

# Create updated client configuration with new redirect URIs
echo "📝 Preparing updated client configuration..."

# Use jq if available, otherwise use a simpler approach
if command -v jq &> /dev/null; then
  # Build redirect URIs JSON array
  REDIRECT_URIS_JSON=$(printf '%s\n' "${REDIRECT_URIS[@]}" | jq -R . | jq -s .)
  
  # Build web origins JSON array
  WEB_ORIGINS_JSON=$(printf '%s\n' "${WEB_ORIGINS[@]}" | jq -R . | jq -s .)
  
  # Update the client configuration
  UPDATED_CLIENT=$(echo "$CURRENT_CLIENT" | jq \
    --argjson redirectUris "$REDIRECT_URIS_JSON" \
    --argjson webOrigins "$WEB_ORIGINS_JSON" \
    '.redirectUris = $redirectUris | .webOrigins = $webOrigins')
else
  echo "⚠️  Warning: jq not found. Using Python for JSON manipulation..."
  
  # Create Python script to update JSON
  UPDATED_CLIENT=$(python3 <<EOF
import json
import sys

current = json.loads('''$CURRENT_CLIENT''')
redirect_uris = ${REDIRECT_URIS[@]@Q}
web_origins = ${WEB_ORIGINS[@]@Q}

current['redirectUris'] = list(redirect_uris)
current['webOrigins'] = list(web_origins)

print(json.dumps(current))
EOF
)
fi

# Update the client
echo "📝 Updating client configuration..."
UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$UPDATED_CLIENT")

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$UPDATE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 204 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Successfully updated client configuration!"
  echo ""
  echo "Updated redirect URIs:"
  printf '  - %s\n' "${REDIRECT_URIS[@]}"
  echo ""
  echo "Updated web origins:"
  printf '  - %s\n' "${WEB_ORIGINS[@]}"
else
  echo "❌ Error: Failed to update client (HTTP $HTTP_CODE)"
  echo "Response: $RESPONSE_BODY"
  exit 1
fi

echo ""
echo "🎉 Done! The Keycloak client has been updated."
echo ""
echo "Note: If you're running locally, make sure NEXTAUTH_URL is set to http://localhost:3000"
echo "      For production, set NEXTAUTH_URL to https://partner-mukuru.kurasika.tech"

