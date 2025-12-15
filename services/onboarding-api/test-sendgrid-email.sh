#!/bin/bash

# Test SendGrid Email Integration
# This script sends a test email to verify SendGrid is working

EMAIL="${1:-tendai@kurasika.tech}"
API_URL="${2:-http://localhost:5000}"

echo "Testing SendGrid email integration..."
echo "Sending test email to: $EMAIL"
echo "API URL: $API_URL"
echo ""

# Send test email
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/partner/test-email" \
  -H "Content-Type: application/json" \
  -d "{\"to\": \"$EMAIL\", \"subject\": \"Test Email from Mukuru Onboarding API\"}")

# Extract HTTP status code (last line)
http_code=$(echo "$response" | tail -n1)
# Extract response body (all but last line)
body=$(echo "$response" | sed '$d')

echo "HTTP Status Code: $http_code"
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

if [ "$http_code" -eq 200 ]; then
  echo ""
  echo "✅ Test email sent successfully!"
  echo "Check your inbox at $EMAIL"
else
  echo ""
  echo "❌ Failed to send test email"
  echo "Make sure the API is running and the SendGrid API key is configured"
fi

