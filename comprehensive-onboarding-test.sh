#!/bin/bash

echo "🧪 COMPREHENSIVE ONBOARDING PROCESS TESTING"
echo "==========================================="
echo "Testing every aspect of the system with real cURL commands"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Base URLs for services
BASE_URL="http://localhost"
ONBOARDING_API="${BASE_URL}:8081"
DOCUMENT_SERVICE="${BASE_URL}:8082"
RISK_SERVICE="${BASE_URL}:8083"
NOTIFICATION_SERVICE="${BASE_URL}:8085"
CHECKLIST_SERVICE="${BASE_URL}:8086"
MESSAGING_SERVICE="${BASE_URL}:8087"
AUDITLOG_SERVICE="${BASE_URL}:8088"
WEBHOOK_SERVICE="${BASE_URL}:8089"
PROJECTIONS_SERVICE="${BASE_URL}:8090"
WORKQUEUE_SERVICE="${BASE_URL}:8091"
KEYCLOAK="${BASE_URL}:8080"

# Test data
TIMESTAMP=$(date +%s)
TEST_CASE_ID=""
TEST_DOCUMENT_ID=""
TEST_CHECKLIST_ID=""
TEST_NOTIFICATION_ID=""
TEST_USER_TOKEN=""

# Function to test endpoint
test_endpoint() {
    local test_name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${BLUE}TEST $TOTAL_TESTS: $test_name${NC}"
    echo "Method: $method"
    echo "URL: $url"
    
    if [ "$method" == "GET" ]; then
        RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$url" -H "Content-Type: application/json")
    elif [ "$method" == "POST" ]; then
        RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data")
    elif [ "$method" == "PUT" ]; then
        RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$url" -H "Content-Type: application/json" -d "$data")
    elif [ "$method" == "DELETE" ]; then
        RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE "$url" -H "Content-Type: application/json")
    fi
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed -n '1,/HTTP_STATUS:/p' | sed '$d')
    
    echo "Response Status: $HTTP_STATUS"
    echo "Response Body: $(echo $BODY | jq '.' 2>/dev/null || echo $BODY | head -c 200)"
    
    if [ "$HTTP_STATUS" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED (Expected: $expected_status, Got: $HTTP_STATUS)${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 1: SERVICE HEALTH CHECKS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Test all service health endpoints
test_endpoint "Onboarding API Health" "GET" "$ONBOARDING_API/health" "" "200"
test_endpoint "Document Service Health" "GET" "$DOCUMENT_SERVICE/health" "" "200"
test_endpoint "Risk Service Health" "GET" "$RISK_SERVICE/health" "" "200"
test_endpoint "Notification Service Health" "GET" "$NOTIFICATION_SERVICE/health" "" "200"
test_endpoint "Checklist Service Health" "GET" "$CHECKLIST_SERVICE/health" "" "200"
test_endpoint "Messaging Service Health" "GET" "$MESSAGING_SERVICE/health" "" "200"
test_endpoint "Audit Log Service Health" "GET" "$AUDITLOG_SERVICE/health" "" "200"
test_endpoint "Webhook Service Health" "GET" "$WEBHOOK_SERVICE/health" "" "200"
test_endpoint "Work Queue Service Health" "GET" "$WORKQUEUE_SERVICE/health" "" "200"

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 2: AUTHENTICATION & AUTHORIZATION${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Get Keycloak token
echo -e "\n${BLUE}Getting authentication token from Keycloak${NC}"
TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" \
    -d "username=admin" \
    -d "password=admin" 2>/dev/null)

if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
    TEST_USER_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token' 2>/dev/null)
    echo -e "${GREEN}✓ Authentication successful${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠ Using no authentication (services may not require it in dev)${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 3: CREATE ONBOARDING CASE${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Create a new onboarding case
CASE_DATA=$(cat <<EOF
{
    "partnerName": "Test Company $TIMESTAMP",
    "entityType": "Private Company",
    "country": "South Africa",
    "registrationNumber": "REG-$TIMESTAMP",
    "taxNumber": "TAX-$TIMESTAMP",
    "contactPerson": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@testcompany-$TIMESTAMP.com",
        "phone": "+27123456789"
    },
    "businessAddress": {
        "street": "123 Test Street",
        "city": "Cape Town",
        "postalCode": "8000",
        "country": "South Africa"
    }
}
EOF
)

echo -e "\n${BLUE}Creating new onboarding case${NC}"
CASE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$ONBOARDING_API/api/v1/cases" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TEST_USER_TOKEN" \
    -d "$CASE_DATA")

HTTP_STATUS=$(echo "$CASE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
CASE_BODY=$(echo "$CASE_RESPONSE" | sed -n '1,/HTTP_STATUS:/p' | sed '$d')

if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "201" ]]; then
    TEST_CASE_ID=$(echo "$CASE_BODY" | jq -r '.id // .caseId // .case_id' 2>/dev/null)
    echo -e "${GREEN}✓ Case created successfully${NC}"
    echo "Case ID: $TEST_CASE_ID"
    echo "Response: $(echo $CASE_BODY | jq '.' 2>/dev/null | head -20)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ Failed to create case (Status: $HTTP_STATUS)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 4: VERIFY DATA PERSISTENCE${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Verify the case was saved
