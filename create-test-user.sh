#!/bin/bash

echo "🔐 Creating Test User in Keycloak..."
echo "=================================="

# Keycloak settings
KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALM="master"

# New user details
NEW_USERNAME="john.doe"
NEW_PASSWORD="Test@123"
NEW_EMAIL="john.doe@example.com"
NEW_FIRSTNAME="John"
NEW_LASTNAME="Doe"

echo "1️⃣ Getting admin token..."
# Get admin access token
TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get admin token. Is Keycloak running?"
    exit 1
fi

echo "✅ Admin token obtained"

echo ""
echo "2️⃣ Creating user: $NEW_USERNAME..."

# Create the user
CREATE_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$NEW_USERNAME'",
    "email": "'$NEW_EMAIL'",
    "firstName": "'$NEW_FIRSTNAME'",
    "lastName": "'$NEW_LASTNAME'",
    "enabled": true,
    "emailVerified": true,
    "credentials": [
      {
        "type": "password",
        "value": "'$NEW_PASSWORD'",
        "temporary": false
      }
    ],
    "attributes": {
      "department": ["KYC Operations"],
      "role": ["KYC Analyst"]
    }
  }' -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "409" ]; then
    if [ "$HTTP_STATUS" = "409" ]; then
        echo "⚠️  User already exists, updating password..."
        
        # Get user ID
        USER_ID=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$NEW_USERNAME" \
          -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
        
        # Reset password
        curl -s -X PUT "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/reset-password" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d '{
            "type": "password",
            "value": "'$NEW_PASSWORD'",
            "temporary": false
          }'
    fi
    
    echo "✅ User ready: $NEW_USERNAME"
else
    echo "❌ Failed to create user. HTTP Status: $HTTP_STATUS"
    echo "Response: $CREATE_RESPONSE"
fi

echo ""
echo "3️⃣ Testing user login..."

# Test user login
USER_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$NEW_USERNAME" \
  -d "password=$NEW_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ ! -z "$USER_TOKEN" ]; then
    echo "✅ User login successful!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 USER CREDENTIALS:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Username: $NEW_USERNAME"
    echo "Password: $NEW_PASSWORD"
    echo "Email: $NEW_EMAIL"
    echo "Keycloak URL: $KEYCLOAK_URL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Save token for API calls
    echo "$USER_TOKEN" > /tmp/kyc_user_token.txt
    echo ""
    echo "🔑 User token saved to: /tmp/kyc_user_token.txt"
else
    echo "❌ User login failed"
fi
