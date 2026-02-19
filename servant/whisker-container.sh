#!/usr/bin/env sh

# Make sure we're actually inside a Docker, Apptainer/Singularity, or Podman container before proceeding.
if [ ! -f /.dockerenv ] && [ ! -f /.singularity.d/Singularity ] && [ ! -f /run/.containerenv ]; then
    echo "This script is only supposed to be run within a Docker, Apptainer/Singularity, or Podman container."
    echo "You cannot run it as a standalone script."
    exit 1
fi

print_info() {
    . /etc/os-release
    echo "INFO: Running Node.js $(node --version) on ${PRETTY_NAME}"
}

# The base command for Whisker. We enable headless mode, console and log
# forwarding, and already set the file URL of the Whisker instance.
whisker() {
    print_info >&2

    export WHISKER_CONTAINERIZED=true

    # Make sure to use `exec` here (instead of `eval`). This allows Whisker to receive any
    # Unix signals sent to this wrapper script. See:
    # https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#entrypoint
    exec node /whisker/servant "$@" -d -vv
}

# Make sure llvmpipe is used as software rasterizer. It is faster than softpipe and swiftshader.
# https://wiki.archlinux.org/title/OpenGL#Mesa
# https://docs.mesa3d.org/envvars.html
export MESA_LOADER_DRIVER_OVERRIDE=/usr/lib/x86_64-linux-gnu/dri/swrast
export GALLIUM_DRIVER=llvmpipe

# We support redirection of stdout and stderr to files in a custom directory.
# This directory must be specified as first argument of this script, followed
# by `--`, followed by the arguments intended for Whisker. We first check if
# redirection of stdout and stderr to files is desired, and adjust the `whisker`
# base command accordingly. Finally, we run Whisker with the command line arguments
# passed to this script.
REDIRECT_OUTPUT="${2}"
if [ "${REDIRECT_OUTPUT}" = "--" ]; then
    # Redirection is desired. Script invocation syntax:
    #   whisker-container.sh <output-dir> -- <whisker-args>
    OUTPUT_DIR="${1}"
    shift 2
    whisker "$@" \
        >"${OUTPUT_DIR}/whisker-log-out.txt" \
        2>"${OUTPUT_DIR}/whisker-log-err.txt"
else
    # No redirection. Script invocation syntax:
    #   whisker-container.sh <whisker-args>
    whisker "$@"
fi

