#!/bin/bash

# Configuration
CHART_NAME="cd-manager"
CHART_PATH="./charts/cd-manager"
VALUES_FILE="./charts/cd-manager/values.yaml"
SECRETS_FILE="secrets.yaml"

# Check if secrets file exists
if [ -f "$SECRETS_FILE" ]; then
    echo "Deploying with secrets..."
    helm upgrade --install $CHART_NAME $CHART_PATH -f $VALUES_FILE -f $SECRETS_FILE "$@"
else
    echo "Deploying without secrets file (using values.yaml defaults)..."
    helm upgrade --install $CHART_NAME $CHART_PATH -f $VALUES_FILE "$@"
fi

echo ""
echo "Deployment initiated. Check status with:"
echo "kubectl get pods"
