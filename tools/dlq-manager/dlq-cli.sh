#!/usr/bin/env bash
# DLQ Manager CLI - Manage Dead Letter Queue messages
# Usage: ./dlq-cli.sh [command] [options]

set -euo pipefail

KAFKA_BOOTSTRAP="${KAFKA_BOOTSTRAP:-kafka.platform-observability:9092}"
DLQ_TOPIC_PREFIX="${DLQ_TOPIC_PREFIX:-dlq}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Show help
show_help() {
    cat << EOF
DLQ Manager CLI - Manage Dead Letter Queue Messages

Usage:
  ./dlq-cli.sh [command] [options]

Commands:
  list                List all DLQ topics and message counts
  view <topic>        View messages in a DLQ topic
  replay <topic>      Replay all messages from DLQ back to source topic
  replay-one <topic> <offset>  Replay single message
  purge <topic>       Delete all messages from DLQ (requires confirmation)
  stats <topic>       Show detailed statistics for a DLQ topic

Examples:
  ./dlq-cli.sh list
  ./dlq-cli.sh view dlq.onboarding.domain-events
  ./dlq-cli.sh replay dlq.onboarding.domain-events
  ./dlq-cli.sh purge dlq.onboarding.domain-events

Environment Variables:
  KAFKA_BOOTSTRAP     Kafka bootstrap servers (default: kafka.platform-observability:9092)
  DLQ_TOPIC_PREFIX    DLQ topic prefix (default: dlq)

EOF
}

