#!/bin/bash
# Script to fix PartnerId for a case using the backend API
# Usage: ./fix-partner-id.sh <case_id_or_number> <user_email> [api_base_url]
#
# Example:
#   ./fix-partner-id.sh OBC-20260121-60614 tendai@kurasika.tech
#   ./fix-partner-id.sh OBC-20260121-60614 tendai@kurasika.tech http://localhost:8001

set -e

CASE_ID="${1:-}"
USER_EMAIL="${2:-}"
API_BASE="${3:-http://localhost:8001}"

if [ -z "$CASE_ID" ] || [ -z "$USER_EMAIL" ]; then
    echo "Usage: $0 <case_id_or_number> <user_email> [api_base_url]"
    echo ""
    echo "This script fixes the PartnerId for a case that was created with the wrong PartnerId."
    echo "The PartnerId will be regenerated from the user's email using the same MD5 algorithm"
    echo "that the backend uses."
    echo ""
    echo "Examples:"
    echo "  $0 OBC-20260121-60614 tendai@kurasika.tech"
    echo "  $0 8f841255-c879-441e-a427-1c34c568b8ae user@example.com http://localhost:8001"
    exit 1
fi

echo "🔧 Fixing PartnerId for case: $CASE_ID"
echo "📧 User email: $USER_EMAIL"
echo "🌐 API Base URL: $API_BASE"
echo ""

# Call the fix-partner-id endpoint
RESPONSE=$(curl -s -X PATCH "${API_BASE}/api/v1/cases/${CASE_ID}/fix-partner-id" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${USER_EMAIL}\"}")

# Check if the response contains success
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ PartnerId fixed successfully!"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo "❌ Failed to fix PartnerId"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi
