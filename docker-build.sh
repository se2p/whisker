#!/usr/bin/env bash

# Clear the following variable if you don't want to use a different storage
# root for podman.
readonly PODMAN_DATA_ROOT="/local/hdd/${USER}/podman"

readonly COMMIT=$(git rev-parse --short HEAD)
declare -l BRANCH # Make contents of the variable lowercase
readonly BRANCH=$(git rev-parse --abbrev-ref HEAD)
readonly TAG="whisker:${BRANCH}-${COMMIT}"
readonly FILENAME="whisker-${BRANCH}-${COMMIT}"

function set_docker_cmd() {
    if command -v podman &>/dev/null; then
        if [[ -n "${PODMAN_DATA_ROOT}" ]]; then
            DOCKER_CMD="podman --root ${PODMAN_DATA_ROOT}"
        else
            DOCKER_CMD="podman"
        fi
    else
        DOCKER_CMD="docker"
    fi
    readonly DOCKER_CMD

    echo "Using \"${DOCKER_CMD}\" to build the docker image of Whisker"
}

function run_docker_cmd() {
    eval "${DOCKER_CMD}" "$@"
}

function main() {
    set_docker_cmd

    echo "Building docker image of Whisker with tag ${TAG}"
    run_docker_cmd image build . -t "${TAG}" -f Dockerfile

    readonly tar_file="${FILENAME}.tar"
    echo "Saving image to ${tar_file}"
    run_docker_cmd save "${TAG}" -o "${tar_file}"
}

main
