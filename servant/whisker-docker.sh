#!/usr/bin/env sh

# Make sure we're actually inside a Docker container before proceeding.
if [ ! -f /.dockerenv ]; then
    echo "This script is only supposed to be run within a Docker container."
    echo "You cannot run it as a standalone script."
    exit 1
fi

# The base command for Whisker.
WHISKER="node servant.js -d -k -l -u ../whisker-web/dist/index.html"

# Check if copying of artefacts to the host and redirection of stdout and stderr
# are desired, and adjust the base command accordingly.
REDIRECT_OUTPUT="${2}"
if [ "${REDIRECT_OUTPUT}" = "--" ]; then
    OUTPUT_DIR="${1}"
    shift 2
    exec ${WHISKER} "$@" \
        >"${OUTPUT_DIR}/log-out.txt" \
        2>"${OUTPUT_DIR}/log-err.txt" \
        && [ -f "tests.js" ] && cp "tests.js" "${OUTPUT_DIR}"
else
    exec ${WHISKER} "$@"
fi

# Run Whisker with the command line arguments passed to this script.
# https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#entrypoint
# https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/
# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#handling-kernel-signals
# https://github.com/Yelp/dumb-init
# Make sure to use `exec` here (instead of `eval`) such that the following command becomes the
# container's PID 1. This allows Whisker to receive any Unix signals sent to the Docker container.
# However, Node.js was not designed to run as PID 1. So we need to use an init wrapper that
# forwards all received signals to the Node.js child process. (We use `dumb-init`).

