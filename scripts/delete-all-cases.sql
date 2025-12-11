-- Delete All Onboarding Cases Script
-- WARNING: This will permanently delete ALL onboarding cases from the database
-- This operation CANNOT be undone!
--
-- Usage:
--   psql "Host=127.0.0.1;Port=5433;Database=kyb_case;Username=postgres;Password=postgres" -f scripts/delete-all-cases.sql

-- First, let's see how many cases exist
SELECT COUNT(*) as case_count FROM onboarding.onboarding_cases;
SELECT COUNT(*) as projection_count FROM projections.onboarding_case_projections;

-- Show sample cases (first 5)
SELECT 
    id,
    case_number,
    status,
    partner_id,
    type
FROM onboarding.onboarding_cases
ORDER BY created_at DESC
LIMIT 5;

-- Uncomment the lines below to actually delete all cases and projections
-- DELETE FROM projections.onboarding_case_projections;
-- DELETE FROM onboarding.onboarding_cases;

-- After deletion, verify
-- SELECT COUNT(*) as remaining_cases FROM onboarding.onboarding_cases;
-- SELECT COUNT(*) as remaining_projections FROM projections.onboarding_case_projections;

