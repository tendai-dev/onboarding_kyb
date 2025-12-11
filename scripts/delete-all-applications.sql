-- Delete All Applications Script
-- WARNING: This will permanently delete ALL applications from the database
-- This operation CANNOT be undone!
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f scripts/delete-all-applications.sql
--
-- Or with connection string:
--   psql "Host=127.0.0.1;Port=5433;Database=kyb_case;Username=postgres;Password=postgres" -f scripts/delete-all-applications.sql

-- First, let's see how many applications exist
SELECT COUNT(*) as application_count FROM onboarding."Applications";

-- Show sample applications (first 5)
SELECT 
    id,
    email,
    "ApplicantName" as applicant_name,
    "UserId" as user_id,
    "IsAnonymized" as is_anonymized
FROM onboarding."Applications"
ORDER BY id
LIMIT 5;

-- Uncomment the line below to actually delete all applications
-- DELETE FROM onboarding."Applications";

-- After deletion, verify
-- SELECT COUNT(*) as remaining_applications FROM onboarding."Applications";

