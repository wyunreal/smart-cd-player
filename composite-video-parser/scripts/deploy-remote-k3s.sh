#!/bin/bash
set -e

# Configuration
IMAGE_NAME="composite-video-parser"
# Bump version (patch)
echo "🆙 Bumping version (patch)..."
# Updates package.json and captures the new version (e.g. v1.0.1)
# --no-git-tag-version prevents creating a git tag/commit for every deploy
NEW_VERSION=$(npm version patch --no-git-tag-version)
# Remove 'v' prefix (v1.0.1 -> 1.0.1)
IMAGE_TAG=${NEW_VERSION#v}
CHART_PATH="./charts/composite-video-parser"

# Usage check
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <REMOTE_USER> <REMOTE_HOST>"
    echo "Example: $0 pi 192.168.1.50"
    exit 1
fi

REMOTE_USER=$1
REMOTE_HOST=$2

echo "🚀 Starting deployment of ${IMAGE_NAME}:${IMAGE_TAG} to ${REMOTE_USER}@${REMOTE_HOST}..."

# Check for Docker permissions
DOCKER_CMD="docker"
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  User not in 'docker' group. Using 'sudo' for docker commands..."
    DOCKER_CMD="sudo docker"
fi

# 1. Build Image
echo "📦 Building Docker image..."
$DOCKER_CMD build -t ${IMAGE_NAME}:${IMAGE_TAG} .

# 2. Save and Compress
echo "💾 Saving and compressing image..."
$DOCKER_CMD save ${IMAGE_NAME}:${IMAGE_TAG} | gzip > ${IMAGE_NAME}.tar.gz

# 3. Transfer to Remote
echo "📤 Copying image to remote host..."
scp ${IMAGE_NAME}.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

# 4. Import into K3s
echo "📥 Importing image into K3s..."
ssh -t ${REMOTE_USER}@${REMOTE_HOST} "sudo k3s ctr images import /tmp/${IMAGE_NAME}.tar.gz && rm /tmp/${IMAGE_NAME}.tar.gz"

# 5. Cleanup Local Artifact
rm ${IMAGE_NAME}.tar.gz

# 6. Deploy with Helm
echo "⚓ Deploying with Helm..."
SHARED_VALUES="$(dirname "$0")/../../shared-services.yaml"
helm upgrade --install ${IMAGE_NAME} ${CHART_PATH} \
    --set image.tag=${IMAGE_TAG} \
    --set image.repository=${IMAGE_NAME} \
    -f ${CHART_PATH}/values.yaml \
    -f ${SHARED_VALUES}

echo "✅ Deployment complete! Version: ${IMAGE_TAG}"
echo "👉 Application should be available at http://${REMOTE_HOST}:30002"
