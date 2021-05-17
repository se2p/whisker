#! /usr/bin/env sh

if [ ! -f /.dockerenv ]; then
    echo "This script is only supposed to be run within a Docker container!"
    echo "You cannot run it as a standalone script!"
    exit 1
fi

node servant/servant.js -d -k -l \
    -u whisker-web/dist/index.html \
    -c config/default.json \
    "$@"
