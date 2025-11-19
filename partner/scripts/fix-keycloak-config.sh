#!/bin/bash

# Script to help fix Keycloak OAuthSignin error
# This script generates the exact configuration needed for Keycloak

echo "=========================================="
echo "Keycloak Configuration Fixer"
echo "=========================================="
echo ""

# Read .env file
ENV_FILE=".env"
if [ -f ".env.local" ]; then
    ENV_FILE=".env.local"
    echo "Using .env.local file"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: No .env or .env.local file found!"
    exit 1
fi

# Extract values
NEXTAUTH_URL=$(grep "^NEXTAUTH_URL=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
KEYCLOAK_ISSUER=$(grep "^KEYCLOAK_ISSUER=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
KEYCLOAK_CLIENT_ID=$(grep "^KEYCLOAK_CLIENT_ID=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")

# Defaults if not found
NEXTAUTH_URL=${NEXTAUTH_URL:-"http://localhost:3000"}
KEYCLOAK_ISSUER=${KEYCLOAK_ISSUER:-"http://localhost:8080/realms/mukuru"}
KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID:-"kyb-connect-portal"}

EXPECTED_REDIRECT_URI="${NEXTAUTH_URL}/api/auth/callback/keycloak"

echo "📋 Current Configuration:"
echo "   NEXTAUTH_URL: $NEXTAUTH_URL"
echo "   KEYCLOAK_ISSUER: $KEYCLOAK_ISSUER"
echo "   KEYCLOAK_CLIENT_ID: $KEYCLOAK_CLIENT_ID"
echo ""
echo "🔗 Expected Redirect URI:"
echo "   $EXPECTED_REDIRECT_URI"
echo ""
echo "=========================================="
echo "Keycloak Admin Console Steps:"
echo "=========================================="
echo ""
echo "1. Open Keycloak Admin Console:"
echo "   ${KEYCLOAK_ISSUER%/realms/*}/admin"
echo ""
echo "2. Navigate to:"
echo "   Realm: $(echo $KEYCLOAK_ISSUER | sed 's|.*/realms/||')"
echo "   → Clients"
echo "   → $KEYCLOAK_CLIENT_ID"
echo "   → Settings tab"
echo ""
echo "3. In 'Valid Redirect URIs', add EXACTLY:"
echo "   $EXPECTED_REDIRECT_URI"
echo ""
echo "4. In 'Web Origins', add:"
echo "   $NEXTAUTH_URL"
echo ""
echo "5. Click 'Save'"
echo ""
echo "6. Restart your Next.js server"
echo ""
echo "=========================================="
echo "Quick Copy-Paste for Keycloak:"
echo "=========================================="
echo ""
echo "Valid Redirect URI:"
echo "$EXPECTED_REDIRECT_URI"
echo ""
echo "Web Origins:"
echo "$NEXTAUTH_URL"
echo ""

