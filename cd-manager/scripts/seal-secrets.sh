#!/bin/bash
set -e

# Seal secrets for the cd-manager Helm chart using Sealed Secrets.
#
# Reads plaintext values from charts/cd-manager/secrets.yaml (gitignored),
# generates a SealedSecret manifest at charts/cd-manager/sealed-secret.yaml (committable).
#
# Prerequisites:
#   - kubeseal CLI installed (brew install kubeseal)
#   - Sealed Secrets controller running in the cluster
#   - kubectl configured to access the cluster

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHART_PATH="${SCRIPT_DIR}/../charts/cd-manager"
SECRETS_FILE="${CHART_PATH}/secrets.yaml"
OUTPUT_FILE="${CHART_PATH}/sealed-secret.yaml"
SECRET_NAME="cd-manager-sealed"
NAMESPACE="default"

# Check prerequisites
if ! command -v kubeseal &>/dev/null; then
    echo "Error: kubeseal not found. Install with: brew install kubeseal"
    exit 1
fi

if [ ! -f "${SECRETS_FILE}" ]; then
    echo "Error: ${SECRETS_FILE} not found."
    echo "Copy secrets.example.yaml to secrets.yaml and fill in your values."
    exit 1
fi

# Extract values from secrets.yaml (Helm values format)
extract_value() {
    local key=$1
    local value
    value=$(grep "^  ${key}:" "${SECRETS_FILE}" | sed 's/^[^:]*: *//' | sed 's/^["'\'']//' | sed 's/["'\'']*$//')
    echo -n "${value}"
}

AUTH_SECRET=$(extract_value "authSecret")
DISCOGS_USER_TOKEN=$(extract_value "discogsUserToken")
GOOGLE_CLIENT_ID=$(extract_value "googleClientId")
GOOGLE_CLIENT_SECRET=$(extract_value "googleClientSecret")
ALLOWED_EMAILS=$(extract_value "allowedEmails")
ALLOWED_PROXY_ORIGINS=$(extract_value "allowedProxyOrigins")
ALLOWED_IMAGE_ORIGINS=$(extract_value "allowedImageOrigins")

if [ -z "${AUTH_SECRET}" ] || [ -z "${GOOGLE_CLIENT_ID}" ]; then
    echo "Error: Could not extract required secrets from ${SECRETS_FILE}."
    echo "Ensure authSecret and googleClientId are set."
    exit 1
fi

echo "Generating SealedSecret from ${SECRETS_FILE}..."

# Create a temporary plain Secret manifest and pipe through kubeseal
cat <<EOF | kubeseal --format yaml --controller-namespace kube-system --controller-name sealed-secrets > "${OUTPUT_FILE}"
apiVersion: v1
kind: Secret
metadata:
  name: ${SECRET_NAME}
  namespace: ${NAMESPACE}
type: Opaque
stringData:
  AUTH_SECRET: "${AUTH_SECRET}"
  DISCOGS_USER_TOKEN: "${DISCOGS_USER_TOKEN}"
  GOOGLE_CLIENT_ID: "${GOOGLE_CLIENT_ID}"
  GOOGLE_CLIENT_SECRET: "${GOOGLE_CLIENT_SECRET}"
  ALLOWED_EMAILS: "${ALLOWED_EMAILS}"
  ALLOWED_PROXY_ORIGINS: "${ALLOWED_PROXY_ORIGINS}"
  ALLOWED_IMAGE_ORIGINS: "${ALLOWED_IMAGE_ORIGINS}"
EOF

echo "SealedSecret written to ${OUTPUT_FILE}"
echo "This file is safe to commit to git."
echo ""
echo "To deploy, run: ./scripts/deploy-remote-k3s.sh <user> <host>"
