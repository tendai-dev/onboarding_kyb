-- Backfill Missing Work Items - SQL Query
-- This query identifies cases that are in Submitted status but don't have work items
-- Use this to identify cases that need work items created

-- Find cases without work items
SELECT 
    c.id as case_id,
    c.case_number,
    c.status,
    c.type,
    c.created_at,
    c.created_by,
    c.partner_id,
    c.applicant->>'first_name' as applicant_first_name,
    c.applicant->>'last_name' as applicant_last_name,
    c.applicant->>'email' as applicant_email,
    c.business->>'legal_name' as business_name,
    w.id as work_item_id,
    w.work_item_number
FROM onboarding.onboarding_cases c
LEFT JOIN work_queue.work_items w ON w.application_id = c.id
WHERE c.status = 'Submitted'
  AND w.id IS NULL
ORDER BY c.created_at DESC;

-- Count summary
SELECT 
    COUNT(*) as cases_without_work_items,
    COUNT(DISTINCT c.partner_id) as affected_partners
FROM onboarding.onboarding_cases c
LEFT JOIN work_queue.work_items w ON w.application_id = c.id
WHERE c.status = 'Submitted'
  AND w.id IS NULL;

-- Note: This script only identifies the cases. 
-- To actually create work items, use the API endpoint:
-- POST /api/v1/workqueue/admin/backfill-missing-work-items
-- Or use the C# utility script below

