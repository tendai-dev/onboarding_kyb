-- Delete All Data Script (Applications, Work Queue, Risks, Messages)
-- WARNING: This will permanently delete ALL data from the following:
--   - All applications (onboarding."Applications" and onboarding.onboarding_cases)
--   - All work queue items (work_queue schema)
--   - All risk assessments (risk schema)
--   - All messages (messaging schema)
-- This operation CANNOT be undone!
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f scripts/delete-all-data.sql
--
-- Or with connection string:
--   psql "Host=127.0.0.1;Port=5433;Database=kyb_case;Username=postgres;Password=postgres" -f scripts/delete-all-data.sql

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
SELECT 'Risk Assessments' as table_name, COUNT(*) as count FROM risk.risk_assessments
UNION ALL
SELECT 'Message Attachments' as table_name, COUNT(*) as count FROM messaging.message_attachments
UNION ALL
SELECT 'Messages' as table_name, COUNT(*) as count FROM messaging.messages
UNION ALL
SELECT 'Message Threads' as table_name, COUNT(*) as count FROM messaging.message_threads;

-- ============================================
-- ACTUAL DELETION
-- ============================================
-- Delete in order to respect foreign key constraints:

-- 1. Delete message attachments first (child of messages)
DELETE FROM messaging.message_attachments;

-- 2. Delete messages (child of message_threads)
DELETE FROM messaging.messages;

-- 3. Delete message threads
DELETE FROM messaging.message_threads;

-- 4. Delete work item comments (child of work items)
DELETE FROM work_queue.work_item_comments;

-- 5. Delete work item history (child of work items)
DELETE FROM work_queue.work_item_history;

-- 6. Delete work items
DELETE FROM work_queue.work_items;

-- 7. Delete risk factors (child of risk assessments)
DELETE FROM risk.risk_factors;

-- 8. Delete risk assessments
DELETE FROM risk.risk_assessments;

-- 9. Delete case projections
DELETE FROM projections.onboarding_case_projections;

-- 10. Delete onboarding cases (main application table)
DELETE FROM onboarding.onboarding_cases;

-- 11. Delete old applications table
DELETE FROM onboarding."Applications";

-- ============================================
-- VERIFICATION (After deletion)
-- ============================================
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
SELECT 'Risk Assessments' as table_name, COUNT(*) as count FROM risk.risk_assessments
UNION ALL
SELECT 'Message Attachments' as table_name, COUNT(*) as count FROM messaging.message_attachments
UNION ALL
SELECT 'Messages' as table_name, COUNT(*) as count FROM messaging.messages
UNION ALL
SELECT 'Message Threads' as table_name, COUNT(*) as count FROM messaging.message_threads;

