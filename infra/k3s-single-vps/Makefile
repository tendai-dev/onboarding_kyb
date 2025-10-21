.PHONY: help up down status kubeconfig install-platform logs restart clean

KUBECONFIG ?= ~/.kube/config
HELMFILE := helmfile --file ../../infra/helm/helmfile.yaml

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Install/upgrade all platform and application services
	@echo "🚀 Deploying platform and services..."
	@$(HELMFILE) sync
	@echo ""
	@echo "✅ Deployment complete!"
	@$(MAKE) status

down: ## Uninstall all platform and application services
	@echo "🗑️  Removing all services..."
	@$(HELMFILE) destroy
	@echo "✅ All services removed"

status: ## Show cluster and service status
	@echo "📊 Cluster Status"
	@echo "================="
	@kubectl get nodes
	@echo ""
	@echo "📦 Namespaces and Pods"
	@echo "======================"
	@kubectl get pods -A -o wide
	@echo ""
	@echo "🌐 Ingress Routes"
	@echo "================="
	@kubectl get ingress -A
	@echo ""
	@echo "📜 Certificates"
	@echo "==============="
	@kubectl get certificates -A

kubeconfig: ## Display kubeconfig info
	@echo "Kubeconfig: ${KUBECONFIG}"
	@echo ""
	@kubectl config view --minify

install-platform: ## Install only platform services (infra)
	@echo "🏗️  Installing platform services..."
	@$(HELMFILE) sync --selector tier=platform

logs: ## Tail logs from all business services
	@echo "📋 Tailing logs from business services..."
	@kubectl logs -f -l tier=business -n business-onboarding --tail=100

restart: ## Restart all business service deployments
	@echo "🔄 Restarting business services..."
	@kubectl rollout restart deployment -n business-onboarding
	@kubectl rollout restart deployment -n business-documents
	@kubectl rollout restart deployment -n business-risk
	@kubectl rollout restart deployment -n business-notifications
	@kubectl rollout restart deployment -n business-webhooks
	@kubectl rollout restart deployment -n business-readmodel
	@kubectl rollout restart deployment -n business-admin

clean: ## Delete all PVCs and data (DESTRUCTIVE)
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		kubectl delete pvc --all -A; \
		echo "✅ All PVCs deleted"; \
	fi