# List all DLQ topics
list_dlqs() {
    echo "📋 Dead Letter Queue Topics"
    echo "============================"
    
    kubectl exec -n platform-observability kafka-0 -- \
        kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP" --list | grep "^${DLQ_TOPIC_PREFIX}\." || echo "No DLQ topics found"
    
    echo ""
    echo "📊 Message Counts"
    echo "================="
    
    for topic in $(kubectl exec -n platform-observability kafka-0 -- \
        kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP" --list | grep "^${DLQ_TOPIC_PREFIX}\."); do
        
        count=$(kubectl exec -n platform-observability kafka-0 -- \
            kafka-run-class.sh kafka.tools.GetOffsetShell \
            --broker-list "$KAFKA_BOOTSTRAP" \
            --topic "$topic" \
            --time -1 | awk -F':' '{sum += $3} END {print sum}')
        
        echo "$topic: $count messages"
    done
}

# View messages in DLQ
view_dlq() {
    local topic=$1
    local limit=${2:-10}
    
    echo "📨 Messages in $topic (limit: $limit)"
    echo "========================================"
    
    kubectl exec -n platform-observability kafka-0 -- \
        kafka-console-consumer.sh \
        --bootstrap-server "$KAFKA_BOOTSTRAP" \
        --topic "$topic" \
        --from-beginning \
        --max-messages "$limit" \
        --property print.timestamp=true \
        --property print.key=true \
        --property print.headers=true \
        --property print.offset=true \
        --timeout-ms 5000 || echo "No messages or timeout"
}

# Replay messages from DLQ back to source topic
replay_dlq() {
    local dlq_topic=$1
    local source_topic=${dlq_topic#$DLQ_TOPIC_PREFIX.}
    
    echo -e "${YELLOW}⚠️  About to replay messages from:${NC}"
    echo "   Source: $dlq_topic"
    echo "   Target: $source_topic"
    echo ""
    read -p "Continue? (yes/no) " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "Cancelled"
        exit 0
    fi
    
    echo "🔄 Replaying messages..."
    
    # Create temporary consumer group
    local consumer_group="dlq-replay-$(date +%s)"
    
    # Consume from DLQ and produce to source topic
    kubectl exec -i -n platform-observability kafka-0 -- bash << EOF
kafka-console-consumer.sh \\
    --bootstrap-server "$KAFKA_BOOTSTRAP" \\
    --topic "$dlq_topic" \\
    --from-beginning \\
    --group "$consumer_group" \\
    --property print.key=true \\
    --property print.headers=true | \\
kafka-console-producer.sh \\
    --bootstrap-server "$KAFKA_BOOTSTRAP" \\
    --topic "$source_topic" \\
    --property "parse.key=true" \\
    --property "parse.headers=true"
EOF
    
    echo -e "${GREEN}✓ Replay complete${NC}"
}

# Replay single message
replay_one() {
    local dlq_topic=$1
    local offset=$2
    local source_topic=${dlq_topic#$DLQ_TOPIC_PREFIX.}
    
    echo "🔄 Replaying message at offset $offset from $dlq_topic to $source_topic..."
    
    # Get single message and republish
    kubectl exec -i -n platform-observability kafka-0 -- bash << EOF
kafka-console-consumer.sh \\
    --bootstrap-server "$KAFKA_BOOTSTRAP" \\
    --topic "$dlq_topic" \\
    --partition 0 \\
    --offset "$offset" \\
    --max-messages 1 \\
    --property print.key=true \\
    --property print.headers=true | \\
kafka-console-producer.sh \\
    --bootstrap-server "$KAFKA_BOOTSTRAP" \\
    --topic "$source_topic" \\
    --property "parse.key=true" \\
    --property "parse.headers=true"
EOF
    
    echo -e "${GREEN}✓ Message replayed${NC}"
}

# Purge DLQ topic
purge_dlq() {
    local topic=$1
    
    echo -e "${RED}⚠️  WARNING: About to DELETE ALL messages from: $topic${NC}"
    echo "This operation cannot be undone!"
    echo ""
    read -p "Type the topic name to confirm: " -r
    if [[ $REPLY != "$topic" ]]; then
        echo "Topic name doesn't match. Cancelled."
        exit 0
    fi
    
    echo "🗑️  Purging $topic..."
    
    # Delete and recreate topic
    kubectl exec -n platform-observability kafka-0 -- \
        kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP" --delete --topic "$topic"
    
    sleep 2
    
    kubectl exec -n platform-observability kafka-0 -- \
        kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP" --create --topic "$topic" \
        --partitions 1 --replication-factor 1
    
    echo -e "${GREEN}✓ DLQ purged${NC}"
}

# Show stats for DLQ
stats_dlq() {
    local topic=$1
    
    echo "📊 Statistics for $topic"
    echo "========================"
    
    # Message count
    local count=$(kubectl exec -n platform-observability kafka-0 -- \
        kafka-run-class.sh kafka.tools.GetOffsetShell \
        --broker-list "$KAFKA_BOOTSTRAP" \
        --topic "$topic" \
        --time -1 | awk -F':' '{sum += $3} END {print sum}')
    
    echo "Total messages: $count"
    
    # Topic config
    echo ""
    echo "Topic Configuration:"
    kubectl exec -n platform-observability kafka-0 -- \
        kafka-configs.sh --bootstrap-server "$KAFKA_BOOTSTRAP" \
        --describe --topic "$topic"
    
    # Consumer groups
    echo ""
    echo "Consumer Groups:"
    kubectl exec -n platform-observability kafka-0 -- \
        kafka-consumer-groups.sh --bootstrap-server "$KAFKA_BOOTSTRAP" \
        --list | grep "$topic" || echo "No consumer groups"
}

# Main command dispatcher
case "${1:-help}" in
    list)
        list_dlqs
        ;;
    view)
        if [ -z "${2:-}" ]; then
            echo "Error: Topic name required"
            echo "Usage: $0 view <topic> [limit]"
            exit 1
        fi
        view_dlq "$2" "${3:-10}"
        ;;
    replay)
        if [ -z "${2:-}" ]; then
            echo "Error: Topic name required"
            echo "Usage: $0 replay <topic>"
            exit 1
        fi
        replay_dlq "$2"
        ;;
    replay-one)
        if [ -z "${2:-}" ] || [ -z "${3:-}" ]; then
            echo "Error: Topic name and offset required"
            echo "Usage: $0 replay-one <topic> <offset>"
            exit 1
        fi
        replay_one "$2" "$3"
        ;;
    purge)
        if [ -z "${2:-}" ]; then
            echo "Error: Topic name required"
            echo "Usage: $0 purge <topic>"
            exit 1
        fi
        purge_dlq "$2"
        ;;
    stats)
        if [ -z "${2:-}" ]; then
            echo "Error: Topic name required"
            echo "Usage: $0 stats <topic>"
            exit 1
        fi
        stats_dlq "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

