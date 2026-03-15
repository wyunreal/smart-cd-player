#!/bin/bash
set -e

# Configuration
IMAGE_NAME="cd-manager"
# Bump version (patch)
echo "🆙 Bumping version (patch)..."
# Updates package.json and captures the new version (e.g. v0.1.5)
# --no-git-tag-version prevents creating a git tag/commit for every deploy
NEW_VERSION=$(npm version patch --no-git-tag-version)
# Remove 'v' prefix (v0.1.5 -> 0.1.5)
IMAGE_TAG=${NEW_VERSION#v}
CHART_PATH="./charts/cd-manager"

# Usage check
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <REMOTE_USER> <REMOTE_HOST>"
    echo "Example: $0 pi 192.168.1.50"
    exit 1
fi

REMOTE_USER=$1
REMOTE_HOST=$2

echo "🚀 Starting deployment of ${IMAGE_NAME}:${IMAGE_TAG} to ${REMOTE_USER}@${REMOTE_HOST}..."

# Ensure docker group is available without requiring logout/login
if ! docker info &>/dev/null; then
    exec sg docker -c "$0 $1 $2"
fi

DOCKER_CMD="docker"

# 1. Ensure BuildKit is up to date to avoid stale CA certificate issues
echo "🔧 Refreshing BuildKit builder..."
docker pull moby/buildkit:buildx-stable-1
docker buildx rm desktop-linux 2>/dev/null || true
docker buildx create --name desktop-linux --use --bootstrap

# 2. Build Image
echo "📦 Building Docker image..."
$DOCKER_CMD build --no-cache --load --platform linux/amd64 -t ${IMAGE_NAME}:${IMAGE_TAG} .

# 2. Save and Compress
echo "💾 Saving and compressing image..."
$DOCKER_CMD save ${IMAGE_NAME}:${IMAGE_TAG} | gzip > ${IMAGE_NAME}.tar.gz

# 3. Transfer to Remote
echo "Cc Copying image to remote host..."
scp ${IMAGE_NAME}.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

# 4. Import into K3s
echo "📥 Importing image into K3s..."
ssh -t ${REMOTE_USER}@${REMOTE_HOST} "sudo k3s ctr images import /tmp/${IMAGE_NAME}.tar.gz && rm /tmp/${IMAGE_NAME}.tar.gz"

# 5. Cleanup Local Artifact
rm ${IMAGE_NAME}.tar.gz

# 6. Deploy with Helm
echo "⚓ Deploying with Helm..."
# We explicitly set image.tag to force K8s to pick up the new version
# We also set image.pullPolicy to IfNotPresent (default) because each tag is unique
SHARED_VALUES="$(dirname "$0")/../../shared-services.yaml"
helm upgrade --install ${IMAGE_NAME} ${CHART_PATH} \
    --set image.tag=${IMAGE_TAG} \
    --set image.repository=${IMAGE_NAME} \
    -f ${CHART_PATH}/values.yaml \
    -f ${SHARED_VALUES} \
    -f ${CHART_PATH}/secrets.yaml

echo "✅ Deployment complete! Version: ${IMAGE_TAG}"
echo "👉 Application should be available at http://${REMOTE_HOST}:30000"
