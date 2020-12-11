SCRATCH_FILE=ClickInOrder.sb3
SCRATCH_PATH="$(cd "$(dirname "$SCRATCH_FILE")"; pwd -P)/$(basename "$SCRATCH_FILE")"

CONFIG_FILE=../default_say.json
CONFIG_PATH="$(cd "$(dirname "$CONFIG_FILE")"; pwd -P)/$(basename "$CONFIG_FILE")"

cd ../../../../servant
node servant.js -d -g -s $SCRATCH_PATH -c $CONFIG_PATH -k
