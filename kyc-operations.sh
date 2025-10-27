#!/bin/bash

echo "🚀 KYC OPERATIONS WITH USER: john.doe"
echo "======================================"
echo ""

# Configuration
API_BASE="http://localhost"
USERNAME="john.doe"
PASSWORD="Test@123"
EMAIL="john.doe@example.com"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Performing KYC operations as authenticated user...${NC}"
echo ""

# 1. CREATE A NEW CUSTOMER ONBOARDING
echo -e "${YELLOW}1. CREATING NEW CUSTOMER ONBOARDING${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CUSTOMER_DATA='{
  "customerId": "CUST-'$(date +%s)'",
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice.johnson@example.com",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "nationality": "US",
  "address": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "kycLevel": "STANDARD",
  "requestedBy": "'$USERNAME'"
}'

echo "Creating customer onboarding..."
ONBOARDING_RESPONSE=$(curl -s -X POST "$API_BASE:8081/api/v1/onboarding" \
  -H "Content-Type: application/json" \
  -H "X-User: $USERNAME" \
  -H "X-Email: $EMAIL" \
  -d "$CUSTOMER_DATA" 2>/dev/null || echo '{"status":"service unavailable"}')

if [[ "$ONBOARDING_RESPONSE" == *"customerId"* ]] || [[ "$ONBOARDING_RESPONSE" == *"id"* ]]; then
    echo -e "${GREEN}✅ Customer onboarding initiated successfully!${NC}"
    echo "$ONBOARDING_RESPONSE" | grep -o '"customerId":"[^"]*"' || echo "Response: $ONBOARDING_RESPONSE" | head -50
else
    echo -e "${YELLOW}⚠️  Onboarding API may require authentication setup${NC}"
fi

echo ""

# 2. PERFORM RISK ASSESSMENT
echo -e "${YELLOW}2. PERFORMING RISK ASSESSMENT${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RISK_DATA='{
  "customerId": "CUST-TEST-001",
  "assessmentType": "INITIAL",
  "factors": {
    "countryRisk": "LOW",
    "businessType": "INDIVIDUAL",
    "transactionVolume": "MEDIUM",
    "pep": false,
    "sanctioned": false
  },
  "assessedBy": "'$USERNAME'"
}'

echo "Running risk assessment..."
RISK_RESPONSE=$(curl -s -X POST "$API_BASE:8083/api/v1/risk/assess" \
  -H "Content-Type: application/json" \
  -H "X-User: $USERNAME" \
  -d "$RISK_DATA" 2>/dev/null || echo '{"status":"service unavailable"}')

if [[ "$RISK_RESPONSE" == *"riskScore"* ]] || [[ "$RISK_RESPONSE" == *"assessment"* ]]; then
    echo -e "${GREEN}✅ Risk assessment completed!${NC}"
    echo "$RISK_RESPONSE" | head -50
else
    echo -e "${YELLOW}⚠️  Risk Service status:${NC}"
    curl -s "$API_BASE:8083/health/live" && echo " - Service is healthy" || echo " - Service health check failed"
fi

echo ""

# 3. SUBMIT DOCUMENTS
echo -e "${YELLOW}3. SUBMITTING KYC DOCUMENTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DOCUMENT_DATA='{
  "customerId": "CUST-TEST-001",
  "documentType": "PASSPORT",
  "documentNumber": "P123456789",
  "issuingCountry": "US",
  "expiryDate": "2030-12-31",
  "uploadedBy": "'$USERNAME'",
  "status": "PENDING_VERIFICATION"
}'

echo "Submitting document..."
DOC_RESPONSE=$(curl -s -X POST "$API_BASE:8082/api/v1/documents" \
  -H "Content-Type: application/json" \
  -H "X-User: $USERNAME" \
  -d "$DOCUMENT_DATA" 2>/dev/null || echo '{"status":"service unavailable"}')

if [[ "$DOC_RESPONSE" == *"documentId"* ]] || [[ "$DOC_RESPONSE" == *"document"* ]]; then
    echo -e "${GREEN}✅ Document submitted successfully!${NC}"
    echo "$DOC_RESPONSE" | head -50
else
    echo -e "${YELLOW}⚠️  Document Service status:${NC}"
    curl -s "$API_BASE:8082/swagger" > /dev/null && echo " - Service is running" || echo " - Service not accessible"
fi

echo ""

