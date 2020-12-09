#!/bin/bash

SCRATCH_FILE=KeyDownEventTest.sb3
SCRATCH_PATH="$(cd "$(dirname "$SCRATCH_FILE")"; pwd -P)/$(basename "$SCRATCH_FILE")"

CONFIG_FILE=../../../../config/default.json
CONFIG_PATH="$(cd "$(dirname "$CONFIG_FILE")"; pwd -P)/$(basename "$CONFIG_FILE")"

cd ../../../../servant
node servant.js -d -g -s $SCRATCH_PATH -c $CONFIG_PATH -k
