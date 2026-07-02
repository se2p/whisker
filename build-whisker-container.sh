#!/usr/bin/env bash

set -euo pipefail

COMMIT=$(git rev-parse --short HEAD)
declare -l BRANCH # Make contents of the variable lowercase
BRANCH=$(git rev-parse --abbrev-ref HEAD)
linked_dockerfile=0

IMG_TAG="whisker:${BRANCH}-${COMMIT}"

# Infosun-specific buildkitd socket location
systemctl --user start buildkitd.socket
export BUILDKIT_HOST="unix:///run/user/$(id -u)/buildkit/buildkitd.sock"
export APPTAINER_TMPDIR="/local/${USER}/apptainer/tmp"
export APPTAINER_CACHEDIR="/local/${USER}/apptainer/cache"

mkdir -p "${APPTAINER_TMPDIR}" "${APPTAINER_CACHEDIR}"

if [ ! -f Dockerfile ]; then
    # needs to be called Dockerfile for buildkit
    ln -s build-for-apptainer.Dockerfile Dockerfile
    linked_dockerfile=1
fi

echo "🔄 Building Apptainer SIF"
apptainer build "${IMG_TAG}.sif" "buildkit://."

echo "🧹 Cleaning up..."
buildctl prune

if [ "${linked_dockerfile}" -eq 1 ]; then
    unlink Dockerfile
fi

echo "✅ Whisker image saved: ${IMG_TAG}.sif"
