#!/bin/bash

# Quick Database Schema Viewer
# Usage: ./quick-schema-view.sh [database_name]

DB_NAME=${1:-onboarding}

echo "════════════════════════════════════════════════════════"
echo "     DATABASE SCHEMA: $DB_NAME"
echo "════════════════════════════════════════════════════════"
echo ""

# Show all tables with column details
docker exec postgres psql -U keycloak -d $DB_NAME -c "
SELECT 
    t.table_name AS \"Table\",
    string_agg(
        c.column_name || ' (' || c.data_type || 
        CASE 
            WHEN c.is_nullable = 'NO' THEN ', NOT NULL' 
            ELSE '' 
        END || ')', 
        E'\n  ' ORDER BY c.ordinal_position
    ) AS \"Columns\"
FROM 
    information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE 
    t.table_schema = 'public'
GROUP BY 
    t.table_name
ORDER BY 
    t.table_name;
" 2>/dev/null

echo ""
echo "════════════════════════════════════════════════════════"
echo "To view other databases, run: ./quick-schema-view.sh [database_name]"
echo "Available databases: onboarding, documents, risk, notifications, checklist, auditlog, workqueue, webhooks, projections, messaging"
