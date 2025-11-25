-- Seed Requirements and Entity Types
-- This script seeds the database with all requirements and entity types

-- First, insert all Requirements
INSERT INTO entity_configuration.requirements ("Id", code, display_name, description, type, field_type, validation_rules, help_text, is_active, created_at, updated_at)
VALUES
-- Information Requirements
(gen_random_uuid(), 'REGISTERED_LEGAL_NAME', 'Registered / Legal Name', 'Official registered name of the entity', 'INFORMATION', 'text', '{"minLength":2,"maxLength":100}', NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'REGISTRATION_NUMBER', 'Registration Number', 'Official registration or incorporation number', 'INFORMATION', 'text', '{"minLength":5,"maxLength":20,"pattern":"^[A-Z0-9-]+$"}', NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'DATE_OF_REGISTRATION', 'Date of Registration', 'Date when the entity was registered', 'INFORMATION', 'date', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'COUNTRY_OF_INCORPORATION', 'Country of Incorporation', 'Country where the entity was incorporated', 'INFORMATION', 'text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'TRADING_OPERATING_NAME', 'Trading/Operating Name', 'Trading or operating name if different from legal name', 'INFORMATION', 'text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'REGISTERED_ADDRESS', 'Registered Address', 'Official registered address of the entity', 'INFORMATION', 'text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'OPERATING_ADDRESS', 'Operating / Head Office Address', 'Operating or head office address if different from registered address', 'INFORMATION', 'text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'BOARD_OF_DIRECTORS', 'Board of Directors', 'Full names of Board of Directors', 'INFORMATION', 'text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'OWNERSHIP_CONTROL_STRUCTURE', 'Ownership & Control Structure', 'Ownership and control structure of the entity', 'INFORMATION', 'text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'SHAREHOLDERS_25_PERCENT', 'Shareholders ≥25%', 'Individuals with ≥25% shareholding / voting rights', 'INFORMATION', 'text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'AUTHORISED_PERSONS', 'Authorised Persons', 'Identity of all authorised persons', 'INFORMATION', 'text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_AUTHORITY', 'Proof of Authority', 'Proof of authority for mandated persons (if EPP)', 'INFORMATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'KEY_CONTROLLERS', 'Key Controllers', 'Key controllers (trustees / exec members)', 'INFORMATION', 'text', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'TRUSTEES_FOUNDERS_BENEFICIARIES', 'Trustees, Founders & Beneficiaries', 'All trustees, founders and beneficiaries', 'INFORMATION', 'text', NULL, NULL, true, NOW(), NOW()),

-- Documentation Requirements
(gen_random_uuid(), 'COMPANY_REGISTRATION_DOCS', 'Company Registration Documents', 'Registration Certificate / Certificate of Incorporation', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'CERTIFICATE_INCORPORATION', 'Certificate of Incorporation', 'Official certificate of incorporation document', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_TRADING_NAME', 'Proof of Trading Name', 'Letterhead, business invoice, website extract', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_ADDRESS', 'Proof of Address', 'Lease, utility bill, bank statement, municipal bill (<3 months)', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_OPERATING_ADDRESS', 'Proof of Operating Address', 'Same as proof of address, or Site Visit Report', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'DIRECTORS_LIST', 'Directors List', 'Annual report, financial statements, company register', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'OWNERSHIP_STRUCTURE_DOCS', 'Ownership Structure Documents', 'MOI, Share Register / Certificates, authorised letter', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'ID_DOCUMENTS', 'ID Documents', 'Clear valid ID/passport for shareholders & authorised persons', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'MANDATE_RESOLUTION', 'Mandate / Resolution', 'Signed by executive director', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'GOVERNING_DOCUMENT', 'Governing Document / Constitution', 'Constitution or bylaws of the organization', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'NPO_NGO_CERTIFICATE', 'NPO/NGO Certificate', 'Valid NPO/NGO certificate or licence', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'TRUST_DEED', 'Trust Deed', 'Legal trust deed document', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'TRUST_RESOLUTION', 'Trust Resolution', 'Trust resolution / Power of attorney', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'CONSTITUTIONAL_DOCUMENT', 'Constitutional Document', 'Constitutional / founding document of organisation', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_INCOME', 'Proof of Income', 'Business bank statements', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'PROOF_OF_LISTING', 'Proof of Listing', 'Stock exchange website printout', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'AML_POLICY', 'AML Policy', 'Anti-Money Laundering policy document', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'ANTI_BRIBERY_POLICY', 'Anti-Bribery Policy', 'Anti-bribery policy document', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'SANCTIONS_POLICY', 'Sanctions Policy', 'Sanctions policy document', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'RELEVANT_LICENCE', 'Relevant Licence', 'Banking / Insurance / ADLA licence', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), 'WOLFSBERG_QUESTIONNAIRE', 'Wolfsberg Questionnaire', 'Wolfsberg Questionnaire for Financial Institutions', 'DOCUMENTATION', 'file', NULL, NULL, true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Note: Entity Types and their relationships will be seeded by the C# migration service
-- when the database connection issue is resolved, or can be added manually if needed

