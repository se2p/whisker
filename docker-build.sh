#!/usr/bin/env bash

readonly COMMIT=$(git rev-parse --short HEAD)
declare -l BRANCH # Make contents of the variable lowercase
readonly BRANCH=$(git rev-parse --abbrev-ref HEAD)
readonly TAG="whisker-${BRANCH}-${COMMIT}"

function set_docker_cmd() {
    if [[ -z "${DOCKER_CMD}" ]]; then
        if command -v dockerd-rootless-infosun &>/dev/null; then
            DOCKER_CMD="dockerd-rootless-infosun --data-root /local/${USER}/docker -- docker"
        else
            DOCKER_CMD="docker"
        fi
        readonly DOCKER_CMD
    fi
}

function run_docker_cmd() {
    set_docker_cmd
    eval "${DOCKER_CMD}" "$@"
}

function main() {
    echo "Building docker image of Whisker with tag ${TAG}"
    run_docker_cmd image build . -t "${TAG}"

    readonly tar_file="${TAG}.tar.gz"
    echo "Saving image to ${tar_file}"
    run_docker_cmd save "${TAG}" | gzip > "${tar_file}"
}

main
