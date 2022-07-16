# Compares an error witness replay with random input generation
# USAGE replayAndRandom.sh program.sb3 test.js error-witness.json

program="$1"
testFile="$2"
errorWitness="$3"
measurements="$4"

echo "Starting analysis"

# Exit on STRG+C
trap "exit" INT

replay=0
random=0

for i in `seq 1 $measurements`
do
    echo "Starting iteration $i"
    start=$(date +%s%N)
    node servant.js witness -s "$program" -t "$testFile" -w "$errorWitness" -l -o
    end=$(date +%s%N)
    replayDiff=$(((end - start)/1000000))
    replay=$((replay + replayDiff))

    start=$(date +%s%N)
    node servant.js run -s "$program" -t "$testFile" -r -l -o
    end=$(date +%s%N)
    randomDiff=$(((end - start)/1000000))
    random=$((random + randomDiff))

    echo "Iteration $i: Replay '$replayDiff' Random '$randomDiff'"
done

echo "Measurements: $measurements"
echo "Replay: $((replay/measurements))"
echo "Random: $((random/measurements))"