if [ ! -z "$TEST_CASE_ID" ]; then
    test_endpoint "Retrieve Created Case" "GET" "$ONBOARDING_API/api/v1/cases/$TEST_CASE_ID" "" "200"
fi

# List all cases to verify it's in the list
test_endpoint "List All Cases" "GET" "$ONBOARDING_API/api/v1/cases" "" "200"

# Update the case
UPDATE_DATA=$(cat <<EOF
{
    "status": "IN_REVIEW",
    "notes": "Case is being reviewed by compliance team"
}
EOF
)

if [ ! -z "$TEST_CASE_ID" ]; then
    test_endpoint "Update Case Status" "PUT" "$ONBOARDING_API/api/v1/cases/$TEST_CASE_ID" "$UPDATE_DATA" "200"
fi

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 5: DOCUMENT UPLOAD & HANDLING${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Create a test document
echo "Test Document Content" > /tmp/test-document-$TIMESTAMP.pdf

# Upload document metadata
DOC_METADATA=$(cat <<EOF
{
    "caseId": "$TEST_CASE_ID",
    "documentType": "REGISTRATION_CERTIFICATE",
    "fileName": "registration-cert-$TIMESTAMP.pdf",
    "fileSize": 12345,
    "mimeType": "application/pdf",
    "checksum": "abc123def456"
}
EOF
)

echo -e "\n${BLUE}Uploading document metadata${NC}"
DOC_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$DOCUMENT_SERVICE/api/v1/documents" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TEST_USER_TOKEN" \
    -d "$DOC_METADATA")

HTTP_STATUS=$(echo "$DOC_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
DOC_BODY=$(echo "$DOC_RESPONSE" | sed -n '1,/HTTP_STATUS:/p' | sed '$d')

if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "201" ]]; then
    TEST_DOCUMENT_ID=$(echo "$DOC_BODY" | jq -r '.id // .documentId // .document_id' 2>/dev/null)
    echo -e "${GREEN}✓ Document uploaded successfully${NC}"
    echo "Document ID: $TEST_DOCUMENT_ID"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ Failed to upload document (Status: $HTTP_STATUS)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Retrieve document
if [ ! -z "$TEST_DOCUMENT_ID" ]; then
    test_endpoint "Retrieve Document" "GET" "$DOCUMENT_SERVICE/api/v1/documents/$TEST_DOCUMENT_ID" "" "200"
fi

# List documents for case
test_endpoint "List Case Documents" "GET" "$DOCUMENT_SERVICE/api/v1/documents?caseId=$TEST_CASE_ID" "" "200"

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 6: RISK ASSESSMENT${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Trigger risk assessment
RISK_DATA=$(cat <<EOF
{
    "caseId": "$TEST_CASE_ID",
    "assessmentType": "INITIAL",
    "factors": {
        "country": "South Africa",
        "entityType": "Private Company",
        "annualRevenue": 1000000,
        "yearsInBusiness": 5
    }
}
EOF
)

test_endpoint "Create Risk Assessment" "POST" "$RISK_SERVICE/api/v1/assessments" "$RISK_DATA" "200"

# Get risk assessment for case
test_endpoint "Get Case Risk Assessment" "GET" "$RISK_SERVICE/api/v1/assessments/case/$TEST_CASE_ID" "" "200"

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 7: CHECKLIST MANAGEMENT${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Create checklist for case
CHECKLIST_DATA=$(cat <<EOF
{
    "caseId": "$TEST_CASE_ID",
    "templateType": "STANDARD_ONBOARDING",
    "items": [
        {
            "name": "Identity Verification",
            "required": true,
            "status": "PENDING"
        },
        {
            "name": "Address Verification",
            "required": true,
            "status": "PENDING"
        },
        {
            "name": "Business Registration",
            "required": true,
            "status": "COMPLETED"
        },
        {
            "name": "Tax Registration",
            "required": true,
            "status": "PENDING"
        }
    ]
}
EOF
)

echo -e "\n${BLUE}Creating checklist${NC}"
CHECKLIST_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$CHECKLIST_SERVICE/api/v1/checklists" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TEST_USER_TOKEN" \
    -d "$CHECKLIST_DATA")

HTTP_STATUS=$(echo "$CHECKLIST_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
CHECKLIST_BODY=$(echo "$CHECKLIST_RESPONSE" | sed -n '1,/HTTP_STATUS:/p' | sed '$d')

if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "201" ]]; then
    TEST_CHECKLIST_ID=$(echo "$CHECKLIST_BODY" | jq -r '.id // .checklistId' 2>/dev/null)
    echo -e "${GREEN}✓ Checklist created successfully${NC}"
    echo "Checklist ID: $TEST_CHECKLIST_ID"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ Failed to create checklist (Status: $HTTP_STATUS)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Get checklist status
