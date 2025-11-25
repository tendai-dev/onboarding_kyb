-- Update user permissions based on their assigned roles
-- This script assigns all permissions from a user's roles to the user
-- Run this script to populate user permissions from their roles
-- Usage: psql -h localhost -U kyb -d kyb_case -f update-user-permissions.sql

-- Clear existing user permissions (optional - comment out if you want to keep existing direct permissions)
-- DELETE FROM entity_configuration.user_permissions;

-- Insert user permissions based on their role assignments
-- This will assign all permissions from each user's roles to the user
INSERT INTO entity_configuration.user_permissions ("Id", user_id, permission_name, resource, is_active, created_at, created_by)
SELECT DISTINCT
    gen_random_uuid() as "Id",
    ura.user_id,
    rp.permission_name,
    rp.resource,
    true as is_active,
    NOW() as created_at,
    'system' as created_by
FROM entity_configuration.user_role_assignments ura
INNER JOIN entity_configuration.role_permissions rp ON ura.role_id = rp.role_id
WHERE ura.is_active = true
  AND rp.is_active = true
  -- Avoid duplicates: only insert if this permission doesn't already exist for this user
  AND NOT EXISTS (
    SELECT 1 
    FROM entity_configuration.user_permissions up
    WHERE up.user_id = ura.user_id
      AND up.permission_name = rp.permission_name
      AND (up.resource = rp.resource OR (up.resource IS NULL AND rp.resource IS NULL))
  )
ORDER BY ura.user_id, rp.permission_name;

-- Display summary
SELECT 
    u.email,
    u.name,
    COUNT(DISTINCT up.permission_name) as permission_count
FROM entity_configuration.users u
LEFT JOIN entity_configuration.user_permissions up ON u."Id" = up.user_id AND up.is_active = true
GROUP BY u."Id", u.email, u.name
ORDER BY u.email;

