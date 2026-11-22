#!/bin/bash
set -euo pipefail

# Configuration
IMAGE_NAME="cd-manager"
CHART_PATH="./charts/cd-manager"

usage() {
    echo "Usage: $0 [--prune] <REMOTE_USER> <REMOTE_HOST>"
    echo "Example: $0 pi 192.168.1.50"
    echo "         $0 --prune pi 192.168.1.50"
    echo ""
    echo "--prune  After a successful rollout, remove old ${IMAGE_NAME} image tags,"
    echo "         keeping the current and previous versions."
}

PRUNE_OLD_IMAGES=0
POSITIONAL=()
for arg in "$@"; do
    case "${arg}" in
        --prune) PRUNE_OLD_IMAGES=1 ;;
        -h|--help) usage; exit 0 ;;
        --*) echo "Error: unknown option: ${arg}" >&2; usage; exit 1 ;;
        *) POSITIONAL+=("${arg}") ;;
    esac
done

if [ "${#POSITIONAL[@]}" -ne 2 ]; then
    usage
    exit 1
fi

REMOTE_USER="${POSITIONAL[0]}"
REMOTE_HOST="${POSITIONAL[1]}"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"

# Ensure the docker group is available without requiring logout/login. Do this
# before bumping the version so a re-exec does not bump it twice.
if ! docker info &>/dev/null; then
    exec sg docker -c "$(printf '%q ' "$0" "$@")"
fi

# Bump version (patch)
echo "🆙 Bumping version (patch)..."
# Updates package.json and captures the new version (e.g. v0.1.5)
# --no-git-tag-version prevents creating a git tag/commit for every deploy
NEW_VERSION=$(npm version patch --no-git-tag-version)
# Remove 'v' prefix (v0.1.5 -> 0.1.5)
IMAGE_TAG=${NEW_VERSION#v}

echo "🚀 Starting deployment of ${IMAGE_NAME}:${IMAGE_TAG} to ${REMOTE}..."

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
scp ${IMAGE_NAME}.tar.gz ${REMOTE}:/tmp/

# 4. Import into K3s
echo "📥 Importing image into K3s..."
ssh -t ${REMOTE} "sudo k3s ctr images import /tmp/${IMAGE_NAME}.tar.gz && rm /tmp/${IMAGE_NAME}.tar.gz"

# 5. Cleanup Local Artifact
rm ${IMAGE_NAME}.tar.gz

# 6. Deploy with Helm
echo "⚓ Deploying with Helm..."
# We explicitly set image.tag to force K8s to pick up the new version
# We also set image.pullPolicy to IfNotPresent (default) because each tag is unique
SHARED_VALUES="$(dirname "$0")/../../shared-services.yaml"
SEALED_SECRET_FILE="${CHART_PATH}/sealed-secret.yaml"

# Remember the image that is currently running before the upgrade. --prune
# keeps it so a rollback to the previous version does not need a re-import.
DEPLOYMENT_NAME="$(kubectl get deployment \
    -l "app.kubernetes.io/instance=${IMAGE_NAME}" \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
DEPLOYMENT_NAME="${DEPLOYMENT_NAME:-${IMAGE_NAME}}"
PREVIOUS_IMAGE_TAG="$(kubectl get deployment "${DEPLOYMENT_NAME}" \
    -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null \
    | awk -F: 'NF {print $NF}' || true)"

if [ -f "${SEALED_SECRET_FILE}" ]; then
    # Sealed Secrets mode: apply the SealedSecret and reference it as existingSecret
    echo "🔒 Using Sealed Secrets (${SEALED_SECRET_FILE})..."
    kubectl apply -f "${SEALED_SECRET_FILE}"
    helm upgrade --install ${IMAGE_NAME} ${CHART_PATH} \
        --set image.tag=${IMAGE_TAG} \
        --set image.repository=${IMAGE_NAME} \
        --set secrets.existingSecret=cd-manager-sealed \
        -f ${CHART_PATH}/values.yaml \
        -f ${SHARED_VALUES}
elif [ -f "${CHART_PATH}/secrets.yaml" ]; then
    # Legacy mode: pass plaintext secrets via Helm values (gitignored file)
    echo "⚠️  Using plaintext secrets.yaml (consider migrating to Sealed Secrets)"
    helm upgrade --install ${IMAGE_NAME} ${CHART_PATH} \
        --set image.tag=${IMAGE_TAG} \
        --set image.repository=${IMAGE_NAME} \
        -f ${CHART_PATH}/values.yaml \
        -f ${SHARED_VALUES} \
        -f ${CHART_PATH}/secrets.yaml
else
    echo "❌ No secrets found. Provide one of:"
    echo "   - ${SEALED_SECRET_FILE} (recommended: run ./scripts/seal-secrets.sh)"
    echo "   - ${CHART_PATH}/secrets.yaml (legacy: copy from secrets.example.yaml)"
    exit 1
fi

if [ "${PRUNE_OLD_IMAGES}" = "1" ]; then
    echo ""
    echo "⏳ Waiting for the rollout before pruning old images..."
    kubectl rollout status deployment/"${DEPLOYMENT_NAME}" --timeout=300s

    if [ -n "${PREVIOUS_IMAGE_TAG}" ]; then
        echo "🧹 Pruning old ${IMAGE_NAME} images (keeping ${IMAGE_TAG} and ${PREVIOUS_IMAGE_TAG})..."
    else
        echo "🧹 Pruning old ${IMAGE_NAME} images (keeping ${IMAGE_TAG})..."
    fi

    # Pass the prune script as a base64 argument so ssh keeps the local
    # terminal as stdin. A heredoc would make `ssh -t` skip the pty and sudo
    # would be unable to prompt for a password.
    REMOTE_SCRIPT_B64="$(
        base64 <<'REMOTE_SCRIPT' | tr -d '\n'
set -euo pipefail
image="$1"
keep_current="$2"
keep_previous="${3:-}"
refs="$(k3s ctr images ls -q | grep -E "^(docker\.io/library/)?${image}:" || true)"
while IFS= read -r ref; do
    [ -n "${ref}" ] || continue
    tag="${ref##*:}"
    if [ "${tag}" = "${keep_current}" ] || { [ -n "${keep_previous}" ] && [ "${tag}" = "${keep_previous}" ]; }; then
        continue
    fi
    if k3s ctr images rm "${ref}"; then
        echo "Removed ${ref}"
    else
        echo "Warning: could not remove ${ref}" >&2
    fi
done <<< "${refs}"
echo "Remaining ${image} images:"
k3s ctr images ls -q | grep -E "^(docker\.io/library/)?${image}:" || true
REMOTE_SCRIPT
    )"

    ssh -t "${REMOTE}" \
        "echo '${REMOTE_SCRIPT_B64}' | base64 -d | sudo bash -s -- '${IMAGE_NAME}' '${IMAGE_TAG}' '${PREVIOUS_IMAGE_TAG}'"
fi

echo "✅ Deployment complete! Version: ${IMAGE_TAG}"
echo "👉 Application should be available at http://${REMOTE_HOST}:30000"
