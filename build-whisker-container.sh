#!/usr/bin/env bash

set -euo pipefail

COMMIT=$(git rev-parse --short HEAD)
readonly COMMIT

declare -l BRANCH # Make contents of the variable lowercase
BRANCH=$(git rev-parse --abbrev-ref HEAD)
readonly BRANCH

readonly IMG_TAG="whisker:${BRANCH}-${COMMIT}"
readonly TAR_FILE="${IMG_TAG}.tar"

echo "🔨 Building Whisker Apptainer image of commit ${COMMIT} in branch ${BRANCH}"

echo "🔨 Build docker image."
dockerd-rootless-infosun --data-root "/local/${USER}/docker" -- docker build . -t "${IMG_TAG}" -f Dockerfile --no-cache

echo "✍️ Save image as Tarball."
dockerd-rootless-infosun --data-root "/local/${USER}/docker" -- docker save "${IMG_TAG}" -o "${TAR_FILE}"

echo "🗑 Removing intermediate image..."
dockerd-rootless-infosun --data-root "/local/${USER}/docker" -- docker rmi "${IMG_TAG}"

echo "🧹 Cleaning up Docker system..."
dockerd-rootless-infosun --data-root "/local/${USER}/docker" -- docker system prune -f

echo "🔄 Converting OCI image to Apptainer format"
apptainer build "${TAR_FILE//.tar/.sif}" "docker-archive://$TAR_FILE"

echo "✅ Whisker image saved: ${TAR_FILE}"


