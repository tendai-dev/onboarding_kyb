-- Link all Requirements to Entity Types
-- This script creates all entity_type_requirements relationships based on SeedData.cs

-- First, check if foreign key constraint exists for requirement_id
DO $$
DECLARE
    fk_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'entity_configuration'
          AND tc.table_name = 'entity_type_requirements'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'requirement_id'
    ) INTO fk_exists;
    
    IF NOT fk_exists THEN
        -- Add foreign key constraint if it doesn't exist
        ALTER TABLE entity_configuration.entity_type_requirements
        ADD CONSTRAINT FK_entity_type_requirements_requirements_requirement_id
        FOREIGN KEY (requirement_id) 
        REFERENCES entity_configuration.requirements("Id") 
        ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for requirement_id';
    END IF;
END $$;

-- Now insert all the links
-- 1. PRIVATE COMPANY (26 requirements)
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
    ('COMPANY_REGISTRATION_DOCS', true, 13),
    ('CERTIFICATE_INCORPORATION', true, 14),
    ('PROOF_OF_TRADING_NAME', false, 15),
    ('PROOF_OF_ADDRESS', true, 16),
    ('PROOF_OF_OPERATING_ADDRESS', false, 17),
    ('DIRECTORS_LIST', true, 18),
    ('OWNERSHIP_STRUCTURE_DOCS', true, 19),
    ('ID_DOCUMENTS', true, 20),
    ('MANDATE_RESOLUTION', true, 21),
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

-- 2. PUBLIC COMPANY (7 requirements)
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
    ('BOARD_OF_DIRECTORS', true, 2),
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

-- 3. GOVERNMENT ENTITY (12 requirements)
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
    ('DATE_OF_REGISTRATION', true, 3),
    ('COUNTRY_OF_INCORPORATION', true, 4),
    ('BOARD_OF_DIRECTORS', true, 5),
    ('AUTHORISED_PERSONS', true, 6),
    ('PROOF_OF_AUTHORITY', true, 7),
    ('COMPANY_REGISTRATION_DOCS', true, 8),
    ('CERTIFICATE_INCORPORATION', true, 9),
    ('DIRECTORS_LIST', true, 10),
    ('ID_DOCUMENTS', true, 11),
    ('MANDATE_RESOLUTION', true, 12)
) AS links(req_code, is_req, display_ord)
WHERE NOT EXISTS (
    SELECT 1 FROM entity_configuration.entity_type_requirements etr
    WHERE etr.entity_type_id = (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'GOVERNMENT_ENTITY')
    AND etr.requirement_id = (SELECT "Id" FROM entity_configuration.requirements WHERE code = links.req_code)
);

-- 4. NGO (19 requirements)
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
    ('GOVERNING_DOCUMENT', true, 3),
    ('NPO_NGO_CERTIFICATE', true, 4),
    ('TRADING_OPERATING_NAME', false, 5),
    ('REGISTERED_ADDRESS', true, 6),
    ('OPERATING_ADDRESS', false, 7),
    ('KEY_CONTROLLERS', true, 8),
    ('SHAREHOLDERS_25_PERCENT', false, 9),
    ('AUTHORISED_PERSONS', true, 10),
    ('PROOF_OF_AUTHORITY', true, 11),
    ('COMPANY_REGISTRATION_DOCS', true, 12),
    ('CERTIFICATE_INCORPORATION', true, 13),
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

-- 5. ASSOCIATION (10 requirements)
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
    ('REGISTERED_LEGAL_NAME', true, 1),
    ('GOVERNING_DOCUMENT', true, 2),
    ('REGISTERED_ADDRESS', true, 3),
    ('KEY_CONTROLLERS', true, 4),
    ('AUTHORISED_PERSONS', true, 5),
    ('PROOF_OF_AUTHORITY', true, 6),
    ('PROOF_OF_ADDRESS', true, 7),
    ('DIRECTORS_LIST', true, 8),
    ('ID_DOCUMENTS', true, 9),
    ('MANDATE_RESOLUTION', true, 10)
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
    ('REGISTERED_LEGAL_NAME', true, 1),
    ('REGISTRATION_NUMBER', true, 2),
    ('DATE_OF_REGISTRATION', true, 3),
    ('COUNTRY_OF_INCORPORATION', true, 4),
    ('TRADING_OPERATING_NAME', false, 5),
    ('REGISTERED_ADDRESS', true, 6),
    ('OPERATING_ADDRESS', false, 7),
    ('TRUSTEES_FOUNDERS_BENEFICIARIES', true, 8),
    ('AUTHORISED_PERSONS', true, 9),
    ('PROOF_OF_AUTHORITY', true, 10),
    ('TRUST_DEED', true, 11),
    ('PROOF_OF_TRADING_NAME', false, 12),
    ('PROOF_OF_ADDRESS', true, 13),
    ('PROOF_OF_OPERATING_ADDRESS', false, 14),
    ('ID_DOCUMENTS', true, 15),
    ('TRUST_RESOLUTION', true, 16)
) AS links(req_code, is_req, display_ord)
WHERE NOT EXISTS (
    SELECT 1 FROM entity_configuration.entity_type_requirements etr
    WHERE etr.entity_type_id = (SELECT "Id" FROM entity_configuration.entity_types WHERE code = 'TRUST')
    AND etr.requirement_id = (SELECT "Id" FROM entity_configuration.requirements WHERE code = links.req_code)
);

-- 7. SUPRANATIONAL (4 requirements)
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

-- 8. SOLE PROPRIETORSHIP (20 requirements)
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

