#!/bin/bash
set -euo pipefail

# Remote side of scripts/process-cluster-images.sh. It runs inside a single
# SSH/TTY session so sudo only has to ask for the password once.
#
# Arguments:
#   1. image reference
#   2. namespace
#   3. job name
#   4. image tarball path (empty when the image was already imported)
#   5. job manifest path
#   6. kubectl command (may contain spaces)
#   7. container runtime command used for the import (may contain spaces)

if [ "$#" -ne 7 ]; then
    echo "Usage: $0 <image> <namespace> <job> <tarball> <manifest> <kubectl-cmd> <ctr-cmd>" >&2
    exit 2
fi

IMAGE="$1"
NAMESPACE="$2"
JOB_NAME="$3"
TARBALL="$4"
MANIFEST="$5"
KUBECTL_CMD="$6"
CTR_CMD="$7"

read -r -a KUBECTL <<< "${KUBECTL_CMD}"
read -r -a CTR <<< "${CTR_CMD}"

cleanup() {
    rm -f "${MANIFEST}" "$0"
    if [ -n "${TARBALL}" ]; then
        rm -f "${TARBALL}"
    fi
}
trap cleanup EXIT

if [ -n "${TARBALL}" ] && [ -f "${TARBALL}" ]; then
    echo "Importing ${IMAGE} into the cluster..."
    "${CTR[@]}" images import "${TARBALL}"
fi

echo "Creating Job ${NAMESPACE}/${JOB_NAME}..."
"${KUBECTL[@]}" apply -f "${MANIFEST}"

echo "Waiting for the Job..."
complete=""
failed=""

for _ in $(seq 1 240); do
    complete="$("${KUBECTL[@]}" -n "${NAMESPACE}" get job "${JOB_NAME}" -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}' 2>/dev/null || true)"
    failed="$("${KUBECTL[@]}" -n "${NAMESPACE}" get job "${JOB_NAME}" -o jsonpath='{.status.conditions[?(@.type=="Failed")].status}' 2>/dev/null || true)"

    if [ "${complete}" = "True" ] || [ "${failed}" = "True" ]; then
        break
    fi

    sleep 5
done

echo "Job logs:"
"${KUBECTL[@]}" -n "${NAMESPACE}" logs "job/${JOB_NAME}" --tail=200 || true

if [ "${complete}" != "True" ]; then
    echo "Job did not complete. Description:"
    "${KUBECTL[@]}" -n "${NAMESPACE}" describe "job/${JOB_NAME}" | tail -40 || true
    exit 1
fi

echo
echo "Done. The JSON report (if generated) is on the PVC under /app/data/reports/."
