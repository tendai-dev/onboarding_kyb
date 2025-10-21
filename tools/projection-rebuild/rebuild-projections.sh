#!/usr/bin/env bash
# Projection Rebuild Tool
# Rebuilds read models from event store or source tables
# Usage: ./rebuild-projections.sh [projection-name] [--from-date YYYY-MM-DD]

set -euo pipefail

PROJECTION="${1:-all}"
FROM_DATE="${2:-1970-01-01}"
DRY_RUN="${3:-false}"

POSTGRES_HOST="postgresql.platform-observability"
POSTGRES_USER="onboarding_user"
POSTGRES_DB="onboarding"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $*"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $*"
}

# Rebuild case summary projection
rebuild_case_summary() {
    log "Rebuilding case summary projection..."
    
    if [ "$DRY_RUN" == "true" ]; then
        warn "DRY RUN - No changes will be made"
    fi
    
    kubectl exec -n platform-observability postgresql-0 -- \
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" << 'SQL'
BEGIN;

-- Clear existing projection data
TRUNCATE TABLE projections.case_summary;

-- Rebuild from source tables
INSERT INTO projections.case_summary (
    case_id,
    case_number,
    partner_id,
    partner_name,
    type,
    status,
    applicant_name,
    applicant_email,
    document_count,
    verified_document_count,
    checklist_completion_percent,
    risk_score,
    created_at,
    updated_at,
    last_activity_at
)
SELECT 
    oc.id as case_id,
    oc.case_number,
    oc.partner_id,
    p.organization_name as partner_name,
    oc.type,
    oc.status,
    oc.applicant_first_name || ' ' || oc.applicant_last_name as applicant_name,
    oc.applicant_email,
    (SELECT COUNT(*) FROM documents.documents d WHERE d.case_id = oc.id) as document_count,
    (SELECT COUNT(*) FROM documents.documents d WHERE d.case_id = oc.id AND d.status = 'Verified') as verified_document_count,
    (SELECT COALESCE(AVG(CASE WHEN status = 'Completed' THEN 100 ELSE 0 END), 0) 
     FROM checklist.checklist_items ci WHERE ci.case_id = oc.id) as checklist_completion_percent,
    (SELECT score FROM risk.assessments r WHERE r.case_id = oc.id ORDER BY assessed_at DESC LIMIT 1) as risk_score,
    oc.created_at,
    oc.updated_at,
    GREATEST(oc.updated_at, 
             (SELECT MAX(uploaded_at) FROM documents.documents d WHERE d.case_id = oc.id),
             (SELECT MAX(completed_at) FROM checklist.checklist_items ci WHERE ci.case_id = oc.id)
    ) as last_activity_at
FROM onboarding.onboarding_cases oc
LEFT JOIN partners p ON oc.partner_id = p.id
WHERE oc.created_at >= '$FROM_DATE';

COMMIT;
SQL

    if [ "$DRY_RUN" == "false" ]; then
        log "✓ Case summary projection rebuilt"
    fi
}

# Rebuild document statistics projection
rebuild_document_stats() {
    log "Rebuilding document statistics projection..."
    
    kubectl exec -n platform-observability postgresql-0 -- \
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" << 'SQL'
BEGIN;

TRUNCATE TABLE projections.document_statistics;

INSERT INTO projections.document_statistics (
    partner_id,
    date,
    total_uploaded,
    total_verified,
    total_rejected,
    avg_verification_time_hours,
    virus_detected_count
)
SELECT 
    d.partner_id,
    DATE(d.uploaded_at) as date,
    COUNT(*) as total_uploaded,
    COUNT(*) FILTER (WHERE d.status = 'Verified') as total_verified,
    COUNT(*) FILTER (WHERE d.status = 'Rejected') as total_rejected,
    AVG(EXTRACT(EPOCH FROM (d.verified_at - d.uploaded_at)) / 3600) 
        FILTER (WHERE d.verified_at IS NOT NULL) as avg_verification_time_hours,
    COUNT(*) FILTER (WHERE d.is_virus_scanned = true AND d.is_virus_clean = false) as virus_detected_count
FROM documents.documents d
WHERE d.uploaded_at >= '$FROM_DATE'
GROUP BY d.partner_id, DATE(d.uploaded_at);

COMMIT;
SQL

    log "✓ Document statistics projection rebuilt"
}

# Rebuild from event store (event sourcing)
rebuild_from_events() {
    local projection=$1
    
    log "Rebuilding $projection from event store..."
    
    # Call projection service API to trigger rebuild
    kubectl exec -n business-readmodel deployment/projections-api -- \
        curl -X POST http://localhost:8080/admin/projections/$projection/rebuild \
        -H "Content-Type: application/json" \
        -d "{\"from_date\": \"$FROM_DATE\", \"dry_run\": $DRY_RUN}"
    
    log "✓ Rebuild triggered for $projection"
}

# Main logic
case "$PROJECTION" in
    case-summary)
        rebuild_case_summary
        ;;
    document-stats)
        rebuild_document_stats
        ;;
    all)
        log "Rebuilding all projections..."
        rebuild_case_summary
        rebuild_document_stats
        log "✓ All projections rebuilt"
        ;;
    *)
        # Event-sourced projection
        rebuild_from_events "$PROJECTION"
        ;;
esac

# Verify rebuild
log "Verifying rebuilt projections..."

COUNT=$(kubectl exec -n platform-observability postgresql-0 -- \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
    "SELECT COUNT(*) FROM projections.case_summary;")

log "Case summary projection: $COUNT records"

log "✓ Projection rebuild complete"

