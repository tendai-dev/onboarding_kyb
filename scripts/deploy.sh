#!/usr/bin/env bash
# Deployment script with safety checks
# Usage: ./deploy.sh [environment] [options]

set -euo pipefail

ENVIRONMENT="${1:-dev}"
DRY_RUN="${2:-}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Deployment Script"
echo "===================="
echo "Environment: $ENVIRONMENT"
echo ""

# Pre-deployment checks
echo "📋 Pre-deployment checks..."

# Check kubectl connectivity
if ! kubectl cluster-info &>/dev/null; then
    echo -e "${RED}✗ Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Kubernetes connectivity${NC}"

# Check all namespaces exist
REQUIRED_NAMESPACES=(
    "platform-ingress"
    "platform-observability"
    "platform-security"
    "business-onboarding"
    "business-documents"
    "business-risk"
    "business-notifications"
    "business-webhooks"
    "business-readmodel"
    "business-admin"
)

for ns in "${REQUIRED_NAMESPACES[@]}"; do
    if ! kubectl get namespace "$ns" &>/dev/null; then
        echo -e "${RED}✗ Namespace $ns does not exist${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ All required namespaces exist${NC}"

# Check Helm/Helmfile availability
if ! command -v helmfile &>/dev/null; then
    echo -e "${RED}✗ Helmfile not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Helmfile available${NC}"

# Check values file exists
VALUES_FILE="infra/helm/values/${ENVIRONMENT}.yaml"
if [ ! -f "$VALUES_FILE" ]; then
    echo -e "${RED}✗ Values file $VALUES_FILE not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Values file exists${NC}"

# Check for common misconfigurations
echo ""
echo "🔍 Configuration validation..."

# Check for default passwords
if grep -q "changeme\|change-me" "$VALUES_FILE"; then
    echo -e "${YELLOW}⚠ WARNING: Default passwords detected in $VALUES_FILE${NC}"
    read -p "Continue anyway? (yes/no) " -n 3 -r
    echo
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Backup current state
echo ""
echo "💾 Creating backup..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup current Helm releases
helm list -A -o yaml > "$BACKUP_DIR/helm-releases.yaml"
echo -e "${GREEN}✓ Backed up Helm releases to $BACKUP_DIR${NC}"

# Backup current deployments
kubectl get deployments -A -o yaml > "$BACKUP_DIR/deployments.yaml"
echo -e "${GREEN}✓ Backed up deployments to $BACKUP_DIR${NC}"

# Dry run if requested
if [ "$DRY_RUN" == "--dry-run" ]; then
    echo ""
    echo "🔍 Dry run mode - showing diff..."
    cd infra/helm
    helmfile --environment "$ENVIRONMENT" diff
    echo ""
    echo "Dry run complete. Run without --dry-run to apply changes."
    exit 0
fi

# Confirmation prompt
echo ""
echo -e "${YELLOW}⚠ Ready to deploy to $ENVIRONMENT${NC}"
echo "This will:"
echo "  - Update all platform services"
echo "  - Update all business services"
echo "  - Rolling restart affected pods"
echo ""
read -p "Continue with deployment? (yes/no) " -n 3 -r
echo
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

# Execute deployment
echo ""
echo "📦 Deploying..."
cd infra/helm

if ! helmfile --environment "$ENVIRONMENT" sync; then
    echo -e "${RED}✗ Deployment failed!${NC}"
    echo ""
    echo "Rollback available in: $BACKUP_DIR"
    echo "To rollback: helm rollback <release-name> -n <namespace>"
    exit 1
fi

echo -e "${GREEN}✓ Deployment complete${NC}"

# Wait for rollouts
echo ""
echo "⏳ Waiting for rollouts to complete..."

DEPLOYMENTS=(
    "onboarding-api:business-onboarding"
    "document-service:business-documents"
    "webhook-dispatcher:business-webhooks"
)

for deployment in "${DEPLOYMENTS[@]}"; do
    IFS=':' read -r name namespace <<< "$deployment"
    echo "Waiting for $name in $namespace..."
    if ! kubectl rollout status deployment/"$name" -n "$namespace" --timeout=5m; then
        echo -e "${RED}✗ Rollout failed for $name${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ All rollouts completed${NC}"

# Post-deployment checks
echo ""
echo "🧪 Post-deployment checks..."

# Check pod status
echo "Checking pods..."
NOT_RUNNING=$(kubectl get pods -A -l tier=business --no-headers | grep -v "Running" | wc -l)
if [ "$NOT_RUNNING" -gt 0 ]; then
    echo -e "${YELLOW}⚠ $NOT_RUNNING pods not running${NC}"
    kubectl get pods -A -l tier=business | grep -v "Running"
else
    echo -e "${GREEN}✓ All business pods running${NC}"
fi

# Run smoke tests
echo ""
echo "Running smoke tests..."
if [ -f "scripts/smoke-tests.sh" ]; then
    if bash scripts/smoke-tests.sh; then
        echo -e "${GREEN}✓ Smoke tests passed${NC}"
    else
        echo -e "${RED}✗ Smoke tests failed${NC}"
        echo "Deployment completed but tests failed. Investigate immediately."
    fi
else
    echo -e "${YELLOW}⚠ Smoke tests script not found, skipping${NC}"
fi

# Deployment summary
echo ""
echo "📊 Deployment Summary"
echo "===================="
echo "Environment: $ENVIRONMENT"
echo "Backup location: $BACKUP_DIR"
echo "Time: $(date)"
echo ""
echo "Deployed releases:"
helm list -A -l "tier in (platform,business)" --short

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "Next steps:"
echo "1. Monitor Grafana dashboards: https://grafana.yourdomain.tld"
echo "2. Check logs for errors"
echo "3. Verify API functionality"
echo ""
echo "If issues occur, rollback with:"
echo "  cd infra/helm && helmfile --environment $ENVIRONMENT apply --args --force"
echo "  Or restore from backup: $BACKUP_DIR"

