#!/usr/bin/env bash
# One-shot K3s + Platform Bootstrap for Contabo VPS
# Usage: sudo ./bootstrap.sh <domain> <le-email>

set -euo pipefail

DOMAIN="${1:-api.yourdomain.tld}"
LE_EMAIL="${2:-you@example.com}"

echo "🚀 Starting K3s Platform Bootstrap for ${DOMAIN}"
echo "================================================"

# System updates
echo "📦 Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl jq unzip ca-certificates gnupg lsb-release git make htop net-tools

# Kernel & system tuning for Elasticsearch and containers
echo "⚙️  Configuring system parameters..."
sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
swapoff -a || true
sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab || true

# Enable cgroups v2 if needed
echo "📋 Enabling cgroups..."
if ! grep -q "cgroup_enable=cpuset cgroup_enable=memory" /boot/cmdline.txt 2>/dev/null; then
    echo "Cgroups already enabled or not needed on this system"
fi

# Install K3s (server mode, disable Traefik - we use Nginx Ingress)
echo "🎯 Installing K3s server..."
if ! command -v k3s &> /dev/null; then
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --disable=traefik --write-kubeconfig-mode=644" sh -
fi

# Setup kubeconfig
echo "🔧 Configuring kubectl access..."
mkdir -p ~/.kube
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=~/.kube/config
echo "export KUBECONFIG=~/.kube/config" >> ~/.bashrc

# Wait for K3s to be ready
echo "⏳ Waiting for K3s to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

# Install Helm
echo "📦 Installing Helm..."
if ! command -v helm &> /dev/null; then
    curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Install Helmfile
echo "📦 Installing Helmfile..."
if ! command -v helmfile &> /dev/null; then
    HELMFILE_VERSION="0.162.0"
    wget https://github.com/helmfile/helmfile/releases/download/v${HELMFILE_VERSION}/helmfile_${HELMFILE_VERSION}_linux_amd64.tar.gz
    tar -xzf helmfile_${HELMFILE_VERSION}_linux_amd64.tar.gz
    mv helmfile /usr/local/bin/
    chmod +x /usr/local/bin/helmfile
    rm helmfile_${HELMFILE_VERSION}_linux_amd64.tar.gz
fi

# Create namespaces
echo "🏗️  Creating namespaces..."
NAMESPACES=(
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

for ns in "${NAMESPACES[@]}"; do
    kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f -
done

# Add Helm repositories
echo "📚 Adding Helm repositories..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add elastic https://helm.elastic.co
helm repo add minio https://charts.min.io/
helm repo add codecentric https://codecentric.github.io/helm-charts
helm repo update

# Install Ingress-Nginx
echo "🌐 Installing Nginx Ingress Controller..."
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
    -n platform-ingress \
    --set controller.metrics.enabled=true \
    --set controller.metrics.serviceMonitor.enabled=true \
    --set controller.config.use-forwarded-headers="true" \
    --set controller.config.compute-full-forwarded-for="true" \
    --set controller.config.use-proxy-protocol="false" \
    --set controller.config.proxy-body-size="10m" \
    --set controller.config.client-header-timeout="60" \
    --set controller.config.client-body-timeout="60" \
    --set controller.config.enable-brotli="true" \
    --set controller.config.hsts="true" \
    --set controller.config.hsts-max-age="31536000" \
    --set controller.config.hsts-include-subdomains="true" \
    --wait

# Install cert-manager
echo "🔐 Installing cert-manager..."
helm upgrade --install cert-manager jetstack/cert-manager \
    -n platform-security \
    --set installCRDs=true \
    --set prometheus.enabled=true \
    --wait

# Create Let's Encrypt ClusterIssuer
echo "📜 Creating Let's Encrypt ClusterIssuer..."
cat <<YAML | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-http01
spec:
  acme:
    email: ${LE_EMAIL}
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: le-account-key
    solvers:
    - http01:
        ingress:
          class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    email: ${LE_EMAIL}
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: le-staging-account-key
    solvers:
    - http01:
        ingress:
          class: nginx
YAML

# Configure firewall (if UFW is available)
if command -v ufw &> /dev/null; then
    echo "🔥 Configuring firewall..."
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 6443/tcp  # K3s API
    echo "y" | ufw enable || true
fi

# Store domain for later use
echo "${DOMAIN}" > /root/.k3s-domain
echo "${LE_EMAIL}" > /root/.k3s-email

echo ""
echo "✅ Bootstrap Complete!"
echo "================================================"
echo "K3s Server:       Running"
echo "Kubectl:          Configured"
echo "Helm:             Installed"
echo "Helmfile:         Installed"
echo "Ingress:          Nginx (${DOMAIN})"
echo "Cert Manager:     Let's Encrypt"
echo "Namespaces:       Created"
echo ""
echo "Next steps:"
echo "1. Point ${DOMAIN} and *.${DOMAIN} DNS to this server's IP"
echo "2. Clone the repository and navigate to infra/k3s-single-vps/"
echo "3. Run: make up"
echo ""
echo "Kubeconfig: export KUBECONFIG=~/.kube/config"
echo "Check status: kubectl get nodes,pods -A"