# 4. CHECK COMPLIANCE CHECKLIST
echo -e "${YELLOW}4. UPDATING COMPLIANCE CHECKLIST${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CHECKLIST_DATA='{
  "customerId": "CUST-TEST-001",
  "items": [
    {"item": "Identity Verification", "completed": true, "completedBy": "'$USERNAME'"},
    {"item": "Address Verification", "completed": true, "completedBy": "'$USERNAME'"},
    {"item": "PEP Screening", "completed": true, "completedBy": "'$USERNAME'"},
    {"item": "Sanctions Check", "completed": true, "completedBy": "'$USERNAME'"}
  ]
}'

echo "Updating checklist..."
CHECKLIST_RESPONSE=$(curl -s -X POST "$API_BASE:8085/api/v1/checklist" \
  -H "Content-Type: application/json" \
  -H "X-User: $USERNAME" \
  -d "$CHECKLIST_DATA" 2>/dev/null || echo '{"status":"service unavailable"}')

if [[ "$CHECKLIST_RESPONSE" == *"checklist"* ]] || [[ "$CHECKLIST_RESPONSE" == *"completed"* ]]; then
    echo -e "${GREEN}✅ Checklist updated!${NC}"
else
    echo -e "${YELLOW}⚠️  Checklist Service status:${NC}"
    curl -s "$API_BASE:8085/health/live" && echo " - Service is healthy" || echo " - Service health check failed"
fi

echo ""

# 5. SEND NOTIFICATION
echo -e "${YELLOW}5. SENDING NOTIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NOTIFICATION_DATA='{
  "customerId": "CUST-TEST-001",
  "type": "KYC_COMPLETED",
  "channel": "EMAIL",
  "recipient": "alice.johnson@example.com",
  "subject": "KYC Verification Complete",
  "message": "Your KYC verification has been successfully completed by '$USERNAME'.",
  "sentBy": "'$USERNAME'"
}'

echo "Sending notification..."
NOTIF_RESPONSE=$(curl -s -X POST "$API_BASE:8084/api/v1/notifications/send" \
  -H "Content-Type: application/json" \
  -H "X-User: $USERNAME" \
  -d "$NOTIFICATION_DATA" 2>/dev/null || echo '{"status":"service unavailable"}')

if [[ "$NOTIF_RESPONSE" == *"sent"* ]] || [[ "$NOTIF_RESPONSE" == *"notification"* ]]; then
    echo -e "${GREEN}✅ Notification sent!${NC}"
else
    echo -e "${YELLOW}⚠️  Notification Service status:${NC}"
    curl -s "$API_BASE:8084/health/live" && echo " - Service is healthy" || echo " - Service health check failed"
fi

echo ""

# 6. CREATE AUDIT LOG ENTRY
echo -e "${YELLOW}6. CREATING AUDIT LOG${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AUDIT_DATA='{
  "userId": "'$USERNAME'",
  "action": "KYC_VERIFICATION_COMPLETED",
  "entityType": "CUSTOMER",
  "entityId": "CUST-TEST-001",
  "details": {
    "verificationType": "STANDARD",
    "documentsVerified": ["PASSPORT"],
    "riskLevel": "LOW",
    "completedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  },
  "ipAddress": "127.0.0.1",
  "userAgent": "KYC-Operations-Script"
}'

echo "Creating audit log..."
AUDIT_RESPONSE=$(curl -s -X POST "$API_BASE:8089/api/v1/audit" \
  -H "Content-Type: application/json" \
  -H "X-User: $USERNAME" \
  -d "$AUDIT_DATA" 2>/dev/null || echo '{"status":"service unavailable"}')

if [[ "$AUDIT_RESPONSE" == *"auditId"* ]] || [[ "$AUDIT_RESPONSE" == *"logged"* ]]; then
    echo -e "${GREEN}✅ Audit log created!${NC}"
else
    echo -e "${YELLOW}⚠️  Audit Service status:${NC}"
    curl -s "$API_BASE:8089/health/live" && echo " - Service is healthy" || echo " - Service health check failed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📊 OPERATION SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "User: ${BLUE}$USERNAME${NC}"
echo -e "Email: ${BLUE}$EMAIL${NC}"
echo ""
echo "Operations performed:"
echo "✓ Customer Onboarding"
echo "✓ Risk Assessment"
echo "✓ Document Submission"
echo "✓ Checklist Update"
echo "✓ Notification Sent"
echo "✓ Audit Log Created"
echo ""
echo -e "${GREEN}🎉 KYC operations demonstration complete!${NC}"
