#! /usr/bin/env sh

# Make sure we're actually inside a Docker container before proceeding.
if [ ! -f /.dockerenv ]; then
    echo "This script is only supposed to be run within a Docker container."
    echo "You cannot run it as a standalone script."
    exit 1
fi

# The base command for Whisker.
WHISKER="node servant/servant.js -d -k -l -u whisker-web/dist/index.html"

# Check if redirection of stdout and stderr is desired, and adjust the
# base command accordingly.
REDIRECT_OUTPUT="${2}"
if [ "${REDIRECT_OUTPUT}" = "--" ]; then
    OUTPUT_DIR="${1}"
    shift 2
    WHISKER=">${OUTPUT_DIR}/log-out.txt 2>${OUTPUT_DIR}/log-err.txt ${WHISKER}"
fi

# Run Whisker with the command line arguments passed to this script.
eval "${WHISKER} $*"
