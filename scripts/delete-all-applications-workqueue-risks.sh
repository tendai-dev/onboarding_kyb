#!/bin/bash

# Delete All Applications, Work Queue Items, and Risks Script
# WARNING: This will permanently delete ALL data from:
#   - All applications (onboarding."Applications" and onboarding.onboarding_cases)
#   - All work queue items (work_queue schema)
#   - All risk assessments (risk schema)
# This operation CANNOT be undone!
#
# Usage:
#   ./scripts/delete-all-applications-workqueue-risks.sh
#   ./scripts/delete-all-applications-workqueue-risks.sh "Host=127.0.0.1;Port=5433;Database=kyb_case;Username=postgres;Password=postgres"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🗑️  Delete All Applications, Work Queue Items, and Risks Utility"
echo "=================================================================="
echo ""
echo "⚠️  WARNING: This will permanently delete ALL data from:"
echo "   - All applications (onboarding.\"Applications\" and onboarding.onboarding_cases)"
echo "   - All work queue items (work_queue schema)"
echo "   - All risk assessments (risk schema)"
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
SELECT '  Applications (old): ' || COUNT(*) FROM onboarding.\"Applications\"
UNION ALL
SELECT '  Onboarding Cases: ' || COUNT(*) FROM onboarding.onboarding_cases
UNION ALL
SELECT '  Case Projections: ' || COUNT(*) FROM projections.onboarding_case_projections
UNION ALL
SELECT '  Work Item Comments: ' || COUNT(*) FROM work_queue.work_item_comments
UNION ALL
SELECT '  Work Item History: ' || COUNT(*) FROM work_queue.work_item_history
UNION ALL
SELECT '  Work Items: ' || COUNT(*) FROM work_queue.work_items
UNION ALL
SELECT '  Risk Factors: ' || COUNT(*) FROM risk.risk_factors
UNION ALL
SELECT '  Risk Assessments: ' || COUNT(*) FROM risk.risk_assessments;
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
echo "1. Deleting work item comments..."
psql "$CONNECTION_STRING" -c "DELETE FROM work_queue.work_item_comments;" || echo "  (table may not exist or already empty)"

echo "2. Deleting work item history..."
psql "$CONNECTION_STRING" -c "DELETE FROM work_queue.work_item_history;" || echo "  (table may not exist or already empty)"

echo "3. Deleting work items..."
psql "$CONNECTION_STRING" -c "DELETE FROM work_queue.work_items;" || echo "  (table may not exist or already empty)"

echo "4. Deleting risk factors..."
psql "$CONNECTION_STRING" -c "DELETE FROM risk.risk_factors;" || echo "  (table may not exist or already empty)"

echo "5. Deleting risk assessments..."
psql "$CONNECTION_STRING" -c "DELETE FROM risk.risk_assessments;" || echo "  (table may not exist or already empty)"

echo "6. Deleting case projections..."
psql "$CONNECTION_STRING" -c "DELETE FROM projections.onboarding_case_projections;" || echo "  (table may not exist or already empty)"

echo "7. Deleting onboarding cases..."
psql "$CONNECTION_STRING" -c "DELETE FROM onboarding.onboarding_cases;" || echo "  (table may not exist or already empty)"

echo "8. Deleting old applications..."
psql "$CONNECTION_STRING" -c "DELETE FROM onboarding.\"Applications\";" || echo "  (table may not exist or already empty)"

echo ""
echo "✅ Deletion completed!"
echo ""
echo "📊 Verification - Remaining data counts:"
psql "$CONNECTION_STRING" -t -c "
SELECT '  Applications (old): ' || COUNT(*) FROM onboarding.\"Applications\"
UNION ALL
SELECT '  Onboarding Cases: ' || COUNT(*) FROM onboarding.onboarding_cases
UNION ALL
SELECT '  Case Projections: ' || COUNT(*) FROM projections.onboarding_case_projections
UNION ALL
SELECT '  Work Item Comments: ' || COUNT(*) FROM work_queue.work_item_comments
UNION ALL
SELECT '  Work Item History: ' || COUNT(*) FROM work_queue.work_item_history
UNION ALL
SELECT '  Work Items: ' || COUNT(*) FROM work_queue.work_items
UNION ALL
SELECT '  Risk Factors: ' || COUNT(*) FROM risk.risk_factors
UNION ALL
SELECT '  Risk Assessments: ' || COUNT(*) FROM risk.risk_assessments;
"

echo ""
echo "✅ Operation completed successfully!"

