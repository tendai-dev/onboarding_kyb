#!/bin/bash

# Diagnostic script to check work items with "Unknown" values
# This script will help identify why work items show "Unknown Applicant"

echo "=========================================="
echo "Work Item 'Unknown' Diagnostic Script"
echo "=========================================="
echo ""

# Database connection details (adjust if needed)
DB_HOST="${POSTGRES_HOST:-127.0.0.1}"
DB_PORT="${POSTGRES_PORT:-5433}"
DB_NAME="${POSTGRES_DB:-kyb_case}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

echo "Database Connection:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql command not found. Please install PostgreSQL client tools."
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Set password via environment variable
export PGPASSWORD="$DB_PASSWORD"

echo "=========================================="
echo "Step 1: Checking work items with 'Unknown' values"
echo "=========================================="
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    wi.id as work_item_id,
    wi.work_item_number,
    wi.application_id,
    wi.applicant_name,
    wi.business_name,
    wi.entity_type,
    wi.status,
    wi.created_at
FROM work_queue.work_items wi
WHERE wi.applicant_name ILIKE '%unknown%' 
   OR wi.business_name IS NULL 
   OR wi.business_name = ''
ORDER BY wi.created_at DESC
LIMIT 10;
"

echo ""
echo "=========================================="
echo "Step 2: Checking if cases exist for these work items"
echo "=========================================="
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    wi.id as work_item_id,
    wi.work_item_number,
    wi.application_id,
    wi.applicant_name as work_item_applicant_name,
    wi.business_name as work_item_business_name,
    oc.id as case_id,
    oc.case_number,
    oc.applicant_first_name,
    oc.applicant_last_name,
    oc.business_legal_name,
    CASE 
        WHEN oc.id IS NULL THEN '❌ CASE NOT FOUND'
        WHEN oc.applicant_first_name IS NULL OR oc.applicant_first_name = '' THEN '⚠️  APPLICANT DATA MISSING'
        WHEN oc.business_legal_name IS NULL OR oc.business_legal_name = '' THEN '⚠️  BUSINESS DATA MISSING'
        ELSE '✅ DATA AVAILABLE'
    END as data_status
FROM work_queue.work_items wi
LEFT JOIN onboarding.onboarding_cases oc ON oc.id = wi.application_id
WHERE wi.applicant_name ILIKE '%unknown%' 
   OR wi.business_name IS NULL 
   OR wi.business_name = ''
ORDER BY wi.created_at DESC
LIMIT 10;
"

echo ""
echo "=========================================="
echo "Step 3: Checking specific work item (8BB3A8B4-9)"
echo "=========================================="
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    wi.id as work_item_id,
    wi.work_item_number,
    wi.application_id,
    wi.applicant_name as work_item_applicant,
    wi.business_name as work_item_business,
    oc.id as case_id,
    oc.case_number,
    oc.applicant_first_name,
    oc.applicant_last_name,
    CONCAT(oc.applicant_first_name, ' ', oc.applicant_last_name) as case_applicant_full_name,
    oc.business_legal_name as case_business_name,
    oc.type as case_type,
    oc.status as case_status
FROM work_queue.work_items wi
LEFT JOIN onboarding.onboarding_cases oc ON oc.id = wi.application_id
WHERE wi.work_item_number LIKE '%8BB3A8B4%'
   OR wi.work_item_number = '8BB3A8B4-9';
"

echo ""
echo "=========================================="
echo "Step 4: Checking all work items and their case status"
echo "=========================================="
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    COUNT(*) as total_work_items,
    COUNT(CASE WHEN oc.id IS NOT NULL THEN 1 END) as work_items_with_cases,
    COUNT(CASE WHEN oc.id IS NULL THEN 1 END) as work_items_without_cases,
    COUNT(CASE WHEN wi.applicant_name ILIKE '%unknown%' THEN 1 END) as work_items_with_unknown_applicant,
    COUNT(CASE WHEN wi.business_name IS NULL OR wi.business_name = '' THEN 1 END) as work_items_without_business_name
FROM work_queue.work_items wi
LEFT JOIN onboarding.onboarding_cases oc ON oc.id = wi.application_id;
"

echo ""
echo "=========================================="
echo "Step 5: Sample case data (first 3 cases)"
echo "=========================================="
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    oc.id,
    oc.case_number,
    oc.type,
    oc.applicant_first_name,
    oc.applicant_last_name,
    CONCAT(oc.applicant_first_name, ' ', oc.applicant_last_name) as full_name,
    oc.business_legal_name,
    oc.status,
    oc.created_at
FROM onboarding.onboarding_cases oc
ORDER BY oc.created_at DESC
LIMIT 3;
"

echo ""
echo "=========================================="
echo "Diagnostic Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. If 'CASE NOT FOUND' appears: The work item's ApplicationId doesn't match any case"
echo "2. If 'APPLICANT DATA MISSING': The case exists but has no applicant name data"
echo "3. If 'BUSINESS DATA MISSING': The case exists but has no business name data"
echo "4. Check the backend logs for detailed error messages"
echo ""

# Unset password
unset PGPASSWORD

