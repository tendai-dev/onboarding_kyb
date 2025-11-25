-- Seed script for Entity Configuration data
-- Run this script to populate entity types and requirements
-- Usage: psql -h localhost -U kyb -d kyb_case -f seed-entity-configuration.sql

-- Insert Entity Types
INSERT INTO entity_configuration.entity_types (id, code, display_name, description, icon, is_active, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'PRIVATE_COMPANY', 'Private Company / Limited Liability Company', 'A privately held business entity with limited liability', 'FiBriefcase', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'PUBLIC_COMPANY', 'Public Company', 'A company whose shares are publicly traded', 'FiBuilding', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'PARTNERSHIP', 'Partnership', 'A business entity owned by two or more partners', 'FiUsers', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'SOLE_PROPRIETORSHIP', 'Sole Proprietorship', 'A business owned and operated by a single individual', 'FiUser', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'NGO', 'Non-Governmental Organization (NGO)', 'A non-profit organization operating independently of government', 'FiHeart', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'TRUST', 'Trust', 'A legal arrangement where assets are held by a trustee', 'FiShield', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440007', 'ASSOCIATION', 'Association', 'An organization of people with a common purpose', 'FiUsers', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Insert Entity Type Requirements (linking requirements to entity types)
-- Private Company requirements
INSERT INTO entity_configuration.entity_type_requirements (id, entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', true, 1, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', true, 2, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440103', true, 3, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440104', true, 4, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440105', true, 5, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440106', true, 6, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440107', false, 7, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440108', false, 8, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Public Company requirements
INSERT INTO entity_configuration.entity_type_requirements (id, entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440101', true, 1, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', true, 2, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440103', true, 3, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440104', true, 4, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440105', true, 5, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440106', true, 6, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Partnership requirements
INSERT INTO entity_configuration.entity_type_requirements (id, entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440101', true, 1, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440109', true, 2, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440106', true, 3, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Sole Proprietorship requirements
INSERT INTO entity_configuration.entity_type_requirements (id, entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440101', true, 1, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440109', true, 2, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440110', true, 3, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440108', false, 4, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- NGO requirements
INSERT INTO entity_configuration.entity_type_requirements (id, entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440101', true, 1, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440111', true, 2, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440104', true, 3, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440106', true, 4, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Trust requirements
INSERT INTO entity_configuration.entity_type_requirements (id, entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440112', true, 1, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440113', true, 2, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440114', true, 3, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440115', false, 4, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Association requirements
INSERT INTO entity_configuration.entity_type_requirements (id, entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440111', true, 1, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440101', true, 2, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440104', true, 3, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Note: Requirement IDs referenced above are GUIDs that would normally point to a requirements table
-- In a full implementation, you would also seed a requirements table with these IDs and their details

