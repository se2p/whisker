#!/usr/bin/env sh

# Make sure we're actually inside a Docker container before proceeding.
if [ ! -f /.dockerenv ]; then
    echo "This script is only supposed to be run within a Docker container."
    echo "You cannot run it as a standalone script."
    exit 1
fi

# The base command for Whisker. We enable headless mode, console and log
# forwarding, and already set the file URL of the Whisker instance.
WHISKER="node servant.js -d -k -l -u ../whisker-web/dist/index.html"

# Check if redirection of stdout and stderr to files are desired, and adjust
# the base command accordingly.
# Finally, run Whisker with the command line arguments passed to this script.
# Make sure to use `exec` here (instead of `eval`). This allows Whisker to 
# receive any Unix signals sent to this wrapper script.
# https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#entrypoint
REDIRECT_OUTPUT="${2}"
if [ "${REDIRECT_OUTPUT}" = "--" ]; then
    OUTPUT_DIR="${1}"
    shift 2
    exec ${WHISKER} "$@" \
        >"${OUTPUT_DIR}/log-out.txt" \
        2>"${OUTPUT_DIR}/log-err.txt"
else
    exec ${WHISKER} "$@"
fi

