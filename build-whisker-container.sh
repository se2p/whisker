#!/usr/bin/env bash

set -euo pipefail

COMMIT=$(git rev-parse --short HEAD)
declare -l BRANCH
BRANCH=$(git rev-parse --abbrev-ref HEAD)

IMG_TAG="whisker:${BRANCH}-${COMMIT}"

echo "🔨 Building Whisker Docker image ${IMG_TAG}"
dockerd-rootless-infosun --data-root "/local/${USER}/docker" -- docker build . -t "${IMG_TAG}" -f Dockerfile --no-cache

echo "🔄 Converting to Apptainer SIF"
dockerd-rootless-infosun --data-root "/local/${USER}/docker" -- apptainer build "${IMG_TAG}.sif" "docker-daemon://${IMG_TAG}"

echo "🗑 Removing intermediate Docker image..."
dockerd-rootless-infosun --data-root "/local/${USER}/docker" -- docker rmi "${IMG_TAG}"

echo "🧹 Cleaning up Docker system..."
dockerd-rootless-infosun --data-root "/local/${USER}/docker" -- docker system prune -f

echo "✅ Whisker image saved: ${IMG_TAG}.sif"


