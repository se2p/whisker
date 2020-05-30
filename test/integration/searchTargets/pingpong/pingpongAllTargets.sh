SCRATCH_FILE=PingPong.sb3
SCRATCH_PATH="$(cd "$(dirname "$SCRATCH_FILE")"; pwd -P)/$(basename "$SCRATCH_FILE")"

CONFIG_FILE=../default.json
CONFIG_PATH="$(cd "$(dirname "$CONFIG_FILE")"; pwd -P)/$(basename "$CONFIG_FILE")"

cd ../../../../servant
node servant.js -d -g -s $SCRATCH_PATH -c $CONFIG_PATH -k -a 8
