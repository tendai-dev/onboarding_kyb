-- Seed script for Roles and Users from Active Directory
-- Run this script to populate roles and users with AD data
-- Usage: psql -h localhost -U kyb -d kyb_case -f seed-roles-and-users.sql

-- Insert Roles
INSERT INTO entity_configuration.roles ("Id", name, display_name, description, is_active, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'due-diligence-compliance-specialist', 'Due Diligence Compliance Specialist', 'Full access to compliance operations', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'head-of-financial-crime', 'Head of Financial Crime', 'Full access to financial crime operations', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'head-of-compliance', 'Head of Compliance', 'Full access to compliance management', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'group-legal-counsel', 'Group Legal Counsel', 'Full access to legal operations', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'commercial-team', 'Commercial Team', 'Full access to commercial operations', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'high-risk-signatory-amlco-mlro', 'High Risk Signatory / AMLCO / MLRO (Corridor Specific)', 'View documents, provide comments, approve/decline', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440007', 'due-diligence-compliance-administrator', 'Due Diligence Compliance Administrator', 'View submissions, allocate/assign cases, send canned responses, internal comments', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440008', 'amlco-mlro', 'Anti-Money Laundering Compliance Officers (AMLCOs) & MLROs', 'Corridor-specific officers — designated per product or business area. View, comment, sign off', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert Users
INSERT INTO entity_configuration.users ("Id", email, name, first_login_at, last_login_at, created_at, updated_at)
VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'monique@mukuru.com', 'Monique Ebrahim', NOW(), NOW(), NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440002', 'shumirai@mukuru.com', 'Shumirai Mawoneke', NOW(), NOW(), NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440003', 'leeann.pretorius@mukuru.com', 'Lee-Ann Pretorius', NOW(), NOW(), NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440004', 'phumelela.maliza@mukuru.com', 'Phumelela Maliza', NOW(), NOW(), NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440005', 'david@mukuru.com', 'David Isenegger', NOW(), NOW(), NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440006', 'nishan@mukuru.com', 'Nishan Sing', NOW(), NOW(), NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440007', 'dougal@mukuru.com', 'Dougal Bennett', NOW(), NOW(), NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440008', 'andy@mukuru.com', 'Andy Jury', NOW(), NOW(), NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert User Role Assignments
INSERT INTO entity_configuration.user_role_assignments ("Id", user_id, role_id, role_name, role_display_name, is_active, created_at)
VALUES
  -- Monique Ebrahim - Due Diligence Compliance Specialist
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'due-diligence-compliance-specialist', 'Due Diligence Compliance Specialist', true, NOW()),
  
  -- Shumirai Mawoneke - Due Diligence Compliance Specialist
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'due-diligence-compliance-specialist', 'Due Diligence Compliance Specialist', true, NOW()),
  
  -- Lee-Ann Pretorius - Head of Financial Crime
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'head-of-financial-crime', 'Head of Financial Crime', true, NOW()),
  
  -- Phumelela Maliza - Head of Compliance, Due Diligence Compliance Administrator (acting), High Risk Signatory
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'head-of-compliance', 'Head of Compliance', true, NOW()),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', 'due-diligence-compliance-administrator', 'Due Diligence Compliance Administrator', true, NOW()),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 'high-risk-signatory-amlco-mlro', 'High Risk Signatory / AMLCO / MLRO (Corridor Specific)', true, NOW()),
  
  -- David Isenegger - Group Legal Counsel, High Risk Signatory
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'group-legal-counsel', 'Group Legal Counsel', true, NOW()),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'high-risk-signatory-amlco-mlro', 'High Risk Signatory / AMLCO / MLRO (Corridor Specific)', true, NOW()),
  
  -- Nishan Sing - High Risk Signatory
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'high-risk-signatory-amlco-mlro', 'High Risk Signatory / AMLCO / MLRO (Corridor Specific)', true, NOW()),
  
  -- Dougal Bennett - High Risk Signatory
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440006', 'high-risk-signatory-amlco-mlro', 'High Risk Signatory / AMLCO / MLRO (Corridor Specific)', true, NOW()),
  
  -- Andy Jury - High Risk Signatory
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440006', 'high-risk-signatory-amlco-mlro', 'High Risk Signatory / AMLCO / MLRO (Corridor Specific)', true, NOW())
ON CONFLICT DO NOTHING;

