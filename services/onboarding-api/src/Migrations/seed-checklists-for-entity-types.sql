-- Seed checklists for each entity type
-- This script creates sample checklists for Private Company, NPO, Government, and Publicly Listed entity types

-- First, ensure we have the checklist schema
CREATE SCHEMA IF NOT EXISTS checklist;

-- Function to create a checklist with items for a given entity type
DO $$
DECLARE
    checklist_id_private UUID;
    checklist_id_npo UUID;
    checklist_id_gov UUID;
    checklist_id_public UUID;
    item_id UUID;
    item_order INTEGER;
BEGIN
    -- 1. PRIVATE COMPANY CHECKLIST
    checklist_id_private := gen_random_uuid();
    
    INSERT INTO checklist.checklists (id, case_id, type, status, partner_id, created_at)
    VALUES (
        checklist_id_private,
        'CASE-PRIVATE-001',
        'Corporate',
        'InProgress',
        'PARTNER-001',
        NOW()
    );

    -- Add items for Private Company (Corporate template)
    item_order := 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_private, 'CERT_INCORP', 'Certificate of Incorporation', 'Provide certificate of incorporation', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_private, 'ARTICLES', 'Articles of Association', 'Provide articles of association', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_private, 'SHAREHOLDER_REG', 'Shareholder Register', 'Provide current shareholder register', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_private, 'DIRECTOR_REG', 'Director Register', 'Provide current director register', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_private, 'UBO', 'Beneficial Ownership', 'Identify ultimate beneficial owners (>25%)', 'Compliance', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_private, 'DIR_ID_VERIFY', 'Director ID Verification', 'Verify identity of all directors', 'Identity', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_private, 'UBO_ID_VERIFY', 'UBO ID Verification', 'Verify identity of beneficial owners', 'Identity', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_private, 'BUSINESS_LICENSE', 'Business License', 'Provide relevant business licenses', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_private, 'FINANCIAL_STMT', 'Financial Statements', 'Provide audited financial statements', 'Financial', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_private, 'BANK_ACCT', 'Bank Account Details', 'Provide corporate bank account details', 'Financial', true, item_order, 'Pending', NOW());

    -- 2. NPO CHECKLIST
    checklist_id_npo := gen_random_uuid();
    
    INSERT INTO checklist.checklists (id, case_id, type, status, partner_id, created_at)
    VALUES (
        checklist_id_npo,
        'CASE-NPO-001',
        'Corporate',
        'InProgress',
        'PARTNER-002',
        NOW()
    );

    -- Add items for NPO (similar to Corporate but with NPO-specific items)
    item_order := 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_npo, 'NPO_CERT', 'NPO Registration Certificate', 'Provide NPO registration certificate', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_npo, 'NPO_CONSTITUTION', 'NPO Constitution', 'Provide NPO constitution or memorandum', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_npo, 'BOARD_MEMBERS', 'Board Members Register', 'Provide register of board members', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_npo, 'BOARD_ID_VERIFY', 'Board Member ID Verification', 'Verify identity of all board members', 'Identity', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_npo, 'NPO_PURPOSE', 'NPO Purpose and Activities', 'Document NPO purpose and activities', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_npo, 'NPO_FUNDING', 'Source of Funding', 'Document source of NPO funding', 'Financial', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_npo, 'NPO_BANK_ACCT', 'NPO Bank Account', 'Provide NPO bank account details', 'Financial', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_npo, 'NPO_PEP_SCREEN', 'NPO PEP Screening', 'Screen board members for PEP status', 'Risk', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_npo, 'NPO_SANCTIONS_SCREEN', 'NPO Sanctions Screening', 'Screen NPO and board members against sanctions', 'Risk', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_npo, 'NPO_TAX_EXEMPT', 'Tax Exempt Status', 'Provide tax exempt status documentation', 'Compliance', true, item_order, 'Pending', NOW());

    -- 3. GOVERNMENT ENTITY CHECKLIST
    checklist_id_gov := gen_random_uuid();
    
    INSERT INTO checklist.checklists (id, case_id, type, status, partner_id, created_at)
    VALUES (
        checklist_id_gov,
        'CASE-GOV-001',
        'Corporate',
        'InProgress',
        'PARTNER-003',
        NOW()
    );

    -- Add items for Government Entity
    item_order := 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_gov, 'GOV_ESTABLISHMENT', 'Government Establishment Document', 'Provide government establishment act or decree', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_gov, 'GOV_MANDATE', 'Government Mandate', 'Document government entity mandate and functions', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_gov, 'GOV_OFFICIALS', 'Authorized Officials', 'Provide list of authorized officials', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_gov, 'GOV_OFFICIAL_ID', 'Official ID Verification', 'Verify identity of authorized officials', 'Identity', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_gov, 'GOV_BUDGET', 'Budget Authorization', 'Provide budget authorization documentation', 'Financial', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_gov, 'GOV_BANK_ACCT', 'Government Bank Account', 'Provide government bank account details', 'Financial', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_gov, 'GOV_PEP_SCREEN', 'Government PEP Screening', 'Screen officials for PEP status', 'Risk', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_gov, 'GOV_SANCTIONS_SCREEN', 'Government Sanctions Screening', 'Screen entity and officials against sanctions', 'Risk', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_gov, 'GOV_COMPLIANCE', 'Government Compliance', 'Provide compliance and regulatory documentation', 'Compliance', true, item_order, 'Pending', NOW());

    -- 4. PUBLICLY LISTED ENTITY CHECKLIST
    checklist_id_public := gen_random_uuid();
    
    INSERT INTO checklist.checklists (id, case_id, type, status, partner_id, created_at)
    VALUES (
        checklist_id_public,
        'CASE-PUBLIC-001',
        'Corporate',
        'InProgress',
        'PARTNER-004',
        NOW()
    );

    -- Add items for Publicly Listed Entity (enhanced Corporate template)
    item_order := 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'CERT_INCORP', 'Certificate of Incorporation', 'Provide certificate of incorporation', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'LISTING_CERT', 'Stock Exchange Listing Certificate', 'Provide stock exchange listing certificate', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'ANNUAL_REPORT', 'Annual Report', 'Provide most recent annual report', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'SHAREHOLDER_REG', 'Shareholder Register', 'Provide current shareholder register', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'DIRECTOR_REG', 'Director Register', 'Provide current director register', 'Documentation', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'UBO', 'Beneficial Ownership', 'Identify ultimate beneficial owners (>25%)', 'Compliance', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'DIR_ID_VERIFY', 'Director ID Verification', 'Verify identity of all directors', 'Identity', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'UBO_ID_VERIFY', 'UBO ID Verification', 'Verify identity of beneficial owners', 'Identity', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'AUDITED_FINANCIALS', 'Audited Financial Statements', 'Provide audited financial statements', 'Financial', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'BANK_ACCT', 'Bank Account Details', 'Provide corporate bank account details', 'Financial', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'CORP_PEP_SCREEN', 'Corporate PEP Screening', 'Screen directors and UBOs for PEP status', 'Risk', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'CORP_SANCTIONS_SCREEN', 'Corporate Sanctions Screening', 'Screen entity and persons against sanctions', 'Risk', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'TAX_REG', 'Tax Registration', 'Provide tax registration certificate', 'Compliance', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'REG_OFFICE_ADDR', 'Registered Office Address', 'Verify registered office address', 'Address', true, item_order, 'Pending', NOW());
    
    item_order := item_order + 1;
    INSERT INTO checklist.checklist_items (id, checklist_id, code, name, description, category, is_required, "order", status, created_at)
    VALUES (gen_random_uuid(), checklist_id_public, 'BUSINESS_ACTIVITY', 'Business Activity Verification', 'Verify nature of business activities', 'Verification', true, item_order, 'Pending', NOW());

    RAISE NOTICE 'Successfully created checklists for all entity types';
END $$;

