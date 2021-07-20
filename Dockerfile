# syntax=docker/dockerfile:1


################################################################################
# Dockerfile to build a headless image of Whisker.
#
# This Dockerfile is organized as a multi-stage build, which enables us to
# reduce the size of the final image while still allowing us to use intermediate
# layers and files without regret.
#
# We have the following stages:
# (1) Build stage:
#     (a) Install base image
#     (b) Install or update build/library dependencies
#     (c) Build Whisker from its sources and dependencies
# (2) Execution stage:
#     Only copies files necessary to run Whisker and sets the entry point to
#     Whisker's servant in headless mode. This results in a single-layer image.
#
# Because an image is built during the final sub-stage (c) of the build stage we
# can minimize the size of image layers by leveraging a build cache. The
# sub-stages are ordered from the less frequently changed (to ensure the build
# cache not busted) to the more frequently changed.
#
# Note: if you need to modify or debug this Dockerfile, you can only build the
# image up until one of the (sub)stages by specifying "--target <stage name>".
# To inspect the contents of the container at a specific stage, stop building
# at that stage and run the container in interactive mode:
# `docker run -it --entrypoint /bin/sh <image name>`
################################################################################

#-------------------------------------------------------------------------------
# (1) Build Stage
#-------------------------------------------------------------------------------

# (a) We need an image that has built-in support for Puppeteer. It provides
#     fixes for common issues that prevent Chrome from starting, such as missing
#     system fonts, external libraries, etc. The one we use is based on the
#     Alpine Linux project, which offers a particularly small base image.
FROM buildkite/puppeteer as base

# (b) Copy manifest and lock files required for installing build/library
#     dependencies. The following layers are only re-built when one of these
#     files listed below are updated.
FROM base as install
WORKDIR /whisker-build/
COPY ["package.json", "yarn.lock", "./"]
COPY ["scratch-analysis/package.json", "./scratch-analysis/"]
COPY ["servant/package.json", "./servant/"]
COPY ["whisker-web/package.json", "./whisker-web/"]
COPY ["whisker-main/package.json", "./whisker-main/"]
RUN apt update && apt install -y git && yarn install

# (c) Copy source files and build Whisker. This layer is only rebuilt when a
#     source file changes in the source directory.
FROM install as build
WORKDIR /whisker-build/
COPY ./ ./
RUN yarn build


#-------------------------------------------------------------------------------
# (2) Execution Stage
#-------------------------------------------------------------------------------

FROM buildkite/puppeteer as execute

WORKDIR /whisker/

# Only copy the artifacts needed to run Whisker from the build stage to the
# execution stage.
COPY --from=build /whisker-build/config            ./config
COPY --from=build /whisker-build/node_modules      ./node_modules
COPY --from=build /whisker-build/scratch-analysis  ./scratch-analysis
COPY --from=build /whisker-build/servant           ./servant
COPY --from=build /whisker-build/whisker-web       ./whisker-web
COPY --from=build /whisker-build/whisker-main      ./whisker-main
COPY --from=build /whisker-build/whisker-docker.sh ./whisker-docker.sh

# Set the image's main command, allowing the image to be run as though it was
# that command:
ENTRYPOINT ["/whisker/whisker-docker.sh"]

# Set the default arguments for Whisker's servant, if none are specified
# explicitly by the user:
CMD ["--help"]
