#!/bin/bash

# Backfill Missing Work Items Utility
# This script calls the API endpoint to backfill work items for cases that are Submitted but don't have work items

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8001}"
DRY_RUN="${DRY_RUN:-true}"
LIMIT="${LIMIT:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Backfill Missing Work Items Utility"
echo "=========================================="
echo "API Base URL: $API_BASE_URL"
echo "Dry Run: $DRY_RUN"
if [ -n "$LIMIT" ]; then
    echo "Limit: $LIMIT cases"
fi
echo ""

# Check if jq is installed (for JSON parsing)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. JSON output will not be formatted.${NC}"
    JQ_AVAILABLE=false
else
    JQ_AVAILABLE=true
fi

# Build URL
URL="$API_BASE_URL/api/v1/workqueue/admin/backfill-missing-work-items"
if [ "$DRY_RUN" = "true" ]; then
    URL="${URL}?dryRun=true"
else
    URL="${URL}?dryRun=false"
fi

if [ -n "$LIMIT" ]; then
    URL="${URL}&limit=$LIMIT"
fi

echo "Calling: $URL"
echo ""

# Make the API call
# Note: You'll need to provide authentication token
# For local development, you might need to disable auth or provide a token
if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}Warning: AUTH_TOKEN not set. If authentication is required, the request will fail.${NC}"
    echo "Set AUTH_TOKEN environment variable if needed."
    echo ""
fi

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    ${AUTH_TOKEN:+-H "Authorization: Bearer $AUTH_TOKEN"} \
    "$URL")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}Success!${NC}"
    echo ""
    if [ "$JQ_AVAILABLE" = true ]; then
        echo "$BODY" | jq .
    else
        echo "$BODY"
    fi
else
    echo -e "${RED}Error: Request failed with status $HTTP_CODE${NC}"
    echo ""
    echo "Response:"
    echo "$BODY"
    exit 1
fi

echo ""
echo "=========================================="
echo "Backfill completed"
echo "=========================================="

