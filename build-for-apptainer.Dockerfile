#-----------------------------------------------------------------------------------------------------------------------
# ⚠️  THIS DOCKERFILE IS NOT INTENDED FOR PRODUCTION DOCKER USAGE
#
# This file exists solely as an intermediate build artifact for conversion into an Apptainer/Singularity *.sif image.
# It intentionally omits Docker-specific runtime concerns such as:
#   - init systems (e.g., tini)
#   - WORKDIR defaults
#   - signal handling setup
#   - non-root user setup
#
# If you intend to run this as a Docker container, adjustments will be required.
#-----------------------------------------------------------------------------------------------------------------------


# We use a base image that already includes Node.JS and a minimal set of packages required to run Puppeteer (without
# packaging Puppeteer itself – we install the right version of Puppeteer later using yarn). Also install libraries
# required for hardware acceleration.
FROM satantime/puppeteer-node:24.11.0-bullseye-slim as base

RUN : \
    && apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y \
        libegl1 \
        libgl1-mesa-dri \
    && rm -rf /usr/share/icons \
    && :


FROM base as build

RUN : \
    && apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y git \
    && :

WORKDIR /whisker-build/

COPY package.json ./
COPY servant/package.json ./servant/
COPY whisker-web/package.json ./whisker-web/
COPY whisker-main/package.json ./whisker-main/
COPY yarn.lock ./
COPY .puppeteerrc.cjs ./

RUN yarn install

COPY ./ ./

RUN : \
    && yarn build \
    && yarn install --production \
    && :


FROM base as execute

ENV NODE_ENV=production

COPY --from=build /whisker-build /whisker

# Workaround for NPEs caused by prettify.js. The file is also deleted by servant.js but this doesn't work for immutable
# containers (e.g., when using Apptainer).
RUN rm -f /whisker/whisker-web/dist/includes/prettify.js

ENTRYPOINT ["/whisker/servant/whisker-container.sh"]
