#!/bin/bash

# Delete All Messages Script
# WARNING: This will permanently delete ALL data from:
#   - All message attachments (messaging.message_attachments)
#   - All messages (messaging.messages)
#   - All message threads (messaging.message_threads)
# This operation CANNOT be undone!
#
# Usage:
#   ./scripts/delete-all-messages.sh
#   ./scripts/delete-all-messages.sh "Host=127.0.0.1;Port=5433;Database=kyb_case;Username=postgres;Password=postgres"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🗑️  Delete All Messages Utility"
echo "================================="
echo ""
echo "⚠️  WARNING: This will permanently delete ALL data from:"
echo "   - All message attachments (messaging.message_attachments)"
echo "   - All messages (messaging.messages)"
echo "   - All message threads (messaging.message_threads)"
echo "⚠️  This operation CANNOT be undone!"
echo ""

# Check if connection string is provided as argument
if [ -n "$1" ]; then
    CONNECTION_STRING="$1"
    echo "Using provided connection string"
else
    # Try to get connection string from environment or use defaults
    CONNECTION_STRING="${DATABASE_URL:-Host=127.0.0.1;Port=5433;Database=kyb_case;Username=postgres;Password=postgres}"
    echo "Using connection string from environment or defaults"
fi

# Mask password in display
DISPLAY_CONNECTION="${CONNECTION_STRING/Password=*/Password=***}"
echo "Connection: $DISPLAY_CONNECTION"
echo ""

# Show current counts
echo "📊 Current data counts:"
psql "$CONNECTION_STRING" -t -c "
SELECT '  Message Attachments: ' || COUNT(*) FROM messaging.message_attachments
UNION ALL
SELECT '  Messages: ' || COUNT(*) FROM messaging.messages
UNION ALL
SELECT '  Message Threads: ' || COUNT(*) FROM messaging.message_threads;
"

echo ""
echo "⚠️  Are you sure you want to delete ALL this data?"
echo "⚠️  Type 'DELETE ALL' (in uppercase) to confirm:"
read -r confirmation

if [ "$confirmation" != "DELETE ALL" ]; then
    echo "❌ Deletion cancelled. No data was deleted."
    exit 0
fi

echo ""
echo "🗑️  Starting deletion..."
echo ""

# Delete in order to respect foreign key constraints
echo "1. Deleting message attachments..."
psql "$CONNECTION_STRING" -c "DELETE FROM messaging.message_attachments;" || echo "  (table may not exist or already empty)"

echo "2. Deleting messages..."
psql "$CONNECTION_STRING" -c "DELETE FROM messaging.messages;" || echo "  (table may not exist or already empty)"

echo "3. Deleting message threads..."
psql "$CONNECTION_STRING" -c "DELETE FROM messaging.message_threads;" || echo "  (table may not exist or already empty)"

echo ""
echo "✅ Deletion completed!"
echo ""

echo "📊 Verification - Remaining data counts:"
psql "$CONNECTION_STRING" -t -c "
SELECT '  Message Attachments: ' || COUNT(*) FROM messaging.message_attachments
UNION ALL
SELECT '  Messages: ' || COUNT(*) FROM messaging.messages
UNION ALL
SELECT '  Message Threads: ' || COUNT(*) FROM messaging.message_threads;
"

echo ""
echo "✅ Operation completed successfully!"

