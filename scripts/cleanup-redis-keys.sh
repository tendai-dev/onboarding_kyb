#!/bin/bash

# Redis Key Cleanup Script
# Removes old JWT session keys from Redis after migration to database strategy
# 
# Usage:
#   ./scripts/cleanup-redis-keys.sh [redis-url]
#
# Example:
#   ./scripts/cleanup-redis-keys.sh redis://localhost:6379
#   ./scripts/cleanup-redis-keys.sh redis://redis.example.com:6379

set -e

REDIS_URL="${1:-${REDIS_URL:-redis://localhost:6379}}"

echo "🔍 Redis Key Cleanup Script"
echo "=========================="
echo ""
echo "Redis URL: $REDIS_URL"
echo ""

# Check if redis-cli is available
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Error: redis-cli is not installed"
    echo "   Install with: brew install redis (macOS) or apt-get install redis-tools (Linux)"
    exit 1
fi

# Extract host and port from URL
if [[ $REDIS_URL == redis://* ]]; then
    # Remove redis:// prefix
    HOST_PORT="${REDIS_URL#redis://}"
    
    # Handle password in URL (redis://password@host:port)
    if [[ $HOST_PORT == *@* ]]; then
        PASSWORD="${HOST_PORT%%@*}"
        HOST_PORT="${HOST_PORT#*@}"
        REDIS_PASSWORD="$PASSWORD"
    fi
    
    # Extract host and port
    if [[ $HOST_PORT == *:* ]]; then
        REDIS_HOST="${HOST_PORT%%:*}"
        REDIS_PORT="${HOST_PORT#*:}"
    else
        REDIS_HOST="$HOST_PORT"
        REDIS_PORT="6379"
    fi
else
    echo "❌ Error: Invalid Redis URL format. Expected: redis://host:port"
    exit 1
fi

echo "Connecting to Redis at $REDIS_HOST:$REDIS_PORT"
echo ""

# Test connection
if [ -n "$REDIS_PASSWORD" ]; then
    if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping &> /dev/null; then
        echo "❌ Error: Cannot connect to Redis"
        exit 1
    fi
else
    if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &> /dev/null; then
        echo "❌ Error: Cannot connect to Redis"
        exit 1
    fi
fi

echo "✅ Connected to Redis"
echo ""

# Count old session keys
echo "📊 Analyzing old session keys..."
if [ -n "$REDIS_PASSWORD" ]; then
    OLD_KEY_COUNT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --scan --pattern "session:*" | wc -l | tr -d ' ')
else
    OLD_KEY_COUNT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --scan --pattern "session:*" | wc -l | tr -d ' ')
fi

if [ "$OLD_KEY_COUNT" -eq 0 ]; then
    echo "✅ No old session keys found. Cleanup not needed."
    exit 0
fi

echo "Found $OLD_KEY_COUNT old session keys"
echo ""

# Show sample keys
echo "Sample old keys (first 5):"
if [ -n "$REDIS_PASSWORD" ]; then
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --scan --pattern "session:*" | head -5
else
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --scan --pattern "session:*" | head -5
fi
echo ""

# Confirm deletion
read -p "⚠️  Do you want to delete these $OLD_KEY_COUNT old session keys? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

# Delete keys
echo ""
echo "🗑️  Deleting old session keys..."
if [ -n "$REDIS_PASSWORD" ]; then
    DELETED=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --scan --pattern "session:*" | xargs -r redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" del | awk '{sum+=$1} END {print sum}')
else
    DELETED=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --scan --pattern "session:*" | xargs -r redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" del | awk '{sum+=$1} END {print sum}')
fi

echo "✅ Deleted $DELETED old session keys"
echo ""
echo "✅ Cleanup complete!"

