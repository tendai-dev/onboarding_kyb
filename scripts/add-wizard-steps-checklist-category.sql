-- Migration: Add missing checklist_category column to wizard_steps table
-- This fixes the error: "42703: column w0.checklist_category does not exist"
-- 
-- Run this against the entity_configuration database

-- Add the checklist_category column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'entity_configuration' 
        AND table_name = 'wizard_steps' 
        AND column_name = 'checklist_category'
    ) THEN
        ALTER TABLE entity_configuration.wizard_steps 
        ADD COLUMN checklist_category character varying(100) NOT NULL DEFAULT '';
        
        RAISE NOTICE 'Column checklist_category added to wizard_steps table';
    ELSE
        RAISE NOTICE 'Column checklist_category already exists in wizard_steps table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = 'entity_configuration' 
AND table_name = 'wizard_steps'
ORDER BY ordinal_position;
