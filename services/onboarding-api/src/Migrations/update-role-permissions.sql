-- Update permissions for each role based on their access levels
-- Run this script to add permissions to roles
-- Usage: psql -h localhost -U kyb -d kyb_case -f update-role-permissions.sql

-- Clear existing permissions (optional - comment out if you want to keep existing)
-- DELETE FROM entity_configuration.role_permissions;

-- 1. Due Diligence Compliance Specialist - Full access
-- Full access means all view, create, edit, delete, and action permissions
INSERT INTO entity_configuration.role_permissions ("Id", role_id, permission_name, resource, is_active, created_at)
VALUES
  -- View permissions
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_dashboard', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_reports', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_applications', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_work_queue', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_messages', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_audit_log', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_entity_types', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_users', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_roles', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_requirements', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_checklists', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_notifications', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_risk_review', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_approvals', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'view_refreshes', NULL, true, NOW()),
  -- Create permissions
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'create_application', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'create_entity_type', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'create_requirement', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'create_role', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'create_user', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'create_checklist', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'create_notification', NULL, true, NOW()),
  -- Edit permissions
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'edit_application', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'edit_entity_type', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'edit_requirement', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'edit_role', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'edit_user', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'edit_checklist', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'edit_notification', NULL, true, NOW()),
  -- Delete permissions
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'delete_application', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'delete_entity_type', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'delete_requirement', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'delete_role', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'delete_user', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'delete_checklist', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'delete_notification', NULL, true, NOW()),
  -- Action permissions
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'approve_application', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'reject_application', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'assign_work_item', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'complete_work_item', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'grant_permission', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'revoke_permission', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'assign_role', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'remove_role', NULL, true, NOW()),
  -- Admin permissions
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'admin_access', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'manage_users', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'manage_roles', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'manage_permissions', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'manage_configuration', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'export_data', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'import_data', NULL, true, NOW())
ON CONFLICT DO NOTHING;

-- 2. Head of Financial Crime - Full access (same as Due Diligence Compliance Specialist)
INSERT INTO entity_configuration.role_permissions ("Id", role_id, permission_name, resource, is_active, created_at)
SELECT gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', permission_name, resource, true, NOW()
FROM entity_configuration.role_permissions
WHERE role_id = '550e8400-e29b-41d4-a716-446655440001'
ON CONFLICT DO NOTHING;

-- 3. Head of Compliance - Full access (same as Due Diligence Compliance Specialist)
INSERT INTO entity_configuration.role_permissions ("Id", role_id, permission_name, resource, is_active, created_at)
SELECT gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', permission_name, resource, true, NOW()
FROM entity_configuration.role_permissions
WHERE role_id = '550e8400-e29b-41d4-a716-446655440001'
ON CONFLICT DO NOTHING;

-- 4. Group Legal Counsel - Full access (same as Due Diligence Compliance Specialist)
INSERT INTO entity_configuration.role_permissions ("Id", role_id, permission_name, resource, is_active, created_at)
SELECT gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', permission_name, resource, true, NOW()
FROM entity_configuration.role_permissions
WHERE role_id = '550e8400-e29b-41d4-a716-446655440001'
ON CONFLICT DO NOTHING;

-- 5. Commercial Team - Full access (same as Due Diligence Compliance Specialist)
INSERT INTO entity_configuration.role_permissions ("Id", role_id, permission_name, resource, is_active, created_at)
SELECT gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', permission_name, resource, true, NOW()
FROM entity_configuration.role_permissions
WHERE role_id = '550e8400-e29b-41d4-a716-446655440001'
ON CONFLICT DO NOTHING;

-- 6. High Risk Signatory / AMLCO / MLRO (Corridor Specific) - View documents, provide comments, approve/decline
INSERT INTO entity_configuration.role_permissions ("Id", role_id, permission_name, resource, is_active, created_at)
VALUES
  -- View permissions for documents and applications
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'view_applications', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'view_documents', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'view_work_queue', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'view_messages', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'view_risk_review', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'view_approvals', NULL, true, NOW()),
  -- Action permissions - provide comments, approve/decline
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'approve_application', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'reject_application', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'create_messages', NULL, true, NOW()) -- For comments
ON CONFLICT DO NOTHING;

-- 7. Due Diligence Compliance Administrator - View submissions, allocate/assign cases, send canned responses, internal comments
INSERT INTO entity_configuration.role_permissions ("Id", role_id, permission_name, resource, is_active, created_at)
VALUES
  -- View permissions
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', 'view_applications', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', 'view_work_queue', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', 'view_messages', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', 'view_notifications', NULL, true, NOW()),
  -- Action permissions - allocate/assign cases, send responses
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', 'assign_work_item', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', 'create_messages', NULL, true, NOW()), -- For canned responses and internal comments
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', 'create_notification', NULL, true, NOW()) -- For sending responses
ON CONFLICT DO NOTHING;

-- 8. Anti-Money Laundering Compliance Officers (AMLCOs) & MLROs - View, comment, sign off
INSERT INTO entity_configuration.role_permissions ("Id", role_id, permission_name, resource, is_active, created_at)
VALUES
  -- View permissions
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', 'view_applications', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', 'view_documents', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', 'view_work_queue', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', 'view_messages', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', 'view_risk_review', NULL, true, NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', 'view_approvals', NULL, true, NOW()),
  -- Action permissions - comment and sign off
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', 'create_messages', NULL, true, NOW()), -- For comments
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', 'approve_application', NULL, true, NOW()) -- For sign off
ON CONFLICT DO NOTHING;

