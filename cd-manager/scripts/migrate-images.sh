#!/bin/bash
set -e

NAMESPACE="${1:-default}"
LABEL="app.kubernetes.io/name=cd-manager"

echo "Looking for cd-manager pod in namespace '$NAMESPACE'..."
POD=$(kubectl get pods -n "$NAMESPACE" -l "$LABEL" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$POD" ]; then
  echo "Error: No cd-manager pod found in namespace '$NAMESPACE'"
  exit 1
fi

echo "Found pod: $POD"
echo "Running image migration..."

kubectl exec -n "$NAMESPACE" "$POD" -- curl -s -X POST http://localhost:3000/api/cds/migrate-images

echo ""
echo "Done."
