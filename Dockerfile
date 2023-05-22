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

# To make sure we always use the same version of the base image, we specify the
# desired digest of the image instead of a tag. Image tags are dynamic references,
# and might change over time [1]. Tags of Node.JS along with their digests can be
# found here [2]. The digest or tag to use can be overridden on the command line with
# `--build-arg node_version=...`
#
# [1] https://www.ibm.com/docs/en/filenet-p8-platform/5.5.x?topic=deployment-choosing-image-tags-digests
# [2] https://hub.docker.com/_/node?tab=tags
#
# Currently, this digest corresponds to the tag 16.14.0-bullseye-slim:
# https://hub.docker.com/layers/satantime/puppeteer-node/16.14.0-bullseye-slim/images/sha256-bed240a3b8cd99af56a2971046201a26fba978804f55c296bde7f9b1075d19bc?context=explore
ARG version=@sha256:bed240a3b8cd99af56a2971046201a26fba978804f55c296bde7f9b1075d19bc

# (a) We use a slim base image that already includes Node.JS and a minimal set
#     of packages required to run Puppeteer (without packaging Puppeteer
#     itself – we install the right version of Puppeteer later using yarn).
#     We also need "tini".
FROM satantime/puppeteer-node${version} as base
RUN apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y tini \
    && rm -rf /usr/share/icons

# (b) Install packages only required to build Whisker, not to run it.
#     We need git because we have a dependency to another git repository
#     (the Scratch VM).
FROM base as build
RUN apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y git

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

# Signal Node.JS that we are running in a production environment. This leads to some
# differences compared to a development environment [1], such as logging and caching.
# Note: Environment variables set with ENV persist [2] (they are still set when running
# the container from the built image), in contrast to ARG [3] (it does not persist).
#
# [1] https://nodejs.dev/learn/nodejs-the-difference-between-development-and-production
# [2] https://docs.docker.com/engine/reference/builder/#env
# [3] https://docs.docker.com/engine/reference/builder/#arg
ENV NODE_ENV=production

# Copy the build of Whisker from the build layer to the execution layer.
# (devDependencies have already been excluded from the node_modules folder.)
COPY --from=build /whisker-build /whisker

# Workaround for NPEs caused by prettify.js. The file is also deleted when
# executing servant/servant.js but this doesn't work for immutable containers
# (e.g., when using Apptainer).
RUN rm -f /whisker/whisker-web/dist/includes/prettify.js

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

