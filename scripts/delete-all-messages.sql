-- Delete All Messages Script
-- WARNING: This will permanently delete ALL data from the messaging schema:
--   - All message attachments (messaging.message_attachments)
--   - All messages (messaging.messages)
--   - All message threads (messaging.message_threads)
-- This operation CANNOT be undone!
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f scripts/delete-all-messages.sql
--
-- Or with connection string:
--   psql "Host=127.0.0.1;Port=5433;Database=kyb_case;Username=postgres;Password=postgres" -f scripts/delete-all-messages.sql

-- First, let's see what we have
SELECT 'Message Attachments' as table_name, COUNT(*) as count FROM messaging.message_attachments
UNION ALL
SELECT 'Messages' as table_name, COUNT(*) as count FROM messaging.messages
UNION ALL
SELECT 'Message Threads' as table_name, COUNT(*) as count FROM messaging.message_threads;

-- Show sample data (first 3 from each main table)
SELECT 'Sample Message Threads:' as info;
SELECT id, application_id, application_reference, applicant_name, created_at, last_message_at
FROM messaging.message_threads
ORDER BY created_at DESC
LIMIT 3;

SELECT 'Sample Messages:' as info;
SELECT id, thread_id, sender_name, content, sent_at, status
FROM messaging.messages
ORDER BY sent_at DESC
LIMIT 3;

SELECT 'Sample Message Attachments:' as info;
SELECT id, message_id, file_name, content_type, file_size_bytes
FROM messaging.message_attachments
ORDER BY uploaded_at DESC
LIMIT 3;

-- ============================================
-- ACTUAL DELETION (Uncomment to execute)
-- ============================================
-- WARNING: Uncommenting the lines below will DELETE ALL DATA!

-- Delete in order to respect foreign key constraints:

-- 1. Delete message attachments first (child of messages)
-- DELETE FROM messaging.message_attachments;

-- 2. Delete messages (child of message_threads)
-- DELETE FROM messaging.messages;

-- 3. Delete message threads (parent table)
-- DELETE FROM messaging.message_threads;

-- ============================================
-- VERIFICATION (After deletion)
-- ============================================
-- After deletion, verify all tables are empty:
-- SELECT 'Message Attachments' as table_name, COUNT(*) as count FROM messaging.message_attachments
-- UNION ALL
-- SELECT 'Messages' as table_name, COUNT(*) as count FROM messaging.messages
-- UNION ALL
-- SELECT 'Message Threads' as table_name, COUNT(*) as count FROM messaging.message_threads;

