-- Update Requirement Types to More Specific Categories
-- This script updates requirements to use more specific types based on their content

-- ============================================================================
-- Update Requirements with Specific Types
-- ============================================================================

-- Proof of Identity (ID Documents)
UPDATE entity_configuration.requirements
SET type = 'PROOF_OF_IDENTITY',
    updated_at = NOW()
WHERE code IN ('ID_DOCUMENTS');

-- Proof of Address
UPDATE entity_configuration.requirements
SET type = 'PROOF_OF_ADDRESS',
    updated_at = NOW()
WHERE code IN ('PROOF_OF_ADDRESS', 'PROOF_OF_OPERATING_ADDRESS', 'REGISTERED_ADDRESS', 'OPERATING_ADDRESS', 'ADDRESS');

-- Ownership Structure
UPDATE entity_configuration.requirements
SET type = 'OWNERSHIP_STRUCTURE',
    updated_at = NOW()
WHERE code IN ('OWNERSHIP_CONTROL_STRUCTURE', 'OWNERSHIP_STRUCTURE_DOCS', 'SHAREHOLDERS_25_PERCENT');

-- Board of Directors
UPDATE entity_configuration.requirements
SET type = 'BOARD_DIRECTORS',
    updated_at = NOW()
WHERE code IN ('BOARD_OF_DIRECTORS', 'EXECUTIVE_DIRECTORS', 'DIRECTORS_LIST');

-- Authorized Signatories
UPDATE entity_configuration.requirements
SET type = 'AUTHORIZED_SIGNATORIES',
    updated_at = NOW()
WHERE code IN ('AUTHORISED_PERSONS', 'PROOF_OF_AUTHORITY', 'MANDATE_RESOLUTION', 'TRUST_RESOLUTION');

-- Document Requirements (all file/document uploads)
UPDATE entity_configuration.requirements
SET type = 'DOCUMENT',
    updated_at = NOW()
WHERE code IN (
    'COMPANY_REGISTRATION_DOCS',
    'CERTIFICATE_INCORPORATION',
    'PROOF_OF_TRADING_NAME',
    'GOVERNING_DOCUMENT',
    'NPO_NGO_CERTIFICATE',
    'TRUST_DEED',
    'CONSTITUTIONAL_DOCUMENT',
    'ESTABLISHMENT_DOCS',
    'AML_POLICY',
    'ANTI_BRIBERY_POLICY',
    'SANCTIONS_POLICY',
    'RELEVANT_LICENCE',
    'WOLFSBERG_QUESTIONNAIRE',
    'PROOF_OF_INCOME',
    'PROOF_OF_LISTING'
);

-- Information Requirements (all text/input fields)
UPDATE entity_configuration.requirements
SET type = 'INFORMATION',
    updated_at = NOW()
WHERE code IN (
    'REGISTERED_LEGAL_NAME',
    'REGISTRATION_NUMBER',
    'DATE_OF_REGISTRATION',
    'DATE_OF_ESTABLISHMENT',
    'COUNTRY_OF_INCORPORATION',
    'COUNTRY',
    'TRADING_OPERATING_NAME',
    'TRUST_NAME',
    'TRUST_NUMBER',
    'TYPE_OF_TRUST',
    'NAME_OF_ASSOCIATION',
    'GOVERNING_DOCUMENT_CONSTITUTION',
    'MISSION_STATEMENT',
    'KEY_CONTROLLERS',
    'TRUSTEES_FOUNDERS_BENEFICIARIES',
    'INDIVIDUALS_MANAGING_ENTITY'
);

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
    info_count INTEGER;
    doc_count INTEGER;
    proof_id_count INTEGER;
    proof_addr_count INTEGER;
    ownership_count INTEGER;
    board_count INTEGER;
    auth_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO info_count FROM entity_configuration.requirements WHERE type = 'INFORMATION';
    SELECT COUNT(*) INTO doc_count FROM entity_configuration.requirements WHERE type = 'DOCUMENT';
    SELECT COUNT(*) INTO proof_id_count FROM entity_configuration.requirements WHERE type = 'PROOF_OF_IDENTITY';
    SELECT COUNT(*) INTO proof_addr_count FROM entity_configuration.requirements WHERE type = 'PROOF_OF_ADDRESS';
    SELECT COUNT(*) INTO ownership_count FROM entity_configuration.requirements WHERE type = 'OWNERSHIP_STRUCTURE';
    SELECT COUNT(*) INTO board_count FROM entity_configuration.requirements WHERE type = 'BOARD_DIRECTORS';
    SELECT COUNT(*) INTO auth_count FROM entity_configuration.requirements WHERE type = 'AUTHORIZED_SIGNATORIES';
    
    RAISE NOTICE 'Requirement Types Updated:';
    RAISE NOTICE '  INFORMATION: %', info_count;
    RAISE NOTICE '  DOCUMENT: %', doc_count;
    RAISE NOTICE '  PROOF_OF_IDENTITY: %', proof_id_count;
    RAISE NOTICE '  PROOF_OF_ADDRESS: %', proof_addr_count;
    RAISE NOTICE '  OWNERSHIP_STRUCTURE: %', ownership_count;
    RAISE NOTICE '  BOARD_DIRECTORS: %', board_count;
    RAISE NOTICE '  AUTHORIZED_SIGNATORIES: %', auth_count;
    RAISE NOTICE '  Total: %', (info_count + doc_count + proof_id_count + proof_addr_count + ownership_count + board_count + auth_count);
END $$;

