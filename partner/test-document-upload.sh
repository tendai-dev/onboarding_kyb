#!/bin/bash

# Test script for document upload endpoint
# This script uses curl to test the document upload endpoint

set -e

# Configuration
PROXY_URL="${PROXY_URL:-http://localhost:3000}"
TEST_ENDPOINT="${PROXY_URL}/api/proxy/api/v1/documents/upload"

# Test data - you'll need to provide valid GUIDs
TEST_CASE_ID="${TEST_CASE_ID:-00000000-0000-0000-0000-000000000001}"
TEST_PARTNER_ID="${TEST_PARTNER_ID:-00000000-0000-0000-0000-000000000002}"
TEST_USER_EMAIL="${TEST_USER_EMAIL:-test@example.com}"

# Create a test file
TEST_FILE="test-document-upload.txt"
echo "This is a test document for upload verification." > "$TEST_FILE"

echo "🧪 Testing Document Upload Endpoint"
echo "====================================="
echo ""
echo "📤 Sending request to: $TEST_ENDPOINT"
echo "Request fields:"
echo "  - CaseId: $TEST_CASE_ID"
echo "  - PartnerId: $TEST_PARTNER_ID"
echo "  - Type: 99 (Other)"
echo "  - File: $TEST_FILE"
echo "  - Description: Test document upload"
echo "  - UploadedBy: $TEST_USER_EMAIL"
echo ""

# Send the request using curl
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$TEST_ENDPOINT" \
  -F "File=@$TEST_FILE" \
  -F "CaseId=$TEST_CASE_ID" \
  -F "PartnerId=$TEST_PARTNER_ID" \
  -F "Type=99" \
  -F "Description=Test document upload" \
  -F "UploadedBy=$TEST_USER_EMAIL" \
  -H "X-User-Email: $TEST_USER_EMAIL" \
  -H "X-User-Name: Test User" \
  -H "X-User-Role: Applicant")

# Extract status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "📥 Response Status: $HTTP_CODE"
echo "📥 Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Clean up
rm -f "$TEST_FILE"

# Check if successful
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ SUCCESS! Document uploaded successfully"
  exit 0
else
  echo "❌ FAILED! Upload returned error status: $HTTP_CODE"
  exit 1
fi

