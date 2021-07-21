#!/usr/bin/env sh

# Make sure we're actually inside a Docker container before proceeding.
if [ ! -f /.dockerenv ]; then
    echo "This script is only supposed to be run within a Docker container."
    echo "You cannot run it as a standalone script."
    exit 1
fi

# The base command for Whisker.
WHISKER="node servant/servant.js -d -k -l -u whisker-web/dist/index.html"

# Function that copies the artefacts created by Whisker to the given
# destination directory.
copy_artefacts() {
    destination="$1"
    if [ -f "tests.js" ]; then
        cp "tests.js" "${destination}"
    fi
}

# Check if copying of artefacts to the host and redirection of stdout and stderr
# are desired, and adjust the base command accordingly.
REDIRECT_OUTPUT="${2}"
if [ "${REDIRECT_OUTPUT}" = "--" ]; then
    OUTPUT_DIR="${1}"
    shift 2
    trap 'copy_artefacts' INT TERM HUP QUIT
    WHISKER=">${OUTPUT_DIR}/log-out.txt 2>${OUTPUT_DIR}/log-err.txt ${WHISKER}"
fi

# Run Whisker with the command line arguments passed to this script.
eval "${WHISKER} $*"
