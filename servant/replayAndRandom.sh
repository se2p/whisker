# Compares an error witness replay with random input generation
# USAGE replayAndRandom.sh program.sb3 test.js error-witness.json

program="$1"
testFile="$2"
errorWitness="$3"
measurements="$4"

# Exit on STRG+C
trap "exit" INT

replay=0
random=0

for i in `seq 1 $measurements`
do
    echo "Starting iteration $i"
    start=$(date +%s%N)
    node servant.js -s "$program" -t "$testFile" -w "$errorWitness"
    end=$(date +%s%N)
    replay=$((replay + (end - start)/1000000))

    start=$(date +%s%N)
    node servant.js -s "$program" -t "$testFile" -r
    end=$(date +%s%N)

    random=$((random + (end - start)/1000000))
done

echo "Measurements: $measurements"
echo "Replay: $((replay/measurements))"
echo "Random: $((random/measurements))"
