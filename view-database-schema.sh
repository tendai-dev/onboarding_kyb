#!/bin/bash

echo "📊 DATABASE SCHEMA VIEWER"
echo "========================"
echo ""

# Function to view schema for a specific database
view_schema() {
    local db_name=$1
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📁 DATABASE: $db_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # List all tables
    echo -e "\n📋 TABLES:"
    docker exec postgres psql -U keycloak -d $db_name -t -c "
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public' 
        ORDER BY table_name;" 2>/dev/null
    
    # Show detailed schema for each table
    docker exec postgres psql -U keycloak -d $db_name -t -c "
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public'" 2>/dev/null | while read table; do
        if [ ! -z "$table" ]; then
            echo -e "\n🔍 TABLE: $table"
            docker exec postgres psql -U keycloak -d $db_name -c "\d $table" 2>/dev/null | head -20
        fi
    done
}

# Main menu
echo "Choose an option:"
echo "1. View ALL database schemas"
echo "2. View specific database schema"
echo "3. Export schema to SQL file"
echo "4. Generate HTML documentation"
echo "5. Show table relationships"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo -e "\n📊 VIEWING ALL DATABASE SCHEMAS\n"
        for db in onboarding documents risk notifications checklist messaging auditlog workqueue webhooks projections; do
            view_schema $db
        done
        ;;
    
    2)
        echo "Available databases:"
        docker exec postgres psql -U keycloak -l -t 2>/dev/null | cut -d'|' -f1 | grep -v template | sort
        read -p "Enter database name: " db_name
        view_schema $db_name
        ;;
    
    3)
        read -p "Enter database name to export: " db_name
        echo "Exporting schema for $db_name..."
        docker exec postgres pg_dump -U keycloak --schema-only -d $db_name > ${db_name}_schema.sql 2>/dev/null
        echo "✅ Schema exported to ${db_name}_schema.sql"
        ;;
    
    4)
        echo "Generating HTML documentation..."
        cat > schema_viewer.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Database Schema Viewer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .database { border: 1px solid #ddd; margin: 10px 0; padding: 15px; }
        .table { background: #f5f5f5; margin: 10px 0; padding: 10px; }
        .field { margin-left: 20px; font-family: monospace; }
        .type { color: #0066cc; }
        .constraint { color: #cc0000; }
    </style>
</head>
<body>
    <h1>Onboarding KYC Database Schema</h1>
EOF
        
        for db in onboarding documents risk notifications checklist auditlog workqueue; do
            echo "<div class='database'><h2>📁 $db</h2>" >> schema_viewer.html
            
            docker exec postgres psql -U keycloak -d $db -t -c "
                SELECT '<div class=\"table\"><h3>' || table_name || '</h3>' ||
                       '<div class=\"field\">' || 
                       string_agg(column_name || ' <span class=\"type\">' || data_type || '</span>', '<br>') ||
                       '</div></div>'
                FROM information_schema.columns 
                WHERE table_schema='public'
                GROUP BY table_name;" 2>/dev/null >> schema_viewer.html
            
            echo "</div>" >> schema_viewer.html
        done
        
        echo "</body></html>" >> schema_viewer.html
        echo "✅ HTML documentation generated: schema_viewer.html"
        open schema_viewer.html 2>/dev/null || echo "Open schema_viewer.html in your browser"
        ;;
    
    5)
        echo -e "\n📊 TABLE RELATIONSHIPS\n"
        docker exec postgres psql -U keycloak -c "
            SELECT 
                conrelid::regclass AS table_from,
                conname AS constraint_name,
                pg_get_constraintdef(oid) AS definition
            FROM pg_constraint
            WHERE contype = 'f'
            ORDER BY conrelid::regclass::text, contype DESC;" 2>/dev/null
        ;;
esac

echo -e "\n✅ Done!"
