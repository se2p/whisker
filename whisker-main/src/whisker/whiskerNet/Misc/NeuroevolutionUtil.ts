export class NeuroevolutionUtil {

    /**
     * SIGMOID activation function
     * @param x the value to which the SIGMOID function should be applied to
     * @param gain the gain of the SIGMOID function (set to 1 for a standard SIGMOID function)
     */
    public static sigmoid(x: number, gain: number): number {
        return (1 / (1 + Math.exp(gain * -x)));
    }

    /**
     * RELU activation function.
     * @param x the value to which the RELU function should be applied to
     */
    public static relu(x: number): number {
        return Math.max(0, x);
    }

    /**
     * Computes the softmax activation function for the given input.
     * @param x The input to the softmax function.
     * @param nodeValues The node values of the nodes residing in the output layer.
     * @returns The output of the softmax function.
     */
    public static softMax(x: number, nodeValues: number[]): number {
        const max = Math.max(...nodeValues);
        const sum = nodeValues.reduce((acc, val) => acc + Math.exp(val - max), 0);
        return Math.exp(x - max) / sum;
    }

    /**
     * Computes the cosine similarity between two maps.
     * Keys present in one map but not the other are padded as 0.
     * @param map1 the first map to be compared.
     * @param map2 the second map to be compared.
     * @returns the cosine similarity between the two maps.
     */
    public static cosineSimilarityOfMaps(map1: Map<string, number>, map2: Map<string, number>): number {
        const keys = new Set([...map1.keys(), ...map2.keys()]);
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        for (const key of keys) {
            const value1 = map1.get(key) ?? 0;
            const value2 = map2.get(key) ?? 0;

            dotProduct += value1 * value2;
            magnitude1 += value1 * value1;
            magnitude2 += value2 * value2;
        }

        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
    }
}
