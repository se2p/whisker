#!/usr/bin/env sh

# Make sure we're actually inside a Docker container before proceeding.
if [ ! -f /.dockerenv ]; then
    echo "This script is only supposed to be run within a Docker container."
    echo "You cannot run it as a standalone script."
    exit 1
fi

# The base command for Whisker. We enable headless mode, console and log
# forwarding, and already set the file URL of the Whisker instance.
whisker() {
    info
    node servant.js \
        -d \
        -k \
        -l \
        -u ../whisker-web/dist/index.html \
        "$@"
}

info() {
    node_ver=$(node --version)
    . /etc/os-release
    echo "INFO: Running ${node_ver} on ${PRETTY_NAME}" >&2
}

# We support redirection of stdout and stderr to files in a custom directory.
# This directory must be specified as first argument of this script, followed
# by `--`, followed by the arguments intended for Whisker. We first check if
# redirection of stdout and stderr to files is desired, and adjust the `whisker`
# base command accordingly. Finally, we run Whisker with the command line arguments
# passed to this script. Make sure to use `exec` here (instead of `eval`). This
# allows Whisker to receive any Unix signals sent to this wrapper script. See:
# https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#entrypoint
REDIRECT_OUTPUT="${2}"
if [ "${REDIRECT_OUTPUT}" = "--" ]; then
    # Redirection is desired. Script invocation syntax:
    #   ./whisker-docker.sh <output-dir> -- <whisker-args>
    OUTPUT_DIR="${1}"
    shift 2
    exec whisker "$@" \
        >"${OUTPUT_DIR}/log-out.txt" \
        2>"${OUTPUT_DIR}/log-err.txt"
else
    # No redirection. Script invocation syntax:
    #   ./whisker-docker.sh <whisker-args>
    exec whisker "$@"
fi

