#!/usr/bin/env bash

readonly COMMIT=$(git rev-parse --short HEAD)
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
    "${DOCKER_CMD}" "$@"
}

function main() {
    run_docker_cmd image build . -t "${TAG}"
    run_docker_cmd save "${TAG}" -o "${TAG}".tar
}

main
