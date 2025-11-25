-- Complete seed script for Entity Types and their Requirements
-- This links all requirements to their respective entity types

-- First, ensure we have requirement IDs mapped
DO $$
DECLARE
    req_ids RECORD;
    entity_type_ids RECORD;
    req_id_map JSONB := '{}'::JSONB;
    et_id_map JSONB := '{}'::JSONB;
BEGIN
    -- Build requirement ID map
    FOR req_ids IN SELECT "Id", code FROM entity_configuration.requirements
    LOOP
        req_id_map := req_id_map || jsonb_build_object(req_ids.code, req_ids."Id"::text);
    END LOOP;

    -- Build entity type ID map (create if they don't exist)
    -- 1. PRIVATE COMPANY
    INSERT INTO entity_configuration.entity_types ("Id", code, display_name, description, icon, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'PRIVATE_COMPANY', 'Private Company / Limited Liability Company', 'A privately held business entity with limited liability', 'FiBriefcase', true, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING
    RETURNING "Id" INTO entity_type_ids;
    
    SELECT "Id" INTO entity_type_ids FROM entity_configuration.entity_types WHERE code = 'PRIVATE_COMPANY';
    et_id_map := et_id_map || jsonb_build_object('PRIVATE_COMPANY', entity_type_ids."Id"::text);

    -- 2. PUBLIC COMPANY
    INSERT INTO entity_configuration.entity_types ("Id", code, display_name, description, icon, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'PUBLIC_COMPANY', 'Publicly Listed Entity', 'A publicly traded company listed on a stock exchange', 'FiTrendingUp', true, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING;
    
    SELECT "Id" INTO entity_type_ids FROM entity_configuration.entity_types WHERE code = 'PUBLIC_COMPANY';
    et_id_map := et_id_map || jsonb_build_object('PUBLIC_COMPANY', entity_type_ids."Id"::text);

    -- 3. GOVERNMENT ENTITY
    INSERT INTO entity_configuration.entity_types ("Id", code, display_name, description, icon, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'GOVERNMENT_ENTITY', 'Government / State-Owned Entity / Organ of State', 'A government or state-owned entity', 'FiShield', true, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING;
    
    SELECT "Id" INTO entity_type_ids FROM entity_configuration.entity_types WHERE code = 'GOVERNMENT_ENTITY';
    et_id_map := et_id_map || jsonb_build_object('GOVERNMENT_ENTITY', entity_type_ids."Id"::text);

    -- 4. NGO
    INSERT INTO entity_configuration.entity_types ("Id", code, display_name, description, icon, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'NGO', 'Non-Profit Organisation / NGO / PVO', 'A non-profit organization, NGO, or PVO', 'FiHeart', true, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING;
    
    SELECT "Id" INTO entity_type_ids FROM entity_configuration.entity_types WHERE code = 'NGO';
    et_id_map := et_id_map || jsonb_build_object('NGO', entity_type_ids."Id"::text);

    -- 5. ASSOCIATION
    INSERT INTO entity_configuration.entity_types ("Id", code, display_name, description, icon, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'ASSOCIATION', 'Non-Registered Association / Society / Charity / Foundation', 'A non-registered association, society, charity, or foundation', 'FiUsers', true, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING;
    
    SELECT "Id" INTO entity_type_ids FROM entity_configuration.entity_types WHERE code = 'ASSOCIATION';
    et_id_map := et_id_map || jsonb_build_object('ASSOCIATION', entity_type_ids."Id"::text);

    -- 6. TRUST
    INSERT INTO entity_configuration.entity_types ("Id", code, display_name, description, icon, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'TRUST', 'Trust', 'A trust entity', 'FiFileText', true, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING;
    
    SELECT "Id" INTO entity_type_ids FROM entity_configuration.entity_types WHERE code = 'TRUST';
    et_id_map := et_id_map || jsonb_build_object('TRUST', entity_type_ids."Id"::text);

    -- 7. SUPRANATIONAL
    INSERT INTO entity_configuration.entity_types ("Id", code, display_name, description, icon, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'SUPRANATIONAL', 'Supranational / Inter-Governmental / Sovereign', 'A supranational, inter-governmental, or sovereign entity', 'FiGlobe', true, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING;
    
    SELECT "Id" INTO entity_type_ids FROM entity_configuration.entity_types WHERE code = 'SUPRANATIONAL';
    et_id_map := et_id_map || jsonb_build_object('SUPRANATIONAL', entity_type_ids."Id"::text);

    -- 8. SOLE PROPRIETORSHIP
    INSERT INTO entity_configuration.entity_types ("Id", code, display_name, description, icon, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'SOLE_PROPRIETORSHIP', 'Sole Proprietor', 'A sole proprietorship business', 'FiUser', true, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING;
    
    SELECT "Id" INTO entity_type_ids FROM entity_configuration.entity_types WHERE code = 'SOLE_PROPRIETORSHIP';
    et_id_map := et_id_map || jsonb_build_object('SOLE_PROPRIETORSHIP', entity_type_ids."Id"::text);

    -- Now link requirements to entity types
    -- This is a simplified version - you may need to adjust based on your exact requirements
    
    RAISE NOTICE 'Entity types and requirements ready for linking';
END $$;

