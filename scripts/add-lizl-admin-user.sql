-- Script to add lizl@mukuru.com as admin user with full access (Head of Compliance role)
-- Run this script against the PostgreSQL database

-- First, insert the user if they don't exist
INSERT INTO entity_configuration.users ("Id", email, name, first_login_at, last_login_at, created_at, updated_at)
VALUES (
    '660e8400-e29b-41d4-a716-446655440009'::uuid,
    'lizl@mukuru.com',
    'Lizl',
    NOW(),
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    updated_at = NOW();

-- Get the user ID (in case it was already created with a different ID)
DO $$
DECLARE
    v_user_id uuid;
    v_role_id uuid;
BEGIN
    -- Get user ID
    SELECT "Id" INTO v_user_id FROM entity_configuration.users WHERE email = 'lizl@mukuru.com';
    
    -- Get the Head of Compliance role ID (has full admin access)
    SELECT "Id" INTO v_role_id FROM entity_configuration.roles WHERE name = 'head-of-compliance';
    
    IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL THEN
        -- Assign the Head of Compliance role to the user
        INSERT INTO entity_configuration.user_role_assignments ("Id", user_id, role_id, role_name, role_display_name, is_active, created_at)
        VALUES (
            gen_random_uuid(),
            v_user_id,
            v_role_id,
            'head-of-compliance',
            'Head of Compliance',
            true,
            NOW()
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Successfully added lizl@mukuru.com with Head of Compliance role (full admin access)';
    ELSE
        IF v_user_id IS NULL THEN
            RAISE NOTICE 'User lizl@mukuru.com not found';
        END IF;
        IF v_role_id IS NULL THEN
            RAISE NOTICE 'Role head-of-compliance not found';
        END IF;
    END IF;
END $$;

-- Verify the user and role assignment
SELECT 
    u.email,
    u.name,
    ura.role_name,
    ura.role_display_name,
    ura.is_active
FROM entity_configuration.users u
LEFT JOIN entity_configuration.user_role_assignments ura ON u."Id" = ura.user_id
WHERE u.email = 'lizl@mukuru.com';
