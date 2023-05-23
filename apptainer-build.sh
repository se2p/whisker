#!/usr/bin/env bash

# The Apptainer image is merely a converted docker image: We build the docker
# image first, let it cache by docker-daemon, and then we will use it as
# bootstrap agent for the Apptainer image.
source ./docker-build.sh

# Load the docker image from the *.tar.gz file. This is unnecessary when using
# docker and does not harm anything. But the workaround is needed when the image
# was built with dockerd-rootless-infosun (a hacked version of docker we use that
# does not need root privileges). It uses its own daemon, and thus the image is
# not known to regular docker, which apptainer uses... (I have no idea how to
# make apptainer contact the daemon of dockerd-rootless-infosun...)
docker load -i "${tar_file}.gz"

# Finally, build the Apptainer image.
#
# Note: Whisker's docker image contains its own init shim process. You have to
# disable Apptainer's shim, otherwise there will be warnings printed to the
# terminal [1]:
#
#   apptainer run --pid --no-init whisker.sif
#
# [1] https://apptainer.org/docs/user/1.1/docker_and_oci.html#init-shim-process
apptainer build "${TAG}.sif" "docker-daemon:${TAG}"
