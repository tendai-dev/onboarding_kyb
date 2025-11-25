-- Complete KYB Requirements Seed Script
-- This script creates all entity types, requirements, and their relationships
-- Based on the comprehensive KYB requirements documentation

-- ============================================================================
-- STEP 1: Ensure Entity Types Exist
-- ============================================================================

INSERT INTO entity_configuration.entity_types ("Id", code, display_name, description, icon, is_active, created_at, updated_at)
VALUES
  -- 1. PRIVATE COMPANY / LIMITED LIABILITY COMPANY
  (gen_random_uuid(), 'PRIVATE_COMPANY', 'Private Company / Limited Liability Company', 'A privately held business entity with limited liability', 'FiBriefcase', true, NOW(), NOW()),
  
  -- 2. PUBLICLY LISTED ENTITY (also handles PUBLIC_COMPANY for backward compatibility)
  (gen_random_uuid(), 'PUBLIC_COMPANY', 'Publicly Listed Entity', 'A publicly traded company listed on a stock exchange', 'FiTrendingUp', true, NOW(), NOW()),
  
  -- 3. GOVERNMENT / STATE-OWNED ENTITY / ORGAN OF STATE
  (gen_random_uuid(), 'GOVERNMENT_ENTITY', 'Government / State-Owned Entity / Organ of State', 'A government or state-owned entity', 'FiShield', true, NOW(), NOW()),
  
  -- 4. NON-PROFIT ORGANISATION / NGO / PVO (also handles NGO for backward compatibility)
  (gen_random_uuid(), 'NGO', 'Non-Profit Organisation / NGO / PVO', 'A non-profit organization operating independently of government', 'FiHeart', true, NOW(), NOW()),
  
  -- 5. NON-REGISTERED ASSOCIATION / SOCIETY / CHARITY / FOUNDATION (also handles ASSOCIATION for backward compatibility)
  (gen_random_uuid(), 'ASSOCIATION', 'Non-Registered Association / Society / Charity / Foundation', 'An unregistered association, society, charity, or foundation', 'FiUsers', true, NOW(), NOW()),
  
  -- 6. TRUST
  (gen_random_uuid(), 'TRUST', 'Trust', 'A legal arrangement where assets are held by a trustee', 'FiShield', true, NOW(), NOW()),
  
  -- 7. SUPRANATIONAL / INTER-GOVERNMENTAL / SOVEREIGN
  (gen_random_uuid(), 'SUPRANATIONAL', 'Supranational / Inter-Governmental / Sovereign', 'International organizations and sovereign entities', 'FiGlobe', true, NOW(), NOW()),
  
  -- 8. SOLE PROPRIETOR (also handles SOLE_PROPRIETORSHIP for backward compatibility)
  (gen_random_uuid(), 'SOLE_PROPRIETORSHIP', 'Sole Proprietor', 'A business owned and operated by a single individual', 'FiUser', true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- STEP 2: Create All Requirements (Information Fields)
-- ============================================================================

INSERT INTO entity_configuration.requirements ("Id", code, display_name, description, type, field_type, validation_rules, help_text, is_active, created_at, updated_at)
VALUES
-- Information Requirements
(gen_random_uuid(), 'REGISTERED_LEGAL_NAME', 'Registered / Legal Name', 'Official registered name of the entity', 'INFORMATION', 'Text', '{"minLength":2,"maxLength":200}', NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'REGISTRATION_NUMBER', 'Registration Number', 'Official registration or incorporation number', 'INFORMATION', 'Text', '{"minLength":5,"maxLength":50,"pattern":"^[A-Z0-9-]+$"}', NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'DATE_OF_REGISTRATION', 'Date of Registration', 'Date when the entity was registered', 'INFORMATION', 'Date', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'DATE_OF_ESTABLISHMENT', 'Date of Establishment', 'Date when the entity was established', 'INFORMATION', 'Date', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'COUNTRY_OF_INCORPORATION', 'Country of Incorporation', 'Country where the entity was incorporated', 'INFORMATION', 'Country', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'COUNTRY', 'Country', 'Country of operation or establishment', 'INFORMATION', 'Country', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'TRADING_OPERATING_NAME', 'Trading/Operating Name', 'Trading or operating name if different from legal name', 'INFORMATION', 'Text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'REGISTERED_ADDRESS', 'Registered Address', 'Official registered address of the entity', 'INFORMATION', 'Address', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'OPERATING_ADDRESS', 'Operating / Head Office Address', 'Operating or head office address if different from registered address', 'INFORMATION', 'Address', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'ADDRESS', 'Address', 'Physical address of the entity', 'INFORMATION', 'Address', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'BOARD_OF_DIRECTORS', 'Board of Directors', 'Full names of Board of Directors', 'INFORMATION', 'Textarea', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'EXECUTIVE_DIRECTORS', 'List of Executive Directors', 'List of executive directors or senior officials', 'INFORMATION', 'Textarea', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'OWNERSHIP_CONTROL_STRUCTURE', 'Ownership & Control Structure', 'Ownership and control structure of the entity', 'INFORMATION', 'Textarea', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'SHAREHOLDERS_25_PERCENT', 'Shareholders ≥25%', 'Individuals with ≥25% shareholding / voting rights', 'INFORMATION', 'Textarea', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'AUTHORISED_PERSONS', 'Authorised Persons', 'Identity of all authorised persons', 'INFORMATION', 'Textarea', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_AUTHORITY', 'Proof of Authority', 'Proof of authority for mandated persons (if EPP)', 'INFORMATION', 'File', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'KEY_CONTROLLERS', 'Key Controllers', 'Key controllers (trustees / exec members)', 'INFORMATION', 'Textarea', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'TRUSTEES_FOUNDERS_BENEFICIARIES', 'Trustees, Founders & Beneficiaries', 'All trustees, founders and beneficiaries', 'INFORMATION', 'Textarea', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'TRUST_NAME', 'Trust Name', 'Name of the trust', 'INFORMATION', 'Text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'TRUST_NUMBER', 'Trust Number', 'Registration number of the trust', 'INFORMATION', 'Text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'TYPE_OF_TRUST', 'Type of Trust', 'Type or category of the trust', 'INFORMATION', 'Text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'NAME_OF_ASSOCIATION', 'Name of Association', 'Name of the association, society, charity, or foundation', 'INFORMATION', 'Text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'GOVERNING_DOCUMENT_CONSTITUTION', 'Governing Document / Constitution', 'Governing document, constitution, or mission statement', 'INFORMATION', 'Textarea', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'MISSION_STATEMENT', 'Mission Statement', 'Mission statement or charter of the organization', 'INFORMATION', 'Textarea', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'INDIVIDUALS_MANAGING_ENTITY', 'Individuals Managing the Entity', 'Individuals responsible for managing the entity', 'INFORMATION', 'Textarea', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_INCOME', 'Proof of Income', 'Proof of income or business bank statements', 'INFORMATION', 'File', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_LISTING', 'Proof of Listing', 'Proof that the entity is listed on a stock exchange', 'INFORMATION', 'File', NULL, NULL, true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  field_type = EXCLUDED.field_type,
  updated_at = NOW();

-- ============================================================================
-- STEP 3: Create All Requirements (Supporting Documentation)
-- ============================================================================

INSERT INTO entity_configuration.requirements ("Id", code, display_name, description, type, field_type, validation_rules, help_text, is_active, created_at, updated_at)
VALUES
-- Documentation Requirements
(gen_random_uuid(), 'COMPANY_REGISTRATION_DOCS', 'Company Registration Documents', 'Registration Certificate / Certificate of Incorporation', 'DOCUMENTATION', 'File', NULL, 'Registration Certificate / Certificate of Incorporation', true, NOW(), NOW()),
(gen_random_uuid(), 'CERTIFICATE_INCORPORATION', 'Certificate of Incorporation', 'Official certificate of incorporation document', 'DOCUMENTATION', 'File', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_TRADING_NAME', 'Proof of Trading Name', 'Letterhead, business invoice, website extract', 'DOCUMENTATION', 'File', NULL, 'Letterhead, business invoice, website extract', true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_ADDRESS', 'Proof of Address', 'Lease, utility bill, bank statement, municipal bill (<3 months)', 'DOCUMENTATION', 'File', NULL, 'Lease, utility bill, bank statement, municipal bill (<3 months)', true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_OPERATING_ADDRESS', 'Proof of Operating Address', 'Same as proof of address, or Site Visit Report', 'DOCUMENTATION', 'File', NULL, 'Same as proof of address, or Site Visit Report', true, NOW(), NOW()),
(gen_random_uuid(), 'DIRECTORS_LIST', 'Directors List', 'Annual report, financial statements, company register', 'DOCUMENTATION', 'File', NULL, 'Annual report, financial statements, company register', true, NOW(), NOW()),
(gen_random_uuid(), 'OWNERSHIP_STRUCTURE_DOCS', 'Ownership Structure Documents', 'MOI, Share Register / Certificates, authorised letter', 'DOCUMENTATION', 'File', NULL, 'MOI, Share Register / Certificates, authorised letter', true, NOW(), NOW()),
(gen_random_uuid(), 'ID_DOCUMENTS', 'ID Documents', 'Clear valid ID/passport for shareholders & authorised persons', 'DOCUMENTATION', 'File', NULL, 'Clear valid ID/passport for shareholders & authorised persons', true, NOW(), NOW()),
(gen_random_uuid(), 'MANDATE_RESOLUTION', 'Mandate / Resolution', 'Signed by executive director', 'DOCUMENTATION', 'File', NULL, 'Signed by executive director', true, NOW(), NOW()),
(gen_random_uuid(), 'GOVERNING_DOCUMENT', 'Governing Document / Constitution', 'Constitution or bylaws of the organization', 'DOCUMENTATION', 'File', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'NPO_NGO_CERTIFICATE', 'NPO/NGO Certificate', 'Valid NPO/NGO certificate or licence', 'DOCUMENTATION', 'File', NULL, 'Valid NPO/NGO certificate or licence', true, NOW(), NOW()),
(gen_random_uuid(), 'TRUST_DEED', 'Trust Deed', 'Legal trust deed document', 'DOCUMENTATION', 'File', NULL, 'Trust deed, Appointment letters, Extract listing trustees/founders/beneficiaries', true, NOW(), NOW()),
(gen_random_uuid(), 'TRUST_RESOLUTION', 'Trust Resolution', 'Trust resolution / Power of attorney', 'DOCUMENTATION', 'File', NULL, 'Trust resolution / Power of attorney', true, NOW(), NOW()),
(gen_random_uuid(), 'CONSTITUTIONAL_DOCUMENT', 'Constitutional Document', 'Constitutional / founding document of organisation', 'DOCUMENTATION', 'File', NULL, 'Reliable website reference OR Third-party document confirming existence', true, NOW(), NOW()),
(gen_random_uuid(), 'ESTABLISHMENT_DOCS', 'Registration / Establishment Documents', 'Certificate of incorporation / MOI, Act of Parliament, Other official governing documents', 'DOCUMENTATION', 'File', NULL, 'Certificate of incorporation / MOI, Act of Parliament, Other official governing documents', true, NOW(), NOW()),
(gen_random_uuid(), 'AML_POLICY', 'AML Policy', 'Anti-Money Laundering policy document', 'DOCUMENTATION', 'File', NULL, 'For Financial Institutions only', true, NOW(), NOW()),
(gen_random_uuid(), 'ANTI_BRIBERY_POLICY', 'Anti-Bribery Policy', 'Anti-bribery policy document', 'DOCUMENTATION', 'File', NULL, 'For Financial Institutions only', true, NOW(), NOW()),
(gen_random_uuid(), 'SANCTIONS_POLICY', 'Sanctions Policy', 'Sanctions policy document', 'DOCUMENTATION', 'File', NULL, 'For Financial Institutions only', true, NOW(), NOW()),
(gen_random_uuid(), 'RELEVANT_LICENCE', 'Relevant Licence', 'Banking / Insurance / ADLA licence', 'DOCUMENTATION', 'File', NULL, 'Banking / Insurance / ADLA licence', true, NOW(), NOW()),
(gen_random_uuid(), 'WOLFSBERG_QUESTIONNAIRE', 'Wolfsberg Questionnaire', 'Wolfsberg Questionnaire for Financial Institutions', 'DOCUMENTATION', 'File', NULL, 'For Financial Institutions only', true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  field_type = EXCLUDED.field_type,
  updated_at = NOW();

-- ============================================================================
-- STEP 4: Link Requirements to Entity Types
-- ============================================================================

-- 1. PRIVATE COMPANY / LIMITED LIABILITY COMPANY (26 requirements)
INSERT INTO entity_configuration.entity_type_requirements ("Id", entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'PRIVATE_COMPANY'),
    (SELECT "Id" FROM entity_configuration.requirements WHERE code = req_code),
    is_req,
    display_ord,
    NOW(),
    NOW()
FROM (VALUES
    -- Information Required
    ('REGISTERED_LEGAL_NAME', true, 1),
    ('REGISTRATION_NUMBER', true, 2),
    ('DATE_OF_REGISTRATION', true, 3),
    ('COUNTRY_OF_INCORPORATION', true, 4),
    ('TRADING_OPERATING_NAME', false, 5),
    ('REGISTERED_ADDRESS', true, 6),
    ('OPERATING_ADDRESS', false, 7),
    ('BOARD_OF_DIRECTORS', true, 8),
    ('OWNERSHIP_CONTROL_STRUCTURE', true, 9),
    ('SHAREHOLDERS_25_PERCENT', true, 10),
    ('AUTHORISED_PERSONS', true, 11),
    ('PROOF_OF_AUTHORITY', true, 12),
    -- Supporting Documentation
    ('COMPANY_REGISTRATION_DOCS', true, 13),
    ('CERTIFICATE_INCORPORATION', true, 14),
    ('PROOF_OF_TRADING_NAME', false, 15),
    ('PROOF_OF_ADDRESS', true, 16),
    ('PROOF_OF_OPERATING_ADDRESS', false, 17),
    ('DIRECTORS_LIST', true, 18),
    ('OWNERSHIP_STRUCTURE_DOCS', true, 19),
    ('ID_DOCUMENTS', true, 20),
    ('MANDATE_RESOLUTION', true, 21),
    -- Financial Institution Requirements (optional)
    ('AML_POLICY', false, 22),
    ('ANTI_BRIBERY_POLICY', false, 23),
    ('SANCTIONS_POLICY', false, 24),
    ('RELEVANT_LICENCE', false, 25),
    ('WOLFSBERG_QUESTIONNAIRE', false, 26)
) AS links(req_code, is_req, display_ord)
WHERE NOT EXISTS (
    SELECT 1 FROM entity_configuration.entity_type_requirements etr
    WHERE etr.entity_type_id = (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'PRIVATE_COMPANY')
    AND etr.requirement_id = (SELECT "Id" FROM entity_configuration.requirements WHERE code = links.req_code)
);

-- 2. PUBLICLY LISTED ENTITY (7 requirements)
INSERT INTO entity_configuration.entity_type_requirements ("Id", entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'PUBLIC_COMPANY'),
    (SELECT "Id" FROM entity_configuration.requirements WHERE code = req_code),
    is_req,
    display_ord,
    NOW(),
    NOW()
FROM (VALUES
    ('PROOF_OF_LISTING', true, 1),
    ('EXECUTIVE_DIRECTORS', true, 2),
    ('AUTHORISED_PERSONS', true, 3),
    ('PROOF_OF_AUTHORITY', true, 4),
    ('DIRECTORS_LIST', true, 5),
    ('ID_DOCUMENTS', true, 6),
    ('MANDATE_RESOLUTION', true, 7)
) AS links(req_code, is_req, display_ord)
WHERE NOT EXISTS (
    SELECT 1 FROM entity_configuration.entity_type_requirements etr
    WHERE etr.entity_type_id = (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'PUBLIC_COMPANY')
    AND etr.requirement_id = (SELECT "Id" FROM entity_configuration.requirements WHERE code = links.req_code)
);

-- 3. GOVERNMENT / STATE-OWNED ENTITY / ORGAN OF STATE (12 requirements)
INSERT INTO entity_configuration.entity_type_requirements ("Id", entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'GOVERNMENT_ENTITY'),
    (SELECT "Id" FROM entity_configuration.requirements WHERE code = req_code),
    is_req,
    display_ord,
    NOW(),
    NOW()
FROM (VALUES
    ('REGISTERED_LEGAL_NAME', true, 1),
    ('REGISTRATION_NUMBER', true, 2),
    ('DATE_OF_ESTABLISHMENT', true, 3),
    ('COUNTRY', true, 4),
    ('EXECUTIVE_DIRECTORS', true, 5),
    ('AUTHORISED_PERSONS', true, 6),
    ('PROOF_OF_AUTHORITY', true, 7),
    ('ESTABLISHMENT_DOCS', true, 8),
    ('DIRECTORS_LIST', true, 9),
    ('ID_DOCUMENTS', true, 10),
    ('MANDATE_RESOLUTION', true, 11),
    ('CONSTITUTIONAL_DOCUMENT', false, 12)
) AS links(req_code, is_req, display_ord)
WHERE NOT EXISTS (
    SELECT 1 FROM entity_configuration.entity_type_requirements etr
    WHERE etr.entity_type_id = (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'GOVERNMENT_ENTITY')
    AND etr.requirement_id = (SELECT "Id" FROM entity_configuration.requirements WHERE code = links.req_code)
);

-- 4. NON-PROFIT ORGANISATION / NGO / PVO (19 requirements)
INSERT INTO entity_configuration.entity_type_requirements ("Id", entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'NGO'),
    (SELECT "Id" FROM entity_configuration.requirements WHERE code = req_code),
    is_req,
    display_ord,
    NOW(),
    NOW()
FROM (VALUES
    ('REGISTERED_LEGAL_NAME', true, 1),
    ('REGISTRATION_NUMBER', true, 2),
    ('GOVERNING_DOCUMENT_CONSTITUTION', true, 3),
    ('NPO_NGO_CERTIFICATE', true, 4),
    ('TRADING_OPERATING_NAME', false, 5),
    ('REGISTERED_ADDRESS', true, 6),
    ('OPERATING_ADDRESS', false, 7),
    ('KEY_CONTROLLERS', true, 8),
    ('SHAREHOLDERS_25_PERCENT', false, 9),
    ('INDIVIDUALS_MANAGING_ENTITY', false, 10),
    ('AUTHORISED_PERSONS', true, 11),
    ('PROOF_OF_AUTHORITY', true, 12),
    ('COMPANY_REGISTRATION_DOCS', true, 13),
    ('PROOF_OF_TRADING_NAME', false, 14),
    ('PROOF_OF_ADDRESS', true, 15),
    ('PROOF_OF_OPERATING_ADDRESS', false, 16),
    ('DIRECTORS_LIST', true, 17),
    ('ID_DOCUMENTS', true, 18),
    ('MANDATE_RESOLUTION', true, 19)
) AS links(req_code, is_req, display_ord)
WHERE NOT EXISTS (
    SELECT 1 FROM entity_configuration.entity_type_requirements etr
    WHERE etr.entity_type_id = (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'NGO')
    AND etr.requirement_id = (SELECT "Id" FROM entity_configuration.requirements WHERE code = links.req_code)
);

-- 5. NON-REGISTERED ASSOCIATION / SOCIETY / CHARITY / FOUNDATION (10 requirements)
INSERT INTO entity_configuration.entity_type_requirements ("Id", entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'ASSOCIATION'),
    (SELECT "Id" FROM entity_configuration.requirements WHERE code = req_code),
    is_req,
    display_ord,
    NOW(),
    NOW()
FROM (VALUES
    ('NAME_OF_ASSOCIATION', true, 1),
    ('GOVERNING_DOCUMENT_CONSTITUTION', true, 2),
    ('MISSION_STATEMENT', false, 3),
    ('ADDRESS', true, 4),
    ('KEY_CONTROLLERS', true, 5),
    ('INDIVIDUALS_MANAGING_ENTITY', true, 6),
    ('AUTHORISED_PERSONS', true, 7),
    ('PROOF_OF_AUTHORITY', true, 8),
    ('PROOF_OF_ADDRESS', true, 9),
    ('DIRECTORS_LIST', false, 10),
    ('ID_DOCUMENTS', true, 11),
    ('MANDATE_RESOLUTION', true, 12)
) AS links(req_code, is_req, display_ord)
WHERE NOT EXISTS (
    SELECT 1 FROM entity_configuration.entity_type_requirements etr
    WHERE etr.entity_type_id = (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'ASSOCIATION')
    AND etr.requirement_id = (SELECT "Id" FROM entity_configuration.requirements WHERE code = links.req_code)
);

-- 6. TRUST (16 requirements)
INSERT INTO entity_configuration.entity_type_requirements ("Id", entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'TRUST'),
    (SELECT "Id" FROM entity_configuration.requirements WHERE code = req_code),
    is_req,
    display_ord,
    NOW(),
    NOW()
FROM (VALUES
    ('TRUST_NAME', true, 1),
    ('TRUST_NUMBER', true, 2),
    ('DATE_OF_REGISTRATION', true, 3),
    ('COUNTRY_OF_INCORPORATION', true, 4),
    ('TYPE_OF_TRUST', true, 5),
    ('TRADING_OPERATING_NAME', false, 6),
    ('REGISTERED_ADDRESS', true, 7),
    ('OPERATING_ADDRESS', false, 8),
    ('TRUSTEES_FOUNDERS_BENEFICIARIES', true, 9),
    ('AUTHORISED_PERSONS', true, 10),
    ('PROOF_OF_AUTHORITY', true, 11),
    ('TRUST_DEED', true, 12),
    ('PROOF_OF_TRADING_NAME', false, 13),
    ('PROOF_OF_ADDRESS', true, 14),
    ('PROOF_OF_OPERATING_ADDRESS', false, 15),
    ('ID_DOCUMENTS', true, 16),
    ('TRUST_RESOLUTION', true, 17)
) AS links(req_code, is_req, display_ord)
WHERE NOT EXISTS (
    SELECT 1 FROM entity_configuration.entity_type_requirements etr
    WHERE etr.entity_type_id = (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'TRUST')
    AND etr.requirement_id = (SELECT "Id" FROM entity_configuration.requirements WHERE code = links.req_code)
);

-- 7. SUPRANATIONAL / INTER-GOVERNMENTAL / SOVEREIGN (4 requirements)
INSERT INTO entity_configuration.entity_type_requirements ("Id", entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'SUPRANATIONAL'),
    (SELECT "Id" FROM entity_configuration.requirements WHERE code = req_code),
    is_req,
    display_ord,
    NOW(),
    NOW()
FROM (VALUES
    ('AUTHORISED_PERSONS', true, 1),
    ('PROOF_OF_AUTHORITY', true, 2),
    ('CONSTITUTIONAL_DOCUMENT', true, 3),
    ('ID_DOCUMENTS', true, 4)
) AS links(req_code, is_req, display_ord)
WHERE NOT EXISTS (
    SELECT 1 FROM entity_configuration.entity_type_requirements etr
    WHERE etr.entity_type_id = (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'SUPRANATIONAL')
    AND etr.requirement_id = (SELECT "Id" FROM entity_configuration.requirements WHERE code = links.req_code)
);

-- 8. SOLE PROPRIETOR (20 requirements)
INSERT INTO entity_configuration.entity_type_requirements ("Id", entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'SOLE_PROPRIETORSHIP'),
    (SELECT "Id" FROM entity_configuration.requirements WHERE code = req_code),
    is_req,
    display_ord,
    NOW(),
    NOW()
FROM (VALUES
    ('REGISTERED_LEGAL_NAME', true, 1),
    ('REGISTRATION_NUMBER', true, 2),
    ('DATE_OF_REGISTRATION', true, 3),
    ('COUNTRY_OF_INCORPORATION', true, 4),
    ('TRADING_OPERATING_NAME', false, 5),
    ('REGISTERED_ADDRESS', true, 6),
    ('OPERATING_ADDRESS', false, 7),
    ('BOARD_OF_DIRECTORS', false, 8),
    ('SHAREHOLDERS_25_PERCENT', true, 9),
    ('AUTHORISED_PERSONS', true, 10),
    ('PROOF_OF_AUTHORITY', true, 11),
    ('PROOF_OF_INCOME', true, 12),
    ('CERTIFICATE_INCORPORATION', true, 13),
    ('PROOF_OF_TRADING_NAME', false, 14),
    ('PROOF_OF_ADDRESS', true, 15),
    ('PROOF_OF_OPERATING_ADDRESS', false, 16),
    ('DIRECTORS_LIST', false, 17),
    ('OWNERSHIP_STRUCTURE_DOCS', true, 18),
    ('ID_DOCUMENTS', true, 19),
    ('MANDATE_RESOLUTION', true, 20)
) AS links(req_code, is_req, display_ord)
WHERE NOT EXISTS (
    SELECT 1 FROM entity_configuration.entity_type_requirements etr
    WHERE etr.entity_type_id = (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'SOLE_PROPRIETORSHIP')
    AND etr.requirement_id = (SELECT "Id" FROM entity_configuration.requirements WHERE code = links.req_code)
);

-- ============================================================================
-- Summary
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'KYB Requirements Seed Complete!';
    RAISE NOTICE 'Entity Types: %', (SELECT COUNT(*) FROM entity_configuration.entity_types);
    RAISE NOTICE 'Requirements: %', (SELECT COUNT(*) FROM entity_configuration.requirements);
    RAISE NOTICE 'Entity-Requirement Links: %', (SELECT COUNT(*) FROM entity_configuration.entity_type_requirements);
END $$;

