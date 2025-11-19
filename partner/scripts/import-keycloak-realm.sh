#!/bin/bash

# Script to import the Keycloak realm configuration with the fixed redirect URI

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM_FILE="../../infra/keycloak/realm-export-partners.json"

echo "=========================================="
echo "Keycloak Realm Import Script"
echo "=========================================="
echo ""
echo "This will import the realm configuration with the correct redirect URI."
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm file: $REALM_FILE"
echo ""

# Get admin token
echo "Step 1: Getting admin token..."
TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get admin token. Check Keycloak is running and credentials are correct."
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Admin token obtained"
echo ""

# Import realm
echo "Step 2: Importing realm configuration..."
REALM_NAME=$(cat "$REALM_FILE" | grep -o '"realm":"[^"]*' | head -1 | cut -d'"' -f4)

IMPORT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$KEYCLOAK_URL/admin/realms" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @"$REALM_FILE")

HTTP_CODE=$(echo "$IMPORT_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$IMPORT_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "204" ] || echo "$RESPONSE_BODY" | grep -q "already exists"; then
  echo "✅ Realm '$REALM_NAME' imported/updated successfully!"
  echo ""
  echo "The 'kyb-connect-portal' client is now configured with:"
  echo "  Redirect URI: http://localhost:3000/api/auth/callback/keycloak"
  echo "  Web Origin: http://localhost:3000"
  echo ""
  echo "Next steps:"
  echo "1. Restart your Next.js server"
  echo "2. Try logging in again"
else
  echo "❌ Failed to import realm. HTTP Code: $HTTP_CODE"
  echo "Response: $RESPONSE_BODY"
  echo ""
  echo "You may need to manually update Keycloak:"
  echo "1. Open: $KEYCLOAK_URL/admin"
  echo "2. Go to: Realm → Clients → kyb-connect-portal"
  echo "3. Add redirect URI: http://localhost:3000/api/auth/callback/keycloak"
  exit 1
fi

