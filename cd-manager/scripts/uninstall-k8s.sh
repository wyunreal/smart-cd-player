#!/bin/bash

CHART_NAME="cd-manager"

echo "Uninstalling $CHART_NAME..."
helm uninstall $CHART_NAME

echo ""
echo "Uninstallation initiated."
