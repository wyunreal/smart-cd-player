#!/bin/bash
set -euo pipefail

# Runs the image processing CLI as a one-off Kubernetes Job against the real
# data PVC. The raw images and the collection JSON are never modified.
#
# Usage:
#   ./scripts/process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> [options...]
#
# Examples:
#   ./scripts/process-cluster-images.sh pi 192.168.1.50
#   ./scripts/process-cluster-images.sh pi 192.168.1.50 --only=cd --limit=20
#   ./scripts/process-cluster-images.sh pi 192.168.1.50 --write
#   ./scripts/process-cluster-images.sh pi 192.168.1.50 --revert --write
#
# Environment overrides:
#   NAMESPACE         Kubernetes namespace (default: default)
#   PVC_NAME          Data PVC name (default: cd-manager)
#   IMAGE_REPOSITORY  Tools image repository (default: cd-manager-tools)
#   IMAGE_TAG         Tools image tag (default: imgproc-<timestamp>)
#   PLATFORM          Build platform (default: linux/amd64)
#   KUBECTL_CMD       Remote kubectl command (default: sudo k3s kubectl)
#   CTR_CMD           Remote containerd command (default: sudo k3s ctr)
#   SKIP_BUILD=1      Reuse an already imported IMAGE_TAG
#   JOB_NAME          Override the generated Job name

usage() {
    cat <<'EOF'
Usage: process-cluster-images.sh <REMOTE_USER> <REMOTE_HOST> [images:process options...]

Builds the tools image, imports it into k3s and runs a Job that mounts the
data PVC at /app/data. Every argument after the host is passed to the CLI.

Examples:
  ... pi 192.168.1.50                         # dry-run over the whole collection
  ... pi 192.168.1.50 --only=cd --limit=20    # preview CD crops
  ... pi 192.168.1.50 --write                 # apply
  ... pi 192.168.1.50 --revert --write        # remove processed-v* files
EOF
}

if [ "$#" -lt 2 ]; then
    usage
    exit 1
fi

REMOTE_USER="$1"
REMOTE_HOST="$2"
shift 2
CLI_ARGS=("$@")

NAMESPACE="${NAMESPACE:-default}"
PVC_NAME="${PVC_NAME:-cd-manager}"
IMAGE_REPOSITORY="${IMAGE_REPOSITORY:-cd-manager-tools}"
IMAGE_TAG="${IMAGE_TAG:-imgproc-$(date +%Y%m%d%H%M%S)}"
PLATFORM="${PLATFORM:-linux/amd64}"
KUBECTL_CMD="${KUBECTL_CMD:-sudo k3s kubectl}"
CTR_CMD="${CTR_CMD:-sudo k3s ctr}"
JOB_NAME="${JOB_NAME:-cd-manager-images-${IMAGE_TAG}}"
REMOTE_TARGET="${REMOTE_USER}@${REMOTE_HOST}"

if ! docker info >/dev/null 2>&1; then
    echo "Docker is not accessible for the current user; retrying with 'sg docker'..."
    exec sg docker -c "$(printf '%q ' "$0" "$REMOTE_USER" "$REMOTE_HOST" ${CLI_ARGS[@]+"${CLI_ARGS[@]}"})"
fi

local_tarball=""
remote_tarball=""
remote_manifest=""
remote_runner=""

cleanup() {
    rm -f "${manifest:-}" "${runner:-}"
    if [ -n "${local_tarball}" ]; then
        rm -f "${local_tarball}"
    fi
}
trap cleanup EXIT

if [ "${SKIP_BUILD:-0}" != "1" ]; then
    echo "Building ${IMAGE_REPOSITORY}:${IMAGE_TAG} (target: tools, platform: ${PLATFORM})..."
    docker build --target tools --platform "${PLATFORM}" -t "${IMAGE_REPOSITORY}:${IMAGE_TAG}" .

    local_tarball="${TMPDIR:-/tmp}/$(echo "${IMAGE_REPOSITORY}-${IMAGE_TAG}" | tr '/:' '__').tar.gz"
    remote_tarball="/tmp/$(basename "${local_tarball}")"

    echo "Transferring image to ${REMOTE_TARGET}..."
    docker save "${IMAGE_REPOSITORY}:${IMAGE_TAG}" | gzip > "${local_tarball}"
    scp "${local_tarball}" "${REMOTE_TARGET}:${remote_tarball}"
    rm -f "${local_tarball}"
    local_tarball=""
else
    echo "SKIP_BUILD=1: using ${IMAGE_REPOSITORY}:${IMAGE_TAG}"
fi

manifest="$(mktemp "${TMPDIR:-/tmp}/cd-manager-images-job.XXXXXX.yaml")"
runner="$(mktemp "${TMPDIR:-/tmp}/cd-manager-images-runner.XXXXXX.sh")"
remote_manifest="/tmp/$(basename "${manifest}")"
remote_runner="/tmp/$(basename "${runner}")"

args_json="$(node -e 'console.log(JSON.stringify(process.argv.slice(1)))' -- ${CLI_ARGS[@]+"${CLI_ARGS[@]}"})"

cat > "${manifest}" <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: ${JOB_NAME}
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: cd-manager
    app.kubernetes.io/component: image-processing
spec:
  backoffLimit: 0
  ttlSecondsAfterFinished: 604800
  template:
    metadata:
      labels:
        app.kubernetes.io/name: cd-manager
        app.kubernetes.io/component: image-processing
    spec:
      restartPolicy: Never
      securityContext:
        runAsUser: 1001
        runAsGroup: 1001
        runAsNonRoot: true
      containers:
        - name: image-processing
          image: ${IMAGE_REPOSITORY}:${IMAGE_TAG}
          imagePullPolicy: IfNotPresent
          args: ${args_json}
          env:
            - name: DATA_DIR
              value: /app/data
            - name: IMAGES_DIR
              value: /app/data/images
          volumeMounts:
            - name: data
              mountPath: /app/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: ${PVC_NAME}
EOF

cp "$(dirname "$0")/image-processing-job.sh" "${runner}"
chmod +x "${runner}"

scp "${manifest}" "${runner}" "${REMOTE_TARGET}:/tmp/"

echo "Starting the remote Job session (sudo may ask for the password once)..."
ssh -t "${REMOTE_TARGET}" "$(printf 'bash %q %q %q %q %q %q %q %q' \
    "${remote_runner}" \
    "${IMAGE_REPOSITORY}:${IMAGE_TAG}" \
    "${NAMESPACE}" \
    "${JOB_NAME}" \
    "${remote_tarball}" \
    "${remote_manifest}" \
    "${KUBECTL_CMD}" \
    "${CTR_CMD}")"
