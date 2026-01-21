-- Fix partnerId mismatch for case OBC-20251220-68499
-- The case was created with UUID v5 partnerId but should use MD5 partnerId
-- 
-- User: tendai@kurasika.tech
-- Wrong partnerId (UUID v5): 79f40044-4b65-1bc0-353d-2fc8c2727c20
-- Correct partnerId (MD5): 5fba9233-29d2-ded4-407e-1696d26b19a1

-- First, verify the case exists and show current state
SELECT 
    "Id" as case_id,
    "CaseNumber" as case_number,
    "PartnerId" as current_partner_id,
    "ApplicantEmail" as applicant_email,
    "Status" as status,
    "CreatedAt" as created_at
FROM "OnboardingCases"
WHERE "CaseNumber" = 'OBC-20251220-68499'
   OR "Id" = '06f145d5-bf3d-4e3f-8a33-0259752ea231';

-- Update the partnerId to the correct MD5-generated value
UPDATE "OnboardingCases"
SET "PartnerId" = '5fba9233-29d2-ded4-407e-1696d26b19a1'
WHERE "CaseNumber" = 'OBC-20251220-68499'
  AND "PartnerId" = '79f40044-4b65-1bc0-353d-2fc8c2727c20';

-- Also update the projections table if it exists
UPDATE "CaseProjections"
SET "PartnerId" = '5fba9233-29d2-ded4-407e-1696d26b19a1'
WHERE "CaseNumber" = 'OBC-20251220-68499'
  AND "PartnerId" = '79f40044-4b65-1bc0-353d-2fc8c2727c20';

-- Verify the update
SELECT 
    "Id" as case_id,
    "CaseNumber" as case_number,
    "PartnerId" as updated_partner_id,
    "ApplicantEmail" as applicant_email,
    "Status" as status
FROM "OnboardingCases"
WHERE "CaseNumber" = 'OBC-20251220-68499';
