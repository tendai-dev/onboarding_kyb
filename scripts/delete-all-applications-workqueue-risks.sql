-- Delete All Applications, Work Queue Items, and Risks Script
-- WARNING: This will permanently delete ALL data from the following:
--   - All applications (onboarding."Applications" and onboarding.onboarding_cases)
--   - All work queue items (work_queue schema)
--   - All risk assessments (risk schema)
-- This operation CANNOT be undone!
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f scripts/delete-all-applications-workqueue-risks.sql
--
-- Or with connection string:
--   psql "Host=127.0.0.1;Port=5433;Database=kyb_case;Username=postgres;Password=postgres" -f scripts/delete-all-applications-workqueue-risks.sql

-- First, let's see what we have
SELECT 'Applications (old table)' as table_name, COUNT(*) as count FROM onboarding."Applications"
UNION ALL
SELECT 'Onboarding Cases' as table_name, COUNT(*) as count FROM onboarding.onboarding_cases
UNION ALL
SELECT 'Case Projections' as table_name, COUNT(*) as count FROM projections.onboarding_case_projections
UNION ALL
SELECT 'Work Item Comments' as table_name, COUNT(*) as count FROM work_queue.work_item_comments
UNION ALL
SELECT 'Work Item History' as table_name, COUNT(*) as count FROM work_queue.work_item_history
UNION ALL
SELECT 'Work Items' as table_name, COUNT(*) as count FROM work_queue.work_items
UNION ALL
SELECT 'Risk Factors' as table_name, COUNT(*) as count FROM risk.risk_factors
UNION ALL
SELECT 'Risk Assessments' as table_name, COUNT(*) as count FROM risk.risk_assessments;

-- Show sample data (first 3 from each main table)
SELECT 'Sample Applications (old table):' as info;
SELECT id, email, "ApplicantName" as applicant_name, "UserId" as user_id
FROM onboarding."Applications"
ORDER BY id
LIMIT 3;

SELECT 'Sample Onboarding Cases:' as info;
SELECT id, case_number, status, partner_id
FROM onboarding.onboarding_cases
ORDER BY created_at DESC
LIMIT 3;

SELECT 'Sample Work Items:' as info;
SELECT id, work_item_number, application_id, status, risk_level
FROM work_queue.work_items
ORDER BY created_at DESC
LIMIT 3;

SELECT 'Sample Risk Assessments:' as info;
SELECT id, case_id, partner_id, overall_risk_level, risk_score, status
FROM risk.risk_assessments
ORDER BY created_at DESC
LIMIT 3;

-- ============================================
-- ACTUAL DELETION
-- ============================================
-- WARNING: This will DELETE ALL DATA!

-- Delete in order to respect foreign key constraints:

-- 1. Delete child tables first (work queue related)
DELETE FROM work_queue.work_item_comments;
DELETE FROM work_queue.work_item_history;

-- 2. Delete work items
DELETE FROM work_queue.work_items;

-- 3. Delete risk factors (child of risk assessments)
DELETE FROM risk.risk_factors;

-- 4. Delete risk assessments
DELETE FROM risk.risk_assessments;

-- 5. Delete case projections
DELETE FROM projections.onboarding_case_projections;

-- 6. Delete onboarding cases (main application table)
DELETE FROM onboarding.onboarding_cases;

-- 7. Delete old applications table
DELETE FROM onboarding."Applications";

-- ============================================
-- VERIFICATION (After deletion)
-- ============================================
-- After deletion, verify all tables are empty:
SELECT 'Applications (old table)' as table_name, COUNT(*) as count FROM onboarding."Applications"
UNION ALL
SELECT 'Onboarding Cases' as table_name, COUNT(*) as count FROM onboarding.onboarding_cases
UNION ALL
SELECT 'Case Projections' as table_name, COUNT(*) as count FROM projections.onboarding_case_projections
UNION ALL
SELECT 'Work Item Comments' as table_name, COUNT(*) as count FROM work_queue.work_item_comments
UNION ALL
SELECT 'Work Item History' as table_name, COUNT(*) as count FROM work_queue.work_item_history
UNION ALL
SELECT 'Work Items' as table_name, COUNT(*) as count FROM work_queue.work_items
UNION ALL
SELECT 'Risk Factors' as table_name, COUNT(*) as count FROM risk.risk_factors
UNION ALL
SELECT 'Risk Assessments' as table_name, COUNT(*) as count FROM risk.risk_assessments;

