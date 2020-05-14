#!/bin/bash

SCRATCH_FILE=SpriteClickTest.sb3
SCRATCH_PATH="$(cd "$(dirname "$SCRATCH_FILE")"; pwd -P)/$(basename "$SCRATCH_FILE")"
echo $SCRATCH_PATH

cd ../../../servant
node servant.js -d -g -s $SCRATCH_PATH -c ../../whisker-main/config/default.json -k
