-- Diagnostic script to check work items and their associated case data
-- Run this to see if work items have matching cases and what data is available

-- 1. Check work items with "Unknown" values
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

-- 2. Check if cases exist for these work items
SELECT 
    wi.id as work_item_id,
    wi.application_id,
    wi.applicant_name as work_item_applicant_name,
    wi.business_name as work_item_business_name,
    oc.id as case_id,
    oc.case_number,
    oc.applicant_first_name,
    oc.applicant_last_name,
    oc.business_legal_name,
    CASE 
        WHEN oc.id IS NULL THEN 'CASE NOT FOUND'
        WHEN oc.applicant_first_name IS NULL OR oc.applicant_first_name = '' THEN 'APPLICANT DATA MISSING'
        WHEN oc.business_legal_name IS NULL OR oc.business_legal_name = '' THEN 'BUSINESS DATA MISSING'
        ELSE 'DATA AVAILABLE'
    END as data_status
FROM work_queue.work_items wi
LEFT JOIN onboarding.onboarding_cases oc ON oc.id = wi.application_id
WHERE wi.applicant_name ILIKE '%unknown%' 
   OR wi.business_name IS NULL 
   OR wi.business_name = ''
ORDER BY wi.created_at DESC
LIMIT 10;

-- 3. Check a specific work item by code (replace with actual code)
-- SELECT 
--     wi.id as work_item_id,
--     wi.work_item_number,
--     wi.application_id,
--     wi.applicant_name,
--     wi.business_name,
--     oc.id as case_id,
--     oc.case_number,
--     oc.applicant_first_name,
--     oc.applicant_last_name,
--     oc.business_legal_name
-- FROM work_queue.work_items wi
-- LEFT JOIN onboarding.onboarding_cases oc ON oc.id = wi.application_id
-- WHERE wi.work_item_number = '8BB3A8B4-9';

