#!/bin/bash
set -e

# Install Sealed Secrets controller on the K3s cluster
# Requires: kubectl configured to access the cluster (same as Helm)

SEALED_SECRETS_VERSION="2.18.4"
NAMESPACE="kube-system"

echo "Installing Sealed Secrets controller v${SEALED_SECRETS_VERSION}..."

# Install the controller via Helm
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update

helm upgrade --install sealed-secrets sealed-secrets/sealed-secrets \
    --namespace ${NAMESPACE} \
    --version ${SEALED_SECRETS_VERSION} \
    --wait

echo "Sealed Secrets controller installed successfully."
echo ""
echo "Next steps:"
echo "  1. Install kubeseal CLI: brew install kubeseal"
echo "  2. Create your secrets in charts/cd-manager/secrets.yaml (see secrets.example.yaml)"
echo "  3. Run: ./scripts/seal-secrets.sh"
echo "  4. Commit the generated charts/cd-manager/sealed-secret.yaml"
echo "  5. Deploy normally with: ./scripts/deploy-remote-k3s.sh <user> <host>"
