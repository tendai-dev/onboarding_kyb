-- Migration: Add business_name column to work_items table
-- Run this SQL script on your PostgreSQL database

-- Add the business_name column
ALTER TABLE work_queue.work_items 
ADD COLUMN IF NOT EXISTS business_name VARCHAR(500) NULL;

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = 'work_queue' 
  AND table_name = 'work_items' 
  AND column_name = 'business_name';