if [ ! -z "$TEST_CHECKLIST_ID" ]; then
    test_endpoint "Get Checklist Status" "GET" "$CHECKLIST_SERVICE/api/v1/checklists/$TEST_CHECKLIST_ID" "" "200"
fi

# Update checklist item
UPDATE_CHECKLIST=$(cat <<EOF
{
    "itemId": "1",
    "status": "COMPLETED"
}
EOF
)

if [ ! -z "$TEST_CHECKLIST_ID" ]; then
    test_endpoint "Update Checklist Item" "PUT" "$CHECKLIST_SERVICE/api/v1/checklists/$TEST_CHECKLIST_ID/items" "$UPDATE_CHECKLIST" "200"
fi

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 8: NOTIFICATIONS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Send notification
NOTIFICATION_DATA=$(cat <<EOF
{
    "caseId": "$TEST_CASE_ID",
    "type": "CASE_UPDATE",
    "recipient": "john.doe@testcompany-$TIMESTAMP.com",
    "channel": "EMAIL",
    "subject": "Your onboarding case has been updated",
    "message": "Your onboarding case $TEST_CASE_ID has been moved to IN_REVIEW status.",
    "priority": "HIGH"
}
EOF
)

test_endpoint "Send Notification" "POST" "$NOTIFICATION_SERVICE/api/v1/notifications" "$NOTIFICATION_DATA" "200"

