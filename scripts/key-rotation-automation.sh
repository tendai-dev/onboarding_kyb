#!/usr/bin/env bash
# Automated Key Rotation Script
# Rotates secrets on schedule and alerts when manual rotation needed
# Run via cron: 0 2 1 * * /root/scripts/key-rotation-automation.sh

set -euo pipefail

ROTATION_LOG="/var/log/key-rotation.log"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
ROTATION_AGE_DAYS=90

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$ROTATION_LOG"
}

alert_slack() {
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$1\"}"
    fi
}

# Check secret age in Kubernetes
check_secret_age() {
    local secret_name=$1
    local namespace=$2
    
    if ! kubectl get secret "$secret_name" -n "$namespace" &>/dev/null; then
        log "Secret $secret_name not found in namespace $namespace"
        return 0
    fi
    
    local created=$(kubectl get secret "$secret_name" -n "$namespace" -o jsonpath='{.metadata.creationTimestamp}')
    local created_epoch=$(date -d "$created" +%s)
    local now_epoch=$(date +%s)
    local age_days=$(( (now_epoch - created_epoch) / 86400 ))
    
    echo "$age_days"
}

# Rotate MinIO access keys
rotate_minio_keys() {
    log "Rotating MinIO access keys..."
    
    # Generate new credentials
    local new_access_key="minio-$(openssl rand -hex 8)"
    local new_secret_key=$(openssl rand -base64 32)
    
    # Update MinIO (requires MinIO admin access)
    kubectl exec -n platform-observability minio-0 -- mc admin user add local "$new_access_key" "$new_secret_key"
    
    # Update Kubernetes secret
    kubectl create secret generic minio-credentials \
        --from-literal=accesskey="$new_access_key" \
        --from-literal=secretkey="$new_secret_key" \
        -n platform-observability \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Restart document-service to pick up new credentials
    kubectl rollout restart deployment/document-service -n business-documents
    kubectl rollout status deployment/document-service -n business-documents --timeout=2m
    
    log "✓ MinIO keys rotated successfully"
    alert_slack "✅ MinIO access keys rotated successfully"
}

# Rotate Redis password
rotate_redis_password() {
    log "Rotating Redis password..."
    
    # Generate new password
    local new_password=$(openssl rand -base64 24)
    
    # Update Redis password
    kubectl set env statefulset/redis-master \
        -n platform-observability \
        REDIS_PASSWORD="$new_password"
    
    # Wait for Redis to restart
    kubectl rollout status statefulset/redis-master -n platform-observability --timeout=3m
    
    # Update secret
    kubectl create secret generic redis-credentials \
        --from-literal=password="$new_password" \
        -n platform-observability \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Restart all services using Redis
    for ns in business-onboarding business-documents business-risk business-webhooks; do
        kubectl rollout restart deployment -n "$ns"
    done
    
    log "✓ Redis password rotated successfully"
    alert_slack "✅ Redis password rotated successfully"
}

# Generate webhook signing secret for partner
generate_webhook_secret() {
    local partner_id=$1
    local new_secret=$(openssl rand -base64 32)
    
    log "Generated new webhook secret for partner $partner_id"
    
    # Update in database
    kubectl exec -n platform-observability postgresql-0 -- \
        psql -U onboarding_user -d onboarding -c \
        "UPDATE partners SET webhook_secret = '$new_secret', webhook_secret_rotated_at = NOW() WHERE id = '$partner_id';"
    
    echo "$new_secret"
}

# Main rotation logic
main() {
    log "=== Starting automated key rotation check ==="
    
    # Check MinIO keys age
    local minio_age=$(check_secret_age "minio-credentials" "platform-observability")
    log "MinIO credentials age: $minio_age days"
    
    if [ "$minio_age" -gt "$ROTATION_AGE_DAYS" ]; then
        log "⚠️  MinIO credentials are $minio_age days old (threshold: $ROTATION_AGE_DAYS days)"
        alert_slack "⚠️  MinIO credentials need rotation ($minio_age days old)"
        
        # Auto-rotate if enabled
        if [ "${AUTO_ROTATE_MINIO:-false}" == "true" ]; then
            rotate_minio_keys
        else
            log "Auto-rotation disabled, manual intervention required"
        fi
    fi
    
    # Check Redis password age
    local redis_age=$(check_secret_age "redis-credentials" "platform-observability")
    log "Redis credentials age: $redis_age days"
    
    if [ "$redis_age" -gt "$ROTATION_AGE_DAYS" ]; then
        log "⚠️  Redis credentials are $redis_age days old (threshold: $ROTATION_AGE_DAYS days)"
        alert_slack "⚠️  Redis credentials need rotation ($redis_age days old)"
        
        if [ "${AUTO_ROTATE_REDIS:-false}" == "true" ]; then
            rotate_redis_password
        else
            log "Auto-rotation disabled, manual intervention required"
        fi
    fi
    
    # Check Keycloak client secrets
    log "Checking Keycloak client secret ages..."
    # Query Keycloak API for secret ages (requires implementation)
    
    # Check webhook secrets per partner
    log "Checking webhook secret ages..."
    kubectl exec -n platform-observability postgresql-0 -- \
        psql -U onboarding_user -d onboarding -c \
        "SELECT id, organization_name, 
                EXTRACT(DAY FROM NOW() - webhook_secret_rotated_at) as age_days 
         FROM partners 
         WHERE webhook_secret_rotated_at < NOW() - INTERVAL '$ROTATION_AGE_DAYS days';" | \
    while read -r line; do
        log "Partner webhook secret needs rotation: $line"
        alert_slack "⚠️  Partner webhook secret needs rotation: $line"
    done
    
    # Check TLS certificates
    log "Checking TLS certificate expiry..."
    kubectl get certificates -A -o json | jq -r '
        .items[] | 
        select(.status.notAfter != null) |
        select(((.status.notAfter | fromdateiso8601) - now) / 86400 < 30) |
        "\(.metadata.namespace)/\(.metadata.name): expires in \((((.status.notAfter | fromdateiso8601) - now) / 86400 | floor)) days"
    ' | while read -r line; do
        log "⚠️  Certificate expiring soon: $line"
        alert_slack "⚠️  Certificate expiring soon: $line"
    done
    
    log "=== Key rotation check complete ==="
}

# Run main
main "$@"

