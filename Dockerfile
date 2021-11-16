# syntax=docker/dockerfile:1


################################################################################
# Dockerfile to build a headless image of Whisker.
# https://docs.docker.com/language/nodejs/build-images/#create-a-dockerfile-for-nodejs
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/#creating-a-dockerfile
#
# This Dockerfile is organized as a multi-stage build, which enables us to
# reduce the size of the final image while still allowing us to use intermediate
# layers and files without regret.
#
# We have the following stages:
# (1) Build stage:
#     (a) Prepare base image
#     (b) Install or update build/library dependencies (via apt)
#     (c) Install or update build/library dependencies (via yarn)
#     (d) Build Whisker from its sources and dependencies
# (2) Execution stage:
#     Only copy files necessary to run Whisker and set the entry point to
#     Whisker's servant in headless mode
#
# Because an image is built during the final sub-stage (d) of the build stage we
# can minimize the size of image layers by leveraging a build cache. The
# sub-stages are ordered from the less frequently changed (to ensure the build
# cache is not busted) to the more frequently changed.
#
# Note: if you need to modify or debug this Dockerfile, you can build the image
# only up until one of the (sub)stages by specifying "--target <stage name>".
# To inspect the contents of the container at a specific stage, stop building
# at that stage and run the container in interactive mode:
# `docker run -it --entrypoint /bin/sh <image name>`
################################################################################


#-------------------------------------------------------------------------------
# (1) Build Stage
#-------------------------------------------------------------------------------

# (a) We use a slim base image that already includes Node.JS, and install only
#     a minimal set of missing packages required to run Puppeteer. In
#     particular, this includes various shared libraries (*.so files), and
#     the x11-utils package. Puppeteer will complain about missing *.so files.
#     To find out which package provides the missing file, install the apt-file
#     package and run `apt-file find <missing file>`. If in doubt, or if
#     Puppeteer still refuses to run (as is the case when x11-utils is not
#     installed), you can temporarily add Google Chrome to your repsitory as
#     it's done here
#       > https://github.com/buildkite/docker-puppeteer/blob/master/Dockerfile
#     and list all its dependencies via `apt-get show google-chrome-stable`.
#     Then, just copy this list of dependencies and install them below. This
#     will most likely pull in a lot of unwanted packages, too, but at least
#     Puppeteer will work then.
FROM node:lts-buster-slim as base
RUN apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y \
        tini \
        libnss3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libgtk-3-0 \
        libasound2 \
        libxshmfence1 \
        x11-utils \
    && apt-get autoremove -y \
    && rm -rf /usr/share/icons \
    && rm -rf /usr/local/lib/node_modules

# (b) Install packages only required to build Whisker, not to run it.
#     We need git because we have a dependency to another git repository
#     (the Scratch VM), and ca-certificates because otherwise git cannot verfiy
#     the server certificate.
FROM base as build
RUN apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y \
        ca-certificates \
        git

# (c) Copy manifest files and install dependencies. This layer is only rebuilt
#     when a manifest file changes.
#     Unfortunately, we need a separate COPY command for every file because
#     docker flattens the subdirectory structure when using wildcards.
WORKDIR /whisker-build/
COPY package.json ./
COPY scratch-analysis/package.json ./scratch-analysis/
COPY servant/package.json ./servant/
COPY whisker-web/package.json ./whisker-web/
COPY whisker-main/package.json ./whisker-main/
COPY yarn.lock ./
RUN yarn install

# (d) Copy source files (as governed by .dockerignore), build Whisker and drop
#     build dependencies from the node_modules folder, keeping only the ones
#     necessary for execution. This layer is only rebuilt when a source file
#     changes.
COPY ./ ./
RUN yarn build \
    && yarn install --production


#-------------------------------------------------------------------------------
# (2) Execution Stage
#-------------------------------------------------------------------------------

# We use the base image again to drop build dependencies (installed via `apt-get`)
# and the yarn build cache from the final image.
FROM base as execute

# https://nodejs.dev/learn/nodejs-the-difference-between-development-and-production
ENV NODE_ENV=production

# Copy the build of Whisker from the build layer to the execution layer.
# (devDependencies have already been excluded from the node_modules folder.)
COPY --from=build /whisker-build /whisker

# Whisker's servant requires this as working directory, as it uses relative
# and not absolute paths:
WORKDIR /whisker/servant/

# Set the image's main command, allowing the image to be run as though it was
# that command. We use a wrapper script instead of invoking Whisker directly.
# The script makes sure Whisker runs in headless mode, forwards console output,
# etc. It uses the `exec` bash command [1] so that Whisker is not spawned as
# child process of the wrapper script, but instead takes over the current process,
# making it the container's PID 1. This is important as Unix signals (such as
# SIGINT) sent to the container would otherwise not be received by the
# application [2]. Yet, a Node.JS application only responds to signals when
# **NOT** running as PID 1 [3]. Thus, we use a leightweight init system called
# "tini" as entrypoint [4] that spawns Whisker as child process and forwards
# all signals properly.
#
# [1] https://wiki.bash-hackers.org/commands/builtin/exec
# [2] https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#entrypoint
# [3] https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#handling-kernel-signals
# [4] https://github.com/krallin/tini#existing-entrypoint
ENTRYPOINT ["tini", "--", "/whisker/servant/whisker-docker.sh"]