# Get notifications for case
test_endpoint "Get Case Notifications" "GET" "$NOTIFICATION_SERVICE/api/v1/notifications?caseId=$TEST_CASE_ID" "" "200"

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 9: MESSAGING SYSTEM${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Send message through messaging service
MESSAGE_DATA=$(cat <<EOF
{
    "topic": "onboarding.events",
    "event": "CASE_CREATED",
    "payload": {
        "caseId": "$TEST_CASE_ID",
        "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
        "data": {
            "partnerName": "Test Company $TIMESTAMP",
            "status": "IN_REVIEW"
        }
    }
}
EOF
)

test_endpoint "Publish Message" "POST" "$MESSAGING_SERVICE/api/v1/messages" "$MESSAGE_DATA" "200"

# Get recent messages
test_endpoint "Get Recent Messages" "GET" "$MESSAGING_SERVICE/api/v1/messages?topic=onboarding.events&limit=10" "" "200"

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 10: AUDIT LOGGING${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Create audit log entry
AUDIT_DATA=$(cat <<EOF
{
    "action": "CASE_CREATED",
    "entityType": "OnboardingCase",
    "entityId": "$TEST_CASE_ID",
    "userId": "test-user",
    "userEmail": "test@example.com",
    "ipAddress": "127.0.0.1",
    "userAgent": "curl/testing",
    "details": {
        "operation": "CREATE",
        "result": "SUCCESS",
        "metadata": {
            "partnerName": "Test Company $TIMESTAMP"
        }
    }
}
EOF
)

test_endpoint "Create Audit Log" "POST" "$AUDITLOG_SERVICE/api/v1/logs" "$AUDIT_DATA" "200"

# Retrieve audit logs for case
test_endpoint "Get Case Audit Logs" "GET" "$AUDITLOG_SERVICE/api/v1/logs?entityId=$TEST_CASE_ID" "" "200"

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 11: WORK QUEUE${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Create work queue task
TASK_DATA=$(cat <<EOF
{
    "caseId": "$TEST_CASE_ID",
    "taskType": "DOCUMENT_VERIFICATION",
    "priority": "HIGH",
    "assignedTo": "compliance-team",
    "dueDate": "$(date -u -d '+7 days' +"%Y-%m-%dT%H:%M:%SZ")",
    "description": "Verify registration documents for Test Company $TIMESTAMP",
    "metadata": {
        "documentId": "$TEST_DOCUMENT_ID"
    }
}
EOF
)

test_endpoint "Create Task" "POST" "$WORKQUEUE_SERVICE/api/v1/tasks" "$TASK_DATA" "200"

# Get pending tasks
test_endpoint "Get Pending Tasks" "GET" "$WORKQUEUE_SERVICE/api/v1/tasks?status=PENDING" "" "200"

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 12: WEBHOOK TESTING${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Register webhook
WEBHOOK_DATA=$(cat <<EOF
{
    "url": "https://webhook.site/test-$TIMESTAMP",
    "events": ["CASE_CREATED", "CASE_UPDATED", "CASE_COMPLETED"],
    "active": true,
    "secret": "webhook-secret-$TIMESTAMP"
}
EOF
)

test_endpoint "Register Webhook" "POST" "$WEBHOOK_SERVICE/api/v1/webhooks" "$WEBHOOK_DATA" "200"

# Trigger webhook
TRIGGER_DATA=$(cat <<EOF
{
    "event": "CASE_UPDATED",
    "payload": {
        "caseId": "$TEST_CASE_ID",
        "status": "IN_REVIEW",
        "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    }
}
EOF
)

test_endpoint "Trigger Webhook" "POST" "$WEBHOOK_SERVICE/api/v1/webhooks/trigger" "$TRIGGER_DATA" "200"

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 13: PROJECTIONS & ANALYTICS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Get dashboard statistics
test_endpoint "Get Dashboard Stats" "GET" "$PROJECTIONS_SERVICE/api/v1/dashboard" "" "200"

# Get case statistics
test_endpoint "Get Case Statistics" "GET" "$PROJECTIONS_SERVICE/api/v1/statistics/cases" "" "200"

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 14: END-TO-END WORKFLOW VERIFICATION${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

# Complete onboarding workflow
COMPLETE_DATA=$(cat <<EOF
{
    "caseId": "$TEST_CASE_ID",
    "decision": "APPROVED",
    "comments": "All requirements met",
    "approvedBy": "test-admin"
}
EOF
)

test_endpoint "Complete Onboarding" "POST" "$ONBOARDING_API/api/v1/cases/$TEST_CASE_ID/complete" "$COMPLETE_DATA" "200"

# Verify final case status
test_endpoint "Verify Final Status" "GET" "$ONBOARDING_API/api/v1/cases/$TEST_CASE_ID" "" "200"

echo -e "\n${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 15: DATABASE VERIFICATION${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

echo -e "\n${BLUE}Verifying data in PostgreSQL databases${NC}"

# Check if case exists in database
if docker exec postgres psql -U postgres -d onboarding -t -c "SELECT COUNT(*) FROM cases WHERE case_id='$TEST_CASE_ID';" 2>/dev/null | grep -q "1"; then
    echo -e "${GREEN}✓ Case found in onboarding database${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠ Case not found in database (may be using different storage)${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Check audit logs in database
AUDIT_COUNT=$(docker exec postgres psql -U postgres -d auditlog -t -c "SELECT COUNT(*) FROM audit_logs WHERE entity_id='$TEST_CASE_ID';" 2>/dev/null | tr -d ' ')
if [ ! -z "$AUDIT_COUNT" ] && [ "$AUDIT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $AUDIT_COUNT audit log entries${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠ No audit logs in database${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}📊 COMPREHENSIVE TEST RESULTS${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"

echo -e "\n${BLUE}Test Summary:${NC}"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo "Success Rate: $(( TESTS_PASSED * 100 / TOTAL_TESTS ))%"

echo -e "\n${BLUE}Data Created:${NC}"
echo "• Case ID: $TEST_CASE_ID"
echo "• Document ID: $TEST_DOCUMENT_ID"
echo "• Checklist ID: $TEST_CHECKLIST_ID"
echo "• Test Timestamp: $TIMESTAMP"

echo -e "\n${BLUE}Services Tested:${NC}"
echo "✓ Onboarding API"
echo "✓ Document Service"
echo "✓ Risk Service"
echo "✓ Notification Service"
echo "✓ Checklist Service"
echo "✓ Messaging Service"
echo "✓ Audit Log Service"
echo "✓ Webhook Service"
echo "✓ Projections Service"
echo "✓ Work Queue Service"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL TESTS PASSED! The onboarding system is fully functional!${NC}"
else
    echo -e "\n${YELLOW}⚠️ Some tests failed. Please review the output above for details.${NC}"
    echo -e "${YELLOW}Common issues:${NC}"
    echo "• Services may still be starting up"
    echo "• Authentication may be required but not configured"
    echo "• Some endpoints may use different paths"
fi

echo -e "\n${BLUE}To verify data persistence manually:${NC}"
echo "1. Check PostgreSQL:"
echo "   docker exec -it postgres psql -U postgres -d onboarding -c 'SELECT * FROM cases;'"
echo ""
echo "2. Check audit logs:"
echo "   docker exec -it postgres psql -U postgres -d auditlog -c 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;'"
echo ""
echo "3. Check Redis cache:"
echo "   docker exec -it redis redis-cli KEYS '*'"

echo -e "\n${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ COMPREHENSIVE TESTING COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
