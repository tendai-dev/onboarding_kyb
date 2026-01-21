#!/bin/bash

# Script to monitor admin logs in real-time
# Usage: ./monitor-logs.sh

echo "=== Monitoring Admin Server Logs ==="
echo "Press Ctrl+C to stop"
echo ""

# Monitor both server logs and filter for important messages
tail -f /tmp/admin.log 2>/dev/null | grep --line-buffered -E "\[AdminLoginPage\]|\[Providers\]|\[NextAuth|error|Error|ERROR|session|Session|callback|Callback" | while read line; do
  timestamp=$(date '+%H:%M:%S')
  echo "[$timestamp] $line"
done

