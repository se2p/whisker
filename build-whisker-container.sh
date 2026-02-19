#!/usr/bin/env bash

set -euo pipefail

COMMIT=$(git rev-parse --short HEAD)
declare -l BRANCH # Make contents of the variable lowercase
BRANCH=$(git rev-parse --abbrev-ref HEAD)

IMG_TAG="whisker:${BRANCH}-${COMMIT}"

# On Infosun workstations, use a different data root for docker. This avoids cluttering the Linux root partition.
# On other systems, fall back to regular docker and its default data root location.
with_local_data_root() {
    if command -v dockerd-rootless-infosun &>/dev/null; then
        dockerd-rootless-infosun --data-root "/local/${USER}/docker" -- "$@"
    else
        "$@"
    fi
}

echo "🔨 Building Whisker Docker image ${IMG_TAG}"
with_local_data_root docker build . -t "${IMG_TAG}" -f build-for-apptainer.Dockerfile --no-cache

echo "🔄 Converting to Apptainer SIF"
with_local_data_root apptainer build "${IMG_TAG}.sif" "docker-daemon://${IMG_TAG}"

echo "🗑 Removing intermediate Docker image..."
with_local_data_root docker rmi "${IMG_TAG}"

echo "🧹 Cleaning up Docker system..."
with_local_data_root docker system prune -f

echo "✅ Whisker image saved: ${IMG_TAG}.sif"
