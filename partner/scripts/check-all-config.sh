#!/bin/bash

# Comprehensive configuration checker

echo "=========================================="
echo "Complete Configuration Check"
echo "=========================================="
echo ""

cd "$(dirname "$0")/.."

# Check .env files
ENV_FILE=".env"
if [ -f ".env.local" ]; then
    ENV_FILE=".env.local"
    echo "Using .env.local (takes precedence)"
fi

echo "📋 Environment Variables:"
echo ""

# 1. NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(grep "^NEXTAUTH_SECRET=" "$ENV_FILE" .env 2>/dev/null | head -1 | cut -d '=' -f2 | tr -d '"' | tr -d "'")
if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your-secret-key-here-change-this-in-production" ]; then
    echo "❌ NEXTAUTH_SECRET: Missing or using placeholder!"
    echo "   Fix: Generate a random string and set it in .env.local"
else
    echo "✅ NEXTAUTH_SECRET: Set"
fi

# 2. NEXTAUTH_URL
NEXTAUTH_URL=$(grep "^NEXTAUTH_URL=" "$ENV_FILE" .env 2>/dev/null | head -1 | cut -d '=' -f2 | tr -d '"' | tr -d "'")
if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ NEXTAUTH_URL: Missing!"
    echo "   Fix: Set NEXTAUTH_URL=http://localhost:3000 in .env.local"
else
    if [ "$NEXTAUTH_URL" = "http://localhost:3000" ]; then
        echo "✅ NEXTAUTH_URL: $NEXTAUTH_URL (correct)"
    else
        echo "⚠️  NEXTAUTH_URL: $NEXTAUTH_URL (should be http://localhost:3000 for local dev)"
    fi
fi

# 3. KEYCLOAK_ISSUER
KEYCLOAK_ISSUER=$(grep "^KEYCLOAK_ISSUER=" "$ENV_FILE" .env 2>/dev/null | head -1 | cut -d '=' -f2 | tr -d '"' | tr -d "'")
if [ -z "$KEYCLOAK_ISSUER" ]; then
    echo "❌ KEYCLOAK_ISSUER: Missing!"
else
    if echo "$KEYCLOAK_ISSUER" | grep -q "keycloak-staging.app-stg.mukuru.io"; then
        echo "✅ KEYCLOAK_ISSUER: $KEYCLOAK_ISSUER (remote)"
    else
        echo "⚠️  KEYCLOAK_ISSUER: $KEYCLOAK_ISSUER (check if this is correct)"
    fi
fi

# 4. KEYCLOAK_CLIENT_ID
KEYCLOAK_CLIENT_ID=$(grep "^KEYCLOAK_CLIENT_ID=" "$ENV_FILE" .env 2>/dev/null | head -1 | cut -d '=' -f2 | tr -d '"' | tr -d "'")
if [ -z "$KEYCLOAK_CLIENT_ID" ]; then
    echo "❌ KEYCLOAK_CLIENT_ID: Missing!"
else
    if [ "$KEYCLOAK_CLIENT_ID" = "kyb-connect-portal" ]; then
        echo "✅ KEYCLOAK_CLIENT_ID: $KEYCLOAK_CLIENT_ID (correct)"
    else
        echo "⚠️  KEYCLOAK_CLIENT_ID: $KEYCLOAK_CLIENT_ID (expected: kyb-connect-portal)"
    fi
fi

# 5. KEYCLOAK_CLIENT_SECRET
KEYCLOAK_CLIENT_SECRET=$(grep "^KEYCLOAK_CLIENT_SECRET=" "$ENV_FILE" .env 2>/dev/null | head -1 | cut -d '=' -f2 | tr -d '"' | tr -d "'")
if [ -z "$KEYCLOAK_CLIENT_SECRET" ]; then
    echo "⚠️  KEYCLOAK_CLIENT_SECRET: Not set (OK if client is public)"
else
    echo "✅ KEYCLOAK_CLIENT_SECRET: Set"
fi

echo ""
echo "🔗 Expected Redirect URI:"
EXPECTED_URI="${NEXTAUTH_URL:-http://localhost:3000}/api/auth/callback/keycloak"
echo "   $EXPECTED_URI"
echo ""

echo "📡 Service Checks:"
echo ""

# Check Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis: Running"
    else
        echo "❌ Redis: Not running (start with: docker-compose up redis or redis-server)"
    fi
else
    echo "⚠️  Redis: redis-cli not found (may need to install or use Docker)"
fi

# Check Keycloak reachability
if [ -n "$KEYCLOAK_ISSUER" ]; then
    WELL_KNOWN="${KEYCLOAK_ISSUER}/.well-known/openid-configuration"
    if curl -s --max-time 5 "$WELL_KNOWN" &> /dev/null; then
        echo "✅ Keycloak: Reachable"
    else
        echo "❌ Keycloak: Not reachable (check network/VPN)"
    fi
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Fix any ❌ issues above"
echo "2. Verify redirect URI in Keycloak Admin:"
echo "   ${KEYCLOAK_ISSUER%/realms/*}/admin"
echo "   → Realm: $(echo $KEYCLOAK_ISSUER | sed 's|.*/realms/||')"
echo "   → Clients → $KEYCLOAK_CLIENT_ID"
echo "   → Add redirect URI: $EXPECTED_URI"
echo ""
echo "3. Restart Next.js server after fixes"
echo ""

