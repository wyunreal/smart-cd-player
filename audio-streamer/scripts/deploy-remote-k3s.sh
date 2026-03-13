#!/bin/bash
set -e

# Configuration
IMAGE_NAME="audio-streamer"
# Bump version (patch)
echo "🆙 Bumping version (patch)..."
NEW_VERSION=$(npm version patch --no-git-tag-version)
IMAGE_TAG=${NEW_VERSION#v}
CHART_PATH="./charts/audio-streamer"

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

# 1. Build Image
echo "📦 Building Docker image..."
$DOCKER_CMD build --no-cache --platform linux/amd64 -t ${IMAGE_NAME}:${IMAGE_TAG} .

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
echo "👉 Audio player available at http://${REMOTE_HOST}:30003"
echo ""
echo "⚠️  Make sure ANNOUNCED_IP in values.yaml (or secrets.yaml) is set to ${REMOTE_HOST}"
echo "⚠️  Make sure UDP ports 20000-20100 are open in the host firewall"
