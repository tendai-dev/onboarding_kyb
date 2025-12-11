#!/bin/bash

# Redis Session Verification Script
# Verifies that NextAuth database sessions are working correctly
#
# Usage:
#   ./scripts/verify-redis-sessions.sh [redis-url]
#
# Example:
#   ./scripts/verify-redis-sessions.sh redis://localhost:6379

set -e

REDIS_URL="${1:-${REDIS_URL:-redis://localhost:6379}}"

echo "🔍 NextAuth Redis Session Verification"
echo "======================================="
echo ""
echo "Redis URL: $REDIS_URL"
echo ""

# Check if redis-cli is available
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Error: redis-cli is not installed"
    exit 1
fi

# Extract connection details (simplified version)
if [[ $REDIS_URL == redis://* ]]; then
    HOST_PORT="${REDIS_URL#redis://}"
    if [[ $HOST_PORT == *@* ]]; then
        PASSWORD="${HOST_PORT%%@*}"
        HOST_PORT="${HOST_PORT#*@}"
        REDIS_PASSWORD="$PASSWORD"
    fi
    if [[ $HOST_PORT == *:* ]]; then
        REDIS_HOST="${HOST_PORT%%:*}"
        REDIS_PORT="${HOST_PORT#*:}"
    else
        REDIS_HOST="$HOST_PORT"
        REDIS_PORT="6379"
    fi
fi

# Build redis-cli command
if [ -n "$REDIS_PASSWORD" ]; then
    REDIS_CMD="redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD"
else
    REDIS_CMD="redis-cli -h $REDIS_HOST -p $REDIS_PORT"
fi

# Test connection
if ! $REDIS_CMD ping &> /dev/null; then
    echo "❌ Error: Cannot connect to Redis"
    exit 1
fi

echo "✅ Connected to Redis"
echo ""

# Check NextAuth keys
echo "📊 NextAuth Key Statistics:"
echo ""

# Users
USER_COUNT=$($REDIS_CMD --scan --pattern "nextauth:user:*" | grep -v "email:" | wc -l | tr -d ' ')
echo "  Users: $USER_COUNT"

# Sessions
SESSION_COUNT=$($REDIS_CMD --scan --pattern "nextauth:session:*" | wc -l | tr -d ' ')
echo "  Sessions: $SESSION_COUNT"

# Accounts
ACCOUNT_COUNT=$($REDIS_CMD --scan --pattern "nextauth:account:*" | grep -v "user:" | wc -l | tr -d ' ')
echo "  Accounts: $ACCOUNT_COUNT"

# Old session keys (should be 0 or minimal)
OLD_SESSION_COUNT=$($REDIS_CMD --scan --pattern "session:*" | wc -l | tr -d ' ')
echo "  Old JWT session keys: $OLD_SESSION_COUNT"

echo ""

# Show sample keys
echo "📋 Sample Keys:"
echo ""
echo "Sample Users (first 3):"
$REDIS_CMD --scan --pattern "nextauth:user:*" | grep -v "email:" | head -3
echo ""
echo "Sample Sessions (first 3):"
$REDIS_CMD --scan --pattern "nextauth:session:*" | head -3
echo ""
echo "Sample Accounts (first 3):"
$REDIS_CMD --scan --pattern "nextauth:account:*" | grep -v "user:" | head -3
echo ""

# Health check
echo "🏥 Health Check:"
if [ "$SESSION_COUNT" -gt 0 ]; then
    echo "  ✅ Active sessions found"
else
    echo "  ⚠️  No active sessions (may be normal if no users logged in)"
fi

if [ "$OLD_SESSION_COUNT" -gt 0 ]; then
    echo "  ⚠️  Old session keys still present (consider cleanup)"
else
    echo "  ✅ No old session keys found"
fi

echo ""
echo "✅ Verification complete!"

