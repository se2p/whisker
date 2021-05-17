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
#     (c) Copy Whisker source files to the container
#     (d) Build Whisker from its sources and dependencies
# (2) Execution stage:
#     Only copies files necessary to run Whisker and sets the entry point to
#     Whisker's servant. This results in a single-layer image.
# (3) Headless stage
#     Set the default command line parameters for Whisker's servant so that we
#     run in headless mode
#
# Because an image is built during the final sub-stage (d) of the build stage we
# can minimize the size of image layers by leveraging a build cache. The
# sub-stages are ordered from the less frequently changed (to ensure the build
# cache not busted) to the more frequently changed.
#
# Note: if you need to modify or debug this Dockerfile, you can only build the
# image up until one of the (sub)stages by specifying "--target <stage name>".
# To inspect the contents of the container at a specific stage, stop building
# at that stage and run the container in interactive mode:
# `docker run -it <image name> /bin/sh`
################################################################################

#-------------------------------------------------------------------------------
# (1) Build Stage
#-------------------------------------------------------------------------------

# (a) We need an image that has built-in support for Puppeteer. It provides 
#     fixes for common issues that prevent Chrome from starting, such as missing
#     system fonts, external libraries, etc. The one we use is based on the
#     Alpine Linux project, which offers a particularly small base image.
FROM zenika/alpine-chrome:with-puppeteer as base

# (b) Copy manifest and lock files required for installing build/library
#     dependencies. The following layers are only re-built when one of these
#     files listed below are updated.
FROM base as deps
COPY ["package.json", "yarn.lock", "/whisker-build/"]
COPY ["scratch-analysis/package.json", "/whisker-build/scratch-analysis/"]
COPY ["whisker-web/package.json", "/whisker-build/whisker-web/"]
COPY ["whisker-main/package.json", "/whisker-build/whisker-main/"]
WORKDIR /whisker-build/

# (c) Copy source files.
#     This layer is rebuilt when a source file changes in the source directory.
FROM deps as src
COPY ./ ./

# (d) Build Whisker.
FROM src as build
RUN yarn install && yarn build


#-------------------------------------------------------------------------------
# (2) Execution Stage
#-------------------------------------------------------------------------------

FROM zenika/alpine-chrome:with-puppeteer as execute

WORKDIR /whisker/

# Only copy the artifacts needed to run Whisker from the build stage to the
# execution stage.
COPY --from=build /whisker-build/config           ./config
COPY --from=build /whisker-build/node_modules     ./node_modules
COPY --from=build /whisker-build/scratch-analysis ./scratch-analysis
COPY --from=build /whisker-build/servant          ./servant
COPY --from=build /whisker-build/whisker-web      ./whisker-web
COPY --from=build /whisker-build/whisker-main     ./whisker-main

# Set the image's main command, allowing the image to be run as though it was
# that command:
ENTRYPOINT ["node", "/whisker/servant/servant.js", "--isHeadless"]

# Set the default arguments for Whisker's servant, if none are specified
# explicitly by the user:
CMD ["--help"]

