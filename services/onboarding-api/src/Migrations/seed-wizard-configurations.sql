-- Seed Wizard Configurations for All Entity Types
-- This script creates a default wizard configuration for each entity type with standard steps

-- ============================================================================
-- STEP 1: Create Wizard Configurations for Each Entity Type
-- ============================================================================

-- Insert wizard configurations for all active entity types
INSERT INTO entity_configuration.wizard_configurations ("Id", entity_type_id, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    et."Id",
    true,
    NOW(),
    NOW()
FROM entity_configuration.entity_types et
WHERE et.is_active = true
    AND NOT EXISTS (
        SELECT 1 
        FROM entity_configuration.wizard_configurations wc 
        WHERE wc.entity_type_id = et."Id"
    )
ON CONFLICT (entity_type_id) DO NOTHING;

-- ============================================================================
-- STEP 2: Create Default Wizard Steps for Each Configuration
-- ============================================================================

-- Helper function to create steps for a wizard configuration
-- We'll use a DO block to iterate through each configuration

DO $$
DECLARE
    wizard_config_id UUID;
    entity_type_record RECORD;
    step_number INTEGER;
BEGIN
    -- Loop through each wizard configuration
    FOR wizard_config_id IN 
        SELECT "Id" FROM entity_configuration.wizard_configurations
    LOOP
        -- Get the entity type for this configuration
        SELECT et."Id", et.code INTO entity_type_record
        FROM entity_configuration.wizard_configurations wc
        JOIN entity_configuration.entity_types et ON wc.entity_type_id = et."Id"
        WHERE wc."Id" = wizard_config_id;
        
        -- Only create steps if they don't already exist
        IF NOT EXISTS (
            SELECT 1 FROM entity_configuration.wizard_steps 
            WHERE wizard_configuration_id = wizard_config_id
        ) THEN
            -- Step 1: Business Information
            INSERT INTO entity_configuration.wizard_steps (
                "Id", wizard_configuration_id, title, subtitle, 
                requirement_types, checklist_category, step_number, is_active, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                wizard_config_id,
                'Business Information',
                'Company details and registration information',
                '["INFORMATION"]',
                'Compliance',
                1,
                true,
                NOW(),
                NOW()
            );
            
            -- Step 2: Identity Verification
            INSERT INTO entity_configuration.wizard_steps (
                "Id", wizard_configuration_id, title, subtitle, 
                requirement_types, checklist_category, step_number, is_active, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                wizard_config_id,
                'Identity Verification',
                'Proof of identity documents and verification',
                '["PROOF_OF_IDENTITY"]',
                'Identity',
                2,
                true,
                NOW(),
                NOW()
            );
            
            -- Step 3: Address Verification
            INSERT INTO entity_configuration.wizard_steps (
                "Id", wizard_configuration_id, title, subtitle, 
                requirement_types, checklist_category, step_number, is_active, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                wizard_config_id,
                'Address Verification',
                'Proof of address documents',
                '["PROOF_OF_ADDRESS"]',
                'Address',
                3,
                true,
                NOW(),
                NOW()
            );
            
            -- Step 4: Ownership & Control
            INSERT INTO entity_configuration.wizard_steps (
                "Id", wizard_configuration_id, title, subtitle, 
                requirement_types, checklist_category, step_number, is_active, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                wizard_config_id,
                'Ownership & Control',
                'Shareholders, beneficial owners, and ownership structure',
                '["OWNERSHIP_STRUCTURE"]',
                'Compliance',
                4,
                true,
                NOW(),
                NOW()
            );
            
            -- Step 5: Management & Directors
            INSERT INTO entity_configuration.wizard_steps (
                "Id", wizard_configuration_id, title, subtitle, 
                requirement_types, checklist_category, step_number, is_active, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                wizard_config_id,
                'Management & Directors',
                'Board of directors and key management personnel',
                '["BOARD_DIRECTORS"]',
                'Compliance',
                5,
                true,
                NOW(),
                NOW()
            );
            
            -- Step 6: Authorized Signatories
            INSERT INTO entity_configuration.wizard_steps (
                "Id", wizard_configuration_id, title, subtitle, 
                requirement_types, checklist_category, step_number, is_active, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                wizard_config_id,
                'Authorized Signatories',
                'Persons authorized to sign on behalf of the entity',
                '["AUTHORIZED_SIGNATORIES"]',
                'Compliance',
                6,
                true,
                NOW(),
                NOW()
            );
            
            -- Step 7: Additional Documents
            INSERT INTO entity_configuration.wizard_steps (
                "Id", wizard_configuration_id, title, subtitle, 
                requirement_types, checklist_category, step_number, is_active, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                wizard_config_id,
                'Additional Documents',
                'Any additional required documents and certificates',
                '["DOCUMENTATION"]',
                'Documentation',
                7,
                true,
                NOW(),
                NOW()
            );
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Verify the Data
-- ============================================================================

-- Display summary of created configurations
SELECT 
    et.code AS entity_type_code,
    et.display_name AS entity_type_name,
    wc."Id" AS wizard_config_id,
    COUNT(ws."Id") AS step_count,
    wc.is_active AS config_active
FROM entity_configuration.entity_types et
LEFT JOIN entity_configuration.wizard_configurations wc ON et."Id" = wc.entity_type_id
LEFT JOIN entity_configuration.wizard_steps ws ON wc."Id" = ws.wizard_configuration_id
WHERE et.is_active = true
GROUP BY et.code, et.display_name, wc."Id", wc.is_active
ORDER BY et.code;

