#!/usr/bin/env bash

# The Apptainer image is merely a converted docker image: We build the docker
# image first, let it cache by docker-daemon, and then use it as bootstrap agent
# for the Apptainer image.
#
# Note: Whisker's docker image contains its own init shim process. You have to
# disable Apptainer's shim, otherwise there will be warnings printed to the
# terminal [1]:
#
#   apptainer run --pid --no-init whisker.sif
#
# [1] https://apptainer.org/docs/user/1.1/docker_and_oci.html#init-shim-process

source ./docker-build.sh
apptainer build "${TAG}.sif" "docker-daemon:${TAG}"
