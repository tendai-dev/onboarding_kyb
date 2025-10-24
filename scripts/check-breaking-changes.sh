#!/bin/bash
# Script to detect breaking changes in OpenAPI specifications
# Uses openapi-diff to compare current spec with main branch

set -e

echo "🔍 Checking for breaking API changes..."

# Colors for output
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get list of changed OpenAPI specs
CHANGED_SPECS=$(git diff --name-only origin/main...HEAD | grep "openapi.yaml" || true)

if [ -z "$CHANGED_SPECS" ]; then
    echo "${GREEN}✅ No OpenAPI specs changed${NC}"
    exit 0
fi

echo "Changed specs:"
echo "$CHANGED_SPECS"
echo ""

# Track if any breaking changes found
BREAKING_CHANGES=0

# Check each changed spec
for SPEC in $CHANGED_SPECS; do
    echo "Checking $SPEC..."
    
    # Get the old version from main branch
    OLD_SPEC="/tmp/$(basename $SPEC).old"
    git show origin/main:$SPEC > $OLD_SPEC 2>/dev/null || {
        echo "${YELLOW}⚠️  New spec file, skipping breaking change check${NC}"
        continue
    }
    
    # Compare specs
    DIFF_OUTPUT=$(openapi-diff $OLD_SPEC $SPEC --json 2>&1 || true)
    
    # Check for breaking changes
    if echo "$DIFF_OUTPUT" | grep -q '"breakingChanges":\['; then
        echo "${RED}❌ Breaking changes detected in $SPEC:${NC}"
        echo "$DIFF_OUTPUT" | jq '.breakingChanges[] | "  - \(.method) \(.path): \(.change)"' || echo "$DIFF_OUTPUT"
        BREAKING_CHANGES=1
        echo ""
    else
        echo "${GREEN}✅ No breaking changes in $SPEC${NC}"
    fi
    
    # Show non-breaking changes as info
    if echo "$DIFF_OUTPUT" | grep -q '"nonBreakingChanges":\['; then
        echo "${YELLOW}ℹ️  Non-breaking changes in $SPEC:${NC}"
        echo "$DIFF_OUTPUT" | jq '.nonBreakingChanges[] | "  - \(.method) \(.path): \(.change)"' || true
        echo ""
    fi
    
    # Clean up
    rm -f $OLD_SPEC
done

if [ $BREAKING_CHANGES -eq 1 ]; then
    echo ""
    echo "${RED}═══════════════════════════════════════════${NC}"
    echo "${RED}  BREAKING CHANGES DETECTED!${NC}"
    echo "${RED}═══════════════════════════════════════════${NC}"
    echo ""
    echo "Breaking changes require:"
    echo "  1. Major version bump (e.g., v1 → v2)"
    echo "  2. Deprecation headers on old endpoints"
    echo "  3. Migration guide in /docs/api/migrations/"
    echo "  4. Approval from API governance team"
    echo ""
    echo "To proceed with breaking changes:"
    echo "  - Create migration guide: docs/api/migrations/v1-to-v2.md"
    echo "  - Get approval from @api-governance-team"
    echo "  - Add 'breaking-change-approved' label to MR"
    echo ""
    
    # Check if this is an approved breaking change
    if [ -n "$CI_MERGE_REQUEST_LABELS" ] && echo "$CI_MERGE_REQUEST_LABELS" | grep -q "breaking-change-approved"; then
        echo "${GREEN}✅ Breaking change approved via MR label${NC}"
        exit 0
    else
        echo "${RED}❌ Breaking change not approved${NC}"
        exit 1
    fi
fi

echo ""
echo "${GREEN}✅ All API changes are backward compatible${NC}"
exit 0

